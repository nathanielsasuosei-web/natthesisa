import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getPlan, describeLimit } from "@/lib/plans";
import { fmtDate, fmtMoney, fmtDayKey } from "@/lib/format";
import UsageBar from "@/components/UsageBar";
import UsageChart from "@/components/UsageChart";

export default async function OverviewPage() {
  const user = (await getCurrentUser())!;
  const plan = getPlan(user.subscription.planId);
  const maxBoards = plan.limits.boards;
  const maxActions = plan.limits.actionsPerPeriod;
  const tasksDone = user.boards.reduce((n, b) => n + b.tasks.filter((t) => t.done).length, 0);
  const tasksTotal = user.boards.reduce((n, b) => n + b.tasks.length, 0);
  const maxHistory = Math.max(...user.usage.history.map((h) => h.count), 1);

  const subBadge = user.subscription.cancelAtPeriodEnd
    ? { text: `Cancels ${fmtDate(user.subscription.currentPeriodEnd)}`, cls: "bg-amber-100 text-amber-700" }
    : user.subscription.pendingPlanId
      ? { text: "Change scheduled", cls: "bg-indigo-100 text-indigo-700" }
      : { text: "Active", cls: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-600">Here's what's happening in your workspace.</p>
        </div>
        <Link href="/dashboard/boards" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          Go to boards
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5" style={{ animationDelay: "0.05s" }}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Boards</p>
          <p className="mt-2 text-2xl font-bold">
            {user.boards.length}
            <span className="text-base font-medium text-slate-400"> / {describeLimit(maxBoards)}</span>
          </p>
          <div className="mt-3">
            <UsageBar value={user.boards.length} max={maxBoards} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tasks done</p>
          <p className="mt-2 text-2xl font-bold">
            {tasksDone}
            <span className="text-base font-medium text-slate-400"> / {tasksTotal}</span>
          </p>
          <div className="mt-3">
            <UsageBar value={tasksDone} max={Math.max(tasksTotal, 1)} tone="emerald" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Actions this period</p>
          <p className="mt-2 text-2xl font-bold">
            {user.usage.count.toLocaleString("en-US")}
            <span className="text-base font-medium text-slate-400"> / {describeLimit(maxActions)}</span>
          </p>
          <div className="mt-3">
            <UsageBar value={user.usage.count} max={maxActions} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Activity */}
        <section className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-3" style={{ animationDelay: "0.29s" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Activity — last 7 days</h2>
            {!plan.entitlements.analytics && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                Basic
              </span>
            )}
          </div>
          <UsageChart history={user.usage.history} max={maxHistory} />
          <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-slate-400">
            {user.usage.history.map((h) => (
              <span key={h.date}>{fmtDayKey(h.date)}</span>
            ))}
          </div>
        </section>

        {/* Subscription snapshot */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your subscription</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${subBadge.cls}`}>{subBadge.text}</span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight">{plan.name}</p>
          <p className="mt-1 text-sm capitalize text-slate-500">
            {user.subscription.cycle} billing ·{" "}
            {fmtMoney(user.subscription.cycle === "yearly" ? plan.yearly : plan.monthly)}
            {plan.id === "free" ? " — no charge" : user.subscription.cycle === "yearly" ? " / yr" : " / mo"}
          </p>
          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Current period ends</dt>
              <dd className="font-medium">{fmtDate(user.subscription.currentPeriodEnd)}</dd>
            </div>
            {user.subscription.pendingPlanId && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Scheduled change</dt>
                <dd className="font-medium text-indigo-600">
                  → {getPlan(user.subscription.pendingPlanId).name}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-5 flex gap-2">
            <Link href="/dashboard/billing" className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400">
              Manage billing
            </Link>
            <Link href="/dashboard/plans" className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-500">
              {plan.id === "business" ? "View plans" : "Upgrade"}
            </Link>
          </div>
        </section>
      </div>

      {/* Gated insights (Pro+) */}
      {plan.entitlements.analytics ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Insights</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Completion rate</p>
              <p className="mt-1 text-xl font-bold">
                {tasksTotal === 0 ? "—" : `${Math.round((tasksDone / tasksTotal) * 100)}%`}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Busiest day (7d)</p>
              <p className="mt-1 text-xl font-bold">
                {fmtDayKey(user.usage.history.reduce((a, b) => (b.count > a.count ? b : a)).date)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Actions / day avg</p>
              <p className="mt-1 text-xl font-bold">
                {(user.usage.history.reduce((n, h) => n + h.count, 0) / 7).toFixed(1)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="scale-110 px-6 opacity-40 blur-[3px] select-none" aria-hidden>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-16 rounded-xl bg-slate-200" />
                <div className="h-16 rounded-xl bg-slate-200" />
                <div className="h-16 rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="relative flex flex-col items-center py-4 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-indigo-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" />
              </svg>
            </span>
            <h2 className="mt-3 font-semibold">Insights is a Pro feature</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Completion rates, trends and averages unlock with Pro or Business.
            </p>
            <Link href="/dashboard/plans" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
              Upgrade to Pro
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
