import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { avatarHref } from "@/lib/avatars";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CodeLab from "@/components/CodeLab";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "CodeMaster Studio — write and run code in your browser",
  description:
    "A free online code editor: write HTML, CSS, JavaScript and Python, run it instantly, and keep your work — no install, no account needed.",
};

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getCurrentUser();
  const appHref = user?.role === "owner" ? "/owner" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#faf9fc]">
      <PublicHeader appHref={user ? appHref : null} signedIn={Boolean(user)} userName={user?.name}
        userAvatar={user ? avatarHref(user) : null} />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <CodeLab
          studentId="guest"
          studentName="Guest coder"
          eyebrow="Free for everyone · No account needed"
          title="CodeMaster Studio"
          blurb="Our own VS Code in the browser: write HTML, CSS, JavaScript and Python, run it instantly, and use the terminal like a developer. Your work is saved to this browser automatically — create a free account if you want it kept under your name in the dashboard code lab too."
        />

        <section className="mt-8 overflow-hidden rounded-[20px] border border-[#e8e4ec] bg-[#17151f] p-6 text-white sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#b7a7ff]">Know what to build</p>
              <h2 className="mt-2 text-xl font-black tracking-[-.02em] sm:text-2xl">
                The Studio is free — the programs teach you to code
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Six programs, thirteen courses, certificates employers can verify. Pay once per program and everything
                inside it is yours.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#17151f] transition hover:-translate-y-0.5 hover:bg-[#ffcf59]"
              >
                Explore courses <Icon name="arrow-right" size={14} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                See pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
