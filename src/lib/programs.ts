import type { Course, CourseTone } from "./courses";
import { lesson, module } from "./lesson-builder";
import { DATA_STRUCTURES_ALGORITHMS_MODULES } from "@/content/data-structures-algorithms";
import { DATABASES_AND_SQL_MODULES } from "@/content/databases-and-sql";
import { SOFTWARE_ENGINEERING_PRACTICES_MODULES } from "@/content/software-engineering-practices";
import { SYSTEM_DESIGN_ARCHITECTURE_MODULES } from "@/content/system-design-architecture";
import { DEVOPS_AND_DELIVERY_MODULES } from "@/content/devops-and-delivery";

/**
 * The six programs, and the courses under them.
 *
 * Every course in the catalog belongs to exactly one program (its `category`).
 * The core catalog in `courses.ts` already covers the fundamentals; this file
 * adds the courses that make Computer Science, Software Engineering and Vibe
 * Coding complete paths rather than single courses:
 *
 *   Computer Science     → essentials (core) + data structures + databases
 *   Software Engineering → practices + system design + devops
 *   Vibe Coding          → ship with AI + AI apps, agents & APIs
 *   Web Development      → foundations + JavaScript + React (core)
 *   App Development      → mobile apps with React Native (core)
 *   Backend              → backend development with Node.js (core)
 *
 * A program is what a student pays for: buying it opens every course and
 * every lesson under it, permanently. Nothing is free to sample — the course
 * pages describe what is inside, and the program price is the whole price.
 */

export interface ProgramInfo {
  id: string;
  /** Matches `Course["category"]`. */
  category: Course["category"];
  name: string;
  tagline: string;
  description: string;
  icon: "cpu" | "briefcase" | "spark" | "browser" | "mobile" | "server";
  tone: CourseTone;
  /**
   * Optional cover artwork, copied from `brandAssets` by hand so this module
   * stays free of app config. Set on the Vibe Coding program, whose courses
   * use it as their hero image.
   */
  cover?: string;
}

export const PROGRAMS: ProgramInfo[] = [
  {
    id: "computer-science",
    category: "Computer Science",
    name: "Computer Science",
    tagline: "Understand the machine, not just the syntax",
    description:
      "How computers store and move data, how fast an algorithm is, and how to ask a database real questions. These are the ideas that outlive any framework.",
    icon: "cpu",
    tone: "orange",
  },
  {
    id: "software-engineering",
    category: "Software Engineering",
    name: "Software Engineering",
    tagline: "Build with other people, ship without fear",
    description:
      "Version control that actually helps, code review, testing, CI, system design and running what you shipped. The difference between writing code and engineering software.",
    icon: "briefcase",
    tone: "blue",
  },
  {
    id: "vibe-coding",
    category: "Vibe Coding",
    name: "Vibe Coding",
    tagline: "Describe it, build it, understand it",
    description:
      "Build real software by talking to an AI — and learn to read, review and fix what it writes. From a first page in an hour to an AI assistant wired into your own data.",
    icon: "spark",
    tone: "pink",
    cover: "/branding/vibe-coding.jpg",
  },
  {
    id: "web-development",
    category: "Web Development",
    name: "Web Development",
    tagline: "From a first page to a production app",
    description:
      "How the web works, JavaScript from zero, and React apps built the way teams build them. The complete path from opening a file to shipping a site.",
    icon: "browser",
    tone: "violet",
  },
  {
    id: "app-development",
    category: "App Development",
    name: "App Development",
    tagline: "One codebase, every phone",
    description:
      "Build a real cross-platform mobile app with React Native: native layouts, navigation, device storage and the mobile UX details users feel.",
    icon: "mobile",
    tone: "cyan",
  },
  {
    id: "backend",
    category: "Backend",
    name: "Backend",
    tagline: "The half of the app nobody sees",
    description:
      "Design secure APIs with Node.js, model application data, add authentication, and test and deploy a service the front end can trust.",
    icon: "server",
    tone: "green",
  },
];

export const PROGRAM_COURSES: Course[] = [
  {
    id: "data-structures-algorithms",
    cover: "/course-covers/data-structures-algorithms.jpg",
    slug: "data-structures-algorithms",
    title: "Data Structures & Algorithms",
    shortTitle: "DSA",
    description:
      "Choose the right structure for the job and reason about how fast your code runs — the ideas behind every technical interview and every slow bug.",
    category: "Computer Science",
    level: "Intermediate",
    tone: "cyan",
    icon: "cpu",
    instructor: { name: "Kwame Mensah", role: "Staff Engineer", initials: "KM" },
    rating: 4.8,
    learners: 1_960,
    project: "A route planner that finds the fastest path through a small map",
    outcomes: [
      "Measure cost with Big-O",
      "Pick between arrays, maps, stacks and queues",
      "Write and reason about recursion",
      "Search, sort and traverse without brute force",
    ],
    tags: ["Algorithms", "Big-O", "Interview prep"],
    modules: DATA_STRUCTURES_ALGORITHMS_MODULES,
  },
  {
    id: "databases-and-sql",
    cover: "/course-covers/databases-sql.jpg",
    slug: "databases-and-sql",
    title: "Databases & SQL",
    shortTitle: "Databases & SQL",
    description:
      "Store data so it stays correct, then ask it questions: keys, joins, indexes and transactions — the SQL every product is built on.",
    category: "Computer Science",
    level: "Beginner",
    tone: "green",
    icon: "server",
    instructor: { name: "Ama Boateng", role: "Data Engineer", initials: "AB" },
    rating: 4.9,
    learners: 2_310,
    project: "A school database that answers real report questions in one query",
    outcomes: [
      "Design tables with keys and constraints",
      "Query with SELECT, WHERE, ORDER BY",
      "Join tables and aggregate results",
      "Use indexes and transactions correctly",
    ],
    tags: ["SQL", "PostgreSQL", "Data modelling"],
    modules: DATABASES_AND_SQL_MODULES,
  },
  {
    id: "software-engineering-practices",
    cover: "/course-covers/software-engineering-practices.jpg",
    slug: "software-engineering-practices",
    title: "Software Engineering Practices",
    shortTitle: "SE Practices",
    description:
      "Work in a team on real code: branches and pull requests, review that improves the code, tests that earn their keep and a pipeline that ships for you.",
    category: "Software Engineering",
    level: "Beginner",
    tone: "violet",
    icon: "briefcase",
    instructor: { name: "Selina Adjei", role: "Engineering Lead", initials: "SA" },
    rating: 4.8,
    learners: 1_740,
    project: "Take a messy folder project to reviewed, tested and automatically shipped",
    outcomes: [
      "Use branches and pull requests confidently",
      "Give and receive useful code review",
      "Write tests that catch real bugs",
      "Set up a pipeline that runs on every push",
    ],
    tags: ["Git", "Testing", "CI"],
    modules: SOFTWARE_ENGINEERING_PRACTICES_MODULES,
  },
  {
    id: "system-design-architecture",
    cover: "/course-covers/system-design-architecture.jpg",
    slug: "system-design-architecture",
    title: "System Design & Architecture",
    shortTitle: "System Design",
    description:
      "How real systems are put together: APIs and data models, caches and queues, failure, security and the trade-offs you must be able to defend.",
    category: "Software Engineering",
    level: "Intermediate",
    tone: "blue",
    icon: "layers",
    instructor: { name: "Yaw Darko", role: "Principal Engineer", initials: "YD" },
    rating: 4.9,
    learners: 1_280,
    project: "Design a ticket-booking system and defend every choice in a written decision record",
    outcomes: [
      "Sketch a system from requirements",
      "Choose between caches, queues and read models",
      "Design for failure instead of hoping",
      "Write an architecture decision record",
    ],
    tags: ["Architecture", "Scalability", "APIs"],
    modules: SYSTEM_DESIGN_ARCHITECTURE_MODULES,
  },
  {
    id: "devops-and-delivery",
    slug: "devops-and-delivery",
    title: "DevOps & Delivery",
    shortTitle: "DevOps",
    description:
      "Get code from your laptop to real users safely: environments and config, containers, pipelines, monitoring, backups and rollbacks.",
    category: "Software Engineering",
    level: "Intermediate",
    tone: "orange",
    icon: "terminal",
    instructor: { name: "Nana Aidoo", role: "Platform Engineer", initials: "NA" },
    rating: 4.7,
    learners: 1_150,
    project: "A one-command deploy with rollback and a dashboard that tells you when it breaks",
    outcomes: [
      "Keep environments and secrets honest",
      "Containerise an app reproducibly",
      "Automate deploy and rollback",
      "Monitor, back up and recover",
    ],
    tags: ["Docker", "CI/CD", "Observability"],
    modules: DEVOPS_AND_DELIVERY_MODULES,
  },
  {
    id: "vibe-coding-ship-with-ai",
    slug: "vibe-coding-ship-with-ai",
    title: "Vibe Coding: Ship with AI",
    shortTitle: "Vibe Coding",
    description:
      "Build working software by describing it — then learn to read, review and fix what the AI writes, so the project stays yours to change.",
    category: "Vibe Coding",
    level: "Beginner",
    tone: "pink",
    icon: "spark",
    instructor: { name: "Efua Sarpong", role: "Product Engineer", initials: "ES" },
    rating: 4.9,
    learners: 3_120,
    featured: true,
    project: "A small app you built by conversation — deployed, and understood line by line",
    outcomes: [
      "Run the describe → review → iterate loop",
      "Write prompts that produce working code",
      "Read unfamiliar code well enough to fix it",
      "Ship and share a real app in a weekend",
    ],
    tags: ["AI", "Prompting", "Shipping"],
    modules: [
      module("the-loop", "01 · The vibe coding loop", "How to drive an AI without losing the thread of your own project.", [
        lesson(
          "what-vibe-coding-is",
          "What vibe coding actually is",
          18,
          "Vibe coding is writing software by describing what you want and reviewing what comes back. It is fast because the AI types; it works because you decide.",
          "The loop is: describe one thing, run it, read the diff, keep or reject, then repeat. Small steps keep the code reviewable — a giant prompt produces a giant change nobody can check.",
          "1. Describe ONE change, with the file and the expected behaviour\n2. Let the AI write it\n3. Run it and look at the result\n4. Read the diff: does it do exactly this, and nothing more?\n5. Commit. Then describe the next thing.",
          "Write the description of a single small feature you want, as if briefing a developer. Then get the AI to build only that.",
          true
        ),
        lesson(
          "prompting-for-code",
          "Prompts that produce working code",
          24,
          "A good prompt is a tiny spec: the goal, the constraints, the shape of the data and how you will know it works.",
          "Name the stack and the file, give the inputs and outputs, state what must not change, and ask for the smallest diff. When the answer is wrong, add the missing constraint instead of rewriting the whole prompt.",
          "Goal: a route that lists a student's purchases.\nStack: Next.js App Router, TypeScript, no new dependencies.\nInput: the signed-in user.\nOutput: { purchases: [{ kind, refId, amount, at }] }.\nMust not: touch the database schema or add a package.\nDone when: it typechecks and returns [] for a new account.",
          "Take a prompt you already sent and rewrite it with goal, constraints, data shape and done-when."
        ),
        lesson(
          "reading-ai-code",
          "Reading code you did not write",
          26,
          "The skill that separates a vibe coder from a passenger is reading: find the data, follow the flow, spot the edge case the AI forgot.",
          "Read the diff, not the chat. Ask where the data comes from, what happens on empty and on error, and what the code assumes about the caller. If you cannot explain a line, that is the line to change.",
          "// Generated code often skips the boring case:\nconst total = purchases.reduce((sum, p) => sum + p.amount, 0);\n\n// Ask yourself: purchases can be undefined for a new account,\n// and amounts can be strings from JSON. Both are real bugs.\nconst total = (purchases ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);",
          "Ask the AI for a function, then write down every assumption it made. Fix the one that would break first."
        ),
      ]),
      module("ship-it", "02 · Ship something small", "From an empty folder to a link you can send someone.", [
        lesson(
          "build-a-page-in-an-hour",
          "Build a working page in an hour",
          24,
          "One page, real data, styled and deployed. The point is the loop, not the size of the project.",
          "Start from a template that already runs, keep state in one place, and let the AI do the styling passes after the behaviour works. Deploy early — a URL changes how you judge your own work.",
          "// First: make it work\nconst [items, setItems] = useState<string[]>([]);\n\n// Then: make it nicer — a separate prompt, a separate commit\n<div className=\"grid gap-3 sm:grid-cols-2\">\n  {items.map((item) => <Card key={item}>{item}</Card>)}\n</div>",
          "Build and deploy a one-page app today: an input, a list, and a button that adds to it."
        ),
        lesson(
          "iterate-and-debug",
          "Iterating and debugging with AI",
          24,
          "When something breaks, the AI needs evidence, not adjectives. Paste the error, the input and what you expected.",
          "Reproduce first, then give the smallest failing case. Ask for one hypothesis at a time, and make it explain the cause before it writes the fix — otherwise you get a patch over a bug.",
          "It fails on this exact input:\n  join([], \"-\")  ->  expected \"\", got undefined\n\nThe error: TypeError: Cannot read properties of undefined\n\nExplain the cause before changing anything, then give me the smallest fix.",
          "Take a real bug, write the smallest failing case, and ask for the cause before the fix. Note what the first fix got wrong."
        ),
        lesson(
          "polish-and-publish",
          "Polish, publish, and keep it alive",
          22,
          "Shipping is a checklist, not a feeling: empty states, error messages, a title, a favicon, and a way to see when it breaks.",
          "Handle the states a demo never shows — loading, empty and error. Write a README with how to run it, add a health check, and tag the commit you deployed so you can go back.",
          "Loading → skeletons, not a spinner forever\nEmpty   → \"No projects yet. Create your first one.\"\nError   → \"That did not save. Try again.\" + a retry button\nREADME  → what it is, how to run it, how it deploys",
          "Go through your app and add the empty and error states for every list and form."
        ),
      ]),
    ],
  },

  {
    id: "ai-apps-agents-and-apis",
    slug: "ai-apps-agents-and-apis",
    title: "AI Apps, Agents & APIs",
    shortTitle: "AI Apps & Agents",
    description:
      "Wire a model into a real product: prompts as product surface, your own data with retrieval, tools and agents, evals, cost control and safety.",
    category: "Vibe Coding",
    level: "Intermediate",
    tone: "cyan",
    icon: "cpu",
    instructor: { name: "Kojo Asante", role: "AI Engineer", initials: "KA" },
    rating: 4.7,
    learners: 980,
    project: "A support assistant that answers from your own documents, with a cost ceiling",
    outcomes: [
      "Call a model API safely from your backend",
      "Ground answers in your own documents",
      "Give an agent tools without giving it the keys",
      "Measure quality, latency and cost",
    ],
    tags: ["LLMs", "RAG", "Agents"],
    modules: [
      module("wiring-ai-in", "01 · Wiring AI into an app", "The API call, the prompt and your own data.", [
        lesson(
          "calling-a-model-api",
          "Calling a model from your server",
          24,
          "The model call belongs on the server, behind your own API, where the key lives and where you can log, limit and cache it.",
          "Send a system prompt, the message history and a token limit. Always set a timeout, always handle a refusal or an empty answer, and never put the provider key in the browser.",
          "const res = await fetch(\"https://api.provider.com/v1/chat\", {\n  method: \"POST\",\n  headers: { \"content-type\": \"application/json\", authorization: `Bearer ${process.env.AI_KEY}` },\n  body: JSON.stringify({\n    model: \"small-and-fast\",\n    max_tokens: 400,\n    messages: [\n      { role: \"system\", content: \"Answer only from the notes provided.\" },\n      { role: \"user\", content: question },\n    ],\n  }),\n  signal: AbortSignal.timeout(20_000),\n});",
          "Add a server route that asks a model one question and returns its answer. Log the tokens used.",
          true
        ),
        lesson(
          "prompts-as-product",
          "The prompt is product surface",
          24,
          "A prompt is not a string in a file — it is behaviour your users feel. Treat it like code: versioned, reviewed and tested.",
          "Put the instructions, the tone and the refusal rule in one place. Say what to do when it does not know, keep the output shape stable, and change it with a test that shows the difference.",
          "You are the support assistant for codemasterghana.\nAnswer in at most three sentences, in plain English.\nUse ONLY the notes below. If the notes do not contain the\nanswer, reply exactly: \"I will pass this to a human.\"\n\nNotes:\n{{retrieved}}",
          "Write your system prompt with an explicit refusal rule, then try three questions it should refuse."
        ),
        lesson(
          "context-and-rag",
          "Your own data: retrieval (RAG)",
          28,
          "Models do not know your product. Retrieval finds the few paragraphs that matter and puts them in the prompt, so answers are grounded in your documents.",
          "Split documents into overlapping chunks, embed them, store the vectors, then search for the closest chunks to the question and pass those as context. Return citations so the user can check.",
          "const chunks = splitIntoChunks(document, { size: 800, overlap: 120 });\nfor (const chunk of chunks) {\n  await store.save({ text: chunk, vector: await embed(chunk), source: document.id });\n}\n\nconst hits = await store.search(await embed(question), { top: 5 });\nconst answer = await askModel(question, hits.map((h) => h.text).join(\"\\n---\\n\"));\nanswer.sources = hits.map((h) => h.source);",
          "Index five of your own pages and ask a question whose answer appears in only one of them."
        ),
      ]),
      module("agents-and-guardrails", "02 · Agents and guardrails", "Tools, evals, cost and the safety rules that let you ship.", [
        lesson(
          "tools-and-agents",
          "Tools and agents",
          26,
          "An agent is a model that can call your functions: look up an order, create a ticket, send a receipt. The power and the risk are the same thing.",
          "Expose narrow, well-named tools with validated arguments. The model proposes a call; your code decides whether to run it — permissions, limits and confirmations stay on your side.",
          "const tools = {\n  lookupOrder: {\n    description: \"Find an order by its reference.\",\n    run: async ({ reference }) => orders.findByRef(String(reference)),\n  },\n};\n\n// The model asks, the server authorises:\nif (call.name === \"lookupOrder\" && !canReadOrders(session.user)) {\n  return refuse(\"Not allowed to read orders.\");\n}",
          "Give your assistant one read-only tool and one write tool. Write down who is allowed to trigger the write."
        ),
        lesson(
          "evals-and-cost",
          "Evals, latency and cost",
          24,
          "You cannot improve what you do not measure. A small set of real questions, scored automatically, is worth more than any demo.",
          "Keep a test set of questions with expected answers or rubrics, run it on every prompt change, and record tokens, latency and failures. Cap the spend per user and per day.",
          "const suite = [\n  { q: \"How do I buy a program?\", must: [\"Programs\", \"Billing\"] },\n  { q: \"Who is the president of Ghana?\", mustRefuse: true },\n];\n\nfor (const test of suite) {\n  const { answer, tokens, ms } = await run(test.q);\n  report({ ...test, answer, tokens, ms, pass: check(test, answer) });\n}",
          "Build a five-question suite for your assistant and record the pass rate, average latency and tokens per answer."
        ),
        lesson(
          "safety-and-ship",
          "Safety, privacy and shipping",
          24,
          "Shipping AI means deciding what it may never see, say or do — and making those decisions in code, not in the prompt alone.",
          "Sent prompts and outputs are data: keep personal details out, tell users they are talking to an AI, keep a human path for anything that matters, and log enough to investigate without storing more than you need.",
          "Rules the code enforces, not just the prompt:\n- strip emails, phones and card numbers before the call\n- refuse medical, legal and financial advice\n- \"Talk to a human\" button on every answer\n- keep a 30-day log of prompts and citations, no raw PII",
          "Write your assistant's data rules: what it may receive, what it must never store, and how a user reaches a human."
        ),
      ]),
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

/** Every program by its id (`computer-science`, `web-development`, …). */
export function getProgram(programId: string): ProgramInfo | undefined {
  return PROGRAMS.find((program) => program.id === programId);
}

/**
 * The program a course belongs to, via its category. Every category in the
 * catalog has a program — a course without one is a content bug, and the
 * access gate treats it as locked rather than open.
 */
export function programForCategory(category: Course["category"]): ProgramInfo | undefined {
  return PROGRAMS.find((program) => program.category === category);
}
