"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

/**
 * Pays for a program with Mobile Money, then refreshes the page so the
 * server can re-render with the new entitlement. A program priced at GH₵0
 * joins with one tap instead — no checkout, no money.
 */
export default function BuyProgram({ programId, programName, price, compact, className }: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {busy ? "Please wait…" : price <= 0 ? "Join for free" : `Buy for ${formatMoney(price)}`}
      </button>
      {error && <span role="alert" className="ml-3 text-[10px] font-semibold text-red-600">{error}</span>}

      {checkout && (
        <CheckoutModal
          title={`Buy the ${programName} program`}
          subtitle="Every course and lesson inside, yours forever"
          amount={price}
          payload={{ kind: "program", programId }}
          successMessage={`The ${programName} program is yours now. Open it and start learning.`}
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
