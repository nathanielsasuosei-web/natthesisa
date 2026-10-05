import type { Course } from "@/lib/courses";
import { courseBrief } from "@/lib/course-info";
import Icon from "./Icon";

interface Props {
  course: Course;
  /** Drop the surrounding card borders — used inside the dashboard page. */
  bare?: boolean;
  className?: string;
}

/**
 * The long description of a course: what it teaches, who it fits, what you need
 * before starting, the tools involved and where it leads. Rendered on the
 * public course page and again inside the learner's dashboard, from one source
 * (`lib/course-info.ts`), so the two can never drift.
 */
export default function CourseBrief({ course, bare = false, className = "" }: Props) {
  const brief = courseBrief(course);
  const card = bare ? "" : "overflow-hidden rounded-[22px] border border-[#e6e2e9] bg-white";

  const blocks: Array<{ title: string; icon: "users" | "check" | "terminal" | "arrow-right"; items: string[] }> = [
    { title: "Who this is for", icon: "users", items: brief.audience },
    { title: "Before you start", icon: "check", items: brief.prerequisites },
    { title: "Where it leads", icon: "arrow-right", items: brief.after },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <section className={bare ? "" : "rounded-[22px] border border-[#e6e2e9] bg-white p-5 sm:p-7"}>
        <h2 className="text-base font-black tracking-[-.025em]">About this course</h2>
        <div className="mt-3 space-y-3.5">
          {brief.overview.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-sm leading-7 text-[#5d5763]">{paragraph}</p>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {blocks.map((block) => (
          <section key={block.title} className={card || "rounded-[22px] border border-[#e6e2e9] bg-white"}>
            <div className="flex items-center gap-2.5 border-b border-[#f0edf3] px-5 py-3.5">
              <span className="grid size-7 place-items-center rounded-lg bg-[#f0ecff] text-[#6d4aff]"><Icon name={block.icon} size={14} /></span>
              <h3 className="text-xs font-black uppercase tracking-[.1em] text-[#4a4450]">{block.title}</h3>
            </div>
            <ul className="space-y-3 p-5">
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-[#5d5763]">
                  <Icon name="check" size={13} className="mt-1.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-[22px] border border-[#e6e2e9] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[#f0edf3] px-5 py-3.5">
            <span className="grid size-7 place-items-center rounded-lg bg-[#f0ecff] text-[#6d4aff]"><Icon name="terminal" size={14} /></span>
            <h3 className="text-xs font-black uppercase tracking-[.1em] text-[#4a4450]">Tools you will use</h3>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {brief.tools.map((tool) => (
              <span key={tool} className="rounded-full border border-[#e3dff0] bg-[#faf9fd] px-3 py-1.5 text-[11px] font-bold text-[#5b5566]">{tool}</span>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#e6e2e9] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[#f0edf3] px-5 py-3.5">
            <span className="grid size-7 place-items-center rounded-lg bg-[#f0ecff] text-[#6d4aff]"><Icon name="trophy" size={14} /></span>
            <h3 className="text-xs font-black uppercase tracking-[.1em] text-[#4a4450]">What you will build</h3>
          </div>
          <ol className="space-y-3 p-5">
            {brief.build.map((item, index) => (
              <li key={item} className="flex items-start gap-3 text-[13px] leading-6 text-[#5d5763]">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#f0ecff] text-[10px] font-black text-[#5e3de0]">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
