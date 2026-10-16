/**
 * Natthesisa — the codemasterghana study companion.
 *
 * This module is the offline brain behind the Natthesisa chat assistant. It
 * answers without any API key: course guidance, platform help (payments,
 * certificates, dashboard), study coaching, concept explanations, code help
 * and quizzes. When the host configures an OpenAI-compatible key (see
 * `.env.example`, `NATTHESISA_API_KEY`), the API route upgrades answers with
 * a real language model and falls back to this brain on any failure — so
 * Natthesisa always responds, even offline.
 *
 * Pure functions only: no Node APIs, safe to import anywhere.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  /** Verified lesson notes are added server-side after access has been checked. */
  lessonSummary?: string;
  lessonObjectives?: string[];
  lessonContent?: string;
  lessonChallenge?: string;
  userName?: string;
  url?: string;
}

export interface QuizState {
  id: string;
  answer: string;
}

export interface AgentLink {
  label: string;
  href: string;
}

export interface AgentReply {
  reply: string;
  suggestions: string[];
  links: AgentLink[];
  quiz?: { id: string; answer: string; explanation: string } | null;
}

const norm = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").replace(/\s+/g, " ").trim();

function has(text: string, ...words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function hasAll(text: string, ...words: string[]): boolean {
  return words.every((word) => text.includes(word));
}

function firstName(context?: ChatContext): string {
  const raw = context?.userName?.trim().split(/\s+/)[0];
  return raw ? raw : "there";
}

/* ------------------------------------------------------------------ */
/* Course catalogue summary (mirrors `lib/courses.ts` + `programs.ts`) */
/* ------------------------------------------------------------------ */

interface CourseCard {
  id: string;
  title: string;
  level: string;
  program: string;
  blurb: string;
}

const COURSE_CARDS: CourseCard[] = [
  { id: "web-foundations", title: "Web Development Foundations", level: "Beginner", program: "Web Development", blurb: "How the web works, semantic HTML, modern CSS, responsive layouts — ending with a published portfolio site." },
  { id: "computer-science-essentials", title: "Computer Science Essentials", level: "Beginner", program: "Computer Science", blurb: "Bits and data, logic and algorithms, memory, processes and networks — the mental models behind all software." },
  { id: "javascript-zero-to-builder", title: "JavaScript: Zero to Builder", level: "Beginner", program: "Web Development", blurb: "Variables to async APIs while building an interactive task planner that talks to a real API." },
  { id: "react-production-apps", title: "Build Production Apps with React", level: "Intermediate", program: "Web Development", blurb: "Components, state, data fetching and app architecture while building a polished analytics dashboard." },
  { id: "mobile-apps-react-native", title: "Mobile Apps with React Native", level: "Intermediate", program: "App Development", blurb: "Native layouts, navigation, device storage and release quality while building a habit tracker." },
  { id: "backend-node-apis", title: "Backend Development with Node.js", level: "Intermediate", program: "Backend", blurb: "HTTP APIs, validation, database modeling, auth and deployment while building a tested REST API." },
  { id: "data-structures-algorithms", title: "Data Structures & Algorithms", level: "Intermediate", program: "Computer Science", blurb: "Arrays, stacks, queues, maps, sorting, searching and Big-O — problem-solving that transfers everywhere." },
  { id: "databases-and-sql", title: "Databases & SQL", level: "Intermediate", program: "Computer Science", blurb: "Tables, relationships, joins, constraints and indexes — asking a database real questions." },
  { id: "software-engineering-practices", title: "Software Engineering Practices", level: "Intermediate", program: "Software Engineering", blurb: "Git, code review, testing and CI — the habits that separate writing code from engineering software." },
  { id: "system-design-architecture", title: "System Design & Architecture", level: "Intermediate", program: "Software Engineering", blurb: "Scaling, caching, queues and trade-offs — designing systems that survive real traffic." },
  { id: "devops-and-delivery", title: "DevOps & Delivery", level: "Intermediate", program: "Software Engineering", blurb: "CI/CD, environments, monitoring and safe deploys — running what you shipped." },
  { id: "vibe-coding-ship-with-ai", title: "Vibe Coding: Ship with AI", level: "Beginner", program: "Vibe Coding", blurb: "Describe an app, build it with AI in your first hour, and learn to read and fix what it writes." },
  { id: "ai-apps-agents-and-apis", title: "AI Apps, Agents & APIs", level: "Intermediate", program: "Vibe Coding", blurb: "Prompts, tools, agents and retrieval — wiring an AI assistant into your own data." },
  { id: "cyber-security-foundations", title: "Cyber Security Foundations", level: "Beginner", program: "Cyber Security", blurb: "How the internet moves data, firewalls and scanning, the Linux shell, permissions and Python for security work." },
  { id: "cyber-security-offense-and-defense", title: "Cyber Security: Offense and Defense", level: "Intermediate", program: "Cyber Security", blurb: "Think like an attacker within the law, then build the defences: hardening, monitoring and incident response." },
  { id: "cyber-security-cloud", title: "Cloud Security", level: "Intermediate", program: "Cyber Security", blurb: "Identity, network boundaries and storage in the cloud — the misconfigurations behind most modern breaches." },
  { id: "ethical-hacking", title: "Ethical Hacking", level: "Intermediate", program: "Cyber Security", blurb: "Authorised reconnaissance, scanning and exploitation, ending in the report a client can act on." },
  { id: "cloud-computing-devops", title: "Cloud Computing & DevOps", level: "Intermediate", program: "Cloud & DevOps", blurb: "Containers, infrastructure as code, pipelines, monitoring and a deploy you can undo." },
  { id: "data-science-analytics", title: "Data Science & Analytics", level: "Beginner", program: "Data Science", blurb: "Frame a question, clean real data, describe it honestly and hand over a finding somebody can act on." },
  { id: "human-computer-interaction", title: "Human-Computer Interaction", level: "Beginner", program: "Design", blurb: "Usability heuristics, accessibility and mobile-first design, tested with five real people." },
  { id: "graphic-design", title: "Graphic Design", level: "Beginner", program: "Design", blurb: "Contrast, repetition, alignment and proximity, then type, colour and print-ready files." },
  { id: "web-designing", title: "Web Designing", level: "Beginner", program: "Design", blurb: "Brief, structure and wireframes through to a visual system and a handover a developer can build." },
  { id: "computer-networking", title: "Computer Networking", level: "Beginner", program: "IT Essentials", blurb: "Addresses, names, packets and ports — then build, secure and troubleshoot a real small network." },
  { id: "computer-networks-architecture", title: "Computer Networks & Architecture", level: "Intermediate", program: "IT Essentials", blurb: "Layered protocols, routing and switching internals, subnetting, redundancy and measured performance." },
  { id: "computer-basics-bcc", title: "Computer Basics / BCC (Basic Computer Course)", level: "Beginner", program: "IT Essentials", blurb: "Parts and ports, files and folders, the internet and email, and the habits that keep your work safe." },
  { id: "microsoft-office", title: "Microsoft Office", level: "Beginner", program: "IT Essentials", blurb: "Word, Excel, PowerPoint and shared files as professional tools — templates, spreadsheets that reconcile, decks that work." },
  { id: "programming-languages", title: "Programming Languages", level: "Intermediate", program: "Computer Science", blurb: "Paradigms, typing and execution models — read unfamiliar code and learn the next language in weeks." },
  { id: "artificial-intelligence-machine-learning", title: "Artificial Intelligence & Machine Learning (AI/ML)", level: "Intermediate", program: "AI & Machine Learning", blurb: "What these systems really do, the ML workflow, generative AI, and deploying AI responsibly." },
];

function courseLinks(section = "courses"): AgentLink[] {
  return [
    { label: "Browse all courses", href: "/courses" },
    { label: "Programs & pricing", href: "/pricing" },
    { label: `Explore (${section})`, href: section.startsWith("/") ? section : `/${section}` },
  ];
}

/* ------------------------------------------------------------------ */
/* Concept explanations                                                */
/* ------------------------------------------------------------------ */

interface Concept {
  keys: string[];
  title: string;
  body: string;
  followUp: string[];
}

const CONCEPTS: Concept[] = [
  {
    keys: ["html"],
    title: "HTML",
    body: "**HTML gives content meaning.** The browser reads your tags and builds a page from them — headings, paragraphs, links, images, forms.\n\n- One `<!doctype html>`, one `<html>`, metadata in `<head>`, visible content in `<body>`\n- Prefer semantic tags: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>` over plain `<div>`s\n- Pair every input with a `<label>`, keep headings in order (`h1` → `h2` → `h3`)\n\n```html\n<main>\n  <article>\n    <h1>Learning in public</h1>\n    <p>Small projects create visible progress.</p>\n  </article>\n</main>\n```",
    followUp: ["Explain CSS", "What is semantic HTML?", "Quiz me on HTML"],
  },
  {
    keys: ["css", "stylesheet", "styling", "flexbox", "flex", "grid layout", " grid"],
    title: "CSS",
    body: "**CSS controls how HTML looks.** Selectors pick elements; properties set their appearance.\n\n- **Flexbox** = one direction (rows of items, nav bars). **Grid** = rows *and* columns (page sections, card collections)\n- Start mobile-first: design narrow, then add a breakpoint only when content needs it\n- Reusable classes beat one-off styles: `.card`, `.btn`, `.hero__title`\n\n```css\n.card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 1.25rem;\n}\n```",
    followUp: ["Flexbox or Grid — when?", "Explain responsive design", "Quiz me on CSS"],
  },
  {
    keys: ["responsive", "media query", "mobile first", "breakpoint"],
    title: "Responsive design",
    body: "**Responsive design = one interface that feels intentional on every screen.**\n\n1. Start with a fluid mobile layout (flexible units: `%`, `rem`, `fr`)\n2. Add `@media (min-width: …)` breakpoints only where content breaks\n3. Test at 320px, 768px and 1280px — fix every horizontal scrollbar\n\n```css\n@media (min-width: 48rem) {\n  .hero { display: grid; grid-template-columns: 1.2fr 1fr; }\n}\n```",
    followUp: ["Explain CSS Grid", "Quiz me on HTML", "Show me the courses"],
  },
  {
    keys: ["javascript", " js ", " js", "ecmascript"],
    title: "JavaScript",
    body: "**JavaScript makes pages interactive:** it remembers data, responds to clicks and talks to servers.\n\n- `const` by default, `let` when a value must change — avoid `var`\n- Functions package behavior; arrays hold ordered lists; objects group related values\n- The DOM is the browser's object view of HTML — query it, listen for events, update state\n\n```js\nconst lessons = courses.filter((c) => !c.complete).map((c) => c.title);\n```\n\nWant depth on one piece? Ask about **variables**, **functions**, **arrays & objects**, **the DOM**, or **async/await**.",
    followUp: ["Explain functions", "Explain async await", "Explain the DOM"],
  },
  {
    keys: ["variable", "const ", "let ", "var "],
    title: "Variables",
    body: "**Variables name values so your program can remember them.**\n\n- `const learner = \"Ama\"` — use for anything that won't be reassigned (most things)\n- `let count = 0` — only when the binding must change\n- Values: strings, numbers, booleans, `null`, `undefined`, objects, functions\n\n```js\nconst title = \"Web Foundations\";\nlet completed = 3;\ncompleted += 1; // 4\n```",
    followUp: ["Explain functions", "Explain arrays", "Quiz me on JavaScript"],
  },
  {
    keys: ["function", "arrow function", "callback", "parameter"],
    title: "Functions",
    body: "**Functions package behavior into named, reusable units.**\n\n- Parameters are inputs, `return` is the output\n- Prefer small functions that do one clear job\n- Arrow functions are compact; great for callbacks like `.map()` and event handlers\n\n```js\nfunction progress(done, total) {\n  if (total === 0) return 0;\n  return Math.round((done / total) * 100);\n}\nconst double = (n) => n * 2;\n```",
    followUp: ["Explain arrays and objects", "Explain scope", "Quiz me on JavaScript"],
  },
  {
    keys: ["array", "object", "destructuring", "map filter"],
    title: "Arrays & objects",
    body: "**Arrays preserve order. Objects group related values by key.** Together they model almost all app data.\n\n- `.map()` transforms, `.filter()` selects, `.find()` locates — no manual indexes needed\n- Access with `user.name` or `user[\"name\"]`; combine: arrays of objects\n\n```js\nconst beginners = courses\n  .filter((c) => c.level === \"Beginner\")\n  .map((c) => c.title);\n```",
    followUp: ["Explain functions", "Explain async await", "Quiz me on JavaScript"],
  },
  {
    keys: ["dom", "event listener", "event", "queryselector", "addeventlistener"],
    title: "The DOM & events",
    body: "**The DOM is the browser's object representation of your HTML.** JavaScript queries it and reacts to events.\n\n- `document.querySelector(\"[data-complete]\")` finds an element\n- `.addEventListener(\"click\", …)` reacts to people\n- Keep logic separate from rendering; update accessible state (`aria-pressed`)\n\n```js\nbutton.addEventListener(\"click\", () => {\n  button.textContent = \"Completed ✓\";\n});\n```",
    followUp: ["Explain async await", "Explain functions", "Quiz me on JavaScript"],
  },
  {
    keys: ["async", "await", "promise", "fetch", "api ", "apis"],
    title: "Async JavaScript & APIs",
    body: "**Async code requests data without freezing the page.** Promises represent future results; `await` makes them readable.\n\n- Always handle loading, success, empty *and* error states\n- Check `response.ok` — `fetch` only throws on network failure, not on 404/500\n\n```js\nasync function loadCourses() {\n  const res = await fetch(\"/api/courses\");\n  if (!res.ok) throw new Error(\"Request failed\");\n  return res.json();\n}\n```",
    followUp: ["What is REST?", "Explain functions", "Quiz me on JavaScript"],
  },
  {
    keys: ["react", "component", "props", "state", "hook", "useeffect", "usestate", "jsx"],
    title: "React",
    body: "**React describes what the UI should look like for the current data.**\n\n- A component is a function of **props** (inputs) and **state** (changing facts)\n- Props flow down; state lives in the closest common owner of everything that needs it\n- If a value can be *calculated* from props/state, calculate it — don't store a copy\n\n```jsx\nconst [query, setQuery] = useState(\"\");\nconst visible = courses.filter((c) =>\n  c.title.toLowerCase().includes(query.toLowerCase())\n);\n```",
    followUp: ["Props vs state?", "Explain useEffect", "Show React course"],
  },
  {
    keys: ["useeffect", "effect", "side effect"],
    title: "useEffect",
    body: "**`useEffect` runs code that touches the outside world** — fetching data, timers, subscriptions — after React renders.\n\n- The dependency array says *when* to re-run: `[]` = once, `[id]` = when `id` changes\n- Always clean up: cancel requests, clear timers, unsubscribe\n- If it can happen during render or in an event handler, it doesn't belong in an effect\n\n```jsx\nuseEffect(() => {\n  const timer = setInterval(tick, 1000);\n  return () => clearInterval(timer); // cleanup\n}, []);\n```",
    followUp: ["Explain React state", "Explain async await", "Show React course"],
  },
  {
    keys: ["node", "express", "backend", "server", "http", "rest", "endpoint"],
    title: "Backend & REST APIs",
    body: "**A backend exposes resources over HTTP; clients consume them.**\n\n- `GET` reads · `POST` creates · `PATCH` changes · `DELETE` removes\n- Status codes communicate results: `200` OK, `201` created, `400` bad input, `401` unauthenticated, `403` forbidden, `404` missing\n- Never trust client input: validate shape, type and permissions at the boundary\n\n```\nGET   /api/courses      → list courses\nPOST  /api/courses      → create one (validated!)\nGET   /api/courses/:id  → one course\n```",
    followUp: ["Explain authentication", "Explain databases", "Show backend course"],
  },
  {
    keys: ["auth", "login", "password", "session", "token", "jwt", "hash"],
    title: "Authentication",
    body: "**Authentication answers *who*; authorization answers *what they're allowed to do*.**\n\n- Hash passwords with a slow, dedicated algorithm (bcrypt/scrypt/argon2) — never store plain text\n- Sessions: httpOnly, secure cookies beat tokens in `localStorage` against XSS theft\n- Check permission for the *exact resource and action* on every request\n\nOn this platform, your session cookie keeps you signed in for 30 days.",
    followUp: ["I can't sign in", "Explain REST APIs", "Show backend course"],
  },
  {
    keys: ["database", "sql", "postgres", "table", "query", "join"],
    title: "Databases & SQL",
    body: "**Databases persist facts; SQL asks questions about them.**\n\n- Each entity gets a table with a stable key (`id`)\n- Relationships via foreign keys: one user → many enrollments\n- `SELECT … FROM … JOIN … WHERE …` is 90% of daily SQL\n\n```sql\nSELECT c.title, COUNT(p.id) AS learners\nFROM courses c\nLEFT JOIN progress p ON p.course_id = c.id\nGROUP BY c.title;\n```",
    followUp: ["Explain Big-O", "Show CS courses", "Quiz me on CS"],
  },
  {
    keys: ["big-o", "big o", "complexity", "algorithm", "sorting", "searching", "data structure", "stack", "queue", "binary"],
    title: "Algorithms & data structures",
    body: "**Data structures organize data; algorithms are the steps that transform it.**\n\n- **Array** = ordered, indexed access · **Stack** = last-in-first-out · **Queue** = first-in-first-out · **Map** = key → value\n- **Big-O** describes growth: `O(1)` constant, `O(log n)` halving, `O(n)` scan everything, `O(n²)` nested loops\n- Pick the structure that matches your most common operation\n\n```\nfunction largest(numbers):\n  best = numbers[0]\n  for each number in numbers:\n    if number > best: best = number\n  return best   # O(n) — one pass\n```",
    followUp: ["Quiz me on CS", "Explain databases", "Show CS courses"],
  },
  {
    keys: ["git", "github", "commit", "branch", "merge", "pull request", "version control"],
    title: "Git",
    body: "**Git tracks every version of your code so you can experiment without fear.**\n\n- `git add` stages · `git commit -m \"…\"` snapshots · `git push` shares\n- Branch for each feature, merge when it works: `git switch -c my-feature`\n- Write commits like messages to your future self: *what* and *why*\n\n```\ngit add .\ngit commit -m \"ship portfolio v1\"\ngit push origin main\n```",
    followUp: ["Explain code review", "How do I deploy?", "Show engineering course"],
  },
  {
    keys: ["deploy", "vercel", "hosting", "publish", "ci", "cd", "pipeline", "testing", "test ", "code review"],
    title: "Shipping software",
    body: "**Shipping = prove it works, then put it where people can reach it.**\n\n- Test behavior at the boundary: status, response, database effect\n- Fix every build error before deploying (`npm run build`)\n- Deploy previews catch mistakes before production; monitor after launch\n- Code review catches what tests miss — small PRs get better reviews\n\nYour portfolio project in Web Foundations ends with exactly this: publish and get feedback.",
    followUp: ["Explain Git", "Show engineering course", "Give me study tips"],
  },
  {
    keys: ["python"],
    title: "Python",
    body: "**Python reads almost like English** — great for first programs, scripts and data work.\n\n- Indentation *is* structure (no braces)\n- Lists, dicts and loops cover most beginner programs\n\n```python\nscores = [72, 91, 58, 84]\npassed = [s for s in scores if s >= 70]\nprint(f\"{len(passed)} of {len(scores)} passed\")\n```\n\nThis platform's courses focus on JavaScript/TypeScript for web and apps — but the problem-solving transfers directly.",
    followUp: ["Explain JavaScript", "Explain Big-O", "Show me the courses"],
  },
  {
    keys: ["network", "internet", "dns", "https", "tcp", "ip ", "packet"],
    title: "Networks",
    body: "**The internet is independent networks cooperating to move packets.**\n\n- **DNS** turns names into addresses · **IP** routes packets · **TCP** orders delivery · **HTTP** defines app messages\n- HTTPS = HTTP + encryption: no eavesdropping, no tampering\n\n```\nBrowser → DNS → IP → HTTPS request → server\nBrowser ← HTML + CSS + JS ← server\n```",
    followUp: ["Explain REST APIs", "Explain Big-O", "Show CS courses"],
  },
  {
    keys: ["machine learning", "artificial intelligence", "neural", "deep learning", "generative ai", "supervised learning", "training data", "responsible ai"],
    title: "AI & machine learning",
    body: "**Artificial intelligence is the field; machine learning is the technique that dominates it today — and neither is magic.**\n\n- **Machine learning** finds patterns in examples instead of following written rules. It is good at prediction, bad at explaining itself, and useless without data that resembles the real world\n- The workflow: frame a measurable prediction, collect and split data, train, evaluate on data the model has never seen, monitor after release\n- **Neural networks** stack simple weighted sums with non-linear activations; depth lets later layers build on earlier representations. Training adjusts the weights to reduce error\n- **Generative AI** predicts the next token well enough to write, draw and code — confidently, including when it is wrong\n- The harms are specific: bias against people the data under-represents, confident wrong answers without sources, privacy, and the cost of acting on predictions about people\n\n```\nproblem → data → train → evaluate → deploy → monitor\n```\n\nAn AI system that works is not yet an AI system that is acceptable.",
    followUp: ["Show AI courses", "Explain neural networks", "Explain bias in AI"],
  },
  {
    keys: ["ai", "llm", "prompt", "agent", "vibe cod", "vibe coding", "chatgpt", "copilot"],
    title: "AI & vibe coding",
    body: "**Vibe coding = describing software to an AI and learning to read, review and fix what it writes.**\n\n- Be specific: goal, constraints, what \"done\" looks like\n- Review every line the AI produces — *you* ship it, *you* own it\n- When it breaks: paste the exact error, describe what you expected\n- The Vibe Coding program takes you from a first page in an hour to an AI assistant wired into your own data",
    followUp: ["Show Vibe Coding course", "Explain prompts", "Give me study tips"],
  },
  {
    keys: ["ethical hacking", "penetration test", "pentest", "vulnerab", "exploit", "owasp", "cyber security", "cybersecurity", "malware", "phishing"],
    title: "Cyber security & ethical hacking",
    body: "**Security work is tested, documented and authorised — or it is a crime.**\n\n- Written permission first: scope, time window, systems you may touch, and who to call if something breaks\n- Reconnaissance before exploitation: what an outsider can already see in DNS, certificates and public storage\n- The weakness classes behind most breaches: injection, broken authentication, broken access control, exposed data, unpatched components\n- Every finding needs evidence, a risk rating, and the control that fixes it — plus a retest that proves the fix held\n\n```\nRecon → scan → exploit (in scope) → report → fix → retest\n```\n\nNever point a tool at a system you do not own or have written permission to test.",
    followUp: ["Show cyber security courses", "Explain firewalls", "Explain phishing"],
  },
  {
    keys: ["data science", "analytics", "data analyst", "data analysis", "dataset", "distribution", "statistic", "dashboard", "kpi"],
    title: "Data & analytics",
    body: "**Analytics is a loop, not a tool:** frame a question precise enough to answer, get the data, clean it, describe it, then hand over a finding somebody can act on.\n\n- Most of the work is cleaning: duplicates, missing values, dates stored as text, numbers that cannot be true\n- Describe a distribution with spread, not just the average — the mean hides the shape\n- Charts are arguments: one message per chart, labelled axes, no decoration\n- End with a decision, not a dashboard nobody opens\n\n```\nquestion → data → clean → describe → decision → measure\n```",
    followUp: ["Show data courses", "Explain SQL joins", "Explain averages"],
  },
  {
    keys: ["cloud", "devops", "docker", "container", "kubernetes", "terraform", "infrastructure as code", "aws", "ci/cd"],
    title: "Cloud & DevOps",
    body: "**The cloud is other people's computers with an API — and somebody is still responsible for what runs on them.**\n\n- Shared responsibility: the provider secures the platform; you secure your accounts, data and configuration\n- Containers package the application with its dependencies, so the same image runs everywhere\n- Infrastructure defined in code is reviewable, repeatable and reversible\n- A pipeline tests before it deploys; a deploy you cannot undo is not a deploy you can trust\n- Watch it after releasing: metrics, logs and alerts that notice a regression before a user does",
    followUp: ["Show cloud courses", "Explain containers", "Explain CI/CD"],
  },
  {
    keys: ["graphic design", "typography", "logo", "figma", "wireframe", "branding", "colour palette", "color palette", "visual hierarchy", "ux"],
    title: "Design principles",
    body: "**Design that looks amateur usually fails four measurable things:**\n\n- **Contrast** — make different things look different; one clear focal point per surface\n- **Repetition** — repeat type, colour and spacing so a set of pieces feels related\n- **Alignment** — line things up on a grid; nothing floats by accident\n- **Proximity** — related items sit together; distance means \"unrelated\"\n\nThen the craft on top: a type scale, a palette with checked contrast, and exports that survive a printer (CMYK, 300 dpi, bleed) or a phone screen (RGB, sRGB, sensible file size).",
    followUp: ["Show design courses", "Explain colour contrast", "Explain wireframes"],
  },
  {
    keys: ["computer basics", "basic computer", "bcc", "excel", "spreadsheet", "powerpoint", "word document", "files and folder", "file and folder", "email"],
    title: "Computer basics & office work",
    body: "**The office skills that decide how the day goes:**\n\n- Files and folders: name things so future-you can find them, and keep one copy that is the original\n- Word: styles for headings and body text, an automatic table of contents, and a PDF when you send it out\n- Excel: real formulas (SUMIFS, lookups, IF), data validation, and a pivot summary instead of hand-typed totals. If numbers sort wrongly or refuse to sum, they are text — fix the type first\n- PowerPoint: one idea per slide, big type, few words, rehearsed out loud\n- Back up, and test the backup by restoring something from it\n\n```\nCtrl+S · Ctrl+Z · Ctrl+F · Ctrl+C / Ctrl+V · Ctrl+Shift+V (paste without formatting)\n```",
    followUp: ["Show IT Essentials courses", "Explain VLOOKUP", "Explain backup"],
  },
  {
    keys: ["router", "wi-fi", "wifi", "subnet", "vlan", "network switch", "troubleshoot", "dhcp"],
    title: "Building a small network",
    body: "**Most office network problems are found by working in order, not by guessing.**\n\n- Is the link up? Cable, port, Wi-Fi association — check the obvious before the clever\n- Does it have an address? DHCP should hand one out; a 169.254.x.x address means it did not\n- Can it reach the gateway? `ping` the router's IP, then something outside, then a name\n- Does DNS resolve? If an IP works and a name does not, the problem is DNS, not the internet\n- Plan Wi-Fi instead of hoping: channel, placement, 5 GHz for speed, 2.4 GHz for range, a guest network\n\n```\nip route | grep default      # default via 192.168.1.1 dev wlan0\nping -c 2 192.168.1.1        # the gateway\nnslookup example.com        # DNS\n```",
    followUp: ["Show networking courses", "Explain DNS", "Explain subnetting"],
  },
  {
    keys: ["programming language", "new language", "paradigm", "compiler", "interpreter", "type system", "learn go", "learn rust"],
    title: "Programming languages",
    body: "**Languages are not interchangeable syntaxes: each makes a different set of things easy.**\n\n- **Paradigms** — imperative, object-oriented and functional styles solve the same problem differently; most modern languages mix all three\n- **Typing** — static or dynamic, strong or weak. Types are a design trade-off: earlier errors and better tooling versus less ceremony\n- **Execution** — compiled, interpreted or a virtual machine in between. That choice decides speed, portability and start-up time\n- **Learning the next language** — the six things you learn first: syntax, types, collections, error handling, concurrency, and the package ecosystem\n\nRead unfamiliar code aloud, in order, and write down every question you cannot answer — that list is your study plan.",
    followUp: ["Show programming courses", "Explain compilers", "Explain paradigms"],
  },
];

/**
 * Where a concept's "learn this next" links point. Titles not listed here fall
 * through to the switch inside the explain reply below.
 */
const CONCEPT_LINKS: Record<string, AgentLink[]> = {
  "Networks": [
    { label: "Computer Networking", href: "/courses/computer-networking" },
    { label: "Networks & Architecture", href: "/courses/computer-networks-architecture" },
  ],
  "Cyber security & ethical hacking": [
    { label: "Cyber Security Foundations", href: "/courses/cyber-security-foundations" },
    { label: "Ethical Hacking", href: "/courses/ethical-hacking" },
  ],
  "Data & analytics": [
    { label: "Data Science & Analytics", href: "/courses/data-science-analytics" },
    { label: "Databases & SQL", href: "/courses/databases-and-sql" },
  ],
  "Cloud & DevOps": [
    { label: "Cloud Computing & DevOps", href: "/courses/cloud-computing-devops" },
    { label: "DevOps & Delivery", href: "/courses/devops-and-delivery" },
  ],
  "Design principles": [
    { label: "Graphic Design", href: "/courses/graphic-design" },
    { label: "Web Designing", href: "/courses/web-designing" },
  ],
  "Computer basics & office work": [
    { label: "Computer Basics (BCC)", href: "/courses/computer-basics-bcc" },
    { label: "Microsoft Office", href: "/courses/microsoft-office" },
  ],
  "Building a small network": [
    { label: "Computer Networking", href: "/courses/computer-networking" },
    { label: "All courses", href: "/courses" },
  ],
  "AI & machine learning": [
    { label: "AI & ML course", href: "/courses/artificial-intelligence-machine-learning" },
    { label: "AI Apps & APIs", href: "/courses/ai-apps-agents-and-apis" },
  ],
  "Python": [
    { label: "Programming Languages", href: "/courses/programming-languages" },
    { label: "Computer Science Essentials", href: "/courses/computer-science-essentials" },
  ],
  "Programming languages": [
    { label: "Programming Languages", href: "/courses/programming-languages" },
    { label: "Data Structures & Algorithms", href: "/courses/data-structures-algorithms" },
  ],
};

function findConcept(text: string): Concept | null {
  const scored = CONCEPTS.map((concept) => {
    let score = 0;
    for (const raw of concept.keys) {
      const key = raw.trim();
      // Short keys match on whole words only, so "ai" never fires on "email".
      const hit = key.length <= 3
        ? new RegExp(`\\b${key.replace(/[^a-z0-9+#]/g, "")}\\b`).test(text)
        : text.includes(key);
      if (hit) score += key.length > 4 ? 2 : 1;
    }
    return { concept, score };
  }).filter((entry) => entry.score > 0);
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  return scored[0].concept;
}

/* ------------------------------------------------------------------ */
/* Quiz bank                                                           */
/* ------------------------------------------------------------------ */

interface QuizItem {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

const QUIZ_BANK: QuizItem[] = [
  { id: "html-1", topic: "html", question: "Which tag best wraps the main content of a page?", options: ["<div>", "<main>", "<span>", "<section-main>"], answer: "B", explanation: "`<main>` is the landmark for primary content — screen readers and search engines rely on it." },
  { id: "html-2", topic: "html", question: "Why pair every form input with a <label>?", options: ["It makes text bold", "It connects the description to the field for screen readers and bigger click targets", "It is required for CSS", "It speeds up the page"], answer: "B", explanation: "Labels give inputs accessible names and expand the clickable area — a core accessibility win." },
  { id: "css-1", topic: "css", question: "Flexbox vs Grid — which statement is TRUE?", options: ["Flexbox controls rows and columns together", "Grid is one-dimensional, Flexbox is two-dimensional", "Flexbox arranges along one axis; Grid controls rows and columns together", "They do exactly the same thing"], answer: "C", explanation: "Flexbox = one main axis (nav bars, rows). Grid = rows + columns (page sections, card collections)." },
  { id: "css-2", topic: "css", question: "In mobile-first CSS, when do you add a media query?", options: ["For every element", "Only when the content needs a different layout at a wider size", "Never — phones only", "At exactly 1024px always"], answer: "B", explanation: "Start fluid and narrow; add breakpoints where content breaks, not at device presets." },
  { id: "js-1", topic: "javascript", question: "What does `const` mean in JavaScript?", options: ["The value can never change in any way", "The binding can't be reassigned (but object contents can still mutate)", "It creates a global variable", "It is the same as `var`"], answer: "B", explanation: "`const` locks the binding, not the value — `const user = {}` still allows `user.name = \"Ama\"`." },
  { id: "js-2", topic: "javascript", question: "`[1, 2, 3].filter(n => n > 1).map(n => n * 10)` gives…", options: ["[10, 20, 30]", "[20, 30]", "[2, 3]", "[1, 20, 30]"], answer: "B", explanation: "`filter` keeps 2 and 3, then `map` multiplies each by 10 → [20, 30]." },
  { id: "js-3", topic: "javascript", question: "Why check `response.ok` after `fetch()`?", options: ["fetch throws on 404/500 automatically", "fetch only rejects on network failure, so HTTP errors must be checked manually", "It is not needed", "It parses JSON"], answer: "B", explanation: "`fetch` resolves even for 404/500 — checking `response.ok` is how you catch HTTP errors." },
  { id: "js-4", topic: "javascript", question: "Which is the safest default for declaring variables?", options: ["var", "let", "const", "No keyword"], answer: "C", explanation: "`const` by default, `let` only when reassignment is needed. Avoid `var` (function-scoped, hoisted)." },
  { id: "react-1", topic: "react", question: "Where should state live in React?", options: ["Always in the top component", "In the closest common owner of every component that needs it", "In localStorage", "In props"], answer: "B", explanation: "Lift state to the nearest shared parent — no higher. Derive the rest during render." },
  { id: "react-2", topic: "react", question: "What does `useEffect(() => {...}, [])` do?", options: ["Runs after every render", "Runs once after the first render", "Runs before render", "Never runs"], answer: "B", explanation: "An empty dependency array means: run once after mount. Remember the cleanup function!" },
  { id: "cs-1", topic: "cs", question: "A queue follows which order?", options: ["Last-in-first-out", "First-in-first-out", "Random", "Sorted"], answer: "B", explanation: "Queues are FIFO — like a support line. Stacks are LIFO." },
  { id: "cs-2", topic: "cs", question: "Scanning every item once to find the largest is…", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "C", explanation: "One pass over n items scales linearly → O(n)." },
  { id: "cs-3", topic: "cs", question: "13 in decimal equals what in binary?", options: ["1011", "1101", "1110", "1001"], answer: "B", explanation: "8 + 4 + 0 + 1 = 13 → 1101. Place values double right to left: 8, 4, 2, 1." },
  { id: "backend-1", topic: "backend", question: "Which HTTP method should CREATE a resource?", options: ["GET", "POST", "DELETE", "HEAD"], answer: "B", explanation: "GET reads, POST creates, PATCH changes, DELETE removes." },
  { id: "backend-2", topic: "backend", question: "A request with valid login but no permission gets…", options: ["200", "401", "403", "500"], answer: "C", explanation: "401 = who are you? (unauthenticated). 403 = I know you, but no (forbidden)." },
  { id: "git-1", topic: "git", question: "What does `git commit` do?", options: ["Uploads code to GitHub", "Snapshots staged changes into history", "Downloads changes", "Deletes a branch"], answer: "B", explanation: "`commit` snapshots staged changes locally. `push` is what shares them." },
];

const QUIZ_ALIASES: Record<string, string[]> = {
  html: ["html"],
  css: ["css"],
  javascript: ["javascript", "js", "java script"],
  react: ["react"],
  cs: ["cs", "computer science", "algorithm", "dsa", "data structure"],
  backend: ["backend", "node", "api", "rest", "server"],
  git: ["git", "github"],
};

function quizTopic(text: string): string | null {
  for (const [topic, aliases] of Object.entries(QUIZ_ALIASES)) {
    if (aliases.some((alias) => text.includes(alias))) return topic;
  }
  return null;
}

function pickQuiz(topic: string | null, history: ChatMessage[]): QuizItem {
  const pool = topic ? QUIZ_BANK.filter((item) => item.topic === topic) : QUIZ_BANK;
  const list = pool.length ? pool : QUIZ_BANK;
  const asked = new Set(
    history.map((message) => message.content).join("\n").match(/QZ-[a-z0-9-]+/gi) ?? []
  );
  const fresh = list.filter((item) => !asked.has(`QZ-${item.id}`));
  const chosen = (fresh.length ? fresh : list)[history.length % (fresh.length ? fresh.length : list.length)];
  return chosen;
}

function quizReply(item: QuizItem): AgentReply {
  const letters = ["A", "B", "C", "D"];
  const options = item.options.map((option, index) => `${letters[index]}. ${option}`).join("\n");
  return {
    reply: `**Quiz time** · ${item.topic.toUpperCase()} · \`QZ-${item.id}\`\n\n${item.question}\n\n${options}\n\nReply with the letter (A–D) — I'll tell you if you're right and why.`,
    suggestions: ["A", "B", "C", "D", "Another question"],
    links: [{ label: "Keep learning", href: "/dashboard" }],
    quiz: { id: item.id, answer: item.answer, explanation: item.explanation },
  };
}

function gradeQuiz(userText: string, pending: QuizState): AgentReply | null {
  const letter = userText.trim().toUpperCase().replace(/^[^A-D]*([A-D])[^A-D]*$/, "$1");
  const looksLikeAnswer = /^[a-d][.)\s]*$/.test(userText.trim()) || /^[a-d]$/.test(letter) && userText.trim().length <= 3;
  if (!looksLikeAnswer && !has(norm(userText), "a", "b", "c", "d")) return null;
  const item = QUIZ_BANK.find((entry) => entry.id === pending.id);
  if (!item) return null;
  const guess = letter.length === 1 ? letter : userText.trim().toUpperCase()[0];
  if (!["A", "B", "C", "D"].includes(guess)) return null;
  const correct = guess === item.answer;
  return {
    reply: correct
      ? `**Correct!** ✓ ${item.answer} it is.\n\n${item.explanation}\n\nWant to keep the streak going?`
      : `**Not quite** — the answer is **${item.answer}**.\n\n${item.explanation}\n\nNo shame in that — every wrong answer is a lesson that sticks. Try another?`,
    suggestions: ["Another question", `Quiz me on ${item.topic}`, "Explain this topic"],
    links: [{ label: "Back to lessons", href: "/dashboard" }],
    quiz: null,
  };
}

/* ------------------------------------------------------------------ */
/* Code help — lightweight static observations                          */
/* ------------------------------------------------------------------ */

function codeObservations(code: string): string[] {
  const notes: string[] = [];
  if (/\bvar\s+\w+\s*=/.test(code)) notes.push("Prefer `const`/`let` over `var` — `var` is function-scoped and hoisted, which causes subtle bugs.");
  if (/[^=!]==[^=]/.test(code)) notes.push("Use `===` instead of `==` — loose equality coerces types (`\"5\" == 5` is true!) and hides bugs.");
  if (/console\.log/.test(code)) notes.push("`console.log` is fine while debugging, but remove or replace it before shipping.");
  if (/fetch\(/.test(code) && !/response\.ok|res\.ok|\.ok\b/.test(code)) notes.push("After `fetch`, check `response.ok` — `fetch` only throws on network failure, not on 404/500.");
  if (/fetch\(/.test(code) && !/catch|try/.test(code)) notes.push("Wrap the request in `try/catch` (or `.catch`) so network failure shows a friendly error state.");
  if (/\.innerHTML\s*=/.test(code)) notes.push("`innerHTML` with dynamic data risks XSS — prefer `textContent` or creating elements.");
  if (/document\.getElementById|\$\(/.test(code)) notes.push("Consider `querySelector` with stable `data-*` attributes — clearer than IDs scattered through markup.");
  if (/useEffect/.test(code) && !/return\s+\(\)\s*=>/.test(code) && /setInterval|addEventListener|subscribe/.test(code)) notes.push("This effect sets up something persistent — return a cleanup function to avoid leaks.");
  if (/useState/.test(code) && /useState\(.*\).*useState\(/s.test(code)) notes.push("Multiple state values is fine — just make sure none can be *derived* from the others during render.");
  if (/password/i.test(code) && /=|==/.test(code)) notes.push("If this compares passwords, hash them server-side with bcrypt/scrypt — never store or compare plain text.");
  return notes;
}

function extractCode(message: string): string | null {
  const fenced = message.match(/```[\s\S]*?```/);
  if (fenced) return fenced[0].replace(/```\w*\n?/, "").replace(/```$/, "").slice(0, 2000);
  const inline = message.match(/`[^`]{20,}`/);
  if (inline) return inline[0].slice(1, -1).slice(0, 2000);
  if (/[{};]\s*\n/.test(message) && /function|const|let|var|def |import |<\w+>/.test(message)) {
    return message.slice(0, 2000);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Platform help                                                       */
/* ------------------------------------------------------------------ */

function platformReply(text: string): AgentReply | null {
  if (has(text, "price", "pricing", "cost", "how much", "pay", "payment", "momo", "telecel", "paystack", "buy", "purchase", "program")) {
    return {
      reply: "**Paying for a program** is simple:\n\n1. Pick a program on the **Pricing** page — one payment opens *every* course and lesson inside it, permanently\n2. Pay with **MTN MoMo, Telecel or AT** (or card) through our secure checkout\n3. Your pass activates instantly and everything unlocks on your dashboard\n\nOne payment per program. No subscriptions, no expiring access.",
      suggestions: ["Show me the courses", "How do certificates work?", "How do I track progress?"],
      links: [
        { label: "See pricing", href: "/pricing" },
        { label: "Browse courses", href: "/courses" },
      ],
    };
  }
  if (has(text, "certificate", "certification", "verify", "employer", "proof", "credential")) {
    return {
      reply: "**Certificates prove what you finished.**\n\n- Complete a course's lessons and your certificate unlocks on the dashboard\n- Each certificate has a **QR code + verification link** — employers scan it and see live proof on our verify page\n- Save it as a PDF (print → landscape A4) and attach it to applications\n\nFinish lessons → earn proof → share the link. That's the whole loop.",
      suggestions: ["How do I track progress?", "Show me the courses", "Give me study tips"],
      links: [
        { label: "Verify a certificate", href: "/verify" },
        { label: "My dashboard", href: "/dashboard" },
      ],
    };
  }
  if (has(text, "sign in", "signin", "log in", "login", "password", "account", "sign up", "signup", "register")) {
    return {
      reply: "**Accounts & signing in:**\n\n- **New here?** Hit *Start learning* (top right) to create an account in seconds\n- **Returning?** *Sign in* with your email and password — your session lasts 30 days\n- **Stuck signing in?** Double-check the email you registered with, and make sure cookies are enabled\n- Your **dashboard** holds your courses, progress and certificates\n\nStill locked out? Use the contact page and we'll sort it out.",
      suggestions: ["Show me the courses", "How do payments work?", "How do I track progress?"],
      links: [
        { label: "Sign in", href: "/login" },
        { label: "Create account", href: "/login?mode=signup" },
        { label: "Contact support", href: "/contact" },
      ],
    };
  }
  if (has(text, "progress", "dashboard", "streak", "continue", "resume", "where was i", "my learning")) {
    return {
      reply: "**Your dashboard is mission control:**\n\n- **Continue learning** jumps back into exactly where you stopped\n- Rings and counts show per-course completion; weekly minutes keep your streak honest\n- Finished everything in a course? Your **certificate** appears there automatically\n\nSmall habit that works: 25 focused minutes a day beats a 5-hour Sunday binge.",
      suggestions: ["Give me study tips", "Quiz me", "Show me the courses"],
      links: [{ label: "Open dashboard", href: "/dashboard" }],
    };
  }
  if (has(text, "contact", "support", "help me", "human", "teacher", "email", "owner")) {
    return {
      reply: "You can always reach a human:\n\n- **Contact page** — send a message, we reply by email\n- Anything about payments, certificates or your account — include your account email so we find you fast\n\nI'm Natthesisa, your study buddy for instant help — but the teaching team reads every message.",
      suggestions: ["How do payments work?", "I can't sign in", "Show me the courses"],
      links: [{ label: "Contact us", href: "/contact" }],
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Recommendations                                                     */
/* ------------------------------------------------------------------ */

function recommendReply(text: string, context?: ChatContext): AgentReply | null {
  const wantsPath = has(
    text,
    "recommend", "suggest", "where do i start", "where should i start",
    "which course", "what course", "what should i learn", "what do i learn",
    "learn first", "learn next", "get started", "getting started",
    "beginner", "new to", "start", "path", "roadmap", "become", "goal",
    "i want", "wanna", "build a", "build an", "build mobile", "build web", "career", "job"
  );
  if (!wantsPath && !has(text, "course")) return null;

  // Specific-course question?
  const match = COURSE_CARDS.find(
    (card) => text.includes(card.id.replace(/-/g, " ")) || text.includes(card.title.toLowerCase())
  );
  if (match) {
    return {
      reply: `**${match.title}** · ${match.level} · *${match.program}*\n\n${match.blurb}\n\nOpen its page for the full module breakdown and what you'll build.`,
      suggestions: ["What should I learn first?", "How much does it cost?", "Quiz me"],
      links: [
        { label: `View ${match.title}`, href: `/courses/${match.id}` },
        { label: "All courses", href: "/courses" },
      ],
    };
  }

  if (has(text, "mobile", "app ", "android", "ios")) {
    return {
      reply: "For **mobile apps**, the path is:\n\n1. **JavaScript: Zero to Builder** — the language everything is built on\n2. **Build Production Apps with React** — components and state transfer directly\n3. **Mobile Apps with React Native** — your habit-tracker capstone\n\nReact Native uses React's model but renders native views — no browser DOM.",
      suggestions: ["Show all courses", "How much does it cost?", "Explain React"],
      links: [
        { label: "Mobile Apps course", href: "/courses/mobile-apps-react-native" },
        { label: "JavaScript course", href: "/courses/javascript-zero-to-builder" },
      ],
    };
  }
  if (has(text, "backend", "server", "api", "node")) {
    return {
      reply: "For **backend development**, the path is:\n\n1. **JavaScript: Zero to Builder** — Node.js *is* JavaScript outside the browser\n2. **Backend Development with Node.js** — HTTP APIs, databases, auth, deployment\n3. **Databases & SQL** — ask a database real questions\n\nThen level up with System Design when you're ready to think in trade-offs.",
      suggestions: ["Explain REST APIs", "Show all courses", "How much does it cost?"],
      links: [
        { label: "Backend course", href: "/courses/backend-node-apis" },
        { label: "JavaScript course", href: "/courses/javascript-zero-to-builder" },
      ],
    };
  }
  if (has(text, "machine learning", "neural", "deep learning", "generative ai", "train a model", "ml model", "responsible ai")) {
    return {
      reply: "For **AI & machine learning**, learn what these systems actually do before the frameworks:\n\n1. **Artificial Intelligence & Machine Learning (AI/ML)** — the machine-learning workflow, neural networks, generative AI and the ethics of deploying it\n2. **Data Science & Analytics** — the data handling every model depends on\n3. **AI Apps, Agents & APIs** — then put a model behind a real product\n\nInterviews ask about data, evaluation and risk far more than they ask about libraries.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "AI & ML course", href: "/courses/artificial-intelligence-machine-learning" },
        { label: "Data Science course", href: "/courses/data-science-analytics" },
      ],
    };
  }
  if (has(text, "security", "hacking", "hacker", "penetration", "pentest", "cyber", "infosec", "malware", "vulnerab")) {
    return {
      reply: "For **cyber security**, the order matters:\n\n1. **Cyber Security Foundations** — how data moves, firewalls and scanning, the Linux shell, permissions, Python for security work\n2. **Ethical Hacking** — authorised reconnaissance, exploitation and the report a client acts on\n3. **Cyber Security: Offense and Defense** and **Cloud Security** — hardening, monitoring and incident response\n\nNever test a system you do not have written permission to test. That line is the whole profession.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Cyber Security Foundations", href: "/courses/cyber-security-foundations" },
        { label: "Ethical Hacking", href: "/courses/ethical-hacking" },
      ],
    };
  }
  if (has(text, "networking", "network", "router", "switch", "wi-fi", "wifi", "subnet", "dns", "tcp", "it support", "helpdesk", "computer repair", "technician")) {
    return {
      reply: "For **networks and IT support**:\n\n1. **Computer Networking** — addresses, names, packets and ports, then build and troubleshoot a real small network\n2. **Computer Networks & Architecture** — layered design, routing and switching internals, subnetting, redundancy and measured performance\n3. **Computer Basics / BCC** if the fundamentals are new, and **Microsoft Office** for the office skills that go with the job\n\nIT support is the most common entry-level technology job in Ghana — document everything and it becomes a career.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Computer Networking", href: "/courses/computer-networking" },
        { label: "Networks & Architecture", href: "/courses/computer-networks-architecture" },
      ],
    };
  }
  if (has(text, "cloud", "devops", "docker", "kubernetes", "terraform", "aws", "azure", "ci/cd", "ci cd", "pipeline", "deploy")) {
    return {
      reply: "For **cloud and DevOps**:\n\n1. **Cloud Computing & DevOps** — containers, infrastructure as code, pipelines, monitoring and a deploy you can undo\n2. **DevOps & Delivery** — the software-engineering view of the same pipeline\n3. **Cloud Security** — identity, network boundaries and misconfiguration once you are running there\n\nRun something real in the cloud, however small. The bill teaches faster than the slides do.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Cloud & DevOps course", href: "/courses/cloud-computing-devops" },
        { label: "DevOps & Delivery", href: "/courses/devops-and-delivery" },
      ],
    };
  }
  if (has(text, "data science", "data analyst", "analytics", "data analysis", "excel", "spreadsheet", "dashboard", "statistic")) {
    return {
      reply: "For **data and analytics**:\n\n1. **Data Science & Analytics** — frame the question, clean real data, describe it honestly, hand over a decision somebody can act on\n2. **Databases & SQL** — the query language every analyst is asked for\n3. **Artificial Intelligence & Machine Learning (AI/ML)** — if you want prediction rather than description\n\nMost analyst work is cleaning and framing, not modelling. Start where the work actually is.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Data Science course", href: "/courses/data-science-analytics" },
        { label: "Databases & SQL", href: "/courses/databases-and-sql" },
      ],
    };
  }
  if (has(text, "design", "designer", " ui", "ux", "figma", "graphic", "typography", "logo", "wireframe", "usability")) {
    return {
      reply: "For **design**, pick by what you want to make:\n\n1. **Graphic Design** — contrast, repetition, alignment and proximity, then type, colour and print-ready files\n2. **Web Designing** — brief, wireframes, a visual system and a handover a developer can build from\n3. **Human-Computer Interaction** — usability, accessibility and testing with five real people\n\nAll three assume no drawing skill: this is composition and technique.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Graphic Design", href: "/courses/graphic-design" },
        { label: "Web Designing", href: "/courses/web-designing" },
      ],
    };
  }
  if (has(text, "computer basics", "basic computer", "bcc", "microsoft office", "microsoft word", "powerpoint", "office work", "administrative", "never used a computer")) {
    return {
      reply: "For **computer basics and office skills**:\n\n1. **Computer Basics / BCC** — parts and ports, files and folders, the internet and email, plus backups and passwords\n2. **Microsoft Office** — Word, Excel and PowerPoint as professional tools, with shared files nobody overwrites\n3. **Data Science & Analytics** next, if spreadsheets are already where you work\n\nBoth courses assume nothing about your background and end with printed checklists you keep.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Computer Basics (BCC)", href: "/courses/computer-basics-bcc" },
        { label: "Microsoft Office", href: "/courses/microsoft-office" },
      ],
    };
  }
  if (has(text, "programming language", "new language", "paradigm", "compiler", "learn python", "learn go", "learn java", "typescript", "syntax")) {
    return {
      reply: "For **programming languages**:\n\n1. **Programming Languages** — paradigms, typing and execution models, plus a method for reading code you have never seen\n2. **Data Structures & Algorithms** — the problem-solving core that transfers between languages\n3. **System Design & Architecture** — what those languages build at scale\n\nThe fifth language is much cheaper than the first. This course is how you get there deliberately.",
      suggestions: ["Show all courses", "How much does it cost?", "What should I learn first?"],
      links: [
        { label: "Programming Languages", href: "/courses/programming-languages" },
        { label: "All courses", href: "/courses" },
      ],
    };
  }
  if (/\bai\b/.test(text) || has(text, "vibe", "agent", "prompt", "artificial intelligence")) {
    return {
      reply: "For **building with AI**, start here:\n\n1. **Vibe Coding: Ship with AI** — a real app in your first hour, while learning to review AI-written code\n2. **AI Apps, Agents & APIs** — prompts, tools, agents and retrieval on your own data\n\nVibe coding isn't skipping the learning — it's learning to *direct* and *verify*.",
      suggestions: ["Explain vibe coding", "Show all courses", "How much does it cost?"],
      links: [
        { label: "Vibe Coding course", href: "/courses/vibe-coding-ship-with-ai" },
        { label: "AI Apps course", href: "/courses/ai-apps-agents-and-apis" },
      ],
    };
  }
  if (has(text, "computer science", "cs ", "algorithm", "dsa", "theory", "fundamental")) {
    return {
      reply: "For **computer science fundamentals**:\n\n1. **Computer Science Essentials** — bits, logic, memory, networks\n2. **Data Structures & Algorithms** — the problem-solving core\n3. **Databases & SQL** — persistent data done right\n\nThese ideas outlive every framework — worth every hour.",
      suggestions: ["Explain Big-O", "Quiz me on CS", "Show all courses"],
      links: [
        { label: "CS Essentials", href: "/courses/computer-science-essentials" },
        { label: "All courses", href: "/courses" },
      ],
    };
  }

  const greeting = context?.courseTitle ? ` Since you're studying **${context.courseTitle}**, you're already on a great track — finish it before branching out.` : "";
  return {
    reply: `Here's how I'd start from zero:${greeting}\n\n1. **Web Development Foundations** — HTML, CSS, publish your first site\n2. **JavaScript: Zero to Builder** — make it interactive, talk to APIs\n3. **Then branch:** React for web apps · React Native for mobile · Node.js for backend · Vibe Coding to build with AI\n\nTell me your goal (*\"I want to build mobile apps\"*) and I'll narrow it down.`,
    suggestions: ["I want to build websites", "I want to build mobile apps", "I want to learn AI", "How much does it cost?"],
    links: courseLinks(),
  };
}

/* ------------------------------------------------------------------ */
/* Study coaching                                                      */
/* ------------------------------------------------------------------ */

function coachReply(text: string): AgentReply | null {
  if (has(text, "stuck", "don't understand", "dont understand", "confused", "hard", "difficult", "frustrat", "give up", "motivat", "discouraged")) {
    return {
      reply: "Being stuck is *where* the learning happens — it just doesn't feel like it yet. Try this:\n\n1. **Shrink it:** what's the smallest piece you *do* understand? Start there\n2. **Say it aloud:** explain the problem like I'm five — gaps reveal themselves\n3. **Change the input:** re-read the lesson summary, then retry the challenge\n4. **Paste your code here** and I'll walk through it with you\n\nEvery developer you admire has stared at an error for hours. You're in good company.",
      suggestions: ["Give me study tips", "Explain this topic", "Quiz me"],
      links: [{ label: "Back to lessons", href: "/dashboard" }],
    };
  }
  if (has(text, "study", "tip", "learn faster", "remember", "focus", "habit", "plan", "schedule", "how to learn")) {
    return {
      reply: "**Study tactics that actually work:**\n\n- **25-minute sprints** with breaks beat marathon sessions (your brain consolidates in the gaps)\n- **Build, don't just read** — finish every lesson challenge before moving on\n- **Recall > reread:** close the page, quiz yourself — or ask me to *quiz you*\n- **One concept, one program:** after each lesson, write a tiny program using only that idea\n- **Teach it:** explain today's lesson to a friend (or to me!) in your own words\n\nConsistency beats intensity. 25 minutes daily for a month transforms you.",
      suggestions: ["Quiz me", "What should I learn first?", "How do I track progress?"],
      links: [{ label: "Continue learning", href: "/dashboard" }],
    };
  }
  if (has(text, "error", "bug", "debug", "not working", "broken", "fix", "wrong", "issue", "problem with", "why doesn't", "why isnt", "isn't working")) {
    return {
      reply: "Let's debug together. Paste your **code + the exact error message** and I'll pinpoint it.\n\nMeanwhile, the universal checklist:\n\n1. **Read the error fully** — file, line number, *first* line first (later lines are knock-on effects)\n2. **`console.log` the values** right before the failing line — is the data what you assume?\n3. **Halve it:** comment out half the code. Still broken? The bug is in this half\n4. **Check the classics:** typos in names, `==` vs `===`, missing `await`, unclosed brackets\n\nPaste it in and I'll take a look — I never judge messy code. 🐛",
      suggestions: ["Explain async await", "Explain the DOM", "Give me study tips"],
      links: [{ label: "Back to lessons", href: "/dashboard" }],
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

export const GREETING_SUGGESTIONS = [
  "What should I learn first?",
  "Show me the courses",
  "Quiz me",
  "Explain JavaScript",
  "Build a website",
  "Build a mobile app",
];

export function greeting(context?: ChatContext): AgentReply {
  const name = firstName(context);
  const studying = context?.lessonTitle
    ? ` I see you're on **${context.lessonTitle}**${context.courseTitle ? ` in *${context.courseTitle}*` : ""} — ask me anything about it!`
    : context?.courseTitle
      ? ` I see you're exploring **${context.courseTitle}** — great choice.`
      : "";
  return {
    reply: `Hi ${name}! I'm **Natthesisa** — your AI study companion here on codemasterghana. 👋\n\nI can **explain lessons**, **quiz you**, **debug and generate code**, and help you **build a website or a React Native mobile app**. I can also guide your course path and answer platform questions.${studying}\n\nWhat are we learning or building today?`,
    suggestions: GREETING_SUGGESTIONS,
    links: [
      { label: "Browse courses", href: "/courses" },
      { label: "My dashboard", href: "/dashboard" },
    ],
  };
}

export function answer(
  rawMessage: string,
  history: ChatMessage[] = [],
  context?: ChatContext,
  pendingQuiz?: QuizState | null
): AgentReply {
  const message = rawMessage.slice(0, 2000);
  const text = norm(message);
  if (!text) {
    return {
      reply: "I didn't quite catch that — could you say it another way? I can explain concepts, recommend courses, quiz you, or help debug code.",
      suggestions: GREETING_SUGGESTIONS,
      links: [],
    };
  }

  // 1. Pending quiz answer?
  if (pendingQuiz && /^[a-d][.)\s]*$/i.test(message.trim())) {
    const graded = gradeQuiz(message, pendingQuiz);
    if (graded) return graded;
  }

  // 2. Identity
  if (has(text, "who are you", "your name", "what are you", "about yourself", "natthesisa")) {
    if (has(text, "who are you", "your name", "what are you", "about yourself") || text === "natthesisa") {
      return {
        reply: "I'm **Natthesisa** — codemasterghana's AI study companion. Think of me as the senior student who never sleeps: I explain lessons, quiz you, debug and generate code, and help you build websites or React Native mobile app starters. I can also guide you to the right course.\n\nI was named for this platform's mission: *learn, build, become.* What shall we tackle?",
        suggestions: GREETING_SUGGESTIONS,
        links: [],
      };
    }
  }

  // 3. Greetings / thanks / goodbye
  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening)|akwaaba|maakye|maaha|maadwo)[\s!.,]*$/.test(text)) {
    return greeting(context);
  }
  if (has(text, "thank", "thanks", "thx", "appreciated", "great", "awesome", "perfect", "helpful")) {
    return {
      reply: `You're very welcome${context?.userName ? `, ${firstName(context)}` : ""}! That's what I'm here for. Keep building — and come back any time you're stuck, curious, or want a quiz. 💪`,
      suggestions: ["Quiz me", "What should I learn next?", "Give me study tips"],
      links: [{ label: "Continue learning", href: "/dashboard" }],
    };
  }
  if (has(text, "bye", "goodbye", "see you", "good night")) {
    return {
      reply: "See you soon! Remember: small steps daily. I'll be right here whenever you need an explanation, a quiz, or a second pair of eyes on your code. 👋",
      suggestions: ["Quiz me", "Give me study tips"],
      links: [{ label: "Back to dashboard", href: "/dashboard" }],
    };
  }

  // 4. Quiz requests
  if (has(text, "quiz", "test me", "test my", "practice question", "flashcard", "another question", "ask me")) {
    return quizReply(pickQuiz(quizTopic(text), history));
  }

  // 5. Code pasted → review it
  const code = extractCode(message);
  if (code && (has(text, "review", "check", "look at", "debug", "fix", "explain", "wrong", "error", "code") || code.length > 60)) {
    const notes = codeObservations(code);
    const verdict = notes.length
      ? notes.map((note, index) => `${index + 1}. ${note}`).join("\n")
      : "I scanned it and nothing jumped out as a classic mistake — nice work! If it misbehaves, tell me the **exact error or wrong output** and I'll dig deeper.";
    return {
      reply: `**Code review** 🔍\n\n${verdict}\n\nWant me to **explain what it does line by line**, or help with a specific error? Paste the error message exactly as it appears.`,
      suggestions: ["Explain this line by line", "It throws an error", "Give me study tips"],
      links: [{ label: "Back to lessons", href: "/dashboard" }],
    };
  }

  // 6. Platform help
  const platform = platformReply(text);
  if (platform) {
    if (context?.courseTitle && has(text, "course")) {
      platform.reply += `\n\n(P.S. You're currently viewing **${context.courseTitle}** — want me to explain anything in it?)`;
    }
    return platform;
  }

  // 6a. Direct new-project requests should point to the project builder, not only a course recommendation.
  const asksToBuild = /\b(build|create|make|generate|write)\b/.test(text);
  const projectKind = /\b(website|web site|web app|mobile app|application|app)\b/.test(text) || has(text, "code", "function", "snippet");
  if (asksToBuild && projectKind) {
    return {
      reply: "Absolutely. Choose **Build → Website, Mobile app, or Code** above this chat, then describe the goal, audience, key features, and style. Websites open in Code Lab; mobile apps are Expo / React Native projects you can try with Expo Go. Review and test generated code before shipping.",
      suggestions: ["Build a website", "Build a mobile app", "Generate code"],
      links: [{ label: "Open Code Lab", href: "/dashboard/code" }],
    };
  }

  // 7. Coaching / debugging (before concepts, so "stuck on flexbox" still coaches)
  if (hasAll(text, "explain") && findConcept(text)) {
    // fall through to concepts
  } else {
    const coach = coachReply(text);
    if (coach) {
      const concept = findConcept(text);
      if (concept && !has(text, "error", "bug", "debug", "not working", "broken", "fix")) {
        coach.reply += `\n\n---\n\nSince you mentioned **${concept.title}**, here's a refresher:\n\n${concept.body}`;
        coach.suggestions = concept.followUp;
      }
      return coach;
    }
  }

  // 8. Recommendations / course questions
  const recommendation = recommendReply(text, context);
  if (recommendation) return recommendation;

  // 9. Concept explanations
  const concept = findConcept(text);
  if (concept) {
    return {
      reply: concept.body,
      suggestions: concept.followUp,
      links:
        CONCEPT_LINKS[concept.title] ??
        (concept.title === "React" || concept.title === "useEffect"
          ? [{ label: "React course", href: "/courses/react-production-apps" }]
          : concept.title === "Backend & REST APIs" || concept.title === "Authentication"
            ? [{ label: "Backend course", href: "/courses/backend-node-apis" }]
            : concept.title === "Algorithms & data structures" || concept.title === "Databases & SQL" || concept.title === "Networks"
              ? [{ label: "CS Essentials", href: "/courses/computer-science-essentials" }]
              : concept.title === "Git" || concept.title === "Shipping software"
                ? [{ label: "Engineering course", href: "/courses/software-engineering-practices" }]
                : concept.title === "AI & vibe coding"
                  ? [{ label: "Vibe Coding course", href: "/courses/vibe-coding-ship-with-ai" }]
                  : ["HTML", "CSS", "Responsive design"].includes(concept.title)
                    ? [{ label: "Web Foundations", href: "/courses/web-foundations" }]
                    : [{ label: "JavaScript course", href: "/courses/javascript-zero-to-builder" }]),
    };
  }

  // 10. Use verified lesson material before falling back to a generic nudge.
  if (context?.lessonTitle && context.lessonSummary && /\b(summarize|summary|recap|what am i learning|what is this lesson about|key idea)\b/.test(text)) {
    const objectives = context.lessonObjectives?.length
      ? `\n\n**By the end, you should be able to:**\n${context.lessonObjectives.map((objective) => `- ${objective}`).join("\n")}`
      : "";
    return {
      reply: `**${context.lessonTitle}**${context.courseTitle ? ` · ${context.courseTitle}` : ""}\n\n${context.lessonSummary}${objectives}\n\nWant an example, a hint for the challenge, or a quick quiz?`,
      suggestions: ["Give me an example", "Give me a hint for the challenge", "Quiz me"],
      links: [{ label: "Back to lesson", href: context.url || "/dashboard" }],
    };
  }
  if (context?.lessonTitle && context.lessonChallenge && has(text, "hint", "challenge", "practice task", "help with the task", "stuck on this")) {
    return {
      reply: `The challenge for **${context.lessonTitle}** is:\n\n> ${context.lessonChallenge}\n\n**First hint:** identify the input, the result you want, and the smallest step that connects them. Try that step first, then tell me what you see — I can guide you without taking the learning away.`,
      suggestions: ["Explain the key idea", "Show a small example", "Quiz me"],
      links: [{ label: "Back to lesson", href: context.url || "/dashboard" }],
    };
  }
  if (context?.lessonTitle && has(text, "this lesson", "the lesson", "this", "lesson", "explain", "summar", "recap")) {
    return {
      reply: `You're on **${context.lessonTitle}**${context.courseTitle ? ` (*${context.courseTitle}*)` : ""}.${context.lessonSummary ? `\n\n${context.lessonSummary}` : ""}\n\nTell me which part trips you up — I can explain the key idea, give an example, or help you work through the challenge step by step.`,
      suggestions: ["Explain the key idea", "Give me an example", "Quiz me on this lesson"],
      links: [{ label: "Back to lesson", href: context.url || "/dashboard" }],
    };
  }

  // 11. Fallback — always helpful, never a dead end
  return {
    reply: `Good question! I want to give you a solid answer — could you help me aim?\n\n- **A concept?** Try *\"Explain async/await\"* or *\"What is Big-O?\"*\n- **Your path?** Try *\"What should I learn first?\"*\n- **Stuck?** Paste your code + the error and I'll debug with you\n- **A quiz?** Just say *\"Quiz me on JavaScript\"*\n\nOr pick one below to get going. 👇`,
    suggestions: GREETING_SUGGESTIONS,
    links: [
      { label: "Browse courses", href: "/courses" },
      { label: "Contact a human", href: "/contact" },
    ],
  };
}
