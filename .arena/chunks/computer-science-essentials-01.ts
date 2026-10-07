{
  id: "what-computers-do",
  summary: [
    "Strip away every screen, framework and programming language and a computer is doing one thing, endlessly: **fetch an instruction from memory, work out what it means, carry it out, and move to the next one.** It does this billions of times a second, and every behaviour you have ever seen from any device — a video call, a bank transfer, a game — is a consequence of that loop and nothing else.",
    "This lesson builds the machine from the ground up: the von Neumann architecture and its five parts, the instruction cycle and the clock, what a CPU actually contains, the memory hierarchy and why it exists, how software stacks into layers of abstraction, and the input–store–process–output model that every application reduces to. It is the mental model the rest of the program assumes you have.",
  ],
  objectives: [
    "Describe the von Neumann architecture and name the function of each of its five components.",
    "Walk through the fetch–decode–execute cycle for a concrete instruction, naming the registers involved at each stage.",
    "Explain what the clock does, what a CPU core is, and why adding cores does not make every program faster.",
    "Order the memory hierarchy by speed, size and cost, and explain what a cache hit and a cache miss mean for performance.",
    "Describe the layers between hardware and an application, and give an example of what each layer hides.",
    "Analyse any application as inputs, stored data, processing and outputs, and identify where its state lives.",
    "Explain the stored-program idea and why it made general-purpose computing possible.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "One loop, run very fast",
      paragraphs: [
        "A computer is a machine for executing a **program**: a finite, ordered list of instructions stored in memory. That last part — *stored in memory* — is the invention that made computers general-purpose. Before it, machines were wired for one task; changing what they did meant physically rebuilding them. The **stored-program** idea, described by John von Neumann in 1945 and implemented in machines such as the Manchester Baby and EDVAC, put the program in the same memory as the data, so a machine could be retasked by writing new numbers into memory rather than by rewiring anything.",
        "Everything since then is refinement of that design. Your phone has billions of transistors instead of thousands of vacuum tubes, but the essential shape is the same: a processor that reads instructions from memory, executes them, and writes results back to memory — over and over, in lockstep with a clock.",
        "This matters practically, not historically. When a program is slow, the reason is always somewhere in this model: too many instructions, instructions that wait on memory, or work that could have been done once but is being done a thousand times. When you cannot work out why a bug happens, the answer is nearly always a piece of state in memory changing at a moment you did not expect. A firm model of the machine turns both from mysteries into diagnostics.",
      ],
    },
    {
      kind: "definition",
      term: "Von Neumann architecture",
      text: "A computer design in which **program instructions and data are stored in the same read-write memory**, addressed by number, and a central processing unit executes instructions one at a time in sequence. Its five components are the arithmetic/logic unit, the control unit, memory, and input and output mechanisms, connected by a bus.",
    },
    {
      kind: "table",
      caption: "The five components and their jobs",
      head: ["Component", "What it does", "In a modern machine"],
      rows: [
        ["**Arithmetic/Logic Unit (ALU)**", "Performs arithmetic (add, subtract, multiply) and logic (AND, OR, NOT, compare) on values in registers.", "Several per core, plus specialised units for floating point and for vector/SIMD operations."],
        ["**Control Unit (CU)**", "Fetches instructions, decodes them into signals, and sequences the other components. It does no arithmetic itself.", "Decode logic plus a micro-op cache, branch predictor and out-of-order scheduler."],
        ["**Memory**", "Holds both the instructions being executed and the data they work on, as numbered locations.", "Registers → L1/L2/L3 cache → RAM → SSD, a hierarchy spanning five orders of magnitude in speed."],
        ["**Input**", "Brings information in from the outside world.", "Keyboard, touchscreen, network card, camera, microphone, sensors, disk."],
        ["**Output**", "Sends results out.", "Display, speakers, network, disk, motors, haptics."],
        ["**Bus / interconnect**", "Carries addresses, data and control signals between the components.", "A memory controller, PCIe lanes and on-chip interconnects rather than one shared wire."],
      ],
    },
    {
      kind: "prose",
      heading: "The instruction cycle",
      paragraphs: [
        "The processor repeats a cycle, and understanding its stages explains most of what makes programs fast or slow. A small number of **registers** are involved: the **program counter (PC)** holds the address of the next instruction; the **instruction register (IR)** holds the instruction currently being executed; the **memory address register (MAR)** and **memory data register (MDR)** carry addresses and values to and from memory; and a bank of **general-purpose registers** (`r0`, `r1`, … or `rax`, `rbx` on x86) holds the values being worked on. Registers are the fastest storage in the machine — a few dozen bytes of it, accessible in a single cycle.",
        "The cycle itself is **fetch, decode, execute**, and often a fourth **store/write-back**:",
      ],
    },
    {
      kind: "list",
      style: "steps",
      heading: "Fetch–decode–execute–write-back",
      items: [
        "**Fetch.** The control unit puts the address in the PC onto the MAR, reads that memory location into the MDR, copies it into the IR, and increments the PC. One instruction has been retrieved; the PC now points at the next.",
        "**Decode.** The bits of the instruction are interpreted: which operation is it (the **opcode**), and where are its operands — a register, an immediate constant embedded in the instruction, or a memory address? Different opcodes activate different circuits.",
        "**Execute.** The ALU performs the operation, or the control unit performs a memory read/write, or the branch unit decides whether to change the PC. For `ADD r1, r2, r3` the ALU adds the contents of `r2` and `r3`.",
        "**Write-back.** The result is stored — into a register, or into memory at an address. For a conditional branch, the only 'result' may be a new value for the PC, which is how a loop repeats or an `if` skips.",
      ],
    },
    {
      kind: "example",
      title: "Tracing one instruction",
      paragraphs: [
        "Suppose the program counter holds `0x1004` and memory there contains the instruction `ADD r1, r2, r3` — 'put the sum of registers r2 and r3 into r1'. Assume `r2 = 5` and `r3 = 8`.",
      ],
      code: `PC   = 0x1004          memory[0x1004] = ADD r1, r2, r3
r1   = 0               r2 = 5           r3 = 8`,
      trace: [
        "**Fetch:** MAR ← 0x1004. Memory is read; MDR ← the encoded bits of `ADD r1, r2, r3`. IR ← MDR. PC ← 0x1008 (the next instruction's address).",
        "**Decode:** the opcode field says ADD; the operand fields say destination r1, sources r2 and r3. The control unit routes r2 and r3 to the ALU's inputs.",
        "**Execute:** the ALU computes 5 + 8 = 13 and sets condition flags (zero = false, negative = false, carry = false, overflow = false) that a later conditional branch may test.",
        "**Write-back:** r1 ← 13. Memory is untouched; the program counter already points onward.",
        "The next cycle fetches whatever is at 0x1008. Nothing else in the machine needed to know that an addition happened.",
      ],
    },
    {
      kind: "prose",
      heading: "The clock, cores and why more of either is not automatically better",
      paragraphs: [
        "A **clock** generates a regular pulse — 3 GHz means three billion cycles a second, one every ~0.33 nanoseconds. Each cycle advances the pipeline one step. The clock exists to keep every part of the machine in step, and its rate is limited by physics: a signal must propagate through the slowest path between two registers before the next pulse, so longer paths and hotter chips mean lower achievable frequencies. The 'clock race' ended around 2005 for exactly this reason; since then performance has come from architecture and parallelism rather than raw frequency.",
        "A **core** is one complete copy of the fetch–decode–execute machinery. A modern CPU has several cores, and each may run two **hardware threads** simultaneously (Hyper-Threading, SMT) by keeping a second set of architectural registers so that when one thread stalls on memory the other can use the execution units. Cores share the largest cache level and the memory controller.",
        "More cores only help work that can be **split**. Modern processors are also *superscalar* — executing several instructions per cycle when they are independent — and use **out-of-order execution** and **branch prediction** to keep the pipeline full. Those tricks work automatically on a single thread. Splitting work across cores does not: it is the programmer's job, it is hard, and it introduces the possibility of two threads touching the same memory at once. A program with a serial bottleneck obeys **Amdahl's law**, which says that if a fraction `p` of the work can be parallelised, the maximum speedup on `N` cores is `1 / ((1 − p) + p/N)` — and as `N` grows, that limit approaches `1/(1 − p)`. If 10% of your program is inherently serial, no number of cores will ever make it more than ten times faster.",
      ],
    },
    {
      kind: "formula",
      expression: "maximum speedup = 1 / ((1 − p) + p / N)",
      where: [
        "`p` is the fraction of the work that *can* run in parallel; `1 − p` is the part that cannot.",
        "`N` is the number of processors.",
        "With `p = 0.9` and `N = 4`: speedup ≈ 1 / (0.1 + 0.225) ≈ 3.08×. With `N = 100`: ≈ 9.2×. With `N = ∞`: exactly 10×.",
        "The lesson is uncomfortable and permanent: the serial part of a program is the ceiling, so the highest-value optimisation is often making more of the work parallelisable — or removing the serial part altogether.",
      ],
    },
    {
      kind: "prose",
      heading: "The memory hierarchy",
      paragraphs: [
        "There is no single memory technology that is simultaneously fast, large and cheap, so computers use several and hide the difference from you. **Registers** hold a few dozen bytes and are accessed in under a nanosecond. **L1 cache** holds tens of kilobytes per core at a few cycles. **L2** holds hundreds of kilobytes to a megabyte. **L3** is shared, tens of megabytes. **RAM** holds gigabytes at roughly 100 nanoseconds — about 300 cycles, which to a CPU is an eternity. An **SSD** holds terabytes at tens of microseconds, and a **network round trip** takes tens or hundreds of milliseconds.",
        "The classic way to feel the scale is to compress it to human time. If one CPU cycle were one second, then a main-memory access would take about five minutes, an SSD read about two days, and a network request from Accra to a server in Europe about fifteen years. Programs that 'wait for the network' are, from the processor's point of view, waiting for geological eras — which is exactly why asynchronous programming exists.",
        "The hierarchy works because of **locality**. *Temporal* locality means a value used now is likely to be used again soon — loop counters, the object you just accessed. *Spatial* locality means values near a used address are likely to be used soon — the next element of an array, the next instruction. Caches exploit both by fetching **lines** (typically 64 bytes) rather than single values, and by keeping recently used lines. When the data you need is already in cache, that is a **hit**, and it costs a few cycles. When it is not, that is a **miss**, and the CPU stalls for hundreds of cycles while the line is fetched from RAM.",
        "This is why data structure choice is a performance issue and not only a matter of elegance. Iterating an array from start to end is cache-friendly: each 64-byte line brings eight doubles, and the prefetcher can see the pattern coming. Walking a linked list scattered across the heap causes a miss at nearly every step, because each node is somewhere else in memory — and a linked list can therefore be *slower* than an array even though its theoretical operation costs look better. Measure, and remember that Big-O ignores a constant factor that cache behaviour can make enormous.",
      ],
    },
    {
      kind: "table",
      caption: "The hierarchy, in scale",
      head: ["Level", "Typical size", "Latency (cycles)", "If one cycle were one second"],
      rows: [
        ["Registers", "tens of bytes", "< 1", "instant"],
        ["L1 cache", "32–64 KB per core", "~4", "4 seconds"],
        ["L2 cache", "256 KB – 1 MB", "~12", "12 seconds"],
        ["L3 cache (shared)", "8–64 MB", "~40", "40 seconds"],
        ["Main memory (RAM)", "8–128 GB", "~200–300", "about 5 minutes"],
        ["SSD random read", "terabytes", "~100,000", "about 1.5 days"],
        ["Network, same region", "—", "~10 million", "about 4 months"],
        ["Network, another continent", "—", "~100 million", "about 3 years"],
      ],
    },
    {
      kind: "warning",
      label: "The abstraction leak you must know about",
      text: "Programming languages pretend memory is uniform and infinitely fast. It is not, and the pretence fails at exactly the moment you need performance. Code that is asymptotically optimal but cache-hostile loses to code that is asymptotically worse but cache-friendly, routinely, at real data sizes. Before rewriting an algorithm, check whether you are striding randomly through a large structure.",
    },
    {
      kind: "prose",
      heading: "Software: layers of abstraction",
      paragraphs: [
        "Nobody writes programs in the CPU's own machine code, because machine code is specific to one instruction set, has no names, no structure and no protection against error. Instead the industry built a stack, where each layer presents a simpler machine than the one below and hides its complexity. **Abstraction** is the single most important idea in computing: it is what lets you reason about a web request without thinking about voltages.",
        "From the bottom: **transistors** switch electrically, and are combined into **logic gates** (AND, OR, NOT) that compute on bits. Gates form **circuits** — an adder, a register, a decoder. Circuits form the **instruction set architecture (ISA)**, the contract between hardware and software: x86-64, ARM, RISC-V. The ISA is what machine code speaks. Above it, the **operating system** provides processes, virtual memory, files, sockets and a scheduler, so programs need not know which physical memory or disk they have. Above that sit **runtimes and libraries** — the JavaScript engine in your browser, the Node.js runtime, a database engine — which provide higher-level primitives. Then **programming languages** and their compilers or interpreters, then **frameworks** such as React or Express, and finally the **application** you wrote.",
        "Each layer costs something — an abstraction that hides work usually adds work — and each is worth it because the alternative is unmanageable complexity. But abstractions leak, and knowing one layer down from where you work is what separates a developer who can debug from one who can only guess. When your React component renders too often, the answer lives in the framework layer; when the server runs out of memory, it lives in the runtime and OS layers; when a query takes nine seconds, it lives in the database's storage engine.",
      ],
    },
    {
      kind: "code",
      caption: "The same idea at five levels",
      language: "text",
      code: `application    "Show this student their progress for the week"
framework      <ProgressRing percent={72} />
language       const percent = Math.round(done / total * 100)
runtime        V8 compiles that to optimised machine code and calls into libuv for I/O
OS             schedules the process, maps virtual memory, hands bytes to the network stack
ISA            add rax, rbx ; imul rax, rcx ; cvtsd2si ...
circuits       adders, multipliers, registers, built from gates
gates          AND, OR, NOT, XOR — combinations of which compute anything
transistors    switches: on or off`,
    },
    {
      kind: "prose",
      heading: "The model every application fits",
      paragraphs: [
        "Whatever else a program does, it performs four operations on data, and it does them in a loop. **Input** arrives from somewhere — a keystroke, a tap, a file, a network response, a sensor. **Storage** holds it: in a variable for a moment, in memory for the session, on disk or in a database for years. **Processing** transforms it: arithmetic, comparison, filtering, formatting, deciding. **Output** leaves: pixels, sound, a written file, a request to another service.",
        "This is worth more than it sounds, because it is a diagnostic tool. When an application misbehaves, ask the four questions in order. Where did the data come from, and did it arrive as expected? Where is it held, and could something else have changed it? What transformation ran, and did it run on the data you think it did? What was produced, and is the problem actually in the *display* of a correct value? Almost every bug is located by that sequence, and most of them turn out to be the second question — state that is not what you assumed.",
        "It also explains why 'state management' is a whole discipline. Inputs arrive asynchronously and out of order; storage is shared between parts of the program; processing must be deterministic to be testable; and outputs must reflect the current stored value rather than a stale copy of it. React, Redux, databases and operating systems are all, in different ways, careful answers to 'where does the data live and who is allowed to change it'.",
      ],
    },
    {
      kind: "example",
      title: "Decomposing a familiar app",
      paragraphs: [
        "A mobile-money transfer, analysed with the four-part model. Notice that most of the complexity is in storage and processing, not in the screens.",
      ],
      trace: [
        "**Input:** the recipient's number, the amount, your PIN; plus inputs you never see — the device id, the network signal, the timestamp, your session token.",
        "**Storage:** your balance and transaction history in the provider's database; your session on the device; the pending transaction in a queue; your PIN as a *hash*, never as text. Storage is where correctness lives: a balance must not be readable while it is being changed.",
        "**Processing:** validate the amount against the balance and the daily limit; verify the PIN by comparing hashes; check the recipient exists; **debit and credit atomically**, so a failure part-way cannot leave money created or destroyed; write an audit record; trigger an SMS.",
        "**Output:** the confirmation screen, the SMS to both parties, the receipt PDF, the updated balance in every other view, and the messages sent to the banking network.",
        "**The loop:** every step waits on inputs arriving from elsewhere — the network, the database, an SMS gateway — so the app spends most of its life waiting rather than computing. That is why it is written with asynchronous code, and why the interesting failures are timeouts and partial completions rather than arithmetic errors.",
      ],
    },
    {
      kind: "note",
      label: "Hardware and software are the same thing at bottom",
      text: "An instruction is a pattern of bits; so is the data it operates on. That equivalence — the stored-program idea — means a machine can treat a program as data: a compiler reads source code and writes machine code; a JavaScript engine compiles functions while your page runs; an operating system loads a file into memory and calls it a process. Everything 'meta' about computing comes from those four words: instructions are data too.",
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Instruction", text: "One operation the CPU can perform, encoded as bits: an opcode plus operands." },
        { term: "Program", text: "A finite ordered list of instructions stored in memory." },
        { term: "Register", text: "A tiny, extremely fast storage location inside the CPU. The PC, IR, MAR, MDR and general-purpose registers." },
        { term: "Program counter (PC)", text: "The register holding the address of the next instruction. Changing it is how jumps, loops and branches work." },
        { term: "Clock cycle", text: "One pulse of the system clock; the unit in which instruction stages are measured." },
        { term: "Core", text: "One independent fetch–decode–execute pipeline. Several cores run several threads genuinely simultaneously." },
        { term: "Cache", text: "Small fast memory holding copies of recently used main-memory lines, exploiting temporal and spatial locality." },
        { term: "Cache hit / miss", text: "Whether the data you asked for was already in cache. A miss costs hundreds of cycles." },
        { term: "Locality", text: "The tendency of programs to reuse recent data (temporal) and nearby data (spatial). The reason caches work." },
        { term: "Abstraction", text: "A layer that offers a simpler model and hides the mechanism beneath it. The core technique of all of computing." },
        { term: "ISA", text: "Instruction set architecture — the contract defining the instructions a CPU understands." },
        { term: "State", text: "The data a program holds at a moment in time. Most bugs are state bugs." },
      ],
    },
    {
      kind: "prose",
      heading: "Seeing the machine on your own computer",
      paragraphs: [
        "None of this is hidden. Open your system monitor — Task Manager on Windows, Activity Monitor on macOS, `htop` or `top` in a Linux terminal — and you are looking at the model: a list of **processes**, each with a memory footprint and a share of CPU time, spread across cores. Watch the CPU graph while you open a heavy application and you will see the scheduler move work between cores.",
        "In a terminal, `lscpu` (Linux) or `sysctl -n machdep.cpu.brand_string` (macOS) prints the model, core count, clock speed and cache sizes of the machine you are using. Reading the actual cache sizes of your own laptop makes the hierarchy concrete in a way no diagram does.",
      ],
    },
    {
      kind: "code",
      caption: "Interrogating the machine you are sitting at",
      language: "bash",
      code: `# Linux
lscpu                      # cores, threads, MHz, cache sizes
free -h                    # how much RAM, how much is cached
top -o %MEM                # processes by memory
cat /proc/cpuinfo | head   # the CPU's own description of itself

# macOS
sysctl -n hw.ncpu hw.memsize hw.l1icachesize
top -o mem

# Anywhere: watch a program's own memory while it runs
# (Node example — RSS is the resident set size, the RAM it actually occupies)
node -e "setInterval(() => console.log(process.memoryUsage().rss / 1048576 | 0, 'MB'), 1000)"`,
    },
  ],
  practice: {
    challenge:
      "Choose an application you use every day — a banking app, WhatsApp, a ride-hailing app — and write out its **inputs**, its **stored data**, its **processing steps** and its **outputs**, in that order, as four lists. Be specific: name where each piece of state lives (on the device, on a server, in a queue) and identify one place where a failure part-way through the processing would leave the system inconsistent. Finish by naming the one operation that must never be allowed to happen twice.",
    exercises: [
      {
        prompt: "Trace the instruction cycle for `LOAD r1, [0x2000]` when memory at `0x2000` contains the value 42. Say what each of PC, MAR, MDR, IR and r1 holds after every stage.",
        hint: "LOAD is two memory accesses in disguise: one to fetch the instruction, one to fetch the operand. The PC has already moved on before the second one happens.",
      },
      {
        prompt: "Your program spends 80% of its time in code that can be parallelised. Compute the maximum speedup on 4 cores and on 16 cores, and say what the ceiling is as cores go to infinity.",
        hint: "`1 / (0.2 + 0.8/N)`. At N=4 that is 2.5×; at N=16 it is 4×; the ceiling is 5×. Notice how quickly the returns flatten.",
      },
      {
        prompt: "Explain why summing an array of a million numbers in order is much faster than summing every tenth element of the same array, even though the second loop does a tenth of the additions.",
        hint: "Sequential access loads each 64-byte cache line once and uses all of it. Strided access loads the same number of lines and uses one eighth of each.",
      },
      {
        prompt: "Convert this description into the four-part model, and identify the piece of state most likely to be wrong when a user reports a bug: 'A student marks a lesson complete; the course percentage updates; a certificate is issued when the last lesson is marked.'",
        hint: "Three writes happen: the progress list, the derived percentage, and the certificates list. The derived value is the one that goes stale.",
      },
      {
        prompt: "List the layers from your application code down to a transistor, and for each write one sentence about what that layer hides from the one above.",
        hint: "Nine or ten layers, from `application` to `transistor`. The operating system hides physical memory; the ISA hides circuits; the compiler hides the ISA.",
      },
      {
        prompt: "Run the system-monitor commands above. Record your core count, thread count, clock speed and L1/L2/L3 cache sizes, and calculate how many bytes of cache your machine has per core.",
        hint: "Threads are usually twice cores. Cache per core is the interesting number: it is what your program's working set has to fit into to be fast.",
      },
      {
        prompt: "A web page waits 200ms for an API response and 2ms to render it. Express both in CPU cycles at 3 GHz, and explain what the browser's JavaScript thread is doing during the 200ms.",
        hint: "200ms is 600 million cycles — long enough to execute hundreds of millions of instructions, all of which are being wasted if the thread is blocked. That is why the wait is asynchronous.",
      },
    ],
    checkYourself: [
      "What is the stored-program idea, and why did it make computers general-purpose?",
      "Name the five components of the von Neumann architecture and one job each.",
      "Which register holds the address of the next instruction, and how does a loop change it?",
      "Why did CPU clock frequencies stop rising around 2005, and what replaced the gains?",
      "Order the memory hierarchy from fastest to largest, with approximate latencies.",
      "What are temporal and spatial locality, and why does a cache fetch 64 bytes when you asked for 8?",
      "State Amdahl's law and explain what it implies about the serial part of your program.",
      "What does an abstraction cost, and why is it still worth it?",
    ],
  },
  takeaways: [
    "A computer is one loop — fetch, decode, execute, write back — run billions of times a second against memory that holds both data and instructions.",
    "The stored-program idea is why one machine can be a spreadsheet, a game or a server: instructions are data.",
    "Registers are nanoseconds, RAM is a hundred of them, an SSD is a hundred thousand, and a network call is geological.",
    "Caches work because of locality; data structures that destroy locality destroy performance regardless of their Big-O.",
    "More cores help only work you can split, and Amdahl's law caps the gain at the serial fraction.",
    "Software is a stack of abstractions, each hiding a layer and each leaking occasionally — know one layer below where you work.",
    "Every application is input → storage → processing → output in a loop, and that model locates most bugs.",
  ],
  further: [
    "Next: [[Bits, bytes & data|/learn/computer-science-essentials/binary-data]] — how the numbers in those registers represent anything at all.",
    "[[Memory, programs & processes|/learn/computer-science-essentials/memory-processes]] returns to the operating-system layer in detail.",
    "Open your system monitor now and leave it running for a day; the model becomes obvious once you have watched a scheduler work.",
  ],
},
