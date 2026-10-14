import { NextResponse } from "next/server";
import { accessMessage, courseAccess, lessonAccess, type AccessDecision } from "./access";
import type { Course } from "./courses";
import { contentLessons } from "./course-content";
import { getCurrentUser } from "./session";

/**
 * The gate in front of every lesson file, video, poster and welcome video.
 *
 * Returns `null` when the signed-in student may open the thing, otherwise the
 * response to send: 401 when nobody is signed in, 402 when the program is not
 * paid for, 403 when the account is paused. Those routes serve the bytes (or a
 * redirect to the storage CDN), so the check has to happen here, not only in
 * the page that links to them.
 *
 * The check is per lesson, not per course: a student who paid half of a program
 * may watch the video, open the files and see the poster of the lessons that
 * are open to them, and is refused the media of the ones that are not — the
 * same boundary the lesson pages draw. The course's own welcome video is not
 * tied to a lesson, so it opens once anything has been paid towards the
 * program.
 */

function refusal(decision: AccessDecision, course: Course): NextResponse {
  return NextResponse.json(
    { error: accessMessage(decision, course.shortTitle), code: "ACCESS_REQUIRED", reason: decision.reason },
    { status: decision.reason === "suspended" ? 403 : 402 }
  );
}

/** Lesson ids in the order the course teaches them, published ones included. */
export function courseLessonOrder(course: Course): string[] {
  return contentLessons(course).map((lesson) => lesson.id);
}

/**
 * A lesson's own material — its video, poster and files. `lessonId` may be a
 * catalog lesson or one the owner published; both live in the same course
 * order, which is what decides whether a half payment opened them.
 */
export async function refuseUnlessLessonOpen(course: Course, lessonId: string): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to open this lesson.", code: "SIGN_IN_REQUIRED" }, { status: 401 });
  }

  const order = courseLessonOrder(course);
  const lesson = contentLessons(course).find((item) => item.id === lessonId);
  // A lesson id the course does not know is not a lesson anybody may open.
  if (!lesson) {
    return NextResponse.json({ error: "That lesson is not part of this course.", code: "NOT_FOUND" }, { status: 404 });
  }
  const decision = lessonAccess(user, course, lesson, order);
  if (decision.allowed) return null;
  return refusal(decision, course);
}

/**
 * The course's own material: the welcome video and its poster. Open to anyone
 * who has paid something towards the program — a student who put half down has
 * paid to be introduced to the course.
 */
export async function refuseUnlessCourseStarted(course: Course): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to open this lesson.", code: "SIGN_IN_REQUIRED" }, { status: 401 });
  }
  const decision = courseAccess(user, course, courseLessonOrder(course));
  if (decision.allowed || decision.entitlement === "half") return null;
  return refusal(decision, course);
}
