/**
 * Ghana Mobile Money helpers — with no database imports.
 *
 * This module is deliberately free of server-only dependencies so the checkout
 * UI can validate a student's phone number and detect their network in the
 * browser, while the server re-validates the same way before talking to the
 * payment provider.
 */

export const MOMO_NETWORKS = ["MTN", "Telecel", "AirtelTigo"] as const;
export type MomoNetwork = (typeof MOMO_NETWORKS)[number];

export const MOMO_NETWORK_LABEL: Record<MomoNetwork, string> = {
  MTN: "MTN MoMo",
  Telecel: "Telecel Cash",
  AirtelTigo: "AT Money",
};

/**
 * Ghana numbering prefixes by network. Kept as data (not a provider call) so
 * validation works offline and identically on client and server.
 */
const PREFIXES: Record<MomoNetwork, string[]> = {
  MTN: ["024", "025", "053", "054", "055", "059"],
  Telecel: ["020", "050"],
  AirtelTigo: ["026", "027", "056", "057"],
};

export function isMomoNetwork(value: unknown): value is MomoNetwork {
  return typeof value === "string" && (MOMO_NETWORKS as readonly string[]).includes(value);
}

/** Strips spaces, dashes and brackets from whatever the student typed. */
export function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

/**
 * Normalizes a Ghana phone number to the 10-digit local form (`0541234567`).
 * Accepts `+233…`, `233…` and `00233…` too (the trunk `0` is dropped after
 * the country code, so `+233 54 123 4567` is `0541234567`). Returns null when
 * it is not a plausible Ghana number at all.
 */
export function normalizeGhanaPhone(raw: string): string | null {
  let digits = cleanPhone(raw).replace(/^\+/, "");
  if (digits.startsWith("00233")) digits = `0${digits.slice(5)}`;
  else if (digits.startsWith("233")) digits = `0${digits.slice(3)}`;
  if (!/^\d{10}$/.test(digits)) return null;
  if (!digits.startsWith("0")) return null;
  return digits;
}

/** Which network a (normalized) number belongs to, if the prefix is known. */
export function detectNetwork(normalizedPhone: string): MomoNetwork | null {
  const prefix = normalizedPhone.slice(0, 3);
  for (const network of MOMO_NETWORKS) {
    if (PREFIXES[network].includes(prefix)) return network;
  }
  return null;
}

export interface PhoneCheck {
  ok: boolean;
  /** The 10-digit number, when valid. */
  phone: string | null;
  /** The detected network, when the prefix is a known one. */
  network: MomoNetwork | null;
  error: string | null;
}

/**
 * Validates a MoMo number for checkout. Unknown prefixes are allowed through
 * with a null network (number portability means a 024 number can live on
 * Telecel) — the provider is the final judge — but the shape must be right.
 */
export function checkMomoPhone(raw: string): PhoneCheck {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, phone: null, network: null, error: "Enter the Mobile Money number to charge." };
  }
  const phone = normalizeGhanaPhone(trimmed);
  if (!phone) {
    return {
      ok: false,
      phone: null,
      network: null,
      error: "That does not look like a Ghana number — use 10 digits starting with 0, e.g. 054 123 4567.",
    };
  }
  return { ok: true, phone, network: detectNetwork(phone), error: null };
}

/** `0541234567` → `054 123 4567`, for receipts and the billing page. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : phone;
}

/** Last 4 digits, for the "paid with …" line. Never the full number in public UI. */
export function phoneLast4(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-4);
}
