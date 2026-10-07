import type { Course, CourseTone } from "./courses";
import { lesson, module } from "./lesson-builder";

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
    modules: [
      module("structures", "01 · Structures that fit the job", "The containers you reach for every day, and what they cost.", [
        lesson(
          "big-o-not-scary",
          "Big-O without the fear",
          20,
          "Big-O is just a way of saying how work grows when the input doubles. It is the vocabulary for every performance conversation you will ever have.",
          "Count the steps an algorithm takes as the input grows. A loop over n items is O(n); a loop inside a loop is O(n²); halving the problem each pass is O(log n). Constants and small terms are dropped because they stop mattering at scale.",
          "// O(n): one pass over the list\nconst total = (nums) => nums.reduce((sum, n) => sum + n, 0);\n\n// O(n²): for each item, check every other item\nconst hasDuplicateSlow = (nums) => {\n  for (let i = 0; i < nums.length; i++)\n    for (let j = i + 1; j < nums.length; j++)\n      if (nums[i] === nums[j]) return true;\n  return false;\n};",
          "Take two functions you wrote last week and label each one with its Big-O. Write the number of steps for inputs of 10 and 1,000.",
          true
        ),
        lesson(
          "arrays-and-two-pointers",
          "Arrays, strings and two pointers",
          26,
          "Arrays are contiguous memory with instant indexed reads, which makes them the right home for ordered data — and the right problem for two-pointer tricks.",
          "Reading `list[i]` costs the same whatever `i` is, but inserting at the front shifts everything. Two pointers walk a sorted array from both ends so a nested loop collapses into a single pass.",
          "// Does this sorted list contain two numbers that add to target?\nfunction twoSum(sorted, target) {\n  let left = 0, right = sorted.length - 1;\n  while (left < right) {\n    const sum = sorted[left] + sorted[right];\n    if (sum === target) return [sorted[left], sorted[right]];\n    if (sum < target) left++; else right--;\n  }\n  return null;\n}",
          "Reverse a string in place with two pointers instead of a library call, then say why the loop runs n/2 times."
        ),
        lesson(
          "maps-and-sets",
          "Maps and sets: looking things up in one step",
          24,
          "A hash map turns 'search the list' into 'ask the map'. Most 'slow' code becomes fast the moment the inner loop is replaced with a lookup.",
          "A hash function turns a key into a position, so insert, find and delete average O(1). Sets are maps without values — perfect for 'have I seen this before?'.",
          "// From O(n²) to O(n): one pass, remembering what we saw.\nfunction hasDuplicateFast(nums) {\n  const seen = new Set();\n  for (const n of nums) {\n    if (seen.has(n)) return true;\n    seen.add(n);\n  }\n  return false;\n}",
          "Count how many times each word appears in a paragraph with one pass and one Map. Then explain what changed versus sorting first."
        ),
      ]),
      module("algorithms", "02 · Algorithms that scale", "Sorting, recursion, trees and graphs — the patterns behind real systems.", [
        lesson(
          "sorting-and-searching",
          "Sorting and searching",
          24,
          "Sorting is the move that makes everything else cheaper: searching, de-duplicating, merging and grouping all get simpler on ordered data.",
          "Binary search halves the search space each step, so a million sorted items take about twenty comparisons. Sorting first costs O(n log n) and then each search is O(log n) — a bargain when you search many times.",
          "function binarySearch(sorted, target) {\n  let low = 0, high = sorted.length - 1;\n  while (low <= high) {\n    const mid = (low + high) >> 1;\n    if (sorted[mid] === target) return mid;\n    if (sorted[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}",
          "Search a sorted list of a million numbers for a missing value and count the comparisons in your head before you run it."
        ),
        lesson(
          "recursion-and-memoization",
          "Recursion and memoization",
          26,
          "Recursion solves a problem by solving a smaller copy of itself. Memoization makes recursive solutions fast by never solving the same smaller problem twice.",
          "Naive Fibonacci recomputes the same values exponentially many times — O(2ⁿ). Caching each result the first time it is computed drops the whole tree to O(n).",
          "function fib(n, cache = new Map()) {\n  if (n < 2) return n;\n  if (cache.has(n)) return cache.get(n);\n  const value = fib(n - 1, cache) + fib(n - 2, cache);\n  cache.set(n, value);\n  return value;\n}\n\nfib(80); // instant — without the cache this would never finish",
          "Write a recursive coin-change counter, then add a cache and measure both versions on the same input."
        ),
        lesson(
          "trees-graphs-traversal",
          "Trees, graphs and traversal",
          28,
          "A tree is a hierarchy (files, comments, decisions). A graph is anything connected to anything (friends, routes, dependencies). Both are searched the same two ways.",
          "Depth-first search follows one branch to the end, which suits small graphs and recursion. Breadth-first search explores level by level, which is how you find the shortest path in an unweighted graph.",
          "function bfsShortestPath(graph, start, goal) {\n  const queue = [[start]];\n  const seen = new Set([start]);\n  while (queue.length) {\n    const path = queue.shift();\n    const node = path[path.length - 1];\n    if (node === goal) return path;\n    for (const next of graph[node] ?? []) {\n      if (seen.has(next)) continue;\n      seen.add(next);\n      queue.push([...path, next]);\n    }\n  }\n  return null;\n}",
          "Model a small map as an object of neighbours and find the shortest route between two stops with BFS."
        ),
      ]),
    ],
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
    modules: [
      module("query-basics", "01 · Talking to data", "Tables, keys and the query language built on top of them.", [
        lesson(
          "tables-and-keys",
          "Tables, rows and keys",
          22,
          "A database is a set of tables where every row is one thing and every column is one fact about it. Keys are what keep rows from lying about each other.",
          "A primary key identifies a row forever. A foreign key says 'this value must exist in that table', which lets the database refuse inconsistent data instead of storing it.",
          "create table students (\n  id     bigint generated always as identity primary key,\n  name   text not null,\n  email  text not null unique\n);\n\ncreate table enrolments (\n  id         bigint generated always as identity primary key,\n  student_id bigint not null references students(id) on delete cascade,\n  course     text not null,\n  grade      integer check (grade between 0 and 100)\n);",
          "Model a small library: books, members and loans. Every loan must point at a real member and a real book.",
          true
        ),
        lesson(
          "select-where-order",
          "SELECT, WHERE, ORDER BY",
          24,
          "Most questions you have about data are three clauses: which table, which rows, in what order.",
          "Select only the columns you need, filter with WHERE, sort with ORDER BY and page with LIMIT. NULL is not equal to anything — it needs `IS NULL`.",
          "select name, email\n  from students\n where email is not null\n   and name ilike 'a%'\n order by name asc\n limit 20;",
          "Write a query that returns the five most recently enrolled students and their course."
        ),
        lesson(
          "joins",
          "Joins: asking across tables",
          26,
          "Data lives in separate tables so it is stored once. Joins are how you put the story back together for one question.",
          "An INNER JOIN keeps rows that match on both sides. A LEFT JOIN keeps every row from the left table even when nothing matches — which is how you find students with no enrolments (the `IS NULL` filter).",
          "select s.name, c.title, e.grade\n  from enrolments e\n  join students s on s.id = e.student_id\n  join courses  c on c.id = e.course_id\n order by s.name;\n\n-- Everyone who has never enrolled:\nselect s.name\n  from students s\n  left join enrolments e on e.student_id = s.id\n where e.id is null;",
          "List every course with how many students are enrolled in it, including the courses with none."
        ),
      ]),
      module("making-it-real", "02 · Making it real", "Writes, speed and correctness under concurrency.", [
        lesson(
          "insert-update-delete",
          "Insert, update and delete safely",
          22,
          "Writes are where mistakes become permanent, so they should be narrow: touch the rows you mean and nothing else.",
          "The dangerous part of UPDATE and DELETE is the WHERE clause — forget it and you rewrite the whole table. `RETURNING` shows exactly what changed, so you never have to guess.",
          "update enrolments\n   set grade = 88\n where student_id = 12 and course_id = 4\nreturning id, grade;\n\ndelete from enrolments\n where grade is null and enrolled_at < now() - interval '1 year';",
          "Insert a student and their first enrolment in one transaction, then update the grade and print the changed row."
        ),
        lesson(
          "indexes-and-explain",
          "Indexes and EXPLAIN",
          26,
          "An index is a sorted shortcut the database keeps so it does not read the whole table for one lookup. EXPLAIN shows you whether it was used.",
          "Indexes cost storage and slow down writes, so you add them for the queries you actually run — filters, joins and sorts. `EXPLAIN ANALYZE` is the honest measure: it runs the query and reports the real time.",
          "create index enrolments_student_idx on enrolments (student_id);\n\nexplain analyze\nselect * from enrolments where student_id = 12;",
          "Run EXPLAIN ANALYZE before and after adding an index on a column you filter by, and compare the row counts."
        ),
        lesson(
          "transactions-and-constraints",
          "Transactions and constraints",
          24,
          "A transaction makes several statements one all-or-nothing unit, which is what keeps money, stock and enrolments correct when two people act at once.",
          "BEGIN opens it, COMMIT makes it real, ROLLBACK undoes it. `SELECT ... FOR UPDATE` locks the rows you are about to change so a second request waits instead of double-spending.",
          "begin;\n\nselect seats from classes where id = 7 for update;\nupdate classes set seats = seats - 1 where id = 7;\n\ninsert into bookings (class_id, student_id) values (7, 42);\n\ncommit;",
          "Book the last seat of a class from two sessions at the same time. Confirm one succeeds and the other waits, then explain why."
        ),
      ]),
    ],
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
    modules: [
      module("working-together", "01 · Working like a team", "Git, review and readable code — the parts nobody teaches in a tutorial.", [
        lesson(
          "git-branches-and-commits",
          "Branches, commits and pull requests",
          24,
          "Version control is a safety net and a conversation at the same time: small commits explain what changed, and a pull request explains why.",
          "A branch is a moving label on a commit. Commit in small, complete steps with a message that finishes the sentence 'this change will…'. Then open a pull request so the change can be read before it reaches main.",
          "git switch -c add-gradebook\ngit add src/gradebook.ts\ngit commit -m \"Add a gradebook that averages scores per student\"\ngit push -u origin add-gradebook\ngh pr create --fill",
          "Take a change you already made, split it into two commits that each do one thing, and write both messages.",
          true
        ),
        lesson(
          "code-review",
          "Code review that helps",
          22,
          "Review is about the code, not the person. A good review catches real problems, shares context and leaves the author able to move faster.",
          "Review for correctness first, then clarity, then style — and say why. Approve small changes quickly; ask questions rather than issuing commands, and always explain the risk you are pointing at.",
          "> \"This works, but `users.find()` inside the loop makes it O(n²).\n> Could we build a Map keyed by id first? That would also\n> make the intent clearer.\"",
          "Review a pull request you wrote last month. Leave three comments: one bug, one clarity, one praise."
        ),
        lesson(
          "readable-code",
          "Naming and structure that survives",
          22,
          "Code is read far more often than it is written. Good names and small functions are what make a change safe six months later.",
          "A name should say what a thing is or does, not what type it is. Keep functions at one level of abstraction, delete dead code instead of commenting it, and let the shape of the data explain the flow.",
          "// Before\nconst d = (a, b) => a.filter(x => b.includes(x.id));\n\n// After\nfunction pupilsInClass(pupils, enrolledIds) {\n  return pupils.filter((pupil) => enrolledIds.includes(pupil.id));\n}",
          "Rename the worst three names in a file you own, without changing behaviour, and check the diff reads better."
        ),
      ]),
      module("shipping-safely", "02 · Shipping without breaking", "Tests and pipelines, so a change can be trusted before it reaches a user.", [
        lesson(
          "unit-tests",
          "Tests that earn their keep",
          26,
          "A test is a promise about behaviour. The good ones describe real rules, fail for exactly one reason and run in milliseconds.",
          "Arrange, act, assert. Test the interesting cases: empty input, the boundary, the error path. If a test needs a database, an API and a fake clock, that is usually the design asking to be split.",
          "test(\"a pass extends from its current expiry\", () => {\n  const pass = makePass({ period: \"weekly\", from: day(0) });\n  const renewed = renew(pass, \"daily\");\n\n  expect(renewed.expiresAt).toEqual(day(8));\n});",
          "Write three tests for a function you already shipped: a normal case, a boundary and a failure."
        ),
        lesson(
          "ci-pipeline",
          "A pipeline on every push",
          22,
          "Continuous integration is a robot that runs the boring checks for you: install, typecheck, test, build. It turns 'it worked on my machine' into a fact.",
          "Keep the pipeline fast and honest — the same commands a developer runs locally. Fail loudly, and never merge a red build: a pipeline people ignore is worse than none.",
          "# .github/workflows/ci.yml\nname: CI\non: [push, pull_request]\njobs:\n  check:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - run: npm run typecheck\n      - run: npm test",
          "Add a workflow to one of your repositories that runs typecheck and tests, and make it fail on purpose once to see the red mark."
        ),
        lesson(
          "planning-and-issues",
          "Issues, scope and shipping small",
          20,
          "Engineering is mostly deciding what not to build yet. Small, shippable increments keep quality high and feedback quick.",
          "Write an issue as the user problem and the smallest acceptable change. Slice work so each slice is releasable. Estimate by comparing to work you have already done, not by guessing hours.",
          "## Problem\nStudents cannot tell which lesson is a free preview.\n\n## Smallest acceptable change\nShow a \"Free preview\" chip in the course lesson list.\n\n## Not in this slice\nFiltering, badges on cards, analytics.",
          "Take your current project and cut it into three releases, each of which a real user could use."
        ),
      ]),
    ],
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
    modules: [
      module("building-blocks", "01 · The building blocks", "Clients, services, data and the machinery that holds them together.", [
        lesson(
          "clients-and-apis",
          "Clients, APIs and contracts",
          24,
          "An API is a promise: what you can ask for, what you will get back, and what happens when it goes wrong. Everything else in the system hangs off that promise.",
          "Keep resources nouns and verbs in HTTP methods. Return the same shape for the same kind of error, version the contract when it must change, and make writes idempotent so a retry cannot double-charge.",
          "GET    /api/tickets?eventId=42      -> { tickets: [...] }\nPOST   /api/bookings                 -> 201 { id, status: \"held\" }\nDELETE /api/bookings/ab12            -> 204 (idempotent)\n\n// Errors, always the same shape:\n{ \"error\": \"Seats sold out\", \"code\": \"SOLD_OUT\" }",
          "Write the API contract for booking a seat, including the two failure responses a client must handle.",
          true
        ),
        lesson(
          "data-at-scale",
          "Choosing where data lives",
          26,
          "The data model decides how the system behaves under load. Schemas, read patterns and consistency all follow from what the product must never get wrong.",
          "Relational databases give you joins and transactions; key-value stores give you speed and simple scale; search engines give you text. Most products want one relational core plus a derived read model for the query that is too slow.",
          "bookings (id, event_id, seat_id, state, held_until)\n  unique (event_id, seat_id) where state <> 'cancelled'\n\n-- Derived read model, rebuilt from bookings:\nseat_availability (event_id, seat_id, available boolean)",
          "Model seats and bookings so that a seat can never be sold twice, even with two simultaneous buyers."
        ),
        lesson(
          "caches-and-queues",
          "Caches, queues and eventual work",
          26,
          "A cache answers a question faster than the source of truth. A queue moves work out of the request so a slow job cannot slow the user down.",
          "Cache what is read often and changes rarely, and always have an expiry. Put email, image processing and reports on a queue with retries — then design the retry so a duplicate job is harmless.",
          "// Read-through cache with a short life\nasync function eventWithAvailability(id) {\n  const key = `event:${id}:availability`;\n  const hit = await cache.get(key);\n  if (hit) return hit;\n  const fresh = await buildAvailability(id);\n  await cache.set(key, fresh, { ttl: 15 }); // seconds\n  return fresh;\n}",
          "List every slow or unreliable step in your project and mark each one: cache it, queue it, or leave it inline."
        ),
      ]),
      module("designing-for-reality", "02 · Designing for reality", "Failure, security and the written decisions that make a design reviewable.", [
        lesson(
          "reliability-and-failure",
          "Designing for failure",
          24,
          "Everything fails: disks, networks, third parties, your own deploy. Reliability is deciding what should happen when it does.",
          "Use timeouts everywhere, retry only idempotent work, and add a circuit breaker so one slow dependency cannot consume every request. Degrade instead of collapsing — a cached page beats a 500.",
          "async function withTimeout<T>(work: Promise<T>, ms: number, fallback: T) {\n  let timer: NodeJS.Timeout;\n  const timeout = new Promise<T>((resolve) => {\n    timer = setTimeout(() => resolve(fallback), ms);\n  });\n  try {\n    return await Promise.race([work, timeout]);\n  } finally {\n    clearTimeout(timer!);\n  }\n}",
          "Take your last outage or bug and write the three changes that would have contained it."
        ),
        lesson(
          "security-and-auth",
          "Authentication, authorisation and the obvious holes",
          26,
          "Security is mostly boring discipline: trust the server, check every request, store less, and never let the browser decide what a user may do.",
          "Authenticate once, authorise every request. Hash passwords with a slow algorithm, keep secrets out of the client, validate input at the boundary and check ownership before returning anything.",
          "// The check belongs next to the data, not in the button.\nconst purchase = await db.purchases.find({ id, userId: session.userId });\nif (!purchase) return notFound(); // not forbidden: say nothing\n\n// Server-side rule (the UI only reflects it):\nif (!hasActivePass(user) || !ownsCourse(user, courseId)) return forbidden();",
          "Pick a route in your app and list who can call it, what they must prove, and what the server checks before answering."
        ),
        lesson(
          "trade-offs-and-adrs",
          "Trade-offs, and writing them down",
          22,
          "Every design decision buys something and pays for it elsewhere. An architecture decision record is how the next engineer learns why.",
          "An ADR is short: context, decision, consequences. Write the alternatives you rejected and the conditions under which you would revisit — that is what turns an opinion into engineering.",
          "# ADR 3: Hold seats with a short-lived reservation\n\nContext   Two buyers can pick the same seat at once.\nDecision  Create a booking row with state 'held' for 10 minutes.\nAlternatives  In-memory lock (lost on deploy); queue all bookings (slower UX).\nConsequences  Need a sweeper to expire holds; a crash cannot oversell.\nRevisit if  Holds exceed 20% of traffic.",
          "Write one ADR for a decision you have already made. Include the option you rejected and why."
        ),
      ]),
    ],
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
    modules: [
      module("commit-to-production", "01 · From commit to production", "Environments, containers and the pipeline that connects them.", [
        lesson(
          "environments-and-config",
          "Environments and config",
          22,
          "The same code should run everywhere; only the configuration differs. Everything else is how a bug reaches production.",
          "Keep secrets in the environment, never in the repo. Fail fast at boot when a required variable is missing, and give each environment its own database — sharing one is how a test wipes real data.",
          "const required = [\"DATABASE_URL\", \"SESSION_SECRET\"];\nconst missing = required.filter((key) => !process.env[key]);\nif (missing.length) {\n  console.error(`Missing config: ${missing.join(\", \")}`);\n  process.exit(1);\n}",
          "List every environment variable your app reads, mark which are secret, and make the app refuse to start without the required ones.",
          true
        ),
        lesson(
          "containers",
          "Containers you can trust",
          26,
          "A container packages your app and its runtime so the build is the same on your laptop, in CI and in production.",
          "Use a small base image, install dependencies from the lockfile, copy source last so layers cache, and run as a non-root user. One process per container; state belongs in a volume or a database.",
          "FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nUSER node\nENV NODE_ENV=production\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]",
          "Write a Dockerfile for one of your projects and check the image builds twice in a row with the cache hit."
        ),
        lesson(
          "pipelines-in-practice",
          "Deploy and rollback",
          24,
          "Deployment should be one command that either finishes or leaves the previous version running. Rolling back should be one more.",
          "Build an immutable artifact, deploy it, run a smoke test against the real URL and only then switch traffic. Keep the previous release so rollback is a pointer change, not a rebuild.",
          "npm ci && npm run build\nssh deploy@host 'ln -sfn releases/$(date +%s) current && systemctl reload app'\ncurl -fsS https://app.example.com/api/health || ./rollback.sh",
          "Add a health check to your app and make your deploy script refuse to finish unless it returns healthy."
        ),
      ]),
      module("running-it", "02 · Running it", "What you need on the day something goes wrong at 2am.", [
        lesson(
          "monitoring-and-logs",
          "Monitoring that wakes you, logs that explain",
          24,
          "Metrics tell you something is wrong; logs tell you why. You need both, and you need them before the incident.",
          "Track the four signals: latency, traffic, errors and saturation. Log structured events with a request id, never log secrets or full personal data, and alert on symptoms users feel rather than on CPU.",
          "console.error(JSON.stringify({\n  level: \"error\",\n  event: \"purchase.failed\",\n  requestId,\n  code: \"PAYMENT_DECLINED\",\n  userId: user.id, // an id, never an email or card\n}));",
          "Add one structured log line and one timing metric to a route you care about, then decide the threshold that should page you."
        ),
        lesson(
          "backups-and-migrations",
          "Backups and schema changes",
          24,
          "Data outlives code. Migrations must be safe to run while the old version is still serving traffic, and backups are only real once you have restored one.",
          "Add columns as nullable, backfill, then enforce — never rename and rewrite in one step. Test the restore, not the backup, and write down how long recovery takes.",
          "alter table users add column if not exists pass_expires_at timestamptz;\nupdate users set pass_expires_at = now() where pass_expires_at is null;\nalter table users alter column pass_expires_at set not null;",
          "Write the migration order for renaming a column with zero downtime, then restore a backup into a scratch database."
        ),
        lesson(
          "incidents-and-rollbacks",
          "Incidents and blameless reviews",
          22,
          "Every outage is a lesson with a timestamp. The goal of a review is a system that cannot fail the same way, not a person to blame.",
          "During an incident: stop the bleeding (roll back), then investigate. Afterwards write the timeline from data, name the contributing causes honestly and turn each one into an issue with an owner.",
          "12:04  Deploy 41 ships; error rate 0.2% -> 14%\n12:06  Rollback to 40; errors return to baseline\n12:20  Root cause: migration added NOT NULL before backfill\nAction: migrations must be additive-only in one release (owner: NA)",
          "Write the timeline of the last bug that hit production, from the deploy to the fix, and turn it into three actions."
        ),
      ]),
    ],
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
