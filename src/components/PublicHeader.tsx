"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import Icon from "./Icon";

interface Props {
  /** Where "Open dashboard" points, when someone is signed in. */
  appHref?: string | null;
  signedIn?: boolean;
}

const LINKS = [
  { href: "/courses", label: "Courses", match: "/courses" },
  { href: "/#programs", label: "Programs", match: "/" },
  { href: "/pricing", label: "Pricing", match: "/pricing" },
  { href: "/about", label: "About", match: "/about" },
  { href: "/contact", label: "Contact", match: "/contact" },
];

/**
 * The public navigation.
 *
 * One component for every page outside the dashboard, so the menu, the mobile
 * panel and the account buttons cannot drift apart between pages. The mobile
 * panel is a real disclosure (button + expanded state), not a hidden div, so it
 * works with a keyboard and a screen reader.
 */
export default function PublicHeader({ appHref = null, signedIn = false }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href.startsWith("/#") ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-black/[.06] bg-[#f8f8f5]/90 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 text-[13px] font-semibold text-[#615b69] md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`transition hover:text-[#5c3be4] ${isActive(link.href) ? "text-[#5c3be4]" : ""}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {signedIn && appHref ? (
            <Link href={appHref} className="inline-flex items-center gap-2 rounded-xl bg-[#17151f] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#2a2632]">
              Open dashboard <Icon name="arrow-right" size={15} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#544e5d] transition hover:bg-white sm:block">
                Sign in
              </Link>
              <Link href="/login?mode=signup" className="rounded-xl bg-[#6d4aff] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(109,74,255,.23)] transition hover:-translate-y-0.5 hover:bg-[#5e3ce8]">
                Start learning
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="public-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-xl border border-[#ddd9e2] bg-white text-[#4a4450] transition hover:bg-[#f7f5f9] md:hidden"
          >
            <Icon name={open ? "close" : "menu"} size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div id="public-menu" className="border-t border-black/[.06] bg-white px-5 pb-5 pt-3 md:hidden">
          <nav className="grid gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold transition ${isActive(link.href) ? "bg-[#f3efff] text-[#5c3be4]" : "text-[#4a4450] hover:bg-[#f7f5f9]"}`}
              >
                {link.label}
                <Icon name="chevron-right" size={15} className="text-[#bbb5c0]" />
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid gap-2 border-t border-[#eeeaf1] pt-3">
            <Link href="/verify" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-bold text-[#4a4450] transition hover:bg-[#f7f5f9]">
              Verify a certificate <Icon name="shield" size={15} className="text-[#6d4aff]" />
            </Link>
            {signedIn && appHref ? (
              <Link href={appHref} onClick={() => setOpen(false)} className="rounded-xl bg-[#17151f] px-4 py-3 text-center text-sm font-bold text-white">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-[#ddd9e2] px-4 py-3 text-center text-sm font-bold text-[#4a4450]">
                  Sign in
                </Link>
                <Link href="/login?mode=signup" onClick={() => setOpen(false)} className="rounded-xl bg-[#6d4aff] px-4 py-3 text-center text-sm font-bold text-white">
                  Start learning
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
