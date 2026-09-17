import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { profileCompleteness } from "@/lib/profile";
import { site } from "@/config/site";
import LoginForm from "@/components/LoginForm";
import AnimatedBackground from "@/components/AnimatedBackground";

export const metadata = { title: `Sign in — ${site.name}` };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user)
    redirect(
      user.role === "admin"
        ? "/admin"
        : profileCompleteness(user.profile).done
          ? "/dashboard"
          : "/onboarding"
    );

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
        className="animate-fade-up grid w-full max-w-4xl overflow-hidden rounded-2xl border border-rose-200/80 bg-white/90 shadow-xl shadow-rose-900/5 backdrop-blur md:grid-cols-2"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="hidden flex-col justify-between bg-gradient-to-br from-rose-600 via-rose-500 to-fuchsia-600 p-8 text-white md:flex">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back 💘</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Sign in to pick up where you left off — your matches, your date ideas and the profile
              other members see.
            </p>
          </div>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              ["🪪", "One account, one profile — email and password, not a name in a box"],
              ["📸", "Photo, age, city, bio, interests — all editable whenever you like"],
              ["💘", "Your preferences decide who shows up in Discover"],
              ["⚙️", "Privacy, notifications, sign-in details and deletion in settings"],
            ].map(([emoji, text]) => (
              <li key={text} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5">{emoji}</span>
                <span className="text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-8">
          <h1 className="text-xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Use the email you signed up with. Forgot it? This demo has no reset emails — create a new
            profile or use one of the demo accounts below.
          </p>
          <LoginForm
            demo={{
              member: { email: site.demo.memberEmail, password: site.demo.memberPassword },
              admin: { email: site.demo.adminEmail, password: site.demo.adminPassword },
            }}
          />
        </div>
      </div>

      <p className="animate-fade-up mt-6 max-w-2xl text-center text-xs text-slate-400" style={{ animationDelay: "0.2s" }}>
        Demo only · passwords are hashed with scrypt but everything lives in memory and resets on
        restart · prices in {site.currency.label} ({site.currency.symbol}) · no real payments
      </p>
    </div>
  );
}
