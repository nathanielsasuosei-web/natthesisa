"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PERIOD_LABEL, formatMoney, type Pricing } from "@/lib/pass-periods";
import Icon from "./Icon";

interface PriceRow {
  id: string;
  title: string;
  courseTitle: string;
  price: number;
}

interface Props {
  initialPricing: Pricing;
  courses: PriceRow[];
  lessons: PriceRow[];
}

/**
 * Where the teacher sets every price on the platform.
 *
 * The three pass prices decide what time costs; the two defaults are what a
 * new course or lesson is published at. Any single course or lesson can then
 * be priced differently, which is what the list below is for. Prices are saved
 * one field at a time and take effect on the next page render — nothing is
 * hardcoded anywhere else.
 */
export default function OwnerPricingCard({ initialPricing, courses, lessons }: Props) {
  const router = useRouter();
  const [pricing, setPricing] = useState(initialPricing);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [openList, setOpenList] = useState<"none" | "courses" | "lessons">("none");
  const [rows, setRows] = useState({ courses, lessons });

  async function save(key: string, body: unknown): Promise<boolean> {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch("/api/owner/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "The price could not be saved." });
        setBusy(null);
        return false;
      }
      setBusy(null);
      router.refresh();
      return true;
    } catch {
      setMessage({ tone: "error", text: "The price could not be saved. Check your connection." });
      setBusy(null);
      return false;
    }
  }

  async function savePricing() {
    const ok = await save("passes", { pricing });
    if (ok) setMessage({ tone: "ok", text: "Pass prices saved." });
  }

  async function saveContentPrice(kind: "course" | "lesson", row: PriceRow) {
    const value = draft[row.id] ?? String(row.price);
    const ok = await save(row.id, { scope: "content", kind, refId: row.id, price: Number(value) });
    if (!ok) return;
    setRows((current) => ({
      courses: kind === "course" ? current.courses.map((item) => (item.id === row.id ? { ...item, price: Number(value) } : item)) : current.courses,
      lessons: kind === "lesson" ? current.lessons.map((item) => (item.id === row.id ? { ...item, price: Number(value) } : item)) : current.lessons,
    }));
    setDraft((current) => ({ ...current, [row.id]: String(value) }));
    setMessage({ tone: "ok", text: `${row.title} is now ${formatMoney(Number(value))}.` });
  }

  const passFields: Array<{ key: keyof Pricing; label: string; hint: string }> = [
    { key: "daily", label: PERIOD_LABEL.daily, hint: "1 day of access" },
    { key: "weekly", label: PERIOD_LABEL.weekly, hint: "7 days of access" },
    { key: "monthly", label: PERIOD_LABEL.monthly, hint: "30 days of access" },
    { key: "course", label: "Default course price", hint: "What a new course costs on its own" },
    { key: "lesson", label: "Default lesson price", hint: "What a new lesson is published at" },
  ];

  function renderRows(kind: "course" | "lesson", list: PriceRow[]) {
    return (
      <div className="mt-4 max-h-80 overflow-y-auto border-y border-[#ece9ef]">
        {list.map((row) => (
          <div key={row.id} className="flex items-center gap-3 border-b border-[#f1eef2] py-2.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-[#4f4956]">{row.title}</p>
              <p className="mt-0.5 text-[9px] text-[#9a939f]">{row.courseTitle}</p>
            </div>
            <span className="text-[10px] font-bold text-[#817a87]">{formatMoney(row.price)}</span>
            <input
              type="number"
              min={0}
              step={1}
              value={draft[row.id] ?? String(row.price)}
              onChange={(event) => setDraft((current) => ({ ...current, [row.id]: event.target.value }))}
              className="w-24 rounded-lg border border-[#ddd9e2] bg-white px-2.5 py-1.5 text-[11px] font-bold"
              aria-label={`Price of ${row.title}`}
            />
            <button
              onClick={() => saveContentPrice(kind, row)}
              disabled={busy === row.id || (draft[row.id] ?? String(row.price)) === String(row.price)}
              className="rounded-lg bg-[#1b1822] px-3 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-40"
            >
              {busy === row.id ? "Saving…" : "Save"}
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold">Prices you set</h2>
          <p className="mt-1 text-[10px] text-[#918a97]">
            What the access pass costs, and the starting price for new content. Change anything, any time.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-[9px] font-black text-[#5e3de0]">
          <Icon name="card" size={12} /> Live prices
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {passFields.map((field) => (
          <label key={field.key} className="block rounded-2xl border border-[#e6e2e9] p-3.5">
            <span className="block text-[10px] font-black uppercase tracking-wider text-[#817a87]">{field.label}</span>
            <span className="mt-0.5 block text-[9px] text-[#9a939f]">{field.hint}</span>
            <span className="mt-2.5 flex items-center gap-2">
              <span className="text-xs font-black text-[#6d4aff]">GH₵</span>
              <input
                type="number"
                min={0}
                step={1}
                value={pricing[field.key]}
                onChange={(event) => setPricing((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
                className="w-full rounded-lg border border-[#ddd9e2] bg-white px-2.5 py-2 text-xs font-bold"
              />
            </span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={savePricing}
          disabled={busy === "passes"}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#5d3ce2] disabled:opacity-60"
        >
          {busy === "passes" ? "Saving…" : "Save prices"}
        </button>
        <button
          onClick={() => setOpenList(openList === "courses" ? "none" : "courses")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#ded9e3] px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864]"
        >
          <Icon name="courses" size={13} /> {openList === "courses" ? "Hide" : "Price each course"}
        </button>
        <button
          onClick={() => setOpenList(openList === "lessons" ? "none" : "lessons")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#ded9e3] px-3.5 py-2.5 text-[11px] font-bold text-[#5e5864]"
        >
          <Icon name="book" size={13} /> {openList === "lessons" ? "Hide" : "Price each lesson"}
        </button>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-3 text-[10px] font-semibold ${message.tone === "ok" ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      {openList === "courses" && renderRows("course", rows.courses)}
      {openList === "lessons" && renderRows("lesson", rows.lessons)}
    </section>
  );
}
