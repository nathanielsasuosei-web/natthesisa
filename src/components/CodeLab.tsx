"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";
import { LAB_TEMPLATES, buildPreview, type LabFile, type LabLanguage, type LabTemplate } from "@/lib/lab";

/**
 * The student code lab.
 *
 * A real code editor in the browser: a file tree on the left, tabs and the
 * actual VS Code editor (Monaco) in the middle, and a live preview with a
 * console — plus a plain JavaScript runner for practice snippets.
 *
 * Everything runs locally: the preview is an iframe built from the files, and
 * JavaScript is executed inside that iframe (never in this page), so student
 * code cannot reach the session or the network. Work is saved to localStorage
 * per account, and can be downloaded as a single HTML file.
 */

// The VS Code editor (Monaco) only runs in the browser, so it is loaded on
// demand and kept out of the initial page bundle.
const LabEditor = dynamic(() => import("./LabEditor"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[420px] w-full place-items-center bg-[#1b1822] text-xs font-bold text-[#8f889a] xl:h-[560px]">
      Opening the VS Code editor…
    </div>
  ),
});

const STORAGE_KEY = "codemasterghana.lab.v1";

const FILE_ICONS: Record<LabLanguage, IconName> = {
  html: "browser",
  css: "layers",
  js: "terminal",
};

export type { LabFile, LabLanguage, LabTemplate } from "@/lib/lab";

interface ConsoleLine {
  kind: "log" | "warn" | "error" | "info";
  text: string;
}

interface Props {
  /** Used to namespace saved work per account. */
  studentId: string;
  studentName: string;
}

export default function CodeLab({ studentId, studentName }: Props) {
  const storageKey = `${STORAGE_KEY}.${studentId}`;
  const [templateId, setTemplateId] = useState(LAB_TEMPLATES[0].id);
  const [files, setFiles] = useState<LabFile[]>(LAB_TEMPLATES[0].files);
  const [activeFile, setActiveFile] = useState(LAB_TEMPLATES[0].files[0].name);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [panel, setPanel] = useState<"console" | "preview">("preview");
  const [runId, setRunId] = useState(0);
  const [autoRun, setAutoRun] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const hydrated = useRef(false);

  // ---- restore the student's last session ----------------------------------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { templateId?: string; files?: LabFile[]; activeFile?: string };
      const known = LAB_TEMPLATES.find((template) => template.id === parsed.templateId);
      const restored = Array.isArray(parsed.files) && parsed.files.length ? parsed.files : known?.files;
      if (restored?.length) {
        setFiles(restored);
        setTemplateId(known?.id ?? LAB_TEMPLATES[0].id);
        setActiveFile(restored.some((file) => file.name === parsed.activeFile) ? parsed.activeFile! : restored[0].name);
      }
    } catch {
      // A corrupt entry should never stop the lab from opening.
    } finally {
      hydrated.current = true;
    }
  }, [storageKey]);

  // ---- save quietly, so a refresh never loses work -------------------------
  useEffect(() => {
    if (!hydrated.current) return;
    setSaved("saving");
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ templateId, files, activeFile }));
        setSaved("saved");
      } catch {
        setSaved("idle");
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [storageKey, templateId, files, activeFile]);

  const file = files.find((item) => item.name === activeFile) ?? files[0];

  // ---- preview document ----------------------------------------------------
  const document_ = useMemo(() => buildPreview(files), [files]);
  const runnable = files.length > 0;

  const run = useCallback(() => {
    setConsoleLines([]);
    setRunId((value) => value + 1);
  }, []);

  // Auto-run the prompt side only when the student asks for it, so a long
  // algorithm in the console-only template is not re-run on every keystroke.
  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setTimeout(() => setRunId((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [document_, autoRun]);

  // ---- console messages from inside the iframe -----------------------------
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { __lab?: boolean; kind?: ConsoleLine["kind"]; text?: string };
      if (!data?.__lab) return;
      setConsoleLines((lines) => [...lines.slice(-199), { kind: data.kind ?? "log", text: String(data.text ?? "") }]);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const updateFile = useCallback((name: string, content: string) => {
    setFiles((current) => current.map((item) => (item.name === name ? { ...item, content } : item)));
  }, []);

  const chooseTemplate = useCallback((template: LabTemplate) => {
    setTemplateId(template.id);
    setFiles(template.files);
    setActiveFile(template.files[0].name);
    setConsoleLines([]);
    setRunId((value) => value + 1);
  }, []);

  const resetFile = useCallback(() => {
    const template = LAB_TEMPLATES.find((item) => item.id === templateId);
    const original = template?.files.find((item) => item.name === activeFile);
    if (original) updateFile(activeFile, original.content);
  }, [activeFile, templateId, updateFile]);

  const downloadProject = useCallback(() => {
    const html = buildPreview(files);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "codemasterghana-project.html";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }, [files]);

  const copyCode = useCallback(async () => {
    if (!file) return;
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [file]);

  const lines = file ? file.content.split("\n").length : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">Student tools</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">Code lab</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            Write HTML, CSS and JavaScript and see it run instantly — no install, nothing to set up. Your work is
            saved to this browser as {studentName.split(" ")[0]}, and you can download it to keep.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${saved === "saved" ? "bg-emerald-50 text-emerald-700" : "bg-[#f2f0f4] text-[#6d6673]"}`}>
            {saved === "saved" ? "Saved" : saved === "saving" ? "Saving…" : "Not saved yet"}
          </span>
          <button type="button" onClick={run} disabled={!runnable} className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#7a5aff] disabled:opacity-50">
            <Icon name="play" size={14} /> Run
          </button>
          <button type="button" onClick={downloadProject} className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-4 py-2.5 text-xs font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]">
            <Icon name="download" size={14} /> Download project
          </button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---- explorer ---- */}
        <aside className="rounded-[20px] border border-[#e8e4ec] bg-white p-4">
          <h2 className="text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Templates</h2>
          <div className="mt-3 space-y-2">
            {LAB_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => chooseTemplate(template)}
                className={`w-full rounded-xl border p-3 text-left transition ${template.id === templateId ? "border-[#6d4aff] bg-[#f6f3ff]" : "border-[#ece8f0] hover:bg-[#faf9fc]"}`}
              >
                <p className="text-xs font-extrabold text-[#332e39]">{template.name}</p>
                <p className="mt-1 text-[10px] leading-4 text-[#7d7683]">{template.description}</p>
              </button>
            ))}
          </div>

          <h2 className="mt-5 text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Files</h2>
          <ul className="mt-2 space-y-1">
            {files.map((item) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => setActiveFile(item.name)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold transition ${item.name === activeFile ? "bg-[#1b1822] text-white" : "text-[#5e5864] hover:bg-[#f5f3f7]"}`}
                >
                  <Icon name={FILE_ICONS[item.language]} size={13} />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>

          <h2 className="mt-5 text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Shortcuts</h2>
          <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-[#7d7683]">
            <li><kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">Ctrl</kbd> + <kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">Enter</kbd> runs the project</li>
            <li><kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">Tab</kbd> indents the selection</li>
            <li><kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">F1</kbd> opens the VS Code command palette</li>
            <li>Console output appears in the Console tab</li>
          </ul>
        </aside>

        {/* ---- editor ---- */}
        <section className="overflow-hidden rounded-[20px] border border-[#e8e4ec] bg-[#1b1822]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <div className="flex min-w-0 items-center gap-1">
              {files.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveFile(item.name)}
                  className={`truncate rounded-t-lg px-3 py-1.5 text-[11px] font-bold transition ${item.name === activeFile ? "bg-white/10 text-white" : "text-[#8f889a] hover:text-white"}`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="hidden rounded-md bg-white/[.05] px-2 py-1 font-mono text-[10px] text-[#9d96a8] sm:inline">
                {file ? `${lines} lines · ${file.language.toUpperCase()}` : ""}
              </span>
              <span className="hidden items-center gap-1 rounded-md bg-[#6d4aff]/15 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#b7a7ff] md:inline-flex">
                <Icon name="code" size={11} /> VS Code
              </span>
              <button type="button" onClick={copyCode} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white">
                {copied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={resetFile} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white">
                Reset file
              </button>
            </div>
          </div>

          {file ? (
            <div className="h-[420px] xl:h-[560px]">
              <LabEditor
                fileName={file.name}
                language={file.language}
                value={file.content}
                onChange={(content) => updateFile(file.name, content)}
                onRun={run}
              />
            </div>
          ) : (
            <p className="p-5 text-xs text-[#aaa4b1]">Choose a file to edit.</p>
          )}
        </section>

        {/* ---- preview and console ---- */}
        <section className="overflow-hidden rounded-[20px] border border-[#e8e4ec] bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-[#eeeaf1] px-3 py-2">
            <div className="flex gap-1 rounded-lg bg-[#f4f2f6] p-0.5">
              {(["preview", "console"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPanel(value)}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-bold capitalize transition ${panel === value ? "bg-white text-[#332e39] shadow-sm" : "text-[#7d7683]"}`}
                >
                  {value}{value === "console" && consoleLines.length ? ` (${consoleLines.length})` : ""}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold text-[#7d7683]">
              <input type="checkbox" checked={autoRun} onChange={(event) => setAutoRun(event.target.checked)} className="size-3.5 accent-[#6d4aff]" />
              Auto-run
            </label>
          </div>

          <div className={panel === "preview" ? "block" : "hidden"}>
            <iframe
              key={runId}
              ref={frameRef}
              title="Project preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={document_}
              className="h-[420px] w-full border-0 bg-white xl:h-[560px]"
            />
          </div>

          <div className={panel === "console" ? "block" : "hidden"}>
            <div className="h-[420px] overflow-auto bg-[#1b1822] p-3 font-mono text-[11px] leading-5 xl:h-[560px]">
              {consoleLines.length === 0 && <p className="text-[#8f889a]">Nothing logged yet. Press Run — anything you <span className="text-[#c6b9ff]">console.log()</span> shows up here.</p>}
              {consoleLines.map((line, index) => (
                <p key={index} className={line.kind === "error" ? "text-[#ff9aa8]" : line.kind === "warn" ? "text-[#ffd479]" : "text-[#d7d2e0]"}>
                  <span className="mr-2 select-none text-[#6f6880]">{String(index + 1).padStart(2, "0")}</span>
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

