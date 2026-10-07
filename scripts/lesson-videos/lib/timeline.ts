/**
 * Where the slides change, and where the video pauses.
 *
 * The narration is written in paragraphs — one per slide — and a reader pauses
 * at a paragraph break, so the long pauses in the recorded voice are the places
 * the picture should change. `detectSilences()` finds those pauses; this module
 * decides which pause belongs to which boundary, preferring the one closest to
 * a proportional split of the narration (which is also the fallback when the
 * pauses are not clear enough to trust).
 *
 * Two deliberate silences are added on top:
 *
 *   after the worked example   time to read the code
 *   after the challenge        time to think about the answer
 *
 * They are the reason a two-minute lesson is watchable: the voice is roughly
 * a hundred seconds, and the reading pauses are what let a learner keep up.
 * `build.ts` splices the gaps into the recording (both cuts land in a pause,
 * so nothing is clipped) and shifts every later slide by the same amount.
 *
 * Everything here is in *audio* time; `build.ts` adds the lead-in that lets the
 * title card settle before the voice starts.
 */
import type { Silence } from "./ffmpeg";

export interface Beat {
  id: string;
  /** Chapter name in the player. */
  label: string;
  /** Spoken text. The last slide of a lesson has none: it is the outro. */
  narration: string;
}

/** One slide, ready to be drawn and timed. */
export interface PlannedSlide {
  id: string;
  label: string;
  /** Seconds into the video where this slide is fully visible. */
  hold: number;
  /** Seconds into the video where the cross-fade towards it starts. */
  begin: number;
  /** Seconds of picture this slide has to supply (`-t` on its image input). */
  duration: number;
  /** True when the slide is spoken over (the outro is not). */
  narrated: boolean;
}

/** A stretch of the recording that is kept whole, in audio time. */
export interface AudioPiece {
  start: number;
  end: number;
  /** Silence spliced in after this piece. */
  gap: number;
}

export interface Plan {
  slides: PlannedSlide[];
  /** Total length of the finished video. */
  total: number;
  /** True when at least one boundary could not be snapped to a pause. */
  approximate: boolean;
  /** The recording, cut only where a pause is spliced in. */
  audio: AudioPiece[];
  chapters: { label: string; start: number }[];
  /** Where each spoken paragraph sits in the finished video. */
  speechStarts: number[];
}

/** Cross-fade length. `build.ts` bakes the same value into the fades. */
export const FADE = 0.5;

/** Deliberate silences, by the slide they follow. */
export const READING_PAUSES: Record<string, number> = {
  example: 10,
  challenge: 6,
};

/**
 * How long a paragraph takes, relative to another one.
 *
 * Characters alone are not enough: a paragraph that spells out URL, DNS and
 * HTTPS is spoken letter by letter and takes far longer than its character
 * count suggests, and every word carries a little boundary cost of its own.
 * The weights below were calibrated against recordings where the paragraph
 * boundary is known exactly, and they are what keeps a slide change within a
 * second or two of the sentence it belongs to.
 */
function weightOf(narration: string): number {
  const text = narration.replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  const acronyms = (text.match(/\b[A-Z]{2,}\b/g) ?? []).length;
  const digits = (text.match(/\d/g) ?? []).length;
  const clauseBreaks = (text.match(/[,;:—-]/g) ?? []).length;
  return Math.max(1, text.length + 4 * words + 10 * acronyms + 5 * digits + 2 * clauseBreaks);
}

/** Pauses long enough and early enough to be a paragraph break. */
function candidatePauses(silences: Silence[], duration: number): Silence[] {
  return silences
    .filter((silence) => silence.end - silence.start >= 0.22)
    .filter((silence) => silence.start > 2 && silence.end < duration - 0.6)
    .map((silence) => ({ start: Math.max(0, silence.start), end: Math.min(duration, silence.end) }));
}

/**
 * Chooses one pause per spoken boundary.
 *
 * `estimate` is the proportional split of the narration. A pause is accepted
 * when it is within `window` seconds of that estimate and leaves at least two
 * seconds of slide between neighbours; a boundary with no acceptable pause
 * keeps the estimate, so one missing pause spoils one transition rather than
 * the whole timeline.
 */
function snapBoundaries(weights: number[], audioDuration: number, silences: Silence[]): { boundaries: number[]; snapped: number } {
  const pauses = candidatePauses(silences, audioDuration);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  // A tight window, because a *wrong* pause is worse than no pause at all: the
  // model estimate is a second or two out, a snap to the wrong sentence is five.
  const window = Math.max(4, Math.min(6, audioDuration * 0.06));
  const boundaries: number[] = [];
  let snapped = 0;
  let previous = 0;
  let running = 0;

  weights.slice(0, -1).forEach((weight, index) => {
    running += weight;
    const estimate = (running / totalWeight) * audioDuration;
    const isLast = index === weights.length - 2;
    const floor = Math.max(previous + 2, 2);
    const ceiling = isLast ? audioDuration - 1.5 : audioDuration;
    // A paragraph break is usually the longest silence nearby, so a longer
    // pause earns a discount against its distance from the estimate.
    const candidates = pauses
      .filter((pause) => pause.start > floor && pause.start < ceiling && Math.abs(pause.start - estimate) <= window)
      .sort(
        (a, b) =>
          Math.abs(a.start - estimate) - 22 * (a.end - a.start) - (Math.abs(b.start - estimate) - 22 * (b.end - b.start))
      );
    const chosen = candidates[0] ? candidates[0].start : estimate;
    if (candidates[0]) snapped += 1;
    boundaries.push(Math.max(floor, Math.min(ceiling, chosen)));
    previous = boundaries[boundaries.length - 1];
  });

  return { boundaries, snapped };
}

export function planTimeline(options: {
  beats: Beat[];
  audioDuration: number;
  silences: Silence[];
  leadIn: number;
  tail: number;
  /** Multiplier for the deliberate reading pauses, used to reach a target length. */
  pauseScale?: number;
}): Plan {
  const { beats, audioDuration, leadIn, tail } = options;
  const narrated = beats.filter((beat) => beat.narration.trim().length > 0);
  const weights = narrated.map((beat) => weightOf(beat.narration));
  const { boundaries, snapped } = snapBoundaries(weights, audioDuration, options.silences);

  // Paragraph lengths in the recording, and the silence that follows each one.
  const cuts = [...boundaries, audioDuration];
  const paragraphLengths = cuts.map((cut, index) => cut - (index === 0 ? 0 : cuts[index - 1]));
  const pauseScale = options.pauseScale ?? 1;
  const gaps = narrated.map((beat) => (READING_PAUSES[beat.id] ?? 0) * pauseScale);

  const speechStarts: number[] = [];
  let track = leadIn;
  paragraphLengths.forEach((length, index) => {
    speechStarts.push(track);
    track += length + gaps[index];
  });
  const speechEnd = track;
  const total = speechEnd + tail;

  // The recording is cut only where a pause is added, so every other paragraph
  // runs into the next one exactly as it was recorded.
  const audio: AudioPiece[] = [];
  let pieceStart = 0;
  paragraphLengths.forEach((length, index) => {
    const end = pieceStart + length;
    const gap = gaps[index];
    if (gap > 0) {
      audio.push({ start: pieceStart, end, gap });
      pieceStart = end;
    }
    void index;
  });
  if (pieceStart < audioDuration - 0.05) audio.push({ start: pieceStart, end: audioDuration, gap: 0 });
  if (!audio.length) audio.push({ start: 0, end: audioDuration, gap: 0 });

  const starts = beats.map((beat, index) => (index === 0 ? 0 : index < narrated.length ? speechStarts[index] : speechEnd));

  /**
   * Where each cross-fade begins, on the finished video's timeline.
   *
   * The slides are chained with `xfade`: the transition towards slide k starts
   * at `begin[k]`, so slide k is fully on screen `FADE` seconds later — exactly
   * when its paragraph begins. Each one is held back far enough from the
   * previous transition that no slide is swallowed by its neighbours.
   */
  const begins: number[] = [];
  starts.forEach((hold, index) => {
    if (index === 0) {
      begins.push(0);
      return;
    }
    begins.push(Math.max(begins[index - 1] + 0.9, hold - FADE));
  });

  const slides: PlannedSlide[] = beats.map((beat, index) => {
    const hold = starts[index];
    const begin = begins[index];
    const next = index + 1 < begins.length ? begins[index + 1] + FADE : total;
    return {
      id: beat.id,
      label: beat.label,
      hold,
      begin,
      // `xfade` consumes the incoming picture from its own start until the
      // transition is over, so a slide supplies picture from `begin` to
      // `begin + duration` and the chain's total length is `begin + duration`.
      duration: Math.max(1, next - begin),
      narrated: beat.narration.trim().length > 0,
    };
  });

  return {
    slides,
    total,
    approximate: snapped < Math.max(1, narrated.length - 1),
    audio,
    speechStarts,
    chapters: slides
      .filter((slide) => slide.narrated)
      .map((slide) => ({ label: slide.label, start: Number(slide.hold.toFixed(2)) })),
  };
}
