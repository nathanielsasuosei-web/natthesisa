import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { courseAccess, lessonAccess, ownsProgram } from "@/lib/access";
import { formatMoney } from "@/lib/plans";
import { contentLessons, contentMinutes, contentModules, contentPercent, ownerLessonsForCourse } from "@/lib/course-content";
import { brandingSummary } from "@/lib/branding";
import { requireCurrentUser } from "@/lib/require-user";
import { fmtMinutes } from "@/lib/format";
import CourseVisual from "@/components/CourseVisual";
import Icon from "@/components/Icon";
import ProgressRing from "@/components/ProgressRing";
import BuyProgram from "@/components/BuyProgram";
import CourseBrief from "@/components/CourseBrief";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  return { title: course?.title ?? "Course" };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();
  const user = await requireCurrentUser();
  const progress = user.progress[course.id];
  const completed = progress?.completedLessonIds ?? [];
  const percent = contentPercent(course, completed);
  const lessons = contentLessons(course);
  const modules = contentModules(course);
  const access = courseAccess(user, course);
  const hasAccess = access.allowed;
  const price = access.price;
  const programId = access.programId;
  const programName = access.programName ?? course.category;
  const owned = programId ? ownsProgram(user, programId) : false;
  const ownerBranding = ownerLessonsForCourse(course.id).length ? brandingSummary(course.instructor.name) : null;
  // The next lesson the student can actually open. A locked course offers
  // none — every lesson opens together once the program is paid for.
  const nextLesson =
    lessons.find((lesson) => !completed.includes(lesson.id) && lessonAccess(user, course, lesson).allowed) ??
    lessons.find((lesson) => lessonAccess(user, course, lesson).allowed);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-[#918a97]"><Link href="/dashboard/courses" className="hover:text-[#5f3ee1]">Courses</Link><Icon name="chevron-right" size={12} /><span className="truncate text-[#5c5662]">{course.shortTitle}</span></nav>

      <section className="overflow-hidden border-y border-[#2b2733] bg-[#1b1822] text-white">
        <div className="grid lg:grid-cols-[1.28fr_.72fr]">
          <div className="relative p-6 sm:p-9">
            <div className="absolute -left-16 -top-24 size-64 rounded-full bg-[#6d4aff]/25 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#6d4aff] px-3 py-1 text-[9px] font-black uppercase tracking-[.14em]">{course.category}</span><span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-[9px] font-bold text-[#b7b0be]">{course.level}</span>{!hasAccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ffcf59] px-3 py-1 text-[9px] font-black text-[#4a3600]">
                    <Icon name="lock" size={10} /> {formatMoney(price)} · {programName} program
                  </span>
                )}</div>
              <h1 className="mt-5 max-w-2xl text-balance text-3xl font-black leading-tight tracking-[-.045em] sm:text-[42px]">{course.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#b4aebc]">{course.description}</p>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#aaa4b1]"><span className="inline-flex items-center gap-1.5 text-[#ffca57]"><Icon name="star" size={13} /> {course.rating}</span><span className="inline-flex items-center gap-1.5"><Icon name="users" size={14} /> {course.learners.toLocaleString()} learners</span><span className="inline-flex items-center gap-1.5"><Icon name="book" size={14} /> {lessons.length} lessons</span><span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} /> {fmtMinutes(contentMinutes(course))}</span></div>
              <div className="mt-7 flex flex-wrap gap-3">
                {nextLesson && <Link href={`/learn/${course.id}/${nextLesson.id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-xs font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#7959f1]"><Icon name="play" size={13} />{progress ? "Continue course" : "Start course"}</Link>}
                {!hasAccess && programId && (
                  <BuyProgram programId={programId} programName={programName} price={price} className="inline-flex" />
                )}
                {!hasAccess && !programId && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.07] px-5 py-3 text-xs font-bold text-white">
                    Not on sale yet — ask your teacher
                  </span>
                )}
              </div>
            </div>
          </div>
          {course.cover ? (
            <div className="relative min-h-56 overflow-hidden lg:min-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={course.cover} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <p className="absolute bottom-4 left-5 right-5 text-[10px] font-black uppercase tracking-[.16em] text-white/85">
                {course.category} program
              </p>
            </div>
          ) : (
            <CourseVisual course={course} className="min-h-56 lg:min-h-full" />
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="open-section pb-1">
            <h2 className="text-base font-black tracking-[-.025em]">What you&apos;ll be able to do</h2>
            <div className="mt-5 grid border-t border-[#e6e2e9] sm:grid-cols-2">{course.outcomes.map((outcome) => <div key={outcome} className="flex items-start gap-2.5 border-b border-[#e6e2e9] py-4 pr-4 sm:odd:border-r sm:even:pl-4"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={11} /></span><p className="text-xs font-semibold leading-5 text-[#5b5561]">{outcome}</p></div>)}</div>
          </section>

          <CourseBrief course={course} bare className="[&>section]:rounded-[22px] [&>section]:border [&>section]:border-[#e6e2e9] [&>section]:bg-white [&>section]:p-5 sm:[&>section]:p-6" />

          <section className="open-surface overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white">
            <div className="flex items-center justify-between border-b border-[#ece9ee] p-5 sm:px-6"><div><h2 className="text-base font-black tracking-[-.025em]">Course curriculum</h2><p className="mt-1 text-[10px] text-[#918a97]">{modules.length} modules · {lessons.length} lessons · {fmtMinutes(contentMinutes(course))}</p></div>{progress && <span className="rounded-lg bg-[#f0ecff] px-2.5 py-1.5 text-[10px] font-black text-[#5e3de0]">{completed.length} complete</span>}</div>
            <div>
              {modules.map((module) => (
                <div key={module.id} className="border-b border-[#eeebf0] last:border-0">
                  <div className="bg-[#faf9fb] px-5 py-4 sm:px-6"><h3 className="text-xs font-extrabold text-[#38323e]">{module.title}</h3><p className="mt-1 text-[10px] text-[#918a97]">{module.description}</p></div>
                  <div>
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isDone = completed.includes(lesson.id);
                      const accessible = lessonAccess(user, course, lesson).allowed;
                      const content = <><span className={`grid size-8 shrink-0 place-items-center rounded-xl ${isDone ? "bg-emerald-100 text-emerald-700" : accessible ? "bg-[#f0ecff] text-[#6543e8]" : "bg-[#f1eff3] text-[#aaa4b0]"}`}>{isDone ? <Icon name="check" size={15} /> : accessible ? <Icon name="play" size={11} /> : <Icon name="lock" size={14} />}</span><div className="min-w-0 flex-1"><p className={`truncate text-xs font-bold ${accessible ? "text-[#4a4450]" : "text-[#98919e]"}`}>{lessonIndex + 1}. {lesson.title}</p><div className="mt-1 flex flex-wrap gap-2 text-[9px] text-[#a19aa7]"><span>{lesson.duration} min</span>{!accessible && <span className="font-bold text-[#8a6d1f]">{programName} program</span>}{lesson.source === "owner" && <span className="rounded-full bg-[#f0ecff] px-1.5 py-0.5 font-black uppercase tracking-wide text-[#5e3de0]">New lesson</span>}{lesson.files?.length ? <span className="font-semibold text-[#7d7683]">{lesson.files.length} file{lesson.files.length === 1 ? "" : "s"}</span> : null}</div></div>{accessible && <Icon name="chevron-right" size={14} className="text-[#bbb5c0]" />}</>;
                      return accessible ? (
                        <Link key={lesson.id} href={`/learn/${course.id}/${lesson.id}`} className="flex items-center gap-3 border-t border-[#f1eef2] px-5 py-3.5 transition first:border-0 hover:bg-[#fbfaff] sm:px-6">{content}</Link>
                      ) : (
                        <div key={lesson.id} className="flex flex-wrap items-center gap-3 border-t border-[#f1eef2] px-5 py-3.5 first:border-0 sm:px-6">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          {progress && (
            <section className="open-surface py-5"><div className="flex items-center gap-4"><ProgressRing value={percent} size={66} stroke={6} /><div><h2 className="text-sm font-extrabold">Your progress</h2><p className="mt-1 text-[10px] leading-4 text-[#918a97]">{completed.length} of {lessons.length} lessons complete</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eeeaf1]"><div className="h-full rounded-full bg-[#6d4aff]" style={{ width: `${percent}%` }} /></div></section>
          )}
          <section className="open-surface py-5"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#918a97]">Your instructor</p><div className="mt-4 flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#1b1822] text-xs font-black text-[#c2b4ff]">{ownerBranding?.photoHref ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={ownerBranding.photoHref} alt={ownerBranding.name} className="size-full object-cover" />
            ) : course.instructor.initials}</span><div className="min-w-0"><p className="text-xs font-extrabold">{ownerBranding?.name ?? course.instructor.name}</p><p className="mt-0.5 text-[10px] text-[#918a97]">{ownerBranding?.role ?? course.instructor.role}</p></div>{ownerBranding?.logoHref ? (
              <span className="ml-auto grid h-9 shrink-0 place-items-center rounded-lg bg-[#1b1822] px-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ownerBranding.logoHref} alt={`${ownerBranding.name} logo`} className="h-5 w-auto object-contain" />
              </span>
            ) : null}</div></section>
          <section className="open-surface overflow-hidden"><div className="border-l-2 border-[#ff7448] py-1 pl-4"><span className="grid size-9 place-items-center rounded-xl bg-[#ff7448] text-white"><Icon name="briefcase" size={18} /></span><p className="mt-4 text-[9px] font-black uppercase tracking-[.14em] text-[#d75b35]">Course project</p><h2 className="mt-1.5 text-sm font-extrabold leading-5">{course.project}</h2></div><div className="pt-4 text-[10px] leading-5 text-[#7d7683]">Apply every module in a guided project you can refine, publish and add to your portfolio.</div></section>
          {!hasAccess && (
            <section className="rounded-[22px] bg-[#6d4aff] p-5 text-white">
              <Icon name="spark" size={22} />
              <h2 className="mt-3 text-sm font-extrabold">How access works</h2>
              <p className="mt-1.5 text-[10px] leading-5 text-violet-100">
                {owned
                  ? `You own the ${programName} program already — sign out and back in if this course still shows locked.`
                  : `Buy the ${programName} program once and this course — with every lesson in it — opens permanently, along with everything else in the program.`}
              </p>
              {!owned && programId && (
                <Link href="/dashboard/plans" className="mt-4 block rounded-xl bg-white px-3 py-2.5 text-center text-[10px] font-black text-[#5c3be1]">
                  Buy the {programName} program · {formatMoney(price)}
                </Link>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
