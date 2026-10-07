/**
 * The look of a lesson video.
 *
 * Five slides carry one lesson: a title card, the idea, the worked example, the
 * practice challenge and an outro that points at the next lesson. They borrow
 * the site's own tokens — paper `#f8f8f5`, ink `#17151f`, violet `#6d4aff`, the
 * orange `#ff7448` of the "Try it yourself" panel, the `#1d1a23` code panel —
 * and the accent colour of the course's tone, so the video for a course looks
 * like the page it belongs to.
 *
 * Layout is fixed to a 1280×720 grid with an 80px margin: nothing here depends
 * on measuring the frame, so the only things that need measuring are lines of
 * text (`draw.ts`).
 */
import type { Course, Lesson, CourseTone } from "../../../src/lib/courses";
import { codeLines, highlightLine } from "./code";
import { box, text, type Op, type TextRuler, MONO_ADVANCE } from "./draw";

export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

const MARGIN = 80;
const CONTENT_WIDTH = SLIDE_WIDTH - MARGIN * 2;

const INK = "#17151f";
const PAPER = "#f8f8f5";
const PANEL = "#1d1a23";
const PANEL_EDGE = "#2a2634";
const MUTED_ON_DARK = "#8e8799";
const DIMMER_ON_DARK = "#6f6879";
const BODY_ON_LIGHT = "#4a4450";
const MUTED_ON_LIGHT = "#a9a3b2";

/** The tone colours the site already uses, plus a lighter pair for dark slides. */
const TONE: Record<CourseTone, { solid: string; onDark: string }> = {
  violet: { solid: "#6d4aff", onDark: "#a68cff" },
  orange: { solid: "#ff7448", onDark: "#ffa07c" },
  cyan: { solid: "#087f8c", onDark: "#4fd3e0" },
  green: { solid: "#16865a", onDark: "#4fd99a" },
  pink: { solid: "#d94376", onDark: "#ff86ad" },
  blue: { solid: "#2d67d4", onDark: "#7aa8ff" },
};

export interface SlideContext {
  ruler: TextRuler;
  course: Course;
  lesson: Lesson;
  /** 1-based position of the lesson in the course. */
  lessonNumber: number;
  lessonTotal: number;
  /** Total length of the finished video, shown on the title card. */
  durationSeconds: number;
  nextLesson?: Lesson;
}

function clock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function toneOf(course: Course) {
  return TONE[course.tone] ?? TONE.violet;
}

/** Brand line, page marker and duration: the strip every slide ends with. */
function chrome(context: SlideContext, ops: Op[], options: { dark: boolean; page: string }): void {
  const tone = toneOf(context.course);
  const brandColor = options.dark ? MUTED_ON_DARK : "#8a8394";
  const dim = options.dark ? DIMMER_ON_DARK : MUTED_ON_LIGHT;
  ops.push(text("</>", "monobold", 19, options.dark ? tone.onDark : tone.solid, MARGIN, 648));
  ops.push(text("codemasterghana", "regular", 20, brandColor, MARGIN + 46, 647));
  ops.push(text(options.page, "monobold", 18, dim, SLIDE_WIDTH - MARGIN - 90, 649));
}

/** Small caps label at the top-left of a content slide. */
function label(value: string, color: string, ops: Op[], options: { dark: boolean }): void {
  ops.push(box(MARGIN, options.dark ? 86 : 88, 5, 40, color));
  ops.push(text(value.toUpperCase(), "monobold", 19, color, MARGIN + 22, options.dark ? 94 : 96));
}

export async function titleSlide(context: SlideContext): Promise<Op[]> {
  const { ruler, course, lesson } = context;
  const tone = toneOf(course);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, INK)];

  ops.push(box(MARGIN, 150, 64, 8, tone.onDark));
  ops.push(
    text(
      `${course.shortTitle} · lesson ${context.lessonNumber} of ${context.lessonTotal}`.toUpperCase(),
      "monobold",
      20,
      tone.onDark,
      MARGIN,
      180
    )
  );

  const title = await ruler.fit(lesson.title, "bold", [64, 58, 52, 46], CONTENT_WIDTH, 3);
  let y = 244;
  for (const line of title.lines) {
    ops.push(text(line, "bold", title.size, PAPER, MARGIN, y));
    y += Math.round(title.size * 1.16);
  }

  const summary = await ruler.fit(lesson.summary, "regular", [26, 24, 22], CONTENT_WIDTH - 60, 3);
  y += 22;
  for (const line of summary.lines) {
    ops.push(text(line, "regular", summary.size, "#b9b3c2", MARGIN, y));
    y += Math.round(summary.size * 1.42);
  }

  chrome(context, ops, { dark: true, page: `${clock(context.durationSeconds)} watch` });
  ops.push(text(`${lesson.duration} min read`, "monobold", 18, DIMMER_ON_DARK, MARGIN, 672));
  return ops;
}

export async function ideaSlide(context: SlideContext): Promise<Op[]> {
  const { ruler, course, lesson } = context;
  const tone = toneOf(course);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, PAPER)];
  const section = lesson.sections[0];

  label("The idea", tone.solid, ops, { dark: false });
  ops.push(text("02 / 05", "monobold", 18, MUTED_ON_LIGHT, SLIDE_WIDTH - MARGIN - 76, 98));

  const heading = await ruler.fit(section?.heading ?? "Core concept", "bold", [40, 36, 32], CONTENT_WIDTH, 2);
  let y = 172;
  for (const line of heading.lines) {
    ops.push(text(line, "bold", heading.size, INK, MARGIN, y));
    y += Math.round(heading.size * 1.22);
  }
  y += 20;
  ops.push(box(MARGIN, y, 72, 4, tone.solid));
  y += 46;

  const body = await ruler.fit(section?.body ?? lesson.summary, "regular", [30, 28, 26, 24, 22], CONTENT_WIDTH - 40, 9);
  const bodyHeight = body.lines.length * Math.round(body.size * 1.5);
  // A short paragraph would otherwise leave a hole under it: balance the block
  // against the space between the rule and the footer strip.
  const available = 596 - y;
  y += Math.max(0, (available - bodyHeight) / 2);
  for (const line of body.lines) {
    ops.push(text(line, "regular", body.size, BODY_ON_LIGHT, MARGIN, y));
    y += Math.round(body.size * 1.5);
  }

  chrome(context, ops, { dark: false, page: "02 / 05" });
  return ops;
}

export async function exampleSlide(context: SlideContext): Promise<Op[]> {
  const { ruler, lesson } = context;
  const tone = toneOf(context.course);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, INK)];
  const section = lesson.sections[0];

  label("Worked example", tone.onDark, ops, { dark: true });

  // The panel is as tall as the example needs — a two-line snippet should not
  // sit at the top of half a screen of empty code panel.
  const innerWidth = CONTENT_WIDTH - 72;
  const sizes = [26, 24, 22, 20];
  let chosen = { size: sizes[sizes.length - 1], lines: [] as string[] };
  for (const size of sizes) {
    const lineHeight = size + 12;
    const maxLines = Math.floor((620 - 236) / lineHeight);
    const characters = Math.floor(innerWidth / (size * MONO_ADVANCE));
    const { lines } = codeLines(section?.code ?? "", maxLines);
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    chosen = { size, lines: lines.map((line) => (line.length > characters ? `${line.slice(0, characters - 1)}…` : line)) };
    if (!section?.code || longest <= characters) break;
  }
  const lineHeight = chosen.size + 12;
  const panelHeight = Math.min(620 - 150, 44 + 42 + chosen.lines.length * lineHeight);
  // Centred in the space between the label and the footer, so a two-line
  // example does not leave the picture lopsided.
  const panelTop = Math.round(150 + Math.max(0, (470 - panelHeight) / 2));
  ops.push(box(MARGIN, panelTop, CONTENT_WIDTH, panelHeight, PANEL));
  ops.push(box(MARGIN, panelTop, CONTENT_WIDTH, 44, PANEL_EDGE));
  for (let index = 0; index < 3; index++) {
    ops.push(box(MARGIN + 22 + index * 22, panelTop + 17, 10, 10, index === 0 ? "#ff7448" : index === 1 ? "#ffd479" : "#7ee2b8"));
  }
  const tag = section?.language && section.language !== "code" ? section.language : "example";
  const tagWidth = await ruler.width(tag, "mono", 18);
  ops.push(text(tag, "mono", 18, DIMMER_ON_DARK, SLIDE_WIDTH - MARGIN - 22 - tagWidth, panelTop + 14));
  const hint = "pause · read the example";
  const hintWidth = await ruler.width(hint, "mono", 18);
  ops.push(text(hint, "mono", 18, "#5d5766", SLIDE_WIDTH - MARGIN - hintWidth, 98));

  if (section?.code) {
    let y = panelTop + 86;
    for (const line of chosen.lines) {
      let x = MARGIN + 36;
      for (const token of highlightLine(line, section.language)) {
        if (token.text.trim()) ops.push(text(token.text, "mono", chosen.size, token.color, x, y));
        x += token.text.length * chosen.size * MONO_ADVANCE;
      }
      y += lineHeight;
    }
  } else {
    const fallback = await ruler.fit(lesson.challenge, "regular", [26, 24, 22], CONTENT_WIDTH - 72, 6);
    let y = panelTop + 100;
    for (const line of fallback.lines) {
      ops.push(text(line, "regular", fallback.size, "#d9d2e1", MARGIN + 36, y));
      y += Math.round(fallback.size * 1.5);
    }
  }

  chrome(context, ops, { dark: true, page: "03 / 05" });
  return ops;
}

export async function challengeSlide(context: SlideContext): Promise<Op[]> {
  const { ruler, lesson } = context;
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, PAPER)];

  label("Your turn", "#ff7448", ops, { dark: false });
  const hint = "take a moment · think it through";
  const hintWidth = await ruler.width(hint, "monobold", 17);
  ops.push(text(hint, "monobold", 17, MUTED_ON_LIGHT, SLIDE_WIDTH - MARGIN - hintWidth, 100));

  const heading = await ruler.fit("Try it yourself", "bold", [42], CONTENT_WIDTH, 1);
  ops.push(text(heading.lines[0] ?? "Try it yourself", "bold", 42, INK, MARGIN, 172));
  ops.push(box(MARGIN, 240, 72, 4, "#ff7448"));

  const body = await ruler.fit(lesson.challenge, "regular", [30, 28, 26, 24, 22], CONTENT_WIDTH - 60, 6);
  let y = 300;
  for (const line of body.lines) {
    ops.push(text(line, "regular", body.size, BODY_ON_LIGHT, MARGIN, y));
    y += Math.round(body.size * 1.5);
  }

  ops.push(text("Practice on the lesson page, then mark the lesson complete.", "monobold", 18, MUTED_ON_LIGHT, MARGIN, 580));
  chrome(context, ops, { dark: false, page: "04 / 05" });
  return ops;
}

export async function outroSlide(context: SlideContext): Promise<Op[]> {
  const { ruler, course, lesson, nextLesson } = context;
  const tone = toneOf(course);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, INK)];

  label(nextLesson ? "Up next" : "Course complete", tone.onDark, ops, { dark: true });
  ops.push(box(MARGIN, 150, 64, 8, tone.onDark));

  const heading = await ruler.fit(nextLesson ? nextLesson.title : course.title, "bold", [52, 46, 40], CONTENT_WIDTH, 3);
  let y = 226;
  for (const line of heading.lines) {
    ops.push(text(line, "bold", heading.size, PAPER, MARGIN, y));
    y += Math.round(heading.size * 1.2);
  }

  y += 26;
  const line = nextLesson
    ? `Lesson ${context.lessonNumber + 1} of ${context.lessonTotal} · ${course.shortTitle}`
    : `${lesson.title} was the last lesson · collect your certificate on the dashboard`;
  const caption = await ruler.fit(line, "regular", [24, 22], CONTENT_WIDTH, 2);
  for (const value of caption.lines) {
    ops.push(text(value, "regular", caption.size, "#b9b3c2", MARGIN, y));
    y += Math.round(caption.size * 1.45);
  }

  chrome(context, ops, { dark: true, page: nextLesson ? "next lesson" : "finish" });
  return ops;
}
