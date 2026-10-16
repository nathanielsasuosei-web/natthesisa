"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import LessonProse from "../LessonProse";
import { starterFor } from "@/lib/lesson-tools";
import {
  Chip,
  CopyButton,
  Field,
  GhostButton,
  Hint,
  inputClass,
  storageKey,
  usePersistentState,
  type ToolProps,
} from "./shared";

/* -------------------------------------------------------------------------- */
/* Colour studio                                                               */
/* -------------------------------------------------------------------------- */

function normaliseHex(raw: string): string | null {
  let hex = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.split("").map((char) => char + char).join("");
  return /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex.toLowerCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const part = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(light * 100)];
  const delta = max - min;
  const sat = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / delta + 2) / 6;
  else hue = ((r - g) / delta + 4) / 6;
  return [Math.round(hue * 360), Math.round(sat * 100), Math.round(light * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const second = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const first = 2 * l - second;
  const channel = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return first + (second - first) * 6 * t;
    if (t < 1 / 2) return second;
    if (t < 2 / 3) return first + (second - first) * (2 / 3 - t) * 6;
    return first;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function DesignLab({ courseId, lessonId }: ToolProps) {
  const [base, setBase] = usePersistentState(storageKey(courseId, lessonId, "design-lab", "base"), "#6d4aff");
  const [ink, setInk] = usePersistentState(storageKey(courseId, lessonId, "design-lab", "ink"), "#ffffff");
  const [copied, setCopied] = useState("");

  const baseHex = normaliseHex(base) ?? "#6d4aff";
  const inkHex = normaliseHex(ink) ?? "#ffffff";
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const ratio = contrastRatio(inkHex, baseHex);

  const harmony: Array<{ name: string; hex: string }> = [
    { name: "Base", hex: baseHex },
    { name: "Complement", hex: rgbToHex(...hslToRgb(h + 180, s, l)) },
    { name: "Analogous", hex: rgbToHex(...hslToRgb(h + 30, s, l)) },
    { name: "Analogous", hex: rgbToHex(...hslToRgb(h - 30, s, l)) },
    { name: "Triadic", hex: rgbToHex(...hslToRgb(h + 120, s, l)) },
  ];
  const shades = [85, 65, 45].map((light) => rgbToHex(...hslToRgb(h, s, light)));

  function copy(hex: string) {
    void navigator.clipboard?.writeText(hex).then(() => {
      setCopied(hex);
      window.setTimeout(() => setCopied(""), 1200);
    });
  }

  const badge = (ok: boolean, label: string) => (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${ok ? "bg-emerald-100 text-emerald-800" : "bg-[#f0edf3] text-[#8b8494]"}`}>
      {ok ? "✓ " : "✕ "}{label}
    </span>
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Background" hint="pick or type hex">
          <div className="flex gap-2">
            <input type="color" value={baseHex} onChange={(event) => setBase(event.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-[#ddd8e4] bg-white p-1" aria-label="Background colour" />
            <input value={base} onChange={(event) => setBase(event.target.value)} spellCheck={false} className={inputClass} placeholder="#6d4aff" />
          </div>
        </Field>
        <Field label="Text on top" hint="pick or type hex">
          <div className="flex gap-2">
            <input type="color" value={inkHex} onChange={(event) => setInk(event.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-[#ddd8e4] bg-white p-1" aria-label="Text colour" />
            <input value={ink} onChange={(event) => setInk(event.target.value)} spellCheck={false} className={inputClass} placeholder="#ffffff" />
          </div>
        </Field>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ddd8e4]">
        <div className="grid gap-0 sm:grid-cols-[1fr_220px]">
          <div className="p-5" style={{ background: baseHex, color: inkHex }}>
            <p className="text-xl font-black tracking-tight">The quick brown fox</p>
            <p className="mt-1 text-[13px] font-semibold opacity-90">This is what your pair looks like at body size. Squint: is it still readable?</p>
            <p className="mt-3 font-mono text-[11px] opacity-75">rgb({r}, {g}, {b}) · hsl({h}°, {s}%, {l}%)</p>
          </div>
          <div className="border-t border-[#eeeaf2] bg-white p-5 sm:border-l sm:border-t-0">
            <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Contrast</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-[#1d1922]">{ratio.toFixed(2)}<span className="text-sm font-bold text-[#8b8494]"> : 1</span></p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badge(ratio >= 4.5, "AA text")}
              {badge(ratio >= 7, "AAA text")}
              {badge(ratio >= 3, "AA large")}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#ddd8e4] bg-white p-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Harmony from your base — tap to copy</p>
        <div className="flex flex-wrap gap-2">
          {harmony.map((swatch, index) => (
            <button key={`${swatch.hex}-${index}`} type="button" onClick={() => copy(swatch.hex)} title={`${swatch.name} ${swatch.hex}`} className="group flex items-center gap-2 rounded-xl border border-[#e4e0e9] py-1.5 pl-1.5 pr-3 transition hover:border-violet-300">
              <span className="size-8 rounded-lg border border-black/10" style={{ background: swatch.hex }} />
              <span className="text-left">
                <span className="block text-[10px] font-extrabold text-[#2c2733]">{copied === swatch.hex ? "Copied!" : swatch.name}</span>
                <span className="block font-mono text-[10px] text-[#8b8494]">{swatch.hex}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Lighter tints</p>
        <div className="flex gap-2">
          {shades.map((hex) => (
            <button key={hex} type="button" onClick={() => copy(hex)} title={hex} className="h-10 flex-1 rounded-xl border border-black/10 transition hover:scale-[1.03]" style={{ background: hex }} />
          ))}
        </div>
      </div>
      <Hint>4.5 : 1 is the line for normal text (WCAG AA). Pretty but unreadable is not designed — it is decorated. Check every button and badge you ship.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Data explorer — CSV in, table + stats out                                   */
/* -------------------------------------------------------------------------- */

const SAMPLE_CSV = `shop,month,sales_ GHC,customers
Accra-Os,Jan,18400,212
Accra-Os,Feb,21150,238
Kumasi-Kej,Jan,16200,190
Kumasi-Kej,Feb,17880,205
Takoradi-Mkt,Jan,9400,121
Takoradi-Mkt,Feb,11230,139
Tamale-Central,Jan,7200,98
Tamale-Central,Feb,8450,111`;

function parseCsv(text: string): string[][] {
  const delimiter = text.includes(";") && !text.includes(",") ? ";" : text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const pushCell = () => { row.push(cell.trim()); cell = ""; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) pushCell();
    else if (char === "\n") { pushCell(); if (row.some((c) => c.length)) rows.push(row); row = []; }
    else if (char !== "\r") cell += char;
  }
  pushCell();
  if (row.some((c) => c.length)) rows.push(row);
  return rows;
}

export function DataLab({ courseId, lessonId }: ToolProps) {
  const [csv, setCsv] = usePersistentState(storageKey(courseId, lessonId, "data-lab"), SAMPLE_CSV);
  const [sortCol, setSortCol] = useState(0);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [filter, setFilter] = useState("");

  const table = useMemo(() => {
    const rows = parseCsv(csv);
    if (rows.length < 2) return null;
    const [head, ...body] = rows;
    const width = head.length;
    const clean = body.filter((row) => row.length === width);
    const needle = filter.trim().toLowerCase();
    const filtered = needle ? clean.filter((row) => row.join(" ").toLowerCase().includes(needle)) : clean;
    const sorted = [...filtered].sort((a, b) => {
      const left = a[sortCol] ?? "";
      const right = b[sortCol] ?? "";
      const leftNum = Number(left.replace(/[^0-9.\-]/g, ""));
      const rightNum = Number(right.replace(/[^0-9.\-]/g, ""));
      if (leftNum.toString().length > 0 && rightNum.toString().length > 0 && left.trim() !== "" && right.trim() !== "" && Number.isFinite(leftNum) && Number.isFinite(rightNum) && /^[\d\s,.\-]+$/.test(left) && /^[\d\s,.\-]+$/.test(right)) {
        return (leftNum - rightNum) * sortDir;
      }
      return left.localeCompare(right) * sortDir;
    });
    return { head, rows: sorted, skipped: body.length - clean.length };
  }, [csv, filter, sortCol, sortDir]);

  const stats = useMemo(() => {
    if (!table) return [];
    return table.head.map((name, index) => {
      const values = table.rows.map((row) => row[index] ?? "");
      const numbers = values.map((value) => Number(value.replace(/[^0-9.\-]/g, ""))).filter((n) => Number.isFinite(n));
      const allNumeric = values.length > 0 && values.every((value) => value.trim() !== "" && /^[\d\s,.\-]+$/.test(value));
      if (allNumeric && numbers.length) {
        const sum = numbers.reduce((a, b) => a + b, 0);
        return { name, text: `min ${Math.min(...numbers).toLocaleString()} · avg ${(sum / numbers.length).toLocaleString(undefined, { maximumFractionDigits: 1 })} · max ${Math.max(...numbers).toLocaleString()}` };
      }
      const counts = new Map<string, number>();
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([value, count]) => `${value} (${count})`).join(", ");
      return { name, text: `${counts.size} unique · top: ${top || "—"}` };
    });
  }, [table]);

  return (
    <div className="grid gap-4">
      <Field label="Paste spreadsheet data" hint="CSV — commas, semicolons or tabs">
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={6} spellCheck={false} className={inputClass} placeholder={'shop,month,sales\nAccra-Os,Jan,18400'} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton onClick={() => setCsv(SAMPLE_CSV)}>Load sample shops</GhostButton>
        <div className="ml-auto flex min-w-52 flex-1 items-center gap-2 sm:max-w-64">
          <Icon name="search" size={14} className="shrink-0 text-[#8b8494]" />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter rows…" className={inputClass} />
        </div>
      </div>
      {table ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-[#ddd8e4]">
            <div className="flex items-center gap-2 border-b border-[#eeeaf2] bg-[#f4f1f8] px-4 py-2.5">
              <span className="text-[11px] font-extrabold text-[#2c2733]">{table.rows.length} rows · {table.head.length} columns</span>
              {table.skipped > 0 && <span className="text-[10px] font-bold text-amber-700">({table.skipped} ragged row{table.skipped === 1 ? "" : "s"} skipped)</span>}
              <span className="ml-auto text-[10px] font-semibold text-[#8b8494]">tap a header to sort</span>
            </div>
            <div className="dashboard-scroll max-h-64 overflow-auto">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead className="sticky top-0 bg-[#f4f1f8]">
                  <tr>
                    {table.head.map((name, index) => (
                      <th key={index} className="border-b border-[#e4e0e9] px-4 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (sortCol === index) setSortDir((dir) => (dir === 1 ? -1 : 1));
                            else { setSortCol(index); setSortDir(1); }
                          }}
                          className="font-mono text-[10px] font-black uppercase tracking-wider text-[#5b5566] hover:text-[#5032c2]"
                        >
                          {name} {sortCol === index ? (sortDir === 1 ? "▲" : "▼") : ""}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 100).map((row, index) => (
                    <tr key={index} className={index % 2 ? "bg-[#fbfafc]" : "bg-white"}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border-b border-[#f0edf3] px-4 py-2 font-mono text-[#4f4958]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid gap-1.5">
            {stats.map((stat) => (
              <p key={stat.name} className="rounded-xl border border-[#e4e0e9] bg-white px-3 py-2 text-[11.5px] font-semibold text-[#4f4958]">
                <span className="font-mono font-black text-[#5d3be2]">{stat.name}</span>
                <span className="text-[#a19aa7]"> — </span>{stat.text}
              </p>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 text-[12px] font-semibold leading-6 text-[#a34a1d]">
          Need at least a header row and one data row, with the same number of cells each. Copy a block straight out of Excel or Google Sheets.
        </p>
      )}
      <Hint>Analysts read a dataset before they trust it: how many rows, which columns are numbers, what the top values are. This panel is that first glance.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Binary & bases lab                                                          */
/* -------------------------------------------------------------------------- */

function groupBits(bits: string): string {
  return bits.replace(/(.{4})(?=.)/g, "$1 ");
}

export function BinaryLab(_props: ToolProps) {
  void _props;
  const [mode, setMode] = useState<"numbers" | "text">("numbers");
  const [numInput, setNumInput] = useState("42");
  const [numBase, setNumBase] = useState<"10" | "2" | "16" | "8">("10");
  const [text, setText] = useState("Hi!");

  const number = useMemo(() => {
    const clean = numInput.trim().replace(/^0[xXbBoO]/, "").replace(/\s+/g, "");
    const radix = Number(numBase);
    const patterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^-?\d+$/, 16: /^[0-9a-fA-F]+$/ };
    const digits = patterns[radix];
    if (digits === undefined || !digits.test(clean)) return null;
    const value = parseInt(clean, radix);
    return Number.isSafeInteger(value) ? value : null;
  }, [numInput, numBase]);

  const textCodes = useMemo(() => {
    const chars = [...text];
    const bytes = new TextEncoder().encode(text);
    return {
      chars,
      binary: [...bytes].map((byte) => byte.toString(2).padStart(8, "0")).join(" "),
      hex: [...bytes].map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" "),
      decimal: chars.map((char) => char.codePointAt(0)).join(" "),
      base64: (() => { try { return btoa(String.fromCharCode(...bytes)); } catch { return "—"; } })(),
    };
  }, [text]);

  const powers = useMemo(() => {
    if (number == null || number < 0 || number > 255) return null;
    const parts: string[] = [];
    for (let bit = 7; bit >= 0; bit--) {
      if (number & (1 << bit)) parts.push(`2^${bit}=${1 << bit}`);
    }
    return parts;
  }, [number]);

  return (
    <div className="grid gap-4">
      <div className="flex gap-1.5 rounded-xl bg-[#f0edf3] p-1">
        {(["numbers", "text"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${mode === value ? "bg-white text-[#5032c2] shadow" : "text-[#8b8494]"}`}
          >
            {value === "numbers" ? "Numbers" : "Text → bytes"}
          </button>
        ))}
      </div>

      {mode === "numbers" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <Field label="Value" hint="type in the chosen base">
              <input value={numInput} onChange={(event) => setNumInput(event.target.value)} spellCheck={false} className={inputClass} placeholder="42" />
            </Field>
            <Field label="Base">
              <select value={numBase} onChange={(event) => setNumBase(event.target.value as "10" | "2" | "16" | "8")} className={inputClass}>
                <option value="10">Decimal</option>
                <option value="2">Binary</option>
                <option value="16">Hexadecimal</option>
                <option value="8">Octal</option>
              </select>
            </Field>
          </div>
          {number == null ? (
            <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 font-mono text-[12px] text-[#a34a1d]">
              “{numInput || "(empty)"}” is not valid base-{numBase}. Binary takes only 0 and 1; hex adds A–F.
            </p>
          ) : (
            <div className="grid gap-2">
              {[
                ["Decimal", number.toLocaleString()],
                ["Binary", groupBits(Math.abs(number).toString(2))],
                ["Hexadecimal", `0x${Math.abs(number).toString(16).toUpperCase()}`],
                ["Octal", `0o${Math.abs(number).toString(8)}`],
                ["8-bit", number >= 0 && number <= 255 ? groupBits(number.toString(2).padStart(8, "0")) : "out of 0–255 range"],
              ].map(([name, val]) => (
                <div key={name} className="flex items-center gap-3 rounded-xl border border-[#e4e0e9] bg-white px-3 py-2">
                  <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-[.1em] text-[#8b8494]">{name}</span>
                  <span className="min-w-0 flex-1 break-all font-mono text-[13px] font-bold text-[#2c2733]">{val}</span>
                  <CopyButton text={val} label="" />
                </div>
              ))}
              {powers && (
                <p className="rounded-xl bg-[#1b1822] px-3 py-2.5 font-mono text-[12px] leading-6 text-[#d9d2e1]">
                  {number} = {powers.length ? powers.join(" + ") : "0"}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Text" hint={`${textCodes.chars.length} characters · ${new TextEncoder().encode(text).length} UTF-8 bytes`}>
            <input value={text} onChange={(event) => setText(event.target.value)} className={inputClass} placeholder="Type something…" />
          </Field>
          <div className="grid gap-2">
            {[
              ["Binary (UTF-8)", textCodes.binary || "—"],
              ["Hex", textCodes.hex || "—"],
              ["Code points", textCodes.decimal || "—"],
              ["Base64", textCodes.base64],
            ].map(([name, val]) => (
              <div key={name} className="rounded-xl border border-[#e4e0e9] bg-white px-3 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[.1em] text-[#8b8494]">{name}</span>
                  <CopyButton text={val} label="" />
                </div>
                <p className="break-all font-mono text-[12.5px] leading-6 text-[#2c2733]">{val}</p>
              </div>
            ))}
          </div>
          <Hint>Try an emoji like 😀 and watch the byte count jump: one character, four bytes. That gap is why string length bugs exist.</Hint>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subnet calculator                                                           */
/* -------------------------------------------------------------------------- */

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const num = Number(part);
    if (num > 255) return null;
    out = (out << 8) + num;
  }
  return out >>> 0;
}

function intToIp(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
}

function isPrivateNet(network: number, prefix: number): boolean {
  const ranges: Array<[number, number]> = [
    [ipToInt("10.0.0.0")!, 8],
    [ipToInt("172.16.0.0")!, 12],
    [ipToInt("192.168.0.0")!, 16],
  ];
  return ranges.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (network & mask) >>> 0 === base && prefix >= bits;
  });
}

export function NetworkLab({ courseId, lessonId }: ToolProps) {
  const [cidr, setCidr] = usePersistentState(storageKey(courseId, lessonId, "network-lab"), "192.168.10.0/24");

  const calc = useMemo(() => {
    const match = cidr.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/);
    if (!match) return { ok: false as const, message: "Write it as address/prefix — e.g. 192.168.10.0/24." };
    const ip = ipToInt(match[1]);
    const prefix = Number(match[2]);
    if (ip == null) return { ok: false as const, message: "That address is not valid IPv4 — four numbers, 0–255 each." };
    if (prefix < 0 || prefix > 32) return { ok: false as const, message: "The prefix must be between /0 and /32." };
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? total : Math.max(0, total - 2);
    return {
      ok: true as const,
      network, broadcast, mask, prefix, total, usable,
      first: usable ? (network + 1) >>> 0 : network,
      last: usable ? (broadcast - 1) >>> 0 : broadcast,
      private: isPrivateNet(network, prefix),
      aligned: ip === network,
    };
  }, [cidr]);

  return (
    <div className="grid gap-4">
      <Field label="Network in CIDR notation" hint="address / prefix">
        <input value={cidr} onChange={(event) => setCidr(event.target.value)} spellCheck={false} className={inputClass} placeholder="192.168.10.0/24" />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Try:</span>
        {["192.168.1.0/24", "10.0.0.0/8", "172.16.5.0/26", "8.8.8.0/30"].map((example) => (
          <Chip key={example} onClick={() => setCidr(example)}>{example}</Chip>
        ))}
      </div>
      {calc.ok ? (
        <div className="grid gap-3">
          {!calc.aligned && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-semibold text-amber-800">
              Heads-up: that address is a host inside the range, so it was rounded down to the network address.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Network", intToIp(calc.network)],
              ["Broadcast", intToIp(calc.broadcast)],
              ["Subnet mask", intToIp(calc.mask)],
              ["Wildcard", intToIp((~calc.mask) >>> 0)],
              ["First usable", intToIp(calc.first)],
              ["Last usable", intToIp(calc.last)],
            ].map(([name, val]) => (
              <div key={name} className="flex items-center gap-3 rounded-xl border border-[#e4e0e9] bg-white px-3 py-2">
                <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-[.1em] text-[#8b8494]">{name}</span>
                <span className="font-mono text-[13px] font-bold text-[#2c2733]">{val}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#1b1822] px-4 py-3">
            <span className="font-mono text-[12px] font-bold text-[#d9d2e1]">
              /{calc.prefix} → {calc.total.toLocaleString()} addresses · {calc.usable.toLocaleString()} usable
            </span>
            <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${calc.private ? "bg-emerald-400/20 text-emerald-300" : "bg-sky-400/20 text-sky-300"}`}>
              {calc.private ? "private range" : "public range"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[30, 29, 24, 16].map((prefix) => (
              <button key={prefix} type="button" onClick={() => setCidr(`10.0.0.0/${prefix}`)} className="rounded-xl border border-[#e4e0e9] bg-white px-2 py-2 transition hover:border-violet-300">
                <span className="block font-mono text-[13px] font-black text-[#5032c2]">/{prefix}</span>
                <span className="block text-[10px] font-bold text-[#8b8494]">{(2 ** (32 - prefix) - 2).toLocaleString()} hosts</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 text-[12px] font-semibold text-[#a34a1d]">{calc.message}</p>
      )}
      <Hint>Each extra prefix bit halves the network: a /24 holds 254 hosts, a /25 holds 126, a /30 holds 2 — just enough for a point-to-point link.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Security toolkit — passwords, hashes, encodings, JWT                        */
/* -------------------------------------------------------------------------- */

function cyrb53Demo(input: string): string {
  // Non-cryptographic fallback for contexts without WebCrypto. Labelled as demo.
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

async function sha256Hex(input: string): Promise<string | null> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return null;
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(input));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

const JWT_SAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFtYSBTZXJ3YWEiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function SecurityLab({ courseId, lessonId }: ToolProps) {
  const [tab, setTab] = useState<"password" | "hash" | "codec" | "jwt">("password");
  const [length, setLength] = useState(16);
  const [sets, setSets] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [password, setPassword] = usePersistentState(storageKey(courseId, lessonId, "security-lab", "password"), "");
  const [hashInput, setHashInput] = usePersistentState(storageKey(courseId, lessonId, "security-lab", "hash"), "correct horse battery staple");
  const [hash, setHash] = useState("");
  const [hashDemo, setHashDemo] = useState(false);
  const [codecInput, setCodecInput] = usePersistentState(storageKey(courseId, lessonId, "security-lab", "codec"), "Hello, Accra! 🇬🇭");
  const [jwt, setJwt] = usePersistentState(storageKey(courseId, lessonId, "security-lab", "jwt"), JWT_SAMPLE);

  const poolSize = (sets.lower ? 26 : 0) + (sets.upper ? 26 : 0) + (sets.digits ? 10 : 0) + (sets.symbols ? 32 : 0);
  const entropy = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0;
  const strength = entropy >= 100 ? ["Excellent", "bg-emerald-500"] : entropy >= 70 ? ["Strong", "bg-emerald-400"] : entropy >= 50 ? ["Okay", "bg-amber-400"] : ["Weak", "bg-rose-400"];

  function generate() {
    const alphabet =
      (sets.lower ? "abcdefghijkmnopqrstuvwxyz" : "") +
      (sets.upper ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "") +
      (sets.digits ? "23456789" : "") +
      (sets.symbols ? "!@#$%^&*()-_=+[]{}<>?" : "");
    if (!alphabet) return;
    const random = new Uint32Array(length);
    globalThis.crypto?.getRandomValues(random);
    setPassword([...random].map((value) => alphabet[value % alphabet.length]).join(""));
  }

  useEffect(() => {
    let cancelled = false;
    void sha256Hex(hashInput).then((digest) => {
      if (cancelled) return;
      if (digest) { setHash(digest); setHashDemo(false); }
      else { setHash(cyrb53Demo(hashInput)); setHashDemo(true); }
    });
    return () => { cancelled = true; };
  }, [hashInput]);

  const codec = useMemo(() => {
    try {
      const bytes = new TextEncoder().encode(codecInput);
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      return { base64: btoa(binary), url: encodeURIComponent(codecInput), error: "" };
    } catch {
      return { base64: "—", url: "—", error: "Could not encode that text." };
    }
  }, [codecInput]);

  const decoded = useMemo(() => {
    const parts = jwt.trim().split(".");
    if (parts.length !== 3) return { ok: false as const, message: "A JWT has three base64url parts separated by dots." };
    try {
      const header = JSON.parse(base64UrlDecode(parts[0])) as Record<string, unknown>;
      const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
      const exp = typeof payload.exp === "number" ? new Date(payload.exp * 1000) : null;
      return { ok: true as const, header, payload, exp, expired: exp ? exp.getTime() < Date.now() : null, signature: parts[2] };
    } catch {
      return { ok: false as const, message: "Those parts are not valid base64url JSON." };
    }
  }, [jwt]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#f0edf3] p-1">
        {(["password", "hash", "codec", "jwt"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-extrabold transition ${tab === value ? "bg-white text-[#5032c2] shadow" : "text-[#8b8494]"}`}
          >
            {value === "password" ? "Passwords" : value === "hash" ? "Hash" : value === "codec" ? "Encodings" : "JWT decode"}
          </button>
        ))}
      </div>

      {tab === "password" && (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-extrabold text-[#2c2733]">Length: {length}</label>
            <input type="range" min={8} max={32} value={length} onChange={(event) => setLength(Number(event.target.value))} className="flex-1 accent-[#6d4aff]" aria-label="Password length" />
            {(Object.keys(sets) as Array<keyof typeof sets>).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSets((current) => ({ ...current, [name]: !current[name] }))}
                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition ${sets[name] ? "border-[#6d4aff] bg-[#6d4aff] text-white" : "border-[#ddd8e4] bg-white text-[#8b8494]"}`}
              >
                {name === "lower" ? "a-z" : name === "upper" ? "A-Z" : name === "digits" ? "0-9" : "#$?"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GhostButton onClick={generate}>Generate</GhostButton>
            {password && <CopyButton text={password} label="Copy password" />}
          </div>
          {password ? (
            <div className="grid gap-2 rounded-2xl bg-[#1b1822] p-4">
              <p className="break-all font-mono text-[15px] font-bold text-[#e8e2f0]">{password}</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${strength[1]}`} style={{ width: `${Math.min(100, entropy)}%` }} />
              </div>
              <p className="text-[11px] font-bold text-[#a89fb3]">{strength[0]} — about {entropy} bits of entropy. Longer beats cleverer, every time.</p>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#d5cfe0] bg-[#faf9fc] px-4 py-5 text-center text-[12px] font-semibold text-[#8b8494]">Press Generate — randomness does the remembering for you.</p>
          )}
          <Hint>Use a password manager, give every site its own password, and switch on two-factor where it matters. Nobody memorises 16 random characters — that is the point.</Hint>
        </div>
      )}

      {tab === "hash" && (
        <div className="grid gap-3">
          <Field label="Text to hash" hint="SHA-256, computed locally">
            <input value={hashInput} onChange={(event) => setHashInput(event.target.value)} className={inputClass} />
          </Field>
          <div className="rounded-2xl bg-[#1b1822] p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#6f6979]">{hashDemo ? "demo hash (no WebCrypto here)" : "SHA-256"}</span>
              <CopyButton text={hash} label="" />
            </div>
            <p className="break-all font-mono text-[12.5px] leading-6 text-[#9fd8ff]">{hash}</p>
          </div>
          <Hint>Change one letter and watch every character of the digest change — that avalanche is what makes hashes useful for passwords and file integrity. Real password storage adds salt and slowness (bcrypt, Argon2); plain SHA-256 is too fast for passwords.</Hint>
        </div>
      )}

      {tab === "codec" && (
        <div className="grid gap-3">
          <Field label="Text" hint="anything — try an emoji">
            <input value={codecInput} onChange={(event) => setCodecInput(event.target.value)} className={inputClass} />
          </Field>
          {[
            ["Base64", codec.base64],
            ["URL-encoded", codec.url],
          ].map(([name, val]) => (
            <div key={name} className="rounded-xl border border-[#e4e0e9] bg-white px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[.1em] text-[#8b8494]">{name}</span>
                <CopyButton text={val} label="" />
              </div>
              <p className="break-all font-mono text-[12.5px] leading-6 text-[#2c2733]">{val}</p>
            </div>
          ))}
          <Hint>Encoding is not encryption: Base64 hides nothing, it just makes bytes safe for text-only places (email, JSON, URLs). Anyone can decode it — never “protect” secrets this way.</Hint>
        </div>
      )}

      {tab === "jwt" && (
        <div className="grid gap-3">
          <Field label="Paste a token" hint="header.payload.signature">
            <textarea value={jwt} onChange={(event) => setJwt(event.target.value)} rows={3} spellCheck={false} className={inputClass} />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            <Chip onClick={() => setJwt(JWT_SAMPLE)}>Load sample token</Chip>
          </div>
          {decoded.ok ? (
            <div className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#ddd8e4] bg-white p-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[.1em] text-[#8b8494]">Header</p>
                  <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-5 text-[#4f4958]">{JSON.stringify(decoded.header, null, 2)}</pre>
                </div>
                <div className="rounded-2xl border border-[#ddd8e4] bg-white p-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[.1em] text-[#8b8494]">Payload (claims)</p>
                  <pre className="whitespace-pre-wrap break-words font-mono text-[11.5px] leading-5 text-[#4f4958]">{JSON.stringify(decoded.payload, null, 2)}</pre>
                </div>
              </div>
              <p className="rounded-xl bg-[#1b1822] px-3 py-2.5 font-mono text-[11.5px] leading-5 text-[#d9d2e1]">
                signature: {decoded.signature.slice(0, 24)}… · {decoded.exp ? (decoded.expired ? `expired ${decoded.exp.toLocaleDateString()}` : `valid until ${decoded.exp.toLocaleString()}`) : "no expiry claim (exp) — it never expires"}
              </p>
              <Hint>Anyone can read a JWT — decoding is not verifying. The signature only means something when the server checks it against its secret. Never put secrets in a payload.</Hint>
            </div>
          ) : (
            <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 text-[12px] font-semibold text-[#a34a1d]">{decoded.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Git simulator — a tiny repo that cannot break                               */
/* -------------------------------------------------------------------------- */

interface SimFile {
  name: string;
  state: "clean" | "modified" | "staged" | "untracked";
}

interface SimCommit {
  id: string;
  message: string;
  branch: string;
}

interface TranscriptLine {
  kind: "in" | "out" | "err" | "ok";
  text: string;
}

const GIT_TASKS = ["Run git status", "Stage a file with git add", "Make a commit", "Create a branch"];

export function GitLab() {
  const [files, setFiles] = useState<SimFile[]>([
    { name: "README.md", state: "clean" },
    { name: "index.html", state: "modified" },
    { name: "notes.txt", state: "untracked" },
  ]);
  const [commits, setCommits] = useState<SimCommit[]>([{ id: "a1b2c3d", message: "First commit", branch: "main" }]);
  const [branch, setBranch] = useState("main");
  const [branches, setBranches] = useState(["main"]);
  const [counter, setCounter] = useState(1);
  const [input, setInput] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { kind: "out", text: "A practice repo, ready to break safely. Type “help”." },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [transcript]);

  function mark(task: string) {
    setDone((current) => (current.includes(task) ? current : [...current, task]));
  }

  function execute(raw: string) {
    const line = raw.trim();
    const next: TranscriptLine[] = [{ kind: "in", text: `$ ${line || ""}` }];
    if (!line) {
      setTranscript((current) => [...current.slice(-99), ...next]);
      return;
    }
    const [command, ...rest] = line.split(/\s+/);
    if (command !== "git") {
      next.push({ kind: "err", text: `This little terminal only speaks git — try “git status”.` });
      setTranscript((current) => [...current.slice(-99), ...next]);
      return;
    }
    const sub = rest[0] ?? "";
    if (sub === "help" || sub === "--help" || !sub) {
      next.push({ kind: "out", text: "status · add <file|.> · commit -m \"msg\" · log · branch · checkout <name> · checkout -b <name>" });
    } else if (sub === "status") {
      mark(GIT_TASKS[0]);
      const staged = files.filter((file) => file.state === "staged");
      const modified = files.filter((file) => file.state === "modified");
      const untracked = files.filter((file) => file.state === "untracked");
      next.push({ kind: "out", text: `On branch ${branch}` });
      if (!staged.length && !modified.length && !untracked.length) next.push({ kind: "ok", text: "nothing to commit, working tree clean" });
      if (staged.length) next.push({ kind: "ok", text: `staged: ${staged.map((file) => file.name).join(", ")}` });
      if (modified.length) next.push({ kind: "out", text: `modified: ${modified.map((file) => file.name).join(", ")}` });
      if (untracked.length) next.push({ kind: "err", text: `untracked: ${untracked.map((file) => file.name).join(", ")}` });
    } else if (sub === "add") {
      const target = rest[1];
      if (!target) next.push({ kind: "err", text: "Tell me what to stage: git add <file> or git add ." });
      else {
        const names = target === "." ? files.filter((file) => file.state !== "clean" && file.state !== "staged").map((file) => file.name) : [target];
        const known = names.filter((name) => files.some((file) => file.name === name && file.state !== "clean" && file.state !== "staged"));
        const unknown = names.filter((name) => !files.some((file) => file.name === name));
        if (unknown.length) next.push({ kind: "err", text: `No such file: ${unknown.join(", ")}` });
        if (!known.length && !unknown.length) next.push({ kind: "out", text: "Nothing to stage — everything is already staged or clean." });
        if (known.length) {
          setFiles((current) => current.map((file) => (known.includes(file.name) ? { ...file, state: "staged" as const } : file)));
          mark(GIT_TASKS[1]);
          next.push({ kind: "ok", text: `staged: ${known.join(", ")}` });
        }
      }
    } else if (sub === "commit") {
      const message = line.match(/-m\s+["'](.+?)["']/)?.[1] ?? rest.slice(1).join(" ").replace(/^-m\s*/, "").trim();
      const staged = files.filter((file) => file.state === "staged");
      if (!staged.length) next.push({ kind: "err", text: "Nothing staged — git add a file first." });
      else if (!message) next.push({ kind: "err", text: "Give it a message: git commit -m \"describe the change\"" });
      else {
        const id = `${(0xa1b2c30 + counter * 7919).toString(16).slice(-7)}`;
        setCounter((value) => value + 1);
        setCommits((current) => [{ id, message, branch }, ...current]);
        setFiles((current) => current.map((file) => (file.state === "staged" ? { ...file, state: "clean" as const } : file)));
        mark(GIT_TASKS[2]);
        next.push({ kind: "ok", text: `[${branch} ${id}] ${message}` });
        next.push({ kind: "out", text: `${staged.length} file${staged.length === 1 ? "" : "s"} changed` });
      }
    } else if (sub === "log") {
      for (const commit of commits.slice(0, 8)) {
        next.push({ kind: commit.branch === branch ? "ok" : "out", text: `${commit.id} (${commit.branch}) ${commit.message}` });
      }
    } else if (sub === "branch") {
      for (const name of branches) next.push({ kind: name === branch ? "ok" : "out", text: `${name === branch ? "* " : "  "}${name}` });
    } else if (sub === "checkout") {
      if (rest[1] === "-b" && rest[2]) {
        const name = rest[2];
        if (branches.includes(name)) next.push({ kind: "err", text: `Branch ${name} already exists.` });
        else {
          setBranches((current) => [...current, name]);
          setBranch(name);
          mark(GIT_TASKS[3]);
          next.push({ kind: "ok", text: `Switched to a new branch '${name}'` });
        }
      } else if (rest[1]) {
        if (!branches.includes(rest[1])) next.push({ kind: "err", text: `Branch ${rest[1]} does not exist — try checkout -b ${rest[1]}.` });
        else {
          setBranch(rest[1]);
          next.push({ kind: "ok", text: `Switched to branch '${rest[1]}'` });
        }
      } else next.push({ kind: "err", text: "checkout what? A branch name, or -b <new-name>." });
    } else {
      next.push({ kind: "err", text: `Unknown git command “${sub}”. This simulator knows: status, add, commit, log, branch, checkout.` });
    }
    setTranscript((current) => [...current.slice(-99), ...next]);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {GIT_TASKS.map((task) => (
          <p key={task} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold ${done.includes(task) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#e4e0e9] bg-white text-[#5d5763]"}`}>
            <Icon name={done.includes(task) ? "check" : "clock"} size={13} /> {task}
          </p>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1822]">
        <div className="flex h-9 items-center border-b border-white/[.07] px-4">
          <div className="code-dots" />
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[.12em] text-[#6f6979]">practice repo · {branch}</span>
        </div>
        <div ref={scrollRef} className="dashboard-scroll h-56 overflow-y-auto p-4 font-mono text-[12px] leading-6" aria-live="polite">
          {transcript.map((line, index) => (
            <p key={index} className={line.kind === "in" ? "font-bold text-[#9fd8ff]" : line.kind === "err" ? "text-[#ff9d9d]" : line.kind === "ok" ? "text-[#7fe0b2]" : "text-[#d9d2e1]"}>
              {line.text}
            </p>
          ))}
        </div>
        <form
          onSubmit={(event) => { event.preventDefault(); execute(input); setInput(""); }}
          className="flex items-center gap-2 border-t border-white/[.07] px-4 py-3"
        >
          <span className="shrink-0 font-mono text-[12px] font-bold text-[#8b7fd0]">you@lab ({branch})$</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder='git status'
            aria-label="Git command"
            className="w-full bg-transparent font-mono text-[12.5px] text-[#e8e2f0] outline-none placeholder:text-[#6f6979]"
          />
        </form>
      </div>
      <Hint>The loop is always the same: change files, stage what belongs together with add, snapshot it with commit. Branches are just named starting points — cheap to make, safe to throw away.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cron explainer                                                              */
/* -------------------------------------------------------------------------- */

const CRON_PRESETS: Array<{ name: string; expr: string }> = [
  { name: "Every minute", expr: "* * * * *" },
  { name: "Hourly", expr: "0 * * * *" },
  { name: "Daily 6:00", expr: "0 6 * * *" },
  { name: "Weekdays 9:00", expr: "0 9 * * 1-5" },
  { name: "Monthly, 1st at midnight", expr: "0 0 1 * *" },
  { name: "Every 15 min", expr: "*/15 * * * *" },
];

function parseCronField(field: string, min: number, max: number): Set<number> | null {
  const out = new Set<number>();
  for (const chunk of field.split(",")) {
    const [range, stepRaw] = chunk.split("/");
    const step = stepRaw ? Number(stepRaw) : 1;
    if (!Number.isInteger(step) || step < 1) return null;
    let start = min;
    let end = max;
    if (range === "*") { /* whole range */ }
    else if (range.includes("-")) {
      const [a, b] = range.split("-").map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < min || b > max || a > b) return null;
      start = a; end = b;
    } else {
      const value = Number(range);
      if (!Number.isInteger(value) || value < min || value > max) return null;
      start = value; end = value;
    }
    for (let value = start; value <= end; value += step) out.add(value);
  }
  return out.size ? out : null;
}

const CRON_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CRON_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function describeCronField(field: string, unit: string, names?: string[]): string {
  if (field === "*") return `every ${unit}`;
  if (field.startsWith("*/")) return `every ${field.slice(2)} ${unit}s`;
  const parts = field.split(",").map((chunk) => {
    if (chunk.includes("-")) {
      const [a, b] = chunk.split("-").map(Number);
      return `${names?.[a] ?? a}–${names?.[b] ?? b}`;
    }
    const num = Number(chunk);
    return names?.[num] ?? chunk;
  });
  return `${unit} ${parts.join(", ")}`;
}

export function CronLab({ courseId, lessonId }: ToolProps) {
  const [expr, setExpr] = usePersistentState(storageKey(courseId, lessonId, "cron-lab"), "0 9 * * 1-5");

  const analysis = useMemo(() => {
    const fields = expr.trim().split(/\s+/);
    if (fields.length !== 5) return { ok: false as const, message: "A schedule has five fields: minute hour day-of-month month day-of-week." };
    const [minute, hour, dom, month, dow] = fields;
    const minuteSet = parseCronField(minute, 0, 59);
    const hourSet = parseCronField(hour, 0, 23);
    const domSet = parseCronField(dom, 1, 31);
    const monthSet = parseCronField(month, 1, 12);
    const dowSet = parseCronField(dow === "7" ? "0" : dow, 0, 6);
    if (!minuteSet || !hourSet || !domSet || !monthSet || !dowSet) {
      return { ok: false as const, message: "One field is out of range. Minutes 0–59, hours 0–23, days 1–31, months 1–12, weekdays 0–6 (Sunday is 0)." };
    }
    const explanation = [
      describeCronField(minute, "minute"),
      describeCronField(hour, "hour"),
      describeCronField(dom, "day"),
      describeCronField(month, "month", ["", ...CRON_MONTHS]),
      describeCronField(dow, "weekday", CRON_DAYS),
    ];
    // Next runs: walk forward minute by minute, up to a week out.
    const runs: Date[] = [];
    const cursor = new Date();
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    const domStar = dom === "*";
    const dowStar = dow === "*";
    for (let i = 0; i < 7 * 24 * 60 && runs.length < 5; i++) {
      const domMatch = domSet.has(cursor.getDate());
      const dowMatch = dowSet.has(cursor.getDay());
      const dayMatch = domStar && dowStar ? true : domStar ? dowMatch : dowStar ? domMatch : domMatch || dowMatch;
      if (minuteSet.has(cursor.getMinutes()) && hourSet.has(cursor.getHours()) && monthSet.has(cursor.getMonth() + 1) && dayMatch) {
        runs.push(new Date(cursor));
      }
      cursor.setMinutes(cursor.getMinutes() + 1);
    }
    return { ok: true as const, explanation, runs };
  }, [expr]);

  return (
    <div className="grid gap-4">
      <Field label="Schedule" hint="minute · hour · day · month · weekday">
        <input value={expr} onChange={(event) => setExpr(event.target.value)} spellCheck={false} className={`${inputClass} text-center text-[15px] font-black tracking-wider`} placeholder="0 9 * * 1-5" />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {CRON_PRESETS.map((preset) => (
          <Chip key={preset.name} onClick={() => setExpr(preset.expr)} title={preset.expr}>{preset.name}</Chip>
        ))}
      </div>
      {analysis.ok ? (
        <div className="grid gap-3">
          <div className="grid gap-1.5 rounded-2xl bg-[#1b1822] p-4 font-mono text-[12px] leading-6 text-[#d9d2e1]">
            {analysis.explanation.map((line, index) => (
              <p key={index}><span className="font-black text-[#8b7fd0]">{["min", "hrs", "dom", "mon", "dow"][index]}</span> — {line}</p>
            ))}
          </div>
          <div className="rounded-2xl border border-[#ddd8e4] bg-white p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[.12em] text-[#8b8494]">Next runs (your time)</p>
            {analysis.runs.length === 0 ? (
              <p className="text-[12px] font-semibold text-[#8b8494]">Nothing in the next 7 days — this schedule is rarer than weekly.</p>
            ) : (
              <div className="grid gap-1.5">
                {analysis.runs.map((run, index) => (
                  <p key={index} className="rounded-lg bg-[#f6f4fa] px-3 py-1.5 font-mono text-[12px] font-bold text-[#2c2733]">
                    {CRON_DAYS[run.getDay()]} {run.toLocaleDateString()} · {run.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-[#f3d8c8] bg-[#fff9f5] px-4 py-3 text-[12px] font-semibold text-[#a34a1d]">{analysis.message}</p>
      )}
      <Hint>Read a schedule right to left: which weekdays, which months, which days — then the time. “0 9 * * 1-5” is “9:00, on weekdays”. The order never changes, so it is pure memorisation — five boxes.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Prompt builder                                                              */
/* -------------------------------------------------------------------------- */

const PROMPT_ROLES = ["Patient tutor", "Senior engineer", "Strict reviewer", "Explain-like-I-am-new friend", "Interview coach"];
const PROMPT_FORMATS = ["Numbered steps", "Short bullets", "A table", "Code with comments", "One short paragraph", "Questions back to me"];

export function PromptLab({ courseId, lessonId, lessonTitle }: ToolProps) {
  const [role, setRole] = usePersistentState(storageKey(courseId, lessonId, "prompt-lab", "role"), PROMPT_ROLES[0]);
  const [task, setTask] = usePersistentState(storageKey(courseId, lessonId, "prompt-lab", "task"), `Explain ${lessonTitle} to me.`);
  const [context, setContext] = usePersistentState(storageKey(courseId, lessonId, "prompt-lab", "context"), "I am a beginner learning to code in Ghana. I know a little HTML and JavaScript.");
  const [constraints, setConstraints] = usePersistentState(storageKey(courseId, lessonId, "prompt-lab", "rules"), "Use simple words. Give one small example I can try myself.");
  const [format, setFormat] = usePersistentState(storageKey(courseId, lessonId, "prompt-lab", "format"), PROMPT_FORMATS[0]);
  const [example, setExample] = usePersistentState(storageKey(courseId, lessonId, "prompt-lab", "example"), "");

  const assembled = useMemo(() => {
    const parts = [
      `You are a ${role.toLowerCase()}.`,
      "",
      `Task: ${task.trim() || "(describe what you want)"}`,
      "",
      `My context: ${context.trim() || "(who you are, what you know)"}`,
      "",
      `Rules: ${constraints.trim() || "(how to answer)"}`,
      "",
      `Format: answer as ${format.toLowerCase()}.`,
    ];
    if (example.trim()) parts.push("", `Here is an example of the kind of answer I want:\n${example.trim()}`);
    return parts.join("\n");
  }, [role, task, context, constraints, format, example]);

  const words = assembled.split(/\s+/).filter(Boolean).length;
  const checks: Array<[string, boolean]> = [
    ["A specific task (not just “help me”)", task.trim().length >= 12],
    ["Context about you", context.trim().length >= 12],
    ["At least one rule", constraints.trim().length >= 8],
    ["A format picked", true],
    ["An example answer (the power move)", example.trim().length >= 12],
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Role">
          <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
            {PROMPT_ROLES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>
        <Field label="Answer format">
          <select value={format} onChange={(event) => setFormat(event.target.value)} className={inputClass}>
            {PROMPT_FORMATS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Task" hint="the one job">
        <textarea value={task} onChange={(event) => setTask(event.target.value)} rows={2} className={inputClass} />
      </Field>
      <Field label="Context" hint="who you are, what you know">
        <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={2} className={inputClass} />
      </Field>
      <Field label="Rules" hint="how it must answer">
        <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={2} className={inputClass} />
      </Field>
      <Field label="Example (optional)" hint="show it what good looks like">
        <textarea value={example} onChange={(event) => setExample(event.target.value)} rows={2} className={inputClass} placeholder="Paste a short example of the answer style you want…" />
      </Field>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1b1822]">
        <div className="flex items-center border-b border-white/[.07] px-4 py-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#6f6979]">your prompt</span>
          <span className="ml-2 font-mono text-[9px] text-[#6f6979]">{words} words · ~{Math.round(words * 1.3)} tokens</span>
          <span className="ml-auto"><CopyButton text={assembled} label="Copy prompt" /></span>
        </div>
        <pre className="dashboard-scroll max-h-64 overflow-auto whitespace-pre-wrap p-4 text-[12.5px] leading-6 text-[#e8e2f0]">{assembled}</pre>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {checks.map(([label, passed]) => (
          <p key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11.5px] font-bold ${passed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#e4e0e9] bg-white text-[#8b8494]"}`}>
            <Icon name={passed ? "check" : "clock"} size={13} /> {label}
          </p>
        ))}
      </div>
      <Hint>Vague prompts get vague answers. The formula that works everywhere: role + specific task + your context + rules + format. Paste the result into Natthesisa or any AI and compare with asking plainly.</Hint>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Practice notebook                                                           */
/* -------------------------------------------------------------------------- */

export function NotesLab({ courseId, lessonId, lessonTitle, challenge }: ToolProps) {
  const [notes, setNotes] = usePersistentState(storageKey(courseId, lessonId, "notes-lab"), starterFor("notes-lab", lessonTitle));
  const [preview, setPreview] = useState(false);
  const words = notes.split(/\s+/).filter(Boolean).length;

  function download() {
    const blob = new Blob([`# ${lessonTitle}\n\n${notes}\n`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lessonId}-notes.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-[#f0edf3] p-1">
          {(["Write", "Preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPreview(mode === "Preview")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${preview === (mode === "Preview") ? "bg-white text-[#5032c2] shadow" : "text-[#8b8494]"}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-bold text-[#a19aa7]">{words} words · saved in this browser</span>
        <div className="ml-auto flex gap-1.5">
          <GhostButton onClick={() => setNotes(`${notes.trim()}\n\nChallenge: ${challenge}`)}>Insert challenge</GhostButton>
          <GhostButton onClick={download}>Download</GhostButton>
        </div>
      </div>
      {preview ? (
        <div className="min-h-52 rounded-2xl border border-[#ddd8e4] bg-white p-5">
          {notes.trim() ? <LessonProse text={notes} label={lessonTitle} /> : <p className="text-[12px] font-semibold text-[#8b8494]">Nothing written yet.</p>}
        </div>
      ) : (
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={10}
          spellCheck
          placeholder="Explain the lesson back in your own words…"
          className={`${inputClass} min-h-52 leading-7`}
        />
      )}
      <Hint>
        Writing beats re-reading: learners who summarise a lesson from memory remember roughly twice as much a week
        later. Use **bold**, `code` and - bullets — the preview renders them.
      </Hint>
    </div>
  );
}
