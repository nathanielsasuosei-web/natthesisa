import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { coursePercent, getCourse } from "@/lib/courses";
import { requireCurrentUser } from "@/lib/require-user";
import { getPlan } from "@/lib/plans";
import { fmtDate } from "@/lib/format";
import CertificateActions from "@/components/CertificateActions";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export const metadata: Metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const user = await requireCurrentUser();
  const course = getCourse(courseId);
  if (!course) notFound();
  const progress = user.progress[course.id];
  const complete = progress && coursePercent(course, progress.completedLessonIds) === 100;
  const entitled = getPlan(user.subscription.planId).entitlements.certificates;

  if (!complete || !entitled) {
    return <div className="mx-auto max-w-md border-y border-[#ded9e3] py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={complete ? "lock" : "certificate"} size={25} /></span><h1 className="mt-4 text-xl font-black">{complete ? "Certificate requires Pro" : "Complete the course first"}</h1><p className="mt-2 text-sm leading-6 text-[#756f7b]">{complete ? "Upgrade to create and share certificates for completed learning paths." : `Finish every lesson in ${course.title} to earn this certificate.`}</p><Link href={complete ? "/dashboard/plans" : `/dashboard/courses/${course.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-xs font-extrabold text-white">{complete ? "View plans" : "Continue course"} <Icon name="arrow-right" size={14} /></Link></div>;
  }

  const certificateId = `CMG-${user.id.replaceAll("-", "").slice(0, 6).toUpperCase()}-${course.id.slice(0, 4).toUpperCase()}`;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><div><Link href="/dashboard/progress" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#756f7b]"><Icon name="arrow-left" size={13} /> Back to progress</Link><h1 className="mt-2 text-2xl font-black tracking-[-.04em]">Course certificate</h1></div><CertificateActions /></div>
      <section className="relative overflow-hidden border-[10px] border-[#1b1822] bg-[#fffdf7] px-8 py-12 text-center shadow-[0_24px_70px_rgba(34,27,52,.12)] sm:px-16 sm:py-16">
        <div className="absolute inset-3 border border-[#d8ceff]" /><div className="absolute -left-24 -top-24 size-52 rounded-full bg-[#eee9ff]" /><div className="absolute -bottom-24 -right-24 size-52 rounded-full bg-[#fff0e5]" />
        <div className="relative"><Logo className="justify-center" /><p className="mt-10 text-[10px] font-black uppercase tracking-[.3em] text-[#6d4aff]">Certificate of completion</p><p className="mt-7 text-sm text-[#817a87]">This certifies that</p><h2 className="mt-2 text-balance text-4xl font-black tracking-[-.05em] text-[#1b1822] sm:text-5xl">{user.name}</h2><div className="mx-auto mt-4 h-px max-w-sm bg-[#d9d3df]" /><p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-[#716a78]">has successfully completed every lesson and practical challenge in</p><h3 className="mx-auto mt-3 max-w-2xl text-balance text-2xl font-black tracking-[-.035em] text-[#5e3de0] sm:text-3xl">{course.title}</h3><div className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-8 text-left"><div className="border-t border-[#cfc8d6] pt-2"><p className="text-[8px] font-black uppercase tracking-wider text-[#9a939f]">Completed</p><p className="mt-1 text-xs font-bold">{fmtDate(progress.lastAccessedAt)}</p></div><div className="border-t border-[#cfc8d6] pt-2"><p className="text-[8px] font-black uppercase tracking-wider text-[#9a939f]">Certificate ID</p><p className="mt-1 font-mono text-xs font-bold">{certificateId}</p></div></div><div className="mx-auto mt-10 grid size-16 place-items-center rounded-full border-4 border-[#6d4aff] bg-[#eee9ff] text-[#6d4aff]"><Icon name="trophy" size={28} /></div><p className="mt-3 text-[9px] font-bold uppercase tracking-[.15em] text-[#817a87]">Learn · Build · Become</p></div>
      </section>
    </div>
  );
}
