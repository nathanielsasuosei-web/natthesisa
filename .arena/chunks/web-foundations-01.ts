{
    id: "how-the-web-works",
    summary: [
      "Every page you have ever looked at arrived the same way: your browser asked for it, and some machine far away answered. That exchange — a *request* and a *response*, carried over the internet by a stack of protocols — is the whole of the web. Everything else you will learn in this course, from CSS to React, is decoration on top of that one conversation.",
      "This lesson follows a single request from the moment you press Enter to the moment pixels appear. You will meet the URL, DNS, TCP, TLS, HTTP, and the browser's rendering engine, and you will learn the vocabulary that lets you read a Network panel without guessing.",
    ],
    objectives: [
      "Name the seven stages a request passes through, from URL to painted pixels, and say what each one is responsible for.",
      "Break a URL into its parts — scheme, host, port, path, query and fragment — and explain what the browser does with each.",
      "Explain the difference between a static file server and a dynamic server, and give an example of each.",
      "Read the Network panel of your browser's developer tools and identify the document request, its status code and its size.",
      "Describe what DNS, TCP and TLS each contribute, and why HTTPS is not optional on a real site.",
    ],
    blocks: [
      {
        kind: "prose",
        heading: "The web is a conversation, not a place",
        paragraphs: [
          "It helps to stop thinking of a website as a *place* you visit and start thinking of it as a *document you request*. Somewhere in the world there is an ordinary computer — a **server** — that stays switched on, connected to the network, running a program whose only job is to wait for questions and answer them. Your browser is the **client**: the program that asks.",
          "The conversation has a strict shape. The client sends one request; the server sends back exactly one response; the exchange is finished. The server does not remember you between requests unless something is deliberately stored to make it remember — a cookie, a session, a database row. That single fact explains a great deal of what makes web programming unusual: you are writing programs that are interrupted after every sentence and must reconstruct their context each time.",
          "The protocol that governs the conversation is **HTTP**, the Hypertext Transfer Protocol. 'Hypertext' means text that contains links to other text; 'transfer' means the protocol is only concerned with moving bytes from one side to the other, not with what those bytes mean. HTTP is a text-based, stateless, request–response protocol, and those three adjectives are worth memorising because each of them will show up again as a design decision you have to make.",
        ],
      },
      {
        kind: "definition",
        term: "Client–server model",
        text: "An architecture in which one party (the **client**) initiates requests and another party (the **server**) waits for them and replies. Communication always starts from the client; a server never speaks first. On the web the client is usually a browser, the server is a program listening on a port, and the language they use is HTTP.",
      },
      {
        kind: "prose",
        heading: "Anatomy of a URL",
        paragraphs: [
          "The conversation begins with an address. A **URL** — Uniform Resource Locator — is a string that says three things at once: how to talk to the machine, which machine to talk to, and which resource on that machine you want. Learners often treat URLs as opaque strings; they are not, and being able to take one apart is the first practical skill of web debugging.",
          "Consider `https://www.codemasterghana.online:443/courses/web-foundations?level=beginner#module-2`. The **scheme** (`https`) names the protocol and therefore the rules — `https` means HTTP carried inside an encrypted TLS tunnel, and it defaults to port 443, while `http` means plain, unencrypted traffic on port 87. The **host** (`www.codemasterghana.online`) is a domain name that must be translated into an IP address before anything can be sent. The **port** (`443`) is the door on that machine; a single server computer can run many listening programs, and the port selects one. The **path** (`/courses/web-foundations`) identifies the resource, and on a modern server it is a route matched by code rather than a real file on disk. The **query** (`?level=beginner`) is a list of `key=value` parameters sent to the server, and the **fragment** (`#module-2`) is the one part that is *never* transmitted — it is an instruction to the browser to scroll to that element once the page has loaded.",
          "Two consequences follow immediately. First, because the fragment is not sent, you cannot use it to ask a server for a particular part of a document. Second, because the query *is* sent, changing a query parameter causes a new request — which is exactly why filters and search pages put their state in the URL, so a search can be shared as a link and reloaded without being lost.",
        ],
      },
      {
        kind: "table",
        caption: "The parts of a URL, and who acts on each one",
        head: ["Part", "Example", "Who uses it", "What happens"],
        rows: [
          ["Scheme", "`https`", "Browser", "Chooses the protocol and the default port; decides whether TLS is used."],
          ["Host", "`www.example.com`", "DNS resolver, then browser", "Looked up to obtain an IP address to connect to."],
          ["Port", "`443`", "Operating system", "Selects which listening program on that machine receives the connection."],
          ["Path", "`/courses/web-foundations`", "Server", "Matched against routes; decides which file or code produces the response."],
          ["Query", "`?level=beginner`", "Server (and client code)", "Parameters the server reads to customise the response."],
          ["Fragment", "`#module-2`", "Browser only", "Never sent; used to scroll to an element after rendering."],
        ],
      },
      {
        kind: "prose",
        heading: "From name to number: DNS",
        paragraphs: [
          "Machines address each other by **IP address** — a number such as `104.21.6.144` in IPv4, or a much longer hexadecimal string in IPv6. Humans cannot remember numbers, so the web uses the **Domain Name System**, a globally distributed database that maps names to numbers. A DNS lookup is a real network operation with a real cost, which is why browsers and operating systems cache the results.",
          "The lookup is hierarchical and reads right to left. Your browser asks the operating system, which asks a **resolver** — usually run by your internet service provider, or a public one such as `1.1.1.1` or `8.8.8.8`. If the resolver does not have the answer cached, it asks a **root** name server, which points it at the server responsible for `.online`; that server points it at the server responsible for `codemasterghana.online`; and that **authoritative** name server finally answers with the IP address of `www`. Each level caches, so a popular name is usually answered in a few milliseconds without leaving the resolver.",
          "Records come in several types. An **A** record maps a name to an IPv4 address and an **AAAA** record to an IPv6 address. A **CNAME** record says 'this name is an alias for that name'. An **MX** record says where email for the domain should be delivered. A **TXT** record holds arbitrary text and is used to prove ownership of a domain and to authorise email senders. When you deploy a site and point a domain at it, what you are actually doing is editing an A record or a CNAME in your registrar's DNS panel — and it can take minutes to hours for the change to reach every resolver on earth, which is why 'it works on my machine but the domain still shows the old site' is such a common first-week experience.",
        ],
      },
      {
        kind: "note",
        label: "Why 'it is DNS' is a joke engineers make",
        text: "Because DNS is the one step of the chain that is distributed, cached at several layers you do not control, and eventually consistent. When a site mysteriously fails for some people and works for others, or a deploy appears not to have happened, the cause is very often a cached DNS record. Learn to check it directly: `dig example.com +short` or `nslookup example.com` prints the answer your machine is currently getting, and comparing it with a public resolver tells you whether the problem is the record or your cache.",
      },
      {
        kind: "prose",
        heading: "Establishing a connection: TCP and TLS",
        paragraphs: [
          "Once the browser has an IP address, it must open a reliable channel. The internet's underlying protocol, **IP**, only promises to *try* to deliver packets; they may arrive out of order, duplicated, or not at all. **TCP**, the Transmission Control Protocol, sits on top of IP and turns that unreliable postcard service into a reliable byte stream. It does this with a **three-way handshake**: the client sends `SYN` ('I would like to talk, and here is my starting sequence number'), the server replies `SYN-ACK` ('acknowledged, and here is mine'), and the client sends `ACK`. From then on every byte is numbered and acknowledged, missing bytes are retransmitted, and both sides can be sure they received everything in order.",
          "The handshake costs a round trip before any useful data moves. That is not a trivial amount of time — from Accra to a server in Frankfurt a round trip is roughly 150 milliseconds, and to the US west coast closer to 250. Web performance work is very often about reducing the number of round trips: reusing connections, placing servers nearer to users, and opening connections speculatively.",
          "For `https`, a further handshake happens inside the TCP connection. **TLS** (Transport Layer Security, the successor to SSL) negotiates a cipher suite, verifies the server's **certificate** against a chain of trusted certificate authorities, and derives a shared secret key using public-key cryptography. From that point every byte is encrypted. This buys three things: **confidentiality** (nobody on the network can read the traffic), **integrity** (nobody can alter it undetected) and **authentication** (you are talking to the machine that owns the certificate for that domain, not an impostor). Without TLS, an open Wi-Fi network can read your passwords, an intermediary can inject adverts into pages, and a user has no way to know whether the site they reached is the site they asked for.",
        ],
      },
      {
        kind: "prose",
        heading: "The request and the response",
        paragraphs: [
          "Now HTTP itself. A request is a short text document with a defined structure: a **request line**, a set of **headers**, and an optional **body**. The request line names a **method** and a **path** and the HTTP version. The headers are `Name: value` lines describing the request — what the client accepts, what kind of compression it understands, which site the user came from, and any cookies. The body carries data for methods that send some, such as `POST`.",
          "Here is what your browser actually sends when you open a course page. It looks like nothing, and it is the entire instruction set:",
        ],
      },
      {
        kind: "code",
        caption: "An HTTP request, as plain text",
        language: "http",
        code: `GET /courses/web-foundations?level=beginner HTTP/1.1
Host: www.codemasterghana.online
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-GB,en;q=0.9
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Cookie: session=8f2c1d4a.9b7e...`,
      },
      {
        kind: "prose",
        paragraphs: [
          "The server replies with a **status line**, its own **headers**, and a **body**. The status code is a three-digit number in a family: `1xx` is informational, `2xx` means success, `3xx` means 'go somewhere else', `4xx` means *the client made a mistake*, and `5xx` means *the server failed*. That split between 4xx and 5xx is the single most useful diagnostic distinction in web development, because it tells you immediately whose bug you are looking at.",
        ],
      },
      {
        kind: "table",
        caption: "The status codes you will actually meet",
        head: ["Code", "Name", "What it means", "What you usually do"],
        rows: [
          ["`200`", "OK", "The request succeeded and the body is the resource.", "Nothing — this is the normal case."],
          ["`201`", "Created", "A new resource was created, usually after a `POST`.", "Nothing; an API may send a `Location` header."],
          ["`204`", "No Content", "Success, and deliberately no body.", "Nothing; common for delete operations."],
          ["`301`", "Moved Permanently", "The resource lives elsewhere now, forever.", "Update bookmarks and links; browsers cache this aggressively."],
          ["`302` / `307`", "Found / Temporary Redirect", "Go elsewhere this time only.", "Nothing; used for sign-in redirects."],
          ["`304`", "Not Modified", "Your cached copy is still current.", "Nothing — the browser reuses its cache and saves the download."],
          ["`400`", "Bad Request", "The server cannot parse or accept what you sent.", "Check the request body and parameters."],
          ["`401`", "Unauthorized", "You are not signed in (the name is a historical accident).", "Send credentials, or redirect to a login page."],
          ["`403`", "Forbidden", "You are signed in, but not allowed.", "Check permissions; do not retry."],
          ["`404`", "Not Found", "No resource at that path.", "Check the URL, or handle the missing state in the UI."],
          ["`429`", "Too Many Requests", "Rate limited.", "Back off and retry later, honouring `Retry-After`."],
          ["`500`", "Internal Server Error", "The server threw an exception it did not handle.", "Read the server logs — the client cannot diagnose this."],
          ["`502` / `503`", "Bad Gateway / Unavailable", "A proxy could not reach the app, or it is overloaded.", "Usually transient; check whether the process is running."],
        ],
      },
      {
        kind: "example",
        title: "Reading a real response",
        paragraphs: [
          "Suppose the request above succeeds. The first bytes that come back look like this. Read the headers before the body — they tell you how the body should be interpreted, whether it may be cached, and whether it is compressed.",
        ],
        code: `HTTP/1.1 200 OK
Date: Tue, 07 Oct 2026 09:14:02 GMT
Content-Type: text/html; charset=utf-8
Content-Encoding: br
Cache-Control: public, max-age=60
Strict-Transport-Security: max-age=31536000
Content-Length: 18432

<!doctype html>
<html lang="en">…`,
        trace: [
          "`200 OK` — the request succeeded and the body is the page.",
          "`Content-Type: text/html; charset=utf-8` — the body is HTML encoded as UTF-8. This header, not the file extension, is what tells the browser how to parse the bytes.",
          "`Content-Encoding: br` — the body is Brotli-compressed; the browser decompresses it transparently before parsing.",
          "`Cache-Control: public, max-age=60` — anyone may cache this response and reuse it for sixty seconds without asking again.",
          "`Strict-Transport-Security` — the browser must refuse to load this host over plain HTTP from now on.",
          "`Content-Length: 18432` — 18 KB of compressed HTML. The browser knows the response is complete when it has read that many bytes.",
        ],
      },
      {
        kind: "prose",
        heading: "What the browser does with the answer",
        paragraphs: [
          "Receiving HTML is not rendering a page. The browser's engine — Blink in Chrome and Edge, WebKit in Safari, Gecko in Firefox — now performs a pipeline that is worth understanding because every performance problem in front-end work lives somewhere inside it.",
          "First, **parsing**: the bytes are turned into a tree of **DOM** nodes, the Document Object Model, which is the browser's live in-memory representation of the document. Second, when a `<link>` to a stylesheet arrives, the browser fetches it and builds the **CSSOM**, the tree of style rules. Third comes **style resolution**: for every element the engine works out which rules apply and computes a final set of styles — this is where the cascade, which the CSS lesson covers in detail, is evaluated. Fourth, **layout** (also called *reflow*): the engine calculates the exact geometry of every box, in pixels, for this viewport size. Fifth, **paint**: the boxes are rasterised into images. Sixth, **compositing**: those images are assembled into layers and handed to the GPU, which draws them to the screen.",
          "Two details of this pipeline shape front-end practice more than any others. **CSS blocks rendering**: the browser will not paint until it has the stylesheets, because painting without them would show an unstyled flash and then a jarring restyle. **JavaScript blocks parsing**: when the parser meets a classic `<script>` tag it stops, downloads the file, and executes it, because the script might call `document.write` and change the document it is parsing. That is why scripts go at the end of the body or carry `defer` — a word you will meet again in the JavaScript course.",
        ],
      },
      {
        kind: "warning",
        label: "Misconception",
        text: "People often say 'the website is stored in the browser'. It is not. The browser holds a **cache** — a temporary, evictable copy of some responses, which the server is allowed to control through headers. The site lives on the server. Clearing the cache, opening a private window, or a first visit from a new device all produce a completely fresh set of requests, which is why a bug a developer cannot reproduce 'because it works for me' is very often a cache difference.",
      },
      {
        kind: "prose",
        heading: "Static and dynamic: two kinds of answer",
        paragraphs: [
          "What the server does to produce the body splits the whole industry into two categories. A **static** server reads a file from disk and sends it. `index.html` on disk arrives as `index.html` over the wire, identical for every visitor. Static hosting is cheap, fast, trivially cacheable on a CDN, and hard to break — which is why marketing pages, portfolios and documentation are static.",
          "A **dynamic** server runs a program. The path is matched to a handler function, which may read a database, check who is asking, and assemble HTML on the spot. Two visitors to the same URL can receive different documents, because the response depends on state: the signed-in student sees their progress bar, the anonymous visitor sees a buy button. This platform is dynamic — a lesson page cannot be a file on disk, because whether you are allowed to read it depends on your account.",
          "Most real systems are both. A common pattern is to generate pages dynamically but cache the result for a short time, so the first visitor pays for the computation and the next thousand get a static copy. `Cache-Control: public, max-age=60` in the example above is exactly that: the page was assembled by code, and then frozen for a minute.",
        ],
      },
      {
        kind: "terms",
        heading: "Vocabulary for the rest of the course",
        items: [
          { term: "Client", text: "The side that starts the conversation. In practice, the browser and its JavaScript." },
          { term: "Server", text: "A program listening on a port, answering requests. Also, loosely, the machine it runs on." },
          { term: "Request / Response", text: "The two halves of one HTTP exchange. Never more than one response per request." },
          { term: "Protocol", text: "An agreed format for messages. HTTP is the web's; DNS, TCP and TLS are underneath it." },
          { term: "Stateless", text: "The server retains nothing between requests by default. Cookies and sessions exist to add memory on top." },
          { term: "DOM", text: "The browser's live tree representation of an HTML document, which JavaScript can read and change." },
          { term: "CDN", text: "Content Delivery Network: many edge servers around the world holding cached copies, so the answer comes from near the user." },
          { term: "Latency", text: "The time a round trip takes. Distinct from bandwidth, which is how much can travel per second." },
        ],
      },
      {
        kind: "prose",
        heading: "Seeing it for yourself",
        paragraphs: [
          "None of this is theory you have to trust. Every browser ships the instruments. Open the developer tools — `F12`, or right-click and choose *Inspect* — and select the **Network** panel. Reload the page and you will see each request as a row: its name, its status, its type, its size and its time. Click the first row, the one whose type is `document`, and you are looking at the request and response this lesson has been describing, including the exact headers.",
          "Tick **Disable cache** while the panel is open and reload again. The row count will jump, because the browser now asks for everything it previously reused. That difference is your cache doing its job.",
          "The **Timing** tab of a single request breaks the journey into its real parts — DNS lookup, initial connection, TLS negotiation, waiting for the server ('time to first byte'), and downloading content. When a page feels slow, this panel tells you which of those five it is slow *at*, and each one has a different cure.",
        ],
      },
      {
        kind: "code",
        caption: "Following a request from the terminal, without a browser",
        language: "bash",
        code: `# 1. What IP address does the name resolve to?
dig +short example.com

# 2. What does the server send back? -I prints headers only.
curl -I https://example.com

# 3. The whole exchange, verbosely: DNS, TCP, TLS, request, response.
curl -v https://example.com 2>&1 | head -40

# 4. How long did each stage take?
curl -o /dev/null -s -w "dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\\n" https://example.com`,
      },
    ],
    practice: {
      challenge:
        "Open the Network panel on any website you use daily and identify its **document** request. Write down its URL, its status code, its `Content-Type`, the size of the response, and the time to first byte. Then tick *Disable cache*, reload, and record how many extra requests appeared and what the total page weight became.",
      exercises: [
        {
          prompt: "Take apart these URLs and label every component: `https://mail.google.com/mail/u/0/#inbox`, `https://api.github.com/repos/nathanielsasuosei-web/natthesisa?per_page=10`, `http://localhost:3000/learn/web-foundations/how-the-web-works`.",
          hint: "For the first, ask which part never leaves your machine. For the third, ask what the host `localhost` resolves to and why no TLS is involved.",
        },
        {
          prompt: "Use `curl -I` on three sites and compare their `Cache-Control` and `Strict-Transport-Security` headers. Which one is willing to be cached by a CDN, and for how long? Which one has not enabled HSTS?",
          hint: "`max-age=0` or `no-store` means 'never reuse this'. A missing HSTS header means the browser may still try plain HTTP first.",
        },
        {
          prompt: "Find one `3xx` redirect in the wild. Follow it with `curl -I` and explain, in two sentences, why the site issues it instead of serving the content at both addresses.",
          hint: "Common causes: `http` → `https`, no-`www` → `www`, and an old path that moved.",
        },
        {
          prompt: "In the Network panel, filter by `Img`. How many image requests does the page make, what is their combined weight, and what fraction of the total page weight is that? Write one sentence on how you would reduce it.",
          hint: "Fractions matter more than absolutes: a 3 MB page over a mobile connection in Accra is a different experience from the same page on office fibre.",
        },
        {
          prompt: "Explain aloud, without notes, why a browser cannot simply 'open a website' in one step. Name the five things that must happen first, in order.",
          hint: "DNS → TCP → TLS → request → response. Then parsing begins, which is a separate pipeline.",
        },
      ],
      checkYourself: [
        "Which part of a URL is never sent to the server, and what is it used for instead?",
        "What is the difference between a `401` and a `403`, and which one should make you look at server logs?",
        "Why does a browser block rendering while it downloads a stylesheet, but not while it downloads an image?",
        "What does it mean that HTTP is stateless, and name two mechanisms that work around it.",
        "Why does a request from Accra to a server in Virginia take longer than one to a server in London, even if both servers are equally fast?",
        "What is the difference between a static and a dynamic response, and why can this platform's lesson pages not be static files?",
      ],
    },
    takeaways: [
      "The web is a stateless request–response conversation: the client always speaks first, and the server answers once.",
      "A URL is a set of instructions, not an opaque string — scheme, host, port, path, query and fragment each have a different owner.",
      "DNS turns names into numbers, TCP makes delivery reliable, TLS makes it private and authenticated, and HTTP gives the messages their shape.",
      "Round trips cost real time. Most web performance work is about making fewer of them.",
      "A `4xx` is the client's fault and a `5xx` is the server's; that split tells you where to look first.",
      "The browser turns bytes into pixels through parsing, style, layout, paint and composition — and CSS and JavaScript can stall that pipeline.",
    ],
    further: [
      "Next: [[Your first HTML document|/learn/web-foundations/html-document]] — the format of the body the server sends back.",
      "The HTTP course covers the same protocol from the server side: [[HTTP and REST|/learn/backend-node-apis/http-rest]].",
      "Practice with `curl` and your Network panel until you can describe any page's journey without guessing.",
    ],
  },
