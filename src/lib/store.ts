import { randomUUID } from "node:crypto";
import { PERIOD_DAYS, PassPeriod } from "./plans";
import { getCourse } from "./courses";
import { findContentLesson } from "./course-content";
import { hashPassword, verifyPasswordHash } from "./passwords";
import { ensureSchema, query, queryOne } from "./db";
import type { UserRow } from "./schema";
import type { Certificate } from "./certificates";

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
  /** "owner" covers anything the teacher did to an account or to prices. */
  type: "learning" | "billing" | "account" | "owner";
}

export interface DayUsage {
  date: string;
  count: number;
}

/**
 * An access pass: what the student bought, and until when.
 *
 * There is one level of access, sold by the day, week or month. When
 * `expiresAt` passes, learning locks again (see `access.ts`) — the purchases
 * below survive, so renewing a pass reopens everything already paid for.
 * Passes do not renew themselves: the platform takes a payment per pass, and
 * a student buys another one when they want more time.
 */
export interface AccessPass {
  period: PassPeriod;
  /** What this pass cost when it was bought. */
  price: number;
  startedAt: string;
  expiresAt: string;
}

/** A program the student has paid for (older rows may be a course or lesson). */
export interface Purchase {
  id: string;
  kind: "course" | "lesson" | "program";
  /** Program, course or lesson id, matching `kind`. */
  refId: string;
  /** Set for lessons, so the dashboard can group by course. */
  courseId: string | null;
  amount: number;
  at: string;
  /** The invoice raised for this purchase, for the billing history. */
  invoiceNumber: string | null;
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
  provider: "demo" | "paystack";
  /**
   * Mobile Money details for the last successful payment, when the student
   * paid with MoMo. The phone is stored so the billing page and receipts can
   * show where the money came from — the MoMo PIN itself never touches us
   * (approval happens on the student's own phone / the provider's page).
   */
  phone?: string;
  network?: string;
  channel?: "mobile_money" | "card" | "bank_transfer" | "ussd" | "qr" | "bank";
}

export interface CourseProgress {
  courseId: string;
  completedLessonIds: string[];
  startedAt: string;
  lastAccessedAt: string;
  /**
   * Set once the "you finished this course" email goes out, so unmarking and
   * re-marking the last lesson can never send it twice.
   */
  completionEmailedAt?: string;
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
  /** Two roles only: a student, or the owner (the teacher). */
  role: "student" | "owner";
  /** True for the single site owner - the only account that can publish lessons. */
  owner: boolean;
  suspended: boolean;
  /** The current access pass. An ended one still describes the last purchase. */
  subscription: AccessPass;
  usage: LearningUsage;
  lifetimeMinutes: number;
  progress: Record<string, CourseProgress>;
  /** Courses and lessons paid for. Kept when a pass lapses. */
  purchases: Purchase[];
  /** Certificates earned by finishing a course, newest last. */
  certificates: Certificate[];
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

/** A pass that starts now and runs for `period`. */
export function makePass(period: PassPeriod, price = 0): AccessPass {
  const now = new Date();
  return {
    period,
    price,
    startedAt: now.toISOString(),
    expiresAt: addDays(now, PERIOD_DAYS[period]).toISOString(),
  };
}

/**
 * A pass that has already ended — what a new account starts with. Kept as a
 * real value (rather than null) so every read of `user.subscription` has the
 * same shape, and `expiresAt` answers "has this student ever had a pass?".
 */
export function noPass(): AccessPass {
  const now = new Date().toISOString();
  return { period: "monthly", price: 0, startedAt: now, expiresAt: now };
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
    role: row.owner || row.role === "owner" ? "owner" : "student",
    owner: row.owner,
    suspended: row.suspended,
    subscription: row.subscription as AccessPass,
    usage: row.usage as LearningUsage,
    lifetimeMinutes: row.lifetime_minutes,
    progress: (row.progress ?? {}) as Record<string, CourseProgress>,
    purchases: (row.purchases ?? []) as Purchase[],
    certificates: (row.certificates ?? []) as Certificate[],
    invoices: (row.invoices ?? []) as Invoice[],
    activityLog: (row.activity_log ?? []) as ActivityEvent[],
    paymentMethod: row.payment_method as PaymentMethod,
    profile: { ...defaultProfile(), ...((row.profile ?? {}) as Partial<LearnerProfile>) },
  };
}

const COLUMNS =
  "id, email, name, password_hash, role, owner, suspended, subscription, usage, lifetime_minutes, progress, purchases, certificates, invoices, activity_log, payment_method, profile, created_at";

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
       subscription, usage, lifetime_minutes, progress, purchases, certificates,
       invoices, activity_log, payment_method, profile, created_at, updated_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, now())
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
       purchases = excluded.purchases,
       certificates = excluded.certificates,
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
      json(user.purchases),
      json(user.certificates ?? []),
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
  /** An initial access pass, used for the owner account. */
  passPeriod?: PassPeriod;
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
    role: options.role ?? "student",
    owner: options.owner ?? false,
    suspended: false,
    subscription: options.passPeriod ? makePass(options.passPeriod) : noPass(),
    usage: freshUsage(),
    lifetimeMinutes: 0,
    progress: {},
    purchases: [],
    certificates: [],
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
  logActivity(user, "Account created — no access pass yet", "account");
  await saveUser(user);
  return user;
}

/** First-run creation of the single owner account (see `db.ts`). */
export async function createOwnerAccount(email: string, password: string, preferredName?: string): Promise<User> {
  // Without OWNER_NAME the display name is guessed from the email handle, which
  // turns teacher@codemasterghana.dev into "Teacher" — so the console would greet
  // the owner by a placeholder instead of their name.
  const handle = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  const fallback = handle ? handle.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 60) : "Site owner";
  const name = preferredName?.trim().slice(0, 60) || fallback;
  const user = await createAccount({
    name,
    email,
    password,
    role: "owner",
    owner: true,
    // The owner never buys access to their own teaching.
    passPeriod: "monthly",
  });
  logActivity(user, "Owner (teacher) account created", "owner");
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

/**
 * Invoice numbers come from a database sequence, so they stay unique.
 *
 * `reference` is the payment reference that settled this invoice — the
 * provider's transaction reference for real Mobile Money / card payments, or a
 * `demo_…` marker for simulated checkouts. It is what ties an invoice back to
 * its row in `payments` when a student (or the teacher) asks "where did this
 * money go?".
 */
export async function addInvoice(
  user: User,
  amount: number,
  description: string,
  reference?: string
): Promise<Invoice | null> {
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
    reference: reference ?? `demo_${uid().slice(0, 8)}`,
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
