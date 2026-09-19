import { createHash, randomBytes, randomUUID } from "node:crypto";
import { BillingCycle, PlanId, cycleDays, getPlan } from "./plans";
import { getCourse, getCourseLessons } from "./courses";

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
  passwordSalt: string;
  createdAt: string;
  role: "member" | "admin";
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

export interface Store {
  users: Map<string, User>;
}

const g = globalThis as unknown as { __codaraStore?: Store };
let invoiceCounter = 1007;

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

function passwordDigest(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function credentials(password: string): Pick<User, "passwordHash" | "passwordSalt"> {
  const passwordSalt = randomBytes(16).toString("hex");
  return { passwordSalt, passwordHash: passwordDigest(password, passwordSalt) };
}

export function verifyPassword(user: User, password: string): boolean {
  return passwordDigest(password, user.passwordSalt) === user.passwordHash;
}

interface MakeUserOptions {
  id?: string;
  name: string;
  email: string;
  password: string;
  planId?: PlanId;
  role?: User["role"];
  weeklyGoal?: number;
  track?: LearnerProfile["track"];
  history?: number[];
}

function makeUser(options: MakeUserOptions): User {
  const now = new Date().toISOString();
  const usage = freshUsage(options.history);
  return {
    id: options.id ?? uid(),
    name: options.name.trim().slice(0, 60),
    email: options.email.trim().toLowerCase().slice(0, 120),
    ...credentials(options.password),
    createdAt: now,
    role: options.role ?? "member",
    suspended: false,
    subscription: makeSubscription(options.planId ?? "free", "monthly"),
    usage,
    lifetimeMinutes: usage.minutes,
    progress: {},
    invoices: [],
    activityLog: [],
    paymentMethod: { brand: "Visa", last4: "4242", provider: "demo" },
    profile: {
      headline: "Learning one project at a time.",
      track: options.track ?? "Full-stack developer",
      experience: "Just starting",
      weeklyGoal: options.weeklyGoal ?? 180,
    },
  };
}

function seedProgress(user: User, courseId: string, completedCount: number, daysAgo = 0): void {
  const course = getCourse(courseId);
  if (!course) return;
  const allLessons = getCourseLessons(course);
  const lastAccessedAt = addDays(new Date(), -daysAgo).toISOString();
  user.progress[courseId] = {
    courseId,
    completedLessonIds: allLessons.slice(0, completedCount).map((item) => item.id),
    startedAt: addDays(new Date(), -Math.max(daysAgo + 8, 10)).toISOString(),
    lastAccessedAt,
  };
}

function initializeStore(): Store {
  const store: Store = { users: new Map<string, User>() };
  g.__codaraStore = store;

  const admin = makeUser({
    id: "codara-admin",
    name: "codemasterghana Admin",
    email: "admin@codemasterghana.dev",
    password: "admin123",
    planId: "elite",
    role: "admin",
    track: "Full-stack developer",
    history: [12, 18, 0, 24, 16, 8, 0],
  });
  logActivity(admin, "Administrator account created", "admin");

  const demo = makeUser({
    id: "codara-student-demo",
    name: "Amara Mensah",
    email: "student@codemasterghana.dev",
    password: "student123",
    planId: "premium",
    weeklyGoal: 240,
    track: "Web developer",
    history: [28, 42, 18, 54, 0, 36, 22],
  });
  demo.profile.headline = "Future frontend engineer building in public.";
  seedProgress(demo, "web-foundations", 5, 1);
  seedProgress(demo, "javascript-zero-to-builder", 2, 0);
  addInvoice(demo, getPlan("premium").monthly, "Pro plan — monthly subscription");
  logActivity(demo, "Completed “CSS foundations” in Web Development Foundations", "learning");
  logActivity(demo, "Started JavaScript: Zero to Builder", "learning");

  const kwame = makeUser({
    id: "codara-student-kwame",
    name: "Kwame Boateng",
    email: "kwame@example.com",
    password: randomBytes(16).toString("hex"),
    planId: "free",
    track: "Computer science",
    history: [0, 20, 15, 0, 25, 18, 0],
  });
  seedProgress(kwame, "computer-science-essentials", 3, 1);
  logActivity(kwame, "Started Computer Science Essentials", "learning");

  const lina = makeUser({
    id: "codara-student-lina",
    name: "Lina Osei",
    email: "lina@example.com",
    password: randomBytes(16).toString("hex"),
    planId: "elite",
    track: "App developer",
    history: [45, 30, 55, 40, 30, 62, 20],
  });
  seedProgress(lina, "web-foundations", 7, 12);
  seedProgress(lina, "mobile-apps-react-native", 4, 0);
  addInvoice(lina, getPlan("elite").monthly, "Mentor plan — monthly subscription");
  logActivity(lina, "Completed Web Development Foundations", "learning");

  const suspended = makeUser({
    id: "codara-student-jordan",
    name: "Jordan Nartey",
    email: "jordan@example.com",
    password: randomBytes(16).toString("hex"),
    planId: "premium",
    track: "Full-stack developer",
    history: [0, 0, 0, 0, 0, 0, 0],
  });
  suspended.suspended = true;
  seedProgress(suspended, "backend-node-apis", 1, 18);
  addInvoice(suspended, getPlan("premium").monthly, "Pro plan — monthly subscription");
  logActivity(suspended, "Account suspended by an administrator", "admin");

  for (const user of [admin, demo, kwame, lina, suspended]) {
    store.users.set(user.id, user);
  }
  return store;
}

export function getStore(): Store {
  return g.__codaraStore ?? initializeStore();
}

export function logActivity(
  user: User,
  text: string,
  type: ActivityEvent["type"] = "account"
): void {
  user.activityLog.unshift({ id: uid(), ts: new Date().toISOString(), text, type });
  if (user.activityLog.length > 250) user.activityLog.pop();
}

export function addInvoice(user: User, amount: number, description: string): Invoice | null {
  if (amount <= 0) return null;
  invoiceCounter += 1;
  const invoice: Invoice = {
    id: uid(),
    number: `CDR-${invoiceCounter}`,
    date: new Date().toISOString(),
    amount,
    description,
    status: "paid",
    reference: `demo_${uid().slice(0, 8)}`,
  };
  user.invoices.unshift(invoice);
  return invoice;
}

export function findUserByEmail(email: string): User | undefined {
  const needle = email.trim().toLowerCase();
  if (!needle) return undefined;
  return [...getStore().users.values()].find((user) => user.email === needle);
}

export function createUser(name: string, email: string, password: string): User {
  const user = makeUser({ name, email, password });
  logActivity(user, "Learner account created on the Explorer plan", "account");
  getStore().users.set(user.id, user);
  return user;
}

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
  const lesson = getCourseLessons(course).find((item) => item.id === lessonId);
  if (!lesson) throw new Error("Lesson not found");

  const progress = getOrCreateProgress(user, courseId);
  const alreadyComplete = progress.completedLessonIds.includes(lessonId);
  if (completed && !alreadyComplete) {
    progress.completedLessonIds.push(lessonId);
    user.usage.minutes += lesson.duration;
    user.lifetimeMinutes += lesson.duration;
    const today = user.usage.history.find((item) => item.date === todayKey());
    if (today) today.count += lesson.duration;
    logActivity(user, `Completed “${lesson.title}” in ${course.shortTitle}`, "learning");
  } else if (!completed && alreadyComplete) {
    progress.completedLessonIds = progress.completedLessonIds.filter((id) => id !== lessonId);
    logActivity(user, `Marked “${lesson.title}” as incomplete`, "learning");
  }
  progress.lastAccessedAt = new Date().toISOString();
  return progress;
}

export function learningStreak(user: User): number {
  let streak = 0;
  for (let index = user.usage.history.length - 1; index >= 0; index -= 1) {
    if (user.usage.history[index].count <= 0) break;
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
