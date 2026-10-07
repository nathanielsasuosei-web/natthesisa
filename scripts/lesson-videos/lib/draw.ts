/**
 * Text layout and slide drawing for the lesson videos.
 *
 * A slide is a list of `Op`s (a filled box or a line of text) which is turned
 * into a single `-vf` filter chain. Nothing here needs an image library:
 * `drawbox` and `drawtext` draw the whole slide in one frame of ffmpeg, and the
 * text is measured the same way (`ffmpeg.ts` renders it, `measureInk` counts
 * the inked pixels).
 *
 * Measuring rather than estimating matters more than it sounds: DejaVu Sans has
 * no fixed character width, so a paragraph laid out on an estimate either runs
 * off the frame or leaves a ragged hole. The measurements are cached per
 * (text, font, size), and a wrapped paragraph only needs one measurement per
 * word because the width of "words i..j" is the difference of two prefixes.
 */
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { measureInk } from "./ffmpeg";

export type FontName = "bold" | "regular" | "mono" | "monobold";

const FONT_FILES: Record<FontName, string> = {
  bold: "DejaVuSans-Bold.ttf",
  regular: "DejaVuSans.ttf",
  mono: "DejaVuSansMono.ttf",
  monobold: "DejaVuSansMono-Bold.ttf",
};

/** DejaVu Sans Mono's advance width, in ems — every glyph, including space. */
export const MONO_ADVANCE = 1233 / 2048;

export function fontDir(): string {
  return process.env.LESSON_VIDEO_FONT_DIR?.trim() || "/usr/share/fonts/truetype/dejavu";
}

export function fontPath(font: FontName): string {
  return path.join(fontDir(), FONT_FILES[font]);
}

/* -------------------------------------------------------------------------- */
/* Measurement                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Rough advance widths, in ems, used only to pick a starting font size.
 *
 * They are deliberately generous: an over-estimate wraps the text a little
 * early, an under-estimate runs it off the edge of the picture. The real
 * layout is measured; this is just the first guess.
 */
const EM_WIDTH: Record<string, number> = {
  " ": 0.34, "!": 0.35, '"': 0.44, "#": 0.7, $: 0.7, "%": 0.97, "&": 0.8, "'": 0.29,
  "(": 0.42, ")": 0.42, "*": 0.53, "+": 0.7, ",": 0.35, "-": 0.44, ".": 0.35, "/": 0.52,
  ":": 0.35, ";": 0.35, "<": 0.7, "=": 0.7, ">": 0.7, "?": 0.53, "@": 1.05,
  "[": 0.44, "\\": 0.52, "]": 0.44, "^": 0.63, _: 0.62, "`": 0.46,
  "{": 0.5, "|": 0.35, "}": 0.5, "~": 0.7,
};

export function estimateWidth(text: string, font: FontName, size: number): number {
  let ems = 0;
  for (const char of text) {
    if (EM_WIDTH[char] !== undefined) {
      ems += EM_WIDTH[char];
      continue;
    }
    if (font === "mono" || font === "monobold") {
      ems += MONO_ADVANCE;
      continue;
    }
    if (/[0-9]/.test(char)) ems += 0.66;
    else if (/[A-Z]/.test(char)) ems += /[MW]/.test(char) ? 1.0 : /[IJ]/.test(char) ? 0.42 : 0.82;
    else if (/[a-z]/.test(char)) ems += /[mw]/.test(char) ? 1.0 : /[ijl]/.test(char) ? 0.34 : /[ftr]/.test(char) ? 0.48 : 0.66;
    else ems += 0.7; // punctuation outside ASCII, arrows, symbols
  }
  return ems * size * (font === "bold" || font === "monobold" ? 1.05 : 1);
}

export class TextRuler {
  private readonly cache = new Map<string, number>();
  private readonly dir: string;

  constructor(private readonly workDir: string) {
    this.dir = path.join(workDir, "text");
    mkdirSync(this.dir, { recursive: true });
  }

  /** Writes (and memoises) the file `drawtext` reads a line from. */
  textFile(text: string): string {
    const digest = createHash("sha1").update(text).digest("hex").slice(0, 16);
    const file = path.join(this.dir, `${digest}.txt`);
    try {
      writeFileSync(file, text, { flag: "wx" });
    } catch {
      /* already written by an earlier run of the same text */
    }
    return file;
  }

  /** The rendered width of `text`, in pixels, exactly as it will be drawn. */
  async width(text: string, font: FontName, size: number): Promise<number> {
    if (!text) return 0;
    const key = `${font}|${size}|${text}`;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const measured = await measureInk(text, fontPath(font), size, this.textFile(text));
    this.cache.set(key, measured);
    return measured;
  }

  /**
   * Wraps a paragraph to `maxWidth`.
   *
   * Words are placed one at a time; the width of the candidate line is the
   * difference between the measured width of the whole prefix and the width of
   * the prefix before it, minus the space that sits between them. Because both
   * measurements start with the same first word, its left bearing cancels out,
   * which makes the difference exact.
   */
  async wrap(text: string, font: FontName, size: number, maxWidth: number, maxLines = 99): Promise<string[]> {
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const prefix: number[] = [0];
    for (let index = 0; index < words.length; index++) {
      prefix.push(await this.width(words.slice(0, index + 1).join(" "), font, size));
    }
    const space = Math.max(0, (await this.width("| |", font, size)) - (await this.width("||", font, size)));
    const lines: string[] = [];
    let start = 0;
    for (let end = 0; end < words.length; end++) {
      const candidate = prefix[end + 1] - prefix[start] - (start > 0 ? space : 0);
      const isLast = end === words.length - 1;
      if (candidate > maxWidth && end > start) {
        lines.push(words.slice(start, end).join(" "));
        start = end;
        if (lines.length >= maxLines) break;
      } else if (isLast) {
        lines.push(words.slice(start, end + 1).join(" "));
      }
    }
    return lines.slice(0, maxLines);
  }

  /**
   * Picks the largest size from `sizes` at which the text fits `maxLines`, and
   * returns the wrapped lines. Falls back to the smallest size.
   */
  async fit(
    text: string,
    font: FontName,
    sizes: number[],
    maxWidth: number,
    maxLines: number
  ): Promise<{ size: number; lines: string[] }> {
    let fallback = { size: sizes[sizes.length - 1], lines: [] as string[] };
    for (const size of sizes) {
      const estimate = estimateWidth(text, font, size);
      const estimatedLines = Math.ceil(estimate / maxWidth);
      if (estimatedLines > maxLines && size !== sizes[sizes.length - 1]) continue;
      const lines = await this.wrap(text, font, size, maxWidth, maxLines + 1);
      if (lines.length <= maxLines) return { size, lines };
      fallback = { size, lines };
    }
    return fallback;
  }

  /** Drops the temporary line files once a lesson is finished. */
  clean(): void {
    try {
      rmSync(this.dir, { recursive: true, force: true });
    } catch {
      /* the folder is scratch space; failing to remove it is not an error */
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Drawing                                                                    */
/* -------------------------------------------------------------------------- */

export interface BoxOp {
  kind: "box";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alpha?: number;
}

export interface TextOp {
  kind: "text";
  text: string;
  font: FontName;
  size: number;
  color: string;
  x: number;
  y: number;
  alpha?: number;
  /** Kept for laying out lines that sit next to each other. */
  width?: number;
}

export type Op = BoxOp | TextOp;

export function box(x: number, y: number, width: number, height: number, color: string, alpha?: number): BoxOp {
  return { kind: "box", x, y, width, height, color, alpha };
}

export function text(
  value: string,
  font: FontName,
  size: number,
  color: string,
  x: number,
  y: number,
  extra: { alpha?: number; width?: number } = {}
): TextOp {
  return { kind: "text", text: value, font, size, color, x, y, ...extra };
}

/** `#aabbcc` → `0xaabbcc`, which is the form the filter options accept. */
export function hex(color: string): string {
  return `0x${color.replace(/^#/, "")}`;
}

/**
 * Escapes a path for use as a filter *option value*.
 *
 * Inside `-vf` a colon ends an option, a comma ends a filter and a bracket
 * closes a stream, so a directory called "Work: 2026" would otherwise tear the
 * graph apart. Input files (`-i`) are plain arguments and must not be escaped.
 */
function filterValue(value: string): string {
  return value.replace(/([\\':,[\]\s])/g, "\\$1");
}

/** The `-vf` chain that paints one slide. Boxes are drawn before the text. */
export function slideFilter(ops: Op[], ruler: TextRuler): string {
  const parts: string[] = [];
  for (const op of ops.filter((item) => item.kind === "box") as BoxOp[]) {
    parts.push(
      [
        "drawbox=",
        `x=${op.x}`,
        `y=${op.y}`,
        `w=${op.width}`,
        `h=${op.height}`,
        `color=${hex(op.color)}${op.alpha === undefined ? "" : `@${op.alpha}`}`,
        "t=fill",
      ]
        .filter(Boolean)
        .join(":")
    );
  }
  for (const op of ops.filter((item) => item.kind === "text") as TextOp[]) {
    parts.push(
      [
        "drawtext=",
        `fontfile=${filterValue(fontPath(op.font))}`,
        `textfile=${filterValue(ruler.textFile(op.text))}`,
        `fontcolor=${hex(op.color)}${op.alpha === undefined ? "" : `@${op.alpha}`}`,
        `fontsize=${op.size}`,
        `x=${Math.round(op.x)}`,
        `y=${Math.round(op.y)}`,
        "expansion=none",
      ].join(":")
    );
  }
  return parts.join(",");
}
