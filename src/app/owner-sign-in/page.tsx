import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import OwnerLoginForm from "@/components/OwnerLoginForm";
import { ownerAccount } from "@/lib/store";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";

export const metadata: Metadata = { title: "Teacher sign in" };

// The page reads the session cookie and asks the database whether an owner
// exists, so it can never be prerendered. Saying so keeps the build from
// attempting a static pass (and querying the database) first.
export const dynamic = "force-dynamic";

async function signedInUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    // Next's own control-flow errors (redirects, dynamic usage) are not
    // failures to recover from: rethrow them so the framework still sees them.
    unstable_rethrow(error);
    // A signed-in user visiting during a database outage still gets the
    // sign-in form (which explains the outage) instead of a 500 page.
    console.error("[codemasterghana] owner sign-in page: session unreadable, rendering signed out", error);
    return null;
  }
}

async function ownerExists(): Promise<boolean> {
  try {
    return Boolean(await ownerAccount());
  } catch (error) {
    unstable_rethrow(error);
    // Hide the setup form when the database is unreachable: creating an
    // owner is impossible anyway, and the sign-in form names the outage.
    console.error("[codemasterghana] owner sign-in page: owner check failed, hiding setup", error);
    return true;
  }
}

export default async function OwnerSignInPage() {
  const user = await signedInUser();
  if (user?.role === "owner") redirect("/owner");

  // Offer first-run setup only when nobody owns the platform yet and the
  // environment has not configured the owner account.
  const configured = Boolean(process.env.OWNER_EMAIL?.trim() && process.env.OWNER_PASSWORD);
  const setupAvailable = !configured && !(await ownerExists());

  return (
    <main className="grid min-h-screen bg-[#f8f8f5] lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#1b1822] p-10 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-32 -top-40 size-[32rem] rounded-full bg-[#6d4aff]/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-36 size-[28rem] rounded-full bg-[#ff7448]/20 blur-3xl" />
        <div className="relative"><Logo inverse /></div>
        <div className="relative my-auto mx-auto max-w-md py-14"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-[#c3b7f8]"><Icon name="shield" size={14} /> Teacher console</span><h2 className="mt-6 text-balance text-5xl font-black leading-[1.04] tracking-[-.055em]">See your whole school clearly.</h2><p className="mt-5 max-w-md text-base leading-7 text-[#aaa4b1]">Set your prices, publish lessons and manage student access from one secure workspace.</p><div className="mt-9 grid grid-cols-3 gap-0 border-y border-white/10">{[["users", "Students"], ["chart", "Analytics"], ["card", "Prices"]].map(([icon, label]) => <div key={label} className="border-r border-white/10 p-4 last:border-r-0"><Icon name={icon as "users"} size={18} className="text-[#b9a9ff]" /><p className="mt-3 text-[10px] font-bold text-[#c8c2cd]">{label}</p></div>)}</div></div>
        <p className="relative text-[10px] text-[#686170]">For the teacher account only · Demo environment</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8"><div className="absolute left-5 top-5 lg:hidden"><Logo /></div><Link href="/" className="absolute right-6 top-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#77717e] hover:text-[#5e3ce8]"><Icon name="arrow-left" size={14} /> Home</Link><div className="w-full max-w-[440px] border-y border-[#ded9e3] py-8"><OwnerLoginForm currentUserName={user?.name} setupAvailable={setupAvailable} /><p className="mt-6 text-center text-[10px] text-[#918a97]">Student? <Link href="/login" className="font-bold text-[#6543e8]">Go to student sign in</Link></p>
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
            </nav></div></section>
    </main>
  );
}
