# codemasterghana — learning platform

A polished full-stack learning-platform MVP for web development, app development and computer science. It includes learner accounts, structured courses and lessons, saved progress, **programs** a student buys once and keeps forever, invoices and a **teacher console**.

There are two roles and only two: **students** and the **owner** — the teacher. Every course and every lesson sits under a program, and a student opens them by paying for that program — there are no free previews and nothing else to buy. The teacher sets every program price from the console.

Built with **Next.js 16, React 19, TypeScript and Tailwind CSS 4**.

## What is implemented

### Student experience

- Responsive marketing website with curriculum, testimonials and pricing
- Real accounts: scrypt-hashed passwords, signed session cookies, and signup /
  sign-in / sign-out / password-change flows backed by PostgreSQL
- Searchable/filterable course library
- **Thirteen courses across six programs** — Computer Science, Software
  Engineering, Vibe Coding, Web Development, App Development and Backend
- **CodeMaster Studio** (`/studio`, free for everyone) and **the Code lab**
  (`/dashboard/code`, per student): the real VS Code editor (Monaco) with an
  explorer, search, live preview, console, terminal, problems list and status
  bar — HTML, CSS, JavaScript and Python that actually run, saved to the
  browser and downloadable
- Full course pages with modules, lessons, access rules and instructor details
- Focused lesson reader with examples, challenges and next/previous navigation
- Server-saved lesson completion, course percentages and activity history
- **Student email** — receipts for every purchase, a congratulations message on
  finishing a course, and a notice when a certificate is issued
- Dashboard with weekly goal, streak, time learned and recommendations
- Progress analytics, certificates, learning timeline and CSV export
- Editable learner profile, experience level, track and weekly goal

### Programs, and buying them

- **One payment per program, kept forever.** Buying a program opens every
  course and every lesson under it, permanently — no subscriptions, no time
  limits, nothing else to buy.
- **The teacher sets the prices** from the console — the price of each
  program. They are stored in the database, not in code, and a program priced
  at GH₵0 is free to join with no checkout.
- **No free previews.** Every lesson opens only to students who own its
  program (or the teacher). Older course/lesson purchases stay on accounts as
  history but open nothing.
- Invoice history per account, and a clearly labelled **demo payment method**
- Programs, purchases, invoices and usage stored per account in the database,
  so a learner's access and billing history survive a restart

> Students pay with Mobile Money (MTN MoMo, Telecel Cash, AT Money), cards or bank transfer through Paystack. Until the teacher adds a Paystack secret key, checkout runs in demo mode: the MoMo approval is simulated and no real money moves.

### Certificates, company pages and the public catalogue

- Completing a course issues a certificate with a
  stable code and a QR code, printable as A4 landscape.
- `/verify` (and `/verify/<code>`, what the QR opens) lets anyone — an employer
  with no account — check a certificate. Withdrawn certificates say so.
- `/courses` lists the whole catalog and each course has a public page with its
  full description.
- `/about`, `/pricing`, `/contact`, `/privacy` and `/terms` share one header and
  footer with the rest of the public site.
- The contact form stores messages for the teacher's inbox at `/owner/messages`.
- The header collapses into a working mobile menu on phones.

### Teacher console

- Site-wide student, engagement, course and revenue metrics, plus how many
  students own each program
- Every student's programs, purchases, progress and lifetime minutes
- **Prices** — the price of each program, editable at any time
- **The Studio** (`/owner/studio`) — picture and video editing with no lesson
  attached: crop, resize, rotate, flip and colour-adjust a picture, trim and
  mute a video, capture a thumbnail and export the edited clip
- Search and account filters
- Pause/restore student accounts
- Grant a program without charging (“comp” access)
- Reset student progress
- Delete student accounts
- Every action is written to the database and protected on the server; there is
  no administrator tier to promote anyone into

### Owner-only lesson uploads

The site **owner** is the teacher: the single account allowed to publish
lessons, set prices and upload teaching materials. Lesson publishing and
pricing are owner-only and enforced on the server:

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
- A published lesson opens to every student who owns the program its course
  belongs to — there is no per-lesson price and no preview. It simply joins
  the program its course sits under.
- Uploaded lessons appear immediately in the course curriculum, the lesson
  reader, dashboard progress, certificates, analytics, the CSV export and the
  teacher console's engagement charts.
- The owner can delete a published lesson, which also removes its files.
- Students get `403 OWNER_ONLY` from every upload or pricing endpoint
  (`GET`/`POST /api/owner/lessons`, `PATCH /api/owner/pricing`,
  `DELETE /api/owner/lessons/[id]`) and never see the teacher console in the nav.
- The owner account cannot be paused, deleted or demoted, and there is no
  administrator role to grant.

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
`/api/lesson-files/...` checks the viewer's program ownership, and lesson access
marks the lesson as started **before** it hands out a URL, so a locked lesson's
video or PDF cannot be opened by copying the URL.

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
in at `/owner-sign-in` and change that password from the account page.

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
- **The owner** is the teacher — the single account that can publish lessons,
  set prices and manage students. Set `OWNER_EMAIL` and `OWNER_PASSWORD` and it
  is created on the first request; if you would rather not keep credentials in
  the environment, open `/owner-sign-in` on an empty database and it offers a
  one-time "Set up the owner account" form instead (that route closes itself as
  soon as an owner exists, and refuses entirely when `OWNER_EMAIL` /
  `OWNER_PASSWORD` are set). Sign in at `/owner-sign-in`, then change the
  password from `/dashboard/account`.
- **Students** are everyone else. A student buys the programs they want to
  study; if a student is suspended they cannot sign in, and a suspended
  account sees a paused notice instead of any lesson.

There are no demo accounts and nothing is seeded: an empty database stays empty
until the owner signs in and someone signs up.

## Where each part of the code lives

This is the “what to paste where” map for continuing the build.

| Step | File or folder | Purpose |
| --- | --- | --- |
| 1. Brand | `src/config/site.ts` | Name, tagline, support email and currency |
| 2. Programs and prices | `src/lib/programs.ts` (the six programs) and `src/lib/plans.ts` (owner-set prices, stored in `app_state`) | Program catalog, default and per-program prices (`pass-periods.ts` keeps the retired pass shapes for stored data) |
| 3. Course content | `src/lib/courses.ts` | Courses, modules, lessons, examples and challenges |
| 4. User data | `src/lib/store.ts` | Accounts, progress, usage and invoices, read and written through Postgres |
| 5. Sessions | `src/lib/session.ts` | Signed session cookies and role checks |
| 6. Account API | `src/app/api/auth/*`, `src/app/api/account/route.ts` | Sign up, sign in, sign out, profile and password changes |
| 6a. Database | `src/lib/db.ts`, `src/lib/schema.ts`, `src/lib/bootstrap.ts`, `scripts/*.mts` | Postgres/PGlite driver, schema, first-run setup and CLI reports |
| 6b. Passwords | `src/lib/passwords.ts` | scrypt hashing, verification and strength rules |
| 7. Progress API | `src/app/api/progress/route.ts` | Start courses and complete/uncomplete lessons |
| 8. Buying | `src/lib/purchases.ts` | Buy a program, and the teacher's comp grants (retired pass/course/lesson sellers stay for in-flight fulfilments) |
| 8a. MoMo numbers | `src/lib/momo.ts` | Ghana phone validation and MTN / Telecel / AT detection (client-safe) |
| 8b. Paystack | `src/lib/paystack.ts` | Transaction initialize + verify, webhook signature check (server-only) |
| 8c. Checkouts | `src/lib/payments.ts`, `payments` table | Pending → paid fulfilment, idempotent webhook + return-URL handling |
| 9. Buying API | `src/app/api/purchase/route.ts` (`/api/pass` is retired) | Join a GH₵0 program directly; priced programs go through checkout |
| 9a. Checkout API | `src/app/api/checkout/*`, `src/app/api/webhooks/paystack/route.ts`, `src/app/checkout/verify/page.tsx` | Start a MoMo checkout, poll it, confirm demo payments, verify the provider's return, receive the webhook |
| 10. Access rule | `src/lib/access.ts` | The one place the gate is decided: owner → owns the program (no previews, no passes) |
| 10b. Teacher rules | `src/lib/owner-console.ts`, `src/app/api/owner/*` | Metrics, prices and protected student-management actions |
| 10a. Owner identity | `src/lib/owner.ts`, `getCurrentOwner()` in `src/lib/session.ts` | Who is allowed to publish lessons |
| 10b. Lesson uploads | `src/lib/lesson-uploads.ts`, `src/lib/blob-store.ts`, `src/lib/app-state.ts`, `src/lib/course-content.ts` | Storage/disk blobs for owner lessons, their metadata in `app_state`, and the merge with the catalog |
| 10c. Upload API | `src/app/api/owner/lessons/*`, `src/app/api/lesson-files/*` | Owner-only publishing and access-checked file streaming |
| 10d. Owner console | `src/app/owner/page.tsx`, `src/app/owner/lessons/page.tsx`, `src/components/OwnerPricingCard.tsx`, `src/components/OwnerLessonManager.tsx` | Metrics, the price editor, the upload form and the published-lesson list |
| 10e. Owner branding | `src/lib/branding.ts`, `src/app/api/owner/branding/route.ts`, `src/app/api/branding/[asset]/route.ts`, `src/components/OwnerBrandingCard.tsx` | Profile photo and logo shown on published lessons |
| 10f. Picture / video editors | `src/components/media/ImageEditor.tsx`, `src/components/media/VideoEditor.tsx`, `src/lib/media.ts` | Console editors for cropping pictures and trimming videos |
| 10g. Edited playback | `src/components/TrimmedVideo.tsx`, `src/app/api/owner/lesson-files/[lessonId]/[fileId]/route.ts`, `src/app/api/lesson-files/[lessonId]/[fileId]/poster/route.ts` | Saving edits on published files, and playing the trimmed clip with its thumbnail |
| 11. Marketing UI | `src/app/page.tsx` | Public landing page |
| 11a. Public catalogue | `src/app/courses/page.tsx`, `src/app/courses/[slug]/page.tsx`, `src/lib/course-info.ts`, `src/components/CourseBrief.tsx` | The whole catalog and one page per course, readable without an account — including the long description, audience, prerequisites, tools and where the course leads |
| 11b. Company pages | `src/app/about/page.tsx`, `src/app/pricing/page.tsx`, `src/app/contact/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/components/InfoPage.tsx` | About, the payment page and the legal pages, all on one shared shell |
| 11c. Public shell | `src/components/PublicHeader.tsx`, `src/components/PublicFooter.tsx` | One navigation for every public page, including the mobile menu |
| 11d. Contact inbox | `src/lib/messages.ts`, `src/lib/message-topics.ts`, `src/app/api/contact/route.ts`, `src/components/ContactForm.tsx`, `src/app/owner/messages/page.tsx`, `src/components/OwnerMessages.tsx` | The contact form, where messages are stored, and the teacher's inbox |
| 11e. Certificates | `src/lib/certificates.ts`, `src/app/dashboard/certificates/*`, `src/app/verify/*`, `src/app/api/owner/certificates/route.ts`, `src/components/CertificateActions.tsx`, `src/components/OwnerCertificates.tsx` | Issuing, printing, the public verification page, and the teacher's register with withdrawal |
| 12. Student UI | `src/app/dashboard/*`, `src/components/ProgramOptions.tsx`, `src/components/BuyProgram.tsx`, `src/components/CheckoutModal.tsx`, `src/components/VerifyPayment.tsx` | Overview, library, progress, programs, billing, account, the MoMo checkout and the payment verification page |
| 12b. Code studio | `src/app/studio/page.tsx`, `src/app/dashboard/code/page.tsx`, `src/components/CodeLab.tsx`, `src/lib/lab.ts`, `src/lib/python.ts` | The in-browser VS Code: editor, preview, console, terminal, problems, Python runner |
| 12c. Media studio | `src/app/owner/studio/page.tsx`, `src/components/OwnerMediaStudio.tsx` | Standalone picture and video editing for the teacher |
| 13. Lesson UI | `src/app/learn/[courseId]/[lessonId]/page.tsx` | Immersive lesson experience |
| 14. Teacher UI | `src/app/owner/*`, `src/components/OwnerStudentsTable.tsx` | Monitoring dashboard, prices and student controls |
| 15. Design system | `src/app/globals.css`, `src/components/Icon.tsx` | Colors, motion, shared icon set and global styles |

## Branding

The owner's artwork lives in `public/branding/`, and everything else refers to it
through `src/config/branding.ts`:

| File | Size | Used for |
| --- | --- | --- |
| `logo.webp` | 1024² | The Vibe Coding program card and the sign-in panel (WebP, ~140 KB) |
| `logo-1024.jpg` | 1024² | The same picture for anything that cannot read WebP |
| `logo-original.jpg` | 2000² | The untouched upload, kept as the master copy |
| `og.jpg` | 1200×630 | Link previews (`openGraph` / `twitter:card` in `src/app/layout.tsx`) |
| `vibe-coding.jpg` | 1200×750 | The Vibe Coding course hero image |

The favicon, the iOS touch icon and the PNG app icons are Next.js file
conventions generated from the same picture: `src/app/favicon.ico` (32²),
`src/app/icon.png` (512²) and `src/app/apple-icon.png` (180²).

**The header lockup is type, not image.** The supplied picture is a poster — a
laptop, a code wall and the tools on its screen — so at 36px in the navigation
it would read as noise. The navbar keeps the `</>` tile plus the wordmark
("codemaster" in ink, "ghana" in the brand accent, with "Learn. Build. Become."
underneath where there is room), and the artwork appears at full size on the
program card, the Vibe Coding course hero, the link preview and the sign-in
panel. `Logo.tsx` is the single place the lockup is rendered.

To swap the artwork, replace the files above and re-run the crops, or drop a new
square image into `public/branding/` and update the paths in
`src/config/branding.ts` — no component changes are needed.

## Programs and the catalog

The catalog is one list, `COURSES` in `src/lib/courses.ts`, assembled from two
places:

| Part | Where | What it is |
| --- | --- | --- |
| Core courses | `src/lib/courses.ts` | Web foundations, JavaScript, React, React Native, Node.js and Computer Science Essentials |
| Program courses | `src/lib/programs.ts` | The courses that complete each program, written with the same `lesson()` / `module()` helpers |
| Program metadata | `PROGRAMS` in `src/lib/programs.ts` | Name, tagline, description, icon and tone for each program |

Each course's `category` is its program: **Computer Science**, **Software
Engineering**, **Vibe Coding**, plus **Web Development**, **App Development** and
**Backend** for the core paths. The catalog page, the landing page's program
cards, the search filters, the owner console's price lists and the lesson
counters all read from that one array.

## Certificates and verification

Completing every lesson in a course earns a certificate, and a certificate is
only useful if a stranger can check it — so the important half is public.

- **Issuing.** `/dashboard/certificates/<courseId>` calls `issueCertificate()`,
  which first checks that every lesson is complete (`hasFinishedCourse`) and
  that the student owns the program. It is **idempotent**: the code is generated
  once and returned on every later visit, because an employer who checked last
  week must find the same record today.
- **The code.** `CMG-<course initials>-<year>-<6 chars>`, drawn from an alphabet
  that leaves out `O`, `I`, `1` and `0`, so a code read off a printout cannot be
  mistyped into a different valid code. Lookups normalise case and punctuation,
  so `cmg-wdf-2026-yvvlrw` finds the same certificate.
- **The public record.** Issued certificates are written to the `app_state` key
  `certificates`, keyed by code, holding only what a verifier needs: holder
  name, course, program, lesson count, hours, issue date and the withdrawal
  flag. Verifying never loads a user row, so it exposes no email, no account id
  and no payment.
- **The verification page.** `/verify` takes a code; `/verify/<code>` is what
  the QR code opens. It reports valid, withdrawn (with the reason) or not found,
  and shows nothing else. Hydration is checked first (`ensureContentReady()`):
  on a cold instance an empty cache must never be reported as "no such
  certificate", which would make a genuine one look forged.
- **The QR code.** Generated on the server with the `qrcode` package
  (`verificationQrSvg`) and inlined into the printed page — no external image
  service, and a failure returns an empty string so the page can never break.
- **Printing.** `@media print` in `src/app/globals.css` sets A4 landscape, hides
  navigation, footers and buttons, and tells the browser to keep the
  certificate's colours (`print-color-adjust: exact`). "Print / save PDF" runs
  `window.print()`.
- **Withdrawal.** `/owner/certificates` lists every certificate ever issued;
  withdrawing one keeps the verification page answering but reports it as
  withdrawn, with the reason shown to whoever checks it. Nothing is deleted, and
  it can be restored.

## Student email

`src/lib/email.ts` writes to a student at the three moments that matter:

- **Purchases** — buying a program (checkout, fulfilled through
  `/api/purchase` for free programs) sends a branded receipt with the amount
  and the invoice number.
- **Course completion** — the moment the last lesson of a course is marked
  complete (`/api/progress`), the student gets a congratulations email linking
  to their certificate. A `completionEmailedAt` stamp on the progress record
  guarantees it is sent exactly once, even if the lesson is unmarked and
  re-marked.
- **Certificates** — `issueCertificate()` emails the student when a certificate
  is issued for the first time, with the code, the lesson and hour counts, and
  the public verification URL.

Transports are chosen from the environment: `RESEND_API_KEY` (Resend HTTP API),
else `SMTP_HOST` (+ port/user/password via nodemailer), else a console dry run —
so local development works with no provider configured. Every send is awaited
inside its own try/catch: an email can never fail a purchase, a progress save or
a certificate issue. See `.env.example` for the variables.

## The teacher's inbox

The contact form posts to `/api/contact`, which validates the input, drops
honeypot submissions silently, throttles by address (6 messages per 10 minutes)
and stores the result through `lib/messages.ts` in `app_state`. `/owner/messages`
shows the inbox with open/answered filters, reply-by-email, mark-as-answered and
delete. No third-party form service is involved, and the emailed reply goes to
the address the visitor typed.

## The public pages

Every page outside the signed-in app shares one shell — `PublicHeader`,
`PublicFooter` and `InfoPage` — so the navigation, the mobile menu and the legal
links cannot drift apart:

| Page | What it answers |
| --- | --- |
| `/courses` and `/courses/<slug>` | The whole catalog grouped by program, and one page per course with the long description, audience, prerequisites, tools, build list and where it leads (`src/lib/course-info.ts`) |
| `/pricing` | Program prices, what a program includes, and how payment will work (Mobile Money, card, bank transfer) |
| `/about` | Who teaches, how the platform works, why certificates are verifiable |
| `/contact` | The form, the teacher's direct email, and answers to the questions that come up most |
| `/privacy` | What is collected, where it lives, what the teacher can see, and how to have data corrected or deleted |
| `/terms` | Accounts, programs and purchases, refunds, certificates, acceptable use, liability, Ghanaian law |
| `/verify` | The certificate check, open to anyone |

Public pages that read owner-set data (prices, published lessons, the
certificate index) call `ensureContentReady()` from `src/lib/bootstrap.ts`
before rendering. Without it, an anonymous visitor on a cold instance would be
shown default prices and the wrong lesson counts, because the state cache is
only hydrated by a signed-in request.

## Public header

`PublicHeader` carries the navigation for every public page: a dismissible
announcement bar (remembered per browser, and it scrolls away), then the sticky
bar itself — the logo with its tagline, a **Courses** mega-panel (programs,
popular courses and the pricing card), Pricing, About, Contact, a Verify
link, and Sign in / Start learning (or the signed-in avatar with the dashboard
/ teacher-console link). The bar gains a shadow once the page scrolls, the
current section gets an underline, and the panel closes on Escape, on
navigation, or a beat after the pointer leaves.

Below 1024px the links collapse into a button
(`aria-expanded`, `aria-controls="public-menu"`) that opens a panel with an
expandable Courses section, the navigation, the verification link, the support
email and the account actions; the panel is a real disclosure rather than a
hidden div, so it works with a keyboard and a screen reader, and it closes when
a link is chosen. The dashboard has its own compact horizontal nav (`SidebarNav`
with `compact`).

## CodeMaster Studio and the Code lab

`/studio` (public, free for everyone) and `/dashboard/code` (signed in, saved
per student) are the same component — `src/components/CodeLab.tsx` — the real
VS Code editor (Monaco) running entirely in the browser:

- An activity bar and sidebar: an **Explorer** with real file management
  (create, rename and delete files; slashes in a name make folders), **Search**
  across every file, four **Templates** (a starter web page, a JavaScript
  practice notebook, a Python practice notebook and a mini quiz app) and
  **Help**.
- Monaco (the engine inside VS Code) provides syntax highlighting,
  IntelliSense, error squiggles, the minimap and the command palette. The editor
  and its language workers are bundled locally, so no CDN is needed.
- A bottom panel with **Preview**, **Console**, **Terminal** (`help`, `ls`,
  `open`, `run`, `python`, `echo`, `whoami`, `date`, `clear`) and **Problems**
  tabs, plus a status bar with cursor position, language and save state.
- Python really runs: `src/lib/python.ts` executes code with Pyodide inside a
  web worker (`src/lib/python.worker.ts`), with a 20-second cap so an infinite
  loop ends the run instead of the tab. The first run downloads the runtime
  (about 10 MB) from a CDN.
- Work is saved to `localStorage` (per account in the lab, under `guest` in
  the public studio) and can be downloaded as one self-contained HTML file or
  as individual files.

Student web code runs inside a sandboxed iframe (`sandbox="allow-scripts
allow-modals"`, no `allow-same-origin`), and Python runs in a worker with no
page access — student code cannot read the session cookie or call the app's
APIs. Nothing is uploaded or executed on the server.

## The Studio (teacher)

`/owner/studio` is the owner-only media tool. It uses the same editors that are
built into lesson uploads — `ImageEditor` and `VideoEditor` in
`src/components/media/` — without a lesson attached:

- **Pictures:** crop presets or freeform, pan, zoom, rotate, flip, brightness /
  contrast / saturation, exported as PNG or JPEG at a chosen long edge.
- **Videos:** set the trim start and end, mute, capture any frame as a
  thumbnail, and export the edited clip. The export plays the trimmed section
  once and records it in the browser (`captureStream` + `MediaRecorder`), so no
  server, no upload and no re-encode of the original file.

## Add a new course

Paste a new course object into the `COURSES` array in `src/lib/courses.ts` (core paths) or into `PROGRAM_COURSES` in `src/lib/programs.ts` (a program course). Courses carry no tier: the teacher's pass opens the platform, and this course's price — the course default, or an override the teacher set in the console — is what a student pays to open its lessons. Mark a lesson `preview: true` (via the last argument of `lesson(...)`) to make it free to any signed-in student.

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
  icon: "nodes", // browser | braces | react | mobile | nodes | server | cpu | layers | terminal | briefcase | spark
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

Course cards, catalog filtering, progress calculation, teacher analytics and access checks all read from this one catalog automatically. Lessons the owner publishes from `/owner/lessons` are merged on top of this catalog at request time (see `src/lib/course-content.ts`), so nothing here needs to be edited to add new material.

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
existing rows survive it — and the two roles are normalized: the row flagged
`owner` becomes `owner`, and every other account (including one that held the
old `admin` role) becomes `student`, keeping its progress, purchases and
invoices. An existing paid plan is translated into the remaining time of a
month pass. Pasting
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
   password or a database name. The owner sign-in form links to it when the
   outage banner appears.

The same diagnosis is in the server log on every failure: look in Vercel → Logs
for the `[codemasterghana] database connection failed …` line, which is
followed by the same plain-language fix. The sign-in pages and APIs keep
rendering during the outage (the setup form hides itself, the forms show the
banner) so a database problem never looks like a broken deployment.

Everything is one `users` table. A student's whole record (pass, purchases, usage,
progress, invoices, activity, profile) lives in JSONB columns beside their
account row, so a page of the dashboard is one row read instead of a join
across six tables. If the app outgrows that, split the JSONB columns into
`course_progress`, `lesson_progress`, `invoices` and `activity_events` tables —
the shapes are documented in `src/lib/store.ts`.

## Signing in as the owner

Two doors, and only one of them is for the owner:

| Door | Who it is for |
| --- | --- |
| `/login` | Students. Signing in with the owner account still lands on `/owner`. |
| `/owner-sign-in` | The teacher (the single owner account). Linked from the site footer and from `/login`. |

The owner account is created on the first request against an empty database,
from whichever of these you use:

1. `OWNER_EMAIL` + `OWNER_PASSWORD` (+ optional `OWNER_NAME`) in the environment —
   the deployment path. `OWNER_NAME` is the display name in the console and the
   lesson byline; it is kept in step with the account, so leave it unset to
   manage the name from the account page instead.
2. The one-time **"Set up the owner account"** form on `/owner-sign-in`, shown
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
`getCurrentUser()` / `getCurrentOwner()` in `src/lib/session.ts` as the boundary,
because the rest of the app only calls those helpers.

## Mobile Money payments

Students pay in Ghana cedis through **Paystack Standard Checkout**: MTN MoMo,
Telecel Cash and AT Money (approved with the MoMo PIN on the student's own
phone), plus cards and bank transfers on the same secure page. The MoMo PIN and
card numbers never touch this app — Paystack collects them.

### Going live (test key first, live key on launch day)

1. Create a free account at [paystack.com](https://paystack.com) and activate
   Ghana cedis (GHS) on it.
2. Copy the **secret key** from Paystack → Settings → API keys. Start with the
   test key (`sk_test_…`). Copy the **publishable key** (`pk_test_…`) too —
   it is safe to expose and is used for checkout display and key-pair checks.
3. Set `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in the
   environment (`.env.local` locally, the host's environment variables when
   deployed) and redeploy — `NEXT_PUBLIC_` values are inlined at build time.
4. In Paystack → Settings → Webhooks, add
   `https://your-domain.com/api/webhooks/paystack`, so approvals confirm even
   if the student closes their browser mid-payment.
5. Run `npm run payments:check` — it proves the key works and prints the
   webhook URL to register.
6. Pay yourself GH₵1 end to end: buy the cheapest thing with a test MoMo
   number, approve it, and check the pass opens, the invoice appears and the
   receipt email arrives. Then swap in the live key (`sk_live_…`).

Without `PAYSTACK_SECRET_KEY` the checkout runs in **demo mode**: the MoMo
approval prompt is simulated and no real money moves, but passes, purchases,
invoices and emails all behave exactly as they do live. The teacher console
always shows which mode is on (demo / test / live), and the pricing page tells
students honestly whether MoMo is live yet.

### How the money flows

1. The student picks their network and enters the MoMo number at checkout
   (`src/components/CheckoutModal.tsx`).
2. `POST /api/checkout` prices the item from the teacher's console prices and
   writes a `pending` row to the `payments` table, keyed by a `CMG-…`
   reference — *before* any provider is called.
3. Live: Paystack returns an `authorization_url` and the browser goes there to
   pay. Demo: the UI simulates the approval prompt instead.
4. Paystack returns the browser to `/api/checkout/callback`, which verifies
   the transaction against Paystack's API (a redirect URL proves nothing on
   its own) and redirects to `/checkout/verify`, where the page polls
   `/api/checkout/status` until the payment is final.
5. Independently, Paystack posts `charge.success` to `/api/webhooks/paystack`,
   whose HMAC-SHA512 signature is verified before anything is read from it.
6. Both paths call `fulfillPayment()` in `src/lib/payments.ts`, which grants
   the pass / course / lesson, raises the invoice (carrying the `CMG-…`
   reference) and emails the receipt.

Fulfilment is **idempotent**: the `payments` row flips `pending` → `paid`
once, and every later report of the same reference (or the same provider
event id) is a no-op — one payment can never grant twice, invoice twice or
email twice. While live payments are on, the old direct endpoints
(`POST /api/pass`, `POST /api/purchase`) refuse priced items with
`402 CHECKOUT_REQUIRED`, and the demo confirm endpoint refuses everything, so
there is no way to mint an entitlement without verified money.

### Reconciling a "I paid but it is locked" message

Open the teacher console's payment register (or `GET /api/owner/payments`):
find the student's `CMG-…` reference and its status. `paid` means the
entitlement is on the account (check the pass is active too — content needs
both). `pending` means the student never completed the approval: ask them to
open the payment link again from their billing page. `failed` means Paystack
declined it (expired approval, insufficient funds) — no money moved. A student
who somehow pays twice for the same item is refunded automatically (the
register shows both paid rows); if the automatic refund ever fails, refund the
duplicate from the Paystack dashboard — the server log names the reference.

### Reconciling "The checkout could not be started."

The response no longer hides the reason — it names the layer that refused, and
the server log (`[codemasterghana] checkout failed …`) carries the exact
Postgres error. Two causes are worth knowing:

- **A `payments` table that came from somewhere else.** A database shared with
  another project can already have a `payments` table whose `user_id` is
  `uuid`, whose `status` / `provider` rules were written for a different app,
  or which demands a column this app never fills. Any of those refuses every
  checkout while sign-in and the rest of the site look perfectly healthy. The
  app aligns that table by itself on the first request after deploying — see
  the heal block at the end of `MIGRATION_STATEMENTS` in
  `src/lib/schema.ts`. Nothing has to be pasted or renamed, no rows are
  touched, and a column it cannot convert is logged rather than fatal.
- **Paystack refusing the charge.** The message then quotes Paystack ("Invalid
  key", "Currency not supported by merchant", …). Run `npm run payments:check`
  and make sure Ghana cedis (GHS) are activated on the Paystack account.

## Data and access behavior

- Accounts live in PostgreSQL. Every signup, profile edit, password change,
  completed lesson, pass or content purchase and invoice is committed before the response is
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
  time and the weekly goal cannot drift upwards. Resetting a student's progress
  from the teacher console clears those credits so the lessons count again.
- Course content is checked on the server in both lesson pages and the progress API.
- The access rule lives in one module (`src/lib/access.ts`) and is applied by the
  lesson page, the course page, the progress API and every file route: owner →
  free preview → **active pass and a purchase**.
- Preview lessons are accessible even when the pass has lapsed or the course is
  not bought; a suspended account is refused everywhere, previews included.
- A pass bought while one is active extends the current expiry instead of
  resetting it, and issues an invoice for the period bought.
- Comp grants (a pass, a course or a lesson) do not issue invoices and do not
  count as revenue.
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

6. Set `PAYSTACK_SECRET_KEY` (test key first, live key on launch day),
   register `https://your-domain.com/api/webhooks/paystack` in the Paystack
   dashboard, and run `npm run payments:check`. Without the key the checkout
   runs in demo mode — see [Mobile Money payments](#mobile-money-payments).
