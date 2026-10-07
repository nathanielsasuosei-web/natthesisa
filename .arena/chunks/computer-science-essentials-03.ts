{
  id: "logic-algorithms",
  summary: [
    "An algorithm is not code. It is a **finite sequence of unambiguous steps that transforms an input into an intended output**, and it exists whether or not anyone has written it in a programming language. Learning to state one precisely — before writing it — is the difference between programming and typing until something works.",
    "This lesson covers the formal properties an algorithm must have, boolean logic and truth tables, De Morgan's laws and how to simplify a tangled condition, the three control structures that every program is built from, loop invariants and how to prove a loop correct, functions and the discipline of preconditions and postconditions, and how to write and read pseudocode. It ends with worked traces of real algorithms so you can see the state change step by step.",
  ],
  objectives: [
    "State the five properties of an algorithm and check a candidate procedure against each of them.",
    "Build a truth table for any boolean expression and use it to verify that two expressions are equivalent.",
    "Apply De Morgan's laws to rewrite negated conjunctions and disjunctions, and simplify a condition of three or more clauses.",
    "Name the three control structures and explain why they are sufficient to express any computable procedure.",
    "Write a loop invariant for a given loop and use it to argue the loop is correct.",
    "Specify a function with a precondition, a postcondition and edge cases before writing its body.",
    "Read and write pseudocode, and trace a loop by hand showing the state at every iteration.",
    "Distinguish an algorithm from its implementation, and give two implementations of one algorithm.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "What makes a procedure an algorithm",
      paragraphs: [
        "The word comes from al-Khwārizmī, the ninth-century Persian mathematician whose name was Latinised and whose book on calculation gave us both 'algorithm' and, through 'al-jabr', 'algebra'. The modern definition is due to Donald Knuth, who listed five properties a procedure must have to count as an algorithm.",
        "**Finiteness** — it must terminate after a finite number of steps. A procedure that runs forever is a *method* or a *process*, not an algorithm; an operating system's scheduler is deliberately non-terminating. **Definiteness** — each step must be precisely and unambiguously stated. 'Sort the list sensibly' is not a step; 'compare adjacent items and swap them if the left is greater' is. **Input** — zero or more quantities are given before it begins. **Output** — at least one quantity is produced; a procedure that outputs nothing is not solving a problem. **Effectiveness** — every step must be simple enough to be carried out exactly and in finite time by a person with paper and pencil. This last one excludes 'compute the exact value of π' as a single step, because that never finishes.",
        "The distinction between an algorithm and its **implementation** matters constantly. Binary search is an algorithm; a recursive Python function, an iterative JavaScript function and a database index lookup are three implementations of it. You can discuss, prove and compare algorithms without any language at all — which is why interviews and textbooks use pseudocode, and why 'know React' and 'know how to search a sorted array' are different kinds of knowledge with different half-lives.",
      ],
    },
    {
      kind: "definition",
      term: "Algorithm",
      text: "A finite, definite, effective sequence of steps that takes zero or more inputs and produces at least one output, terminating for every valid input. Its **correctness** is whether it produces the intended output; its **efficiency** is how much time and memory it consumes; and these are independent properties — a correct algorithm can be unusably slow, and a fast one can be wrong.",
    },
    {
      kind: "prose",
      heading: "Boolean logic",
      paragraphs: [
        "Every decision in a program reduces to a value that is true or false, and every such value is built from three operators. **AND** (`&&`, `∧`) is true only when both operands are true. **OR** (`||`, `∨`) is true when at least one is true — this is the *inclusive* or, unlike English 'or' which often means exactly one. **NOT** (`!`, `¬`) inverts. Two more are worth knowing: **XOR** (exclusive or, true when exactly one is true, written `a !== b` for booleans) and **implies** (`p → q`, false only when p is true and q is false).",
        "A **truth table** enumerates every combination of inputs and the resulting output. It is the only completely reliable way to check a compound condition, and building one takes two minutes and prevents hours of debugging. For n variables there are 2ⁿ rows.",
        "Two operators in most languages behave specially and you must know it. `&&` and `||` **short-circuit**: in `a && b`, if `a` is false, `b` is never evaluated, because the answer is already known. This is a feature you should use deliberately — `user && user.email` avoids an error when `user` is null — and a bug source when the right-hand side has a side effect that you expected to always run.",
      ],
    },
    {
      kind: "table",
      caption: "Truth tables for the three basic operators",
      head: ["p", "q", "p AND q", "p OR q", "NOT p", "p XOR q", "p → q"],
      rows: [
        ["true", "true", "**true**", "**true**", "false", "false", "**true**"],
        ["true", "false", "false", "**true**", "false", "**true**", "false"],
        ["false", "true", "false", "**true**", "**true**", "**true**", "**true**"],
        ["false", "false", "false", "false", "**true**", "false", "**true**"],
      ],
    },
    {
      kind: "prose",
      heading: "De Morgan's laws, and untangling conditions",
      paragraphs: [
        "Two identities let you push a negation inside a boolean expression, and they are the tool for making a complicated condition readable:",
        "**NOT (p AND q) ≡ (NOT p) OR (NOT q)** — 'not both' means 'at least one is missing'.",
        "**NOT (p OR q) ≡ (NOT p) AND (NOT q)** — 'neither' means 'both are absent'.",
        "They generalise to any number of terms, and they explain a very common source of bugs: writing `if (!(a && b))` when you meant `if (!a && !b)`. The first is 'not both', the second is 'neither', and they differ whenever exactly one is true. Verify any such pair with a four-row truth table rather than by staring at it.",
        "In code the practical skill is **simplifying before you write**. A condition like `if (!(status !== \"paid\" || amount <= 0))` should become `if (status === \"paid\" && amount > 0)` by applying De Morgan once — same behaviour, readable at a glance. When a condition has three or more clauses, extract it into a named boolean: `const canPublish = isOwner && lesson.draft === false && course.active;`. The name does more work than the expression, and you can now test the condition in one place.",
      ],
    },
    {
      kind: "example",
      title: "Proving two conditions equivalent",
      paragraphs: [
        "A real case: a discount applies when the customer is *not* (a new customer buying less than three items). Does the code match the sentence?",
      ],
      code: `// The sentence:  NOT (isNew AND items < 3)
const discountA = !(isNew && items < 3);

// The rewrite:   (NOT isNew) OR (items >= 3)
const discountB = !isNew || items >= 3;`,
      trace: [
        "Row 1 — `isNew = true, items = 1`: A is `!(true && true)` = `!true` = **false**. B is `false || false` = **false**. Agree.",
        "Row 2 — `isNew = true, items = 5`: A is `!(true && false)` = `!false` = **true**. B is `false || true` = **true**. Agree.",
        "Row 3 — `isNew = false, items = 1`: A is `!(false && true)` = `!false` = **true**. B is `true || false` = **true**. Agree.",
        "Row 4 — `isNew = false, items = 5`: A is `!(false && false)` = **true**. B is `true || true` = **true**. Agree.",
        "All four rows agree, so the expressions are equivalent — which is exactly De Morgan's law, verified rather than trusted.",
        "Now the trap: `!isNew && items < 3` ('a new customer who is not new'? no — an *existing* customer buying few items) is a *different* expression, and it is false in rows 1, 2 and 4. Writing that instead of `discountB` is the bug.",
      ],
    },
    {
      kind: "prose",
      heading: "Three control structures, and nothing else needed",
      paragraphs: [
        "The **Bohm–Jacopini theorem** (1966) proved that any computable procedure can be expressed with three constructs: **sequence**, **selection** and **iteration**. That is a remarkable compression — every program you have ever read is a nesting of these three — and it is why pseudocode can be so short.",
        "**Sequence** is order: step A, then step B. It is the default and it is where most bugs of the 'I did it in the wrong order' kind live. **Selection** is a choice between paths: `if/else`, `switch`, and the ternary `? :`, plus the guard-clause pattern of returning early. **Iteration** is repetition: `while` (repeat while a condition holds — use when the count is unknown), `for` (repeat over a known range or collection — use when it is known), `do…while` (repeat at least once), and recursion (a function calling itself, which is iteration expressed differently).",
        "Every control structure has a **condition** that decides its behaviour, and every condition must eventually change or the program does not terminate. The infinite loop is almost always a loop whose variable is never modified inside it, or is modified in a way that never reaches the exit condition — `while (i < n)` with `i--` instead of `i++`.",
      ],
    },
    {
      kind: "code",
      caption: "The three structures, in pseudocode and in JavaScript",
      language: "text",
      code: `SEQUENCE                     SELECTION                    ITERATION
read amount                  if amount > balance:         while pending is not empty:
read balance                   reject                       take the first item
compute fee                  else if amount <= 0:             process it
compute total                  reject                         remove it
store transaction            else:
                               debit balance
                               credit recipient`,
    },
    {
      kind: "code",
      caption: "The same algorithm, two implementations",
      language: "javascript",
      code: `// Implementation 1: a loop.
function largestLoop(numbers) {
  if (numbers.length === 0) return undefined;      // precondition check
  let best = numbers[0];                           // invariant: best is the
  for (let i = 1; i < numbers.length; i++) {       // largest of numbers[0..i-1]
    if (numbers[i] > best) best = numbers[i];
  }
  return best;
}

// Implementation 2: a reduce — the same algorithm expressed functionally.
const largestReduce = (numbers) =>
  numbers.length === 0 ? undefined : numbers.reduce((a, b) => (b > a ? b : a));

// Both are O(n), both make one pass, both return undefined for an empty input.
// They are different code for one algorithm.`,
    },
    {
      kind: "prose",
      heading: "Loop invariants: how you know a loop is right",
      paragraphs: [
        "A **loop invariant** is a statement about the program's state that is true *before the loop starts*, remains true after *every iteration*, and — combined with the loop's exit condition — implies the *postcondition* when the loop finishes. It is the reason you can trust a loop you have not tested on every possible input.",
        "The three-part argument is always the same shape. **Initialisation:** the invariant holds before the first iteration. **Maintenance:** if it holds before an iteration, it still holds after. **Termination:** when the loop ends, the invariant plus the negated condition gives the answer you wanted. This is induction applied to code, and you do not need to write it out for every loop — but you do need to be able to, because it is how you find the off-by-one error before the tests do.",
      ],
    },
    {
      kind: "example",
      title: "Proving a summation loop",
      paragraphs: ["The loop computes the sum of an array. Its invariant is stated below and checked in three parts."],
      code: `function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}`,
      trace: [
        "**Invariant:** at the top of each iteration, `total` equals the sum of `arr[0]` through `arr[i-1]` (an empty range when `i = 0`, whose sum is 0).",
        "**Initialisation:** before the first iteration `i = 0` and `total = 0`. The sum of an empty range is 0, so the invariant holds.",
        "**Maintenance:** assume it holds at the top of iteration `i`, so `total = arr[0..i-1]`. The body adds `arr[i]`, giving `total = arr[0..i]`. Then `i` becomes `i+1`, so at the top of the next iteration `total = arr[0..(i+1)-1]`. The invariant holds again.",
        "**Termination:** the loop ends when `i = arr.length`. Substituting into the invariant, `total = arr[0..length-1]` — the sum of the whole array, which is the postcondition. ∎",
        "**Where the off-by-one would appear:** if the condition were `i <= arr.length`, the loop would read `arr[arr.length]`, which is `undefined`, and `total` would become `NaN`. The invariant still holds for the defined range; it is the *exit condition* that breaks the postcondition. That is why the invariant argument includes termination as a separate step.",
      ],
    },
    {
      kind: "prose",
      heading: "Functions: naming a process and stating its contract",
      paragraphs: [
        "A function packages a procedure behind a name and a **contract**: given these inputs, it produces this output and does not disturb anything else. The contract has three parts, and writing them down before the body is the single most productive habit in programming.",
        "The **precondition** is what must be true when the function is called: `numbers` is a non-empty array of finite numbers; `email` is a non-empty string. The **postcondition** is what is guaranteed on return: the returned value is the largest element and the input array is unchanged. **Edge cases** are the inputs at the boundary of the domain: the empty array, a single element, all elements equal, negative numbers, `null`, a string of length zero, an array containing `NaN`.",
        "Deciding what to do at an edge case is a design decision, not an implementation detail, and there are exactly four options: **return a sentinel** (`undefined`, `-1`, `null`) and make the caller check; **throw** and make the caller handle it; **clamp or coerce** (treat an empty array as sum 0); or **refuse at the type level** (a non-empty-array type, which TypeScript can express). Whichever you choose, choose it deliberately and document it — a function that silently returns `undefined` for an empty array and one that throws are different functions with the same name.",
        "Two further properties make functions trustworthy. A **pure** function's result depends only on its arguments and it changes nothing outside itself: pure functions are trivially testable, cacheable and safe to run in parallel. **Idempotence** means calling it twice has the same effect as calling it once — vital for anything a network might retry, which is why `PUT` and `DELETE` are idempotent HTTP methods and `POST` is not.",
      ],
    },
    {
      kind: "code",
      caption: "A contract written before the body",
      language: "typescript",
      code: `/**
 * The lowest price in a basket.
 *
 * Precondition:  prices is an array of finite, non-negative numbers.
 * Postcondition: returns the smallest element; the array is not modified.
 * Edge cases:    empty array → returns undefined (a sentinel the caller must
 *                check, because there is no sensible cheapest price).
 *                one element → that element.
 *                all equal   → that value.
 * Complexity:    O(n) time, O(1) space — one pass, no extra storage.
 */
function cheapest(prices: number[]): number | undefined {
  if (prices.length === 0) return undefined;

  let best = prices[0];
  for (let i = 1; i < prices.length; i += 1) {
    if (prices[i] < best) best = prices[i];
  }
  return best;
}

cheapest([]);                 // undefined — and TypeScript forces you to check
cheapest([4.5]);              // 4.5
cheapest([4.5, 2, 2, 9]);     // 2`,
    },
    {
      kind: "prose",
      heading: "Pseudocode: the language between thinking and typing",
      paragraphs: [
        "Pseudocode is a description of an algorithm in a form that is more precise than English and less committed than any programming language. It has no compiler, no standard and no syntax errors — and it is the right place to work out an algorithm, because you are not simultaneously fighting a language's punctuation.",
        "The conventions that make it readable: one step per line; indentation for blocks; `IF / ELSE / END IF`, `WHILE / END WHILE`, `FOR each x IN collection`; `←` or `=` for assignment; `RETURN` for output; and comments for anything that needs justifying. Name your variables as you would in real code, because the names carry half the meaning.",
        "The professional workflow is: write the pseudocode, **trace it by hand on a small example** — literally a table of variable values per iteration — and only then translate it into a language. Tracing is where nearly all algorithmic errors are caught, and it costs nothing. If you cannot trace your algorithm on three items, you do not yet have an algorithm.",
      ],
    },
    {
      kind: "example",
      title: "A full worked trace: linear search",
      paragraphs: [
        "The algorithm, its pseudocode, and a table showing every variable at every step for the input `prices = [12, 7, 19, 3]`, `target = 19`.",
      ],
      code: `FUNCTION indexOf(prices, target)
  i ← 0
  WHILE i < length(prices)
    IF prices[i] = target THEN
      RETURN i
    END IF
    i ← i + 1
  END WHILE
  RETURN -1                      // not found
END FUNCTION`,
      trace: [
        "Start: `i = 0`. Condition `0 < 4` is true, so enter the loop.",
        "Iteration 1: `prices[0] = 12`. Is `12 = 19`? No. `i ← 1`.",
        "Iteration 2: condition `1 < 4` true. `prices[1] = 7`. Is `7 = 19`? No. `i ← 2`.",
        "Iteration 3: condition `2 < 4` true. `prices[2] = 19`. Is `19 = 19`? **Yes — RETURN 2.** The loop stops; `i` never reaches 3.",
        "If the target were `5`, all four iterations would fail, the condition `4 < 4` would be false, and the function returns `-1`.",
        "**Invariant:** at the top of each iteration, `target` is not present in `prices[0..i-1]`. On termination either the target was found, or `i = length` and the invariant says the target is not in the whole array — which justifies returning `-1`.",
        "**Cost:** up to n comparisons. This is *linear search*, O(n), and it works on an unsorted list. If the list were sorted, [[binary search|/learn/data-structures-algorithms/sorting-and-searching]] would need only about log₂ n comparisons — four for a list of sixteen.",
      ],
    },
    {
      kind: "prose",
      heading: "Decomposition: turning a vague goal into steps",
      paragraphs: [
        "Real tasks arrive vague. 'Let the user transfer money' is not an algorithm; it is a wish. **Decomposition** is the act of breaking it into sub-problems small enough to state precisely, and it proceeds in two directions at once: top-down (what are the major steps?) and bottom-up (what do I already have that I can reuse?).",
        "A reliable method: write the goal as a single sentence with an input and an output — *'given a sender, a recipient and an amount, produce either a completed transfer or a specific refusal.'* Then list the questions that must be answered along the way, in order: Is the amount valid? Is the recipient real? Is the sender allowed? Is there enough balance? Only then write each as its own step or function. Each question is a condition, and each condition has a failure branch — which is why listing the questions produces the error handling for free, rather than as an afterthought.",
        "Two heuristics keep decomposition honest. **Every step should be testable**: if you cannot say what 'done' looks like for a step, it is still too big. **Name every step with a verb phrase**: 'validate the amount', not 'amount stuff'. Names that resist being written are usually a sign the step is doing two things.",
      ],
    },
    {
      kind: "warning",
      label: "The three classic algorithm bugs",
      text: "**Off-by-one:** loops that run one time too many or too few, usually from `<` versus `<=` or from starting at 1. Prevent it by stating the invariant and checking the exit condition against it. **Non-termination:** a `while` whose condition never becomes false, usually because the variable it tests is not modified in every path through the body. **Unstated edge case:** the empty input, the single element, the duplicate, the negative, the null. Prevent it by writing the edge cases into the contract *before* the body, and by making the empty case the first line of the function.",
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Algorithm", text: "A finite, definite, effective procedure with inputs and outputs." },
        { term: "Implementation", text: "One particular expression of an algorithm in a language. Many implementations, one algorithm." },
        { term: "Truth table", text: "Every combination of boolean inputs and the resulting output — the only sure way to check a condition." },
        { term: "Short-circuit evaluation", text: "`&&` and `||` stop as soon as the answer is known, so the second operand may never run." },
        { term: "De Morgan's laws", text: "`!(a && b) ≡ !a || !b` and `!(a || b) ≡ !a && !b`." },
        { term: "Sequence / selection / iteration", text: "The three control structures that suffice for any procedure." },
        { term: "Loop invariant", text: "A property true before the loop, preserved by every iteration, and sufficient with the exit condition to prove the result." },
        { term: "Precondition / postcondition", text: "What a function requires on entry and guarantees on exit." },
        { term: "Edge case", text: "An input at the boundary of the domain, where most bugs live." },
        { term: "Pure function", text: "Result depends only on arguments; no outside state is read or changed." },
        { term: "Idempotent", text: "Doing it twice has the same effect as doing it once — required for anything a network may retry." },
        { term: "Pseudocode", text: "A language-independent statement of an algorithm, precise enough to trace by hand." },
      ],
    },
  ],
  practice: {
    challenge:
      "Write **pseudocode that finds the smallest price in a shopping basket**, where the basket is a list of items each having a name and a price. Your pseudocode must: handle the empty basket explicitly; state its loop invariant in a comment; and return both the smallest price *and* the name of the item with it. Then **trace it by hand** on the basket `[bread 4.50, milk 7.20, eggs 3.80, tomatoes 12.00]` with a table showing every variable at every iteration. Only then translate it into JavaScript and confirm it produces the answer your trace predicted.",
    exercises: [
      {
        prompt: "Check these four procedures against the five properties of an algorithm and say which property each fails, if any: (a) 'repeat forever: print the time'; (b) 'sort the list nicely'; (c) 'output nothing, but log the input'; (d) 'compute π exactly'.",
        hint: "Finiteness, definiteness, output and effectiveness respectively. Note that (a) is a perfectly good *process* — just not an algorithm.",
      },
      {
        prompt: "Build the full truth table for `(p OR q) AND (NOT p OR r)` — eight rows — and state for which combinations it is true.",
        hint: "Three variables means 2³ = 8 rows. List them systematically: pqr from TTT down to FFF.",
      },
      {
        prompt: "Simplify using De Morgan: `!(user.active && user.verified)`, `!(a || b || c)`, and `if (!(x !== 0 && y !== 0))`. Then write each as a named boolean that reads like a sentence.",
        hint: "The third becomes `x === 0 || y === 0`, which as a name is `hasAZeroOperand`.",
      },
      {
        prompt: "Rewrite this as a guard-clause chain with no nesting, and explain why the rewrite is easier to test: `if (ok) { if (amount > 0) { if (user) { doIt() } else { log(\"no user\") } } else { log(\"bad amount\") } } else { log(\"not ok\") }`",
        hint: "Three early returns with a log each, then the happy path at the bottom, unindented. Each guard is one test case.",
      },
      {
        prompt: "State the loop invariant for a loop that counts how many items in an array exceed a threshold, and use it to prove the loop returns the right count.",
        hint: "'`count` is the number of elements in `arr[0..i-1]` that exceed the threshold.' Then do initialisation, maintenance and termination.",
      },
      {
        prompt: "Find the off-by-one bug in `for (let i = 1; i <= arr.length; i++) total += arr[i];` and describe three ways to fix it, saying which you prefer and why.",
        hint: "Start at 0 with `<`, or keep 1-based and use `arr[i - 1]`, or use `for…of`. The last removes index arithmetic entirely.",
      },
      {
        prompt: "Write the contract — precondition, postcondition, four edge cases, complexity — for a function `dedupe(list)` that returns a list with duplicates removed and the original order preserved. Then implement it.",
        hint: "Edge cases: empty, all duplicates, no duplicates, duplicates that are objects rather than primitives. A `Set` gives you O(n) but you must decide what 'equal' means.",
      },
      {
        prompt: "Trace this pseudocode for `n = 5`, showing every variable at every step, and say what mathematical function it computes: `result ← 1; i ← 1; WHILE i <= n: result ← result * i; i ← i + 1`.",
        hint: "It is the factorial. Check that `n = 0` gives 1, and explain why that is the right answer rather than a lucky one.",
      },
      {
        prompt: "Decompose 'let a student reset their password' into a numbered list of steps, each a verb phrase, each with its failure branch named. Then identify which step must be idempotent and why.",
        hint: "Nine or ten steps from 'request a reset' to 'invalidate old sessions'. The email-sending step is the one a retry must not duplicate.",
      },
    ],
    checkYourself: [
      "Name the five properties of an algorithm and give a procedure that violates one of them.",
      "What does short-circuit evaluation mean, and how is it both a feature and a bug source?",
      "State both De Morgan's laws and apply one to `!(a && b && c)`.",
      "Which three control structures are sufficient for any procedure, and when do you choose `while` over `for`?",
      "What are the three parts of a loop-invariant argument?",
      "What is the difference between a precondition and a postcondition?",
      "Name four options for handling an edge case and say what makes you choose between them.",
      "Why should you trace pseudocode by hand before translating it into a language?",
    ],
  },
  takeaways: [
    "An algorithm is finite, definite, effective, has inputs and produces outputs — and it exists independently of any language.",
    "Truth tables settle boolean questions in two minutes; De Morgan's laws make tangled conditions readable.",
    "Sequence, selection and iteration are the only three constructs you need; every program is a nesting of them.",
    "A loop invariant — initialised, maintained, and sufficient at termination — is how you know a loop is correct before you test it.",
    "Write the precondition, postcondition and edge cases before the body; the empty input is the first line of every function.",
    "Pseudocode plus a hand trace catches the errors that tests are expensive to find.",
    "Name every step with a verb phrase; if you cannot, the step is still too big.",
  ],
  further: [
    "Next: [[Data structures|/learn/computer-science-essentials/data-structures]] — the containers these algorithms operate on.",
    "[[Big-O without the fear|/learn/data-structures-algorithms/big-o-not-scary]] gives you the vocabulary for comparing two correct algorithms.",
    "Write pseudocode for one thing you built this week, then trace it. You will find at least one edge case you never handled.",
  ],
},
