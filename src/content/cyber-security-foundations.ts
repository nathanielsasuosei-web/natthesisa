import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security Foundations.
 *
 * Three modules, matching the program outline: networking, Linux and
 * programming. Everything a security course assumes you already know,
 * taught properly — how packets travel, how a Linux box is actually
 * administered, and enough Python to automate the boring parts.
 */

export const CYBER_SECURITY_FOUNDATIONS_MODULES: CourseModule[] = [
  module("networking", "01 · Networking", "How data moves, and where it can be watched or changed.", [
    lesson({
      id: "how-the-internet-moves-data",
      title: "How the internet moves data",
      summary:
        "Before you can secure a network you must be able to picture one. This lesson builds that picture: the layered model, IP addresses and ports, how a request leaves your laptop and comes back, and where along the way somebody could listen in or interfere.",
      sections: [
        {
          heading: "The layered model",
          kind: "definition",
          body:
            "Networking is organised in **layers**, each solving one problem and handing the result to the layer above. The practical version (the TCP/IP model) has four:\n\n- **Link** — gets bits across one physical hop: Ethernet, Wi-Fi. Addresses here are **MAC addresses**, baked into the network card.\n- **Internet** — gets a packet across *many* hops to the right machine. The address is the **IP address** (`192.168.1.20`, or `2001:db8::1` for IPv6). Routers live here.\n- **Transport** — gets data to the right *program* on that machine, using a **port** number. **TCP** promises in-order, complete delivery; **UDP** sends and hopes.\n- **Application** — the protocol your program speaks: HTTP, DNS, SSH, SMTP.\n\nA security person cares about the layers because **every layer is an attack surface**. A fake MAC address, a spoofed IP, a port left open, a protocol that sends passwords in plain text — each is a weakness at one specific layer, and the defence lives at that layer too.",
        },
        {
          heading: "Addresses and ports",
          kind: "paragraph",
          body:
            "An **IP address** identifies a machine on a network. Addresses in the ranges `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16` are **private**: they are only meaningful inside your home or office, and your router translates them to one public address on the way out (**NAT**). The `/24` suffix is **CIDR notation** — it says how many leading bits are the network part. `192.168.1.0/24` is the 256 addresses from `.0` to `.255`.\n\nA **port** identifies a program on that machine. Well-known ones you will meet constantly:\n\n- `22` SSH · `53` DNS · `80` HTTP · `443` HTTPS · `25` SMTP · `3306` MySQL · `5432` PostgreSQL · `3389` Remote Desktop.\n\nAn open port is a door. Scanning for open ports is the first thing an attacker does, and closing the ones you do not need is the first thing a defender does.",
        },
        {
          heading: "Worked example: what happens when you open a website",
          kind: "example",
          body:
            "You type `https://codemasterghana.com` and press Enter.\n\n1. **DNS** — your laptop asks a DNS server (port 53, usually UDP) \"what is the IP for this name?\" and gets back an address such as `76.76.21.21`. Anyone who can answer that question *for* you — a poisoned resolver, a rogue Wi-Fi hotspot — can send you to the wrong server.\n2. **TCP handshake** — your laptop sends `SYN` to port 443, the server replies `SYN-ACK`, you reply `ACK`. A connection exists.\n3. **TLS handshake** — the server shows a certificate proving it owns the name; you both agree on keys. From now on the contents are encrypted. Without this (plain `http://`) every router between you and the server can read and alter the page.\n4. **HTTP** — `GET / HTTP/1.1` goes up; HTML comes back.\n5. Every one of those packets passed through your router, your ISP, several backbone routers and the hosting provider. Each saw the *destination IP and port* even with TLS — metadata is never hidden by HTTPS.",
          code:
            "$ dig +short codemasterghana.com\n76.76.21.21\n\n$ curl -v https://codemasterghana.com 2>&1 | head -n 12\n*   Trying 76.76.21.21:443...\n* Connected to codemasterghana.com (76.76.21.21) port 443\n* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256\n* Server certificate:\n*  subject: CN=codemasterghana.com\n*  issuer: C=US; O=Let's Encrypt; CN=R11\n> GET / HTTP/1.1\n> Host: codemasterghana.com",
          language: "bash",
          codeLabel: "Watching the steps happen",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **\"HTTPS hides everything.\"** It hides the *contents*. Which server you talked to, when, and how much data moved are all visible.\n- **\"Private IPs are safe because they are private.\"** They are unreachable from the internet by default, but anything that gets *inside* the network — a phishing link, an infected laptop — sees all of them.\n- **Confusing IP with identity.** IPs change, are shared behind NAT, and can be spoofed in UDP. They are a clue, not proof.\n- **Ignoring UDP.** DNS, VoIP and many games use UDP. Firewalls that only think about TCP leave it wide open.",
        },
      ],
      challenge:
        "On your own machine, run `ip addr` (or `ipconfig`) to find your private IP and subnet, `dig` or `nslookup` for three sites you use, and `curl -v` against one of them. Write down each layer you can see in the output.",
      keyPoints: [
        "Name the four layers and the address each one uses",
        "Read CIDR notation and tell private addresses from public ones",
        "Trace a web request from DNS to HTTP",
        "Explain what HTTPS protects and what it does not",
      ],
      exercises: [
        "Which layer does a Wi-Fi password protect? Which does a firewall rule on port 22 protect?",
        "How many usable addresses are in `10.1.0.0/16`?",
        "A colleague says \"we use HTTPS, so our ISP cannot tell we use Slack\". Correct them precisely.",
        "Capture a DNS query with `tcpdump -i any port 53` (or Wireshark) and identify the query and the answer.",
      ],
    }),
    lesson({
      id: "protocols-firewalls-and-scanning",
      title: "Protocols, firewalls and port scanning",
      summary:
        "Security work happens at the boundary between what a network allows and what it should allow. This lesson covers the protocols you will see most, how a firewall decides, what a port scan shows you, and how to read an `nmap` result like a professional instead of a tourist.",
      sections: [
        {
          heading: "Protocols worth knowing by heart",
          kind: "table",
          rows: [
            ["Protocol", "Port", "Encrypted?", "What attackers do with it"],
            ["HTTP", "80", "No", "Read and modify traffic, inject scripts"],
            ["HTTPS", "443", "Yes", "Attack the application behind it, not the wire"],
            ["SSH", "22", "Yes", "Brute-force weak passwords, steal keys"],
            ["DNS", "53", "Usually no", "Redirect victims, tunnel data out"],
            ["SMTP", "25/587", "Optional", "Spoof senders, relay spam"],
            ["FTP / Telnet", "21 / 23", "No", "Capture passwords in plain text — never use"],
            ["RDP", "3389", "Yes", "Brute-force, exploit; the top ransomware entry point"],
            ["SMB", "445", "Partly", "Worms (WannaCry), lateral movement inside a LAN"],
          ],
        },
        {
          heading: "How a firewall decides",
          kind: "paragraph",
          body:
            "A **firewall** is a list of rules checked in order against every packet: *source, destination, port, protocol* → *allow or drop*. The last rule should be **deny everything**, so that anything you forgot is closed by default. This is the **default-deny** principle and it is the single most valuable habit in defensive security.\n\nTwo places to run one:\n\n- **Network firewall** — at the edge, in front of many machines (the router, a cloud security group).\n- **Host firewall** — on the machine itself (`ufw`, `iptables`/`nftables`, Windows Firewall). Keep both: the edge stops the internet, the host stops the laptop next to you.\n\nA firewall only sees *addresses and ports*. It cannot tell a legitimate HTTPS request from a malicious one — that is the application's job, which is why the Security course spends so long on web attacks.",
          code:
            "# Ubuntu host firewall: default deny, then open only what runs here\nsudo ufw default deny incoming\nsudo ufw default allow outgoing\nsudo ufw allow from 196.0.0.0/8 to any port 22 proto tcp   # SSH, only from your ISP range\nsudo ufw allow 443/tcp\nsudo ufw enable\nsudo ufw status numbered",
          language: "bash",
          codeLabel: "Default deny on a web server",
        },
        {
          heading: "Worked example: reading a port scan",
          kind: "example",
          body:
            "`nmap` sends probes to a range of ports and reports which answered. **Only scan machines you own or have written permission to test** — scanning strangers is illegal in Ghana under the Cybersecurity Act 2020 and almost everywhere else.\n\nRead the output like this:\n\n- `open` — a program answered. That is attack surface; ask *why is it there?*\n- `closed` — the machine replied \"nothing here\". The host is alive but that door is shut.\n- `filtered` — no reply. A firewall dropped the probe. This is what you *want* to see for everything you do not serve.\n\nIn the scan below, port 22 is open to the whole world and port 3306 (MySQL) is open — a database should never be reachable from outside. Those two lines are the findings. Port 443 is expected.",
          code:
            "$ nmap -sV -Pn 10.0.0.15\nPORT     STATE    SERVICE  VERSION\n22/tcp   open     ssh      OpenSSH 8.9p1 Ubuntu\n80/tcp   closed   http\n443/tcp  open     ssl/http nginx 1.24.0\n3306/tcp open     mysql    MySQL 8.0.36\n8080/tcp filtered http-proxy",
          language: "text",
          codeLabel: "A scan with two findings",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Allow-listing by adding rules on top of \"allow all\".** The default must be deny or the list means nothing.\n- **Leaving databases and admin panels on public ports** \"because they have a password\". Passwords get guessed; unreachable services do not.\n- **Treating `filtered` as broken.** It is working as intended.\n- **Scanning without permission.** Write the authorisation down before you type `nmap`.",
        },
      ],
      challenge:
        "Install `nmap` and scan `localhost` and one machine you own on your home network. For every open port, write one line: what service it is, whether you need it, and the firewall rule that would close or restrict it.",
      keyPoints: [
        "Recall the common ports and whether each protocol is encrypted",
        "Write default-deny firewall rules on a Linux host",
        "Tell open, closed and filtered apart in a scan",
        "Turn a scan result into a short list of findings",
      ],
      exercises: [
        "Why should SSH be restricted by source address even though it is encrypted?",
        "A server shows ports 22, 80, 443 and 6379 open. Which line is the emergency, and why?",
        "Write `ufw` rules for a machine that serves HTTPS and accepts SSH only from `10.0.0.0/24`.",
        "Explain default-deny to a shop owner who just bought a router, in two sentences.",
      ],
    }),
  ]),

  module("linux", "02 · Linux", "The operating system every server, firewall and attacker's laptop runs.", [
    lesson({
      id: "the-shell-and-the-filesystem",
      title: "The shell and the filesystem",
      summary:
        "Almost every server you will defend or test runs Linux, and almost every security tool is a command-line program. This lesson gets you fluent at the shell: moving around, reading and searching files, chaining commands, and knowing where Linux keeps the things that matter to security.",
      sections: [
        {
          heading: "Why the shell",
          kind: "paragraph",
          body:
            "The **shell** (usually `bash`) is a program that reads a command, runs it and prints the result. It is faster than a GUI for anything repetitive, it works over SSH on a server with no screen, and it can be scripted. Security tooling — `nmap`, `tcpdump`, `grep` across logs, `openssl` — assumes you are comfortable here.\n\nThe commands you will use every day:\n\n- `pwd`, `ls -la`, `cd` — where am I, what is here, go there.\n- `cat`, `less`, `head`, `tail -f` — read a file; `tail -f` follows a log as it grows.\n- `grep -r \"pattern\" dir` — search; `find / -name \"*.pem\"` — locate files.\n- `|` — pipe one command's output into the next. `sort | uniq -c | sort -rn` counts occurrences.\n- `sudo` — run as root. Every `sudo` is logged; treat it as a signed statement.",
        },
        {
          heading: "Where things live",
          kind: "table",
          rows: [
            ["Path", "What is there", "Why security cares"],
            ["/etc", "System configuration", "`/etc/passwd`, `/etc/shadow`, `/etc/ssh/sshd_config` decide who can log in"],
            ["/var/log", "Logs", "`auth.log`, `syslog`, web server logs — the evidence after an incident"],
            ["/home, /root", "User files", "SSH keys in `~/.ssh`, shell history in `~/.bash_history`"],
            ["/tmp", "Scratch space, world-writable", "Favourite drop point for malware"],
            ["/proc", "Live kernel and process view", "`/proc/<pid>/` shows what a process is really doing"],
            ["/usr/bin, /usr/sbin", "Programs", "A modified binary here is a classic backdoor"],
          ],
        },
        {
          heading: "Worked example: who tried to log in last night?",
          kind: "example",
          body:
            "A server felt slow this morning. The authentication log is the first place to look. The pipeline below pulls every failed SSH password attempt, extracts the source IP, and counts them. The result is a small table of attackers, sorted by effort — exactly what you would block or report.",
          code:
            "$ sudo grep \"Failed password\" /var/log/auth.log \\\n    | grep -oE '([0-9]{1,3}\\.){3}[0-9]{1,3}' \\\n    | sort | uniq -c | sort -rn | head\n   4123 185.220.101.47\n    988 45.155.205.233\n     61 102.176.65.12\n\n$ sudo tail -n 3 /var/log/auth.log\nOct 13 02:14:51 web sshd[8812]: Failed password for root from 185.220.101.47 port 51012 ssh2\nOct 13 02:14:53 web sshd[8812]: Failed password for root from 185.220.101.47 port 51012 ssh2\nOct 13 02:14:55 web sshd[8814]: Failed password for admin from 185.220.101.47 port 51020 ssh2",
          language: "bash",
          codeLabel: "Four thousand guesses from one address",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Working as root all day.** One typo in `rm -rf` and the box is gone. Use a normal user and `sudo` per command.\n- **Not reading `ls -la`.** The `-a` shows hidden dotfiles (`.ssh`, `.env`) where secrets hide; the `-l` shows permissions and owners.\n- **Pasting commands from the internet into `sudo`.** Read them first. `curl … | sudo bash` runs a stranger's script as root.\n- **Forgetting that history is a file.** Passwords typed on the command line end up in `~/.bash_history`.",
        },
      ],
      challenge:
        "On a Linux machine or VM, find every file named `*.log` under `/var/log` modified in the last day, then use a pipeline to list the ten most common lines in one of them.",
      keyPoints: [
        "Move, read and search with the core shell commands",
        "Chain commands with pipes to answer questions from logs",
        "Know the directories that matter for configuration, logs and secrets",
        "Use `sudo` deliberately rather than living as root",
      ],
      exercises: [
        "What is the difference between `>` and `>>`? Why does it matter when writing to a log?",
        "Write a one-line pipeline that counts the distinct usernames attackers tried in `auth.log`.",
        "Why is `/tmp` a common place to find malware, and what mount option reduces the risk?",
        "Use `find` to list all world-writable files under `/etc`. Should there be any?",
      ],
    }),
    lesson({
      id: "users-permissions-and-hardening",
      title: "Users, permissions and hardening",
      summary:
        "Linux security starts with a simple question: who is allowed to do what? This lesson covers users and groups, the permission bits and what they really mean, the dangerous special bits, SSH keys instead of passwords, and the short hardening checklist that stops most automated attacks on a fresh server.",
      sections: [
        {
          heading: "Users, groups and permission bits",
          kind: "definition",
          body:
            "Every file has an **owner**, a **group**, and three sets of permissions — for the owner, the group, and everyone else. Each set is **r**ead, **w**rite, e**x**ecute. `ls -l` prints them as `-rwxr-x---`: owner can do everything, group can read and run, others nothing.\n\nNumerically, `r=4, w=2, x=1`, so that string is `750`. `chmod 600 ~/.ssh/id_ed25519` means \"only I can read or write my private key\" — and SSH refuses to use a key that is any more open than that.\n\nFor **directories**, `x` means \"can enter\" and `r` means \"can list\". A directory with `--x` lets you reach a file inside if you know its name, but not browse.\n\n**Root** (user id 0) ignores all of this. That is why every attack ultimately aims at root, and why `sudo` access must be given sparingly: `sudo` *is* root.",
        },
        {
          heading: "The special bits",
          kind: "paragraph",
          body:
            "- **setuid** (`4000`, shown as `s` in the owner's `x` slot) — the program runs *as its owner*, not as you. `passwd` is setuid root so you can change your own password inside `/etc/shadow`. A setuid root binary with a bug is a straight path to root; `find / -perm -4000 -type f` lists them, and you should know every one on your servers.\n- **setgid** (`2000`) — same idea for the group; on directories, new files inherit the group.\n- **sticky** (`1000`, the `t` on `/tmp`) — in a shared directory, only a file's owner can delete it.",
          code:
            "$ ls -l /usr/bin/passwd\n-rwsr-xr-x 1 root root 68208 /usr/bin/passwd\n\n$ find / -perm -4000 -type f 2>/dev/null\n/usr/bin/sudo\n/usr/bin/passwd\n/usr/bin/su\n/opt/backup/helper        # <- not standard. Investigate.",
          language: "bash",
          codeLabel: "Listing setuid binaries — the unexpected one is the finding",
        },
        {
          heading: "Worked example: hardening a fresh server in ten minutes",
          kind: "example",
          body:
            "A new Ubuntu VM comes with root login over SSH by password. Within an hour it will be receiving thousands of guesses. The sequence below is the minimum that turns it into something you can leave on the internet: a normal user with a key, SSH locked down, automatic security updates, a default-deny firewall, and `fail2ban` to ban repeat offenders.",
          code:
            "# 1. A normal user with sudo and your public key\nadduser nana && usermod -aG sudo nana\nmkdir -p /home/nana/.ssh && cp ~/.ssh/authorized_keys /home/nana/.ssh/\nchown -R nana:nana /home/nana/.ssh && chmod 700 /home/nana/.ssh && chmod 600 /home/nana/.ssh/authorized_keys\n\n# 2. Lock SSH: keys only, no root\nsed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config\nsed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config\nsystemctl restart ssh\n\n# 3. Patches without you remembering\napt update && apt install -y unattended-upgrades fail2ban\ndpkg-reconfigure -plow unattended-upgrades\n\n# 4. Default deny\nufw default deny incoming && ufw allow 22/tcp && ufw allow 443/tcp && ufw enable\n\n# 5. Check it took\nsshd -T | grep -E 'permitrootlogin|passwordauthentication'\nfail2ban-client status sshd",
          language: "bash",
          codeLabel: "Test the new login in a second terminal before you close the first",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **`chmod 777` to make an error go away.** You just let every process on the machine edit that file. Find the right owner instead.\n- **Locking yourself out.** Always test a new SSH configuration in a second session before closing the working one.\n- **Sharing one account.** When three people are `ubuntu`, the logs tell you nothing. One user per human.\n- **Never patching.** Most compromised Linux servers were running a fix that had existed for months.",
        },
      ],
      challenge:
        "Spin up a free-tier or local VM, harden it with the sequence above, then confirm from another machine that password login is refused and `nmap` shows only ports 22 and 443.",
      keyPoints: [
        "Read and set permissions in symbolic and numeric form",
        "Explain setuid, setgid and the sticky bit and audit for them",
        "Replace SSH passwords with keys and disable root login",
        "Apply a baseline hardening checklist to a new server",
      ],
      exercises: [
        "What does `-rw-r--r--` on `/etc/shadow` mean, and what should it be?",
        "A script needs to write to `/var/www/uploads`. Design owner, group and mode without using `777`.",
        "Why is a setuid root copy of `bash` in `/tmp` a critical finding?",
        "List three things `fail2ban` cannot protect you from.",
      ],
    }),
  ]),

  module("programming", "03 · Programming for security", "Enough Python to automate, parse and prove.", [
    lesson({
      id: "python-for-security-work",
      title: "Python for security work",
      summary:
        "You do not need to be a software engineer to work in security, but you do need to automate. This lesson teaches the slice of Python that security people actually use: reading files and logs, string handling, HTTP requests, sockets, and turning a repetitive manual check into a script you can run every day.",
      sections: [
        {
          heading: "Why Python, and which parts",
          kind: "paragraph",
          body:
            "Python is the default language of security tooling: most proof-of-concept exploits, log parsers and cloud audit scripts are written in it, and it is installed on nearly every Linux box. You need five things:\n\n- **Strings and files** — `open()`, `.split()`, `.strip()`, f-strings, and `re` for regular expressions.\n- **Collections** — lists, dicts and `collections.Counter` for counting things.\n- **HTTP** — the `requests` library to call APIs and test web endpoints.\n- **Sockets** — the `socket` module to talk to a port directly.\n- **Running commands** — `subprocess.run()` to wrap existing tools.\n\nEverything else — classes, async, packaging — can wait until you need it.",
        },
        {
          heading: "Worked example: a log parser",
          kind: "example",
          body:
            "The `grep | sort | uniq` pipeline from the Linux module works, but a script can do more: group by user *and* address, flag anything above a threshold, and be scheduled. The program below reads `auth.log`, extracts failed logins with a regular expression, counts per source IP, and prints the ones that exceed fifty attempts. Note the pattern — **read, extract, count, decide** — because almost every security script is this shape.",
          code:
            "import re\nfrom collections import Counter\n\nPATTERN = re.compile(r\"Failed password for (?:invalid user )?(\\S+) from (\\d+\\.\\d+\\.\\d+\\.\\d+)\")\nTHRESHOLD = 50\n\nby_ip = Counter()\nusers_by_ip = {}\n\nwith open(\"/var/log/auth.log\", errors=\"ignore\") as log:\n    for line in log:\n        match = PATTERN.search(line)\n        if not match:\n            continue\n        user, ip = match.groups()\n        by_ip[ip] += 1\n        users_by_ip.setdefault(ip, set()).add(user)\n\nfor ip, count in by_ip.most_common():\n    if count < THRESHOLD:\n        break\n    users = \", \".join(sorted(users_by_ip[ip])[:5])\n    print(f\"{ip:<16} {count:>6} attempts  users: {users}\")",
          language: "python",
          codeLabel: "brute_force_report.py",
        },
        {
          heading: "Worked example: a tiny port checker",
          kind: "example",
          body:
            "Sometimes you want to confirm that a port is closed *from the outside* without installing `nmap`. A socket with a short timeout is enough. Run this only against hosts you are authorised to test.",
          code:
            "import socket, sys\n\nhost = sys.argv[1]\nports = [22, 80, 443, 3306, 5432, 6379, 3389]\n\nfor port in ports:\n    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:\n        s.settimeout(1.0)\n        state = \"open\" if s.connect_ex((host, port)) == 0 else \"closed/filtered\"\n        print(f\"{port:>5}  {state}\")",
          language: "python",
          codeLabel: "portcheck.py — python3 portcheck.py 10.0.0.15",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Hard-coding secrets in scripts.** API keys belong in environment variables (`os.environ[\"API_KEY\"]`), never in the file you will later push to GitHub.\n- **Building a regex without testing it.** Paste three real log lines into a test first; a regex that silently matches nothing produces a report that says \"all clear\".\n- **No timeouts on network calls.** A script that hangs forever on one dead host never finishes the other 200.\n- **Writing a 500-line tool when `grep` would do.** Script when you need logic or scheduling, not to avoid learning the shell.",
        },
      ],
      challenge:
        "Write a Python script that reads a web server access log, counts requests per IP, and prints any IP that requested more than 20 different URLs containing `admin`, `wp-login` or `.env`. Those are scanners.",
      keyPoints: [
        "Read files line by line and extract fields with regular expressions",
        "Count and rank with `Counter`",
        "Make HTTP and raw socket connections with timeouts",
        "Recognise the read–extract–count–decide shape of security scripts",
      ],
      exercises: [
        "Modify the brute-force report to also print the first and last timestamp seen for each IP.",
        "Use `requests` to fetch the headers of a site you own and print whether `Strict-Transport-Security` is present.",
        "Why is `errors=\"ignore\"` used when opening the log? What could go wrong without it?",
        "Wrap `nmap -sV` with `subprocess.run` and parse out just the open ports.",
      ],
    }),
  ]),
];
