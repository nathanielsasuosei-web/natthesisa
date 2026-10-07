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
    keys: ["ai", "artificial intelligence", "machine learning", "llm", "prompt", "agent", "vibe cod"],
    title: "AI & vibe coding",
    body: "**Vibe coding = describing software to an AI and learning to read, review and fix what it writes.**\n\n- Be specific: goal, constraints, what \"done\" looks like\n- Review every line the AI produces — *you* ship it, *you* own it\n- When it breaks: paste the exact error, describe what you expected\n- The Vibe Coding program takes you from a first page in an hour to an AI assistant wired into your own data",
    followUp: ["Show Vibe Coding course", "Explain prompts", "Give me study tips"],
  },
];

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
  if (/\bai\b/.test(text) || has(text, "vibe", "agent", "prompt", "artificial intelligence", "machine learning")) {
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
        concept.title === "React" || concept.title === "useEffect"
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
                    : [{ label: "JavaScript course", href: "/courses/javascript-zero-to-builder" }],
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
