"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { site } from "@/config/site";
import Avatar from "./Avatar";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/dashboard/matches", label: "Matches", icon: "M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z" },
  { href: "/dashboard/profile", label: "My profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" },
  { href: "/dashboard/plans", label: "Membership", icon: "M12 3v18m5-13H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6" },
  { href: "/dashboard/billing", label: "Billing", icon: "M3 7h18v10H3zM3 11h18M7 15h4" },
  { href: "/dashboard/activity", label: "Timeline", icon: "M6 4h12v16l-6-3-6 3zM9 8h6M9 12h4", gated: true },
];

interface Props {
  userName: string;
  planName: string;
  activityEnabled: boolean;
  isAdmin?: boolean;
  compact?: boolean;
  photo?: string | null;
  avatar?: string;
  /** true until the member finishes profile creation */
  needsProfile?: boolean;
}

export default function SidebarNav({
  userName,
  planName,
  activityEnabled,
  isAdmin,
  compact,
  photo,
  avatar,
  needsProfile,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const linkCls = (active: boolean) =>
    [
      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      compact ? "w-44 shrink-0" : "",
      active
        ? "bg-rose-600 text-white"
        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
    ].join(" ");

  return (
    <nav className={compact ? "relative flex gap-2 overflow-x-auto" : "relative flex h-full flex-col"}>
      <div className={compact ? "" : "mb-8 flex items-center gap-2"}>
        <Link href="/" className={`flex items-center gap-2 font-semibold tracking-tight text-white ${compact ? "shrink-0" : ""}`}>
          <span className="grid size-7 place-items-center rounded-lg bg-rose-600 text-sm font-bold">♥</span>
          {site.name}
        </Link>
      </div>

      <div className={compact ? "flex gap-2" : "space-y-1"}>
        {NAV.map((item) => {
          const locked = item.gated && !activityEnabled;
          return (
            <Link key={item.href} href={item.href} className={linkCls(isActive(item.href))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
                <path d={item.icon} />
              </svg>
              <span className={compact ? "text-xs" : ""}>{item.label}</span>
              {item.href === "/dashboard/profile" && needsProfile && (
                <span className="ml-auto grid size-5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
                  !
                </span>
              )}
              {locked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="ml-auto size-3.5 opacity-70">
                  <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z" />
                </svg>
              )}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={[
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              compact ? "w-44 shrink-0" : "",
              pathname.startsWith("/admin")
                ? "bg-rose-600 text-white"
                : "text-rose-300/80 hover:bg-slate-900 hover:text-rose-200",
            ].join(" ")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
              <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4zM9.5 12l1.8 1.8 3.2-3.6" />
            </svg>
            <span className={compact ? "text-xs" : ""}>Admin console</span>
          </Link>
        )}
        {compact && (
          <Link href="/dashboard/settings" className={linkCls(pathname.startsWith("/dashboard/settings"))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5" />
            </svg>
            <span className="text-xs">Settings</span>
          </Link>
        )}
      </div>

      {!compact && (
        <div className="mt-auto space-y-3 border-t border-slate-800 pt-4">
          {needsProfile && (
            <Link
              href="/onboarding"
              className="flex items-start gap-2 rounded-xl bg-amber-400/15 p-3 text-xs text-amber-200 transition hover:bg-amber-400/25"
            >
              <span aria-hidden className="text-sm leading-none">✨</span>
              <span>
                <strong className="block font-semibold text-amber-100">Finish your profile</strong>
                Add a photo, interests and preferences to start matching.
              </span>
            </Link>
          )}

          <Link href="/dashboard/settings" className={linkCls(isActive("/dashboard/settings"))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.6 14H2.4a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 2.6V2.4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
            <span>Settings</span>
          </Link>

          <div className="flex items-center gap-3 px-1">
            <Avatar name={userName} photo={photo} emoji={avatar} size={36} ring={false} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{userName}</p>
              <p className="text-xs capitalize text-slate-500">{planName} member</p>
            </div>
          </div>
          <button
            onClick={signOut}
            disabled={busy}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-100 disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </nav>
  );
}
