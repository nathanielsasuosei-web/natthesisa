"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/dashboard/boards", label: "Boards", icon: "M4 5h16v14H4zM4 10h16M10 10v9" },
  { href: "/dashboard/plans", label: "Plans", icon: "M12 3v18m5-13H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H6" },
  { href: "/dashboard/billing", label: "Billing", icon: "M3 7h18v10H3zM3 11h18M7 15h4" },
  { href: "/dashboard/audit", label: "Audit log", icon: "M6 4h12v16l-6-3-6 3zM9 8h6M9 12h4", gated: true },
];

interface Props {
  userName: string;
  planName: string;
  auditEnabled: boolean;
  compact?: boolean;
}

export default function SidebarNav({ userName, planName, auditEnabled, compact }: Props) {
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
        ? "bg-indigo-600 text-white"
        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
    ].join(" ");

  return (
    <nav className={compact ? "relative flex gap-2 overflow-x-auto" : "relative flex h-full flex-col"}>
      <div className={compact ? "" : "mb-8 flex items-center gap-2"}>
        <Link href="/" className={`flex items-center gap-2 font-semibold tracking-tight text-white ${compact ? "shrink-0" : ""}`}>
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-sm font-bold">N</span>
          Natthesisa
        </Link>
      </div>

      <div className={compact ? "flex gap-2" : "space-y-1"}>
        {NAV.map((item) => {
          const locked = item.gated && !auditEnabled;
          return (
            <Link key={item.href} href={item.href} className={linkCls(isActive(item.href))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
                <path d={item.icon} />
              </svg>
              <span className={compact ? "text-xs" : ""}>{item.label}</span>
              {locked && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="ml-auto size-3.5 opacity-70">
                  <path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-auto border-t border-slate-800 pt-4">
          <div className="mb-3 flex items-center gap-3 px-1">
            <span className="grid size-9 place-items-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">{userName}</p>
              <p className="text-xs capitalize text-slate-500">{planName} plan</p>
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
