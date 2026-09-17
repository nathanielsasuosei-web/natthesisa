"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/app/discover",
    label: "Discover",
    path: "M12 21C7 16.5 3 13 3 8.8 3 6 5.2 4 7.7 4c1.6 0 3.2.8 4.3 2.2C13.1 4.8 14.7 4 16.3 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 12.2z",
  },
  {
    href: "/app/matches",
    label: "Matches",
    path: "M4 7h11l5 5-5 5H4zM4 12h7",
  },
  {
    href: "/app/profile",
    label: "Profile",
    path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5",
  },
  {
    href: "/app/settings",
    label: "Settings",
    path: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5",
  },
];

export default function TabBar({ newMatches = 0 }: { newMatches?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="glass safe-bottom relative z-20 flex shrink-0 items-stretch gap-1 border-t border-white/10 px-2 pt-1.5"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`press relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${
              active ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <span className="relative">
              <svg
                viewBox="0 0 24 24"
                fill={active && tab.href === "/app/discover" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-[22px]"
              >
                <path d={tab.path} />
              </svg>
              {tab.href === "/app/matches" && newMatches > 0 && (
                <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow">
                  {newMatches}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
            {active && (
              <span
                aria-hidden
                className="absolute -top-1.5 h-1 w-8 rounded-full bg-gradient-to-r from-rose-400 to-fuchsia-400"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
