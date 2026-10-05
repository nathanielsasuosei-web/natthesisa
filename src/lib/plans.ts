import { readState, writeState } from "./app-state";
import {
  DEFAULT_PRICING,
  type PassPeriod,
  type Pricing,
  PricingError,
} from "./pass-periods";

/**
 * Reading and writing the owner's prices.
 *
 * The constants — periods, labels, defaults and the `Pricing` shape — live in
 * `pass-periods.ts`, which client components can import safely. This module
 * adds the storage on top: the prices are kept in `app_state` so the owner can
 * change them from the browser, and `readState` is synchronous because pricing
 * is read from render paths.
 */

export * from "./pass-periods";
export { fmtMoney as formatMoney } from "./format";

const PRICING_KEY = "pricing";

/** The current prices. Falls back to the defaults for anything missing. */
export function pricing(): Pricing {
  const stored = readState<Partial<Pricing>>(PRICING_KEY, {});
  return { ...DEFAULT_PRICING, ...stored };
}

export function passPrice(period: PassPeriod): number {
  return pricing()[period];
}

/**
 * Validates and stores new prices. Anything not supplied is left alone, so
 * the console can save one field at a time.
 */
export async function savePricing(update: Partial<Pricing>): Promise<Pricing> {
  const current = pricing();
  const next: Pricing = { ...current };

  for (const key of Object.keys(DEFAULT_PRICING) as Array<keyof Pricing>) {
    const raw = update[key];
    if (raw === undefined) continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new PricingError(`“${key}” must be a number.`);
    if (value < 0) throw new PricingError(`“${key}” cannot be negative.`);
    if (value > 1_000_000) throw new PricingError(`“${key}” is too large.`);
    next[key] = Math.round(value);
  }

  if (next.weekly > next.daily * 7) {
    throw new PricingError("A week pass should not cost more than seven day passes.");
  }
  if (next.monthly > next.weekly * 5) {
    throw new PricingError("A month pass should not cost more than about four week passes.");
  }

  await writeState(PRICING_KEY, next);
  return next;
}

/* -------------------------------------------------------------------------- */
/* Per-course and per-lesson prices                                           */
/* -------------------------------------------------------------------------- */

const PRICES_KEY = "content-prices";

export interface ContentPrices {
  courses: Record<string, number>;
  lessons: Record<string, number>;
}

function storedPrices(): ContentPrices {
  const stored = readState<Partial<ContentPrices>>(PRICES_KEY, {});
  return { courses: stored.courses ?? {}, lessons: stored.lessons ?? {} };
}

/** What one course costs. Falls back to the owner's default course price. */
export function coursePrice(courseId: string): number {
  const override = storedPrices().courses[courseId];
  return typeof override === "number" ? override : pricing().course;
}

/** What one lesson costs. Falls back to the owner's default lesson price. */
export function lessonPrice(lessonId: string): number {
  const override = storedPrices().lessons[lessonId];
  return typeof override === "number" ? override : pricing().lesson;
}

/**
 * Sets the price of a single course or lesson. `0` is allowed and means
 * "no extra charge" — the access pass is still required, because the pass is
 * what unlocks learning.
 */
export async function saveContentPrice(
  kind: "course" | "lesson",
  refId: string,
  price: number
): Promise<number> {
  const value = Number(price);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
    throw new PricingError("A price must be between 0 and 1,000,000.");
  }
  const current = storedPrices();
  const rounded = Math.round(value);
  if (kind === "course") current.courses[refId] = rounded;
  else current.lessons[refId] = rounded;
  await writeState(PRICES_KEY, current);
  return rounded;
}

/** Every price the owner has set, for the pricing console. */
export function allContentPrices(): ContentPrices {
  return storedPrices();
}
