import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import BillingApp from "@/components/BillingApp";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  const sub = user.subscription;
  return (
    <BillingApp
      planName={plan.name}
      cycle={sub.cycle}
      price={sub.cycle === "yearly" ? plan.yearly : plan.monthly}
      periodStart={sub.currentPeriodStart}
      periodEnd={sub.currentPeriodEnd}
      cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
      pendingPlanName={sub.pendingPlanId ? getPlan(sub.pendingPlanId).name : null}
      invoices={user.invoices}
      likesUsed={user.usage.count}
      likeLimit={plan.limits.likesPerPeriod}
      matchesUsed={user.matches.length}
      matchLimit={plan.limits.matches}
      history={user.usage.history}
      insights={plan.entitlements.insights}
    />
  );
}
