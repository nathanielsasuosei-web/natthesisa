"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "./Icon";

/**
 * The student code lab.
 *
 * A small, honest code editor in the browser: a file tree on the left, tabs
 * and an editor in the middle, and a live preview with a console — plus a
 * plain JavaScript runner for practice snippets.
 *
 * Everything runs locally: the preview is an iframe built from the files, and
 * JavaScript is executed inside that iframe (never in this page), so student
 * code cannot reach the session or the network. Work is saved to localStorage
 * per account, and can be downloaded as a single HTML file.
 */

export type LabLanguage = "html" | "css" | "js";

export interface LabFile {
  name: string;
  language: LabLanguage;
  content: string;
}

export interface LabTemplate {
  id: string;
  name: string;
  description: string;
  files: LabFile[];
}

const STORAGE_KEY = "codemasterghana.lab.v1";

export const LAB_TEMPLATES: LabTemplate[] = [
  {
    id: "web-page",
    name: "Starter web page",
    description: "HTML, CSS and JavaScript wired together — press Run and see it live.",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My first page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="card">
      <h1 id="greeting">Hello, web!</h1>
      <p>This page is yours. Change the text, then the colours in <code>styles.css</code>.</p>
      <button id="cheer">Cheer me on</button>
      <p id="output" class="output"></p>
    </main>

    <script src="script.js"></script>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        language: "css",
        content: `:root {
  --ink: #1c1921;
  --brand: #6d4aff;
  --paper: #f7f7f4;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.card {
  width: min(34rem, 90vw);
  background: #fff;
  border: 1px solid #e6e2e9;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(28, 25, 33, .08);
}

h1 { margin: 0 0 .5rem; letter-spacing: -.03em; }

code {
  background: #f0ecff;
  color: var(--brand);
  padding: .1rem .35rem;
  border-radius: 6px;
  font-size: .85em;
}

button {
  margin-top: 1rem;
  border: 0;
  border-radius: 12px;
  padding: .75rem 1.1rem;
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  font-size: .85rem;
  cursor: pointer;
}

button:hover { filter: brightness(1.08); }

.output { min-height: 1.25rem; font-weight: 700; color: var(--brand); }`,
      },
      {
        name: "script.js",
        language: "js",
        content: `// Runs in the preview. Open the Console tab to see what it prints.
const cheers = [
  "You are learning faster than you think.",
  "Small steps, every day.",
  "That bug is a lesson wearing a disguise.",
];

const output = document.querySelector("#output");
const button = document.querySelector("#cheer");
let count = 0;

button.addEventListener("click", () => {
  const cheer = cheers[count % cheers.length];
  output.textContent = cheer;
  console.log("Cheer #" + (count + 1) + ":", cheer);
  count += 1;
});

console.log("Page ready. Press the button!");`,
      },
    ],
  },
  {
    id: "js-practice",
    name: "JavaScript practice",
    description: "A console-only notebook for algorithms, strings and numbers.",
    files: [
      {
        name: "main.js",
        language: "js",
        content: `// Everything you log appears in the Console tab.
function fizzbuzz(n) {
  for (let i = 1; i <= n; i++) {
    const fizz = i % 3 === 0;
    const buzz = i % 5 === 0;
    console.log(fizz && buzz ? "FizzBuzz" : fizz ? "Fizz" : buzz ? "Buzz" : i);
  }
}

fizzbuzz(20);

// Try it yourself: reverse a word, count vowels, sum a list.
const reverse = (word) => [...word].reverse().join("");
console.log("reversed:", reverse("codemaster"));

// Object practice
const learner = { name: "You", lessons: 3, minutes: 95 };
console.log(Object.entries(learner));
`,
      },
    ],
  },
  {
    id: "quiz-app",
    name: "Mini quiz app",
    description: "State, events and rendering — the shape of a real app.",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mini quiz</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="quiz">
      <p class="progress" id="progress"></p>
      <h1 id="question">Loading…</h1>
      <div class="answers" id="answers"></div>
      <p class="score" id="score"></p>
      <button id="restart" hidden>Play again</button>
    </main>

    <script src="script.js"></script>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        language: "css",
        content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #19171f;
  color: #f7f7f4;
  font-family: system-ui, sans-serif;
}

.quiz {
  width: min(32rem, 90vw);
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 22px;
  padding: 1.75rem;
}

.progress { margin: 0 0 .75rem; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; color: #b9a9ff; }
h1 { margin: 0 0 1.25rem; font-size: 1.4rem; letter-spacing: -.03em; }

.answers { display: grid; gap: .6rem; }

.answers button {
  text-align: left;
  border: 1px solid rgba(255, 255, 255, .18);
  background: transparent;
  color: inherit;
  border-radius: 12px;
  padding: .85rem 1rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.answers button:hover:not(:disabled) { border-color: #6d4aff; background: rgba(109, 74, 255, .14); }
.answers button:disabled { opacity: .55; }
.answers button.right { border-color: #34d399; background: rgba(52, 211, 153, .16); }
.answers button.wrong { border-color: #fb7185; background: rgba(251, 113, 133, .16); }

.score { min-height: 1.25rem; font-weight: 700; }
#restart { margin-top: .5rem; border: 0; border-radius: 12px; padding: .8rem 1.1rem; background: #6d4aff; color: #fff; font-weight: 800; cursor: pointer; }`,
      },
      {
        name: "script.js",
        language: "js",
        content: `const QUESTIONS = [
  { q: "Which tag holds visible page content?", a: ["body", "head", "meta"], correct: 0 },
  { q: "What does CSS control?", a: ["Structure", "Presentation", "Data"], correct: 1 },
  { q: "Which value is NOT a JavaScript type?", a: ["string", "number", "paragraph"], correct: 2 },
];

const progressEl = document.querySelector("#progress");
const questionEl = document.querySelector("#question");
const answersEl = document.querySelector("#answers");
const scoreEl = document.querySelector("#score");
const restartEl = document.querySelector("#restart");

let index = 0;
let score = 0;

function render() {
  const item = QUESTIONS[index];
  progressEl.textContent = "Question " + (index + 1) + " of " + QUESTIONS.length;
  questionEl.textContent = item.q;
  scoreEl.textContent = "Score: " + score;
  answersEl.innerHTML = "";
  restartEl.hidden = true;

  item.a.forEach((label, i) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => answer(i, button));
    answersEl.append(button);
  });
}

function answer(choice, button) {
  const item = QUESTIONS[index];
  const buttons = [...answersEl.children];
  buttons.forEach((b) => (b.disabled = true));
  const right = choice === item.correct;
  button.classList.add(right ? "right" : "wrong");
  if (right) score++;
  console.log(right ? "Correct!" : "Not quite — answer: " + item.a[item.correct]);
  scoreEl.textContent = "Score: " + score;
  index++;

  window.setTimeout(() => {
    if (index < QUESTIONS.length) render();
    else finish();
  }, 700);
}

function finish() {
  progressEl.textContent = "Finished";
  questionEl.textContent = score === QUESTIONS.length ? "Perfect score!" : "Nice work — " + score + "/" + QUESTIONS.length;
  answersEl.innerHTML = "";
  restartEl.hidden = false;
}

restartEl.addEventListener("click", () => { index = 0; score = 0; render(); });
render();`,
      },
    ],
  },
];

const FILE_ICONS: Record<LabLanguage, IconName> = {
  html: "browser",
  css: "layers",
  js: "terminal",
};

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
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
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
  const runnable = files.some((item) => item.language === "html" || item.language === "js");

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
    const html = buildPreview(files, { keepScripts: true });
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

  // Tab inserts two spaces instead of leaving the editor — the single thing
  // every code editor must do.
  const onEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab" || !file) return;
    event.preventDefault();
    const target = event.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    updateFile(file.name, next);
    window.requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    });
  }, [file, updateFile]);

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
            <li><kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">Tab</kbd> indents two spaces</li>
            <li><kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">Ctrl</kbd> + <kbd className="rounded border border-[#e2dee6] px-1.5 py-0.5 font-mono text-[9px]">Enter</kbd> runs the project</li>
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
              <button type="button" onClick={copyCode} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white">
                {copied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={resetFile} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white">
                Reset file
              </button>
            </div>
          </div>

          {file ? (
            <div className="relative">
              <textarea
                ref={editorRef}
                value={file.content}
                spellCheck={false}
                onChange={(event) => updateFile(file.name, event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); run(); return; }
                  onEditorKeyDown(event);
                }}
                aria-label={`${file.name} editor`}
                className="h-[420px] w-full resize-y bg-[#1b1822] p-4 font-mono text-[12.5px] leading-6 text-[#e9e6f0] outline-none [tab-size:2] xl:h-[560px]"
              />
              <p className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] text-[#9d96a8]">
                {lines} lines · {file.language.toUpperCase()}
              </p>
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

/**
 * Builds the document the preview iframe runs.
 *
 * The student's files are inlined, and a small agent is prepended that forwards
 * `console` output and errors to the parent window as structured messages —
 * that is what fills the Console tab.
 */
function buildPreview(files: LabFile[], options: { keepScripts?: boolean } = {}): string {
  const html = files.find((item) => item.language === "html")?.content ?? "<!doctype html><html><body><main id=\"app\"></main></body></html>";
  const css = files.filter((item) => item.language === "css").map((item) => item.content).join("\n\n");
  const js = files.filter((item) => item.language === "js").map((item) => item.content).join("\n\n;\n");

  const agent = `<script>
(function () {
  var send = function (kind, args) {
    try {
      var text = args.map(function (value) {
        if (typeof value === "string") return value;
        try { return JSON.stringify(value); } catch (error) { return String(value); }
      }).join(" ");
      parent.postMessage({ __lab: true, kind: kind, text: text }, "*");
    } catch (error) { /* nothing we can do from inside the sandbox */ }
  };
  ["log", "info", "warn", "error"].forEach(function (kind) {
    var original = console[kind];
    console[kind] = function () {
      send(kind, Array.prototype.slice.call(arguments));
      if (original) original.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send("error", [event.message + (event.lineno ? " (line " + event.lineno + ")" : "")]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("error", ["Unhandled promise rejection: " + (event.reason && event.reason.message ? event.reason.message : String(event.reason))]);
  });
})();
</script>`;

  let out = html;
  // A student page usually links the CSS and JS files by name; in the preview
  // they are inlined instead, so the links are removed first.
  out = out.replace(/<link[^>]+href=["'][^"']*\.css["'][^>]*>/gi, "");
  out = out.replace(/<script[^>]+src=["'][^"']*\.js["'][^>]*>\s*<\/script>/gi, "");

  const head = css ? `<style>\n${css}\n</style>` : "";
  const script = js ? `${agent}\n<script>\ntry {\n${js}\n} catch (error) {\n  console.error(error && error.message ? error.message : String(error));\n}\n</script>` : agent;

  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${head}\n${script}\n</head>`);
  else out = `${head}\n${script}\n${out}`;

  if (options.keepScripts === false) return out.replace(/<script[\s\S]*?<\/script>/gi, "");
  return out;
}
