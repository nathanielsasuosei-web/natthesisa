{
  id: "memory-processes",
  summary: [
    "A program sitting on disk is inert — a file of bytes doing nothing. A **process** is that program brought to life: loaded into memory, given resources, granted CPU time, and isolated from every other process on the machine. The distinction between the two explains a remarkable amount of everyday computing, from why you can run the same application twice to why a crashed tab does not take the browser with it.",
    "This lesson covers what the operating system does when it runs a program, virtual memory and why every process believes it owns the whole address space, the stack and the heap and what lives in each, the anatomy of a process and its states, threads and concurrency, common memory errors and how garbage collection changes the list, and the practical skill of reading a system monitor and a stack trace.",
  ],
  objectives: [
    "Distinguish a program from a process, and list the resources the operating system gives a process.",
    "Explain virtual memory, address translation, pages, and why isolation between processes depends on them.",
    "Describe the layout of a process's address space and say what lives in each region.",
    "Explain how the call stack works, what a stack frame contains, and why recursion can overflow it.",
    "Distinguish stack from heap allocation, and say when each is used and what it costs.",
    "Define a thread, and explain the difference between concurrency and parallelism.",
    "Name the classic memory errors, and say which ones garbage collection eliminates and which it does not.",
    "Read a stack trace and a memory report and diagnose a leak or a crash from them.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "Programs, processes and the job of the operating system",
      paragraphs: [
        "A **program** is a passive file: instructions and initial data on disk. A **process** is a program in execution — an active entity with its own memory, its own register state, its own open files and network connections, and its own identity in the operating system's process table. Double-click an application twice and you get two processes running one program, each with independent state.",
        "The **operating system** is the program that manages all of this, and it has four jobs that matter here. It **abstracts** the hardware, so a program asks for 'memory' or 'a file' rather than for a specific physical address or a disk sector. It **allocates** resources, deciding which process gets which memory pages and how much CPU time. It **isolates** processes from each other, so one cannot read or corrupt another's memory — this is the foundation of security on every computer you use. And it **schedules**, interleaving many processes on few cores so that everything appears to run at once.",
        "When you launch a program, a specific sequence happens. The OS creates a new process — on Unix, `fork()` clones an existing one and `exec()` replaces its contents with the new program; on Windows, `CreateProcess` does both at once. It builds the process's initial memory image: the executable's code, its read-only data, a heap, a stack, and space for the environment variables and command-line arguments. It records the process in its table with an identifier (the **PID**), a parent, a user, a priority and a set of permissions. Then it marks the process ready, and the scheduler eventually gives it a core, setting the program counter to the program's entry point. The C runtime runs, initialises libraries, and finally calls your `main`. In Node.js or a browser, the runtime does the same thing and then starts an event loop.",
        "Processes have **states**, and they move between them constantly: **new** while being created; **ready** when it could run but is waiting for a core; **running** while executing; **blocked** (or *waiting*) when it has asked for something that is not available yet — a disk read, a network response, a lock — and cannot proceed until it arrives; and **terminated** when it exits. Most processes spend almost all of their life blocked, waiting on I/O. That single fact is why operating systems can juggle hundreds of them, and why asynchronous programming exists: your program is nearly always waiting, and the useful skill is not blocking everything else while it does.",
      ],
    },
    {
      kind: "definition",
      term: "Process",
      text: "An instance of a program in execution, together with the state the operating system keeps for it: its **address space** (code, data, heap, stack), its register values and program counter, its open file and socket descriptors, its security credentials, and its parent and child relationships. Identified by a PID.",
    },
    {
      kind: "prose",
      heading: "Virtual memory: the most useful lie in computing",
      paragraphs: [
        "Every process is given the illusion that it has a large, private, contiguous block of memory starting at address zero. It does not. The addresses a program uses are **virtual**, and the memory management unit (MMU) in the CPU translates each one to a **physical** address in RAM on every access.",
        "Memory is divided into fixed-size **pages** — 4 KB is standard, with larger 'huge pages' available. A **page table**, one per process, maps virtual pages to physical frames. Because the translation is per process, two processes can use the same virtual address for completely different physical memory, and neither can address the other's at all: an access to a page not in your table causes a hardware **fault**, and the OS kills the process rather than let it read someone else's data. This is memory protection, and it is implemented in silicon, not by convention.",
        "Virtual memory buys four things beyond isolation. **It makes memory bigger than RAM**: pages that have not been used recently can be written to disk — the **swap** space — and read back on demand, so the total virtual memory of all processes can exceed physical RAM. **It makes allocation easy**: `malloc` can hand out a gigabyte of contiguous virtual addresses instantly, because no physical pages are committed until the program actually touches them — the first touch causes a fault, and the OS supplies a page then. This is called *demand paging*, and it is why allocating memory is cheap while using it is not. **It enables sharing**: the same physical page of read-only code can be mapped into a hundred processes, so running Chrome with twenty tabs does not load twenty copies of the engine's binary. **It enables copy-on-write**: `fork()` can create a new process by copying page *table entries* rather than memory, marking the pages read-only, and duplicating a page only when either process writes to it — which is why starting a process is fast.",
        "Two failure modes follow. A **page fault** costs microseconds to milliseconds — vastly more than a cache miss — so a program whose working set does not fit in RAM spends its life faulting, and the machine **thrashes**: swapping pages in and out with almost no useful work done. That is what your computer is doing when the disk light stays on and everything crawls after you open one too many applications. And a **segmentation fault** is what you get when you touch a page you have no mapping for: a wild pointer, a null dereference, writing to read-only memory. The process is terminated immediately, because the alternative would be to let it corrupt something.",
      ],
    },
    {
      kind: "table",
      caption: "The address space of a typical process, low to high",
      head: ["Region", "Contains", "Grows"],
      rows: [
        ["**Text / code**", "The machine instructions of the program. Read-only and shareable between processes.", "Fixed at load"],
        ["**Data**", "Initialised global and static variables (`int count = 5;`).", "Fixed at load"],
        ["**BSS**", "Uninitialised globals, zeroed by the loader before your code runs.", "Fixed at load"],
        ["**Heap**", "Dynamically allocated memory — `malloc`, `new`, every object and array you create at runtime.", "**Upward**, as you allocate"],
        ["*(gap)*", "Unmapped space between the two growing regions.", "—"],
        ["**Stack**", "Function call frames: parameters, local variables, return addresses. Allocated and freed automatically.", "**Downward**, as you call"],
        ["**Environment & args**", "`argv`, `argc` and the environment variables, at the very top.", "Fixed at load"],
        ["**Kernel space**", "Mapped but inaccessible to user code; entering it requires a system call.", "—"],
      ],
    },
    {
      kind: "prose",
      heading: "The stack: automatic, fast, small",
      paragraphs: [
        "Every function call pushes a **frame** onto the stack; every return pops it. A frame holds the function's **parameters**, its **local variables**, the **return address** to jump back to, and the previous frame's base pointer so the stack can be unwound. Because allocation is just moving a pointer and deallocation is moving it back, stack memory is essentially free — and it is automatically reclaimed, which is why local variables cannot leak.",
        "This is also what makes the stack **small**: typically 1 MB on Linux per thread, 8 MB for the main thread on macOS, and configurable in Node.js with `--stack-size`. Deep recursion blows through it, and the result is `Maximum call stack size exceeded` in JavaScript or a segmentation fault in C. The rule of thumb is that a recursion depth beyond a few thousand frames is a design problem: convert it to an explicit stack in the heap, or to a loop.",
        "The stack gives you the **call trace** — the chain of who called whom — and that is what a stack trace prints when something throws. Reading one is a core skill: the top frame is where the error was detected, but the interesting frame is usually further down, where *your* code made the assumption that turned out to be false.",
      ],
    },
    {
      kind: "example",
      title: "How a call builds the stack, and what a trace looks like",
      paragraphs: ["The call below throws. The output is the stack trace the runtime prints, newest frame first."],
      language: "javascript",
      code: `function total(prices) {
  return prices.reduce((sum, p) => sum + p.price, 0);   // ← line 2: throws here
}
function basketTotal(basket) {
  return total(basket.items);                            // ← called from here
}
function checkout(cart) {
  const amount = basketTotal(cart);                      // ← and from here
  return { amount, currency: "GHS" };
}
checkout({});   // basket is missing .items`,
      output: `TypeError: Cannot read properties of undefined (reading 'reduce')
    at total (checkout.js:2:17)
    at basketTotal (checkout.js:5:10)
    at checkout (checkout.js:8:18)
    at Object.<anonymous> (checkout.js:11:1)`,
    },
    {
      kind: "example",
      title: "Reading that trace",
      paragraphs: ["Four lines tell you the whole story, if you read them in order."],
      trace: [
        "**Frame 1** — `at total (checkout.js:2:17)`: the error surfaced inside `total`, at line 2, column 17. `prices` was `undefined`, and `.reduce` cannot be read from `undefined`.",
        "**Frame 2** — `at basketTotal (checkout.js:5:10)`: `total` was called from `basketTotal` with `basket.items`, which is where the `undefined` came from. `basket` had no `items` property.",
        "**Frame 3** — `at checkout (checkout.js:8:18)`: `basketTotal` was called with `cart`, which is the empty object `{}`.",
        "**Frame 4** — the call site: `checkout({})`. This is the actual bug — an empty object was passed where a basket was expected.",
        "The lesson: the **top** frame says where the symptom appeared; the **bottom** frame of your own code says where the bad data entered. Debug from the bottom up. Everything in between is the path the mistake travelled.",
      ],
    },
    {
      kind: "prose",
      heading: "The heap: flexible, slower, yours to free",
      paragraphs: [
        "The **heap** is where memory is allocated at runtime, on demand, in any size, in any order: every object, array, closure, string and buffer you create. Allocation asks a memory manager (`malloc`, `new`, or the runtime's allocator) for a block; it searches its free lists for one large enough, marks it used, and returns a pointer. Deallocation returns it to the free list. Because blocks are requested and released in arbitrary order, the heap **fragments**: free space becomes scattered in small unusable gaps, so allocation gets slower and may fail even when the total free memory looks sufficient.",
        "The heap is larger than the stack, its data outlives the call that created it, and — crucially — **somebody must decide when to release it.** Get that wrong and you have one of two classic bugs. Free too early and other code still holding the pointer reads freed memory: a **dangling pointer**, producing **use-after-free** crashes and, in C and C++, some of the most exploitable security vulnerabilities ever catalogued. Free twice and the allocator's own bookkeeping is corrupted: a **double free**. Never free and the memory is unreachable but still reserved: a **memory leak**, which grows until the process is killed by the OS's out-of-memory killer.",
        "**Garbage collection** removes this entire class of bug by finding the memory that is still reachable and reclaiming everything else. JavaScript, Java, C#, Python, Go and Ruby all collect automatically. The mechanism is usually **mark-and-sweep**: from a set of **roots** — the global object, the current stack frames, active closures — trace every reachable object and mark it, then sweep everything unmarked. Modern engines make it incremental and generational: new objects live in a small 'nursery' that is collected very frequently and cheaply, and survivors are promoted to an older generation collected rarely. That is why allocation in JavaScript feels free.",
        "Garbage collection does not make leaks impossible — it changes what a leak means. You leak when you keep an object reachable *by accident*: a growing array or cache that is never cleared, an event listener that is never removed, a closure capturing a large scope, a `setInterval` never cleared, a detached DOM node still referenced by JavaScript. The memory is technically reachable, so the collector cannot free it, and the process grows until it dies. In Node.js the default old-space limit is around 4 GB (2 GB on older versions), and hitting it produces `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`.",
      ],
    },
    {
      kind: "table",
      caption: "Stack versus heap",
      head: ["", "Stack", "Heap"],
      rows: [
        ["Allocated by", "The compiler/runtime automatically, per call", "You, explicitly (`new`, `malloc`, `{}`, `[]`)"],
        ["Freed by", "Automatically on return", "Garbage collector, or `free`/`delete`"],
        ["Speed", "Very fast — move a pointer", "Slower — search free lists; plus GC pauses"],
        ["Size", "Small: 1–8 MB typical", "Limited by RAM and the runtime's heap cap"],
        ["Lifetime", "Exactly one function call", "As long as something references it"],
        ["Order", "Strictly LIFO", "Arbitrary — which causes fragmentation"],
        ["Thread safety", "Private to the thread; no sharing", "Shared between threads; needs synchronisation"],
        ["Typical contents", "Numbers, booleans, references, call frames", "Objects, arrays, strings, closures, buffers"],
        ["Failure mode", "Stack overflow from deep recursion", "Out of memory from leaks or huge allocations"],
      ],
    },
    {
      kind: "warning",
      label: "Primitives and references",
      text: "In JavaScript, numbers, booleans, `null`, `undefined`, symbols and bigints live **by value** — copying one copies the number. Strings are immutable values, though stored on the heap. Everything else — objects, arrays, functions — is a **reference**: the variable holds a pointer, and copying it copies the pointer, not the data. So `const b = a` on an array does not duplicate the array; both names point at the same one, and `b.push(x)` is visible through `a`. This is the source of an enormous number of 'why did that change?' bugs, and the reason `structuredClone` and spread copies exist.",
    },
    {
      kind: "prose",
      heading: "Threads: many workers inside one process",
      paragraphs: [
        "A **thread** is an independent line of execution *inside* a process. Threads of the same process share its heap, its open files and its globals, but each has its own **stack** and its own registers. That sharing is the whole point and the whole problem: it makes communication between threads cheap — they simply read the same object — and it makes correctness hard, because two threads can reach the same memory at the same moment.",
        "**Concurrency** means dealing with several things at once, interleaving them so that progress happens on all of them; a single core can be concurrent by switching rapidly. **Parallelism** means doing several things at the same instant, which requires multiple cores. Every parallel program is concurrent, but not vice versa — and the distinction matters because concurrency bugs (interleavings) can appear on one core, while parallelism bugs (simultaneous writes) cannot.",
        "The canonical failure is a **race condition**. Two threads both read a counter at 0, both compute 1, both write 1 — and one increment is lost, even though each line of code is individually correct. The fix is **synchronisation**: a **mutex** (mutual exclusion lock) that only one thread may hold at a time, making a block of code a **critical section**; or **atomics**, hardware instructions that read-modify-write in one uninterruptible step. Both cost performance, and both introduce the next hazard: a **deadlock**, where thread A holds lock 1 and waits for lock 2 while thread B holds lock 2 and waits for lock 1, and neither can proceed. Deadlocks never fix themselves; the standard prevention is to always acquire multiple locks in the same global order.",
        "Different runtimes take very different positions on threads, and knowing yours matters. **JavaScript in the browser and in Node is single-threaded for your code**: one call stack, one thread, and concurrency achieved through an **event loop** with non-blocking I/O. Worker threads exist (`Web Workers`, Node's `worker_threads`), but they do not share ordinary objects — they pass messages and can share only `SharedArrayBuffer`s. Python has a **Global Interpreter Lock** that lets only one thread execute bytecode at a time, so its threads give concurrency for I/O but not parallelism for computation — for that you use `multiprocessing`. Java, C# and Go give you real shared-memory threads with real race conditions. The practical consequence: **if you write JavaScript, your bugs are not data races; they are ordering bugs** — a response arriving before a request finished, a callback running after the component unmounted, two `await`s interleaving in a way you did not plan.",
      ],
    },
    {
      kind: "code",
      caption: "The event loop, and where the heap and stack meet",
      language: "javascript",
      code: `console.log("1");

setTimeout(() => console.log("2"), 0);   // queued to the task queue

Promise.resolve().then(() => console.log("3"));   // queued to the microtask queue

console.log("4");

// Output: 1, 4, 3, 2
//
// The call stack runs to completion first (1, 4). Then the event loop drains
// the MICROTASK queue (promise callbacks → 3) before taking anything from the
// MACROTASK queue (timers, I/O callbacks → 2). A setTimeout of 0 never means
// "now"; it means "after the stack empties and all microtasks have run".

// Why this matters in real code:
async function save(record) {
  pending += 1;                 // stack: synchronous, immediate
  await db.write(record);       // heap object captured by the closure; the
                                // rest of this function resumes LATER, on a
                                // future turn of the loop
  pending -= 1;
}
// Two overlapping save() calls interleave at every await. If pending were
// an object shared with another async operation, that is your race condition
// — not in memory, but in time.`,
    },
    {
      kind: "prose",
      heading: "Diagnosing memory in practice",
      paragraphs: [
        "Reading a memory report is a job skill. Every runtime exposes one. In Node, `process.memoryUsage()` returns **rss** (resident set size — the physical RAM the process actually occupies), **heapTotal** (memory V8 has claimed for the heap), **heapUsed** (memory in use by live objects), **external** (C++ objects bound to JavaScript, such as buffers) and **arrayBuffers**. In a browser, the DevTools **Memory** panel takes heap snapshots and — more usefully — lets you take two snapshots separated by an action and diff them, which is how you find what a click leaked.",
        "The method for a suspected leak is always the same. Establish a baseline. Perform the suspicious action many times — open and close the dialog fifty times, navigate to the page and back fifty times. Force a garbage collection so you are looking at genuinely live objects. Snapshot again and compare. If the count of some object type grew by roughly fifty, you have found your leak, and the snapshot's **retainers** pane tells you exactly what is still holding a reference — usually an event listener, a timer, or a module-level array that only ever grows.",
      ],
    },
    {
      kind: "code",
      caption: "Watching a process's memory",
      language: "javascript",
      code: `// Node: print memory every second while the workload runs.
const mb = (n) => (n / 1048576).toFixed(1);
setInterval(() => {
  const m = process.memoryUsage();
  console.log(\`rss \${mb(m.rss)}MB  heap \${mb(m.heapUsed)}/\${mb(m.heapTotal)}MB  external \${mb(m.external)}MB\`);
}, 1000);

// The classic leak, and its fix:
const cache = new Map();                       // module level → a GC root
function handle(req) {
  cache.set(req.id, buildExpensiveObject(req)); // grows forever
}
// Fix 1: bound it.
// Fix 2: expire it — a TTL, or an LRU eviction policy.
// Fix 3: hold it weakly, so the collector may reclaim the value:
const weak = new WeakMap();                    // keys must be objects`,
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "PID", text: "The process identifier the OS uses to name a running process." },
        { term: "Virtual memory", text: "The per-process illusion of a private contiguous address space, translated to physical memory by the MMU." },
        { term: "Page / frame", text: "A 4 KB block of virtual memory, and the physical block it maps to." },
        { term: "Page fault", text: "An access to a page not currently mapped — the OS supplies it, at a cost of microseconds to milliseconds." },
        { term: "Thrashing", text: "Continuous paging with almost no useful work, because the working set exceeds RAM." },
        { term: "Segmentation fault", text: "Accessing memory you have no mapping for. The process is killed." },
        { term: "Stack frame", text: "The parameters, locals and return address pushed by one function call." },
        { term: "Heap", text: "Runtime-allocated memory whose lifetime is decided by reachability, not by scope." },
        { term: "Garbage collection", text: "Automatic reclamation of unreachable memory, usually by mark-and-sweep from a set of roots." },
        { term: "Memory leak (managed languages)", text: "Memory kept reachable by accident — a growing cache, an unremoved listener, an uncleared timer." },
        { term: "Thread", text: "An execution path inside a process, sharing its heap but owning its stack." },
        { term: "Concurrency / parallelism", text: "Interleaving several tasks / running several at the same instant." },
        { term: "Race condition", text: "A result that depends on the timing of interleaved operations." },
        { term: "Deadlock", text: "Two or more threads each waiting for a resource held by another, forever." },
        { term: "Event loop", text: "The mechanism by which single-threaded JavaScript achieves concurrency: run the stack to completion, drain microtasks, take one macrotask, repeat." },
      ],
    },
  ],
  practice: {
    challenge:
      "Open your system monitor (Task Manager, Activity Monitor, `htop`), **find three processes and compare their memory use**. For each, record the name, the PID, the memory, the CPU percentage and — where the monitor shows it — the thread count. Then answer in writing: which one is using the most memory and what is it probably holding there? Which has the most threads, and why would it need them? Which is currently *blocked* rather than running, and what is it waiting for? Finish by finding the monitor's own process in the list and explaining why it appears there at all.",
    exercises: [
      {
        prompt: "Explain why two processes can both use the address `0x7fff1234` without interfering, and what hardware makes that possible.",
        hint: "Per-process page tables and the MMU. The same virtual address maps to different physical frames in each.",
      },
      {
        prompt: "A program calls `malloc(1_000_000_000)` and it returns instantly, but the machine has 8 GB of RAM and the process then touches every byte and the system starts thrashing. Explain each of the three observations.",
        hint: "Demand paging means allocation reserves address space, not memory. Touching the bytes commits pages. Exceeding RAM starts swapping.",
      },
      {
        prompt: "Write a recursive function that overflows the stack, find roughly how deep it gets in your runtime, and then rewrite it iteratively using an explicit array as the stack. Compare memory use.",
        hint: "In Node the default depth is around 10,000–12,000 frames. The iterative version's array lives on the heap, which is far larger.",
      },
      {
        prompt: "For each of these, say whether the value lives on the stack or the heap in JavaScript: a local `number`, a local `object`, a global `Map`, a string literal, a function's parameter that is an array, a closure's captured variable.",
        hint: "Primitives in a local are stack-resident (or in a register). Everything else is heap-allocated with a reference on the stack.",
      },
      {
        prompt: "Predict the output of this, then explain it in terms of the microtask and macrotask queues: `console.log('a'); setTimeout(()=>console.log('b')); Promise.resolve().then(()=>console.log('c')); queueMicrotask(()=>console.log('d')); console.log('e');`",
        hint: "a, e, then all microtasks in order (c, d), then the macrotask (b).",
      },
      {
        prompt: "Write the interleaving that loses an increment when two async functions both do `count = count + 1` around an `await`, and show the fix using a queue or an atomic-style update function.",
        hint: "Both read `count` before either writes. Fix: keep the mutation synchronous with no `await` between read and write, or serialise the operations.",
      },
      {
        prompt: "Create a deliberate leak: a module-level array that a click handler pushes to and never clears. Use the DevTools Memory panel to snapshot before and after fifty clicks, diff them, and identify the retainer chain.",
        hint: "The retainers pane will show the array held by the module scope, which is a GC root. That chain is your diagnosis.",
      },
      {
        prompt: "Print `process.memoryUsage()` in a Node script before and after allocating a 500 MB `Buffer`, and explain why `external` changes but `heapUsed` barely does.",
        hint: "Buffers are C++ allocations bound to JavaScript objects; they are outside the V8 heap, which is why they can cause out-of-memory crashes that the heap limit does not explain.",
      },
      {
        prompt: "Read this stack trace and identify the frame that contains the real bug, explaining your reasoning: the top frame is inside `JSON.parse`, the next is `loadConfig` at `config.js:14`, the next is `startServer` at `server.js:3`, and the bottom is the entry point.",
        hint: "`JSON.parse` is a library doing exactly what it should. The bug is where the invalid input entered — `loadConfig` reading a file that was empty or not JSON.",
      },
    ],
    checkYourself: [
      "What is the difference between a program and a process?",
      "Name the four jobs of the operating system described in this lesson.",
      "What is virtual memory, and what are the four benefits it provides?",
      "Why can a process allocate more memory than the machine has RAM?",
      "What is in a stack frame, and why does deep recursion overflow?",
      "Which memory errors does garbage collection eliminate, and which does it merely redefine?",
      "What is the difference between concurrency and parallelism?",
      "Why does JavaScript have ordering bugs rather than data races?",
      "In what order does the event loop drain the stack, microtasks and macrotasks?",
    ],
  },
  takeaways: [
    "A program is a file; a process is that file loaded into memory with resources, an identity and isolation.",
    "Virtual memory gives every process a private address space, makes RAM go further, enables sharing and makes allocation cheap — the first touch is what costs.",
    "The stack is small, fast and automatic; the heap is large, slower and freed by reachability.",
    "A stack trace is read from the bottom up: the top frame is the symptom, your lowest frame is the cause.",
    "Garbage collection prevents dangling pointers and use-after-free, not leaks — an accidentally reachable object is still a leak.",
    "Threads share the heap and own their stacks, which makes communication cheap and correctness hard.",
    "JavaScript is single-threaded with an event loop: concurrency without shared-memory races, but with plenty of ordering bugs.",
    "Most processes spend their lives blocked on I/O — which is why asynchronous code is the normal case, not the exotic one.",
  ],
  further: [
    "Next: [[Networks & the internet|/learn/computer-science-essentials/networks-internet]] — what a process does when the data it is waiting for is on another machine.",
    "The backend course applies all of this: [[The server runtime|/learn/backend-node-apis/server-runtime]].",
    "Watch your own machine's processes for a day; the model in this lesson becomes obvious once you have seen a scheduler work.",
  ],
},
