"use client";

import Icon from "./Icon";

function openAssistant(prompt: string) {
  window.dispatchEvent(new CustomEvent("natthesisa:open", { detail: { prompt } }));
}

export default function LessonNatthesisa({ lessonTitle }: { lessonTitle: string }) {
  return (
    <section aria-label="Study this lesson with Natthesisa" className="mt-7 border-y border-[#e4dffa] bg-[#f8f6ff] px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#6d4aff] text-white shadow-[0_6px_14px_rgba(109,74,255,.2)]">
          <Icon name="spark" size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black text-[#302942]">Study with Natthesisa</p>
          <p className="mt-0.5 text-[10px] leading-4 text-[#777080]">Ask about “{lessonTitle}” — she has this lesson's notes.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => openAssistant("Explain the key idea of this lesson in simple terms.")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6d4aff] px-3 py-2 text-[10px] font-extrabold text-white transition hover:bg-[#5d3ce0]"
          >
            <Icon name="book" size={12} /> Explain
          </button>
          <button
            type="button"
            onClick={() => openAssistant("Give me a gentle hint for this lesson's challenge.")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd4f7] bg-white px-3 py-2 text-[10px] font-extrabold text-[#5d3be2] transition hover:bg-[#f0ecff]"
          >
            <Icon name="target" size={12} /> Hint
          </button>
          <button
            type="button"
            onClick={() => openAssistant("Quiz me on this lesson.")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dcd4f7] bg-white px-3 py-2 text-[10px] font-extrabold text-[#5d3be2] transition hover:bg-[#f0ecff]"
          >
            <Icon name="spark" size={12} /> Quiz
          </button>
        </div>
      </div>
    </section>
  );
}
