import { getCurrentAdmin } from "@/lib/session";
import { computeStats, estimateMrr, toAdminRow } from "@/lib/admin";
import { getStore } from "@/lib/store";
import { fmtMoney } from "@/lib/format";
import AdminUsersTable from "@/components/AdminUsersTable";

export default async function AdminPage() {
  const admin = (await getCurrentAdmin())!;
  const stats = computeStats();
  const mrr = estimateMrr();
  const users = [...getStore().users.values()]
    .map(toAdminRow)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  const cards = [
    { label: "Accounts", value: stats.totalUsers.toLocaleString("en-US"), sub: `${stats.members} members · ${stats.admins} admin${stats.admins === 1 ? "" : "s"}` },
    { label: "Suspended", value: stats.suspended.toLocaleString("en-US"), sub: stats.suspended === 0 ? "All in good standing" : "Blocked from acting" },
    { label: "Matches made", value: stats.totalMatches.toLocaleString("en-US"), sub: `${stats.totalDates} dates planned · ${stats.datesBeenOn} been on` },
    { label: "Likes spent", value: stats.totalLikes.toLocaleString("en-US"), sub: "Across all members, this period" },
    { label: "Revenue (all time)", value: fmtMoney(stats.totalRevenue), sub: `${stats.invoiceCount} invoice${stats.invoiceCount === 1 ? "" : "s"} issued` },
    { label: "Est. MRR", value: fmtMoney(mrr), sub: "Active plans, yearly normalized" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin console</h1>
        <p className="mt-1 text-sm text-slate-600">
          Site-wide health and member management. Every action here is enforced server-side.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className="animate-fade-up rounded-2xl border border-rose-100 bg-white p-5"
            style={{ animationDelay: `${0.04 * i}s` }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <section className="rounded-2xl border border-rose-100 bg-white p-6">
        <h2 className="font-semibold">Membership distribution</h2>
        <div className="mt-4 space-y-3">
          {stats.byPlan.map((p) => {
            const pct = stats.totalUsers === 0 ? 0 : Math.round((p.count / stats.totalUsers) * 100);
            return (
              <div key={p.planId} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-sm font-medium">{p.planName}</span>
                <div className="h-2.5 flex-1 rounded-full bg-rose-50">
                  <div
                    className={`h-2.5 rounded-full ${
                      p.planId === "elite"
                        ? "bg-gradient-to-r from-rose-500 to-fuchsia-500"
                        : p.planId === "premium"
                          ? "bg-rose-500"
                          : "bg-rose-300"
                    }`}
                    style={{ width: `${Math.max(pct, p.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-slate-500">
                  {p.count.toLocaleString("en-US")} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Members table */}
      <AdminUsersTable initialUsers={users} adminId={admin.id} />

      <p className="rounded-xl border border-rose-100 bg-white p-4 text-xs text-slate-500">
        Admin plan changes are comp&apos;d — no invoice is issued. Suspended members can still sign in
        but every like, match and membership action is rejected by the server until reinstated.
      </p>
    </div>
  );
}
