"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import Icon from "./Icon";
import CheckoutModal from "./CheckoutModal";

interface Props {
  kind: "course" | "lesson";
  courseId: string;
  lessonId?: string;
  price: number;
  /** The title shown in the checkout (course title or lesson title). */
  title?: string;
  /** A shorter label, used on lesson rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Pays for a course or a single lesson with Mobile Money, then refreshes the
 * page so the server can re-render with the new entitlement. The pass is
 * separate: if it has lapsed the page says so, and this still records the
 * purchase so no student ever pays twice for the same content.
 */
export default function BuyContent({ kind, courseId, lessonId, price, title, compact, className }: Props) {
  const router = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content priced at GH₵0 needs no money: keep the one-tap buy for that case.
  async function buyFree() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, courseId, lessonId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error ?? "This could not be added to your account.");
        setBusy(false);
        return;
      }
      setBusy(false);
      router.refresh();
    } catch {
      setError("This could not be added. Check your connection and try again.");
      setBusy(false);
    }
  }

  function start() {
    setError(null);
    if (price <= 0) {
      void buyFree();
      return;
    }
    setCheckout(true);
  }

  const label = title ?? (kind === "course" ? "this course" : "this lesson");

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
        {busy ? "Please wait…" : price <= 0 ? "Add for free" : `Buy for ${formatMoney(price)}`}
      </button>
      {error && <span role="alert" className="ml-3 text-[10px] font-semibold text-red-600">{error}</span>}

      {checkout && (
        <CheckoutModal
          title={kind === "course" ? `Buy ${label}` : `Buy the lesson`}
          subtitle={kind === "course" ? "Every lesson inside, yours to keep" : `${label} — yours to keep`}
          amount={price}
          payload={{ kind, courseId, lessonId }}
          successMessage={
            kind === "course"
              ? "This course is yours now. Open it and start learning."
              : "This lesson is yours now. Open it and start learning."
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
