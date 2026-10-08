import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { requireCurrentUser } from "@/lib/require-user";
import { courseAccess } from "@/lib/access";
import {
  hasFinishedCourse,
  issueCertificate,
  studentCertificates,
  verificationQrSvg,
  verificationUrl,
} from "@/lib/certificates";
import { fmtDate } from "@/lib/format";
import { ownerDisplayName } from "@/lib/owner";
import CertificateActions from "@/components/CertificateActions";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export const metadata: Metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const user = await requireCurrentUser();
  const course = getCourse(courseId);
  if (!course) notFound();

  const finished = hasFinishedCourse(user, course.id);
  // A certificate celebrates finished work inside a program the student owns —
  // finishing implies owning, but the gate is checked anyway.
  const entitled = courseAccess(user, course).allowed;

  if (!finished || !entitled) {
    return (
      <div className="mx-auto max-w-md border-y border-[#ded9e3] py-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={finished ? "lock" : "certificate"} size={25} /></span>
        <h1 className="mt-4 text-xl font-black">{finished ? "Account paused" : "Complete the course first"}</h1>
        <p className="mt-2 text-sm leading-6 text-[#756f7b]">
          {finished
            ? "This account is paused, so a certificate cannot be issued yet. Contact your teacher."
            : `Finish every lesson in ${course.title} to earn this certificate. Lessons open once you own the program.`}
        </p>
        <Link href={`/dashboard/courses/${course.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white">
          {finished ? "Back to the course" : "Continue course"} <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    );
  }

  // Issuing is idempotent: the first visit creates the record, later visits show
  // the same code — an employer who checked last week must find it again today.
  const certificate = await issueCertificate(user, course.id);
  const qr = await verificationQrSvg(certificate.code);
  const verifyHref = verificationUrl(certificate.code);
  const others = studentCertificates(user).filter((item) => item.code !== certificate.code);
  const teacher = ownerDisplayName();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href="/dashboard/progress" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#756f7b]">
            <Icon name="arrow-left" size={13} /> Back to progress
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-[-.04em]">Course certificate</h1>
          <p className="mt-1 text-xs text-[#817a87]">
            Anyone can check it at <Link href={`/verify/${certificate.code}`} className="font-bold text-[#5e3de0] underline">{verifyHref.replace(/^https?:\/\//, "")}</Link>
          </p>
        </div>
        <CertificateActions code={certificate.code} verifyHref={verifyHref} courseTitle={course.title} />
      </div>

      {/* ---- the certificate ------------------------------------------------ */}
      <section className="certificate-sheet relative overflow-hidden border-[10px] border-[#1b1822] bg-[#fffdf7] px-6 py-10 text-center shadow-[0_24px_70px_rgba(34,27,52,.12)] sm:px-14 sm:py-14 print:border-4 print:px-10 print:py-8 print:shadow-none">
        <div className="absolute inset-3 border border-[#d8ceff]" />
        <div className="absolute -left-24 -top-24 size-52 rounded-full bg-[#eee9ff]" />
        <div className="absolute -bottom-24 -right-24 size-52 rounded-full bg-[#fff0e5]" />

        <div className="relative">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <Logo />
            <p className="text-[9px] font-black uppercase tracking-[.24em] text-[#9a939f]">Verifiable certificate</p>
          </div>

          <p className="mt-8 text-[10px] font-black uppercase tracking-[.3em] text-[#6d4aff]">Certificate of completion</p>
          <p className="mt-6 text-sm text-[#817a87]">This certifies that</p>
          <h2 className="mt-2 text-balance text-3xl font-black tracking-[-.05em] text-[#1b1822] sm:text-5xl">{user.name}</h2>
          <div className="mx-auto mt-4 h-px max-w-sm bg-[#d9d3df]" />
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[#716a78]">
            has completed every lesson and practical challenge of
          </p>
          <h3 className="mx-auto mt-3 max-w-2xl text-balance text-2xl font-black tracking-[-.035em] text-[#5e3de0] sm:text-3xl">{course.title}</h3>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#817a87]">
            {certificate.lessons} lessons · about {certificate.hours} hours of guided study · {course.category} program
          </p>

          <ul className="mx-auto mt-7 grid max-w-3xl gap-2 text-left sm:grid-cols-2">
            {course.outcomes.slice(0, 4).map((outcome) => (
              <li key={outcome} className="flex items-start gap-2 text-[11px] leading-5 text-[#5d5763]">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icon name="check" size={10} />
                </span>
                {outcome}
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-9 grid max-w-3xl items-end gap-6 text-left sm:grid-cols-[1fr_auto_1fr]">
            <div className="border-t border-[#cfc8d6] pt-2">
              <p className="text-[8px] font-black uppercase tracking-wider text-[#9a939f]">Issued</p>
              <p className="mt-1 text-xs font-bold">{fmtDate(certificate.issuedAt)}</p>
              <p className="mt-2 text-[8px] font-black uppercase tracking-wider text-[#9a939f]">Certificate ID</p>
              <p className="mt-1 break-all font-mono text-[11px] font-bold">{certificate.code}</p>
            </div>

            <div className="flex flex-col items-center gap-2 justify-self-center">
              {qr ? (
                <span className="grid size-[132px] place-items-center rounded-lg border border-[#e6e2e9] bg-white p-1.5" dangerouslySetInnerHTML={{ __html: qr }} />
              ) : (
                <span className="grid size-[132px] place-items-center rounded-lg border border-[#e6e2e9] bg-white p-2 text-[9px] text-[#9a939f]">Scan to verify</span>
              )}
              <p className="text-[8px] font-black uppercase tracking-wider text-[#9a939f]">Scan to verify</p>
            </div>

            <div className="border-t border-[#cfc8d6] pt-2 sm:text-right">
              <p className="font-[cursive] text-lg font-black text-[#332e39]">{teacher}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-[#9a939f]">Teacher, codemasterghana</p>
              <p className="mt-2 text-[9px] leading-4 text-[#9a939f]">Verify at {verifyHref.replace(/^https?:\/\//, "")}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="grid size-12 place-items-center rounded-full border-4 border-[#6d4aff] bg-[#eee9ff] text-[#6d4aff]"><Icon name="trophy" size={22} /></span>
          </div>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-[.15em] text-[#817a87]">Learn · Build · Become</p>
        </div>
      </section>

      {/* ---- what it is worth, in plain words -------------------------------- */}
      <div className="grid gap-4 print:hidden sm:grid-cols-3">
        {[
          ["shield", "Employers can check it", "The QR code and the link open a public page that shows your name, the course and the date — no account needed."],
          ["briefcase", "Write it on your CV", "Add the certificate ID to your CV or application email and link the verification page. It works for any job in Ghana or abroad."],
          ["download", "Save it as a PDF", "Press Print / save PDF and choose “Save as PDF” — a landscape A4 page, ready to attach to an application."],
        ].map(([icon, title, body]) => (
          <div key={title} className="rounded-2xl border border-[#e8e4ec] bg-white p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={icon as "shield"} size={17} /></span>
            <p className="mt-3 text-xs font-extrabold text-[#332e39]">{title}</p>
            <p className="mt-1.5 text-[11px] leading-5 text-[#7d7683]">{body}</p>
          </div>
        ))}
      </div>

      {others.length > 0 && (
        <section className="rounded-2xl border border-[#e8e4ec] bg-white p-5 print:hidden">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#8a8390]">Your other certificates</h2>
          <ul className="mt-3 divide-y divide-[#f0edf3]">
            {others.map((item) => (
              <li key={item.code} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-xs font-bold text-[#332e39]">{item.courseTitle}</p>
                  <p className="font-mono text-[10px] text-[#918a97]">{item.code} · {fmtDate(item.issuedAt)}</p>
                </div>
                <Link href={`/dashboard/certificates/${item.courseId}`} className="text-[11px] font-bold text-[#5e3de0]">Open</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
