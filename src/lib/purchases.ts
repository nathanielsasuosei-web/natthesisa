import { getCourse } from "./courses";
import { findContentLesson } from "./course-content";
import { PassPeriod, coursePrice, lessonPrice, passPrice, pricing } from "./plans";
import {
  User,
  addInvoice,
  makePass,
  logActivity,
  uid,
  type Purchase,
} from "./store";
import { ensureSchema } from "./db";
import { hasActivePass, ownsCourse, ownsLesson } from "./access";

/**
 * Payments.
 *
 * An invoice is raised, the entitlement is written to the account, and the
 * student is let in. These functions grant — they do not verify money: live
 * checkouts reach them only through `fulfillPayment()` in `payments.ts`,
 * after Paystack has confirmed the Mobile Money / card payment via the
 * verified webhook or the return-URL verification.
 *
 * Two things are sold:
 *   • an access pass — a day, a week or a month of access, and
 *   • a course or a single lesson — the entitlement to study that content.
 *
 * Access needs both (see `access.ts`): the pass is what opens the platform,
 * the purchase is what opens the content.
 */

export class PurchaseError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "BAD_REQUEST", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export interface PassReceipt {
  period: PassPeriod;
  price: number;
  startsAt: string;
  expiresAt: string;
  invoiceNumber: string | null;
}

/**
 * Where the money for a purchase came from. Passed through when a verified
 * payment (Mobile Money, card, bank transfer) is fulfilled, so the invoice
 * carries the provider's reference and the account remembers the method.
 */
export interface PaymentAttribution {
  /** The provider's transaction reference (e.g. our `CMG-…` checkout reference). */
  reference?: string;
  provider?: "demo" | "paystack";
  phone?: string;
  network?: string;
  channel?: "mobile_money" | "card" | "bank_transfer" | "ussd" | "qr" | "bank";
  brand?: string;
  last4?: string;
}

function rememberPaymentMethod(user: User, attribution?: PaymentAttribution): void {
  if (!attribution || (!attribution.provider && !attribution.phone && !attribution.brand)) return;
  const next = { ...user.paymentMethod };
  if (attribution.provider) next.provider = attribution.provider;
  if (attribution.brand) next.brand = attribution.brand;
  if (attribution.last4) next.last4 = attribution.last4;
  if (attribution.phone) next.phone = attribution.phone;
  if (attribution.network) next.network = attribution.network;
  if (attribution.channel) next.channel = attribution.channel;
  user.paymentMethod = next;
}

/**
 * Sells a pass. A student with time left on a pass is not sold a second one
 * accidentally — the remaining days are added to the new pass, so renewing
 * early never wastes what was paid for.
 */
export async function buyPass(user: User, period: PassPeriod, attribution?: PaymentAttribution): Promise<PassReceipt> {
  if (user.suspended) {
    throw new PurchaseError("Your account is paused. Please contact your teacher for help.", "SUSPENDED", 403);
  }

  const price = passPrice(period);
  const pass = makePass(period, price);
  const extending = hasActivePass(user);
  const now = Date.now();
  const days = Math.round((new Date(pass.expiresAt).getTime() - now) / 86_400_000);

  // Keep any time already paid for: a renewal extends the current pass rather
  // than overwriting it, so renewing early never wastes money.
  if (extending) {
    const currentEnd = new Date(user.subscription.expiresAt).getTime();
    pass.startedAt = new Date(currentEnd).toISOString();
    pass.expiresAt = new Date(currentEnd + days * 86_400_000).toISOString();
  }

  user.subscription = pass;
  rememberPaymentMethod(user, attribution);
  const invoice = await addInvoice(
    user,
    price,
    `${period[0].toUpperCase()}${period.slice(1)} access pass`,
    attribution?.reference
  );
  logActivity(
    user,
    extending
      ? `Access pass extended by ${days} more day${days === 1 ? "" : "s"}`
      : `Access pass started — ${days} day${days === 1 ? "" : "s"}`,
    "billing"
  );
  return {
    period,
    price,
    startsAt: pass.startedAt,
    expiresAt: pass.expiresAt,
    invoiceNumber: invoice?.number ?? null,
  };
}

function record(user: User, purchase: Omit<Purchase, "id" | "at">): Purchase {
  const entry: Purchase = { ...purchase, id: uid(), at: new Date().toISOString() };
  user.purchases.push(entry);
  return entry;
}

/** Sells a whole course, including every lesson inside it. */
export async function buyCourse(user: User, courseId: string, attribution?: PaymentAttribution): Promise<Purchase> {
  const course = getCourse(courseId);
  if (!course) throw new PurchaseError("That course does not exist.", "NOT_FOUND", 404);
  if (ownsCourse(user, courseId)) {
    throw new PurchaseError("You already own this course.", "ALREADY_OWNED", 409);
  }
  const price = coursePrice(courseId);
  rememberPaymentMethod(user, attribution);
  const invoice = await addInvoice(user, price, `${course.title} — course purchase`, attribution?.reference);
  const purchase = record(user, {
    kind: "course",
    refId: courseId,
    courseId,
    amount: price,
    invoiceNumber: invoice?.number ?? null,
  });
  logActivity(user, `Bought the course “${course.shortTitle}”`, "billing");
  return purchase;
}

/** Sells one lesson on its own. */
export async function buyLesson(user: User, courseId: string, lessonId: string, attribution?: PaymentAttribution): Promise<Purchase> {
  const course = getCourse(courseId);
  if (!course) throw new PurchaseError("That course does not exist.", "NOT_FOUND", 404);
  const lesson = findContentLesson(course, lessonId);
  if (!lesson) throw new PurchaseError("That lesson does not exist.", "NOT_FOUND", 404);
  if (ownsLesson(user, lessonId)) {
    throw new PurchaseError("You already own this lesson.", "ALREADY_OWNED", 409);
  }
  // Owning the course already covers it; selling the lesson again would be a
  // double charge.
  if (ownsCourse(user, courseId)) {
    throw new PurchaseError("This lesson is already included in your course purchase.", "ALREADY_OWNED", 409);
  }
  const price = lessonPrice(lessonId);
  rememberPaymentMethod(user, attribution);
  const invoice = await addInvoice(user, price, `${course.shortTitle} — “${lesson.title}”`, attribution?.reference);
  const purchase = record(user, {
    kind: "lesson",
    refId: lessonId,
    courseId,
    amount: price,
    invoiceNumber: invoice?.number ?? null,
  });
  logActivity(user, `Bought the lesson “${lesson.title}”`, "billing");
  return purchase;
}

/* -------------------------------------------------------------------------- */
/* Owner-granted access (comped from the console)                             */
/* -------------------------------------------------------------------------- */

/** The owner gives a student time, without a payment. */
export async function grantPass(owner: User, student: User, period: PassPeriod): Promise<User> {
  const pass = makePass(period, 0);
  student.subscription = pass;
  logActivity(student, `Access pass granted by your teacher — ${period}`, "billing");
  logActivity(owner, `Granted ${student.name} a ${period} pass`, "owner");
  await ensureSchema();
  return student;
}

/** The owner opens a course (or one lesson) for a student, without a payment. */
export async function grantAccess(
  owner: User,
  student: User,
  courseId: string,
  lessonId?: string
): Promise<User> {
  const course = getCourse(courseId);
  if (!course) throw new PurchaseError("That course does not exist.", "NOT_FOUND", 404);

  if (lessonId) {
    const lesson = findContentLesson(course, lessonId);
    if (!lesson) throw new PurchaseError("That lesson does not exist.", "NOT_FOUND", 404);
    if (!ownsLesson(student, lessonId)) {
      record(student, { kind: "lesson", refId: lessonId, courseId, amount: 0, invoiceNumber: null });
    }
    logActivity(student, `Your teacher opened the lesson “${lesson.title}”`, "billing");
    logActivity(owner, `Opened “${lesson.title}” for ${student.name}`, "owner");
    return student;
  }

  if (!ownsCourse(student, courseId)) {
    record(student, { kind: "course", refId: courseId, courseId, amount: 0, invoiceNumber: null });
  }
  logActivity(student, `Your teacher opened the course “${course.shortTitle}”`, "billing");
  logActivity(owner, `Opened “${course.shortTitle}” for ${student.name}`, "owner");
  return student;
}

/** What a student would pay to open everything, for the console. */
export function pricingSummary(): { periods: Record<PassPeriod, number>; course: number; lesson: number } {
  const prices = pricing();
  return {
    periods: { daily: prices.daily, weekly: prices.weekly, monthly: prices.monthly },
    course: prices.course,
    lesson: prices.lesson,
  };
}
