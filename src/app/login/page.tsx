import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">N</span>
        Natthesisa
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <h1 className="text-xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter any name to open your demo workspace — it starts on the Free plan with sample data.
        </p>
        <LoginForm />
      </div>
      <p className="mt-6 text-xs text-slate-400">Demo only · data lives in memory and resets on restart · no real payments</p>
    </div>
  );
}
