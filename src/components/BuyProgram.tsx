"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney, halfAmount } from "@/lib/pass-periods";
import { programChoices } from "@/lib/checkout-options";
import Icon from "./Icon";
import CheckoutModal from "./CheckoutModal";

interface Props {
  programId: string;
  programName: string;
  price: number;
  /** How much of this program the student has already paid for. */
  entitlement?: "none" | "half" | "full";
  /** What is still owed before everything opens (the price when nothing is paid). */
  balance?: number;
  /** A shorter label, used on compact rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Pays for a program with Mobile Money, then refreshes the page so the
 * server can re-render with the new entitlement. A program priced at GH₵0
 * joins with one tap instead — no checkout, no money.
 *
 * A program can also be paid in two parts. Nothing paid yet: the button offers
 * the whole price and, in the modal, half of it — which opens the first half of
 * every course in the program (see `AccessDecision.openLessons`). Half already
 * paid: the button asks only for what is left, and paying it opens everything.
 * That is why the label is built from `entitlement` and `balance` rather than
 * from the price alone.
 */
export default function BuyProgram({
  programId,
  programName,
  price,
  entitlement = "none",
  balance,
  compact,
  className,
}: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owed = Math.max(0, balance ?? price);
  const halfPaid = entitlement === "half";
  const choices = programChoices({ programName, price, entitlement, balance: owed });

  async function joinFree() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "This program could not be joined.");
        setBusy(false);
        return;
      }
      setBusy(false);
      router.refresh();
    } catch {
      setError("This program could not be joined. Check your connection and try again.");
      setBusy(false);
    }
  }

  function start() {
    setError(null);
    if (price <= 0) {
      void joinFree();
      return;
    }
    setCheckout(true);
  }

  // Already paid in full: there is nothing to sell, so nothing is drawn.
  if (entitlement === "full") return null;

  const label = busy
    ? "Please wait…"
    : price <= 0
      ? "Join for free"
      : halfPaid
        ? `Pay the balance ${formatMoney(owed)}`
        : `Buy for ${formatMoney(price)}`;

  return (
    <span className={className}>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#7959f1] disabled:opacity-60 ${
          compact ? "px-3 py-2 text-[10px]" : "px-5 py-3 text-xs"
        }`}
      >
        <Icon name="mobile" size={compact ? 12 : 14} />
        {label}
      </button>

      {!busy && price > 0 && !halfPaid && (
        <span className={`block text-[#8d8694] ${compact ? "mt-1.5 text-[9px]" : "mt-2 text-[11px]"}`}>
          Pay half ({formatMoney(halfAmount(price))}) now and the first half of every course opens — or pay in full.
        </span>
      )}
      {!busy && halfPaid && (
        <span className={`block text-[#8d8694] ${compact ? "mt-1.5 text-[9px]" : "mt-2 text-[11px]"}`}>
          You paid half already. The balance opens every remaining lesson.
        </span>
      )}
      {error && <span role="alert" className="ml-3 text-[10px] font-semibold text-red-600">{error}</span>}

      {checkout && (
        <CheckoutModal
          title={halfPaid ? `Finish paying for ${programName}` : `Buy the ${programName} program`}
          subtitle={
            halfPaid
              ? "The balance opens every course and lesson in it, permanently"
              : "Pay in full, or pay half now and start on the first half of every course"
          }
          choices={choices}
          payload={{ kind: "program", programId }}
          onClose={() => setCheckout(false)}
          onSuccess={() => {
            setCheckout(false);
            router.refresh();
          }}
        />
      )}
    </span>
  );
}
