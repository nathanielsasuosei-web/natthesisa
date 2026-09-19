import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canAccessLesson, coursePercent, getCourse, getCourseLessons, getLesson } from "@/lib/courses";
import { getCurrentUser } from "@/lib/session";
import { getOrCreateProgress } from "@/lib/store";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LessonActions from "@/components/LessonActions";

export async function generateMetadata({ params }: { params: Promise<{ courseId: string; lessonId: string }> }): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = course ? getLesson(course, lessonId) : undefined;
  return { title: lesson ? `${lesson.title} · ${course?.shortTitle}` : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = course ? getLesson(course, lessonId) : undefined;
  if (!course || !lesson) notFound();
  const lessons = getCourseLessons(course);
  const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
  const accessible = canAccessLesson(user.subscription.planId, course, lesson);

  if (!accessible) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-5">
        <div className="w-full max-w-md border-y border-[#ded9e3] py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eee9ff] text-[#6d4aff]"><Icon name="lock" size={25} /></span><h1 className="mt-5 text-xl font-black tracking-[-.035em]">This lesson is part of Pro</h1><p className="mt-2 text-sm leading-6 text-[#756f7b]">Unlock the complete {course.shortTitle} course and every other learning path.</p><Link href="/dashboard/plans" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-sm font-extrabold text-white">View plans <Icon name="arrow-right" size={16} /></Link><Link href={`/dashboard/courses/${course.slug}`} className="mt-3 block text-xs font-bold text-[#756f7b]">Back to course</Link></div>
      </main>
    );
  }

  const progress = getOrCreateProgress(user, course.id);
  progress.lastAccessedAt = new Date().toISOString();
  const complete = progress.completedLessonIds.includes(lesson.id);
  const percent = coursePercent(course, progress.completedLessonIds);
  const previousLesson = lessons[lessonIndex - 1];
  const nextLesson = lessons[lessonIndex + 1];
  const nextAccessible = nextLesson ? canAccessLesson(user.subscription.planId, course, nextLesson) : false;
  const nextHref = nextLesson && nextAccessible ? `/learn/${course.id}/${nextLesson.id}` : `/dashboard/courses/${course.slug}`;
  const nextLabel = nextLesson && nextAccessible ? "Next lesson" : nextLesson ? "Back to course" : "Finish course";

  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <header className="sticky top-0 z-40 border-b border-[#e6e2e9] bg-white/90 backdrop-blur-xl">
        <div className="flex h-[66px] items-center px-4 sm:px-6">
          <Logo compact />
          <span className="mx-4 h-5 w-px bg-[#e1dde5]" />
          <Link href={`/dashboard/courses/${course.slug}`} className="min-w-0 text-xs font-bold text-[#5c5662] hover:text-[#5f3ee1]"><span className="hidden sm:inline">{course.shortTitle}</span><span className="sm:hidden">Course</span></Link>
          <div className="ml-auto flex items-center gap-3 sm:gap-5"><div className="hidden items-center gap-2 sm:flex"><div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#ece9ef]"><div className="h-full rounded-full bg-[#6d4aff]" style={{ width: `${percent}%` }} /></div><span className="text-[10px] font-black text-[#6d6672]">{percent}%</span></div><Link href="/dashboard" className="grid size-9 place-items-center rounded-xl border border-[#e4e0e8] text-[#77717e] transition hover:border-violet-300" aria-label="Close lesson"><Icon name="close" size={17} /></Link></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[290px_1fr]">
        <aside className="dashboard-scroll hidden h-[calc(100vh-66px)] overflow-y-auto border-r border-[#e7e3e9] bg-white lg:sticky lg:top-[66px] lg:block">
          <div className="border-b border-[#ece9ef] p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#918a97]">Course content</p><h2 className="mt-2 text-sm font-extrabold leading-5">{course.shortTitle}</h2><p className="mt-1 text-[10px] text-[#918a97]">{progress.completedLessonIds.length} of {lessons.length} lessons complete</p></div>
          {course.modules.map((module) => (
            <div key={module.id}><div className="border-b border-[#eeebf0] bg-[#faf9fb] px-5 py-3"><p className="text-[10px] font-extrabold text-[#5b5561]">{module.title}</p></div>{module.lessons.map((item) => { const itemComplete = progress.completedLessonIds.includes(item.id); const itemAccess = canAccessLesson(user.subscription.planId, course, item); const current = item.id === lesson.id; return itemAccess ? <Link key={item.id} href={`/learn/${course.id}/${item.id}`} className={`flex items-start gap-3 border-b border-[#f0edf2] px-5 py-3 transition ${current ? "border-l-[3px] border-l-[#6d4aff] bg-[#f4f1ff] pl-[17px]" : "hover:bg-[#faf9fb]"}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${itemComplete ? "bg-emerald-100 text-emerald-700" : current ? "bg-[#6d4aff] text-white" : "border border-[#ddd8e2] text-[#aaa4b0]"}`}>{itemComplete ? <Icon name="check" size={10} /> : current ? <Icon name="play" size={7} /> : <span className="text-[8px] font-black">{lessons.indexOf(item) + 1}</span>}</span><div><p className={`text-[10px] font-bold leading-4 ${current ? "text-[#5032c2]" : "text-[#67606d]"}`}>{item.title}</p><p className="mt-0.5 text-[8px] text-[#a19aa7]">{item.duration} min</p></div></Link> : <div key={item.id} className="flex items-center gap-3 border-b border-[#f0edf2] px-5 py-3 text-[#aaa4b0]"><Icon name="lock" size={15} /><p className="text-[10px] font-semibold">{item.title}</p></div>; })}</div>
          ))}
        </aside>

        <main className="min-w-0">
          <article className="mx-auto max-w-[790px] px-5 py-10 sm:px-8 sm:py-14">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#6d4aff]"><span>Lesson {lessonIndex + 1} of {lessons.length}</span>{lesson.preview && <><span>·</span><span>Free preview</span></>}</div>
            <h1 className="mt-3 text-balance text-3xl font-black leading-tight tracking-[-.045em] text-[#1d1922] sm:text-[44px]">{lesson.title}</h1>
            <p className="mt-4 text-base leading-7 text-[#6f6975]">{lesson.summary}</p>
            <div className="mt-6 flex flex-wrap gap-4 border-y border-[#e6e2e9] py-3 text-[10px] font-semibold text-[#817a87]"><span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} /> {lesson.duration} minutes</span><span className="inline-flex items-center gap-1.5"><Icon name="book" size={14} /> Reading + practice</span>{complete && <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700"><Icon name="check" size={14} /> Completed</span>}</div>

            <section className="open-section mt-9 pb-1"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">By the end of this lesson</p><ul className="mt-4 grid gap-3 sm:grid-cols-2">{lesson.objectives.map((objective) => <li key={objective} className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5d5763]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#eee9ff] text-[#6543e8]"><Icon name="check" size={10} /></span>{objective}</li>)}</ul></section>

            {lesson.sections.map((section, index) => (
              <section key={section.heading} className="mt-10"><div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-lg bg-[#1b1822] text-[10px] font-black text-white">{String(index + 1).padStart(2, "0")}</span><h2 className="text-xl font-black tracking-[-.03em]">{section.heading}</h2></div><p className="mt-4 text-[15px] leading-8 text-[#5f5965]">{section.body}</p>{section.code && <div className="mt-5 overflow-hidden rounded-[18px] bg-[#1d1a23] shadow-[0_16px_35px_rgba(31,25,40,.12)]"><div className="flex h-10 items-center border-b border-white/[.07] px-4"><div className="code-dots" /><span className="ml-auto font-mono text-[9px] text-[#696372]">example</span></div><pre className="dashboard-scroll overflow-x-auto p-5 text-[12px] leading-6 text-[#d9d2e1]"><code>{section.code}</code></pre></div>}</section>
            ))}

            <section className="mt-10 border-y border-[#f0cdbb] py-1"><div className="flex items-center gap-3 border-b border-[#ffe0cf] py-4"><span className="grid size-9 place-items-center rounded-xl bg-[#ff7448] text-white"><Icon name="terminal" size={18} /></span><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#d95a33]">Try it yourself</p><h2 className="mt-0.5 text-sm font-extrabold">Lesson challenge</h2></div></div><div className="py-5"><p className="text-sm font-semibold leading-6 text-[#5d4e4c]">{lesson.challenge}</p><label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[#f2d9cb] bg-white/70 p-3"><input type="checkbox" className="size-4 accent-[#6d4aff]" /><span className="text-xs font-bold text-[#6b5c59]">I completed this practice task</span></label></div></section>

            <div className="mt-10 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              {previousLesson ? <Link href={`/learn/${course.id}/${previousLesson.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd8e2] bg-white px-5 py-3.5 text-sm font-bold text-[#5e5864] transition hover:border-violet-300"><Icon name="arrow-left" size={16} /> Previous lesson</Link> : <Link href={`/dashboard/courses/${course.slug}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd8e2] bg-white px-5 py-3.5 text-sm font-bold text-[#5e5864]"><Icon name="arrow-left" size={16} /> Course overview</Link>}
              <LessonActions courseId={course.id} lessonId={lesson.id} initiallyComplete={complete} nextHref={nextHref} nextLabel={nextLabel} suspended={user.suspended} />
            </div>
            {nextLesson && !nextAccessible && <p className="mt-3 text-right text-[10px] font-semibold text-[#8d8694]">The next lesson requires Pro. You&apos;ll return to the course page.</p>}
          </article>
        </main>
      </div>
    </div>
  );
}
