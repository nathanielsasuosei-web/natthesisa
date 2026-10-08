import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import { ensureContentReady } from "@/lib/bootstrap";
import { ownsProgram } from "@/lib/access";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { programPrice } from "@/lib/plans";
import { formatMoney } from "@/lib/pass-periods";
import { lessonCountsByCourse, contentTotals } from "@/lib/course-content";
import InfoPage, { InfoContactStrip, InfoFaq, InfoSection } from "@/components/InfoPage";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Each codemasterghana program is paid once. Sign in and buy a program to open every course and lesson inside it.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  await ensureContentReady();
  const user = await getCurrentUser();
  const totals = contentTotals();
  const counts = lessonCountsByCourse();
  const appHref = user ? (user.role === "owner" ? "/owner" : "/dashboard") : null;

  return (
    <InfoPage
      eyebrow="Pricing"
      title="Pay once per program."
      intro="Sign in, then buy a program. One payment opens every course and lesson inside it, permanently. Nothing is free."
      appHref={appHref}
      signedIn={Boolean(user)}
      userName={user?.name}
      userAvatar={user ? avatarHref(user) : null}
    >
      <section>
        <div>
          <h2 className="text-lg font-black tracking-[-.03em]">The programs</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6e6875]">
            Every course and every lesson sits inside a program. Its lessons, files, videos and narration open only
            for a signed-in student who owns that program.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program) => {
            const courses = COURSES.filter((course) => course.category === program.category);
            const lessons = courses.reduce((sum, course) => sum + (counts[course.id] ?? 0), 0);
            const owned = user ? ownsProgram(user, program.id) : false;
            const href = !user ? `/login?mode=signup&next=${encodeURIComponent("/dashboard/plans")}` : owned ? "/dashboard/courses" : "/dashboard/plans";
            const label = !user ? "Sign in to buy" : owned ? "Open the courses" : "Buy this program";
            return (
              <article key={program.id} className="flex flex-col rounded-[22px] border border-[#e8e4ec] bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6d4aff]">{owned ? "Owned" : "Program"}</p>
                <h3 className="mt-2 text-base font-black tracking-[-.02em]">{program.name}</h3>
                <p className="mt-1 text-[11px] font-semibold text-[#817a87]">{program.tagline}</p>
                <p className="mt-4 text-3xl font-black tracking-[-.05em]">{formatMoney(programPrice(program.id))}</p>
                <p className="mt-1 text-[11px] text-[#918a97]">
                  {courses.length} course{courses.length === 1 ? "" : "s"} · {lessons} lessons · paid once
                </p>
                <p className="mt-4 flex-1 text-[12px] leading-6 text-[#5d5763]">{program.description}</p>
                <Link href={href} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-center text-xs font-extrabold text-white transition hover:-translate-y-0.5">
                  {label} <Icon name="arrow-right" size={13} />
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#918a97]">
          {totals.courses} courses · {totals.lessons} lessons in total. Course overview pages are public; the lessons are not.
        </p>
      </section>

      <InfoSection title="What the account is for">
        <p>
          You sign in to open a lesson, and you buy a program to open its courses. Your account also keeps your
          progress, your certificates and your receipts. A paused account cannot open lessons.
        </p>
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "Do I have to pay to see a course?",
            a: "You can read the course overview, its curriculum and what you will learn without an account. To open a lesson you must sign in and own its program.",
          },
          {
            q: "Does access expire?",
            a: "No. Once you own a program, its lessons stay open.",
          },
          {
            q: "Are there free previews?",
            a: "No. Nothing in a course is free to open, so there are no preview lessons.",
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
