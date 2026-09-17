import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { site } from "@/config/site";
import { fmtDate, fmtMoney } from "@/lib/format";
import BillingActions from "@/components/BillingActions";

export default async function BillingPage() {
  const user = await requireUser();
  const plan = getPlan(user.subscription.planId);
  const sub = user.subscription;
  const pending = sub.pendingPlanId ? getPlan(sub.pendingPlanId) : null;

  const status = sub.cancelAtPeriodEnd
    ? {
        label: "Cancelling",
        cls: "bg-amber-100 text-amber-700",
        note: `Your ${plan.name} membership stays active until ${fmtDate(sub.currentPeriodEnd)}, then moves to Free.`,
      }
    : pending
      ? {
          label: "Change scheduled",
          cls: "bg-rose-100 text-rose-700",
          note: `Switches to ${pending.name} on ${fmtDate(sub.currentPeriodEnd)}.`,
        }
      : {
          label: "Active",
          cls: "bg-emerald-100 text-emerald-700",
          note: `Renews automatically on ${fmtDate(sub.currentPeriodEnd)}.`,
        };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your membership, billing cycle and invoices. All amounts in {site.currency.label} ({site.currency.symbol}).
        </p>
      </div>

      {/* Current membership */}
      <section className="rounded-2xl border border-rose-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{plan.name} membership</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}>{status.label}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {fmtMoney(sub.cycle === "yearly" ? plan.yearly : plan.monthly)} billed {sub.cycle}
              {plan.id === "free" && " — no charge"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{status.note}</p>
          </div>
          <Link
            href="/dashboard/plans"
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
          >
            {plan.id === "elite" ? "Compare plans" : "Change plan"}
          </Link>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-rose-50 pt-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Current period</dt>
            <dd className="mt-0.5 font-medium">
              {fmtDate(sub.currentPeriodStart)} → {fmtDate(sub.currentPeriodEnd)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Billing cycle</dt>
            <dd className="mt-0.5 font-medium capitalize">{sub.cycle}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Payment method</dt>
            <dd className="mt-0.5 font-medium">
              {user.paymentMethod.brand} •••• {user.paymentMethod.last4}
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">Demo</span>
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-rose-50 pt-6">
          <BillingActions
            planId={sub.planId}
            planName={plan.name}
            cycle={sub.cycle}
            cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
            pendingPlanName={pending?.name ?? null}
            isFree={plan.id === "free"}
          />
        </div>
      </section>

      {/* Invoices */}
      <section className="rounded-2xl border border-rose-100 bg-white">
        <div className="border-b border-rose-50 p-6">
          <h2 className="font-semibold">Invoice history</h2>
          <p className="mt-1 text-sm text-slate-500">Every membership change and renewal issues an invoice.</p>
        </div>
        {user.invoices.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No invoices yet. Upgrades and renewals will appear here automatically.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rose-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3 font-medium">Invoice</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {user.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-rose-50/60 last:border-0">
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{inv.number}</td>
                  <td className="px-6 py-3.5 text-slate-600">{fmtDate(inv.date)}</td>
                  <td className="px-6 py-3.5 text-slate-700">{inv.description}</td>
                  <td className="px-6 py-3.5 text-right font-medium">{fmtMoney(inv.amount)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="rounded-xl border border-rose-100 bg-white p-4 text-xs text-slate-500">
        This is a demo — payments are simulated and data is stored in memory. Cancellations keep your
        paid perks until the end of the period you've already paid for, just like the real thing.
      </p>
    </div>
  );
}
