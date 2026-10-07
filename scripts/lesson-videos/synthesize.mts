/**
 * Synthesize lesson narration scripts into the audio used by the video renderer:
 * `npm run videos:synthesize`.
 *
 * eSpeak-NG runs locally through `text2wav`; no API key or remote TTS service is
 * needed. Each paragraph is rendered in its own short-lived process because
 * the wasm synthesizer does not reliably emit subsequent clips in one process.
 * The four paragraph clips are joined with deliberate pauses into
 * `.data/lesson-videos/audio/<lessonId>.mp3`.
 *
 * Options:
 *   --course <id|slug>   synthesize one course
 *   --lesson <id>        synthesize one lesson
 *   --force              replace audio that already exists
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { COURSES } from "../../src/lib/courses";
import { runOrThrow } from "./lib/ffmpeg";

const ROOT = process.cwd();
const SCRIPT_DIR = path.join(ROOT, "content/lesson-videos");
const WORK = path.join(ROOT, ".data/lesson-videos");
const AUDIO_DIR = path.join(WORK, "audio");
const TEMP_DIR = path.join(WORK, "source");

interface LessonScript {
  title: string;
  idea: string;
  example: string;
  challenge: string;
}

interface ScriptFile {
  course: string;
  voice?: string;
  lessons?: Record<string, LessonScript>;
}

interface TextToWavOptions {
  voice?: string;
  amplitude?: number;
  speed?: number;
  lineLength?: number;
}

type TextToWav = (text: string, options?: TextToWavOptions) => Promise<Uint8Array>;
const require = createRequire(import.meta.url);
const textToWav = require("text2wav") as TextToWav;

interface Target {
  courseId: string;
  lessonId: string;
  voice: string;
  script: LessonScript;
}

function parseArgs(argv: string[]) {
  const flags = { course: "", lesson: "", force: false, worker: false, paragraph: -1, output: "" };
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--course") flags.course = argv[++index] ?? "";
    else if (value === "--lesson") flags.lesson = argv[++index] ?? "";
    else if (value === "--force") flags.force = true;
    else if (value === "--worker") flags.worker = true;
    else if (value === "--paragraph") flags.paragraph = Number.parseInt(argv[++index] ?? "-1", 10);
    else if (value === "--output") flags.output = argv[++index] ?? "";
  }
  return flags;
}

function loadScripts(courseFilter: string, lessonFilter: string): Target[] {
  const found: Target[] = [];

  for (const name of readdirSync(SCRIPT_DIR).filter((file) => file.endsWith(".json")).sort()) {
    const file = JSON.parse(readFileSync(path.join(SCRIPT_DIR, name), "utf8")) as ScriptFile;
    const course = COURSES.find((item) => item.id === file.course);
    if (!course) throw new Error(`${name}: course “${file.course}” is not in the catalog`);
    if (courseFilter && course.id !== courseFilter && course.slug !== courseFilter) continue;

    const catalogIds = new Set(course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)));
    for (const [lessonId, script] of Object.entries(file.lessons ?? {})) {
      if (lessonFilter && lessonId !== lessonFilter) continue;
      if (!catalogIds.has(lessonId)) throw new Error(`${name}: “${lessonId}” is not a lesson in ${course.id}`);
      const missing = (["title", "idea", "example", "challenge"] as const).filter((key) => !script[key]?.trim());
      if (missing.length) throw new Error(`${name}: ${lessonId} is missing ${missing.join(", ")}`);
      found.push({ courseId: course.id, lessonId, voice: file.voice ?? "en-gb", script });
    }
  }

  if (lessonFilter && !found.some((item) => item.lessonId === lessonFilter)) {
    throw new Error(`No narration script found for lesson “${lessonFilter}”`);
  }
  return found;
}

/** Keep only the TTS package's harmless local-wasm fallback warning quiet. */
async function synthesizeParagraph(text: string, options: TextToWavOptions): Promise<Uint8Array> {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = args.map(String).join(" ");
    if (message.startsWith("wasm streaming compile failed:") || message === "falling back to ArrayBuffer instantiation") return;
    originalWarn(...args);
  };
  try {
    return await textToWav(text, options);
  } finally {
    console.warn = originalWarn;
  }
}

/** Reject empty waveforms rather than quietly shipping a silent walkthrough. */
function assertAudibleWave(wave: Uint8Array, lessonId: string, paragraph: number): void {
  const buffer = Buffer.from(wave);
  let offset = 12;
  let peak = 0;
  while (offset + 8 <= buffer.length) {
    const name = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    if (name === "data") {
      const start = offset + 8;
      const end = Math.min(buffer.length, start + length);
      for (let index = start; index + 1 < end; index += 2) {
        peak = Math.max(peak, Math.abs(buffer.readInt16LE(index)));
      }
      break;
    }
    offset += 8 + length + (length % 2);
  }
  if (peak < 128) throw new Error(`${lessonId}: paragraph ${paragraph + 1} synthesized as silence`);
}

function speechParagraphs(script: LessonScript): string[] {
  return [script.title, script.idea, script.example, script.challenge];
}

async function synthesizeOneParagraph(target: Target, paragraph: number, output: string): Promise<void> {
  if (paragraph < 0 || paragraph > 3) throw new Error("--paragraph must be between 0 and 3");
  if (!output) throw new Error("A synthesis worker needs --output");
  const speed = Number.parseInt(process.env.TTS_SPEED ?? "155", 10);
  if (!Number.isFinite(speed) || speed < 80 || speed > 450) {
    throw new Error("TTS_SPEED must be a whole number between 80 and 450 words per minute");
  }

  const wave = await synthesizeParagraph(speechParagraphs(target.script)[paragraph], {
    voice: target.voice,
    speed,
    lineLength: 0,
  });
  assertAudibleWave(wave, target.lessonId, paragraph);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, Buffer.from(wave));
}

function concatAudioArgs(parts: string[], output: string): string[] {
  const args = ["-hide_banner", "-loglevel", "error", "-y"];
  const inputs: string[] = [];
  let inputIndex = 0;

  parts.forEach((part, index) => {
    args.push("-i", part);
    inputs.push(`[${inputIndex}:a]`);
    inputIndex++;
    if (index < parts.length - 1) {
      // An 0.8-second pause makes the four paragraph boundaries easy for the
      // video builder's silence detector to line up with its slides.
      args.push("-f", "lavfi", "-t", "0.8", "-i", "anullsrc=r=22050:cl=mono");
      inputs.push(`[${inputIndex}:a]`);
      inputIndex++;
    }
  });

  args.push(
    "-filter_complex",
    `${inputs.join("")}concat=n=${inputs.length}:v=0:a=1[out]`,
    "-map",
    "[out]",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "64k",
    "-ar",
    "44100",
    "-ac",
    "1",
    output
  );
  return args;
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv.slice(2));
  const scripts = loadScripts(flags.course, flags.lesson);
  if (!scripts.length) throw new Error("No lesson scripts matched those filters");

  if (flags.worker) {
    if (scripts.length !== 1) throw new Error("A synthesis worker must process exactly one lesson");
    await synthesizeOneParagraph(scripts[0], flags.paragraph, flags.output);
    return;
  }

  mkdirSync(AUDIO_DIR, { recursive: true });
  mkdirSync(TEMP_DIR, { recursive: true });
  const workerScript = path.join(ROOT, "scripts/lesson-videos/synthesize.mts");
  const startedAt = Date.now();
  let generated = 0;
  let skipped = 0;

  console.log(`eSpeak-NG voice · ${scripts[0].voice} · ${scripts.length} lesson narration(s)`);
  for (const [index, target] of scripts.entries()) {
    const output = path.join(AUDIO_DIR, `${target.lessonId}.mp3`);
    if (existsSync(output) && !flags.force) {
      skipped++;
      console.log(`↷ ${target.lessonId.padEnd(34)} audio already exists`);
      continue;
    }

    const startedLesson = Date.now();
    const parts = speechParagraphs(target.script).map((_, paragraph) =>
      path.join(TEMP_DIR, `${target.lessonId}-${process.pid}-${paragraph}.wav`)
    );
    try {
      for (let paragraph = 0; paragraph < parts.length; paragraph++) {
        const args = [
          "--import",
          "tsx",
          workerScript,
          "--worker",
          "--course",
          target.courseId,
          "--lesson",
          target.lessonId,
          "--paragraph",
          String(paragraph),
          "--output",
          parts[paragraph],
        ];
        const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
        if (result.error) throw result.error;
        if (result.status !== 0) {
          throw new Error(`${target.lessonId}: narration paragraph ${paragraph + 1} failed`);
        }
      }
      await runOrThrow(concatAudioArgs(parts, output));
    } finally {
      for (const part of parts) rmSync(part, { force: true });
    }

    generated++;
    const seconds = ((Date.now() - startedLesson) / 1000).toFixed(1);
    console.log(`✓ ${target.lessonId.padEnd(34)} ${target.courseId} · ${seconds}s (${index + 1}/${scripts.length})`);
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n${generated} narration(s) synthesized · ${skipped} already present · ${seconds}s`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
