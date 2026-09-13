import { PLANS, PlanId, getPlan, priceFor } from "./plans";
import { User, getStore, logActivity } from "./store";
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

/** Shape of a member row sent to the admin UI (no nested detail). */
export interface AdminUserRow {
  id: string;
  name: string;
  role: "member" | "admin";
  suspended: boolean;
  createdAt: string;
  planId: PlanId;
  planName: string;
  cycle: string;
  cancelAtPeriodEnd: boolean;
  periodEnd: string;
  matches: number;
  dates: number;
  likesUsed: number;
  likeLimit: number | null;
  invoices: number;
  revenue: number;
}

export function toAdminRow(user: User): AdminUserRow {
  const plan = getPlan(user.subscription.planId);
  return {
    id: user.id,
    name: user.name,
    role: user.role ?? "member",
    suspended: user.suspended ?? false,
    createdAt: user.createdAt,
    planId: user.subscription.planId,
    planName: plan.name,
    cycle: user.subscription.cycle,
    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    periodEnd: user.subscription.currentPeriodEnd,
    matches: user.matches.length,
    dates: user.matches.reduce((n, m) => n + m.dateIdeas.length, 0),
    likesUsed: user.usage.count,
    likeLimit: plan.limits.likesPerPeriod,
    invoices: user.invoices.length,
    revenue: user.invoices.reduce((n, i) => n + i.amount, 0),
  };
}

export interface AdminStats {
  totalUsers: number;
  members: number;
  admins: number;
  suspended: number;
  totalMatches: number;
  totalDates: number;
  datesBeenOn: number;
  totalLikes: number;
  totalRevenue: number;
  invoiceCount: number;
  byPlan: Array<{ planId: PlanId; planName: string; count: number }>;
}

export function computeStats(): AdminStats {
  const users = [...getStore().users.values()];
  const byPlan = PLANS.map((p) => ({
    planId: p.id,
    planName: p.name,
    count: users.filter((u) => u.subscription.planId === p.id).length,
  }));
  return {
    totalUsers: users.length,
    members: users.filter((u) => (u.role ?? "member") === "member").length,
    admins: users.filter((u) => u.role === "admin").length,
    suspended: users.filter((u) => u.suspended).length,
    totalMatches: users.reduce((n, u) => n + u.matches.length, 0),
    totalDates: users.reduce(
      (n, u) => n + u.matches.reduce((m, x) => m + x.dateIdeas.length, 0),
      0
    ),
    datesBeenOn: users.reduce(
      (n, u) =>
        n + u.matches.reduce((m, x) => m + x.dateIdeas.filter((d) => d.done).length, 0),
      0
    ),
    totalLikes: users.reduce((n, u) => n + u.usage.count, 0),
    totalRevenue: users.reduce(
      (n, u) => n + u.invoices.reduce((m, i) => m + i.amount, 0),
      0
    ),
    invoiceCount: users.reduce((n, u) => n + u.invoices.length, 0),
    byPlan,
  };
}

function getTargetUser(userId: string): User {
  const target = getStore().users.get(userId);
  if (!target) throw new AdminError("User not found.", "NOT_FOUND", 404);
  if (target.role === undefined)
    target.role = target.name.toLowerCase() === "admin" ? "admin" : "member";
  if (target.suspended === undefined) target.suspended = false;
  return target;
}

/* ------------------------------ actions ------------------------------ */

export function adminSuspendUser(admin: User, userId: string, suspended: boolean): User {
  const target = getTargetUser(userId);
  if (target.id === admin.id) {
    throw new AdminError("You can't suspend your own admin account.", "SELF_ACTION");
  }
  if (target.role === "admin") {
    throw new AdminError("Admins can't be suspended.", "TARGET_ADMIN");
  }
  target.suspended = suspended;
  logActivity(
    target,
    suspended ? "Account suspended by an administrator" : "Account reinstated by an administrator"
  );
  logActivity(admin, `${suspended ? "Suspended" : "Reinstated"} member “${target.name}”`);
  return target;
}

export function adminSetRole(admin: User, userId: string, role: "member" | "admin"): User {
  const target = getTargetUser(userId);
  if (target.id === admin.id && role === "member") {
    throw new AdminError("You can't demote your own admin account.", "SELF_ACTION");
  }
  if (target.role === role) return target;
  target.role = role;
  if (role === "admin") target.suspended = false;
  logActivity(
    target,
    role === "admin" ? "Promoted to administrator" : "Admin access removed"
  );
  logActivity(admin, `${role === "admin" ? "Promoted" : "Demoted"} “${target.name}” ${role === "admin" ? "to admin" : "to member"}`);
  return target;
}

/**
 * Admin plan override ("comp"): sets the plan immediately in either direction,
 * without charging an invoice — a gift, not a purchase.
 */
export function adminSetPlan(admin: User, userId: string, planId: PlanId): User {
  const target = getTargetUser(userId);
  if (target.subscription.planId === planId) return target;
  const before = getPlan(target.subscription.planId).name;
  // upgrades reuse the normal engine but we strip the invoice it creates (comp'd)
  const invoicesBefore = target.invoices.length;
  const result = changePlan(target, planId, target.subscription.cycle);
  if (result.mode === "scheduled") {
    // force downgrades to apply immediately for admin overrides
    target.subscription.planId = planId;
    target.subscription.pendingPlanId = null;
  }
  if (target.invoices.length > invoicesBefore) target.invoices.shift();
  logActivity(target, `Plan changed from ${before} to ${getPlan(planId).name} by an administrator (comp'd)`);
  logActivity(admin, `Set “${target.name}” to the ${getPlan(planId).name} plan (comp'd)`);
  return target;
}

export function adminResetLikes(admin: User, userId: string): User {
  const target = getTargetUser(userId);
  target.usage.count = 0;
  target.usage.history = target.usage.history.map((h) => ({ ...h, count: 0 }));
  logActivity(target, "Like allowance reset by an administrator");
  logActivity(admin, `Reset the like allowance for “${target.name}”`);
  return target;
}

export function adminDeleteUser(admin: User, userId: string): void {
  const target = getTargetUser(userId);
  if (target.id === admin.id) {
    throw new AdminError("You can't delete your own admin account.", "SELF_ACTION");
  }
  if (target.role === "admin") {
    throw new AdminError("Admins can't be deleted from the console.", "TARGET_ADMIN");
  }
  getStore().users.delete(userId);
  logActivity(admin, `Deleted the account of “${target.name}”`);
}

/** Yearly-equivalent monthly recurring revenue estimate across active paid members. */
export function estimateMrr(): number {
  const users = [...getStore().users.values()];
  return users.reduce((n, u) => {
    if (u.subscription.cancelAtPeriodEnd) return n;
    const price = priceFor(u.subscription.planId, u.subscription.cycle);
    return n + (u.subscription.cycle === "yearly" ? Math.round(price / 12) : price);
  }, 0);
}
