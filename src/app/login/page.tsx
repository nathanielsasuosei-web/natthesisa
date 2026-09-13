import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { site } from "@/config/site";
import LoginForm from "@/components/LoginForm";
import AnimatedBackground from "@/components/AnimatedBackground";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <AnimatedBackground />
      <Link href="/" className="animate-fade-up mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="grid size-8 place-items-center rounded-lg bg-rose-600 text-sm font-bold text-white">♥</span>
        {site.name}
      </Link>
      <div
        className="animate-fade-up w-full max-w-sm rounded-2xl border border-rose-200/80 bg-white/90 p-8 shadow-xl shadow-rose-900/5 backdrop-blur"
        style={{ animationDelay: "0.1s" }}
      >
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter any name to open your demo profile — it starts on the Free plan with a couple of matches waiting.
        </p>
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Tip: sign in as <strong>admin</strong> to open the admin console.
        </p>
        <LoginForm />
      </div>
      <p className="animate-fade-up mt-6 text-xs text-slate-400" style={{ animationDelay: "0.2s" }}>
        Demo only · data lives in memory and resets on restart · prices in {site.currency.label} ({site.currency.symbol}) · no real payments
      </p>
    </div>
  );
}
