# natthesisa

A tidy SaaS workspace (boards & tasks) with **subscription control** built in — built with Next.js 16 (App Router), TypeScript and Tailwind CSS v4.

## Features

- **Boards & tasks** — create boards, add/complete/delete tasks, live usage meters.
- **Subscription control** (the core of this project):
  - Free / Pro / Business plans with monthly & yearly billing.
  - **Upgrades apply immediately** (new period starts today, invoice issued, usage resets).
  - **Downgrades are scheduled** for the end of the paid period (Stripe-like) and can be undone.
  - **Cancel** keeps paid features until the period ends; **resume** any time before that.
  - Renewals roll over automatically when a period ends.
- **Server-side enforcement** — board limits, per-period action limits and paid entitlements are checked in the API routes (HTTP 402/403), not just hidden in the UI.
- **Entitlements** — Insights & analytics (Pro+), CSV export (Pro+), audit log (Business).
- **Billing page** — subscription status, billing-cycle switch, cancel/resume, payment method, invoice history.
- Demo auth: sign in with any name; data is kept in memory (resets on restart). No real payments.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — sign in with any name, then try the full loop:
**Plans → Upgrade to Pro → Billing → Cancel → Resume → Downgrade.**

## Try the limits

The Free plan allows 3 boards and 25 actions per billing period — hit either one and the API
answers `402` with an upsell message, the same way a real billing integration would gate usage.

## Structure

```
src/
  app/            pages (landing, login, dashboard) + API routes
    api/          auth, subscription, boards, tasks, export
  components/     UI (plans grid, billing actions, boards view, charts…)
  lib/
    plans.ts      plan catalog, limits, entitlements, pricing helpers
    store.ts      in-memory data store + seeding + usage tracking
    subscription.ts  plan-change engine (upgrade/downgrade/cancel/resume/renewal)
    session.ts    cookie sessions
```
