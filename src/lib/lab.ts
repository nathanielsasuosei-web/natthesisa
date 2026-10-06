/**
 * The code lab's templates and its preview builder.
 *
 * Kept out of the React component so the document that the preview iframe runs
 * can be built (and tested) without a browser: the same function serves the
 * live preview and the "download project" button.
 */

export type LabLanguage = "html" | "css" | "js" | "python" | "json" | "markdown" | "text";

export interface LabFile {
  name: string;
  language: LabLanguage;
  content: string;
}

export interface LabTemplate {
  id: string;
  name: string;
  description: string;
  files: LabFile[];
}

/** Picks the editor language from a file name, so student-created files highlight correctly. */
export function languageForFileName(name: string): LabLanguage {
  const lower = name.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "js";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  return "text";
}

export const LAB_TEMPLATES: LabTemplate[] = [
  {
    id: "web-page",
    name: "Starter web page",
    description: "HTML, CSS and JavaScript wired together — press Run and see it live.",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My first page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="card">
      <h1 id="greeting">Hello, web!</h1>
      <p>This page is yours. Change the text, then the colours in <code>styles.css</code>.</p>
      <button id="cheer">Cheer me on</button>
      <p id="output" class="output"></p>
    </main>

    <script src="script.js"></script>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        language: "css",
        content: `:root {
  --ink: #1c1921;
  --brand: #6d4aff;
  --paper: #f7f7f4;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.card {
  width: min(34rem, 90vw);
  background: #fff;
  border: 1px solid #e6e2e9;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(28, 25, 33, .08);
}

h1 { margin: 0 0 .5rem; letter-spacing: -.03em; }

code {
  background: #f0ecff;
  color: var(--brand);
  padding: .1rem .35rem;
  border-radius: 6px;
  font-size: .85em;
}

button {
  margin-top: 1rem;
  border: 0;
  border-radius: 12px;
  padding: .75rem 1.1rem;
  background: var(--brand);
  color: #fff;
  font-weight: 800;
  font-size: .85rem;
  cursor: pointer;
}

button:hover { filter: brightness(1.08); }

.output { min-height: 1.25rem; font-weight: 700; color: var(--brand); }`,
      },
      {
        name: "script.js",
        language: "js",
        content: `// Runs in the preview. Open the Console tab to see what it prints.
const cheers = [
  "You are learning faster than you think.",
  "Small steps, every day.",
  "That bug is a lesson wearing a disguise.",
];

const output = document.querySelector("#output");
const button = document.querySelector("#cheer");
let count = 0;

button.addEventListener("click", () => {
  const cheer = cheers[count % cheers.length];
  output.textContent = cheer;
  console.log("Cheer #" + (count + 1) + ":", cheer);
  count += 1;
});

console.log("Page ready. Press the button!");`,
      },
    ],
  },
  {
    id: "js-practice",
    name: "JavaScript practice",
    description: "A console-only notebook for algorithms, strings and numbers.",
    files: [
      {
        name: "main.js",
        language: "js",
        content: `// Everything you log appears in the Console tab.
function fizzbuzz(n) {
  for (let i = 1; i <= n; i++) {
    const fizz = i % 3 === 0;
    const buzz = i % 5 === 0;
    console.log(fizz && buzz ? "FizzBuzz" : fizz ? "Fizz" : buzz ? "Buzz" : i);
  }
}

fizzbuzz(20);

// Try it yourself: reverse a word, count vowels, sum a list.
const reverse = (word) => [...word].reverse().join("");
console.log("reversed:", reverse("codemaster"));

// Object practice
const learner = { name: "You", lessons: 3, minutes: 95 };
console.log(Object.entries(learner));
`,
      },
    ],
  },
  {
    id: "python-practice",
    name: "Python practice",
    description: "Python that really runs — powered by Pyodide, right in your browser.",
    files: [
      {
        name: "main.py",
        language: "python",
        content: `# Everything you print() appears in the Console tab.
print("Hello from Python!")

# FizzBuzz, the classic warm-up
for i in range(1, 21):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)

# Try it yourself: lists, dicts and functions
fruits = ["mango", "pineapple", "orange"]
for fruit in fruits:
    print(fruit.upper(), "has", len(fruit), "letters")

learner = {"name": "You", "lessons": 3, "minutes": 95}
print(learner)


def cheer(name):
    return f"Keep going, {name}!"


print(cheer("coder"))`,
      },
    ],
  },
  {
    id: "quiz-app",
    name: "Mini quiz app",
    description: "State, events and rendering — the shape of a real app.",
    files: [
      {
        name: "index.html",
        language: "html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mini quiz</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="quiz">
      <p class="progress" id="progress"></p>
      <h1 id="question">Loading…</h1>
      <div class="answers" id="answers"></div>
      <p class="score" id="score"></p>
      <button id="restart" hidden>Play again</button>
    </main>

    <script src="script.js"></script>
  </body>
</html>`,
      },
      {
        name: "styles.css",
        language: "css",
        content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #19171f;
  color: #f7f7f4;
  font-family: system-ui, sans-serif;
}

.quiz {
  width: min(32rem, 90vw);
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 22px;
  padding: 1.75rem;
}

.progress { margin: 0 0 .75rem; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; color: #b9a9ff; }
h1 { margin: 0 0 1.25rem; font-size: 1.4rem; letter-spacing: -.03em; }

.answers { display: grid; gap: .6rem; }

.answers button {
  text-align: left;
  border: 1px solid rgba(255, 255, 255, .18);
  background: transparent;
  color: inherit;
  border-radius: 12px;
  padding: .85rem 1rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.answers button:hover:not(:disabled) { border-color: #6d4aff; background: rgba(109, 74, 255, .14); }
.answers button:disabled { opacity: .55; }
.answers button.right { border-color: #34d399; background: rgba(52, 211, 153, .16); }
.answers button.wrong { border-color: #fb7185; background: rgba(251, 113, 133, .16); }

.score { min-height: 1.25rem; font-weight: 700; }
#restart { margin-top: .5rem; border: 0; border-radius: 12px; padding: .8rem 1.1rem; background: #6d4aff; color: #fff; font-weight: 800; cursor: pointer; }`,
      },
      {
        name: "script.js",
        language: "js",
        content: `const QUESTIONS = [
  { q: "Which tag holds visible page content?", a: ["body", "head", "meta"], correct: 0 },
  { q: "What does CSS control?", a: ["Structure", "Presentation", "Data"], correct: 1 },
  { q: "Which value is NOT a JavaScript type?", a: ["string", "number", "paragraph"], correct: 2 },
];

const progressEl = document.querySelector("#progress");
const questionEl = document.querySelector("#question");
const answersEl = document.querySelector("#answers");
const scoreEl = document.querySelector("#score");
const restartEl = document.querySelector("#restart");

let index = 0;
let score = 0;

function render() {
  const item = QUESTIONS[index];
  progressEl.textContent = "Question " + (index + 1) + " of " + QUESTIONS.length;
  questionEl.textContent = item.q;
  scoreEl.textContent = "Score: " + score;
  answersEl.innerHTML = "";
  restartEl.hidden = true;

  item.a.forEach((label, i) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => answer(i, button));
    answersEl.append(button);
  });
}

function answer(choice, button) {
  const item = QUESTIONS[index];
  const buttons = [...answersEl.children];
  buttons.forEach((b) => (b.disabled = true));
  const right = choice === item.correct;
  button.classList.add(right ? "right" : "wrong");
  if (right) score++;
  console.log(right ? "Correct!" : "Not quite — answer: " + item.a[item.correct]);
  scoreEl.textContent = "Score: " + score;
  index++;

  window.setTimeout(() => {
    if (index < QUESTIONS.length) render();
    else finish();
  }, 700);
}

function finish() {
  progressEl.textContent = "Finished";
  questionEl.textContent = score === QUESTIONS.length ? "Perfect score!" : "Nice work — " + score + "/" + QUESTIONS.length;
  answersEl.innerHTML = "";
  restartEl.hidden = false;
}

restartEl.addEventListener("click", () => { index = 0; score = 0; render(); });
render();`,
      },
    ],
  },
];

/** Keeps a student's `"</script>"` string from closing the inlined block. */
function escapeClosingTags(code: string): string {
  return code.replace(/<\/(script|style)/gi, "<\\/$1");
}

/**
 * Builds the document the preview iframe runs.
 *
 * The student's files are inlined, and a small agent is prepended that forwards
 * `console` output and errors to the parent window as structured messages —
 * that is what fills the Console tab.
 */
export function buildPreview(files: LabFile[]): string {
  const html = files.find((item) => item.language === "html")?.content ?? "<!doctype html><html><body><main id=\"app\"></main></body></html>";
  const css = escapeClosingTags(files.filter((item) => item.language === "css").map((item) => item.content).join("\n\n"));
  const js = escapeClosingTags(files.filter((item) => item.language === "js").map((item) => item.content).join("\n\n;\n"));

  const agent = `<script>
(function () {
  var send = function (kind, args) {
    try {
      var text = args.map(function (value) {
        if (typeof value === "string") return value;
        try { return JSON.stringify(value); } catch (error) { return String(value); }
      }).join(" ");
      parent.postMessage({ __lab: true, kind: kind, text: text }, "*");
    } catch (error) { /* nothing we can do from inside the sandbox */ }
  };
  ["log", "info", "warn", "error"].forEach(function (kind) {
    var original = console[kind];
    console[kind] = function () {
      send(kind, Array.prototype.slice.call(arguments));
      if (original) original.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send("error", [event.message + (event.lineno ? " (line " + event.lineno + ")" : "")]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("error", ["Unhandled promise rejection: " + (event.reason && event.reason.message ? event.reason.message : String(event.reason))]);
  });
})();
</script>`;

  let out = html;
  // A student page usually links the CSS and JS files by name; in the preview
  // they are inlined instead, so the links are removed first.
  out = out.replace(/<link[^>]+href=["'][^"']*\.css["'][^>]*>/gi, "");
  out = out.replace(/<script[^>]+src=["'][^"']*\.js["'][^>]*>\s*<\/script>/gi, "");

  const head = css ? `<style>\n${css}\n</style>` : "";
  const script = js ? `${agent}\n<script>\ntry {\n${js}\n} catch (error) {\n  console.error(error && error.message ? error.message : String(error));\n}\n</script>` : agent;

  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${head}\n${script}\n</head>`);
  else out = `${head}\n${script}\n${out}`;

  return out;
}
