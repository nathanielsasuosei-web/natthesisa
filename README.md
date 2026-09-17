# Sparks 💘

**Find your person.** A mobile-shaped dating app built with Next.js — real accounts, profiles, a
swipe deck, matches, date ideas and compatibility scores, backed by a complete, server-enforced
membership (subscription) engine.

The member experience is a phone app: a swipeable card deck, a bottom tab bar, full-screen
profile view and editor, and photo galleries. The admin console is deliberately *not* that —
it stays a back-office table.

## What's inside

- **User accounts** — sign up with an email and password (scrypt-hashed, never stored in
  plain text), sign in, sign out, and pick back up for 30 days via an httpOnly session cookie.
  Five bad passwords in a row locks sign-in for a few minutes.
- **Profile creation** — a five-step wizard (photos → basics → about you → who you want → your
  card) inside the same phone shell. Every step is a real save, so you can leave mid-wizard and
  come back to the same place. Liking stays locked until the profile is finished.
- **Photos, not one photo** — up to 6 shots per profile, each centre-cropped and downscaled on a
  canvas in the browser before upload; the server re-validates every entry's type and size. The
  first photo is the primary one, and reordering is part of the same save. No photos? Pick an
  avatar instead.
- **Age, location, bio, interests** — birthdays are validated against an 18+ rule, bios are
  capped at 500 characters, interests come from a curated catalogue or your own tags (3–10).
  Interests and location feed straight into compatibility and who shows up in your deck.
- **Gender & dating preferences** — your gender, pronouns, who you want to meet, an age range, a
  distance limit and what you're after. The deck only surfaces people inside those bounds (and
  widens rather than showing you an empty screen when it finds nobody).
- **The swipe deck** — drag a card right to like, left to pass, up to super-like; or use the
  buttons, or the arrow keys. Tap the sides of a card to page through its slides (photos, bio,
  prompt answer). Nothing counts until `POST /api/discover/swipe` accepts it, and a like only
  becomes a match when the feeling is mutual (score ≥ 72) — otherwise the app tells you so plainly.
  Undo the last swipe, or bring everyone you passed on back into the deck.
- **Edit profile** — `/app/profile/edit`: sections instead of a form wall, a sticky save bar,
  per-field errors from the atomic PATCH, and a live preview of your own card.
- **Account settings** — `/app/settings`: visibility toggles, notification toggles, change your
  email (password confirmed), change your password, download your data as JSON, export match
  history as CSV (Premium+), and delete your account with a typed confirmation.
- **Matches & date ideas** — new matches up top, then a row per match. Open one for their
  profile, shared interests, and a shared date-idea list you can add to, tick off and delete.
  Unmatching asks for confirmation first.
- **Membership tiers** — Free, Premium and Elite, priced in Ghana cedis (GH₵):
  - **Free** — 3 active matches, 25 likes per billing period.
  - **Premium** — 25 matches, 2,000 likes, love insights and CSV export.
  - **Elite** — unlimited everything plus the full activity timeline.
- **Stripe-like subscription behaviour**
  - Upgrades apply **immediately** (new period starts, invoice issued).
  - Downgrades are **scheduled** for the end of the current period.
  - Cancel keeps your perks until the period ends; resume any time before then.
  - Billing-cycle switches (monthly ⇄ yearly) charge and restart the period.
- **Entitlements enforced server-side** — match caps, like allowances, insights, export and the
  activity timeline are all checked in the API routes, not just hidden in the UI. The meters under
  the deck are read from the same numbers, so they never lie.
- **Billing history** — every upgrade, renewal and cycle switch issues an invoice.
- **Admin console** (`/admin`) — site-wide stats (accounts, matches, likes, revenue, est. MRR,
  plan distribution) plus full member management: comp plans in either direction (no invoice),
  reset like allowances, suspend/reinstate, promote/demote admins and delete accounts.
  Suspended members can still sign in and edit their profile and photos, but every like, match and
  membership action is rejected (`403 SUSPENDED`) and the deck shows an "on hold" screen instead.
  Admins can't suspend, demote or delete themselves.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Join free** — create an account, walk through the wizard,
then start swiping. Your demo profile starts on the Free plan with one match waiting.

Prefer not to sign up? The sign-in page has one-tap demo accounts:

| Account | Email | Password |
| --- | --- | --- |
| Member (Premium, matches + dates) | `ama@sparks.app` | `sunrise2026!` |
| Member (Free, one match) | `kwame@sparks.app` | `dawnrunner24` |
| Member (Elite, no photos — avatar only) | `efua@sparks.app` | `palettecat24` |
| Admin console | `admin@sparks.app` | `sparksadmin1` |

## The screens

| Route | Screen |
| --- | --- |
| `/app/discover` | The deck — drag to swipe, meters for likes and match slots, "it's a match" celebration, the limits sheet, and an honest empty state |
| `/app/matches` | New matches strip, then a row per match → their card, shared interests, date ideas, opener, unmatch |
| `/app/profile` | Your own profile full-bleed: gallery lightbox, completeness, stats, bio, interests, preferences |
| `/app/profile/edit` | Sectioned editor with a sticky save bar and a live card preview |
| `/app/profile/preview` | "How others see you", including who your current answers would surface first |
| `/app/settings` | Visibility, notifications, email, password, data export, sign out, delete account |
| `/app/membership` | Current plan, cycle switch, every plan, cancel / resume / undo a scheduled change |
| `/app/billing` | Price, period, usage meters, 7-day activity chart (Premium+), invoices |
| `/app/activity` | The full timeline (Elite only) |
| `/login`, `/signup`, `/onboarding` | The same phone shell, no tab bar |
| `/admin` | Back-office console |

Old `/dashboard/*` URLs redirect to their `/app/*` equivalents.

## Notes

- All data lives **in memory** and resets when the server restarts — including accounts, swipes
  and matches.
- Passwords are hashed with Node's scrypt (`src/lib/password.ts`) and never leave the server;
  profile/API responses are built from a whitelisted DTO, so a hash can't leak by accident.
- Photos are stored as data URLs on the profile (that's what keeps the demo dependency-free), so
  the server caps them at 1.5 MB and rejects oversized galleries with `413 PHOTO_TOO_BIG`.
- Payments are **simulated** — no real money moves, no card is ever asked for.
- There's no password reset on purpose: this demo never sends email. The sign-in screen says so.
- Motion is decorative and honours `prefers-reduced-motion`; the deck also works from the
  keyboard (← pass, → like, ↑ super-like).
- Prices are displayed in Ghana cedis (GH₵); change the brand or currency in
  `src/config/site.ts` and the whole app follows.

## Structure

| Path | Purpose |
| --- | --- |
| `src/config/site.ts` | Brand, currency, support email and the demo credentials |
| `src/lib/discover.ts` | The deck: ranking, gating, swipes, rewind, reshuffle, mutual-match rule |
| `src/lib/profile.ts` | Profile + gallery shape, validation rules, completeness, compatibility maths |
| `src/lib/password.ts` | scrypt hashing + verification (server-only) |
| `src/lib/password-rules.ts` | The same password policy, safe to use in the browser |
| `src/lib/accounts.ts` | Sign up / sign in / lockout, profile + gallery + settings services, deletion |
| `src/lib/store.ts` | In-memory store: users, swipes, matches, date ideas, invoices, demo seeding |
| `src/lib/demo-pool.ts` | The demo singles (browser-safe; card art, jobs and prompts live here) |
| `src/lib/session.ts` | Session cookie, `requireUser` / `requireAdmin` guards, gating errors |
| `src/lib/plans.ts` | Membership tiers, prices, limits and perks |
| `src/lib/subscription.ts` | Upgrade / downgrade / cancel / renew logic |
| `src/lib/admin.ts` | Admin stats + suspend / comp / promote / delete actions |
| `src/components/forms.tsx` | The design system: panels, rows, sheets, chips, switches, meters, toasts |
| `src/components/SwipeDeck.tsx` | Drag physics, stamps, slides, deck buttons, limit and gate sheets |
| `src/components/TabBar.tsx` | Bottom tabs with the new-matches badge |
| `src/components/PhoneFrame.tsx` | The device shell for the auth and wizard screens |
| `src/app/api/auth/*` | `signup`, `login`, `logout`, `me` |
| `src/app/api/discover*` | `discover` (the deck + gating), `discover/swipe` (like/pass/super/rewind/reshuffle) |
| `src/app/api/profile*` | `profile` (GET/PATCH), `profile/gallery` (PUT), `profile/photo` (PUT/DELETE), `profile/complete` |
| `src/app/api/settings/*` | `settings`, `settings/email`, `settings/password`, `settings/data`, `settings/account` |
| `src/app/api/*` | Matches, dates, subscription, export and admin APIs |
| `src/app/app/*` | The member app (phone shell + tab bar + the screens above) |
| `src/app/admin/*` | Admin console (admins only, enforced server-side) |
