# Natthesisa

A tidy SaaS workspace (boards & tasks) with **subscription control** built in — built with Next.js 16 (App Router), TypeScript and Tailwind CSS v4. All prices are in **Ghana cedis (GH₵)**.

## ✏️ Where to edit what (cheat sheet)

| I want to… | Edit this file |
|---|---|
| Change brand name or currency | `src/config/site.ts` |
| Change plans, prices, limits, entitlements | `src/lib/plans.ts` |
| Change subscription rules (upgrade/downgrade/cancel) | `src/lib/subscription.ts` |
| Change landing page copy & sections | `src/app/page.tsx` |
| Change colors / background animations | `src/app/globals.css` |
| Change the dashboard sidebar | `src/components/SidebarNav.tsx` |
| Change billing page (cancel/resume/invoices) | `src/app/dashboard/billing/page.tsx` + `src/components/BillingActions.tsx` |
| Change plan cards & upgrade modal | `src/components/PlansGrid.tsx` |
| Change boards & tasks UI | `src/components/BoardsView.tsx` |
| Add a new page | Create a folder in `src/app/` with a `page.tsx` |
| Add a new API endpoint | Create a folder in `src/app/api/` with a `route.ts` |
| Change the in-memory database / seed data | `src/lib/store.ts` |
| Deploy settings (Vercel) | `vercel.json` |

## 📁 Project structure

```
natthesisa/
├── vercel.json               ← Vercel deploy config (region: Cape Town)
├── package.json              ← dependencies & scripts (dev / build / start)
├── next.config.ts            ← Next.js settings
├── tsconfig.json             ← TypeScript settings
├── postcss.config.mjs        ← Tailwind v4 pipeline
│
└── src/
    ├── config/
    │   └── site.ts           ← ✏️ START HERE: brand + currency, one place
    │
    ├── lib/                  ← the "engine" — pure logic, no UI
    │   ├── plans.ts          ← ✏️ plan catalog: prices (GH₵), limits, entitlements
    │   ├── subscription.ts   ← plan-change engine: upgrade / downgrade /
    │   │                        cancel / resume / renewal + invoices
    │   ├── store.ts          ← in-memory database: users, boards, invoices,
    │   │                        usage tracking, audit log, seed data
    │   ├── session.ts        ← cookie-based sessions
    │   └── format.ts         ← date & money formatting (uses site config)
    │
    ├── components/           ← reusable UI pieces (used by pages)
    │   ├── AnimatedBackground.tsx  ← drifting blobs + panning grid backdrop
    │   ├── PlansGrid.tsx           ← plan cards, monthly/yearly toggle, confirm modal
    │   ├── BillingActions.tsx      ← cycle switch, cancel/resume, undo pending
    │   ├── BoardsView.tsx          ← boards, tasks, limit/upsell banners
    │   ├── SidebarNav.tsx          ← dashboard navigation
    │   ├── LoginForm.tsx           ← demo sign-in form
    │   ├── ExportButton.tsx        ← CSV download (Pro+)
    │   ├── UsageBar.tsx            ← usage progress bars
    │   └── UsageChart.tsx          ← 7-day activity chart
    │
    └── app/                  ← routes — one folder = one URL (Next.js App Router)
        ├── globals.css       ← ✏️ theme + all keyframe animations
        ├── layout.tsx        ← root layout, <head> metadata (uses site config)
        ├── page.tsx          ← /            landing (hero, features, pricing)
        ├── login/
        │   └── page.tsx      ← /login       demo sign-in
        ├── dashboard/
        │   ├── layout.tsx    ← auth guard + sidebar for all /dashboard/*
        │   ├── page.tsx      ← /dashboard           overview & usage
        │   ├── boards/page.tsx  ← /dashboard/boards
        │   ├── plans/page.tsx   ← /dashboard/plans   upgrade/downgrade
        │   ├── billing/page.tsx ← /dashboard/billing cancel/resume/invoices
        │   └── audit/page.tsx   ← /dashboard/audit   Business-only
        └── api/              ← backend endpoints (route.ts per folder)
            ├── auth/login/     POST  sign in (creates workspace)
            ├── auth/logout/    POST  sign out
            ├── subscription/   POST  changePlan | cancel | resume | clearPending
            ├── boards/         POST create (enforces board limit → 402)
            ├── boards/[id]/    DELETE board
            ├── boards/[id]/tasks/  POST add task (enforces action limit → 402)
            ├── tasks/[id]/     PATCH toggle done · DELETE task
            └── export/         GET   CSV export (Pro+ → else 403)
```

## Features

- **Boards & tasks** — create boards, add/complete/delete tasks, live usage meters.
- **Subscription control** (the core of this project):
  - Free / Pro (GH₵99/mo · GH₵990/yr) / Business (GH₵399/mo · GH₵3,990/yr), monthly & yearly billing.
  - **Upgrades apply immediately** (new period starts today, invoice issued, usage resets).
  - **Downgrades are scheduled** for the end of the paid period (Stripe-like) and can be undone.
  - **Cancel** keeps paid features until the period ends; **resume** any time before that.
  - Renewals roll over automatically when a period ends.
- **Server-side enforcement** — board limits, per-period action limits and paid entitlements are checked in the API routes (HTTP 402/403), not just hidden in the UI.
- **Entitlements** — Insights & analytics (Pro+), CSV export (Pro+), audit log (Business).
- **Billing page** — subscription status, billing-cycle switch, cancel/resume, invoice history.
- Demo auth: sign in with any name; data is kept in memory (resets on restart). No real payments.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — sign in with any name, then try the full loop:
**Plans → Upgrade to Pro → Billing → Cancel → Resume → Downgrade.**

## Deploying to Vercel

1. Merge this branch into `main` (or set the Vercel Production Branch to this branch).
2. Import the repo at vercel.com — `vercel.json` already sets the framework and the
   Cape Town (`cpt1`) region, closest to Ghana.
3. That's it — no environment variables needed.

## Try the limits

The Free plan allows 3 boards and 25 actions per billing period — hit either one and the API
answers `402` with an upsell message, the same way a real billing integration would gate usage.
