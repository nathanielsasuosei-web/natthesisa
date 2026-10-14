import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Security · Defensive security.
 *
 * Two lessons: detection (what to log, how to centralise it, how to write a
 * rule that fires on the right thing) and response (hardening and patching
 * priorities, recovery, and the incident-response lifecycle). Both are taught
 * against the same lab machines the offensive lessons used, so each attack has
 * a matching detection and a matching fix.
 */

export const CS_DEFENSIVE_SECURITY_MODULE: CourseModule = module(
  "defensive-security",
  "03 · Defensive security",
  "Seeing attacks in your logs, closing the doors that matter first, and responding without making things worse.",
  [
    lesson({
      id: "logging-detection-and-siem",
      title: "Logging, detection and the SIEM",
      summary:
        "An attack that leaves no trace has not been detected; it has simply not been looked for. This lesson explains how defenders decide what to record, how to collect logs from many systems into one place, how detection rules are written and tested, and how a security information and event management (SIEM) platform turns a flood of events into a short list of things worth a human's attention. It closes with the failure modes that make monitoring useless: silence, noise and rules nobody maintains.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Detection is a probability problem. Every system produces far more events than anyone can read, most of them harmless, and a few that matter are hidden among them. The defender's job is to choose what to record, to make the important events easy to find, and to write rules that are specific enough to fire rarely and sensitive enough to fire when it counts.\n\nThe unit of analysis throughout this lesson is the **event**: a timestamped record that something happened on a system, such as a login, a process start, a connection, a configuration change or a file modification. Everything else is a way of collecting, storing, correlating and deciding about events.",
        },
        {
          heading: "What to log",
          kind: "definition",
          body:
            "Logging everything is expensive and usually counterproductive; logging the right things is the goal. A practical baseline covers five sources:\n\n- **Authentication**: successful and failed logins, privilege elevation (`sudo`), changes to accounts and groups. On Linux these land in `/var/log/auth.log` or the journal; on Windows, the Security event log (4624, 4625, 4672, 4720 are the standard event IDs for logon, failed logon, special privileges and account creation).\n- **Process execution**: which programs start, with which arguments and parents. Linux `auditd` can record `execve` system calls; Windows uses Sysmon event ID 1.\n- **Network**: connections and DNS queries from servers, which should be few and predictable. A web server that starts connecting to new addresses is a strong signal.\n- **File integrity**: changes to configuration and binaries, such as `/etc/passwd`, `/etc/sudoers`, startup scripts and web application code.\n- **Application and cloud control plane**: requests to your application, and administrative actions in the cloud, which are often the most important source of all.\n\nFor each source, decide in advance the **retention** (how long you keep it, usually driven by law and by your ability to investigate a breach discovered months later) and the **owner** who reviews it.",
          code:
            "# Linux: watch every write or attribute change to two sensitive files, tagged for search\nsudo auditctl -w /etc/passwd -p wa -k identity-change\nsudo auditctl -w /etc/sudoers -p wa -k privilege-change\nsudo auditctl -w /etc/sudoers.d/ -p wa -k privilege-change\n\n# Later, find every event with those keys\nsudo ausearch -k identity-change -i | tail -n 20",
          language: "bash",
          codeLabel: "Audit rules that create searchable evidence",
        },
        {
          heading: "Centralisation and the SIEM",
          kind: "paragraph",
          body:
            "Logs stored only on the machine that produced them are of little use after an attacker gains control of it, because the attacker can edit them. **Centralised logging** ships events to a separate system that the source cannot easily change. The standard tools are **rsyslog** or **syslog-ng** for Linux network logs, the **Windows Event Forwarding** feature, and agents such as **Filebeat** or the **Wazuh** agent that send to a central store.\n\nA **SIEM** adds search, correlation, dashboards and alerting on top of that store. Commercial SIEMs (Splunk, Microsoft Sentinel) and open-source stacks (the Elastic Stack, Wazuh with OpenSearch, Graylog) all provide this. Choosing one matters less than three decisions: where the data lives and for how long (which affects Ghana's Data Protection Act obligations when the logs contain personal data), who can read it, and how alerts reach a person who acts on them.",
        },
        {
          heading: "Detection rules: writing, testing and tuning",
          kind: "definition",
          body:
            "A **detection rule** is a condition over events that produces an alert. A good rule is written against a technique the adversary actually uses, which is why detection engineers map rules to the **MITRE ATT&CK** framework, a public catalogue of adversary tactics and techniques (for example T1110, Brute Force, or T1078, Valid Accounts).\n\nA rule has four properties worth checking before it goes live:\n\n1. **Precision**: when it fires, is it usually a real problem? A rule that fires 200 times a day for a backup job will be ignored within a week.\n2. **Recall**: does it catch the technique in the way an attacker would actually perform it, including variants?\n3. **Context**: does the alert include the user, host, source address and time, so that the responder does not need to search for them?\n4. **Owner and response**: who handles it, and what do they do in the first ten minutes?\n\nRules are often written in **Sigma**, a vendor-neutral format that can be converted to the query language of a particular SIEM. The example below detects a burst of failed SSH logins from one source, which corresponds to brute-force guessing.",
          code:
            "title: SSH brute-force from a single source\nid: 0f3c1e52-brute-ssh-burst\nstatus: experimental\ndescription: Five or more failed SSH logins from one address within ten minutes\nlogsource:\n  product: linux\n  service: auth\ndetection:\n  selection:\n    message|contains: 'Failed password'\n  timeframe: 10m\n  condition: selection | count(source_ip) by source_ip > 5\nfalsepositives:\n  - Users behind a shared NAT address who mistype a password repeatedly\n  - Automated monitoring that tests logins\nlevel: medium\ntags:\n  - attack.credential_access\n  - attack.t1110",
          language: "yaml",
          codeLabel: "A Sigma-style rule with its false positives written down",
        },
        {
          heading: "Worked example: from a raw event to an investigated alert",
          kind: "example",
          body:
            "A lab Linux server is attacked with a password-guessing tool. Follow what the defender sees, step by step.\n\n1. **Raw events.** `auth.log` contains 40 lines in two minutes, each `Failed password for root from 192.0.2.44 port 52110`. Individually these are normal; together they form a pattern.\n2. **Rule fires.** The brute-force rule counts five or more failures from `192.0.2.44` in ten minutes and raises an alert with the host, user, source and time window.\n3. **Triage.** The analyst checks whether the source is expected (it is not on the list of administration addresses), whether any login succeeded (search for `Accepted password` from the same address), and whether the same address appears elsewhere in the logs.\n4. **Scoping.** The analyst finds one successful login for `deploy` at 02:14, 30 seconds after the last failure. That changes the incident from attempted to possible compromise.\n5. **Containment.** The source address is blocked at the firewall, the `deploy` password is rotated, and its active sessions are ended. The evidence is copied before anything is deleted.\n6. **Lesson recorded.** The rule's threshold is confirmed, a rule for successful login from a new address is added, and the server is moved behind key-only SSH.\n\nThe alert was the start of the investigation, not its conclusion. Without the detection the success would have gone unnoticed for weeks.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Collecting everything and reading nothing.** Storage is cheap; attention is not. Start with the sources in this lesson and expand deliberately.\n- **Logs on the same machine as the attacker's target.** Ship them off the host as soon as possible.\n- **Rules with no false-positive notes.** A rule without them cannot be tuned, and an untuned rule gets disabled.\n- **Alerting without an owner.** An alert that nobody is assigned is a log entry with extra steps.\n- **Clock drift.** If servers disagree about the time, correlation fails. Synchronise every system with NTP or chrony, and record time in UTC.\n- **Ignoring the blue team's own attack surface.** The SIEM contains credentials and personal data. Restrict who can read it, and log those reads.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["auditd and ausearch", "Kernel-level audit of file access and process execution on Linux", "apt install auditd"],
            ["journalctl and rsyslog", "Reading and forwarding system logs", "Preinstalled on Ubuntu (rsyslog package for forwarding)"],
            ["Suricata", "Network intrusion detection, with rules and file output", "suricata.io"],
            ["Wazuh", "Open-source host and log monitoring with rules and a dashboard", "wazuh.com (documentation covers a single-node install)"],
            ["Elastic Stack (Elasticsearch, Kibana)", "Searching and visualising events", "elastic.co"],
            ["Sigma", "Vendor-neutral detection rules and converters", "github.com/SigmaHQ/sigma"],
            ["MITRE ATT&CK Navigator", "Mapping rule coverage against adversary techniques", "mitre-attack.github.io/attack-navigator"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use the Ubuntu server and the Kali attacker from the offensive lessons, both in your isolated lab. Make a note of the time of every action so that you can match it to the logs.",
          items: [
            "Install `auditd` on the Ubuntu server. Add the two audit rules from the lesson, then edit `/etc/sudoers.d` in a harmless way (add and remove a comment line) and use `ausearch -k privilege-change -i` to find your change.",
            "From the attacker VM, run a short password-guessing test against SSH with a small wordlist that you create for the lab. Count the failed attempts in `/var/log/auth.log` with `grep -c 'Failed password'`.",
            "Write a shell pipeline that prints any source address with five or more failures in the file, and check that it matches your attacker's address.",
            "Install Suricata on the server. Capture a short trace with `tcpdump -w lab.pcap` while you run an nmap scan from the attacker, then process it with `suricata -r lab.pcap -l suricata-out/`. Read the generated `fast.log` and explain one alert.",
            "Write a Sigma rule for a condition of your own choosing (for example, a successful SSH login from an address not on an allow list). Include a description, a false-positive list and an ATT&CK tag.",
            "Map your rules to ATT&CK in the Navigator. Identify one technique you have no rule for and write a sentence on what data you would need to detect it.",
            "Run the scenario in the worked example end to end: attack, alert, triage, containment, lesson. Write the incident timeline in a single table with timestamps in UTC.",
          ],
        },
      ],
      challenge:
        "Build a detection set for the three attacks from the offensive module: a brute-force attempt, a privilege change, and a port scan. For each, write the Sigma rule, the lab command that triggers it, the log evidence it produces, and the false positives you expect. Demonstrate that each rule fires on your attack and stays quiet during an ordinary administrator session.",
      keyPoints: [
        "Choose security-relevant log sources and decide their retention and owner",
        "Explain why centralised, tamper-resistant logs matter after a compromise",
        "Write a detection rule with context, a false-positive list and an ATT&CK mapping",
        "Triage an alert from raw events to a scoped, contained incident",
        "Recognise the failure modes of monitoring: noise, silence and unowned alerts",
      ],
      exercises: [
        "Why is a failed login alone usually not an incident, while a failed login followed by a success from the same address usually is?",
        "Explain why an attacker who gains root on a server can delete its local logs, and describe the two properties a remote log store needs to resist that.",
        "A rule for PowerShell execution produces 500 alerts a day from a software deployment tool. List three tuning options and the risk each one introduces.",
        "Map a credential-dumping technique to an ATT&CK technique identifier and name one data source that would reveal it.",
        "Practical problem: a backup job now runs at 02:00 instead of 03:00 and triggers an unusual-process-execution alert. Describe how you verify the job is legitimate and how you change the rule without weakening it.",
      ],
    }),
    lesson({
      id: "hardening-patching-and-incident-response",
      title: "Hardening, patching and incident response",
      summary:
        "Detection tells you something is wrong; hardening reduces how often it happens, and response decides how much it costs. This lesson sets out how to prioritise hardening and patching when there is always more to do than time, how to protect data with backups that have actually been restored, and how the incident-response lifecycle structures what to do in the first hours of a breach. The examples are drawn from the attacks in the previous lessons, so the response is grounded in a concrete timeline.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Most successful intrusions use known weaknesses in systems that were not updated, accounts that should have been disabled, or services that should not have been exposed. Hardening and patching are therefore the cheapest security work available, and also the least glamorous. Incident response is the expensive counterpart: when prevention has failed, the quality of the first few hours decides whether the organisation contains the damage, preserves the evidence it needs, and recovers.\n\nBoth topics come down to deciding what to do first. This lesson gives a method for those decisions.",
        },
        {
          heading: "Hardening against a benchmark",
          kind: "definition",
          body:
            "A **hardening benchmark** is a consensus list of secure settings for a system. The **CIS Benchmarks** from the Center for Internet Security cover most operating systems, cloud platforms and common applications, and each recommendation states its rationale, its impact and its audit method. Use a benchmark as a checklist, but understand each item: a recommendation that breaks a business process must be a documented, reviewed exception, not a silent omission.\n\nThe method is: choose the benchmark closest to your system, run an automated audit (Lynis, OpenSCAP or the vendor's tool), fix the items with the highest risk first, verify each fix with the audit method, and record the exceptions. Re-audit after every significant change, because configuration drifts.",
        },
        {
          heading: "Patching by risk, not by date",
          kind: "paragraph",
          body:
            "Patching everything at once is impossible for most organisations, so priority matters. Three signals help: the **CVSS** severity (discussed in the ethical hacking module), whether the vulnerability is **known to be exploited** (the US Cybersecurity and Infrastructure Security Agency keeps a public Known Exploited Vulnerabilities catalogue, which is the most useful single list for prioritising), and **exposure**, meaning whether the affected service is reachable from places an attacker can reach.\n\nA sensible policy sets a fast timeline for anything on the exploited list or internet-facing, a normal timeline for high-severity internal issues, and a scheduled cycle for the rest. Automatic security updates, as in the Linux hardening lesson, handle the routine majority; the policy is for what needs a human decision, such as a change that breaks an application.",
        },
        {
          heading: "Backups that work",
          kind: "definition",
          body:
            "A backup is only as good as its last successful restore. The **3-2-1** rule is the baseline: three copies of the data, on two different kinds of storage, with one copy off-site or **immutable** (cannot be altered or deleted by a compromised administrator account for a set period). Ransomware specifically targets backups that are reachable from the infected system, which is why immutability and separate credentials matter.\n\nTest restores on a schedule and time them, because the recovery time objective (RTO) and recovery point objective (RPO) are promises you cannot verify any other way. A restore that has never been run is a hope, not a control.",
          code:
            "# Create an encrypted, deduplicated backup with restic (an open-source tool)\nexport RESTIC_REPOSITORY=sftp:backup@backup.internal:/srv/restic-lab\nexport RESTIC_PASSWORD_FILE=/root/.restic-pass\nrestic init\nrestic backup /srv/app --tag nightly\n\n# The test that matters: restore to a scratch directory and compare\nrestic restore latest --target /tmp/restore-test\ndiff -r /srv/app /tmp/restore-test/srv/app && echo 'restore verified'",
          language: "bash",
          codeLabel: "A backup and the restore test that proves it",
        },
        {
          heading: "The incident-response lifecycle",
          kind: "definition",
          body:
            "NIST Special Publication 800-61 describes incident response in four phases, which are repeated as the incident evolves:\n\n1. **Preparation**: policy, a response team with named roles, contact lists, tools, evidence-handling procedures and rehearsed playbooks.\n2. **Detection and analysis**: deciding whether an event is an incident, how severe it is, what it touched, and how it began. Document everything with timestamps in UTC.\n3. **Containment, eradication and recovery**: stop the spread first (isolate the host, block the address, disable the account), then remove the cause, then restore service from known-good sources and monitor closely.\n4. **Post-incident activity**: a blameless review, a timeline, the root cause, the detection gap, and tracked actions with owners and dates.\n\nIn Ghana, organisations that run critical information infrastructure have reporting obligations under the Cybersecurity Act, 2020 (Act 1038), and the Cyber Security Authority is the body to contact. Check the current reporting rules for your sector and build the notification step into your playbook before you need it.",
        },
        {
          heading: "Worked example: a ransomware alert, hour by hour",
          kind: "example",
          body:
            "A file server begins renaming documents with a new extension at 14:05 on a Tuesday. The team follows the playbook.\n\n- **14:07 (detection)**: the monitoring alert for mass file modification fires. The on-call analyst confirms the activity from the audit logs and the file listing.\n- **14:12 (containment)**: the host is isolated from the network, but not powered off, because the running memory and the process list are evidence. The service account used for the share is disabled.\n- **14:25 (scoping)**: the logs show the account authenticated from a host in the finance team's VLAN, which was last patched four months ago. Two other hosts show the same extension.\n- **14:40 (evidence)**: the analyst copies the audit logs, the process list and the suspicious binary to a case folder, records a SHA-256 hash of each file with `sha256sum`, and notes who handled them and when.\n- **15:30 (eradication)**: the other two hosts are isolated, the finance host is rebuilt from the golden image, and the account's credentials are reset.\n- **Next day (recovery)**: files are restored from the immutable backup. The restore is verified against the hash manifest, and service is resumed in stages.\n- **Next week (post-incident)**: the review finds the patch gap, the missed alert threshold and the unrehearsed contact list. Three actions are assigned, with owners and dates.\n\nThe response worked because the playbook already existed, the backups were immutable, and the evidence was hashed before anything was changed.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Powering off the machine first.** This destroys volatile evidence. Isolate the network first, unless the playbook says otherwise for a specific threat.\n- **Cleaning up before recording.** Deleting the malware before the timeline is written loses the only record of how it got in.\n- **Restoring from a backup that the attacker can reach.** Confirm the backup predates the compromise and is stored where the attacker could not change it.\n- **Patching only what the scanner shows.** Scanners miss what they are not configured to see. Inventory first.\n- **Treating the post-incident review as blame.** People will hide what they did if they fear punishment, and the next incident will be harder to understand.\n- **No rehearsal.** A playbook that has never been run will fail at the first real incident in ways nobody predicted.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Lynis", "Auditing a Linux system against hardening guidance", "cisofy.com/lynis"],
            ["OpenSCAP", "Automated checks against SCAP security content and benchmarks", "open-scap.org"],
            ["restic", "Encrypted, deduplicated backups with verifiable restores", "restic.net"],
            ["CISA Known Exploited Vulnerabilities catalogue", "The list to patch first", "cisa.gov (Known Exploited Vulnerabilities Catalog)"],
            ["sha256sum and tar", "Hashing and packaging evidence for integrity", "coreutils and tar, preinstalled"],
            ["NIST SP 800-61 Rev. 2", "The reference for the incident-response lifecycle", "csrc.nist.gov"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use the lab server and the attacker VM from the previous lessons. Record each step with a timestamp, as an analyst would during a real incident.",
          items: [
            "Run `sudo lynis audit system` on the server. Choose three warnings, fix them, and rerun Lynis to show the change in the hardening index.",
            "Create a restic repository on a second VM (or a local directory for a first attempt). Back up `/srv/app` with a tag, then restore to a scratch directory and compare with `diff -r`. Time the backup and the restore.",
            "Simulate a mass-modification event: create 200 files in `/srv/app/docs`, then rename each one to add `.locked`. Confirm your audit rule or Suricata alert (from the previous lesson) recorded the activity.",
            "Follow the containment steps in the worked example: disconnect the server from the lab network with a firewall rule rather than powering it off, and disable the account used for the activity.",
            "Collect evidence: copy `/var/log/auth.log`, `/var/log/audit/audit.log` and the output of `ps auxf` to a case folder, compute `sha256sum` for each, and record the hash list in a manifest file with the time you ran each command.",
            "Restore the server from the backup, verify the restore against the manifest, and bring the account back with a new password.",
            "Write a blameless post-incident review of the exercise in one page: timeline, root cause, detection gap, and three actions with owners and dates.",
          ],
        },
      ],
      challenge:
        "Run a tabletop exercise with a partner. One person plays the attacker and makes a series of moves against the lab server; the other runs the playbook you wrote, recording timestamps in UTC. Afterwards, produce the timeline, the evidence manifest, the restore verification and a blameless review with three actions. Judge your own response against the four NIST phases.",
      keyPoints: [
        "Apply a hardening benchmark, verify each control and document exceptions",
        "Prioritise patches using exploitation status, exposure and severity",
        "Design a backup strategy with immutability and tested restores",
        "Walk through the four NIST incident-response phases with a concrete timeline",
        "Preserve evidence with hashes and a manifest before cleaning up",
      ],
      exercises: [
        "Explain why isolating a host from the network is usually a better first step than powering it off during an incident.",
        "A vulnerability has a CVSS score of 7.5 and is on the CISA known-exploited list, but the affected server is internal and patched weekly. Set the patch timeline and justify it.",
        "Why does a backup that is reachable with the administrator's credentials fail as a ransomware defence, and what property must it have instead?",
        "Describe what should be in a post-incident review that makes the next response faster, and what should be left out of it.",
        "Practical problem: during an incident, a senior manager asks you to 'just delete the malicious file and get the server back'. Write the reply you would give, explaining the evidence and the sequence you would follow.",
      ],
    }),
  ],
);
