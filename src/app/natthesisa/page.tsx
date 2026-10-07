import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import AnimatedBackground from "@/components/AnimatedBackground";
import NatthesisaChat from "@/components/NatthesisaChat";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Natthesisa — your AI study companion",
  description:
    "Meet Natthesisa: explanations in plain language, quizzes that make ideas stick, code debugging help and course guidance — free for every codemasterghana student.",
};

export const revalidate = 0;

const CAPABILITIES = [
  { icon: "book", title: "Explains anything", body: "HTML to Big-O, in plain language with tiny examples." },
  { icon: "target", title: "Quizzes you", body: "Practice questions with answers that teach, not just grade." },
  { icon: "code", title: "Debugs with you", body: "Paste code + the error — get a review and a fix path." },
  { icon: "courses", title: "Guides your path", body: "Which course next, based on your goal and level." },
] as const;

export default async function NatthesisaPage() {
  const user = await getCurrentUser().catch(() => null);
  const appHref = user ? (user.role === "owner" ? "/owner" : "/dashboard") : null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <PublicHeader
        appHref={appHref}
        signedIn={Boolean(user)}
        userName={user?.name}
        userAvatar={user ? avatarHref(user) : null}
      />

      <main className="relative mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#efe9ff] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#5c3be4]">
              <Icon name="spark" size={14} /> AI study companion
            </span>
            <h1 className="mt-4 text-balance text-4xl font-black tracking-[-.045em] text-[#27222e] sm:text-5xl">
              Meet <span className="text-[#6d4aff]">Natthesisa</span>.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-[#6e6875]">
              The senior student who never sleeps. Natthesisa explains concepts,
              quizzes you until ideas stick, helps debug your code and points you
              to the right lesson — free for every student, right inside your
              lessons.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {CAPABILITIES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#e7e2ee] bg-white/80 p-4 backdrop-blur">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff]">
                    <Icon name={item.icon} size={17} />
                  </span>
                  <p className="mt-3 text-[13px] font-black text-[#302b37]">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#7b7481]">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px] font-bold text-[#6e6875]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Always online
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2f7] px-3 py-1.5">
                <Icon name="shield" size={13} className="text-[#6d4aff]" /> Free for students
              </span>
              {user ? (
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-full bg-[#17151f] px-3.5 py-1.5 text-white transition hover:bg-[#2a2632]">
                  Continue learning <Icon name="arrow-right" size={13} />
                </Link>
              ) : (
                <Link href="/login?mode=signup" className="inline-flex items-center gap-1.5 rounded-full bg-[#17151f] px-3.5 py-1.5 text-white transition hover:bg-[#2a2632]">
                  Start learning free <Icon name="arrow-right" size={13} />
                </Link>
              )}
            </div>
          </div>

          <div className="animate-fade-up h-[min(720px,calc(100dvh-12rem))] min-h-[540px]" style={{ animationDelay: ".12s" }}>
            <NatthesisaChat variant="page" />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
