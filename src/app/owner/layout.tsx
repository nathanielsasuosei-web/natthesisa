import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOwner } from "@/lib/owner";
import { messageStats } from "@/lib/messages";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";

export default async function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const inbox = user && isOwner(user) ? await messageStats().catch(() => ({ total: 0, open: 0 })) : { total: 0, open: 0 };
  // A signed-in student is not lost: send them back to what they can use.
  // The teacher sign-in page is only for a visitor with no session at all.
  if (user && !isOwner(user)) redirect("/dashboard");
  if (!user) redirect("/owner-sign-in");
  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1b1822] text-white">
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><Logo inverse /><span className="h-5 w-px bg-white/15" /><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider "bg-[#ffcf59]/15 text-[#ffcf59]"`}><Icon name="crown" size={11} /> "Teacher"</span></div><nav className="flex items-center gap-2"><Link href="/owner" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="chart" size={15} /> <span className="hidden sm:inline">Console</span></Link><Link href="/owner/lessons" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="upload" size={15} /> <span className="hidden sm:inline">Upload lessons</span></Link><Link href="/owner/studio" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="video" size={15} /> <span className="hidden sm:inline">Studio</span></Link><Link href="/owner/certificates" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="certificate" size={15} /> <span className="hidden sm:inline">Certificates</span></Link><Link href="/owner/messages" className="relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="mail" size={15} /> <span className="hidden sm:inline">Messages</span>{inbox.open > 0 && <span className="grid size-4 place-items-center rounded-full bg-[#ffcf59] text-[8px] font-black text-[#4b3800]">{inbox.open > 9 ? "9+" : inbox.open}</span>}</Link><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"><Icon name="home" size={15} /> <span className="hidden sm:inline">Learner dashboard</span></Link><Link href="/dashboard/account" className="grid size-9 place-items-center rounded-xl bg-white/[.07] text-xs font-black text-[#c5b8ff]">{user.name.slice(0, 1)}</Link></nav></div>
      </header>
      <main className="mx-auto max-w-[1320px] px-4 py-7 sm:px-8 sm:py-9">{children}</main>
    </div>
  );
}
