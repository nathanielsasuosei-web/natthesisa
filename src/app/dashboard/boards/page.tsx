import { getCurrentUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import BoardsView from "@/components/BoardsView";
import ExportButton from "@/components/ExportButton";

export default async function BoardsPage() {
  const user = (await getCurrentUser())!;
  const plan = getPlan(user.subscription.planId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boards</h1>
          <p className="mt-1 text-sm text-slate-600">
            {plan.limits.boards === null
              ? "Unlimited boards on your plan."
              : `${user.boards.length} of ${plan.limits.boards} boards used on the ${plan.name} plan.`}
          </p>
        </div>
        {plan.entitlements.export && <ExportButton />}
      </div>
      <BoardsView
        boards={user.boards}
        maxBoards={plan.limits.boards}
        actionsUsed={user.usage.count}
        actionLimit={plan.limits.actionsPerPeriod}
      />
    </div>
  );
}
