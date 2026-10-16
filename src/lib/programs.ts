import type { Course, CourseTone } from "./courses";
import { lesson, module } from "./lesson-builder";
import { DATA_STRUCTURES_ALGORITHMS_MODULES } from "@/content/data-structures-algorithms";
import { DATABASES_AND_SQL_MODULES } from "@/content/databases-and-sql";
import { SOFTWARE_ENGINEERING_PRACTICES_MODULES } from "@/content/software-engineering-practices";
import { SYSTEM_DESIGN_ARCHITECTURE_MODULES } from "@/content/system-design-architecture";
import { DEVOPS_AND_DELIVERY_MODULES } from "@/content/devops-and-delivery";
import { VIBE_CODING_SHIP_WITH_AI_MODULES } from "@/content/vibe-coding-ship-with-ai";
import { AI_APPS_AGENTS_AND_APIS_MODULES } from "@/content/ai-apps-agents-and-apis";
import { CYBER_SECURITY_FOUNDATIONS_MODULES } from "@/content/cyber-security-foundations";
import { CYBER_SECURITY_OFFENSE_AND_DEFENSE_MODULES } from "@/content/cyber-security-offense-and-defense";
import { CYBER_SECURITY_CLOUD_MODULES } from "@/content/cyber-security-cloud";
import { ETHICAL_HACKING_MODULES } from "@/content/ethical-hacking";
import { CLOUD_COMPUTING_DEVOPS_MODULES } from "@/content/cloud-computing-devops";
import { DATA_SCIENCE_ANALYTICS_MODULES } from "@/content/data-science-analytics";
import { HUMAN_COMPUTER_INTERACTION_MODULES } from "@/content/human-computer-interaction";
import { GRAPHIC_DESIGN_MODULES } from "@/content/graphic-design";
import { WEB_DESIGNING_MODULES } from "@/content/web-designing";
import { COMPUTER_NETWORKING_MODULES } from "@/content/computer-networking";
import { COMPUTER_NETWORKS_ARCHITECTURE_MODULES } from "@/content/computer-networks-architecture";
import { COMPUTER_BASICS_BCC_MODULES } from "@/content/computer-basics-bcc";
import { MICROSOFT_OFFICE_MODULES } from "@/content/microsoft-office";
import { PROGRAMMING_LANGUAGES_MODULES } from "@/content/programming-languages";
import { AI_ML_MODULES } from "@/content/artificial-intelligence-machine-learning";

/**
 * The twelve programs, and the courses under them.
 *
 * Every course in the catalog belongs to exactly one program (its `category`).
 * The core catalog in `courses.ts` already covers the fundamentals; this file
 * adds the courses that make each program a complete path rather than a single
 * course:
 *
 *   Computer Science       → essentials (core) + data structures + databases + programming languages
 *   Software Engineering   → practices + system design + devops
 *   Vibe Coding            → ship with AI + AI apps, agents & APIs
 *   Web Development        → foundations + JavaScript + React (core)
 *   App Development        → mobile apps with React Native (core)
 *   Backend                → backend development with Node.js (core)
 *   Cyber Security         → foundations + offense & defense + cloud security + ethical hacking
 *   Data Science           → data science & analytics
 *   Design                 → human-computer interaction + graphic design + web designing
 *   IT Essentials          → computer basics (BCC) + computer networking +
 *                            computer networks & architecture + Microsoft Office
 *   Cloud & DevOps         → cloud computing & DevOps
 *   AI & Machine Learning  → artificial intelligence & machine learning (AI/ML)
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
  icon: "cpu" | "briefcase" | "spark" | "browser" | "mobile" | "server" | "shield" | "layers" | "terminal";
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
  {
    id: "cyber-security",
    category: "Cyber Security",
    cover: "/course-covers/cyber-security.jpg",
    name: "Cyber Security",
    tagline: "Think like an attacker, build like a defender",
    description:
      "How systems get broken and how to keep them safe: networks, authentication, common attacks, secure coding and responding when something goes wrong.",
    icon: "shield",
    tone: "blue",
  },
  {
    id: "data-science",
    category: "Data Science",
    name: "Data Science",
    tagline: "Turn rows into decisions",
    description:
      "The analyst's whole loop: ask a question precise enough to answer, clean the data honestly, describe it without misleading anybody, and put the result in front of the person who decides.",
    icon: "cpu",
    tone: "cyan",
  },
  {
    id: "design",
    category: "Design",
    name: "Design",
    tagline: "Make it usable, make it look intentional",
    description:
      "Interfaces people can actually use, graphic design with principles behind it, and websites designed from a business objective and a brief rather than from a colour preference.",
    icon: "browser",
    tone: "pink",
  },
  {
    id: "it-essentials",
    category: "IT Essentials",
    name: "IT Essentials",
    tagline: "The IT skills every office needs",
    description:
      "Start from a computer you have never switched on, then learn the networking and office software that runs a small business — and how to keep machines safe, backed up and working.",
    icon: "server",
    tone: "green",
  },
  {
    id: "cloud-devops",
    category: "Cloud & DevOps",
    name: "Cloud & DevOps",
    tagline: "Run it somewhere reliable, ship it without fear",
    description:
      "What the cloud is, which responsibility you are accepting, and how professionals deliver: containers, infrastructure as code, pipelines, observability and rollback.",
    icon: "server",
    tone: "orange",
  },
  {
    id: "ai-machine-learning",
    category: "AI & Machine Learning",
    name: "AI & Machine Learning",
    tagline: "Know what the model can and cannot do",
    description:
      "Machine learning from the workflow up — framing, data, evaluation, neural networks and generative AI — plus the ethics and guardrails that decide whether a model should be deployed at all.",
    icon: "spark",
    tone: "violet",
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
  },
  {
    id: "cyber-security-foundations",
    slug: "cyber-security-foundations",
    title: "Cyber Security Foundations",
    shortTitle: "Cyber Foundations",
    description:
      "How networks carry data, how Linux systems are run and locked down, and how to script the checks: the groundwork for every security role.",
    category: "Cyber Security",
    level: "Beginner",
    tone: "blue",
    icon: "terminal",
    instructor: { name: "codemasterghana Team", role: "Course team", initials: "CM" },
    rating: 0,
    learners: 0,
    project: "A lab network with a hardened Linux server and a Python tool that audits it",
    outcomes: [
      "Trace a web request through every layer and read packets in Wireshark",
      "Scan and firewall a host with nmap and nftables",
      "Harden a Linux server with key-only SSH, permissions and updates",
      "Write Python tools that parse logs and verify files",
    ],
    tags: ["Networking", "Linux", "Python", "Foundations"],
    modules: CYBER_SECURITY_FOUNDATIONS_MODULES,
  },
  {
    id: "cyber-security-offense-and-defense",
    slug: "cyber-security-offense-and-defense",
    title: "Cyber Security: Offense and Defense",
    shortTitle: "Security",
    description:
      "Learn how web applications and systems are attacked, how to test them legally, and how to detect and respond. Every attack is paired with its defence.",
    category: "Cyber Security",
    level: "Intermediate",
    tone: "blue",
    icon: "layers",
    instructor: { name: "codemasterghana Team", role: "Course team", initials: "CM" },
    rating: 0,
    learners: 0,
    project: "A penetration test report on a deliberately vulnerable lab app, with the fixes verified",
    outcomes: [
      "Find and fix injection, XSS, CSRF and broken access control",
      "Run a legal, scoped reconnaissance and exploitation workflow",
      "Write detection rules and triage an alert to containment",
      "Plan hardening, patching and backups, and run an incident response",
    ],
    tags: ["Web security", "Ethical hacking", "Blue team", "OWASP"],
    modules: CYBER_SECURITY_OFFENSE_AND_DEFENSE_MODULES,
  },
  {
    id: "cyber-security-cloud",
    slug: "cyber-security-cloud",
    title: "Cloud Security",
    shortTitle: "Cloud Security",
    description:
      "Secure identities, networks, data and configuration in the cloud, and learn to detect and contain a compromised cloud account.",
    category: "Cyber Security",
    level: "Intermediate",
    tone: "blue",
    icon: "server",
    instructor: { name: "codemasterghana Team", role: "Course team", initials: "CM" },
    rating: 0,
    learners: 0,
    project: "A three-tier cloud design with an audited identity model, encrypted data and a rehearsed response",
    outcomes: [
      "Apply least privilege with roles, policies and MFA",
      "Build private networks and protect workloads and secrets",
      "Check infrastructure code against a benchmark before it deploys",
      "Investigate a leaked cloud credential using the audit trail",
    ],
    tags: ["AWS", "IAM", "Cloud security", "Infrastructure as code"],
    modules: CYBER_SECURITY_CLOUD_MODULES,
  },
  {
    id: "ethical-hacking",
    cover: "/course-covers/ethical-hacking.jpg",
    slug: "ethical-hacking",
    title: "Ethical Hacking",
    shortTitle: "Ethical Hacking",
    description:
      "Learn how systems are actually broken — reconnaissance, scanning, exploitation of real weaknesses — under written authorization, and how to report it so the client can fix it.",
    category: "Cyber Security",
    level: "Intermediate",
    tone: "blue",
    icon: "terminal",
    instructor: { name: "codemasterghana Team", role: "Course team", initials: "CM" },
    rating: 0,
    learners: 0,
    project: "A client-ready penetration test report on an authorised lab target, with evidence and verified fixes",
    outcomes: [
      "Work inside a written scope, with authorization and a rules-of-engagement document",
      "Map an organisation's attack surface using passive sources first",
      "Test access control, injection, authentication and configuration methodically",
      "Prove impact with the smallest action, escalate early and stop",
      "Write a report a client acts on, and verify the fixes afterwards",
    ],
    tags: ["Penetration testing", "OWASP", "Reconnaissance", "Reporting"],
    modules: ETHICAL_HACKING_MODULES,
  },
  {
    id: "cloud-computing-devops",
    cover: "/course-covers/cloud-computing-devops.jpg",
    slug: "cloud-computing-devops",
    title: "Cloud Computing & DevOps",
    shortTitle: "Cloud & DevOps",
    description:
      "Understand what the cloud really is and who is responsible for what, then run software there properly: containers, infrastructure as code, pipelines, monitoring and rollback.",
    category: "Cloud & DevOps",
    level: "Intermediate",
    tone: "orange",
    icon: "server",
    instructor: { name: "Nana Aidoo", role: "Platform Engineer", initials: "NA" },
    rating: 0,
    learners: 0,
    project: "A containerised service with infrastructure as code, a canary deploy, a rollback and dashboards that notice a regression",
    outcomes: [
      "Explain IaaS, PaaS and SaaS by where the responsibility line sits",
      "Design a cloud-native service: stateless, externalised state, queues for slow work",
      "Containerise an application and describe it as infrastructure as code",
      "Build a pipeline that tests, scans, deploys and can roll back",
      "Observe a running system with logs, metrics, traces and one honest SLO",
    ],
    tags: ["AWS", "Docker", "Terraform", "CI/CD", "Observability"],
    modules: CLOUD_COMPUTING_DEVOPS_MODULES,
  },
  {
    id: "data-science-analytics",
    cover: "/course-covers/data-science-analytics.jpg",
    slug: "data-science-analytics",
    title: "Data Science & Analytics",
    shortTitle: "Data Science",
    description:
      "Answer questions with data: frame a decision, clean what arrives from the real world, describe a distribution honestly, and hand over a finding somebody can act on.",
    category: "Data Science",
    level: "Beginner",
    tone: "cyan",
    icon: "cpu",
    instructor: { name: "Ama Boateng", role: "Data Engineer", initials: "AB" },
    rating: 0,
    learners: 0,
    project: "A one-page analytical note and a tested decision — from a messy export to a copy of it people trust",
    outcomes: [
      "Turn a vague request into a falsifiable question with a definition and a period",
      "Clean a real dataset reproducibly, with a change log and a reconciliation",
      "Choose the right average and chart for the shape of the data",
      "Aggregate with SQL and build a dashboard with decisions attached",
      "Run an A/B test and report a difference with a confidence interval",
    ],
    tags: ["Analytics", "SQL", "Statistics", "Dashboards", "A/B testing"],
    modules: DATA_SCIENCE_ANALYTICS_MODULES,
  },
  {
    id: "human-computer-interaction",
    cover: "/course-covers/human-computer-interaction.jpg",
    slug: "human-computer-interaction",
    title: "Human-Computer Interaction",
    shortTitle: "HCI",
    description:
      "Design interfaces for people who scan, guess, get interrupted and use a mid-range phone in bright sunlight — with usability testing that finds the problems before your users do.",
    category: "Design",
    level: "Beginner",
    tone: "pink",
    icon: "mobile",
    instructor: { name: "Efua Sarpong", role: "Product Designer", initials: "ES" },
    rating: 0,
    learners: 0,
    project: "One real form or flow redesigned and tested with five people, with before-and-after numbers",
    outcomes: [
      "Apply usability's five components and Norman's principles to a real screen",
      "Run a usability test with five participants and record findings by severity",
      "Fix accessibility: contrast, keyboard access, screen readers, zoom and motion",
      "Design mobile-first, with real touch targets and one-handed reach",
      "Budget bytes and design for a metered, flaky connection",
    ],
    tags: ["Usability", "Accessibility", "Mobile-first", "User testing"],
    modules: HUMAN_COMPUTER_INTERACTION_MODULES,
  },
  {
    id: "graphic-design",
    cover: "/course-covers/graphic-design.jpg",
    slug: "graphic-design",
    title: "Graphic Design",
    shortTitle: "Graphic Design",
    description:
      "The principles that make work look intentional — contrast, repetition, alignment, proximity — then the practical craft: type, colour with measured contrast, and files that survive a printer.",
    category: "Design",
    level: "Beginner",
    tone: "violet",
    icon: "layers",
    instructor: { name: "Kojo Asante", role: "Designer", initials: "KA" },
    rating: 0,
    learners: 0,
    project: "A print and screen pack for one real business — flyer, business card, poster — with a brand sheet and print-ready files",
    outcomes: [
      "Apply the four principles and test them with the squint and greyscale checks",
      "Set type deliberately: scale, line height, measure and tracking",
      "Choose colour with contrast ratios and a 60/30/10 palette",
      "Prepare print-ready files with bleed, CMYK and 300 ppi images",
      "Run a design job as a business: brief, quote, revisions and handover",
    ],
    tags: ["Layout", "Typography", "Colour", "Print production"],
    modules: GRAPHIC_DESIGN_MODULES,
  },
  {
    id: "web-designing",
    cover: "/course-covers/web-designing.jpg",
    slug: "web-designing",
    title: "Web Designing",
    shortTitle: "Web Designing",
    description:
      "Design websites from the client's objective rather than from a colour preference: brief, structure and wireframes, visual design systems for screens, and a handover developers can build from.",
    category: "Design",
    level: "Beginner",
    tone: "blue",
    icon: "browser",
    instructor: { name: "Maya Owusu", role: "Frontend Engineer", initials: "MO" },
    rating: 0,
    learners: 0,
    project: "A five-page website designed end to end — structure, visual system, real content, handover and a measured launch",
    outcomes: [
      "Turn a client's complaint into a measurable business objective",
      "Build a sitemap, user flows and wireframes, and test the structure with five people",
      "Create a screen design system: grid, spacing, type scale, colour tokens, components",
      "Hand over tokens, assets, annotations and content a developer can build without questions",
      "Price and run the work: proposal, deposits, revisions and a care plan",
    ],
    tags: ["Wireframing", "Design systems", "Responsive design", "Client work"],
    modules: WEB_DESIGNING_MODULES,
  },
  {
    id: "computer-networking",
    cover: "/course-covers/computer-networking.jpg",
    slug: "computer-networking",
    title: "Computer Networking",
    shortTitle: "Networking",
    description:
      "How computers talk to each other: addresses, names, packets, ports and protocols, then how to build, secure and troubleshoot a real home or office network.",
    category: "IT Essentials",
    level: "Beginner",
    tone: "green",
    icon: "nodes",
    instructor: { name: "Ibrahim Cole", role: "Network Engineer", initials: "IC" },
    rating: 0,
    learners: 0,
    project: "A working small network, documented — addressing plan, Wi-Fi plan and a troubleshooting sheet somebody else can follow",
    outcomes: [
      "Measure a connection: bandwidth, throughput, latency, jitter and loss",
      "Explain DHCP, DNS, ARP and NAT, and read ipconfig, ping, nslookup and arp",
      "Describe packets, ports and the difference between TCP and UDP",
      "Build a small network from modem, router, switch and access points",
      "Diagnose faults with the six-rung troubleshooting ladder",
    ],
    tags: ["TCP/IP", "DNS", "Wi-Fi", "Troubleshooting"],
    modules: COMPUTER_NETWORKING_MODULES,
  },
  {
    id: "computer-networks-architecture",
    cover: "/course-covers/computer-networks-architecture.jpg",
    slug: "computer-networks-architecture",
    title: "Computer Networks & Architecture",
    shortTitle: "Network Architecture",
    description:
      "The engineering behind a network: layered architecture and protocol design, routing and switching internals, subnetting as arithmetic, redundancy, and the measurements that settle performance arguments.",
    category: "IT Essentials",
    level: "Intermediate",
    tone: "cyan",
    icon: "cpu",
    instructor: { name: "Kwame Mensah", role: "Staff Engineer", initials: "KM" },
    rating: 0,
    learners: 0,
    project: "A network design document for a two-floor organisation: subnet plan, segmentation policy, redundancy plan and capacity estimate",
    outcomes: [
      "Map OSI to TCP/IP and say which layer owns a fault or a control",
      "Explain longest prefix match, VLANs, NAT and path MTU discovery",
      "Plan a VLSM address scheme and write the policy segmentation enables",
      "Buy redundancy deliberately: dual WAN, dual power, first-hop redundancy",
      "Diagnose performance with mtr, iperf3, captures and flow data",
    ],
    tags: ["Routing", "Subnetting", "VLANs", "Network design"],
    modules: COMPUTER_NETWORKS_ARCHITECTURE_MODULES,
  },
  {
    id: "computer-basics-bcc",
    cover: "/course-covers/computer-basics-bcc.jpg",
    slug: "computer-basics-bcc",
    title: "Computer Basics / BCC (Basic Computer Course)",
    shortTitle: "Computer Basics",
    description:
      "The course that assumes nothing: parts and ports, switching a computer on and off safely, files and folders, the internet and email, and the habits that keep a machine — and your work — safe.",
    category: "IT Essentials",
    level: "Beginner",
    tone: "green",
    icon: "browser",
    instructor: { name: "codemasterghana Team", role: "Course team", initials: "CM" },
    rating: 0,
    learners: 0,
    project: "A workstation you set up and can explain, plus a folder system, a tested backup and a printed checklist for whoever uses it next",
    outcomes: [
      "Name the parts of a computer and start and shut one down correctly",
      "Use the desktop, windows, files, folders and the essential shortcuts",
      "Connect to the internet, browse safely and send email properly",
      "Recognise phishing and never type a PIN or one-time password into a page",
      "Protect a machine with surge protection, updates, backups and strong passwords",
    ],
    tags: ["Computer basics", "Files", "Email", "Safety", "Beginners"],
    modules: COMPUTER_BASICS_BCC_MODULES,
  },
  {
    id: "microsoft-office",
    cover: "/course-covers/microsoft-office.jpg",
    slug: "microsoft-office",
    title: "Microsoft Office",
    shortTitle: "Microsoft Office",
    description:
      "Word, Excel, PowerPoint and shared files as professional tools: documents that update themselves, spreadsheets that stay correct, presentations that work in the room, and files nobody overwrites.",
    category: "IT Essentials",
    level: "Beginner",
    tone: "blue",
    icon: "briefcase",
    instructor: { name: "Selina Adjei", role: "Engineering Lead", initials: "SA" },
    rating: 0,
    learners: 0,
    project: "A reusable document template, a rebuilt spreadsheet that reconciles, a delivered presentation and a shared file system",
    outcomes: [
      "Build Word documents with styles, automatic contents pages, sections and captions",
      "Structure Excel data, aggregate with SUMIFS, look up with XLOOKUP and pivot",
      "Set up a slide master and build a deck that argues one claim per slide",
      "Collaborate with co-authoring, version history, permissions and comments",
      "Keep an independent backup and write email that files itself",
    ],
    tags: ["Word", "Excel", "PowerPoint", "Collaboration"],
    modules: MICROSOFT_OFFICE_MODULES,
  },
  {
    id: "programming-languages",
    cover: "/course-covers/programming-languages.jpg",
    slug: "programming-languages",
    title: "Programming Languages",
    shortTitle: "Programming Languages",
    description:
      "Stop being trapped by one syntax: how languages differ in paradigm, typing and execution, how they run underneath, how to read unfamiliar code, and how to learn the next language in weeks.",
    category: "Computer Science",
    level: "Intermediate",
    tone: "violet",
    icon: "braces",
    instructor: { name: "Elena Park", role: "Full-stack Developer", initials: "EP" },
    rating: 0,
    learners: 0,
    project: "A small service written in a language you did not know, reviewed by somebody who uses it professionally",
    outcomes: [
      "Compare languages by paradigm, typing, memory, concurrency and error convention",
      "Trace source to running program: parsing, type checking, linking, run time",
      "Explain the stack, the heap, scope, closures and memory leaks in managed languages",
      "Read an unfamiliar codebase with a method: entry point, data model, tests, debugger",
      "Learn a new language to functional competence on a four-week plan with evidence",
    ],
    tags: ["Paradigms", "Typing", "Compilers", "Learning to code"],
    modules: PROGRAMMING_LANGUAGES_MODULES,
  },
  {
    id: "artificial-intelligence-machine-learning",
    cover: "/course-covers/artificial-intelligence-machine-learning.jpg",
    slug: "artificial-intelligence-machine-learning",
    title: "Artificial Intelligence & Machine Learning (AI/ML)",
    shortTitle: "AI & ML",
    description:
      "What these systems actually do, what they are good for and where they fail: the machine-learning workflow, neural networks and generative AI, and the ethics of deploying AI where people are affected.",
    category: "AI & Machine Learning",
    level: "Intermediate",
    tone: "pink",
    icon: "spark",
    instructor: { name: "Kojo Asante", role: "AI Engineer", initials: "KA" },
    rating: 0,
    learners: 0,
    project: "A grounded assistant that cites its sources, refuses correctly — and a responsible-deployment review of a model that decides about people",
    outcomes: [
      "Define AI, ML, deep learning, generative AI and agents precisely",
      "Run the workflow: frame, split honestly, beat a baseline, evaluate by cost of error",
      "Recognise overfitting, data leakage and drift — and prevent each",
      "Build with models you did not train: prompting, retrieval, guardrails and evaluation",
      "Review a model for bias, privacy and accountability before deployment",
    ],
    tags: ["Machine learning", "Neural networks", "Generative AI", "Responsible AI"],
    modules: AI_ML_MODULES,
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
