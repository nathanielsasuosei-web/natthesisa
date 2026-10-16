"use client";

import { useState } from "react";
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
      <SampleLoader samples={samples} match={["js", "javascript", "ts", "typescript", "jsx", "tsx"]} onLoad={setCode} />
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
        Your code runs in a sealed box: no network, no storage, no access to this page. An infinite loop cannot freeze
        your tab — the box simply stops answering.
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

/* -------------------------------------------------------------------------- */
/* SQL lab — a tiny SELECT engine over sample tables                           */
/* -------------------------------------------------------------------------- */

type Row = Record<string, string | number>;

interface Table {
  columns: string[];
  rows: Row[];
}

const SAMPLE_TABLES: Record<string, Table> = {
  customers: {
    columns: ["id", "name", "city", "joined"],
    rows: [
      { id: 1, name: "Ama Serwaa", city: "Accra", joined: 2022 },
      { id: 2, name: "Kofi Mensah", city: "Kumasi", joined: 2021 },
      { id: 3, name: "Efua Adu", city: "Accra", joined: 2023 },
      { id: 4, name: "Yaw Owusu", city: "Takoradi", joined: 2022 },
      { id: 5, name: "Abena Frimpong", city: "Accra", joined: 2024 },
      { id: 6, name: "Kwame Asante", city: "Tamale", joined: 2023 },
      { id: 7, name: "Akosua Boateng", city: "Kumasi", joined: 2024 },
      { id: 8, name: "Fiifi Coleman", city: "Cape Coast", joined: 2021 },
    ],
  },
  products: {
    columns: ["id", "name", "price"],
    rows: [
      { id: 1, name: "Canvas tote", price: 85 },
      { id: 2, name: "Kente scarf", price: 240 },
      { id: 3, name: "Shea butter set", price: 120 },
      { id: 4, name: "Bead bracelet", price: 45 },
      { id: 5, name: "Leather sandals", price: 310 },
      { id: 6, name: "Adinkra notebook", price: 60 },
    ],
  },
  orders: {
    columns: ["id", "customer_id", "product_id", "qty"],
    rows: [
      { id: 1, customer_id: 1, product_id: 2, qty: 1 },
      { id: 2, customer_id: 3, product_id: 1, qty: 3 },
      { id: 3, customer_id: 2, product_id: 5, qty: 1 },
      { id: 4, customer_id: 5, product_id: 3, qty: 2 },
      { id: 5, customer_id: 1, product_id: 6, qty: 5 },
      { id: 6, customer_id: 4, product_id: 4, qty: 2 },
      { id: 7, customer_id: 7, product_id: 2, qty: 1 },
      { id: 8, customer_id: 6, product_id: 1, qty: 1 },
      { id: 9, customer_id: 5, product_id: 5, qty: 1 },
      { id: 10, customer_id: 8, product_id: 6, qty: 2 },
    ],
  },
};

const SQL_EXAMPLES = [
  "SELECT * FROM customers;",
  "SELECT name, city FROM customers WHERE city = 'Accra' ORDER BY name;",
  "SELECT COUNT(*) FROM orders WHERE qty >= 2;",
  "SELECT * FROM products ORDER BY price DESC LIMIT 3;",
];

interface SqlResult {
  ok: boolean;
  message: string;
  columns: string[];
  rows: Row[];
  ms: number;
}

function compare(left: string | number, operator: string, right: string | number): boolean {
  if (operator === "=") return String(left).toLowerCase() === String(right).toLowerCase();
  if (operator === "!=" || operator === "<>") return String(left).toLowerCase() !== String(right).toLowerCase();
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) return false;
  if (operator === ">") return leftNumber > rightNumber;
  if (operator === "<") return leftNumber < rightNumber;
  if (operator === ">=") return leftNumber >= rightNumber;
  if (operator === "<=") return leftNumber <= rightNumber;
  return false;
}

function runQuery(input: string): SqlResult {
  const started = performance.now();
  const fail = (message: string): SqlResult => ({ ok: false, message, columns: [], rows: [], ms: 0 });
  const cleaned = input.trim().replace(/;+\s*$/, "");
  if (!cleaned) return fail("Write a query first — try one of the examples below.");

  const showTables = cleaned.match(/^show\s+tables$/i);
  if (showTables) {
    return {
      ok: true,
      message: `${Object.keys(SAMPLE_TABLES).length} tables`,
      columns: ["table"],
      rows: Object.keys(SAMPLE_TABLES).map((name) => ({ table: name })),
      ms: performance.now() - started,
    };
  }

  const describe = cleaned.match(/^describe\s+([a-z_][a-z0-9_]*)$/i);
  if (describe) {
    const table = SAMPLE_TABLES[describe[1].toLowerCase()];
    if (!table) return fail(`Unknown table "${describe[1]}". Try SHOW TABLES to list them.`);
    return {
      ok: true,
      message: `${table.columns.length} columns`,
      columns: ["column"],
      rows: table.columns.map((column) => ({ column })),
      ms: performance.now() - started,
    };
  }

  const select = cleaned.match(
    /^select\s+(.+?)\s+from\s+([a-z_][a-z0-9_]*)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+([a-z_][a-z0-9_]*)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i,
  );
  if (!select) {
    return fail(
      "This little lab understands SELECT … FROM … [WHERE …] [ORDER BY …] [LIMIT n], plus SHOW TABLES and DESCRIBE <table>. Check your spelling and try again.",
    );
  }

  const [, rawColumns, rawTable, rawWhere, rawOrder, rawDirection, rawLimit] = select;
  const table = SAMPLE_TABLES[rawTable.toLowerCase()];
  if (!table) return fail(`Unknown table "${rawTable}". Available: ${Object.keys(SAMPLE_TABLES).join(", ")}.`);

  const wantsCount = /^\s*count\s*\(\s*\*\s*\)\s*$/i.test(rawColumns);
  let columns: string[];
  if (wantsCount) columns = ["count"];
  else if (rawColumns.trim() === "*") columns = [...table.columns];
  else {
    columns = rawColumns.split(",").map((column) => column.trim().toLowerCase());
    for (const column of columns) {
      if (!table.columns.includes(column)) return fail(`Unknown column "${column}" in ${rawTable}. Try DESCRIBE ${rawTable}.`);
    }
  }

  let rows = [...table.rows];
  if (rawWhere) {
    const conditions = rawWhere.split(/\s+and\s+/i);
    for (const condition of conditions) {
      const match = condition.trim().match(/^([a-z_][a-z0-9_]*)\s*(=|!=|<>|>=|<=|>|<)\s*('([^']*)'|"([^"]*)"|(-?\d+(?:\.\d+)?))$/i);
      if (!match) return fail(`Could not understand WHERE condition "${condition.trim()}". Use e.g. city = 'Accra' AND joined >= 2023.`);
      const [, column, operator, , singleQuoted, doubleQuoted, numeric] = match;
      if (!table.columns.includes(column.toLowerCase())) return fail(`Unknown column "${column}" in WHERE.`);
      const value: string | number = numeric != null ? Number(numeric) : (singleQuoted ?? doubleQuoted ?? "");
      rows = rows.filter((row) => compare(row[column.toLowerCase()], operator, value));
    }
  }

  if (rawOrder) {
    const orderColumn = rawOrder.toLowerCase();
    if (!table.columns.includes(orderColumn)) return fail(`Unknown column "${rawOrder}" in ORDER BY.`);
    const direction = (rawDirection ?? "ASC").toUpperCase() === "DESC" ? -1 : 1;
    rows.sort((a, b) => {
      const left = a[orderColumn];
      const right = b[orderColumn];
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left).localeCompare(String(right)) * direction;
    });
  }

  if (rawLimit) rows = rows.slice(0, Math.max(0, Number(rawLimit)));

  if (wantsCount) {
    return { ok: true, message: "1 row", columns: ["count"], rows: [{ count: rows.length }], ms: performance.now() - started };
  }
  const projected = rows.map((row) => {
    const out: Row = {};
    for (const column of columns) out[column] = row[column];
    return out;
  });
  return {
    ok: true,
    message: `${projected.length} row${projected.length === 1 ? "" : "s"}`,
    columns,
    rows: projected,
    ms: performance.now() - started,
  };
}

export function SqlLab({ courseId, lessonId, lessonTitle, samples }: ToolProps) {
  const key = storageKey(courseId, lessonId, "sql-lab");
  const [query, setQuery] = usePersistentState(key, starterFor("sql-lab", lessonTitle));
  const [result, setResult] = useState<SqlResult | null>(null);

  return (
    <div className="grid gap-4">
      <SampleLoader samples={samples} match={["sql", "postgres", "mysql"]} onLoad={setQuery} />
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Tables:</span>
        {Object.keys(SAMPLE_TABLES).map((name) => (
          <span key={name} className="rounded-full bg-[#f0edf3] px-2.5 py-1 font-mono text-[10.5px] font-bold text-[#5d5763]">
            {name}
          </span>
        ))}
      </div>
      <CodeArea value={query} onChange={setQuery} rows={5} label="Your query" language="sql" />
      <div className="flex flex-wrap items-center gap-2">
        <RunButton onClick={() => setResult(runQuery(query))}>Run query</RunButton>
        <GhostButton onClick={() => setQuery(starterFor("sql-lab", lessonTitle))}>Reset starter</GhostButton>
      </div>
      {result ? (
        result.ok ? (
          <div className="overflow-hidden rounded-2xl border border-[#ddd8e4]">
            <div className="flex items-center gap-2 border-b border-[#eeeaf2] bg-[#f6fbf8] px-4 py-2.5">
              <Icon name="check" size={13} className="text-emerald-600" />
              <span className="text-[11px] font-extrabold text-emerald-700">{result.message}</span>
              <span className="ml-auto flex items-center gap-2 font-mono text-[10px] text-[#8b8494]">
                {result.ms.toFixed(1)} ms <CopyButton text={JSON.stringify(result.rows, null, 2)} label="Copy rows" />
              </span>
            </div>
            <div className="dashboard-scroll max-h-64 overflow-auto">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead className="sticky top-0 bg-[#f4f1f8]">
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="border-b border-[#e4e0e9] px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-[#5b5566]">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={index} className={index % 2 ? "bg-[#fbfafc]" : "bg-white"}>
                      {result.columns.map((column) => (
                        <td key={column} className="border-b border-[#f0edf3] px-4 py-2 font-mono text-[#4f4958]">
                          {String(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {result.rows.length === 0 && (
                    <tr>
                      <td colSpan={result.columns.length} className="px-4 py-6 text-center font-sans text-[12px] font-semibold text-[#8b8494]">
                        No rows matched. Loosen the WHERE and try again.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 text-[12px] font-semibold leading-6 text-[#a34a1d]">
            {result.message}
          </p>
        )
      ) : (
        <p className="rounded-2xl border border-dashed border-[#d5cfe0] bg-[#faf9fc] px-4 py-5 text-center text-[12px] font-semibold text-[#8b8494]">
          Press <strong className="text-[#5032c2]">Run query</strong> — the rows appear here.
        </p>
      )}
      <div className="grid gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Try these:</span>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {SQL_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                setResult(runQuery(example));
              }}
              className="rounded-xl border border-[#e4e0e9] bg-white px-3 py-2 text-left font-mono text-[11px] leading-5 text-[#4f4958] transition hover:border-violet-300 hover:bg-[#faf9ff]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      <Hint>SHOW TABLES and DESCRIBE customers work too. Real databases add JOINs, indexes and transactions — this lab teaches the reading half: SELECT, WHERE, ORDER BY and LIMIT.</Hint>
    </div>
  );
}
