import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import MembershipApp from "@/components/MembershipApp";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  const sub = user.subscription;
  return (
    <MembershipApp
      planId={plan.id}
      cycle={sub.cycle}
      cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
      pendingPlanId={sub.pendingPlanId}
      periodEnd={sub.currentPeriodEnd}
      likesUsed={user.usage.count}
      matchesUsed={user.matches.length}
      suspended={Boolean(user.suspended)}
    />
  );
}
