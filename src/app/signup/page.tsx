import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { profileCompleteness } from "@/lib/profile";
import { MIN_AGE } from "@/lib/profile";
import { site } from "@/config/site";
import SignupForm from "@/components/SignupForm";
import AnimatedBackground from "@/components/AnimatedBackground";

export const metadata = { title: `Join ${site.name} — ${site.tagline}` };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(profileCompleteness(user.profile).done ? "/dashboard" : "/onboarding");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <AnimatedBackground />
      <Link
        href="/"
        className="animate-fade-up mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-rose-600 text-sm font-bold text-white">♥</span>
        {site.name}
      </Link>

      <div
        className="animate-fade-up w-full max-w-md rounded-2xl border border-rose-200/80 bg-white/90 p-8 shadow-xl shadow-rose-900/5 backdrop-blur"
        style={{ animationDelay: "0.1s" }}
      >
        <h1 className="text-xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Two minutes to a real profile. Start on the Free plan — {site.currency.symbol}0 — and
          upgrade only when you want more matches.
        </p>
        <SignupForm />
      </div>

      <p className="animate-fade-up mt-6 max-w-md text-center text-xs text-slate-500" style={{ animationDelay: "0.2s" }}>
        You must be {MIN_AGE} or older. We only ask for what a dating profile needs — no phone
        number, no ID, and this demo never sends email.
      </p>
    </div>
  );
}
