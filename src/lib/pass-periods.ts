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

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

// Money is formatted in one place, so every page agrees.
export { fmtMoney as formatMoney } from "./format";
