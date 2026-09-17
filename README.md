# Sparks 💘

**Find your person.** A warm little dating-app demo built with Next.js — real accounts,
profiles, matches, date ideas and compatibility scores, backed by a complete, server-enforced
membership (subscription) engine.

## What's inside

- **User accounts** — sign up with an email and password (scrypt-hashed, never stored in
  plain text), sign in, sign out, and pick back up for 30 days via an httpOnly session cookie.
  Five bad passwords in a row locks sign-in for a few minutes.
- **Profile creation** — a four-step wizard for your photo, age, location, bio, interests,
  gender and dating preferences. Every step is a real save, so you can leave mid-wizard and
  come back to the same place. Matching stays locked until the profile is finished.
- **Profile photo** — picked in the browser, centre-cropped to a square and downscaled on a
  canvas before upload; the server re-validates the type and size. No photo? Pick an avatar.
- **Age, location, bio, interests** — birthdays are validated against an 18+ rule, bios are
  capped at 500 characters, interests come from a curated catalogue or your own tags (3–10).
  Interests and location feed straight into compatibility and who shows up in Discover.
- **Gender & dating preferences** — your gender, pronouns, who you want to meet, an age range,
  a distance limit and what you're after. Discover only surfaces people inside those bounds
  (and falls back gracefully when it finds nobody).
- **Edit profile** — `/dashboard/profile` with per-section saving, unsaved-change hints and a
  live "how others see you" card.
- **Account settings** — change your email (password confirmed), change your password,
  notification and privacy toggles, download all of your data as JSON, and delete your account
  with a typed confirmation.
- **Matches & date ideas** — discover demo singles, match with them, plan dates together and
  tick them off after you've been.
- **Membership tiers** — Free, Premium and Elite, priced in Ghana cedis (GH₵):
  - **Free** — 3 active matches, 25 likes per billing period.
  - **Premium** — 25 matches, 2,000 likes, love insights and CSV export.
  - **Elite** — unlimited everything plus the full activity timeline.
- **Stripe-like subscription behaviour**
  - Upgrades apply **immediately** (new period starts, invoice issued).
  - Downgrades are **scheduled** for the end of the current period.
  - Cancel keeps your perks until the period ends; resume any time before then.
  - Billing-cycle switches (monthly ⇄ yearly) charge and restart the period.
- **Entitlements enforced server-side** — match limits, like allowances, insights, export and
  the activity timeline are all checked in the API routes, not just hidden in the UI.
- **Billing history** — every upgrade, renewal and cycle switch issues an invoice.
- **Admin console** (`/admin`) — site-wide stats (accounts, matches, likes, revenue, est. MRR,
  plan distribution) plus full member management: comp plans in either direction (no invoice),
  reset like allowances, suspend/reinstate, promote/demote admins and delete accounts.
  Suspended members can still sign in and edit their profile, but every like, match and
  membership action is rejected by the server (`403 SUSPENDED`) until they're reinstated.
  Admins can't suspend, demote or delete themselves.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Join free** — create an account, then walk through
profile creation. Your demo profile starts on the Free plan with one match waiting.

Prefer not to sign up? The sign-in page has one-tap demo accounts:

| Account | Email | Password |
| --- | --- | --- |
| Member (Premium, matches + dates) | `ama@sparks.app` | `sunrise2026!` |
| Member (Free, one match) | `kwame@sparks.app` | `dawnrunner24` |
| Member (Elite, no photo — avatar only) | `efua@sparks.app` | `palettecat24` |
| Admin console | `admin@sparks.app` | `sparksadmin1` |

## Notes

- All data lives **in memory** and resets when the server restarts — including accounts.
- Passwords are hashed with Node's scrypt (`src/lib/password.ts`) and never leave the server;
  profile/API responses are built from a whitelisted DTO, so a hash can't leak by accident.
- Payments are **simulated** — no real money moves, no card is ever asked for.
- There's no password reset on purpose: this demo never sends email. The settings page says so.
- Prices are displayed in Ghana cedis (GH₵); change the brand or currency in
  `src/config/site.ts` and the whole app follows.

## Structure

| Path | Purpose |
| --- | --- |
| `src/config/site.ts` | Brand, currency, support email and the demo credentials |
| `src/lib/profile.ts` | Profile shape, validation rules, completeness, compatibility maths |
| `src/lib/password.ts` | scrypt hashing + verification (server-only) |
| `src/lib/password-rules.ts` | The same password policy, safe to use in the browser |
| `src/lib/accounts.ts` | Sign up / sign in / lockout, profile + settings services, deletion |
| `src/lib/store.ts` | In-memory store: users, matches, date ideas, invoices, demo seeding |
| `src/lib/demo-pool.ts` | The demo singles (browser-safe, also used by the live preview) |
| `src/lib/session.ts` | Session cookie, `requireUser` / `requireAdmin` guards |
| `src/lib/plans.ts` | Membership tiers, prices, limits and perks |
| `src/lib/subscription.ts` | Upgrade / downgrade / cancel / renew logic |
| `src/lib/admin.ts` | Admin stats + suspend / comp / promote / delete actions |
| `src/app/api/auth/*` | `signup`, `login`, `logout`, `me` |
| `src/app/api/profile*` | `profile` (GET/PATCH), `profile/photo` (PUT/DELETE), `profile/complete` |
| `src/app/api/settings/*` | `settings`, `settings/email`, `settings/password`, `settings/data`, `settings/account` |
| `src/app/api/*` | Matches, dates, membership, export and admin APIs |
| `src/app/signup`, `src/app/login` | Create an account, sign in |
| `src/app/onboarding` | Four-step profile creation wizard |
| `src/app/dashboard/*` | Overview, matches, **profile**, **settings**, membership, billing, timeline |
| `src/app/admin/*` | Admin console (admins only, enforced server-side) |
