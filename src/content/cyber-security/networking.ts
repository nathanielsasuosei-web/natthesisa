import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Foundations · Networking.
 *
 * Two lessons: how data actually moves across the internet (layers, addressing,
 * encapsulation) and the protocols, ports, firewalls and scanners that decide
 * what can reach what. Every lesson closes with a practical done on a machine
 * you own or a target you are authorised to test.
 */

export const CS_NETWORKING_MODULE: CourseModule = module(
  "networking",
  "01 · Networking",
  "How data moves, where it can be watched or changed, and how defenders decide what gets through.",
  [
    lesson({
      id: "how-the-internet-moves-data",
      title: "How the internet moves data",
      summary:
        "Every attack on a network is an attack on one of the layers that carry data: a forged address at the link layer, a spoofed route at the network layer, a hijacked connection at the transport layer, a poisoned name at the application layer. This lesson builds the mental model that the rest of the security curriculum depends on. It covers the layered models, what happens to a message as it is wrapped and unwrapped, how IP addressing and subnets divide the world, and how to watch all of this happen on a real machine.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "A network is a set of agreements. Two computers can exchange data only because they agree on how a signal is represented on a cable, how a packet is addressed, how a lost packet is retransmitted, and how the bytes of a web page are arranged. Each agreement is a **protocol**, and the agreements are stacked so that a change at one level does not force a rewrite of the others. That stacking is called **layering**, and it is the first idea a security engineer must have in their head, because almost every real attack targets one layer while assuming the others behave.\n\nThis lesson is written for people with no prior networking course. Where a term is used for the first time it is defined, and where a claim can be checked, the practical asks you to check it.",
        },
        {
          heading: "The layered models",
          kind: "definition",
          body:
            "There are two standard descriptions of the stack. The **OSI model** has seven layers and is used as a teaching vocabulary. The **TCP/IP model** has four layers and describes what the internet actually runs. Security people use both, and map between them constantly.\n\n- **Physical / link (OSI 1–2, TCP/IP link)**: bits on a medium, frames between neighbouring devices. Ethernet, Wi-Fi, MAC addresses, ARP. Trust here is local: anyone on the same switch segment or Wi-Fi network can claim to be anyone else.\n- **Network (OSI 3, TCP/IP internet)**: packets routed across many networks. IP addresses, routing, ICMP. Trust here is about *where a packet claims to come from*, which the sender controls.\n- **Transport (OSI 4)**: end-to-end delivery between programs. TCP gives reliable, ordered streams; UDP gives unreliable datagrams. Ports identify the program at each end.\n- **Application (OSI 5–7, TCP/IP application)**: the protocols people use, such as HTTP, DNS, SMTP and SSH. Most vulnerabilities that a web developer will ever meet live here.\n\nThe reason the layers matter to a defender is that a control at one layer does not protect the layers above it in the way people assume. A firewall that allows port 443 says nothing about whether the HTTP inside is safe, and a TLS certificate proves who the server is but not that the server's code is free of bugs.",
        },
        {
          heading: "Encapsulation: following one request down the stack",
          kind: "example",
          body:
            "When you open `https://example.com`, your browser does not send a sentence. It sends a chain of nested messages, each one a payload wrapped in the header of the layer below. Trace the sending side:\n\n1. **Application**: the browser builds an HTTP request, `GET / HTTP/1.1` with a `Host` header. The name `example.com` must first become an address, so a DNS query is sent first, using the same stack.\n2. **Transport**: the operating system opens a TCP connection to port 443. It sends a SYN segment, receives a SYN-ACK, and replies with an ACK. Only then does encrypted data flow. The segment header records source port (a random high number chosen by your machine) and destination port 443.\n3. **Network**: the TCP segment is placed inside an IP packet, which carries the source IP (your address) and destination IP (the server's address). The routing table decides the next hop.\n4. **Link**: the IP packet is placed inside an Ethernet frame addressed to the MAC address of your default gateway, which is the router, not the server. Each hop rewrites the link-layer addresses but keeps the IP addresses.\n\nOn the receiving side the process runs in reverse, with each layer checking its own header and handing the payload up. The property to remember is that **the headers are plain text unless something encrypts them**. Anyone on the path can read the source, destination and port of every packet, which is why the content must be protected by TLS and why metadata still leaks even when content does not.",
          code:
            "$ dig +short example.com A\n93.184.215.14\n\n$ curl -v https://example.com 2>&1 | head -n 12\n*   Trying 93.184.215.14:443...\n* Connected to example.com (93.184.215.14) port 443\n* ALPN: server accepted h2\n* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384\n> GET / HTTP/2\n> Host: example.com\n< HTTP/2 200",
          language: "text",
          codeLabel: "What the client reports at each layer (output abbreviated)",
        },
        {
          heading: "IP addressing and subnets",
          kind: "definition",
          body:
            "An IPv4 address is 32 bits, written as four decimal numbers. A **subnet mask** or **prefix length** says how many leading bits identify the network and how many identify hosts within it. `192.168.10.0/24` means the first 24 bits are the network and the last 8 bits are hosts, giving 256 addresses of which 254 are usable (the first is the network address and the last is the broadcast address).\n\nTwo facts are worth memorising. First, the **private ranges** defined in RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are not routed on the public internet; your home router translates them with **NAT**. Second, a smaller prefix means a larger network: `/26` holds 64 addresses, `/16` holds 65,536. Security zones are usually subnets: a database should sit in a subnet that the web tier can reach and the internet cannot.\n\nBecause the prefix is a boundary, security policy is written against it. \"Allow the web subnet to reach the database subnet on port 5432 and nothing else\" is a sentence a firewall can enforce and an engineer can audit.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **NAT is not a firewall.** NAT hides addresses as a side effect of translation. A host behind NAT that runs an exposed service is still reachable through a port forward, and outbound-only NAT says nothing about what the host will accept from inside the network.\n- **Trusting the source address.** IP addresses are easy to forge, and on a local network ARP can be forged to redirect traffic. An address is a claim, not an identity.\n- **Assuming a switch isolates traffic.** On a shared or misconfigured segment, a host can see traffic meant for others, and ARP spoofing puts the attacker in the middle.\n- **Confusing encryption with authentication.** TLS encrypts a channel to whoever is at the other end. It proves identity only through the certificate, and only if you check it.\n- **Reading headers and forgetting metadata.** Even encrypted traffic reveals who talks to whom, when and how much.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          body: "All of these are free and available on Linux, macOS and Windows (Wireshark and Npcap on Windows).",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Wireshark", "Graphical packet capture and dissection", "wireshark.org"],
            ["tcpdump", "Command-line capture, scriptable and light", "Preinstalled on most Linux and macOS systems"],
            ["dig", "Query DNS records directly", "dnsutils (Debian/Ubuntu) or bind-tools"],
            ["ip / ping / traceroute", "Inspect interfaces, routes and reachability", "iproute2, iputils, traceroute packages"],
            ["curl", "Make HTTP requests and show every step of the connection", "curl.se"],
            ["Python ipaddress module", "Calculate subnets reliably", "Standard library"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Do these on your own computer or in a virtual machine. You are only capturing your own traffic, so no authorisation is needed beyond your own equipment.",
          items: [
            "Install Wireshark. On Linux, add your user to the `wireshark` group so you can capture without running as root, then log out and back in.",
            "Start a capture on your active interface (`ip -br addr` tells you its name, often `eth0`, `wlan0` or `enp3s0`). Open a browser and load three different websites.",
            "Apply the display filter `dns` and find the query for one site. Record the transaction ID, the query name and the answer address.",
            "Apply the filter `tcp.flags.syn == 1 && tcp.flags.ack == 0`. Count the SYN packets. Explain why each one is the start of a new connection.",
            "Find a TCP stream to port 443 and follow it with Analyze, Follow, TCP Stream. Confirm that you cannot read the content, but can read the IP addresses and ports.",
            "Run `dig +short example.com A` and `curl -v https://example.com`. Match each line of curl's output to a layer in the table above.",
            "Using Python, calculate the usable host range for `192.168.10.0/26`: `python3 -c \"import ipaddress; n = ipaddress.ip_network('192.168.10.0/26'); print(n.num_addresses, n.network_address, n.broadcast_address)\"`. Predict the answer before you run it.",
            "Write down the next two subnets of the same size after `192.168.10.0/26`, and state the rule that determines them.",
          ],
        },
      ],
      challenge:
        "Capture 60 seconds of your own traffic while you open one news site and one search engine. Produce a one-page report that lists every DNS name you saw resolved, every destination IP and port, and which of those flows were encrypted. Explain what a network observer could learn about your browsing from the report alone, even with TLS in place.",
      keyPoints: [
        "Describe the layers of the TCP/IP and OSI models and the job of each layer",
        "Trace a web request from DNS lookup to encrypted application data",
        "Explain why IP addresses are a claim rather than an identity",
        "Calculate the size and usable range of a subnet from its prefix length",
        "Use Wireshark display filters to isolate DNS queries, TCP handshakes and TLS sessions",
      ],
      exercises: [
        "Why does a packet's destination MAC address change at every router while its destination IP address does not?",
        "A laptop has the address 172.20.5.9/20. What is the network address, the broadcast address, and how many hosts fit in the subnet?",
        "An attacker on your Wi-Fi network cannot read HTTPS content but can still learn which websites you visit. Explain exactly which fields reveal that.",
        "Your security team says 'the database is safe because it is behind NAT'. Write the three questions you would ask to test that claim.",
        "Practical problem: capture the traffic generated by a command-line tool of your choice (for example `apt update` or `git clone`) and identify the protocol and port used for each step.",
      ],
    }),
    lesson({
      id: "protocols-firewalls-and-scanning",
      title: "Protocols, ports, firewalls and scanning",
      summary:
        "Knowing that data moves is not enough; a security practitioner must know which doors are open, why they are open, and how to find out without guessing. This lesson covers the protocols that run over TCP and UDP and the ports they conventionally use, how firewalls decide which packets to allow, how DNS and DHCP add their own trust problems, and how a port scanner such as nmap works. The practical has you map the services of a machine you control and judge which of them should exist.",
      sections: [
        {
          heading: "Ports and the services behind them",
          kind: "definition",
          body:
            "A **port** is a 16-bit number carried in every TCP and UDP header. It lets one IP address host many services at once: the operating system delivers each segment to whichever program is listening on its destination port. Ports 0–1023 are the **well-known** ports, conventionally reserved for standard services; 1024–49151 are registered; 49152–65535 are used for temporary client connections.\n\nA port is in one of three states from a scanner's point of view. **Open** means a program accepted the connection. **Closed** means the host answered that nothing listens there. **Filtered** means no answer came back, which usually means a firewall dropped the packet. Security work depends on telling these three apart.",
          rows: [
            ["Port", "Protocol", "Why a defender cares"],
            ["22", "SSH", "Remote administration. Should be key-only and not reachable from the whole internet"],
            ["53", "DNS", "Name resolution. Misconfigured resolvers can be abused for amplification"],
            ["80 / 443", "HTTP / HTTPS", "The public web. 443 should carry TLS; 80 should only redirect"],
            ["445", "SMB", "Windows file sharing. A classic route for ransomware when exposed"],
            ["3306 / 5432 / 6379", "MySQL / PostgreSQL / Redis", "Databases and caches. Should never be on a public address"],
            ["3389", "RDP", "Windows remote desktop. A frequent brute-force and exploit target when exposed"],
          ],
        },
        {
          heading: "TCP, UDP and the handshake",
          kind: "paragraph",
          body:
            "TCP establishes a connection with a **three-way handshake**: the client sends SYN, the server replies SYN-ACK, the client confirms with ACK. Only then does data flow. Each TCP header carries flags (SYN, ACK, FIN, RST, PSH) that scanners and firewalls read. A **RST** packet tears a connection down immediately and is how a closed port typically answers.\n\nUDP has no handshake. It sends datagrams with no promise of delivery, which makes it fast for DNS, DHCP and video, and forgeable: an attacker can send a UDP packet with any source address. This is why UDP services are abused for **reflection and amplification** attacks, where a small spoofed query produces a large response aimed at a victim. Many of the defences are about refusing to answer strangers.",
        },
        {
          heading: "Firewalls: stateless, stateful and application-aware",
          kind: "paragraph",
          body:
            "A **firewall** is a rule set applied to traffic as it crosses a boundary. Three generations matter:\n\n- A **packet filter** examines each packet alone against rules such as \"allow TCP to port 443 from any\". It has no memory of earlier packets, so it cannot tell a reply from an unsolicited packet unless the rule is written to say so.\n- A **stateful firewall** tracks connections in a table. It allows reply traffic for connections that a local host opened and drops packets that match no known connection. This is the default on Linux (`nftables`, `iptables` with conntrack), on cloud security groups and on home routers.\n- An **application-aware firewall** (a web application firewall, or WAF) inspects the content of HTTP requests and blocks patterns that look like attacks. It is useful and imperfect; it reduces noise but does not replace fixing the vulnerability.\n\nThe default policy matters more than the individual rules. A firewall that drops everything not explicitly allowed is a **default-deny** design. A firewall that allows everything not explicitly denied will eventually be bypassed by the one service nobody remembered to list.",
          code:
            "# nftables: default-deny inbound, allow return traffic and a few services\ntable inet filter {\n  chain input {\n    type filter hook input priority 0; policy drop;\n    ct state established,related accept\n    iif lo accept\n    ip protocol icmp accept\n    tcp dport { 22, 443 } ct state new accept\n  }\n  chain forward { type filter hook forward priority 0; policy drop; }\n  chain output { type filter hook output priority 0; policy accept; }\n}",
          language: "text",
          codeLabel: "A default-deny host firewall, readable line by line",
        },
        {
          heading: "Worked example: what a scan actually sends",
          kind: "example",
          body:
            "**nmap** is the standard port scanner. Its default TCP scan (`-sS`, the SYN scan) sends a SYN to each port and classifies the answer, without completing the handshake. A SYN-ACK means open, which the scanner resets. A RST means closed. Silence, or an ICMP 'administratively prohibited' message, means filtered.\n\nTrace the scan of one port on a host at `192.168.56.101`:\n\n1. nmap sends SYN to port 22. The host replies SYN-ACK, so nmap knows the port is open and sends RST to end the half-open connection.\n2. nmap sends SYN to port 23. The host replies RST, so the port is closed.\n3. nmap sends SYN to port 8080. Nothing returns within the timeout, so the port is filtered by a firewall.\n4. With `-sV`, nmap then connects and reads the banner the service sends, which gives the product and version used for vulnerability lookup later.\n\nThe SYN scan is quieter than a full connection scan because it never completes a session, but it is still visible in logs and to any intrusion detection system. Scanning is an activity that needs authorisation, and it can disrupt fragile systems.",
          code:
            "# Discover live hosts on your own lab network (no port scan yet)\nnmap -sn 192.168.56.0/24\n\n# Scan the top 100 ports with service and version detection\nnmap -sS -sV --top-ports 100 192.168.56.101\n\n# Save results in all formats for later comparison\nnmap -sS -sV -p- -oA lab-scan-2026-10-13 192.168.56.101",
          language: "bash",
          codeLabel: "Three scans, from cheapest to most thorough",
        },
        {
          heading: "DNS and DHCP: the trust you never configured",
          kind: "definition",
          body:
            "**DNS** turns names into addresses, and almost every connection depends on it. Classic DNS has no authentication, so a resolver can be poisoned to return a false address, and a client on a hostile network can be pointed anywhere. **DNSSEC** adds signatures to prove answers are genuine, and **DNS over HTTPS** or **DNS over TLS** hides queries from the local network, but neither is enabled everywhere, so treat DNS answers as untrusted input until the TLS certificate is checked.\n\n**DHCP** hands out addresses, gateways and DNS servers to any device that asks. On an open network, a rogue DHCP server can answer faster than the real one and set the victim's gateway to itself. Defences include DHCP snooping on managed switches and 802.1X port authentication, which is standard in enterprise and university networks.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Treating 'filtered' as 'safe'.** A filter may be the only thing between a vulnerable service and the internet, and a misconfiguration can open it at any time.\n- **Exposing databases to the internet 'temporarily'.** Temporary exposure is how most leaked databases leak. Bind them to a private address.\n- **Scanning without permission because the tool is free.** nmap is legal to install, not legal to aim at systems you do not control. Use `scanme.nmap.org`, your own lab or a written scope.\n- **Relying on port numbers to identify services.** Any program can listen on port 443. Identify services by banner and version, and verify.\n- **Forgetting UDP.** A TCP-only scan misses DNS, SNMP and many IoT services. Scan UDP separately with `-sU` on the ports that matter.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["nmap", "Host discovery, port scanning, service and version detection", "nmap.org (apt install nmap)"],
            ["Netcat (nc)", "Connect to a port by hand and read a banner", "netcat-openbsd package"],
            ["nftables / ufw", "Host firewall rules on Linux", "Preinstalled or the nftables and ufw packages"],
            ["Wireshark", "Confirm what a scan actually sent and received", "wireshark.org"],
            ["VirtualBox or UTM", "A private lab network with a deliberately vulnerable target", "virtualbox.org or mac.getutm.app"],
            ["Metasploitable 2", "An intentionally vulnerable target for isolated lab use only", "Rapid7 documentation; run on a host-only network"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use only your own lab network, `scanme.nmap.org` (which the nmap project provides for testing), or a target you are authorised to scan. Record every command and its output in a lab notebook.",
          items: [
            "Create a host-only network in VirtualBox (or use two VMs on the same private NAT network). Start a Linux VM and note its address with `ip -br addr`.",
            "From a second machine on the same network, run `nmap -sn` over the /24 that contains the VM. Note the number of hosts reported and compare it with what `ip neigh` shows.",
            "Scan the VM's top 100 TCP ports with `nmap -sS -sV --top-ports 100`. Write down each open port, its state and the detected service.",
            "Install a web server on the VM (for example `sudo apt install nginx`), rescan, and confirm port 80 appears. Then stop the service and rescan to see the change.",
            "Run `sudo nft list ruleset` on the VM. Add a rule that drops inbound traffic to port 80, rescan, and identify the state nmap now reports (filtered, not closed). Remove the rule afterwards.",
            "Repeat one scan against `scanme.nmap.org` with the same options. Compare the findings with what the site publishes about itself and explain any difference.",
            "Write a one-page summary: which services should be reachable from the network, which should not, and the firewall rule that enforces each decision.",
          ],
        },
      ],
      challenge:
        "Build a lab with one Linux server and one client on a private network. Apply a default-deny firewall that allows only SSH from the client and HTTPS to the server. Prove the policy with nmap from the client, showing the expected open, closed and filtered states, and attach the scan output to a short report explaining each result.",
      keyPoints: [
        "Distinguish open, closed and filtered ports and explain what each means to a scanner",
        "Explain the TCP handshake and why UDP is forgeable and abused for amplification",
        "Compare packet filters, stateful firewalls and web application firewalls",
        "Write and reason about a default-deny firewall policy",
        "Run nmap at three levels of depth and interpret the output responsibly",
      ],
      exercises: [
        "Why does a closed port reply with RST while a filtered port often gives no reply at all?",
        "A DNS server answers queries from anyone on the internet. Explain how it can be used to flood a third party, and name two changes that prevent it.",
        "Write the nftables rules for a web server that should accept SSH only from the subnet 10.10.0.0/24 and HTTP and HTTPS from anywhere.",
        "A scan shows port 3306 filtered from the internet. Name two other things you would check before you decided the database was safe.",
        "Practical problem: explain why `nmap -sS` is generally considered less noisy than a full connect scan, and state what both leave in the target's logs.",
      ],
    }),
  ],
);
