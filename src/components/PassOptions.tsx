"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PASS_PERIODS, PERIOD_DAYS, PERIOD_LABEL, formatMoney, type PassPeriod } from "@/lib/pass-periods";
import Icon from "./Icon";
import CheckoutModal from "./CheckoutModal";

interface Props {
  /** Price of each period, as the owner has set them. */
  prices: Record<PassPeriod, number>;
  /** True when the student already holds time on a pass. */
  active: boolean;
  /** ISO date the current pass runs out, when there is one. */
  expiresAt: string | null;
  /** Last MoMo number on the account, pre-filled at checkout when there is one. */
  momoPhone?: string;
  momoNetwork?: string;
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
export default function PassOptions({ prices, active, expiresAt, momoPhone, momoNetwork }: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<PassPeriod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // A pass priced at GH₵0 needs no money: keep the one-tap buy for that case.
  async function buyFree(period: PassPeriod) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "The pass could not be activated.");
        setBusy(false);
        return;
      }
      setDone(`Your ${PERIOD_LABEL[period].toLowerCase()} is active. Pick a course and start learning.`);
      setBusy(false);
      router.refresh();
    } catch {
      setError("The pass could not be activated. Check your connection and try again.");
      setBusy(false);
    }
  }

  function choose(period: PassPeriod) {
    setError(null);
    if (prices[period] <= 0) {
      void buyFree(period);
      return;
    }
    setCheckout(period);
  }

  return (
    <div>
      {done && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
          <Icon name="check" size={16} className="shrink-0 text-emerald-700" />
          {done}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
          <Icon name="close" size={16} className="shrink-0" />
          {error}
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
                onClick={() => choose(period)}
                disabled={busy}
                className={`mt-6 w-full rounded-xl px-4 py-3 text-xs font-extrabold transition hover:-translate-y-0.5 disabled:opacity-60 ${
                  featured ? "bg-[#6d4aff] text-white hover:bg-[#7959f1]" : "border border-[#ded9e3] bg-white text-[#655f6b]"
                }`}
              >
                {busy
                  ? "Please wait…"
                  : price <= 0
                    ? active
                      ? `Add ${PERIOD_DAYS[period]} more day${PERIOD_DAYS[period] === 1 ? "" : "s"} — free`
                      : `Get the ${PERIOD_LABEL[period].toLowerCase()} — free`
                    : active
                      ? `Add ${PERIOD_DAYS[period]} more day${PERIOD_DAYS[period] === 1 ? "" : "s"}`
                      : `Buy the ${PERIOD_LABEL[period].toLowerCase()}`}
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
        <CheckoutModal
          title={`Buy the ${PERIOD_LABEL[checkout].toLowerCase()}`}
          subtitle={`${PERIOD_DAYS[checkout]} day${PERIOD_DAYS[checkout] === 1 ? "" : "s"} of full access`}
          amount={prices[checkout]}
          payload={{ kind: "pass", period: checkout }}
          defaultPhone={momoPhone}
          defaultNetwork={momoNetwork}
          successMessage={`Your ${PERIOD_LABEL[checkout].toLowerCase()} is active. Pick a course and start learning.`}
          onClose={() => setCheckout(null)}
          onSuccess={() => {
            setCheckout(null);
            setDone(`Your ${PERIOD_LABEL[checkout].toLowerCase()} is active. Pick a course and start learning.`);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
