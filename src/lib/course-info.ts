import type { Course } from "./courses";

/**
 * The long-form description for each course.
 *
 * The catalogue keeps a one-line `description` for cards and search results;
 * this is what the course page itself needs, because "Learn JavaScript" is not
 * an answer to "should I spend money on this?". Each entry says what the
 * course actually teaches, who it fits, what you need before you start, which
 * tools you will use, and where it leads — including how it maps to work in
 * Ghana.
 *
 * Written per course id, and deliberately kept out of `courses.ts` so that
 * `contentCourse()` merging, the owner console and the code lab never have to
 * carry the prose around.
 */

export interface CourseBrief {
  /** Two or three paragraphs of real description. */
  overview: string[];
  /** "You will get the most out of this if…" */
  audience: string[];
  /** Honest requirements — time, kit, knowledge. */
  prerequisites: string[];
  /** What the learner actually touches during the lessons. */
  tools: string[];
  /** What the learner builds, ending with the project itself. */
  build: string[];
  /** Where it leads: the next course, and the work it opens up. */
  after: string[];
}

const BRIEFS: Record<string, CourseBrief> = {
  "web-foundations": {
    overview: [
      "Every page you have ever scrolled is built from the same three ideas: structure, style and layout. This course teaches them in the order a beginner really meets them — you learn to see the boxes underneath a page, then build those boxes yourself, by hand, until markup stops feeling like magic and starts feeling like a tool.",
      "You will work in HTML and modern CSS: semantic tags that mean something to a search engine and a screen reader, Flexbox and Grid for layout, and the mobile-first thinking that decides whether a page is usable on a phone. Because so much browsing in Ghana happens on a phone, mobile comes first here rather than as an afterthought.",
      "By the end you have written a complete, responsive personal website — the kind you can attach to a CV — and you know how to change it next month without starting from zero. HTML and CSS are the most forgiving place to begin coding, and they are where most junior developer portfolios begin.",
    ],
    audience: [
      "You have never written code and want a first win that is visible this week.",
      "You can already build something in WordPress or a website builder and want to understand what is underneath.",
      "You design, sell or manage websites and need to talk to developers in their language.",
    ],
    prerequisites: [
      "A laptop makes the work easier, but a phone is enough to follow every lesson and read the code.",
      "No programming experience at all — the course assumes you have never opened a code editor.",
      "Around six hours of practice spread over a week is enough to finish comfortably.",
    ],
    tools: ["A code editor (VS Code is free and what we use)", "A browser with developer tools — Chrome or Firefox", "A free GitHub account to put your site online", "Free hosting through GitHub Pages or Netlify"],
    build: [
      "A structured page of content marked up by hand",
      "A responsive layout that rearranges itself on a phone",
      "A styled navigation bar and footer you can reuse",
      "A published portfolio site with a working link to send to employers",
    ],
    after: [
      "Continue with JavaScript: Zero to Builder to make the page respond to the person using it.",
      "The site you build is a real portfolio you can link from a CV, a job application or a freelance profile.",
      "Freelance landing pages for small businesses in Ghana are the most common first paid work for a front-end beginner.",
    ],
  },

  "computer-science-essentials": {
    overview: [
      "This is the course for the person who can already write a little code but cannot explain why anything works. It covers the ideas that outlive every framework: how data is represented, how a computer stores and moves it, what an algorithm actually is, and how to reason about cost before you write the code.",
      "You will meet binary and memory, logic and control flow, the common data structures and their trade-offs, networks and the request-and-response cycle, and the vocabulary engineers use when they compare two solutions. No mathematics beyond careful counting is assumed — the point is judgement, not proofs.",
      "Finish it and you will read unfamiliar code with more confidence, debug by reasoning instead of guessing, and walk into a technical interview without hoping the questions stay shallow.",
    ],
    audience: [
      "You can write basic code but want the foundations under it rather than more frameworks on top.",
      "You are preparing for a technical interview, an internship or an entry-level engineering role.",
      "You teach or mentor and want the vocabulary to explain how computers work.",
    ],
    prerequisites: [
      "Comfort with variables, functions and loops in any language — from any beginner course, including ours.",
      "No advanced mathematics; a willingness to count carefully is more useful than algebra.",
      "About two to three hours a week for two weeks.",
    ],
    tools: ["A code editor", "The built-in browser console for small experiments", "Paper or a notebook — several lessons ask you to sketch before coding"],
    build: [
      "Small experiments converting numbers, strings and bytes",
      "Hand-traced algorithms you can explain step by step",
      "A visual algorithm explorer that shows sorting and searching in motion",
    ],
    after: [
      "Data Structures & Algorithms is the natural next step — it turns these ideas into interview-ready skill.",
      "Databases & SQL covers the other half of how systems store and find data.",
      "This is the material that separates a bootcamp graduate who can write a loop from one who can be trusted with a production bug.",
    ],
  },

  "javascript-zero-to-builder": {
    overview: [
      "JavaScript is the language of the browser, and the one most Ghanaians meet second after HTML and CSS. This course teaches it by making things happen on a page: buttons that respond, lists that update, data that arrives from somewhere else without a reload.",
      "You will go from variables, functions and objects to arrays and loops, then to the DOM (the browser's model of the page), events, and finally to asynchronous code and `fetch` — the part most beginners bounce off, taught here with a real public API you can call for free.",
      "The capstone is an interactive task planner that reads and writes data through an API. Along the way you learn to debug: reading an error message properly, isolating a problem, and using the browser's developer tools instead of guessing.",
    ],
    audience: [
      "You finished a first HTML and CSS course and want your pages to do something.",
      "You have tried JavaScript before and stalled at asynchronous code or `fetch`.",
      "You are moving from spreadsheets or a CMS into building interactive tools for your own work.",
    ],
    prerequisites: [
      "Comfortable writing HTML and styling it with CSS — Web Development Foundations or equivalent.",
      "A laptop is strongly recommended for this course; the debugging lessons need a full code editor.",
      "Roughly six to eight hours of practice over a week.",
    ],
    tools: ["VS Code or any editor", "The browser developer console and Network tab", "A free public API key for the task planner", "GitHub for keeping your work in version control"],
    build: [
      "An interactive page that updates as the user types",
      "A list you can add to, filter, edit and delete from",
      "A network request that loads real data and handles failure, loading and empty states",
      "A smart task planner using a public API, saved and shareable",
    ],
    after: [
      "Build Production Apps with React is the next step, and it is where most front-end job adverts point.",
      "You can now automate small tasks for a business — a calculator, a form, a report viewer — which is an easy first freelance job.",
      "Everything later in the catalogue assumes the JavaScript here, including the code lab and the AI courses.",
    ],
  },

  "react-production-apps": {
    overview: [
      "React is the library behind most of the interfaces you will be paid to build, and the reason job adverts in Accra mention it first. This course teaches it the way professional teams use it: components with clear responsibilities, state that lives in one sensible place, and data fetched without blocking the screen.",
      "You will cover component design and props, state and re-rendering, forms and controlled inputs, the effect hooks used for fetching and subscriptions, routing and code structure, and how to handle loading, error and empty states so the app never looks broken.",
      "The course builds a polished analytics dashboard from an empty folder: real charts, filters, pagination and a layout that works on a phone. It is the piece of work to show an employer, and the one you will keep adding to.",
    ],
    audience: [
      "You write JavaScript comfortably and want the library that employers ask for.",
      "You have built small React demos and want to understand state and data flow properly.",
      "You are a designer or product person who wants to prototype interactively.",
    ],
    prerequisites: [
      "Solid, unassisted JavaScript: functions, arrays, objects, promises and `fetch` — JavaScript: Zero to Builder or equivalent.",
      "A laptop with Node.js installed (the first lesson walks through it).",
      "About eight to ten hours across a week — React rewards time spent typing, not watching.",
    ],
    tools: ["Node.js and npm", "Next.js or Vite for the project setup", "React DevTools in the browser", "A component library and a chart library", "Git and GitHub for the repository"],
    build: [
      "A component library of buttons, cards, tables and dialogs used across the app",
      "Forms with validation that never lose the user's input",
      "Data loading with loading, error and empty states",
      "A responsive SaaS analytics dashboard with charts, filters and pagination",
    ],
    after: [
      "System Design & Architecture explains how the API behind a dashboard like this should be shaped.",
      "Mobile Apps with React Native reuses almost all of this thinking for phones.",
      "Front-end roles in Ghana typically interview on exactly this: components, state and data fetching.",
    ],
  },

  "mobile-apps-react-native": {
    overview: [
      "For most people in Ghana the first screen is a phone, and a web page that was not designed for a touch screen feels wrong immediately. This course builds mobile applications with React Native and Expo, which produce one codebase that runs on Android and iOS.",
      "You will learn native layout with Flexbox, navigation between screens, lists that stay smooth with real data, storing information on the device, permissions, and the details that make an app feel native — touch targets, safe areas, keyboard handling and offline behaviour.",
      "The project is a habit tracker with a home screen, a detail screen, local storage and a settings screen: a small app, finished properly, that you can install on your own phone and show someone.",
    ],
    audience: [
      "You know React and want to build for phones.",
      "You have an app idea for a Ghanaian audience and want to build the first version yourself.",
      "You want one codebase instead of learning Android and iOS separately.",
    ],
    prerequisites: [
      "Comfortable JavaScript and the basics of React components and state.",
      "A laptop; an Android phone with the Expo Go app makes testing much more satisfying.",
      "About six to eight hours across the course.",
    ],
    tools: ["Expo and the Expo Go app on your phone", "React Native and its core components", "React Navigation", "AsyncStorage for device storage", "EAS Build when you are ready to release"],
    build: [
      "Screens with native layout and typography",
      "Stack and tab navigation with proper back behaviour",
      "A list backed by data stored on the device",
      "A habit tracker you can install and use on your own phone",
    ],
    after: [
      "Backend Development with Node.js gives your app a server so data can follow the user between devices.",
      "The habits you learn here — permissions, offline states, release builds — are what distinguish a demo from an app.",
      "Mobile work is steady in Ghana: delivery, fintech, agriculture and education all hire for it.",
    ],
  },

  "backend-node-apis": {
    overview: [
      "Everything a front end shows has to come from somewhere. This course is that somewhere: a Node.js service with a well-designed HTTP API, a relational database, authentication, and tests that let you change the code without fear.",
      "You will learn to model data in tables, write endpoints that behave predictably, validate input properly, hash passwords, authorise requests per user, handle errors with useful status codes, and test the API automatically before you deploy it. We work through what actually goes wrong in production — duplicated writes, missing indexes, secrets in the repository — and what to do about each.",
      "The capstone is a REST API for a course platform: users, courses, enrollments and progress, with tests and documentation. It is deliberately the same shape of API as this platform's own, so you can read real code afterwards.",
    ],
    audience: [
      "You build front ends and want to own the whole product.",
      "You are tired of mock data and want to understand servers, databases and auth.",
      "You are preparing for a backend or full-stack interview.",
    ],
    prerequisites: [
      "Confident JavaScript, including asynchronous code, promises and `async`/`await`.",
      "Node.js installed on a laptop — this course cannot be completed on a phone alone.",
      "Eight to ten hours across a week.",
    ],
    tools: ["Node.js and npm", "A web framework such as Express or Fastify", "PostgreSQL with a query builder or ORM", "Postman or the VS Code REST client for testing endpoints", "A free host for a first deployment"],
    build: [
      "REST endpoints with validation and sensible status codes",
      "A relational schema with keys, constraints and indexes",
      "Sign-up, sign-in and per-user authorisation",
      "An automated test suite that runs on every change",
      "A documented, deployed course-platform API",
    ],
    after: [
      "Databases & SQL goes deeper into what the database is doing for you.",
      "DevOps & Delivery takes the deployment from manual to automatic.",
      "Backend and full-stack roles are the best-paid junior work in Accra, and this is the course that makes a portfolio credible.",
    ],
  },

  "data-structures-algorithms": {
    overview: [
      "Two programs can both be correct and still be worlds apart in speed. This course is about telling the difference before you ship: choosing the right structure for the data you have, and reasoning about how the work grows as the data grows.",
      "You will learn Big-O notation without the ceremony — counting what a loop costs and comparing two answers out loud — then work through the structures that appear everywhere: arrays, hash maps, stacks, queues, linked lists, trees and graphs. From there: recursion, searching, sorting, and the traversals that power maps, feeds and dependency lists.",
      "The project is a route planner that finds the fastest path through a small map, using a graph and a search algorithm you implement yourself. It is also the best preparation for the technical interview that stands between you and most engineering jobs.",
    ],
    audience: [
      "You are interviewing for a developer role and the whiteboard part is the obstacle.",
      "You write code that works on your data and misbehaves on a client's much larger data.",
      "You want to compete for remote roles where algorithm screens are standard.",
    ],
    prerequisites: [
      "Comfortable with functions, loops, arrays and objects in any language.",
      "Basic Computer Science Essentials ideas help but are not required.",
      "Six to eight hours, with a pencil nearby for tracing.",
    ],
    tools: ["A code editor", "The Code Lab graph and console templates", "A notebook for tracing and sketching", "The course's implementation templates in JavaScript"],
    build: [
      "Your own implementations of the core data structures",
      "A timed comparison of two solutions to the same problem",
      "A recursive and an iterative version of the same traversal",
      "A route planner that finds the fastest path through a map graph",
    ],
    after: [
      "System Design & Architecture applies these choices at the scale of whole services.",
      "Databases & SQL relates indexes back to the same cost reasoning.",
      "This is the material most often asked about in interviews at banks, telcos, fintechs and remote-first companies hiring in Ghana.",
    ],
  },

  "databases-and-sql": {
    overview: [
      "Almost every application is a database with a story around it. This course teaches how to store data so that it stays correct: tables and relationships, keys and constraints, and the schema decisions that are painful to change later.",
      "You will learn SQL properly — selecting and filtering, sorting and paging, joining tables together, grouping and aggregating, and writing the slightly harder questions that real reports need. Then you will learn why some queries are fast and others are not: indexes, query plans, and transactions that keep money and records consistent.",
      "The project is a school database that answers real report questions: which students are behind, which classes are over capacity, which fees are outstanding. You finish with a database you designed, not one you copied.",
    ],
    audience: [
      "You can write application code but freeze when the data needs a join.",
      "You analyse data in spreadsheets and have hit the ceiling.",
      "You are interviewing for a role where 'some SQL' is on the list.",
    ],
    prerequisites: [
      "Basic comfort with logic and the idea of a table of rows — no prior SQL needed.",
      "A laptop or desktop to run the practice database; the lessons include an online option.",
      "Six hours across a week.",
    ],
    tools: ["PostgreSQL", "A database GUI such as pgAdmin or TablePlus", "A SQL console in the Code Lab", "Sample datasets provided with the course"],
    build: [
      "A normalised schema with keys and constraints",
      "A set of queries from simple filters to multi-table joins",
      "Aggregate reports with grouping and ordering",
      "Indexes with before-and-after timings",
      "A school database that answers real report questions in a single query",
    ],
    after: [
      "Backend Development with Node.js connects this database to an API.",
      "Data Structures & Algorithms explains the costs behind an index.",
      "SQL is asked for in almost every analyst, backend, QA and product job in Ghana, and it is checkable in an interview in ten minutes.",
    ],
  },

  "software-engineering-practices": {
    overview: [
      "There is a difference between code that runs on your laptop and code a team can change for years. This course is about the difference: version control used properly, review that improves code rather than scoring points, tests that catch real bugs, and automation that ships for you.",
      "You will work the way a small professional team works — a branch per change, a pull request with a clear description, a review conversation, tests that run on every push, and a pipeline that refuses to ship something broken. The course is deliberately opinionated about the habits that prevent 2 a.m. incidents.",
      "The project takes a deliberately messy folder of code to a reviewed, tested, automatically shipped application — the same journey a first job will ask you to make.",
    ],
    audience: [
      "You are the only person who touches your code and want to be useful in a team.",
      "You have been asked to 'add tests' or 'do a code review' and are not sure what good looks like.",
      "You are applying for a junior role where the interview includes a take-home task.",
    ],
    prerequisites: [
      "You can build something small in any language and push it to GitHub.",
      "A laptop with Git installed.",
      "Five to seven hours across the course.",
    ],
    tools: ["Git and GitHub", "A test runner for your language", "GitHub Actions for continuous integration", "A linter and formatter configured in the project"],
    build: [
      "A repository with a readable, reviewable history",
      "A pull request review with comments you acted on",
      "A test suite covering the code paths that break in production",
      "A pipeline that runs tests and lints on every push",
      "A previously messy project, cleaned up and shipping automatically",
    ],
    after: [
      "DevOps & Delivery extends the pipeline to real deploys, monitoring and rollback.",
      "System Design & Architecture is where these habits meet bigger decisions.",
      "Employers rarely test whether you know Git; they assume it. This course makes it true and visible in your repository.",
    ],
  },

  "system-design-architecture": {
    overview: [
      "Once an application outgrows one developer and one server, the interesting problems begin: where state lives, what happens when a dependency fails, how a feature is added without rewriting everything, and how you defend those choices to people who will pay for them.",
      "You will learn to move from requirements to a sketch of a system: services and their boundaries, data models, caches and queues, background jobs, read models, third-party integrations, authentication, and the failure modes nobody plans for. We practise writing architecture decision records — the one-page documents that make your reasoning reviewable.",
      "The project is a ticket-booking system designed end to end, with every significant choice written down and defended. There is no single right answer; the marks are for recognising trade-offs and explaining yours clearly.",
    ],
    audience: [
      "You are comfortable building features and want to be trusted with the shape of a system.",
      "You are a mid-level developer preparing for a senior interview with a design round.",
      "You lead or contract and need to justify technical decisions to non-technical people.",
    ],
    prerequisites: [
      "Working experience building an application with an API and a database — Backend Development with Node.js or equivalent experience.",
      "Some exposure to cloud hosting or deployment helps.",
      "Four to six hours of reading and diagramming each week.",
    ],
    tools: ["A diagramming tool (Excalidraw, draw.io or even paper)", "A code editor for small proofs of concept", "The course's decision-record template"],
    build: [
      "Context diagrams from written requirements",
      "A data model with its boundaries and ownership drawn clearly",
      "A cache and queue plan with the invalidation strategy named",
      "A failure-mode review and a rollback plan",
      "A full design for a ticket-booking system, evaluated like a professional design review",
    ],
    after: [
      "DevOps & Delivery puts the operational half of these decisions into practice.",
      "AWS, GCP and infrastructure certifications build on the vocabulary from this course.",
      "Architecture rounds are where mid-level candidates in Ghana most often stall; this course is rehearsal for that conversation.",
    ],
  },

  "devops-and-delivery": {
    overview: [
      "Shipping is a skill, and most developers are never taught it. This course covers the path from your laptop to real users, safely and repeatably: environments and configuration, containers, pipelines, deployment, monitoring and — the part everyone learns the hard way — rollback and recovery.",
      "You will learn to keep secrets out of the repository, define an environment so it can be rebuilt exactly, build and push container images, automate deploy and rollback with a pipeline, and watch a live dashboard so a problem is noticed by you before it is noticed by a customer. Backups get their own lesson, because an untested backup is a rumour.",
      "The project is a one-command deploy with rollback and alerting, applied to a small application you already have — an infrastructure you can describe confidently in an interview.",
    ],
    audience: [
      "You can build an app and now need to run it for real users.",
      "You are the person who gets the 'the site is down' message.",
      "You are moving towards platform, SRE or DevOps work.",
    ],
    prerequisites: [
      "Comfort with a command line and deploying something simple once.",
      "A laptop with Docker Desktop installed, and a free cloud or VPS account for the deployment lessons.",
      "Six to eight hours across the course.",
    ],
    tools: ["Docker and docker-compose", "GitHub Actions (or another CI runner)", "A small cloud server or PaaS", "Environment and secret management from the host", "A monitoring and alerting service"],
    build: [
      "A Dockerfile and compose setup that rebuilds the app identically",
      "A pipeline that tests, builds and deploys on merge",
      "A rollback command you have actually run once, deliberately",
      "Monitoring, alerting and an automated backup with a restore rehearsal",
    ],
    after: [
      "Software Engineering Practices covers the review and testing half of a healthy delivery process.",
      "The one-command deploy here is exactly what this platform uses, so the patterns are real rather than academic.",
      "DevOps is chronically under-supplied in Ghana, and it pays accordingly.",
    ],
  },

  "vibe-coding-ship-with-ai": {
    overview: [
      "AI assistants can now write a working first version of almost anything. That makes the ability to describe what you want — and to judge what comes back — more valuable than typing speed. This course teaches that loop: describe, review, iterate, ship.",
      "You will learn how to brief an assistant with enough context to be useful, how to break a vague idea into instructions it can act on, how to read code you did not write well enough to change it, and how to notice the security and correctness traps that AI-generated code walks into — leaked secrets, missing validation, code that works once and then corrupts data.",
      "The project is a small app built by conversation and deployed, with every line of it something you can explain. By the end you can move from idea to working link in a weekend, without becoming the person who cannot debug their own product.",
    ],
    audience: [
      "You have an idea and no patience for a two-year learning curve before you can test it.",
      "You are a product manager, marketer or founder with access to AI tools and no idea what to trust.",
      "You are learning to code and want an honest picture of what assistants can and cannot do for you.",
    ],
    prerequisites: [
      "No programming background required — but you must be willing to read code, not just accept it.",
      "A laptop, an internet connection, and access to at least one AI coding assistant.",
      "Three to five hours, plus whatever the project you choose takes.",
    ],
    tools: ["An AI coding assistant (Cursor, Replit AI, GitHub Copilot or a chat model)", "GitHub for version control — the safety net when a change goes wrong", "A free host such as Netlify or Vercel", "The Code Lab for trying small pieces out"],
    build: [
      "A written brief that an assistant can actually work from",
      "An app skeleton generated from conversation, reviewed line by line",
      "Fixes for the security and data problems AI code commonly ships with",
      "A deployed app you built by conversation and understand well enough to change",
    ],
    after: [
      "AI Apps, Agents & APIs moves from building with a chat assistant to building products on a model API.",
      "JavaScript: Zero to Builder fills the gaps you will notice once you start reading the generated code.",
      "This is the fastest route in the catalogue to a working product you can show a client.",
    ],
  },

  "ai-apps-agents-and-apis": {
    overview: [
      "Using a chat window is not the same as building a product on a model. This course is about the second thing: calling a model from your own backend, putting your own data behind it, giving it tools, and keeping it fast, affordable and safe.",
      "You will learn prompt design as a product surface rather than a trick, retrieval so answers come from documents you trust instead of the model's memory, tool and agent patterns that let the model act without handing it your keys, and evaluation so you can prove quality changed when you changed the prompt. Cost and latency are treated as first-class design constraints, because an assistant that costs more than it earns is not a product.",
      "The project is a support assistant that answers from your own documents with a hard cost ceiling — an honest test of whether the design works when the questions are real.",
    ],
    audience: [
      "You are a developer who wants to add AI features that survive contact with real users.",
      "You have built a prototype with a chat assistant and need it to be reliable and affordable.",
      "You are preparing to work on AI products for a Ghanaian company or for clients abroad.",
    ],
    prerequisites: [
      "Comfortable JavaScript or Python, including calling an HTTP API from a server.",
      "Some experience with a backend and a database — Backend Development with Node.js or equivalent.",
      "A model API key with a small credit balance for the exercises.",
    ],
    tools: ["A model API (OpenAI, Anthropic, Google or an open model host)", "Node.js or Python for the backend", "A vector index for retrieval", "An evaluation script and a cost dashboard", "Git and GitHub"],
    build: [
      "A backend endpoint that calls a model with validation and rate limits",
      "A retrieval pipeline over your own documents, with citations",
      "A simple agent with tools it cannot misuse",
      "Evaluations that measure accuracy, latency and cost per answer",
      "A support assistant with a hard cost ceiling and a fallback for failures",
    ],
    after: [
      "System Design & Architecture is the next step for putting an AI service into a larger system.",
      "DevOps & Delivery keeps the model bill and the error rate visible in production.",
      "AI engineering is the fastest-growing job title in the market, and RAG, evals and cost control are what interviewers ask about.",
    ],
  },
  "ethical-hacking": {
    overview: [
      "A penetration test is a professional service with a contract, a scope and a report, not a folder of screenshots. This course teaches the work in that order: getting written authorisation first, mapping what an outsider can see, then exploiting only what is in scope and writing it up so the client can actually fix it.",
      "You will meet the weakness classes behind most real breaches — injection, broken authentication and session handling, broken access control, exposed storage and unpatched components — against a lab target rather than somebody's live website. Each technique is paired with the control that defeats it, so you learn the attack and the defence in the same lesson.",
      "The course ends with the deliverable clients pay for: findings ordered by risk, evidence a technical reader can reproduce, business impact a manager understands, and a retest that proves the fix worked. Law, consent and ethics are the first lesson, not a closing disclaimer.",
    ],
    audience: [
      "You already understand networks, operating systems and the shell, and want to test systems rather than only defend them.",
      "You are IT staff or a developer asked to find your own organisation's weaknesses before somebody else does.",
      "You are aiming at junior penetration testing, security analyst or consulting work in Ghana or remotely.",
    ],
    prerequisites: [
      "Comfortable in a Linux shell and with IP addressing and DNS — Cyber Security Foundations or Computer Networking covers the ground.",
      "A machine that can run a virtual lab: 8 GB of RAM is comfortable, 4 GB works with care.",
      "A written-authorisation habit: every exercise targets a lab you own, never a system you do not have permission to touch.",
    ],
    tools: [
      "Kali Linux in a virtual machine, or the same security tools on your own Linux install",
      "A deliberately vulnerable practice target such as DVWA or Metasploitable",
      "Nmap, Burp Suite Community Edition and Wireshark",
      "A penetration-test report template",
      "Git for keeping notes and evidence organised",
    ],
    build: [
      "An attack surface map of a target built from public sources only",
      "A scanning and enumeration report with the services found and what each one exposes",
      "A documented exploitation chain against an authorised lab target",
      "A client-ready penetration test report with risk ratings and fixes",
      "A retest checklist that confirms each fix held",
    ],
    after: [
      "Cloud Security covers the cloud misconfigurations that dominate modern breach reports.",
      "Computer Networks & Architecture explains the protocol behaviour underneath every technique here.",
      "Junior penetration testing and security analyst roles exist in Ghanaian banks, fintechs and consultancies, and remote contract testing is a growing market.",
    ],
  },

  "cloud-computing-devops": {
    overview: [
      "The cloud is other people's computers with an API, and somebody still has to be responsible for what runs on them. This course starts at the responsibility line — what the provider secures and what you secure — then teaches the practices that keep software running there: containers, infrastructure defined in code, tested pipelines, monitoring that notices a regression, and a deploy you can undo.",
      "You will package a service into an image that behaves the same on your laptop and on a server, describe the infrastructure that hosts it in version control, and ship changes through a pipeline with tests and a canary step. Failure is treated as normal: the exercises include a rollback and an incident where a dashboard, not a user, finds the problem first.",
      "The project leaves you with a service a team could genuinely operate: reproducible, monitored, affordable and documented.",
    ],
    audience: [
      "You can build and run an application locally and want to run it on real infrastructure responsibly.",
      "You work in a small team where there is no dedicated operations person.",
      "You are moving toward DevOps, platform or site reliability work.",
    ],
    prerequisites: [
      "Comfortable on the command line, with Git, and with at least one backend language or Node.js.",
      "Basic networking: what a port, a DNS record and an HTTP request are.",
      "A cloud account with a small budget or free-tier allowance, and a machine that can run containers.",
    ],
    tools: [
      "A cloud provider account — AWS appears in the examples, and the concepts transfer",
      "Docker and Docker Compose",
      "Terraform for infrastructure as code",
      "A CI/CD pipeline on your Git host",
      "Metrics and a dashboard you actually look at",
      "A managed database and object storage",
    ],
    build: [
      "A container image of your own service, built reproducibly",
      "Infrastructure described in code and applied from nothing",
      "A pipeline that tests and deploys on a commit",
      "A canary release, a rollback and a written runbook",
      "Dashboards and alerts that caught a deliberately introduced regression",
    ],
    after: [
      "DevOps & Delivery is the software-engineering view of the same pipeline ideas.",
      "Cloud Security covers identity, network boundaries and misconfiguration in the cloud.",
      "Cloud and platform skills are among the most requested in Ghanaian fintech, banking and remote hiring, and they pair well with system design on a CV.",
    ],
  },

  "data-science-analytics": {
    overview: [
      "Most data work is not modelling. It is deciding what question to ask, getting the data, and finding out why it is wrong. This course teaches that loop in the order it happens: frame a decision, pull and clean an export, describe the distribution honestly, then hand over a finding somebody can act on.",
      "You will work with spreadsheets, SQL and a notebook, on data that resembles the data you meet at work — duplicates, missing values, inconsistent names, dates entered as text and numbers that cannot be true. Charts and summary statistics are treated as arguments: chosen to communicate a point, not to decorate a page.",
      "It finishes with a one-page analytical note and the decision it changed, which is what an employer is buying when they hire an analyst.",
    ],
    audience: [
      "You are good with numbers and want the practical workflow that turns data into decisions.",
      "You already produce reports by hand in operations, sales, finance, health or education.",
      "You are moving toward a junior analyst role and want evidence on your CV before applying.",
    ],
    prerequisites: [
      "Comfortable with spreadsheets and with basic percentages and averages.",
      "No programming experience needed to start — the notebook lessons assume none.",
      "About five to six hours a week for two weeks.",
    ],
    tools: [
      "A spreadsheet application — Excel or Google Sheets",
      "A SQL database you can query, and the practice dataset the lessons use",
      "A notebook environment: Jupyter or Google Colab, both free",
      "A genuinely messy export to clean, because the mess is part of the course",
    ],
    build: [
      "A framed question with a measurable decision attached",
      "A cleaned dataset with every cleaning step documented",
      "A summary of central tendency and spread that survives a second look",
      "Charts chosen for a specific audience and purpose",
      "A one-page analytical note and the decision it supports",
    ],
    after: [
      "Databases & SQL goes deeper into the query language you used for aggregation.",
      "AI & Machine Learning is the next step if you want prediction rather than description.",
      "Analyst work in Ghanaian fintech, telecoms, retail and NGOs starts with exactly the deliverables this course produces.",
    ],
  },

  "human-computer-interaction": {
    overview: [
      "People do not read interfaces; they scan, guess and get interrupted. This course treats that as the specification, and designs for the conditions most users actually have: a mid-range phone, bright sunlight, one hand and data that costs money.",
      "You will learn the heuristics that predict usability problems before any testing, the interaction design process from task analysis to the cheapest possible prototype, accessibility as engineering rather than a courtesy, and mobile-first, low-bandwidth design. Testing with five people finds most of what is wrong, and you will run that test yourself rather than reading about it.",
      "The project is one real form or flow, redesigned and tested, with before-and-after numbers you can defend in a meeting.",
    ],
    audience: [
      "You design or build products and want evidence instead of opinion about what works.",
      "You are a developer who ends up making interface decisions by default.",
      "You work on a product whose users have different devices and data conditions than you do.",
    ],
    prerequisites: [
      "No design or coding experience required.",
      "Access to an interface you are allowed to change or redesign — your own product, or a public service form.",
      "Five people willing to spend twenty minutes being tested; colleagues and family are fine.",
    ],
    tools: [
      "A prototyping tool: Figma's free tier is what the examples use, and paper works for the first pass",
      "A mid-range phone, ideally the kind your users own",
      "A screen reader and a contrast checker for the accessibility lesson",
      "A notebook for test notes and timings",
    ],
    build: [
      "A task analysis and a scenario for one real flow",
      "Low-fidelity wireframes of at least two alternatives",
      "A tested prototype with five recorded sessions",
      "A redesigned flow with before-and-after task success and time",
      "An accessibility pass: contrast, labels, focus order and text alternatives",
    ],
    after: [
      "Web Designing covers the visual and client-facing side of website work.",
      "Graphic Design sharpens the layout and type decisions every interface depends on.",
      "Usability and accessibility skills are scarce in Ghana's market, and government, banking and NGO digital projects ask for them by name.",
    ],
  },

  "graphic-design": {
    overview: [
      "Design that looks amateur usually fails one of four measurable things: not enough contrast to guide the eye, no repetition to make a set feel related, nothing aligned, and spacing that ignores proximity. This course teaches those principles as working tools, then the craft on top: type, colour with measured contrast, and files that survive a printer.",
      "You will work on real briefs — a flyer, a business card, a poster — and learn the technical half that decides whether the work survives production: RGB versus CMYK, pixels versus vector, resolution, bleed, safe margins and export settings.",
      "It ends with a screen and print pack for one actual business, a brand sheet and a sane approach to pricing, because most designers in Ghana earn freelance from exactly this kind of job.",
    ],
    audience: [
      "You have an eye for design and want the principles and production knowledge behind it.",
      "You already make graphics in a template tool and want work that holds up commercially.",
      "You run a small business or side hustle and want to produce your own materials properly.",
    ],
    prerequisites: [
      "A computer that can run a design application; a mouse is much easier than a trackpad.",
      "No drawing skill required — this is composition and technique, not illustration.",
      "About four to five hours a week for two weeks.",
    ],
    tools: [
      "A vector or layout application — Inkscape and Affinity are capable, affordable alternatives to Illustrator",
      "A set of properly licensed typefaces",
      "A colour picker that checks contrast",
      "A print shop or printer you can ask real questions about formats",
    ],
    build: [
      "A flyer that reads at three metres and on a phone screen",
      "A business card with bleed and a safe margin",
      "A poster built on a deliberate hierarchy",
      "A brand sheet: palette, type, spacing and usage rules",
      "Print-ready and screen-ready exports of the same campaign",
    ],
    after: [
      "Web Designing applies the same visual system thinking to websites.",
      "Human-Computer Interaction covers the interface side of visual decisions.",
      "Freelance design for small businesses, churches, schools and events is the most accessible paid work in this field in Ghana.",
    ],
  },

  "web-designing": {
    overview: [
      "A website is a business outcome, not a picture. This course designs from the client's objective — more enquiries, fewer phone calls, more orders — through a brief, a structure and wireframes, and only then to visual design.",
      "You will build a design system for screens rather than a single mockup: layout and grid, a type scale, colour with contrast that passes, states for every interactive element, and responsive behaviour that starts at the smallest phone. Real content goes in early, because layouts break on real content and almost never on placeholder text.",
      "The last module is delivery: a handover a developer can build from without guessing, a launch that is measured, and the client and pricing conversations that turn one website into repeat work.",
    ],
    audience: [
      "You want to design websites professionally rather than assemble templates.",
      "You build sites as a developer and want to make the design decisions deliberately.",
      "You already do graphic design and want to move into screen work.",
    ],
    prerequisites: [
      "No coding required — this course is about design decisions and handover, not markup.",
      "A prototyping or design tool; Figma's free tier is used in the examples.",
      "One real business or organisation to design for. An invented client makes the project much weaker.",
    ],
    tools: [
      "Figma or a comparable design tool",
      "A phone and a computer, so the design is judged at both sizes",
      "Real content: the client's text, logo and photographs, however imperfect",
      "A contrast checker and a short accessibility checklist",
    ],
    build: [
      "A written brief with a measurable objective",
      "A site map and wireframes for five pages",
      "A visual system: grid, type scale, colour and component states",
      "A responsive prototype built on real content",
      "A handover document, plus launch and measurement notes",
    ],
    after: [
      "Web Development Foundations teaches you to build what you have designed.",
      "Human-Computer Interaction adds usability testing that improves the next version.",
      "Website design is steady freelance and in-house work in Ghana, and the handover skill is what separates a designer from somebody who makes pictures.",
    ],
  },

  "computer-networking": {
    overview: [
      "A network is a set of agreements between machines, plus the equipment that carries them. This course starts with what a network actually is, then how anything gets found: IP addresses issued by DHCP, MAC addresses on the local link, and DNS turning names into numbers.",
      "You will follow data as packets with headers, ports and protocols, then do the work that comes up on a Monday morning anywhere in Ghana — assembling a small network from a modem, a router, a switch and access points, planning Wi-Fi coverage, and troubleshooting in the order that finds faults fastest rather than the order that feels busiest.",
      "It is written for the person who keeps an office, a school or a shop connected, and for the beginner who wants networking foundations before going deeper.",
    ],
    audience: [
      "You are the person colleagues call when the internet stops working.",
      "You are starting in IT support, or studying networks and want the practical half first.",
      "You want a foundation before the engineering depth of network architecture.",
    ],
    prerequisites: [
      "Comfortable using a computer and a browser; no command-line experience assumed.",
      "Access to a router you are allowed to configure — a home or office network is ideal.",
      "About four hours a week for two weeks.",
    ],
    tools: [
      "A modem, a router and, if available, a switch and an access point to practise on",
      "A computer with a command line: ipconfig on Windows, ip or ifconfig on macOS and Linux",
      "Ping, traceroute and nslookup, all built into the operating system",
      "A notebook for drawing the network and recording addresses",
    ],
    build: [
      "A labelled diagram of a real network, including every device and address",
      "An addressing plan with static reservations for the equipment that needs them",
      "A Wi-Fi plan covering channel choice, placement and a guest network",
      "A troubleshooting sheet ordered by likelihood",
      "A documented small network somebody else can maintain",
    ],
    after: [
      "Computer Networks & Architecture goes into routing, switching, subnetting and design.",
      "Cyber Security Foundations shows how the same protocols are attacked and defended.",
      "IT support is the most common entry-level technology job in Ghana, and a documented troubleshooting habit is what gets you promoted out of it.",
    ],
  },

  "computer-networks-architecture": {
    overview: [
      "Layering is the decision that let the internet grow: each layer offers a service upward and uses the layers below without needing to know how they work. This course takes that abstraction apart — the layered architecture, how protocols are designed, and what a router and a switch actually do with a packet or a frame.",
      "Then it becomes design work. Subnetting is taught as arithmetic you can do under pressure; segmentation and VLANs as a policy decision rather than a formula; redundancy as a plan for what happens when a piece fails; and performance as measurement — throughput, latency, jitter and loss — so arguments about a slow network end with evidence.",
      "The project is a design document for a two-floor organisation: address plan, segmentation, redundancy and a capacity estimate with the assumptions written down.",
    ],
    audience: [
      "You already know what an IP address and a router are and want the engineering underneath.",
      "You are moving from IT support into network administration or design.",
      "You are preparing for certification or interviews that require real understanding rather than memorised commands.",
    ],
    prerequisites: [
      "Comfortable with IP addressing, DNS, ping and traceroute — Computer Networking covers that ground.",
      "Patience with binary and basic arithmetic; the subnetting lesson builds it from scratch.",
      "About five hours a week for two weeks.",
    ],
    tools: [
      "Wireshark, so you see the layers instead of reading about them",
      "A simulator or lab: Packet Tracer, GNS3 or a virtual machine running routing software",
      "A diagramming tool — draw.io is enough",
      "Command-line tools on any operating system",
    ],
    build: [
      "An annotated packet capture showing encapsulation through the layers",
      "A subnet plan for a site with several departments, with the arithmetic shown",
      "A segmentation policy using VLANs and access rules",
      "A redundancy plan stating what fails over and how long it takes",
      "A capacity estimate and a performance baseline for the design",
    ],
    after: [
      "Cyber Security: Offense and Defense and Cloud Security both build on network behaviour.",
      "System Design & Architecture applies the same reasoning to application services.",
      "Network administration and design roles in banks, ISPs and large institutions reward exactly this document-driven approach.",
    ],
  },

  "computer-basics-bcc": {
    overview: [
      "This course assumes nothing. It names the parts of a desktop and a laptop and explains what each one does, shows how to start, use and shut down a machine safely, and covers the skills that cause the most early frustration: files, folders, the mouse, and finding a document again tomorrow.",
      "From there it covers the internet and email in the vocabulary a beginner actually needs — Wi-Fi versus mobile data, what a browser and a search engine are, how to tell a safe page from a trap, and how to write an email somebody answers. It also covers the habits that protect your work: strong passwords, a backup you have tested, and updates that are not postponed forever.",
      "Everything is taught on the machine you have, with printed checklists you can keep beside the computer, because the goal is confidence rather than vocabulary.",
    ],
    audience: [
      "You have never used a computer, or use one for a few tasks and want to stop guessing.",
      "You are starting an office, teaching or shop job that expects computer literacy.",
      "You are teaching a family member or a class and want a sensible order to teach it in.",
    ],
    prerequisites: [
      "Access to a computer — Windows appears in the examples and the ideas transfer to any machine.",
      "No previous experience whatsoever.",
      "About two to three hours a week for two weeks; the lessons are short on purpose.",
    ],
    tools: [
      "A desktop or laptop computer",
      "A notebook or printed checklist for each lesson",
      "An email account you can practise with safely",
      "A USB flash drive for practising files, copies and backups",
    ],
    build: [
      "A workstation you set up and can explain, cable by cable",
      "A folder system for your own documents, with names you will still understand in a year",
      "A practised routine for saving, copying and finding files",
      "A tested backup: a copy you have actually restored from",
      "A printed checklist for whoever uses the computer next",
    ],
    after: [
      "Microsoft Office is the natural next step for documents, spreadsheets and presentations.",
      "Computer Networking explains what happens after you connect to Wi-Fi.",
      "Basic computer literacy is asked for in almost every office, teaching and administrative job in Ghana, and it is the fastest way to stop being afraid of the machine.",
    ],
  },

  "microsoft-office": {
    overview: [
      "Word, Excel, PowerPoint and shared files are where most office work in Ghana actually happens, and most people use a fraction of them badly. This course teaches them as professional tools: documents that maintain themselves, spreadsheets that stay correct, presentations that work in the room, and files nobody overwrites.",
      "In Word you will build a long document on styles, headings and an automatic table of contents. In Excel you will rebuild a spreadsheet that reconciles, with real formulas, validation and a pivot summary instead of hand-typed totals. In PowerPoint you will structure an argument and deliver it. The final lesson covers shared work: versions, comments, permissions and a folder structure a team can follow.",
      "The project is a reusable template pack plus a rebuilt spreadsheet and a delivered presentation, so you leave with assets rather than notes.",
    ],
    audience: [
      "You use Office daily and suspect several things are being done the long way.",
      "You produce reports, budgets or presentations that other people depend on.",
      "You are preparing for administrative, finance, teaching or management work.",
    ],
    prerequisites: [
      "A computer with Word, Excel and PowerPoint — Microsoft 365 or Office 2016 and later; LibreOffice works if that is what you have",
      "Basic file handling: saving, opening and copying documents",
      "About four hours a week for two weeks",
    ],
    tools: [
      "Word, Excel and PowerPoint",
      "One real spreadsheet or report from your own work to improve",
      "A cloud drive or shared folder for the collaboration lesson",
      "A printer or PDF export for checking what a document actually looks like",
    ],
    build: [
      "A reusable Word template with styles and an automatic table of contents",
      "A rebuilt spreadsheet that reconciles, with validation and a pivot summary",
      "A presentation structured around one argument, rehearsed",
      "A shared folder system with naming rules and permissions",
      "A checklist for sending files that other people can open",
    ],
    after: [
      "Data Science & Analytics takes the spreadsheet skills into real analysis and SQL.",
      "Computer Basics covers the machine itself if any of the fundamentals still feel shaky.",
      "Office fluency is the most commonly listed requirement in Ghanaian job adverts, and the template pack you build here follows you into every role afterwards.",
    ],
  },

  "programming-languages": {
    overview: [
      "Most developers are fluent in one language and trapped by it. This course is about the landscape: how languages differ in paradigm, typing and execution model; what actually happens between a source file and a running program; and how to read unfamiliar code and pick up the next language in weeks rather than years.",
      "You will compare imperative, object-oriented and functional approaches to the same small problem, follow compilation and interpretation from tokens to instructions, and read a language you have never used with a method instead of panic. Typing — static and dynamic, strong and weak — is covered as a design trade-off you can reason about, not a war to pick a side in.",
      "The project is deliberately uncomfortable: a small working service in a language you did not know at the start, reviewed by somebody who uses that language professionally.",
    ],
    audience: [
      "You are comfortable in one language and want to work in others without starting from zero.",
      "You are preparing for interviews that ask why a language behaves the way it does.",
      "You teach or mentor and want to explain the fundamental differences accurately.",
    ],
    prerequisites: [
      "Real experience in at least one language: variables, functions, loops, collections and error handling.",
      "Comfortable reading documentation and working on the command line.",
      "About five to six hours a week for two weeks, including the unfamiliar-language project.",
    ],
    tools: [
      "A code editor with support for several languages",
      "At least two runtimes installed — for example Python and Node.js, plus a compiled language such as Go or Java",
      "A playground or REPL for quick experiments",
      "A reviewer who knows your target language",
    ],
    build: [
      "A written comparison of three paradigms solving the same problem",
      "A traced example from source code to execution",
      "A reading log of an unfamiliar codebase, with the questions you had and the answers you found",
      "A study plan for your next language, listing the six things you always learn first",
      "A small working service in the new language, reviewed",
    ],
    after: [
      "Data Structures & Algorithms makes you effective in whichever language you choose.",
      "System Design & Architecture is about the systems those languages build.",
      "Breadth across languages is what makes you portable — for remote work, for platform teams, and for the moment a project's language changes.",
    ],
  },

  "artificial-intelligence-machine-learning": {
    overview: [
      "Artificial intelligence is the field; machine learning is the technique that dominates it today; and neither is magic, consciousness or a search engine. This course explains what these systems actually do, what they are good at and where they fail, in language you can use in a meeting.",
      "You will follow the machine-learning workflow from framing a problem as a measurable prediction, through data, training, evaluation and monitoring; open the box far enough to reason about neurons, layers and what generative models are doing; and work through the harms that are specific to machine learning — bias against people the data under-represents, confident wrong answers, privacy, and the cost of acting on predictions about people.",
      "The project has two halves: a grounded assistant that cites its sources and refuses correctly, and a responsible-deployment review of a model that makes decisions about people.",
    ],
    audience: [
      "You build software and want to know when AI is the right tool and when it is not.",
      "You manage or commission products and need to judge the claims made about AI.",
      "You are preparing for AI engineering, data or product work and want the concepts before the frameworks.",
    ],
    prerequisites: [
      "Comfortable with basic algebra and with reading a chart or a table.",
      "Some programming or spreadsheet experience helps for the exercises; no mathematics beyond secondary school is assumed.",
      "About five hours a week for two weeks.",
    ],
    tools: [
      "A notebook environment — Google Colab's free tier is enough",
      "A small dataset with a decision attached to it",
      "A model API key for the grounded-assistant exercise",
      "A glossary you write yourself, because the vocabulary is half the barrier in this field",
    ],
    build: [
      "A problem framed as a measurable prediction, with a baseline to beat",
      "A simple model trained, evaluated and honestly reported on",
      "An annotated explanation of how a neural network reaches its output",
      "A grounded assistant that cites sources and refuses when it should",
      "A responsible-deployment review naming the risks and the mitigation for each",
    ],
    after: [
      "AI Apps, Agents & APIs turns the concepts into production features on a model API.",
      "Data Science & Analytics supplies the data handling the workflow depends on.",
      "Demand for people who can judge an AI system — its data, its evaluation and its risks — is growing faster than demand for people who can only call an API.",
    ],
  },
};

/** The brief for a course, or a sensible fallback for owner-published content. */
export function courseBrief(course: Course): CourseBrief {
  const brief = BRIEFS[course.id];
  if (brief) return brief;
  return {
    overview: [course.description],
    audience: ["Anyone who wants a practical introduction to this material."],
    prerequisites: ["No previous experience is required."],
    tools: ["A laptop and a browser."],
    build: [course.project],
    after: [`Continue with another course in the ${course.category} program.`],
  };
}

/** True when a hand-written brief exists (used to hide empty sections). */
export function hasCourseBrief(courseId: string): boolean {
  return Boolean(BRIEFS[courseId]);
}
