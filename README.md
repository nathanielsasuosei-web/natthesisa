# codemasterghana — learning platform

A polished full-stack learning-platform MVP for web development, app development and computer science. It includes learner accounts, structured courses and lessons, saved progress, payment plans, invoices and an administrator console.

Built with **Next.js 16, React 19, TypeScript and Tailwind CSS 4**.

## What is implemented

### Student experience

- Responsive marketing website with curriculum, testimonials and pricing
- Real accounts: scrypt-hashed passwords, signed session cookies, and signup /
  sign-in / sign-out / password-change flows backed by PostgreSQL
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
- Subscriptions, invoices and usage stored per account in the database, so a
  learner's plan and billing history survive a restart

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
- Suspend/restore, plan changes and deletions are all written to the database
- Server-side protection for every administrator action

### Owner-only lesson uploads

The site **owner** is the single account allowed to publish lessons and upload
teaching materials. Most administrator controls stay with the admin console,
but lesson publishing is owner-only and enforced on the server:

- The owner adds a **profile photo and logo** once (plus the name and role line
  to show). Both are attached to every lesson he publishes: the lesson reader
  shows a "Lesson by" block with the photo, name, role and logo, and course
  pages show the photo and logo in the instructor panel.
- The owner writes a lesson (title, minutes, summary, content, optional code,
  objectives, practice challenge) and drops it into any course module — or into
  a brand-new module.
- **Pictures and videos can be edited in the console**, before or after upload:
  - *Pictures* (the owner's photo and logo, and image lesson materials) open a
    canvas editor with crop presets (square, wide, freeform), pan, zoom,
    rotate, flip, and brightness / contrast / saturation. Applying re-exports
    the image at the edited size, so the file the learner downloads is the
    edited one.
  - *Videos* open a trim editor: drag the start and end handles or use
    "Set start / Set end here", mute the clip, and capture any frame as the
    thumbnail learners see. The original file is kept — the trim, mute and
    poster are saved with the lesson and honoured by the player, so nothing has
    to be re-encoded.
  - Every edited file is marked **Edited** in the console, and a published
    lesson's materials can be re-edited at any time; replacing a picture
    deletes the file it replaced.
- Video (mp4/webm/mov), PDF, slide decks, images and zip files can be attached
  in the same step. Up to 5 files, 200 MB each, with a live upload progress bar.
- Lessons marked **free preview** open for every signed-in learner; all other
  materials follow the course plan, so Pro-only lessons stay locked.
- Uploaded lessons appear immediately in the course curriculum, the lesson
  reader, dashboard progress, certificates, analytics, the CSV export and the
  admin engagement charts.
- The owner can delete a published lesson, which also removes its files.
- Learners, and administrators who are not the owner, get `403 OWNER_ONLY` from
  every upload endpoint (`GET`/`POST /api/admin/lessons`,
  `DELETE /api/admin/lessons/[id]`) and never see the owner console in the nav.
- The owner account cannot be paused, deleted or demoted, and only the owner can
  grant or remove administrator access.

Uploads are stored on disk and survive server restarts:

```
.data/lessons.json    lesson records + file metadata          (git-ignored)
.data/branding.json   owner photo, logo and display details   (git-ignored)
.data/uploads/*       the uploaded videos, PDFs, slides, images (git-ignored)
```

Set `LESSON_DATA_DIR` to write somewhere else, and `OWNER_EMAIL` to move
ownership to a different account. On hosts with a read-only file system (for
example serverless platforms) point `LESSON_DATA_DIR` at a writable volume
before deploying, or the upload endpoints return a clear "cannot write" error.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in OWNER_EMAIL / OWNER_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a `DATABASE_URL` the app runs on an embedded PostgreSQL (PGlite) in
`.data/pg`, so accounts, progress and invoices persist across restarts with no
database server to install. The first request against an empty database creates
the tables and the owner account from `OWNER_EMAIL` / `OWNER_PASSWORD`. Then sign
in at `/admin-sign-in` and change that password from the account page.

Other useful commands:

```bash
npm run build       # production build + TypeScript validation
npm run typecheck   # TypeScript only
npm start           # run the production build
npm run db:check    # which database is in use + account counts
npm run db:schema   # write db/schema.sql for a hosted Postgres
```

## Accounts

Accounts are real: credentials are hashed with scrypt, sessions are signed
cookies, and everything a learner does (profile, progress, invoices, activity)
is written to PostgreSQL before the request answers.

- **Learners** sign up on `/login`. Password rules are enforced on the server:
  8+ characters, not a common password, and mixed letters and numbers.
- **The owner** is the single admin account. Set `OWNER_EMAIL` and
  `OWNER_PASSWORD` and it is created on the first request; if you would rather
  not keep credentials in the environment, open `/admin-sign-in` on an empty
  database and it offers a one-time "Set up the owner account" form instead
  (that route closes itself as soon as an owner exists, and refuses entirely
  when `OWNER_EMAIL`/`OWNER_PASSWORD` are set). Only the owner can publish
  lessons. Sign in at `/admin-sign-in`, then change the password from
  `/dashboard/account`.
- **Administrators** can suspend or change the plan of any learner from
  `/admin`. Suspended accounts cannot sign in.

There are no demo accounts and nothing is seeded: an empty database stays empty
until the owner signs in and someone signs up.

## Where each part of the code lives

This is the “what to paste where” map for continuing the build.

| Step | File or folder | Purpose |
| --- | --- | --- |
| 1. Brand | `src/config/site.ts` | Name, tagline, support email and currency |
| 2. Plans | `src/lib/plans.ts` | Plan names, prices, features and entitlements |
| 3. Course content | `src/lib/courses.ts` | Courses, modules, lessons, examples and challenges |
| 4. User data | `src/lib/store.ts` | Accounts, progress, usage and invoices, read and written through Postgres |
| 5. Sessions | `src/lib/session.ts` | Signed session cookies and role checks |
| 6. Account API | `src/app/api/auth/*`, `src/app/api/account/route.ts` | Sign up, sign in, sign out, profile and password changes |
| 6a. Database | `src/lib/db.ts`, `src/lib/schema.ts`, `src/lib/bootstrap.ts`, `scripts/*.mts` | Postgres/PGlite driver, schema, first-run setup and CLI reports |
| 6b. Passwords | `src/lib/passwords.ts` | scrypt hashing, verification and strength rules |
| 7. Progress API | `src/app/api/progress/route.ts` | Start courses and complete/uncomplete lessons |
| 8. Billing engine | `src/lib/subscription.ts` | Upgrade, downgrade, renew, cancel and resume rules |
| 9. Billing API | `src/app/api/subscription/route.ts` | Authenticated plan actions |
| 10. Admin rules | `src/lib/admin.ts`, `src/app/api/admin/*` | Metrics and protected account-management actions |
| 10a. Owner identity | `src/lib/owner.ts`, `getCurrentOwner()` in `src/lib/session.ts` | Who is allowed to publish lessons |
| 10b. Lesson uploads | `src/lib/lesson-uploads.ts`, `src/lib/course-content.ts` | Disk store for owner lessons and the merge with the catalog |
| 10c. Upload API | `src/app/api/admin/lessons/*`, `src/app/api/lesson-files/*` | Owner-only publishing and access-checked file streaming |
| 10d. Owner console | `src/app/admin/lessons/page.tsx`, `src/components/OwnerLessonManager.tsx` | The upload form and published-lesson list |
| 10e. Owner branding | `src/lib/branding.ts`, `src/app/api/admin/branding/route.ts`, `src/app/api/branding/[asset]/route.ts`, `src/components/OwnerBrandingCard.tsx` | Profile photo and logo shown on published lessons |
| 10f. Picture / video editors | `src/components/media/ImageEditor.tsx`, `src/components/media/VideoEditor.tsx`, `src/lib/media.ts` | Console editors for cropping pictures and trimming videos |
| 10g. Edited playback | `src/components/TrimmedVideo.tsx`, `src/app/api/admin/lesson-files/[lessonId]/[fileId]/route.ts`, `src/app/api/lesson-files/[lessonId]/[fileId]/poster/route.ts` | Saving edits on published files, and playing the trimmed clip with its thumbnail |
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

Course cards, catalog filtering, progress calculation, admin analytics and access checks all read from this one catalog automatically. Lessons the owner publishes from `/admin/lessons` are merged on top of this catalog at request time (see `src/lib/course-content.ts`), so nothing here needs to be edited to add new material.

## Database

The app talks to PostgreSQL through `src/lib/db.ts` (the `pg` driver) and keeps
the schema in `src/lib/schema.ts`, which is the single source of truth for both
the runtime and the exported SQL.

| Situation | What happens |
| --- | --- |
| `DATABASE_URL` set | Every query goes to that Postgres server (`pg`, connection pool, 15s statement timeout, SSL for non-local hosts) |
| `DATABASE_URL` unset | Embedded PostgreSQL (PGlite) at `.data/pg` — real Postgres, real files, no server to install |
| Production build, no `DATABASE_URL` | Refuses to start unless `ALLOW_EMBEDDED_DB=1` |

The first request creates anything missing (`create table if not exists …`), so a
fresh database needs no manual step. You can still paste the SQL into a hosted
provider yourself:

```bash
npm run db:schema > db/schema.sql   # already committed
```

An embedded database is a single process, so it cannot recover from being killed
mid-write: PGlite can leave a data directory that PostgreSQL refuses to start
from. The app handles that itself — the unreadable directory is moved aside to
`.data/pg.broken-<timestamp>` (nothing is deleted) and a new, empty one is
created, with a clear line in the logs. Accounts in it are lost, which is
exactly why a hosted `DATABASE_URL` is the production path: it recovers from an
interrupted write on its own. A normal stop (SIGTERM/SIGINT, including
`Ctrl-C` and the platform stopping the server) is checkpointed cleanly and
always reopens with every account intact.

### Supabase (or any hosted Postgres)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the **pooled** connection string (Project settings → Database →
   Connection pooling → URI, port `6543`). Serverless hosts open a new
   connection per request, and the pooler is what keeps that affordable.
3. Put it in `.env.local` (and in your host's environment variables):
   `DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@...pooler.supabase.com:6543/postgres`
4. Either run `npm run db:schema` and paste the output into the Supabase SQL
   editor, or just start the app — it creates the tables on the first request.
5. Set `SESSION_SECRET` (32+ random characters) and `OWNER_EMAIL` /
   `OWNER_PASSWORD`, then sign in once to create the owner.

Verify from the terminal with `npm run db:check` — it prints the driver, the
server version, the owner account and the account counts.

Everything is one `users` table. A learner's whole record (subscription, usage,
progress, invoices, activity, profile) lives in JSONB columns beside their
account row, so a page of the dashboard is one row read instead of a join
across six tables. If the app outgrows that, split the JSONB columns into
`course_progress`, `lesson_progress`, `invoices` and `activity_events` tables —
the shapes are documented in `src/lib/store.ts`.

## Authentication

Sign-in is implemented in this repository rather than delegated to a provider:

- Passwords are hashed with **scrypt** (`scrypt$N$r$p$salt$hash`), per-user
  salt, compared in constant time. Hashes from the earlier format still verify
  and are upgraded to scrypt on the next successful sign-in.
- Sessions are a signed cookie (`codara_session` = `userId.expiry.hmac`),
  HttpOnly, 30 days, `SameSite=None; Secure` when served over HTTPS so the Arena
  preview iframe can use it. Rotating `SESSION_SECRET` invalidates all sessions.
- Sign-in failures are throttled (8 per 10 minutes per IP + email) and the
  message says which of the two things went wrong: an email with no account is
  offered account creation in one tap, a wrong password is named as such.
  (Sign-up already reports when an email is taken, so this reveals nothing new.)
- The session cookie is `SameSite=None; Secure` whenever the app is served over
  HTTPS or from an embedded frame, because a `Lax` cookie is not sent from the
  preview iframe and signing in would appear to work and then bounce back to the
  sign-in page. Several signals are checked (`x-forwarded-proto`, `Sec-Fetch-*`,
  proxy headers) because a proxy does not always forward the scheme. Plain
  `http://localhost` development keeps `Lax`, and the server logs which signal
  decided it, once per process. Browsers that block third-party cookies outright
  cannot hold any cookie inside a frame: the sign-in page detects the frame and
  offers to open the app in its own tab, where the cookie is first-party.
- Changing a password requires the current one and re-applies the strength
  rules. Suspended accounts are rejected before any password is checked.

Swapping in Auth.js, Clerk or Supabase Auth later is still localized: keep
`getCurrentUser()` / `getCurrentAdmin()` in `src/lib/session.ts` as the boundary,
because the rest of the app only calls those helpers.

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

- Accounts live in PostgreSQL. Every signup, profile edit, password change,
  completed lesson, plan change and invoice is committed before the response is
  sent, so restarting the server (or redeploying) changes nothing a learner sees.
- Passwords are never stored in plain text: `src/lib/passwords.ts` hashes them
  with scrypt and a per-account salt, and sign-in compares in constant time.
- Sessions are signed, not random lookups: the cookie cannot be edited to become
  another account without `SESSION_SECRET`.
- The dashboard's weekly view is a rolling seven-day window that ends today, and
  the streak counts consecutive days back from today (an empty today does not
  break it — the day is not over). Both roll forward on the first request of a
  new day, so the numbers describe the current week rather than the week the
  account was created.
- Completing a lesson adds its duration to the learner's totals once. Unmarking
  it and completing it again does not count the same lesson twice, so learning
  time and the weekly goal cannot drift upwards. Resetting a learner's progress
  from the admin console clears those credits so the lessons count again.
- Course content is checked on the server in both lesson pages and the progress API.
- Preview lessons are accessible even when the full course is locked.
- A paused learner can view existing data but cannot save progress or alter a subscription.
- Upgrades begin a new billing period immediately and issue an invoice.
- Downgrades preserve paid access until the current period ends.
- Cancelling preserves access until the paid period ends, then returns the account to Explorer.
- Administrator plan overrides do not issue invoices.
- Only the owner account can publish or delete lessons; every other account
  receives `403` from the upload APIs even if they call them directly.
- Lesson materials are streamed through an access-checked route
  (`/api/lesson-files/...`), so a locked lesson's video or PDF cannot be opened
  by copying the URL.
- Video edits are metadata: `trimStart`, `trimEnd`, `muted` and the poster image
  are stored next to the file and applied by the player
  (`src/components/TrimmedVideo.tsx`), so a trimmed lesson plays only the kept
  range. The thumbnail is served through an access-checked route, and pictures
  are re-exported so an edited image replaces the original file on disk.
- The owner's photo and logo are also served through an access-checked route
  (`/api/branding/photo`, `/api/branding/logo`): signed-in learners can load
  them, anonymous visitors get `401`, and only the owner can replace or remove
  them. Photos and logos must be image files (PNG, JPG, WEBP, GIF or AVIF).

## Deployment

The repository includes `vercel.json` and is ready for Vercel preview deployment:

```bash
npm run build
```

Production checklist:

1. Create the hosted Postgres database and set `DATABASE_URL` to its pooled
   connection string (see [Database](#database)).
2. Set `SESSION_SECRET` to 32+ random characters. Without it a fresh filesystem
   generates a new secret and every existing session is signed out.
3. Set `OWNER_EMAIL` and `OWNER_PASSWORD` for the first deploy, then sign in and
   change the password from `/dashboard/account`.
4. Keep `.env.local` out of the repository — it is git-ignored, and secrets
   belong in the platform's environment variables.
5. Lesson files, images and branding still live on the server filesystem
   (`.data/uploads`). On a host with an ephemeral disk, attach a volume or move
   them to Supabase Storage before publishing real lessons. Accounts, progress
   and invoices are already in Postgres and need no extra work.

Payments are the one part still simulated: plans activate without charging a
card, as described in [Connect real payments safely](#connect-real-payments-safely).
