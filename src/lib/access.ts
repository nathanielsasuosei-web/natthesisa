import type { Course, Lesson } from "./courses";
import { isOwner } from "./owner";
import { coursePrice, programPrice } from "./plans";
import { programForCategory } from "./programs";
import type { User } from "./store";

/**
 * Who may open a lesson.
 *
 * Nothing in a course is free. A lesson, its files, its videos and its
 * narration open only for a signed-in student who has bought the program the
 * course belongs to (or was granted it by the teacher). The course overview
 * pages stay public so a visitor can see what is inside before signing in.
 *
 * A paused account is refused even when it owns the program. The teacher is
 * always let in.
 *
 * The teacher console is a separate door and is not opened here.
 */

export type AccessReason = "owner" | "ok" | "sign-in-required" | "purchase-required" | "suspended";

export interface AccessDecision {
  allowed: boolean;
  reason: AccessReason;
  /** True when buying the program is what would open this. */
  needsPurchase: boolean;
  /** The price of the program this course belongs to. */
  price: number;
  /** The program to buy, so the UI can name it and link to it. */
  programId: string | null;
  programName: string | null;
}

export function passEndsAt(user: User): number {
  return new Date(user.subscription.expiresAt).getTime();
}

/**
 * Retired with the access pass: passes are no longer sold and no longer open
 * anything. Kept for the fulfilment responses and history displays that still
 * read the subscription.
 */
export function hasActivePass(user: User): boolean {
  return passEndsAt(user) > Date.now();
}

/** Retired: an old course purchase, kept as history. Opens nothing. */
export function ownsCourse(user: User, courseId: string): boolean {
  return user.purchases.some((item) => item.kind === "course" && item.refId === courseId);
}

/** Retired: an old lesson purchase, kept as history. Opens nothing. */
export function ownsLesson(user: User, lessonId: string): boolean {
  return user.purchases.some((item) => item.kind === "lesson" && item.refId === lessonId);
}

/** True when the student has paid for (or been given) this program. */
export function ownsProgram(user: User, programId: string): boolean {
  return user.purchases.some((item) => item.kind === "program" && item.refId === programId);
}

/** Retired: old content purchases open nothing — see `ownsProgram`. */
export function hasPaidForLesson(user: User, courseId: string, lessonId: string): boolean {
  return ownsCourse(user, courseId) || ownsLesson(user, lessonId);
}

function decide(user: User | null, course: Course): AccessDecision {
  const program = programForCategory(course.category);
  const price = program ? programPrice(program.id) : coursePrice(course.id);
  const programId = program?.id ?? null;
  const programName = program?.name ?? null;
  const locked = (reason: AccessReason, needsPurchase: boolean): AccessDecision => ({
    allowed: false,
    reason,
    needsPurchase,
    price,
    programId,
    programName,
  });

  if (!user) return locked("sign-in-required", false);
  if (user.suspended && !isOwner(user)) return locked("suspended", false);
  if (isOwner(user)) {
    return { allowed: true, reason: "owner", needsPurchase: false, price, programId, programName };
  }
  const owned = program ? ownsProgram(user, program.id) : ownsCourse(user, course.id);
  if (owned) {
    return { allowed: true, reason: "ok", needsPurchase: false, price, programId, programName };
  }
  return locked("purchase-required", true);
}

/** Whether the account may open this course's lessons. `null` means signed out. */
export function courseAccess(user: User | null, course: Course): AccessDecision {
  return decide(user, course);
}

/** Whether the account may open this lesson, its files, video and narration. */
export function lessonAccess(user: User | null, course: Course, _lesson: Lesson): AccessDecision {
  return decide(user, course);
}

/**
 * Whether a program buy button should be offered. A program the student
 * already owns is never sold twice, and the owner does not buy anything.
 */
export function canBuyProgram(user: User, programId: string): boolean {
  if (isOwner(user)) return false;
  return !ownsProgram(user, programId);
}

/** Retired with course sales. Kept so old code paths still compile. */
export function canBuyCourse(user: User, courseId: string): boolean {
  if (isOwner(user)) return false;
  return !ownsCourse(user, courseId);
}

/** Retired with lesson sales. Kept so old code paths still compile. */
export function canBuyLesson(user: User, lessonId: string): boolean {
  if (isOwner(user)) return false;
  return !ownsLesson(user, lessonId);
}

/** The message a locked lesson shows, in the student's words. */
export function accessMessage(decision: AccessDecision, courseTitle: string): string {
  switch (decision.reason) {
    case "sign-in-required":
      return `Sign in to open “${courseTitle}”.`;
    case "suspended":
      return "Your account is paused. Please contact your teacher for help.";
    case "purchase-required":
      return decision.programName
        ? `Buy the ${decision.programName} program to open “${courseTitle}” and every lesson in it.`
        : `This course is not on sale yet — ask your teacher about it.`;
    default:
      return "";
  }
}
