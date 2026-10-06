import type { Metadata } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/require-user";
import { site } from "@/config/site";
import { ownsProgram } from "@/lib/access";
import { COURSES } from "@/lib/courses";
import { PROGRAMS } from "@/lib/programs";
import { programPrice } from "@/lib/plans";
import { contentLessons } from "@/lib/course-content";
import { isPaystackConfigured } from "@/lib/paystack";
import ProgramOptions from "@/components/ProgramOptions";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Programs" };

/**
 * Buying programs — the only thing students pay for.
 *
 * One program opens every course and every lesson under it, permanently.
 * There is nothing else to buy: no passes, no per-course prices, no previews.
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
      price: programPrice(program.id),
      owned: ownsProgram(user, program.id),
    };
  });

  return (
    <div className="space-y-10">
      <header className="text-center">
        <p className="text-xs font-bold text-[#6d4aff]">Programs</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">
          {owned.length > 0 ? "Your programs." : "Buy a program. Learn everything in it."}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#756f7b]">
          Every course and every lesson sits inside a program. Buy the program once and it is all
          yours, forever — no subscriptions, no time limits, nothing else to pay. Prices are in {site.currency.label}.
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <span>
            <strong>You do not own a program yet.</strong> Choose one below — every course and lesson
            inside opens the moment your payment confirms.
          </span>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-1 font-black">
            See what is inside <Icon name="arrow-right" size={13} />
          </Link>
        </div>
      )}

      <ProgramOptions
        programs={options}
        momoPhone={user.paymentMethod.phone}
        momoNetwork={user.paymentMethod.network}
      />

      <section className="open-columns grid gap-0 xl:grid-cols-3">
        {[
          ["spark", "One payment, forever", "A program never expires. Come back in a year and it is all still open."],
          ["card", "The whole price, up front", "The program price is everything — no passes, no per-lesson fees."],
          ["shield", "Invoices for everything", "Every purchase raises an invoice on your billing page."],
        ].map(([icon, title, body]) => (
          <div key={title} className="open-column flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]">
              <Icon name={icon as "shield"} size={17} />
            </span>
            <div>
              <p className="text-xs font-extrabold">{title}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#918a97]">{body}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="text-center text-[9px] leading-4 text-[#9a939f]">
        {isPaystackConfigured()
          ? "Payments are processed securely by Paystack — approve with your MoMo PIN on your own phone. We never see or store your PIN."
          : "Demo note: checkout and invoices are fully interactive, but no real money moves. The teacher connects live Mobile Money payments from the console."}
      </p>
    </div>
  );
}
