import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/session";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin-sign-in");
  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1b1822] text-white">
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><Logo inverse /><span className="h-5 w-px bg-white/15" /><span className="inline-flex items-center gap-1.5 rounded-full bg-[#6d4aff]/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#c6b9ff]"><Icon name="admin" size={11} /> Admin</span></div><nav className="flex items-center gap-2"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="home" size={15} /> <span className="hidden sm:inline">Learner dashboard</span></Link><Link href="/dashboard/account" className="grid size-9 place-items-center rounded-xl bg-white/[.07] text-xs font-black text-[#c5b8ff]">{user.name.slice(0, 1)}</Link></nav></div>
      </header>
      <main className="mx-auto max-w-[1320px] px-4 py-7 sm:px-8 sm:py-9">{children}</main>
    </div>
  );
}
