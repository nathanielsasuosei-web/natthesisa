import { randomUUID } from "node:crypto";
import { BillingCycle, PlanId, cycleDays } from "./plans";
import { getCourse } from "./courses";
import { findContentLesson } from "./course-content";
import { hashPassword, verifyPasswordHash } from "./passwords";
import { ensureSchema, query, queryOne } from "./db";
import type { UserRow } from "./schema";

/**
 * Learner accounts, stored in PostgreSQL.
 *
 * Every account is a row in `users` (see `src/lib/schema.ts`). The learning
 * record that belongs to an account — subscription, weekly usage, course
 * progress, invoices, activity and profile — is kept alongside it so a page
 * needs one row instead of a join per section. Mutating functions change the
 * in-memory object; call `saveUser()` before the request finishes.
 */

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  description: string;
  status: "paid";
  reference: string;
}

export interface ActivityEvent {
  id: string;
  ts: string;
  text: string;
  type: "learning" | "billing" | "account" | "admin";
}

export interface DayUsage {
  date: string;
  count: number;
}

export interface Subscription {
  planId: PlanId;
  cycle: BillingCycle;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: PlanId | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface LearningUsage {
  periodStart: string;
  minutes: number;
  history: DayUsage[];
  /**
   * Lessons whose duration has already been added to `minutes` and
   * `lifetimeMinutes`. A lesson contributes its time once: unmarking it and
   * marking it complete again must not count the same lesson twice, which is
   * what made "learning time" and the weekly goal drift upwards. Optional so
   * records written before this field existed still load.
   */
  creditedLessonIds?: string[];
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  provider: "demo";
}

export interface CourseProgress {
  courseId: string;
  completedLessonIds: string[];
  startedAt: string;
  lastAccessedAt: string;
}

export interface LearnerProfile {
  headline: string;
  track: "Web developer" | "App developer" | "Computer science" | "Full-stack developer";
  experience: "Just starting" | "Some experience" | "Building professionally";
  weeklyGoal: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  role: "member" | "admin";
  /** True for the single site owner - the only account that can publish lessons. */
  owner: boolean;
  suspended: boolean;
  subscription: Subscription;
  usage: LearningUsage;
  lifetimeMinutes: number;
  progress: Record<string, CourseProgress>;
  invoices: Invoice[];
  activityLog: ActivityEvent[];
  paymentMethod: PaymentMethod;
  profile: LearnerProfile;
}

export function uid(): string {
  return randomUUID();
}

export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(from: Date | number | string, days: number): Date {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function freshUsage(values: number[] = []): LearningUsage {
  const history: DayUsage[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const index = 6 - offset;
    history.push({ date: todayKey(addDays(new Date(), -offset)), count: values[index] ?? 0 });
  }
  return {
    periodStart: new Date().toISOString(),
    minutes: values.reduce((sum, value) => sum + value, 0),
    history,
    creditedLessonIds: [],
  };
}

export function makeSubscription(planId: PlanId, cycle: BillingCycle): Subscription {
  const now = new Date();
  return {
    planId,
    cycle,
    cancelAtPeriodEnd: false,
    pendingPlanId: null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: addDays(now, cycleDays(cycle)).toISOString(),
  };
}

function defaultProfile(overrides: Partial<LearnerProfile> = {}): LearnerProfile {
  const profile: LearnerProfile = {
    headline: "Learning one project at a time.",
    track: "Full-stack developer",
    experience: "Just starting",
    weeklyGoal: 180,
  };
  // `{ ...defaults, track: undefined }` would blank the default, so only
  // defined values are applied.
  if (overrides.headline !== undefined) profile.headline = overrides.headline;
  if (overrides.track !== undefined) profile.track = overrides.track;
  if (overrides.experience !== undefined) profile.experience = overrides.experience;
  if (overrides.weeklyGoal !== undefined) profile.weeklyGoal = overrides.weeklyGoal;
  return profile;
}

export function verifyPassword(user: User, password: string): boolean {
  return verifyPasswordHash(user.passwordHash, password).ok;
}

/** True when this account's stored hash should be upgraded on next sign-in. */
export function passwordNeedsRehash(user: User, password: string): boolean {
  return verifyPasswordHash(user.passwordHash, password).needsRehash;
}

export function setPassword(user: User, password: string): void {
  user.passwordHash = hashPassword(password);
}

/* -------------------------------------------------------------------------- */
/* Row mapping                                                                */
/* -------------------------------------------------------------------------- */

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function fromRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: iso(row.created_at),
    role: row.role === "admin" ? "admin" : "member",
    owner: row.owner,
    suspended: row.suspended,
    subscription: row.subscription as Subscription,
    usage: row.usage as LearningUsage,
    lifetimeMinutes: row.lifetime_minutes,
    progress: (row.progress ?? {}) as Record<string, CourseProgress>,
    invoices: (row.invoices ?? []) as Invoice[],
    activityLog: (row.activity_log ?? []) as ActivityEvent[],
    paymentMethod: row.payment_method as PaymentMethod,
    profile: { ...defaultProfile(), ...((row.profile ?? {}) as Partial<LearnerProfile>) },
  };
}

const COLUMNS =
  "id, email, name, password_hash, role, owner, suspended, subscription, usage, lifetime_minutes, progress, invoices, activity_log, payment_method, profile, created_at";

function json(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function listUsers(): Promise<User[]> {
  await ensureSchema();
  const rows = await query<UserRow>(`select ${COLUMNS} from users order by created_at desc`);
  return rows.map(fromRow);
}

export async function getUserById(id: string): Promise<User | null> {
  if (!id) return null;
  await ensureSchema();
  const row = await queryOne<UserRow>(`select ${COLUMNS} from users where id = $1`, [id]);
  return row ? fromRow(row) : null;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const needle = email.trim().toLowerCase();
  if (!needle) return undefined;
  await ensureSchema();
  const row = await queryOne<UserRow>(`select ${COLUMNS} from users where lower(email) = $1`, [needle]);
  return row ? fromRow(row) : undefined;
}

export async function ownerAccount(): Promise<User | null> {
  await ensureSchema();
  const row = await queryOne<UserRow>(`select ${COLUMNS} from users where owner limit 1`);
  return row ? fromRow(row) : null;
}

export async function emailTaken(email: string): Promise<boolean> {
  return Boolean(await findUserByEmail(email));
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveUser(user: User): Promise<void> {
  await ensureSchema();
  await query(
    `insert into users (
       id, email, name, password_hash, role, owner, suspended,
       subscription, usage, lifetime_minutes, progress, invoices, activity_log,
       payment_method, profile, created_at, updated_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, now())
     on conflict (id) do update set
       email = excluded.email,
       name = excluded.name,
       password_hash = excluded.password_hash,
       role = excluded.role,
       owner = excluded.owner,
       suspended = excluded.suspended,
       subscription = excluded.subscription,
       usage = excluded.usage,
       lifetime_minutes = excluded.lifetime_minutes,
       progress = excluded.progress,
       invoices = excluded.invoices,
       activity_log = excluded.activity_log,
       payment_method = excluded.payment_method,
       profile = excluded.profile,
       updated_at = now()`,
    [
      user.id,
      user.email.trim().toLowerCase(),
      user.name,
      user.passwordHash,
      user.role,
      user.owner,
      user.suspended,
      json(user.subscription),
      json(user.usage),
      Math.max(0, Math.round(user.lifetimeMinutes)),
      json(user.progress),
      json(user.invoices),
      json(user.activityLog),
      json(user.paymentMethod),
      json(user.profile),
      user.createdAt,
    ]
  );
}

export async function touchLastSeen(userId: string): Promise<void> {
  await ensureSchema();
  await query("update users set last_seen_at = now() where id = $1", [userId]);
}

export class AccountExistsError extends Error {
  constructor() {
    super("An account with that email already exists.");
    this.name = "AccountExistsError";
  }
}

interface CreateUserOptions {
  name: string;
  email: string;
  password: string;
  role?: User["role"];
  owner?: boolean;
  planId?: PlanId;
  track?: LearnerProfile["track"];
  weeklyGoal?: number;
}

export async function createAccount(options: CreateUserOptions): Promise<User> {
  await ensureSchema();
  const now = new Date().toISOString();
  const user: User = {
    id: uid(),
    name: options.name.trim().slice(0, 60),
    email: options.email.trim().toLowerCase().slice(0, 160),
    passwordHash: hashPassword(options.password),
    createdAt: now,
    role: options.role ?? "member",
    owner: options.owner ?? false,
    suspended: false,
    subscription: makeSubscription(options.planId ?? "free", "monthly"),
    usage: freshUsage(),
    lifetimeMinutes: 0,
    progress: {},
    invoices: [],
    activityLog: [],
    paymentMethod: { brand: "Visa", last4: "4242", provider: "demo" },
    profile: defaultProfile({ track: options.track, weeklyGoal: options.weeklyGoal }),
  };

  try {
    await saveUser(user);
  } catch (error) {
    // 23505 = unique_violation: another request created the same email first.
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
      throw new AccountExistsError();
    }
    throw error;
  }
  return user;
}

/** Sign-up used by the public form. */
export async function createUser(name: string, email: string, password: string): Promise<User> {
  const user = await createAccount({ name, email, password });
  logActivity(user, "Account created on the Explorer plan", "account");
  await saveUser(user);
  return user;
}

/** First-run creation of the single owner account (see `db.ts`). */
export async function createOwnerAccount(email: string, password: string): Promise<User> {
  const handle = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  const name = handle ? handle.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 60) : "Site owner";
  const user = await createAccount({
    name,
    email,
    password,
    role: "admin",
    owner: true,
    planId: "elite",
  });
  logActivity(user, "Owner account created", "admin");
  await saveUser(user);
  return user;
}

export async function deleteAccount(userId: string): Promise<void> {
  await ensureSchema();
  await query("delete from users where id = $1", [userId]);
}

/* -------------------------------------------------------------------------- */
/* Account activity                                                           */
/* -------------------------------------------------------------------------- */

export function logActivity(
  user: User,
  text: string,
  type: ActivityEvent["type"] = "account"
): void {
  user.activityLog.unshift({ id: uid(), ts: new Date().toISOString(), text, type });
  if (user.activityLog.length > 250) user.activityLog.pop();
}

/** Invoice numbers come from a database sequence, so they stay unique. */
export async function addInvoice(user: User, amount: number, description: string): Promise<Invoice | null> {
  if (amount <= 0) return null;
  await ensureSchema();
  const row = await queryOne<{ number: string }>("select nextval('invoice_number_seq')::text as number");
  const invoice: Invoice = {
    id: uid(),
    number: `CDR-${row?.number ?? Date.now()}`,
    date: new Date().toISOString(),
    amount,
    description,
    status: "paid",
    reference: `demo_${uid().slice(0, 8)}`,
  };
  user.invoices.unshift(invoice);
  return invoice;
}

/* -------------------------------------------------------------------------- */
/* Learning                                                                   */
/* -------------------------------------------------------------------------- */

export function getOrCreateProgress(user: User, courseId: string): CourseProgress {
  const existing = user.progress[courseId];
  if (existing) return existing;
  const now = new Date().toISOString();
  const created: CourseProgress = {
    courseId,
    completedLessonIds: [],
    startedAt: now,
    lastAccessedAt: now,
  };
  user.progress[courseId] = created;
  logActivity(user, `Started ${getCourse(courseId)?.title ?? "a course"}`, "learning");
  return created;
}

export function recordLessonProgress(
  user: User,
  courseId: string,
  lessonId: string,
  completed: boolean
): CourseProgress {
  const course = getCourse(courseId);
  if (!course) throw new Error("Course not found");
  const lesson = findContentLesson(course, lessonId);
  if (!lesson) throw new Error("Lesson not found");

  // The window may be stale if this is the first request of a new day, so roll
  // it before recording the time.
  syncUsageWindow(user);
  const progress = getOrCreateProgress(user, courseId);
  const alreadyComplete = progress.completedLessonIds.includes(lessonId);
  if (completed && !alreadyComplete) {
    progress.completedLessonIds.push(lessonId);
    const credited = user.usage.creditedLessonIds ?? (user.usage.creditedLessonIds = []);
    if (!credited.includes(lessonId)) {
      // First time this lesson is completed: count the time once. Undoing and
      // redoing it later must not add the same duration again.
      credited.push(lessonId);
      user.usage.minutes += lesson.duration;
      user.lifetimeMinutes += lesson.duration;
      const today = user.usage.history.find((item) => item.date === todayKey());
      if (today) today.count += lesson.duration;
    }
    logActivity(user, `Completed “${lesson.title}” in ${course.shortTitle}`, "learning");
  } else if (!completed && alreadyComplete) {
    progress.completedLessonIds = progress.completedLessonIds.filter((id) => id !== lessonId);
    logActivity(user, `Marked “${lesson.title}” as incomplete`, "learning");
  }
  progress.lastAccessedAt = new Date().toISOString();
  return progress;
}

/**
 * Keeps `usage.history` a rolling seven-day window that ends today.
 *
 * Without this the window stays where `freshUsage()` left it — on the day the
 * account was created — so from the next day on the dashboard chart, the
 * "minutes this week" figure and the weekly goal all describe a week that has
 * already passed, and today's minutes have nowhere to be recorded.
 *
 * When the window moves, `todayKey()` cannot appear twice, so the caller must
 * persist the result (every route that changes progress calls `saveUser`);
 * otherwise a server restart would roll the window again and could land on a
 * different day.
 */
export function syncUsageWindow(user: User): boolean {
  const history = user.usage.history;
  if (!history.length) {
    user.usage = { ...freshUsage(), minutes: user.usage.minutes };
    return true;
  }
  if (history[history.length - 1].date === todayKey()) return false;

  const counts = new Map(history.map((day) => [day.date, day.count]));
  const rolled: DayUsage[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = todayKey(addDays(new Date(), -offset));
    rolled.push({ date, count: counts.get(date) ?? 0 });
  }
  user.usage = { ...user.usage, history: rolled };
  return true;
}

/**
 * Consecutive days of learning, counting back from today.
 *
 * An empty today does not break a streak: the day is not over yet, so counting
 * starts from yesterday. Only a full day with no activity ends it.
 */
export function learningStreak(user: User): number {
  const history = user.usage.history;
  let index = history.length - 1;
  if (index >= 0 && history[index].count <= 0) index -= 1;
  let streak = 0;
  for (; index >= 0; index -= 1) {
    if (history[index].count <= 0) break;
    streak += 1;
  }
  return streak;
}

export function completedLessonCount(user: User): number {
  return Object.values(user.progress).reduce(
    (sum, item) => sum + item.completedLessonIds.length,
    0
  );
}
