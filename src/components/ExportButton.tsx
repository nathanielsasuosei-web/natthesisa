"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function ExportButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function download() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/export");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.error ?? "Export failed.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "codemasterghana-learning-progress.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Downloaded");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="text-[10px] font-semibold text-[#77717e]">{message}</span>}
      <button onClick={download} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#544e5b] transition hover:border-violet-300 disabled:opacity-60"><Icon name="download" size={15} />{busy ? "Exporting…" : "Export progress"}</button>
    </div>
  );
}
