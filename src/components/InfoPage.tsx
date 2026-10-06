import type { ReactNode } from "react";
import Link from "next/link";
import { site } from "@/config/site";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import Icon from "./Icon";

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  /** Shown under the title, e.g. "Last updated 5 October 2026". */
  updated?: string;
  appHref?: string | null;
  signedIn?: boolean;
  /** Display name, for the header's signed-in avatar. */
  userName?: string | null;
  /** The account's picture, or null/omitted for the initial letter. */
  userAvatar?: string | null;
  children: ReactNode;
}

/**
 * The shell for the pages outside the app: about, contact, pricing, the legal
 * pages. Same header, footer and type scale everywhere, so a visitor never
 * hits a page that looks like a different website.
 */
export default function InfoPage({ eyebrow, title, intro, updated, appHref = null, signedIn = false, userName = null, userAvatar = null, children }: Props) {
  return (
    <div className="min-h-screen bg-[#f8f8f5]">
      <PublicHeader appHref={appHref} signedIn={signedIn} userName={userName} userAvatar={userAvatar} />
      <main className="mx-auto max-w-[900px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6d4aff]">{eyebrow}</p>
        <h1 className="mt-3 text-balance text-3xl font-black tracking-[-.05em] sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#6e6875]">{intro}</p>
        {updated && <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#9a939f]">{updated}</p>}
        <div className="mt-10 space-y-10">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}

/** One titled block of prose. */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[#e6e2e9] pt-7">
      <h2 className="text-lg font-black tracking-[-.03em] text-[#1b1822]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[#5d5763]">{children}</div>
    </section>
  );
}

/** A list of points, each on its own line with a check. */
export function InfoList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5">
          <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check" size={10} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A definition-style row used on the contact page and in the FAQ lists. */
export function InfoFaq({ items }: { items: Array<{ q: string; a: ReactNode }> }) {
  return (
    <div className="divide-y divide-[#eeeaf1] rounded-2xl border border-[#e8e4ec] bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-[#332e39] marker:content-none">
            {item.q}
            <Icon name="chevron-down" size={16} className="shrink-0 text-[#a19aa7] transition group-open:rotate-180" />
          </summary>
          <div className="mt-2.5 text-sm leading-7 text-[#5d5763]">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

/** The closing "still have questions" strip. */
export function InfoContactStrip() {
  return (
    <section className="rounded-[22px] bg-[#17151f] p-7 text-white">
      <h2 className="text-lg font-black tracking-[-.03em]">Still have a question?</h2>
      <p className="mt-2 max-w-xl text-sm leading-7 text-[#aaa4b1]">
        Email <a href={`mailto:${site.supportEmail}`} className="font-bold text-[#c6b9ff] underline">{site.supportEmail}</a> or send a message
        from the contact page — we answer within two working days, in English or Twi.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#7a5aff]">
          Contact us <Icon name="arrow-right" size={14} />
        </Link>
        <Link href="/verify" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.07] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/[.12]">
          <Icon name="shield" size={14} /> Verify a certificate
        </Link>
      </div>
    </section>
  );
}
