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

Before a public production launch, replace the demo store, authentication and payment simulation described above, then configure secrets in the deployment platform rather than committing `.env` files.
