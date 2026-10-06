"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/pass-periods";
import Icon from "./Icon";

interface PriceRow {
  id: string;
  title: string;
  courseTitle: string;
  price: number;
}

interface Props {
  programs: PriceRow[];
}

/**
 * Where the teacher sets every price on the platform.
 *
 * Programs are the only thing students pay for, so this is one list: the
 * price of each program. A program priced at GH₵0 is free to join, with no
 * checkout. Prices take effect on the next page render — nothing is hardcoded
 * anywhere else.
 */
export default function OwnerPricingCard({ programs }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [rows, setRows] = useState(programs);

  async function saveProgramPrice(row: PriceRow) {
    const value = draft[row.id] ?? String(row.price);
    setBusy(row.id);
    setMessage(null);
    try {
      const response = await fetch("/api/owner/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "content", kind: "program", refId: row.id, price: Number(value) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "The price could not be saved." });
        setBusy(null);
        return;
      }
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, price: Number(value) } : item)));
      setDraft((current) => ({ ...current, [row.id]: String(value) }));
      setMessage({ tone: "ok", text: `${row.title} is now ${formatMoney(Number(value))}.` });
      setBusy(null);
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "The price could not be saved. Check your connection." });
      setBusy(null);
    }
  }

  return (
    <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold">Program prices</h2>
          <p className="mt-1 text-[10px] text-[#918a97]">
            What each program costs. Change anything, any time — GH₵0 means free to join.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-[9px] font-black text-[#5e3de0]">
          <Icon name="card" size={12} /> Live prices
        </span>
      </div>

      <div className="mt-4 divide-y divide-[#f1eef2] border-y border-[#ece9ef]">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[#332e39]">{row.title}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#9a939f]">{row.courseTitle}</p>
            </div>
            <span className="text-[10px] font-bold text-[#817a87]">{formatMoney(row.price)}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-[#6d4aff]">GH₵</span>
              <input
                type="number"
                min={0}
                step={1}
                value={draft[row.id] ?? String(row.price)}
                onChange={(event) => setDraft((current) => ({ ...current, [row.id]: event.target.value }))}
                className="w-24 rounded-lg border border-[#ddd9e2] bg-white px-2.5 py-2 text-xs font-bold"
                aria-label={`Price of ${row.title}`}
              />
            </span>
            <button
              onClick={() => saveProgramPrice(row)}
              disabled={busy === row.id || (draft[row.id] ?? String(row.price)) === String(row.price)}
              className="rounded-lg bg-[#1b1822] px-3.5 py-2 text-[10px] font-extrabold text-white disabled:opacity-40"
            >
              {busy === row.id ? "Saving…" : "Save"}
            </button>
          </div>
        ))}
      </div>

      {message && (
        <p
          role="status"
          className={`mt-3 text-[10px] font-semibold ${message.tone === "ok" ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
