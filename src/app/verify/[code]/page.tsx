import type { Metadata } from "next";
import Link from "next/link";
import { findCertificate } from "@/lib/certificates";
import { ensureReady } from "@/lib/bootstrap";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { fmtDate } from "@/lib/format";
import Icon from "@/components/Icon";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = { title: "Verify a certificate" };

// The result is looked up on every visit: a certificate can be revoked, and an
// employer checking it must see today's answer, not a cached one.
export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const wanted = decodeURIComponent(code);
  // Hydrate the certificate index before answering. On a cold instance the
  // cache is empty, and treating that as "no such certificate" would make a
  // genuine certificate look forged — so a failure to load is reported as an
  // outage instead.
  const ready = await ensureReady().then(
    () => true,
    () => false
  );
  const certificate = ready ? findCertificate(wanted) : null;
  const user = await getCurrentUser().catch(() => null);
  const appHref = user ? (isOwner(user) ? "/owner" : "/dashboard") : null;

  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <PublicHeader appHref={appHref} signedIn={Boolean(user)} />
      <main className="px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">Certificate verification</p>
          <Link href="/verify" className="text-xs font-bold text-[#756f7b] transition hover:text-[#332e39]">Check another code</Link>
        </div>

        {!ready ? (
          <section className="mt-8 rounded-[22px] border border-amber-200 bg-amber-50 p-7 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-amber-700"><Icon name="clock" size={22} /></span>
            <h1 className="mt-4 text-xl font-black tracking-[-.03em]">We cannot check that right now</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-amber-900">
              Our records are momentarily unreachable, so this is <strong>not</strong> a statement about the
              certificate. Please try again in a minute, or contact us and we will verify by hand.
            </p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17151f] px-4 py-3 text-xs font-extrabold text-white">
              Contact us <Icon name="arrow-right" size={14} />
            </Link>
          </section>
        ) : !certificate ? (
          <section className="mt-8 rounded-[22px] border border-amber-200 bg-amber-50 p-7 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-amber-700"><Icon name="search" size={22} /></span>
            <h1 className="mt-4 text-xl font-black tracking-[-.03em]">No certificate has that code</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-amber-900">
              <span className="font-mono font-bold">{wanted}</span> is not in our records. Check for a typo — the code is
              printed on the certificate, under the holder&apos;s name. If it still does not match, the certificate may
              have been withdrawn; contact us and we will check by hand.
            </p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17151f] px-4 py-3 text-xs font-extrabold text-white">
              Contact us <Icon name="arrow-right" size={14} />
            </Link>
          </section>
        ) : (
          <section className={`mt-8 overflow-hidden rounded-[22px] border ${certificate.revoked ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-white"}`}>
            <div className={`flex items-center gap-3 px-6 py-4 ${certificate.revoked ? "bg-rose-100/70 text-rose-900" : "bg-emerald-50 text-emerald-900"}`}>
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${certificate.revoked ? "bg-rose-200/70" : "bg-emerald-200/70"}`}>
                <Icon name={certificate.revoked ? "close" : "check"} size={18} />
              </span>
              <div>
                <p className="text-sm font-black">{certificate.revoked ? "This certificate has been withdrawn" : "This certificate is valid"}</p>
                <p className="text-[11px] opacity-80">
                  {certificate.revoked
                    ? certificate.revokedReason ?? "It was withdrawn by the teacher who issued it."
                    : "Issued by codemasterghana and recorded on our server."}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#9a939f]">Awarded to</p>
              <h1 className="mt-1.5 text-2xl font-black tracking-[-.04em] sm:text-3xl">{certificate.holder}</h1>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-[#9a939f]">For completing</p>
              <p className="mt-1.5 text-lg font-black tracking-[-.03em] text-[#5e3de0]">{certificate.courseTitle}</p>
              <p className="mt-1 text-xs text-[#817a87]">{certificate.program} program</p>

              <dl className="mt-6 grid gap-4 border-t border-[#eeeaf1] pt-5 sm:grid-cols-3">
                <div>
                  <dt className="text-[9px] font-black uppercase tracking-wider text-[#9a939f]">Issued</dt>
                  <dd className="mt-1 text-sm font-bold">{fmtDate(certificate.issuedAt)}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-black uppercase tracking-wider text-[#9a939f]">Study</dt>
                  <dd className="mt-1 text-sm font-bold">{certificate.lessons} lessons · ~{certificate.hours} hours</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-black uppercase tracking-wider text-[#9a939f]">Certificate ID</dt>
                  <dd className="mt-1 break-all font-mono text-[12px] font-bold">{certificate.code}</dd>
                </div>
              </dl>

              <p className="mt-6 rounded-xl bg-[#fbfafc] p-4 text-[11px] leading-5 text-[#7d7683]">
                This page is the verification record. It shows only what is needed to check the certificate — no email
                address, no account details, no payment information. {certificate.revoked ? "" : "Employers can quote the certificate ID above, or scan the QR code printed on the certificate, to return here."}
              </p>
            </div>
          </section>
        )}

        <p className="mt-6 text-center text-[11px] text-[#918a97]">
          Want a certificate of your own? <Link href="/login?mode=signup" className="font-bold text-[#5e3de0] underline">Start a course</Link>
        </p>
      </div>
      </main>
      <PublicFooter />
    </div>
  );
}
