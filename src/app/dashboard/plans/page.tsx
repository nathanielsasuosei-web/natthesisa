import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { ownsProgram } from "@/lib/access";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { contentLessons } from "@/lib/course-content";
import { programPrice } from "@/lib/plans";
import { formatMoney } from "@/lib/pass-periods";
import BuyProgram from "@/components/BuyProgram";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Programs" };

/**
 * Programs are paths through the catalogue. Buying one program opens every
 * course and lesson inside it. Nothing is free: a lesson opens only once its
 * program is owned.
 */
export default async function ProgramsPage() {
  const user = await requireCurrentUser();
  const owned = PROGRAMS.filter((program) => ownsProgram(user, program.id));

  const options = PROGRAMS.map((program) => {
    const courses = COURSES.filter((course) => course.category === program.category);
    const lessonCount = courses.reduce((sum, course) => sum + contentLessons(course).length, 0);
    return {
      id: program.id,
      name: program.name,
      tagline: program.tagline,
      description: program.description,
      courseCount: courses.length,
      lessonCount,
      owned: ownsProgram(user, program.id),
      price: programPrice(program.id),
    };
  });

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="text-xs font-bold text-[#6d4aff]">Programs</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">
          {owned.length > 0 ? "Your programs." : "Buy a program to open it."}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#756f7b]">
          One payment opens every course and lesson in a program, permanently. Your progress and
          certificates are saved to your account.
        </p>
      </header>

      {owned.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
          <span>
            <strong>You own {owned.length} program{owned.length === 1 ? "" : "s"}:</strong>{" "}
            {owned.map((program) => program.name).join(", ")}. Everything inside is open.
          </span>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1 font-black">
            Browse courses <Icon name="arrow-right" size={13} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-[#f6f3ff] p-4 text-xs text-[#3d3458]">
          <span>
            <strong>No program owned yet.</strong> Buy one below to open its courses and lessons.
          </span>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1 font-black">
            See the courses <Icon name="arrow-right" size={13} />
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((program) => (
          <article key={program.id} className="flex flex-col rounded-[22px] border border-[#e8e4ec] bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#6d4aff]">{program.owned ? "Owned" : "Program"}</p>
            <h2 className="mt-2 text-base font-black tracking-[-.02em]">{program.name}</h2>
            <p className="mt-2 flex-1 text-[12px] leading-6 text-[#5d5763]">{program.tagline}</p>
            <p className="mt-3 text-2xl font-black tracking-[-.04em]">{formatMoney(program.price)}</p>
            <p className="mt-1 text-[11px] font-semibold text-[#817a87]">
              {program.courseCount} course{program.courseCount === 1 ? "" : "s"} · {program.lessonCount} lessons
            </p>
            {program.owned ? (
              <Link href="/dashboard/courses" className="mt-5 rounded-xl bg-[#6d4aff] px-4 py-3 text-center text-xs font-extrabold text-white">
                Open the courses
              </Link>
            ) : (
              <div className="mt-5">
                <BuyProgram programId={program.id} programName={program.name} price={program.price} />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
