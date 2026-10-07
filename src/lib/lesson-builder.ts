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
      "Explain the central concept and identify the problem it solves.",
      "Trace or adapt the worked example, explaining the role of its important steps.",
      "Complete the challenge and verify the result against its expected behavior or constraints.",
    ],
    // `summary` is already shown as the lesson introduction. Keeping it out of
    // the sections avoids repeating the same paragraph in the reader.
    sections: [
      {
        heading: "Core concept",
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
