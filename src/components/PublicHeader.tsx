"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import AvatarImage from "./AvatarImage";
import Logo from "./Logo";
import Icon, { type IconName } from "./Icon";

interface Props {
  /** Where the dashboard button points, when someone is signed in. */
  appHref?: string | null;
  signedIn?: boolean;
  /** Display name, for the signed-in avatar. */
  userName?: string | null;
  /** The account's picture, or null/omitted for the initial letter. */
  userAvatar?: string | null;
}

/**
 * The programs, for the Courses menu. Hardcoded on purpose: the header is a
 * client component on every public page, and importing the whole catalog here
 * would ship every lesson to the browser. The source of truth stays
 * `PROGRAMS` in `src/lib/programs.ts` — mirror it if a program is renamed.
 */
const PROGRAM_LINKS: Array<{ id: string; name: string; tagline: string; icon: IconName }> = [
  { id: "computer-science", name: "Computer Science", tagline: "Understand the machine, not just the syntax", icon: "cpu" },
  { id: "software-engineering", name: "Software Engineering", tagline: "Build with other people, ship without fear", icon: "briefcase" },
  { id: "vibe-coding", name: "Vibe Coding", tagline: "Describe it, build it, understand it", icon: "spark" },
];

/** Popular courses, for the Courses menu. Slugs must match the public `/courses/<slug>` pages. */
const POPULAR_COURSES: Array<{ slug: string; title: string; level: string }> = [
  { slug: "web-foundations", title: "Web Foundations", level: "Beginner" },
  { slug: "javascript-zero-to-builder", title: "JavaScript", level: "Beginner" },
  { slug: "vibe-coding-ship-with-ai", title: "Vibe Coding", level: "Beginner" },
  { slug: "data-structures-algorithms", title: "DSA", level: "Intermediate" },
];

const NAV_LINKS = [
  { href: "/#programs", label: "Programs" },
  { href: "/natthesisa", label: "Natthesisa AI" },
  { href: "/pricing", label: "Pricing" },
  { href: "/studio", label: "Studio" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const ANNOUNCEMENTS = [
  {
    badge: "New",
    text: "Vibe Coding is live — build real apps with AI from your first hour",
    href: "/courses#program-vibe-coding",
  },
  {
    badge: "New",
    text: "Sign in to open the lessons — buy a program once to unlock every course in it",
    href: "/pricing",
  },
];

const ANNOUNCE_KEY = "cmg-announce-dismissed";

/** The slim bar above the nav: one rotating message, dismissible, remembered. */
function AnnouncementBar() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(ANNOUNCE_KEY) === "1") setDismissed(true);
    } catch {
      // Private browsing: the bar simply shows every visit.
    }
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % ANNOUNCEMENTS.length), 6000);
    return () => window.clearInterval(timer);
  }, []);

  // Gated on mount so the server render and the first client render agree.
  if (!mounted || dismissed) return null;
  const item = ANNOUNCEMENTS[index];

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(ANNOUNCE_KEY, "1");
    } catch {
      // Ignore — the bar reappears next visit.
    }
  }

  return (
    <div className="bg-[#17151f] text-white print:hidden">
      <div className="mx-auto flex h-9 max-w-[1180px] items-center justify-center gap-3 px-5 text-[11px] sm:px-8">
        <span className="relative hidden size-1.5 shrink-0 sm:flex" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        <Link
          key={index}
          href={item.href}
          className="animate-ticker-up flex min-w-0 items-center gap-2.5 font-semibold text-white/90 transition hover:text-white"
        >
          <span className="shrink-0 rounded-full bg-[#ffcf59] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#493600]">
            {item.badge}
          </span>
          <span className="truncate">{item.text}</span>
          <Icon name="arrow-right" size={13} className="shrink-0 text-[#b9a9ff]" />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="ml-1 grid size-6 shrink-0 place-items-center rounded-md text-white/50 transition hover:rotate-90 hover:bg-white/10 hover:text-white"
        >
          <Icon name="close" size={13} />
        </button>
      </div>
    </div>
  );
}

/**
 * The public navigation.
 *
 * One component for every page outside the app, so the announcement bar, the
 * menu, the Courses mega-panel, the mobile panel and the account buttons
 * cannot drift apart between pages. The announcement scrolls away; the bar
 * itself sticks, condenses and gains a shadow once the page moves, and
 * highlights the current section. Both dropdowns are real disclosures (button
 * + expanded state), not hidden divs, so they work with a keyboard and a
 * screen reader. All motion respects `prefers-reduced-motion` (see
 * `globals.css`) and the staggered entrances re-run every time a panel opens,
 * because the panel remounts.
 */
export default function PublicHeader({ appHref = null, signedIn = false, userName = null, userAvatar = null }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const isOwner = appHref === "/owner";
  const initial = (userName?.trim()?.[0] ?? (signedIn ? "•" : "")).toUpperCase();

  const isActive = (href: string) =>
    href.startsWith("/#") ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const coursesActive = pathname === "/courses" || pathname.startsWith("/courses/");

  // A new page means a closed menu — every time, on desktop and mobile.
  useEffect(() => {
    setCoursesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCoursesOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function scheduleClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setCoursesOpen(false), 140);
  }

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  return (
    <>
      <AnnouncementBar />

      <header
        className={`animate-nav-drop sticky top-0 z-40 border-b bg-[#f8f8f5]/90 backdrop-blur-xl transition-shadow print:hidden ${
          scrolled ? "border-black/[.08] shadow-[0_10px_30px_rgba(31,24,45,.10)]" : "border-black/[.06]"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 transition-[height] duration-300 sm:px-8 ${
            scrolled ? "h-[60px]" : "h-[72px]"
          }`}
        >
          <Logo showTagline />

          <nav aria-label="Primary" className="hidden items-center gap-1 text-[13px] font-semibold text-[#615b69] lg:flex">
            <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
              <button
                type="button"
                aria-expanded={coursesOpen}
                aria-controls="courses-panel"
                onClick={() => setCoursesOpen((value) => !value)}
                onMouseEnter={() => {
                  cancelClose();
                  setCoursesOpen(true);
                }}
                className={`nav-underline flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 transition hover:bg-white hover:text-[#5c3be4] ${
                  coursesOpen || coursesActive ? "nav-underline-active bg-white text-[#5c3be4]" : ""
                }`}
              >
                Courses
                <Icon name="chevron-down" size={14} className={`transition-transform duration-300 ${coursesOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-underline rounded-xl px-3.5 py-2.5 transition hover:-translate-y-px hover:bg-white hover:text-[#5c3be4] ${
                  isActive(link.href) ? "nav-underline-active text-[#5c3be4]" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/verify"
              className={`nav-underline hidden items-center gap-1.5 rounded-xl px-3.5 py-2.5 transition hover:-translate-y-px hover:bg-white hover:text-[#5c3be4] xl:inline-flex ${
                isActive("/verify") ? "nav-underline-active text-[#5c3be4]" : ""
              }`}
            >
              <Icon name="shield" size={14} className="text-[#6d4aff]" />
              Verify
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            {signedIn && appHref ? (
              <Link
                href={appHref}
                title={userName ? `Signed in as ${userName}` : "Open your dashboard"}
                className="group inline-flex items-center gap-2 rounded-xl bg-[#17151f] py-1.5 pl-1.5 pr-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#2a2632] hover:shadow-[0_10px_24px_rgba(23,21,31,.25)]"
              >
                <span
                  className="grid size-8 place-items-center overflow-hidden rounded-lg bg-[#6d4aff] text-[13px] font-black text-white transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                >
                  {userAvatar ? <AvatarImage name={userName ?? "Your account"} src={userAvatar} /> : initial || <Icon name="user" size={15} />}
                </span>
                <span className="hidden sm:inline">{isOwner ? "Teacher console" : "Dashboard"}</span>
                <span className="sm:hidden">{isOwner ? "Console" : "App"}</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#544e5d] transition hover:-translate-y-px hover:bg-white sm:block">
                  Sign in
                </Link>
                <Link href="/login?mode=signup" className="btn-shine rounded-xl bg-[#6d4aff] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(109,74,255,.23)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8] hover:shadow-[0_12px_30px_rgba(109,74,255,.35)]">
                  Start learning
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="public-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-xl border border-[#ddd9e2] bg-white text-[#4a4450] transition hover:bg-[#f7f5f9] active:scale-95 lg:hidden"
            >
              <span key={String(mobileOpen)} className="animate-icon-pop grid place-items-center">
                <Icon name={mobileOpen ? "close" : "menu"} size={18} />
              </span>
            </button>
          </div>
        </div>

        {/* ---- courses mega-panel (desktop) ---------------------------------- */}
        {coursesOpen && (
          <div
            id="courses-panel"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="animate-menu-in absolute inset-x-0 top-full hidden border-b border-black/[.06] bg-white/95 shadow-[0_30px_60px_rgba(31,24,45,.12)] backdrop-blur-xl lg:block"
          >
            <div className="mx-auto grid max-w-[1180px] grid-cols-[1.2fr_1fr_.9fr] gap-8 px-8 py-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#8a8390]">Browse by program</p>
                <ul className="mt-4 space-y-1">
                  {PROGRAM_LINKS.map((program, index) => (
                    <li key={program.id} className="animate-menu-item" style={{ animationDelay: `${index * 60}ms` }}>
                      <Link
                        href={`/courses#program-${program.id}`}
                        className="group flex items-center gap-3 rounded-2xl p-2.5 transition hover:translate-x-1 hover:bg-[#f7f5fa]"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0ecff] text-[#6d4aff] transition group-hover:scale-110 group-hover:bg-[#6d4aff] group-hover:text-white">
                          <Icon name={program.icon} size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-extrabold text-[#302b37] group-hover:text-[#5c3be4]">
                            {program.name}
                          </span>
                          <span className="block truncate text-[11px] text-[#918a97]">{program.tagline}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#8a8390]">Popular right now</p>
                <ul className="mt-4 space-y-1">
                  {POPULAR_COURSES.map((course, index) => (
                    <li key={course.slug} className="animate-menu-item" style={{ animationDelay: `${180 + index * 60}ms` }}>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-2xl p-2.5 transition hover:translate-x-1 hover:bg-[#f7f5fa]"
                      >
                        <span className="text-[13px] font-bold text-[#4a4450] group-hover:text-[#5c3be4]">
                          {course.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-[#f0edf3] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#817a87] transition group-hover:bg-[#6d4aff] group-hover:text-white">
                          {course.level}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/courses" className="animate-menu-item mt-3 inline-flex items-center gap-1.5 px-2.5 text-[12px] font-extrabold text-[#5c3be4] transition hover:gap-2.5" style={{ animationDelay: "420ms" }}>
                  View all courses <Icon name="arrow-right" size={14} />
                </Link>
              </div>

              <div className="animate-menu-item overflow-hidden rounded-[20px] bg-[#17151f] p-5 text-white" style={{ animationDelay: "240ms" }}>
                <span className="grid size-9 place-items-center rounded-xl bg-[#6d4aff] transition-transform duration-300 hover:scale-110 hover:rotate-6">
                  <Icon name="play" size={14} />
                </span>
                <p className="mt-4 text-sm font-black leading-6">Every lesson is open</p>
                <p className="mt-1.5 text-[11px] leading-5 text-white/60">
                  Read, listen and download without paying or creating an account.
                </p>
                <Link href="/courses" className="btn-shine mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-extrabold text-[#17151f] transition hover:-translate-y-0.5 hover:bg-[#ffcf59]">
                  Browse the courses <Icon name="arrow-right" size={14} />
                </Link>
              </div>
            </div>
            <div className="animate-menu-item border-t border-black/[.05] bg-[#faf9fb]" style={{ animationDelay: "480ms" }}>
              <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-8 py-3 text-[11px] text-[#817a87]">
                <p>
                  Free to study · A free account saves progress ·{" "}
                  <Link href="/courses" className="font-bold text-[#5c3be4] underline">Open the courses</Link>
                </p>
                <p className="flex items-center gap-1.5">
                  <Icon name="shield" size={13} className="text-emerald-600" />
                  Certificates employers can <Link href="/verify" className="font-bold text-[#5c3be4] underline">verify online</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---- mobile panel --------------------------------------------------- */}
        {mobileOpen && (
          <div id="public-menu" className="animate-menu-in border-t border-black/[.06] bg-white px-5 pb-6 pt-3 lg:hidden">
            <nav className="grid gap-1" aria-label="Mobile">
              <button
                type="button"
                onClick={() => setMobileCoursesOpen((value) => !value)}
                aria-expanded={mobileCoursesOpen}
                className={`animate-menu-item flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold transition active:scale-[.99] ${
                  coursesActive ? "bg-[#f3efff] text-[#5c3be4]" : "text-[#4a4450] hover:bg-[#f7f5f9]"
                }`}
              >
                Courses
                <Icon name="chevron-down" size={15} className={`text-[#bbb5c0] transition-transform duration-300 ${mobileCoursesOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileCoursesOpen && (
                <div className="grid gap-1 pb-2 pl-3">
                  {PROGRAM_LINKS.map((program, index) => (
                    <Link
                      key={program.id}
                      href={`/courses#program-${program.id}`}
                      onClick={() => setMobileOpen(false)}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="animate-menu-item flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-[#4a4450] transition hover:bg-[#f7f5f9]"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f0ecff] text-[#6d4aff]">
                        <Icon name={program.icon} size={15} />
                      </span>
                      {program.name}
                    </Link>
                  ))}
                  <Link
                    href="/courses"
                    onClick={() => setMobileOpen(false)}
                    style={{ animationDelay: "150ms" }}
                    className="animate-menu-item flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-extrabold text-[#5c3be4]"
                  >
                    View all courses <Icon name="arrow-right" size={13} />
                  </Link>
                </div>
              )}
              {NAV_LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ animationDelay: `${60 + index * 50}ms` }}
                  className={`animate-menu-item flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold transition active:scale-[.99] ${isActive(link.href) ? "bg-[#f3efff] text-[#5c3be4]" : "text-[#4a4450] hover:bg-[#f7f5f9]"}`}
                >
                  {link.label}
                  <Icon name="chevron-right" size={15} className="text-[#bbb5c0]" />
                </Link>
              ))}
              <Link href="/verify" onClick={() => setMobileOpen(false)} style={{ animationDelay: "260ms" }} className="animate-menu-item flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold text-[#4a4450] transition hover:bg-[#f7f5f9] active:scale-[.99]">
                Verify a certificate <Icon name="shield" size={15} className="text-[#6d4aff]" />
              </Link>
            </nav>
            <div className="animate-menu-item mt-3 grid gap-2 border-t border-[#eeeaf1] pt-4" style={{ animationDelay: "320ms" }}>
              {signedIn && appHref ? (
                <>
                  {userName && (
                    <p className="flex items-center gap-2.5 px-1 pb-1 text-[11px] text-[#918a97]">
                      <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#1b1822] text-[10px] font-black text-[#c3b6ff]">
                        <AvatarImage name={userName} src={userAvatar} />
                      </span>
                      Signed in as <strong className="text-[#4a4450]">{userName}</strong>
                    </p>
                  )}
                  <Link href={appHref} onClick={() => setMobileOpen(false)} className="rounded-xl bg-[#17151f] px-4 py-3 text-center text-sm font-bold text-white transition active:scale-[.99]">
                    {isOwner ? "Open teacher console" : "Open dashboard"}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-[#ddd9e2] px-4 py-3 text-center text-sm font-bold text-[#4a4450] transition active:scale-[.99]">
                    Sign in
                  </Link>
                  <Link href="/login?mode=signup" onClick={() => setMobileOpen(false)} className="btn-shine rounded-xl bg-[#6d4aff] px-4 py-3 text-center text-sm font-bold text-white transition active:scale-[.99]">
                    Start learning
                  </Link>
                </>
              )}
              <a href={`mailto:${site.supportEmail}`} className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-bold text-[#5e3de0]">
                <Icon name="mail" size={13} /> {site.supportEmail}
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
