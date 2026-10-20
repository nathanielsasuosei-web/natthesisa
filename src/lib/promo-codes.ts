/**
 * Promo codes: the shape, and the rules a code is judged by.
 *
 * Client-safe on purpose — no database import. The teacher's console has to
 * render each code's status and window, and the checkout modal needs the same
 * vocabulary before it ever calls the server. `promotions.ts` adds the storage
 * and the granting on top.
 *
 * How a code works: the teacher creates one, names the program a student gets
 * free, and sets the window it may be used in. A student enters it at checkout
 * while buying a program. When that payment lands, the free program is opened
 * on their account too — no invoice, no second payment.
 */

export type PromotionStatus = "paused" | "scheduled" | "live" | "ended" | "used-up";

/** One promotion, as stored. Times are ISO strings (UTC). */
export interface Promotion {
  id: string;
  /** Normalized uppercase code, e.g. `FREE300`. */
  code: string;
  /** The program a student receives free, for free. */
  rewardProgramId: string;
  /** A line the teacher writes, e.g. "Independence Day offer". */
  description: string;
  /** The first moment the code may be used. */
  startsAt: string;
  /** The last moment the code may be used (exclusive). */
  endsAt: string;
  /** How many students may use it. `0` means no limit. */
  maxRedemptions: number;
  /** The teacher's on/off switch, independent of the window. */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A promotion plus what has happened to it, for the teacher's list. */
export interface PromotionWithStats extends Promotion {
  redeemedCount: number;
  /** Value of the reward at today's price, for "given away" figures. */
  rewardValue: number;
  rewardProgramName: string;
}

export interface PromotionFields {
  rewardProgramId: string;
  description: string;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number;
  active: boolean;
}

export const PROMO_STATUS_LABEL: Record<PromotionStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  paused: "Paused",
  ended: "Ended",
  "used-up": "Fully claimed",
};

/**
 * What a code is doing right now.
 *
 * `paused` wins over the window: the teacher switched it off on purpose, and
 * that is the reason the student's code was refused. Otherwise the window
 * decides, and the usage cap is checked last — a code that has run out of
 * claims is not "live" even inside its window.
 */
export function promotionStatus(
  promo: Pick<Promotion, "active" | "startsAt" | "endsAt" | "maxRedemptions"> & { redeemedCount?: number },
  now: number = Date.now()
): PromotionStatus {
  if (!promo.active) return "paused";
  const starts = Date.parse(promo.startsAt);
  const ends = Date.parse(promo.endsAt);
  if (Number.isFinite(starts) && now < starts) return "scheduled";
  if (Number.isFinite(ends) && now >= ends) return "ended";
  if (promo.maxRedemptions > 0 && (promo.redeemedCount ?? 0) >= promo.maxRedemptions) return "used-up";
  return "live";
}

/**
 * Codes are case-insensitive and have no spaces, so `free 300` and `FREE300`
 * are the same code. Every read and write goes through this.
 */
export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** 3–24 characters of A–Z, 0–9, dash or underscore. */
export function isValidPromoCode(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code);
}

/** The sentence a bad code deserves, or null when it is usable. */
export function promoCodeError(code: string): string | null {
  if (!code) return "Enter a promo code.";
  if (!isValidPromoCode(code)) {
    return "A promo code is 3–24 letters or numbers (dashes and underscores are fine).";
  }
  return null;
}

/** `12 Oct 2026, 09:00` in UTC — the app's one clock. */
export function promoDateLabel(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
}

/** `12 Oct 2026` in UTC. */
export function promoDayLabel(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(time));
}

/** "12 Oct 2026, 09:00 → 31 Oct 2026, 20:00" — what the teacher set. */
export function promotionWindowLabel(
  promo: Pick<Promotion, "startsAt" | "endsAt">
): string {
  return `${promoDateLabel(promo.startsAt)} → ${promoDateLabel(promo.endsAt)}`;
}

/** "3 of 50 used" / "3 used" / "No claims yet". */
export function promotionUsageLabel(promo: Pick<Promotion, "maxRedemptions"> & { redeemedCount: number }): string {
  const used = promo.redeemedCount;
  if (!used && !promo.maxRedemptions) return "No claims yet";
  if (promo.maxRedemptions > 0) return `${used} of ${promo.maxRedemptions} claimed`;
  return `${used} claimed`;
}

/* -------------------------------------------------------------------------- */
/* datetime-local ⇄ ISO                                                       */
/* -------------------------------------------------------------------------- */

/**
 * An ISO timestamp as the value a `datetime-local` input wants, in the
 * browser's own timezone. `new Date(value).toISOString().slice(0, 16)` would
 * show UTC and quietly shift the teacher's times.
 */
export function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The ISO timestamp behind a `datetime-local` value, or "" when incomplete. */
export function localInputToIso(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** Round-trips through `localInputToIso` so a default always fills the input. */
export function defaultPromotionWindow(now: number = Date.now(), days = 30): { startsAt: string; endsAt: string } {
  const start = new Date(Math.floor(now / 60_000) * 60_000);
  const end = new Date(start.getTime() + days * 86_400_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}
