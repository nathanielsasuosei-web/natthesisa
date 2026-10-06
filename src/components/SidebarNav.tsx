"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";
import AvatarImage from "./AvatarImage";
import Logo from "./Logo";
import SignOutButton from "./SignOutButton";

const NAV: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/courses", label: "Explore courses", icon: "courses" },
  { href: "/dashboard/code", label: "Code lab", icon: "terminal" },
  { href: "/dashboard/progress", label: "My progress", icon: "progress" },
  { href: "/dashboard/plans", label: "Programs", icon: "spark" },
  { href: "/dashboard/billing", label: "Billing", icon: "card" },
  { href: "/dashboard/certificates", label: "Certificates", icon: "certificate" },
  { href: "/dashboard/account", label: "My account", icon: "user" },
];

interface Props {
  userName: string;
  userEmail: string;
  /** The account's picture, or null/omitted for initials. */
  userAvatar?: string | null;
  /** How many programs the student owns. */
  programsOwned: number;
  weeklyMinutes: number;
  weeklyGoal: number;
  /** The teacher's own account gets a link to the console. */
  isOwner?: boolean;
  compact?: boolean;
}

export default function SidebarNav({
  userName,
  userEmail,
  userAvatar = null,
  programsOwned,
  weeklyMinutes,
  weeklyGoal,
  isOwner,
  compact = false,
}: Props) {
  const pathname = usePathname();

  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

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
          {isOwner && <Link href="/owner" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-[#d3c8ff]"><Icon name="crown" size={14} /> Teacher console</Link>}
        </nav>
        <Link href="/dashboard/account" aria-label="Open account" title={userName} className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#6d4aff] text-[10px] font-black text-white">
          <AvatarImage name={userName} src={userAvatar} />
        </Link>
        <SignOutButton iconOnly iconSize={15} className="grid size-8 shrink-0 place-items-center rounded-lg text-[#aaa4b2] transition hover:bg-white/[.08] hover:text-white" />
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
            {item.href.endsWith("plans") && programsOwned === 0 && <span className="ml-auto rounded-full bg-[#ffcf59] px-1.5 py-0.5 text-[8px] font-black uppercase text-[#4b3800]">Buy</span>}
          </Link>
        ))}
        {isOwner && (
          <Link href="/owner" className="mt-2 flex items-center gap-3 rounded-xl border border-[#6d4aff]/25 bg-[#6d4aff]/10 px-3 py-2.5 text-[13px] font-bold text-[#c6b9ff] transition hover:bg-[#6d4aff]/20">
            <Icon name="crown" size={18} /> Teacher console
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
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#332b4c] text-xs font-black text-[#c7baff]">
              <AvatarImage name={userName} src={userAvatar} />
            </span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{userName}</p><p className="truncate text-[9px] text-[#716b79]">{userEmail}</p></div>
          </div>
          <SignOutButton
            iconSize={15}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[.09] bg-white/[.04] px-3 py-2 text-[11px] font-bold text-[#c3bccc] transition hover:border-[#ff8f9b]/40 hover:bg-[#ff8f9b]/10 hover:text-[#ffb3bc]"
          />
          <div className="mt-2.5 inline-flex rounded-full bg-[#27232f] px-2.5 py-1 text-[9px] font-bold text-[#a9a2b0]">
            {programsOwned > 0 ? `${programsOwned} program${programsOwned === 1 ? "" : "s"} owned` : "No programs yet"}
          </div>
        </div>
      </div>
    </nav>
  );
}
