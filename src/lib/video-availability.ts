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
 */
import { COURSE_VIDEOS } from "@/content/course-videos";
import { LESSON_VIDEOS } from "@/content/lesson-videos";
import { statBlob } from "./blob-store";
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
}

/**
 * Presence of one object: true when it is there, false when storage answers
 * and it is not, null when storage could not be reached at all.
 */
async function presence(key: string): Promise<boolean | null> {
  try {
    return (await statBlob(key)) !== null;
  } catch (error) {
    console.error(`Could not reach video storage while checking ${key}`, error);
    return null;
  }
}

/** A lesson's walkthrough, if the manifest lists one, with its storage state. */
export async function lessonVideoAvailability(lessonId: string): Promise<VideoAvailability<LessonVideoEntry> | null> {
  const entry = lessonVideo(lessonId);
  if (!entry) return null;
  const [video, poster] = await Promise.all([presence(entry.key), presence(entry.poster.key)]);
  return {
    entry,
    video: video === true,
    poster: poster === true,
    unreachable: video === null || poster === null,
  };
}

/** A course's welcome video, if the manifest lists one, with its storage state. */
export async function courseVideoAvailability(slug: string): Promise<VideoAvailability<CourseVideoEntry> | null> {
  const entry = courseVideo(slug);
  if (!entry) return null;
  const [video, poster] = await Promise.all([presence(entry.key), presence(entry.poster.key)]);
  return {
    entry,
    video: video === true,
    poster: poster === true,
    unreachable: video === null || poster === null,
  };
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
  try {
    const stat = await statBlob(key);
    video = stat !== null;
    sizeMismatch = stat !== null && stat.size !== expectedSize;
  } catch (error) {
    console.error(`Could not reach video storage while checking ${key}`, error);
    video = null;
  }
  return { kind, id, courseId, title, key, expectedSize, video, poster: await presence(posterKey), sizeMismatch };
}

/**
 * Every manifest entry against the configured storage.
 *
 * Checks run in small batches: instant on the disk backend, and polite to
 * Supabase Storage, where each check is one request. A failed batch marks its
 * keys unknown rather than throwing, so one outage cannot break the page or
 * script that asked.
 */
export async function verifyVideoStorage(): Promise<{ checks: StoredVideoCheck[]; unreachable: boolean }> {
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
  const BATCH = 20;
  for (let index = 0; index < jobs.length; index += BATCH) {
    checks.push(...(await Promise.all(jobs.slice(index, index + BATCH).map((job) => job()))));
  }
  return { checks, unreachable: checks.some((check) => check.video === null || check.poster === null) };
}
