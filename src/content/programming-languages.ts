import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Programming Languages — how languages differ, and how to learn the next one.
 *
 * This is a course for people who already write some code and want to stop
 * being trapped by one syntax. It covers the programming paradigms, the
 * mechanics every language shares (types, memory, scope, errors) and the
 * choices that differ, how languages are executed, how to read unfamiliar code
 * and compare two languages honestly, and how to learn a new one without
 * starting from zero.
 */

export const PROGRAMMING_LANGUAGES_MODULES: CourseModule[] = [
  module(
    "language-landscape",
    "01 · The language landscape",
    "What languages are made of, and how they differ.",
    [
      lesson({
        id: "paradigms-and-properties",
        title: "Paradigms and properties: how languages differ",
        summary:
          "Languages are not interchangeable syntaxes; each makes a different set of easy things and hard things. This lesson maps the landscape: imperative versus declarative, procedural, object-oriented and functional styles, static versus dynamic typing, compiled versus interpreted execution, and the other properties that decide whether a language suits a job — memory management, concurrency model, error handling convention and ecosystem.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The moment you know one language well, the second one is mostly a matter of mapping: this is how it loops, this is how it models data, this is how it reports failure. What takes longer to learn is *why* a language makes a different choice, and that is exactly the knowledge that transfers between languages — and that interviewers probe when they ask why you would pick one over another.",
          },
          {
            heading: "Definition: the axes that matter",
            kind: "definition",
            body:
              "**Imperative vs declarative.** Imperative code says *how*: iterate, mutate, accumulate. Declarative code says *what*: here is the query, the filter, the desired state. SQL is declarative; a Python loop is imperative; a compiler optimiser is happiest when you say what you want. Good code uses both, choosing declarative forms where they express intent more clearly.\n\n**Programming paradigms**, in practice:\n\n- **Procedural** — data and the functions that operate on it, in sequence. C, early BASIC, shell scripts.\n- **Object-oriented** — state and behaviour bundled into objects with interfaces, inheritance and polymorphism. Java, C#, Ruby, Python's common style.\n- **Functional** — computation as composition of pure functions, with immutable data and no side effects. Clojure, Elixir, Haskell; and within other languages, `map`/`filter`/`reduce`, closures and immutability.\n- **Logic** — rules and queries (Prolog), rare in industry but a valuable mental model.\n- Most modern languages are **multi-paradigm**: Python, JavaScript, Kotlin, Swift and Go all support several styles.\n\n**Static vs dynamic typing.** Static (Java, Go, Rust, TypeScript) checks types before running, catching whole classes of bug early and enabling better tooling; it costs some verbosity and up-front design. Dynamic (Python, JavaScript, Ruby, PHP) is more flexible and faster to write small things in; errors move to run time, so tests matter more. TypeScript and Python type hints are the industry's compromise: gradual typing on a dynamic language.\n\n**Compiled, interpreted or both.** Source can be compiled ahead of time to machine code (C, Rust) or to bytecode (Java, C#) or interpreted directly (Python, Ruby, shell). Almost every modern runtime uses a hybrid: JavaScript engines compile hot functions just-in-time, and WebAssembly is a compilation target for many languages. The practical difference is in the *feedback loop* (fast edit-run-reload in a dynamic language, a build step in a compiled one) and in peak performance, not in capability.\n\n**Memory management.** Manual (`malloc`/`free`, C), garbage collected (Java, Go, Python, JavaScript), or ownership-based with compile-time checking (Rust). Manual gives control and takes your weekends; GC gives safety and adds pauses; ownership gives both and charges you in learning time.\n\n**Concurrency.** Threads with shared memory (Java, C++), message-passing processes (Erlang, Elixir, Go's goroutines), an event loop with async/await (JavaScript, Python's asyncio, Rust's tokio), or a single-threaded runtime with an escape hatch.\n\n**Error handling.** Exceptions (Java, Python), error values returned explicitly (Go, Rust's `Result`), or both (C#'s nullable types, JavaScript's mix). The convention shapes the whole language's style: Go code is full of `if err != nil`, and that is the design, not an accident.",
          },
          {
            heading: "Choosing a language for a job, honestly",
            kind: "paragraph",
            body:
              "Language choice is usually decided before the arguing starts, by factors that have nothing to do with the language:\n\n- **What the team already writes.** A language nobody on the team knows is an expensive experiment.\n- **The ecosystem.** Do you need a mature web framework, a data-science stack, an embedded toolchain, an app store pipeline? Libraries and community matter more than three benchmarking blog posts.\n- **Hiring in your market.** In Accra, JavaScript/TypeScript, Python, Java and PHP are the languages with the most jobs and the most available contractors; choosing an exotic one means training everyone yourself.\n- **Deployment constraints.** Does it run on the mobile device, on a small server, in a serverless platform, on a shared host? Java warms up slowly for tiny functions; Go produces one static binary that fits anywhere.\n- **The property you actually need.** Financial arithmetic with decimal precision (avoid binary floating point), hard real-time work, native performance, or the ability to write a prototype this week — each points at different languages.\n\nThe productive habit is to learn the *idioms* of each language you touch rather than writing your first language in the second one. A Python program written in Java style is slower than idiomatic Python and uglier than idiomatic Java, and reviewers notice immediately.",
          },
          {
            heading: "Worked example: the same task in four styles",
            kind: "example",
            body:
              "Task: from a list of student records, produce the names of those who passed, sorted by score. The same logic expressed four ways; read them for what each style makes visible.\n\nThe **imperative** version says exactly what the machine does: an accumulator, a loop, a condition, a sort. It is explicit and long, and every reader can follow it.\n\nThe **declarative/functional** version states the transformation: filter, then order. There is no index, no accumulator, and no way to make an off-by-one error. This style dominates modern JavaScript, Python and C# for data transformations.\n\nThe **object-oriented** version places the behaviour with the data: a `Student` knows whether it passed. Reuse improves and coupling grows; whether that is good depends on whether the rule is likely to change per student.\n\nThe **SQL** version is the most declarative of all: the database decides how to filter and sort, and can use an index to do it in ways the application could not. Notice that the same question has four reasonable forms and that the choice between them is about who should own the logic and how it will be tested, not about which is correct.",
            code:
              "# 1. Imperative — how\ndef passed_names(records):\n    out = []\n    for r in records:\n        if r[\"score\"] >= 50:\n            out.append(r[\"name\"])\n    out.sort()\n    return out\n\n# 2. Declarative / functional — what\npassed = sorted(r[\"name\"] for r in records if r[\"score\"] >= 50)\n\n# 3. Object-oriented — behaviour with the data\nclass Student:\n    PASS_MARK = 50\n    def __init__(self, name, score): self.name, self.score = name, score\n    @property\n    def passed(self): return self.score >= self.PASS_MARK\n\npassed = sorted(s.name for s in students if s.passed)\n\n-- 4. Declarative at the data layer\nSELECT name FROM students WHERE score >= 50 ORDER BY name;",
            language: "text",
            codeLabel: "One question, four idioms",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"Dynamic typing means no types.\"** Values still have types; the check happens at run time. That is why type hints and tests earn their place in Python and JavaScript projects.\n- **\"Compiled is always faster than interpreted.\"** JIT-compiled JavaScript regularly beats naive C, and the bottleneck is usually the algorithm or the database, not the language.\n- **\"Functional languages cannot do side effects.\"** They isolate them. Real systems are built from pure logic around a controlled edge, and even Haskell ships IO for exactly that.\n- **Rewriting a service in a faster language to fix a slow query.** Measure first; most \"slow language\" problems are one missing index or one N+1 query.\n- **Learning a language by its syntax only.** The syntax is a day; the idioms, standard library, error conventions and ecosystem are the actual work, and skipping them produces code nobody wants to maintain.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Axis", "One end", "Other end", "What it decides"],
              ["Typing", "Static (Go, Rust, Java)", "Dynamic (Python, JS, Ruby)", "When errors surface; tooling; ceremony"],
              ["Paradigm", "Imperative / procedural", "Functional / declarative", "How you express transformations and state"],
              ["Memory", "Manual (C)", "GC (Java, Go) · Ownership (Rust)", "Control, safety, speed, effort"],
              ["Execution", "AOT compiled (C, Rust, Go)", "Interpreted / JIT (Python, JS)", "Build step, startup time, peak speed"],
              ["Concurrency", "Shared-memory threads", "Message passing / async event loop", "How much of the design is about races"],
              ["Errors", "Exceptions", "Returned error values", "Every function signature and happy path"],
              ["Typical stronghold", "Systems, embedded", "Web, data, scripting, education", "Where the ecosystem and the jobs are"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Languages differ along a small number of axes — paradigm, typing discipline, execution model, memory management, concurrency style and error convention — and each combination makes different things easy. Choosing a language is mostly about the team, the ecosystem and the constraints rather than about speed benchmarks, and the transferable skill is recognising the idiom of each language instead of translating the previous one word for word.",
          },
        ],
        keyPoints: [
          "Distinguish imperative from declarative code, and give an example where the declarative form is clearer.",
          "Compare static and dynamic typing by when errors surface and what each costs.",
          "Explain compiled, interpreted and just-in-time execution, and what each changes for the developer.",
          "Describe three concurrency models and one failure mode of each.",
          "List the real criteria for choosing a language for a project, beyond personal preference.",
        ],
        exercises: [
          "Take one small task and implement it four ways: imperative, functional, object-oriented and in SQL. Compare readability and testability, not line count.",
          "Find the same algorithm in two languages you know and list three idioms the second uses that the first does not.",
          "Write the same function with and without type annotations in a language that supports both. Run a type checker and record what it catches.",
          "Investigate how your main language manages memory and what its concurrency model is. Write a paragraph each in plain language.",
          "Pick a language you have never used and list, from its documentation only, how it handles errors, concurrency and types.",
        ],
        challenge:
          "Write a two-page comparison of two languages for a specific job in your market — for example, building a payments API for a Ghanaian fintech — covering typing, ecosystem maturity, hiring pool, hosting cost and deployment constraints, with a recommendation and the strongest argument against it. No benchmarks without a stated workload.",
      }),

      lesson({
        id: "how-languages-run",
        title: "How languages actually run",
        summary:
          "Source code is not what runs. Between your file and the machine there is a chain of transformations — tokenising, parsing, analysis, compilation, linking, loading, or interpretation and just-in-time compilation — and knowing where in that chain an error came from changes how fast you fix it. This lesson covers that pipeline, stack and heap, scope and closures, garbage collection and memory leaks in managed languages, and why two programs with the same logic perform differently.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Two developers see the same error and behave differently. One reads \"undefined is not a function\" and starts editing. The other understands that the error came from the language's run time, and knows what class of mistake it belongs to. The difference is a mental model of the machine underneath the language, and it is the single most useful thing you can acquire after basic syntax.",
          },
          {
            heading: "Definition: the pipeline from source to running program",
            kind: "definition",
            body:
              "**Lexing and parsing.** Source text is broken into tokens, then arranged into a syntax tree. This is where *syntax errors* come from — the grammar was violated, and nothing has run yet.\n\n**Semantic analysis and type checking.** Names are resolved, types are checked, scopes are built. This is where *compile-time* errors come from: an undefined variable, a type mismatch, an unreachable branch. Static languages do most of this before execution; dynamic ones do part of it at run time, which is why an unused function can hide a bug for months until somebody calls it.\n\n**Optimisation and code generation.** The tree (or an intermediate representation) is simplified and lowered towards machine code. This is where constant folding, inlining and dead-code elimination happen — the reason a loop you wrote is not the loop that runs.\n\n**Bytecode and virtual machines.** Java, C# and Python compile to bytecode for a virtual machine, which makes the program portable and allows just-in-time compilation of hot paths: the code gets faster the longer it runs, and the first request after a deploy is slower than the thousandth.\n\n**Linking and loading.** Native programs are linked against libraries and loaded into memory by the operating system; interpreted programs are started by their runtime. This is where \"works on my machine\" lives: a missing shared library, a different version of a dependency, an architecture mismatch.\n\n**Run time.** The runtime provides the parts of the language that are not in the source: garbage collection, exception machinery, reflection, the module system and the standard library.",
          },
          {
            heading: "Stack, heap, scope and closures",
            kind: "paragraph",
            body:
              "**The stack** holds the frames of the functions currently executing: parameters, local variables, the return address. It is fast, strictly ordered and automatically reclaimed when a function returns. **The heap** holds everything whose lifetime is not tied to a function call: objects, collections, strings, anything shared or returned. It is larger, slower to allocate from, and managed by hand or by a garbage collector.\n\n**Scope** is where a name is visible. Lexical scope is determined by where code is written, not by who calls it — which means a function carries its birthplace with it.\n\n**A closure** is a function that captures variables from its defining scope and keeps them alive after that scope ends. Closures are the mechanism behind callbacks, event handlers, memoisation, partial application and most of the \"functional\" style you use daily:\n\n- A counter that remembers its count without a global variable.\n- An event handler that remembers which row it belongs to.\n- A rate limiter that remembers the timestamps of the last calls.\n\nThe practical rule: **a closure keeps everything it captures alive**, so capturing a large object in a long-lived callback keeps that object in memory. This is the most common way a managed language \"leaks\".\n\n**Stack overflow** and **heap exhaustion** are different failures and are fixed differently. Deep or unbounded recursion overflows the stack (fix: convert to iteration, or bound the depth). Collecting objects without releasing references exhausts the heap (fix: find the reference that never dies; look for caches without limits, listeners never removed, and closures over large data).",
          },
          {
            heading: "Worked example: a request's lifetime in memory",
            kind: "example",
            body:
              "A web handler receives a request, looks up a user, builds a response and returns it. Following the memory makes the invisible visible.\n\nThe request object and parameters live on the stack for the duration of the call. The user record and the response structure are heap allocations. If the handler registers a timer or a listener that captures the response object, that object can no longer be collected when the response is finished — the timer still holds a reference. Ten thousand requests later, the process is holding ten thousand copies of objects it no longer needs, memory climbs, and the fix has nothing to do with the request logic.\n\nThe same code in a language with manual memory management would leak for the same reason, with worse consequences; the same code in Rust would fail to compile, because the borrow checker sees the reference outliving its owner. Three languages, one bug, three very different experiences — which is a precise statement of what a language's memory model buys you.",
            code:
              "// The leak: the handler keeps a reference it never releases\nfunction handleRequest(req, res) {\n  const user = db.findUser(req.params.id);            // heap: user record\n  const payload = buildPayload(user);                 // heap: response data\n\n  setInterval(() => {                                 // still runs after the response\n    logStats(payload.views);                          // closure keeps `payload` alive\n  }, 60_000);\n\n  res.json(payload);\n}\n\n// The fix: bound the lifetime, and let the object go\nfunction handleRequest(req, res) {\n  const user = db.findUser(req.params.id);\n  const payload = buildResponse(user);\n  res.json(payload);\n}\n// stats are collected centrally with a single timer that holds counters,\n// not per-request closures over response objects\n\n# Symptoms of this class of bug:\n#   memory grows steadily under load, never falls back\n#   latency rises after ~30 min, then the process is restarted by the platform\n#   profiling shows N copies of objects that should exist once",
            language: "javascript",
            codeLabel: "A closure that outlives its usefulness",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"Garbage collection means I do not need to think about memory.\"** The collector frees what is unreachable, not what is unwanted. Holding a reference keeps an object alive forever.\n- **Confusing compile-time and run-time errors.** A syntax or type error means nothing ran; a run-time error means the code ran and failed. They are fixed in different places.\n- **Assuming optimisation changes nothing observable.** It cannot change program semantics, but it does change performance characteristics; micro-benchmarks written without understanding the compiler measure the compiler, not your code.\n- **Blaming the language for a slow query.** Nearly every \"Python is slow\" or \"PHP is slow\" story ends at the database, the network or an unindexed join.\n- **Micro-optimising cold paths.** The hot 5% of the code decides performance. Optimising anywhere else is a hobby, and frequently makes the code harder to change without measurably helping.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Stage", "Produces", "Errors found here", "Typical message"],
              ["Lexing / parsing", "Syntax tree", "Malformed code", "`SyntaxError: unexpected token`"],
              ["Type checking", "Typed tree", "Type and name errors", "`TypeError` at compile time, or undefined at run time"],
              ["Optimisation", "Faster tree or IR", "Nothing (but performance surprises)", "A loop that no longer matches your source"],
              ["Linking / loading", "Runnable image", "Missing or mismatched dependencies", "`library not found`, version conflicts"],
              ["Run time", "Behaviour", "Logic, null references, state bugs", "`undefined is not a function`, `KeyError`"],
              ["Garbage collection", "Reclaimed memory", "Nothing — but leaks cause restarts", "Memory climbing, OOM kills under load"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Between the file you wrote and the process that runs there is a pipeline — parse, check, optimise, compile or interpret, link, execute — and each stage has its own error vocabulary and its own fixes. Underneath it all sit the stack, the heap, scopes and closures: fast temporary memory, long-lived shared memory, and the rule that a closure keeps alive whatever it captures. Knowing that model is what turns an error message into a diagnosis instead of an experiment.",
          },
        ],
        keyPoints: [
          "Describe the stages from source code to running program and the error kind found at each.",
          "Explain the stack, the heap, lexical scope and closures with your own examples.",
          "Diagnose a memory leak in a garbage-collected language by finding the surviving reference.",
          "Distinguish compile-time from run-time failures and locate them correctly.",
          "Explain why performance work must begin with measurement, not intuition.",
        ],
        exercises: [
          "Write a closure that keeps state without a global variable, then explain in one sentence what it captures and for how long.",
          "Deliberately cause a memory leak in a managed language (an unbounded cache, a listener never removed) and detect it by watching memory under load.",
          "Produce one compile-time error, one run-time error and one logic error in the same small program, and record the exact message for each.",
          "Compare how long the first and the ten-thousandth call of the same function takes in a JIT-compiled language. Explain the difference.",
          "Use a profiler on a small program and identify where the time actually goes, then compare with where you expected it to go.",
        ],
        challenge:
          "Take a program you have written that runs continuously or handles many requests, and investigate its memory behaviour: measure the heap before and after a load test, find the largest surviving objects, identify anything held longer than it is needed, fix one such case, and show the before-and-after memory graph under the same load.",
      }),
    ]
  ),

  module(
    "reading-and-learning",
    "02 · Reading and learning languages",
    "How to read unfamiliar code, compare languages honestly, and add a new one.",
    [
      lesson({
        id: "reading-code-and-comparing-languages",
        title: "Reading code and comparing languages",
        summary:
          "Most professional reading is other people's code, often in a language you do not use daily. This lesson is a method for reading unfamiliar codebases quickly — entry points, data flow, the standard library, tests as documentation — and for comparing two languages on the same problem without resorting to benchmarks that measure the wrong thing. It covers code review across language conventions, and how to form an opinion you can defend.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "You will be handed a repository in a language you have never written professionally and asked for a fix by Friday. Panic is a strategy, but a poor one. The method in this lesson — find the entry point, follow the data, read the tests, learn the idiom — converts that task from archaeology into a sequence, and it works in any language with a debugger, a test suite and a standard library.",
          },
          {
            heading: "Definition: reading strategies and comparison criteria",
            kind: "definition",
            body:
              "**Reading for orientation** answers: where does execution start, what are the five most important files, and what is the shape of the data? Ignore details entirely on the first pass.\n\n**Reading for change** answers: what would I have to touch to make this behave differently, and what else depends on it? Follow references upward (who calls this?) as well as downward (what does this call?).\n\n**Reading for bugs** answers: where is the state, who can change it concurrently, and what happens when this fails? Bugs cluster around shared mutable state, boundaries (parsing, network, disk, arithmetic) and assumptions about failure.\n\nThe tools that make reading fast, in order of value: the **test suite** (an executable statement of intended behaviour, in the language's idiom), the **entry point** (`main`, a route table, a handler registration), the **data model** (types, schemas, migrations), **git history** (why the code looks like this, revealed by commits and pull-request discussion), the **debugger** (breakpoints beat speculation) and the **standard library documentation** (if a construct looks strange, it is usually an idiomatic use of something in the language's own toolkit).\n\n**Fair comparison of two languages** means holding the workload constant: same algorithm, same data size, same concurrency model, same I/O pattern, and — most importantly — idiomatic code in both, written or reviewed by somebody who actually uses each language. Anything else measures the programmer.",
          },
          {
            heading: "A twelve-step reading method",
            kind: "paragraph",
            body:
              "1. **Read the README and the folder names** before any code. Ten minutes here saves hours later.\n2. **Find the entry point** and trace one request or command end to end, at a very high level.\n3. **Write the data model down** — the three or four core entities and how they relate. Most confusion in unfamiliar code is confusion about data, not control flow.\n4. **Run it.** Nothing accelerates understanding like making it work locally, and the setup errors teach you the dependencies.\n5. **Run the tests.** They document the intended behaviour and its edge cases, in an executable form.\n6. **Pick one feature and trace it end to end**, top to bottom, writing down the file names as you go.\n7. **Use the debugger** on the thing you do not understand. Watching a value change beats reading it.\n8. **Read the diff of a small recent change** in `git log` to see how a developer familiar with the code makes a modification.\n9. **Learn the idiomatic constructs** you keep meeting: the iterator protocol, the promise chain, the decorator, the trait, the middleware. Name them by their language's vocabulary.\n10. **Find the boundaries**: input parsing, validation, database access, external calls, error handling. Behavioural bugs live there.\n11. **Write a test of your own** that fails, reproducing the behaviour you were asked to change. Now you understand the behaviour precisely.\n12. **Make the change as small as the idiom allows.** In unfamiliar code, small diffs that follow local conventions are both more likely to be correct and easier to review.",
          },
          {
            heading: "Worked example: comparing two languages on the same task",
            kind: "example",
            body:
              "The task: read a 2 GB CSV of transactions, filter to one month, and write a summary grouped by day and category. The same job in Python and Go, on the same machine, reading the same file, with idiomatic code in each.\n\nThe measurements, and what they mean: Go's process starts instantly, streams rows with constant memory and finishes in roughly half the wall-clock time. Python with a streaming reader finishes a little slower and uses a little more memory; Python with pandas is faster than both *if* the file fits in memory, and much slower — or dead — if it does not.\n\nRead the comparison correctly: it is not \"Go beats Python\". It is that *for streaming a file larger than RAM*, Go's model (compiled, cheap goroutines, no interpreter overhead) is a better fit, while *for exploratory analysis of a file that fits in memory*, pandas is the strongest choice on earth, because the work is done in optimised C code underneath and the developer writes five lines.\n\nThe honest conclusion names the workload, the constraints and the team. A data analyst should not rewrite in Go; a backend team processing uploads all day probably should. That is what a defensible technical opinion looks like.",
            code:
              "Task: 2 GB CSV → filter 1 month → group by (day, category) → totals\nMachine: 4 vCPU, 8 GB RAM, SSD.  Same file.  Idiomatic code in each.\n\nlanguage / approach        wall time   peak memory   notes\n--------------------------------------------------------------------\nGo, streaming, bufio       0:41        38 MB         single static binary; easy to deploy\nPython, csv module         1:24        90 MB         no build step; readable\nPython, pandas (in-memory) 1:02       3 400 MB       fastest to write — 5 lines — but needs RAM\nPython, pandas (chunked)   1:47       210 MB         the practical compromise\n\nWhat the numbers justify saying:\n  • for a file larger than RAM, streaming wins and Go's model fits the job\n  • for files that fit in memory, pandas is the fastest thing to *write*\n  • the decision is about data size, deployment and team skills, not about which\n    language is 'better' — and the 2× runtime difference is often cheaper than\n    the weeks of retraining that choosing the unfamiliar language implies",
            language: "text",
            codeLabel: "A comparison that states its workload and its caveats",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Benchmarking Hello World.** Startup time, JIT warm-up and I/O dominate tiny programs. Benchmarks must be big enough to measure the thing you care about.\n- **Writing Python with Java syntax.** Translating your first language into a second one produces code that is slow, unidiomatic and hard for the team that maintains it to review.\n- **Reading code top-to-bottom from the first file.** Repositories are not novels; start at the entry point and follow the path that matters.\n- **Treating unfamiliar syntax as complexity.** Pattern matching, traits, decorators and monads are unfamiliar patterns, not evidence of cleverness. Learn the name and the purpose, then judge.\n- **Editing before you can reproduce.** A change made without a failing test or a reproduced bug is a guess, and guesses in unfamiliar code are expensive to unwind.\n- **Confusing popularity with suitability.** The most popular language in the world is a poor choice for a hard real-time device; suitability is about constraints.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Reading goal", "Start at", "Follow", "Stop when"],
              ["Orientation", "README, entry point, routes", "One request end to end", "You can describe the architecture in five sentences"],
              ["Making a change", "The route or command involved", "References both ways; tests for that area", "A failing test reproduces the old behaviour"],
              ["Finding a bug", "Shared mutable state, boundaries, error paths", "Concurrency, parsing, network, arithmetic", "You can explain the failure deterministically"],
              ["Performance", "Measurement, then the hot path", "Allocations, queries, I/O", "The bottleneck is identified with numbers"],
              ["Security review", "Input handling and authorisation", "Every trust boundary, every sink", "Each input has a validation and each action a permission check"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Reading unfamiliar code is a method, not a talent: orient at the entry point, write the data model down, run it, run its tests, trace one feature with a debugger, and learn the idioms you keep meeting. Comparing languages honestly means fixing the workload and the level of idiomatic skill, then reporting the constraints that made the difference — because the useful conclusion is never \"language X is better\" but \"for this workload, with this team, under these constraints, X costs less\".",
          },
        ],
        keyPoints: [
          "Orient in an unfamiliar codebase in under an hour using entry point, data model, tests and history.",
          "Use tests and diffs as documentation of intended behaviour and local convention.",
          "Name the isolation patterns of a language you do not use daily.",
          "Design a fair comparison between two languages: fixed workload, idiomatic code, stated constraints.",
          "Reproduce a bug before changing unfamiliar code.",
        ],
        exercises: [
          "Pick an open-source project in a language you do not use and, in one hour, write down its entry point, three core entities and the path of one user action.",
          "Run that project's test suite and find two tests that document behaviour you would not have guessed from the code.",
          "Implement the same small data-processing task in two languages and compare line count, readability and testability. Then measure both on a dataset large enough for the measurement to mean something.",
          "Take a recent commit in a repository you did not write and explain in three sentences what changed and why, using only the diff and the commit message.",
          "Find a language feature you consider strange (traits, generators, decorators, pattern matching) and write down what problem it solves in its own language's terms.",
        ],
        challenge:
          "Contribute a small, real change to a codebase in a language that is not your strongest: reproduce an issue, write a failing test, make the smallest idiomatic fix, and open a pull request that explains what you changed and how you verified it. Include what surprised you about the language and what you would have done differently in the language you know best.",
      }),

      lesson({
        id: "learning-a-new-language",
        title: "Learning a new language",
        summary:
          "The fifth language is much cheaper than the first. This lesson gives a plan for acquiring a new language in weeks rather than years: the six things to learn first, the deliberate practice that builds fluency, how to transfer what you already know without writing the old language in new syntax, the resources worth your time, and how to prove competence to an employer — on a schedule that assumes you have a job and a family.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Language acquisition is a skill with a method, and the method is mostly about sequencing: syntax last, because it is the easiest part, and the standard library, idioms and tooling first, because they are what make code look like it was written by somebody who belongs. This lesson is the shortest chapter in the course and the one people return to most often, because the need to learn another language never stops.",
          },
          {
            heading: "Definition: fluency, and the six first things",
            kind: "definition",
            body:
              "**Fluency** in a language, in the sense employers mean, is: you can start a project from nothing, read unfamiliar code in it, write tests, debug without a search engine for the common cases, and use the community's conventions without being told. It is not knowing every feature.\n\nThe six things to learn first, in order:\n\n1. **Tooling.** How to install the runtime, run the file, manage dependencies, run tests, format and lint. A language without its tools is a syntax you cannot use.\n2. **The type and data model.** What the primitive types are, how to build a record, a list, a map, and how the language represents \"nothing\" (null, nil, None, Option, undefined). Getting this wrong causes more bugs than anything else.\n3. **Control flow and iteration, the language's way.** Does the language prefer loops or comprehensions, `for` or iterators, exception-based or value-based error handling? Copy the idiom.\n4. **Functions and modules.** How closures, higher-order functions, visibility, packages and imports work — this is where the language's philosophy lives.\n5. **The standard library's greatest hits.** Strings, dates, files, JSON, HTTP, collections. Knowing the twenty functions you will use every day prevents reinventing them badly.\n6. **The community's conventions.** Style guide, test framework, error-handling convention, package manager, project layout. Follow them before you have opinions.",
          },
          {
            heading: "Deliberate practice that actually builds fluency",
            kind: "paragraph",
            body:
              "Reading and watching produce recognition; writing and fixing produce ability. Four exercises with a high return:\n\n- **Rewrite something you already know** in the new language — a script, a small tool, a kata. You are not solving a problem, you are practising expression, so your attention is free for the language.\n- **Do exercises in the idioms of the language.** Solve a problem, then read the community's best answers and notice the constructs you did not use. That gap is your curriculum.\n- **Read and modify real code.** Add a feature to an open-source project or fix a small bug. This is the fastest way to meet real conventions and real review.\n- **Deliberately write something ugly in your old language's style, then refactor it.** Contrast is what makes idioms memorable.\n\nTwo constraints make a difference. **Short sessions daily beat long sessions weekly** — an hour a day for a month is a different outcome from one Saturday. And **keep a language journal**: one line per session recording what you learned, what confused you and the construct you avoided. The journal becomes your revision list for interviews.\n\nTransfer what you already own: algorithms, data structures, testing habits, debugging discipline, design principles and system knowledge carry over completely. Only syntax, idioms, standard library and tooling are new. Framing the task that way typically turns \"years\" into \"weeks of focused work\".",
          },
          {
            heading: "Worked example: four weeks from zero to functional",
            kind: "example",
            body:
              "A developer who writes JavaScript needs to work in Go for a new backend service. A realistic plan, with a job and other work, is about one hour a day plus weekends — roughly fifty hours.\n\nThe plan is organised around producing something, because projects force the learning of whatever is missing. The final item is the one that matters to an employer: a working service with tests, in the repository, deployable — plus the ability to explain why it was written the way it was.\n\nNote what the plan deliberately skips: advanced concurrency patterns in week one, the language specification, and writing \"the same app but in Go\" as a framework exercise. Idioms are learned from the language's own examples and documentation, not from translating a framework.\n\nAt the end, the visible evidence of competence is small, real and verifiable: a repository, a README, tests that pass, and a deploy. That is worth more to a hiring manager than a certificate saying you attended a course.",
            code:
              "Week 1 — Tooling and reading (7 h)\n  • install, run, format, lint, init a module, run a test\n  • read the language tour and one style guide, cover to cover\n  • read the source of a small, well-regarded project in the language\n\nWeek 2 — Idioms by rewriting (7 h)\n  • port a 200-line script you wrote before\n  • do 15 exercises; after each, read two community solutions and note\n    the constructs you did not use    → that list is your study guide\n  • learn error handling and the 'nothing' representation properly\n\nWeek 3 — Real project, small (10 h)\n  • a service with: an HTTP endpoint, input validation, a database call,\n    structured logs, two unit tests and one integration test\n  • read the documentation for every dependency you add\n\nWeek 4 — Polish and proof (10 h)\n  • add tests for the failure paths (invalid input, timeout, missing row)\n  • write the README: what it does, how to run it, what you would change\n  • deploy it somewhere free; call it with curl and paste the output\n  • 1 h: write five interview answers about the choices you made\n\nEvidence produced:  a repository, a passing test suite, a live deploy,\n                    and a set of decisions you can defend out loud.",
            language: "text",
            codeLabel: "Fifty hours, organised around producing something",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Tutorials without projects.** Watching is not learning; skills form when you have to make something work and cannot find the exact tutorial for your problem.\n- **Writing the old language in the new syntax.** Reviewers see it instantly. Copy the community's style guide until it is automatic, then develop opinions.\n- **Learning the language instead of the ecosystem.** Knowing syntax without the test runner, package manager and deployment story leaves you unable to ship, which is what \"knowing\" means in practice.\n- **Cramming on a weekend and stopping.** Fluency decays without use. Thirty minutes a day sustains it; one long session a month does not.\n- **Waiting to \"be ready\" before applying.** Interviews test reasoning, problem solving and clarity. Applying while you are building is part of the learning plan.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Time available", "What is realistically achievable", "Best use of it"],
              ["A weekend", "Basic syntax; read a small program", "Follow a one-hour tour, then write 50 lines"],
              ["One week (1 h/day)", "Reading comprehension; small scripts", "Rewrite a known script; learn the tooling"],
              ["One month (1 h/day)", "Functional: a small service with tests", "The four-week plan above"],
              ["Three months (part-time)", "Productive in a team with review", "Add a real project, read real code, get feedback"],
              ["Six months", "Independent, idiomatic, interview-safe", "Ship, contribute, teach one thing to somebody else"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A new language costs days of syntax and weeks of idiom, not years, because everything you know about algorithms, testing, design and systems transfers. Learn the tooling, the data model, the control-flow idioms, functions and modules, the standard library's daily-use parts and the community's conventions — then prove it with something small, real, tested and deployed. Short daily sessions plus one finished project will beat a year of collected tutorials every time.",
          },
        ],
        keyPoints: [
          "Define fluency in a language by what you can do without help, not by how many features you know.",
          "Order your learning: tooling and data model before syntax details and advanced features.",
          "Use rewriting, community solutions, real code and refactoring as deliberate practice.",
          "Distinguish what transfers between languages from what must be relearned.",
          "Produce verifiable evidence of competence: a repository, tests and a deploy.",
        ],
        exercises: [
          "Choose a language you do not know and list its tooling: runtime, package manager, test runner, formatter, linter. Install all five today.",
          "Write down how the chosen language represents nothing, errors, a record, a list and a map. Compare each with your main language.",
          "Rewrite a 100-line script you wrote in another language, then refactor it to use the new language's idioms and note every change.",
          "Solve five exercises and, for each, read two community solutions. Record the constructs you did not use.",
          "Build the smallest possible service in the new language with one test and one deploy, and write its README.",
        ],
        challenge:
          "Complete the four-week plan for a language you do not know: a small service with tests, structured logging and validation; a README that explains its design; a deployment you can call with `curl`; and five written answers about the decisions you made. Then have somebody who uses the language professionally review the code and tell you the three places where it is not yet idiomatic — and fix them.",
      }),
    ]
  ),
];
