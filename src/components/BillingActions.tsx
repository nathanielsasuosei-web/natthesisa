"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BillingCycle, PlanId } from "@/lib/plans";

interface Props {
  planId: PlanId;
  planName: string;
  cycle: BillingCycle;
  cancelAtPeriodEnd: boolean;
  pendingPlanName: string | null;
  isFree: boolean;
}

export default function BillingActions({
  planId,
  planName,
  cycle,
  cancelAtPeriodEnd,
  pendingPlanName,
  isFree,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(body: Record<string, unknown>, okMsg: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setMessage(okMsg);
      setConfirmCancel(false);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const pill = (c: BillingCycle, label: string) => (
    <button
      key={c}
      onClick={() => act({ action: "changePlan", planId, cycle: c }, `Billing switched to ${c}.`)}
      disabled={busy || c === cycle || cancelAtPeriodEnd}
      className={[
        "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
        c === cycle
          ? "bg-indigo-600 text-white"
          : "border border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Billing cycle</p>
        <div className="flex gap-2">
          {pill("monthly", "Monthly")}
          {pill("yearly", "Yearly · 2 months free")}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Subscription</p>
        <div className="flex flex-wrap items-center gap-2">
          {cancelAtPeriodEnd ? (
            <button
              onClick={() => act({ action: "resume" }, "Welcome back — your subscription is active again.")}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              Resume subscription
            </button>
          ) : isFree ? (
            <span className="text-xs text-slate-400">Free plan — nothing to cancel.</span>
          ) : confirmCancel ? (
            <>
              <button
                onClick={() => act({ action: "cancel" }, "Cancellation scheduled. Your plan stays active until the period ends.")}
                disabled={busy}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {busy ? "Working…" : "Confirm cancel"}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
              >
                Keep it
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={busy}
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 disabled:opacity-50"
            >
              Cancel subscription
            </button>
          )}
          {pendingPlanName && (
            <button
              onClick={() => act({ action: "clearPending" }, "Scheduled change removed.")}
              disabled={busy}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 disabled:opacity-50"
            >
              Undo switch to {pendingPlanName}
            </button>
          )}
        </div>
      </div>

      {(message || error) && (
        <p className={`w-full text-sm font-medium ${error ? "text-red-600" : "text-emerald-600"}`}>
          {error ?? message}
        </p>
      )}
    </div>
  );
}
