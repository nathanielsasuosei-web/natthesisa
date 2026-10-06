import type { Metadata } from "next";
import Link from "next/link";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { contentTotals, lessonCountsByCourse, lessonMinutesByCourse } from "@/lib/course-content";
import { formatMoney, programPrice } from "@/lib/plans";
import { getCurrentUser } from "@/lib/session";
import { ensureContentReady } from "@/lib/bootstrap";
import { isOwner } from "@/lib/owner";
import InfoPage, { InfoContactStrip, InfoFaq, InfoList, InfoSection } from "@/components/InfoPage";
import CourseCard from "@/components/CourseCard";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "All courses",
  description:
    "Every codemasterghana course, in full: web, app and backend development, computer science, software engineering, and building with AI. Compare what each course covers before you buy.",
};

export const dynamic = "force-dynamic";

/**
 * The public catalogue.
 *
 * The landing page shows a selection; this page shows everything, grouped by
 * program, with the real description of each course — so the answer to "what
 * would I actually learn?" does not require an account. Buying happens per
 * program: one payment opens every course and lesson under it.
 */
export default async function CoursesPage() {
  await ensureContentReady();
  const user = await getCurrentUser().catch(() => null);
  const totals = contentTotals();
  const counts = lessonCountsByCourse();
  const minutes = lessonMinutesByCourse();
  const appHref = user ? (isOwner(user) ? "/owner" : "/dashboard") : null;

  const groups = PROGRAMS.map((program) => ({
    program,
    courses: COURSES.filter((course) => course.category === program.category),
  })).filter((group) => group.courses.length > 0);

  return (
    <InfoPage
      eyebrow="Course catalogue"
      title="Every course, and what it actually teaches"
      intro={`${totals.courses} courses and ${totals.lessons} lessons, grouped into ${PROGRAMS.length} programs. Each course page states what you will build and who it suits — before you create an account.`}
      appHref={appHref}
      signedIn={Boolean(user)}
      userName={user?.name}
    >
      <InfoSection title="How the catalogue is organised">
        <p>
          A <strong>program</strong> is a path: a group of courses that belong together and get harder as you go. You
          buy the program once, and every course and lesson under it opens permanently. There is nothing else to
          pay — no subscriptions, no time limits, no per-lesson fees.
        </p>
        <InfoList
          items={groups.map(({ program, courses }) => (
            <>
              The <strong>{program.name}</strong> program ({courses.length} course{courses.length === 1 ? "" : "s"},{" "}
              {formatMoney(programPrice(program.id))}): {program.tagline.toLowerCase()}.
            </>
          ))}
        />
        <p>
          See <Link href="/pricing" className="font-bold text-[#5e3de0] underline">pricing</Link> for the whole
          picture, including how payment works.
        </p>
      </InfoSection>

      {groups.map(({ program, courses }) => (
        <section key={program.id} id={`program-${program.id}`} className="scroll-mt-28">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]">
                  <Icon name={program.icon} size={16} />
                </span>
                <h2 className="text-lg font-black tracking-[-.03em]">{program.name}</h2>
                <span className="rounded-full bg-[#6d4aff] px-2.5 py-1 text-[10px] font-black text-white">
                  {formatMoney(programPrice(program.id))}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6e6875]">{program.description}</p>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a939f]">
              {courses.length} course{courses.length === 1 ? "" : "s"} · {courses.reduce((sum, course) => sum + (counts[course.id] ?? 0), 0)} lessons
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                hrefBase="public"
                lessonCount={counts[course.id] ?? 0}
                minutes={minutes[course.id] ?? 0}
                price={programPrice(program.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <InfoFaq
        items={[
          {
            q: "Do I have to start at the beginning?",
            a: "No. The levels are a guide, not a gate: an experienced developer can start with Data Structures & Algorithms or System Design & Architecture and skip the beginner courses entirely. Every course page lists what it assumes you already know.",
          },
          {
            q: "How long does a course take?",
            a: "Most courses are six to eight lessons of roughly 10–15 minutes each. Reading carefully and doing the exercises, that is a week at an hour a day — or a weekend if you have a free Saturday.",
          },
          {
            q: "Can I see a lesson before paying?",
            a: "Every course page shows the full curriculum — every lesson title and summary — so you know exactly what you are buying. The lessons themselves open once you own the program.",
          },
          {
            q: "What do I get at the end?",
            a: "A certificate with an ID and a QR code that anyone can check on the verification page, plus whatever you built: a portfolio site, a dashboard, an API, a mobile app.",
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
