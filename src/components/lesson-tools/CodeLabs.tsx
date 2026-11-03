"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { runPython } from "@/lib/python";
import { starterFor } from "@/lib/lesson-tools";
import {
  buildJsDocument,
  buildWebDocument,
  CodeArea,
  CopyButton,
  GhostButton,
  Hint,
  Output,
  RunButton,
  SampleLoader,
  storageKey,
  usePersistentState,
  useSandboxRunner,
  type ConsoleLine,
  type ToolProps,
} from "./shared";

/* -------------------------------------------------------------------------- */
/* Web playground — HTML + CSS + JS with a live preview                        */
/* -------------------------------------------------------------------------- */

export function WebPlayground({ courseId, lessonId, lessonTitle, samples }: ToolProps) {
  const key = storageKey(courseId, lessonId, "web-playground");
  const [code, setCode] = usePersistentState(key, starterFor("web-playground", lessonTitle));
  const runner = useSandboxRunner();
  const [ran, setRan] = useState(false);

  return (
    <div className="grid gap-4">
      <SampleLoader samples={samples} match={["html", "htm", "css", "js", "javascript"]} onLoad={setCode} />
      <CodeArea value={code} onChange={setCode} rows={12} label="Your page" language="html" />
      <div className="flex flex-wrap items-center gap-2">
        <RunButton
          onClick={() => {
            runner.run(buildWebDocument(code));
            setRan(true);
          }}
        >
          Run page
        </RunButton>
        <GhostButton onClick={() => setCode(starterFor("web-playground", lessonTitle))}>Reset starter</GhostButton>
        <span className="ml-auto text-[10px] font-semibold text-[#a19aa7]">Saved in this browser as you type</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#ddd8e4] bg-white">
        <div className="flex h-9 items-center border-b border-[#eeeaf2] px-4">
          <div className="code-dots" />
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[.12em] text-[#a19aa7]">live preview</span>
        </div>
        {ran ? (
          <iframe
            key={runner.nonce}
            ref={runner.frameRef}
            title="Your page preview"
            sandbox="allow-scripts allow-modals"
            srcDoc={runner.document}
            className="h-72 w-full bg-white"
          />
        ) : (
          <div className="grid h-40 place-items-center bg-[#faf9fc] p-6 text-center">
            <p className="max-w-sm text-[12px] font-semibold leading-6 text-[#8b8494]">
              Press <strong className="text-[#5032c2]">Run page</strong> to see your work. The preview is sandboxed, so
              experiment freely — it cannot touch your account.
            </p>
          </div>
        )}
      </div>
      {/* A parked listener frame keeps console capture working before first run. */}
      {!ran && <iframe ref={runner.frameRef} title="" sandbox="allow-scripts" srcDoc="<!doctype html><html></html>" className="hidden" />}
      <Output lines={runner.lines} empty="console.log() from your page appears here." title="Page console" />
      <Hint>
        Stuck? Load the lesson&apos;s example above, press Run, then change one small thing at a time — a colour, a
        word, a number — and run again. That loop is the whole skill.
      </Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* JavaScript console                                                          */
/* -------------------------------------------------------------------------- */

export function JsConsole({ courseId, lessonId, lessonTitle, samples }: ToolProps) {
  const key = storageKey(courseId, lessonId, "js-console");
  const [code, setCode] = usePersistentState(key, starterFor("js-console", lessonTitle));
  const runner = useSandboxRunner();

  return (
    <div className="grid gap-4">
      <SampleLoader samples={samples} match={["js", "javascript"]} onLoad={setCode} />
      <CodeArea value={code} onChange={setCode} rows={11} label="Your code" language="javascript" />
      <div className="flex flex-wrap items-center gap-2">
        <RunButton onClick={() => runner.run(buildJsDocument(code))}>Run JavaScript</RunButton>
        <GhostButton onClick={runner.clear}>Clear output</GhostButton>
        <GhostButton onClick={() => setCode(starterFor("js-console", lessonTitle))}>Reset starter</GhostButton>
      </div>
      <iframe
        key={runner.nonce}
        ref={runner.frameRef}
        title=""
        aria-hidden="true"
        tabIndex={-1}
        sandbox="allow-scripts"
        srcDoc={runner.document || "<!doctype html><html></html>"}
        className="hidden"
      />
      <Output lines={runner.lines} />
      <Hint>
        Your code runs in a sandboxed frame without access to this page’s data. Avoid untrusted code: it may make network requests, and an infinite loop can freeze the preview.
      </Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Python lab (Pyodide worker)                                                 */
/* -------------------------------------------------------------------------- */

export function PythonLab({ courseId, lessonId, lessonTitle, samples }: ToolProps) {
  const key = storageKey(courseId, lessonId, "python-lab");
  const [code, setCode] = usePersistentState(key, starterFor("python-lab", lessonTitle));
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "running">("idle");

  async function run() {
    if (status !== "idle") return;
    setStatus("loading");
    setLines([{ kind: "info", text: "Starting Python…" }]);
    try {
      const started = Date.now();
      const result = await runPython(code, {
        onStatus: (next) => setStatus(next === "loading" ? "loading" : "running"),
      });
      const next: ConsoleLine[] = [];
      for (const line of result.output.split("\n")) {
        if (line.length) next.push({ kind: "log", text: line });
      }
      for (const line of result.errorOutput.split("\n")) {
        if (line.length) next.push({ kind: "error", text: line });
      }
      if (!next.length) next.push({ kind: "log", text: "(no output — did you print anything?)" });
      next.push({ kind: "info", text: `Done in ${((Date.now() - started) / 1000).toFixed(1)}s.` });
      setLines(next);
    } catch (error) {
      setLines([{ kind: "error", text: error instanceof Error ? error.message : String(error) }]);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="grid gap-4">
      <SampleLoader samples={samples} match={["python", "py"]} onLoad={setCode} />
      <CodeArea value={code} onChange={setCode} rows={11} label="Your code" language="python" />
      <div className="flex flex-wrap items-center gap-2">
        <RunButton onClick={() => void run()} disabled={status !== "idle"}>
          {status === "loading" ? "Downloading Python…" : status === "running" ? "Running…" : "Run Python"}
        </RunButton>
        <GhostButton onClick={() => setLines([])}>Clear output</GhostButton>
        <GhostButton onClick={() => setCode(starterFor("python-lab", lessonTitle))}>Reset starter</GhostButton>
      </div>
      <Output lines={lines} empty="print() output appears here." />
      <Hint>
        First run downloads Python (about 10&nbsp;MB) and takes a few seconds; afterwards it is instant. Your code runs
        in a background worker, so even an infinite loop only ends the run — never the tab.
      </Hint>
    </div>
  );
}

/* A real SQLite engine runs in an isolated, short-lived worker. */
type SqlResult = { columns: string[]; values: unknown[][] };

export function SqlLab({ courseId, lessonId, lessonTitle, samples }: ToolProps) {
  const [query, setQuery] = usePersistentState(storageKey(courseId, lessonId, "sql-lab"), starterFor("sql-lab", lessonTitle));
  const [result, setResult] = useState<{ results?: SqlResult[]; error?: string; changes?: number } | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    workerRef.current?.terminate();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function run() {
    if (workerRef.current) return;
    setRunning(true);
    setResult(null);
    try {
      const worker = new Worker("/workers/sql.js");
      workerRef.current = worker;
      const finish = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        worker.terminate();
        workerRef.current = null;
        setRunning(false);
      };
      timerRef.current = setTimeout(() => {
        finish();
        setResult({ error: "Query timed out after 20 seconds. Try a smaller query." });
      }, 20_000);
      worker.onmessage = (event: MessageEvent<{ ok: boolean; results?: SqlResult[]; error?: string; changes?: number }>) => {
        finish();
        setResult(event.data.ok ? { results: event.data.results, changes: event.data.changes } : { error: event.data.error ?? "Query failed." });
      };
      worker.onerror = () => { finish(); setResult({ error: "SQLite could not start. Check your connection and try again." }); };
      worker.postMessage({ query });
    } catch (error) {
      setRunning(false);
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  return (
    <div className="grid gap-4">
      <SampleLoader samples={samples} match={["sql", "postgres", "mysql"]} onLoad={setQuery} />
      <p className="text-[12px] font-semibold text-[#6b6474]">SQLite sample tables: customers, products, orders. Run SELECT, CREATE, INSERT and other SQLite statements.</p>
      <CodeArea value={query} onChange={setQuery} rows={8} label="SQL statements" language="sql" />
      <div className="flex flex-wrap gap-2">
        <RunButton onClick={run} disabled={running}>{running ? "Running SQLite…" : "Run SQL"}</RunButton>
        <GhostButton onClick={() => setQuery(starterFor("sql-lab", lessonTitle))}>Reset query</GhostButton>
      </div>
      {result?.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{result.error}</p>}
      {result?.results?.map((table, index) => (
        <div key={index} className="dashboard-scroll max-h-64 overflow-auto rounded-xl border border-[#ddd8e4] bg-white">
          <table className="w-full border-collapse text-left text-xs">
            <thead><tr>{table.columns.map((col, i) => <th key={i} className="border-b p-2">{col}</th>)}</tr></thead>
            <tbody>{table.values.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b p-2">{cell === null ? "NULL" : String(cell)}</td>)}</tr>)}</tbody>
          </table>
          {!table.values.length && <p className="p-3 text-xs">No rows returned.</p>}
        </div>
      ))}
      {result?.results?.length === 0 && <p role="status" className="text-sm text-emerald-700">Statements completed. Last statement changed {result.changes ?? 0} rows.</p>}
      <Hint>This is real SQLite, not a server. Each run starts with a fresh sample database: put CREATE, INSERT and SELECT in the same run. SQLite syntax can differ from PostgreSQL or MySQL. The query text is saved in this browser; database changes are not.</Hint>
    </div>
  );
}
