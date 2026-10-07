import { lesson } from "./lesson-builder";
import { PROGRAMS, PROGRAM_COURSES } from "./programs";
import { WEB_FOUNDATIONS_MODULES } from "@/content/web-foundations";
import { COMPUTER_SCIENCE_ESSENTIALS_MODULES } from "@/content/computer-science-essentials";
import { JAVASCRIPT_ZERO_TO_BUILDER_MODULES } from "@/content/javascript-zero-to-builder";
import { REACT_PRODUCTION_APPS_MODULES } from "@/content/react-production-apps";
import { MOBILE_APPS_REACT_NATIVE_MODULES } from "@/content/mobile-apps-react-native";

export type CourseCategory =
  | "Computer Science"
  | "Software Engineering"
  | "Vibe Coding"
  | "Web Development"
  | "App Development"
  | "Backend";
export type CourseLevel = "Beginner" | "Intermediate";
export type CourseTone = "violet" | "orange" | "cyan" | "green" | "pink" | "blue";

/**
 * What a section *is*, which decides how the reader draws it. Catalog lessons
 * use the whole set; a lesson published from the owner console is plain prose
 * plus code, and renders as `paragraph`.
 */
export type SectionKind =
  | "paragraph"
  | "definition"
  | "example"
  | "note"
  | "warning"
  | "table"
  | "exercise";

export interface LessonSection {
  heading: string;
  body: string;
  kind?: SectionKind;
  code?: string;
  language?: string;
  /** Caption printed above a code block ("Output", "Trace of the loop", …). */
  codeLabel?: string;
  /** Rows of a `table` section. The first row is the header. */
  rows?: string[][];
  /** Numbered steps of an `exercise` section. */
  items?: string[];
}

export interface LessonFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  kind: "video" | "pdf" | "slides" | "image" | "other";
  uploadedAt: string;
  /** URL the learner opens to stream, view or download the file. */
  href: string;
  /** Video edits made by the owner in the console. */
  trimStart?: number;
  trimEnd?: number | null;
  muted?: boolean;
  /** Thumbnail captured by the owner, served from the poster route. */
  poster?: string | null;
  /** True when the owner edited this file after uploading it. */
  edited?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  /** Reading time in minutes, derived from the lesson's own word count. */
  duration: number;
  summary: string;
  objectives: string[];
  sections: LessonSection[];
  challenge: string;
  /** "You should now be able to…" — the lesson's own summary statements. */
  keyPoints?: string[];
  /** The exercise set that closes a textbook lesson. */
  exercises?: string[];
  preview?: boolean;
  /** "owner" marks a lesson published from the owner console. */
  source?: "catalog" | "owner";
  /** Materials attached by the owner (video, PDF, slides, images). */
  files?: LessonFile[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  tone: CourseTone;
  icon: "browser" | "braces" | "react" | "mobile" | "nodes" | "server" | "layers" | "terminal" | "cpu" | "briefcase" | "spark";
  instructor: { name: string; role: string; initials: string };
  rating: number;
  learners: number;
  featured?: boolean;
  project: string;
  outcomes: string[];
  tags: string[];
  modules: CourseModule[];
  /**
   * Optional hero artwork for the course page. Filled in from the course's
   * program (`PROGRAMS`), so it is not written twice.
   */
  cover?: string;
}

const CORE_COURSES: Course[] = [
  {
    id: "web-foundations",
    cover: "/course-covers/web-development-foundations.jpg",
    slug: "web-foundations",
    title: "Web Development Foundations",
    shortTitle: "Web Foundations",
    description:
      "Learn how the web works, then build and publish a responsive multi-section website with HTML and modern CSS.",
    category: "Web Development",
    level: "Beginner",
    tone: "violet",
    icon: "browser",
    instructor: { name: "Maya Owusu", role: "Frontend Engineer", initials: "MO" },
    rating: 4.9,
    learners: 2_840,
    featured: true,
    project: "A responsive personal portfolio website",
    outcomes: [
      "Write semantic, accessible HTML",
      "Style layouts with Flexbox and Grid",
      "Build for mobile, tablet and desktop",
      "Publish a website to the internet",
    ],
    tags: ["HTML", "CSS", "Responsive design"],
    modules: WEB_FOUNDATIONS_MODULES,
  },
  {
    id: "computer-science-essentials",
    cover: "/course-covers/computer-science-essentials.jpg",
    slug: "computer-science-essentials",
    title: "Computer Science Essentials",
    shortTitle: "CS Essentials",
    description:
      "Build the mental models behind software: data, logic, memory, algorithms, networks and the trade-offs engineers make.",
    category: "Computer Science",
    level: "Beginner",
    tone: "orange",
    icon: "nodes",
    instructor: { name: "Daniel Kumi", role: "Computer Science Educator", initials: "DK" },
    rating: 4.8,
    learners: 1_960,
    featured: true,
    project: "A visual algorithm explorer",
    outcomes: [
      "Reason about data and binary representation",
      "Break problems into precise algorithms",
      "Compare common data structures",
      "Explain memory, networks and operating systems",
    ],
    tags: ["Algorithms", "Data", "Systems"],
    modules: COMPUTER_SCIENCE_ESSENTIALS_MODULES,
  },
  {
    id: "javascript-zero-to-builder",
    cover: "/course-covers/javascript-zero-to-builder.jpg",
    slug: "javascript-zero-to-builder",
    title: "JavaScript: Zero to Builder",
    shortTitle: "JavaScript",
    description:
      "Go from variables and functions to asynchronous APIs while building an interactive task-planning application.",
    category: "Web Development",
    level: "Beginner",
    tone: "cyan",
    icon: "braces",
    instructor: { name: "Elena Park", role: "Full-stack Developer", initials: "EP" },
    rating: 4.9,
    learners: 3_420,
    featured: true,
    project: "A smart task planner using a public API",
    outcomes: [
      "Write clear JavaScript with functions and objects",
      "Update interfaces through the DOM",
      "Fetch and handle remote data",
      "Debug common runtime problems",
    ],
    tags: ["JavaScript", "DOM", "APIs"],
    modules: JAVASCRIPT_ZERO_TO_BUILDER_MODULES,
  },
  {
    id: "react-production-apps",
    cover: "/course-covers/react-production-apps.jpg",
    slug: "react-production-apps",
    title: "Build Production Apps with React",
    shortTitle: "React Apps",
    description:
      "Master components, state, data fetching and application structure by building a polished analytics dashboard.",
    category: "Web Development",
    level: "Intermediate",
    tone: "blue",
    icon: "react",
    instructor: { name: "Noah Mensah", role: "Product Engineer", initials: "NM" },
    rating: 4.8,
    learners: 1_780,
    project: "A responsive SaaS analytics dashboard",
    outcomes: [
      "Design reusable component APIs",
      "Manage local and shared state",
      "Load server data safely",
      "Structure and ship a complete React app",
    ],
    tags: ["React", "State", "Architecture"],
    modules: REACT_PRODUCTION_APPS_MODULES,
  },
  {
    id: "mobile-apps-react-native",
    cover: "/course-covers/mobile-apps-react-native.jpg",
    slug: "mobile-apps-react-native",
    title: "Mobile Apps with React Native",
    shortTitle: "Mobile Apps",
    description:
      "Build a cross-platform habit tracker while learning native layouts, navigation, device storage and mobile UX.",
    category: "App Development",
    level: "Intermediate",
    tone: "pink",
    icon: "mobile",
    instructor: { name: "Sofia Adeyemi", role: "Mobile Engineer", initials: "SA" },
    rating: 4.9,
    learners: 1_240,
    project: "A cross-platform habit tracking app",
    outcomes: [
      "Build native screens with React Native",
      "Create stack and tab navigation",
      "Store data safely on a device",
      "Prepare an app for release",
    ],
    tags: ["React Native", "Expo", "Mobile UX"],
    modules: MOBILE_APPS_REACT_NATIVE_MODULES,
  },
  {
    id: "backend-node-apis",
    cover: "/course-covers/backend-node-apis.jpg",
    slug: "backend-node-apis",
    title: "Backend Development with Node.js",
    shortTitle: "Node.js Backend",
    description:
      "Design secure APIs, model application data and connect a real backend to the interfaces you build.",
    category: "Backend",
    level: "Intermediate",
    tone: "green",
    icon: "server",
    instructor: { name: "Ibrahim Cole", role: "Backend Engineer", initials: "IC" },
    rating: 4.8,
    learners: 1_510,
    project: "A tested course-platform REST API",
    outcomes: [
      "Design clear HTTP APIs",
      "Model relational application data",
      "Implement authentication and authorization",
      "Test and deploy a Node.js service",
    ],
    tags: ["Node.js", "APIs", "Databases"],
    modules: [
      {
        id: "api-foundations",
        title: "01 · API foundations",
        description: "Build predictable boundaries between clients and servers.",
        lessons: [
          lesson(
            "server-runtime",
            "Node.js & the server runtime",
            18,
            "Use JavaScript outside the browser and understand the event-driven runtime behind it.",
            "Node.js runs JavaScript with operating-system APIs for files, processes and networking. Its event loop is effective for many concurrent I/O tasks when code avoids blocking work.",
            "import http from \"node:http\";\n\nhttp.createServer((req, res) => {\n  res.end(\"API is healthy\");\n}).listen(3000);",
            "Create a server with a /health endpoint that returns JSON.",
            true
          ),
          lesson(
            "http-rest",
            "HTTP & RESTful routes",
            27,
            "Design resource-based routes with meaningful methods, statuses and response shapes.",
            "GET reads, POST creates, PATCH changes and DELETE removes. Status codes communicate the result. Consistent errors help every client recover predictably.",
            "GET    /api/courses\nPOST   /api/courses\nGET    /api/courses/:id\nPATCH  /api/courses/:id",
            "Design the routes and response statuses for enrollment and lesson completion."
          ),
          lesson(
            "validation-errors",
            "Validation & error handling",
            25,
            "Treat all external input as untrusted and turn failures into useful responses.",
            "Validate shape, type, range and permissions at the server boundary. Keep internal error detail out of public responses, but log enough context to investigate.",
            "if (typeof body.title !== \"string\" || !body.title.trim()) {\n  return Response.json({ error: \"Title is required\" }, { status: 400 });\n}",
            "Add validation for an account payload with name, email and weekly goal."
          ),
        ],
      },
      {
        id: "data-and-security",
        title: "02 · Data & security",
        description: "Persist trustworthy data and protect each operation.",
        lessons: [
          lesson(
            "database-modeling",
            "Database modeling",
            31,
            "Turn product rules into tables, relationships, constraints and useful indexes.",
            "Give each entity a stable key, normalize facts that update independently and enforce rules with constraints. Add indexes for frequent lookup paths, not every column.",
            "users 1 ─── * enrollments * ─── 1 courses\nusers 1 ─── * lesson_progress * ─── 1 lessons",
            "Model users, courses, lessons, purchases and progress with keys and relationships."
          ),
          lesson(
            "auth-permissions",
            "Authentication & permissions",
            32,
            "Know who is making a request, then verify what that person is allowed to do.",
            "Authentication establishes identity; authorization checks permission for the exact resource and action. Hash passwords with a dedicated slow algorithm and keep session cookies httpOnly and secure.",
            "const user = await requireSession(request);\nif (course.ownerId !== user.id && user.role !== \"admin\") {\n  return new Response(\"Forbidden\", { status: 403 });\n}",
            "Write an authorization matrix for learners, instructors and administrators."
          ),
          lesson(
            "test-deploy-api",
            "Test & deploy the API",
            35,
            "Prove important behavior automatically and prepare the service for real traffic.",
            "Test outcomes at the public boundary: status, response and database effect. Use environment variables for secrets, health checks for operations and structured logs for investigation.",
            "test(\"blocks a learner from admin data\", async () => {\n  const response = await requestAs(learner).get(\"/api/owner/users\");\n  expect(response.status).toBe(403);\n});",
            "Write integration tests for successful completion, locked course access and suspended accounts."
          ),
        ],
      },
    ],
  },
];

/**
 * The catalog: the six core courses, then the program courses.
 *
 * Every course sits under one program (its category), and each program can
 * have several courses — see `PROGRAMS` in `programs.ts`.
 */
export const COURSES: Course[] = [...CORE_COURSES, ...PROGRAM_COURSES].map((course) => {
  // A course inherits its program's cover unless it brings its own.
  const program = PROGRAMS.find((item) => item.category === course.category);
  return program?.cover && !course.cover ? { ...course, cover: program.cover } : course;
});

export const CATEGORIES: Array<"All" | CourseCategory> = [
  "All",
  "Computer Science",
  "Software Engineering",
  "Vibe Coding",
  "Web Development",
  "App Development",
  "Backend",
];

export function getCourse(idOrSlug: string): Course | undefined {
  return COURSES.find((course) => course.id === idOrSlug || course.slug === idOrSlug);
}

export function getCourseLessons(course: Course): Lesson[] {
  return course.modules.flatMap((module) => module.lessons);
}

export function getLesson(course: Course, lessonId: string): Lesson | undefined {
  return getCourseLessons(course).find((item) => item.id === lessonId);
}

export function getCourseMinutes(course: Course): number {
  return getCourseLessons(course).reduce((total, item) => total + item.duration, 0);
}

/**
 * Whether a lesson is a free preview — open to any signed-in student without
 * a pass or a purchase. The full access rule (pass + purchase) lives in
 * `access.ts`, which needs the account; this stays a fact about the content,
 * so client components can render it without the database.
 */
export function isPreview(lesson: Lesson): boolean {
  return lesson.preview === true;
}

export function coursePercent(course: Course, completedLessonIds: string[] = []): number {
  const total = getCourseLessons(course).length;
  if (!total) return 0;
  return Math.round((completedLessonIds.filter((id) => getLesson(course, id)).length / total) * 100);
}
