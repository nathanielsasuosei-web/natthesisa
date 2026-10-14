import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Security · Ethical hacking.
 *
 * Two lessons: the legal and procedural frame of authorised testing with the
 * reconnaissance phase in depth, and exploitation and privilege escalation
 * taught on purpose-built vulnerable machines. Every technique is shown against
 * a target the learner owns or is explicitly allowed to test, and every lesson
 * ends by asking the learner to write the defensive fix as well.
 */

export const CS_ETHICAL_HACKING_MODULE: CourseModule = module(
  "ethical-hacking",
  "02 · Ethical hacking",
  "Thinking like an attacker, legally and methodically, from first reconnaissance to a documented finding.",
  [
    lesson({
      id: "rules-of-engagement-and-recon",
      title: "Rules of engagement and reconnaissance",
      summary:
        "What separates a penetration tester from an intruder is not skill but permission and method. This lesson sets out the legal and contractual frame that makes testing lawful, the phases of a structured engagement, and the first phase in depth. Reconnaissance is where most of the real insight comes from: what an organisation has exposed on the internet, which of its names and addresses it has forgotten, and what its staff have revealed without meaning to. You will learn to gather that information passively, record it properly, and turn it into an attack-surface map.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Ethical hacking is the discipline of finding weaknesses before someone with worse intentions does, and reporting them so they can be fixed. Its practitioners are judged less by the cleverness of an exploit than by the quality of their scope, their notes and their report. A finding that cannot be reproduced, or that was obtained by testing systems the client never agreed to, is worthless or harmful, however serious it looks.\n\nThe lesson is built around one principle: **everything you do should be explainable to the client and to a court**. Each phase in this module begins with what you are permitted to do and ends with a record of what you did.",
        },
        {
          heading: "The legal frame",
          kind: "warning",
          body:
            "Unauthorised access to a computer system is a criminal offence in almost every jurisdiction. In Ghana, the **Cybersecurity Act, 2020 (Act 1038)** creates offences relating to cybersecurity, and the **Data Protection Act, 2012 (Act 843)** governs the processing of personal data that you may encounter during a test. Abroad, examples include the US Computer Fraud and Abuse Act and the UK Computer Misuse Act 1990. Read the current text of the law that applies to you, and take legal advice for any engagement that crosses borders.\n\nPermission is what turns an intrusion into a test. In practice permission means:\n\n- A **written scope** listing the hosts, domains, applications and address ranges in bounds, and the ones explicitly out of bounds.\n- **Authority**: the signatory must be able to grant access to the systems in scope. An intern cannot authorise a test of a bank's core systems, and a cloud provider's infrastructure is usually out of scope for the customer.\n- **Rules of engagement**: whether social engineering, denial-of-service testing, testing of production systems and testing of third-party services are allowed, and at what times.\n- **Contacts and an escalation path** for both sides, and a procedure for stopping immediately if something fragile breaks.\n- **Data handling terms**: what you may copy, where it may be stored and when it is destroyed.\n\nIf a target is not on the list, you do not touch it, even if you discovered it through a target that is. Subdomains found during reconnaissance are not in scope until the client adds them in writing.",
        },
        {
          heading: "The phases of an engagement",
          kind: "definition",
          body:
            "Structured methodologies such as the Penetration Testing Execution Standard (PTES), the OWASP Web Security Testing Guide and the NIST SP 800-115 guidance share the same arc:\n\n1. **Pre-engagement**: scope, rules, contacts, timeline and the definition of success.\n2. **Reconnaissance**: learn about the target, passively first and then with light active contact.\n3. **Scanning and enumeration**: find live hosts, open services, versions, accounts and content.\n4. **Vulnerability analysis**: match what you found to weaknesses and judge which are real in this environment.\n5. **Exploitation**: demonstrate that a weakness can be used, in the smallest way that proves the point.\n6. **Post-exploitation**: judge impact, escalate privileges and stop when the proof is sufficient.\n7. **Reporting and retest**: explain each finding, its risk and its fix, then verify the fix.\n\nBeginners rush to step 5. Professionals spend most of their time on 2, 3, 6 and 7, because the report is the product the client buys.",
        },
        {
          heading: "Reconnaissance: passive before active",
          kind: "definition",
          body:
            "**Open-source intelligence (OSINT)** is information collected from public sources without contacting the target's systems. Passive reconnaissance is attractive for three reasons: it is legal in most places to read what is published, it leaves no trace in the target's logs, and it is the cheapest way to discover what you should test.\n\nThe categories that repay the effort are:\n\n- **Names and infrastructure**: DNS records, WHOIS registration data (which may be redacted under privacy rules), certificate transparency logs, the autonomous system that owns an address range.\n- **Technology**: job advertisements, public source code and configuration files committed to repositories, error pages, file metadata in published documents.\n- **People**: staff roles and naming conventions, which indicate email formats, and which individuals are responsible for systems. Use this to understand the attack surface, not to target individuals.\n- **Exposed services**: search engines and internet-wide scan databases index what is reachable. Shodan is the best known; its free tier is limited but sufficient for learning.\n\nThe discipline is to record the source, the time and the query for every item. An unrecorded fact cannot be checked, and an unchecked fact cannot go in a report.",
          code:
            "# Subdomains from certificate transparency logs (passive: queries a public log)\ncurl -s 'https://crt.sh/?q=%25.example.com&output=json' \\\n  | python3 -c 'import json,sys; print(\"\\n\".join(sorted({r[\"name_value\"] for r in json.load(sys.stdin)})))'\n\n# Who owns the address block a host belongs to\nwhois 93.184.215.14 | grep -iE 'netname|orgname|country'\n\n# Passive subdomain enumeration with a dedicated tool (no traffic to the target)\nsubfinder -d example.com -silent | sort -u > subs.txt",
          language: "bash",
          codeLabel: "Three passive sources, each logged with its query",
        },
        {
          heading: "Worked example: an attack-surface map from public data",
          kind: "example",
          body:
            "Suppose you are authorised to test `example.com`, a company you have a signed contract with. Your passive phase produces the following chain of reasoning. Each step is a fact with a source, and each inference is labelled as one.\n\n1. **Fact (crt.sh, retrieved 13 October)**: 42 certificates have been issued for names under `example.com`. Thirty-one names are unique.\n2. **Fact (DNS)**: `vpn.example.com`, `staging.example.com` and `old-portal.example.com` resolve to addresses in one provider's range.\n3. **Inference**: `old-portal` is probably a retired application that still answers. It is a candidate for the scope discussion, not a target yet.\n4. **Fact (job advertisement, public)**: a role asks for experience with a specific web framework and an identity provider.\n5. **Inference**: the stack is likely that framework behind the portal. This narrows the vulnerability analysis to known weaknesses in that version, once confirmed.\n6. **Fact (public repository, search result)**: a configuration file for a staging environment has been committed by a former contractor. It contains a hostname but no credentials.\n7. **Action**: report the exposed repository to the client as an observation, without using the hostname until it is in scope.\n\nThe output is a map with sources, confidence levels and open questions. That is what the next phase needs, and it is what the client can act on even if the active test never happens.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Scope creep.** A discovered subdomain is not in scope until the client says so in writing. Stop, record it and ask.\n- **Skipping passive recon.** Most valuable findings, such as forgotten staging systems and committed configuration files, are found before any scan.\n- **Noisy from the start.** Heavy active scanning can trigger alarms, disrupt fragile systems and burn goodwill. Begin passive, and agree the rate of active work in the rules of engagement.\n- **Treating a public fact as a permission.** Information being visible on the internet does not make the system it describes open to you.\n- **Collecting personal data you do not need.** Limit what you keep about individuals, and handle it under the data protection law that applies.\n- **Keeping no notes.** Record every command and timestamp. The report, and your own defence if your conduct is questioned, depend on it.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["crt.sh", "Certificate transparency search for names under a domain", "crt.sh (web and JSON)"],
            ["subfinder / amass", "Passive subdomain discovery from many public sources", "github.com/projectdiscovery/subfinder, github.com/owasp-amass/amass"],
            ["theHarvester", "Collects emails, names and hosts from public sources", "github.com/laramies/theHarvester"],
            ["Shodan", "Index of internet-facing services and banners", "shodan.io (free account for learning)"],
            ["Maltego Community Edition", "Graphing relationships between domains, people and infrastructure", "maltego.com (community edition)"],
            ["OSINT Framework", "A categorised directory of public-source tools", "osintframework.com"],
            ["Notes tool (Obsidian, Joplin, or a Git repository)", "Recording sources, timestamps and decisions", "obsidian.md, joplinapp.org"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Passive recon only. Use a domain you own, or a company that publishes a vulnerability disclosure policy that explicitly covers reconnaissance. Do not send traffic to any target host during these steps.",
          items: [
            "Write a rules-of-engagement document for a fictional client. Include scope, exclusions, testing windows, emergency contacts and what happens if a fragile system fails. Keep it to two pages.",
            "Register or use a domain you own. Query crt.sh for it, save the JSON, and count the unique names with the Python one-liner from the lesson.",
            "Run `whois` and `dig` for the domain and for one of its subdomains. Record the registrar, the name servers and the address, and note which fields are redacted and why.",
            "Install subfinder and run it against your domain with the `-silent` flag. Compare its output with the crt.sh list and explain each name found by only one of them.",
            "Search your domain with theHarvester using only the public sources. Note the source of each result, and delete any personal data you do not need before writing your notes.",
            "Produce an attack-surface map as a table with columns: asset, source, date retrieved, confidence (high, medium, low), and open question. Include at least ten rows.",
            "Write a one-page memo to the 'client' (you) recommending three hardening actions based only on what the passive phase revealed, such as removing old certificates or retiring unused names.",
          ],
        },
      ],
      challenge:
        "For a domain you own, produce a complete passive attack-surface map with sources, dates and confidence levels, and a rules-of-engagement document that would have authorised the next phase. Then write the three defensive actions you would recommend to the owner, ranked by risk and effort.",
      keyPoints: [
        "State the elements of a written scope and why each one protects the tester and the client",
        "Name the phases of a structured penetration test and what each produces",
        "Gather DNS, certificate, ownership and technology information without contacting the target",
        "Record sources and confidence for every fact, and separate facts from inferences",
        "Explain why a discovered asset is not in scope until the client confirms it in writing",
      ],
      exercises: [
        "The scope lists `app.example.com`. Passive recon shows `app-staging.example.com` on the same address. Describe the steps you take before doing anything else.",
        "Why are certificate transparency logs valuable to an attacker, and what can a domain owner do to reduce what they reveal?",
        "A job advertisement reveals a framework and a version. Explain how that information is useful to a defender as well as an attacker.",
        "Draft a clause for a rules-of-engagement document that covers what happens if the tester accidentally accesses personal data.",
        "Practical problem: you find a public repository containing a plaintext password for a system that is in scope. Write the exact steps you take, in order, and explain why each one is necessary.",
      ],
    }),
    lesson({
      id: "exploitation-and-privilege-escalation",
      title: "Exploitation and privilege escalation",
      summary:
        "Once you know what is running, you ask whether it can be abused and, if it can, how far the access goes. This lesson covers how vulnerabilities are named and scored (CVE and CVSS), how to match a service version to published weaknesses, what a shell is and how exploitation usually ends with one, and the Linux checks that turn a low-privilege foothold into full control. Every technique is practised on purpose-built vulnerable machines, and every lesson ends with the fix a defender would apply.",
      sections: [
        {
          heading: "Vulnerabilities have names and scores",
          kind: "definition",
          body:
            "A **CVE** (Common Vulnerabilities and Exposures) identifier names one specific publicly known flaw, for example `CVE-2021-44228`, the Log4Shell vulnerability in a widely used Java logging library. CVE records are maintained by a network of numbering authorities and published in the **National Vulnerability Database (NVD)** with detail and scoring.\n\n**CVSS** (Common Vulnerability Scoring System) gives a severity score from 0.0 to 10.0 based on attributes such as whether the attack is remote, whether it needs authentication, and how much an attacker gains. A score is a starting point for prioritisation, not a verdict. A 9.8 on a service that is not reachable from the internet may matter less today than a 6.5 on the login page. The question a tester answers is whether the weakness is real in this environment, which requires confirmation.\n\nTo match a version to weaknesses, search the CVE database for the product and version, then check exploit databases. `searchsploit` (from Exploit-DB) searches a local copy of that database and is standard on penetration testing distributions.",
          code:
            "# Which product and version did the scanner report?\nnmap -sV -p 22,80 192.168.56.101\n\n# Search the local Exploit-DB copy for that product and version\nsearchsploit openssh 7.2\nsearchsploit -m <EDB-ID>   # copy one exploit into the working directory to read it",
          language: "bash",
          codeLabel: "From a service banner to candidate weaknesses",
        },
        {
          heading: "What exploitation is, and how it ends",
          kind: "paragraph",
          body:
            "**Exploitation** is using a weakness to make a system do something its owner did not intend. The forms you will meet are: a web application accepting input it should not (the injection and access-control lessons), a service with a memory-safety bug that lets an attacker run code, a default or weak credential, and a misconfiguration such as an exposed administrative interface.\n\nMost successful exploitation ends with a **shell**: an interactive command prompt on the target. A **bind shell** has the target listen for a connection. A **reverse shell** has the target connect back to the tester, which often passes firewalls that block inbound connections but allow outbound ones. Defenders watch for the signature of this: a web server process starting `sh` or `bash`, or a network connection from a service account to an address it has never used before.\n\nFor the lab, the flow is shown below. The attacker side listens, and the vulnerable machine is one you built to be vulnerable. The point is to recognise the pattern so that it can be detected.",
          code:
            "# On the TESTER's lab machine: listen for an incoming connection on port 4444\nnc -lvnp 4444\n\n# The lab target is configured to connect back to that address when its\n# deliberately vulnerable service is triggered. On your defence side, the\n# signs to alert on are: a web daemon with a child shell, and an outbound\n# connection from that shell to an address that is not on any approved list.",
          language: "bash",
          codeLabel: "Listening side only, with the detection signals stated",
        },
        {
          heading: "Worked example: from a foothold to root on a Linux host",
          kind: "example",
          body:
            "Assume you have a shell as an ordinary user, `www-data`, on a lab server you are authorised to test. Your objective is to determine how much access you can gain, and to prove it without damaging anything. Work through the standard checks in order.\n\n1. **Who am I and what can I run?** `id` and `sudo -l`. If `sudo` allows a program to run without a password, look that program up on GTFOBins, a catalogue of binaries that can be abused this way.\n2. **Setuid programs.** `find / -xdev -perm -4000 -type f 2>/dev/null`. Compare the list with the package manager (`dpkg -S`). An unusual setuid program owned by root is a lead.\n3. **Scheduled tasks.** `cat /etc/crontab` and `ls -l /etc/cron.*`. A root-run job that executes a script you can write to is a direct path to root.\n4. **Writable configuration.** `find /etc -writable -type f 2>/dev/null`. A writable file that a privileged process reads is equivalent to control of that process.\n5. **Credentials in the open.** Application configuration files, shell history (`~/.bash_history`) and environment variables often contain passwords reused by administrators.\n6. **Proof.** Once you have an escalation path, demonstrate it by reading a file that only root can read, such as `/etc/shadow`, and record the output's hash, not its contents, in the report.\n\nThe tester stops here. The engagement's rules should say whether to go further, for example by creating a file in a root-owned location as proof of write access. Once the proof is recorded, you write the finding.",
        },
        {
          heading: "Writing the finding: from exploit to recommendation",
          kind: "paragraph",
          body:
            "A finding has five parts: a **title** that describes the weakness in plain language, a **severity** with the method used to judge it, **evidence** that someone else can reproduce (commands, output, timestamps, with secrets redacted), **impact** described in terms of the client's business, and a **recommendation** specific enough to act on. For the sudo misconfiguration above, the recommendation is not 'fix sudo'. It is 'remove the `NOPASSWD` entry for the `www-data` account in `/etc/sudoers.d/web`, restrict the permitted command to the specific script required, and verify with `sudo -l -U www-data` that only that command is listed'.\n\nThe retest is part of the finding. A fix is only confirmed when the same reproduction steps fail.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Running exploits from the internet without reading them.** Public exploit code can contain backdoors or destructive steps. Read it, understand it and run it only in a lab.\n- **Treating a CVSS score as the finding.** Confirm that the weakness is reachable and exploitable in the environment before reporting its severity.\n- **Going beyond the agreed proof.** Proving you can read a file is usually enough. Deleting data, changing passwords or pivoting to other systems needs explicit approval.\n- **Ignoring defences in the way.** A failed exploit is information. Note whether an intrusion prevention system, an endpoint agent or a firewall responded, and report it.\n- **Writing 'it is vulnerable' without evidence.** A finding without reproduction steps cannot be fixed or verified.\n- **Forgetting the blue team.** Every lab exercise should end with a question: which log entry, alert or metric would have shown this activity?",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Kali Linux or Parrot Security OS", "Prepared penetration testing toolset, including the tools below", "kali.org, parrotsec.org (run in a VM)"],
            ["Metasploit Framework", "Exploit development, modules and payload handling in lab use", "metasploit.com (open-source framework)"],
            ["searchsploit (Exploit-DB)", "Offline search of known exploits by product and version", "exploit-db.com; preinstalled on Kali"],
            ["LinPEAS", "Automated Linux privilege-escalation checklist, read the output critically", "github.com/peass-ng/PEASS-ng"],
            ["GTFOBins", "Reference for binaries that can be abused under sudo or setuid", "gtfobins.github.io"],
            ["Metasploitable 2 and OWASP Juice Shop", "Intentionally vulnerable targets for practice", "Rapid7 documentation; github.com/juice-shop/juice-shop"],
            ["TryHackMe and Hack The Box", "Structured, legal practice machines with guided and open paths", "tryhackme.com, hackthebox.com"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Every target is a machine you run in your own lab, or a practice platform's machine that you connect to through its VPN. Do not attempt any of these against systems you do not own or have written permission to test.",
          items: [
            "Set up an isolated host-only network with a Kali VM and a Metasploitable 2 VM. Confirm they can see each other and nothing else. Take a snapshot of both machines before you start.",
            "From Kali, run `nmap -sV` against Metasploitable 2. Record every open service and its version. For three services, run `searchsploit` on the product name and version, and note how many results you get and why most are not relevant.",
            "Read the source of one candidate exploit before you run anything. Write three sentences describing what it does, what it requires and what could go wrong on a production system.",
            "Exploit one weakness on Metasploitable 2 from the lab, with the objective of obtaining a session as a non-root user. Record the commands, the output and the time. Stop when the proof is sufficient.",
            "On the same target, run the privilege-escalation checklist in the worked example. Identify one escalation path, demonstrate it, and record the hash (not the contents) of `/etc/shadow`.",
            "Write the finding for that escalation path using the five-part structure from the lesson. Include a specific recommendation and a retest procedure.",
            "Apply the fix on the target, rerun the reproduction steps, and confirm they now fail. Write the detection: list two log sources and one alert rule that would have shown your activity.",
          ],
        },
      ],
      challenge:
        "On a TryHackMe or Hack The Box starting machine (or your own lab), document one complete path from enumeration to a proven privilege escalation. Produce a finding in the five-part format, a verified remediation, and a list of the log entries your activity created. Present the finding as if to a non-technical manager in one page.",
      keyPoints: [
        "Explain how CVE identifiers and CVSS scores are assigned, and why a score is not the same as a verified finding",
        "Describe how exploitation usually ends in a shell and how defenders can detect the pattern",
        "Apply the standard Linux privilege-escalation checks in a defined order",
        "Stop at the agreed proof and record evidence without exposing secrets",
        "Write a finding with evidence, impact, a specific recommendation and a retest",
      ],
      exercises: [
        "A scanner reports `Apache 2.4.49`. List the steps you take to decide whether a known weakness in that version is actually exploitable on the target.",
        "Why does a reverse shell succeed where a bind shell is blocked, and what does that imply for outbound firewall rules?",
        "Explain why `sudo -l` showing a command with `NOPASSWD` is a finding even if the command itself looks harmless.",
        "Write the recommendation for a writable cron script that runs as root, in a form that a system administrator could apply in five minutes.",
        "Practical problem: after exploitation, the client asks whether you accessed any customer data. Describe the evidence you keep, how you would answer, and what you would do if you had accidentally read a customer file.",
      ],
    }),
  ],
);
