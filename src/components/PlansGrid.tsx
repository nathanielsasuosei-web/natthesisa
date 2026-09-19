"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BillingCycle, PLAN_TIER, PLANS, PlanId, formatMoney } from "@/lib/plans";
import { fmtDate } from "@/lib/format";
import Icon from "./Icon";

interface Props {
  currentPlanId: PlanId;
  currentCycle: BillingCycle;
  pendingPlanId: PlanId | null;
  cancelAtPeriodEnd: boolean;
  periodEnd: string;
  cardLabel: string;
}

interface CheckoutState {
  planId: PlanId;
  cycle: BillingCycle;
  kind: "upgrade" | "downgrade" | "cycle";
}

export default function PlansGrid({ currentPlanId, currentCycle, pendingPlanId, cancelAtPeriodEnd, periodEnd, cardLabel }: Props) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function changePlan() {
    if (!checkout || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePlan", planId: checkout.planId, cycle: checkout.cycle }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Your plan could not be changed." });
        return;
      }
      const target = PLANS.find((plan) => plan.id === checkout.planId)!;
      setMessage({
        type: "ok",
        text: data.mode === "scheduled"
          ? `Your change to ${target.name} is scheduled for ${fmtDate(periodEnd)}.`
          : data.charged > 0
            ? `Welcome to ${target.name}. Demo payment of ${formatMoney(data.charged)} completed.`
            : `You are now on ${target.name}.`,
      });
      setCheckout(null);
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  async function clearPending() {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clearPending" }) });
    if (response.ok) {
      setMessage({ type: "ok", text: "Scheduled plan change removed." });
      router.refresh();
    } else {
      const data = await response.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error ?? "Could not remove the change." });
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="mx-auto mb-8 flex w-fit items-center rounded-xl border border-[#e1dde5] bg-white p-1 shadow-sm">
        {(["monthly", "yearly"] as BillingCycle[]).map((item) => <button key={item} onClick={() => setCycle(item)} className={`rounded-lg px-5 py-2 text-xs font-extrabold capitalize transition ${cycle === item ? "bg-[#1b1822] text-white" : "text-[#77717e] hover:text-[#312c37]"}`}>{item}{item === "yearly" && <span className={`ml-1.5 text-[8px] font-black uppercase ${cycle === item ? "text-[#c2f1df]" : "text-emerald-600"}`}>save 17%</span>}</button>)}
      </div>

      {message && <div className={`mx-auto mb-6 w-fit rounded-xl border px-4 py-2.5 text-xs font-semibold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</div>}

      <div className="open-plan-grid grid gap-0 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const current = plan.id === currentPlanId;
          const pending = plan.id === pendingPlanId;
          const upgrade = PLAN_TIER[plan.id] > PLAN_TIER[currentPlanId];
          const downgrade = PLAN_TIER[plan.id] < PLAN_TIER[currentPlanId];
          const price = cycle === "yearly" ? plan.yearly : plan.monthly;
          let action: CheckoutState | null = null;
          if (!pending && current && plan.id !== "free" && cycle !== currentCycle && !cancelAtPeriodEnd) action = { planId: plan.id, cycle, kind: "cycle" };
          else if (!pending && upgrade) action = { planId: plan.id, cycle, kind: "upgrade" };
          else if (!pending && downgrade) action = { planId: plan.id, cycle, kind: "downgrade" };
          return (
            <article key={plan.id} data-featured={plan.featured} className="open-plan flex flex-col transition">
              {current && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#6d4aff] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">{cancelAtPeriodEnd ? "Active until period end" : "Current plan"}</span>}
              {pending && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff7448] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">Scheduled {fmtDate(periodEnd)}</span>}
              {plan.featured && !current && <span className="absolute right-5 top-5 rounded-full bg-[#ffcf59] px-2.5 py-1 text-[8px] font-black uppercase text-[#4a3600]">Most popular</span>}
              <span className={`grid size-10 place-items-center rounded-xl ${plan.id === "elite" ? "bg-[#fff2e9] text-[#e45f35]" : "bg-[#f0ecff] text-[#6d4aff]"}`}><Icon name={plan.id === "free" ? "book" : plan.id === "premium" ? "spark" : "trophy"} size={19} /></span>
              <h3 className="mt-5 text-lg font-black">{plan.name}</h3><p className="mt-1 text-xs text-[#817a87]">{plan.tagline}</p>
              <p className="mt-6"><span className="text-4xl font-black tracking-[-.055em]">{formatMoney(price)}</span><span className="text-xs text-[#8d8694]"> / {cycle === "yearly" ? "year" : "month"}</span></p>{cycle === "yearly" && plan.monthly > 0 && <p className="mt-1 text-[9px] text-[#9c95a2]">Equivalent to {formatMoney(Math.round(plan.yearly / 12))}/month</p>}
              <div className="my-6 h-px bg-[#e6e2e9]" />
              <ul className="flex-1 space-y-3 text-xs text-[#625c68]">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2.5"><span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={9} /></span>{feature}</li>)}</ul>
              <div className="mt-7">{pending ? <button onClick={clearPending} disabled={busy} className="w-full rounded-xl border border-[#ffc8b3] bg-[#fff3ec] px-4 py-3 text-xs font-extrabold text-[#d95b35]">Undo scheduled change</button> : action ? <button onClick={() => setCheckout(action)} disabled={busy} className={`w-full rounded-xl px-4 py-3 text-xs font-extrabold transition hover:-translate-y-0.5 ${plan.featured && !current ? "bg-[#6d4aff] text-white hover:bg-[#7959f1]" : action.kind === "downgrade" ? "border border-[#ded9e3] text-[#655f6b]" : "bg-[#6d4aff] text-white"}`}>{action.kind === "upgrade" ? `Choose ${plan.name}` : action.kind === "downgrade" ? `Move to ${plan.name}` : `Use ${cycle} billing`}</button> : <div className="rounded-xl border border-[#e4e0e8] px-4 py-3 text-center text-xs font-bold text-[#918a97]">{current ? "Your current plan" : "Not available"}</div>}</div>
            </article>
          );
        })}
      </div>

      {checkout && (() => {
        const plan = PLANS.find((item) => item.id === checkout.planId)!;
        const amount = checkout.cycle === "yearly" ? plan.yearly : plan.monthly;
        const scheduled = checkout.kind === "downgrade";
        return <div className="fixed inset-0 z-50 grid place-items-center bg-[#15121c]/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCheckout(null); }}><div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#ece8ef] p-6"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">{scheduled ? "Plan change" : "Secure checkout"}</p><h2 className="mt-1.5 text-xl font-black tracking-[-.035em]">{scheduled ? `Move to ${plan.name}?` : `Upgrade to ${plan.name}`}</h2></div><button onClick={() => !busy && setCheckout(null)} className="grid size-8 place-items-center rounded-lg bg-[#f3f1f5] text-[#77717e]"><Icon name="close" size={15} /></button></div><div className="p-6"><div className="rounded-2xl bg-[#f7f5fa] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold">{plan.name} plan</p><p className="mt-1 text-[10px] capitalize text-[#918a97]">{checkout.cycle} billing</p></div><p className="text-lg font-black">{formatMoney(amount)}</p></div></div>{scheduled ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">You keep your current plan until <strong>{fmtDate(periodEnd)}</strong>. No payment is collected today.</div> : <><div className="mt-5"><p className="text-[10px] font-black uppercase tracking-wider text-[#817a87]">Payment method</p><div className="mt-2 flex items-center gap-3 rounded-xl border border-[#ded9e3] p-3.5"><span className="grid size-9 place-items-center rounded-lg bg-[#172b85] text-[9px] font-black italic text-white">VISA</span><div className="flex-1"><p className="text-xs font-bold">{cardLabel}</p><p className="mt-0.5 text-[9px] text-[#918a97]">Demo payment method</p></div><Icon name="check" size={15} className="text-emerald-600" /></div></div><div className="mt-5 flex items-center gap-2 text-[9px] leading-4 text-[#918a97]"><Icon name="shield" size={14} className="shrink-0 text-emerald-600" /> This demonstration simulates a successful payment. No real card is charged.</div></>}
                <button onClick={changePlan} disabled={busy} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#5e3ce8] disabled:opacity-60">{busy ? "Processing…" : scheduled ? "Schedule plan change" : `Confirm & pay ${formatMoney(amount)}`} {!busy && <Icon name="arrow-right" size={16} />}</button><p className="mt-3 text-center text-[9px] text-[#aaa4b0]">By continuing, you agree to the subscription terms.</p></div></div></div>;
      })()}
    </div>
  );
}
