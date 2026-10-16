import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Computer Networking — a beginner course in how computers talk to each other.
 *
 * Written for someone who has used the internet every day and wants to
 * understand it: what a network is made of, how a device gets an address, how
 * data is cut into packets and carried, and how to build and repair a small
 * office or home network. Every lesson ends with a practical done on a real
 * machine, because networking is learned with a terminal open.
 */

export const COMPUTER_NETWORKING_MODULES: CourseModule[] = [
  module(
    "networking-basics",
    "01 · Networking basics",
    "What a network is made of, and how a device finds its place on one.",
    [
      lesson({
        id: "what-a-network-is",
        title: "What a network is",
        summary:
          "A network is not a cable or a router; it is a set of agreements that lets two independent machines exchange data, plus the links and devices that carry it. This lesson names the parts — nodes, links, media, protocols, clients and servers — and the vocabulary that measures a connection: bandwidth, throughput, latency, jitter and packet loss. Once you can tell bandwidth from latency you can diagnose most \"the network is slow\" complaints, because they are two different problems with two different fixes.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Every service you use — a WhatsApp message, a Mobile Money transaction, a lesson video on this platform — is a conversation between two programs on two machines. That conversation has to survive interference, distance and the failure of individual pieces of equipment, and it does so because everybody agreed on rules in advance.\n\nThis lesson builds the vocabulary the rest of the course uses. Nothing here needs a lab; you can verify every claim on the phone or laptop you are reading this on.",
          },
          {
            heading: "Definition: network, node, link, protocol",
            kind: "definition",
            body:
              "**A network** is two or more computers connected so they can exchange data, together with the rules that govern the exchange.\n\n**A node (or host)** is any device with an address on the network: a laptop, a phone, a printer, a server, a router interface.\n\n**A link** is the path between two nodes — a cable, a Wi-Fi radio signal, a fibre strand, a mobile-data channel. **Media** is what the link is made of (copper, glass, radio).\n\n**A protocol** is an agreed set of rules for a specific job: how to represent a signal, how to address a message, how to recover a lost one, how to request a file. Protocols are layered so that Wi-Fi can be replaced by Ethernet without rewriting the web browser that used it.\n\n**A client** asks; **a server** answers. A **topology** is the shape of the connections: a *star* (everything plugged into one switch), a *bus* or *ring* (older designs), a *mesh* (everything connected to several others, as the internet's core is).",
          },
          {
            heading: "The three sizes of network",
            kind: "paragraph",
            body:
              "Networks are named by how far they reach, which usually also decides who owns them:\n\n- **PAN — personal area network.** Your phone, earbuds and watch, using Bluetooth. Range: metres.\n- **LAN — local area network.** One room, one cyber café, one office, one school computer lab. You own the equipment and the addressing. Speeds of 100 Mbps to 10 Gbps are normal on copper.\n- **WAN — wide area network.** A network of networks spanning cities or continents. The internet is the largest WAN; a bank connecting its Accra and Kumasi branches over a fibre link bought from a provider is running a private WAN.\n- **MAN — metropolitan area network** sits between the two: one city, often run by an ISP or a university.\n\nIn Ghana the boundaries blur usefully: a phone on MTN or Telecel data is on a WAN through a mobile network, while a school lab wired to one router is a LAN with a single internet connection shared through NAT.",
          },
          {
            heading: "What a network actually carries",
            kind: "paragraph",
            body:
              "Every discussion about connection quality reduces to five measurable quantities:\n\n1. **Bandwidth** — the maximum rate the link can carry, in bits per second (Mbps, Gbps). It is the width of the pipe, not the speed of the water.\n2. **Throughput** — the rate you actually achieve. It is always lower than bandwidth, because of overheads, other users, Wi-Fi interference and distant servers.\n3. **Latency (delay)** — how long one round trip takes, in milliseconds. Theoretical minimums matter: light in fibre needs about 5 ms per 1,000 km, plus switching, plus the mobile network, which is why a request from Accra to a server in Europe rarely comes back in under 100 ms.\n4. **Jitter** — variation in latency. Video calls and games suffer from jitter even when average latency looks fine.\n5. **Packet loss** — the fraction of packets that never arrive. TCP retransmits them, which turns loss into delay, which every user experiences as \"slow\".\n\nA **bit** is a 0 or a 1; there are 8 bits in a **byte**. ISPs sell megabits; file sizes are written in megabytes — an 8× difference that makes a 40 Mbps link download at roughly 5 MB per second at best.",
          },
          {
            heading: "Worked example: measuring your own link",
            kind: "example",
            body:
              "Take any terminal — the Command Prompt on Windows, the Terminal app on a Mac or Linux — or use an Android app such as Termux. Run a ping to a well-known server and read the four numbers it prints.\n\n`time=41.2 ms` is your round-trip latency: the packet left, crossed the country or the ocean, and came back in 41 milliseconds. `ttl=54` is the remaining hop budget, so about 10 routers handled it (the common starting value is 64). Zero per cent packet loss over four packets means the link is stable *at this moment*; run it for a minute with a larger count before believing it.\n\nNext compare with your advertised bandwidth. If the ISP sells 50 Mbps and a large download settles around 4 MB/s (32 Mbps), what you are seeing is normal overhead and contention. If it settles at 400 KB/s, you are not paying for what you think you are — and the first thing to check is not the ISP but your own Wi-Fi, cable and router placement.",
            code:
              "$ ping -c 4 8.8.8.8\nPING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=54 time=41.2 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=54 time=39.8 ms\n64 bytes from 8.8.8.8: icmp_seq=3 ttl=54 time=44.1 ms\n64 bytes from 8.8.8.8: icmp_seq=4 ttl=54 time=40.5 ms\n\n--- 8.8.8.8 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3004ms\nrtt min/avg/max/mdev = 39.8/41.4/44.1/1.6 ms\n\n# Latency: ~41 ms round trip.  mdev 1.6 ms means low jitter.\n# Loss: 0%.  Now compare with the bandwidth you were sold:\n\n$ curl -o /dev/null -s -w '%{speed_download} bytes/s\n' \\\n    https://speed.cloudflare.com/__down?bytes=25000000\n3 120 480 bytes/s        # ~3.1 MB/s  ≈ 25 Mbps of a nominal 50 Mbps link",
            language: "text",
            codeLabel: "Two numbers that describe a connection",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"More bandwidth will fix the lag.\"** Latency and bandwidth are different quantities. A 4K video streams fine at 25 Mbps; nothing streams fine at 200 ms of jitter. Gaming and calls are latency problems, and buying a bigger package does not help them.\n- **Confusing bits with bytes.** 100 Mbps is about 12.5 MB/s at best. Marketing copy never does the division for you.\n- **Believing the speed test.** It measures one server at one moment, usually the nearest one. Real traffic crosses several networks that all charge or throttle differently.\n- **Thinking Wi-Fi is the network.** Wi-Fi is only the first link. Beyond the router there is a cable, an ONT or a mobile tower, and an ISP network that has its own bad days.\n- **Assuming \"connected\" means \"working\".** A device can join Wi-Fi and still have no internet: associated, addressed, but with no route out. The three states are separate, and each fails differently.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Term", "Unit", "What it measures", "Typical \"good\" value"],
              ["Bandwidth", "Mbps / Gbps", "Maximum capacity of the link", "50 Mbps home, 1 Gbps office LAN"],
              ["Throughput", "Mbps or MB/s", "What you really get", "60–90% of bandwidth"],
              ["Latency (RTT)", "ms", "Delay for one round trip", "< 30 ms local, 80–200 ms intercontinental"],
              ["Jitter", "ms", "Change in latency between packets", "< 10 ms for calls"],
              ["Packet loss", "%", "Packets that never arrive", "< 1% (0% on a healthy LAN)"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A network is a set of agreements plus the hardware that carries the result, and it is measured in five quantities: bandwidth, throughput, latency, jitter and loss. Distinguishing them is what separates somebody who can explain a slow connection from somebody who can fix it, and the next three lessons walk down the stack — addresses, then packets, then the physical devices you will be asked to build and repair.",
          },
        ],
        keyPoints: [
          "Define network, node, link, media, protocol, client and server, and give an example of each on a home network.",
          "Tell LAN, WAN, MAN and PAN apart by range and ownership.",
          "Convert between Mbps and MB/s, and explain why the two never match exactly.",
          "Distinguish bandwidth from latency, and say which one a video call needs.",
          "Use ping to measure round-trip time, jitter and loss on your own connection.",
        ],
        exercises: [
          "Draw your school's or workplace's network from memory: the incoming service, the modem or ONT, the router, the switch, the access points, and three end devices. Mark which parts you are certain about and which you are guessing.",
          "Ping `8.8.8.8` and a website in Ghana, then one in Europe. Record average round-trip time for each and explain the differences using distance and the number of networks crossed.",
          "Measure your download throughput by downloading a 50 MB file and timing it. Compute MB/s, convert to Mbps, and compare with your advertised plan.",
          "Open a video call or a stream on your link while running a large download. Note what degrades first, and explain why using latency, jitter and loss.",
          "Explain to somebody who is not technical why a 100 Mbps plan does not download at 100 MB per second.",
        ],
        challenge:
          "Build an inventory of the network you are sitting on: the device you are using, the link (Ethernet or Wi-Fi, and which band), the gateway address, the name of the ISP, and the results of a ping and a throughput test. Write it in plain language, one page, ending with the single change that would most improve your own connection and why.",
      }),

      lesson({
        id: "addresses-and-names",
        title: "Addresses and names: IP, MAC and DNS",
        summary:
          "Nothing on a network can be reached without an address, and no human will remember one. Two systems bridge that gap: IP addresses moved by DHCP and resolved from names by DNS, and MAC addresses used only within the local link by ARP and switches. This lesson follows one device from switching on to opening a website: how it receives an address, how it finds the gateway, how a name becomes a number, and how to read the output of the four commands that show you all of it.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "\"I cannot reach the site\" has three very different causes at this layer: no address, no route, or no name resolution. Each one fails visibly if you know which command to look at, and each one is fixed by a different person — you, the router, or the DNS settings. This lesson gives you the vocabulary and the commands to tell those three apart in under a minute.",
          },
          {
            heading: "Definition: the four identifiers",
            kind: "definition",
            body:
              "**An IP address** is the logical address of a device on a network. IPv4 is 32 bits written as four decimals (`192.168.1.24`); IPv6 is 128 bits written in hexadecimal groups (`2c0f:f248::1`). It can change, and it is what routers forward on.\n\n**A subnet mask** (or prefix length) separates the network part of an address from the host part. `192.168.1.24/24` means the first three numbers identify the network and the last identifies the device — 254 usable addresses in that network.\n\n**A MAC address** is the fixed hardware identifier burned into a network interface (`a4:5e:60:1c:22:9f`). It is used only within the local link, by switches, to deliver a frame to the right port. It is not routable across the internet.\n\n**A hostname** is the human label (`www.example.com`). **DNS** converts it to an IP address; **DHCP** hands out addresses, masks, gateways and DNS server addresses automatically; **ARP** maps a known IP address to the MAC address of the device that currently holds it.",
          },
          {
            heading: "How a device joins a network: DHCP in four messages",
            kind: "paragraph",
            body:
              "The moment your phone associates with a Wi-Fi network it does not know its own address. It asks, using the aptly named **DORA** exchange:\n\n1. **Discover** — the client broadcasts \"is there a DHCP server here?\" to `255.255.255.255`, because it has no address to send from.\n2. **Offer** — the router or server offers an address, plus the mask, the default gateway and usually two DNS servers.\n3. **Request** — the client asks for that specific address.\n4. **Acknowledge** — the server confirms, and now the device has an identity for as long as the **lease** allows (commonly hours to days).\n\nThe **default gateway** in that answer is the most important field: it is the router your device sends everything to when the destination is not on the local network. A device with an address but no gateway has internet access that is impossible to reach — a very common misconfiguration on a manually configured printer or CCTV recorder.\n\nAddresses in `10.0.0.0/8`, `172.16.0.0/12` and `192.168.0.0/16` are **private**: they are never routed on the public internet, and your router translates them to its single public address using **NAT**, which is why one household of fifteen devices needs one address from the ISP.",
          },
          {
            heading: "How names become addresses: DNS",
            kind: "paragraph",
            body:
              "DNS is a hierarchical, distributed database. Reading `www.campus.example.edu.gh` right to left: the resolver asks a **root** server where `.gh` lives, the `.gh` servers where `.edu.gh` lives, and so on until the **authoritative** servers for the domain answer with the record you asked for. The resolver (usually your ISP's, or `1.1.1.1` or `8.8.8.8`) caches each answer for the **TTL** the domain owner set, which is why DNS changes are not instant.\n\nThe record types worth knowing:\n\n- **A** — name → IPv4 address. **AAAA** — name → IPv6 address.\n- **CNAME** — an alias; `www` pointing at `example.edu.gh`.\n- **MX** — where email for the domain is delivered. **TXT** — verification and email-authentication text (SPF, DKIM).\n- **NS** — which servers are authoritative for the domain.",
          },
          {
            heading: "Worked example: diagnosing in four commands",
            kind: "example",
            body:
              "Read the output from the top down; each command answers one question and fails in a recognisable way.\n\n`ipconfig` (Windows) or `ip a` (Linux/macOS) answers *do I have an address and a gateway?* An address starting `169.254.` is the self-assigned fallback when DHCP failed — the number one cause of \"connected but no internet\".\n\n`ping 192.168.1.1` answers *can I reach the router?* Replies mean the local link is fine and the problem is further out. Timeouts mean the problem is right here: bad cable, wrong SSID, sleeping router.\n\n`nslookup example.com` answers *can I turn a name into an address?* If ping to `8.8.8.8` works but `ping google.com` says \"could not find host\", the link is fine and DNS is broken — change the DNS server on the router to `1.1.1.1` and the problem disappears.\n\n`arp -a` answers *which device on my local link holds this address?* It is how you find the MAC address behind an IP, useful when two devices have been given the same fixed address and the network misbehaves randomly.",
            code:
              "$ ipconfig\nWireless LAN adapter Wi-Fi:\n   IPv4 Address. . . . . . . . . . . : 192.168.1.24\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0   (/24)\n   Default Gateway . . . . . . . . . : 192.168.1.1\n   DNS Servers . . . . . . . . . . . : 192.168.1.1, 1.1.1.1\n\n$ ping -c 2 192.168.1.1\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=2.1 ms\n\n$ nslookup example.com\nServer:  192.168.1.1\nAddress: 192.168.1.1#53\nName:    example.com\nAddress: 93.184.215.14        # name resolved — DNS is working\n\n$ arp -a\n? (192.168.1.1) at 34:97:f6:1a:2b:80 [ether] on wlan0\n? (192.168.1.24) at a4:5e:60:1c:22:9f [ether] on wlan0",
            language: "text",
            codeLabel: "Four questions, four commands",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"My IP is my identity.\"** It is a lease that expires, and NAT means an entire office shares one public address. Anything that identifies a person by IP breaks on mobile networks especially.\n- **Setting a static address inside the DHCP range.** Two devices end up with the same address, and both lose the network intermittently — the hardest fault to diagnose in a small office. Static addresses belong outside the DHCP pool or reserved by MAC in the router.\n- **Chasing DNS when the gateway is wrong.** If the gateway address is missing, every name resolves perfectly and every page still fails to open. Check the route before the resolver.\n- **Confusing MAC filtering with security.** MAC addresses are broadcast in the clear and trivially spoofed. It is an inconvenience, never a control.\n- **Editing DNS records and testing once.** The TTL means the old answer can live for hours in caches you do not control. Lower the TTL to 300 before a migration, not after it.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Address range", "Class of network", "Size", "Where you meet it"],
              ["10.0.0.0/8", "Private (RFC 1918)", "16.7 million addresses", "Large offices, VPNs, cloud VPCs"],
              ["172.16.0.0/12", "Private (RFC 1918)", "1 million addresses", "Cloud and campus networks"],
              ["192.168.0.0/16", "Private (RFC 1918)", "65,536 addresses", "Home routers — `192.168.1.x` and friends"],
              ["169.254.0.0/16", "Link-local (APIPA)", "65,536 addresses", "The warning sign that DHCP failed"],
              ["127.0.0.0/8", "Loopback", "16.7 million addresses", "`127.0.0.1` — always yourself"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A device is reachable because it has an address, a mask, a gateway and a name resolver — three facts and one phone book, usually supplied by DHCP in four broadcast messages. IP addresses are logical and changeable, MAC addresses are physical and local, and DNS is the hierarchy that lets humans use words instead of numbers. With `ipconfig`, `ping`, `nslookup` and `arp` you can place any failure in one of those three layers, which is the first skill of every network engineer.",
          },
        ],
        keyPoints: [
          "Explain the difference between an IP address, a MAC address, a hostname and a port.",
          "Describe the four DHCP messages and what a device learns from each.",
          "Explain what a default gateway is and why a missing gateway breaks everything.",
          "Trace a DNS lookup from the resolver to the authoritative server, and say what TTL does.",
          "Use ipconfig/ip a, ping, nslookup and arp to separate addressing failures from routing and DNS failures.",
        ],
        exercises: [
          "Find your own device's IP address, mask, gateway and DNS servers, and identify which parts of the address are network and which are host.",
          "Ping your gateway, then `8.8.8.8`, then a domain name. Record which of the three fails, if any, and what each result proves.",
          "Run `nslookup` on three Ghanaian university domains and on one large international site. Note the addresses and whether any return more than one.",
          "Look up a domain you own or use with an online DNS record checker. List its A, MX and TXT records and explain what each is for.",
          "Deliberately set a static IP that is already in use on your network, observe what breaks, then restore the setting and write down the symptom in your own words.",
        ],
        challenge:
          "Write a one-page troubleshooting guide for a small office with the four commands from this lesson, in the order a non-technical person should try them: what to type, what a healthy answer looks like, and what each failure means. Test it on somebody who has never run a command, and rewrite anything they stumble over.",
      }),
    ]
  ),

  module(
    "networking-in-practice",
    "02 · Networking in practice",
    "Packets, ports and protocols — then the devices you build a real network from.",
    [
      lesson({
        id: "packets-ports-and-protocols",
        title: "Packets, ports and protocols",
        summary:
          "Data does not travel as a file; it travels as numbered packets, each carrying a header that says where it came from, where it is going, and which program should receive it. This lesson explains packet structure, the port numbers that identify programs, and the difference between TCP — ordered and reliable — and UDP — fast and best-effort. It then traces one HTTPS request through the stack and shows you how to read that trace in Wireshark, which turns the theory into something you can point at.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Two facts make everything else in networking make sense. First, the data you send is chopped into pieces, and the pieces can take different paths and arrive out of order. Second, a machine runs many programs at once, so the receiving machine needs to know which one a packet belongs to. The first fact explains retransmission, buffering and \"loading…\"; the second is why firewalls, servers and homework answers talk about ports.",
          },
          {
            heading: "Definition: packet, header, payload, port, socket",
            kind: "definition",
            body:
              "**A packet** is a small unit of data with a **header** in front of it. The header is metadata: source and destination addresses, sequence numbers, flags, checksums. The **payload** is the actual content.\n\n**A port** is a 16-bit number (0–65535) identifying a program on a machine. The combination of IP address and port is a **socket**, and a connection is identified by four values: source IP, source port, destination IP, destination port. That four-tuple is how one server handles thousands of clients at once on a single port.\n\n**TCP (Transmission Control Protocol)** is connection-oriented: a three-way handshake (`SYN`, `SYN-ACK`, `ACK`) establishes the connection, every byte is numbered, lost segments are retransmitted, and data arrives in order. Use it for anything that must be complete — web pages, files, email.\n\n**UDP (User Datagram Protocol)** sends datagrams with no handshake, no ordering and no retransmission. It is faster and is used where a late packet is worse than a lost one: live video, voice, games, DNS queries.\n\n**Encapsulation** is the nesting: your HTTP request becomes a TCP segment, which becomes an IP packet, which becomes an Ethernet or Wi-Fi frame. Each layer adds its own header, and each layer is stripped on the way back up at the other end.",
          },
          {
            heading: "The port numbers you will actually meet",
            kind: "paragraph",
            body:
              "Ports 0–1023 are the **well-known** range and normally require administrator rights to open: 20/21 FTP, 22 SSH, 23 Telnet (never expose this), 25 SMTP, 53 DNS, 80 HTTP, 123 NTP, 143 IMAP, 443 HTTPS, 445 SMB, 3306 MySQL, 3389 RDP, 5432 PostgreSQL.\n\nPorts 1024–49151 are **registered** and used by applications (8080 and 3000 for development servers, 8443 for a second HTTPS listener). Ports 49152–65535 are **ephemeral**: your operating system picks one at random as the source port of every outbound connection, which is why a browser on one machine can hold hundreds of simultaneous connections to the same web server without confusion.\n\nThis is also how a firewall thinks. \"Allow 443 inbound to the web server, allow nothing else\" is a policy about services; the port is the service. When you are asked to \"open a port\" you are being asked to make one program reachable from outside.",
          },
          {
            heading: "Worked example: one HTTPS request, layer by layer",
            kind: "example",
            body:
              "Follow a request to `https://example.com` from the application down and back up. The sequence matters more than the diagram: DNS must resolve before TCP can connect, TCP must connect before TLS can handshake, and only then does the HTTP request go out.\n\nThen do it yourself, twice. `curl -v` prints the client's own account of the exchange — the resolved address, the TCP connection, the negotiated TLS version, the request line and the response status. A packet capture in Wireshark shows the same thing from the wire's point of view: filter `tcp.port == 443` and you can see the handshake packets, the TLS `Client Hello` with its server name in clear text (that is how SNI-based blocking and filtering work), and then encrypted application data.\n\nThe comparison is the lesson: the client's log tells you what it intended, and the capture tells you what was actually on the wire. When they disagree, the network is where the truth is.",
            code:
              "$ curl -v https://example.com 2>&1 | head -n 14\n* Trying 93.184.215.14:443...\n* Connected to example.com (93.184.215.14) port 443   # TCP handshake done\n* ALPN: server accepted h2\n* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 # TLS done\n* Server certificate: CN=example.com\n> GET / HTTP/2                                     # application data\n> Host: example.com\n< HTTP/2 200\n< content-type: text/html; charset=UTF-8\n\n# The same exchange in Wireshark (filter: tcp.port == 443)\n#  1  client → server   SYN            Seq=0        Win=64240\n#  2  server → client   SYN, ACK       Seq=0 Ack=1\n#  3  client → server   ACK            Seq=1 Ack=1\n#  4  client → server   TLSv1.3 Client Hello (SNI: example.com, visible)\n#  5  server → client   TLSv1.3 Server Hello, Certificate, Finished\n#  6  client → server   TLSv1.3 Application Data  ← the GET request, now encrypted\n#  7  server → client   TLSv1.3 Application Data  ← 200 OK, 1256 bytes",
            language: "text",
            codeLabel: "The client's view and the wire's view of one request",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"TCP is slow, so let us use UDP everywhere.\"** UDP is only faster when loss is tolerable. Put a file transfer on UDP and you reimplement TCP badly, with no congestion control, and make the whole network worse.\n- **Confusing a port with a service.** Nothing enforces that 443 carries HTTPS. Attackers run shells on 443 and it passes most filters; the port is a convention, not a guarantee.\n- **Believing packets arrive in order.** They frequently do not, even on the same route. TCP hides that; UDP does not, which is why voice codecs carry their own sequence numbers.\n- **Forgetting that headers are unencrypted.** Even with TLS, the source and destination IPs, the port and the SNI hostname are visible to every network in between.\n- **Watching traffic that is not there.** On a switched network you only see your own traffic, broadcasts and what ARP tricks can divert. A capture with no interesting packets usually means the capture was taken in the wrong place.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Port", "Protocol", "Carries", "Encrypted?"],
              ["22", "SSH", "Remote shell, file copy, Git over SSH", "Yes (always)"],
              ["53", "DNS", "Name lookups (TCP for large answers)", "Usually not — use DoH/DoT"],
              ["80", "HTTP", "Web traffic, unencrypted", "No — redirect to 443"],
              ["443", "HTTPS", "Web traffic over TLS", "Yes (and QUIC/HTTP3 uses UDP 443)"],
              ["25 / 587 / 465", "SMTP", "Sending mail; 587 for submission", "Only with STARTTLS"],
              ["3306 / 5432", "MySQL / PostgreSQL", "Database connections", "Only if configured — never expose publicly"],
              ["5060 / 3478", "SIP / STUN", "Voice signalling and NAT traversal", "Sometimes"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Data crosses a network as packets stamped with addresses and ports, and the transport protocol decides what guarantees come with it: TCP for completeness and order, UDP for speed and tolerance of loss. The four values in a connection identify it uniquely, and the same numbering scheme is what firewalls and servers act on. With `curl -v` and a packet capture you can see every part of that story on your own machine, which is the fastest way to stop treating the network as magic.",
          },
        ],
        keyPoints: [
          "Describe a packet's header and payload, and explain how encapsulation nests layers.",
          "Explain what a port is, why ephemeral ports matter, and list the well-known ports you will meet most.",
          "Compare TCP and UDP and choose correctly for a given workload.",
          "Trace an HTTPS request through DNS, TCP, TLS and HTTP, in order.",
          "Read a TCP handshake in a packet capture and explain what each packet proves.",
        ],
        exercises: [
          "List every listening port on your own machine (`netstat -ano` on Windows, `ss -tulpn` on Linux) and identify the program behind each one you can.",
          "Capture traffic for one page load in Wireshark and filter to `tcp.port == 443`. Count the packets and identify the handshake.",
          "Find the SNI hostname of a site you visit in a capture, and explain why it is visible even though the page is encrypted.",
          "Run `ping` against a host with TCP and UDP tools (`nmap -sS` and `nmap -sU` on a machine you own) and compare the answers.",
          "Explain in writing why a DNS query uses UDP by default but falls back to TCP for large answers.",
        ],
        challenge:
          "Produce a labelled timeline of one page load on a site of your choice, using a packet capture and the browser's network panel together: DNS, connection, TLS, request, response, and the first contentful paint. Annotate each phase with how long it took in milliseconds, then name the single phase you would attack first to make the site feel faster.",
      }),

      lesson({
        id: "building-and-fixing-a-network",
        title: "Building and fixing a small network",
        summary:
          "This is the lesson you will use on a Monday morning: how to assemble a small network from a modem, a router, a switch and access points, how to plan its addressing and Wi-Fi coverage, and how to find out what is wrong when somebody says the internet is down. It ends with the troubleshooting ladder — physical, link, address, gateway, name, far end — which turns guesswork into a sequence you can follow in any building.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Small networks are where most people meet networking for the first time: a home, a cyber café, a school computer lab, a clinic's front desk, a shop with a POS terminal and a CCTV recorder. The equipment is cheap and the failure modes are few, but they are consistently the same five or six, and knowing them in order is what makes somebody the person who fixes it.",
          },
          {
            heading: "Definition: the boxes and what each one does",
            kind: "definition",
            body:
              "**Modem / ONT** — converts the provider's signal (fibre, DSL, 4G/5G) into Ethernet. It is the boundary between your network and the ISP's.\n\n**Router** — connects your network to the ISP's, hands out addresses with DHCP, performs NAT, and (on home equipment) hosts the firewall and usually Wi-Fi. It is the **default gateway** your devices are told about.\n\n**Switch** — connects several wired devices inside one network, forwarding frames by MAC address. An **unmanaged** switch just works; a **managed** switch gives you VLANs, port monitoring and loop protection.\n\n**Access point** — bridges Wi-Fi to the wired network. In a home the router is usually all three devices in one box; in an office, buying separate boxes is what makes the Wi-Fi usable for more than ten people.\n\n**Patch panel and structured cabling** — the permanent wiring of a building, terminated in one place, so that any desk can be moved without re-cabling walls.\n\n**Gateway, subnet and DHCP scope** — the router's own address (say `192.168.1.1`), the range your devices live in (`192.168.1.0/24`) and the addresses the router is allowed to hand out (`192.168.1.100`–`192.168.1.199`). Keeping servers, printers and cameras *outside* the DHCP scope is the difference between a stable office and a mysterious one.",
          },
          {
            heading: "Planning a network before you plug anything in",
            kind: "paragraph",
            body:
              "Write four things down before buying equipment:\n\n1. **How many devices, and on what?** Count wired sockets needed (desk phones, POS, cameras, printers, access points) and wireless devices. Wi-Fi access points handle 25–40 active devices comfortably each; more than that and you will need a second AP, not a louder one.\n2. **Where is the cable?** Fibre enters one place. Cameras and access points need a cable path (or PoE — power over Ethernet — which is why PoE switches exist. One cable to the ceiling carries both data and power).\n3. **Addressing.** One flat `192.168.1.0/24` is right for a home. A clinic should separate staff, guests and cameras into different subnets or, at minimum, a **guest network** on its own SSID with client isolation — never let a visitor's phone sit on the same network as the records computer.\n4. **Power and protection.** A UPS on the router, modem and switch turns a two-hour outage into nothing. A surge protector costs less than one router.\n\nWi-Fi planning is mostly physics: 2.4 GHz travels further and passes walls better, 5 GHz is faster and more crowded; walls, mirrors, water tanks and microwave ovens all cost you signal; and channel overlap between neighbouring networks causes problems that no amount of reboot fixes. Use narrow channels on 2.4 GHz (1, 6 or 11 only), 80 MHz on 5 GHz, and put access points where people are, not in the cable cupboard.",
          },
          {
            heading: "Worked example: the troubleshooting ladder",
            kind: "example",
            body:
              "Work bottom-up and never skip a rung. At each rung ask one question, run one command, and stop when you get the wrong answer, because that is the fault.\n\n**1. Physical.** Is the device on, is the cable seated, is the link light lit at both ends, is the Wi-Fi actually associated with the correct network? A surprising share of \"internet is down\" tickets end here.\n\n**2. Address.** Does the device have a usable address? `169.254.x.x` means DHCP failed: fix that before anything else.\n\n**3. Gateway.** `ping` the gateway. No reply means the local link is broken — switch, cable, Wi-Fi client isolation, or the router is down.\n\n**4. Name resolution.** `nslookup`. If numbers work and names do not, this is a DNS fault, and it affects everybody on the network, not just one laptop.\n\n**5. Far end.** Ping a public address like `8.8.8.8`, then a domain. If the gateway answers but nothing beyond it does, the ISP link or the router's WAN is the fault — check the modem's status lights and the provider's status page, then phone them with evidence in hand.\n\n**6. The service itself.** If everything above is healthy, the network is working and the problem is the website or the application. Proof matters here: \"the browser opens other sites, but not yours\" is a sentence that changes which team gets the ticket.",
            code:
              "# The ladder as a one-liner sweep (Linux/macOS)\n$ ip -4 addr show | grep inet            # rung 2: do I have an address?\n$ ip route | grep default                # rung 3: what is my gateway\ndefault via 192.168.1.1 dev wlan0\n$ ping -c 2 192.168.1.1                  # rung 3: reachable?\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=2.4 ms\n$ nslookup google.com                    # rung 4: names resolve?\n$ ping -c 2 8.8.8.8                      # rung 5: is the wider internet up?\n\n# Windows, the same sweep\n> ipconfig /all\n> ping 192.168.1.1\n> nslookup google.com\n> ping 8.8.8.8\n> tracert 8.8.8.8                        # which hop drops first?",
            language: "text",
            codeLabel: "Six rungs, one command each",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Leaving default administrator passwords.** The plastic sticker on a router is the first thing a stranger reads. Change the admin password and the Wi-Fi password on installation, and disable remote administration.\n- **Hiding the SSID as security.** It is not hidden from any tool, and it breaks legitimate devices. Use WPA2/WPA3 with a long passphrase.\n- **Adding a second router without disabling DHCP.** Two DHCP servers on one network produce devices that work for an hour and then fail. Add an access point or configure the second device as a bridge.\n- **Putting an access point in the wrong place.** Signal follows line of sight: an AP in a metal cupboard serves the cupboard. Mount it high, central and away from metal.\n- **Plugging a cable from a switch back into another port on the same switch.** A loop floods the network with frames. Managed switches detect this (STP); cheap ones melt.\n- **Never testing the backup.** If the ISP fails, does the office still take payments? If the answer is \"no\", that is a design problem, not an outage.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Symptom", "Most likely cause", "First check"],
              ["Connected, no internet", "DHCP failed or gateway missing", "Look for a `169.254.` address, then renew the lease"],
              ["Only one device fails", "That device's Wi-Fi, driver or static IP", "Compare its address and gateway with a working device"],
              ["Everything fails after a change", "Duplicate DHCP server or looped cable", "Unplug the new box and re-test"],
              ["Slow Wi-Fi in one corner", "Coverage, channel overlap or 2.4 GHz congestion", "Move the AP, or add a second one on a non-overlapping channel"],
              ["Websites fail, apps work", "DNS fault", "`nslookup` a domain and change DNS to 1.1.1.1"],
              ["Link drops every evening", "Congestion, ISP throttling or interference", "Ping over time and log it before calling the provider"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "A small network is five boxes and one plan: modem, router, switch, access points and cabling, with an addressing scheme that keeps infrastructure out of the DHCP range and separates visitors from work. When something breaks, the ladder — physical, address, gateway, names, far end, service — tells you which of those to look at, in order, with one command per rung. Networking starts being fun the moment failing links become diagnosable instead of mysterious.",
          },
        ],
        keyPoints: [
          "Describe what a modem, router, switch and access point each do, and when a home's all-in-one box stops being enough.",
          "Plan a small network: device count, cable paths, PoE, addressing and guest separation.",
          "Choose between 2.4 GHz and 5 GHz for coverage and speed, and pick non-overlapping channels.",
          "Follow the six-rung troubleshooting ladder and name the command that tests each rung.",
          "Harden a small network's router with the five settings that matter most.",
        ],
        exercises: [
          "Draw your own or your workplace's network and label the modem/ONT, router, switch, access points and three devices. Mark the DHCP range and any device with a static address.",
          "Log into a router you are responsible for (or a simulator) and change three settings: the admin password, the Wi-Fi passphrase and the DNS servers. Record what you changed and what improved.",
          "Survey your Wi-Fi with a free analyser app. Note how many networks share your channel, then move your access point to a clear channel and measure the difference.",
          "Deliberately create a fault you can safely undo — unplug the uplink, then set a wrong DNS server — and walk the ladder for each, writing down which rung caught it.",
          "Design the network for a five-desk clinic with a POS terminal, two cameras, a printer and a waiting-room guest Wi-Fi. Specify the boxes, the addressing and the guest separation.",
        ],
        challenge:
          "Build or re-plan one real network end to end: a device and cabling plan, an addressing scheme with the DHCP range and static reservations listed, a Wi-Fi plan naming channels and AP placement, and a written troubleshooting sheet for the person who will use it. Then deliberately break something on it and fix it following your own sheet, correcting whatever your sheet got wrong.",
      }),
    ]
  ),
];
