"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/pass-periods";
import Icon from "./Icon";
import CheckoutModal from "./CheckoutModal";

interface Props {
  programId: string;
  programName: string;
  price: number;
  /** A shorter label, used on compact rows. */
  compact?: boolean;
  className?: string;
}

interface OutstandingBalance {
  reference: string;
  amount: number;
  balanceDue: number;
}

/**
 * Pays for a program with Mobile Money, then refreshes the page so the
 * server can re-render with the new entitlement. A program priced at GH₵0
 * joins with one tap instead — no checkout, no money.
 *
 * A program can be bought in full, or half now with the rest paid later.
 * When a deposit is still waiting for its balance, the balance button takes
 * its place — a second whole purchase for the same program would be a
 * double charge.
 */
export default function BuyProgram({ programId, programName, price, compact, className }: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<OutstandingBalance | null>(null);
  const [mode, setMode] = useState<"full" | "half" | "balance">("full");

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

  useEffect(() => {
    if (price <= 0) return;
    let cancelled = false;
    fetch(`/api/checkout?programId=${encodeURIComponent(programId)}`)
      .then((response) => response.json().catch(() => ({})))
      .then((data) => {
        if (!cancelled && data?.outstandingBalance) {
          setBalance(data.outstandingBalance);
          setMode("balance");
        }
      })
      .catch(() => {
        // The balance check is a convenience: silence it and keep the
        // regular buy buttons.
      });
    return () => {
      cancelled = true;
    };
  }, [programId, price]);

  const half = Math.ceil(price / 2);
  const rest = price - half;

  function open(kind: "full" | "half" | "balance") {
    setError(null);
    setMode(kind);
    setCheckout(true);
  }

  function start() {
    if (busy) return;
    if (price <= 0) {
      void joinFree();
      return;
    }
    open(balance ? "balance" : "full");
  }

  const depositAmount = half;
  const depositDue = rest;
  const isHalf = mode === "half";
  const isBalance = mode === "balance";

  return (
    <span className={className}>
      {price <= 0 ? (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#7959f1] disabled:opacity-60 ${
            compact ? "px-3 py-2 text-[10px]" : "px-5 py-3 text-xs"
          }`}
        >
          <Icon name="mobile" size={compact ? 12 : 14} />
          {busy ? "Please wait…" : "Join for free"}
        </button>
      ) : balance ? (
        <>
          <button
            type="button"
            onClick={() => open("balance")}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#7959f1] disabled:opacity-60 ${
              compact ? "px-3 py-2 text-[10px]" : "px-5 py-3 text-xs"
            }`}
          >
            <Icon name="mobile" size={compact ? 12 : 14} />
            {busy ? "Please wait…" : `Pay GH₵${balance.balanceDue} balance`}
          </button>
            <p className="mt-1.5 text-[9px] text-[#817a87]">
              Clears your deposit — GH₵{formatMoney(balance?.amount ?? 0)} of GH₵{formatMoney(price)} paid,
              GH₵{formatMoney(balance?.balanceDue ?? 0)} remains
            </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => open("full")}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#7959f1] disabled:opacity-60 ${
              compact ? "px-3 py-2 text-[10px]" : "px-5 py-3 text-xs"
            }`}
          >
            <Icon name="mobile" size={compact ? 12 : 14} />
            {busy ? "Please wait…" : `Buy for ${formatMoney(price)}`}
          </button>
          <button
            type="button"
            onClick={() => open("half")}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-[#ded9e3] bg-white font-extrabold text-[#5e3de0] transition hover:bg-[#faf9fb] disabled:opacity-60 ${
              compact ? "px-3 py-2 text-[10px]" : "px-5 py-3 text-xs"
            }`}
          >
            <Icon name="mobile" size={compact ? 12 : 14} />
            {busy ? "Please wait…" : `Pay GH₵${depositAmount} now — GH₵${depositDue} later`}
          </button>
          {error && <span role="alert" className="ml-3 text-[10px] font-semibold text-red-600">{error}</span>}
        </>
      )}

      {checkout && (
        <CheckoutModal
          title={isBalance ? `Clear the ${programName} balance` : `Buy the ${programName} program`}
          subtitle={
            isBalance
              ? "Pays off your deposit and opens every course and lesson in the program."
              : isHalf
                ? "Half now — the rest is due later. You're in right away."
                : "Opens every course and lesson in it, permanently"
          }
          amount={isBalance ? balance?.balanceDue ?? 0 : isHalf ? depositAmount : price}
          fullAmount={price}
          balanceDue={isHalf ? depositDue : 0}
          deposit={isHalf}
          settlesReference={isBalance ? balance?.reference : undefined}
          payload={{
            kind: "program",
            programId,
            ...(isHalf ? { deposit: true } : {}),
            ...(isBalance ? { settlesReference: balance?.reference } : {}),
          }}
          successMessage={
            isBalance
              ? `Balance paid — the ${programName} program is yours, and every course and lesson in it is open.`
              : isHalf
                ? `Half paid for the ${programName} program — you're in. GH₵${depositDue} remains due; clear it on your Billing page.`
                : `The ${programName} program is yours now. Every course and lesson in it is open.`
          }
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