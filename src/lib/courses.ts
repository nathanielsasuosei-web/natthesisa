import type { PlanId } from "./plans";
import { PLAN_TIER } from "./plans";

export type CourseCategory = "Web Development" | "App Development" | "Computer Science" | "Backend";
export type CourseLevel = "Beginner" | "Intermediate";
export type CourseTone = "violet" | "orange" | "cyan" | "green" | "pink" | "blue";

export interface LessonSection {
  heading: string;
  body: string;
  code?: string;
  language?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  summary: string;
  objectives: string[];
  sections: LessonSection[];
  challenge: string;
  preview?: boolean;
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
  icon: "browser" | "braces" | "react" | "mobile" | "nodes" | "server";
  requiredPlan: PlanId;
  instructor: { name: string; role: string; initials: string };
  rating: number;
  learners: number;
  featured?: boolean;
  project: string;
  outcomes: string[];
  tags: string[];
  modules: CourseModule[];
}

function lesson(
  id: string,
  title: string,
  duration: number,
  summary: string,
  concept: string,
  code: string | undefined,
  challenge: string,
  preview = false
): Lesson {
  return {
    id,
    title,
    duration,
    summary,
    preview,
    objectives: [
      `Explain the purpose of ${title.toLowerCase()}`,
      "Apply the idea in a small working example",
      "Recognize the pattern in a real project",
    ],
    sections: [
      {
        heading: "Start with the idea",
        body: summary,
      },
      {
        heading: "How it works",
        body: concept,
        code,
        language: code ? "code" : undefined,
      },
    ],
    challenge,
  };
}

export const COURSES: Course[] = [
  {
    id: "web-foundations",
    slug: "web-foundations",
    title: "Web Development Foundations",
    shortTitle: "Web Foundations",
    description:
      "Learn how the web works, then build and publish a responsive multi-section website with HTML and modern CSS.",
    category: "Web Development",
    level: "Beginner",
    tone: "violet",
    icon: "browser",
    requiredPlan: "free",
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
    modules: [
      {
        id: "web-under-the-hood",
        title: "01 · The web under the hood",
        description: "Understand the browser before you build for it.",
        lessons: [
          lesson(
            "how-the-web-works",
            "How the web works",
            12,
            "Every website begins with a conversation between a browser and a server. You will follow one request from a typed URL to pixels on a screen.",
            "A URL identifies a resource. DNS finds the server, HTTPS carries the request, and the server returns files such as HTML, CSS and JavaScript. The browser parses those files and paints the page.",
            "Browser  →  HTTPS request  →  Web server\nBrowser  ←  HTML + CSS + JS  ←  Web server",
            "Open the Network panel on any website and identify its first document request.",
            true
          ),
          lesson(
            "html-document",
            "Your first HTML document",
            18,
            "HTML gives content meaning. Build a valid document and learn what the browser does with each element.",
            "A page has one document type, an html root, metadata inside head, and visible content inside body. Semantic tags describe purpose rather than appearance.",
            "<!doctype html>\n<html lang=\"en\">\n  <head><title>My first page</title></head>\n  <body>\n    <h1>Hello, web!</h1>\n    <p>I built this with HTML.</p>\n  </body>\n</html>",
            "Create a page with one heading, two paragraphs and a link to a site you use often."
          ),
          lesson(
            "semantic-accessible-html",
            "Semantic & accessible HTML",
            20,
            "Good structure helps people, browsers and search engines understand your page.",
            "Use landmarks such as header, nav, main and footer. Pair every form input with a label, keep headings in order, and write useful alternative text for meaningful images.",
            "<main>\n  <article>\n    <h1>Learning in public</h1>\n    <p>Small projects create visible progress.</p>\n  </article>\n</main>",
            "Replace the generic div elements in a sample page with at least four semantic elements."
          ),
        ],
      },
      {
        id: "style-the-page",
        title: "02 · Style the page",
        description: "Turn structured content into a polished interface.",
        lessons: [
          lesson(
            "css-foundations",
            "CSS foundations",
            22,
            "Use selectors, properties and values to control how HTML looks and responds.",
            "The cascade combines browser defaults, inherited values, selector specificity and source order. Start with simple class selectors and let layout rules do most of the work.",
            ".hero {\n  padding: 4rem 1.5rem;\n  background: #f4f1ff;\n  color: #17151f;\n}\n\n.hero__title {\n  max-width: 12ch;\n  font-size: clamp(2.5rem, 8vw, 5rem);\n}",
            "Create a reusable card class with spacing, a border, rounded corners and a subtle shadow."
          ),
          lesson(
            "flexbox-grid",
            "Layouts with Flexbox & Grid",
            26,
            "Stop positioning elements by guesswork. Use two layout systems designed for interfaces.",
            "Flexbox arranges items along one main axis and is ideal for nav bars and rows. Grid controls rows and columns together and is ideal for page sections and card collections.",
            ".card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 1.25rem;\n}",
            "Build a card grid that shows one column on small screens and three when space allows."
          ),
          lesson(
            "responsive-design",
            "Responsive design",
            24,
            "Make one interface feel intentional on phones, tablets and large screens.",
            "Start with a fluid mobile layout, use flexible units, and add a breakpoint only when the content needs it. Test narrow widths and keyboard zoom—not just popular device presets.",
            "@media (min-width: 48rem) {\n  .hero {\n    display: grid;\n    grid-template-columns: 1.2fr 1fr;\n    align-items: center;\n  }\n}",
            "Audit your project at 320px, 768px and 1280px. Fix every horizontal scrollbar."
          ),
          lesson(
            "publish-portfolio",
            "Ship your portfolio",
            28,
            "Combine the course skills, check quality and put your work online.",
            "A useful launch checklist covers content, responsive layout, keyboard navigation, page metadata, image sizes and broken links. Shipping creates feedback you cannot get from a local file.",
            "git add .\ngit commit -m \"ship portfolio v1\"\ngit push origin main",
            "Publish your portfolio and ask one person to complete a task on it without your help."
          ),
        ],
      },
    ],
  },
  {
    id: "computer-science-essentials",
    slug: "computer-science-essentials",
    title: "Computer Science Essentials",
    shortTitle: "CS Essentials",
    description:
      "Build the mental models behind software: data, logic, memory, algorithms, networks and the trade-offs engineers make.",
    category: "Computer Science",
    level: "Beginner",
    tone: "orange",
    icon: "nodes",
    requiredPlan: "free",
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
    modules: [
      {
        id: "computational-thinking",
        title: "01 · Computational thinking",
        description: "Learn to describe problems so a computer can solve them.",
        lessons: [
          lesson(
            "what-computers-do",
            "What computers actually do",
            14,
            "Behind every app, a computer repeatedly accepts input, stores data, transforms it and produces output.",
            "Hardware performs a small vocabulary of operations extremely quickly. Software creates useful abstractions by combining those operations into instructions, functions and systems.",
            "input → store → process → output\n             ↖ repeat ↙",
            "Choose a familiar app and list its inputs, stored data, processing steps and outputs.",
            true
          ),
          lesson(
            "binary-data",
            "Bits, bytes & data",
            19,
            "Text, photos and sound all become patterns of two states before a computer can store them.",
            "A bit is 0 or 1. Eight bits form a byte. Interpretation gives a bit pattern meaning: the same bits can represent a number, a character or part of a pixel depending on the format.",
            "13 in decimal = 1101 in binary\n8 + 4 + 0 + 1 = 13",
            "Convert the decimal numbers 7, 18 and 42 to binary using place values."
          ),
          lesson(
            "logic-algorithms",
            "Logic & algorithms",
            24,
            "Turn an unclear goal into a finite sequence of unambiguous steps.",
            "An algorithm has defined inputs, ordered operations and an expected output. Conditions choose a path; loops repeat work; functions name and reuse a process.",
            "function largest(numbers):\n  best = numbers[0]\n  for each number in numbers:\n    if number > best: best = number\n  return best",
            "Write pseudocode that finds the smallest price in a shopping basket."
          ),
        ],
      },
      {
        id: "systems-and-structures",
        title: "02 · Systems & structures",
        description: "See how programs organize data and share resources.",
        lessons: [
          lesson(
            "data-structures",
            "Data structures",
            25,
            "The way data is organized changes which operations are easy, fast or expensive.",
            "Arrays provide ordered indexed access, stacks use last-in-first-out, queues use first-in-first-out, and maps connect unique keys to values. Pick the structure that matches the operations you perform most.",
            "stack.push(task)\nlatest = stack.pop()\n\nprofileById.set(user.id, user)",
            "For browser history, a support queue and a phone book, choose a data structure and explain why."
          ),
          lesson(
            "memory-processes",
            "Memory, programs & processes",
            22,
            "Understand what changes when a program on disk becomes a running process.",
            "The operating system gives each process resources and a protected address space. The stack tracks active function calls; the heap stores dynamically allocated data that can outlive one call.",
            "program file → operating system loads it → running process\n                                  ↳ memory + CPU time",
            "Open your system monitor, find three processes and compare their memory use."
          ),
          lesson(
            "networks-internet",
            "Networks & the internet",
            23,
            "Learn how independently owned networks cooperate to move information around the world.",
            "Packets carry small pieces of data. IP handles addressing and routing, TCP provides ordered delivery, and application protocols such as HTTP define the messages programs exchange.",
            "application: HTTP\ntransport:   TCP\nnetwork:     IP\nlink:        Wi‑Fi / Ethernet",
            "Run a traceroute to a public website and note how many network hops appear."
          ),
        ],
      },
    ],
  },
  {
    id: "javascript-zero-to-builder",
    slug: "javascript-zero-to-builder",
    title: "JavaScript: Zero to Builder",
    shortTitle: "JavaScript",
    description:
      "Go from variables and functions to asynchronous APIs while building an interactive task-planning application.",
    category: "Web Development",
    level: "Beginner",
    tone: "cyan",
    icon: "braces",
    requiredPlan: "premium",
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
    modules: [
      {
        id: "javascript-language",
        title: "01 · The language",
        description: "Build a dependable foundation in JavaScript.",
        lessons: [
          lesson(
            "values-variables",
            "Values & variables",
            18,
            "Programs become useful when they can remember information and transform it.",
            "Use const by default and let when a binding must change. JavaScript values include strings, numbers, booleans, null, undefined, objects and functions.",
            "const learner = \"Amina\";\nlet lessonsComplete = 3;\nlessonsComplete += 1;\n\nconsole.log(`${learner}: ${lessonsComplete}`);",
            "Create variables for a course title, total lessons and completed lessons, then calculate the percentage.",
            true
          ),
          lesson(
            "conditions-loops",
            "Conditions & loops",
            22,
            "Control which instructions run and how often they repeat.",
            "Conditions branch on boolean expressions. for...of reads naturally when you need every value in a collection; array methods can express transformations with less manual state.",
            "for (const score of scores) {\n  if (score >= 80) {\n    console.log(\"Excellent work\");\n  }\n}",
            "Loop through five lesson scores and count how many are 70 or higher."
          ),
          lesson(
            "functions-scope",
            "Functions & scope",
            25,
            "Package behavior into small, named units that are easier to reuse and test.",
            "Parameters are a function's inputs and return values are its outputs. Scope controls where names are visible. Prefer functions that do one clear job and return data instead of changing distant state.",
            "function progress(completed, total) {\n  if (total === 0) return 0;\n  return Math.round((completed / total) * 100);\n}",
            "Write and call a function that converts minutes into a friendly hours-and-minutes label."
          ),
          lesson(
            "arrays-objects",
            "Arrays & objects",
            27,
            "Model lists and structured records, then combine them to represent real application data.",
            "Arrays preserve order. Objects group related values by key. Methods such as map, filter and find produce concise data pipelines without manually managing indexes.",
            "const openLessons = lessons\n  .filter((lesson) => !lesson.complete)\n  .map((lesson) => lesson.title);",
            "From an array of course objects, return the titles of beginner courses only."
          ),
        ],
      },
      {
        id: "javascript-in-browser",
        title: "02 · JavaScript in the browser",
        description: "Connect your logic to a real interface and live data.",
        lessons: [
          lesson(
            "dom-events",
            "The DOM & events",
            26,
            "Read the page as data, respond to people and update only what changed.",
            "The DOM is the browser's object representation of HTML. Query stable selectors, listen for events, update accessible state and keep business logic separate from rendering code.",
            "const button = document.querySelector(\"[data-complete]\");\nbutton.addEventListener(\"click\", () => {\n  button.textContent = \"Completed ✓\";\n  button.setAttribute(\"aria-pressed\", \"true\");\n});",
            "Add a button that toggles a card between incomplete and complete states."
          ),
          lesson(
            "async-apis",
            "Async JavaScript & APIs",
            30,
            "Request data without freezing the page and handle every outcome clearly.",
            "Promises represent future results. await makes promise-based code easier to read. A resilient request handles loading, success, empty and error states rather than assuming the network always works.",
            "async function loadCourses() {\n  const response = await fetch(\"/api/courses\");\n  if (!response.ok) throw new Error(\"Request failed\");\n  return response.json();\n}",
            "Fetch a public JSON endpoint and render both a loading message and an error message."
          ),
          lesson(
            "ship-javascript-app",
            "Build & ship the task planner",
            34,
            "Bring state, events, storage and an API together in one maintainable project.",
            "Plan data first, render from that data, route every interaction through a small set of update functions, and persist only the state needed after refresh.",
            "const state = { tasks: [], filter: \"all\" };\n\nfunction addTask(title) {\n  state.tasks.push({ id: crypto.randomUUID(), title, done: false });\n  render();\n}",
            "Ship the planner with add, complete, filter and persistence features."
          ),
        ],
      },
    ],
  },
  {
    id: "react-production-apps",
    slug: "react-production-apps",
    title: "Build Production Apps with React",
    shortTitle: "React Apps",
    description:
      "Master components, state, data fetching and application structure by building a polished analytics dashboard.",
    category: "Web Development",
    level: "Intermediate",
    tone: "blue",
    icon: "react",
    requiredPlan: "premium",
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
    modules: [
      {
        id: "react-model",
        title: "01 · Think in components",
        description: "Learn React's model for describing changing interfaces.",
        lessons: [
          lesson(
            "react-mental-model",
            "The React mental model",
            17,
            "React lets you describe what the interface should look like for the current data.",
            "A component is a function of props and state. Rendering calculates a UI description; committing applies the necessary changes to the browser. Keep rendering pure and put side effects in event handlers or effects.",
            "function Welcome({ name }) {\n  return <h1>Welcome back, {name}</h1>;\n}",
            "Break a dashboard screenshot into a named component tree.",
            true
          ),
          lesson(
            "props-composition",
            "Props & composition",
            24,
            "Create flexible components by passing data and nesting content rather than adding endless options.",
            "Props flow down from parent to child. Composition through children or focused slots lets callers control content while the component owns layout and behavior.",
            "function Card({ title, children }) {\n  return (\n    <section className=\"card\">\n      <h2>{title}</h2>\n      {children}\n    </section>\n  );\n}",
            "Create one Card component and use it for a metric, a chart and an empty state."
          ),
          lesson(
            "state-events",
            "State & events",
            28,
            "Represent the smallest changing facts and derive everything else during render.",
            "State belongs in the closest common owner of every component that needs it. Avoid duplicate state: if a value can be calculated from props or existing state, calculate it.",
            "const [query, setQuery] = useState(\"\");\nconst visible = courses.filter((course) =>\n  course.title.toLowerCase().includes(query.toLowerCase())\n);",
            "Build a searchable list with one source of truth for the query."
          ),
        ],
      },
      {
        id: "react-application",
        title: "02 · Build the application",
        description: "Scale from components into a reliable product.",
        lessons: [
          lesson(
            "forms-validation",
            "Forms & validation",
            27,
            "Turn user input into clear, accessible and trustworthy interactions.",
            "Validate at useful moments, connect errors to fields, preserve input after failure and never rely on client validation for security. Server validation remains the final authority.",
            "function handleSubmit(event) {\n  event.preventDefault();\n  const data = new FormData(event.currentTarget);\n  // validate, then send\n}",
            "Build a profile form with inline errors and a visible successful-save state."
          ),
          lesson(
            "data-fetching",
            "Data fetching states",
            29,
            "Design the full lifecycle of remote data, not only the successful screenshot.",
            "A data view needs loading, error, empty, stale and success states. Cancel obsolete requests and avoid waterfalls by loading independent resources together.",
            "const [data, setData] = useState(null);\nconst [status, setStatus] = useState(\"loading\");",
            "Create a data panel that can display a skeleton, retry error, empty state and results."
          ),
          lesson(
            "routing-architecture",
            "Routing & app architecture",
            31,
            "Give every major screen a stable URL and organize code around product features.",
            "Routes should match user concepts. Keep feature-specific components close to their route, share truly generic UI, and draw a clear boundary between server data and interactive client state.",
            "app/\n  dashboard/page.tsx\n  courses/[slug]/page.tsx\ncomponents/\nlib/",
            "Design routes and folders for an online learning dashboard with course and lesson pages."
          ),
          lesson(
            "ship-react-dashboard",
            "Ship the analytics dashboard",
            36,
            "Polish performance, accessibility and edge cases before you call the build complete.",
            "Measure before optimizing. Check keyboard flow, semantic landmarks, loading performance, error recovery and small screens. Then document the decisions another developer needs to continue.",
            "npm run build\n# fix every error before deployment",
            "Deploy the dashboard and complete a keyboard-only quality audit."
          ),
        ],
      },
    ],
  },
  {
    id: "mobile-apps-react-native",
    slug: "mobile-apps-react-native",
    title: "Mobile Apps with React Native",
    shortTitle: "Mobile Apps",
    description:
      "Build a cross-platform habit tracker while learning native layouts, navigation, device storage and mobile UX.",
    category: "App Development",
    level: "Intermediate",
    tone: "pink",
    icon: "mobile",
    requiredPlan: "premium",
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
    modules: [
      {
        id: "native-building-blocks",
        title: "01 · Native building blocks",
        description: "Move your React knowledge onto a mobile device.",
        lessons: [
          lesson(
            "native-vs-web",
            "Native apps vs the web",
            16,
            "Understand what React Native shares with React and what changes on iOS and Android.",
            "React Native uses React's component model but renders native views rather than HTML. There is no browser DOM, CSS differs, and platform conventions matter to how an app feels.",
            "import { Text, View } from \"react-native\";\n\nexport default function App() {\n  return <View><Text>Hello, mobile!</Text></View>;\n}",
            "List three browser APIs a web app may use that a native app cannot assume exist.",
            true
          ),
          lesson(
            "layouts-styling-native",
            "Layouts & styling",
            25,
            "Create adaptable mobile layouts with Flexbox, safe areas and platform-aware spacing.",
            "React Native defaults to a vertical flex direction. Use StyleSheet for named styles, respect safe areas and test dynamic text sizes instead of designing around one simulator.",
            "const styles = StyleSheet.create({\n  screen: { flex: 1, padding: 20 },\n  row: { flexDirection: \"row\", gap: 12 }\n});",
            "Build a habit card that remains readable with the device font size increased."
          ),
          lesson(
            "mobile-navigation",
            "Navigation patterns",
            28,
            "Connect screens using navigation that matches platform expectations.",
            "Stacks model drill-down flows, tabs switch top-level areas and modals isolate focused tasks. Keep route parameters small and load full records from shared state.",
            "<Stack.Screen name=\"HabitDetail\" component={HabitDetail} />",
            "Sketch a route map for a habit app with Today, Progress, Settings and Habit Detail screens."
          ),
        ],
      },
      {
        id: "mobile-product",
        title: "02 · Make it a product",
        description: "Add persistence, device feedback and release quality.",
        lessons: [
          lesson(
            "device-storage",
            "State & device storage",
            27,
            "Keep useful data between sessions without making the interface wait unnecessarily.",
            "Store small non-sensitive preferences locally, use a secure store for secrets, and treat serialization as an explicit boundary. Show a stable loading screen while restoring initial state.",
            "await AsyncStorage.setItem(\"habits\", JSON.stringify(habits));",
            "Persist a list of habits and safely recover if the stored JSON is invalid."
          ),
          lesson(
            "mobile-interactions",
            "Gestures, feedback & polish",
            24,
            "Make taps, transitions and system feedback feel immediate and intentional.",
            "Touch targets need enough space, destructive actions need confirmation or undo, and haptics should reinforce—not replace—visual information. Keep animation tied to meaning.",
            "<Pressable hitSlop={8} accessibilityRole=\"button\">\n  <Text>Mark complete</Text>\n</Pressable>",
            "Audit every control in your app for touch size, label and pressed feedback."
          ),
          lesson(
            "release-mobile-app",
            "Test & release",
            32,
            "Move from a working simulator build to an app other people can install confidently.",
            "Test real devices, slow networks, offline launches, denied permissions and interrupted flows. Prepare icons, screenshots, privacy details and versioned builds before store review.",
            "npx expo-doctor\nnpx eas build --platform all",
            "Create a release checklist and run your core flow on one physical device."
          ),
        ],
      },
    ],
  },
  {
    id: "backend-node-apis",
    slug: "backend-node-apis",
    title: "Backend Development with Node.js",
    shortTitle: "Node.js Backend",
    description:
      "Design secure APIs, model application data and connect a real backend to the interfaces you build.",
    category: "Backend",
    level: "Intermediate",
    tone: "green",
    icon: "server",
    requiredPlan: "premium",
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
            "test(\"blocks a learner from admin data\", async () => {\n  const response = await requestAs(learner).get(\"/api/admin/users\");\n  expect(response.status).toBe(403);\n});",
            "Write integration tests for successful completion, locked course access and suspended accounts."
          ),
        ],
      },
    ],
  },
];

export const CATEGORIES: Array<"All" | CourseCategory> = [
  "All",
  "Web Development",
  "App Development",
  "Computer Science",
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

export function canAccessCourse(planId: PlanId, course: Course): boolean {
  return PLAN_TIER[planId] >= PLAN_TIER[course.requiredPlan];
}

export function canAccessLesson(planId: PlanId, course: Course, lesson: Lesson): boolean {
  return lesson.preview === true || canAccessCourse(planId, course);
}

export function coursePercent(course: Course, completedLessonIds: string[] = []): number {
  const total = getCourseLessons(course).length;
  if (!total) return 0;
  return Math.round((completedLessonIds.filter((id) => getLesson(course, id)).length / total) * 100);
}
