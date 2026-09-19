import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { getPlan } from "@/lib/plans";
import { fmtDate, fmtMoney } from "@/lib/format";
import BillingActions from "@/components/BillingActions";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireCurrentUser();
  const subscription = user.subscription;
  const plan = getPlan(subscription.planId);
  const pending = subscription.pendingPlanId ? getPlan(subscription.pendingPlanId) : null;
  const amount = subscription.cycle === "yearly" ? plan.yearly : plan.monthly;
  const status = subscription.cancelAtPeriodEnd ? { label: "Cancelling", style: "bg-amber-100 text-amber-800", note: `Access continues until ${fmtDate(subscription.currentPeriodEnd)}.` } : pending ? { label: "Change scheduled", style: "bg-orange-100 text-orange-800", note: `Moves to ${pending.name} on ${fmtDate(subscription.currentPeriodEnd)}.` } : { label: "Active", style: "bg-emerald-100 text-emerald-700", note: plan.id === "free" ? "No charge on the Explorer plan." : `Renews on ${fmtDate(subscription.currentPeriodEnd)}.` };

  return (
    <div className="space-y-10">
      <header><p className="text-xs font-bold text-[#8a8390]">Subscription & payments</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Billing</h1><p className="mt-1.5 text-sm text-[#756f7b]">Manage your plan, payment method and invoice history.</p></header>

      <section className="open-surface overflow-hidden rounded-[24px] border border-[#e5e1e8] bg-white shadow-[0_10px_32px_rgba(31,24,45,.04)]">
        <div className="grid lg:grid-cols-[1fr_260px]">
          <div className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2.5"><h2 className="text-xl font-black tracking-[-.035em]">{plan.name} plan</h2><span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wider ${status.style}`}>{status.label}</span></div><p className="mt-2 text-xs text-[#77717e]">{status.note}</p></div><Link href="/dashboard/plans" className="inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-[10px] font-extrabold text-white">Compare plans <Icon name="arrow-right" size={13} /></Link></div>
            <div className="mt-7 grid gap-4 border-y border-[#efecf1] py-5 sm:grid-cols-3"><div><p className="text-[9px] font-bold text-[#918a97]">Plan price</p><p className="mt-1 text-xs font-extrabold">{fmtMoney(amount)} <span className="font-medium text-[#918a97]">/ {subscription.cycle === "yearly" ? "year" : "month"}</span></p></div><div><p className="text-[9px] font-bold text-[#918a97]">Current period</p><p className="mt-1 text-xs font-extrabold">{fmtDate(subscription.currentPeriodStart)} — {fmtDate(subscription.currentPeriodEnd)}</p></div><div><p className="text-[9px] font-bold text-[#918a97]">Billing cycle</p><p className="mt-1 text-xs font-extrabold capitalize">{subscription.cycle}</p></div></div>
            <div className="mt-5"><BillingActions planId={subscription.planId} cycle={subscription.cycle} cancelAtPeriodEnd={subscription.cancelAtPeriodEnd} pendingPlanName={pending?.name ?? null} isFree={plan.id === "free"} /></div>
          </div>
          <div className="border-t border-[#ece9ef] p-5 lg:border-l lg:border-t-0 lg:pl-7"><p className="text-[9px] font-black uppercase tracking-[.13em] text-[#817a87]">Payment method</p><div className="mt-4 rounded-2xl bg-gradient-to-br from-[#202a67] to-[#10152f] p-4 text-white shadow-lg"><div className="flex items-center justify-between"><span className="text-[9px] font-black italic tracking-wider">VISA</span><Icon name="card" size={17} className="text-white/60" /></div><p className="mt-8 font-mono text-sm tracking-[.17em]">•••• •••• •••• {user.paymentMethod.last4}</p><div className="mt-4 flex justify-between text-[8px] uppercase text-white/55"><span>{user.name}</span><span>12/29</span></div></div><button disabled className="mt-3 w-full rounded-xl border border-[#ded9e3] bg-white py-2.5 text-[10px] font-bold text-[#aaa4b0]">Update card in production</button><p className="mt-3 flex gap-1.5 text-[8px] leading-4 text-[#918a97]"><Icon name="shield" size={12} className="shrink-0 text-emerald-600" /> Demo card only. No real payment details are stored.</p></div>
        </div>
      </section>

      <section className="open-surface overflow-hidden rounded-[22px] border border-[#e5e1e8] bg-white">
        <div className="flex items-center justify-between border-b border-[#ece9ef] px-5 py-4 sm:px-6"><div><h2 className="text-sm font-extrabold">Invoice history</h2><p className="mt-1 text-[10px] text-[#918a97]">A record of every completed plan payment.</p></div><Icon name="download" size={17} className="text-[#918a97]" /></div>
        {user.invoices.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b border-[#efecf1] bg-[#faf9fb] text-[8px] font-black uppercase tracking-wider text-[#918a97]"><th className="px-6 py-3">Invoice</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-6 py-3 text-right">Status</th></tr></thead><tbody>{user.invoices.map((invoice) => <tr key={invoice.id} className="border-b border-[#f0edf2] last:border-0"><td className="px-6 py-4 font-mono text-[10px] font-bold text-[#5e3de0]">{invoice.number}</td><td className="px-4 py-4 text-[10px] font-semibold text-[#5f5965]">{invoice.description}</td><td className="px-4 py-4 text-[10px] text-[#817a87]">{fmtDate(invoice.date)}</td><td className="px-4 py-4 text-right text-[10px] font-extrabold">{fmtMoney(invoice.amount)}</td><td className="px-6 py-4 text-right"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700">Paid</span></td></tr>)}</tbody></table></div> : <div className="px-6 py-12 text-center"><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#f0edf3] text-[#817a87]"><Icon name="card" size={20} /></span><p className="mt-3 text-xs font-extrabold">No invoices yet</p><p className="mt-1 text-[10px] text-[#918a97]">Paid plan purchases will appear here.</p></div>}
      </section>

      <div className="open-callout flex gap-3 text-[#5971a7]"><Icon name="shield" size={18} className="mt-0.5 shrink-0 text-[#3f67c8]" /><div><p className="text-xs font-extrabold text-[#294b9b]">Demonstration payment system</p><p className="mt-1 text-[10px] leading-5 text-[#5971a7]">Plan rules, invoices, cancellation and access control are functional. Payments are simulated; connect a verified payment provider and database before accepting money.</p></div></div>
    </div>
  );
}
