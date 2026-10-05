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

Lesson records, file metadata and the owner's branding profile live with the
accounts, in the database (`app_state` rows), so backing up the database backs
up both. The bytes themselves go to one of two places:

| Configuration | Where files go |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` + `SUPABASE_BUCKET` all set | **Supabase Storage**, in that bucket |
| Any of the three missing | **Local disk**, under `.data/uploads` (git-ignored) |

Supabase Storage is the production choice: the bytes live outside the app, so
uploads survive a redeploy on a host with an ephemeral filesystem, and the
browser streams large videos from Supabase's CDN instead of through the server.
Create the bucket once (Storage → New bucket) before the first upload; without
it, uploads fail with a message telling you so, and `npm run storage:check`
tells you the same thing without uploading anything.

Then decide how the browser gets each file. Either way the app is the gate:
`/api/lesson-files/...` checks the viewer's account, plan and lesson access and
marks the lesson as started **before** it hands out a URL, so a Pro-only video
stays Pro-only.

| Bucket | `SUPABASE_BUCKET_PUBLIC` | What the browser receives |
| --- | --- | --- |
| Private | unset | A one-hour signed URL, created per view. Expires, so a copied link stops working. |
| Public (Storage → bucket → Make public) | `1` | The bucket's permanent `/object/public/...` URL, cached by Supabase's CDN. |

Public is what you want when a video is watched more than once: the CDN answers
the second viewer instead of the origin, and no request is spent minting a URL.
The trade-off is real — a public URL does not expire, so it keeps working for
anyone it is forwarded to. Signed URLs are the safer default for paid material;
`npm run storage:check` reports which mode you are in and refuses to pass if
`SUPABASE_BUCKET_PUBLIC` is set but the bucket is still private.

Set `SUPABASE_BUCKET_PUBLIC=1` only *after* clicking Make public in the
dashboard, or run `npm run storage:check` and let it tell you.

Verify the round trip from the terminal before uploading a large video:

```bash
npm run storage:check   # writes a probe object, reads it back, deletes it
npm run db:check        # also reports which backend is in use
```

Set `LESSON_DATA_DIR` to put the disk fallback somewhere else, and `OWNER_EMAIL`
to move ownership to a different account.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in OWNER_EMAIL / OWNER_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a database connection string the app runs on an embedded PostgreSQL
(PGlite) in `.data/pg`, so accounts, progress and invoices persist across
restarts with no database server to install. The first request against an empty database creates
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
| 10b. Lesson uploads | `src/lib/lesson-uploads.ts`, `src/lib/blob-store.ts`, `src/lib/app-state.ts`, `src/lib/course-content.ts` | Storage/disk blobs for owner lessons, their metadata in `app_state`, and the merge with the catalog |
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
| A connection string is set | Every query goes to that Postgres server (`pg`, connection pool, 15s statement timeout, 10s connect timeout, SSL for non-local hosts) |
| No connection string set | Embedded PostgreSQL (PGlite) at `.data/pg` — real Postgres, real files, no server to install |
| Production build, no connection string | Refuses to start unless `ALLOW_EMBEDDED_DB=1` |

The connection string is read from the first of `DATABASE_URL`, `POSTGRES_URL`,
`POSTGRES_PRISMA_URL`, `SUPABASE_DB_URL` or `POSTGRES_URL_NON_POOLING` that is
set — in that order, so a pooled string is preferred over a direct one. The
extra names exist because a host's own database integration usually injects
them: connecting Supabase or Neon from the Vercel dashboard sets
`POSTGRES_URL`, not `DATABASE_URL`, and the app now picks that up with nothing
to copy. Whichever variable is used is named in the logs at startup and by
`npm run db:check` / `/api/health`.

The first request creates anything missing (`create table if not exists …`), so a
fresh database needs no manual step. You can still paste the SQL into a hosted
provider yourself:

```bash
npm run db:schema > db/schema.sql   # already committed
```

A database made by an older build heals itself on the next request: after the
creates, the app runs additive migrations (`ADD COLUMN IF NOT EXISTS`,
backfills, role normalization) that reshape a stale `users` table into the
current one. The migration only adds — it never drops, renames or retypes, so
existing rows survive it — and unknown role words become `member` (rows
flagged `owner` become `admin`; re-promote anyone else from `/admin`). Pasting
`db/schema.sql` by hand heals the same way, because the migrations are printed
in it. If a statement cannot apply (duplicate emails, a wrongly typed column),
the server log names it — `[codemasterghana] schema statement failed …` — and
that line is what to paste back for the hand-written fix.

An embedded database is a single process, so it cannot recover from being killed
mid-write: PGlite can leave a data directory that PostgreSQL refuses to start
from. The app handles that itself — the unreadable directory is moved aside to
`.data/pg.broken-<timestamp>` (nothing is deleted) and a new, empty one is
created, with a clear line in the logs. Accounts in it are lost, which is
exactly why a hosted `DATABASE_URL` is the production path: it recovers from an
interrupted write on its own. A normal stop (SIGTERM/SIGINT, including
`Ctrl-C` and the platform stopping the server) is checkpointed cleanly and
always reopens with every account intact.

### Supabase API keys vs the database

Supabase gives you two different things, and they are not interchangeable:

| What you have | Where it goes | What it can do |
| --- | --- | --- |
| **Database connection string** (Project settings → Database → Connection string → URI) | `DATABASE_URL` | The database itself. This is what signs learners up and stores progress. |
| **Publishable key** (`sb_publishable_…`, Project settings → API keys) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe. For Supabase client features (Storage uploads, Realtime); row level security is what protects data. |
| **Secret key** (`sb_secret_…`) | `SUPABASE_SECRET_KEY` | Server-only, **bypasses row level security**. For admin features such as uploading to Storage and signing URLs; never exposed to the browser. |

The API keys do **not** connect the database — `DATABASE_URL` does, and it
carries its own password. Adding the keys without the connection string changes
nothing about where accounts are stored, which is why `npm run db:check` reports
the driver in use and `npm run supabase:check` reports whether the key pair
works against the project (and which storage buckets exist).

What the keys *are* used for today is **file storage**: with a bucket named in
`SUPABASE_BUCKET` (create it once in Storage → New bucket; `lesson-files` is the
conventional name) lesson uploads and branding images are written to that bucket
instead of the local disk. Three commands tell you where you stand:

```bash
npm run db:check        # driver, owner, accounts, and which file backend is in use
npm run supabase:check  # does the key pair work, and which buckets exist
npm run storage:check   # write → sign → download → delete against the bucket
```

Store both keys in `.env.local` locally and in the host's environment variables
when deployed. `.env.local` is git-ignored; `.env.example` only has placeholders.

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

### If sign-in says “check the database connection”

That banner means the app cannot reach a database at all — for learners and the
owner alike, because it is the connection, not the accounts. On Vercel the
cause is almost always the connection string itself:

1. **Use the pooler URI, never the direct host.** Supabase's direct host
   (`db.<project-ref>.supabase.co`) is IPv6-only, and Vercel has no IPv6
   route to it — every sign-in fails. Copy the **Transaction pooler** URI
   instead (Supabase dashboard → Project settings → Database → Connection
   pooling, port `6543`, user `postgres.<project-ref>`).
2. Set it as `DATABASE_URL` in Vercel → Project → Settings → Environment
   Variables, for **every** environment the deployment uses. (A connection
   string under any of the names listed under [Database](#database) is used
   too, so a database connected from the Vercel dashboard — which injects
   `POSTGRES_URL` — needs nothing copied.)
3. **Redeploy.** Vercel injects environment variables at deploy time, so
   saving alone changes nothing until the next deployment.
4. If it still fails, **open `/api/health` on the deployment**. It answers even
   while the database is down and reports the driver, the variable the
   connection string came from, the host, the server version — and a
   `database.hint` field that names the fix (the IPv6-only direct host, a
   rejected password, a pooler username missing its `.project-ref` suffix, a
   role without table rights, an SSL mismatch, an allowlist blocking the host,
   or no connection string configured at all). It never reports a user, a
   password or a database name. The admin sign-in form links to it when the
   outage banner appears.

The same diagnosis is in the server log on every failure: look in Vercel → Logs
for the `[codemasterghana] database connection failed …` line, which is
followed by the same plain-language fix. The sign-in pages and APIs keep
rendering during the outage (the setup form hides itself, the forms show the
banner) so a database problem never looks like a broken deployment.

Everything is one `users` table. A learner's whole record (subscription, usage,
progress, invoices, activity, profile) lives in JSONB columns beside their
account row, so a page of the dashboard is one row read instead of a join
across six tables. If the app outgrows that, split the JSONB columns into
`course_progress`, `lesson_progress`, `invoices` and `activity_events` tables —
the shapes are documented in `src/lib/store.ts`.

## Signing in as the owner

Two doors, and only one of them is for the owner:

| Door | Who it is for |
| --- | --- |
| `/login` | Learners. Signing in with an admin/owner account still lands on `/admin`. |
| `/admin-sign-in` | The owner and any administrator. Linked from the site footer and from `/login`. |

The owner account is created on the first request against an empty database,
from whichever of these you use:

1. `OWNER_EMAIL` + `OWNER_PASSWORD` (+ optional `OWNER_NAME`) in the environment —
   the deployment path. `OWNER_NAME` is the display name in the console and the
   lesson byline; it is kept in step with the account, so leave it unset to
   manage the name from the account page instead.
2. The one-time **"Set up the owner account"** form on `/admin-sign-in`, shown
   only while no owner exists and no environment credentials are set. It closes
   itself the moment an owner exists.

Once the row exists, the password stored in the database is what counts, so
changing it from `/dashboard/account` sticks and the environment variables are
no longer consulted. If the database is ever reset, the owner is created again
from the environment — or, with no environment credentials, from the setup form.

The owner account cannot be locked out from the console: suspending, demoting or
deleting it is refused with `403 OWNER_PROTECTED`, and the single-owner index in
the schema makes a second owner impossible.

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
   connection string (see [Database](#database)) — or connect it from the
   host's dashboard, which sets `POSTGRES_URL`. Open `/api/health` after the
   first deploy: it should report `"connected": true` and the variable in use.
2. Set `SESSION_SECRET` to 32+ random characters. Without it a fresh filesystem
   generates a new secret and every existing session is signed out.
3. Set `OWNER_EMAIL` and `OWNER_PASSWORD` for the first deploy, then sign in and
   change the password from `/dashboard/account`.
4. Keep `.env.local` out of the repository — it is git-ignored, and secrets
   belong in the platform's environment variables.
5. Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `SUPABASE_BUCKET`
   so lesson files and branding images live in Supabase Storage rather than on
   the server filesystem. Create the bucket once in the dashboard, then run
   `npm run storage:check` with the deployment's environment variables to
   confirm uploads, signed downloads and deletes all work. Without those three
   variables the app falls back to `.data/uploads`, which is lost on a host with
   an ephemeral disk (`npm run db:check` prints which backend is in use).
   Accounts, progress, invoices and the uploaded-lesson records are already in
   Postgres and need no extra work.

Payments are the one part still simulated: plans activate without charging a
card, as described in [Connect real payments safely](#connect-real-payments-safely).
