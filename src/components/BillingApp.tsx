"use client";

import Link from "next/link";
import type { Invoice } from "@/lib/store";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Alert, Button, Meter, Panel, SectionLabel } from "./forms";

/**
 * Billing — the money side of the account: what you're on, what you've been
 * charged, and how much of the period you've burned through. Plan changes live
 * on /app/membership; this screen is read-mostly on purpose.
 */
export default function BillingApp({
  planName,
  cycle,
  price,
  periodStart,
  periodEnd,
  cancelAtPeriodEnd,
  pendingPlanName,
  invoices,
  likesUsed,
  likeLimit,
  matchesUsed,
  matchLimit,
  history,
  insights,
}: {
  planName: string;
  cycle: "monthly" | "yearly";
  price: number;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  pendingPlanName: string | null;
  invoices: Invoice[];
  likesUsed: number;
  likeLimit: number | null;
  matchesUsed: number;
  matchLimit: number | null;
  history: Array<{ date: string; count: number }>;
  insights: boolean;
}) {
  const max = Math.max(...history.map((h) => h.count), 1);
  const status = cancelAtPeriodEnd
    ? { tone: "warn" as const, text: `Ends ${fmtDate(periodEnd)}, then Free. Resume any time before that.` }
    : pendingPlanName
      ? { tone: "info" as const, text: `${pendingPlanName} starts ${fmtDate(periodEnd)}.` }
      : planName === "Free"
        ? { tone: "info" as const, text: "No card, no renewal — upgrade whenever you're ready." }
        : { tone: "success" as const, text: `Renews automatically on ${fmtDate(periodEnd)}.` };

  return (
    <div className="space-y-5 px-4 pb-8 pt-3">
      <header className="px-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">Billing</h1>
        <p className="mt-0.5 text-sm text-white/50">Invoices, renewal date and how you use the plan.</p>
      </header>

      <Panel className="overflow-hidden !p-0">
        <div className="flex items-start justify-between gap-3 p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{planName} membership</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {price === 0 ? "Free" : fmtMoney(price)}
              {price > 0 && <span className="text-sm font-medium text-white/45"> / {cycle === "yearly" ? "yr" : "mo"}</span>}
            </p>
            <p className="mt-1 text-xs text-white/45">
              Period {fmtDate(periodStart)} → {fmtDate(periodEnd)}
            </p>
          </div>
          <Link href="/app/membership" className="press shrink-0 rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/40">
            Change
          </Link>
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <Alert tone={status.tone}>{status.text}</Alert>
        </div>
      </Panel>

      <section>
        <SectionLabel>This period</SectionLabel>
        <Panel className="space-y-4">
          <Meter label="Likes & interactions" value={likesUsed} max={likeLimit} tone={likeLimit !== null && likesUsed / likeLimit > 0.8 ? "amber" : "rose"} />
          <Meter label="Active matches" value={matchesUsed} max={matchLimit} tone="emerald" />
          {insights ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Last 7 days</p>
              <div className="flex h-24 items-end gap-1.5">
                {history.map((h) => (
                  <div key={h.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-rose-500/50 to-fuchsia-400/80 transition-all"
                      style={{ height: `${Math.max(4, Math.round((h.count / max) * 100))}%` }}
                      title={`${h.count} on ${h.date}`}
                    />
                    <span className="text-[9px] text-white/35">{h.date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Alert
              tone="info"
              action={
                <Link href="/app/membership" className="press rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
                  Unlock
                </Link>
              }
            >
              Daily activity charts are a Premium perk.
            </Alert>
          )}
        </Panel>
      </section>

      <section>
        <SectionLabel hint={`${invoices.length} total`}>Invoices</SectionLabel>
        {invoices.length === 0 ? (
          <p className="rounded-3xl bg-white/[0.05] px-4 py-6 text-center text-sm text-white/45 ring-1 ring-white/10">
            No invoices yet — the Free plan never charges you.
          </p>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 rounded-3xl bg-white/[0.05] p-3.5 ring-1 ring-white/10">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-base ring-1 ring-emerald-300/25">
                  🧾
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{inv.description}</span>
                  <span className="block text-[11px] text-white/45">
                    {inv.number} · {fmtDate(inv.date)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold">{fmtMoney(inv.amount)}</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{inv.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="px-1">
        <Button full variant="ghost" onClick={() => window.print()}>
          Print this page
        </Button>
        <p className="mt-2 text-center text-[11px] text-white/30">
          Billing questions? support@sparks.app — this demo never touches a card.
        </p>
      </div>
    </div>
  );
}
