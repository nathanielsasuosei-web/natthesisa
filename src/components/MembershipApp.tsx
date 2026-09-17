"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PLANS, describeLimit, type BillingCycle, type PlanId } from "@/lib/plans";
import { fmtDateShort, fmtMoney } from "@/lib/format";
import { Alert, Button, Panel, SectionLabel, Segmented, messageFrom, sendJson, useToast } from "./forms";

/**
 * Membership — plan change, cycle switch, cancel / resume / undo a scheduled
 * change. Every action is POST /api/subscription with an explicit `action`;
 * the response's `mode` decides whether we say "upgraded", "scheduled for the
 * period end" or "cycle changed", because those are genuinely different things.
 */
export default function MembershipApp({
  planId,
  cycle,
  cancelAtPeriodEnd,
  pendingPlanId,
  periodEnd,
  likesUsed,
  matchesUsed,
  suspended,
}: {
  planId: PlanId;
  cycle: BillingCycle;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: PlanId | null;
  periodEnd: string;
  likesUsed: number;
  matchesUsed: number;
  suspended: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "info" | "warn"; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cycleTab, setCycleTab] = useState<BillingCycle>(cycle);

  const current = PLANS.find((p) => p.id === planId)!;
  const pending = pendingPlanId ? PLANS.find((p) => p.id === pendingPlanId) ?? null : null;

  async function act(body: Record<string, unknown>, fallback: string) {
    if (busy) return;
    setBusy(true);
    setResult(null);
    const { ok, body: data } = await sendJson("/api/subscription", { method: "POST", body: JSON.stringify(body) });
    setBusy(false);
    if (!ok) {
      setResult({ tone: "warn", text: messageFrom(data, fallback) });
      toast.show("Nothing changed");
      return;
    }
    const mode = typeof data.mode === "string" ? data.mode : "";
    const charged = typeof data.charged === "number" ? data.charged : 0;
    const planName = typeof data.planName === "string" ? data.planName : current.name;
    const effectiveAt = typeof data.effectiveAt === "string" ? data.effectiveAt : null;
    if (mode === "upgraded") {
      setResult({
        tone: "success",
        text: `You're on ${planName} now${charged > 0 ? ` — ${fmtMoney(charged)} charged to this period` : ""}.`,
      });
    } else if (mode === "scheduled") {
      setResult({
        tone: "info",
        text: `${planName} starts ${effectiveAt ? `on ${fmtDateShort(effectiveAt)}` : "at the end of this period"}. Nothing charged today.`,
      });
    } else if (mode === "cycle") {
      setResult({ tone: "success", text: `Billing cycle switched to ${String(data.cycle ?? body.cycle)}.` });
    } else if (body.action === "cancel") {
      setResult({
        tone: "info",
        text: `${planName} stays active until ${fmtDateShort(String(data.periodEnd ?? periodEnd))}, then you drop to Free.`,
      });
      setConfirmCancel(false);
    } else if (body.action === "resume") {
      setResult({ tone: "success", text: "Welcome back — the cancellation is off." });
    } else if (body.action === "clearPending") {
      setResult({ tone: "success", text: "Scheduled change cancelled — you're keeping your current plan." });
    } else {
      setResult({ tone: "success", text: "Saved." });
    }
    router.refresh();
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="px-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Membership</h1>
        <p className="mt-0.5 text-sm text-white/50">
          You&apos;re on <span className="font-semibold text-white">{current.name}</span> · {cycle} billing
        </p>
      </header>

      {result && <Alert tone={result.tone}>{result.text}</Alert>}
      {suspended && <Alert tone="warn">Suspended accounts can&apos;t change plans. Talk to support first.</Alert>}

      {/* status card */}
      <Panel className="overflow-hidden !p-0">
        <div className="shine relative bg-gradient-to-br from-rose-500/25 via-fuchsia-500/15 to-indigo-500/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Current plan</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{current.name}</p>
              <p className="mt-0.5 text-sm text-white/60">{current.tagline}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                cancelAtPeriodEnd
                  ? "bg-amber-400/15 text-amber-100 ring-amber-300/30"
                  : pending
                    ? "bg-rose-500/15 text-rose-100 ring-rose-300/30"
                    : "bg-emerald-400/15 text-emerald-100 ring-emerald-300/30"
              }`}
            >
              {cancelAtPeriodEnd ? "Cancels at period end" : pending ? "Change scheduled" : "Active"}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Cell label="Matches" value={describeLimit(current.limits.matches)} sub={`${matchesUsed} in use`} />
            <Cell label="Likes / period" value={describeLimit(current.limits.likesPerPeriod)} sub={`${likesUsed} used`} />
            <Cell label="Renews" value={fmtDateShort(periodEnd)} sub={current.id === "free" ? "no charge" : cycle === "yearly" ? "yearly" : "monthly"} />
          </dl>
        </div>
        {(cancelAtPeriodEnd || pending) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
            {cancelAtPeriodEnd ? (
              <>
                <p className="min-w-0 flex-1 text-xs text-white/55">
                  Keeping {current.name} is one tap — you won&apos;t lose anything until the period ends.
                </p>
                <Button variant="subtle" onClick={() => void act({ action: "resume" }, "Could not resume.")} busy={busy}>
                  Resume membership
                </Button>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 text-xs text-white/55">
                  {pending?.name} starts at the end of this period. Undo it if that wasn&apos;t the plan.
                </p>
                <Button variant="ghost" onClick={() => void act({ action: "clearPending" }, "Could not undo that.")} busy={busy}>
                  Keep {current.name}
                </Button>
              </>
            )}
          </div>
        )}
      </Panel>

      {/* cycle */}
      <section>
        <SectionLabel hint="yearly ≈ 2 months free">Billing cycle</SectionLabel>
        <div className="flex items-center gap-2">
          <Segmented
            value={cycleTab}
            onChange={setCycleTab}
            options={[
              { value: "monthly", label: `Monthly · ${fmtMoney(current.monthly)}` },
              { value: "yearly", label: `Yearly · ${fmtMoney(current.yearly)}` },
            ]}
          />
          <Button
            variant="ghost"
            disabled={cycleTab === cycle || busy || suspended || current.id === "free"}
            onClick={() => void act({ action: "changePlan", planId, cycle: cycleTab }, "Could not switch the cycle.")}
          >
            Switch
          </Button>
        </div>
      </section>

      {/* plans */}
      <section>
        <SectionLabel>Every plan</SectionLabel>
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === planId;
            const isPending = plan.id === pendingPlanId;
            const price = cycleTab === "yearly" ? plan.yearly : plan.monthly;
            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-3xl p-4 ring-1 transition ${
                  plan.featured
                    ? "bg-gradient-to-br from-rose-500/[0.16] to-fuchsia-500/[0.10] ring-rose-400/30"
                    : "bg-white/[0.05] ring-white/10"
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most picked
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold tracking-tight">{plan.name}</h3>
                  {isCurrent && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/70">Current</span>}
                  {isPending && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-100">Scheduled</span>}
                </div>
                <p className="mt-0.5 text-sm text-white/55">{plan.tagline}</p>
                <p className="mt-2 text-2xl font-bold">
                  {plan.id === "free" ? "Free" : fmtMoney(price)}
                  {plan.id !== "free" && <span className="text-sm font-medium text-white/45"> / {cycleTab === "yearly" ? "yr" : "mo"}</span>}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] text-white/70">
                      <span aria-hidden className="mt-0.5 text-emerald-300">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <Link href="/app/billing" className="press block rounded-2xl bg-white/[0.07] py-3 text-center text-sm font-semibold text-white/85 ring-1 ring-white/12">
                      View billing
                    </Link>
                  ) : (
                    <Button
                      full
                      variant={plan.featured ? "primary" : "ghost"}
                      busy={busy}
                      disabled={suspended}
                      onClick={() => void act({ action: "changePlan", planId: plan.id, cycle: cycleTab }, "Could not change the plan.")}
                    >
                      {PLAN_VERBS[plan.id] ?? "Switch"} {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionLabel>Manage</SectionLabel>
        <Panel className="!p-0">
          <div className="p-4">
            {cancelAtPeriodEnd ? (
              <Button full variant="subtle" onClick={() => void act({ action: "resume" }, "Could not resume.")} busy={busy}>
                Resume {current.name}
              </Button>
            ) : current.id === "free" ? (
              <p className="text-sm text-white/55">Nothing to cancel — the Free plan costs nothing and never renews.</p>
            ) : confirmCancel ? (
              <div className="space-y-3">
                <p className="text-sm text-rose-100">
                  Cancel {current.name}? You keep it until {fmtDateShort(periodEnd)}, then match slots drop to 3 and
                  likes to 25.
                </p>
                <div className="flex gap-2">
                  <Button full variant="danger" onClick={() => void act({ action: "cancel" }, "Could not cancel.")} busy={busy}>
                    Yes, cancel
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : (
              <Button full variant="ghost" onClick={() => setConfirmCancel(true)}>
                Cancel membership
              </Button>
            )}
          </div>
        </Panel>
        <p className="mt-2 px-1 text-xs text-white/35">
          This is a demo checkout: plan changes are applied to your account in the store, and no card is ever charged.
        </p>
      </section>

      {toast.node}
    </div>
  );
}

const PLAN_VERBS: Record<string, string> = {
  free: "Drop to",
  premium: "Upgrade to",
  elite: "Go all-in with",
};

function Cell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-black/25 px-2 py-2 ring-1 ring-white/10">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
      <p className="text-[10px] text-white/40">{sub}</p>
    </div>
  );
}
