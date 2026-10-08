import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AuthForm from "@/components/AuthForm";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { brandAssets } from "@/config/branding";
import { contentTotals } from "@/lib/course-content";
import { PROGRAMS } from "@/lib/programs";
import { ensureContentReady } from "@/lib/bootstrap";
import { safeNextPath } from "@/lib/safe-next";

// The page reads the session cookie, so it can never be prerendered. Saying so
// keeps the build from attempting a static pass (and logging a failure) first.
export const dynamic = "force-dynamic";

async function signedInUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    // Next's own control-flow errors (redirects, dynamic usage) are not
    // failures to recover from: rethrow them so the framework still sees them.
    unstable_rethrow(error);
    // A signed-in learner visiting during a database outage still gets the
    // sign-in form (which explains the outage) instead of a 500 page.
    console.error("[codemasterghana] login page: session unreadable, rendering signed out", error);
    return null;
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string; next?: string }> }) {
  const params = await searchParams;
  // A lesson sends the visitor here with `next`, so they land back on it.
  const next = safeNextPath(params.next);
  const user = await signedInUser();
  if (user) redirect(next ?? (user.role === "owner" ? "/owner" : "/dashboard"));
  const initialMode = params.mode === "signup" ? "signup" : "signin";
  await ensureContentReady();
  const totals = contentTotals();
  const careerPaths = PROGRAMS.length;

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#1b1822] p-10 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-32 -top-36 size-[32rem] rounded-full bg-[#6d4aff]/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 size-[30rem] rounded-full bg-[#ff7448]/20 blur-3xl" />
        <div className="relative"><Logo inverse /></div>
        <div className="relative mt-8 overflow-hidden rounded-[22px] border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandAssets.poster} alt="codemasterghana — Vibe Coding" className="h-40 w-full object-cover object-center sm:h-48" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1b1822] via-transparent to-transparent" />
        </div>
        <div className="relative my-auto mx-auto max-w-lg py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-bold text-[#c3b7f8]"><Icon name="spark" size={14} /> Learn by building</span>
          <h2 className="mt-6 text-balance text-5xl font-black leading-[1.04] tracking-[-.055em]">Your next skill is closer than you think.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#aaa4b1]">Join focused lessons, build projects worth sharing and watch your progress become a real body of work.</p>
          <div className="mt-10 grid gap-0 border-y border-white/10 sm:grid-cols-3">
            {[
              ["terminal", String(totals.lessons), "guided lessons"], ["briefcase", "15+", "real projects"], ["trophy", String(careerPaths), careerPaths === 1 ? "program" : "programs"],
            ].map(([icon, value, label]) => (
              <div key={label} className="border-b border-white/10 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><Icon name={icon as "terminal"} size={18} className="text-[#ad9aff]" /><p className="mt-4 text-xl font-black">{value}</p><p className="mt-1 text-[10px] text-[#8f8997]">{label}</p></div>
            ))}
          </div>
          <blockquote className="mt-10 border-l-2 border-[#6d4aff] pl-5"><p className="text-sm font-semibold leading-6 text-[#d3ced8]">“The first platform that got me out of tutorial mode and into building.”</p><footer className="mt-2 text-xs text-[#847d8c]">— Ama, frontend learner</footer></blockquote>
        </div>
        <p className="relative text-xs text-[#686170]">© {new Date().getFullYear()} codemasterghana</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-[#faf9f7] px-5 py-10 sm:px-8">
        <div className="absolute left-5 top-5 lg:hidden"><Logo /></div>
        <Link href="/" className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#77717e] transition hover:text-[#5e3ce8]"><Icon name="arrow-left" size={14} /> Back to home</Link>
        <div className="w-full max-w-[430px] border-y border-[#ded9e3] py-8">
          <AuthForm initialMode={initialMode} next={next} />
          <p className="mt-6 text-center text-[10px] text-[#918a97]">
            Owner or teacher?{" "}
            <Link href="/owner-sign-in" className="font-bold text-[#6543e8]">
              Sign in here
            </Link>
          </p>

          <nav aria-label="Company" className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-[#ece9f0] pt-4 text-[10px] font-bold text-[#8a8390]">
            <Link href="/about" className="transition hover:text-[#5e3ce8]">About</Link>
            <span aria-hidden="true" className="text-[#cfc9d5]">·</span>
            <Link href="/pricing" className="transition hover:text-[#5e3ce8]">Pricing</Link>
            <span aria-hidden="true" className="text-[#cfc9d5]">·</span>
            <Link href="/contact" className="transition hover:text-[#5e3ce8]">Contact</Link>
            <span aria-hidden="true" className="text-[#cfc9d5]">·</span>
            <Link href="/privacy" className="transition hover:text-[#5e3ce8]">Privacy</Link>
            <span aria-hidden="true" className="text-[#cfc9d5]">·</span>
            <Link href="/terms" className="transition hover:text-[#5e3ce8]">Terms</Link>
            <span aria-hidden="true" className="text-[#cfc9d5]">·</span>
            <Link href="/verify" className="transition hover:text-[#5e3ce8]">Verify a certificate</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
