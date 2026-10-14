import type { Course, Lesson } from "./courses";
import { fmtMoney } from "./format";
import { isOwner } from "./owner";
import { HALF_PAYMENT_PERCENT, coursePrice, halfAmount, programPrice } from "./plans";
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
 * A program may also be paid for in two parts. The first payment is half the
 * price, and it opens the first half of every course in that program — the
 * lessons in catalog order, up to `halfOpenLessonCount`. The rest of the
 * lessons stay locked until the balance is paid, at which point the account is
 * indistinguishable from one that paid in full. Nothing else changes: a half
 * payment is not a subscription, it does not expire, and the teacher needs to
 * do nothing for it.
 *
 * A paused account is refused even when it owns the program. The teacher is
 * always let in.
 *
 * The teacher console is a separate door and is not opened here.
 */

export type AccessReason = "owner" | "ok" | "half" | "sign-in-required" | "purchase-required" | "suspended";

/** What a program payment buys: the whole program, or the first half of it. */
export type ProgramEntitlement = "none" | "half" | "full";

/** The state of one student's payments towards one program. */
export interface ProgramLedger {
  programId: string;
  /** What the program costs today. */
  price: number;
  /** Every cedi received for this program, across all of its payments. */
  paid: number;
  entitlement: ProgramEntitlement;
  /** What still has to be paid before everything opens. `0` once paid up. */
  balance: number;
  /** What the first payment costs today — half the price. */
  firstPayment: number;
}

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
  /** How much of the program this account has paid for. */
  entitlement: ProgramEntitlement;
  /** Money already received for the program. */
  paid: number;
  /** What is still owed before everything opens (the whole price when nothing is paid). */
  balance: number;
  /** What the first (half) payment costs today. */
  firstPayment: number;
  /**
   * How many of this course's lessons a half payment opens right now, and how
   * many the course has. The count follows today's content: publishing a new
   * lesson can move the boundary, which is why the lessons themselves are
   * always resolved from the course's own order rather than stored.
   */
  openLessons: number;
  totalLessons: number;
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

/* -------------------------------------------------------------------------- */
/* Part payments                                                              */
/* -------------------------------------------------------------------------- */

/**
 * What one student has paid towards one program, and what that has opened.
 *
 * The account keeps a purchase row per payment, so a half payment and the
 * balance that follows are two rows for the same program. `covers` on each row
 * says what that payment was for; a row written before part payments existed
 * has none, and it was a payment for the whole program — hence the default of
 * `full`, which keeps every older account exactly as open as it always was.
 *
 * The price can move after a half payment: if the teacher lowers it to what the
 * student has already paid, the remaining lessons open — they have paid the
 * whole price, and the books say so.
 */
export function programLedger(user: User, programId: string): ProgramLedger {
  const price = programPrice(programId);
  const rows = user.purchases.filter((item) => item.kind === "program" && item.refId === programId);
  const paid = rows.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? Math.max(0, item.amount) : 0), 0);
  const paidInFull = rows.some((item) => (item.covers ?? "full") === "full");
  const entitlement: ProgramEntitlement =
    paidInFull || (paid > 0 && paid >= price) ? "full" : rows.length ? "half" : "none";
  return {
    programId,
    price,
    paid,
    entitlement,
    balance: entitlement === "full" ? 0 : Math.max(0, price - paid),
    firstPayment: halfAmount(price),
  };
}

/** How much of a program this account has paid for. */
export function programEntitlement(user: User, programId: string): ProgramEntitlement {
  return programLedger(user, programId).entitlement;
}

/**
 * True when the student has paid for (or been given) the whole program — the
 * one thing that opens every course and every lesson in it.
 */
export function ownsProgram(user: User, programId: string): boolean {
  return programEntitlement(user, programId) === "full";
}

/**
 * How many lessons a half payment opens in a course of `total` lessons: the
 * first half, in course order.
 *
 * A course with an odd number of lessons opens the extra one, and the smallest
 * course of all (`1` lesson) opens that lesson: paying half must never leave a
 * student with nothing to read.
 */
export function halfOpenLessonCount(total: number): number {
  if (total <= 0) return 0;
  return Math.min(total, Math.max(1, Math.ceil((total * HALF_PAYMENT_PERCENT) / 100)));
}

/**
 * Lesson ids in catalog order — the order a half payment opens them in. This is
 * the fallback for callers that have not resolved the course's published
 * lessons; anything that renders or gates lessons should pass the real order
 * (see `contentLessons` in `course-content.ts`).
 */
export function catalogLessonIds(course: Course): string[] {
  return course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
}

/** The ids of the lessons a half payment opens, out of `lessonIds` in order. */
export function halfOpenLessonIds(lessonIds: string[]): string[] {
  return lessonIds.slice(0, halfOpenLessonCount(lessonIds.length));
}

/** Retired: old content purchases open nothing — see `ownsProgram`. */
export function hasPaidForLesson(user: User, courseId: string, lessonId: string): boolean {
  return ownsCourse(user, courseId) || ownsLesson(user, lessonId);
}

function decide(user: User | null, course: Course, lessonIds: string[]): AccessDecision {
  const program = programForCategory(course.category);
  const price = program ? programPrice(program.id) : coursePrice(course.id);
  const programId = program?.id ?? null;
  const programName = program?.name ?? null;

  // A signed-out visitor has a price to look at but no payments to read.
  const ledger = user && program ? programLedger(user, program.id) : null;
  const entitlement: ProgramEntitlement = ledger
    ? ledger.entitlement
    : user && !program && ownsCourse(user, course.id)
      ? "full"
      : "none";
  const paid = ledger?.paid ?? 0;

  const shared = {
    price,
    programId,
    programName,
    entitlement,
    paid,
    balance: entitlement === "full" ? 0 : Math.max(0, price - paid),
    firstPayment: halfAmount(price),
    openLessons:
      entitlement === "full"
        ? lessonIds.length
        : entitlement === "half"
          ? halfOpenLessonCount(lessonIds.length)
          : 0,
    totalLessons: lessonIds.length,
  };
  const locked = (reason: AccessReason, needsPurchase: boolean): AccessDecision => ({
    allowed: false,
    reason,
    needsPurchase,
    ...shared,
  });

  if (!user) return locked("sign-in-required", false);
  if (user.suspended && !isOwner(user)) return locked("suspended", false);
  // The teacher is always let in, and every lesson in the course counts as open.
  if (isOwner(user)) {
    return { allowed: true, reason: "owner", needsPurchase: false, ...shared, openLessons: lessonIds.length };
  }
  if (entitlement === "full") {
    return { allowed: true, reason: "ok", needsPurchase: false, ...shared };
  }
  return locked("purchase-required", true);
}

/**
 * Whether the account may open this course's lessons — and how much of the
 * program it has paid for. `allowed` means the whole course is open; a student
 * who has paid half is not allowed the whole course, so the pages read
 * `entitlement` to draw the half that is.
 */
export function courseAccess(user: User | null, course: Course, lessonIds?: string[]): AccessDecision {
  return decide(user, course, lessonIds ?? catalogLessonIds(course));
}

/**
 * Whether the account may open this lesson, its files, video and narration.
 *
 * A student who has paid half may open the first half of the course — the same
 * lessons the pages show as open — and no others.
 */
export function lessonAccess(user: User | null, course: Course, lesson: Lesson, lessonIds?: string[]): AccessDecision {
  const order = lessonIds ?? catalogLessonIds(course);
  const decision = decide(user, course, order);
  if (decision.allowed) return decision;
  if (decision.entitlement !== "half") return decision;

  const index = order.indexOf(lesson.id);
  if (index >= 0 && index < halfOpenLessonCount(order.length)) {
    return { ...decision, allowed: true, reason: "half", needsPurchase: false };
  }
  return decision;
}

/**
 * Whether a program buy button should be offered. A program the student has
 * already paid for in full is never sold twice, and the owner does not buy
 * anything. A student who has paid half still has a balance to pay, so their
 * button stays — at the remaining amount (see `BuyProgram`).
 */
export function canBuyProgram(user: User, programId: string): boolean {
  if (isOwner(user)) return false;
  return programEntitlement(user, programId) !== "full";
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
      if (decision.entitlement === "half" && decision.programName) {
        return (
          `You paid half of the ${decision.programName} program, so ${decision.openLessons} of this course's ` +
          `${decision.totalLessons} lessons are open. Pay the balance of ${fmtMoney(decision.balance)} to open ` +
          `the rest of “${courseTitle}” — and every other course in the program.`
        );
      }
      return decision.programName
        ? `Buy the ${decision.programName} program to open “${courseTitle}” and every lesson in it — or pay half now to open the first half.`
        : `This course is not on sale yet — ask your teacher about it.`;
    default:
      return "";
  }
}
