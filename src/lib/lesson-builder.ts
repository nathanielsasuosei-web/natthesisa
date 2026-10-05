import type { CourseModule, Lesson } from "./courses";

/**
 * The shape a catalog lesson is written in.
 *
 * Kept in its own module so the program files (`programs.ts`) and the core
 * catalog (`courses.ts`) build lessons the same way, and a new course is data
 * rather than a second copy of this function. The only import from `courses` is
 * a *type*, so there is no runtime cycle.
 */
export function lesson(
  id: string,
  title: string,
  duration: number,
  summary: string,
  concept: string,
  code: string | undefined,
  challenge: string,
  preview = false
): Lesson {
  return {
    id,
    title,
    duration,
    summary,
    preview,
    objectives: [
      `Explain the purpose of ${title.toLowerCase()}`,
      "Apply the idea in a small working example",
      "Recognize the pattern in a real project",
    ],
    sections: [
      {
        heading: "Start with the idea",
        body: summary,
      },
      {
        heading: "How it works",
        body: concept,
        code,
        language: code ? "code" : undefined,
      },
    ],
    challenge,
  };
}

/** A module, written as `module(id, title, description, lessons)`. */
export function module(id: string, title: string, description: string, lessons: Lesson[]): CourseModule {
  return { id, title, description, lessons };
}
