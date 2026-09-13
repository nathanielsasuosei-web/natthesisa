import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { site } from "@/config/site";
import AnimatedBackground from "@/components/AnimatedBackground";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
              <span className="grid size-7 place-items-center rounded-lg bg-rose-600 text-sm font-bold">♥</span>
              {site.name}
            </Link>
            <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-rose-300">
              Admin console
            </span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-100">
              My dashboard
            </Link>
            <span className="hidden items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-slate-300 sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-rose-500/20 text-xs font-semibold text-rose-300">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              {user.name}
            </span>
          </nav>
        </div>
      </header>

      <main className="relative">
        <AnimatedBackground variant="subtle" />
        <div className="relative mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
