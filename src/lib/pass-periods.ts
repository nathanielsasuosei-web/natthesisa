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
 * `daily` / `weekly` / `monthly` are the pass prices. `course` and `lesson`
 * are the default prices a new piece of content is published with — the owner
 * can still price any single course or lesson differently.
 */
export interface Pricing {
  daily: number;
  weekly: number;
  monthly: number;
  course: number;
  lesson: number;
}

export const DEFAULT_PRICING: Pricing = {
  daily: 20,
  weekly: 90,
  monthly: 250,
  course: 150,
  lesson: 30,
};

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

// Money is formatted in one place, so every page agrees.
export { fmtMoney as formatMoney } from "./format";
