import Link from "next/link";
import { brandWordmark } from "@/config/branding";
import { site } from "@/config/site";

interface Props {
  href?: string;
  inverse?: boolean;
  compact?: boolean;
  /** Shows the "Learn. Build. Become." line under the name. */
  showTagline?: boolean;
  className?: string;
}

/**
 * The brand lockup: the tile mark, the name and (optionally) the tagline.
 *
 * The mark keeps the "</>" glyph because it stays legible at 36px, where a
 * square crop of the artwork would not — the artwork itself is used, at full
 * size, in the places that can show it (`brandAssets` in `@/config/branding`).
 */
export default function Logo({ href = "/", inverse = false, compact = false, showTagline = false, className = "" }: Props) {
  const { first, second } = brandWordmark.split;
  return (
    <Link href={href} className={`group inline-flex items-center gap-2.5 ${className}`} aria-label={`${site.name} home`}>
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[#6d4aff] text-white shadow-[0_6px_18px_rgba(109,74,255,.28)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        <span className="font-mono text-[14px] font-black tracking-[-.18em] -translate-x-[1px]">{brandWordmark.glyph}</span>
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ffcf59]" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className={`block text-[17px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[18px] ${inverse ? "text-white" : "text-[#17151f]"}`}>
            <span className="hidden min-[380px]:inline">{first}</span>
            <span className="hidden min-[380px]:inline" style={{ color: inverse ? "#b9a9ff" : brandWordmark.accent }}>{second}</span>
            <span className="min-[380px]:hidden">{first.slice(0, 4)}</span>
          </span>
          {showTagline && (
            <span className={`hidden text-[10px] font-bold uppercase tracking-[.14em] min-[420px]:block ${inverse ? "text-[#8f8998]" : "text-[#8a8390]"}`}>
              {brandWordmark.tagline}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
