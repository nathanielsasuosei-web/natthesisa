import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/courses";
import { courseBrief } from "@/lib/course-info";
import { contentLessons, contentMinutes, contentModules } from "@/lib/course-content";
import { coursePrice, formatMoney, pricing } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import { ensureContentReady } from "@/lib/bootstrap";
import { isOwner } from "@/lib/owner";
import { fmtMinutes } from "@/lib/format";
import InfoPage, { InfoContactStrip } from "@/components/InfoPage";
import CourseBrief from "@/components/CourseBrief";
import CourseVisual from "@/components/CourseVisual";
import Icon from "@/components/Icon";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return { title: "Course not found" };
  const brief = courseBrief(course);
  return {
    title: course.title,
    description: brief.overview[0]?.slice(0, 300) ?? course.description,
  };
}

export const dynamic = "force-dynamic";

/**
 * A course, described in public.
 *
 * The learner's version of this page lives at `/dashboard/courses/<slug>` and
 * adds their progress, the buy buttons and the lesson links. This one exists so
 * that a prospective student — or an employer checking what a certificate
 * actually covers — can read the whole description, the curriculum and the
 * price without an account.
 */
export default async function PublicCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  await ensureContentReady();
  const user = await getCurrentUser().catch(() => null);
  const appHref = user ? (isOwner(user) ? "/owner" : "/dashboard") : null;
  const lessons = contentLessons(course);
  const modules = contentModules(course);
  const minutes = contentMinutes(course);
  const price = coursePrice(course.id);
  const prices = pricing();
  const freePreviews = lessons.filter((lesson) => lesson.preview).length;
  const startHref = user ? `/dashboard/courses/${course.slug}` : "/login?mode=signup";

  return (
    <InfoPage
      eyebrow={`${course.category} · ${course.level}`}
      title={course.title}
      intro={course.description}
      appHref={appHref}
      signedIn={Boolean(user)}
    >
      <section className="overflow-hidden rounded-[22px] border border-[#e8e4ec] bg-white">
        {course.cover ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.cover} alt="" className="h-48 w-full object-cover sm:h-64" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-4 left-5 text-[10px] font-black uppercase tracking-[.16em] text-white/90">{course.category} program</p>
          </div>
        ) : (
          <CourseVisual course={course} className="h-40" />
        )}

        <dl className="grid gap-0 border-b border-[#f0edf3] sm:grid-cols-4">
          {[
            { label: "Lessons", value: String(lessons.length), icon: "book" as const },
            { label: "Study time", value: fmtMinutes(minutes), icon: "clock" as const },
            { label: "Level", value: course.level, icon: "chart" as const },
            { label: "Free previews", value: freePreviews > 0 ? `${freePreviews} lesson${freePreviews === 1 ? "" : "s"}` : "None", icon: "play" as const },
          ].map((fact, index) => (
            <div key={fact.label} className={`p-4 sm:px-5 ${index < 3 ? "border-b border-[#f0edf3] sm:border-b-0 sm:border-r" : ""}`}>
              <dt className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#9a939f]">
                <Icon name={fact.icon} size={12} className="text-[#6d4aff]" /> {fact.label}
              </dt>
              <dd className="mt-1.5 text-sm font-black text-[#332e39]">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#9a939f]">Buy this course</p>
            <p className="mt-1 text-2xl font-black tracking-[-.04em] text-[#1b1822]">{formatMoney(price)}</p>
            <p className="mt-1 text-[11px] text-[#8a8390]">
              Once, and it stays on your account. Lessons on their own from {formatMoney(prices.lesson)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href={startHref} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-3 text-xs font-extrabold text-white shadow-[0_10px_26px_rgba(109,74,255,.22)] transition hover:-translate-y-0.5 hover:bg-[#5e3de0]">
              <Icon name="play" size={13} /> Start with the free preview
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-[#dad5df] bg-white px-5 py-3 text-xs font-extrabold text-[#4a4450] transition hover:bg-[#f6f4f8]">
              Pass prices <Icon name="arrow-right" size={13} />
            </Link>
          </div>
        </div>
        <p className="border-t border-[#f0edf3] bg-[#fbfafc] px-5 py-3 text-[11px] leading-5 text-[#7d7683] sm:px-6">
          A course needs an active pass as well as the purchase — the pass buys time on the platform. The free preview
          lesson needs neither, and it is the honest way to judge the teaching before you spend anything.
        </p>
      </section>

      <CourseBrief course={course} />

      <section className="overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0edf3] p-5 sm:px-6">
          <div>
            <h2 className="text-base font-black tracking-[-.025em]">Curriculum</h2>
            <p className="mt-1 text-[10px] text-[#918a97]">{modules.length} modules · {lessons.length} lessons · {fmtMinutes(minutes)}</p>
          </div>
          <p className="text-[10px] font-bold text-[#7d7683]">
            Lesson {lessons[0] ? 1 : 0} is free to read
          </p>
        </div>
        {modules.map((module) => (
          <div key={module.id} className="border-b border-[#eeebf0] last:border-0">
            <div className="bg-[#faf9fb] px-5 py-4 sm:px-6">
              <h3 className="text-xs font-extrabold text-[#38323e]">{module.title}</h3>
              <p className="mt-1 text-[10px] text-[#918a97]">{module.description}</p>
            </div>
            {module.lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-3 border-t border-[#f1eef2] px-5 py-3.5 first:border-0 sm:px-6">
                <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${lesson.preview ? "bg-[#f0ecff] text-[#6543e8]" : "bg-[#f1eff3] text-[#aaa4b0]"}`}>
                  {lesson.preview ? <Icon name="play" size={11} /> : <Icon name="lock" size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#4a4450]">{index + 1}. {lesson.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-[#918a97]">{lesson.summary}</p>
                </div>
                <span className="shrink-0 text-[9px] font-semibold text-[#a19aa7]">{lesson.duration} min</span>
                {lesson.preview && <span className="shrink-0 rounded-full bg-[#eefaf2] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">Free</span>}
              </div>
            ))}
          </div>
        ))}
        <p className="border-t border-[#f0edf3] bg-[#fbfafc] px-5 py-3.5 text-[11px] leading-5 text-[#7d7683] sm:px-6">
          The full curriculum is included in the price: {lessons.length} lessons and the {course.project.toLowerCase()} project.
          {" "}<Link href={startHref} className="font-bold text-[#5e3de0] underline">Create an account</Link> to track progress and earn the certificate.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "star" as const, title: "Taught by a working engineer", body: `${course.instructor.name} — ${course.instructor.role}. Every lesson is written to be used, not just watched.` },
          { icon: "certificate" as const, title: "A verifiable certificate", body: "Complete every lesson and you get a certificate with a code and QR that an employer can check in seconds." },
          { icon: "terminal" as const, title: "Practice in the Code Lab", body: "Write and run code in the browser while you learn, with your work saved to your own account." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-[#e8e4ec] bg-white p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]"><Icon name={item.icon} size={17} /></span>
            <p className="mt-3 text-sm font-extrabold text-[#332e39]">{item.title}</p>
            <p className="mt-1.5 text-[11px] leading-5 text-[#7d7683]">{item.body}</p>
          </div>
        ))}
      </section>

      <InfoContactStrip />
    </InfoPage>
  );
}
