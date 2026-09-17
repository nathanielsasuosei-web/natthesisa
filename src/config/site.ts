/**
 * ✏️ Central site configuration — the FIRST place to edit.
 *
 * Change the brand name or currency here and the whole app follows:
 * prices on the landing page, plan cards, invoices, and every charge.
 * Account defaults (country, support email) live here too.
 */
export const site = {
  name: "Sparks",
  tagline: "Find your person",
  description:
    "A warm little dating app with real accounts and a membership engine behind it: sign up with an email and password, build a profile with age, location, interests and dating preferences, then upgrade, downgrade, cancel and resume — all enforced server-side.",
  currency: {
    /** ISO 4217 code (informational) */
    code: "GHS",
    /** Symbol shown in front of every amount in the UI */
    symbol: "GH₵",
    /** Human-readable name used in UI copy */
    label: "Ghana cedis",
  },
  /** Pre-selected country on the signup and profile forms. */
  defaultCountry: "Ghana",
  /** Shown in "contact us" copy on the settings page. */
  supportEmail: "hello@sparks.app",
  /** Demo-only credentials surfaced on the sign-in page. */
  demo: {
    memberEmail: "ama@sparks.app",
    memberPassword: "sunrise2026!",
    adminEmail: "admin@sparks.app",
    adminPassword: "sparksadmin1",
  },
} as const;
