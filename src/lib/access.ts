import type { Course, Lesson } from "./courses";
import { isOwner } from "./owner";
import { coursePrice, lessonPrice } from "./plans";
import type { User } from "./store";

/**
 * Who may open a lesson.
 *
 * The rule is deliberately strict, and it is enforced here rather than in each
 * page so that a page, an API route and a file download can never disagree:
 *
 *   1. The owner (the teacher) opens everything.
 *   2. A lesson the owner marked as a free preview is open to anyone signed in.
 *   3. Otherwise a student needs BOTH:
 *        • an active access pass (day, week or month — not expired), and
 *        • the course or the lesson itself paid for.
 *
 * Everything that streams a video, downloads a PDF or records progress goes
 * through `lessonAccess()`. A student whose pass has lapsed keeps what they
 * bought — the purchases are still listed — but the door stays shut until a
 * pass is active again.
 */

export type AccessReason =
  | "owner"
  | "preview"
  | "ok"
  | "pass-required"
  | "pass-expired"
  | "purchase-required"
  | "suspended";

export interface AccessDecision {
  allowed: boolean;
  reason: AccessReason;
  /** What still has to be paid, for the message the UI shows. */
  needsPass: boolean;
  needsPurchase: boolean;
  price: number;
}

export function passEndsAt(user: User): number {
  return new Date(user.subscription.expiresAt).getTime();
}

/**
 * Whether this account has ever had a real pass.
 *
 * A brand-new account carries a zero-length placeholder, so "the pass ended"
 * would be a lie for someone who has never bought one — they get "you need a
 * pass" instead. A granted (free, teacher-issued) pass is a real pass.
 */
function hasEverHadPass(user: User): boolean {
  const { startedAt, expiresAt } = user.subscription;
  return new Date(expiresAt).getTime() > new Date(startedAt).getTime();
}

export function hasActivePass(user: User): boolean {
  return passEndsAt(user) > Date.now();
}

export function ownsCourse(user: User, courseId: string): boolean {
  return user.purchases.some((item) => item.kind === "course" && item.refId === courseId);
}

export function ownsLesson(user: User, lessonId: string): boolean {
  return user.purchases.some((item) => item.kind === "lesson" && item.refId === lessonId);
}

/** True when the student has paid for this lesson, through either door. */
export function hasPaidForLesson(user: User, courseId: string, lessonId: string): boolean {
  return ownsCourse(user, courseId) || ownsLesson(user, lessonId);
}

export function courseAccess(user: User, course: Course): AccessDecision {
  const price = coursePrice(course.id);
  if (isOwner(user)) {
    return { allowed: true, reason: "owner", needsPass: false, needsPurchase: false, price };
  }
  if (user.suspended) {
    return { allowed: false, reason: "suspended", needsPass: false, needsPurchase: false, price };
  }
  const active = hasActivePass(user);
  const paid = ownsCourse(user, course.id);
  if (active && paid) {
    return { allowed: true, reason: "ok", needsPass: false, needsPurchase: false, price };
  }
  return {
    allowed: false,
    reason: !active ? (hasEverHadPass(user) ? "pass-expired" : "pass-required") : "purchase-required",
    needsPass: !active,
    needsPurchase: !paid,
    price,
  };
}

export function lessonAccess(user: User, course: Course, lesson: Lesson): AccessDecision {
  const price = lessonPrice(lesson.id);
  if (isOwner(user)) {
    return { allowed: true, reason: "owner", needsPass: false, needsPurchase: false, price };
  }
  if (user.suspended) {
    return { allowed: false, reason: "suspended", needsPass: false, needsPurchase: false, price };
  }
  // A free preview is the owner's invitation to sample the teaching: anyone
  // signed in can watch it, with no pass and no purchase.
  if (lesson.preview === true) {
    return { allowed: true, reason: "preview", needsPass: false, needsPurchase: false, price };
  }

  const active = hasActivePass(user);
  const paid = hasPaidForLesson(user, course.id, lesson.id);
  if (active && paid) {
    return { allowed: true, reason: "ok", needsPass: false, needsPurchase: false, price };
  }
  return {
    allowed: false,
    reason: !active ? (hasEverHadPass(user) ? "pass-expired" : "pass-required") : "purchase-required",
    needsPass: !active,
    needsPurchase: !paid,
    price,
  };
}

/**
 * Whether a course buy button should be offered. A course the student has
 * already paid for is never sold twice, and the owner does not buy anything.
 */
export function canBuyCourse(user: User, courseId: string): boolean {
  if (isOwner(user)) return false;
  return !ownsCourse(user, courseId);
}

export function canBuyLesson(user: User, lessonId: string): boolean {
  if (isOwner(user)) return false;
  return !ownsLesson(user, lessonId);
}

/** The message a locked lesson shows, in the student's words. */
export function accessMessage(decision: AccessDecision, courseTitle: string): string {
  switch (decision.reason) {
    case "suspended":
      return "Your account is paused. Please contact your teacher for help.";
    case "pass-expired":
      return "Your access pass has ended. Renew it to open this lesson again.";
    case "pass-required":
      return "This lesson opens with an active access pass.";
    case "purchase-required":
      return `Buy this lesson, or the whole of ${courseTitle}, to open it.`;
    default:
      return "";
  }
}
