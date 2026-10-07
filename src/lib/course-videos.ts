/**
 * The course videos that put a face and a voice on the material.
 *
 * Every course has one: a short welcome from the teacher that says what the
 * course is, who it is for and how to work through it. The player shows it at
 * the top of the course page, under the hero, and on the dashboard card for
 * that course — the same clip in both places, so a student meets the teacher
 * before they open lesson one.
 *
 * Like the lesson videos, the file lives in the configured storage and is
 * served through a route that checks access first (`/api/course-videos/[slug]`).
 */
import { COURSE_VIDEOS } from "@/content/course-videos";

export interface CourseVideoEntry {
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

export function courseVideo(idOrSlug: string): CourseVideoEntry | null {
  return COURSE_VIDEOS[idOrSlug] ?? null;
}

export function courseVideoCount(): number {
  return Object.keys(COURSE_VIDEOS).length;
}
