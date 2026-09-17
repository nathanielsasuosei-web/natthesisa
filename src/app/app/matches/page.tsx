import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import MatchesApp from "@/components/MatchesApp";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  return (
    <MatchesApp
      matches={user.matches}
      matchLimit={plan.limits.matches}
      planName={plan.name}
      firstName={user.name}
      now={Date.now()}
      suspended={Boolean(user.suspended)}
      myInterests={user.profile.interests}
    />
  );
}
