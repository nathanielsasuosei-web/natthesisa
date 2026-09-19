# codemasterghana — learning platform

A polished full-stack learning-platform MVP for web development, app development and computer science. It includes learner accounts, structured courses and lessons, saved progress, payment plans, invoices and an administrator console.

Built with **Next.js 16, React 19, TypeScript and Tailwind CSS 4**.

## What is implemented

### Student experience

- Responsive marketing website with curriculum, testimonials and pricing
- Account creation and sign-in flows
- Searchable/filterable course library
- Six learning paths across web, mobile, backend and computer science
- Full course pages with modules, lessons, access rules and instructor details
- Focused lesson reader with examples, challenges and next/previous navigation
- Server-saved lesson completion, course percentages and activity history
- Dashboard with weekly goal, streak, time learned and recommendations
- Progress analytics, certificates, learning timeline and CSV export
- Editable learner profile, experience level, track and weekly goal

### Plans and payments

- **Explorer** — two complete starter courses, free
- **Pro** — full library, certificates, downloads and advanced progress
- **Mentor** — Pro features plus mentoring and portfolio reviews
- Monthly and yearly billing
- Immediate upgrades and billing-cycle changes
- End-of-period downgrades and cancellation
- Invoice history and server-side course entitlements
- Interactive checkout using a clearly labelled **demo payment method**

> No real money moves in this repository. The billing engine and checkout UX are functional, but payment success is simulated. Connect a verified provider such as Paystack, Flutterwave or Stripe and process plan changes from a verified webhook before production.

### Administrator experience

- Site-wide learner, engagement, course and revenue metrics
- Course enrollment/completion monitoring
- Search and account filters
- Pause/restore learner accounts
- Grant any plan without charging (“comp” access)
- Reset learner progress
- Promote/demote administrators
- Delete learner accounts
- Server-side protection for every administrator action

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other useful commands:

```bash
npm run build       # production build + TypeScript validation
npm run typecheck   # TypeScript only
npm start           # run the production build
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@codemasterghana.dev` | `student123` |
| Administrator | `admin@codemasterghana.dev` | `admin123` |

The login page also has one-click buttons for both accounts.

## Where each part of the code lives

This is the “what to paste where” map for continuing the build.

| Step | File or folder | Purpose |
| --- | --- | --- |
| 1. Brand | `src/config/site.ts` | Name, tagline, support email and currency |
| 2. Plans | `src/lib/plans.ts` | Plan names, prices, features and entitlements |
| 3. Course content | `src/lib/courses.ts` | Courses, modules, lessons, examples and challenges |
| 4. User data | `src/lib/store.ts` | Accounts, progress, usage, invoices and demo seed data |
| 5. Sessions | `src/lib/session.ts` | Session-cookie lookup and role checks |
| 6. Account API | `src/app/api/auth/*`, `src/app/api/account/route.ts` | Sign up, sign in, sign out and profile updates |
| 7. Progress API | `src/app/api/progress/route.ts` | Start courses and complete/uncomplete lessons |
| 8. Billing engine | `src/lib/subscription.ts` | Upgrade, downgrade, renew, cancel and resume rules |
| 9. Billing API | `src/app/api/subscription/route.ts` | Authenticated plan actions |
| 10. Admin rules | `src/lib/admin.ts`, `src/app/api/admin/*` | Metrics and protected account-management actions |
| 11. Marketing UI | `src/app/page.tsx` | Public landing page |
| 12. Student UI | `src/app/dashboard/*` | Overview, library, progress, plans, billing and account |
| 13. Lesson UI | `src/app/learn/[courseId]/[lessonId]/page.tsx` | Immersive lesson experience |
| 14. Admin UI | `src/app/admin/*`, `src/components/AdminUsersTable.tsx` | Monitoring dashboard and controls |
| 15. Design system | `src/app/globals.css`, `src/components/Icon.tsx` | Colors, motion, shared icon set and global styles |

## Add a new course

Paste a new course object into the `COURSES` array in `src/lib/courses.ts`. Use `requiredPlan: "free"` for Explorer access or `requiredPlan: "premium"` for paid access.

```ts
{
  id: "python-foundations",
  slug: "python-foundations",
  title: "Python Foundations",
  shortTitle: "Python",
  description: "Learn Python by building useful command-line tools.",
  category: "Computer Science",
  level: "Beginner",
  tone: "green",
  icon: "nodes", // browser | braces | react | mobile | nodes | server
  requiredPlan: "premium",
  instructor: { name: "Instructor Name", role: "Python Engineer", initials: "IN" },
  rating: 4.9,
  learners: 0,
  project: "A command-line productivity toolkit",
  outcomes: ["Write Python programs", "Model data", "Read files", "Ship a project"],
  tags: ["Python", "CLI"],
  modules: [
    {
      id: "python-basics",
      title: "01 · Python basics",
      description: "Start with values, expressions and functions.",
      lessons: [
        // Follow the lesson(...) examples already in this file.
      ],
    },
  ],
}
```

Course cards, catalog filtering, progress calculation, admin analytics and access checks all read from this one catalog automatically.

## Connect a real database

The current `src/lib/store.ts` is an in-memory demo store. It survives development hot reloads but resets when the server process restarts and cannot safely serve multiple production instances.

For production:

1. Create PostgreSQL tables for `users`, `profiles`, `subscriptions`, `invoices`, `course_progress`, `lesson_progress` and `activity_events`.
2. Add Prisma or Drizzle and place the database client in `src/lib/db.ts`.
3. Replace store reads/writes in `src/lib/store.ts`, `src/lib/admin.ts` and `src/lib/subscription.ts` with database transactions.
4. Use unique constraints on email and payment-provider references.
5. Keep course access checks in the server APIs—not only in the UI.

## Connect real authentication

The included account system is intentionally self-contained for the demo. Before production, use Auth.js, Clerk or Supabase Auth, with email verification and password reset.

Whichever provider you choose, keep `getCurrentUser()` and `getCurrentAdmin()` in `src/lib/session.ts` as the application boundary. The rest of the app already calls those helpers, so the replacement remains localized.

## Connect real payments safely

Use this order of operations:

1. Create matching product/price records in the payment provider.
2. Add provider price IDs to each plan in `src/lib/plans.ts`.
3. Create a server checkout endpoint under `src/app/api/checkout/route.ts`.
4. Redirect the learner to the provider-hosted checkout.
5. Add a webhook route under `src/app/api/webhooks/<provider>/route.ts`.
6. Verify the webhook signature with the provider secret.
7. Only after verification, update the subscription and create an invoice in the database.
8. Make webhook handling idempotent using the provider event/reference ID.
9. Never accept card numbers in your own forms unless your compliance scope explicitly allows it.

Do **not** call `changePlan()` from an unverified “payment successful” browser redirect in production. The webhook must be the source of truth.

## Data and access behavior

- Course content is checked on the server in both lesson pages and the progress API.
- Preview lessons are accessible even when the full course is locked.
- A paused learner can view existing data but cannot save progress or alter a subscription.
- Upgrades begin a new billing period immediately and issue an invoice.
- Downgrades preserve paid access until the current period ends.
- Cancelling preserves access until the paid period ends, then returns the account to Explorer.
- Administrator plan overrides do not issue invoices.

## Deployment

The repository includes `vercel.json` and is ready for Vercel preview deployment:

```bash
npm run build
```

Before a public production launch, replace the demo store, authentication and payment simulation described above, then configure secrets in the deployment platform rather than committing `.env` files.
