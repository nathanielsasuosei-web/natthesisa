import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Foundations · Programming for security.
 *
 * Two lessons: Python as a working security language (environments, data,
 * functions, files and the network libraries), and turning that into tools
 * (parsing untrusted input, command-line interfaces, tests, and safe scripting
 * habits). The aim is not software engineering for its own sake; it is being
 * able to automate a check, read a log, or prove a claim with a script.
 */

export const CS_PROGRAMMING_MODULE: CourseModule = module(
  "programming",
  "03 · Programming for security",
  "Enough Python to automate, parse and prove, and the habits that keep your scripts from becoming the vulnerability.",
  [
    lesson({
      id: "python-for-security-work",
      title: "Python for security work",
      summary:
        "Security work is repetitive and evidence-driven: check a hundred hosts, parse ten thousand log lines, verify a file against a published hash, test an endpoint with a hundred inputs. Python is the common language for this because it is readable, has a large standard library and has mature packages for networking and cryptography. This lesson sets up a safe working environment, introduces the parts of Python a security practitioner uses daily, and shows how to build small, reliable checks rather than one-off hacks.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "A security claim is only as good as the procedure that produced it. 'The server is patched' is a belief; a script that compares installed package versions against a list and prints the result is evidence that can be rerun, reviewed and attached to a report. Python lets you turn procedures into code quickly, which is why it appears in almost every security job description and most open-source security tools.\n\nThis lesson does not assume prior programming. It assumes you can run a terminal command and are willing to read error messages carefully, which is most of programming anyway.",
        },
        {
          heading: "Environments and dependencies",
          kind: "definition",
          body:
            "Python packages install into an **environment**. A **virtual environment** (`venv`) is an isolated folder with its own interpreter and packages, so that a project's dependencies do not collide with the system's or with another project's. Always create one per project and record its dependencies in a `requirements.txt` file, so that someone else can reproduce your results.\n\nThe interpreter itself is part of your attack surface. Install Python from your operating system or from python.org, keep it updated, and install third-party packages only from the official index (PyPI), checking the package name carefully. Typosquatting, where a malicious package is named one letter away from a popular one, is a real and documented attack.",
          code:
            "python3 -m venv .venv\nsource .venv/bin/activate          # Windows PowerShell: .venv\\Scripts\\Activate.ps1\npip install requests\npip freeze > requirements.txt\npython -c 'import requests; print(requests.__version__)'",
          language: "bash",
          codeLabel: "A reproducible project setup",
        },
        {
          heading: "The data types and control flow you will use every day",
          kind: "definition",
          body:
            "Most security scripts are built from five things: **strings** (text from logs, URLs, banners), **integers** (ports, counts, timestamps), **lists** (ordered collections such as IP addresses), **dictionaries** (named fields, such as a parsed log entry or a JSON response), and **sets** (membership tests, such as 'have I seen this address before?'). Bytes deserve a separate mention: network data and hashes are bytes, and Python keeps text and bytes apart on purpose, so `'abc'.encode()` and `b'abc'.decode()` convert between them.\n\nControl flow is `if`, `for`, `while` and `try/except`. The `try/except` block is where security scripts become robust: a network call that times out, a file that does not exist and a malformed line in a log should each produce a clear message, not a crash that hides what was happening.",
        },
        {
          heading: "Worked example: verifying a download against its published hash",
          kind: "example",
          body:
            "A project publishes an installer and the SHA-256 of that installer on its website. Verifying the hash proves that the file you downloaded is byte-for-byte the file the publisher produced, which matters if the download was intercepted or the mirror was compromised. Trace the script below on a real file.\n\n1. `open(path, 'rb')` opens the file in binary mode, so Python does not translate line endings and the bytes are exactly what is on disk.\n2. The `while` loop reads 64 KiB at a time. This matters: a multi-gigabyte installer is never loaded into memory in one go.\n3. `hashlib.sha256()` accumulates the digest. `hexdigest()` gives the familiar 64-character hex string.\n4. The comparison uses `hmac.compare_digest`, which is designed for secret comparisons. For public hashes a plain `==` is fine, but using the constant-time function is a habit worth forming.\n5. The function returns a boolean and never prints the expected value into logs as if it were secret, which is a minor but real hygiene point.",
          code:
            "import hashlib\nimport hmac\nfrom pathlib import Path\n\ndef sha256_of(path: Path, chunk_size: int = 65536) -> str:\n    digest = hashlib.sha256()\n    with path.open('rb') as handle:\n        while chunk := handle.read(chunk_size):\n            digest.update(chunk)\n    return digest.hexdigest()\n\ndef verify(path: Path, published: str) -> bool:\n    return hmac.compare_digest(sha256_of(path), published.strip().lower())\n\nif __name__ == '__main__':\n    import sys\n    ok = verify(Path(sys.argv[1]), sys.argv[2])\n    print('MATCH' if ok else 'MISMATCH')\n    sys.exit(0 if ok else 1)",
          language: "python",
          codeLabel: "A complete, reusable verification tool",
        },
        {
          heading: "Networking from Python, responsibly",
          kind: "paragraph",
          body:
            "Python's standard `socket` module opens TCP and UDP connections directly, and the `requests` library speaks HTTP with a friendlier interface. Both can be used to check that a service you run is reachable and that it answers as expected. The rules that keep this responsible are the same as for scanning in the networking lesson: only probe systems you own or are authorised to test, use short timeouts so that a dead host cannot hang your script, and never send credentials to a host you have not verified with TLS. Set a timeout on every network call, every time. A script without timeouts will eventually hang in production.",
          code:
            "import socket\n\ndef port_open(host: str, port: int, timeout: float = 2.0) -> bool:\n    try:\n        with socket.create_connection((host, port), timeout=timeout):\n            return True\n    except (socket.timeout, ConnectionRefusedError, OSError):\n        return False\n\nprint(port_open('127.0.0.1', 22))   # run against your own machine",
          language: "python",
          codeLabel: "A timeout-bounded TCP check against a host you control",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Installing packages from unknown sources.** Check the package name, the maintainer and the download count before you install, and prefer packages with a long history.\n- **Hard-coding secrets in scripts.** Read tokens and passwords from environment variables or a secrets manager. A script committed to a public repository is a published credential.\n- **Missing timeouts.** Every network call needs one. Every subprocess needs one.\n- **Opening large files with `read()`.** Stream them in chunks, as the hashing example does.\n- **Mixing text and bytes.** Most 'UnicodeDecodeError' problems come from reading binary data as text. Decide what each value is and convert deliberately.\n- **Writing a script that cannot be rerun.** A check that edits state when it runs will eventually run twice. Make read-only checks read-only, and make any change explicit and reviewable.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Python 3.11 or later", "The interpreter used throughout the course", "python.org or your OS package manager"],
            ["venv and pip", "Isolated environments and package installation", "Bundled with Python"],
            ["VS Code or any editor with Python support", "Writing and running scripts with linting", "code.visualstudio.com"],
            ["requests", "HTTP requests with timeouts and sensible defaults", "pypi.org/project/requests"],
            ["pytest", "Automated tests for the scripts you write", "pip install pytest"],
            ["ruff", "Fast linting that catches common mistakes", "pip install ruff"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Keep every script in a single project folder under version control with Git, so that each change is recorded.",
          items: [
            "Create a project folder `seclab-tools`, set up a virtual environment, and install `requests` and `pytest`. Save the dependencies to `requirements.txt`.",
            "Type the hash-verification example by hand (do not copy and paste). Run it against a small file you create, passing the file's own SHA-256 as the expected value. Confirm `MATCH`.",
            "Change one byte in the file and run the tool again. Confirm `MISMATCH` and an exit status of 1 with `echo $?`.",
            "Compute the SHA-256 of a published Linux ISO or any open-source installer, using the vendor's published checksum. Record both values in your notes.",
            "Run the `port_open` example against `127.0.0.1` for a port with a service (for example 22) and a port without one (for example 9). Explain why both return quickly.",
            "Write a function `ip_is_private(address: str) -> bool` using the standard `ipaddress` module, and write three pytest tests for it covering a private address, a public address and an invalid string.",
            "Run `ruff check .` and fix every warning. Write a three-sentence note on the most useful warning you fixed and why it mattered.",
          ],
        },
      ],
      challenge:
        "Build a command-line tool called `checksum-check` that takes a file path and a published hash, verifies them, and prints a result suitable for a log. Add a pytest file with at least four tests, including a tampered file and a mixed-case hash. Commit the project and write a README explaining how to reproduce the results.",
      keyPoints: [
        "Create an isolated Python environment and record its dependencies",
        "Use bytes and strings correctly when handling files and network data",
        "Stream large files in chunks and verify them with a cryptographic hash",
        "Apply timeouts to every network call and reason about why they matter",
        "Recognise and avoid the common hygiene mistakes of security scripts",
      ],
      exercises: [
        "Why does the hashing example open the file with 'rb' rather than 'r'? Describe a case where text mode would produce the wrong hash.",
        "A colleague's script has `requests.get(url)` with no timeout. Describe the failure this causes and the one-line fix.",
        "Explain why a published checksum proves integrity only if it was obtained over a channel you trust.",
        "Write a short Python function that reads a file of one IP address per line and returns the count of unique addresses, using a set.",
        "Practical problem: identify three security issues in this snippet and rewrite it safely: `key = 'sk_live_12345'; subprocess.run('ping ' + host, shell=True)`.",
      ],
    }),
    lesson({
      id: "parsing-logs-and-building-tools",
      title: "Parsing logs and building tools",
      summary:
        "Logs are the evidence trail of every system, and they are written by programs that do not care whether a reader can make sense of them. This lesson teaches how to parse semi-structured text safely with regular expressions and structured formats, how to write a command-line tool that others can run, how to test it, and the habits that stop a parser from becoming a vulnerability when it meets hostile input. The practical builds a small but real log analyser.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "An analyst who can turn a log file into a table can answer questions that no dashboard was built for: which accounts were tried from more than one country, which hosts stopped sending heartbeats, which process started a connection to an unfamiliar address. Parsing is the bridge between raw telemetry and a conclusion.\n\nThe critical point is that log content is **attacker-controlled input**. An attacker can put almost any text into a username, a user-agent header or a request path, and that text ends up in your logs. A parser that trusts the format, or that executes what it reads, is a vulnerability. Treat every log line as untrusted from the first byte.",
        },
        {
          heading: "Regular expressions, carefully",
          kind: "definition",
          body:
            "A **regular expression** describes a pattern of text. Python's `re` module matches them. The syntax is compact enough to be unreadable, so write them with `re.VERBOSE` and comments when they grow. The building blocks are character classes (`\\d` digit, `\\w` word character, `[0-9]`), quantifiers (`+` one or more, `*` zero or more, `{1,3}` between one and three), anchors (`^` start, `$` end) and **groups** (`(...)`) that capture the parts you want.\n\nRegex has a well-known performance trap. A pattern with nested quantifiers, such as `(a+)+$`, can take exponential time on a crafted input, a failure called **catastrophic backtracking**, which turns a parser into a denial-of-service target. Keep patterns simple, anchor them, bound their repetition, and test them against long hostile input before they reach production.",
          code:
            "import re\n\nFAILED = re.compile(\n    r'''\n    (?P<month>\\w{3})\\s+(?P<day>\\d{1,2})\\s+(?P<time>[\\d:]{8})   # Oct 13 09:14:02\n    .*?sshd\\[\\d+\\]:\\s+Failed\\ password\\ for\\ (?:invalid\\ user\\ )?(?P<user>\\S+)\n    \\ from\\ (?P<ip>[\\d.]+)                                         # source address\n    ''',\n    re.VERBOSE,\n)\n\nline = 'Oct 13 09:14:02 host sshd[812]: Failed password for invalid user admin from 203.0.113.9 port 51422 ssh2'\nm = FAILED.search(line)\nprint(m.groupdict() if m else 'no match')",
          language: "python",
          codeLabel: "A commented pattern for SSH authentication failures",
        },
        {
          heading: "Structured formats and the parser's boundary",
          kind: "paragraph",
          body:
            "Many logs are better handled as structure than as text. **JSON Lines** (one JSON object per line) is the common format for cloud and application logs, and Python's `json` module parses each line independently, so a single malformed line can be skipped and reported rather than stopping the run. **CSV** files should be read with the `csv` module, never by splitting on commas, because quoted fields can contain commas.\n\nDraw the boundary between parsing and interpreting. The parser's job is to turn text into fields, reject what it cannot understand, and count the rejects. Interpretation (deciding that a sequence of failures is an attack) belongs in a separate step that can be tested on its own. Keep the two apart and both become easier to trust.",
          code:
            "import csv\nimport json\nfrom collections import Counter\n\ndef parse_jsonl(path):\n    bad = 0\n    with open(path, encoding='utf-8', errors='replace') as handle:\n        for number, line in enumerate(handle, start=1):\n            try:\n                yield json.loads(line)\n            except json.JSONDecodeError:\n                bad += 1\n                print(f'skipped line {number}: not valid JSON')\n    if bad:\n        print(f'{bad} lines skipped in total')\n\ncounts = Counter(event.get('source_ip', 'unknown') for event in parse_jsonl('events.jsonl'))\nfor ip, n in counts.most_common(5):\n    print(n, ip)",
          language: "python",
          codeLabel: "Streaming JSON Lines with explicit handling of bad input",
        },
        {
          heading: "Worked example: an analyser with a command-line interface",
          kind: "example",
          body:
            "A tool is useful only if someone else can run it. The `argparse` module turns a script into a command with arguments, help text and validation. Walk through what the tool below does when run as `python analyse.py /var/log/auth.log --threshold 5`.\n\n1. `argparse` checks that a path was given and that the threshold is an integer. If not, it prints usage and exits with status 2, without running any analysis.\n2. The file is opened once and read line by line, so a large log does not exhaust memory.\n3. Each matching line is parsed with the compiled pattern. Lines that do not match are counted separately, so the analyst knows how much of the log was understood.\n4. A `Counter` tracks failures per address. Addresses at or above the threshold are reported.\n5. The result is printed as a table, and the exit status is 0 when there are no findings and 1 when there are, so the tool can be used in a scheduled job.\n\nEach of those five steps is a design decision that a reviewer can question. That is the purpose of writing tools rather than running one-liners: the decisions become visible.",
          code:
            "import argparse\nimport re\nfrom collections import Counter\n\nPATTERN = re.compile(r'Failed password .* from (?P<ip>\\d{1,3}(?:\\.\\d{1,3}){3})')\n\ndef main() -> int:\n    parser = argparse.ArgumentParser(description='Count failed SSH logins per source address.')\n    parser.add_argument('logfile')\n    parser.add_argument('--threshold', type=int, default=5)\n    args = parser.parse_args()\n\n    counts, unmatched = Counter(), 0\n    with open(args.logfile, encoding='utf-8', errors='replace') as handle:\n        for line in handle:\n            match = PATTERN.search(line)\n            if match:\n                counts[match.group('ip')] += 1\n            elif 'sshd' in line:\n                unmatched += 1\n\n    findings = [(ip, n) for ip, n in counts.most_common() if n >= args.threshold]\n    print('address'.ljust(18) + 'failures'.rjust(8))\n    for ip, n in findings:\n        print(f'{ip:<18}{n:>8}')\n    print(f'unparsed sshd lines: {unmatched}')\n    return 1 if findings else 0\n\nif __name__ == '__main__':\n    raise SystemExit(main())",
          language: "python",
          codeLabel: "analyse.py: a complete tool with a usable interface",
        },
        {
          heading: "Testing the parser before you trust it",
          kind: "paragraph",
          body:
            "A parser needs tests that include the lines you expect and the lines that should break it. Put fixture lines in a file, and write pytest tests that check the extracted address, that a line without a match returns nothing, and that a line with a very long user name does not take noticeable time. The last test is the regex-safety test from earlier in this lesson. Keep the fixtures in the repository so that a future change to the pattern is caught immediately.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Using `eval` or `exec` on log content.** Logs can contain anything an attacker typed. Parsing is reading; it never executes.\n- **Building shell commands from log fields.** `os.system(f'whois {ip}')` lets a crafted field inject commands. Pass arguments as a list, or avoid the shell entirely.\n- **Splitting CSV on commas.** Quoted fields break the split. Use the `csv` module.\n- **Letting one bad line stop the run.** Count, report and continue, unless the file is entirely invalid.\n- **Reading the whole file into memory.** Stream it. Log files grow faster than laptops.\n- **Trusting timestamps from one source.** Clocks drift and logs are written in different time zones. Normalise to UTC before comparing events.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["re (regex) and regex101.com", "Writing and testing patterns interactively", "Standard library; regex101.com (choose Python flavour)"],
            ["argparse", "Command-line interfaces with validation and help", "Standard library"],
            ["csv and json", "Reading structured log formats safely", "Standard library"],
            ["pytest", "Fixture-based tests for parsers", "pip install pytest"],
            ["jq", "Querying JSON logs from the shell before writing Python", "jqlang.github.io/jq or apt install jq"],
            ["Sample logs (Loghub, or generated)", "Realistic test data without real personal information", "github.com/logpai/loghub"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use sample or generated logs only. Do not analyse production logs containing personal data without a lawful basis, and be aware that Ghana's Data Protection Act, 2012 (Act 843) governs the processing of personal data.",
          items: [
            "Create `fixtures/auth-sample.log` with at least twenty lines of realistic SSH output: successful logins, failed logins for valid and invalid users, and two unrelated services. Include one malformed line.",
            "Type the regex example, test it against the sample, and confirm that it captures the user and the address for every failed login. Record which lines it misses and why.",
            "Install jq and run `jq` on a JSON Lines file of your own making, to extract one field from each line. Then reproduce the same result in Python.",
            "Write `analyse.py` from the worked example. Run it with thresholds of 1, 3 and 10 and record how the output changes.",
            "Add the `--json` option so the tool can print its findings as a JSON array instead of a table. Test that the output is valid JSON with `python -m json.tool`.",
            "Write three pytest tests: one checks the extracted address, one checks that an unrelated line produces no finding, and one feeds a line with a 100,000-character user name and asserts that the parse completes within two seconds.",
            "Write a short section for a README explaining what the tool counts, what it does not count, and the exit status meanings. Give a limitation you discovered during testing.",
          ],
        },
      ],
      challenge:
        "Extend `analyse.py` to read a combined log, normalise timestamps to UTC, and report the first and last time each flagged address was seen. Add pytest coverage for a malformed line, a line in a different time zone and a 100,000-character line. Publish the project with a README and a fixtures folder containing only synthetic data.",
      keyPoints: [
        "Write and test regular expressions for log formats, avoiding catastrophic backtracking",
        "Parse JSON Lines and CSV safely, counting rejected input rather than stopping",
        "Build a command-line tool with argparse, meaningful exit codes and clear output",
        "Separate parsing from interpretation so each can be tested independently",
        "Recognise log content as untrusted input and avoid executing or shelling out with it",
      ],
      exercises: [
        "Explain why the regex `(a+)+$` is dangerous on input such as 'aaaaaaaaaaaaaaaaaaaaaaaa!' and rewrite a simple version that is safe.",
        "A log field contains `; rm -rf ~`. Show two ways a naive script could execute it and the change that prevents each.",
        "Why does the analyser return exit status 1 when it finds something, and what does that let a scheduler do with it?",
        "Describe the difference between a parse failure and an interpretation finding, and give an example of each from SSH logs.",
        "Practical problem: a log export has timestamps in three time zones and some lines have no time zone at all. Explain how you would decide what to do with the untimed lines, and what you would record in the report.",
      ],
    }),
  ],
);
