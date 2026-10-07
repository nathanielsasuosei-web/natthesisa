import type { CourseModule, Lesson, LessonSection, SectionKind } from "./courses";

/**
 * How catalog lessons are written.
 *
 * A lesson is a piece of textbook: a formal definition, the reasoning behind
 * it, the mechanics, at least one worked example traced step by step, the
 * mistakes learners make, a summary, and exercises. That structure is what
 * `lesson()` builds — the content files in `src/content/` supply the prose,
 * this module supplies the shape, the automatic objectives and the reading
 * time.
 *
 * The only import from `courses` is a set of *types*, so there is no runtime
 * cycle, and the content files stay free of Node APIs and can be rendered on
 * either side of the server boundary.
 */

export interface SectionSpec {
  /** The heading shown in the reader and in its table of contents. */
  heading: string;
  /**
   * Prose. Separate paragraphs with a blank line. A line starting with `- ` or
   * `1. ` becomes a list item. Inline marks are supported: `` `code` ``,
   * `**bold**` and `_emphasis_`.
   */
  body?: string;
  /** What kind of block this is — it decides how the reader styles it. */
  kind?: SectionKind;
  code?: string;
  language?: string;
  /** A caption printed above a code block ("Output", "Trace", …). */
  codeLabel?: string;
  /** Rows for a `table` section. The first row is the header. */
  rows?: string[][];
  /** Numbered steps, for an `exercise` section. */
  items?: string[];
}

export interface LessonSpec {
  id: string;
  title: string;
  summary: string;
  sections: SectionSpec[];
  /**
   * The graded practice task. Kept as the headline challenge; `exercises`
   * carries the longer textbook exercise set.
   */
  challenge: string;
  /** Short statements of what the learner should now be able to do. */
  keyPoints?: string[];
  /** The textbook exercise set: review questions, then practical problems. */
  exercises?: string[];
  /** Reading time in minutes. Computed from the word count when omitted. */
  minutes?: number;
  /** Learning objectives. Written from the sections when omitted. */
  objectives?: string[];
  preview?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Reading time                                                               */
/* -------------------------------------------------------------------------- */

/** Words a learner reads per minute, allowing for stopping at the examples. */
const WORDS_PER_MINUTE = 185;

function countWords(text: string | undefined): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/** Words in a code block, counting a line of code as roughly six words. */
function countCodeWords(code: string | undefined): number {
  if (!code) return 0;
  return code.split("\n").filter((line) => line.trim().length > 0).length * 6;
}

/** Anything with a lesson's shape — a spec before building, or a built lesson. */
interface CountableLesson {
  summary: string;
  challenge?: string;
  sections: Array<{ heading: string; body?: string; code?: string; rows?: string[][]; items?: string[] }>;
  keyPoints?: string[];
  exercises?: string[];
}

export function specWordCount(spec: LessonSpec): number {
  return countLessonWords(spec);
}

/** The word count of a built lesson — the same number the reader shows. */
export function lessonWordCount(lesson: Lesson): number {
  return countLessonWords(lesson);
}

function countLessonWords(lesson: CountableLesson): number {
  let words = countWords(lesson.summary) + countWords(lesson.challenge);
  for (const section of lesson.sections) {
    words += countWords(section.heading) + countWords(section.body);
    words += countCodeWords(section.code);
    if (section.rows) for (const row of section.rows) words += row.reduce((sum, cell) => sum + countWords(cell), 0);
    if (section.items) for (const item of section.items) words += countWords(item);
  }
  for (const point of lesson.keyPoints ?? []) words += countWords(point);
  for (const exercise of lesson.exercises ?? []) words += countWords(exercise);
  return words;
}

/**
 * Reading time derived from the lesson itself, so a longer lesson never claims
 * the minutes of the short one it replaced. Rounded to five minutes, bounded so
 * the course pages stay sane.
 */
export function readingMinutes(spec: LessonSpec): number {
  const minutes = Math.ceil(specWordCount(spec) / WORDS_PER_MINUTE / 5) * 5;
  return Math.min(90, Math.max(10, minutes));
}

/* -------------------------------------------------------------------------- */
/* Objectives                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Objectives written from the lesson's own sections, in Bloom's order: recall
 * the definition, explain the mechanism, follow the worked example, avoid the
 * documented mistakes, then apply it to something new.
 */
export function objectivesFor(spec: LessonSpec): string[] {
  const objectives: string[] = [
    `State the definition of ${spec.title.toLowerCase()} and explain the problem it exists to solve.`,
  ];

  const kinds = new Set(spec.sections.map((section) => section.kind ?? "paragraph"));
  if (kinds.has("definition")) objectives.push("Use the formal terminology correctly when describing the concept to another developer.");
  if (kinds.has("example")) objectives.push("Trace the worked example line by line and predict its result before running it.");
  if (kinds.has("table")) objectives.push("Compare the alternatives in the reference table and justify a choice between them.");
  if (kinds.has("warning") || kinds.has("note")) objectives.push("Recognise the mistakes and edge cases the lesson calls out, and say why each one fails.");
  if (spec.exercises?.length) objectives.push("Complete the exercise set and check each answer against the stated behaviour.");
  objectives.push("Apply the idea to a new problem of your own and verify the result against its constraints.");

  return objectives.slice(0, 6);
}

/* -------------------------------------------------------------------------- */
/* Builders                                                                   */
/* -------------------------------------------------------------------------- */

/** The original positional signature, kept only until every lesson is migrated. */
type LegacyLessonArgs = [string, string, number, string, string, string | undefined, string, boolean?];

function legacyLesson([id, title, duration, summary, concept, code, challenge, preview]: LegacyLessonArgs): Lesson {
  return {
    id,
    title,
    duration,
    summary,
    preview: preview ?? false,
    objectives: [
      "Explain the central concept and identify the problem it solves.",
      "Trace or adapt the worked example, explaining the role of its important steps.",
      "Complete the challenge and verify the result against its expected behavior or constraints.",
    ],
    sections: [{ heading: "Core concept", body: concept, kind: "paragraph", code, language: code ? "code" : undefined }],
    challenge,
  };
}

/** Build a catalog lesson from a written spec. */
export function lesson(spec: LessonSpec): Lesson;
/** @deprecated Migration shim: positional form, removed once all lessons are spec-based. */
export function lesson(...args: LegacyLessonArgs): Lesson;
export function lesson(...args: [LessonSpec] | LegacyLessonArgs): Lesson {
  if (typeof args[0] !== "object") return legacyLesson(args as LegacyLessonArgs);
  const spec = args[0] as LessonSpec;
  const sections: LessonSection[] = spec.sections.map((section) => ({
    heading: section.heading,
    body: section.body ?? "",
    kind: section.kind ?? "paragraph",
    ...(section.code ? { code: section.code, language: section.language ?? "code" } : {}),
    ...(section.codeLabel ? { codeLabel: section.codeLabel } : {}),
    ...(section.rows ? { rows: section.rows } : {}),
    ...(section.items ? { items: section.items } : {}),
  }));

  const built: Lesson = {
    id: spec.id,
    title: spec.title,
    duration: spec.minutes ?? readingMinutes(spec),
    summary: spec.summary,
    objectives: spec.objectives ?? objectivesFor(spec),
    sections,
    challenge: spec.challenge,
    ...(spec.keyPoints ? { keyPoints: spec.keyPoints } : {}),
    ...(spec.exercises ? { exercises: spec.exercises } : {}),
    ...(spec.preview ? { preview: true } : {}),
  };

  return built;
}

/** A module, written as `module(id, title, description, lessons)`. */
export function module(id: string, title: string, description: string, lessons: Lesson[]): CourseModule {
  return { id, title, description, lessons };
}
