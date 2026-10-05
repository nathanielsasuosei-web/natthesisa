"use client";

import { useMemo, useState } from "react";
import type { CertificateRecord } from "@/lib/certificates";
import { fmtDate } from "@/lib/format";
import Icon from "./Icon";

interface Props {
  initialCertificates: CertificateRecord[];
}

type Filter = "valid" | "withdrawn" | "all";

/**
 * The teacher's certificate register.
 *
 * Certificates are issued automatically when a student finishes a course, so
 * the only action here is withdrawal — for the case where the work was not
 * the student's. Withdrawing keeps the verification page answering, but
 * reports the certificate as withdrawn, so an employer holding a copy finds
 * out instead of being told the code does not exist.
 */
export default function OwnerCertificates({ initialCertificates }: Props) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [filter, setFilter] = useState<Filter>("valid");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const counts = useMemo(
    () => ({
      valid: certificates.filter((item) => !item.revoked).length,
      withdrawn: certificates.filter((item) => item.revoked).length,
    }),
    [certificates]
  );

  const shown = certificates.filter((item) => (filter === "all" ? true : filter === "valid" ? !item.revoked : item.revoked));

  async function act(code: string, revoked: boolean) {
    if (busy) return;
    let reason = "";
    if (revoked) {
      const answer = window.prompt(
        "Withdraw this certificate?\n\nThe verification page will keep answering for this code but report it as withdrawn. Give a short reason (it is shown to whoever checks):",
        "Withdrawn — the coursework could not be verified."
      );
      if (answer === null) return;
      reason = answer;
    } else if (!window.confirm("Restore this certificate? The verification page will report it as valid again.")) {
      return;
    }

    setBusy(code);
    setError("");
    setNote("");
    try {
      const response = await fetch("/api/owner/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, revoked, reason }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        certificates?: CertificateRecord[];
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.certificates) {
        setError(payload.error || "That did not work. Please try again.");
        return;
      }
      setCertificates(payload.certificates);
      setNote(revoked ? `Certificate ${code} withdrawn. The public page now reports it as withdrawn.` : `Certificate ${code} is valid again.`);
    } catch {
      setError("No answer from the server. Check the connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-[22px] border border-[#e2dee7] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0edf3] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon name="certificate" size={17} className="text-[#6d4aff]" />
          <h2 className="text-sm font-black">Certificate register</h2>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">{counts.valid} valid</span>
          {counts.withdrawn > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-700">{counts.withdrawn} withdrawn</span>}
        </div>
        <div className="inline-flex rounded-xl bg-[#f4f2f6] p-1">
          {(["valid", "withdrawn", "all"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold capitalize transition ${filter === option ? "bg-white text-[#332e39] shadow-sm" : "text-[#8a8390]"}`}
            >
              {option} ({option === "all" ? certificates.length : counts[option]})
            </button>
          ))}
        </div>
      </div>

      {error && <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-[12px] font-semibold text-red-800">{error}</p>}
      {note && <p className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-[12px] font-semibold text-emerald-800">{note}</p>}

      {shown.length === 0 ? (
        <p className="px-5 py-10 text-center text-[12px] text-[#918a97] sm:px-6">
          {certificates.length === 0
            ? "No certificates yet. One is created automatically when a student finishes every lesson in a course while their pass is active."
            : "Nothing in this filter."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#fbfafc] text-[9px] uppercase tracking-wider text-[#8a8390]">
              <tr>
                <th className="px-5 py-3 font-black">Holder</th>
                <th className="px-5 py-3 font-black">Course</th>
                <th className="px-5 py-3 font-black">Issued</th>
                <th className="px-5 py-3 font-black">Code</th>
                <th className="px-5 py-3 text-right font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0edf3]">
              {shown.map((certificate) => (
                <tr key={certificate.code} className={certificate.revoked ? "bg-rose-50/40" : undefined}>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-extrabold text-[#332e39]">{certificate.holder}</p>
                    <p className="mt-0.5 text-[10px] text-[#918a97]">{certificate.program}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[11px] font-bold text-[#4a4450]">{certificate.courseTitle}</p>
                    <p className="mt-0.5 text-[10px] text-[#918a97]">{certificate.lessons} lessons · ~{certificate.hours} hours</p>
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-[#6d6673]">{fmtDate(certificate.issuedAt)}</td>
                  <td className="px-5 py-3.5">
                    <a href={`/verify/${encodeURIComponent(certificate.code)}`} className="font-mono text-[11px] font-bold text-[#5e3de0] underline">{certificate.code}</a>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {certificate.revoked ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-rose-700">
                          <Icon name="close" size={10} /> Withdrawn
                        </span>
                        <span className="max-w-[220px] text-[10px] leading-4 text-rose-800/80">{certificate.revokedReason ?? "No reason given."}</span>
                        <button type="button" disabled={busy === certificate.code} onClick={() => act(certificate.code, false)} className="rounded-lg border border-[#dad5df] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6] disabled:opacity-50">
                          Restore
                        </button>
                      </div>
                    ) : (
                      <button type="button" disabled={busy === certificate.code} onClick={() => act(certificate.code, true)} className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">
                        {busy === certificate.code ? "Working…" : "Withdraw"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-[#f0edf3] px-5 py-3.5 text-[10px] leading-5 text-[#918a97] sm:px-6">
        Withdrawing is for work that is not the student&apos;s own — a shared account, or someone else completing the
        lessons. It is reversible, and nothing is deleted.
      </p>
    </section>
  );
}
