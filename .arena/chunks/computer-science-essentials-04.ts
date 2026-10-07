{
  id: "data-structures",
  summary: [
    "A data structure is a way of organising data so that the operations you care about become cheap. That is the entire subject: **there is no best structure, only a structure that matches your operations.** The same thousand records can be an array you scan, a hash map you look up in one step, a sorted list you binary-search, a queue you consume in order — and each choice makes some operations instant and others expensive.",
    "This lesson covers the structures you will actually use: arrays and their cost profile, linked lists and the one thing they are genuinely better at, stacks and queues and the disciplines they impose, hash maps and how a key becomes a memory location in one step, sets, trees and why a balanced binary search tree gives logarithmic lookup, heaps and priority queues, and graphs. It ends with the decision procedure for choosing between them, and with the JavaScript and Python types that implement each.",
  ],
  objectives: [
    "Explain why an array gives O(1) indexed access and O(n) insertion at the front, in terms of contiguous memory.",
    "Compare arrays and linked lists on access, insertion, deletion and memory locality, and name the case where a list wins.",
    "Apply stack (LIFO) and queue (FIFO) discipline to a real problem and justify the choice.",
    "Explain how a hash map turns a key into an index, what a collision is, and why lookup averages O(1) but degrades to O(n).",
    "Use a set to convert a quadratic search into a linear one, and state the complexity of both versions.",
    "Describe a binary search tree, what 'balanced' means, and why balance gives O(log n) operations.",
    "Explain what a heap is and which problems a priority queue solves that a sorted array does not.",
    "Model a problem as a graph and name the traversal you need.",
    "Choose a structure for a stated set of operations and defend the choice with complexity figures.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "Structure determines cost",
      paragraphs: [
        "Every data structure is a bargain. It makes some operations fast by making others slow, and by using memory in a particular way. Choosing one is therefore never a matter of taste — it is a matter of listing the operations your program actually performs, how often, and picking the structure whose strengths match that list.",
        "The vocabulary for describing the bargain is **Big-O**, covered in depth in the Data Structures & Algorithms course. In summary: O(1) means constant time, unaffected by how much data there is; O(log n) means the work grows by one step each time the data doubles; O(n) means one unit of work per item; O(n log n) is a linear pass with a logarithmic factor, the cost of good sorting; O(n²) means a nested pass over everything, which becomes unusable quickly. A concrete sense of scale: at one million items, an O(n) algorithm does a million operations — a few milliseconds — while an O(n²) one does a trillion, which is minutes to hours.",
        "The classic demonstration is the duplicate-finding problem below. Both versions are correct. One is unusable on real data.",
      ],
    },
    {
      kind: "code",
      caption: "The same problem, two structures, two orders of magnitude",
      language: "javascript",
      code: `// O(n²): for each item, scan everything after it.
function hasDuplicateSlow(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i] === items[j]) return true;
    }
  }
  return false;
}

// O(n): for each item, ask a set whether we have seen it.
function hasDuplicateFast(items) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item)) return true;   // O(1) average, instead of an O(n) scan
    seen.add(item);
  }
  return false;
}

// At 100,000 items the first does ~5 × 10⁹ comparisons; the second does 10⁵.`,
    },
    {
      kind: "prose",
      heading: "Arrays: contiguous memory and indexed access",
      paragraphs: [
        "An **array** stores its elements one after another in a contiguous block of memory. Because every element has the same size, the address of element `i` is computable by arithmetic: `base + i × elementSize`. That is a single multiplication and an addition, done in hardware, regardless of whether `i` is 3 or 3,000,000. **Indexed access is O(1)**, and it is the reason arrays are the default structure everywhere.",
        "The same property makes insertion and deletion expensive in the middle or at the front: to insert at position `k`, every element from `k` onward must be shifted one place up, which is O(n) work. Appending at the *end* is different — there is nothing to shift — and dynamic arrays (JavaScript's `Array`, Python's `list`, Java's `ArrayList`) manage this by allocating more space than they use and doubling the capacity when full. An append is therefore **amortised O(1)**: occasionally it pays for a copy of the whole array, but averaged over many appends the cost is constant.",
        "Arrays also win on something Big-O cannot see: **locality**. Contiguous memory means the CPU cache loads 64 bytes at a time and you use all of it, and the hardware prefetcher detects the sequential pattern and loads ahead. Scanning an array of a million integers can be an order of magnitude faster than walking a linked list of a million nodes, even though both are O(n) — the list misses cache at nearly every step. This is why game engines, databases and numerical libraries prefer arrays even where a list is theoretically better.",
      ],
    },
    {
      kind: "table",
      caption: "Cost of array operations",
      head: ["Operation", "Cost", "Why"],
      rows: [
        ["Access by index `a[i]`", "**O(1)**", "Address computed arithmetically."],
        ["Search for a value (unsorted)", "O(n)", "Every element may need comparing — linear search."],
        ["Search (sorted)", "O(log n)", "Binary search halves the range each step."],
        ["Append at the end", "**O(1) amortised**", "No shifting; occasional capacity doubling."],
        ["Insert at the front or middle", "O(n)", "Every later element shifts up one place."],
        ["Delete at the front or middle", "O(n)", "Every later element shifts down one place."],
        ["Delete the last element", "O(1)", "Nothing shifts."],
      ],
    },
    {
      kind: "prose",
      heading: "Linked lists: the one thing they do better",
      paragraphs: [
        "A **linked list** stores each element in a **node** that holds the value and a reference (pointer) to the next node — and in a doubly-linked list, to the previous one as well. Nodes can sit anywhere in memory, so there is no contiguous block to reserve and no shifting to do.",
        "The consequence is a reversal of the array's profile. Insertion or deletion **at a position you already hold** is O(1): rewrite two pointers and you are done, with nothing to move. But access by index is O(n), because to reach node 500 you must follow 500 pointers — there is no arithmetic shortcut. And search is O(n) with worse constant factors than an array, because each hop is likely a cache miss.",
        "So when does a linked list actually win? When you insert and delete in the middle constantly, at positions you are already visiting, and you never need indexed access. Real examples: the free list inside a memory allocator, undo histories, an LRU cache's recency order (paired with a hash map — the classic composite structure), a playlist's play queue, and the adjacency representation of a graph in some libraries. In application code, honestly, they are rare: an array plus occasional O(n) insertion beats a list plus O(n) traversal almost always, because of locality. Know them, be able to reverse one in an interview, and reach for them only when the access pattern genuinely fits.",
      ],
    },
    {
      kind: "code",
      caption: "A singly-linked list, and reversing it",
      language: "javascript",
      code: `class Node {
  constructor(value, next = null) { this.value = value; this.next = next; }
}

// Insert at the front: O(1), no shifting.
function pushFront(head, value) {
  return new Node(value, head);
}

// Access by index: O(n) — follow the pointers.
function at(head, index) {
  let node = head;
  for (let i = 0; node && i < index; i++) node = node.next;
  return node ? node.value : undefined;
}

// Reverse in place: three pointers, one pass, O(n) time and O(1) space.
function reverse(head) {
  let prev = null;
  let current = head;
  while (current) {
    const next = current.next;   // remember where we were going
    current.next = prev;         // flip this node's pointer
    prev = current;              // advance prev
    current = next;              // advance current
  }
  return prev;                   // prev is the new head
}`,
    },
    {
      kind: "prose",
      heading: "Stacks and queues: discipline as a feature",
      paragraphs: [
        "A **stack** permits only two operations: `push` onto the top and `pop` off the top. The last thing in is the first thing out — **LIFO**. A **queue** permits `enqueue` at the back and `dequeue` from the front: first in, first out — **FIFO**. Both are O(1) for their operations, and both are usually *implemented* with an array or a linked list; what makes them a structure is the restriction.",
        "That restriction is the point. By refusing random access, a stack guarantees you always work on the most recent item, and a queue guarantees fairness — nobody is served before someone who arrived earlier. The discipline turns a container into a policy.",
        "**Stacks** appear everywhere once you look: the call stack of function invocations, where each call pushes a frame holding its local variables and return address; the browser's back button; undo in an editor; reversing a sequence; matching brackets and validating HTML nesting; parsing with a shift-reduce algorithm; depth-first search, which explores as far as it can and then backtracks; and the 'recently used' order of a cache.",
        "**Queues** are the shape of anything fair or asynchronous: a print spooler; a task queue between a web server and its workers; a message broker such as RabbitMQ, Kafka or SQS; breadth-first search, which explores everything one step away before anything two steps away; an event loop processing incoming events in arrival order; a call-centre's waiting list; and buffering between two things that run at different speeds — a keyboard buffer, a video stream, a log shipper.",
      ],
    },
    {
      kind: "code",
      caption: "Both, implemented and used",
      language: "javascript",
      code: `// A stack. An array is enough: push and pop both work at the end, so both are O(1).
const undo = [];
undo.push("typed 'Hello'");
undo.push("made it bold");
undo.pop();                       // "made it bold" — the most recent action

// Matching brackets: the canonical stack problem.
function isBalanced(text) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of text) {
    if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
    else if (pairs[ch]) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;        // anything left over was never closed
}
isBalanced("{[()]}");               // true
isBalanced("{[(])}");               // false

// A queue. Do NOT use array.shift() for a big queue — it is O(n), because
// every remaining element shifts down. Use a head index instead.
class Queue {
  #items = [];
  #head = 0;
  enqueue(item) { this.#items.push(item); }
  dequeue() {
    if (this.#head >= this.#items.length) return undefined;
    const item = this.#items[this.#head];
    this.#items[this.#head] = undefined;   // let the value be collected
    this.#head += 1;
    if (this.#head > 1024 && this.#head * 2 > this.#items.length) {
      this.#items = this.#items.slice(this.#head);
      this.#head = 0;
    }
    return item;
  }
  get size() { return this.#items.length - this.#head; }
}`,
    },
    {
      kind: "warning",
      label: "`shift()` and `unshift()` are O(n)",
      text: "In JavaScript an array used as a queue with `arr.shift()` for dequeue is quadratic overall: each `shift` moves every remaining element down one place. A queue of 100,000 jobs processed that way performs ~5 × 10⁹ element moves. Use a head index as above, a linked list, or a real queue library. The same applies to `unshift()` at the front. This is the single most common accidental performance bug involving a built-in type.",
    },
    {
      kind: "prose",
      heading: "Hash maps: lookup in one step",
      paragraphs: [
        "A **hash map** (dictionary, associative array, `Map`, `dict`, `HashMap`) stores **key → value** pairs and answers 'what is the value for this key?' in constant time on average. It is the most useful structure in programming after the array, and turning a nested loop into a hash lookup is the most common optimisation you will ever make.",
        "The mechanism has three parts. A **hash function** converts a key — a string, a number, an object identity — into an integer, spreading different keys widely and unpredictably. That integer is reduced **modulo the table size** to give an index into an array of **buckets**. The pair is stored in that bucket. To look up, hash the key the same way, go straight to that bucket, and compare — no searching involved.",
        "Two different keys can produce the same index: a **collision**. It is unavoidable, because the space of possible keys is larger than any table. Collisions are handled either by **chaining** — each bucket holds a small list of all pairs that landed there — or by **open addressing** — the pair goes into the next free slot found by a fixed probe sequence. Good hash functions and a load factor (items ÷ buckets) kept below about 0.75 by **resizing** — allocating a bigger array and rehashing everything into it — keep chains short, so a lookup stays O(1).",
        "The average is not a guarantee. If every key collides, a hash map degenerates into a linked list and lookup becomes O(n) — which is why a hostile client sending crafted keys once became a real denial-of-service attack against web servers, and why modern runtimes randomise their string hashing. Modern implementations also switch a long chain into a balanced tree, capping the worst case at O(log n).",
        "Two properties are easy to forget. **Insertion order is preserved** in JavaScript's `Map`, Python's `dict` (since 3.7) and Java's `LinkedHashMap` — but not in a plain JavaScript object used as a map, where integer-like keys come first in numeric order. And **keys are compared by identity for objects**, not by content: `map.set({a:1}, 'x')` cannot be found again with `map.get({a:1})`, because those are two different objects. Use strings, numbers, or a stable reference as keys.",
      ],
    },
    {
      kind: "example",
      title: "Counting word frequencies in one pass",
      paragraphs: ["The canonical hash-map use, traced. Input: `'the cat sat on the mat the cat'`."],
      code: `function wordCounts(text) {
  const counts = new Map();
  for (const word of text.toLowerCase().split(/\\W+/).filter(Boolean)) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}`,
      trace: [
        "`the` → not present, `get` returns `undefined`, `?? 0` gives 0, so set `the → 1`.",
        "`cat` → set `cat → 1`. `sat` → set `sat → 1`. `on` → set `on → 1`. `mat` → set `mat → 1`.",
        "`the` → **present**, `get` returns 1, so set `the → 2`. This is the moment the hash map earns its keep: no rescan.",
        "`cat` → present, set `cat → 2`.",
        "Final map: `the → 2, cat → 2, sat → 1, on → 1, mat → 1`, in insertion order.",
        "Cost: eight hash computations and eight O(1) operations = **O(n)** total, with O(k) space for k distinct words. The alternative — for each word, scan the whole list counting matches — is O(n²): 64 comparisons here, a billion at 30,000 words.",
      ],
    },
    {
      kind: "prose",
      heading: "Sets: membership without values",
      paragraphs: [
        "A **set** is a hash map with no values — it answers one question, 'have I seen this before?', in O(1) average time. It also gives you the operations of set theory directly: **union** (everything in either), **intersection** (everything in both), **difference** (in A but not B), and **subset** checks. In JavaScript, `new Set([1,2,2,3])` is also the idiomatic way to remove duplicates: `[...new Set(arr)]`.",
        "The pattern to recognise is *'for each item, does it satisfy a condition involving other items?'*. If the condition is membership in a group you are building as you go, a set converts an inner O(n) scan into an O(1) lookup. Two-sum, finding duplicates, checking whether a user has already voted, de-duplicating a feed, computing which permissions a role lacks — all the same shape.",
      ],
    },
    {
      kind: "prose",
      heading: "Trees: hierarchy with logarithmic search",
      paragraphs: [
        "A **tree** is nodes connected by parent–child edges, with one **root**, no cycles, and nodes with no children called **leaves**. Trees represent hierarchy: a file system, an organisation chart, an HTML document's DOM, a JSON value, a tournament bracket, a family tree. The **depth** of a node is how many edges down from the root it is; the **height** of the tree is the depth of its deepest leaf.",
        "A **binary tree** gives each node at most two children, left and right. A **binary search tree (BST)** adds an ordering rule: everything in the left subtree is less than the node, everything in the right is greater. That rule is what makes search efficient — at each node you eliminate half the remaining possibilities, exactly as binary search does, giving **O(log n)** for search, insertion and deletion in a *balanced* tree.",
        "The word 'balanced' is doing all the work. A BST built from already-sorted input degenerates into a linked list leaning to one side, with height n and O(n) operations. **Self-balancing** trees — AVL, red-black, and the B-trees and B+-trees that databases use — restore balance after every insertion by rotating subtrees, keeping the height at O(log n). This is why a database index is a B+-tree rather than a plain BST: it stays shallow, and it is designed so each node fills one disk page, minimising the expensive I/O.",
        "Trees are traversed in four standard ways. **In-order** (left, node, right) visits a BST in sorted order. **Pre-order** (node, left, right) is how you copy or serialise a tree. **Post-order** (left, right, node) is how you delete one, or evaluate an expression tree. **Level-order** visits breadth-first, one depth at a time, using a queue. Choosing the traversal is choosing what the algorithm means, and getting it wrong produces output that looks plausible and is not.",
      ],
    },
    {
      kind: "code",
      caption: "A binary search tree with all four traversals",
      language: "javascript",
      code: `class TreeNode {
  constructor(value) { this.value = value; this.left = null; this.right = null; }
}

function insert(root, value) {
  if (!root) return new TreeNode(value);
  if (value < root.value) root.left = insert(root.left, value);
  else if (value > root.value) root.right = insert(root.right, value);
  return root;                       // equal values are ignored: it is a set
}

function contains(root, value) {
  let node = root;
  while (node) {
    if (value === node.value) return true;
    node = value < node.value ? node.left : node.right;
  }
  return false;                      // O(height) — log n if balanced
}

const inOrder    = (n, out = []) => n && (inOrder(n.left, out), out.push(n.value), inOrder(n.right, out), out);
const preOrder   = (n, out = []) => n && (out.push(n.value), preOrder(n.left, out), preOrder(n.right, out), out);
const postOrder  = (n, out = []) => n && (postOrder(n.left, out), postOrder(n.right, out), out.push(n.value), out);

function levelOrder(root) {          // breadth-first: a queue, not recursion
  const out = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!node) continue;
    out.push(node.value);
    queue.push(node.left, node.right);
  }
  return out;
}

let root = null;
for (const v of [50, 30, 70, 20, 40, 60, 80]) root = insert(root, v);
inOrder(root);      // [20, 30, 40, 50, 60, 70, 80]  ← sorted, because in-order
preOrder(root);     // [50, 30, 20, 40, 70, 60, 80]  ← how you would serialise it
levelOrder(root);   // [50, 30, 70, 20, 40, 60, 80]  ← one depth at a time`,
    },
    {
      kind: "prose",
      heading: "Heaps and priority queues",
      paragraphs: [
        "A **heap** is a complete binary tree in which every parent is ≤ its children (a **min-heap**) or ≥ them (a **max-heap**). It is not fully sorted — only the parent/child relationship holds — and that partial order is exactly what makes it fast. The extreme value is always at the root, so **reading the minimum is O(1)**, and **inserting or removing the minimum is O(log n)** because the tree is complete and stays shallow, needing only to sift one value up or down.",
        "A **priority queue** is the abstract structure a heap implements: `insert(item, priority)` and `removeHighestPriority()`. It is the right answer whenever the next thing to process is not the next thing that arrived. Task schedulers, hospital triage, event-driven simulation (process the soonest event), Dijkstra's shortest-path algorithm, A* search, Huffman coding, and 'give me the top 10 of a million items' — which a heap does in O(n log 10) rather than the O(n log n) of sorting everything.",
        "Heaps are stored as plain arrays, which is elegant: for a node at index `i`, its children are at `2i + 1` and `2i + 2` and its parent at `⌊(i − 1) / 2⌋`. No pointers, no allocation, excellent locality. In JavaScript you would use a library or write fifty lines; in Python, `heapq` is built in.",
      ],
    },
    {
      kind: "prose",
      heading: "Graphs: when the relationship is the data",
      paragraphs: [
        "A **graph** is a set of **vertices** (nodes) connected by **edges**. It generalises the tree by allowing cycles and any number of connections. Graphs model relationships: people and friendships, pages and links, cities and roads, packages and dependencies, accounts and transactions, web servers and the requests between them.",
        "Edges may be **directed** (a follows b, which does not imply b follows a) or **undirected**, and may carry a **weight** (distance, cost, latency). A graph is **connected** if you can reach every vertex from every other, and **cyclic** if some path returns to its start — which matters enormously for dependency resolution, where a cycle means an impossible build.",
        "The two standard representations are an **adjacency matrix** — an n×n grid where cell `[i][j]` says whether the edge exists — which gives O(1) edge lookup but O(n²) space, so it suits dense graphs; and an **adjacency list** — for each vertex, a list of its neighbours — which uses O(vertices + edges) space and suits the sparse graphs that occur in practice.",
        "The two fundamental traversals are **breadth-first search (BFS)**, using a queue, which explores everything one edge away before anything two edges away — and therefore finds the **shortest path in an unweighted graph**; and **depth-first search (DFS)**, using a stack or recursion, which goes as deep as it can before backtracking — and therefore detects cycles, finds connected components, and produces a **topological ordering** of a dependency graph, which is what a build system or a course prerequisite checker actually computes.",
      ],
    },
    {
      kind: "table",
      caption: "Choosing a structure: the decision procedure",
      head: ["If your dominant operation is…", "Use", "Cost"],
      rows: [
        ["Ordered data with indexed access", "**Array**", "O(1) access, O(n) middle insert"],
        ["Lookup by a unique key", "**Hash map**", "O(1) average"],
        ["'Have I seen this before?'", "**Set**", "O(1) average"],
        ["Most recent item first (undo, back, DFS)", "**Stack**", "O(1) push/pop"],
        ["Arrival order, fairness (BFS, jobs, events)", "**Queue**", "O(1) enqueue/dequeue"],
        ["Next most *important*, not most recent", "**Priority queue / heap**", "O(log n) insert and extract"],
        ["Sorted data with frequent search and insert", "**Balanced BST / B-tree**", "O(log n) everything, in sorted order"],
        ["Sorted data that rarely changes", "**Sorted array**", "O(log n) search, O(n) insert — but the best cache behaviour"],
        ["Constant-time insert at both ends", "**Deque**", "O(1) both ends"],
        ["Many-to-many relationships", "**Graph**", "depends on representation"],
        ["Insert/delete in the middle at a known position, no indexing", "**Linked list**", "O(1) at the position, O(n) to find it"],
      ],
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Contiguous memory", text: "Elements stored one after another — the reason an array's indexed access is arithmetic rather than a search." },
        { term: "Amortised cost", text: "The average cost per operation over a long sequence, when occasional operations are expensive — array appends." },
        { term: "Node / pointer", text: "A value plus a reference to the next item; the building block of every non-array structure." },
        { term: "LIFO / FIFO", text: "Last in first out (stack) / first in first out (queue)." },
        { term: "Hash function", text: "Converts a key to an integer, spreading keys widely so lookups land directly in the right bucket." },
        { term: "Collision", text: "Two keys hashing to the same bucket; resolved by chaining or open addressing." },
        { term: "Load factor", text: "Items divided by buckets. Kept low by resizing, which is what preserves O(1) lookup." },
        { term: "Balanced tree", text: "A BST whose height stays O(log n) via rotations — AVL, red-black, B-tree." },
        { term: "Traversal", text: "Visiting every node in a defined order: in-, pre-, post-order for trees; BFS and DFS for graphs." },
        { term: "Adjacency list / matrix", text: "The two graph representations: neighbours per vertex, or an n×n edge grid." },
        { term: "Topological order", text: "An ordering of a directed acyclic graph where every dependency comes first — a build order." },
      ],
    },
    {
      kind: "prose",
      heading: "The types you already have",
      paragraphs: [
        "You rarely implement these from scratch, so knowing which built-in type corresponds to which structure is the practical skill.",
      ],
    },
    {
      kind: "table",
      caption: "Structures in JavaScript and Python",
      head: ["Structure", "JavaScript", "Python"],
      rows: [
        ["Array / dynamic array", "`Array`", "`list`"],
        ["Hash map", "`Map` (or a plain object for string keys)", "`dict`"],
        ["Set", "`Set`", "`set`, `frozenset`"],
        ["Stack", "`Array` with `push`/`pop`", "`list` with `append`/`pop`"],
        ["Queue", "Array with a head index, or a library", "`collections.deque`"],
        ["Deque", "Library, or two stacks", "`collections.deque`"],
        ["Priority queue", "Library (none built in)", "`heapq`"],
        ["Typed / fixed-size array", "`Int32Array`, `Float64Array`, …", "`array.array`, NumPy"],
        ["Ordered map", "`Map` preserves insertion order", "`dict` preserves insertion order since 3.7"],
      ],
    },
    {
      kind: "code",
      caption: "The three built-in operations worth memorising",
      language: "javascript",
      code: `// De-duplicate: O(n), order preserved.
const unique = [...new Set(items)];

// Group by a computed key: the shape of every "by category" view.
const byCourse = new Map();
for (const lesson of lessons) {
  const group = byCourse.get(lesson.courseId) ?? [];
  group.push(lesson);
  byCourse.set(lesson.courseId, group);
}

// Index a list by id, once, so later lookups are O(1) instead of O(n).
const byId = new Map(users.map((user) => [user.id, user]));
byId.get("u_123");                    // instant, instead of users.find(...) each time

// Two-sum in one pass: a set turns the inner scan into a membership test.
function twoSum(nums, target) {
  const seen = new Map();             // value → index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}`,
    },
  ],
  practice: {
    challenge:
      "For each of these three problems, **choose a data structure and explain why in terms of the operations performed and their cost**: (1) a browser's back-button history, where the user may also jump forward after going back; (2) a support-ticket queue where the oldest ticket is answered first, but a 'priority' flag must let a ticket jump to the front; (3) a phone book of 50,000 contacts that must support instant lookup by name and instant lookup by number. For each, state the structure, the cost of its two most frequent operations, and what would go wrong if you used a plain array instead.",
    exercises: [
      {
        prompt: "An array of 1,000,000 integers is stored contiguously, each 4 bytes. How much memory does it use? Now describe what happens to cache behaviour if you store the same million integers as nodes of a linked list with a 8-byte pointer each.",
        hint: "4 MB versus 12 MB, and the list's nodes are scattered so nearly every access is a cache miss. Both are O(n) to scan; one is far slower in practice.",
      },
      {
        prompt: "Implement `isBalanced` for bracket matching with a stack (as above), then explain what the stack contains at the moment the function returns `false` for `'{[(])}'`.",
        hint: "It holds `[` when `)` arrives — the mismatch is detected because the top of the stack is the wrong opener.",
      },
      {
        prompt: "Write a `Queue` class using two stacks, so that `enqueue` and `dequeue` are both amortised O(1). Explain the amortisation argument.",
        hint: "Push onto the 'in' stack; pop from the 'out' stack, refilling it by popping everything from 'in' only when 'out' is empty. Each element moves at most twice.",
      },
      {
        prompt: "Convert this O(n²) function to O(n) using a hash map, and state the space cost you added: 'for each order, find the customer it belongs to by scanning the customers array'.",
        hint: "Build `customersById` once in O(n), then each order lookup is O(1). You traded O(n) extra space for O(n) time instead of O(n·m).",
      },
      {
        prompt: "Insert 40, 20, 60, 10, 30 into an empty BST, draw the result, and give its in-order, pre-order and level-order traversals. Then insert the same values in sorted order and explain what goes wrong.",
        hint: "Sorted insertion produces a right-leaning chain of height 5, so search becomes O(n). That is exactly what a self-balancing tree prevents.",
      },
      {
        prompt: "You need the 10 largest values from a stream of 100 million numbers that does not fit in memory. Which structure do you use, what are its operations' costs, and why is sorting not an option?",
        hint: "A min-heap of size 10: O(n log 10) time, O(10) space. Sorting needs all n in memory and O(n log n) work.",
      },
      {
        prompt: "Model your course prerequisites as a graph and write a topological sort using DFS that detects a cycle. Explain what a cycle means in this domain.",
        hint: "A cycle means two courses each require the other, so no valid study order exists. Report it rather than returning a nonsense ordering.",
      },
      {
        prompt: "For each built-in operation below, state its cost and one situation where the cost surprises you: `arr.push`, `arr.shift`, `arr.indexOf`, `map.get`, `set.has`, `arr.sort`.",
        hint: "`shift` is O(n), `indexOf` is O(n), `sort` is O(n log n) but allocates and compares via a callback — the constant factor is large.",
      },
      {
        prompt: "An LRU (least-recently-used) cache needs O(1) `get`, O(1) `put` and O(1) eviction of the least recently used item. Which two structures combine to give this, and what does each contribute?",
        hint: "A hash map for O(1) lookup by key, plus a doubly-linked list (or an insertion-ordered `Map`) for O(1) move-to-front and evict-from-back.",
      },
    ],
    checkYourself: [
      "Why is `a[i]` O(1) on an array but O(n) on a linked list?",
      "What does 'amortised O(1)' mean for an array append, and what triggers the expensive case?",
      "Name three problems that are naturally a stack and three that are naturally a queue.",
      "How does a hash map turn a key into a location, and what happens on a collision?",
      "Why is hash-map lookup O(1) *on average* rather than always?",
      "What does 'balanced' mean for a BST, and what happens to the complexity without it?",
      "Which traversal of a BST gives sorted output, and which does a build system need?",
      "When does BFS find a shortest path, and when does it not?",
      "Why is `arr.shift()` in a loop a performance bug?",
    ],
  },
  takeaways: [
    "There is no best structure — only a structure whose cheap operations match the operations you perform most.",
    "Arrays give O(1) indexed access and superb cache locality; their cost is O(n) insertion in the middle.",
    "Stacks impose recency and queues impose fairness; the restriction is the feature.",
    "A hash map turns 'search the list' into 'ask the map' — the most common O(n²) → O(n) optimisation there is.",
    "Sets answer one question, instantly: have I seen this before?",
    "A balanced tree gives O(log n) search *and* sorted order; an unbalanced one quietly gives you O(n).",
    "A heap answers 'what is next most important?' in O(log n), without sorting everything.",
    "Graphs model relationships, and the traversal you choose — BFS or DFS — is the algorithm.",
  ],
  further: [
    "Next: [[Memory, programs & processes|/learn/computer-science-essentials/memory-processes]] — where these structures actually live at runtime.",
    "The Data Structures & Algorithms course goes much deeper: [[Maps and sets|/learn/data-structures-algorithms/maps-and-sets]] and [[Trees and graphs|/learn/data-structures-algorithms/trees-graphs-traversal]].",
    "Rewrite one nested loop you have written recently using a map or a set, and measure the difference.",
  ],
},
