import type { LessonFile } from "@/lib/courses";
import { fmtBytes } from "@/lib/format";
import TrimmedVideo from "./TrimmedVideo";
import Icon from "./Icon";

const KIND_LABEL: Record<LessonFile["kind"], string> = {
  video: "Lesson video",
  pdf: "Reading (PDF)",
  slides: "Slide deck",
  image: "Reference image",
  other: "Download",
};

const KIND_ICON: Record<LessonFile["kind"], "video" | "file" | "courses" | "book" | "download"> = {
  video: "video",
  pdf: "file",
  slides: "courses",
  image: "book",
  other: "download",
};

/** Materials the site owner attached when publishing a lesson. */
export default function LessonMaterials({ files }: { files: LessonFile[] }) {
  if (!files.length) return null;
  return (
    <section className="mt-10 border-t border-[#e6e2e9] pt-8">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">Lesson materials</p>
      <h2 className="mt-2 text-xl font-black tracking-[-.03em]">Uploaded by your instructor</h2>
      <p className="mt-2 text-xs leading-5 text-[#817a87]">Watch, read or download everything attached to this lesson.</p>

      <div className="mt-5 space-y-4">
        {files.map((file) => (
          <div key={file.id} className="overflow-hidden rounded-[18px] border border-[#e6e2e9] bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#eeebf0] px-4 py-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f0ecff] text-[#5e3de0]"><Icon name={KIND_ICON[file.kind]} size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-[#332e39]">{file.name}</p>
                <p className="mt-0.5 text-[9px] text-[#918a97]">{KIND_LABEL[file.kind]} · {fmtBytes(file.size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={file.href} target="_blank" rel="noreferrer" className="rounded-lg border border-[#ddd9e2] px-3 py-2 text-[10px] font-bold text-[#5e5864] transition hover:border-violet-300">Open</a>
                <a href={`${file.href}?download=1`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b1822] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#2b2733]"><Icon name="download" size={12} /> Download</a>
              </div>
            </div>
            {file.kind === "video" && <TrimmedVideo file={file} />}
            {file.kind === "image" && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={file.href} alt={file.name} className="max-h-[520px] w-full bg-[#0f0d13] object-contain" />
            )}
            {file.kind === "pdf" && (
              <iframe src={file.href} title={file.name} className="h-[520px] w-full border-0 bg-[#f3f1f6]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
