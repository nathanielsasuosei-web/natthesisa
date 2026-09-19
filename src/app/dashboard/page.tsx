import Link from "next/link";
import { COURSES, coursePercent, getCourse, getCourseLessons } from "@/lib/courses";
import { getPlan } from "@/lib/plans";
import { completedLessonCount } from "@/lib/store";
import { requireCurrentUser } from "@/lib/require-user";
import { fmtMinutes } from "@/lib/format";
import CourseVisual from "@/components/CourseVisual";
import CourseCard from "@/components/CourseCard";
import Icon from "@/components/Icon";
import ProgressRing from "@/components/ProgressRing";
import UsageChart from "@/components/UsageChart";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const plan = getPlan(user.subscription.planId);
  const progressRecords = Object.values(user.progress).sort((a, b) => b.lastAccessedAt.localeCompare(a.lastAccessedAt));
  const currentProgress = progressRecords[0];
  const currentCourse = currentProgress ? getCourse(currentProgress.courseId) : undefined;
  const currentPercent = currentCourse ? coursePercent(currentCourse, currentProgress.completedLessonIds) : 0;
  const currentLessons = currentCourse ? getCourseLessons(currentCourse) : [];
  const nextLesson = currentCourse
    ? currentLessons.find((lesson) => !currentProgress.completedLessonIds.includes(lesson.id)) ?? currentLessons.at(-1)
    : undefined;
  const lessonsDone = completedLessonCount(user);
  const weeklyMinutes = user.usage.history.reduce((sum, day) => sum + day.count, 0);
  const streak = (() => {
    let days = 0;
    for (let index = user.usage.history.length - 1; index >= 0; index -= 1) {
      if (user.usage.history[index].count <= 0) break;
      days += 1;
    }
    return days;
  })();
  const recommendations = COURSES.filter((course) => !user.progress[course.id]).slice(0, 2);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Your learning dashboard</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#1c1922] sm:text-3xl">Welcome back, {user.name.split(" ")[0]} <span aria-hidden>👋</span></h1>
          <p className="mt-1.5 text-sm text-[#756f7b]">A little progress today becomes a serious skill tomorrow.</p>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Notifications" className="grid size-10 place-items-center rounded-xl border border-[#e4e0e8] bg-white text-[#77707e] transition hover:border-violet-300"><Icon name="bell" size={18} /></button>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(109,74,255,.2)] transition hover:-translate-y-0.5 hover:bg-[#5d3ce2]">Explore courses <Icon name="arrow-right" size={15} /></Link>
        </div>
      </header>

      <section className="open-stat-strip grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Lessons completed", value: String(lessonsDone), note: `${progressRecords.length} course${progressRecords.length === 1 ? "" : "s"} started`, icon: "check", iconStyle: "bg-violet-100 text-violet-700" },
          { label: "Learning time", value: fmtMinutes(user.lifetimeMinutes), note: `${weeklyMinutes} min this week`, icon: "clock", iconStyle: "bg-cyan-100 text-cyan-700" },
          { label: "Current streak", value: `${streak} day${streak === 1 ? "" : "s"}`, note: streak ? "Keep showing up" : "Learn today to begin", icon: "flame", iconStyle: "bg-orange-100 text-orange-700" },
          { label: "Certificates", value: String(progressRecords.filter((record) => { const course = getCourse(record.courseId); return course && coursePercent(course, record.completedLessonIds) === 100; }).length), note: plan.entitlements.certificates ? "Share your achievement" : "Available with Pro", icon: "certificate", iconStyle: "bg-emerald-100 text-emerald-700" },
        ].map((stat, index) => (
          <article key={stat.label} className="open-stat animate-fade-up" style={{ animationDelay: `${index * .05}s` }}>
            <div className="flex items-center justify-between"><span className={`grid size-9 place-items-center rounded-xl ${stat.iconStyle}`}><Icon name={stat.icon as "clock"} size={18} /></span><Icon name="chevron-right" size={15} className="text-[#bbb5c0]" /></div>
            <p className="mt-4 text-xl font-black tracking-[-.035em]">{stat.value}</p><p className="mt-0.5 text-[11px] font-bold text-[#6f6975]">{stat.label}</p><p className="mt-1 text-[10px] text-[#a09aa6]">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="open-columns grid gap-0 xl:grid-cols-[1.55fr_.85fr]">
        <article className="open-column overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white shadow-[0_10px_32px_rgba(31,24,45,.04)]">
          <div className="flex items-center justify-between border-b border-[#f0edf2] px-5 py-4"><div><h2 className="text-sm font-extrabold">Continue learning</h2><p className="mt-0.5 text-[10px] text-[#918a97]">Pick up from your latest lesson</p></div>{currentCourse && <Link href={`/dashboard/courses/${currentCourse.slug}`} className="text-[11px] font-bold text-[#6543e8]">View course</Link>}</div>
          {currentCourse && currentProgress && nextLesson ? (
            <div className="grid sm:grid-cols-[170px_1fr]">
              <CourseVisual course={currentCourse} className="min-h-44 overflow-hidden rounded-xl" compact />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><div><span className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">{currentCourse.category}</span><h3 className="mt-1.5 text-lg font-black tracking-[-.03em]">{currentCourse.title}</h3></div><ProgressRing value={currentPercent} size={56} stroke={5} /></div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f7f5fa] px-3 py-2.5"><span className="grid size-8 place-items-center rounded-lg bg-white text-[#6d4aff] shadow-sm"><Icon name="play" size={12} /></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold">Next: {nextLesson.title}</p><p className="text-[9px] text-[#918a97]">{nextLesson.duration} minutes</p></div><Link href={`/learn/${currentCourse.id}/${nextLesson.id}`} className="rounded-lg bg-[#1c1922] px-3 py-2 text-[10px] font-bold text-white">Continue</Link></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#eee9ff] text-[#6d4aff]"><Icon name="book" size={23} /></span><h3 className="mt-3 text-sm font-extrabold">Choose your first course</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[#817a87]">Start with Web Foundations or Computer Science Essentials—both are included free.</p><Link href="/dashboard/courses" className="mt-4 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-bold text-white">Browse courses</Link></div>
          )}
        </article>

        <article className="open-column rounded-[22px] border border-[#e6e2e9] bg-white p-5 shadow-[0_10px_32px_rgba(31,24,45,.04)]">
          <div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold">Weekly activity</h2><p className="mt-0.5 text-[10px] text-[#918a97]">Minutes spent learning</p></div><span className="rounded-lg bg-[#f1edff] px-2.5 py-1.5 text-[10px] font-black text-[#5f3ee1]">{weeklyMinutes} min</span></div>
          <UsageChart history={user.usage.history} />
          <div className="mt-4 border-t border-[#f0edf2] pt-4"><div className="flex items-center justify-between text-[10px]"><span className="font-semibold text-[#817a87]">Weekly goal</span><span className="font-black text-[#4d4754]">{weeklyMinutes} / {user.profile.weeklyGoal} min</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eeebf1]"><div className="h-full rounded-full bg-gradient-to-r from-[#6d4aff] to-[#9d84ff]" style={{ width: `${Math.min(100, (weeklyMinutes / user.profile.weeklyGoal) * 100)}%` }} /></div></div>
        </article>
      </section>

      <section className="open-columns grid gap-0 xl:grid-cols-[1.55fr_.85fr]">
        <div className="open-column">
          <div className="mb-4 flex items-end justify-between"><div><h2 className="text-base font-black tracking-[-.025em]">Recommended for you</h2><p className="mt-1 text-xs text-[#89828f]">Based on your {user.profile.track.toLowerCase()} goal</p></div><Link href="/dashboard/courses" className="text-[11px] font-bold text-[#6543e8]">See all courses →</Link></div>
          <div className="grid gap-4 md:grid-cols-2">{recommendations.map((course) => <CourseCard key={course.id} course={course} locked={course.requiredPlan !== "free" && !plan.entitlements.allCourses} />)}</div>
        </div>
        <div className="open-column">
          <div className="mb-4"><h2 className="text-base font-black tracking-[-.025em]">Recent activity</h2><p className="mt-1 text-xs text-[#89828f]">Your latest milestones</p></div>
          <article className="open-list">
            <div className="space-y-5">
              {user.activityLog.slice(0, 4).map((event, index) => (
                <div key={event.id} className="relative flex gap-3"><span className={`relative z-10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${event.type === "learning" ? "bg-violet-100 text-violet-700" : event.type === "billing" ? "bg-emerald-100 text-emerald-700" : "bg-[#f0edf2] text-[#706978]"}`}><Icon name={event.type === "learning" ? "check" : event.type === "billing" ? "card" : "user"} size={15} /></span>{index < Math.min(3, user.activityLog.length - 1) && <span className="absolute left-4 top-8 h-8 w-px bg-[#ece8ef]" />}<div><p className="text-[11px] font-semibold leading-4 text-[#4c4652]">{event.text}</p><p className="mt-1 text-[9px] text-[#aaa4b0]">Recently</p></div></div>
              ))}
              {user.activityLog.length === 0 && <p className="py-6 text-center text-xs text-[#918a97]">Your milestones will appear here.</p>}
            </div>
            <Link href="/dashboard/progress" className="mt-5 block rounded-xl border border-[#e4e0e8] py-2.5 text-center text-[10px] font-bold text-[#5e5865] transition hover:border-violet-300">View all progress</Link>
          </article>
        </div>
      </section>
    </div>
  );
}
