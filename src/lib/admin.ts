import { COURSES, coursePercent, getCourse } from "./courses";
import { PLANS, PlanId, getPlan, priceFor } from "./plans";
import { User, completedLessonCount, getStore, logActivity } from "./store";
import { changePlan } from "./subscription";

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
    return course ? coursePercent(course, item.completedLessonIds) === 100 : false;
  }).length;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
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

export function computeStats(): AdminStats {
  const users = [...getStore().users.values()];
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
      completions: records.filter((item) => coursePercent(course, item.completedLessonIds) === 100).length,
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

function targetUser(userId: string): User {
  const user = getStore().users.get(userId);
  if (!user) throw new AdminError("Learner not found.", "NOT_FOUND", 404);
  return user;
}

export function adminSuspendUser(admin: User, userId: string, suspended: boolean): User {
  const user = targetUser(userId);
  if (user.id === admin.id) throw new AdminError("You cannot pause your own account.", "SELF_ACTION");
  if (user.role === "admin") throw new AdminError("Administrator accounts cannot be paused.", "TARGET_ADMIN");
  user.suspended = suspended;
  logActivity(user, suspended ? "Account paused by an administrator" : "Account restored by an administrator", "admin");
  logActivity(admin, `${suspended ? "Paused" : "Restored"} ${user.name}'s account`, "admin");
  return user;
}

export function adminSetRole(admin: User, userId: string, role: User["role"]): User {
  const user = targetUser(userId);
  if (user.id === admin.id && role === "member") {
    throw new AdminError("You cannot remove your own administrator access.", "SELF_ACTION");
  }
  if (user.role === role) return user;
  user.role = role;
  if (role === "admin") user.suspended = false;
  logActivity(user, role === "admin" ? "Administrator access granted" : "Administrator access removed", "admin");
  logActivity(admin, `${role === "admin" ? "Promoted" : "Demoted"} ${user.name}`, "admin");
  return user;
}

export function adminSetPlan(admin: User, userId: string, planId: PlanId): User {
  const user = targetUser(userId);
  if (user.subscription.planId === planId) return user;
  const before = getPlan(user.subscription.planId).name;
  const invoicesBefore = user.invoices.length;
  const result = changePlan(user, planId, user.subscription.cycle);
  if (result.mode === "scheduled") {
    user.subscription.planId = planId;
    user.subscription.pendingPlanId = null;
    user.subscription.cancelAtPeriodEnd = false;
  }
  while (user.invoices.length > invoicesBefore) user.invoices.shift();
  logActivity(user, `Plan changed from ${before} to ${getPlan(planId).name} by an administrator`, "admin");
  logActivity(admin, `Comped ${getPlan(planId).name} access for ${user.name}`, "admin");
  return user;
}

export function adminResetProgress(admin: User, userId: string): User {
  const user = targetUser(userId);
  user.progress = {};
  user.usage = { ...user.usage, minutes: 0, history: user.usage.history.map((day) => ({ ...day, count: 0 })) };
  user.lifetimeMinutes = 0;
  logActivity(user, "Learning progress reset by an administrator", "admin");
  logActivity(admin, `Reset learning progress for ${user.name}`, "admin");
  return user;
}

export function adminDeleteUser(admin: User, userId: string): void {
  const user = targetUser(userId);
  if (user.id === admin.id) throw new AdminError("You cannot delete your own account.", "SELF_ACTION");
  if (user.role === "admin") throw new AdminError("Demote this administrator before deleting the account.", "TARGET_ADMIN");
  getStore().users.delete(userId);
  logActivity(admin, `Deleted ${user.name}'s account`, "admin");
}

export function estimateMrr(): number {
  return [...getStore().users.values()].reduce((sum, user) => {
    if (user.role === "admin" || user.subscription.cancelAtPeriodEnd) return sum;
    const amount = priceFor(user.subscription.planId, user.subscription.cycle);
    return sum + (user.subscription.cycle === "yearly" ? Math.round(amount / 12) : amount);
  }, 0);
}
