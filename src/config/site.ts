/**
 * ✏️ Central site configuration — the FIRST place to edit.
 *
 * Change the brand name or currency here and the whole app follows:
 * prices on the landing page, plan cards, invoices, and every charge.
 */
export const site = {
  name: "Sparks",
  tagline: "Find your person",
  description:
    "A warm little dating app with membership control built in: upgrade, downgrade, cancel and resume — all enforced server-side.",
  currency: {
    /** ISO 4217 code (informational) */
    code: "GHS",
    /** Symbol shown in front of every amount in the UI */
    symbol: "GH₵",
    /** Human-readable name used in UI copy */
    label: "Ghana cedis",
  },
} as const;
