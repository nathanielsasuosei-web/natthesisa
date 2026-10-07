/**
 * Checks the lesson-video scripts against the catalog: `npm run videos:check`.
 *
 * The failure this exists to catch is a script file keyed by a lesson id that
 * does not exist, or a lesson with no script. Both are silent problems: the
 * build simply produces fewer videos than it should, and nobody notices until a
 * learner opens a lesson with no walkthrough.
 *
 * The same rules are applied to the course welcome scripts. It also verifies
 * the generated manifest: all catalog lessons need a video entry before the
 * check passes, which catches incomplete builds rather than just missing prose.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { COURSES } from "../../src/lib/courses";
import { lessonVideo, lessonVideoCount } from "../../src/lib/lesson-videos";

const ROOT = process.cwd();
const LESSON_SCRIPTS = path.join(ROOT, "content/lesson-videos");
const COURSE_SCRIPTS = path.join(ROOT, "content/course-videos");
const AUDIO_DIR = path.join(ROOT, ".data/lesson-videos/audio");
const MIN_VIDEO_SECONDS = 120;
const MAX_VIDEO_SECONDS = 180;

function readDir(dir: string): { file: string; data: Record<string, unknown> }[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ file: name, data: JSON.parse(readFileSync(path.join(dir, name), "utf8")) as Record<string, unknown> }));
}

function main(): void {
  const lessons = new Map<string, { courseId: string; title: string }>();
  for (const course of COURSES) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) lessons.set(lesson.id, { courseId: course.id, title: lesson.title });
    }
  }

  const problems: string[] = [];
  const scripted = new Map<string, string>();
  let wordCount = 0;

  for (const { file, data } of readDir(LESSON_SCRIPTS)) {
    const courseId = String(data.course ?? "");
    const course = COURSES.find((item) => item.id === courseId);
    if (!course) {
      problems.push(`${file}: course “${courseId}” is not in the catalog`);
      continue;
    }
    const entries = (data.lessons ?? {}) as Record<string, Record<string, string>>;
    const known = new Set(course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)));
    for (const [lessonId, script] of Object.entries(entries)) {
      if (!known.has(lessonId)) problems.push(`${file}: “${lessonId}” is not a lesson in ${courseId}`);
      for (const key of ["title", "idea", "example", "challenge"]) {
        if (!script[key]?.trim()) problems.push(`${file}: ${lessonId} has no “${key}” paragraph`);
      }
      const text = ["title", "idea", "example", "challenge"].map((key) => script[key] ?? "").join(" ");
      wordCount += text.split(/\s+/).filter(Boolean).length;
      scripted.set(lessonId, courseId);
    }
  }

  const unscripted: { courseId: string; title: string }[] = [];
  for (const [lessonId, lesson] of lessons) {
    if (!scripted.has(lessonId)) unscripted.push(lesson);
  }

  const missingVideos = [...lessons].filter(([lessonId]) => !lessonVideo(lessonId));
  const outOfRangeVideos: { lessonId: string; title: string; duration: number }[] = [];
  for (const [lessonId, lesson] of lessons) {
    const video = lessonVideo(lessonId);
    if (video && (video.durationSeconds < MIN_VIDEO_SECONDS || video.durationSeconds > MAX_VIDEO_SECONDS)) {
      outOfRangeVideos.push({ lessonId, title: lesson.title, duration: video.durationSeconds });
    }
  }

  const welcomeCourses = new Set<string>();
  for (const { file, data } of readDir(COURSE_SCRIPTS)) {
    const courseId = String(data.course ?? "");
    if (!COURSES.some((course) => course.id === courseId)) {
      problems.push(`${file}: course “${courseId}” is not in the catalog`);
      continue;
    }
    const welcome = (data.welcome ?? {}) as Record<string, string>;
    for (const key of ["intro", "build", "how"]) {
      if (!welcome[key]?.trim()) problems.push(`${file}: the welcome script has no “${key}” paragraph`);
    }
    welcomeCourses.add(courseId);
  }
  for (const course of COURSES) {
    if (!welcomeCourses.has(course.id)) problems.push(`${course.id}: no course welcome script in content/course-videos/`);
  }

  const withAudio = [...scripted.keys()].filter((lessonId) => existsSync(path.join(AUDIO_DIR, `${lessonId}.mp3`)));
  const missingAudio = [...scripted.keys()].filter(
    (lessonId) => !lessonVideo(lessonId) && !existsSync(path.join(AUDIO_DIR, `${lessonId}.mp3`))
  );
  const welcomesWithAudio = [...welcomeCourses].filter((courseId) => {
    const course = COURSES.find((item) => item.id === courseId);
    return course ? existsSync(path.join(AUDIO_DIR, `course-${course.slug}.mp3`)) : false;
  });

  console.log(`lessons in the catalog      ${lessons.size}`);
  console.log(`lessons with a script       ${scripted.size}  (${wordCount.toLocaleString()} words of narration)`);
  console.log(`lessons with narration      ${withAudio.length}`);
  console.log(`lessons with a video        ${lessonVideoCount()}`);
  console.log(`videos outside 120–180 sec  ${outOfRangeVideos.length}`);
  console.log(`course welcome scripts      ${welcomeCourses.size} of ${COURSES.length}  (${welcomesWithAudio.length} narrated)`);
  console.log("");
  if (unscripted.length) {
    console.log(`No script yet (${unscripted.length}):`);
    for (const lesson of unscripted) console.log(`  · ${lesson.title}`);
    console.log("");
  }
  if (missingAudio.length) {
    console.log(`No narration audio yet (${missingAudio.length}):`);
    for (const lessonId of missingAudio) console.log(`  · ${lessons.get(lessonId)?.title ?? lessonId}`);
    console.log("");
  }
  if (missingVideos.length) {
    console.log(`No video yet (${missingVideos.length}):`);
    for (const [, lesson] of missingVideos) console.log(`  · ${lesson.title}`);
    console.log("");
  }
  if (outOfRangeVideos.length) {
    console.log(`Video length outside 2–3 minutes (${outOfRangeVideos.length}):`);
    for (const video of outOfRangeVideos) {
      console.log(`  · ${video.title} — ${video.duration.toFixed(1)} seconds`);
    }
    console.log("");
  }
  if (problems.length) {
    console.log(`Problems (${problems.length}):`);
    for (const problem of problems) console.log(`  ✗ ${problem}`);
    process.exitCode = 1;
    return;
  }
  if (unscripted.length || missingAudio.length || missingVideos.length || outOfRangeVideos.length) {
    process.exitCode = 1;
    return;
  }
  console.log("✓ every lesson has narration, a generated video, and a matching script");
}

main();
