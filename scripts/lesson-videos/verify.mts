/**
 * Proves the generated videos are actually in the configured storage:
 * `npm run videos:verify`.
 *
 * `videos:check` verifies the scripts and the manifest, but the manifest is
 * committed while the bytes are not — a fresh checkout, or a deployment whose
 * storage was never filled, lists videos it cannot serve, and every one of
 * them answers 410 ("missing from storage"). This script stats each manifest
 * entry (video and poster) against the storage the app is configured to use
 * and reports what is really playable.
 *
 * Options:
 *   --course <id|slug>   verify one course
 *   --lesson <id>        verify one lesson
 *
 * Run it from the machine whose storage matters: with Supabase variables set
 * it checks the bucket, otherwise the local `.data/uploads` fallback.
 */
import { COURSES } from "../../src/lib/courses";
import { blobBackend, storageSummary } from "../../src/lib/blob-store";
import { verifyVideoStorage } from "../../src/lib/video-availability";
import { loadEnv } from "../load-env.mts";

loadEnv(); // .env.local, the same file the app reads

function parseArgs(argv: string[]): { course: string; lesson: string } {
  const flags = { course: "", lesson: "" };
  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--course") flags.course = argv[++index] ?? "";
    else if (value === "--lesson") flags.lesson = argv[++index] ?? "";
  }
  return flags;
}

const flags = parseArgs(process.argv.slice(2));
const courseFilter = COURSES.find((course) => course.id === flags.course || course.slug === flags.course);
if (flags.course && !courseFilter) {
  console.error(`No course “${flags.course}” in the catalog.`);
  process.exit(1);
}

console.log(`storage  : ${storageSummary()}`);
console.log(`backend  : ${blobBackend() === "supabase" ? "Supabase Storage" : "local disk (fallback)"}`);
console.log("");

const { checks, unreachable } = await verifyVideoStorage();
const scoped = checks.filter(
  (check) =>
    (!courseFilter || check.courseId === courseFilter.id) &&
    (!flags.lesson || check.id === flags.lesson)
);
if (flags.lesson && scoped.length === 0) {
  console.error(`No video listed for lesson “${flags.lesson}”.`);
  process.exit(1);
}

const missing = scoped.filter((check) => check.video === false || check.poster === false);
const unknown = scoped.filter((check) => check.video === null || check.poster === null);
const mismatched = scoped.filter((check) => check.sizeMismatch);

if (missing.length) {
  console.log(`Missing from storage (${missing.length}):`);
  const byCourse = new Map<string, typeof missing>();
  for (const check of missing) {
    const list = byCourse.get(check.courseId) ?? [];
    list.push(check);
    byCourse.set(check.courseId, list);
  }
  for (const [courseId, list] of [...byCourse].sort()) {
    const course = COURSES.find((item) => item.id === courseId);
    console.log(`  ${course?.shortTitle ?? courseId}:`);
    for (const check of list) {
      const parts = [
        check.video === false ? "video" : null,
        check.poster === false ? "poster" : null,
      ].filter(Boolean);
      console.log(`    ✘ ${check.title} — ${parts.join(" + ")} absent (${check.key})`);
    }
  }
  console.log("");
}
if (mismatched.length) {
  console.log(`Present but a different size than the manifest (${mismatched.length}):`);
  for (const check of mismatched) console.log(`    ! ${check.title} — expected ${check.expectedSize} bytes (${check.key})`);
  console.log("");
}
if (unknown.length) {
  console.log(`Storage could not be reached for (${unknown.length}):`);
  for (const check of unknown) console.log(`    ? ${check.title} (${check.key})`);
  console.log("");
}

const lessons = scoped.filter((check) => check.kind === "lesson");
const welcomes = scoped.filter((check) => check.kind === "welcome");
const playableLessons = lessons.filter((check) => check.video === true).length;
const playableWelcomes = welcomes.filter((check) => check.kind === "welcome" && check.video === true).length;
console.log(`lesson walkthroughs playable  ${playableLessons} of ${lessons.length}`);
console.log(`course welcomes playable      ${playableWelcomes} of ${welcomes.length}`);

if (missing.length || mismatched.length || unknown.length || unreachable) {
  console.log("");
  if (blobBackend() === "disk") {
    console.log("The files are not on this machine's disk. Rebuild them here with:");
    console.log("  npm run videos:synthesize   # narration audio (once per machine)");
    console.log("  npm run videos:build        # render whatever has narration but no video yet");
  } else {
    console.log("The bucket does not hold these files. From a machine that can reach it, with the");
    console.log("Supabase variables set, run the build so the bytes upload to the bucket:");
    console.log("  npm run videos:synthesize && npm run videos:build");
  }
  process.exit(1);
}

console.log("");
console.log("✓ every listed video is present in storage and playable");
