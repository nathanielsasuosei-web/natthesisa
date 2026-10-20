/**
 * Practical tools for every lesson.
 *
 * Each lesson page gets a small workbench of interactive tools matched to what
 * the lesson teaches: a web playground for HTML lessons, a SQL lab for
 * database lessons, a subnet calculator for networking lessons, and so on.
 * Everything runs locally in the learner's browser — no server round trip, no
 * account needed beyond the lesson itself.
 *
 * This module is pure (no React, no Node APIs) so both the lesson page
 * (server) and the workbench (client) can use it. The matching is heuristic
 * on purpose: 148 lessons cannot each be hand-configured, so every course
 * declares its default tools and keyword rules refine the pick per lesson.
 * Owner-published lessons fall back to their course's defaults.
 */

export type LessonToolId =
  | "web-playground"
  | "js-console"
  | "python-lab"
  | "sql-lab"
  | "api-lab"
  | "url-inspector"
  | "json-tool"
  | "regex-lab"
  | "design-lab"
  | "data-lab"
  | "binary-lab"
  | "network-lab"
  | "security-lab"
  | "git-lab"
  | "cron-lab"
  | "prompt-lab"
  | "notes-lab";

export interface LessonToolMeta {
  id: LessonToolId;
  label: string;
  blurb: string;
  /** Icon name from `components/Icon.tsx`. */
  icon:
    | "browser"
    | "code"
    | "terminal"
    | "server"
    | "globe"
    | "file"
    | "search"
    | "layers"
    | "chart"
    | "cpu"
    | "shield"
    | "upload"
    | "clock"
    | "spark"
    | "target"
    | "pencil"
    | "book";
}

export interface PlannedTool extends LessonToolMeta {
  /** One line shown under the tab, saying why this tool fits this lesson. */
  why: string;
}

export const LESSON_TOOL_META: Record<LessonToolId, Omit<LessonToolMeta, "id">> = {
  "web-playground": { label: "Web playground", blurb: "Write HTML, CSS and JavaScript and see the page live.", icon: "browser" },
  "js-console": { label: "JavaScript console", blurb: "Run JavaScript and read what it prints.", icon: "code" },
  "python-lab": { label: "Python lab", blurb: "Real Python in your browser, with print() output.", icon: "terminal" },
  "sql-lab": { label: "SQL lab", blurb: "Query sample tables and see the rows come back.", icon: "server" },
  "api-lab": { label: "API sandbox", blurb: "Send requests to a mock API and read real responses.", icon: "globe" },
  "url-inspector": { label: "URL inspector", blurb: "Pull a URL apart and see every piece.", icon: "search" },
  "json-tool": { label: "JSON formatter", blurb: "Format, validate and inspect JSON data.", icon: "file" },
  "regex-lab": { label: "Regex tester", blurb: "Test patterns against your own text, live.", icon: "target" },
  "design-lab": { label: "Colour studio", blurb: "Mix colours and check contrast like a designer.", icon: "layers" },
  "data-lab": { label: "Data explorer", blurb: "Paste spreadsheet data and sort, filter and summarise it.", icon: "chart" },
  "binary-lab": { label: "Binary lab", blurb: "Convert numbers and text between bases.", icon: "cpu" },
  "network-lab": { label: "Subnet calculator", blurb: "Carve IP ranges into networks and hosts.", icon: "globe" },
  "security-lab": { label: "Security toolkit", blurb: "Passwords, hashes, encodings and tokens.", icon: "shield" },
  "git-lab": { label: "Git simulator", blurb: "Practise commits and branches with zero risk.", icon: "upload" },
  "cron-lab": { label: "Cron explainer", blurb: "Turn schedules into plain English — and next runs.", icon: "clock" },
  "prompt-lab": { label: "Prompt builder", blurb: "Assemble a well-structured AI prompt, piece by piece.", icon: "spark" },
  "notes-lab": { label: "Notebook", blurb: "Your scratchpad for this lesson, saved in this browser.", icon: "pencil" },
};

/* -------------------------------------------------------------------------- */
/* Course defaults                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The tools each course reaches for when a lesson gives no stronger signal.
 * Ordered: the first tool becomes the workbench's opening tab.
 */
const COURSE_DEFAULTS: Record<string, LessonToolId[]> = {
  "web-foundations": ["web-playground", "design-lab", "url-inspector"],
  "computer-science-essentials": ["binary-lab", "js-console", "network-lab"],
  "javascript-zero-to-builder": ["js-console", "web-playground", "json-tool"],
  "react-production-apps": ["web-playground", "js-console", "api-lab"],
  "mobile-apps-react-native": ["js-console", "json-tool", "api-lab"],
  "backend-node-apis": ["api-lab", "json-tool", "js-console"],
  "data-structures-algorithms": ["js-console", "python-lab"],
  "databases-and-sql": ["sql-lab", "regex-lab", "json-tool"],
  "software-engineering-practices": ["git-lab", "regex-lab", "json-tool"],
  "system-design-architecture": ["api-lab", "json-tool", "network-lab"],
  "devops-and-delivery": ["cron-lab", "git-lab", "regex-lab"],
  "vibe-coding-ship-with-ai": ["web-playground", "prompt-lab", "js-console"],
  "ai-apps-agents-and-apis": ["prompt-lab", "json-tool", "api-lab"],
  "cyber-security-foundations": ["security-lab", "network-lab", "binary-lab"],
  "cyber-security-offense-and-defense": ["security-lab", "url-inspector", "regex-lab"],
  "cyber-security-cloud": ["security-lab", "json-tool", "cron-lab"],
  "ethical-hacking": ["security-lab", "network-lab", "regex-lab"],
  "cloud-computing-devops": ["cron-lab", "json-tool", "network-lab"],
  "data-science-analytics": ["data-lab", "python-lab", "sql-lab"],
  "human-computer-interaction": ["design-lab", "url-inspector"],
  "graphic-design": ["design-lab", "notes-lab"],
  "web-designing": ["web-playground", "design-lab"],
  "computer-networking": ["network-lab", "url-inspector", "binary-lab"],
  "computer-networks-architecture": ["network-lab", "binary-lab"],
  "computer-basics-bcc": ["notes-lab", "security-lab", "binary-lab"],
  "microsoft-office": ["data-lab", "notes-lab", "regex-lab"],
  "programming-languages": ["js-console", "python-lab", "json-tool"],
  "artificial-intelligence-machine-learning": ["prompt-lab", "python-lab", "data-lab"],
  "game-development": ["web-playground", "js-console", "data-lab"],
};

const FALLBACK_TOOLS: LessonToolId[] = ["js-console", "json-tool"];

/* -------------------------------------------------------------------------- */
/* Keyword rules                                                               */
/* -------------------------------------------------------------------------- */

interface KeywordRule {
  tool: LessonToolId;
  why: string;
  pattern: RegExp;
}

/**
 * Checked against the lesson id, title, summary and section headings. The
 * first matching rules win, ahead of the course defaults.
 */
const KEYWORD_RULES: KeywordRule[] = [
  { tool: "sql-lab", why: "This lesson talks databases — query the sample tables.", pattern: /\bsql\b|select\b|database|postgres|primary key|foreign key|quer(y|ies)(?! string)/ },
  { tool: "python-lab", why: "This lesson uses Python — run it here.", pattern: /python|pandas|numpy|matplotlib/ },
  { tool: "web-playground", why: "This lesson is about pages — build one live.", pattern: /html|css|flexbox|grid|responsive|web page|portfolio|dom\b|web design|stylesheet|semantic/ },
  { tool: "js-console", why: "This lesson is hands-on JavaScript — run the ideas.", pattern: /javascript|\bjs\b|async|await|promise|react|component|hook|closure|callback|array|\bdom\b/ },
  { tool: "api-lab", why: "This lesson talks to servers — practise requests safely.", pattern: /\bapi\b|\brest\b|http|fetch\(|endpoint|status code|backend|node\.?js|express|\brequest\b|\bresponse\b/ },
  { tool: "url-inspector", why: "This lesson names parts of a URL — pull one apart.", pattern: /\burl\b|\bdns\b|domain|query string|fragment|link\b|href/ },
  { tool: "regex-lab", why: "This lesson matches text patterns — test them live.", pattern: /regex|regular expression|pattern match|validation|validate|sanitiz/ },
  { tool: "json-tool", why: "This lesson moves JSON around — inspect it here.", pattern: /\bjson\b|payload|serializ/ },
  { tool: "design-lab", why: "This lesson is about how things look — mix colours here.", pattern: /colou?r|contrast|typograph|palette|accessib|figma|mockup|wireframe|user interface|\bux\b|web design|graphic design|design principle/ },
  { tool: "security-lab", why: "This lesson touches secrets — practise the safe habits.", pattern: /password|hash|jwt|token|auth|encrypt|security|attack|xss|csrf|injection|secret|permission|login|session|oauth/ },
  { tool: "network-lab", why: "This lesson addresses networks — carve up a range.", pattern: /subnet|cidr|ip address|\bipv4\b|rout|vlan|nat\b|firewall|tcp|packet|switching/ },
  { tool: "binary-lab", why: "This lesson speaks in bits — convert them here.", pattern: /binary|byte|bit\b|hex|encoding|unicode|utf|ascii|memory|number system/ },
  { tool: "git-lab", why: "This lesson versions code — rehearse the commands.", pattern: /\bgit\b|version control|pull request|\brebase\b|merge conflict|conventional commit|semver/ },
  { tool: "cron-lab", why: "This lesson schedules or ships work — decode the schedule.", pattern: /cron|schedul|pipeline|deploy|docker|container|ci\/?cd|monitor|observab|logs\b|logging|backup|release/ },
  { tool: "prompt-lab", why: "This lesson works with AI — draft the prompt properly.", pattern: /prompt|\bllm\b|language model|agent|rag\b|gpt|chatbot|generative|fine-tun|embed/ },
  { tool: "data-lab", why: "This lesson reasons about data — explore a dataset.", pattern: /\bcsv\b|spreadsheet|excel|dataset|chart|statistic|average|analy|visualis|metric/ },
];

/* -------------------------------------------------------------------------- */
/* Planning                                                                    */
/* -------------------------------------------------------------------------- */

export interface ToolPlanInput {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  summary?: string;
  headings?: string[];
  /** Languages of the lesson's own worked examples, e.g. `["html", "js"]`. */
  sampleLanguages?: string[];
}

const MAX_TOOLS = 4;

/** If the lesson's worked example is runnable, that playground goes first. */
function toolForLanguage(language: string): LessonToolId | null {
  const lang = language.toLowerCase();
  if (/(^|\b)(html?|css)(\b|$)/.test(lang)) return "web-playground";
  if (/javascript|\bjs\b|typescript|\bts\b|jsx|tsx|react/.test(lang)) return "js-console";
  if (/python|\bpy\b/.test(lang)) return "python-lab";
  if (/\bsql\b|postgres/.test(lang)) return "sql-lab";
  if (/\bjson\b/.test(lang)) return "json-tool";
  if (/bash|shell|terminal|console|\bcmd\b/.test(lang)) return "git-lab";
  return null;
}

function languageWhy(tool: LessonToolId): string {
  switch (tool) {
    case "web-playground":
      return "The lesson's example is a page — run it and change it.";
    case "js-console":
      return "The lesson's example is JavaScript — run it here.";
    case "python-lab":
      return "The lesson's example is Python — run it here.";
    case "sql-lab":
      return "The lesson's example is SQL — try it on sample data.";
    default:
      return "Matched to this lesson's worked example.";
  }
}

export function planLessonTools(input: ToolPlanInput): PlannedTool[] {
  const picked: PlannedTool[] = [];
  const seen = new Set<LessonToolId>();

  const add = (id: LessonToolId, why: string) => {
    if (seen.has(id) || picked.length >= MAX_TOOLS) return;
    seen.add(id);
    picked.push({ id, ...LESSON_TOOL_META[id], why });
  };

  // 1. Runnable worked examples lead — the tool runs the lesson's own code.
  for (const language of input.sampleLanguages ?? []) {
    const tool = toolForLanguage(language);
    if (tool) add(tool, languageWhy(tool));
  }

  // 2. Keyword rules over the lesson's own words.
  const haystack = [input.lessonId, input.lessonTitle, input.summary ?? "", ...(input.headings ?? [])]
    .join("\n")
    .toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(haystack)) add(rule.tool, rule.why);
  }

  // 3. Course defaults fill whatever room is left.
  const defaults = COURSE_DEFAULTS[input.courseId] ?? FALLBACK_TOOLS;
  for (const id of defaults) {
    add(id, `A favourite for this course — practise the core skill.`);
  }

  // 4. The notebook is always available, as the last tab.
  if (!seen.has("notes-lab") && picked.length < MAX_TOOLS + 1) {
    seen.add("notes-lab");
    picked.push({ id: "notes-lab", ...LESSON_TOOL_META["notes-lab"], why: "Jot the idea in your own words — it sticks better." });
  }

  return picked;
}

/**
 * Starter text for a tool, addressed to the lesson so a blank box never
 * greets a learner. Saved work (localStorage) wins over these.
 */
export function starterFor(tool: LessonToolId, lessonTitle: string): string {
  switch (tool) {
    case "web-playground":
      return `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>${lessonTitle}</title>\n    <style>\n      body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; background: #f6f4fb; color: #221d2e; }\n      .card { background: #fff; border: 1px solid #e5e0ef; border-radius: 16px; padding: 1.5rem; max-width: 34rem; }\n      h1 { margin: 0 0 .5rem; font-size: 1.4rem; }\n      button { background: #6d4aff; color: #fff; border: 0; border-radius: 10px; padding: .6rem 1rem; font-weight: 700; }\n    </style>\n  </head>\n  <body>\n    <div class="card">\n      <h1>Practising: ${lessonTitle}</h1>\n      <p>Change this page — the preview updates when you press Run.</p>\n      <button id="btn">Click me</button>\n      <p id="out"></p>\n    </div>\n    <script>\n      document.querySelector("#btn").addEventListener("click", () => {\n        document.querySelector("#out").textContent = "It works! Now make it yours.";\n        console.log("Button clicked");\n      });\n    </script>\n  </body>\n</html>\n`;
    case "js-console":
      return `// Practising: ${lessonTitle}\n// console.log() prints to the output below.\n\nconst topic = "${lessonTitle.replace(/"/g, "")}";\nconsole.log("Today I am learning:", topic);\n\nconst scores = [12, 7, 19, 4];\nconst total = scores.reduce((sum, n) => sum + n, 0);\nconsole.log("Scores:", scores.join(", "));\nconsole.log("Total:", total, "| Average:", (total / scores.length).toFixed(1));\n`;
    case "python-lab":
      return `# Practising: ${lessonTitle}\n# print() shows in the output below.\n\ntopic = "${lessonTitle.replace(/"/g, "")}"\nprint("Today I am learning:", topic)\n\nscores = [12, 7, 19, 4]\ntotal = sum(scores)\nprint("Scores:", scores)\nprint("Total:", total, "| Average:", round(total / len(scores), 1))\n`;
    case "sql-lab":
      return `SELECT name, city, joined\nFROM customers\nWHERE city = 'Accra'\nORDER BY joined\nLIMIT 5;`;
    case "json-tool":
      return `{\n  "lesson": "${lessonTitle.replace(/"/g, "")}",\n  "practised": true,\n  "score": 9,\n  "tags": ["hands-on", "json"],\n  "next": null\n}`;
    case "regex-lab":
      return `Ama's number is +233 24 123 4567 and Kofi's is 020-987-6543.\nEmail the class at hello@example.com or support@codemasterghana.com.`;
    case "notes-lab":
      return `Practising: ${lessonTitle}\n\n- The one idea I must remember:\n- In my own words, it means:\n- One place I could use it:`;
    default:
      return "";
  }
}
