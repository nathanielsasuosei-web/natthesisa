import type { HTMLAttributes } from "react";

type SpeechAttrs = HTMLAttributes<HTMLElement> & {
  "data-speech"?: string;
  "data-speech-label"?: string;
  "data-speech-kind"?: string;
  "data-speech-code"?: string;
};

/**
 * Turns textbook markup into words a speech engine can say.
 *
 * The lesson narrator does not keep a second copy of the lesson. Each
 * speakable element carries `data-speech` (the words) and `data-speech-label`
 * (the section name shown in the player). The player reads those attributes
 * in document order, so the highlight and the voice stay on the same passage.
 */

export function speakCode(code: string): string {
  return code
    .replace(/===/g, " strictly equals ")
    .replace(/!==/g, " does not strictly equal ")
    .replace(/<=/g, " is at most ")
    .replace(/>=/g, " is at least ")
    .replace(/==/g, " equals ")
    .replace(/!=/g, " does not equal ")
    .replace(/&&/g, " and ")
    .replace(/\|\|/g, " or ")
    .replace(/=>/g, ", which gives ")
    .replace(/\+\+/g, " plus one ")
    .replace(/--/g, " minus one ")
    .replace(/[{}()[\];]/g, " ")
    .replace(/[/\\]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip the textbook's inline markup and expand symbols a voice would mangle. */
export function toSpoken(input: string): string {
  let text = input
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, (_, code: string) => ` ${speakCode(code)} `);

  text = text
    .replace(/[→⇒⟶]/g, ", which gives ")
    .replace(/←/g, " is set to ")
    .replace(/[—–]/g, ", ")
    .replace(/[“”«»]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/…/g, ". ")
    .replace(/≤/g, " at most ")
    .replace(/≥/g, " at least ")
    .replace(/≠/g, " not equal to ")
    .replace(/≈/g, " about ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/²/g, " squared")
    .replace(/³/g, " cubed")
    .replace(/ⁿ/g, " to the n")
    .replace(/₂/g, " 2")
    .replace(/₃/g, " 3")
    .replace(/√/g, " square root of ")
    .replace(/∞/g, " infinity")
    .replace(/π/g, " pi")
    .replace(/∧/g, " and ")
    .replace(/∨/g, " or ")
    .replace(/¬/g, " not ")
    .replace(/≡/g, " is equivalent to ")
    .replace(/∈/g, " in ")
    .replace(/∑/g, " the sum of ")
    .replace(/⌊/g, " floor of ")
    .replace(/⌋/g, " ")
    .replace(/⌈/g, " ceiling of ")
    .replace(/⌉/g, " ")
    .replace(/∎/g, "")
    .replace(/&/g, " and ")
    .replace(/</g, " less than ")
    .replace(/>/g, " greater than ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();

  return text;
}

/** Attributes that mark an element as one passage of the narration. */
export function speechProps(
  text: string,
  label: string,
  extra?: { kind?: string; code?: string },
): SpeechAttrs {
  const spoken = toSpoken(text).trim();
  if (!spoken) return {};
  const attrs: SpeechAttrs = {
    "data-speech": spoken,
    "data-speech-label": toSpoken(label).replace(/[.?!]$/, "") || "Lesson",
  };
  if (extra?.kind) attrs["data-speech-kind"] = extra.kind;
  if (extra?.code) attrs["data-speech-code"] = extra.code;
  return attrs;
}

/** A listing, read as comments plus a softened line — used only if the learner asks for code. */
export function spokenCodeListing(code: string, caption?: string): string {
  const bits: string[] = [];
  if (caption) bits.push(toSpoken(caption));
  bits.push("Code example.");
  for (const raw of code.split("\n")) {
    const line = raw.trim();
    if (!line || line === "{" || line === "}" || line === ");") continue;
    const comment = line.match(/^(?:\/\/|#)\s?(.*)$/);
    if (comment) {
      if (comment[1].trim()) bits.push(toSpoken(comment[1]));
      continue;
    }
    if (line.startsWith("/*") || line.startsWith("*")) {
      const cleaned = line.replace(/^\/?\*+\/?\s?/, "").replace(/\*\/$/, "").trim();
      if (cleaned) bits.push(toSpoken(cleaned));
      continue;
    }
    if (line.length > 140) {
      bits.push("A longer line of code is on the page.");
      continue;
    }
    const spoken = speakCode(line);
    if (spoken) bits.push(spoken);
  }
  return bits.join(" ").replace(/\s+/g, " ").trim();
}

export function spokenTable(caption: string | undefined, head: string[], rows: string[][]): string {
  const parts: string[] = [caption ? `Table. ${caption}.` : "Table."];
  if (head.length) parts.push(`Columns: ${head.join(", ")}.`);
  rows.forEach((row, index) => {
    parts.push(`Row ${index + 1}. ${row.join(". ")}.`);
  });
  return parts.join(" ");
}

/**
 * Split a passage into utterances short enough that browsers do not cut them
 * off. Chrome in particular stops a single utterance after about fifteen seconds.
 */
export function speechChunks(text: string, max = 150): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let buf = "";
  const push = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) chunks.push(trimmed);
  };
  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;
    if (piece.length > max) {
      push(buf);
      buf = "";
      let rest = piece;
      while (rest.length > max) {
        const slice = rest.slice(0, max);
        const breakAt = Math.max(slice.lastIndexOf(", "), slice.lastIndexOf("; "), slice.lastIndexOf(" "));
        const at = breakAt > 40 ? breakAt : max;
        push(rest.slice(0, at));
        rest = rest.slice(at).trim();
      }
      buf = rest;
      continue;
    }
    if (buf && `${buf} ${piece}`.length > max) {
      push(buf);
      buf = piece;
    } else {
      buf = buf ? `${buf} ${piece}` : piece;
    }
  }
  push(buf);
  return chunks;
}
