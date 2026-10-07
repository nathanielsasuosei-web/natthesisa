import type { Course, CourseTone } from "./courses";
import { lesson, module } from "./lesson-builder";
import { DATA_STRUCTURES_ALGORITHMS_MODULES } from "@/content/data-structures-algorithms";
import { DATABASES_AND_SQL_MODULES } from "@/content/databases-and-sql";
import { SOFTWARE_ENGINEERING_PRACTICES_MODULES } from "@/content/software-engineering-practices";
import { SYSTEM_DESIGN_ARCHITECTURE_MODULES } from "@/content/system-design-architecture";
import { DEVOPS_AND_DELIVERY_MODULES } from "@/content/devops-and-delivery";
import { VIBE_CODING_SHIP_WITH_AI_MODULES } from "@/content/vibe-coding-ship-with-ai";
import { AI_APPS_AGENTS_AND_APIS_MODULES } from "@/content/ai-apps-agents-and-apis";

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
    modules: VIBE_CODING_SHIP_WITH_AI_MODULES,
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
    modules: AI_APPS_AGENTS_AND_APIS_MODULES,
  },];

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
