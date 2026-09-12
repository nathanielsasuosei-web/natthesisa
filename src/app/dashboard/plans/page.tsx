import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { fmtDate } from "@/lib/format";
import PlansGrid from "@/components/PlansGrid";
import Link from "next/link";

export default async function PlansPage() {
  const user = (await getCurrentUser())!;
  const sub = user.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upgrades apply immediately; downgrades are scheduled for the end of your billing period.
        </p>
      </div>

      {sub.cancelAtPeriodEnd && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span>
            <strong>Heads up:</strong> your subscription cancels on {fmtDate(sub.currentPeriodEnd)}.
            You can resume any time before then.
          </span>
          <Link href="/dashboard/billing" className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500">
            Manage in billing
          </Link>
        </div>
      )}

      <PlansGrid
        currentPlanId={sub.planId}
        currentCycle={sub.cycle}
        pendingPlanId={sub.pendingPlanId}
        cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
        periodEnd={sub.currentPeriodEnd}
      />
    </div>
  );
}
