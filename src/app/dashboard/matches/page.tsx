import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import MatchesView from "@/components/MatchesView";
import ExportButton from "@/components/ExportButton";

export default async function MatchesPage() {
  const user = (await getCurrentUser())!;
  const plan = getPlan(user.subscription.planId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
          <p className="mt-1 text-sm text-slate-600">
            {plan.limits.matches === null
              ? "Unlimited matches on your plan — you charmer."
              : `${user.matches.length} of ${plan.limits.matches} match slots used on the ${plan.name} plan.`}
          </p>
        </div>
        {plan.entitlements.export && <ExportButton />}
      </div>
      <MatchesView
        matches={user.matches}
        maxMatches={plan.limits.matches}
        likesUsed={user.usage.count}
        likeLimit={plan.limits.likesPerPeriod}
      />
    </div>
  );
}
