import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/session";
import { allCertificates } from "@/lib/certificates";
import { ensureReady } from "@/lib/bootstrap";
import OwnerCertificates from "@/components/OwnerCertificates";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Certificates · Teacher console" };

export const dynamic = "force-dynamic";

export default async function OwnerCertificatesPage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/owner-sign-in");
  // The register is read from the certificate index, which lives in the
  // hydrated state cache — make sure it is loaded before reporting an empty
  // list to the teacher.
  await ensureReady().catch(() => undefined);
  const certificates = allCertificates();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Teacher console</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Certificates</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            Every certificate issued by the platform. Students earn them by finishing a course while their pass is
            active; you can withdraw one if the work is not the student&apos;s own.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/verify" className="inline-flex items-center gap-2 rounded-xl border border-[#dad5df] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6]">
            <Icon name="shield" size={14} /> Public verification page
          </Link>
          <Link href="/owner" className="inline-flex items-center gap-2 rounded-xl border border-[#dad5df] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6]">
            <Icon name="arrow-left" size={14} /> Console
          </Link>
        </div>
      </header>

      <OwnerCertificates initialCertificates={certificates} />

      <section className="rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
        <h2 className="text-sm font-extrabold">How a certificate is earned</h2>
        <ol className="mt-3 space-y-2.5 text-[12px] leading-6 text-[#6d6673]">
          <li><strong className="text-[#332e39]">1.</strong> The student completes every lesson in a course.</li>
          <li><strong className="text-[#332e39]">2.</strong> They open the course&apos;s certificate page while their pass is active.</li>
          <li><strong className="text-[#332e39]">3.</strong> A code is generated once and never changes, and the public record is written to the certificate index.</li>
          <li><strong className="text-[#332e39]">4.</strong> Anyone can check the code at <Link href="/verify" className="font-bold text-[#5e3de0] underline">/verify</Link> — the page shows the holder, course, hours, date and status, and nothing else.</li>
        </ol>
      </section>
    </div>
  );
}
