import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { site } from "@/config/site";
import { fmtDate } from "@/lib/format";
import PlansGrid from "@/components/PlansGrid";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Plans" };

export default async function PlansPage() {
  const user = await requireCurrentUser();
  const subscription = user.subscription;
  return (
    <div className="space-y-10">
      <header className="text-center"><p className="text-xs font-bold text-[#6d4aff]">Membership plans</p><h1 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">Invest in skills that stay with you.</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#756f7b]">Start free, unlock the entire library with Pro, or get personal guidance with Mentor. Prices are in {site.currency.label}.</p></header>
      {subscription.cancelAtPeriodEnd && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><span><strong>Your subscription is scheduled to end on {fmtDate(subscription.currentPeriodEnd)}.</strong> You keep access until then.</span><Link href="/dashboard/billing" className="inline-flex items-center gap-1 font-black">Manage billing <Icon name="arrow-right" size={13} /></Link></div>}
      <PlansGrid currentPlanId={subscription.planId} currentCycle={subscription.cycle} pendingPlanId={subscription.pendingPlanId} cancelAtPeriodEnd={subscription.cancelAtPeriodEnd} periodEnd={subscription.currentPeriodEnd} cardLabel={`${user.paymentMethod.brand} ending in ${user.paymentMethod.last4}`} />
      <section className="open-columns grid gap-0 xl:grid-cols-3">{[
        ["shield", "Safe plan changes", "Upgrades apply now; downgrades wait until your paid period ends."],
        ["card", "Clear billing", "Every simulated payment creates an invoice you can review."],
        ["spark", "Cancel anytime", "Keep learning until the end of the period you already paid for."],
      ].map(([icon, title, body]) => <div key={title} className="open-column flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={icon as "shield"} size={17} /></span><div><p className="text-xs font-extrabold">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#918a97]">{body}</p></div></div>)}</section>
      <p className="text-center text-[9px] leading-4 text-[#9a939f]">Demo note: checkout and invoices are fully interactive, but no real payment is processed. Connect Stripe, Paystack or Flutterwave before production.</p>
    </div>
  );
}
