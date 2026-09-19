import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { computeStats, estimateMrr, toAdminRow } from "@/lib/admin";
import { getCurrentAdmin } from "@/lib/session";
import { getStore } from "@/lib/store";
import { fmtMinutes, fmtMoney } from "@/lib/format";
import AdminUsersTable from "@/components/AdminUsersTable";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Admin console" };

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin-sign-in");
  const stats = computeStats();
  const mrr = estimateMrr();
  const users = [...getStore().users.values()].map(toAdminRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const maxEnrollment = Math.max(...stats.coursePerformance.map((item) => item.enrollments), 1);
  const cards = [
    { label: "Total learners", value: stats.learners.toLocaleString(), note: `${stats.activeLearners} active this week`, icon: "users", style: "bg-violet-100 text-violet-700" },
    { label: "Lessons completed", value: stats.lessonsCompleted.toLocaleString(), note: `${stats.certificatesEarned} courses completed`, icon: "check", style: "bg-cyan-100 text-cyan-700" },
    { label: "Learning time", value: fmtMinutes(stats.learningMinutes), note: "Across all learners", icon: "clock", style: "bg-orange-100 text-orange-700" },
    { label: "All-time revenue", value: fmtMoney(stats.totalRevenue), note: `${stats.invoiceCount} paid invoices`, icon: "card", style: "bg-emerald-100 text-emerald-700" },
    { label: "Estimated MRR", value: fmtMoney(mrr), note: "Yearly plans normalized", icon: "chart", style: "bg-pink-100 text-pink-700" },
    { label: "Paused accounts", value: String(stats.suspended), note: `${stats.admins} administrator${stats.admins === 1 ? "" : "s"}`, icon: "pause", style: "bg-amber-100 text-amber-800" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold text-[#8a8390]">Platform control center</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Good morning, {admin.name.split(" ")[0]}</h1><p className="mt-1.5 text-sm text-[#756f7b]">Monitor learners, course activity, subscriptions and access from one place.</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[10px] font-extrabold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" /> All systems operational</span></header>

      <section className="open-stat-strip grid gap-0 sm:grid-cols-2 xl:grid-cols-6">{cards.map((card, index) => <article key={card.label} className="open-stat animate-fade-up" style={{ animationDelay: `${index * .04}s` }}><div className="flex items-center justify-between"><span className={`grid size-8 place-items-center rounded-xl ${card.style}`}><Icon name={card.icon as "users"} size={16} /></span><Icon name="chart" size={13} className="text-[#c1bbc5]" /></div><p className="mt-4 text-lg font-black tracking-[-.035em]">{card.value}</p><p className="mt-1 text-[9px] font-bold text-[#6c6672]">{card.label}</p><p className="mt-1 text-[8px] text-[#aaa4b0]">{card.note}</p></article>)}</section>

      <section className="open-columns grid gap-0 xl:grid-cols-[1.25fr_.75fr]">
        <article className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Course engagement</h2><p className="mt-1 text-[10px] text-[#918a97]">Enrollment and completion across the library</p></div><span className="rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-[9px] font-black text-[#5e3de0]">Live overview</span></div><div className="mt-6 space-y-4">{stats.coursePerformance.map((course) => <div key={course.courseId} className="grid grid-cols-[130px_1fr_86px] items-center gap-3 sm:grid-cols-[180px_1fr_110px]"><div className="min-w-0"><p className="truncate text-[10px] font-bold text-[#514b57]">{course.title}</p><p className="mt-0.5 text-[8px] text-[#aaa4b0]">{course.lessonsCompleted} lessons finished</p></div><div className="h-2 overflow-hidden rounded-full bg-[#eeeaf1]"><div className="h-full rounded-full bg-gradient-to-r from-[#6d4aff] to-[#9c83ff]" style={{ width: `${Math.max(course.enrollments ? 8 : 0, (course.enrollments / maxEnrollment) * 100)}%` }} /></div><p className="text-right text-[9px] text-[#817a87]"><strong className="text-[#4e4854]">{course.enrollments}</strong> enrolled · {course.completions} done</p></div>)}</div></article>

        <article className="open-column rounded-[22px] border border-[#e2dee7] bg-white p-5 sm:p-6"><div><h2 className="text-sm font-extrabold">Plan distribution</h2><p className="mt-1 text-[10px] text-[#918a97]">Current learner access</p></div><div className="mt-6 space-y-5">{stats.byPlan.map((plan, index) => { const percent = stats.learners ? Math.round((plan.count / stats.learners) * 100) : 0; const colors = ["bg-[#b8aae9]", "bg-[#6d4aff]", "bg-[#ff7448]"]; return <div key={plan.planId}><div className="mb-2 flex justify-between text-[10px]"><span className="font-bold text-[#5f5965]">{plan.planName}</span><span className="font-black">{plan.count} <span className="font-medium text-[#9a939f]">· {percent}%</span></span></div><div className="h-2 overflow-hidden rounded-full bg-[#eeeaf1]"><div className={`h-full rounded-full ${colors[index]}`} style={{ width: `${percent}%` }} /></div></div>; })}</div><div className="mt-7 border-l-2 border-[#6d4aff] py-1 pl-4"><div className="flex items-center gap-2"><Icon name="spark" size={16} className="text-[#6d4aff]" /><p className="text-[10px] font-extrabold">Conversion snapshot</p></div><p className="mt-2 text-[9px] leading-4 text-[#817a87]">{stats.learners ? Math.round(((stats.byPlan[1].count + stats.byPlan[2].count) / stats.learners) * 100) : 0}% of learners currently have paid access.</p></div></article>
      </section>

      <AdminUsersTable initialUsers={users} adminId={admin.id} />
      <div className="open-callout flex gap-3 text-[#5870a5]"><Icon name="shield" size={18} className="mt-0.5 shrink-0 text-[#3f67c8]" /><p className="text-[10px] leading-5 text-[#5870a5]"><strong className="text-[#294a96]">Admin controls are server-enforced.</strong> Paused learners cannot save progress or change plans. Comped plan changes do not create an invoice, and administrators cannot pause or delete their own account.</p></div>
    </div>
  );
}
