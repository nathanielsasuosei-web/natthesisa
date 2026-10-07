{
  id: "publish-portfolio",
  summary: [
    "Shipping is a skill with its own steps, and it is the one beginners postpone — which is a mistake, because a site on a laptop teaches you nothing that a site at a URL does not teach you faster. The moment your work has an address, real people find real problems in it, and you learn what quality means from evidence rather than from theory.",
    "This lesson is the launch itself: version-controlling the project with Git, choosing a host, deploying, and then working through a professional pre-launch checklist covering content, responsive layout, keyboard access, metadata and link previews, image weight, performance budgets, broken links, analytics, and a domain. It ends with the habit that matters most — shipping repeatedly, in small steps, rather than once, perfectly.",
  ],
  objectives: [
    "Put a project under Git version control, write a meaningful commit message, and push it to a remote repository.",
    "Compare the main free hosting options for a static site and choose one with a reason.",
    "Deploy a site to a live URL and set up automatic deployment on every push.",
    "Run a complete pre-launch audit across content, accessibility, metadata, images, links and performance.",
    "Write the metadata that controls search results and link previews, including Open Graph and a favicon set.",
    "Set a performance budget and measure against it with Lighthouse and the Network panel.",
    "Point a custom domain at a deployment and explain what DNS record you changed.",
    "Establish a maintenance habit: small commits, tagged releases, and a way to roll back.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "Why shipping early beats shipping perfectly",
      paragraphs: [
        "There is a well-known pattern in learning to build software: you work locally for weeks, the project is 'almost ready', and it never goes online. The cost of that is not the missing URL — it is the missing feedback. Locally, you are the only user, and you already know where everything is, how fast it is, and what the words mean. You cannot discover the things that only a stranger on a phone in bright sunlight will discover.",
        "Deploy on day one, even when the page has three paragraphs and no styling. Then deploy again every time you finish something. Each deployment is cheap — minutes, usually automatic — and each one turns a private guess into a public fact. This is also exactly how professional teams work: they do not build for six months and then reveal, they ship small changes continuously, because a small change that breaks is easy to diagnose and easy to reverse.",
        "The corollary is that **your first deployment should be embarrassing**. If it is not, you waited too long.",
      ],
    },
    {
      kind: "prose",
      heading: "Version control before hosting",
      paragraphs: [
        "Hosting services deploy *from a Git repository*, so version control is not a separate topic — it is the mechanism. It also gives you the two things that make shipping safe: a complete history of what changed and when, and the ability to go back.",
        "The workflow for a portfolio is four commands. `git init` turns a folder into a repository. `git add .` stages every change. `git commit -m \"…\"` records them with a message that says *why*, not *what* — 'add project cards to the home page' rather than 'update index.html'. `git push origin main` sends the commit to the remote, which triggers a rebuild on your host.",
        "Two habits separate a professional history from a noisy one. **Commit often and small**: one logical change per commit, so a bad one can be reverted without losing good work. **Write a `.gitignore`** so build output, dependencies and secrets never enter the repository — `node_modules/`, `.next/`, `dist/`, `.env.local`. Committing `node_modules` makes the repository enormous; committing `.env.local` leaks your keys to the internet, and it has ended careers.",
      ],
    },
    {
      kind: "code",
      caption: "From an empty folder to a pushed repository",
      language: "bash",
      code: `cd portfolio

git init
printf 'node_modules/\\n.next/\\ndist/\\n.env.local\\n.DS_Store\\n' > .gitignore

git add .
git status                      # read this before committing, every time
git commit -m "Add the portfolio skeleton: index, styles, two projects"

# Create an empty repository on GitHub first, then:
git remote add origin https://github.com/YOUR_NAME/portfolio.git
git branch -M main
git push -u origin main

# Thereafter:
git add . && git commit -m "Add responsive card grid" && git push

# Tag a release so you can always find the version you showed someone:
git tag -a v1.0 -m "First published version" && git push origin v1.0`,
    },
    {
      kind: "prose",
      heading: "Choosing a host",
      paragraphs: [
        "For a static site — HTML, CSS, images, and client-side JavaScript — hosting is free and there is no reason to pay. Every serious option deploys from Git, rebuilds on push, serves from a global CDN over HTTPS, and gives you a preview URL for every branch.",
      ],
    },
    {
      kind: "table",
      caption: "The usual choices for a static portfolio",
      head: ["Host", "Good at", "Worth knowing"],
      rows: [
        ["**GitHub Pages**", "The simplest possible static site, straight from a repository", "Free with any GitHub account; serves from `username.github.io/repo`. No build step beyond what you commit, and no server-side code."],
        ["**Netlify**", "Static sites and generators, with forms and redirects built in", "Drag-and-drop for a first deploy, Git integration after that. Handles `_redirects`, form endpoints and build plugins. Generous free tier."],
        ["**Vercel**", "Next.js and other framework builds", "The makers of Next.js; preview deployments per pull request are excellent. Free tier suits personal projects."],
        ["**Cloudflare Pages**", "Speed and a very large free tier", "Sits on Cloudflare's network, which is fast in West Africa; unlimited bandwidth on the free plan."],
        ["**Your own server**", "Learning, and dynamic apps with a database", "A ₵5–10/month VPS teaches you nginx, TLS and SSH — worth doing once, but not for a portfolio you need working today."],
      ],
    },
    {
      kind: "note",
      label: "Which one to pick",
      text: "If the site is plain HTML and CSS, use GitHub Pages or Cloudflare Pages. If it is a Next.js app, use Vercel. If you want form handling without a backend, use Netlify. The decision is reversible — moving a static site between hosts is an afternoon — so do not spend a week choosing. Pick one and deploy today.",
    },
    {
      kind: "prose",
      heading: "The pre-launch checklist",
      paragraphs: [
        "This is the part of the lesson that will still be useful in ten years. Work through it in order; each item has a specific, checkable outcome.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "1. Content",
      items: [
        "Every heading says something a stranger understands. 'My Journey' tells nobody anything; 'Front-end developer in Accra, building fast accessible sites' does.",
        "No placeholder text anywhere: no *Lorem ipsum*, no 'Project coming soon', no `TODO` in visible content. Search the source for `lorem`, `TODO`, `FIXME`, `example.com`.",
        "Contact details are correct and clickable: `mailto:` for email, `tel:` for a phone number, real URLs for social profiles.",
        "Spelling and grammar checked with the browser's spellcheck and read aloud once. Reading aloud catches what a spellchecker cannot.",
        "Every project has: what it is, what it does, what you built it with, and a link that works.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "2. Layout and responsiveness",
      items: [
        "No horizontal scrolling at any width from 320px to 2560px.",
        "Tested at 200% zoom and 400% zoom with nothing cut off.",
        "Tested on a real phone in portrait *and* landscape.",
        "Text never overlaps, truncates into meaninglessness, or falls to one word per line.",
        "Long real-world content (a 90-character headline, a long email) does not break the design.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "3. Accessibility",
      items: [
        "The whole site is usable with the keyboard alone, and the focus indicator is visible everywhere.",
        "Headings form an unbroken outline: one `h1` per page, no skipped levels.",
        "Every image has an `alt` — meaningful text, or `alt=\"\"` if decorative.",
        "Contrast passes 4.5:1 for body text and 3:1 for large text and UI borders.",
        "Touch targets are at least 24×24 CSS pixels with real spacing between them.",
        "`lang` is set on `<html>`, and any passage in another language is marked with its own `lang`.",
        "A Lighthouse accessibility audit returns no failures.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "4. Metadata and sharing",
      items: [
        "A unique, descriptive `<title>` on every page — under about 60 characters, most important words first.",
        "A `<meta name=\"description\">` on every page: one or two sentences, under about 155 characters. This is the search snippet.",
        "A canonical link (`<link rel=\"canonical\">`) if the same content can be reached at more than one URL.",
        "Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`) and a Twitter card, so a link pasted into WhatsApp or X shows an image and a summary rather than a bare URL. This matters more in Ghana than almost anywhere: most traffic to a portfolio arrives as a shared link.",
        "A favicon set: at minimum `favicon.ico` plus a 192px and 512px PNG, and an `apple-touch-icon`. A missing favicon shows a blank square in tabs and bookmarks.",
        "`robots.txt` and, for a portfolio, an XML sitemap so search engines find every page.",
      ],
    },
    {
      kind: "code",
      caption: "The head of a page that shares well",
      language: "html",
      code: `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ama Boateng — Front-end developer in Accra</title>
  <meta name="description"
        content="I build fast, accessible websites and web apps. Portfolio, projects and writing by Ama Boateng, front-end developer in Accra, Ghana.">
  <link rel="canonical" href="https://amaboteng.dev/">

  <!-- Link previews on WhatsApp, X, Facebook, LinkedIn, iMessage. -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="Ama Boateng — Front-end developer in Accra">
  <meta property="og:description" content="Fast, accessible websites. Projects and writing.">
  <meta property="og:url" content="https://amaboteng.dev/">
  <meta property="og:image" content="https://amaboteng.dev/og/cover.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta name="theme-color" content="#6d4aff">
</head>`,
    },
    {
      kind: "list",
      style: "numbers",
      heading: "5. Images and weight",
      items: [
        "Every image converted to WebP or AVIF, with a JPEG/PNG fallback only if you need it.",
        "No image larger than it is displayed: a 4,000px-wide photo shown at 800px is wasted megabytes. Export at the real size (or 2× for retina).",
        "`width` and `height` attributes on every image, so no layout shift.",
        "`loading=\"lazy\"` on below-the-fold images; `fetchpriority=\"high\"` on the one hero image.",
        "Total page weight under about 1.5 MB, and the largest image under about 300 KB. On a mobile connection in Accra that is the difference between one second and six.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "6. Performance",
      items: [
        "Lighthouse run at **mobile** emulation, throttled — the desktop score flatters you.",
        "Targets: Performance above 90, Largest Contentful Paint under 2.5s, Cumulative Layout Shift under 0.1, Interaction to Next Paint under 200ms.",
        "Fonts loaded with `font-display: swap` and self-hosted where possible, so a third-party request does not block your text.",
        "Only the JavaScript you need. A portfolio rarely needs any framework.",
        "Render-blocking CSS reduced: inline the small critical set, load the rest normally, and never link a stylesheet you do not use.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "7. Links, forms and error pages",
      items: [
        "Every link clicked once. A broken-link crawler does this in seconds for a large site.",
        "External links open sensibly: if you use `target=\"_blank\"`, add `rel=\"noopener\"`.",
        "A custom 404 page that is genuinely useful — a joke, a search box, and a link home.",
        "Forms tested by actually submitting them, and their error states tested with empty and invalid input.",
        "HTTPS everywhere: `http://` redirects to `https://`, and HSTS is enabled if your host supports it.",
      ],
    },
    {
      kind: "list",
      style: "numbers",
      heading: "8. After launch",
      items: [
        "Analytics that respect privacy — a self-hosted Plausible, Umami or Fathom, or GA4 if you must. Know where your visitors come from; it changes what you build next.",
        "Uptime monitoring: a free ping every five minutes tells you when your site is down before a recruiter does.",
        "Search Console submitted, so Google tells you how it sees the site and which queries reach it.",
        "The repository's README explains what the project is, how to run it and what you learned. Recruiters read it.",
        "A dated note in the repo of what to improve next. Future you will be grateful.",
      ],
    },
    {
      kind: "example",
      title: "A launch, timed",
      paragraphs: [
        "Here is what a realistic launch looks like for a seven-page portfolio, so you can plan an afternoon rather than dread a month.",
      ],
      code: `0:00  git init, .gitignore, first commit, push to a new GitHub repo
0:10  connect the repo to the host, first automatic deploy, live URL working
0:20  run Lighthouse at mobile emulation; note every red item
0:35  fix the images: convert to WebP, add width/height, add lazy loading
0:55  fix the head: titles, descriptions, Open Graph, favicons
1:15  keyboard pass on every page; fix focus and skip link
1:35  resize pass 320 → 2560; fix the two overflow bugs
1:55  click every link; write the 404 page
2:05  point the custom domain, set the CNAME, wait for DNS
2:25  share the link with one person and watch them use it without helping
2:40  write the fixes they revealed, commit, deploy again`,
      trace: [
        "The deploy happens in the first ten minutes, not at the end. Everything after it is verification against a real URL.",
        "Each block is a distinct axis — performance, metadata, accessibility, layout, links — and each ends with a checkable outcome.",
        "The last two blocks are the ones that teach the most: a real domain, and a real person failing to use your page.",
      ],
    },
    {
      kind: "warning",
      label: "The two mistakes that cost beginners the most",
      text: "**Committing secrets.** An API key, a `.env.local`, or a database URL pushed to a public repository is scraped by bots within minutes. Add the ignore rule *before* the first commit; if you already pushed one, rotating the key is the only fix — deleting the file does not remove it from history. **Never testing on a phone.** Desktop browsers forgive things phones do not: small text, tiny targets, slow networks, no hover, a keyboard that covers half the screen. If you only test on your laptop, you have not tested.",
    },
    {
      kind: "prose",
      heading: "Domains, briefly",
      paragraphs: [
        "A custom domain is worth the roughly GH₵ 150–300 a year: `amaboteng.dev` is a professional signal that `ama-portfolio-7f3.netlify.app` is not, and it survives changing hosts.",
        "Buy from a registrar with transparent renewal pricing and easy DNS management, and turn on WHOIS privacy. Then point it at your host with one of two records: an **A** record at the apex (`@` → the host's IP address) or a **CNAME** record on a subdomain (`www` → `your-deployment.host.com`). Most hosts give you the exact values to enter, and many now verify and issue the TLS certificate automatically.",
        "Expect propagation to take minutes to a few hours, and expect the certificate to appear after DNS resolves. Set one canonical hostname and redirect the others to it, so `http://example.com`, `https://example.com` and `https://www.example.com` all land in the same place — otherwise search engines see three sites and split your ranking between them.",
      ],
    },
    {
      kind: "prose",
      heading: "Keeping it alive",
      paragraphs: [
        "A portfolio is not a project with an end; it is a record that decays. Links rot, screenshots go stale, a project you were proud of in January looks thin in June. Set a recurring reminder — the first Sunday of each month is enough — and spend twenty minutes: update the projects, re-run Lighthouse, click the links, and deploy something small.",
        "The habit that makes this sustainable is committing *little and often* rather than saving up a big rewrite. One improvement per week, deployed, produces a better site in three months than a planned redesign that never starts — and every one of those deployments is evidence, on a public history, that you can finish things.",
      ],
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Repository / remote", text: "The local history of your project, and the copy of it on a server (GitHub) that hosts deploy from." },
        { term: "Commit", text: "A snapshot of changes with a message. Small and frequent beats large and rare." },
        { term: "Continuous deployment", text: "Every push to the main branch triggers a build and a publish, automatically." },
        { term: "Preview deployment", text: "A temporary URL built from a branch or pull request, so you can check a change before merging." },
        { term: "CDN", text: "The network of edge servers your host uses, so a visitor in Kumasi is served from a nearby node." },
        { term: "Open Graph", text: "The `og:` meta tags that control the image, title and description of a shared link." },
        { term: "Core Web Vitals", text: "Google's three user-experience metrics: LCP, CLS and INP." },
        { term: "Performance budget", text: "A limit you set in advance — total weight, requests, LCP — and refuse to exceed without a decision." },
      ],
    },
  ],
  practice: {
    challenge:
      "Publish your portfolio to a live URL and then **ask one person to complete a task on it without your help** — find your contact details, or work out what your most recent project does. Watch them and say nothing. Write down every moment they hesitated, mis-tapped or looked confused, fix all of them, and deploy again the same day. The fixes a real person reveals are worth more than any checklist.",
    exercises: [
      {
        prompt: "Put your project under Git with a proper `.gitignore`, make three small meaningful commits, and push to a new GitHub repository. Then rewrite one commit message so it explains *why* rather than *what*.",
        hint: "`git commit --amend -m \"…\"` rewrites the last message before you push. After pushing, prefer a new commit over rewriting history.",
      },
      {
        prompt: "Deploy to two different hosts and compare: the time to first deploy, the preview URLs each gives you, and the Lighthouse mobile score at each URL.",
        hint: "Scores should be nearly identical because the network is the same; differences usually come from the host's default compression and cache headers.",
      },
      {
        prompt: "Run Lighthouse at mobile emulation with throttling on, and fix the single largest issue it reports. Re-run and record the before and after numbers.",
        hint: "On a portfolio it is nearly always images. Convert to WebP, export at the real display size, and add width/height.",
      },
      {
        prompt: "Set a performance budget in writing — total page weight, number of requests, LCP — then measure against it and say which item you broke and what you will do about it.",
        hint: "The Network panel's footer gives requests and transferred bytes directly. A budget you write down is a decision; one you only imagine is a wish.",
      },
      {
        prompt: "Add complete Open Graph metadata and test the link preview in WhatsApp, X and LinkedIn. Adjust the image until all three look right.",
        hint: "1200×630 is the safe size. WhatsApp caches previews aggressively, so test with a fresh URL parameter or the platform's debugger.",
      },
      {
        prompt: "Do the keyboard pass: unplug the mouse and visit every page, completing one task on each. Fix every unreachable control and every invisible focus indicator.",
        hint: "Also check that the browser's back button and the skip link behave, and that no dialog traps focus.",
      },
      {
        prompt: "Write a custom 404 page that is genuinely helpful, and confirm your host serves it for a URL that does not exist.",
        hint: "GitHub Pages uses `404.html`; Netlify and Vercel look for the same file. Include a link home and, ideally, a search.",
      },
      {
        prompt: "Point a custom domain at your deployment and explain in writing which DNS record you added, what it points to, and how long propagation took.",
        hint: "Apex domains need an A record (or the host's ALIAS/ANAME support); `www` needs a CNAME. Check with `dig +short yourdomain.com`.",
      },
      {
        prompt: "Set a monthly maintenance reminder and write the five-item checklist you will run each time. Then do the first one now.",
        hint: "Links, Lighthouse, content freshness, dependency updates if any, and one improvement. Twenty minutes, deployed the same day.",
      },
    ],
    checkYourself: [
      "Why should you deploy on day one rather than when the site feels finished?",
      "What belongs in `.gitignore`, and what is the consequence of committing `.env.local`?",
      "Name the two DNS records you might use to point a domain at a host, and when each applies.",
      "What are the three Core Web Vitals and their good thresholds?",
      "Which meta tags control how your link appears in WhatsApp, and what image size works everywhere?",
      "What does a Lighthouse score of 95 on desktop with 42 on mobile tell you?",
      "Why is `target=\"_blank\"` without `rel=\"noopener\"` a security problem?",
    ],
  },
  takeaways: [
    "Ship early and often: a live URL produces feedback a local file never can.",
    "Git first — hosts deploy from a repository, and history is your safety net.",
    "Static hosting is free, automatic and global; choose in five minutes and move on.",
    "Work the checklist on eight axes: content, responsive layout, accessibility, metadata, images, performance, links, and after-launch monitoring.",
    "Metadata is not cosmetic: titles and descriptions are search results, and Open Graph is how your work looks when it is shared.",
    "Measure performance at mobile throttling, against a budget you wrote down.",
    "A custom domain, a 404 page and uptime monitoring are the difference between a project and a presence.",
    "Then keep it alive: twenty minutes a month, deployed the same day.",
  ],
  further: [
    "That completes **Web Development Foundations**. Continue with [[JavaScript: Zero to Builder|/courses/javascript-zero-to-builder]] to make your pages respond to the person using them.",
    "The Git workflow gets much deeper in [[Git, branches and commits|/learn/software-engineering-practices/git-branches-and-commits]].",
    "Keep your launch checklist somewhere you will find it; you will reuse it for every project you ever ship.",
  ],
},
