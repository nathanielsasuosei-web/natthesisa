import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Ethical Hacking — the attacker's mindset, applied lawfully.
 *
 * The course teaches how systems are actually broken: reconnaissance, scanning,
 * exploitation of common weaknesses, and the reporting that makes the work
 * useful. Authorization, scope and the law come first and are treated as
 * engineering preconditions rather than a disclaimer, because a tester who
 * cannot prove permission is not a professional.
 */

export const ETHICAL_HACKING_MODULES: CourseModule[] = [
  module(
    "mindset-and-recon",
    "01 · Mindset and reconnaissance",
    "Authorization, attacker thinking, and finding out what is exposed before touching anything.",
    [
      lesson({
        id: "ethical-hacking-and-authorization",
        title: "Ethical hacking, authorization and the law",
        summary:
          "The difference between a penetration tester and a criminal is a document. This lesson covers what ethical hacking is and is not, the authorization and scope that must exist in writing before any test, the phases of a penetration test, the professional codes and reporting standards, and the legal position in Ghana under the Cybersecurity Act and the Data Protection Act — because a tester who cannot state their authority is a liability to their client.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Every technique in this course is dual-use. The same scan that finds an exposed database for a client, pointed at a system you do not own, is a criminal act in most jurisdictions — including Ghana, where the Cybersecurity Act 2020 (Act 1038) provides for offences relating to unauthorised access to computer systems. Professional practice is therefore not a set of politeness rules; it is the structure that makes the work legal, insurable and useful.",
          },
          {
            heading: "Definition: ethical hacking, penetration testing, scope, authorization",
            kind: "definition",
            body:
              "**Ethical hacking** is testing systems with the explicit permission of the party that owns them, within agreed limits, for the purpose of improving their security, with findings reported confidentially to that party.\n\n**Penetration testing** is a time-boxed, goal-directed engagement: a defined target, a defined period, a defined type (black box with no information, grey box with partial, white box with full documentation and credentials), and a report. **Red teaming** is broader — it tests detection and response as well as prevention — and is usually longer, stealthier and organised around objectives.\n\n**A vulnerability assessment** finds and lists weaknesses without exploiting them; a **penetration test** proves impact by exploiting them. Clients often buy the first and believe they bought the second.\n\n**Authorization** is a signed document — a statement of work, rules of engagement or engagement letter — that names the legal entity commissioning the test, the systems in scope, the time window, the testing intensity allowed, the emergency contacts, and what must never be touched. **Scope** is the list itself. If a system is not in scope, it is out of bounds even if it sits on the same network and looks interesting; accidental scope creep is the most common way a professional test becomes an incident.\n\n**Rules of engagement** typically cover: permitted techniques (may we run password spraying? social engineering? denial-of-service simulations? exploit code?), prohibited actions (no data exfiltration beyond proof, no modification of production data, no testing of third-party services), notification requirements (who is told when a critical issue is found), data handling (encrypted notes, deletion at the end), and the legal jurisdiction.\n\nProfessional frameworks worth knowing: **PTES** (Penetration Testing Execution Standard) for phases, **OWASP WSTG** for web application testing, **MITRE ATT&CK** for adversary techniques and detection mapping, and **CVSS** for scoring severity. Reporting standards matter because the deliverable of a test is a report, not a shell.",
          },
          {
            heading: "The phases of an engagement",
            kind: "paragraph",
            body:
              "1. **Pre-engagement.** Scope, authorization, contacts, rules of engagement, fees, timeline. Nothing technical happens before this is signed.\n2. **Reconnaissance.** Passive first: public records, DNS, certificate transparency logs, search engines, social media, job adverts (which name technologies), leaked credential databases. This phase never touches the target's systems and is entirely lawful.\n3. **Scanning and enumeration.** Actively probing in-scope hosts: which ports are open, which services and versions answer, which directories and endpoints exist, which accounts might be valid.\n4. **Vulnerability analysis.** Matching what was found against known weaknesses and reasoning about how they combine.\n5. **Exploitation.** Proving impact — carefully, minimally, with a screenshot and the smallest action that demonstrates the risk. Usually one foothold rather than a rampage.\n6. **Post-exploitation.** Within scope: privilege escalation, lateral movement, what data is reachable. Report what you found; do not exfiltrate it beyond proof.\n7. **Reporting.** Findings, evidence, business impact, reproduction steps and remediation, ordered by risk. Then a debrief, and often a re-test after fixes.\n\nThe professional habits threaded through all seven: take notes as you go (a test without notes produces a report you cannot write), timestamp everything, keep an evidence folder, and communicate immediately when you find something critical, because the client's incident response may need to start before your report exists.",
          },
          {
            heading: "Worked example: scope decisions that avoid becoming a headline",
            kind: "example",
            body:
              "An engagement letter covers `app.client.example` and its staging environment. During reconnaissance you find a shared hosting provider, and the staging domain resolves to the same IP range as `admin.client.example`, a system not mentioned in the scope. What do you do?\n\nThe professional answer has four steps and no improvisation. First, **stop**: do not scan, do not click, do not \"just check one thing\". Second, **document**: note the observation, the time and the evidence that led to it (a DNS record, publicly available). Third, **ask**: message the engagement contact in writing, describing what you found and proposing to add the system to scope with a written amendment. Fourth, **continue only with in-scope work** while you wait.\n\nIf the client agrees, the amendment records the new host, the technique limits and the time window. If they do not, the finding still goes in the report as an observation about infrastructure that appears related but was not tested — which is itself useful information for them.\n\nThe counterfactual is instructive: a tester who scans the extra host \"because it is obviously theirs\" has, in the eyes of the law, accessed a computer system without authorisation. The engagement being friendly does not change that, and neither does the fact that nothing was damaged.",
            code:
              "Engagement: ACME Ghana — web application penetration test\nProgramme: 2026-09-01 → 2026-09-12, 09:00–18:00 GMT\n\nIN SCOPE (authorised in writing, amendment #2)\n  app.client.example          (production web app)\n  staging.client.example      (staging, non-destructive only)\n  api.client.example          (read-only endpoints)\n  196.201.x.0/28              (the client's own address range)\n\nOUT OF SCOPE\n  admin.client.example        ← found during recon; ask before touching\n  the client's ISP and its shared infrastructure\n  any third-party SaaS the client uses (their terms forbid testing)\n  social engineering of staff      unless amendment #3 is signed\n  denial-of-service or load testing of any kind\n\nPROHIBITED regardless of scope\n  • modifying or deleting production data\n  • exfiltrating personal data beyond a redacted screenshot\n  • persistence in production beyond the engagement window\n  • testing between 18:00 and 09:00 without written approval\n\nESCALATION: security lead (name, phone) — call within 30 minutes for any\ncritical finding, before writing anything else.",
            language: "text",
            codeLabel: "Scope written down, so that a decision is never improvised",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"The client asked me to look at their site, so I have permission.\"** Verbal requests do not survive contact with a legal department. Get it in writing, naming the systems, signed by somebody with authority to authorise.\n- **Scanning the whole hosting provider.** Shared hosting means your scan reaches other companies' systems, and their logs will show you. Stay inside the named ranges.\n- **Testing the third-party SaaS.** Their terms of service prohibit it, and the client cannot grant permission they do not hold.\n- **\"No damage was done.\"** Unauthorised access is the offence in most legal regimes, not damage. The absence of harm affects sentencing, not guilt.\n- **Skipping the report to keep hacking.** Exploitation is perhaps 20% of a professional test; the report, evidence and remediation advice are the deliverable the client is paying for.\n- **Keeping client data \"for the portfolio\".** Client data belongs to the client: encrypted during the engagement, deleted afterwards, and never reused in a demonstration without written consent.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Document", "Who signs", "What it fixes", "What happens without it"],
              ["Engagement letter / SOW", "Someone with authority to authorise", "The legal basis, the fee, the parties", "The work is unauthorised access"],
              ["Rules of engagement", "Client security lead and tester", "Techniques, hours, exclusions, escalation", "Technique choices become improvised and risky"],
              ["Amendment", "Both parties", "Adds or removes systems after scope changes", "Recon findings cannot be tested; work stalls or oversteps"],
              ["Data handling agreement", "Client and tester", "Storage, encryption, retention, deletion", "Personal data handled off-contract"],
              ["Report and re-test plan", "Tester delivers", "Findings, risk, remediation, verification", "The client cannot fix what was found"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Ethical hacking is defined by authorization, scope and reporting, not by technique. The phases — pre-engagement, passive reconnaissance, scanning, analysis, cautious exploitation, post-exploitation, report — are a working method, and the documents that start it are what separate the professional from the intruder. Learn the law where you work, keep everything inside the written scope, escalate early, and treat the report as the product.",
          },
        ],
        keyPoints: [
          "Define ethical hacking, penetration testing, red teaming and vulnerability assessment.",
          "Explain what an engagement letter and rules of engagement must contain, and why a verbal request is not authorization.",
          "Describe the phases of a penetration test and the professional habit associated with each.",
          "Apply a documented procedure when reconnaissance reveals a system outside scope.",
          "State the legal exposure of unauthorised testing in Ghana's Cybersecurity Act framework.",
        ],
        exercises: [
          "Research the Cybersecurity Act 2020 (Act 1038) and the Data Protection Act 2012 (Act 843) in Ghana. Write down, in plain language, what each means for somebody testing a client's website.",
          "Draft a one-page rules-of-engagement document for a fictional engagement, including scope, prohibited techniques, testing hours and escalation.",
          "List five passive reconnaissance sources that require no contact with the target, and say what each reveals.",
          "Take a training platform's deliberately vulnerable machine (or your own lab VM) and write the authorization statement you would need first.",
          "Write the escalating message you would send to a client who has just told you verbally to \"also check the admin panel\".",
        ],
        challenge:
          "Prepare a complete engagement pack for a fictional client: a scope table, rules of engagement, a prohibition list, escalation contacts, a data-handling note, and a report template. Then have somebody play the client and try to get you to test an out-of-scope system before signing an amendment — and write down, in one paragraph, exactly what you said.",
      }),

      lesson({
        id: "reconnaissance-and-surface-mapping",
        title: "Reconnaissance and mapping the attack surface",
        summary:
          "Before a single packet is sent, most of a system's weaknesses are already visible in public data: DNS records, certificate logs, cloud pointers, exposed metadata and job adverts that name every technology in the stack. This lesson covers passive reconnaissance, mapping an attack surface from the outside, service and directory enumeration on an authorised target, and how to organise findings so that the exploitation phase — and the report — has something to stand on.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "An attacker's advantage is patience: they can spend a week learning about a target with tools that are entirely legal, because reading public information is not an intrusion. A defender's counter-advantage is that the same information tells them what they have left exposed. Reconnaissance is therefore the phase that most repays practice, and the one that most beginners skip.",
          },
          {
            heading: "Definition: recon types, attack surface, footprinting",
            kind: "definition",
            body:
              "**Passive reconnaissance** never contacts the target's systems: search engines, public registries, certificate transparency logs, DNS history databases, social media, job listings, code repositories and breach datasets. It is lawful, quiet and usually reveals the most.\n\n**Active reconnaissance** sends traffic to the target: DNS queries, port scans, service banners, web content discovery. It is lawful only inside an authorised scope, and it is noisy — the target's defenders can see it, which is sometimes exactly what a red-team engagement wants and often exactly what a stealth engagement does not.\n\n**The attack surface** is everything an adversary can reach: domain names, IP ranges, open ports and services, web endpoints and parameters, APIs, cloud storage, employee accounts and credentials, third-party integrations, physical access, and the people themselves (social engineering). Modern surface area is dominated by the external and accidental: a subdomain nobody remembers, a storage bucket left open, a CI/CD token in a public repository.\n\n**Footprinting** is the organised collection of that surface into a document: hosts, services, versions, ownership and notes. The output is a working inventory that later phases consume and the report cites.",
          },
          {
            heading: "The passive phase, in practice",
            kind: "paragraph",
            body:
              "**Domain and DNS.** Who owns the domain (a WHOIS lookup), which name servers serve it, which records exist (A, AAAA, MX, TXT, CNAME, NS, SOA). TXT records frequently disclose SPF/DKIM configuration and third-party verification strings that name the SaaS providers in use.\n\n**Certificate transparency.** Every public TLS certificate is logged. A search of those logs lists every hostname the organisation has ever issued a certificate for — including staging, dev, internal-only and long-forgotten names. This single public source is behind a large share of \"how did they find that subdomain?\"\n\n**Subdomain enumeration.** Combine sources: certificate logs, DNS brute force against a wordlist (only with authorization, since it queries the target's name servers), and search-engine results.\n\n**Cloud and storage.** Guessable bucket names (`client-backups`, `client-uploads-prod`) and cloud IP ranges identifiable from the reverse DNS. An open storage bucket is one of the most common real-world exposures.\n\n**Code and documents.** Public repositories for committed secrets (a key in a deleted commit is still in the history), published PDFs with author metadata and internal paths, spreadsheets with hidden sheets.\n\n**People and process.** Job adverts enumerate the stack; LinkedIn names the administrators and their tools; support pages describe the password-reset process, which is a procedure an attacker will try to abuse.\n\nEverything here is reading. That is the point.",
          },
          {
            heading: "Worked example: building a surface map for an authorised target",
            kind: "example",
            body:
              "The authorised scope is one domain and its subdomains. The passive phase produces a list before any scan is run; the active phase (permitted, in hours, at low intensity) adds the technical detail.\n\nThe output is deliberately boring and structured: a host table, a service list with versions, a web surface list, and an observation section for things that are interesting but unconfirmed. Note how much of the report's future value comes from *writing it down as you go* — the difference between a productive second day and a lost one is the notes from the first.\n\nTwo discipline points. First, tag every item with how it was found (passive source, scan, manual browsing), because the report needs to distinguish \"publicly visible\" from \"we probed it\". Second, resist exploiting anything yet: the reconnaissance phase ends when you can describe the surface, and exploitation begins with a hypothesis worth proving, not with curiosity.",
            code:
              "$ # Passive: certificate transparency reveals hostnames, no packets to the target\n$ curl -s 'https://crt.sh/?q=%25.client.example&output=json' \\\n    | jq -r '.[].name_value' | sort -u\napp.client.example\nadmin.client.example\nstaging.client.example\nvpn-old.client.example        ← still resolves; nobody remembers it\ndb-reports.client.example\n\n$ dig +short MX client.example\ngateway.mailfilter.example.   ← third-party mail filtering in use\n$ dig +short TXT client.example\n\"v=spf1 include:_spf.google.com include:sendgrid.net -all\"\n\"MS=ms12345678\"               ← Microsoft 365 tenancy verification\n\n$ # Active (in scope, authorised, low intensity)\n$ nmap -sV -Pn -p- --min-rate 500 app.client.example\nPORT     STATE SERVICE  VERSION\n22/tcp   open  ssh      OpenSSH 8.2p1            ← old, check for known issues\n80/tcp   open  http     nginx 1.18 (redirect to 443)\n443/tcp  open  ssl/http nginx 1.18\n3000/tcp open  http     Node.js (Express)        ← staging app exposed publicly??\n8080/tcp open  http     Apache Tomcat 9.0.31      ← version with known CVEs\n\n# Surface map (excerpt)\n# host                    port  service      source      note\n# app.client.example      443   nginx        scan        main application\n# app.client.example      8080  Tomcat       scan        in scope, old version\n# staging.client.example  22    ssh          passive+scan  staging host, exposed\n# vpn-old.client.example  —     —            passive     resolves; ask before probing\n# reports.client.example  443   web          passive     found in cert logs only",
            language: "text",
            codeLabel: "Public data first, then a permitted scan, then notes",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Skipping reconnaissance.** Beginners scan first and wonder why they find nothing interesting. The public record usually names the software, the providers and the forgotten hosts.\n- **Scanning before authorization.** Active reconnaissance is an intrusion legally, whatever the intent. Passive reading is not.\n- **Full-speed scans against production.** A `-T4` scan of every port can disrupt fragile services and will certainly be logged as an attack. Agree intensity in the rules of engagement and use it.\n- **Trusting tool output without verification.** A service banner can be spoofed, a version string can lie, and a \"closed\" port can be filtered. Confirm what matters.\n- **Losing the notes.** Reconnaissance produces a lot of raw output. Rotate a structured notes file (host, port, finding, source, next step) as you go, or you will redo work.\n- **Confusing \"exposed\" with \"exploitable\".** An exposed admin panel is a finding; whether it is exploitable is the next phase's question, answered with evidence rather than confidence.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Source", "Type", "What it reveals", "Authorization needed?"],
              ["Certificate transparency logs", "Passive", "Every public hostname ever certified", "No — public record"],
              ["WHOIS and DNS records", "Passive", "Registrant, name servers, mail and verification records", "No"],
              ["Search engines and archives", "Passive", "Indexed pages, forgotten files, old versions of a site", "No"],
              ["Public code repositories", "Passive", "Stack, dependencies, occasionally secrets in history", "No"],
              ["Job adverts and social media", "Passive", "Technologies, vendors, named administrators", "No"],
              ["Port and service scan", "Active", "Open ports, service versions, operating system fingerprints", "Yes — explicit and in scope"],
              ["Web content discovery", "Active", "Directories, backup files, unused endpoints", "Yes — explicit and in scope"],
              ["Subdomain brute force", "Active", "Hosts not in any public log", "Yes — it queries the target's servers"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Reconnaissance is the phase where patience pays: certificate logs, DNS, public repositories and human sources reveal most of an organisation's surface before any packet is sent. Active enumeration inside a written scope then fills in ports, versions and endpoints, and the whole exercise is turned into a structured inventory of hosts, services, sources and open questions. The map produced here is what makes exploitation targeted and the report evidence-based.",
          },
        ],
        keyPoints: [
          "Distinguish passive from active reconnaissance and state which of your actions contact the target.",
          "Enumerate an organisation's hostnames from certificate transparency and DNS records.",
          "Explain what TXT, MX and CNAME records disclose about an organisation's providers.",
          "Run a permitted port and service scan at an agreed intensity and record versions and sources.",
          "Maintain a structured surface inventory as you work, tagging every finding with how it was found.",
        ],
        exercises: [
          "Using only passive sources, build a host list for a domain you own or are authorised to assess. Note the source of every hostname you find.",
          "Inspect your own domain's TXT and MX records and list every third-party service they disclose. For each, ask whether you still use it.",
          "Run a service-version scan on a lab machine you own and record every version you would look up for known vulnerabilities.",
          "Search a public code-hosting service for a repository belonging to you and check its history for accidentally committed secrets. Rotate anything you find, even if the commit was deleted.",
          "Take a real job advert for a technical role and list everything it discloses about that organisation's stack and vendors.",
        ],
        challenge:
          "Produce a complete attack-surface map for a system you own or have written permission to assess: hosts and IP ranges with how each was discovered, services and versions, web endpoints and parameters, cloud storage references, and a ranked list of the five items most likely to be exploitable. Do not exploit anything. Then write the two recommendations you would put first in a report, based only on the map.",
      }),
    ]
  ),

  module(
    "exploitation-and-reporting",
    "02 · Exploitation and reporting",
    "Systematic testing of the weaknesses that actually get exploited — then the report that makes it count.",
    [
      lesson({
        id: "web-and-system-exploitation",
        title: "Exploitation: how weaknesses become access",
        summary:
          "This lesson covers the vulnerability classes that dominate real-world breaches — injection, broken authentication and session handling, broken access control, misconfiguration and outdated components — how each is tested methodically with the OWASP Web Security Testing Guide as the checklist, how exploitation is documented as evidence rather than loot, and where a test stops at proof of impact instead of going further.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Exploitation is the phase learners wait for, and the one that most often produces a false sense of skill. The techniques are not the difficulty; the discipline is. A professional test proves impact with the smallest possible action, captures evidence, then stops — and spends the rest of the time on the systemic reasons the weakness existed, because the same code will be written again next sprint.",
          },
          {
            heading: "Definition: vulnerability, exploit, payload, impact",
            kind: "definition",
            body:
              "**A vulnerability** is a weakness that permits a violation of security policy — code that trusts input, an access check that is missing, a component with a known flaw. **An exploit** is the technique that turns the weakness into an effect. **A payload** is what runs or executes as a result. **Impact** is the business consequence: data disclosed, money moved, service stopped, reputation damaged.\n\nThe classes that matter most, in the order they appear in real incidents:\n\n1. **Broken access control.** An object reference that is not checked (change `?invoice=1024` to `1025` and read somebody else's invoice), a function that checks the role on the client only, an admin route protected by a hidden menu. In modern application testing this is the most common serious finding and the least clever to exploit.\n2. **Injection.** Untrusted input interpreted as code or query: SQL injection, command injection, template injection, LDAP. Parameterised queries and input validation eliminate the classic forms; when a screener allows a raw string into a query, the database belongs to the attacker.\n3. **Broken authentication and session management.** Weak password rules, no rate limiting on login, session identifiers that do not change on login, tokens that never expire, password reset flows that leak whether an account exists.\n4. **Security misconfiguration.** Debug mode in production, directory listings, default credentials, verbose errors revealing paths and versions, permissive CORS, exposed management interfaces, cloud storage without authentication.\n5. **Vulnerable and outdated components.** A framework or library with a published CVE and a public exploit; the same Tomcat version from the reconnaissance phase.\n6. **Cryptographic failures.** Unencrypted sensitive traffic, weak hashes for passwords, secrets in code and configuration.\n7. **Cross-site scripting.** Input reflected into a page and executed in another user's browser — session theft and actions performed on behalf of a logged-in user if the session cookie is not `HttpOnly`.\n8. **Server-side request forgery.** A server that fetches a URL you supply, used to reach internal systems that are not exposed to the internet.",
          },
          {
            heading: "Method, not improvisation",
            kind: "paragraph",
            body:
              "Testing is a checklist executed deliberately, with notes. For an authorised web application:\n\n- **Enumerate everything.** Every page, parameter, form, API endpoint, header, cookie, storage location. Most serious findings come from endpoints nobody documented.\n- **Test each input for interpretation.** Does this string become a query? A filename? HTML? A URL the server fetches? Change one thing at a time and observe.\n- **Test every permission boundary.** For each object: does user A see user B's data? For each function: can a low-privilege account reach it? Authorisation tests are boring, repetitive and conclusive.\n- **Test the state machine.** Can you skip a step — apply a discount after payment, complete a purchase with a zero total, resubmit a coupon twice? Business-logic flaws are invisible to scanners because they are not errors.\n- **Test the components.** Versions, known CVEs, default files, exposed management ports.\n- **Record with evidence.** The exact request, the exact response, a screenshot, the timestamp and the account used. A finding without a reproduction is an opinion, and clients dispute opinions.",
          },
          {
            heading: "Worked example: proof of impact, and knowing where to stop",
            kind: "example",
            body:
              "An authenticated user of an invoice application changes an identifier in a request. The response contains another customer's invoice, including their name, address and amount owed. That is broken access control, and it is a serious finding.\n\nThe professional sequence from here is short and disciplined. First, demonstrate with **one** identifier beyond the user's own account, using an account the client provisioned for testing — not by walking through a hundred invoices. Second, capture the request and response with the sensitive fields redacted in the report but visible in the evidence attached to the ticket. Third, verify the impact claim by answering the questions a compliance officer will ask: does this disclose personal data (yes — which makes it a reportable data-protection matter in many jurisdictions); can it be used to modify, not just read (test once, carefully, if scope allows); does it affect every customer or a subset? Fourth, **stop**, and escalate immediately rather than continuing to map the extent, because the extent is now the client's incident, not your exploration.\n\nThen the part that makes the finding useful: the systemic cause. The endpoint builds its query from a client-supplied identifier with no ownership check, and the same pattern appears in four other files. The remediation is therefore not \"patch line 42\" but \"enforce ownership in the data-access layer\", plus a test that fails if a new endpoint is added without it. Report severity using CVSS for consistency, but pair it with plain language about consequence — a rating of 7.5 means little to a director; \"any logged-in user can read any customer's invoice\" means everything.",
            code:
              "Finding 4.1 — Broken access control (IDOR) on GET /api/invoices/{id}\nSeverity: High (CVSS 3.1: 7.5 — AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N)\n\nReproduction (account: test-billing@client.example, invoice 1024 is theirs)\n\n  GET /api/invoices/1024 HTTP/2\n  Host: app.client.example\n  Cookie: session=…        ← account 4471\n  → 200 OK, own invoice\n\n  GET /api/invoices/1025 HTTP/2\n  Host: app.client.example\n  Cookie: session=…        ← same account, next identifier\n  → 200 OK, invoice belonging to account 4512\n         { \"name\": \"…\", \"address\": \"…\", \"amount\": \"GH₵4 320\" }\n\nImpact\n  Any authenticated user can read any other customer's invoice, including\n  name, address and amount. Personal data is disclosed ⇒ assess reporting\n  duties under the Data Protection Act. Enumerate scope only with the client.\n\nEvidence\n  requests.txt (2 requests, timestamps), responses-redacted.json, screenshot.png\n  Escalated to the security lead at 14:20, 6 minutes after confirmation.\n\nRoot cause and remediation\n  • The endpoint trusts the client-supplied id with no ownership check.\n  • The same pattern appears in 4 other handlers (search: invoiceById).\n  • Fix in the data access layer: every invoice query takes the session's\n    account id as a mandatory constraint.\n  • Add a regression test asserting 404 for a foreign id. Re-test after release.\n\nWhere testing stopped: no further identifiers were requested, no data was\nstored or shared, and the extent of exposure was left to the client's IR team.",
            language: "text",
            codeLabel: "The smallest action that proves the point",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Running scanner output as a report.** A scanner finds misconfigurations and versions; the interesting vulnerabilities — access control and business logic — require a human who understands the application's purpose.\n- **Automated exploitation of everything found.** Mass exploitation risks data loss, downtime and legal exposure, and proves nothing extra. One demonstration is enough.\n- **Exfiltrating real data.** \"To prove impact\" is not a reason to copy customer records offsite. Redacted screenshots of the minimum necessary fields are the professional standard.\n- **Ignoring the boring finding.** The IDOR that takes thirty seconds to test, and the missing rate limit on a login, cause more real breaches than exotic exploit chains.\n- **Skipping the systemic cause.** Fixing one endpoint while the pattern repeats in five files means the same finding returns next quarter.\n- **Not testing the fix.** A remediation verified by the developer is a claim; verified by the tester with the original reproduction is evidence.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Class", "How to test it", "What the fix looks like", "Severity range"],
              ["Broken access control", "Change identifiers and roles; use a second account", "Server-side ownership and permission checks on every object and action", "High–Critical"],
              ["Injection", "Send characters that change meaning: quotes, semicolons, `${}`", "Parameterised queries, allow-lists, no shell interpolation", "Critical"],
              ["Broken authentication", "Rate-limit login, session fixation, reset flow, token lifetime", "Rate limiting, hashed passwords, rotation, generic reset responses", "High–Critical"],
              ["Misconfiguration", "Debug pages, default files, verbose errors, exposed services", "Hardened baseline, disabled defaults, no stack traces in production", "Medium–High"],
              ["Outdated components", "Version inventory against CVE databases", "Patching policy with an owner and a deadline", "Medium–Critical"],
              ["Cross-site scripting", "Reflect input into a page and observe execution", "Output encoding, CSP, `HttpOnly` cookies", "Medium–High"],
              ["Business logic", "Skip steps, reuse coupons, alter prices and quantities", "Server-side validation of every step and value", "High"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Exploitation proves impact, and professionalism means proving it with the smallest action, capturing evidence, escalating immediately and stopping. The classes that dominate real incidents are access control, injection, authentication, configuration and outdated components — all discoverable through method rather than cleverness — and the most valuable output of the phase is not a shell but a root cause, a business consequence stated in plain language, and a remediation with a test.",
          },
        ],
        keyPoints: [
          "Define vulnerability, exploit, payload and impact, and keep them distinct in a report.",
          "Explain why broken access control is the most common serious finding in real applications.",
          "Test an input, an object and a workflow systematically, recording every step as evidence.",
          "Escalate a critical finding immediately and stop expanding the exploitation.",
          "Prove a fix with the original reproduction rather than a developer's assurance.",
        ],
        exercises: [
          "On a training platform's deliberately vulnerable application, find and document one broken access control issue with a full reproduction.",
          "Test a lab login form for rate limiting and for session-identifier changes on login. Document what is missing.",
          "Inventory the dependencies of a project you own against a vulnerability database and list every component with a known CVE.",
          "Reproduce one reflected cross-site scripting issue in a lab, then write the fix and demonstrate it prevents execution.",
          "Take a business workflow you know (a discount code, a booking, a top-up) and list three ways a user could abuse it by skipping or repeating a step.",
        ],
        challenge:
          "Complete one full assessment of a lab application or a system you own: a testing checklist from the OWASP WSTG, at least three findings of different classes with full reproductions, one business-logic finding, and for each a systemic root cause and a remediation with a proposed regression test. Redact all personal data, and stop at the smallest proof of impact for every issue.",
      }),

      lesson({
        id: "reporting-defences-and-career",
        title: "Reporting, defence and the security career",
        summary:
          "A penetration test that produces a folder of screenshots has failed. This lesson covers the report that clients actually act on — findings, risk ratings in business terms, reproduction steps, remediation, prioritisation — plus the defensive habits that follow from everything you have learned (patching, least privilege, logging, backups), responsible disclosure of a bug you find outside an engagement, and the routes into security work from where you are now.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Clients do not buy vulnerabilities; they buy a reduced chance of being breached, and the report is the only instrument that delivers it. This lesson closes the course by turning findings into change, and by being explicit about the professional and legal obligations that continue after the engagement ends — including what to do when you find a serious bug in a system nobody asked you to test.",
          },
          {
            heading: "Definition: the report, the risk rating, the disclosure",
            kind: "definition",
            body:
              "**A penetration test report** has a consistent structure: an executive summary that a director can act on without technical knowledge; a scope and methodology section; a findings register ranked by risk; detailed findings with reproduction and evidence; a remediation plan with priorities; and appendices with the tools and raw data.\n\n**Risk rating** combines likelihood and impact, and it must speak both languages. A CVSS vector provides consistency and comparability; a business sentence provides meaning — \"an attacker with a stolen login can read every customer's invoice, which is a personal-data disclosure that must be assessed against the Data Protection Act\". Ratings that ignore the business context (a critical on an unused staging server, a low on the payment gateway) are how reports lose credibility.\n\n**Remediation advice** must be specific and feasible: which file, which pattern, what the fixed code looks like, and how to verify. \"Improve input validation\" is not advice. \"Every query in `data-access/invoices.js` must take the account id from the session and pass it as a query parameter; here is the pattern; re-run finding 4.1's reproduction to verify\" is.\n\n**Responsible disclosure** is the procedure for finding a vulnerability without authorization: stop testing immediately, report it to the organisation through a security contact or an established disclosure programme, keep the details confidential, allow a reasonable remediation window (90 days is the common norm), and never demand payment for silence — that is extortion, not research. Many organisations have a published security.txt with contact details, precisely for this.",
          },
          {
            heading: "From findings to defence",
            kind: "paragraph",
            body:
              "Every offensive technique you learned implies a defensive control, and knowing the attack is what makes the control credible rather than ceremonial.\n\n- **Injection and access control** → parameterised queries, server-side authorisation on every object, and a regression test that fails when a new endpoint arrives without an ownership check.\n- **Outdated components** → an inventory of every dependency and version, a patching owner, and a deadline. Most organisations know their versions; far fewer have an owner.\n- **Credential attacks** → multi-factor authentication on anything administrative, rate limiting, password managers, and monitoring for impossible-travel or brute-force patterns.\n- **Misconfiguration** → hardened baselines as code, no default credentials, no debug in production, and a quarterly check that the baseline still matches reality.\n- **Lateral movement** → network segmentation so that a compromised laptop cannot reach the database, with least privilege on every service account.\n- **Undetected intrusion** → logs that are centralised, retained and *reviewed*, with alerts on authentication anomalies and on new outbound destinations. An attacker's dwell time is measured in the gap between the breach and its detection.\n- **Data loss** → backups that are tested by restoring them, offline or immutable copies, and a rehearsed recovery time. Ransomware is a backup question as much as a security question.\n\nThe control that quietly matters most is the boring one: asset inventory. You cannot patch, monitor, segment or authorise what you do not know exists — and reconnaissance proved how easy it is for an organisation to forget one of its own systems.",
          },
          {
            heading: "Worked example: the executive summary that changed a budget",
            kind: "example",
            body:
              "A two-week engagement produced 31 findings. The client's board will read one page. Compare two versions of that page.\n\n**Version A (technical):** a list of the top findings with their CVSS vectors and a sentence each about the mechanics. Accurate, and hard for a director to act on: every item looks equally urgent, none is tied to a consequence, and the reader cannot tell what happens next.\n\n**Version B:** three sentences of context, three named risks with consequences, and three decisions with owners and dates. It contains no vulnerability names at all in the first paragraph, and it is still technically honest — the detail lives in the sections that follow.\n\nThe difference is not dumbing down; it is translating. The board does not need to know what an unsafe object reference is. It needs to know that customer invoices are readable by any logged-in user, that this is a personal-data exposure with a legal dimension, that fixing the pattern properly takes an estimated three days of a developer's time, and that a temporary control (restricting the affected endpoint to internal users) can be in place today.\n\nVersion B is what converts findings into a budget line, an owner and a date — which is the only outcome that reduces risk.",
            code:
              "EXECUTIVE SUMMARY (extract)\n\nContext\n  A two-week assessment of the customer portal and its API found 31 issues: 3\n  critical, 7 high, 12 medium and 9 low. Three of the high and critical\n  findings are exploitable by any authenticated customer and expose other\n  customers' personal data.\n\nTop three risks, in business terms\n  1. Data exposure (critical). Any logged-in customer can read any other\n     customer's invoices, including name, address and amount owed. Personal\n     data is disclosed.\n  2. Account takeover (critical). The login endpoint has no rate limit and no\n     multi-factor option for customer accounts; a known password list is\n     sufficient at scale.\n  3. Staging exposure (high). A staging host is public, runs a debug build and\n     shares a database credential with production.\n\nDecisions requested (with owners and dates)\n  • Apply the temporary control on the invoice endpoint today     — eng lead\n  • Schedule the access-control pattern fix (est. 3 dev-days)     — eng lead\n  • Turn on rate limiting and MFA for customer accounts (2 days)  — platform\n  • Take staging offline or behind the VPN this week             — ops lead\n  • Decide whether the personal-data exposure requires notifying\n    the Data Protection Commission (legal, within 72 hours)        — DPO\n\nFull findings, reproductions and evidence: sections 4–9 of this report.",
            language: "text",
            codeLabel: "One page that turns a test into decisions",
          },
          {
            heading: "Career routes and staying lawful",
            kind: "paragraph",
            body:
              "Security roles are not one job. **Application security** reviews code and designs, runs testing programmes and coaches developers — the closest to the work in this course. **SOC analyst** monitors alerts, triages and responds; entry routes value log literacy, packet reading and discipline. **Penetration tester** performs engagements; the hiring bar is the report, not the exploit toolkit. **Cloud security** handles identity, network and configuration in cloud accounts, and is currently the shortest-staffed of the four. **Governance, risk and compliance** translates regulation into controls.\n\nThe credentials that help in Ghana and internationally: practical, lab-based certifications carry more weight than theory-only ones for testing roles, and cloud provider security certifications for cloud roles. More important than any certificate is evidence: a lab you built and documented, a home network you hardened, a report you can show (redacted and consenting), a contribution to an open-source security tool.\n\nAnd the standing rules that keep the career alive: never test what you do not have written permission to test; treat every finding as confidential; report rather than exploit; keep learning about defences, because the offensive knowledge without the defensive counterpart produces a technician rather than a professional.",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **A report of raw tool output.** It transfers the work back to the client, who paid for judgement. Findings must be ranked, explained and paired with fixes.\n- **Ratings without business context.** A critical on a decommissioned server and a critical on the payment flow are not the same risk, and treating them alike trains the client to ignore the register.\n- **Testing \"just to check\" after the window closes.** Authorization expires. A re-test needs a fresh authorisation, not a memory of the old one.\n- **Publishing findings for reputation.** Without written consent, that can breach confidentiality agreements and data-protection law. Redact, ask, wait.\n- **Disclosing a bug by demanding payment.** That is extortion, regardless of how the request is phrased; report it and let the organisation fix it.\n- **Believing certificates equal competence.** Employers test by having you look at something and explain what you see. Build the record of work, not just the file of certificates.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Report section", "Audience", "Must contain", "Common failure"],
              ["Executive summary", "Directors", "Top risks in business terms, decisions, owners, dates", "Technical jargon, too many items"],
              ["Scope and methodology", "Security lead, auditors", "What was tested, when, how, and what was excluded", "Unclear exclusions that later become disputes"],
              ["Findings register", "Engineering", "Ranked list with severity, status and owner", "Everything marked critical"],
              ["Detailed finding", "Developer fixing it", "Reproduction, evidence, impact, root cause, fix, verification", "No reproduction; screenshot only"],
              ["Remediation plan", "Engineering manager", "Sequence, effort, dependencies, re-test proposal", "\"Improve security\" without specifics"],
              ["Appendices", "Auditors, legal", "Tools, versions, raw data, handling and deletion notes", "No evidence trail at all"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "The report is the product: an executive summary a director can act on, findings ranked by business risk, reproductions that can be verified, and remediation specific enough to be scheduled and re-tested. Defensively, every technique in this course implies a control — patching with an owner, least privilege, MFA, segmentation, logs that are read, and backups that have been restored. Outside an engagement, responsible disclosure is the only lawful option. And the career is built on evidence of work done lawfully, which in this field is both the requirement and the differentiator.",
          },
        ],
        keyPoints: [
          "Write an executive summary that states risk in business terms with owners and dates.",
          "Rate findings so that likelihood, impact and business context are all represented.",
          "Give remediation that names the file, the pattern and the verification step.",
          "Map each offensive technique you learned to the defensive control that answers it.",
          "Follow responsible disclosure when finding a vulnerability outside an engagement.",
        ],
        exercises: [
          "Take three findings from a lab exercise and write them as report entries: severity, reproduction, impact, root cause, fix and verification.",
          "Rewrite a technical finding as a two-sentence business risk for a non-technical director, then check it with somebody who is not technical.",
          "Build a remediation plan for a system you administer, ordered by risk, with an owner and a date for each item.",
          "Set up multi-factor authentication on every administrative account you control, then write down how you would verify that it was enforced.",
          "Write a responsible-disclosure email you would send to an organisation whose public website leaks a customer's personal data, without testing further.",
        ],
        challenge:
          "Produce a complete, client-ready penetration test report for a lab environment or a system you own with written self-authorization: executive summary, scope and methodology, at least five ranked findings with reproductions and redacted evidence, a remediation plan with effort estimates, and a re-test plan. Then implement two of the fixes, re-run the original reproductions, and append the verification results — including anything that did not work the first time.",
      }),
    ]
  ),
];
