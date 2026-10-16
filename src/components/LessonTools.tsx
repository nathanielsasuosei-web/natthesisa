"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import Icon from "./Icon";
import LessonProse from "./LessonProse";
import { planLessonTools, type LessonToolId } from "@/lib/lesson-tools";
import type { CodeSample, ToolProps } from "./lesson-tools/shared";
import { JsConsole, PythonLab, SqlLab, WebPlayground } from "./lesson-tools/CodeLabs";
import { ApiLab, JsonTool, RegexLab, UrlInspector } from "./lesson-tools/WebLabs";
import {
  BinaryLab,
  CronLab,
  DataLab,
  DesignLab,
  GitLab,
  NetworkLab,
  NotesLab,
  PromptLab,
  SecurityLab,
} from "./lesson-tools/StudyLabs";

const TOOL_VIEWS: Record<LessonToolId, ComponentType<ToolProps>> = {
  "web-playground": WebPlayground,
  "js-console": JsConsole,
  "python-lab": PythonLab,
  "sql-lab": SqlLab,
  "api-lab": ApiLab,
  "url-inspector": UrlInspector,
  "json-tool": JsonTool,
  "regex-lab": RegexLab,
  "design-lab": DesignLab,
  "data-lab": DataLab,
  "binary-lab": BinaryLab,
  "network-lab": NetworkLab,
  "security-lab": SecurityLab,
  "git-lab": GitLab,
  "cron-lab": CronLab,
  "prompt-lab": PromptLab,
  "notes-lab": NotesLab,
};

interface Props {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  summary?: string;
  headings: string[];
  challenge: string;
  samples: CodeSample[];
}

export default function LessonTools({ courseId, lessonId, lessonTitle, summary, headings, challenge, samples }: Props) {
  const tools = useMemo(
    () =>
      planLessonTools({
        courseId,
        lessonId,
        lessonTitle,
        summary,
        headings,
        sampleLanguages: samples.map((sample) => sample.language),
      }),
    [courseId, lessonId, lessonTitle, summary, headings, samples],
  );
  const [activeId, setActiveId] = useState<LessonToolId>(tools[0]?.id ?? "notes-lab");
  const active = tools.find((tool) => tool.id === activeId) ?? tools[0];
  const ActiveView = active ? TOOL_VIEWS[active.id] : null;
  const toolProps: ToolProps = { courseId, lessonId, lessonTitle, challenge, samples };

  if (!active || !ActiveView) return null;

  return (
    <section id="lesson-tools" className="mt-11 scroll-mt-24 border-t border-[#dfdbe3] pt-8">
      <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.15em] text-[#6d4aff]">
        <Icon name="terminal" size={12} /> Practical tools
      </p>
      <h2 className="mt-2 text-xl font-black tracking-[-.03em] text-[#1d1922]">Do the lesson, not just read it</h2>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-[#8b8494]">
        A workbench picked for this lesson — {tools.length} tool{tools.length === 1 ? "" : "s"}. Everything runs in your
        browser; nothing you type here leaves this page.
      </p>

      {/* The mission: the lesson's challenge, restated as the job for the tools. */}
      <div className="mt-5 rounded-[18px] border border-[#d8ccff] bg-[#f7f4ff] p-5">
        <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.15em] text-[#5e3de0]">
          <Icon name="target" size={12} /> Your mission
        </p>
        <LessonProse text={challenge} label={lessonTitle} className="[&_p]:my-2 [&_p]:text-[13.5px] [&_p]:font-semibold [&_p]:leading-6 [&_p]:text-[#4a4260]" />
      </div>

      {/* Tool tabs */}
      <div className="dashboard-scroll -mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist" aria-label="Practical tools for this lesson">
        <div className="flex min-w-max gap-2 sm:grid sm:min-w-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tools.map((tool) => {
            const selected = tool.id === active.id;
            return (
              <button
                key={tool.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(tool.id)}
                className={`flex w-44 items-start gap-2.5 rounded-2xl border p-3 text-left transition sm:w-auto ${
                  selected
                    ? "border-[#6d4aff] bg-[#f4f1ff] shadow-[0_10px_25px_rgba(109,74,255,.15)]"
                    : "border-[#e4e0e9] bg-white hover:border-violet-300 hover:bg-[#faf9ff]"
                }`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${selected ? "bg-[#6d4aff] text-white" : "bg-[#f0edf3] text-[#6b6478]"}`}>
                  <Icon name={tool.icon} size={16} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[11.5px] font-extrabold leading-4 ${selected ? "text-[#37259b]" : "text-[#2c2733]"}`}>
                    {tool.label}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[10px] font-semibold leading-4 text-[#8b8494]">{tool.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active tool */}
      <div className="mt-4 rounded-[20px] border border-[#e4e0e9] bg-[#fbfafc] p-4 sm:p-6" role="tabpanel">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#1b1822] text-white">
            <Icon name={active.icon} size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-[#1d1922]">{active.label}</p>
            <p className="text-[11px] font-semibold text-[#8b8494]">{active.why}</p>
          </div>
        </div>
        <ActiveView key={active.id} {...toolProps} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[#e4e0e9] bg-white px-4 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#8b8494]">
          <Icon name="check" size={13} className="text-emerald-600" /> Work saves in this browser, per lesson
        </p>
        <span className="ml-auto flex flex-wrap gap-3">
          <Link href="/studio" className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5d3be2] hover:underline">
            Open the full Studio <Icon name="arrow-right" size={12} />
          </Link>
          <Link href="/dashboard/code" className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5d3be2] hover:underline">
            My code lab <Icon name="arrow-right" size={12} />
          </Link>
        </span>
      </div>
    </section>
  );
}
