import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourse } from "@/lib/courses";
import type { Lesson, LessonSection } from "@/lib/courses";
import { lessonAccess } from "@/lib/access";
import { contentLessons, contentModules, contentPercent, findContentLesson } from "@/lib/course-content";
import { brandingSummary } from "@/lib/branding";
import { lessonWordCount } from "@/lib/lesson-builder";
import { getCurrentUser } from "@/lib/session";
import { getOrCreateProgress } from "@/lib/store";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LessonActions from "@/components/LessonActions";
import LessonMaterials from "@/components/LessonMaterials";
import LessonProse from "@/components/LessonProse";
import LessonNarrator from "@/components/LessonNarrator";
import LessonVideoGuide from "@/components/LessonVideoGuide";
import LessonNatthesisa from "@/components/LessonNatthesisa";
import { lessonVideo } from "@/lib/lesson-videos";
import LessonLocked from "@/components/LessonLocked";

export async function generateMetadata({ params }: { params: Promise<{ courseId: string; lessonId: string }> }): Promise<Metadata> {
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = course ? findContentLesson(course, lessonId) : undefined;
  return { title: lesson ? `${lesson.title} · ${course?.shortTitle}` : "Lesson" };
}

/* -------------------------------------------------------------------------- */
/* Prose helpers                                                              */
/* -------------------------------------------------------------------------- */

/** A stable anchor for every section heading, so the contents rail can link. */
function anchor(heading: string, index: number): string {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${index + 1}-${slug || "section"}`;
}

function wordCount(lesson: Lesson): number {
  return lessonWordCount(lesson);
}

/**
 * How each kind of section is drawn. The label is what a textbook would print
 * in the margin: *Definition*, *Worked example*, *Common mistakes* — so a
 * learner scanning the page can find the part they need.
 */
const SECTION_STYLE: Record<string, { label: string; icon: Parameters<typeof Icon>[0]["name"]; frame: string; labelColor: string }> = {
  definition: {
    label: "Definition",
    icon: "book",
    frame: "border-y border-[#d9ccff] bg-[#faf8ff] px-5 py-5 sm:px-7 sm:py-6",
    labelColor: "text-[#5e3de0]",
  },
  example: {
    label: "Worked example",
    icon: "terminal",
    frame: "border-y border-[#c9e6d6] bg-[#f6fbf8] px-5 py-5 sm:px-7 sm:py-6",
    labelColor: "text-[#1f7a4d]",
  },
  note: {
    label: "Note",
    icon: "spark",
    frame: "border-y border-[#cfe0f0] bg-[#f6fafe] px-5 py-5 sm:px-7 sm:py-6",
    labelColor: "text-[#2a6699]",
  },
  warning: {
    label: "Common mistakes",
    icon: "shield",
    frame: "border-y border-[#f3d8c8] bg-[#fff9f5] px-5 py-5 sm:px-7 sm:py-6",
    labelColor: "text-[#c2531f]",
  },
  table: {
    label: "Reference",
    icon: "layers",
    frame: "border-y border-[#e2dee7] bg-white px-1 py-5 sm:px-3 sm:py-6",
    labelColor: "text-[#6b6577]",
  },
  exercise: {
    label: "Exercise",
    icon: "pencil",
    frame: "border-y border-[#e2dee7] bg-[#fbfafc] px-5 py-5 sm:px-7 sm:py-6",
    labelColor: "text-[#6b6577]",
  },
  paragraph: {
    label: "",
    icon: "book",
    frame: "",
    labelColor: "text-[#6d4aff]",
  },
};

function CodeBlock({ code, label, language }: { code: string; label?: string; language?: string }) {
  return (
    <div className="my-5 overflow-hidden rounded-[18px] bg-[#1d1a23] shadow-[0_16px_35px_rgba(31,25,40,.12)]">
      <div className="flex h-10 items-center border-b border-white/[.07] px-4">
        <div className="code-dots" />
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[.12em] text-[#6f6979]">{label ?? language ?? "worked example"}</span>
      </div>
      <pre className="dashboard-scroll overflow-x-auto p-5 text-[12px] leading-6 text-[#d9d2e1]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DataTable({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div className="dashboard-scroll my-5 overflow-x-auto rounded-[14px] border border-[#e4e0e9]">
      <table className="w-full min-w-[520px] border-collapse text-left text-[13px] leading-6">
        {head?.length ? (
          <thead>
            <tr className="bg-[#f4f1f8]">
              {head.map((cell) => (
                <th key={cell} className="border-b border-[#e4e0e9] px-4 py-3 text-[10px] font-black uppercase tracking-[.1em] text-[#5b5566]">
                  <LessonProse text={cell} className="[&_p]:my-0 [&_p]:text-[10px] [&_p]:font-black [&_p]:uppercase [&_p]:tracking-[.1em] [&_p]:text-[#5b5566]" />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((row, index) => (
            <tr key={index} className={index % 2 ? "bg-[#fbfafc]" : "bg-white"}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-[#f0edf3] px-4 py-3 align-top text-[#5f5965] last:border-r-0">
                  <LessonProse text={cell} className="[&_p]:my-0 [&_p]:text-[13px] [&_p]:leading-6" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ section, index }: { section: LessonSection; index: number }) {
  const style = SECTION_STYLE[section.kind ?? "paragraph"] ?? SECTION_STYLE.paragraph;
  const id = anchor(section.heading, index);

  return (
    <section id={id} className="lesson-section mt-11 scroll-mt-24 first:mt-9">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#1b1822] text-[10px] font-black text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          {style.label ? (
            <p className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.15em] ${style.labelColor}`}>
              <Icon name={style.icon} size={12} /> {style.label}
            </p>
          ) : null}
          <h2 className="text-balance text-xl font-black leading-tight tracking-[-.03em] text-[#1d1922] sm:text-[26px]">{section.heading}</h2>
        </div>
      </div>

      <div className={style.frame ? `mt-4 ${style.frame}` : "mt-4"}>
        {section.body ? <LessonProse text={section.body} label={section.heading} /> : null}
        {section.rows?.length ? <DataTable rows={section.rows} /> : null}
        {section.items?.length ? (
          <ol className="my-4 grid gap-3 pl-1 text-[15px] leading-8 text-[#5f5965]">
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-3">
                <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-[#d9d2e6] bg-white text-[10px] font-black text-[#6543e8]">
                  {itemIndex + 1}
                </span>
                <LessonProse text={item} label={section.heading} className="[&_p]:my-0" />
              </li>
            ))}
          </ol>
        ) : null}
        {section.code ? <CodeBlock code={section.code} label={section.codeLabel} language={section.language} /> : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const user = await getCurrentUser().catch(() => null);
  const { courseId, lessonId } = await params;
  const course = getCourse(courseId);
  const lesson = course ? findContentLesson(course, lessonId) : undefined;
  if (!course || !lesson) notFound();

  // Nothing in a course is free. A visitor must sign in first, and then the
  // program must be owned before the lesson opens. Sign-in sends them back here.
  const lessonPath = `/learn/${course.id}/${lesson.id}`;
  if (!user) redirect(`/login?mode=signin&next=${encodeURIComponent(lessonPath)}`);

  const access = lessonAccess(user, course, lesson);
  if (!access.allowed) {
    return (
      <LessonLocked
        courseTitle={course.title}
        courseHref={`/dashboard/courses/${course.slug}`}
        lessonTitle={lesson.title}
        lessonSummary={lesson.summary}
        decision={access}
      />
    );
  }

  const lessons = contentLessons(course);
  const modules = contentModules(course);
  const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
  const canTrack = true;
  const courseHref = `/dashboard/courses/${course.slug}`;
  const homeHref = "/dashboard";

  const progress = canTrack && user ? getOrCreateProgress(user, course.id) : null;
  if (progress) progress.lastAccessedAt = new Date().toISOString();
  const complete = progress?.completedLessonIds.includes(lesson.id) ?? false;
  const percent = progress ? contentPercent(course, progress.completedLessonIds) : 0;
  const ownerBranding = lesson.source === "owner" ? brandingSummary(course.instructor.name) : null;
  const previousLesson = lessons[lessonIndex - 1];
  const nextLesson = lessons[lessonIndex + 1];
  const nextHref = nextLesson ? `/learn/${course.id}/${nextLesson.id}` : courseHref;
  const nextLabel = nextLesson ? "Next lesson" : "Back to course";
  const words = wordCount(lesson);

  return (
    <div
      className="min-h-screen bg-[#f7f7f4]"
      data-natthesisa-context="lesson"
      data-course-id={course.id}
      data-course-title={course.title}
      data-lesson-id={lesson.id}
      data-lesson-title={lesson.title}
    >
      <header className="sticky top-0 z-40 border-b border-[#e6e2e9] bg-white/90 backdrop-blur-xl">
        <div className="flex h-[66px] items-center px-4 sm:px-6">
          <Logo compact />
          <span className="mx-4 h-5 w-px bg-[#e1dde5]" />
          <Link href={courseHref} className="min-w-0 text-xs font-bold text-[#5c5662] hover:text-[#5f3ee1]"><span className="hidden sm:inline">{course.shortTitle}</span><span className="sm:hidden">Course</span></Link>
          <div className="ml-auto flex items-center gap-3 sm:gap-5"><div className="hidden items-center gap-2 sm:flex"><div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#ece9ef]"><div className="h-full rounded-full bg-[#6d4aff]" style={{ width: `${percent}%` }} /></div><span className="text-[10px] font-black text-[#6d6672]">{percent}%</span></div><Link href={homeHref} className="grid size-9 place-items-center rounded-xl border border-[#e4e0e8] text-[#77717e] transition hover:border-violet-300" aria-label="Close lesson"><Icon name="close" size={17} /></Link></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[290px_1fr] xl:grid-cols-[290px_1fr_248px]">
        <aside className="dashboard-scroll hidden h-[calc(100vh-66px)] overflow-y-auto border-r border-[#e7e3e9] bg-white lg:sticky lg:top-[66px] lg:block">
          <div className="border-b border-[#ece9ef] p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-[#918a97]">Course content</p><h2 className="mt-2 text-sm font-extrabold leading-5">{course.shortTitle}</h2><p className="mt-1 text-[10px] text-[#918a97]">{`${progress?.completedLessonIds.length ?? 0} of ${lessons.length} lessons complete`}</p></div>
          {modules.map((module) => (
            <div key={module.id}><div className="border-b border-[#eeebf0] bg-[#faf9fb] px-5 py-3"><p className="text-[10px] font-extrabold text-[#5b5561]">{module.title}</p></div>{module.lessons.map((item) => { const itemComplete = progress?.completedLessonIds.includes(item.id) ?? false; const current = item.id === lesson.id; return <Link key={item.id} href={`/learn/${course.id}/${item.id}`} className={`flex items-start gap-3 border-b border-[#f0edf2] px-5 py-3 transition ${current ? "border-l-[3px] border-l-[#6d4aff] bg-[#f4f1ff] pl-[17px]" : "hover:bg-[#faf9fb]"}`}><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${itemComplete ? "bg-emerald-100 text-emerald-700" : current ? "bg-[#6d4aff] text-white" : "border border-[#ddd8e2] text-[#aaa4b0]"}`}>{itemComplete ? <Icon name="check" size={10} /> : current ? <Icon name="play" size={7} /> : <span className="text-[8px] font-black">{lessons.indexOf(item) + 1}</span>}</span><div><p className={`text-[10px] font-bold leading-4 ${current ? "text-[#5032c2]" : "text-[#67606d]"}`}>{item.title}</p><p className="mt-0.5 flex items-center gap-1 text-[8px] text-[#a19aa7]">{item.duration} min{lessonVideo(item.id) && <><span className="text-[#c8c2d0]">·</span><span className="inline-flex items-center gap-0.5 font-black uppercase tracking-wide text-[#7c63e8]"><Icon name="video" size={8} /> video</span></>}</p></div></Link>; })}</div>
          ))}
        </aside>

        <main className="min-w-0">
          <article id="lesson-article" className="mx-auto max-w-[790px] px-5 py-10 pb-28 sm:px-8 sm:py-14 sm:pb-32">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#6d4aff]"><span>Lesson {lessonIndex + 1} of {lessons.length}</span></div>
            <h1 data-speech={`Lesson. ${lesson.title}.`} data-speech-label="Title" className="mt-3 text-balance text-3xl font-black leading-[1.1] tracking-[-.045em] text-[#1d1922] sm:text-[44px]">{lesson.title}</h1>
            <p data-speech={lesson.summary} data-speech-label="Introduction" className="mt-5 text-[17px] font-medium leading-8 text-[#5f5965]">{lesson.summary}</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-[#e6e2e9] py-3 text-[10px] font-semibold text-[#817a87]">
              <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} /> {lesson.duration} minutes</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="book" size={14} /> {words.toLocaleString()} words</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="layers" size={14} /> {lesson.sections.length} sections</span>
              {complete && <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700"><Icon name="check" size={14} /> Completed</span>}
            </div>

            <LessonNatthesisa lessonTitle={lesson.title} />
            <LessonNarrator key={lesson.id} title={lesson.title} words={words} />

            <LessonVideoGuide
              lesson={lesson}
              courseId={course.id}
              complete={complete}
              nextHref={nextHref}
              nextLabel={nextLabel}
              suspended={user?.suspended}
              track={canTrack}
            />

            <section className="open-section mt-9 pb-1">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Learning objectives</p>
              <p className="mt-2 text-[11px] font-semibold text-[#918a97]">By the end of this lesson you should be able to:</p>
              <ul className="mt-4 grid gap-3">{lesson.objectives.map((objective, index) => <li key={objective} className="flex items-start gap-2.5 text-xs font-semibold leading-5 text-[#5d5763]"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#eee9ff] text-[9px] font-black text-[#6543e8]">{index + 1}</span>{objective}</li>)}</ul>
            </section>

            {lesson.sections.map((section, index) => (
              <Section key={`${section.heading}-${index}`} section={section} index={index} />
            ))}

            {lesson.keyPoints?.length ? (
              <section id="lesson-summary" className="mt-12 scroll-mt-24 border-t border-[#dfdbe3] pt-8">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Summary</p>
                <h2 className="mt-2 text-xl font-black tracking-[-.03em]">What you should now be able to do</h2>
                <ul className="mt-5 grid gap-3">
                  {lesson.keyPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 rounded-[14px] border border-[#e4e0e9] bg-white px-4 py-3 text-[13.5px] font-semibold leading-6 text-[#4f4958]">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={11} /></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {lesson.exercises?.length ? (
              <section id="lesson-exercises" className="mt-11 scroll-mt-24 border-t border-[#dfdbe3] pt-8">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Exercises</p>
                <h2 className="mt-2 text-xl font-black tracking-[-.03em]">Practice problems</h2>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-[#8b8494]">Work through these in order. The first few check that you can recall the material; the last ones ask you to use it on something new.</p>
                <ol className="mt-5 grid gap-3">
                  {lesson.exercises.map((exercise, index) => (
                    <li key={exercise} className="flex gap-3.5 border-b border-[#f0edf3] pb-3.5 last:border-0">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#1b1822] text-[10px] font-black text-white">{index + 1}</span>
                      <LessonProse text={exercise} className="[&_p]:my-0 [&_p]:text-[14px] [&_p]:leading-7" />
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="mt-11 border-y border-[#f0cdbb] py-1">
              <div className="flex items-center gap-3 border-b border-[#ffe0cf] py-4">
                <span className="grid size-9 place-items-center rounded-xl bg-[#ff7448] text-white"><Icon name="terminal" size={18} /></span>
                <div><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#d95a33]">Try it yourself</p><h2 className="mt-0.5 text-sm font-extrabold">Lesson challenge</h2></div>
              </div>
              <div className="py-5">
                <LessonProse text={lesson.challenge} className="[&_p]:text-sm [&_p]:font-semibold [&_p]:leading-6 [&_p]:text-[#5d4e4c]" />
                <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[#f2d9cb] bg-white/70 p-3">
                  <input type="checkbox" className="size-4 accent-[#6d4aff]" />
                  <span className="text-xs font-bold text-[#6b5c59]">I completed this practice task</span>
                </label>
              </div>
            </section>

            {ownerBranding && (
              <section className="mt-10 flex flex-wrap items-center gap-4 border-y border-[#e6e2e9] py-5">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#e4e0e8] bg-[#f7f6f8]">
                  {ownerBranding.photoHref ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={ownerBranding.photoHref} alt={ownerBranding.name} className="size-full object-cover" />
                  ) : (
                    <Icon name="user" size={24} className="text-[#aaa4b0]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Lesson by</p>
                  <p className="mt-1 text-sm font-extrabold text-[#332e39]">{ownerBranding.name}</p>
                  <p className="mt-0.5 text-[10px] text-[#918a97]">{ownerBranding.role}</p>
                </div>
                {ownerBranding.logoHref && (
                  <span className="grid h-12 shrink-0 place-items-center rounded-xl bg-[#1b1822] px-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ownerBranding.logoHref} alt={`${ownerBranding.name} logo`} className="h-7 w-auto object-contain" />
                  </span>
                )}
                {lesson.files?.length ? <span className="rounded-full bg-[#f0ecff] px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-[#5e3de0]">{lesson.files.length} material{lesson.files.length === 1 ? "" : "s"}</span> : null}
              </section>
            )}

            {lesson.files?.length ? <LessonMaterials files={lesson.files} /> : null}

            <div className="mt-10 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              {previousLesson ? <Link href={`/learn/${course.id}/${previousLesson.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd8e2] bg-white px-5 py-3.5 text-sm font-bold text-[#5e5864] transition hover:border-violet-300"><Icon name="arrow-left" size={16} /> Previous lesson</Link> : <Link href={courseHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ddd8e2] bg-white px-5 py-3.5 text-sm font-bold text-[#5e5864]"><Icon name="arrow-left" size={16} /> Course overview</Link>}
              {canTrack && user ? (
                <LessonActions courseId={course.id} lessonId={lesson.id} initiallyComplete={complete} nextHref={nextHref} nextLabel={nextLabel} suspended={user.suspended} />
              ) : (
                <Link href={nextHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#5e3ce8]">{nextLabel} <Icon name="arrow-right" size={16} /></Link>
              )}
            </div>
          </article>
        </main>

        {/* Contents rail: the margin index a printed textbook would have. */}
        <aside className="dashboard-scroll hidden h-[calc(100vh-66px)] overflow-y-auto border-l border-[#e7e3e9] bg-white/60 xl:sticky xl:top-[66px] xl:block">
          <div className="p-5">
            <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#918a97]">In this lesson</p>
            <ol className="mt-4 grid gap-0.5">
              {lesson.sections.map((section, index) => (
                <li key={`${section.heading}-${index}`}>
                  <a href={`#${anchor(section.heading, index)}`} className="flex gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[#f4f1ff]">
                    <span className="mt-[1px] font-mono text-[9px] font-black text-[#b3acbb]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[10.5px] font-bold leading-4 text-[#67606d]">{section.heading}</span>
                  </a>
                </li>
              ))}
              {lesson.keyPoints?.length ? (
                <li><a href="#lesson-summary" className="flex gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[#f4f1ff]"><span className="mt-[1px] font-mono text-[9px] font-black text-[#b3acbb]">§</span><span className="text-[10.5px] font-bold leading-4 text-[#67606d]">Summary</span></a></li>
              ) : null}
              {lesson.exercises?.length ? (
                <li><a href="#lesson-exercises" className="flex gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[#f4f1ff]"><span className="mt-[1px] font-mono text-[9px] font-black text-[#b3acbb]">§</span><span className="text-[10.5px] font-bold leading-4 text-[#67606d]">Exercises</span></a></li>
              ) : null}
            </ol>
            <div className="mt-6 border-t border-[#ece9ef] pt-4">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#918a97]">Reading time</p>
              <p className="mt-1.5 text-[11px] font-bold leading-5 text-[#67606d]">{lesson.duration} minutes · {words.toLocaleString()} words</p>
              <p className="mt-3 text-[9.5px] leading-4 text-[#a19aa7]">Read it once all the way through, then go back and type every example yourself. Typing is what turns reading into skill.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
