import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { findCertificate } from "@/lib/certificates";
import { ensureReady } from "@/lib/bootstrap";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import Icon from "@/components/Icon";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = { title: "Verify a certificate" };

export const dynamic = "force-dynamic";

/**
 * The verification entry point. Employers type the code from a CV or a printed
 * certificate; `/verify/<code>` is what the QR code opens.
 *
 * `ensureReady()` runs first on purpose: the certificate index is read from the
 * database into a per-process cache, and on a cold instance an anonymous
 * visitor would otherwise be told "no certificate has that code" — the worst
 * possible answer, because it makes a genuine certificate look forged. Setup
 * is best-effort here: if the database is down the visitor is told to try
 * again, not that the certificate is fake.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim() ?? "";
  const ready = await ensureReady().then(
    () => true,
    () => false
  );
  const user = await getCurrentUser().catch(() => null);
  const appHref = user ? (isOwner(user) ? "/owner" : "/dashboard") : null;

  if (code) redirect(`/verify/${encodeURIComponent(code)}`);

  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <PublicHeader appHref={appHref} signedIn={Boolean(user)} userName={user?.name} />
      <main className="px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">Certificate verification</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Verify a certificate</h1>
          <p className="mt-3 text-sm leading-6 text-[#6e6875]">
            Every codemasterghana certificate carries an ID and a QR code. Enter the ID to check that it is genuine —
            this is what an employer, a school or a client should do before trusting one.
          </p>

          {!ready && (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-semibold leading-5 text-amber-900">
              Our records are momentarily unreachable, so a check right now could give the wrong answer. Please try
              again in a minute — or email us and we will verify by hand.
            </p>
          )}

          <form action="/verify" className="mt-7 rounded-[22px] border border-[#e8e4ec] bg-white p-5 sm:p-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#4d4753]">Certificate ID</span>
              <input
                name="code"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="CMG-WF-2026-7KQ2M4"
                className="w-full rounded-xl border border-[#dcd8e2] bg-white px-4 py-3 font-mono text-sm uppercase tracking-wide text-[#211d27] outline-none transition placeholder:text-[#aaa4b0] focus:border-[#7a5af0] focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#7a5aff]">
              <Icon name="shield" size={16} /> Check this certificate
            </button>
            <p className="mt-3 text-[11px] leading-5 text-[#918a97]">
              The code is printed under the holder&apos;s name and in their dashboard. It looks like
              <span className="mx-1 font-mono font-bold">CMG-WF-2026-7KQ2M4</span> — and the letters O and I are never
              used, so a code cannot be misread.
            </p>
          </form>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e8e4ec] bg-white p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name="search" size={17} /></span>
              <p className="mt-3 text-xs font-extrabold">What you will see</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7d7683]">
                The holder&apos;s name, the course, the study hours, the date it was issued and whether it is still
                valid — nothing else. No email address, no account details, no payment information.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8e4ec] bg-white p-5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name="mail" size={17} /></span>
              <p className="mt-3 text-xs font-extrabold">Code will not work?</p>
              <p className="mt-1.5 text-[11px] leading-5 text-[#7d7683]">
                Either it was mistyped or the certificate was withdrawn. <Link href="/contact" className="font-bold text-[#5e3de0] underline">Contact us</Link> with the name on it and we will check by hand.
              </p>
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-5 text-[#918a97]">
            Scanning the QR code on a certificate lands on exactly this check, so an employer never has to type
            anything. Certificates are issued only when every lesson in a course has been completed.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
