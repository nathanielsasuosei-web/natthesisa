"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BillingCycle, PlanId } from "@/lib/plans";

interface Props {
  planId: PlanId;
  cycle: BillingCycle;
  cancelAtPeriodEnd: boolean;
  pendingPlanName: string | null;
  isFree: boolean;
}

export default function BillingActions({ planId, cycle, cancelAtPeriodEnd, pendingPlanName, isFree }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);

  async function act(body: Record<string, unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) setMessage({ error: true, text: data.error ?? "The change could not be completed." });
      else {
        setMessage({ text: success });
        setConfirmCancel(false);
        router.refresh();
      }
    } catch {
      setMessage({ error: true, text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
        <div><p className="mb-2 text-[9px] font-black uppercase tracking-[.13em] text-[#918a97]">Billing frequency</p><div className="flex gap-2">{(["monthly", "yearly"] as BillingCycle[]).map((item) => <button key={item} onClick={() => act({ action: "changePlan", planId, cycle: item }, `Billing changed to ${item}.`)} disabled={busy || isFree || item === cycle || cancelAtPeriodEnd} className={`rounded-lg px-3 py-2 text-[10px] font-extrabold capitalize transition ${item === cycle ? "bg-[#1b1822] text-white" : "border border-[#ddd9e2] bg-white text-[#6d6673] hover:border-violet-300 disabled:opacity-45"}`}>{item}{item === "yearly" ? " · save 17%" : ""}</button>)}</div></div>
        <div><p className="mb-2 text-[9px] font-black uppercase tracking-[.13em] text-[#918a97]">Subscription</p><div className="flex flex-wrap gap-2">{cancelAtPeriodEnd ? <button onClick={() => act({ action: "resume" }, "Your subscription is active again.")} disabled={busy} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-extrabold text-white">Resume subscription</button> : isFree ? <span className="block py-2 text-[10px] font-semibold text-[#918a97]">Explorer is free—nothing to cancel.</span> : confirmCancel ? <><button onClick={() => act({ action: "cancel" }, "Cancellation scheduled for the end of your billing period.")} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-extrabold text-white">{busy ? "Working…" : "Confirm cancellation"}</button><button onClick={() => setConfirmCancel(false)} className="rounded-lg border border-[#ddd9e2] px-3 py-2 text-[10px] font-bold">Keep plan</button></> : <button onClick={() => setConfirmCancel(true)} disabled={busy} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">Cancel subscription</button>}{pendingPlanName && <button onClick={() => act({ action: "clearPending" }, "Scheduled plan change removed.")} disabled={busy} className="rounded-lg border border-[#ffd0bd] bg-[#fff4ee] px-3 py-2 text-[10px] font-bold text-[#d85a34]">Undo switch to {pendingPlanName}</button>}</div></div>
      </div>
      {message && <p className={`mt-4 text-[10px] font-bold ${message.error ? "text-red-700" : "text-emerald-700"}`}>{message.text}</p>}
    </div>
  );
}
