import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { getCourse } from "@/lib/courses";
import { hasFinishedCourse, studentCertificates, verificationUrl } from "@/lib/certificates";
import { contentTotals } from "@/lib/course-content";
import { COURSES } from "@/lib/courses";
import { fmtDate } from "@/lib/format";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "My certificates" };

/**
 * The learner's certificates in one place.
 *
 * A certificate is issued when a course is finished. This page also lists
 * finished courses whose certificate was never opened, so nothing earned is
 * ever silently hidden.
 */
export default async function CertificatesPage() {
  const user = await requireCurrentUser();
  const certificates = studentCertificates(user);
  const earned = new Set(certificates.map((item) => item.courseId));

  // Finished, but the certificate page was never opened.
  const pending = COURSES.filter((course) => !earned.has(course.id) && hasFinishedCourse(user, course.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Your record</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Certificates</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            Each one carries an ID and a QR code that opens a public page an employer or client can check without an
            account. {certificates.length > 0 ? `${certificates.length} earned so far.` : "Finish a course to earn your first."}
          </p>
        </div>
        <Link href="/verify" className="inline-flex items-center gap-2 rounded-xl border border-[#dad5df] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6]">
          <Icon name="shield" size={14} /> How verification looks
        </Link>
      </header>

      {certificates.length === 0 ? (
        <section className="border-y border-[#ded9e3] py-12 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0ecff] text-[#6d4aff]"><Icon name="certificate" size={25} /></span>
          <h2 className="mt-4 text-lg font-black">Your first certificate is waiting</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#756f7b]">
            Complete every lesson in any course you own and the certificate is created here automatically.
          </p>
          <Link href="/dashboard/courses" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white transition hover:bg-[#5e3de0]">
            Browse the courses <Icon name="arrow-right" size={14} />
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {certificates.map((certificate) => (
            <article key={certificate.code} className="overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white">
              <div className="flex items-start gap-3 border-b border-[#f0edf3] p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#6d4aff] text-white"><Icon name="trophy" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#332e39]">{certificate.courseTitle}</p>
                  <p className="mt-0.5 text-[10px] text-[#918a97]">
                    {certificate.program} · issued {fmtDate(certificate.issuedAt)} · {certificate.lessons} lessons
                  </p>
                </div>
              </div>
              <div className="space-y-2 p-5 text-[11px]">
                <p className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[#8a8390]">Certificate ID</span>
                  <span className="font-mono font-bold text-[#332e39]">{certificate.code}</span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[#8a8390]">Public check</span>
                  <Link href={`/verify/${encodeURIComponent(certificate.code)}`} className="truncate font-bold text-[#5e3de0] underline">{verificationUrl(certificate.code).replace(/^https?:\/\//, "")}</Link>
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5 border-t border-[#f0edf3] bg-[#fbfafc] p-4">
                <Link href={`/dashboard/certificates/${certificate.courseId}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#17151f] px-3.5 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#2a2632]">
                  <Icon name="certificate" size={13} /> Open &amp; print
                </Link>
                <Link href={`/dashboard/courses/${getCourse(certificate.courseId)?.slug ?? certificate.courseId}`} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dad5df] bg-white px-3.5 py-2.5 text-[11px] font-extrabold text-[#4a4450] transition hover:bg-[#f4f2f6]">
                  <Icon name="book" size={13} /> Revisit the course
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h2 className="text-sm font-extrabold text-amber-950">Finished — create your certificate</h2>
          <p className="mt-1.5 text-[11px] leading-5 text-amber-900/80">
            Every lesson is complete. Open the course to create the certificate.
          </p>
          <ul className="mt-4 divide-y divide-amber-200/70">
            {pending.map((course) => (
              <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-xs font-extrabold text-amber-950">{course.title}</p>
                  <p className="mt-0.5 text-[10px] text-amber-900/70">Every lesson complete</p>
                </div>
                <Link href={`/dashboard/certificates/${course.id}`} className="rounded-xl bg-amber-900 px-3.5 py-2 text-[11px] font-extrabold text-white transition hover:bg-amber-950">
                  Create certificate
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
