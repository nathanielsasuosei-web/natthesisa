"use client";

import { useState } from "react";

export default function ExportButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function exportCsv() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/export");
      if (res.status === 403) {
        setMsg("CSV export requires the Pro plan or higher.");
        return;
      }
      if (!res.ok) {
        setMsg("Export failed — please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "natthesisa-boards.csv";
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Downloaded ✓");
    } catch {
      setMsg("Network error — please try again.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs font-medium text-slate-500">{msg}</span>}
      <button
        onClick={exportCsv}
        disabled={busy}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
        </svg>
        {busy ? "Exporting…" : "Export CSV"}
      </button>
    </div>
  );
}
