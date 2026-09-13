"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PLANS,
  PlanId,
  BillingCycle,
  PLAN_TIER,
  formatMoney,
} from "@/lib/plans";
import { fmtDate } from "@/lib/format";

interface Props {
  currentPlanId: PlanId;
  currentCycle: BillingCycle;
  pendingPlanId: PlanId | null;
  cancelAtPeriodEnd: boolean;
  periodEnd: string;
}

interface ConfirmState {
  planId: PlanId;
  cycle: BillingCycle;
  kind: "upgrade" | "downgrade" | "cycle";
}

export default function PlansGrid({
  currentPlanId,
  currentCycle,
  pendingPlanId,
  cancelAtPeriodEnd,
  periodEnd,
}: Props) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle);
  const [confirming, setConfirming] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submitChange() {
    if (!confirming || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changePlan", planId: confirming.planId, cycle: confirming.cycle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setConfirming(null);
      setNotice(
        data.mode === "upgraded"
          ? `You're now on ${data.planName} — enjoy! Charged ${formatMoney(data.charged)} today.`
          : data.mode === "scheduled"
            ? "Downgrade scheduled — it takes effect when the current period ends."
            : data.mode === "cycle"
              ? "Billing cycle updated."
              : "Done."
      );
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function undoPending() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearPending" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setNotice("Scheduled change removed.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Cycle toggle */}
      <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white p-1 w-fit mx-auto">
        {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold capitalize transition",
              cycle === c ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
          >
            {c}
            {c === "yearly" && (
              <span className={`ml-1.5 text-[10px] font-bold uppercase ${cycle === c ? "text-emerald-300" : "text-emerald-600"}`}>
                −17%
              </span>
            )}
          </button>
        ))}
      </div>

      {(notice || error) && (
        <p className={`mx-auto mb-6 w-fit rounded-lg px-4 py-2 text-sm font-medium ${error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
          {error ?? notice}
        </p>
      )}

      {/* Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPending = plan.id === pendingPlanId;
          const upgrade = PLAN_TIER[plan.id] > PLAN_TIER[currentPlanId];
          const downgrade = PLAN_TIER[plan.id] < PLAN_TIER[currentPlanId];
          const price = plan.id === currentPlanId ? undefined : cycle === "yearly" ? plan.yearly : plan.monthly;

          let cta: { label: string; kind: ConfirmState["kind"] } | null = null;
          if (isPending) cta = null;
          else if (isCurrent && cycle !== currentCycle && !cancelAtPeriodEnd)
            cta = { label: `Switch to ${cycle} billing`, kind: "cycle" };
          else if (upgrade) cta = { label: `Upgrade to ${plan.name}`, kind: "upgrade" };
          else if (downgrade) cta = { label: `Downgrade to ${plan.name}`, kind: "downgrade" };

          return (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border bg-white p-7",
                plan.featured && !isCurrent ? "border-rose-600 shadow-xl shadow-rose-600/10" : "",
                isCurrent ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200",
              ].join(" ")}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                  {cancelAtPeriodEnd ? "Current — cancelling" : "Your plan"}
                </span>
              )}
              {isPending && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
                  Scheduled for {fmtDate(periodEnd)}
                </span>
              )}

              <h3 className="font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
              <p className="mt-5">
                <span className="text-4xl font-bold tracking-tight">{formatMoney(cycle === "yearly" ? plan.yearly : plan.monthly)}</span>
                <span className="text-slate-500"> /{cycle === "yearly" ? "yr" : "mo"}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-4 shrink-0 text-emerald-500">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {isPending ? (
                  <button
                    onClick={undoPending}
                    disabled={busy}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 disabled:opacity-50"
                  >
                    Keep {plan.name} — undo switch
                  </button>
                ) : cta ? (
                  <button
                    onClick={() => setConfirming({ planId: plan.id, cycle, kind: cta.kind })}
                    disabled={busy}
                    className={[
                      "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
                      cta.kind === "upgrade"
                        ? "bg-rose-600 text-white hover:bg-rose-500"
                        : cta.kind === "downgrade"
                          ? "border border-slate-300 text-slate-700 hover:border-slate-400"
                          : "bg-slate-900 text-white hover:bg-slate-700",
                    ].join(" ")}
                  >
                    {cta.label}
                  </button>
                ) : (
                  <span className={[
                    "block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold",
                    isCurrent ? "border border-emerald-500 bg-emerald-50 text-emerald-700" : "text-slate-400",
                  ].join(" ")}>
                    {isCurrent ? (cancelAtPeriodEnd ? "Active until period end" : "Current plan") : "—"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-6 backdrop-blur-sm"
          onClick={() => !busy && setConfirming(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const plan = PLANS.find((p) => p.id === confirming.planId)!;
              const price = confirming.cycle === "yearly" ? plan.yearly : plan.monthly;
              const isUpgradeKind = confirming.kind === "upgrade";
              return (
                <>
                  <h3 className="text-lg font-bold">
                    {isUpgradeKind
                      ? `Upgrade to ${plan.name}?`
                      : confirming.kind === "downgrade"
                        ? `Schedule downgrade to ${plan.name}?`
                        : `Switch to ${confirming.cycle} billing?`}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {isUpgradeKind && (
                      <>
                        Your new period starts today and you'll be charged{" "}
                        <strong>{formatMoney(price)}</strong> ({confirming.cycle}). Your likes allowance resets.
                      </>
                    )}
                    {confirming.kind === "downgrade" && (
                      <>
                        You keep your current features until <strong>{fmtDate(periodEnd)}</strong>, then
                        move to <strong>{plan.name}</strong> ({confirming.cycle}). No charge today.
                      </>
                    )}
                    {confirming.kind === "cycle" && (
                      <>
                        You'll be charged <strong>{formatMoney(price)}</strong> today for a new{" "}
                        {confirming.cycle} period of {plan.name}.
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Demo — no real payment will be taken.</p>
                  {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => setConfirming(null)}
                      disabled={busy}
                      className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400"
                    >
                      Not now
                    </button>
                    <button
                      onClick={submitChange}
                      disabled={busy}
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                    >
                      {busy ? "Working…" : isUpgradeKind ? "Confirm upgrade" : confirming.kind === "downgrade" ? "Schedule downgrade" : "Confirm switch"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
