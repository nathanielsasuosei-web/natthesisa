/**
 * The pass, and the shape of its prices — with no database imports.
 *
 * This module is deliberately free of server-only dependencies (`pg`, the
 * state cache, the file system) so client components can render prices and
 * period labels without dragging the database into the browser bundle. The
 * functions that *read and write* the owner's prices live in `plans.ts`.
 */

export const PASS_PERIODS = ["daily", "weekly", "monthly"] as const;
export type PassPeriod = (typeof PASS_PERIODS)[number];

/** Length of each period, in days. */
export const PERIOD_DAYS: Record<PassPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export const PERIOD_LABEL: Record<PassPeriod, string> = {
  daily: "Day pass",
  weekly: "Week pass",
  monthly: "Month pass",
};

export function isPassPeriod(value: unknown): value is PassPeriod {
  return typeof value === "string" && (PASS_PERIODS as readonly string[]).includes(value);
}

/**
 * What the owner charges.
 *
 * `program` is the default price of a program — the one thing students pay
 * for. The owner can still price any single program differently, and any
 * program priced at GH₵0 is free to join. The pass / course / lesson fields
 * are retired: they stay in the shape so old stored pricing still reads, but
 * nothing is sold through them any more.
 */
export interface Pricing {
  daily: number;
  weekly: number;
  monthly: number;
  course: number;
  lesson: number;
  program: number;
}

export const DEFAULT_PRICING: Pricing = {
  daily: 20,
  weekly: 90,
  monthly: 250,
  course: 150,
  lesson: 30,
  program: 300,
};

/* -------------------------------------------------------------------------- */
/* Part payments                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A program may be paid for in two parts: half now, half later.
 *
 * The first payment opens the first half of every course in the program (see
 * `halfOpenLessonCount` in `access.ts`); the second opens the rest. The split
 * lives here as one number so the whole app — the price shown, the amount
 * charged, the lessons unlocked — can only ever be changed together, and this
 * module is free of server-only imports so the buy buttons in the browser
 * compute exactly what the server will charge.
 *
 * The wording around the site says "half", so if this number ever changes, the
 * copy needs changing with it.
 */
export const HALF_PAYMENT_PERCENT = 50;

/**
 * Which part of a program a payment buys.
 *
 *   • `"half"` — the first payment: half the price, and the first half of every
 *     course in the program opens.
 *   • `"balance"` — the second: whatever is left, and everything opens.
 *   • `"full"` — the whole price at once (the default when nothing is said),
 *     which for a student who already paid half means the same as `"balance"`.
 *
 * The same three values are stored on a payment row (`payments.covers`) so a
 * checkout, its webhook and its reconciliation all agree on what was bought.
 */
export type ProgramPaymentPart = "half" | "full" | "balance";

/** True for the three values the app understands. */
export function isProgramPaymentPart(value: unknown): value is ProgramPaymentPart {
  return value === "half" || value === "full" || value === "balance";
}

/**
 * What the first payment costs: half the price, to the nearest cedi, never
 * less than GH₵1 and never more than the price itself. Rounding can make the
 * two payments differ by a cedi (GH₵305 → 153 now, 152 later); the student
 * always ends up paying the price exactly, because the balance is worked out
 * as the price minus what was actually paid.
 */
export function halfAmount(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  return Math.min(price, Math.max(1, Math.round((price * HALF_PAYMENT_PERCENT) / 100)));
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

// Money is formatted in one place, so every page agrees.
export { fmtMoney as formatMoney } from "./format";
