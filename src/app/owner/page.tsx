import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { computeOwnerStats, coursePriceRows, estimateMonthlyRevenue, lessonPriceRows, toStudentRow } from "@/lib/owner-console";
import { pricing } from "@/lib/plans";
import OwnerPricingCard from "@/components/OwnerPricingCard";
import { getCurrentOwner } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { listUsers } from "@/lib/store";
import { fmtMinutes, fmtMoney } from "@/lib/format";
import { COURSES } from "@/lib/courses";
import OwnerStudentsTable from "@/components/OwnerStudentsTable";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Teacher console" };

export default async function OwnerConsolePage() {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/owner-sign-in");
  const stats = await computeOwnerStats();
  const monthlyValue = await estimateMonthlyRevenue();
  const prices = pricing();
  const users = (await listUsers()).map(toStudentRow);
  const maxEnrollment = Math.max(...stats.coursePerformance.map((item) => item.enrollments), 1);
  const cards = [
    { label: "Students", value: stats.students.toLocaleString(), note: `${stats.withActivePass} with an active pass`, icon: "users", style: "bg-violet-100 text-violet-700" },
    { label: "Lessons completed", value: stats.lessonsCompleted.toLocaleString(), note: `${stats.certificatesEarned} courses completed`, icon: "check", style: "bg-cyan-100 text-cyan-700" },
    { label: "Learning time", value: fmtMinutes(stats.learningMinutes), note: "Across all students", icon: "clock", style: "bg-orange-100 text-orange-700" },
    { label: "All-time revenue", value: fmtMoney(stats.totalRevenue), note: `${stats.invoiceCount} paid invoices`, icon: "card", style: "bg-emerald-100 text-emerald-700" },
    { label: "Passes running", value: fmtMoney(monthlyValue), note: "Per month, if everyone renewed", icon: "chart", style: "bg-pink-100 text-pink-700" },
    { label: "Paused accounts", value: String(stats.suspended), note: `${prices.daily > 0 ? fmtMoney(prices.daily) : "Free"} day pass`, icon: "pause", style: "bg-amber-100 text-amber-800" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold text-[#8a8390]">Platform control center</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Hello, {owner.name.split(" ")[0]}</h1><p className="mt-1.5 text-sm text-[#756f7b]">Your students, your prices and your lessons — all from here.</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[10px] font-extrabold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" /> All systems operational</span></header>

      <section className="open-stat-strip grid gap-0 sm:grid-cols-2 xl:grid-cols-6">{cards.map((card, index) => <article key={card.label} className="open-stat animate-fade-up" style={{ animationDelay: `${index * .04}s` }}><div className="flex items-center justify-between"><span className={`grid size-8 place-items-center rounded-xl ${card.style}`}><Icon name={card.icon as "users"} size={16} /></span><Icon name="chart" size={13} className="text-[#c1bbc5]" /></div><p className="mt-4 text-lg font-black tracking-[-.035em]">{card.value}</p><p className="mt-1 text-[9px] font-bold text-[#6c6672]">{card.label}</p><p className="mt-1 text-[8px] text-[#aaa4b0]">{card.note}</p></article>)}</section>

      <section className="open-columns grid gap-0 xl:grid-cols-[1.25fr_.75fr]">
        <article className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Course engagement</h2><p className="mt-1 text-[10px] text-[#918a97]">Enrollment and completion across the library</p></div><span className="rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-[9px] font-black text-[#5e3de0]">Live overview</span></div><div className="mt-6 space-y-4">{stats.coursePerformance.map((course) => <div key={course.courseId} className="grid grid-cols-[130px_1fr_86px] items-center gap-3 sm:grid-cols-[180px_1fr_110px]"><div className="min-w-0"><p className="truncate text-[10px] font-bold text-[#514b57]">{course.title}</p><p className="mt-0.5 text-[8px] text-[#aaa4b0]">{fmtMoney(course.price)} · {course.lessonsCompleted} lessons finished</p></div><div className="h-2 overflow-hidden rounded-full bg-[#eeeaf1]"><div className="h-full rounded-full bg-gradient-to-r from-[#6d4aff] to-[#9c83ff]" style={{ width: `${Math.max(course.enrollments ? 8 : 0, (course.enrollments / maxEnrollment) * 100)}%` }} /></div><p className="text-right text-[9px] text-[#817a87]"><strong className="text-[#4e4854]">{course.enrollments}</strong> enrolled · {course.completions} done</p></div>)}</div></article>

        <article className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6"><div><h2 className="text-sm font-extrabold">Passes running</h2><p className="mt-1 text-[10px] text-[#918a97]">Students with an active pass, by length</p></div><div className="mt-6 space-y-5">{stats.byPeriod.map((item, index) => { const percent = stats.withActivePass ? Math.round((item.count / stats.withActivePass) * 100) : 0; const colors = ["bg-[#b8aae9]", "bg-[#6d4aff]", "bg-[#ff7448]"]; return <div key={item.period}><div className="mb-2 flex justify-between text-[10px]"><span className="font-bold text-[#5f5965]">{item.label} · {fmtMoney(prices[item.period])}</span><span className="font-black">{item.count} <span className="font-medium text-[#9a939f]">· {percent}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-[#eeeaf1]"><div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${percent}%` }} /></div></div>; })}</div><div className="mt-7 border-l-2 border-[#6d4aff] py-1 pl-4"><div className="flex items-center gap-2"><Icon name="spark" size={16} className="text-[#6d4aff]" /><p className="text-[10px] font-extrabold">Access snapshot</p></div><p className="mt-2 text-[9px] leading-4 text-[#817a87]">{stats.students ? Math.round((stats.withActivePass / stats.students) * 100) : 0}% of students currently have an active pass.</p></div></article>
      </section>

      <OwnerPricingCard initialPricing={prices} courses={coursePriceRows()} lessons={lessonPriceRows()} />

      {isOwner(owner) && (
        <section className="open-column flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#ffcf59]/25 text-[#8a6d00]"><Icon name="crown" size={19} /></span>
            <div>
              <h2 className="text-sm font-extrabold">You are the teacher</h2>
              <p className="mt-1 text-[10px] leading-5 text-[#918a97]">Only this account publishes lessons, sets prices and manages students. Everyone else is a student.</p>
            </div>
          </div>
          <Link href="/owner/lessons" className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(109,74,255,.2)] transition hover:-translate-y-0.5 hover:bg-[#5d3ce2]"><Icon name="upload" size={15} /> Publish a lesson</Link>
        </section>
      )}

      <OwnerStudentsTable
        initialUsers={users}
        ownerId={owner.id}
        courses={COURSES.map((course) => ({ id: course.id, title: course.title }))}
      />
      <div className="open-callout flex gap-3 text-[#5870a5]"><Icon name="shield" size={18} className="mt-0.5 shrink-0 text-[#3f67c8]" /><p className="text-[10px] leading-5 text-[#5870a5]"><strong className="text-[#294a96]">These controls are enforced on the server.</strong> A paused student cannot open lessons or save progress. Grants and comped passes never create an invoice, and your own account cannot be paused or deleted.</p></div>
    </div>
  );
}
