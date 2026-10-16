"use client";

import { useMemo, useState } from "react";
import Icon from "../Icon";
import { starterFor } from "@/lib/lesson-tools";
import {
  Chip,
  CodeArea,
  CopyButton,
  Field,
  GhostButton,
  Hint,
  RunButton,
  darkInputClass,
  inputClass,
  storageKey,
  usePersistentState,
  type ToolProps,
} from "./shared";

/* -------------------------------------------------------------------------- */
/* API sandbox — a mock REST server in memory                                  */
/* -------------------------------------------------------------------------- */

interface MockUser {
  id: number;
  name: string;
  email: string;
}

const SEED_USERS: MockUser[] = [
  { id: 1, name: "Ama Serwaa", email: "ama@example.com" },
  { id: 2, name: "Kofi Mensah", email: "kofi@example.com" },
  { id: 3, name: "Efua Adu", email: "efua@example.com" },
];

const SEED_COURSES = [
  { id: "web-foundations", title: "Web Development Foundations", lessons: 7 },
  { id: "javascript-zero-to-builder", title: "JavaScript: Zero to Builder", lessons: 7 },
];

const STATUS_REFERENCE: Array<{ code: number; name: string; whose: "yours" | "theirs" | "—"; meaning: string }> = [
  { code: 200, name: "OK", whose: "—", meaning: "The normal success. The body holds what you asked for." },
  { code: 201, name: "Created", whose: "—", meaning: "Your POST worked and something new exists. Check the Location header." },
  { code: 204, name: "No Content", whose: "—", meaning: "Success with nothing to return — typical after a DELETE." },
  { code: 301, name: "Moved Permanently", whose: "—", meaning: "This moved for good. Update the URL you call." },
  { code: 304, name: "Not Modified", whose: "—", meaning: "Your cached copy is still fresh — no body sent." },
  { code: 400, name: "Bad Request", whose: "yours", meaning: "The server could not understand what you sent. Fix the request." },
  { code: 401, name: "Unauthorized", whose: "yours", meaning: "I don't know who you are — authenticate and retry." },
  { code: 403, name: "Forbidden", whose: "yours", meaning: "I know who you are, and you may not do this." },
  { code: 404, name: "Not Found", whose: "yours", meaning: "Nothing lives at this path. Check the URL or the id." },
  { code: 422, name: "Unprocessable Entity", whose: "yours", meaning: "Valid JSON, but the data failed the rules (missing name, bad email…)." },
  { code: 429, name: "Too Many Requests", whose: "yours", meaning: "Slow down — you hit the rate limit. Back off and retry." },
  { code: 500, name: "Internal Server Error", whose: "theirs", meaning: "Their program crashed. Nothing you can fix from your side." },
  { code: 502, name: "Bad Gateway", whose: "theirs", meaning: "A proxy could not reach the app behind it." },
  { code: 503, name: "Service Unavailable", whose: "theirs", meaning: "Overloaded or down for maintenance. Retry later." },
];

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface MockResponse {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: unknown;
  ms: number;
}

function statusTextFor(code: number): string {
  return STATUS_REFERENCE.find((entry) => entry.code === code)?.name ?? "Unknown";
}

export function ApiLab({ courseId, lessonId }: ToolProps) {
  const [users, setUsers] = useState<MockUser[]>(SEED_USERS);
  const [method, setMethod] = useState<Method>("GET");
  const [endpoint, setEndpoint] = useState("/api/users");
  const [idValue, setIdValue] = useState("2");
  const [body, setBody] = usePersistentState(storageKey(courseId, lessonId, "api-lab", "body"), '{\n  "name": "Yaw Owusu",\n  "email": "yaw@example.com"\n}');
  const [response, setResponse] = useState<MockResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [showCodes, setShowCodes] = useState(false);

  const needsId = endpoint === "/api/users/:id";
  const needsBody = method === "POST" || method === "PUT";
  const path = needsId ? `/api/users/${idValue.trim() || "?"}` : endpoint;

  function send() {
    if (sending) return;
    setSending(true);
    const started = performance.now();
    // A beat of latency, so it feels like a network — and status is readable.
    window.setTimeout(() => {
      let status = 200;
      let payload: unknown = null;
      const headers: Array<[string, string]> = [["Content-Type", "application/json; charset=utf-8"]];

      const id = Number(idValue);
      const wantsJsonBody = needsBody;
      let parsed: Record<string, unknown> | null = null;
      if (wantsJsonBody) {
        try {
          const value: unknown = JSON.parse(body);
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("not an object");
          parsed = value as Record<string, unknown>;
        } catch {
          status = 400;
          payload = { error: "Malformed JSON — the server could not parse your body." };
        }
      }

      if (payload == null) {
        if (endpoint === "/api/users" && method === "GET") {
          payload = users;
        } else if (endpoint === "/api/users" && method === "POST" && parsed) {
          const name = String(parsed.name ?? "").trim();
          const email = String(parsed.email ?? "").trim();
          if (!name || !email) {
            status = 422;
            payload = { error: "Validation failed", details: { name: name ? undefined : "required", email: email ? undefined : "required" } };
          } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            status = 422;
            payload = { error: "Validation failed", details: { email: "must look like an email address" } };
          } else {
            const created = { id: Math.max(0, ...users.map((user) => user.id)) + 1, name, email };
            setUsers((current) => [...current, created]);
            status = 201;
            headers.push(["Location", `/api/users/${created.id}`]);
            payload = created;
          }
        } else if (endpoint === "/api/courses" && method === "GET") {
          payload = SEED_COURSES;
        } else if (needsId && !Number.isInteger(id)) {
          status = 400;
          payload = { error: "The id must be a number." };
        } else if (needsId && method === "GET") {
          const found = users.find((user) => user.id === id);
          if (found) payload = found;
          else {
            status = 404;
            payload = { error: `No user with id ${id}.` };
          }
        } else if (needsId && method === "PUT" && parsed) {
          const index = users.findIndex((user) => user.id === id);
          if (index === -1) {
            status = 404;
            payload = { error: `No user with id ${id}.` };
          } else {
            const next = [...users];
            next[index] = {
              ...next[index],
              ...(typeof parsed.name === "string" && parsed.name.trim() ? { name: parsed.name.trim() } : {}),
              ...(typeof parsed.email === "string" && parsed.email.trim() ? { email: parsed.email.trim() } : {}),
            };
            setUsers(next);
            payload = next[index];
          }
        } else if (needsId && method === "DELETE") {
          if (!users.some((user) => user.id === id)) {
            status = 404;
            payload = { error: `No user with id ${id} — nothing to delete.` };
          } else {
            setUsers((current) => current.filter((user) => user.id !== id));
            status = 204;
            payload = null;
          }
        } else {
          status = endpoint === "/api/courses" && method !== "GET" ? 405 : 404;
          payload = { error: status === 405 ? `${method} is not allowed here — this endpoint is read-only.` : `Nothing lives at ${method} ${path}.` };
        }
      }

      setResponse({ status, statusText: statusTextFor(status), headers, body: payload, ms: performance.now() - started + 180 });
      setSending(false);
    }, 180);
  }

  const statusClass =
    response == null
      ? ""
      : response.status < 300
        ? "bg-emerald-100 text-emerald-800"
        : response.status < 400
          ? "bg-sky-100 text-sky-800"
          : response.status < 500
            ? "bg-amber-100 text-amber-800"
            : "bg-rose-100 text-rose-800";

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-[#ddd8e4] bg-[#faf9fc] p-4">
        <div className="grid gap-3 sm:grid-cols-[130px_1fr_130px]">
          <Field label="Method">
            <select value={method} onChange={(event) => setMethod(event.target.value as Method)} className={inputClass}>
              {(["GET", "POST", "PUT", "DELETE"] as Method[]).map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Endpoint">
            <select value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className={inputClass}>
              <option value="/api/users">/api/users</option>
              <option value="/api/users/:id">/api/users/:id</option>
              <option value="/api/courses">/api/courses</option>
            </select>
          </Field>
          <Field label="id" hint={needsId ? "required" : "—"}>
            <input value={idValue} onChange={(event) => setIdValue(event.target.value)} disabled={!needsId} inputMode="numeric" className={inputClass} placeholder="2" />
          </Field>
        </div>
        <p className="rounded-xl bg-[#1b1822] px-3 py-2.5 font-mono text-[12px] text-[#d9d2e1]">
          <span className="font-black text-[#9fd8ff]">{method}</span> {path} <span className="text-[#6f6979]">HTTP/1.1</span>
        </p>
        {needsBody && (
          <CodeArea value={body} onChange={setBody} rows={4} label="Request body" language="json" dark={false} />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <RunButton onClick={send} disabled={sending} icon="globe">{sending ? "Sending…" : "Send request"}</RunButton>
          <GhostButton onClick={() => { setUsers(SEED_USERS); setResponse(null); }}>Reset server data</GhostButton>
          <GhostButton onClick={() => setShowCodes((value) => !value)}>
            <Icon name={showCodes ? "chevron-down" : "chevron-right"} size={13} /> Status codes
          </GhostButton>
        </div>
      </div>

      {response ? (
        <div className="overflow-hidden rounded-2xl border border-[#ddd8e4]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#eeeaf2] bg-white px-4 py-2.5">
            <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-black ${statusClass}`}>
              {response.status} {response.statusText}
            </span>
            <span className="font-mono text-[10px] text-[#8b8494]">{response.ms.toFixed(0)} ms (simulated)</span>
            <span className="ml-auto">
              <CopyButton text={JSON.stringify(response.body, null, 2)} label="Copy body" />
            </span>
          </div>
          <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
            <div className="border-b border-[#eeeaf2] bg-[#faf9fc] p-4 sm:border-b-0 sm:border-r">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Headers</p>
              <div className="grid gap-1.5 font-mono text-[11px] leading-5">
                {response.headers.map(([name, value]) => (
                  <p key={name} className="break-words text-[#4f4958]"><span className="font-bold text-[#2c2733]">{name}:</span> {value}</p>
                ))}
              </div>
            </div>
            <pre className="dashboard-scroll max-h-64 overflow-auto bg-[#1b1822] p-4 font-mono text-[12px] leading-6 text-[#d9d2e1]">
              {response.body == null ? "(empty body — 204 sends nothing back)" : JSON.stringify(response.body, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#d5cfe0] bg-[#faf9fc] px-4 py-5 text-center text-[12px] font-semibold text-[#8b8494]">
          Press <strong className="text-[#5032c2]">Send request</strong> — the mock server answers instantly.
        </p>
      )}

      {showCodes && (
        <div className="grid gap-2">
          {STATUS_REFERENCE.map((entry) => (
            <div key={entry.code} className="flex items-start gap-3 rounded-xl border border-[#e4e0e9] bg-white px-3 py-2.5">
              <span className="mt-0.5 shrink-0 rounded-md bg-[#1b1822] px-2 py-0.5 font-mono text-[11px] font-black text-white">{entry.code}</span>
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold text-[#2c2733]">
                  {entry.name}
                  {entry.whose !== "—" && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${entry.whose === "yours" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                      {entry.whose} fault
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11.5px] font-semibold leading-5 text-[#6b6478]">{entry.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Hint>
        Try to trigger each family: a 201 (POST a valid user), a 404 (GET user 99), a 422 (POST without an email) and a
        204 (DELETE someone). Reading status codes is half of debugging APIs.
      </Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* URL inspector                                                               */
/* -------------------------------------------------------------------------- */

const URL_EXAMPLES = [
  "https://shop.example.gh/products/phone?colour=black&sort=price#reviews",
  "https://api.example.com:443/v1/users?id=42&lang=en",
  "http://localhost:3000/learn/web-foundations/how-the-web-works",
];

export function UrlInspector({ courseId, lessonId }: ToolProps) {
  const [value, setValue] = usePersistentState(
    storageKey(courseId, lessonId, "url-inspector"),
    URL_EXAMPLES[0],
  );
  const parsed = useMemo(() => {
    try {
      const url = new URL(value.trim());
      const params: Array<[string, string]> = [];
      url.searchParams.forEach((paramValue, name) => params.push([name, paramValue]));
      return { ok: true as const, url, params };
    } catch {
      return { ok: false as const };
    }
  }, [value]);

  return (
    <div className="grid gap-4">
      <Field label="Paste any URL" hint="absolute URLs only">
        <input value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} className={inputClass} placeholder="https://…" />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Try:</span>
        {URL_EXAMPLES.map((example) => (
          <Chip key={example} onClick={() => setValue(example)} title={example}>
            {example.slice(0, 34)}…
          </Chip>
        ))}
      </div>
      {parsed.ok ? (
        <div className="grid gap-3">
          <div className="overflow-hidden rounded-2xl border border-[#ddd8e4]">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="bg-[#f4f1f8]">
                  <th className="border-b border-[#e4e0e9] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#5b5566]">Part</th>
                  <th className="border-b border-[#e4e0e9] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#5b5566]">Value</th>
                  <th className="hidden border-b border-[#e4e0e9] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#5b5566] sm:table-cell">Server sees it?</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  ["scheme", parsed.url.protocol.replace(/:$/, ""), "yes — picks the protocol"],
                  ["host", parsed.url.hostname, "yes — via DNS"],
                  ["port", parsed.url.port || "(default)", "yes — picks the program"],
                  ["path", parsed.url.pathname, "yes"],
                  ["query", parsed.url.search || "(none)", "yes — parameters"],
                  ["fragment", parsed.url.hash || "(none)", "NO — browser only"],
                ].map(([part, val, sees], index) => (
                  <tr key={part} className={index % 2 ? "bg-[#fbfafc]" : "bg-white"}>
                    <td className="border-b border-[#f0edf3] px-4 py-2 font-sans text-[11px] font-extrabold text-[#2c2733]">{part}</td>
                    <td className="break-all border-b border-[#f0edf3] px-4 py-2 text-[#4f4958]">{val}</td>
                    <td className={`hidden border-b border-[#f0edf3] px-4 py-2 font-sans text-[11px] font-bold sm:table-cell ${part === "fragment" ? "text-rose-600" : "text-emerald-700"}`}>{sees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-[#ddd8e4] bg-white p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">
              Query parameters ({parsed.params.length})
            </p>
            {parsed.params.length === 0 ? (
              <p className="text-[12px] font-semibold text-[#8b8494]">No query string — nothing after a <code>?</code>.</p>
            ) : (
              <div className="grid gap-1.5">
                {parsed.params.map(([name, paramValue], index) => (
                  <p key={`${name}-${index}`} className="rounded-lg bg-[#f6f4fa] px-3 py-1.5 font-mono text-[12px] text-[#4f4958]">
                    <span className="font-bold text-[#5d3be2]">{name}</span> = {paramValue || <span className="text-[#a19aa7]">(empty)</span>}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 text-[12px] font-semibold leading-6 text-[#a34a1d]">
          That is not a complete URL yet — it needs a scheme, like <code>https://</code>, and a host.
        </p>
      )}
      <Hint>The fragment (after #) never leaves your machine. Everything else — including the query string — is visible to the server, so never put secrets in a URL.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* JSON formatter                                                              */
/* -------------------------------------------------------------------------- */

export function JsonTool({ courseId, lessonId, lessonTitle }: ToolProps) {
  const [text, setText] = usePersistentState(storageKey(courseId, lessonId, "json-tool"), starterFor("json-tool", lessonTitle));
  const [notice, setNotice] = useState("");

  const verdict = useMemo(() => {
    try {
      const value: unknown = JSON.parse(text);
      const pretty = JSON.stringify(value, null, 2);
      const keys = typeof value === "object" && value !== null ? Object.keys(value).length : 0;
      return { ok: true as const, value, pretty, keys };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "Invalid JSON." };
    }
  }, [text]);

  function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (typeof value === "object" && value !== null) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(value).sort()) out[key] = sortKeys((value as Record<string, unknown>)[key]);
      return out;
    }
    return value;
  }

  return (
    <div className="grid gap-4">
      <CodeArea value={text} onChange={(value) => { setText(value); setNotice(""); }} rows={9} label="Your JSON" language="json" />
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton onClick={() => { if (verdict.ok) { setText(verdict.pretty); setNotice("Formatted with 2-space indent."); } }}>Format</GhostButton>
        <GhostButton onClick={() => { if (verdict.ok) { setText(JSON.stringify(verdict.value)); setNotice("Minified — whitespace removed."); } }}>Minify</GhostButton>
        <GhostButton onClick={() => { if (verdict.ok) { setText(JSON.stringify(sortKeys(verdict.value), null, 2)); setNotice("Keys sorted A–Z."); } }}>Sort keys</GhostButton>
        <GhostButton onClick={() => { setText(starterFor("json-tool", lessonTitle)); setNotice(""); }}>Reset sample</GhostButton>
        {verdict.ok && <CopyButton text={verdict.pretty} label="Copy pretty" />}
      </div>
      {verdict.ok ? (
        <div className="rounded-2xl border border-[#c9e6d6] bg-[#f6fbf8] px-4 py-3">
          <p className="flex items-center gap-2 text-[12px] font-extrabold text-emerald-700">
            <Icon name="check" size={14} /> Valid JSON
            <span className="ml-auto font-mono text-[10px] font-bold text-emerald-600">
              {verdict.keys} top-level key{verdict.keys === 1 ? "" : "s"} · {text.length} chars
            </span>
          </p>
          {notice && <p className="mt-1 text-[11px] font-semibold text-emerald-700">{notice}</p>}
        </div>
      ) : (
        <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 font-mono text-[12px] leading-6 text-[#a34a1d]">
          Invalid: {verdict.message}
        </p>
      )}
      <Hint>
        The classic JSON mistakes: trailing commas, single quotes instead of double, comments, and undefined. Paste an
        API response here whenever one confuses you — formatting it usually reveals the problem.
      </Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Regex tester                                                                */
/* -------------------------------------------------------------------------- */

const REGEX_PRESETS: Array<{ name: string; pattern: string; flags: string }> = [
  { name: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+", flags: "g" },
  { name: "Ghana phone", pattern: "(?:\\+233|0)(?:24|20|55|50|27|57|26|56)\\s?\\d{3}\\s?\\d{4}", flags: "g" },
  { name: "URL", pattern: "https?://[^\\s)]+", flags: "g" },
  { name: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g" },
  { name: "Words ≥ 6 letters", pattern: "\\b[a-zA-Z]{6,}\\b", flags: "g" },
];

interface RegexHit {
  match: string;
  index: number;
  groups: string[];
}

export function RegexLab({ courseId, lessonId, lessonTitle }: ToolProps) {
  const [pattern, setPattern] = usePersistentState(storageKey(courseId, lessonId, "regex-lab", "pattern"), REGEX_PRESETS[1].pattern);
  const [flags, setFlags] = usePersistentState(storageKey(courseId, lessonId, "regex-lab", "flags"), "g");
  const [sample, setSample] = usePersistentState(storageKey(courseId, lessonId, "regex-lab", "text"), starterFor("regex-lab", lessonTitle));

  const result = useMemo((): { ok: boolean; error?: string; hits?: RegexHit[]; ms?: number } => {
    let regex: RegExp;
    try {
      const cleanFlags = [...new Set(flags.replace(/[^gimsuy]/g, "").split(""))].join("");
      regex = new RegExp(pattern, cleanFlags.includes("g") ? cleanFlags : `${cleanFlags}g`);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Invalid pattern." };
    }
    try {
      const started = performance.now();
      const hits: RegexHit[] = [];
      for (const match of sample.matchAll(regex)) {
        hits.push({ match: match[0], index: match.index ?? 0, groups: match.slice(1) });
        if (hits.length >= 50) break;
      }
      return { ok: true, hits, ms: performance.now() - started };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Could not run the pattern." };
    }
  }, [pattern, flags, sample]);

  function toggleFlag(flag: string) {
    setFlags(flags.includes(flag) ? flags.replace(flag, "") : `${flags}${flag}`);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Pattern" hint="JavaScript flavour">
          <input value={pattern} onChange={(event) => setPattern(event.target.value)} spellCheck={false} className={inputClass} placeholder="e.g. \d+" />
        </Field>
        <Field label="Flags">
          <div className="flex gap-1.5">
            {["g", "i", "m"].map((flag) => (
              <button
                key={flag}
                type="button"
                onClick={() => toggleFlag(flag)}
                title={flag === "g" ? "global — find all" : flag === "i" ? "case-insensitive" : "multiline (^ and $ per line)"}
                className={`grid size-10 place-items-center rounded-xl border font-mono text-[13px] font-black transition ${flags.includes(flag) ? "border-[#6d4aff] bg-[#6d4aff] text-white" : "border-[#ddd8e4] bg-white text-[#8b8494]"}`}
              >
                {flag}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Presets:</span>
        {REGEX_PRESETS.map((preset) => (
          <Chip key={preset.name} onClick={() => { setPattern(preset.pattern); setFlags(preset.flags); }} title={preset.pattern}>
            {preset.name}
          </Chip>
        ))}
      </div>
      <Field label="Test text" hint="live — edit me">
        <textarea value={sample} onChange={(event) => setSample(event.target.value)} rows={4} spellCheck={false} className={inputClass} />
      </Field>
      {result.ok && result.hits ? (
        <div className="rounded-2xl border border-[#ddd8e4] bg-white p-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">
            {result.hits.length} match{result.hits.length === 1 ? "" : "es"} · {result.ms?.toFixed(2)} ms
          </p>
          {result.hits.length === 0 ? (
            <p className="text-[12px] font-semibold text-[#8b8494]">No matches. Loosen the pattern — or check the flags.</p>
          ) : (
            <div className="grid gap-1.5">
              {result.hits.map((hit, index) => (
                <p key={index} className="rounded-lg bg-[#f6f4fa] px-3 py-1.5 font-mono text-[12px] text-[#4f4958]">
                  <span className="font-black text-[#5d3be2]">“{hit.match}”</span>
                  <span className="text-[#a19aa7]"> at {hit.index}</span>
                  {hit.groups.length > 0 && hit.groups.some(Boolean) && (
                    <span className="text-[#a19aa7]"> · groups: {hit.groups.map((group) => group ?? "—").join(", ")}</span>
                  )}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 font-mono text-[12px] leading-6 text-[#a34a1d]">
          Invalid pattern: {result.error}
        </p>
      )}
      <Hint>Read a pattern out loud: “\d” is “a digit”, “+” is “one or more”, “\s?” is “maybe a space”. If you cannot say what yours means, simplify it until you can.</Hint>
    </div>
  );
}

/* Re-exported so the shell can share the dark input style in one place. */
export { darkInputClass };
