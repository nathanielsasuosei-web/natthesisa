import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Foundations · Linux.
 *
 * Two lessons: the shell and the filesystem (where things live and how to find
 * them), and users, permissions and hardening (who can do what, and how a
 * server is locked down). Linux is the operating system of most servers,
 * containers and security tools, so every practical runs on a Linux machine.
 */

export const CS_LINUX_MODULE: CourseModule = module(
  "linux",
  "02 · Linux",
  "The operating system behind most servers, containers and security tools, and how to run it safely.",
  [
    lesson({
      id: "the-shell-and-the-filesystem",
      title: "The shell and the filesystem",
      summary:
        "Almost every server on the internet runs Linux, and almost every security tool is built for it. The shell is the language you use to ask the system questions and change its state, and the filesystem is the map of where configuration, logs, secrets and programs live. This lesson teaches the layout of a Linux system, the commands for moving through it and searching it, how to read and redirect output, and how to find the evidence that matters when something goes wrong.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "A security engineer spends a surprising share of their working day in a terminal. Logs, firewall rules, certificates, containers and cloud command-line tools all present themselves as text on a Linux shell. Fluency is not about memorising hundreds of flags; it is about knowing where to look, how to ask a precise question, and how to avoid changing something by accident.\n\nThe lesson assumes you can open a terminal and type a command. Everything else is built up from the filesystem outwards.",
        },
        {
          heading: "The filesystem hierarchy",
          kind: "definition",
          body:
            "Linux presents every resource as a file under a single root, `/`. There are no drive letters. The directories follow a convention called the **Filesystem Hierarchy Standard**, and knowing it tells you where to look before you search:\n\n- `/etc` holds system-wide configuration: `/etc/ssh/sshd_config`, `/etc/passwd`, `/etc/nginx/`. Almost every hardening task edits a file here.\n- `/var/log` holds logs. On Debian and Ubuntu, `auth.log` records logins and `sudo` use; `syslog` records most other services; with systemd, `journalctl` reads the journal.\n- `/home` holds user home directories. `~` is shorthand for your own.\n- `/root` is the root user's home, separate from `/home`.\n- `/bin`, `/usr/bin` and `/sbin`, `/usr/sbin` hold programs. Check with `which` which one will run.\n- `/tmp` is world-writable and cleared on reboot. It is a common place for attackers to drop files, and a common place to look for them.\n- `/proc` and `/sys` are not on disk at all. They are windows into the running kernel, and `/proc/<pid>/` describes each running process.\n\nEverything, including devices, is a file. A **symbolic link** is a file that points at another path, and it is one of the first things to check when a path behaves oddly.",
        },
        {
          heading: "Worked example: from a suspicious process to its evidence",
          kind: "example",
          body:
            "Suppose `top` shows an unfamiliar process consuming CPU. Trace it using only the shell.\n\n1. `ps -eo pid,user,lstart,cmd --sort=-%cpu | head` lists processes by CPU use, with the owner, start time and full command line. Note the process ID (PID).\n2. `ls -l /proc/4321/exe` shows the executable that the process was started from. A binary running from `/tmp` or from a directory with no package owner is a warning sign.\n3. `ls -l /proc/4321/cwd` shows the working directory, and `cat /proc/4321/cmdline | tr '\\0' ' '` shows the arguments.\n4. `ls -l /proc/4321/fd` lists the open files and sockets. A socket to an unknown address is the most important line on the screen.\n5. `ss -tnp | grep 4321` ties the process to its network connections, with the remote address and port.\n6. `grep -r 'sshd\\|cron' /var/log/auth.log` (or `journalctl -u cron --since today`) searches the logs for when and how the process was started.\n\nNo single command answers the question. The answer comes from following one identifier, the PID, through several views of the same system. That habit is more valuable than any individual tool.",
          code:
            "# Who is using the CPU, and from where did they start?\nps -eo pid,user,lstart,cmd --sort=-%cpu | head -n 6\nls -l /proc/4321/exe\nss -tnp | grep 4321\n\n# Search system logs for the same process name\ngrep -i 'miner\\|nc ' /var/log/auth.log /var/log/syslog 2>/dev/null | tail -n 20",
          language: "bash",
          codeLabel: "Following one PID through the system",
        },
        {
          heading: "Pipes, redirection and searching",
          kind: "paragraph",
          body:
            "The power of the shell comes from composing small programs. Each reads from **standard input** (stdin), writes to **standard output** (stdout) and reports problems on **standard error** (stderr). Three operators connect them:\n\n- `|` sends one program's output into the next program's input.\n- `>` writes output to a file, replacing it; `>>` appends. `2>` redirects errors; `2>/dev/null` discards them.\n- `<` reads a file as input.\n\nThe search tools you will use constantly are `grep` (find lines matching a pattern), `find` (find files by name, owner, age or permission), `awk` (split lines into fields and compute on them) and `sort | uniq -c | sort -rn` (count and rank). Learn these well before reaching for a heavier tool; a surprising amount of incident response is these four commands in a pipeline.",
          code:
            "# Top 10 source IPs that failed SSH logins, from the authentication log\ngrep 'Failed password' /var/log/auth.log \\\n  | awk '{ print $(NF-3) }' \\\n  | sort | uniq -c | sort -rn | head -n 10\n\n# Files owned by no user in any package (possible leftovers), modified this week\nfind / -xdev -type f -mtime -7 -nouser 2>/dev/null | head -n 20",
          language: "bash",
          codeLabel: "Two pipelines an analyst runs in the first hour of an investigation",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Running everything as root.** `sudo` for a single command is the discipline; a root shell left open is a standing risk. Never use `chmod -R 777` to fix a permission error, because it removes every protection the file had.\n- **Pasting commands from strangers.** A `curl ... | sudo bash` line runs whatever the server returns. Read the script first, or install from the package manager.\n- **Editing configuration files without a backup.** Copy the original to `file.bak` before you change it, and validate syntax before you reload the service (for example `sshd -t` or `nginx -t`).\n- **Trusting `ls` output when a file might be a link.** Use `ls -l` and `readlink -f` to see where a path really goes.\n- **Assuming `rm` is recoverable.** It is not. Check the path with `ls` before deleting, and never run `rm -rf` with a variable that might be empty.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Ubuntu Server or Desktop (LTS)", "A practice Linux system in a VM or on WSL2", "ubuntu.com/download"],
            ["VirtualBox, UTM or WSL2", "Running Linux safely beside your normal system", "virtualbox.org, mac.getutm.app, Microsoft Store"],
            ["ps, top, ss, lsof", "Processes, load and open network sockets", "procps, iproute2 and lsof packages"],
            ["grep, find, awk, sort, uniq", "Searching and summarising text and files", "Preinstalled (GNU coreutils and findutils)"],
            ["journalctl", "Reading the systemd journal", "Preinstalled on systemd distributions"],
            ["shellcheck", "Finding mistakes in shell scripts before they run", "shellcheck.net or apt install shellcheck"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use a Linux virtual machine or WSL2 instance you control. Keep a command log with timestamps. Each step asks you to predict the output first and then check it.",
          items: [
            "Install Ubuntu LTS in a VM with 2 GB of RAM and 20 GB of disk. Run `uname -a`, `cat /etc/os-release` and `df -h`, and write down the kernel version, distribution and free space.",
            "Walk the hierarchy with `ls -l /`, `ls -l /etc | head`, and `ls -ld /tmp /root`. Explain why `/tmp` has the permission string it has (the sticky bit is the `t` at the end).",
            "Start a background process with `sleep 600 &`. Find its PID with `pgrep -a sleep`, then inspect `/proc/<PID>/cwd` and `/proc/<PID>/cmdline`. Stop it with `kill <PID>`.",
            "Generate a failed SSH login on your VM by running `ssh wronguser@localhost` (install the openssh-server package first if needed). Find the attempt in `/var/log/auth.log` or with `journalctl -u ssh`.",
            "Create a file `/tmp/notes.txt` with ten lines of your choosing. Use `grep -n`, `wc -l`, `sort -r` and `head` to answer three questions about its content, and combine two of them in a single pipeline.",
            "Run the pipeline in the worked example against your own authentication log. If the log is empty, explain why and what would make it contain entries.",
            "Write a 200-word explanation, in your own words, of the difference between `>` and `>>` and what happens to an open file when it is redirected.",
          ],
        },
      ],
      challenge:
        "On a Linux machine you control, write a single shell pipeline that prints the five most common source addresses of failed SSH logins over the last 24 hours. Then write a short script, checked with shellcheck, that runs it and saves the output to a dated file under /var/tmp. Explain each stage of the pipeline in a comment inside the script.",
      keyPoints: [
        "Describe the purpose of the main directories in the Linux filesystem hierarchy",
        "Trace a running process through /proc, the network stack and the logs",
        "Compose pipes and redirections to answer a question about text data",
        "Use grep, find, awk, sort and uniq to summarise system logs",
        "Avoid the common destructive mistakes of root shells, blanket permission changes and unchecked deletion",
      ],
      exercises: [
        "What is the difference between standard output and standard error, and why does `grep` followed by `| wc -l` not count error messages?",
        "A file's `ls -l` output begins with `lrwxrwxrwx`. What kind of file is it, and how would you discover its real target?",
        "Explain why `find / -name '*.conf'` may print permission errors and how `2>/dev/null` changes the result without hiding real findings.",
        "Write a one-line command that lists every file in /etc modified in the last 24 hours, sorted by modification time.",
        "Practical problem: design a logging check that alerts you if `/var/log/auth.log` contains more than 20 failed logins from the same address in an hour. Describe the commands you would run and the failure mode of your approach.",
      ],
    }),
    lesson({
      id: "users-permissions-and-hardening",
      title: "Users, permissions and hardening",
      summary:
        "Linux is a multi-user system, and most of its security comes down to a small set of questions: who is this, what may they touch, and what is running on their behalf. This lesson covers user accounts and groups, the permission model and its octal notation, the special bits that quietly change behaviour, privilege escalation through sudo, and the baseline hardening that every internet-facing server should have on day one.",
      sections: [
        {
          heading: "Identity: users, groups and the root account",
          kind: "definition",
          body:
            "Every process runs as a **user**, identified by a numeric **UID**, and belongs to one or more **groups** with **GIDs**. Identities are defined in `/etc/passwd` (accounts), `/etc/shadow` (hashed passwords, readable only by root) and `/etc/group` (groups). The account with UID 0 is **root**, and it bypasses almost every permission check. Ordinary users cannot read `/etc/shadow` or bind to ports below 1024 for the same reason.\n\nTwo habits follow. Services should run as dedicated unprivileged accounts (`www-data`, `postgres`, or a purpose-built user) rather than root, so that a compromised service has little power. Humans should log in as themselves and elevate only when needed with `sudo`, so that every privileged action is attributed to a person in the logs.",
        },
        {
          heading: "The permission model, octal notation and special bits",
          kind: "definition",
          body:
            "Every file has an owner, a group and a set of permissions for three classes of subject: the owner, the group, and everyone else. Each class has three bits: read (`r`, value 4), write (`w`, value 2) and execute (`x`, value 1). On a directory, `x` means permission to enter it and `r` means permission to list it.\n\nSo `rwxr-x---` is `750`: the owner has full access, the group can read and enter, others have nothing. Three special bits change the model. **setuid** (`4000`, shown as `s` in the owner's execute slot) makes a program run with its owner's rights, which is how `passwd` can update the shadow file; a setuid-root program is a high-value target and must be kept minimal. **setgid** (`2000`) does the same for groups, and on a directory makes new files inherit the directory's group. The **sticky bit** (`1000`, shown as `t`) on a directory prevents users from deleting each other's files, which is why `/tmp` has it.\n\nFind the setuid programs on a system with `find / -xdev -perm -4000 -type f 2>/dev/null`. Every result should be one you can explain.",
          code:
            "$ ls -l /etc/shadow /usr/bin/passwd /tmp\n-rw-r----- 1 root shadow  1520 Oct 12 09:14 /etc/shadow\n-rwsr-xr-x 1 root root   68208 Mar 14  2024 /usr/bin/passwd\ndrwxrwxrwt 14 root root  4096 Oct 13 08:01 /tmp\n\n# Set and read permissions numerically\nchmod 640 report.txt      # owner read/write, group read, others nothing\nstat -c '%a %U:%G %n' report.txt",
          language: "bash",
          codeLabel: "Reading permission strings and setting them numerically",
        },
        {
          heading: "Worked example: hardening a fresh server",
          kind: "example",
          body:
            "A new cloud virtual machine is created with a public address. Before it hosts anything, the following sequence takes it from default to a reasonable baseline. Each step is a control, and each has a way to check that it worked.\n\n1. **Update everything.** `sudo apt update && sudo apt upgrade -y`. Check with `apt list --upgradable`, which should be empty.\n2. **Create a non-root administrator.** `sudo adduser ops` and `sudo usermod -aG sudo ops`. Check with `groups ops`.\n3. **Install SSH keys, then disable password login.** Copy the public key to `/home/ops/.ssh/authorized_keys`. In `/etc/ssh/sshd_config` set `PasswordAuthentication no`, `PermitRootLogin no` and `MaxAuthTries 3`. Validate with `sudo sshd -t`, then reload with `sudo systemctl reload ssh`. Keep your current session open until a second login works.\n4. **Turn on a firewall, default deny.** `sudo ufw default deny incoming`, `sudo ufw default allow outgoing`, `sudo ufw allow OpenSSH`, `sudo ufw enable`. Check with `sudo ufw status verbose`.\n5. **Enable automatic security updates.** Install `unattended-upgrades` and confirm with `systemctl status unattended-upgrades`.\n6. **Limit what sudo may do.** Review `sudo -l` for each account, and avoid `NOPASSWD: ALL` unless a specific automation requires it.\n7. **Record a baseline.** Run `sudo lynis audit system` and keep the report, so that later changes can be compared against it.\n\nThe discipline is that every line is verified. A hardening step that has not been tested is a belief, not a control.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Locking yourself out.** Changing SSH configuration without a second open session is the most common self-inflicted outage. Test with a new login before you close the old one.\n- **Using `chmod 777` to make something work.** It makes the file writable by every account on the system. Find the actual owner and group instead.\n- **Leaving setuid bits on unused tools.** Each setuid program is extra attack surface. Remove the bit or the package if it is not needed.\n- **Believing a firewall is enough.** A firewall controls which ports are reachable; it does nothing about a weak password on an open port or an unpatched service behind it.\n- **Editing `/etc/sudoers` directly.** Use `visudo`, which checks syntax before saving. A broken sudoers file can lock every administrator out.\n- **Confusing 'disabled login' with 'no access'.** A user with a shell but a locked password can often still be reached with a key. Check `~/.ssh/authorized_keys` as well.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["sudo, visudo", "Privileged commands with logging, and safe editing of their rules", "Preinstalled on Ubuntu and Debian"],
            ["ufw", "A simple front end to the Linux firewall", "apt install ufw"],
            ["Lynis", "Auditing a system's hardening against a baseline", "cisofy.com/lynis or apt install lynis"],
            ["sshd -t and ssh-keygen", "Validating SSH configuration and creating key pairs", "openssh-server and openssh-client"],
            ["unattended-upgrades", "Installing security patches automatically", "apt install unattended-upgrades"],
            ["find, stat, getfacl", "Auditing permissions, setuid bits and access control lists", "findutils, coreutils, acl package"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use the Ubuntu VM from the previous lesson, or create a second VM as a 'server' so that a mistake does not affect your main lab. Take a snapshot before every step that changes SSH or the firewall.",
          items: [
            "Create a user called `analyst` with `sudo adduser analyst`. Log in as that user and confirm with `id` that the account is not in the `sudo` group.",
            "As root or using sudo, create a file `/srv/secret.txt` and set its owner to root and its mode to `600`. Log in as `analyst` and try to read it. Explain the error.",
            "Create a shared folder `/srv/team` owned by the group `team`. Add `analyst` to the group, set mode `2770`, and verify with `stat -c '%a %U:%G' /srv/team` that the setgid bit is set.",
            "Run `find / -xdev -perm -4000 -type f 2>/dev/null`. For three of the results, use `man` or the package manager (`dpkg -S <path>`) to explain why each program needs setuid.",
            "Generate an SSH key pair on your workstation with `ssh-keygen -t ed25519`, copy the public key to the server, and disable password authentication as described in the worked example. Verify with a new login before closing your original session.",
            "Enable ufw with default deny inbound. Allow only SSH. Use `nmap` from another machine to confirm that port 80 is filtered and port 22 is open.",
            "Run `sudo lynis audit system` and choose three warnings to fix. For each, write the change you made, the command that verified it, and the expected effect on the hardening score.",
          ],
        },
      ],
      challenge:
        "Take a fresh Ubuntu server VM from install to a documented baseline. Create a non-root administrator with key-only SSH, default-deny firewall, automatic security updates and a Lynis report. Write a runbook with one section per control, each containing the command that applied it and the command that proves it is in place. Hand the runbook to another student and have them reproduce the server from it.",
      keyPoints: [
        "Explain how UIDs, GIDs and the root account determine what a process may access",
        "Read and set permission strings in both symbolic and octal form",
        "Identify setuid, setgid and sticky-bit files and judge whether each is justified",
        "Harden a fresh Linux server with key-only SSH, a default-deny firewall and automatic updates",
        "Verify every hardening change with a test rather than assuming it worked",
      ],
      exercises: [
        "Convert `rwsr-x---` to octal and explain what the `s` means in the owner's execute position.",
        "Why should a web application run as `www-data` rather than as root, and what would an attacker gain from a compromised root-owned web process?",
        "A developer runs `chmod -R 777 /var/www` to fix an upload error. List three security consequences and the correct fix.",
        "Explain why `PermitRootLogin no` and `PasswordAuthentication no` together reduce brute-force risk even when the firewall allows port 22.",
        "Practical problem: design a sudoers rule that allows the user `backup` to run exactly one command, `/usr/bin/rsync`, with no password. Explain why `ALL` would be a mistake.",
      ],
    }),
  ],
);
