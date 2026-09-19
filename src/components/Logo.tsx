import Link from "next/link";
import { site } from "@/config/site";

interface Props {
  href?: string;
  inverse?: boolean;
  compact?: boolean;
  className?: string;
}

export default function Logo({ href = "/", inverse = false, compact = false, className = "" }: Props) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`} aria-label={`${site.name} home`}>
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[#6d4aff] text-white shadow-[0_6px_18px_rgba(109,74,255,.28)]">
        <span className="font-mono text-[14px] font-black tracking-[-.18em] -translate-x-[1px]">{"</>"}</span>
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#ffcf59]" />
      </span>
      {!compact && (
        <span className={`hidden text-[17px] font-extrabold tracking-[-0.045em] min-[420px]:inline sm:text-[18px] ${inverse ? "text-white" : "text-[#17151f]"}`}>
          {site.name}
        </span>
      )}
    </Link>
  );
}
