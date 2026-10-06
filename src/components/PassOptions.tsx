"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PASS_PERIODS, PERIOD_DAYS, PERIOD_LABEL, formatMoney, type PassPeriod } from "@/lib/pass-periods";
import Icon from "./Icon";

interface Props {
  /** Price of each period, as the owner has set them. */
  prices: Record<PassPeriod, number>;
  /** True when the student already holds time on a pass. */
  active: boolean;
  /** ISO date the current pass runs out, when there is one. */
  expiresAt: string | null;
  cardLabel: string;
}

const BLURB: Record<PassPeriod, string> = {
  daily: "One day of full access — perfect for a focused session.",
  weekly: "A week to work through a course and its projects.",
  monthly: "The best value: a full month, at your own pace.",
};

/**
 * Buying time on the platform.
 *
 * There is one level of access, so this is a choice of how long — not of how
 * much. Behind every card is the same everything: every course, every lesson
 * the teacher has published, previews included. Paying opens the platform;
 * individual courses and lessons are bought inside the catalog.
 */
export default function PassOptions({ prices, active, expiresAt, cardLabel }: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<PassPeriod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function buy() {
    if (!checkout || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pass", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ period: checkout }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "The payment could not be completed.");
        setBusy(false);
        return;
      }
      setDone(`Your ${PERIOD_LABEL[checkout].toLowerCase()} is active. Pick a course and start learning.`);
      setCheckout(null);
      setBusy(false);
      router.refresh();
    } catch {
      setError("The payment could not be completed. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      {done && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
          <Icon name="check" size={16} className="shrink-0 text-emerald-700" />
          {done}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {PASS_PERIODS.map((period) => {
          const price = prices[period];
          const featured = period === "monthly";
          return (
            <div
              key={period}
              className={`relative flex flex-col rounded-[24px] border bg-white p-6 ${
                featured ? "border-[#6d4aff] shadow-[0_18px_44px_rgba(109,74,255,.14)]" : "border-[#e5e1e8]"
              }`}
            >
              {featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-[#6d4aff] px-3 py-1 text-[8px] font-black uppercase tracking-widest text-white">
                  Best value
                </span>
              )}
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6d4aff]">{PERIOD_LABEL[period]}</p>
              <p className="mt-4">
                <span className="text-4xl font-black tracking-[-.05em]">{formatMoney(price)}</span>
                <span className="text-xs text-[#8d8694]"> / {PERIOD_DAYS[period] === 1 ? "day" : `${PERIOD_DAYS[period]} days`}</span>
              </p>
              <p className="mt-3 text-xs leading-6 text-[#77717e]">{BLURB[period]}</p>
              <ul className="mt-5 flex-1 space-y-2 border-t border-[#f0edf2] pt-5">
                {["Every course and lesson", "Free previews included", "Progress and certificates kept", "Buy content separately to keep it yours"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] leading-5 text-[#5f5965]">
                    <Icon name="check" size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setError(null); setCheckout(period); }}
                className={`mt-6 w-full rounded-xl px-4 py-3 text-xs font-extrabold transition hover:-translate-y-0.5 ${
                  featured ? "bg-[#6d4aff] text-white hover:bg-[#7959f1]" : "border border-[#ded9e3] bg-white text-[#655f6b]"
                }`}
              >
                {active ? `Add ${PERIOD_DAYS[period]} more day${PERIOD_DAYS[period] === 1 ? "" : "s"}` : `Buy the ${PERIOD_LABEL[period].toLowerCase()}`}
              </button>
            </div>
          );
        })}
      </div>

      {active && expiresAt && (
        <p className="mt-5 text-center text-[11px] text-[#817a87]">
          Your pass is active until <strong className="text-[#5f5965]">{new Date(expiresAt).toDateString()}</strong>. Buying more time adds
          it on top — nothing you have paid for is wasted.
        </p>
      )}

      {checkout && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#15121c]/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setCheckout(null); }}
        >
          <div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#ece8ef] p-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Secure checkout</p>
                <h2 className="mt-1.5 text-xl font-black tracking-[-.035em]">Buy the {PERIOD_LABEL[checkout].toLowerCase()}</h2>
              </div>
              <button onClick={() => !busy && setCheckout(null)} className="grid size-8 place-items-center rounded-lg bg-[#f3f1f5] text-[#77717e]" aria-label="Close">
                <Icon name="close" size={15} />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-2xl bg-[#f7f5fa] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold">{PERIOD_LABEL[checkout]}</p>
                    <p className="mt-1 text-[10px] text-[#918a97]">
                      {PERIOD_DAYS[checkout]} day{PERIOD_DAYS[checkout] === 1 ? "" : "s"} of full access
                    </p>
                  </div>
                  <p className="text-lg font-black">{formatMoney(prices[checkout])}</p>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#817a87]">Payment method</p>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#ded9e3] p-3.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#172b85] text-[9px] font-black italic text-white">VISA</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{cardLabel}</p>
                    <p className="mt-0.5 text-[9px] text-[#918a97]">Demo payment method</p>
                  </div>
                  <Icon name="check" size={15} className="text-emerald-600" />
                </div>
              </div>
              {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
              <div className="mt-5 flex items-center gap-2 text-[9px] leading-4 text-[#918a97]">
                <Icon name="shield" size={14} className="shrink-0 text-emerald-600" />
                This demonstration simulates a successful payment. No real card is charged.
              </div>
              <button
                onClick={buy}
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3.5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] disabled:opacity-60"
              >
                {busy ? "Taking payment…" : `Pay ${formatMoney(prices[checkout])}`}
                {!busy && <Icon name="arrow-right" size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
