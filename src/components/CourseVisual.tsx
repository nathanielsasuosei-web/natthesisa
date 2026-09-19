import type { Course } from "@/lib/courses";
import Icon, { type IconName } from "./Icon";

const TONES: Record<Course["tone"], { wrap: string; tile: string; glow: string; line: string }> = {
  violet: { wrap: "bg-[#eee9ff]", tile: "bg-[#6d4aff] text-white", glow: "bg-violet-300", line: "bg-violet-300/70" },
  orange: { wrap: "bg-[#fff0e7]", tile: "bg-[#ff7448] text-white", glow: "bg-orange-300", line: "bg-orange-300/70" },
  cyan: { wrap: "bg-[#e2f8fb]", tile: "bg-[#087f8c] text-white", glow: "bg-cyan-300", line: "bg-cyan-300/70" },
  green: { wrap: "bg-[#e7f6ec]", tile: "bg-[#16865a] text-white", glow: "bg-emerald-300", line: "bg-emerald-300/70" },
  pink: { wrap: "bg-[#ffe9f2]", tile: "bg-[#d94376] text-white", glow: "bg-pink-300", line: "bg-pink-300/70" },
  blue: { wrap: "bg-[#e7f0ff]", tile: "bg-[#2d67d4] text-white", glow: "bg-blue-300", line: "bg-blue-300/70" },
};

const ICONS: Record<Course["icon"], IconName> = {
  browser: "browser",
  braces: "code",
  react: "spark",
  mobile: "mobile",
  nodes: "cpu",
  server: "server",
};

interface Props {
  course: Course;
  className?: string;
  compact?: boolean;
}

export default function CourseVisual({ course, className = "", compact = false }: Props) {
  const tone = TONES[course.tone];
  return (
    <div data-course-visual className={`relative overflow-hidden ${tone.wrap} ${className}`}>
      <div className={`absolute -right-8 -top-10 size-28 rounded-full opacity-45 blur-2xl ${tone.glow}`} />
      <div className={`absolute -bottom-10 -left-8 size-24 rounded-full opacity-35 blur-2xl ${tone.glow}`} />
      <div className="absolute inset-0 opacity-[.16] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative flex h-full items-center justify-center">
        <div className={`relative grid ${compact ? "size-14 rounded-2xl" : "size-20 rounded-[24px]"} place-items-center shadow-xl ${tone.tile}`}>
          <Icon name={ICONS[course.icon]} size={compact ? 26 : 36} />
          <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border-2 border-white bg-[#ffcf59] text-[10px] font-black text-[#4a3600]">+</span>
        </div>
        {!compact && (
          <>
            <span className={`absolute left-[12%] top-[24%] h-1.5 w-12 rounded-full ${tone.line}`} />
            <span className={`absolute bottom-[22%] right-[10%] h-1.5 w-16 rounded-full ${tone.line}`} />
            <span className="absolute bottom-[24%] left-[17%] font-mono text-xs font-bold opacity-25">01</span>
            <span className="absolute right-[18%] top-[22%] font-mono text-sm font-black opacity-25">{"{ }"}</span>
          </>
        )}
      </div>
    </div>
  );
}
