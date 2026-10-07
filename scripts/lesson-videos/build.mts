/**
 * Builds one narrated video for every lesson: `npm run videos:build`.
 *
 *   scripts/lesson-videos/build.mts [--course <id>] [--lesson <id>] [--all]
 *                                   [--force] [--slides-only] [--list]
 *
 * What it needs:
 *
 *   content/lesson-videos/<courseId>.json   the narration, four paragraphs per
 *                                           lesson (title, idea, example,
 *                                           challenge) written for this pipeline
 *   .data/lesson-videos/audio/<id>.mp3      the recorded voice (synthesised
 *                                           separately — see the README)
 *
 * What it produces:
 *
 *   <storage>/lessonvideo__<id>.mp4         the video, through the same store the
 *   <storage>/lessonvideo__<id>--poster.jpg owner's uploads use, so the app can
 *                                           serve it (Supabase when configured,
 *                                           `.data/uploads` otherwise)
 *   src/content/lesson-videos.ts            the manifest the app reads
 *
 * The picture is built in a single pass: five still slides are drawn with
 * ffmpeg's own `drawtext`/`drawbox`, then cross-faded onto each other and
 * muxed with the narration. No image library, no browser, no timeline editor —
 * which is also why it runs in a couple of minutes on a small machine.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { putBlob } from "../../src/lib/blob-store";
import { COURSES, getCourse, type Course, type Lesson } from "../../src/lib/courses";
import {
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  challengeSlide,
  exampleSlide,
  ideaSlide,
  outroSlide,
  titleSlide,
  type SlideContext,
} from "./lib/design";
import {
  welcomeBuildSlide,
  welcomeHowSlide,
  welcomeStartSlide,
  welcomeTitleSlide,
  type WelcomeContext,
} from "./lib/course-design";
import { TextRuler, slideFilter } from "./lib/draw";
import { detectSilences, ffmpegPath, mediaDuration, runOrThrow } from "./lib/ffmpeg";
import { FADE, planTimeline, type Beat, type Plan } from "./lib/timeline";

const FPS = 24;
const CRF = process.env.VIDEO_CRF ?? "23";
const PRESET = process.env.VIDEO_PRESET ?? "veryfast";
const LEAD_IN = 1.8; // silence before the voice, so the title card can land
const TAIL = 3.2; // seconds of outro after the last sentence
const TARGET_SECONDS = 150; // every lesson walkthrough targets 2.5 minutes

const ROOT = process.cwd();
const WORK = path.join(ROOT, ".data/lesson-videos");
const AUDIO_DIR = path.join(WORK, "audio");
const SLIDE_DIR = path.join(WORK, "slides");
const SCRIPTS = path.join(ROOT, "content/lesson-videos");
const COURSE_SCRIPTS = path.join(ROOT, "content/course-videos");
const MANIFEST = path.join(ROOT, "src/content/lesson-videos.ts");
const COURSE_MANIFEST = path.join(ROOT, "src/content/course-videos.ts");
const COURSE_TARGET_SECONDS = 90;

/* -------------------------------------------------------------------------- */
/* Narration scripts                                                          */
/* -------------------------------------------------------------------------- */

interface Script {
  title: string;
  idea: string;
  example: string;
  challenge: string;
}

interface ScriptFile {
  course: string;
  voice?: string;
  lessons: Record<string, Script>;
}

function loadScripts(): Map<string, { script: Script; voice: string }> {
  const found = new Map<string, { script: Script; voice: string }>();
  if (!existsSync(SCRIPTS)) return found;
  for (const name of readdirSync(SCRIPTS).filter((file) => file.endsWith(".json")).sort()) {
    const file = JSON.parse(readFileSync(path.join(SCRIPTS, name), "utf8")) as ScriptFile;
    for (const [lessonId, script] of Object.entries(file.lessons ?? {})) {
      found.set(lessonId, { script, voice: file.voice ?? "voice-00" });
    }
  }
  return found;
}

/** The paragraphs, in slide order. The last slide is the outro: not spoken. */
function beatsFor(script: Script): Beat[] {
  return [
    { id: "title", label: "Introduction", narration: script.title },
    { id: "idea", label: "The idea", narration: script.idea },
    { id: "example", label: "Worked example", narration: script.example },
    { id: "challenge", label: "Your turn", narration: script.challenge },
    { id: "outro", label: "Up next", narration: "" },
  ];
}

/** The exact text to synthesise for a lesson — one recording, four paragraphs. */
export function narrationText(script: Script): string {
  return [script.title, script.idea, script.example, script.challenge].join("\n\n");
}

/* -------------------------------------------------------------------------- */
/* One lesson                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The audio half of the filter graph.
 *
 * The recording is cut only at the points where a reading pause goes in (both
 * cuts land inside a pause, so nothing is clipped), the cuts are joined back
 * with silence between them, and the result is delayed by the lead-in and
 * padded so the outro can play out. `concat` needs matching streams, hence the
 * `aformat` on both sides.
 */
function audioFilters(plan: Plan, audioIndex: number): string[] {
  const pieces = plan.audio;
  const filters: string[] = [];
  const narration = `[${audioIndex}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono`;
  const gaps = pieces.filter((piece) => piece.gap > 0);

  if (pieces.length > 1) {
    filters.push(`${narration},asplit=${pieces.length}${pieces.map((_, index) => `[n${index}]`).join("")}`);
  } else {
    filters.push(`${narration}[n0]`);
  }
  if (gaps.length) {
    const silenceIndex = audioIndex + 1;
    const source = `[${silenceIndex}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono`;
    filters.push(
      gaps.length > 1
        ? `${source},asplit=${gaps.length}${gaps.map((_, index) => `[g${index}]`).join("")}`
        : `${source}[g0]`
    );
  }

  const sequence: string[] = [];
  pieces.forEach((piece, index) => {
    filters.push(
      `[n${index}]atrim=start=${piece.start.toFixed(3)}:end=${piece.end.toFixed(3)},asetpts=PTS-STARTPTS[p${index}]`
    );
    sequence.push(`p${index}`);
    if (piece.gap > 0) {
      const gap = gaps.indexOf(piece);
      filters.push(`[g${gap}]atrim=start=0:end=${piece.gap.toFixed(3)},asetpts=PTS-STARTPTS[p${index}gap]`);
      sequence.push(`p${index}gap`);
    }
  });

  filters.push(`${sequence.map((label) => `[${label}]`).join("")}concat=n=${sequence.length}:v=0:a=1[joined]`);
  filters.push(
    `[joined]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,` +
      `adelay=${Math.round(LEAD_IN * 1000)}|${Math.round(LEAD_IN * 1000)},apad[a]`
  );
  return filters;
}

/**
 * A path as an ffmpeg *input* argument. Inputs are ordinary argv strings, so
 * nothing is escaped here — escaping belongs to the filter graph (`draw.ts`).
 */
function inputPath(file: string): string {
  return (path.relative(ROOT, file) || file).replace(/\\/g, "/");
}

function positionOf(course: Course, lesson: Lesson): { number: number; total: number; moduleTitle: string; next?: Lesson } {
  const lessons = course.modules.flatMap((module) => module.lessons);
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const module = course.modules.find((item) => item.lessons.some((candidate) => candidate.id === lesson.id));
  return {
    number: index + 1,
    total: lessons.length,
    moduleTitle: module?.title ?? "",
    next: lessons[index + 1],
  };
}

/** Draws one slide to a PNG and returns its path. */
async function renderSlide(ops: Op[], file: string, ruler: TextRuler): Promise<string> {
  await runOrThrow([
    "-hide_banner",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=black:s=${SLIDE_WIDTH}x${SLIDE_HEIGHT}`,
    "-vf",
    slideFilter(ops, ruler),
    "-frames:v",
    "1",
    file,
  ]);
  return file;
}

/**
 * Renders the plan to a finished mp4: the stills composited over a black base,
 * the narration spliced with its reading pauses, and the poster frame.
 *
 * The slides are held on top of the base and cross-faded by fading each one's
 * own alpha, so the incoming slide fades up as the outgoing one fades down —
 * the change of picture lands on the sentence it belongs to. Each still is only
 * composited over the window it is on screen, which keeps the encode close to
 * the cost of the pictures themselves: a two-and-a-half-minute lesson renders in well
 * under a minute.
 */
async function encodeVideo(options: {
  slideFiles: string[];
  plan: Plan;
  audio: string;
  output: string;
  metadataTitle: string;
}): Promise<void> {
  const { slideFiles, plan, audio, output } = options;
  const args: string[] = [
    "-hide_banner",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=black:s=${SLIDE_WIDTH}x${SLIDE_HEIGHT}:r=${FPS}:d=${plan.total.toFixed(3)}`,
  ];
  plan.slides.forEach((slide, index) => {
    args.push("-framerate", String(FPS), "-loop", "1", "-t", slide.duration.toFixed(3), "-i", inputPath(slideFiles[index]));
  });
  const audioIndex = plan.slides.length + 1;
  args.push("-i", inputPath(audio));
  // A silent source, so the reading pauses are spliced into the recording
  // rather than the recording being stretched to make room for them.
  args.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono");

  const filters: string[] = [];
  plan.slides.forEach((slide, index) => {
    const fadeOut = index === plan.slides.length - 1 ? 0.8 : FADE;
    const steps = [
      "format=rgba",
      `fade=t=in:st=0:d=${index === 0 ? 0.6 : FADE}:alpha=1`,
      `fade=t=out:st=${Math.max(0, slide.duration - fadeOut).toFixed(3)}:d=${fadeOut}:alpha=1`,
      `setpts=PTS-STARTPTS+${slide.begin.toFixed(3)}/TB`,
    ];
    filters.push(`[${index + 1}:v]${steps.join(",")}[v${index}]`);
  });
  let previous = "0:v";
  plan.slides.forEach((slide, index) => {
    const label = index === plan.slides.length - 1 ? "vout" : `b${index}`;
    filters.push(
      `[${previous}][v${index}]overlay=enable='between(t,${slide.begin.toFixed(3)},${(slide.begin + slide.duration).toFixed(3)})'[${label}]`
    );
    previous = label;
  });
  filters.push(`[vout]format=yuv420p[v]`);
  filters.push(...audioFilters(plan, audioIndex));

  args.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    PRESET,
    "-crf",
    CRF,
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(FPS),
    "-g",
    String(FPS * 2),
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-t",
    plan.total.toFixed(3),
    "-metadata",
    `title=${options.metadataTitle}`,
    output
  );

  await runOrThrow(args);
}

/**
 * Stretches natural reading pauses, then evenly pads the paragraph gaps until
 * the lesson reaches its target length. The extra silence is attached to the
 * lesson's four slide boundaries, not hidden in a long end card, so learners
 * have time to read each slide while the matching narration is quiet.
 */
function planToTarget(options: {
  beats: Beat[];
  audioDuration: number;
  silences: Awaited<ReturnType<typeof detectSilences>>["silences"];
  target: number;
}): Plan {
  const { beats, audioDuration, silences, target } = options;
  let plan = planTimeline({ beats, audioDuration, silences, leadIn: LEAD_IN, tail: TAIL });
  const pauseScales = [1.15, 1.3, 1.45, 1.6, 1.8];
  for (const pauseScale of pauseScales) {
    if (plan.total >= target) break;
    plan = planTimeline({ beats, audioDuration, silences, leadIn: LEAD_IN, tail: TAIL, pauseScale });
  }

  if (plan.total < target) {
    const narratedParagraphs = beats.filter((beat) => beat.narration.trim()).length;
    const pausePadding = narratedParagraphs ? (target - plan.total) / narratedParagraphs : 0;
    plan = planTimeline({
      beats,
      audioDuration,
      silences,
      leadIn: LEAD_IN,
      tail: TAIL,
      pauseScale: pauseScales[pauseScales.length - 1],
      pausePadding,
    });
  }
  return plan;
}

/** A scratch path that a second build can never be writing to at the same time. */
function scratchPath(name: string, extension: string): string {
  const dir = path.join(WORK, "out");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}-${process.pid}.${extension}`);
  rmSync(file, { force: true });
  return file;
}

async function buildLesson(options: {
  course: Course;
  lesson: Lesson;
  script: Script;
  voice: string;
  ruler: TextRuler;
  slidesOnly?: boolean;
}): Promise<ManifestEntry | null> {
  const { course, lesson, script, voice, ruler } = options;
  const audio = path.join(AUDIO_DIR, `${lesson.id}.mp3`);
  if (!existsSync(audio)) return null;

  const position = positionOf(course, lesson);
  const slidesDir = path.join(SLIDE_DIR, lesson.id);
  mkdirSync(slidesDir, { recursive: true });

  const { silences, duration: audioDuration } = await detectSilences(audio);
  const beats = beatsFor(script);
  const plan = planToTarget({ beats, audioDuration, silences, target: TARGET_SECONDS });

  const context: SlideContext = {
    ruler,
    course,
    lesson,
    lessonNumber: position.number,
    lessonTotal: position.total,
    durationSeconds: plan.total,
    nextLesson: position.next,
  };

  const builders = [titleSlide, ideaSlide, exampleSlide, challengeSlide, outroSlide];
  const slideFiles: string[] = [];
  for (let index = 0; index < plan.slides.length; index++) {
    const file = path.join(slidesDir, `${String(index + 1).padStart(2, "0")}-${plan.slides[index].id}.png`);
    slideFiles.push(await renderSlide(await builders[index](context), file, ruler));
  }

  if (options.slidesOnly) {
    console.log(`\n   slides: ${slideFiles.map((file) => path.relative(ROOT, file)).join(", ")}`);
    return null;
  }

  const key = `lessonvideo__${lesson.id}.mp4`;
  const posterKey = `lessonvideo__${lesson.id}--poster.jpg`;
  const output = scratchPath(lesson.id, "mp4");
  const poster = scratchPath(`${lesson.id}-poster`, "jpg");

  await encodeVideo({
    slideFiles,
    plan,
    audio,
    output,
    metadataTitle: `${lesson.title} — ${course.title}`,
  });
  const actualDuration = await mediaDuration(output);
  if (actualDuration < 120 || actualDuration > 180) {
    throw new Error(`${lesson.id}: rendered duration ${actualDuration.toFixed(2)}s is outside 120–180 seconds`);
  }
  await runOrThrow(["-hide_banner", "-y", "-i", inputPath(slideFiles[0]), "-frames:v", "1", "-q:v", "3", poster]);

  const video = readFileSync(output);
  const image = readFileSync(poster);
  await putBlob(key, new Uint8Array(video), "video/mp4");
  await putBlob(posterKey, new Uint8Array(image), "image/jpeg");
  rmSync(output, { force: true });
  rmSync(poster, { force: true });

  return {
    lessonId: lesson.id,
    courseId: course.id,
    title: lesson.title,
    durationSeconds: Number(actualDuration.toFixed(2)),
    narrationSeconds: Number(audioDuration.toFixed(2)),
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    format: "video/mp4",
    key,
    name: `${lesson.title} — video walkthrough.mp4`,
    size: video.byteLength,
    poster: { key: posterKey, name: `${lesson.title} — poster.jpg`, size: image.byteLength, format: "image/jpeg" },
    chapters: plan.chapters,
    approximateTiming: plan.approximate,
    voice,
    generatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Course welcome videos                                                      */
/* -------------------------------------------------------------------------- */

interface WelcomeScript {
  intro: string;
  build: string;
  how: string;
}

function loadWelcomeScripts(): Map<string, { script: WelcomeScript; voice: string }> {
  const found = new Map<string, { script: WelcomeScript; voice: string }>();
  if (!existsSync(COURSE_SCRIPTS)) return found;
  for (const name of readdirSync(COURSE_SCRIPTS).filter((file) => file.endsWith(".json")).sort()) {
    const file = JSON.parse(readFileSync(path.join(COURSE_SCRIPTS, name), "utf8")) as {
      course: string;
      voice?: string;
      welcome: WelcomeScript;
    };
    if (file.welcome) found.set(file.course, { script: file.welcome, voice: file.voice ?? "voice-00" });
  }
  return found;
}

/** The paragraphs to synthesise for a course welcome, in slide order. */
export function welcomeNarrationText(script: WelcomeScript): string {
  return [script.intro, script.build, script.how].join("\n\n");
}

function welcomeBeats(script: WelcomeScript): Beat[] {
  return [
    { id: "welcome", label: "Welcome", narration: script.intro },
    { id: "build", label: "What you will build", narration: script.build },
    { id: "how", label: "How it works", narration: script.how },
    { id: "start", label: "Start here", narration: "" },
  ];
}

async function buildCourseVideo(options: {
  course: Course;
  script: WelcomeScript;
  voice: string;
  ruler: TextRuler;
  slidesOnly?: boolean;
}): Promise<CourseVideoEntry | null> {
  const { course, script, voice, ruler } = options;
  const audio = path.join(AUDIO_DIR, `course-${course.slug}.mp3`);
  if (!existsSync(audio)) return null;

  const lessons = course.modules.flatMap((module) => module.lessons);
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const slidesDir = path.join(SLIDE_DIR, `course-${course.slug}`);
  mkdirSync(slidesDir, { recursive: true });

  const { silences, duration: audioDuration } = await detectSilences(audio);
  const beats = welcomeBeats(script);
  const plan = planToTarget({ beats, audioDuration, silences, target: COURSE_TARGET_SECONDS });

  const context: WelcomeContext = {
    ruler,
    course,
    narration: script,
    lessonCount: lessons.length,
    totalMinutes,
    durationSeconds: plan.total,
  };

  const builders = [welcomeTitleSlide, welcomeBuildSlide, welcomeHowSlide, welcomeStartSlide];
  const slideFiles: string[] = [];
  for (let index = 0; index < plan.slides.length; index++) {
    const file = path.join(slidesDir, `${String(index + 1).padStart(2, "0")}-${plan.slides[index].id}.png`);
    slideFiles.push(await renderSlide(await builders[index](context), file, ruler));
  }

  if (options.slidesOnly) {
    console.log(`\n   slides: ${slideFiles.map((file) => path.relative(ROOT, file)).join(", ")}`);
    return null;
  }

  const key = `coursevideo__${course.slug}.mp4`;
  const posterKey = `coursevideo__${course.slug}--poster.jpg`;
  const output = scratchPath(`course-${course.slug}`, "mp4");
  const poster = scratchPath(`course-${course.slug}-poster`, "jpg");

  await encodeVideo({ slideFiles, plan, audio, output, metadataTitle: `${course.title} — welcome` });
  await runOrThrow(["-hide_banner", "-y", "-i", inputPath(slideFiles[0]), "-frames:v", "1", "-q:v", "3", poster]);

  const video = readFileSync(output);
  const image = readFileSync(poster);
  await putBlob(key, new Uint8Array(video), "video/mp4");
  await putBlob(posterKey, new Uint8Array(image), "image/jpeg");
  rmSync(output, { force: true });
  rmSync(poster, { force: true });

  return {
    courseId: course.id,
    slug: course.slug,
    title: `${course.title} — welcome`,
    durationSeconds: Number(plan.total.toFixed(2)),
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    format: "video/mp4",
    key,
    name: `${course.title} — welcome video.mp4`,
    size: video.byteLength,
    poster: { key: posterKey, name: `${course.title} — welcome poster.jpg`, size: image.byteLength, format: "image/jpeg" },
    voice,
    generatedAt: new Date().toISOString(),
  };
}

interface CourseVideoEntry {
  courseId: string;
  slug: string;
  title: string;
  durationSeconds: number;
  width: number;
  height: number;
  format: string;
  key: string;
  name: string;
  size: number;
  poster: { key: string; name: string; size: number; format: string };
  voice: string;
  generatedAt: string;
}

function readCourseManifest(): Record<string, CourseVideoEntry> {
  if (!existsSync(COURSE_MANIFEST)) return {};
  const source = readFileSync(COURSE_MANIFEST, "utf8");
  // The file is a module, not JSON: skip the comment header and the type import
  // and parse the object literal assigned to the exported constant.
  const equals = source.indexOf("= {");
  const start = equals === -1 ? -1 : equals + 2;
  const end = source.lastIndexOf("}");
  if (start === -1 || end <= start) return {};
  try {
    return JSON.parse(source.slice(start, end + 1)) as Record<string, CourseVideoEntry>;
  } catch {
    return {};
  }
}

function writeGeneratedFile(file: string, contents: string): void {
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, contents);
  renameSync(temporary, file);
}

function writeCourseManifest(entries: Record<string, CourseVideoEntry>): void {
  const order = new Map(COURSES.map((course, index) => [course.slug, index]));
  const sorted = Object.values(entries).sort((a, b) => (order.get(a.slug) ?? 9999) - (order.get(b.slug) ?? 9999));
  const body = JSON.stringify(Object.fromEntries(sorted.map((entry) => [entry.slug, entry])), null, 2);
  const header = [
    "/**",
    " * The teacher's welcome video for each course — generated by `npm run videos:build`.",
    " *",
    " * Keyed by course slug. The scripts that produced them are in",
    " * `content/course-videos/`, and the files live in the configured storage,",
    " * served through `/api/course-videos/[slug]` so access is checked first.",
    " */",
    'import type { CourseVideoEntry } from "@/lib/course-videos";',
    "",
    "export const COURSE_VIDEOS: Record<string, CourseVideoEntry> = " + body + ";",
    "",
  ].join("\n");
  writeGeneratedFile(COURSE_MANIFEST, header);
}

/* -------------------------------------------------------------------------- */
/* Manifest                                                                   */
/* -------------------------------------------------------------------------- */

export interface ManifestEntry {
  lessonId: string;
  courseId: string;
  title: string;
  durationSeconds: number;
  narrationSeconds: number;
  width: number;
  height: number;
  format: string;
  key: string;
  name: string;
  size: number;
  poster: { key: string; name: string; size: number; format: string };
  chapters: { label: string; start: number }[];
  approximateTiming: boolean;
  voice: string;
  generatedAt: string;
}

function readManifest(): Record<string, ManifestEntry> {
  if (!existsSync(MANIFEST)) return {};
  const source = readFileSync(MANIFEST, "utf8");
  // The file is a module, not JSON: skip the comment header and the type import
  // and parse the object literal assigned to the exported constant.
  const equals = source.indexOf("= {");
  const start = equals === -1 ? -1 : equals + 2;
  const end = source.lastIndexOf("}");
  if (start === -1 || end <= start) return {};
  try {
    return JSON.parse(source.slice(start, end + 1)) as Record<string, ManifestEntry>;
  } catch {
    return {};
  }
}

function writeManifest(entries: Record<string, ManifestEntry>): void {
  const order = new Map<string, number>();
  let index = 0;
  for (const course of COURSES) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) order.set(lesson.id, index++);
    }
  }
  const sorted = Object.values(entries).sort(
    (a, b) => (order.get(a.lessonId) ?? 9999) - (order.get(b.lessonId) ?? 9999)
  );
  const body = JSON.stringify(Object.fromEntries(sorted.map((entry) => [entry.lessonId, entry])), null, 2);
  const header = `/**
 * The lesson videos that ship with the site — generated by \`npm run videos:build\`.
 *
 * One entry per lesson: the file the player streams (through the app's own
 * storage, so access is checked before a byte is served), the poster the
 * browser shows before playback, and the chapter marks. The narration scripts
 * that produced these are in \`content/lesson-videos/\`; the videos themselves
 * live in the configured storage (Supabase, or \`.data/uploads\` on disk), not
 * in this repository.
 *
 * Regenerate rather than edit: \`npm run videos:build -- --all --force\`.
 */
import type { LessonVideoEntry } from "@/lib/lesson-videos";

export const LESSON_VIDEOS: Record<string, LessonVideoEntry> = ${body};
`;
  writeGeneratedFile(MANIFEST, header);
}

/* -------------------------------------------------------------------------- */
/* Runner                                                                     */
/* -------------------------------------------------------------------------- */

function parseArgs(argv: string[]) {
  const flags = { all: false, force: false, slidesOnly: false, list: false, course: "", lesson: "" };
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--all") flags.all = true;
    else if (value === "--force") flags.force = true;
    else if (value === "--slides-only") flags.slidesOnly = true;
    else if (value === "--list") flags.list = true;
    else if (value === "--course") flags.course = argv[++index] ?? "";
    else if (value === "--lesson") flags.lesson = argv[++index] ?? "";
  }
  return flags;
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv.slice(2));
  const scripts = loadScripts();
  const welcomeScripts = loadWelcomeScripts();
  const manifest = readManifest();
  const courseManifest = readCourseManifest();
  const ruler = new TextRuler(WORK);
  mkdirSync(AUDIO_DIR, { recursive: true });

  const targets: { course: Course; lesson: Lesson; script: Script; voice: string }[] = [];
  const welcomes: { course: Course; script: WelcomeScript; voice: string }[] = [];
  for (const course of COURSES) {
    if (flags.course && course.id !== flags.course && course.slug !== flags.course) continue;
    const welcome = welcomeScripts.get(course.id);
    if (welcome) welcomes.push({ course, script: welcome.script, voice: welcome.voice });
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (flags.lesson && lesson.id !== flags.lesson) continue;
        const found = scripts.get(lesson.id);
        if (!found) continue;
        targets.push({ course, lesson, script: found.script, voice: found.voice });
      }
    }
  }

  if (flags.list) {
    for (const target of targets) {
      const audio = existsSync(path.join(AUDIO_DIR, `${target.lesson.id}.mp3`)) ? "audio ✓" : "audio ✗";
      const built = manifest[target.lesson.id] ? "video ✓" : "video ✗";
      console.log(`${target.lesson.id.padEnd(34)} ${audio}  ${built}`);
    }
    for (const welcome of welcomes) {
      const file = `course-${welcome.course.slug}.mp3`;
      const audio = existsSync(path.join(AUDIO_DIR, file)) ? "audio ✓" : "audio ✗";
      const built = courseManifest[welcome.course.slug] ? "video ✓" : "video ✗";
      console.log(`${file.padEnd(34)} ${audio}  ${built}  (course welcome)`);
    }
    console.log(
      `\n${targets.length} lesson(s) and ${welcomes.length} course welcome(s) scripted · ` +
        `${Object.keys(manifest).length} lesson videos and ${Object.keys(courseManifest).length} course videos built · ffmpeg: ${ffmpegPath()}`
    );
    return;
  }

  // A lesson is rebuilt when it has never been built, or when the caller asks
  // for it: there is no cheap way to tell whether a byte-identical video is
  // still where the storage backend keeps it, and a stale video is worse than
  // a wasted encode.
  const selected = targets.filter((target) => flags.force || flags.slidesOnly || !manifest[target.lesson.id]);
  const selectedWelcomes = welcomes.filter(
    (welcome) => flags.force || flags.slidesOnly || (!flags.lesson && !courseManifest[welcome.course.slug])
  );

  const audioFor = (id: string) => path.join(AUDIO_DIR, `${id}.mp3`);
  const missingAudio = selected.filter((target) => !existsSync(audioFor(target.lesson.id)));
  const ready = selected.filter((target) => existsSync(audioFor(target.lesson.id)));
  const readyWelcomes = selectedWelcomes.filter((welcome) => existsSync(audioFor(`course-${welcome.course.slug}`)));

  console.log(`ffmpeg: ${ffmpegPath()}`);
  console.log(
    `${targets.length} lessons scripted · ${ready.length} lesson video(s) to build · ${readyWelcomes.length} course welcome(s) to build`
  );
  if (missingAudio.length) {
    console.log(`  no narration yet for: ${missingAudio.map((item) => item.lesson.id).join(", ")}`);
  }
  if (!ready.length && !readyWelcomes.length) return;

  const started = Date.now();
  const updated = { ...manifest };
  const updatedCourses = { ...courseManifest };
  const results: (ManifestEntry | null)[] = [];
  const welcomeResults: CourseVideoEntry[] = [];
  const queue: (() => Promise<void>)[] = [
    ...ready.map((target) => async () => {
      const startedAt = Date.now();
      process.stdout.write(`… ${target.lesson.id}`);
      const entry = await buildLesson({ ...target, ruler, slidesOnly: flags.slidesOnly });
      results.push(entry);
      if (entry) {
        updated[entry.lessonId] = entry;
        writeManifest(updated);
      }
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      const size = entry ? `${(entry.size / 1024 / 1024).toFixed(1)} MB` : "no audio";
      process.stdout.write(
        `\r✓ ${target.lesson.id.padEnd(34)} ${entry ? `${entry.durationSeconds.toFixed(0)}s` : "—"}  ${size}  ${seconds}s\n`
      );
    }),
    ...readyWelcomes.map((welcome) => async () => {
      const startedAt = Date.now();
      const id = `course-${welcome.course.slug}`;
      process.stdout.write(`… ${id}`);
      const entry = await buildCourseVideo({ ...welcome, ruler, slidesOnly: flags.slidesOnly });
      if (entry) {
        welcomeResults.push(entry);
        updatedCourses[entry.slug] = entry;
        writeCourseManifest(updatedCourses);
      }
      const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      process.stdout.write(
        `\r✓ ${id.padEnd(34)} ${entry ? `${entry.durationSeconds.toFixed(0)}s` : "—"}  ${entry ? `${(entry.size / 1024 / 1024).toFixed(1)} MB` : ""}  ${seconds}s\n`
      );
    }),
  ];

  // Two encodes at a time: this machine has two cores, and ffmpeg is already
  // using both for a single pass, so more workers would only add contention.
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (cursor < queue.length) await queue[cursor++]();
    })
  );

  writeManifest(updated);
  writeCourseManifest(updatedCourses);

  const total = Object.values(updated);
  const stored =
    total.reduce((sum, entry) => sum + entry.size + entry.poster.size, 0) +
    Object.values(updatedCourses).reduce((sum, entry) => sum + entry.size + entry.poster.size, 0);
  console.log(
    `\n${results.filter(Boolean).length} lesson video(s) and ${welcomeResults.length} welcome video(s) in ` +
      `${((Date.now() - started) / 1000 / 60).toFixed(1)} min · ` +
      `${total.length} + ${Object.keys(updatedCourses).length} in the manifests · ${(stored / 1024 / 1024).toFixed(1)} MB stored`
  );
  ruler.clean();
  if (!process.env.KEEP_SLIDES) rmSync(SLIDE_DIR, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
