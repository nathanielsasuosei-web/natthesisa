import {
  BillingCycle,
  PLAN_TIER,
  PlanId,
  cycleDays,
  getPlan,
  priceFor,
} from "./plans";
import {
  User,
  addDays,
  addInvoice,
  freshUsage,
  logActivity,
  makeSubscription,
} from "./store";

export class SubscriptionError extends Error {
  code: string;
  constructor(message: string, code = "BAD_REQUEST") {
    super(message);
    this.code = code;
  }
}

export interface ChangeResult {
  mode: "upgraded" | "scheduled" | "cycle" | "noop";
  charged?: number;
  effectiveAt?: string;
}

function startNewPeriod(user: User, cycle: BillingCycle): void {
  const now = new Date();
  user.subscription.currentPeriodStart = now.toISOString();
  user.subscription.currentPeriodEnd = addDays(now, cycleDays(cycle)).toISOString();
  user.usage = freshUsage();
}

export function syncSubscription(user: User): void {
  const subscription = user.subscription;
  if (Date.now() < new Date(subscription.currentPeriodEnd).getTime()) return;

  const pending = subscription.pendingPlanId;
  const wasCancelling = subscription.cancelAtPeriodEnd;
  const nextPlan: PlanId = pending ?? (wasCancelling ? "free" : subscription.planId);

  subscription.planId = nextPlan;
  subscription.pendingPlanId = null;
  subscription.cancelAtPeriodEnd = false;
  startNewPeriod(user, subscription.cycle);

  const price = priceFor(nextPlan, subscription.cycle);
  if (price > 0) {
    addInvoice(user, price, `${getPlan(nextPlan).name} plan — ${subscription.cycle} renewal`);
  }
  if (wasCancelling && !pending) {
    logActivity(user, "Subscription ended — moved to the Explorer plan", "billing");
  } else if (pending) {
    logActivity(user, `Scheduled plan change applied — now on ${getPlan(nextPlan).name}`, "billing");
  } else {
    logActivity(user, `${getPlan(nextPlan).name} subscription renewed`, "billing");
  }
}

export function changePlan(
  user: User,
  planId: PlanId,
  cycle?: BillingCycle
): ChangeResult {
  const subscription = user.subscription;
  const target = getPlan(planId);

  if (PLAN_TIER[planId] > PLAN_TIER[subscription.planId]) {
    const nextCycle = cycle ?? subscription.cycle;
    const price = priceFor(planId, nextCycle);
    subscription.planId = planId;
    subscription.cycle = nextCycle;
    subscription.cancelAtPeriodEnd = false;
    subscription.pendingPlanId = null;
    startNewPeriod(user, nextCycle);
    if (price > 0) addInvoice(user, price, `${target.name} plan — ${nextCycle} purchase`);
    logActivity(user, `Upgraded to ${target.name} (${nextCycle})`, "billing");
    return { mode: "upgraded", charged: price };
  }

  if (PLAN_TIER[planId] < PLAN_TIER[subscription.planId]) {
    subscription.pendingPlanId = planId;
    subscription.cancelAtPeriodEnd = false;
    logActivity(user, `Scheduled a change to ${target.name} at period end`, "billing");
    return { mode: "scheduled", effectiveAt: subscription.currentPeriodEnd };
  }

  if (cycle && cycle !== subscription.cycle) {
    subscription.cycle = cycle;
    const price = priceFor(planId, cycle);
    startNewPeriod(user, cycle);
    if (price > 0) addInvoice(user, price, `${target.name} plan — switched to ${cycle} billing`);
    logActivity(user, `Switched ${target.name} to ${cycle} billing`, "billing");
    return { mode: "cycle", charged: price };
  }

  return { mode: "noop" };
}

export function cancelSubscription(user: User): void {
  if (user.subscription.planId === "free") {
    throw new SubscriptionError("The Explorer plan is free, so there is nothing to cancel.", "FREE_PLAN");
  }
  user.subscription.cancelAtPeriodEnd = true;
  user.subscription.pendingPlanId = null;
  logActivity(user, "Subscription cancellation scheduled for period end", "billing");
}

export function resumeSubscription(user: User): void {
  if (!user.subscription.cancelAtPeriodEnd) {
    throw new SubscriptionError("This subscription is not scheduled to cancel.");
  }
  user.subscription.cancelAtPeriodEnd = false;
  logActivity(user, "Subscription cancellation reversed", "billing");
}

export function clearPendingChange(user: User): void {
  const pending = user.subscription.pendingPlanId;
  if (!pending) throw new SubscriptionError("There is no scheduled plan change to remove.");
  user.subscription.pendingPlanId = null;
  logActivity(user, `Removed the scheduled change to ${getPlan(pending).name}`, "billing");
}

export function reseedForTests(user: User): void {
  user.subscription = makeSubscription(user.subscription.planId, user.subscription.cycle);
}
