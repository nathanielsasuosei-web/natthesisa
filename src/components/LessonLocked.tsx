import Link from "next/link";
import BuyProgram from "./BuyProgram";
import Icon from "./Icon";
import Logo from "./Logo";
import { accessMessage, type AccessDecision } from "@/lib/access";
import { formatMoney } from "@/lib/pass-periods";

interface Props {
  courseTitle: string;
  courseHref: string;
  lessonTitle: string;
  lessonSummary: string;
  decision: AccessDecision;
}

/**
 * Shown in place of a lesson the signed-in student may not open yet. The
 * lesson body, files, video and narration are never rendered here, so nothing
 * leaks through the markup. The only action is buying the program.
 */
export default function LessonLocked({ courseTitle, courseHref, lessonTitle, lessonSummary, decision }: Props) {
  const canBuy = decision.needsPurchase && Boolean(decision.programId) && Boolean(decision.programName);

  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <header className="sticky top-0 z-40 border-b border-[#e6e2e9] bg-white/90 backdrop-blur-xl">
        <div className="flex h-[66px] items-center px-4 sm:px-6">
          <Logo compact />
          <span className="mx-4 h-5 w-px bg-[#e1dde5]" />
          <Link href={courseHref} className="min-w-0 truncate text-xs font-bold text-[#5c5662] hover:text-[#5f3ee1]">
            {courseTitle}
          </Link>
          <Link
            href="/dashboard/courses"
            className="ml-auto grid size-9 place-items-center rounded-xl border border-[#e4e0e8] text-[#77717e] transition hover:border-violet-300"
            aria-label="Close lesson"
          >
            <Icon name="close" size={17} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 py-14 sm:py-20">
        <section className="rounded-[22px] border border-[#e6e2e9] bg-white p-7 sm:p-10">
          <span className="grid size-11 place-items-center rounded-xl bg-[#1b1822] text-white">
            <Icon name="lock" size={18} />
          </span>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Locked lesson</p>
          <h1 className="mt-2 text-balance text-2xl font-black leading-tight tracking-[-.04em] text-[#1d1922] sm:text-3xl">
            {lessonTitle}
          </h1>
          <p className="mt-4 text-sm font-medium leading-7 text-[#5f5965]">{lessonSummary}</p>
          <p className="mt-6 rounded-xl border border-[#e4e0e9] bg-[#fbfafc] px-4 py-3 text-xs font-semibold leading-5 text-[#5d5763]">
            {accessMessage(decision, courseTitle)}
          </p>

          {canBuy && decision.programId && decision.programName ? (
            <div className="mt-6">
              <BuyProgram programId={decision.programId} programName={decision.programName} price={decision.price} />
              <p className="mt-3 text-[11px] leading-5 text-[#8d8694]">
                One payment of {formatMoney(decision.price)} opens every course and lesson in {decision.programName}, permanently.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={courseHref}
              className="inline-flex items-center gap-2 rounded-xl border border-[#ddd8e2] bg-white px-5 py-3 text-xs font-bold text-[#5e5864] transition hover:border-violet-300"
            >
              <Icon name="arrow-left" size={14} /> Course overview
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
