import { COURSES, getCourse } from "./courses";
import { contentPercent } from "./course-content";
import { PLANS, PlanId, getPlan, priceFor } from "./plans";
import { User, completedLessonCount, deleteAccount, getUserById, listUsers, logActivity, saveUser } from "./store";
import { changePlan } from "./subscription";
import { OWNER_IMMUTABLE_ERROR, isOwner } from "./owner";

export class AdminError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "BAD_REQUEST", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin";
  owner: boolean;
  suspended: boolean;
  createdAt: string;
  planId: PlanId;
  planName: string;
  cycle: string;
  cancelAtPeriodEnd: boolean;
  periodEnd: string;
  coursesStarted: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  lifetimeMinutes: number;
  invoices: number;
  revenue: number;
}

export function toAdminRow(user: User): AdminUserRow {
  const progress = Object.values(user.progress);
  const completedCourses = progress.filter((item) => {
    const course = getCourse(item.courseId);
    return course ? contentPercent(course, item.completedLessonIds) === 100 : false;
  }).length;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    owner: isOwner(user),
    suspended: user.suspended,
    createdAt: user.createdAt,
    planId: user.subscription.planId,
    planName: getPlan(user.subscription.planId).name,
    cycle: user.subscription.cycle,
    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    periodEnd: user.subscription.currentPeriodEnd,
    coursesStarted: progress.length,
    coursesCompleted: completedCourses,
    lessonsCompleted: completedLessonCount(user),
    lifetimeMinutes: user.lifetimeMinutes,
    invoices: user.invoices.length,
    revenue: user.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
  };
}

export interface AdminStats {
  totalUsers: number;
  learners: number;
  admins: number;
  suspended: number;
  activeLearners: number;
  lessonsCompleted: number;
  learningMinutes: number;
  certificatesEarned: number;
  totalRevenue: number;
  invoiceCount: number;
  byPlan: Array<{ planId: PlanId; planName: string; count: number }>;
  coursePerformance: Array<{
    courseId: string;
    title: string;
    enrollments: number;
    completions: number;
    lessonsCompleted: number;
  }>;
}

export async function computeStats(): Promise<AdminStats> {
  const users = await listUsers();
  const learners = users.filter((user) => user.role === "member");
  const byPlan = PLANS.map((plan) => ({
    planId: plan.id,
    planName: plan.name,
    count: learners.filter((user) => user.subscription.planId === plan.id).length,
  }));
  const coursePerformance = COURSES.map((course) => {
    const records = learners
      .map((user) => user.progress[course.id])
      .filter((item) => Boolean(item));
    return {
      courseId: course.id,
      title: course.shortTitle,
      enrollments: records.length,
      completions: records.filter((item) => contentPercent(course, item.completedLessonIds) === 100).length,
      lessonsCompleted: records.reduce((sum, item) => sum + item.completedLessonIds.length, 0),
    };
  });
  const certificatesEarned = coursePerformance.reduce((sum, item) => sum + item.completions, 0);
  return {
    totalUsers: users.length,
    learners: learners.length,
    admins: users.filter((user) => user.role === "admin").length,
    suspended: users.filter((user) => user.suspended).length,
    activeLearners: learners.filter((user) => user.usage.history.some((day) => day.count > 0)).length,
    lessonsCompleted: learners.reduce((sum, user) => sum + completedLessonCount(user), 0),
    learningMinutes: learners.reduce((sum, user) => sum + user.lifetimeMinutes, 0),
    certificatesEarned,
    totalRevenue: users.reduce(
      (sum, user) => sum + user.invoices.reduce((invoiceSum, invoice) => invoiceSum + invoice.amount, 0),
      0
    ),
    invoiceCount: users.reduce((sum, user) => sum + user.invoices.length, 0),
    byPlan,
    coursePerformance,
  };
}

async function targetUser(userId: string): Promise<User> {
  const user = await getUserById(userId);
  if (!user) throw new AdminError("Learner not found.", "NOT_FOUND", 404);
  return user;
}

export async function adminSuspendUser(admin: User, userId: string, suspended: boolean): Promise<User> {
  const user = await targetUser(userId);
  if (isOwner(user)) throw new AdminError(OWNER_IMMUTABLE_ERROR.error, OWNER_IMMUTABLE_ERROR.code, 403);
  if (user.id === admin.id) throw new AdminError("You cannot pause your own account.", "SELF_ACTION");
  if (user.role === "admin") throw new AdminError("Administrator accounts cannot be paused.", "TARGET_ADMIN");
  user.suspended = suspended;
  logActivity(user, suspended ? "Account paused by an administrator" : "Account restored by an administrator", "admin");
  logActivity(admin, `${suspended ? "Paused" : "Restored"} ${user.name}'s account`, "admin");
  await saveUser(user);
  await saveUser(admin);
  return user;
}

export async function adminSetRole(admin: User, userId: string, role: User["role"]): Promise<User> {
  // Only the owner decides who holds administrator access.
  if (!isOwner(admin)) {
    throw new AdminError("Only the site owner can change administrator access.", "OWNER_ONLY", 403);
  }
  const user = await targetUser(userId);
  if (isOwner(user)) {
    throw new AdminError("The owner account always keeps administrator access.", "OWNER_PROTECTED", 403);
  }
  if (user.id === admin.id && role === "member") {
    throw new AdminError("You cannot remove your own administrator access.", "SELF_ACTION");
  }
  if (user.role === role) return user;
  user.role = role;
  if (role === "admin") user.suspended = false;
  logActivity(user, role === "admin" ? "Administrator access granted" : "Administrator access removed", "admin");
  logActivity(admin, `${role === "admin" ? "Promoted" : "Demoted"} ${user.name}`, "admin");
  await saveUser(user);
  await saveUser(admin);
  return user;
}

export async function adminSetPlan(admin: User, userId: string, planId: PlanId): Promise<User> {
  const user = await targetUser(userId);
  if (user.subscription.planId === planId) return user;
  const before = getPlan(user.subscription.planId).name;
  const invoicesBefore = user.invoices.length;
  const result = await changePlan(user, planId, user.subscription.cycle);
  if (result.mode === "scheduled") {
    user.subscription.planId = planId;
    user.subscription.pendingPlanId = null;
    user.subscription.cancelAtPeriodEnd = false;
  }
  while (user.invoices.length > invoicesBefore) user.invoices.shift();
  logActivity(user, `Plan changed from ${before} to ${getPlan(planId).name} by an administrator`, "admin");
  logActivity(admin, `Comped ${getPlan(planId).name} access for ${user.name}`, "admin");
  await saveUser(user);
  await saveUser(admin);
  return user;
}

export async function adminResetProgress(admin: User, userId: string): Promise<User> {
  const user = await targetUser(userId);
  user.progress = {};
  user.usage = { ...user.usage, minutes: 0, history: user.usage.history.map((day) => ({ ...day, count: 0 })), creditedLessonIds: [] };
  user.lifetimeMinutes = 0;
  logActivity(user, "Learning progress reset by an administrator", "admin");
  logActivity(admin, `Reset learning progress for ${user.name}`, "admin");
  await saveUser(user);
  await saveUser(admin);
  return user;
}

export async function adminDeleteUser(admin: User, userId: string): Promise<void> {
  const user = await targetUser(userId);
  if (isOwner(user)) throw new AdminError(OWNER_IMMUTABLE_ERROR.error, OWNER_IMMUTABLE_ERROR.code, 403);
  if (user.id === admin.id) throw new AdminError("You cannot delete your own account.", "SELF_ACTION");
  if (user.role === "admin") throw new AdminError("Demote this administrator before deleting the account.", "TARGET_ADMIN");
  await deleteAccount(userId);
  logActivity(admin, `Deleted ${user.name}'s account`, "admin");
  await saveUser(admin);
}

export async function estimateMrr(): Promise<number> {
  const users = await listUsers();
  return users.reduce((sum, user) => {
    if (user.role === "admin" || user.subscription.cancelAtPeriodEnd) return sum;
    const amount = priceFor(user.subscription.planId, user.subscription.cycle);
    return sum + (user.subscription.cycle === "yearly" ? Math.round(amount / 12) : amount);
  }, 0);
}
