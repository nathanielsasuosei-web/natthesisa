import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import { ensureContentReady } from "@/lib/bootstrap";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { lessonCountsByCourse, contentTotals } from "@/lib/course-content";
import InfoPage, { InfoContactStrip, InfoFaq, InfoSection } from "@/components/InfoPage";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every codemasterghana lesson is free. No payment and no account is required to read, listen, or download lesson files.",
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
      title="The courses are free."
      intro="Every lesson, file and narration is open. You do not need an account or a payment to study. An account only remembers progress and prints a certificate."
      appHref={appHref}
      signedIn={Boolean(user)}
      userName={user?.name}
      userAvatar={user ? avatarHref(user) : null}
    >
      <section>
        <div>
          <h2 className="text-lg font-black tracking-[-.03em]">The programs</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6e6875]">
            Every course and every lesson sits inside a program, and every program is free to
            study. Open a lesson, listen to it, and download its files without signing in.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program) => {
            const courses = COURSES.filter((course) => course.category === program.category);
            const lessons = courses.reduce((sum, course) => sum + (counts[course.id] ?? 0), 0);
            return (
              <article key={program.id} className="flex flex-col rounded-[22px] border border-[#e8e4ec] bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6d4aff]">Free</p>
                <h3 className="mt-2 text-base font-black tracking-[-.02em]">{program.name}</h3>
                <p className="mt-1 text-[11px] font-semibold text-[#817a87]">{program.tagline}</p>
                <p className="mt-4 text-3xl font-black tracking-[-.05em]">Free</p>
                <p className="mt-1 text-[11px] text-[#918a97]">
                  {courses.length} course{courses.length === 1 ? "" : "s"} · {lessons} lessons
                </p>
                <p className="mt-4 flex-1 text-[12px] leading-6 text-[#5d5763]">{program.description}</p>
                <Link href="/courses" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-center text-xs font-extrabold text-white transition hover:-translate-y-0.5">
                  Open the courses <Icon name="arrow-right" size={13} />
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-[#918a97]">
          {totals.courses} courses · {totals.lessons} lessons in total. Nothing is locked.
        </p>
      </section>

      <InfoSection title="What a free account is for">
        <p>
          You can read every lesson without one. Create an account only if you want the site to
          remember which lessons you finished, and to print a certificate when a course is complete.
          The account is free. It does not unlock anything the public pages do not already show.
        </p>
      </InfoSection>

      <InfoFaq
        items={[
          {
            q: "Is there a catch?",
            a: "No. The lessons, files and narration are public. Payment is not required, and signing in is not required.",
          },
          {
            q: "Does access expire?",
            a: "No. Come back in a year and the same lessons are still open.",
          },
          {
            q: "Why does billing still exist?",
            a: "Older accounts may have invoices from when programs were sold. Those records are history. They do not open or close a lesson.",
          },
        ]}
      />

      <InfoContactStrip />
    </InfoPage>
  );
}
