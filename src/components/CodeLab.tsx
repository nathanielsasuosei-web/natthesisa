"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as monaco from "monaco-editor";
import Icon, { type IconName } from "./Icon";
import {
  LAB_TEMPLATES,
  buildPreview,
  languageForFileName,
  type LabFile,
  type LabLanguage,
  type LabTemplate,
} from "@/lib/lab";
import type { LabProblem } from "./LabEditor";
import { runPython, type PythonStatus } from "@/lib/python";

/**
 * CodeMaster Studio — the website's own VS Code.
 *
 * A real code editor in the browser: an activity bar and sidebar (Explorer,
 * Search, Templates, Help), tabs and the actual VS Code editor (Monaco), and a
 * bottom panel with a live preview, a console, a terminal and a problems list —
 * plus a status bar, like the desktop app.
 *
 * Everything runs locally. Web files run inside a sandboxed preview iframe
 * (student code cannot reach the session or the network) and Python runs in a
 * background worker (Pyodide), so an infinite loop ends the run instead of the
 * tab. Work is saved to localStorage per account and can be downloaded.
 */

// The VS Code editor (Monaco) only runs in the browser, so it is loaded on
// demand and kept out of the initial page bundle.
const LabEditor = dynamic(() => import("./LabEditor"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-[#1b1822] text-xs font-bold text-[#8f889a]">
      Opening the VS Code editor…
    </div>
  ),
});

const STORAGE_KEY = "codemasterghana.lab.v1";

const FILE_ICONS: Record<LabLanguage, IconName> = {
  html: "browser",
  css: "layers",
  js: "code",
  python: "terminal",
  json: "file",
  markdown: "book",
  text: "file",
};

const LANG_LABEL: Record<LabLanguage, string> = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
  python: "Python",
  json: "JSON",
  markdown: "Markdown",
  text: "Text",
};

const VIEWS = [
  { id: "files", icon: "file", label: "Explorer" },
  { id: "search", icon: "search", label: "Search" },
  { id: "templates", icon: "layers", label: "Templates" },
  { id: "help", icon: "book", label: "Help" },
] as const;

type SideView = (typeof VIEWS)[number]["id"];
type Panel = "preview" | "console" | "terminal" | "problems";

export type { LabFile, LabLanguage, LabTemplate } from "@/lib/lab";

interface ConsoleLine {
  kind: "log" | "warn" | "error" | "info";
  text: string;
}

interface TermLine {
  kind: "in" | "out" | "err";
  text: string;
}

interface Props {
  /** Used to namespace saved work per account. */
  studentId: string;
  studentName: string;
  /** Page chrome overrides, so the public studio can introduce itself. */
  eyebrow?: string;
  title?: string;
  blurb?: string;
}

/** A tiny starter so a brand-new file is never a blank page. */
function starterFor(language: LabLanguage): string {
  switch (language) {
    case "html":
      return `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>New page</title>\n  </head>\n  <body>\n    <h1>Hello!</h1>\n  </body>\n</html>\n`;
    case "css":
      return `/* Styles for your page */\n`;
    case "js":
      return `// Runs in the preview — console.log() shows in the Console tab.\nconsole.log("Hello!");\n`;
    case "python":
      return `# Press Run — print() shows in the Console tab.\nprint("Hello from Python!")\n`;
    case "json":
      return `{\n  "hello": "world"\n}\n`;
    case "markdown":
      return `# Notes\n\nWrite here.\n`;
    default:
      return "";
  }
}

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  file?: LabFile;
}

/** Folders come from slashes in the name, so `demo/app.js` just works. */
function buildTree(files: LabFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.name.split("/").filter((part) => part.length > 0);
    let level = root;
    let path = "";
    parts.forEach((part, index) => {
      path = path ? `${path}/${part}` : part;
      const last = index === parts.length - 1;
      let node = level.find((item) => item.name === part && (last ? Boolean(item.file) : !item.file));
      if (!node) {
        node = { name: part, path, children: [], file: last ? file : undefined };
        level.push(node);
      } else if (last) {
        node.file = file;
      }
      level = node.children;
    });
  }
  const sortLevel = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      const folderOrder = Number(Boolean(a.file)) - Number(Boolean(b.file));
      if (folderOrder !== 0) return folderOrder;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sortLevel(node.children));
  };
  sortLevel(root);
  return root;
}

function splitLines(text: string): string[] {
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export default function CodeLab({
  studentId,
  studentName,
  eyebrow = "Student tools",
  title = "Code lab",
  blurb,
}: Props) {
  const storageKey = `${STORAGE_KEY}.${studentId}`;
  const [templateId, setTemplateId] = useState(LAB_TEMPLATES[0].id);
  const [files, setFiles] = useState<LabFile[]>(LAB_TEMPLATES[0].files);
  const [activeFile, setActiveFile] = useState(LAB_TEMPLATES[0].files[0].name);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [termLines, setTermLines] = useState<TermLine[]>([
    { kind: "out", text: "CodeMaster Studio terminal — type \"help\" to see what it can do." },
  ]);
  const [termInput, setTermInput] = useState("");
  const [view, setView] = useState<SideView>("files");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panel, setPanel] = useState<Panel>("preview");
  const [panelVisible, setPanelVisible] = useState(true);
  const [runId, setRunId] = useState(0);
  const [autoRun, setAutoRun] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [problems, setProblems] = useState<LabProblem[]>([]);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newFileError, setNewFileError] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);
  const [pythonState, setPythonState] = useState<PythonStatus | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const pythonRunning = useRef(false);
  const termScrollRef = useRef<HTMLDivElement | null>(null);
  const consoleScrollRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useRef(false);

  // ---- restore the student's last session ----------------------------------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { templateId?: unknown; files?: unknown; activeFile?: unknown };
      const known = LAB_TEMPLATES.find((template) => template.id === parsed.templateId);
      const rawFiles = Array.isArray(parsed.files) ? parsed.files : [];
      // The extension is authoritative: the language is always recomputed, so
      // work saved by older versions (HTML/CSS/JS only) still loads cleanly.
      const clean: LabFile[] = [];
      for (const item of rawFiles.slice(0, 50)) {
        if (typeof item !== "object" || item === null) continue;
        const { name, content } = item as { name?: unknown; content?: unknown };
        if (typeof name !== "string" || !name.trim() || typeof content !== "string") continue;
        if (clean.some((entry) => entry.name === name.trim())) continue;
        clean.push({ name: name.trim(), content: content.slice(0, 200_000), language: languageForFileName(name) });
      }
      if (clean.length > 0) {
        setFiles(clean);
        setTemplateId(known?.id ?? LAB_TEMPLATES[0].id);
        setActiveFile(
          clean.some((entry) => entry.name === parsed.activeFile) ? (parsed.activeFile as string) : clean[0].name,
        );
      }
    } catch {
      // A corrupt entry should never stop the studio from opening.
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
  const tree = useMemo(() => buildTree(files), [files]);

  const pushConsole = useCallback((kind: ConsoleLine["kind"], text: string) => {
    setConsoleLines((lines) => [...lines.slice(-199), { kind, text }]);
  }, []);

  const pushTerm = useCallback((kind: TermLine["kind"], text: string) => {
    setTermLines((lines) => [...lines.slice(-299), { kind, text }]);
  }, []);

  const runPythonCode = useCallback(
    async (code: string, label: string) => {
      if (pythonRunning.current) {
        pushConsole("error", "Python is already running — wait for it to finish.");
        setPanel("console");
        setPanelVisible(true);
        return;
      }
      pythonRunning.current = true;
      setPanel("console");
      setPanelVisible(true);
      setPythonState("loading");
      pushConsole("info", `Running ${label}…`);
      try {
        const started = Date.now();
        const result = await runPython(code, { onStatus: (status) => setPythonState(status) });
        const elapsed = ((Date.now() - started) / 1000).toFixed(1);
        const outLines = splitLines(result.output);
        const errLines = splitLines(result.errorOutput);
        if (outLines.length === 0 && errLines.length === 0) pushConsole("log", "(no output)");
        for (const line of outLines) pushConsole("log", line);
        for (const line of errLines) pushConsole("error", line);
        pushConsole("info", `Done in ${elapsed}s.`);
      } catch (error) {
        pushConsole("error", error instanceof Error ? error.message : String(error));
      } finally {
        pythonRunning.current = false;
        setPythonState(null);
      }
    },
    [pushConsole],
  );

  const run = useCallback(() => {
    const current = files.find((item) => item.name === activeFile) ?? files[0];
    if (!current) return;
    if (current.language === "python") {
      void runPythonCode(current.content, current.name);
      return;
    }
    setConsoleLines([]);
    setRunId((value) => value + 1);
  }, [files, activeFile, runPythonCode]);

  // Auto-run the web side only — Python runs on demand, on the Run button.
  useEffect(() => {
    if (!autoRun || file?.language === "python") return;
    const timer = window.setTimeout(() => setRunId((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [document_, autoRun]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ---- keep the console and terminal pinned to the latest line -------------
  useEffect(() => {
    const el = termScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [termLines, panel, panelVisible]);
  useEffect(() => {
    const el = consoleScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [consoleLines, panel, panelVisible]);

  const handleEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((event) =>
      setCursor({ line: event.position.lineNumber, column: event.position.column }),
    );
  }, []);

  const openAt = useCallback((name: string, line?: number, column?: number) => {
    setActiveFile(name);
    if (line) {
      window.requestAnimationFrame(() => {
        const editor = editorRef.current;
        if (!editor) return;
        try {
          editor.revealLineInCenter(line);
          editor.setPosition({ lineNumber: line, column: column ?? 1 });
          editor.focus();
        } catch {
          // The model may still be switching — the file is open either way.
        }
      });
    }
  }, []);

  const updateFile = useCallback((name: string, content: string) => {
    setFiles((current) => current.map((item) => (item.name === name ? { ...item, content } : item)));
  }, []);

  const currentTemplate = LAB_TEMPLATES.find((item) => item.id === templateId);
  const filesMatchTemplate =
    currentTemplate !== undefined && JSON.stringify(currentTemplate.files) === JSON.stringify(files);

  const chooseTemplate = useCallback(
    (template: LabTemplate) => {
      if (!filesMatchTemplate && !window.confirm("Switching templates replaces your current files. Continue?")) return;
      setTemplateId(template.id);
      setFiles(template.files);
      setActiveFile(template.files[0].name);
      setConsoleLines([]);
      setProblems([]);
      setRunId((value) => value + 1);
    },
    [filesMatchTemplate],
  );

  const resetFile = useCallback(() => {
    const template = LAB_TEMPLATES.find((item) => item.id === templateId);
    const original = template?.files.find((item) => item.name === activeFile);
    if (original) updateFile(activeFile, original.content);
  }, [activeFile, templateId, updateFile]);

  // ---- file management -----------------------------------------------------
  function cleanFileName(raw: string, exclude?: string): string | null {
    const name = raw.trim().replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/^\/+/, "").replace(/\/+$/, "");
    if (!name) {
      setNewFileError("Give the file a name first.");
      return null;
    }
    if (name.length > 120 || name.includes("..") || name.split("/").some((part) => part.length === 0)) {
      setNewFileError("That name will not work — try something like notes.md or demo/app.js.");
      return null;
    }
    if (files.some((item) => item.name !== exclude && item.name === name)) {
      setNewFileError("A file with that name already exists.");
      return null;
    }
    setNewFileError("");
    return name;
  }

  function addFile() {
    const name = cleanFileName(newName);
    if (!name) return;
    const language = languageForFileName(name);
    setFiles((current) => [...current, { name, language, content: starterFor(language) }]);
    setActiveFile(name);
    setNewName("");
  }

  function commitRename() {
    if (!renaming) return;
    const name = cleanFileName(renameValue, renaming);
    if (!name) return;
    setFiles((current) =>
      current.map((item) => (item.name === renaming ? { ...item, name, language: languageForFileName(name) } : item)),
    );
    if (activeFile === renaming) setActiveFile(name);
    setRenaming(null);
    setRenameValue("");
  }

  function deleteFile(name: string) {
    if (files.length <= 1) {
      window.alert("Keep at least one file — the editor needs something to show.");
      return;
    }
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setFiles((current) => current.filter((item) => item.name !== name));
    if (activeFile === name) {
      const [first] = files.filter((item) => item.name !== name);
      if (first) setActiveFile(first.name);
    }
  }

  function toggleFolder(path: string) {
    setCollapsedFolders((current) =>
      current.includes(path) ? current.filter((entry) => entry !== path) : [...current, path],
    );
  }

  // ---- search --------------------------------------------------------------
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    const matches: Array<{ name: string; lineNo: number; text: string }> = [];
    for (const item of files) {
      const lines = item.content.split("\n");
      lines.forEach((text, index) => {
        if (matches.length >= 100) return;
        if (text.toLowerCase().includes(query)) matches.push({ name: item.name, lineNo: index + 1, text: text.trim().slice(0, 120) });
      });
    }
    return matches;
  }, [searchQuery, files]);

  // ---- problems for files that still exist ---------------------------------
  const visibleProblems = useMemo(() => {
    const names = new Set(files.map((item) => item.name));
    const rank = { error: 0, warning: 1, info: 2 } as const;
    return problems
      .filter((problem) => names.has(problem.file))
      .sort((a, b) => rank[a.severity] - rank[b.severity] || a.line - b.line);
  }, [problems, files]);
  const problemCount = visibleProblems.filter((problem) => problem.severity !== "info").length;

  // ---- the terminal --------------------------------------------------------
  function runTermCommand(raw: string) {
    const input = raw.trim();
    pushTerm("in", input);
    if (!input) return;
    const [command, ...rest] = input.split(/\s+/);
    const arg = rest.join(" ").trim();
    switch (command.toLowerCase()) {
      case "help":
        pushTerm("out", "Commands: ls · open <file> · run · python <file> · echo <text> · whoami · date · clear");
        break;
      case "ls":
        for (const item of files) pushTerm("out", item.name);
        break;
      case "open":
        if (!arg) {
          pushTerm("err", "Usage: open <file>");
        } else {
          const target = files.find((item) => item.name === arg || item.name.endsWith(`/${arg}`));
          if (target) {
            openAt(target.name);
            pushTerm("out", `Opened ${target.name}.`);
          } else {
            pushTerm("err", `No file called "${arg}" — try "ls" to list files.`);
          }
        }
        break;
      case "run":
        run();
        pushTerm("out", "Running… (see the Preview and Console tabs)");
        break;
      case "python": {
        if (!arg) {
          pushTerm("err", "Usage: python <file>  —  e.g. python main.py");
          break;
        }
        const target = files.find((item) => item.name === arg || item.name.endsWith(`/${arg}`));
        if (!target) pushTerm("err", `No file called "${arg}" — try "ls" to list files.`);
        else if (target.language !== "python") pushTerm("err", `${target.name} is not a Python file.`);
        else {
          pushTerm("out", `Running ${target.name}… (see the Console tab)`);
          void runPythonCode(target.content, target.name);
        }
        break;
      }
      case "echo":
        pushTerm("out", arg);
        break;
      case "whoami":
        pushTerm("out", `${studentName} — coding in CodeMaster Studio.`);
        break;
      case "date":
        pushTerm("out", new Date().toString());
        break;
      case "clear":
        setTermLines([]);
        break;
      default:
        pushTerm("err", `Unknown command "${command}" — type "help" to see commands.`);
        break;
    }
  }

  // ---- downloads -----------------------------------------------------------
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

  const downloadFile = useCallback(() => {
    if (!file) return;
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name.split("/").pop() ?? file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }, [file]);

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

  function togglePanel(next: Panel) {
    if (panel === next) setPanelVisible((value) => !value);
    else {
      setPanel(next);
      setPanelVisible(true);
    }
  }

  function selectView(next: SideView) {
    if (view === next) setSidebarOpen((value) => !value);
    else {
      setView(next);
      setSidebarOpen(true);
    }
  }

  const lines = file ? file.content.split("\n").length : 0;

  function renderTree(nodes: TreeNode[], depth: number): React.ReactNode {
    return nodes.map((node) => {
      if (!node.file) {
        const collapsed = collapsedFolders.includes(node.path);
        return (
          <li key={node.path}>
            <button
              type="button"
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
              className="flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-[11px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white"
            >
              <Icon name={collapsed ? "chevron-right" : "chevron-down"} size={12} />
              {node.name}
            </button>
            {!collapsed && <ul className="space-y-0.5">{renderTree(node.children, depth + 1)}</ul>}
          </li>
        );
      }
      const item = node.file;
      const isActive = item.name === activeFile;
      const isRenaming = renaming === item.name;
      return (
        <li key={node.path}>
          {isRenaming ? (
            <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}>
              <input
                autoFocus
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitRename();
                  if (event.key === "Escape") {
                    setRenaming(null);
                    setRenameValue("");
                    setNewFileError("");
                  }
                }}
                className="w-full rounded-md border border-[#6d4aff] bg-[#141218] px-2 py-1 text-[11px] font-bold text-white outline-none"
              />
            </div>
          ) : (
            <div
              className={`group flex w-full items-center gap-1 rounded-lg py-1 pr-1 transition ${
                isActive ? "bg-white/10" : "hover:bg-white/[.06]"
              }`}
              style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
            >
              <button
                type="button"
                onClick={() => openAt(item.name)}
                className={`flex min-w-0 flex-1 items-center gap-2 text-left text-[11px] font-bold ${
                  isActive ? "text-white" : "text-[#aaa4b1] group-hover:text-white"
                }`}
              >
                <Icon name={FILE_ICONS[item.language]} size={13} />
                <span className="truncate">{node.name}</span>
              </button>
              <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                <button
                  type="button"
                  title={`Rename ${item.name}`}
                  aria-label={`Rename ${item.name}`}
                  onClick={() => {
                    setRenaming(item.name);
                    setRenameValue(item.name);
                    setNewFileError("");
                  }}
                  className="rounded p-1 text-[#8f889a] transition hover:bg-white/10 hover:text-white"
                >
                  <Icon name="pencil" size={12} />
                </button>
                <button
                  type="button"
                  title={`Delete ${item.name}`}
                  aria-label={`Delete ${item.name}`}
                  onClick={() => deleteFile(item.name)}
                  className="rounded p-1 text-[#8f889a] transition hover:bg-white/10 hover:text-[#ff9aa8]"
                >
                  <Icon name="close" size={12} />
                </button>
              </span>
            </div>
          )}
        </li>
      );
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8a8390]">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-.04em] sm:text-3xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#756f7b]">
            {blurb ??
              `Write HTML, CSS, JavaScript and Python and see them run instantly — no install, nothing to set up. Your work is saved to this browser as ${studentName.split(" ")[0]}, and you can download it to keep.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
              saved === "saved" ? "bg-emerald-50 text-emerald-700" : "bg-[#f2f0f4] text-[#6d6673]"
            }`}
          >
            {saved === "saved" ? "Saved" : saved === "saving" ? "Saving…" : "Not saved yet"}
          </span>
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#7a5aff]"
          >
            <Icon name="play" size={14} /> Run
          </button>
          <button
            type="button"
            onClick={downloadProject}
            className="inline-flex items-center gap-2 rounded-xl border border-[#ddd9e2] bg-white px-4 py-2.5 text-xs font-bold text-[#5e5864] transition hover:bg-[#f7f5f9]"
          >
            <Icon name="download" size={14} /> Download project
          </button>
        </div>
      </header>

      <div className="flex flex-col overflow-hidden rounded-[20px] border border-[#e8e4ec] bg-[#1b1822] lg:flex-row">
        {/* ---- activity bar ---- */}
        <nav aria-label="Studio views" className="flex shrink-0 flex-row gap-1 border-b border-white/10 p-2 lg:w-12 lg:flex-col lg:border-b-0 lg:border-r">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => selectView(item.id)}
              className={`grid size-9 place-items-center rounded-lg transition ${
                view === item.id && sidebarOpen ? "bg-white/10 text-white" : "text-[#8f889a] hover:bg-white/[.06] hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={16} />
            </button>
          ))}
        </nav>

        {/* ---- sidebar ---- */}
        {sidebarOpen && (
          <aside className="w-full shrink-0 border-b border-white/10 p-3 lg:w-60 lg:border-b-0 lg:border-r">
            {view === "files" && (
              <div>
                <h2 className="px-1 text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Explorer</h2>
                <form
                  className="mt-2 flex gap-1.5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addFile();
                  }}
                >
                  <input
                    value={newName}
                    onChange={(event) => {
                      setNewName(event.target.value);
                      setNewFileError("");
                    }}
                    placeholder="New file — e.g. demo/app.js"
                    aria-label="New file name"
                    className="w-full min-w-0 rounded-lg border border-white/10 bg-[#141218] px-2.5 py-1.5 text-[11px] font-bold text-white outline-none placeholder:font-semibold placeholder:text-[#5c5566] focus:border-[#6d4aff]"
                  />
                  <button
                    type="submit"
                    title="Create file"
                    aria-label="Create file"
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#6d4aff] text-white transition hover:bg-[#7a5aff]"
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </form>
                {newFileError && <p className="mt-1.5 px-1 text-[10px] font-bold leading-4 text-[#ff9aa8]">{newFileError}</p>}
                <ul className="mt-2 space-y-0.5">{renderTree(tree, 0)}</ul>
                <p className="mt-3 px-1 text-[10px] leading-4 text-[#5c5566]">
                  Tip: put a <span className="font-mono text-[#8f889a]">/</span> in a name to file it in a folder.
                </p>
              </div>
            )}

            {view === "search" && (
              <div>
                <h2 className="px-1 text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Search</h2>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search all files…"
                  aria-label="Search all files"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-[#141218] px-2.5 py-1.5 text-[11px] font-bold text-white outline-none placeholder:font-semibold placeholder:text-[#5c5566] focus:border-[#6d4aff]"
                />
                <ul className="mt-2 space-y-1">
                  {searchResults.map((match, index) => (
                    <li key={`${match.name}:${match.lineNo}:${index}`}>
                      <button
                        type="button"
                        onClick={() => openAt(match.name, match.lineNo)}
                        className="w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[.06]"
                      >
                        <p className="truncate text-[10px] font-black text-[#b7a7ff]">
                          {match.name} <span className="text-[#5c5566]">:{match.lineNo}</span>
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-[#aaa4b1]">{match.text}</p>
                      </button>
                    </li>
                  ))}
                </ul>
                {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="mt-2 px-1 text-[10px] leading-4 text-[#5c5566]">No matches — try a shorter search.</p>
                )}
                {searchQuery.trim().length < 2 && (
                  <p className="mt-2 px-1 text-[10px] leading-4 text-[#5c5566]">Type at least two letters to search every file.</p>
                )}
              </div>
            )}

            {view === "templates" && (
              <div>
                <h2 className="px-1 text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Templates</h2>
                <div className="mt-2 space-y-2">
                  {LAB_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => chooseTemplate(template)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        template.id === templateId && filesMatchTemplate
                          ? "border-[#6d4aff] bg-[#6d4aff]/15"
                          : "border-white/10 hover:bg-white/[.04]"
                      }`}
                    >
                      <p className="text-xs font-extrabold text-white">{template.name}</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#8f889a]">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === "help" && (
              <div className="space-y-4 px-1">
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Run & shortcuts</h2>
                  <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-[#8f889a]">
                    <li><Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> runs the project</li>
                    <li><Kbd>Tab</Kbd> indents the selection</li>
                    <li><Kbd>F1</Kbd> opens the VS Code command palette</li>
                    <li>Work saves to this browser automatically</li>
                  </ul>
                </div>
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Terminal</h2>
                  <ul className="mt-2 space-y-1.5 font-mono text-[10px] leading-4 text-[#8f889a]">
                    <li>help — list commands</li>
                    <li>ls — list files</li>
                    <li>open main.py — open a file</li>
                    <li>python main.py — run Python</li>
                    <li>run — run the project</li>
                  </ul>
                </div>
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[.14em] text-[#8a8390]">Python notes</h2>
                  <ul className="mt-2 space-y-1.5 text-[10px] leading-4 text-[#8f889a]">
                    <li>The first run downloads Python (about 10&nbsp;MB); later runs are instant.</li>
                    <li>A run stops after 20 seconds, so a loop cannot freeze the page.</li>
                    <li><span className="font-mono">input()</span> is not supported — put values in variables.</li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ---- editor column ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
            <button
              type="button"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              onClick={() => setSidebarOpen((value) => !value)}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[#8f889a] transition hover:bg-white/[.06] hover:text-white"
            >
              <Icon name="menu" size={14} />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {files.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  title={item.name}
                  onClick={() => openAt(item.name)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    item.name === activeFile ? "bg-white/10 text-white" : "text-[#8f889a] hover:text-white"
                  }`}
                >
                  <Icon name={FILE_ICONS[item.language]} size={12} />
                  <span className="max-w-32 truncate">{item.name.split("/").pop()}</span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="hidden rounded-md bg-white/[.05] px-2 py-1 font-mono text-[10px] text-[#9d96a8] sm:inline">
                {file ? `${lines} lines · ${LANG_LABEL[file.language]}` : ""}
              </span>
              <span className="hidden items-center gap-1 rounded-md bg-[#6d4aff]/15 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#b7a7ff] md:inline-flex">
                <Icon name="code" size={11} /> VS Code
              </span>
              <button type="button" onClick={copyCode} className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white">
                {copied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={downloadFile} className="hidden rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white sm:block">
                File
              </button>
              <button type="button" onClick={resetFile} className="hidden rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#aaa4b1] transition hover:bg-white/[.06] hover:text-white sm:block">
                Reset
              </button>
            </div>
          </div>

          {file ? (
            <div className="h-[420px] xl:h-[500px]">
              <LabEditor
                fileName={file.name}
                language={file.language}
                value={file.content}
                onChange={(content) => updateFile(file.name, content)}
                onRun={run}
                onEditorMount={handleEditorMount}
                onProblems={setProblems}
              />
            </div>
          ) : (
            <p className="p-5 text-xs text-[#aaa4b1]">Choose a file to edit.</p>
          )}

          {/* ---- bottom panel ---- */}
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-1.5">
            <div className="flex gap-1">
              {(
                [
                  { id: "preview", label: "Preview" },
                  { id: "console", label: `Console${consoleLines.length ? ` (${consoleLines.length})` : ""}` },
                  { id: "terminal", label: "Terminal" },
                  { id: "problems", label: `Problems${problemCount ? ` (${problemCount})` : ""}` },
                ] as Array<{ id: Panel; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => togglePanel(tab.id)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
                    panel === tab.id && panelVisible ? "bg-white/10 text-white" : "text-[#8f889a] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {pythonState && (
                <span className="animate-pulse text-[10px] font-black uppercase tracking-wide text-[#b7a7ff]">
                  {pythonState === "loading" ? "Loading Python…" : "Running Python…"}
                </span>
              )}
              <label className="hidden cursor-pointer items-center gap-1.5 text-[10px] font-bold text-[#8f889a] sm:flex">
                <input type="checkbox" checked={autoRun} onChange={(event) => setAutoRun(event.target.checked)} className="size-3.5 accent-[#6d4aff]" />
                Auto-run
              </label>
            </div>
          </div>

          {panelVisible && (
            <div className="h-60 border-t border-white/10">
              <div className={panel === "preview" ? "block h-full" : "hidden"}>
                <iframe
                  key={runId}
                  ref={frameRef}
                  title="Project preview"
                  sandbox="allow-scripts allow-modals"
                  srcDoc={document_}
                  className="h-full w-full border-0 bg-white"
                />
              </div>

              <div className={panel === "console" ? "block h-full" : "hidden"}>
                <div ref={consoleScrollRef} className="h-full overflow-auto bg-[#141218] p-3 font-mono text-[11px] leading-5">
                  {consoleLines.length === 0 && (
                    <p className="text-[#8f889a]">
                      Nothing logged yet. Press Run — anything you <span className="text-[#c6b9ff]">console.log()</span> or{" "}
                      <span className="text-[#c6b9ff]">print()</span> shows up here.
                    </p>
                  )}
                  {consoleLines.map((line, index) => (
                    <p
                      key={index}
                      className={
                        line.kind === "error"
                          ? "text-[#ff9aa8]"
                          : line.kind === "warn"
                            ? "text-[#ffd479]"
                            : line.kind === "info"
                              ? "text-[#8f889a]"
                              : "text-[#d7d2e0]"
                      }
                    >
                      <span className="mr-2 select-none text-[#4e4757]">{String(index + 1).padStart(2, "0")}</span>
                      {line.text || " "}
                    </p>
                  ))}
                </div>
              </div>

              <div className={panel === "terminal" ? "block h-full" : "hidden"}>
                <div className="flex h-full flex-col bg-[#141218] p-3 font-mono text-[11px] leading-5">
                  <div ref={termScrollRef} className="min-h-0 flex-1 overflow-auto">
                    {termLines.map((line, index) => (
                      <p
                        key={index}
                        className={line.kind === "err" ? "text-[#ff9aa8]" : line.kind === "in" ? "text-white" : "text-[#b9b2c4]"}
                      >
                        {line.kind === "in" && <span className="mr-2 select-none text-[#6d4aff]">▸</span>}
                        {line.text || " "}
                      </p>
                    ))}
                  </div>
                  <form
                    className="mt-2 flex shrink-0 items-center gap-2 border-t border-white/10 pt-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      runTermCommand(termInput);
                      setTermInput("");
                    }}
                  >
                    <span className="select-none text-[#6d4aff]">▸</span>
                    <input
                      value={termInput}
                      onChange={(event) => setTermInput(event.target.value)}
                      placeholder="Type a command — try help"
                      aria-label="Terminal command"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="w-full bg-transparent text-[#e8e4ee] outline-none placeholder:text-[#5c5566]"
                    />
                  </form>
                </div>
              </div>

              <div className={panel === "problems" ? "block h-full" : "hidden"}>
                <div className="h-full overflow-auto bg-[#141218] p-2">
                  {visibleProblems.length === 0 && (
                    <p className="p-2 text-[11px] text-[#8f889a]">
                      No problems — the editor checks your code as you type.
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {visibleProblems.map((problem, index) => (
                      <li key={`${problem.file}:${problem.line}:${problem.column}:${index}`}>
                        <button
                          type="button"
                          onClick={() => openAt(problem.file, problem.line, problem.column)}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[.06]"
                        >
                          <span
                            className={`mt-1 size-2 shrink-0 rounded-full ${
                              problem.severity === "error"
                                ? "bg-[#ff9aa8]"
                                : problem.severity === "warning"
                                  ? "bg-[#ffd479]"
                                  : "bg-[#6d9fff]"
                            }`}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[11px] font-bold text-[#e8e4ee]">{problem.message}</span>
                            <span className="block font-mono text-[10px] text-[#8f889a]">
                              {problem.file} : {problem.line}:{problem.column}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ---- status bar ---- */}
          <div className="flex items-center justify-between gap-2 bg-[#141218] px-3 py-1.5 text-[10px] font-bold text-[#8f889a]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0">
                Ln {cursor.line}, Col {cursor.column}
              </span>
              <span className="hidden shrink-0 sm:inline">{file ? LANG_LABEL[file.language] : ""}</span>
              <span className="hidden shrink-0 truncate md:inline">
                {files.length} file{files.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span>{saved === "saved" ? "All changes saved" : saved === "saving" ? "Saving…" : "Not saved yet"}</span>
              <span className="hidden sm:inline">Spaces: 2</span>
              <span className="hidden sm:inline">UTF-8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/15 bg-white/[.06] px-1.5 py-0.5 font-mono text-[9px] text-[#d7d2e0]">
      {children}
    </kbd>
  );
}
