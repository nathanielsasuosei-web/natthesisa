import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getPlan, describeLimit } from "@/lib/plans";
import { profileCompleteness, summarizeLocation, ageFrom } from "@/lib/profile";
import { fmtDate, fmtMoney, fmtDayKey } from "@/lib/format";
import Avatar from "@/components/Avatar";
import UsageBar from "@/components/UsageBar";
import UsageChart from "@/components/UsageChart";

export default async function OverviewPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  const maxMatches = plan.limits.matches;
  const maxLikes = plan.limits.likesPerPeriod;
  const datesBeen = user.matches.reduce((n, m) => n + m.dateIdeas.filter((t) => t.done).length, 0);
  const datesTotal = user.matches.reduce((n, m) => n + m.dateIdeas.length, 0);
  const maxHistory = Math.max(...user.usage.history.map((h) => h.count), 1);
  const bestMatch = user.matches.reduce(
    (a, b) => (b && (!a || b.compatibility > a.compatibility) ? b : a),
    user.matches[0] ?? null
  );

  const completeness = profileCompleteness(user.profile);
  const subBadge = user.subscription.cancelAtPeriodEnd
    ? { text: `Cancels ${fmtDate(user.subscription.currentPeriodEnd)}`, cls: "bg-amber-100 text-amber-700" }
    : user.subscription.pendingPlanId
      ? { text: "Change scheduled", cls: "bg-rose-100 text-rose-700" }
      : { text: "Active", cls: "bg-emerald-100 text-emerald-700" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(" ")[0]} 💘</h1>
          <p className="mt-1 text-sm text-slate-600">Here's what's happening in your love life.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 rounded-xl border border-rose-100 bg-white px-3 py-2 text-left transition hover:border-rose-300"
          >
            <Avatar name={user.name} photo={user.profile.photo} emoji={user.profile.avatar} size={34} />
            <span className="pr-1">
              <span className="block text-sm font-semibold leading-tight">
                {user.name}
                {ageFrom(user.profile.birthDate) !== null ? `, ${ageFrom(user.profile.birthDate)}` : ""}
              </span>
              <span className="block text-[11px] text-slate-500">
                {summarizeLocation(user.profile) || "Add your city"} · {completeness.percent}% complete
              </span>
            </span>
          </Link>
          <Link href="/dashboard/matches" className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500">
            Go to matches
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="animate-fade-up rounded-2xl border border-rose-100 bg-white p-5" style={{ animationDelay: "0.05s" }}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active matches</p>
          <p className="mt-2 text-2xl font-bold">
            {user.matches.length}
            <span className="text-base font-medium text-slate-400"> / {describeLimit(maxMatches)}</span>
          </p>
          <div className="mt-3">
            <UsageBar value={user.matches.length} max={maxMatches} />
          </div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Dates been on</p>
          <p className="mt-2 text-2xl font-bold">
            {datesBeen}
            <span className="text-base font-medium text-slate-400"> / {datesTotal} planned</span>
          </p>
          <div className="mt-3">
            <UsageBar value={datesBeen} max={Math.max(datesTotal, 1)} tone="emerald" />
          </div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Likes this period</p>
          <p className="mt-2 text-2xl font-bold">
            {user.usage.count.toLocaleString("en-US")}
            <span className="text-base font-medium text-slate-400"> / {describeLimit(maxLikes)}</span>
          </p>
          <div className="mt-3">
            <UsageBar value={user.usage.count} max={maxLikes} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Activity */}
        <section className="animate-fade-up rounded-2xl border border-rose-100 bg-white p-6 lg:col-span-3" style={{ animationDelay: "0.29s" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Likes & sparks — last 7 days</h2>
            {!plan.entitlements.insights && (
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

        {/* Membership snapshot */}
        <section className="rounded-2xl border border-rose-100 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your membership</h2>
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
                <dd className="font-medium text-rose-600">
                  → {getPlan(user.subscription.pendingPlanId).name}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-5 flex gap-2">
            <Link href="/dashboard/billing" className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-400">
              Manage billing
            </Link>
            <Link href="/dashboard/plans" className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-rose-500">
              {plan.id === "elite" ? "View plans" : "Upgrade"}
            </Link>
          </div>
        </section>
      </div>

      {/* Gated love insights (Premium+) */}
      {plan.entitlements.insights ? (
        <section className="rounded-2xl border border-rose-100 bg-white p-6">
          <h2 className="font-semibold">Love insights</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-rose-50/60 p-4">
              <p className="text-xs font-medium text-slate-500">Date follow-through</p>
              <p className="mt-1 text-xl font-bold">
                {datesTotal === 0 ? "—" : `${Math.round((datesBeen / datesTotal) * 100)}%`}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/60 p-4">
              <p className="text-xs font-medium text-slate-500">Best compatibility</p>
              <p className="mt-1 text-xl font-bold">
                {bestMatch ? `${bestMatch.compatibility}% · ${bestMatch.name}` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/60 p-4">
              <p className="text-xs font-medium text-slate-500">Likes / day avg</p>
              <p className="mt-1 text-xl font-bold">
                {(user.usage.history.reduce((n, h) => n + h.count, 0) / 7).toFixed(1)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-6">
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="scale-110 px-6 opacity-40 blur-[3px] select-none" aria-hidden>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-16 rounded-xl bg-rose-100" />
                <div className="h-16 rounded-xl bg-rose-100" />
                <div className="h-16 rounded-xl bg-rose-100" />
              </div>
            </div>
          </div>
          <div className="relative flex flex-col items-center py-4 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-rose-600 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" />
              </svg>
            </span>
            <h2 className="mt-3 font-semibold">Love insights is a Premium perk</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Compatibility stats, date follow-through and trends unlock with Premium or Elite.
            </p>
            <Link href="/dashboard/plans" className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500">
              Upgrade to Premium
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
