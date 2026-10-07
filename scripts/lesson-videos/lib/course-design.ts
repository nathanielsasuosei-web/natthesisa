/**
 * The slides of a course welcome video.
 *
 * Four: who is teaching and what this is, what you will build, how the course
 * works, and where to start. It reuses the lesson video's type scale, chrome
 * and tone colour, so a course page and its lessons look like one series.
 */
import type { Course } from "../../../src/lib/courses";
import { box, text, type Op, type TextRuler } from "./draw";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "./design";

const MARGIN = 80;
const CONTENT_WIDTH = SLIDE_WIDTH - MARGIN * 2;
const INK = "#17151f";
const PAPER = "#f8f8f5";
const BODY_ON_LIGHT = "#4a4450";
const MUTED_ON_LIGHT = "#a9a3b2";
const DIMMER_ON_DARK = "#6f6879";

const TONE: Record<Course["tone"], { solid: string; onDark: string }> = {
  violet: { solid: "#6d4aff", onDark: "#a68cff" },
  orange: { solid: "#ff7448", onDark: "#ffa07c" },
  cyan: { solid: "#087f8c", onDark: "#4fd3e0" },
  green: { solid: "#16865a", onDark: "#4fd99a" },
  pink: { solid: "#d94376", onDark: "#ff86ad" },
  blue: { solid: "#2d67d4", onDark: "#7aa8ff" },
};

export interface WelcomeContext {
  ruler: TextRuler;
  course: Course;
  /** The three spoken sections, in slide order. */
  narration: { intro: string; build: string; how: string };
  lessonCount: number;
  totalMinutes: number;
  durationSeconds: number;
}

function clock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function tone(context: WelcomeContext) {
  return TONE[context.course.tone] ?? TONE.violet;
}

function chrome(context: WelcomeContext, ops: Op[], dark: boolean, page: string): void {
  const accent = tone(context);
  ops.push(text("</>", "monobold", 19, dark ? accent.onDark : accent.solid, MARGIN, 648));
  ops.push(text("codemasterghana", "regular", 20, dark ? "#8e8799" : "#8a8394", MARGIN + 46, 647));
  ops.push(text(page, "monobold", 18, dark ? DIMMER_ON_DARK : MUTED_ON_LIGHT, SLIDE_WIDTH - MARGIN - 90, 649));
}

function label(value: string, color: string, ops: Op[], dark: boolean): void {
  ops.push(box(MARGIN, dark ? 86 : 88, 5, 40, color));
  ops.push(text(value.toUpperCase(), "monobold", 19, color, MARGIN + 22, dark ? 94 : 96));
}

export async function welcomeTitleSlide(context: WelcomeContext): Promise<Op[]> {
  const { ruler, course } = context;
  const accent = tone(context);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, INK)];
  ops.push(box(MARGIN, 150, 64, 8, accent.onDark));
  ops.push(text(`${course.category} · a codemasterghana course`.toUpperCase(), "monobold", 20, accent.onDark, MARGIN, 180));

  const title = await ruler.fit(`Welcome to ${course.title}`, "bold", [60, 54, 48, 42], CONTENT_WIDTH, 3);
  let y = 240;
  for (const line of title.lines) {
    ops.push(text(line, "bold", title.size, PAPER, MARGIN, y));
    y += Math.round(title.size * 1.16);
  }

  y += 24;
  const facts = [
    `${course.instructor.name} — ${course.instructor.role}`,
    `${context.lessonCount} lessons · about ${Math.round(context.totalMinutes / 60)} hours of reading and practice`,
    `${clock(context.durationSeconds)} welcome video`,
  ];
  for (const fact of facts) {
    ops.push(box(MARGIN + 2, y + 9, 6, 6, accent.onDark));
    ops.push(text(fact, "regular", 24, "#b9b3c2", MARGIN + 26, y));
    y += 38;
  }

  chrome(context, ops, true, "welcome");
  return ops;
}

export async function welcomeBuildSlide(context: WelcomeContext): Promise<Op[]> {
  const { ruler, course } = context;
  const accent = tone(context);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, PAPER)];
  label("What you will build", accent.solid, ops, false);
  ops.push(text("01 / 03", "monobold", 18, MUTED_ON_LIGHT, SLIDE_WIDTH - MARGIN - 76, 98));

  const heading = await ruler.fit(course.project, "bold", [46, 42, 38, 34], CONTENT_WIDTH, 3);
  let y = 186;
  for (const line of heading.lines) {
    ops.push(text(line, "bold", heading.size, INK, MARGIN, y));
    y += Math.round(heading.size * 1.2);
  }
  y += 22;
  ops.push(box(MARGIN, y, 72, 4, accent.solid));
  y += 44;

  for (const outcome of course.outcomes.slice(0, 4)) {
    const line = await ruler.fit(outcome, "regular", [28, 26, 24], CONTENT_WIDTH - 60, 1);
    ops.push(box(MARGIN + 4, y + 12, 8, 8, accent.solid));
    ops.push(text(line.lines[0] ?? outcome, "regular", line.size, BODY_ON_LIGHT, MARGIN + 34, y));
    y += Math.round(line.size * 1.7);
  }

  chrome(context, ops, false, "01 / 03");
  return ops;
}

export async function welcomeHowSlide(context: WelcomeContext): Promise<Op[]> {
  const { ruler } = context;
  const accent = tone(context);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, PAPER)];
  label("How the course works", accent.solid, ops, false);
  ops.push(text("02 / 03", "monobold", 18, MUTED_ON_LIGHT, SLIDE_WIDTH - MARGIN - 76, 98));

  const heading = await ruler.fit("Read it, watch it, build it", "bold", [46, 42, 38], CONTENT_WIDTH, 1);
  ops.push(text(heading.lines[0] ?? "How the course works", "bold", heading.size, INK, MARGIN, 186));
  ops.push(box(MARGIN, 254, 72, 4, accent.solid));

  const steps: { title: string; body: string }[] = [
    { title: "A video per lesson", body: "Every lesson opens with a short narrated walkthrough of the idea and the worked example." },
    { title: "Read and practise", body: "The written lesson goes deeper, and each one ends with a task you do in your own project." },
    { title: "Finish with proof", body: "Complete every lesson and the course issues a certificate with a verification link." },
  ];
  let y = 300;
  for (const [index, step] of steps.entries()) {
    ops.push(text(String(index + 1).padStart(2, "0"), "monobold", 22, accent.solid, MARGIN, y + 2));
    ops.push(text(step.title, "bold", 26, INK, MARGIN + 54, y));
    const body = await ruler.fit(step.body, "regular", [22, 20], CONTENT_WIDTH - 80, 2);
    let lineY = y + 36;
    for (const line of body.lines) {
      ops.push(text(line, "regular", body.size, BODY_ON_LIGHT, MARGIN + 54, lineY));
      lineY += Math.round(body.size * 1.4);
    }
    y = lineY + 14;
  }

  chrome(context, ops, false, "02 / 03");
  return ops;
}

export async function welcomeStartSlide(context: WelcomeContext): Promise<Op[]> {
  const { ruler, course } = context;
  const accent = tone(context);
  const ops: Op[] = [box(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, INK)];
  label("Start here", accent.onDark, ops, true);
  ops.push(box(MARGIN, 150, 64, 8, accent.onDark));

  const heading = await ruler.fit(course.modules[0]?.lessons[0]?.title ?? "Lesson one", "bold", [52, 46, 40], CONTENT_WIDTH, 2);
  let y = 226;
  for (const line of heading.lines) {
    ops.push(text(line, "bold", heading.size, PAPER, MARGIN, y));
    y += Math.round(heading.size * 1.2);
  }
  y += 26;
  const caption = await ruler.fit(
    `Lesson 1 of ${context.lessonCount} · ${course.modules[0]?.title ?? course.shortTitle}`,
    "regular",
    [24, 22],
    CONTENT_WIDTH,
    2
  );
  for (const line of caption.lines) {
    ops.push(text(line, "regular", caption.size, "#b9b3c2", MARGIN, y));
    y += Math.round(caption.size * 1.45);
  }

  chrome(context, ops, true, "start");
  return ops;
}
