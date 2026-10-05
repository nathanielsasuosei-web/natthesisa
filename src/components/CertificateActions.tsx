"use client";

import { useState } from "react";
import Icon from "./Icon";

interface Props {
  code: string;
  verifyHref: string;
  courseTitle: string;
}

/**
 * The buttons above a certificate: save a PDF, copy the verification link, or
 * share it. Everything here is browser-side — a certificate is a document, and
 * "save as PDF" is the browser's own print pipeline (no server PDF engine).
 */
export default function CertificateActions({ code, verifyHref, courseTitle }: Props) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  async function copy(value: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  const shareText = `I completed “${courseTitle}” at codemasterghana. Verify it here: ${verifyHref}`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(109,74,255,.2)] transition hover:bg-[#7a5aff]"
      >
        <Icon name="download" size={15} /> Print / save PDF
      </button>

      <button
        type="button"
        onClick={() => copy(verifyHref, "link")}
        className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]"
      >
        <Icon name={copied === "link" ? "check" : "shield"} size={14} /> {copied === "link" ? "Link copied" : "Copy verify link"}
      </button>

      <button
        type="button"
        onClick={() => copy(code, "code")}
        className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]"
      >
        <Icon name={copied === "code" ? "check" : "certificate"} size={14} /> {copied === "code" ? "Code copied" : "Copy ID"}
      </button>

      {canShare && (
        <button
          type="button"
          onClick={() => void navigator.share({ title: `Certificate — ${courseTitle}`, text: shareText, url: verifyHref }).catch(() => undefined)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]"
        >
          <Icon name="arrow-right" size={14} /> Share
        </button>
      )}
    </div>
  );
}
