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
  logActivity,
  freshUsage,
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

/**
 * Roll the subscription forward when its period has ended:
 * apply any scheduled downgrade (or cancellation), renew, reset usage.
 * Called whenever a user is loaded.
 */
export function syncSubscription(user: User): void {
  const sub = user.subscription;
  if (Date.now() < new Date(sub.currentPeriodEnd).getTime()) return;

  const hadPending = sub.pendingPlanId;
  const wasCancelling = sub.cancelAtPeriodEnd;
  const nextPlan: PlanId = hadPending ?? (wasCancelling ? "free" : sub.planId);

  sub.planId = nextPlan;
  sub.pendingPlanId = null;
  sub.cancelAtPeriodEnd = false;
  startNewPeriod(user, sub.cycle);

  const price = priceFor(nextPlan, sub.cycle);
  if (price > 0) {
    addInvoice(user, price, `${getPlan(nextPlan).name} membership — ${sub.cycle} renewal`);
  }
  if (wasCancelling && !hadPending) {
    logActivity(user, "Membership ended — moved to the Free plan");
  } else if (hadPending) {
    logActivity(user, `Scheduled change applied — now on the ${getPlan(nextPlan).name} plan`);
  } else {
    logActivity(user, `Membership renewed on the ${getPlan(nextPlan).name} plan`);
  }
}

/**
 * Stripe-like plan changes:
 *  - upgrades apply immediately (new period starts today, invoice issued);
 *  - downgrades are scheduled for the end of the current period;
 *  - switching billing cycle on the same plan applies immediately.
 */
export function changePlan(
  user: User,
  planId: PlanId,
  cycle?: BillingCycle
): ChangeResult {
  const sub = user.subscription;
  const target = getPlan(planId);

  if (PLAN_TIER[planId] > PLAN_TIER[sub.planId]) {
    const useCycle: BillingCycle = cycle ?? sub.cycle;
    const price = priceFor(planId, useCycle);
    sub.planId = planId;
    sub.cycle = useCycle;
    sub.cancelAtPeriodEnd = false;
    sub.pendingPlanId = null;
    startNewPeriod(user, useCycle);
    if (price > 0) addInvoice(user, price, `Upgrade to ${target.name} (${useCycle})`);
    logActivity(user, `Upgraded to ${target.name} (${useCycle})`);
    return { mode: "upgraded", charged: price };
  }

  if (PLAN_TIER[planId] < PLAN_TIER[sub.planId]) {
    sub.pendingPlanId = planId;
    sub.cancelAtPeriodEnd = false;
    logActivity(user, `Scheduled downgrade to ${target.name} for the end of the billing period`);
    return { mode: "scheduled", effectiveAt: sub.currentPeriodEnd };
  }

  // same plan — only a billing-cycle switch is meaningful
  if (cycle && cycle !== sub.cycle) {
    sub.cycle = cycle;
    const price = priceFor(planId, cycle);
    startNewPeriod(user, cycle);
    if (price > 0) addInvoice(user, price, `Switched to ${cycle} billing (${target.name})`);
    logActivity(user, `Switched ${target.name} billing to ${cycle}`);
    return { mode: "cycle", charged: price };
  }

  return { mode: "noop" };
}

export function cancelSubscription(user: User): void {
  const sub = user.subscription;
  if (sub.planId === "free") {
    throw new SubscriptionError("You're on the Free plan — there's nothing to cancel.", "FREE_PLAN");
  }
  sub.cancelAtPeriodEnd = true;
  sub.pendingPlanId = null;
  logActivity(user, "Cancellation scheduled — access continues until the period ends");
}

export function resumeSubscription(user: User): void {
  if (!user.subscription.cancelAtPeriodEnd) {
    throw new SubscriptionError("Your membership isn't scheduled to cancel.", "BAD_REQUEST");
  }
  user.subscription.cancelAtPeriodEnd = false;
  logActivity(user, "Cancellation reversed — membership stays active");
}

export function clearPendingChange(user: User): void {
  const pending = user.subscription.pendingPlanId;
  if (!pending) {
    throw new SubscriptionError("There's no scheduled plan change to remove.", "BAD_REQUEST");
  }
  user.subscription.pendingPlanId = null;
  logActivity(user, `Removed the scheduled switch to ${getPlan(pending).name}`);
}

export function reseedForTests(user: User): void {
  user.subscription = makeSubscription(user.subscription.planId, user.subscription.cycle);
}
