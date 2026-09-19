import type { Metadata } from "next";
import Link from "next/link";
import { COURSES, coursePercent, getCourse, getCourseLessons } from "@/lib/courses";
import { requireCurrentUser } from "@/lib/require-user";
import { completedLessonCount } from "@/lib/store";
import { getPlan } from "@/lib/plans";
import { fmtDate, fmtDateTime, fmtMinutes } from "@/lib/format";
import CourseVisual from "@/components/CourseVisual";
import ExportButton from "@/components/ExportButton";
import Icon from "@/components/Icon";
import UsageChart from "@/components/UsageChart";

export const metadata: Metadata = { title: "My progress" };

export default async function ProgressPage() {
  const user = await requireCurrentUser();
  const plan = getPlan(user.subscription.planId);
  const records = Object.values(user.progress)
    .map((progress) => ({ progress, course: getCourse(progress.courseId) }))
    .filter((item): item is { progress: typeof item.progress; course: NonNullable<typeof item.course> } => Boolean(item.course))
    .sort((a, b) => b.progress.lastAccessedAt.localeCompare(a.progress.lastAccessedAt));
  const completedCourses = records.filter(({ course, progress }) => coursePercent(course, progress.completedLessonIds) === 100);
  const weeklyMinutes = user.usage.history.reduce((sum, day) => sum + day.count, 0);
  const activeDays = user.usage.history.filter((day) => day.count > 0).length;
  const totalLessons = completedLessonCount(user);
  const categoryProgress = ["Web Development", "App Development", "Computer Science", "Backend"].map((category) => {
    const courses = COURSES.filter((course) => course.category === category);
    const total = courses.reduce((sum, course) => sum + getCourseLessons(course).length, 0);
    const done = courses.reduce((sum, course) => sum + (user.progress[course.id]?.completedLessonIds.length ?? 0), 0);
    return { category, percent: total ? Math.round((done / total) * 100) : 0 };
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold text-[#8a8390]">Learning analytics</p><h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Your progress</h1><p className="mt-1.5 text-sm text-[#756f7b]">Every lesson completed is proof that you are moving forward.</p></div>{plan.entitlements.downloads ? <ExportButton /> : <Link href="/dashboard/plans" className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-3.5 py-2.5 text-xs font-bold text-[#5e5864]"><Icon name="lock" size={14} /> Export with Pro</Link>}</header>

      <section className="open-stat-strip grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Lessons completed", String(totalLessons), "check", "bg-violet-100 text-violet-700"],
          ["Lifetime learning", fmtMinutes(user.lifetimeMinutes), "clock", "bg-cyan-100 text-cyan-700"],
          ["Active this week", `${activeDays} days`, "calendar", "bg-orange-100 text-orange-700"],
          ["Certificates earned", String(completedCourses.length), "certificate", "bg-emerald-100 text-emerald-700"],
        ].map(([label, value, icon, style]) => <article key={label} className="open-stat"><span className={`grid size-9 place-items-center rounded-xl ${style}`}><Icon name={icon as "clock"} size={18} /></span><p className="mt-4 text-xl font-black tracking-[-.03em]">{value}</p><p className="mt-1 text-[10px] font-bold text-[#817a87]">{label}</p></article>)}
      </section>

      <section className="open-columns grid gap-0 xl:grid-cols-[1.35fr_.8fr]">
        <article className="open-column rounded-[22px] border border-[#e6e2e9] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Learning this week</h2><p className="mt-1 text-[10px] text-[#918a97]">{weeklyMinutes} minutes across {activeDays} active days</p></div><span className="rounded-xl bg-[#f0ecff] px-3 py-2 text-xs font-black text-[#5e3de0]">{Math.round((weeklyMinutes / Math.max(user.profile.weeklyGoal, 1)) * 100)}% of goal</span></div><div className="mt-3"><UsageChart history={user.usage.history} /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeebf1]"><div className="h-full rounded-full bg-gradient-to-r from-[#6d4aff] to-[#9d84ff]" style={{ width: `${Math.min(100, (weeklyMinutes / user.profile.weeklyGoal) * 100)}%` }} /></div><div className="mt-2 flex justify-between text-[9px] font-semibold text-[#9c95a2]"><span>{weeklyMinutes} minutes learned</span><span>{user.profile.weeklyGoal} minute goal</span></div></article>

        <article className="open-column rounded-[22px] border border-[#e6e2e9] bg-white p-5 sm:p-6"><div><h2 className="text-sm font-extrabold">Skills in progress</h2><p className="mt-1 text-[10px] text-[#918a97]">Across the complete library</p></div><div className="mt-5 space-y-4">{categoryProgress.map((item) => <div key={item.category}><div className="mb-2 flex items-center justify-between text-[10px]"><span className="font-bold text-[#5f5965]">{item.category}</span><span className="font-black text-[#6d4aff]">{item.percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#eeebf1]"><div className="h-full rounded-full bg-[#6d4aff]" style={{ width: `${item.percent}%` }} /></div></div>)}</div></article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-base font-black tracking-[-.025em]">Course progress</h2><p className="mt-1 text-xs text-[#89828f]">Your active learning paths</p></div><Link href="/dashboard/courses" className="text-[11px] font-bold text-[#6543e8]">Explore courses →</Link></div>
        {records.length ? <div className="open-list">{records.map(({ course, progress }) => { const percent = coursePercent(course, progress.completedLessonIds); const lessonTotal = getCourseLessons(course).length; const next = getCourseLessons(course).find((lesson) => !progress.completedLessonIds.includes(lesson.id)); return <article key={course.id} className="grid gap-5 py-5 sm:grid-cols-[180px_1fr] sm:items-center"><CourseVisual course={course} className="min-h-36 overflow-hidden rounded-xl" compact /><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-wider text-[#6d4aff]">{course.category}</p><h3 className="mt-1 text-sm font-extrabold leading-5">{course.shortTitle}</h3></div><span className="text-sm font-black text-[#5e3de0]">{percent}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eeebf1]"><div className="h-full rounded-full bg-[#6d4aff]" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-[9px] text-[#9a939f]"><span>{progress.completedLessonIds.length} of {lessonTotal} lessons</span><span>Last opened {fmtDate(progress.lastAccessedAt)}</span></div><Link href={next ? `/learn/${course.id}/${next.id}` : `/dashboard/courses/${course.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black text-[#5f3ee1]">{percent === 100 ? "Review course" : "Continue learning"} <Icon name="arrow-right" size={12} /></Link></div></article>; })}</div> : <div className="border-y border-dashed border-[#d9d4df] px-6 py-12 text-center"><Icon name="book" size={26} className="mx-auto text-[#918a97]" /><h3 className="mt-3 text-sm font-extrabold">No courses started yet</h3><Link href="/dashboard/courses" className="mt-3 inline-block text-xs font-bold text-[#6543e8]">Choose your first course →</Link></div>}
      </section>

      <section className="open-columns grid gap-0 xl:grid-cols-2">
        <article className="open-column rounded-[22px] border border-[#e6e2e9] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Certificates</h2><p className="mt-1 text-[10px] text-[#918a97]">Proof of every completed path</p></div><Icon name="certificate" size={22} className="text-[#6d4aff]" /></div>{completedCourses.length ? <div className="mt-5 space-y-3">{completedCourses.map(({ course }) => <div key={course.id} className="flex items-center gap-3 border-b border-[#e8e4eb] py-3 last:border-0"><span className="grid size-10 place-items-center rounded-xl bg-[#6d4aff] text-white"><Icon name="trophy" size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{course.title}</p><p className="mt-0.5 text-[9px] text-[#918a97]">Completed · codemasterghana certificate</p></div>{plan.entitlements.certificates ? <Link href={`/dashboard/certificates/${course.id}`} className="text-[10px] font-bold text-[#6543e8]">View</Link> : <Icon name="lock" size={14} className="text-[#918a97]" />}</div>)}</div> : <div className="mt-5 border-y border-[#e8e4eb] px-4 py-8 text-center"><p className="text-xs font-bold text-[#6a6470]">Your first certificate is waiting.</p><p className="mt-1 text-[10px] text-[#9a939f]">Complete every lesson in a course to earn it.</p></div>}</article>

        <article className="open-column relative overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Learning timeline</h2><p className="mt-1 text-[10px] text-[#918a97]">Your recent milestones</p></div>{!plan.entitlements.activityLog && <Icon name="lock" size={16} className="text-[#918a97]" />}</div>{plan.entitlements.activityLog ? <div className="mt-5 space-y-4">{user.activityLog.slice(0, 5).map((event, index) => <div key={event.id} className="relative flex gap-3"><span className={`relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${event.type === "learning" ? "bg-violet-100 text-violet-700" : "bg-[#f0edf2] text-[#716a78]"}`}><Icon name={event.type === "learning" ? "check" : event.type === "billing" ? "card" : "user"} size={13} /></span>{index < Math.min(4, user.activityLog.length - 1) && <span className="absolute left-3.5 top-7 h-8 w-px bg-[#ebe7ed]" />}<div><p className="text-[10px] font-semibold leading-4 text-[#5d5763]">{event.text}</p><p className="mt-0.5 text-[8px] text-[#aaa4b0]">{fmtDateTime(event.ts)}</p></div></div>)}</div> : <div className="mt-5 border-y border-[#e6e2e9] py-6 text-center"><span className="mx-auto grid size-9 place-items-center rounded-xl bg-[#eee9ff] text-[#6d4aff]"><Icon name="lock" size={17} /></span><p className="mt-3 text-xs font-extrabold">Full timeline is a Pro feature</p><p className="mt-1 text-[10px] leading-4 text-[#918a97]">See every lesson, milestone and achievement in one place.</p><Link href="/dashboard/plans" className="mt-3 inline-block text-[10px] font-black text-[#6543e8]">Compare plans →</Link></div>}</article>
      </section>
    </div>
  );
}
