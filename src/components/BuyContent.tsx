"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import Icon from "./Icon";

interface Props {
  kind: "course" | "lesson";
  courseId: string;
  lessonId?: string;
  price: number;
  /** A shorter label, used on lesson rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Pays for a course or a single lesson, then refreshes the page so the server
 * can re-render with the new entitlement. The pass is separate: if it has
 * lapsed the page says so, and this still records the purchase so no student
 * ever pays twice for the same content.
 */
export default function BuyContent({ kind, courseId, lessonId, price, compact, className }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
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
        setError(data?.error ?? "The payment could not be completed.");
        setBusy(false);
        return;
      }
      setBusy(false);
      router.refresh();
    } catch {
      setError("The payment could not be completed. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <span className={className}>
      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-[#6d4aff] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#7959f1] disabled:opacity-60 ${
          compact ? "px-3 py-2 text-[10px]" : "px-5 py-3 text-xs"
        }`}
      >
        <Icon name="card" size={compact ? 12 : 14} />
        {busy ? "Paying…" : `Buy for ${formatMoney(price)}`}
      </button>
      {error && <span role="alert" className="ml-3 text-[10px] font-semibold text-red-600">{error}</span>}
    </span>
  );
}
