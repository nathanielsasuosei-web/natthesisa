"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";

interface Props {
  courseId: string;
  lessonId: string;
  initiallyComplete: boolean;
  nextHref: string;
  nextLabel: string;
  suspended?: boolean;
}

export default function LessonActions({ courseId, lessonId, initiallyComplete, nextHref, nextLabel, suspended = false }: Props) {
  const router = useRouter();
  const [complete, setComplete] = useState(initiallyComplete);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    if (busy || suspended) return;
    if (complete) {
      router.push(nextHref);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lessonId, completed: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Progress could not be saved.");
        return;
      }
      setComplete(true);
      router.refresh();
      setTimeout(() => router.push(nextHref), 350);
    } catch {
      setError("Network error. Your progress was not changed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{error}</p>}
      <button onClick={finish} disabled={busy || suspended} className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${complete ? "bg-emerald-600 hover:bg-emerald-500" : "bg-[#6d4aff] hover:bg-[#5e3ce8]"}`}>
        {busy ? "Saving progress…" : complete ? <><Icon name="check" size={17} /> {nextLabel}</> : <>Complete & continue <Icon name="arrow-right" size={17} /></>}
      </button>
      {suspended && <p className="mt-2 text-center text-[10px] font-semibold text-amber-700">Progress saving is paused for this account.</p>}
    </div>
  );
}
