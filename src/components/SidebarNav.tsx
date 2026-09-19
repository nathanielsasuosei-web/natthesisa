"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon, { type IconName } from "./Icon";
import Logo from "./Logo";

const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/courses", label: "Explore courses", icon: "courses" },
  { href: "/dashboard/progress", label: "My progress", icon: "progress" },
  { href: "/dashboard/plans", label: "Plans", icon: "spark" },
  { href: "/dashboard/billing", label: "Billing", icon: "card" },
  { href: "/dashboard/account", label: "My account", icon: "user" },
];

interface Props {
  userName: string;
  userEmail: string;
  planName: string;
  weeklyMinutes: number;
  weeklyGoal: number;
  isAdmin?: boolean;
  compact?: boolean;
}

export default function SidebarNav({ userName, userEmail, planName, weeklyMinutes, weeklyGoal, isAdmin, compact = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <Logo href="/dashboard" inverse compact className="shrink-0" />
        <nav className="dashboard-scroll flex flex-1 gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold ${active(item.href) ? "bg-[#6d4aff] text-white" : "text-[#aaa4b2]"}`}>
              <Icon name={item.icon} size={14} /> {item.label}
            </Link>
          ))}
          {isAdmin && <Link href="/admin" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-[#d3c8ff]"><Icon name="admin" size={14} /> Admin</Link>}
        </nav>
        <Link href="/dashboard/account" aria-label="Open account" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#6d4aff] text-[10px] font-black text-white">{userName.slice(0, 1).toUpperCase()}</Link>
      </div>
    );
  }

  const goalPercent = Math.min(100, Math.round((weeklyMinutes / Math.max(weeklyGoal, 1)) * 100));
  return (
    <nav className="relative flex h-full flex-col">
      <Logo href="/dashboard" inverse className="px-1" />
      <div className="mt-9 space-y-1">
        <p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#66606f]">Learn</p>
        {NAV.slice(0, 3).map((item) => (
          <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${active(item.href) ? "bg-[#6d4aff] text-white shadow-[0_8px_20px_rgba(109,74,255,.22)]" : "text-[#9e98a6] hover:bg-white/[.05] hover:text-white"}`}>
            <Icon name={item.icon} size={18} /> {item.label}
          </Link>
        ))}
        <p className="mb-2 mt-7 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#66606f]">Account</p>
        {NAV.slice(3).map((item) => (
          <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition ${active(item.href) ? "bg-[#6d4aff] text-white shadow-[0_8px_20px_rgba(109,74,255,.22)]" : "text-[#9e98a6] hover:bg-white/[.05] hover:text-white"}`}>
            <Icon name={item.icon} size={18} /> {item.label}
            {item.href.endsWith("plans") && planName === "Explorer" && <span className="ml-auto rounded-full bg-[#ffcf59] px-1.5 py-0.5 text-[8px] font-black uppercase text-[#4b3800]">Pro</span>}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" className="mt-2 flex items-center gap-3 rounded-xl border border-[#6d4aff]/25 bg-[#6d4aff]/10 px-3 py-2.5 text-[13px] font-bold text-[#c6b9ff] transition hover:bg-[#6d4aff]/20">
            <Icon name="admin" size={18} /> Admin console
          </Link>
        )}
      </div>

      <div className="mt-auto">
        <div className="mb-4 border-y border-white/[.08] py-3.5">
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-[#d1ccd6]">Weekly goal</span><span className="text-[10px] font-black text-[#b7a7ff]">{goalPercent}%</span></div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#8e73ff]" style={{ width: `${goalPercent}%` }} /></div>
          <p className="mt-2 text-[9px] text-[#77717f]">{weeklyMinutes} of {weeklyGoal} minutes</p>
        </div>
        <div className="border-t border-white/[.07] pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#332b4c] text-xs font-black text-[#c7baff]">{userName.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{userName}</p><p className="truncate text-[9px] text-[#716b79]">{userEmail}</p></div>
            <button onClick={signOut} disabled={busy} title="Sign out" className="rounded-lg p-2 text-[#716b79] transition hover:bg-white/[.06] hover:text-white"><Icon name="logout" size={16} /></button>
          </div>
          <div className="mt-2.5 inline-flex rounded-full bg-[#27232f] px-2.5 py-1 text-[9px] font-bold text-[#a9a2b0]">{planName} plan</div>
        </div>
      </div>
    </nav>
  );
}
