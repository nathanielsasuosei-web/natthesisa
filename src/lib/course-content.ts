import type { Course, CourseModule, Lesson } from "./courses";
import { COURSES, getCourse } from "./courses";
import {
  getUploadedLessonsForCourse,
  uploadedLessonToLesson,
  type UploadedLessonRecord,
} from "./lesson-uploads";

/**
 * Server-side view of course content: the catalog in `courses.ts` plus every
 * lesson the owner has published.
 *
 * This module touches the file system, so it must only be imported from server
 * code (pages, route handlers, `lib/store.ts`). Client components keep using
 * `courses.ts`, which stays free of Node APIs.
 */

export function ownerLessonsForCourse(courseId: string): Lesson[] {
  return getUploadedLessonsForCourse(courseId).map(uploadedLessonToLesson);
}

/** Modules for a course, with owner lessons appended to their chosen module. */
export function contentModules(course: Course): CourseModule[] {
  const uploads = getUploadedLessonsForCourse(course.id);
  if (!uploads.length) return course.modules;

  const modules: CourseModule[] = course.modules.map((module) => {
    const extras = uploads.filter((record) => record.moduleId === module.id).map(uploadedLessonToLesson);
    return extras.length ? { ...module, lessons: [...module.lessons, ...extras] } : module;
  });

  const newModules: CourseModule[] = [];
  for (const record of uploads) {
    if (record.moduleId !== "new" && course.modules.some((module) => module.id === record.moduleId)) continue;
    const moduleId = record.moduleTitle ? record.moduleId : "owner-lessons";
    let module = newModules.find((candidate) => candidate.id === moduleId);
    if (!module) {
      module = {
        id: moduleId,
        title: record.moduleTitle ?? "Owner lessons",
        description: record.moduleDescription ?? "Newest material published by the course owner.",
        lessons: [],
      };
      newModules.push(module);
    }
    module.lessons.push(uploadedLessonToLesson(record));
  }

  return [...modules, ...newModules];
}

/** A course object (with merged modules) ready to render. */
export function contentCourse(course: Course): Course {
  return { ...course, modules: contentModules(course) };
}

export function contentLessons(course: Course): Lesson[] {
  return contentModules(course).flatMap((module) => module.lessons);
}

export function findContentLesson(course: Course, lessonId: string): Lesson | undefined {
  return contentLessons(course).find((lesson) => lesson.id === lessonId);
}

export function contentMinutes(course: Course): number {
  return contentLessons(course).reduce((total, lesson) => total + lesson.duration, 0);
}

export function contentPercent(course: Course, completedLessonIds: string[] = []): number {
  const lessons = contentLessons(course);
  if (!lessons.length) return 0;
  const valid = new Set(lessons.map((lesson) => lesson.id));
  return Math.round((completedLessonIds.filter((id) => valid.has(id)).length / lessons.length) * 100);
}

export function contentTotals(): { courses: number; lessons: number } {
  return COURSES.reduce(
    (totals, course) => ({
      courses: totals.courses + 1,
      lessons: totals.lessons + contentLessons(course).length,
    }),
    { courses: 0, lessons: 0 }
  );
}

export function lessonCountsByCourse(): Record<string, number> {
  return Object.fromEntries(COURSES.map((course) => [course.id, contentLessons(course).length]));
}

export function lessonMinutesByCourse(): Record<string, number> {
  return Object.fromEntries(COURSES.map((course) => [course.id, contentMinutes(course)]));
}

export function ownerLessonCount(): number {
  return COURSES.reduce((sum, course) => sum + getUploadedLessonsForCourse(course.id).length, 0);
}

export interface OwnerLessonSummary {
  record: UploadedLessonRecord;
  courseTitle: string;
  moduleTitle: string;
}

/** Rows for the owner's lesson manager, newest first. */
export function ownerLessonSummaries(): OwnerLessonSummary[] {
  return COURSES.flatMap((course) => {
    const modules = contentModules(course);
    return getUploadedLessonsForCourse(course.id).map((record) => {
      const module = modules.find((candidate) => candidate.lessons.some((lesson) => lesson.id === record.id));
      return { record, courseTitle: course.title, moduleTitle: module?.title ?? "Owner lessons" };
    });
  }).sort((a, b) => b.record.createdAt.localeCompare(a.record.createdAt));
}

export function findUploadedLessonCourse(lessonId: string): { course: Course; record: UploadedLessonRecord } | null {
  for (const course of COURSES) {
    const record = getUploadedLessonsForCourse(course.id).find((lesson) => lesson.id === lessonId);
    if (record) return { course, record };
  }
  return null;
}

export { getCourse };
