# Sparks 💘

**Find your person.** A warm little dating-app demo built with Next.js — matches,
date ideas and compatibility scores, backed by a complete, server-enforced
membership (subscription) engine.

## What's inside

- **Matches & date ideas** — discover demo singles, match with them, plan dates
  together and tick them off after you've been.
- **Membership tiers** — Free, Premium and Elite, priced in Ghana cedis (GH₵):
  - **Free** — 3 active matches, 25 likes per billing period.
  - **Premium** — 25 matches, 2,000 likes, love insights and CSV export.
  - **Elite** — unlimited everything plus the full activity timeline.
- **Stripe-like subscription behaviour**
  - Upgrades apply **immediately** (new period starts, invoice issued).
  - Downgrades are **scheduled** for the end of the current period.
  - Cancel keeps your perks until the period ends; resume any time before then.
  - Billing-cycle switches (monthly ⇄ yearly) charge and restart the period.
- **Entitlements enforced server-side** — match limits, like allowances,
  insights, export and the activity timeline are all checked in the API routes,
  not just hidden in the UI.
- **Billing history** — every upgrade, renewal and cycle switch issues an invoice.
- **Admin console** (`/admin`) — sign in as **admin** to get the administrator
  role. Site-wide stats (accounts, matches, likes, revenue, est. MRR, plan
  distribution) plus full member management: comp plans in either direction
  (no invoice), reset like allowances, suspend/reinstate, promote/demote
  admins and delete accounts. Suspended members can still sign in, but every
  like, match and membership action is rejected by the server (`403 SUSPENDED`)
  until they're reinstated. Admins can't suspend, demote or delete themselves.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Join free** and sign in with any name.
Your demo profile starts on the Free plan with a couple of matches waiting.
Sign in with the name **admin** to open the admin console instead.

## Notes

- All data lives **in memory** and resets when the server restarts.
- Payments are **simulated** — no real money moves, no card is ever asked for.
- Prices are displayed in Ghana cedis (GH₵); change the brand or currency in
  `src/config/site.ts` and the whole app follows.

## Structure

| Path | Purpose |
| --- | --- |
| `src/config/site.ts` | Brand name, tagline, currency — edit here first |
| `src/lib/plans.ts` | Membership tiers, prices, limits and perks |
| `src/lib/store.ts` | In-memory store: users, matches, date ideas, invoices |
| `src/lib/subscription.ts` | Upgrade / downgrade / cancel / renew logic |
| `src/lib/admin.ts` | Admin stats + suspend / comp / promote / delete actions |
| `src/app/api/*` | Auth, matches, dates, membership, export and admin APIs |
| `src/app/dashboard/*` | Overview, matches, membership, billing, timeline |
| `src/app/admin/*` | Admin console (admins only, enforced server-side) |
