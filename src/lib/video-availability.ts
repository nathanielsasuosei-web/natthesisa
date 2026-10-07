/**
 * Whether a generated video can actually be played right now. Server-only.
 *
 * The manifests (`src/content/lesson-videos.ts`, `src/content/course-videos.ts`)
 * are committed to the repository, but the bytes live in the configured
 * storage — Supabase Storage, or `.data/uploads` on disk — which does not
 * travel with a deploy. A manifest entry on its own therefore only means "this
 * video was built somewhere, once". These helpers pair each entry with a
 * storage check, so that:
 *
 *   - a lesson page never renders a player for a file the video routes would
 *     answer with 410 ("missing from storage");
 *   - the owner console can tell "not generated yet" apart from "generated,
 *     but the bytes never reached this deployment's storage".
 *
 * Keep this module out of client components: `blob-store` uses Node APIs.
 *
 * Two things make the answer cheap enough to ask on every page view, and
 * specific enough to act on:
 *
 *   - definite answers are remembered for a few minutes per instance, so a
 *     lesson page and a course page do not each pay for their own round trip;
 *   - a failure carries its *category* (`bucket-missing`, `auth-rejected`,
 *     `network`, …) and the fix for it, so the teacher console and
 *     `/api/health` can say which knob to turn instead of "try again later".
 *     Failures are never cached, so a re-check is always a real re-check.
 */
import { COURSE_VIDEOS } from "@/content/course-videos";
import { LESSON_VIDEOS } from "@/content/lesson-videos";
import { statBlob, type BlobStat, type StorageFailureKind } from "./blob-store";
import { courseVideo, type CourseVideoEntry } from "./course-videos";
import { lessonVideo, type LessonVideoEntry } from "./lesson-videos";

export interface VideoAvailability<T> {
  entry: T;
  /** The video bytes exist in the configured storage. */
  video: boolean;
  /** The poster image exists in the configured storage. */
  poster: boolean;
  /**
   * True when the storage itself could not be reached, as opposed to the file
   * simply being absent. Callers show a "try again" note rather than "no
   * video", so a transient outage does not read as missing content.
   */
  unreachable: boolean;
  /** Why it could not be reached, when it could not. */
  failure: StorageFailureKind | null;
  /** The fix, in plain language — for the owner console, never for students. */
  hint: string | null;
}

interface PresenceAnswer {
  /** True/false when storage answered, null when it could not be reached. */
  present: boolean | null;
  failure: StorageFailureKind | null;
  hint: string | null;
}

/**
 * Presence answers, remembered briefly.
 *
 * A lesson page asks about two objects (the video and its poster) on every
 * render, and a course page asks again. Each question is one request to
 * Supabase, so without a memory of the answer every page view pays for it —
 * and a single rate-limit response on a cold start becomes a warning the
 * reader can see. Answers are kept per instance, which on a serverless host
 * means "for as long as this instance is warm": enough to collapse a burst of
 * page views into one round trip, and never enough to serve a stale answer
 * for long.
 *
 * Only *definite* answers are cached. A failure is not cached, so the owner
 * console's "Check again" button always really checks again, and a storage
 * blip clears on the next request rather than sticking for the TTL.
 */
const PRESENT_TTL_MS = 5 * 60_000; // a file that is there stays there
const ABSENT_TTL_MS = 60_000; // …and a rebuild may land at any moment
const CACHE_LIMIT = 1000;
const presenceCache = new Map<string, { at: number; answer: PresenceAnswer }>();

function cachedPresence(key: string): PresenceAnswer | null {
  const hit = presenceCache.get(key);
  if (!hit) return null;
  const ttl = hit.answer.present ? PRESENT_TTL_MS : ABSENT_TTL_MS;
  if (Date.now() - hit.at > ttl) {
    presenceCache.delete(key);
    return null;
  }
  return hit.answer;
}

function rememberPresence(key: string, answer: PresenceAnswer): void {
  if (answer.present === null) return; // a failure is never cached
  if (presenceCache.size >= CACHE_LIMIT) {
    const oldest = presenceCache.keys().next().value;
    if (oldest !== undefined) presenceCache.delete(oldest);
  }
  presenceCache.set(key, { at: Date.now(), answer });
}

/** Drops the cache — used by the owner console's re-check and by the scripts. */
export function clearVideoAvailabilityCache(): void {
  presenceCache.clear();
}

/**
 * Presence of one object: true when it is there, false when storage answers
 * and it is not, null when storage could not be reached at all.
 *
 * Storage metadata requests are deliberately retried once. The owner page
 * checks many objects at once and Supabase can briefly return a network error
 * or a rate-limit response when a deployment cold-starts. Treating that first
 * blip as "storage is unreachable" makes a healthy bucket look broken and
 * leaves the teacher with no useful action besides refreshing.
 */
/**
 * One line per failure category, not one per key.
 *
 * The owner console checks every video in the catalog, so a bucket that has
 * gone away would otherwise print a hundred stack traces in a single request —
 * which on a serverless host means a hundred billed log lines saying the same
 * thing. The first of each kind is logged in full; the rest are counted.
 */
const loggedFailures = new Map<StorageFailureKind, number>();

function logFailureOnce(error: unknown): void {
  const kind = (error as { kind?: StorageFailureKind }).kind ?? "unknown";
  const seen = loggedFailures.get(kind) ?? 0;
  loggedFailures.set(kind, seen + 1);
  if (seen > 0) return;
  console.error(`Could not reach video storage (${kind})`, error, {
    hint: (error as { hint?: string }).hint ?? null,
    note: "further failures of this kind are counted, not logged",
  });
}

function failureOf(error: unknown): { failure: StorageFailureKind; hint: string | null } {
  return {
    failure: (error as { kind?: StorageFailureKind }).kind ?? "unknown",
    hint: (error as { hint?: string }).hint ?? null,
  };
}

/**
 * The failures worth a second attempt.
 *
 * A bucket that does not exist, or a key Supabase refuses, will answer exactly
 * the same way 250 ms later — retrying those only makes an outage slower, and
 * the owner console checks every video in the catalog at once. Transient
 * failures are the ones a retry is for.
 */
const TRANSIENT_FAILURES: StorageFailureKind[] = ["network", "timeout", "rate-limited", "server-error"];

function isTransient(error: unknown): boolean {
  const kind = (error as { kind?: StorageFailureKind }).kind;
  return kind !== undefined && TRANSIENT_FAILURES.includes(kind);
}

/**
 * One metadata read, retried once when the failure looks transient.
 *
 * The owner page checks many objects at once and Supabase can briefly return a
 * network error or a rate-limit response when a deployment cold-starts.
 * Treating that first blip as "storage is unreachable" makes a healthy bucket
 * look broken and leaves the teacher with no useful action besides refreshing.
 */
async function statBlobWithRetry(key: string): Promise<BlobStat | null> {
  try {
    return await statBlob(key);
  } catch (firstError) {
    if (!isTransient(firstError)) {
      logFailureOnce(firstError);
      throw firstError;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    try {
      return await statBlob(key);
    } catch (secondError) {
      logFailureOnce(secondError);
      throw secondError;
    }
  }
}

async function presence(key: string): Promise<PresenceAnswer> {
  const cached = cachedPresence(key);
  if (cached) return cached;
  let answer: PresenceAnswer;
  try {
    answer = { present: (await statBlobWithRetry(key)) !== null, failure: null, hint: null };
  } catch (error) {
    answer = { present: null, ...failureOf(error) };
  }
  rememberPresence(key, answer);
  return answer;
}

/** A lesson's walkthrough, if the manifest lists one, with its storage state. */
export async function lessonVideoAvailability(lessonId: string): Promise<VideoAvailability<LessonVideoEntry> | null> {
  const entry = lessonVideo(lessonId);
  if (!entry) return null;
  return availabilityFor(entry, entry.key, entry.poster.key);
}

/** A course's welcome video, if the manifest lists one, with its storage state. */
export async function courseVideoAvailability(slug: string): Promise<VideoAvailability<CourseVideoEntry> | null> {
  const entry = courseVideo(slug);
  if (!entry) return null;
  return availabilityFor(entry, entry.key, entry.poster.key);
}

async function availabilityFor<T>(entry: T, key: string, posterKey: string): Promise<VideoAvailability<T>> {
  const [video, poster] = await Promise.all([presence(key), presence(posterKey)]);
  const failed = video.present === null ? video : poster.present === null ? poster : null;
  return {
    entry,
    video: video.present === true,
    poster: poster.present === true,
    unreachable: failed !== null,
    failure: failed?.failure ?? null,
    hint: failed?.hint ?? null,
  };
}

/**
 * One manifest key, for a single cheap "is the bucket filled?" question.
 *
 * `/api/health` uses it to tell a broken storage configuration from a working
 * one that simply has no videos in it yet — the two look the same to a student
 * and need opposite fixes.
 */
export function sampleVideoKey(): { key: string; lessonId: string } | null {
  const first = Object.values(LESSON_VIDEOS)[0];
  return first ? { key: first.key, lessonId: first.lessonId } : null;
}

export interface StoredVideoCheck {
  kind: "lesson" | "welcome";
  /** Lesson id, or course slug for a welcome video. */
  id: string;
  courseId: string;
  title: string;
  key: string;
  expectedSize: number;
  video: boolean | null;
  poster: boolean | null;
  /** Present, but a different byte count than the manifest recorded. */
  sizeMismatch: boolean;
  /** Why the answer is unknown, when it is. */
  failure: StorageFailureKind | null;
  /** The fix, in plain language. */
  hint: string | null;
}

async function checkEntry(
  kind: StoredVideoCheck["kind"],
  id: string,
  courseId: string,
  title: string,
  key: string,
  expectedSize: number,
  posterKey: string
): Promise<StoredVideoCheck> {
  let video: boolean | null;
  let sizeMismatch = false;
  let failure: StorageFailureKind | null = null;
  let hint: string | null = null;
  try {
    const stat = await statBlobWithRetry(key);
    video = stat !== null;
    sizeMismatch = stat !== null && stat.size !== expectedSize;
  } catch (error) {
    video = null;
    ({ failure, hint } = failureOf(error));
  }
  const poster = await presence(posterKey);
  return {
    kind,
    id,
    courseId,
    title,
    key,
    expectedSize,
    video,
    poster: poster.present,
    sizeMismatch,
    failure: failure ?? poster.failure,
    hint: hint ?? poster.hint,
  };
}

/**
 * Every manifest entry against the configured storage.
 *
 * Checks run in small batches: instant on the disk backend, and polite to
 * Supabase Storage, where each check is one request. A failed batch marks its
 * keys unknown rather than throwing, so one outage cannot break the page or
 * script that asked.
 */
export async function verifyVideoStorage(): Promise<{
  checks: StoredVideoCheck[];
  unreachable: boolean;
  failure: StorageFailureKind | null;
  hint: string | null;
}> {
  const jobs: (() => Promise<StoredVideoCheck>)[] = [];
  for (const entry of Object.values(LESSON_VIDEOS)) {
    jobs.push(() =>
      checkEntry("lesson", entry.lessonId, entry.courseId, entry.title, entry.key, entry.size, entry.poster.key)
    );
  }
  for (const entry of Object.values(COURSE_VIDEOS)) {
    jobs.push(() =>
      checkEntry("welcome", entry.slug, entry.courseId, entry.title, entry.key, entry.size, entry.poster.key)
    );
  }
  const checks: StoredVideoCheck[] = [];
  // Keep the request fan-out below Supabase's per-client burst limit. There
  // can be hundreds of lesson entries in a catalog, and 20 metadata requests
  // at once is enough to turn a cold start into a false outage warning.
  const BATCH = 6;
  for (let index = 0; index < jobs.length; index += BATCH) {
    checks.push(...(await Promise.all(jobs.slice(index, index + BATCH).map((job) => job()))));
  }
  const failed = checks.find((check) => check.video === null || check.poster === null);
  return {
    checks,
    unreachable: Boolean(failed),
    failure: failed?.failure ?? null,
    hint: failed?.hint ?? null,
  };
}
