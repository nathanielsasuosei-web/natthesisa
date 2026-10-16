"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "../Icon";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface CodeSample {
  language: string;
  label?: string;
  code: string;
}

export interface ToolProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  challenge: string;
  samples: CodeSample[];
}

export interface ConsoleLine {
  kind: "log" | "info" | "warn" | "error";
  text: string;
}

/* -------------------------------------------------------------------------- */
/* Persistent state (this browser only)                                        */
/* -------------------------------------------------------------------------- */

export function storageKey(courseId: string, lessonId: string, tool: string, field = "main"): string {
  return `natthesisa.tools.${courseId}.${lessonId}.${tool}.${field}`;
}

/** Text state that survives reloads. Saved work always wins over starters. */
export function usePersistentState(key: string, initial: string): [string, (value: string) => void] {
  const [value, setValue] = useState(initial);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(raw);
    } catch {
      // Private browsing — the tool still works, it just forgets.
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota or privacy mode — ignore, the tool still works.
    }
  }, [key, value]);
  return [value, setValue];
}

/* -------------------------------------------------------------------------- */
/* Sandboxed runners (student code never touches the page)                     */
/* -------------------------------------------------------------------------- */

const AGENT = `<script>(function(){var send=function(k,a){try{var t=Array.prototype.map.call(a,function(v){if(typeof v==="string")return v;try{return JSON.stringify(v)}catch(e){return String(v)}}).join(" ");parent.postMessage({__lessonTools:true,kind:k,text:t},"*")}catch(e){}};["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){send(k,arguments);if(o)try{o.apply(console,arguments)}catch(e){}}});window.addEventListener("error",function(e){send("error",[String(e.message||"Script error")+(e.lineno?" (line "+e.lineno+")":"")])});window.addEventListener("unhandledrejection",function(e){var r=e.reason;send("error",["Unhandled rejection: "+(r&&r.message?r.message:String(r))])})})();</script>`;

/** Keeps a student's `"</script>"` string from closing the inlined block. */
function escapeClosingTags(code: string): string {
  return code.replace(/<\/(script|style)/gi, "<\\/$1");
}

export function buildJsDocument(userJs: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">${AGENT}</head><body><script>\ntry{\n${escapeClosingTags(userJs)}\n}catch(e){console.error(e&&e.message?e.message:String(e))}\n</script></body></html>`;
}

export function buildWebDocument(userHtml: string): string {
  const source = userHtml.includes("<html") ? userHtml : `<!doctype html><html><head><meta charset="utf-8"></head><body>${userHtml}</body></html>`;
  if (/<\/head>/i.test(source)) return source.replace(/<\/head>/i, `${AGENT}\n</head>`);
  return `${AGENT}\n${source}`;
}

export function useSandboxRunner() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [document_, setDocument] = useState("");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { __lessonTools?: boolean; kind?: ConsoleLine["kind"]; text?: string };
      if (!data?.__lessonTools) return;
      setLines((current) => [...current.slice(-99), { kind: data.kind ?? "log", text: String(data.text ?? "") }]);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return {
    frameRef,
    lines,
    document: document_,
    nonce,
    run(documentHtml: string) {
      setLines([]);
      setDocument(documentHtml);
      setNonce((value) => value + 1);
    },
    clear() {
      setLines([]);
    },
  };
}

/* -------------------------------------------------------------------------- */
/* UI atoms                                                                    */
/* -------------------------------------------------------------------------- */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#6b6474]">{label}</span>
        {hint ? <span className="text-[10px] font-semibold text-[#a19aa7]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#ddd8e4] bg-white px-3 py-2.5 font-mono text-[12.5px] leading-6 text-[#2c2733] outline-none transition placeholder:text-[#b3acbb] focus:border-[#6d4aff] focus:ring-2 focus:ring-[#6d4aff]/20";

export const darkInputClass =
  "w-full rounded-xl border border-white/10 bg-[#211d29] px-3 py-2.5 font-mono text-[12.5px] leading-6 text-[#e8e2f0] outline-none transition placeholder:text-[#6f6979] focus:border-[#8b7fd0]";

export function CodeArea({
  value,
  onChange,
  rows = 10,
  label,
  language,
  placeholder,
  dark = true,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  label: string;
  language?: string;
  placeholder?: string;
  dark?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-[#1b1822]" : "border-[#ddd8e4] bg-white"}`}>
      <div className={`flex h-9 items-center px-4 ${dark ? "border-b border-white/[.07]" : "border-b border-[#eeeaf2]"}`}>
        <div className="code-dots" />
        <span className={`ml-auto font-mono text-[9px] uppercase tracking-[.12em] ${dark ? "text-[#6f6979]" : "text-[#a19aa7]"}`}>
          {label}{language ? ` · ${language}` : ""}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        className={`dashboard-scroll block w-full resize-y bg-transparent p-4 font-mono text-[12.5px] leading-6 outline-none ${
          dark ? "text-[#e8e2f0] placeholder:text-[#6f6979]" : "text-[#2c2733] placeholder:text-[#b3acbb]"
        }`}
      />
    </div>
  );
}

export function RunButton({
  onClick,
  children,
  disabled,
  icon = "play",
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  icon?: "play" | "spark" | "search" | "check" | "globe";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(109,74,255,.3)] transition hover:bg-[#5d3ce0] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon name={icon} size={13} /> {children}
    </button>
  );
}

export function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#ddd8e4] bg-white px-3 py-2.5 text-[11px] font-bold text-[#5d5763] transition hover:border-violet-300 hover:text-[#5032c2]"
    >
      {children}
    </button>
  );
}

export function Chip({ onClick, children, title }: { onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1 rounded-full border border-[#e0d9f2] bg-[#f6f3ff] px-2.5 py-1 font-mono text-[10.5px] font-bold text-[#5d3be2] transition hover:bg-[#ece5ff]"
    >
      {children}
    </button>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          },
          () => setCopied(false),
        );
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd8e4] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[#5d5763] transition hover:border-violet-300 hover:text-[#5032c2]"
    >
      <Icon name={copied ? "check" : "file"} size={12} /> {copied ? "Copied!" : label}
    </button>
  );
}

const LINE_STYLE: Record<ConsoleLine["kind"], string> = {
  log: "text-[#d9d2e1]",
  info: "text-[#9fd8ff]",
  warn: "text-[#ffd88a]",
  error: "text-[#ff9d9d]",
};

export function Output({
  lines,
  empty = "Press Run — output appears here.",
  title = "Output",
}: {
  lines: ConsoleLine[];
  empty?: string;
  title?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lines]);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1822]">
      <div className="flex h-9 items-center border-b border-white/[.07] px-4">
        <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#6f6979]">{title}</span>
        <span className="ml-auto font-mono text-[9px] text-[#6f6979]">{lines.length} line{lines.length === 1 ? "" : "s"}</span>
      </div>
      <div ref={scrollRef} className="dashboard-scroll max-h-56 min-h-[5.5rem] overflow-y-auto p-4 font-mono text-[12px] leading-6">
        {lines.length === 0 ? (
          <p className="text-[#6f6979]">{empty}</p>
        ) : (
          lines.map((line, index) => (
            <p key={index} className={`whitespace-pre-wrap break-words ${LINE_STYLE[line.kind]}`}>
              {line.kind === "error" ? "✕ " : line.kind === "warn" ? "! " : ""}
              {line.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

/** Buttons that load the lesson's own worked examples into the editor. */
export function SampleLoader({
  samples,
  onLoad,
  match,
}: {
  samples: CodeSample[];
  onLoad: (code: string) => void;
  /** Which sample languages this tool can run, e.g. ["js", "javascript"]. */
  match: string[];
}) {
  const wanted = new Set(match.map((entry) => entry.toLowerCase()));
  const runnable = samples.filter((sample) => wanted.has(sample.language.toLowerCase()));
  if (!runnable.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">From this lesson:</span>
      {runnable.map((sample, index) => (
        <Chip key={`${sample.label}-${index}`} onClick={() => onLoad(sample.code)} title="Load this example into the editor">
          <Icon name="book" size={11} /> {sample.label ?? `Example ${index + 1}`}
        </Chip>
      ))}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-[#e7e2f0] bg-[#faf9ff] px-3 py-2.5 text-[11px] font-semibold leading-5 text-[#6b6478]">
      <Icon name="spark" size={13} className="mt-0.5 shrink-0 text-[#6d4aff]" />
      <span>{children}</span>
    </p>
  );
}
