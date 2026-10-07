{
  id: "networks-internet",
  summary: [
    "A network is a set of computers that have agreed on rules for moving information between them. The internet is not one network. It is a network of networks, owned by different people, in different countries, that still manage to deliver a message from a phone in Accra to a server in another continent in a fraction of a second.",
    "This lesson explains how that cooperation works. It covers the four-layer model, packets and encapsulation, IP addresses and routing, the difference between TCP and UDP, ports, DNS, and HTTP — the language a browser and a server actually speak. It ends with a worked trace of what happens when you open a web page, and with how to read a traceroute.",
  ],
  objectives: [
    "Name the four layers of the internet model and say which problem each one solves.",
    "Explain what a packet is, why messages are split, and what encapsulation means.",
    "Distinguish a private IP address from a public one, and say what NAT does.",
    "Explain routing in terms of hops, and interpret a traceroute.",
    "Compare TCP and UDP, and say which one HTTP uses and why.",
    "Describe the TCP three-way handshake and what a port number selects.",
    "Read an HTTP request and response well enough to name the method, path, and status code.",
    "Trace, in order, the steps from typing a URL to seeing a page.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "A network is an agreement",
      paragraphs: [
        "Two computers cannot exchange a byte until they agree on a startling number of things: how a bit is represented on the wire or in the air, whose turn it is to speak, how a machine is named, what to do when a message is lost, and what the message means when it arrives. A **protocol** is that agreement, written down precisely enough that two implementations which have never met can still talk.",
        "The internet works because the agreements are stacked. Each layer solves one problem and hands a finished result to the layer above, which does not have to know how the layer below did it. You can replace Wi-Fi with Ethernet, or a copper cable with fibre, and HTTP does not change. That separation is the reason the web survived every change of hardware underneath it.",
        "The practical model used in this lesson has four layers, from the wire upward: **link**, **internet**, **transport**, and **application**. You will also meet the seven-layer OSI model in older textbooks. It is the same idea with finer cuts. The four-layer model matches the protocols you will actually configure.",
      ],
    },
    {
      kind: "definition",
      term: "Protocol",
      text: "A set of rules that defines the format of messages, the order they are sent in, and the actions taken when a message arrives or fails to arrive. HTTP, TCP, IP, and Ethernet are protocols. A protocol is not a program; many programs implement one protocol.",
    },
    {
      kind: "table",
      caption: "The four-layer internet model",
      head: ["Layer", "Question it answers", "Examples", "What it adds"],
      rows: [
        ["**Application**", "What does this message mean?", "HTTP, DNS, SMTP, SSH", "A request, a name lookup, an email"],
        ["**Transport**", "Which program on that machine, and did every piece arrive?", "TCP, UDP", "A port number, and — for TCP — order and retransmission"],
        ["**Internet**", "Which machine, across which networks?", "IP, ICMP", "A source and destination address, and a hop count"],
        ["**Link**", "How do I reach the next machine on this same network?", "Ethernet, Wi-Fi, mobile data", "A local hardware address, and a frame on the wire or in the air"],
      ],
    },
    {
      kind: "code",
      caption: "The same stack, written the way you will sketch it",
      language: "text",
      code: `application:  HTTP          what the programs say to each other
transport:    TCP           reliable, ordered delivery to a port
internet:     IP            addressing and routing across networks
link:         Wi-Fi / Ethernet   the next hop, on this network only`,
    },
    {
      kind: "prose",
      heading: "Packets: why a message is cut into pieces",
      paragraphs: [
        "A file, a web page, a video frame — none of these is sent as one lump. The network cuts the data into **packets**, typically around 1,500 bytes on Ethernet, and sends each one separately. There are three reasons, and they are worth knowing because they explain almost every network failure you will debug.",
        "First, **sharing**. A single 100 MB download must not occupy the link for the whole transfer while everyone else waits. Small packets let many conversations interleave. Second, **failure**. If one piece is lost, only that piece is resent, not the whole file. Third, **different paths**. The networks between you and a server change from moment to moment. Each packet can be routed independently, so a broken link does not have to take the conversation down with it.",
        "A packet is not just the data. It is the data plus a **header** added by each layer, a process called **encapsulation**. The application writes the HTTP message. TCP wraps it with a header saying which port it is for, and a sequence number. IP wraps that with source and destination addresses. The link layer wraps that again with the hardware address of the next machine. At the far end, each layer strips the header it understands and hands the remainder upward. The application never sees the IP header. The link layer never interprets HTTP. That ignorance is the design.",
      ],
    },
    {
      kind: "example",
      title: "One sentence, three packets",
      paragraphs: [
        "Suppose a browser needs to send a 3,200-byte HTTP request, and the path allows 1,500-byte packets of payload. The transport layer splits the request and numbers the pieces so the receiver can put them back, even if they arrive out of order.",
      ],
      trace: [
        "Piece 1 carries bytes 0–1499, sequence number 1. It leaves first.",
        "Piece 2 carries bytes 1500–2999, sequence number 2.",
        "Piece 3 carries the remaining 200 bytes, sequence number 3, and a flag saying this is the end of the message.",
        "Piece 2 is delayed by a busy router. Piece 3 arrives before it. The receiver does not hand the application a garbled request: it holds piece 3 until piece 2 arrives, then delivers 1, then 2, then 3.",
        "If piece 2 never arrives, the receiver asks for it again. The application still sees one complete request. That recovery is TCP's job, not the browser's.",
      ],
    },
    {
      kind: "prose",
      heading: "IP addresses: naming a machine",
      paragraphs: [
        "An **IP address** names a machine's connection to a network, not the machine itself and not the person using it. A laptop on Wi-Fi has one address; the same laptop on mobile data has another. Unplug it and the address may be given to someone else. This is why storing an IP address as a permanent identity is a mistake.",
        "**IPv4** addresses are 32 bits, written as four numbers from 0 to 255, such as `102.176.10.4`. There are about 4.3 billion of them, which is not enough for the modern world, so they are rationed. **IPv6** addresses are 128 bits, written in hexadecimal groups, and there are enough of them that the rationing problem goes away. Both are in use. A server often has one of each.",
        "Some ranges are **private**. They are reused inside every home, office, and phone network, and they are not routable on the public internet. `192.168.0.0/16`, `10.0.0.0/8`, and `172.16.0.0/12` are the IPv4 private ranges. Your phone's address of `192.168.1.23` is meaningful only on your Wi-Fi. The router rewrites it, using **NAT** (network address translation), so that outbound packets leave with the router's public address, and replies are mapped back to your phone. That is why a server on the internet cannot normally open a connection *to* your laptop: it has no public address of its own.",
        "The notation `192.168.0.0/16` is **CIDR**. The number after the slash is how many leading bits are the network part. `/16` means the first 16 bits are fixed, so the network contains 2^(32−16) = 65,536 addresses. `/24` is the familiar 256-address block. The smaller the prefix number, the larger the network.",
      ],
    },
    {
      kind: "table",
      caption: "Addresses you will actually meet",
      head: ["Address", "What it is", "Where it works"],
      rows: [
        ["`127.0.0.1` / `::1`", "**Loopback.** Your own machine, talking to itself.", "Only on that machine. A server bound here is invisible to the network."],
        ["`192.168.x.x`, `10.x.x.x`", "**Private.** Assigned by a home or office router.", "Inside that network only. Rewritten by NAT on the way out."],
        ["`102.176.10.4` (example)", "**Public.** Routable on the internet.", "Anywhere. This is what the outside world can address."],
        ["`0.0.0.0`", "In a server, **all interfaces**. In routing, the default route.", "A bind address, not a destination you send to."],
        ["`8.8.8.8`", "A public DNS resolver, run by Google.", "A common test target. Not a website."],
      ],
    },
    {
      kind: "warning",
      label: "localhost is not the internet",
      text: "A server bound to `127.0.0.1` answers only programs on the same machine. Binding to `0.0.0.0` answers every interface, including the public one, which is what you want in production and what you must firewall. The preview you use while learning is a special case: the platform forwards a public address to the port your process listens on, but only if that process listens on `0.0.0.0`, not on localhost.",
    },
    {
      kind: "prose",
      heading: "Routing: how a packet finds its way",
      paragraphs: [
        "No router holds a map of the entire internet. Each one holds a **routing table**: a list of prefixes and the next hop for each. A packet arrives, the router looks at the destination address, picks the most specific matching prefix, and forwards the packet to that neighbour. The neighbour does the same. The path is a sequence of these decisions, and each step is a **hop**.",
        "The packet's IP header carries a **TTL** (time to live), a counter that is decremented at every hop. When it reaches zero, the router discards the packet and sends an ICMP 'time exceeded' message back to the source. This stops a packet looping forever if two routers point at each other. It is also the mechanism behind traceroute.",
        "**Traceroute** sends packets with TTL 1, then 2, then 3, and so on. The router at each hop is the one that discards the packet and replies, so the replies draw the path. Some routers do not reply, and the path can change between probes, so a traceroute is a sketch of a route at one moment, not a contract. The challenge at the end of this lesson is to read one.",
      ],
    },
    {
      kind: "example",
      title: "Reading a traceroute",
      paragraphs: [
        "A traceroute from a laptop in Accra to a public site. Each numbered line is one hop. Three times are three probes; a star means that probe got no reply.",
      ],
      code: `traceroute to example.com (93.184.216.34), 64 hops max
 1  192.168.1.1       1.2 ms   1.1 ms   1.4 ms
 2  10.40.0.1         8.6 ms   7.9 ms   9.1 ms
 3  41.66.12.1       14.2 ms  13.8 ms  15.0 ms
 4  *                *        *
 5  80.231.40.9      62.4 ms  61.1 ms  63.0 ms
 6  93.184.216.34    71.8 ms  70.4 ms  72.1 ms`,
      trace: [
        "Hop 1 is the home router, `192.168.1.1`. One millisecond is the Wi-Fi plus the router. This address is private: it will not appear in a traceroute run from anywhere else.",
        "Hop 2 is still a private address, `10.40.0.1`. That is the ISP's first internal router, just past the home gateway. The jump from 1 ms to 8 ms is leaving the house.",
        "Hop 3, `41.66.12.1`, is a public address. The packet has crossed NAT and is on the ISP's network. The `41.` range is allocated in Africa, which is a sanity check that the path has not immediately left the region.",
        "Hop 4 answered none of the three probes. The router is configured not to send ICMP, or the replies were filtered. The packet still went through: later hops answered. A star is not a failure of the connection.",
        "Hop 5 is a transit network, about 62 ms away. The large jump in time is usually a long cable, often a submarine one, not a slow router.",
        "Hop 6 is the destination, `93.184.216.34`, which matches the address in the first line. Six hops, about 71 ms. That 71 ms is one direction of the path; a request and its response pay it twice.",
      ],
    },
    {
      kind: "prose",
      heading: "TCP and UDP: getting the bytes to the right program",
      paragraphs: [
        "IP delivers a packet to a machine. It does not deliver it to a program, and it does not promise that the packet will arrive, arrive once, or arrive in order. Those are the transport layer's problems, and there are two answers.",
        "**UDP** adds almost nothing: a source port, a destination port, a length, and a checksum. It is a thin envelope. Packets can be lost, duplicated, or reordered, and the application has to cope or not care. DNS queries, video calls, online games, and live streams use UDP because a late packet is often worse than a missing one — a voice call cannot pause to wait for a syllable from 200 milliseconds ago.",
        "**TCP** adds a connection, sequence numbers, acknowledgements, retransmission, flow control, and congestion control. The receiver tells the sender what it has got; the sender resends what is missing; both sides agree how much may be in flight. The application reads a reliable stream of bytes, in order, as if it were a file. HTTP, SSH, email, and database connections use TCP because a missing byte is a corrupted message, not a glitch.",
        "TCP's reliability is not free. A new connection starts with a **three-way handshake** before any application data moves: the client sends SYN, the server replies SYN-ACK, the client sends ACK. That is one and a half round trips of delay before the first byte of your request. On a 71 ms path, the handshake alone costs about 106 ms. This is why connection reuse, and HTTP/2 and HTTP/3, matter: repeating the handshake for every image on a page is a tax you can measure.",
      ],
    },
    {
      kind: "example",
      title: "The three-way handshake, timed",
      paragraphs: [
        "A client in Accra opening a TCP connection to a server 70 ms away. No application data moves until step 3 has been received.",
      ],
      trace: [
        "t = 0 ms. Client sends SYN, sequence number 1000. 'I want a connection, and my byte numbers will start at 1000.'",
        "t = 70 ms. Server receives SYN and sends SYN-ACK, acknowledging 1001 and offering its own sequence number 5000.",
        "t = 140 ms. Client receives SYN-ACK and sends ACK, acknowledging 5001. The client may attach the first data to this ACK — that optimisation is common — but the server cannot reply to it until this packet arrives.",
        "t = 210 ms. Server receives the ACK. The connection is established in both directions. The first response byte can now leave, and it will arrive back at the client around t = 280 ms.",
        "The lesson for a page load: even an empty request pays at least two round trips before you see a byte of HTML, and a third if the handshake and the request are not combined. Distance is not abstract. It is in the waterfall chart.",
      ],
    },
    {
      kind: "prose",
      heading: "Ports: which program",
      paragraphs: [
        "A machine runs many programs that all share one IP address. A **port** is a number from 0 to 65535 that selects one of them. The pair of IP address and port is a **socket**. A connection is identified by four things: source IP, source port, destination IP, destination port. That is why one laptop can open dozens of connections to the same server without them colliding — each gets its own source port.",
        "Ports below 1024 are **well-known** and, on Unix, require privilege to listen on. The ones you will memorise are few. `80` is HTTP. `443` is HTTPS. `22` is SSH. `53` is DNS. `25` is SMTP, for mail. `5432` is a common PostgreSQL port. Everything above 1024 is available for your own servers, and the client's source port is chosen from a high range automatically.",
        "A port is not a security boundary by itself. Closing a port in a firewall stops new connections to it; it does not make the program behind an open port safe. And a port scan finding `443` open tells you a TLS service is listening, not that the application behind it is correct.",
      ],
    },
    {
      kind: "table",
      caption: "Ports worth knowing before you need them",
      head: ["Port", "Protocol", "What listens there"],
      rows: [
        ["20 / 21", "FTP", "An old file-transfer protocol. Avoid it; it sends passwords in the clear."],
        ["22", "SSH", "A remote shell. The right way onto a server."],
        ["53", "DNS", "Name lookups. Usually UDP, TCP for large replies."],
        ["80", "HTTP", "The web, unencrypted. Browsers now upgrade this to HTTPS."],
        ["443", "HTTPS", "The web inside TLS. What you should serve."],
        ["3000, 5173, 8080", "HTTP", "Common development servers. Not special to the protocol — just convention."],
        ["5432", "PostgreSQL", "A database. Should not be reachable from the public internet."],
      ],
    },
    {
      kind: "prose",
      heading: "DNS: names instead of numbers",
      paragraphs: [
        "People do not memorise `93.184.216.34`. They memorise names. **DNS**, the Domain Name System, is the distributed directory that turns a name into an address. It is a tree: `.` at the root, then a top-level domain such as `.com` or `.gh`, then a name such as `codemasterghana`, then optional subdomains such as `www` or `api`.",
        "A lookup is itself a network conversation, usually a short UDP exchange with a **resolver** — the recursive server your ISP or your router points at, or a public one such as `1.1.1.1` or `8.8.8.8`. The resolver asks the root, then the top-level domain, then the authoritative server for the name, and caches the answer for the record's **TTL**. That cache is why a DNS change does not appear everywhere at once, and why 'I updated the record and it still shows the old site' is the normal state for minutes or hours.",
        "A name can have several kinds of record. An **A** record points to an IPv4 address. An **AAAA** record points to an IPv6 address. A **CNAME** is an alias to another name. An **MX** record names the mail servers. Pointing a website at a host is an A or CNAME record; pointing email at a host is a different record, and confusing the two is a common outage.",
      ],
    },
    {
      kind: "prose",
      heading: "HTTP: what the programs say",
      paragraphs: [
        "Once TCP (or, with HTTP/3, QUIC over UDP) has a connection, and TLS has encrypted it, the browser and the server speak **HTTP**. It is a text protocol in its original form: a request line, headers, a blank line, and an optional body. The server answers with a status line, headers, a blank line, and a body.",
        "The request line has three parts. The **method** is what the client wants done: `GET` fetches a representation, `POST` submits a new action, `PUT` replaces, `PATCH` updates part, `DELETE` removes. The **path** identifies the resource, such as `/learn/web-foundations`. The version, `HTTP/1.1` or `HTTP/2`, names the dialect. Headers carry the rest: `Host` says which site on a shared server, `Accept` says which formats the client can read, `Cookie` carries session state, `Authorization` carries a token.",
        "The status code is three digits, and the first digit is the family. `2xx` means success, and `200` is the ordinary one. `3xx` means the resource is elsewhere; `301` and `302` are redirects the browser follows. `4xx` means the client did something the server refuses: `400` is a malformed request, `401` means not authenticated, `403` means authenticated but not allowed, `404` means there is no such resource. `5xx` means the server failed while trying: `500` is a generic crash, `502` and `504` mean a server behind this one failed or timed out.",
        "**HTTPS** is not a different protocol. It is HTTP carried inside **TLS**, which encrypts the bytes and checks that the server holds a certificate for the name you asked for. Without TLS, anyone on the path — the cafe Wi-Fi, the ISP — can read and alter the pages. With TLS they can still see the name you connected to, from DNS and from the certificate handshake, but not the path, the headers, or the body. That distinction matters when you decide what is secret.",
      ],
    },
    {
      kind: "code",
      caption: "A minimal HTTP exchange, as the bytes actually look",
      language: "http",
      code: `GET /learn/web-foundations HTTP/1.1
Host: codemasterghana.online
Accept: text/html
Cookie: session=7f3a

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-cache
Content-Length: 18420

<!doctype html>`,
    },
    {
      kind: "example",
      title: "From a URL to pixels",
      paragraphs: [
        "The whole stack, in the order it actually runs, for `https://example.com/courses`. Each step is one layer doing its job and handing off.",
      ],
      trace: [
        "The browser parses the URL. Scheme `https` means port 443 and TLS. Host `example.com`. Path `/courses`.",
        "DNS: the browser asks its resolver for the A or AAAA record of `example.com` and gets `93.184.216.34`. This answer may already be cached.",
        "TCP: a socket is opened to `93.184.216.34` port `443`. The three-way handshake runs. The routing of each packet is IP's job, hop by hop, invisible to the browser.",
        "TLS: the client and server agree a cipher, the server presents a certificate for `example.com`, the client checks it against a trusted authority, and they derive keys. From here the bytes are encrypted.",
        "HTTP: the client sends `GET /courses` with a `Host` header. The server finds the resource, returns `200` and the HTML.",
        "The browser parses the HTML, discovers it needs CSS, JavaScript, and images, and repeats the request step for each — reusing the connection where it can, so the handshake is not paid again.",
        "The link layer never appears in this list as a step the browser takes. It is inside every packet of every step above. That is what a layered design feels like from the top: the lower layers are someone else's problem, until they break.",
      ],
    },
    {
      kind: "prose",
      heading: "Latency, bandwidth, and loss",
      paragraphs: [
        "Three numbers describe a path, and they are not substitutes for each other. **Bandwidth** is how many bits per second the path can carry when it is full — the width of the pipe. **Latency** is how long one bit takes to arrive — the length of the pipe. **Packet loss** is the fraction of packets that never arrive and must be resent.",
        "A student on a fast fibre link and a student on mobile data can have the same bandwidth and a completely different experience, because a page load is dominated by round trips, not by bulk transfer, until the files get large. The handshake, the DNS lookup, and each new connection are latency. A 2 MB video is bandwidth. A video call that stutters while a speed test looks fine is loss, or latency that varies — **jitter**.",
        "TCP reacts to loss by slowing down, on the assumption that loss means congestion. On a Wi-Fi link, loss often means interference, not congestion, and TCP slows down anyway. This is one reason a strong signal matters more than the number on the box of the router, and one reason HTTP/3, which uses QUIC over UDP, can recover from a lost packet without stalling every other request on the connection.",
      ],
    },
    {
      kind: "formula",
      expression: "transfer time ≈ RTT + (size / bandwidth)",
      where: [
        "**RTT** is the round-trip time, the latency paid before the first byte and again for each round trip the protocol needs.",
        "**size / bandwidth** is the time to push the bytes onto the path once they are flowing.",
        "For a small file on a distant server, RTT dominates and buying more bandwidth changes nothing. For a large file on a near server, bandwidth dominates.",
      ],
    },
    {
      kind: "note",
      label: "What you can see from the browser",
      text: "The Network panel in DevTools is this lesson made visible. Each row is a request. The waterfall shows DNS, connecting, TLS, waiting, and download as separate bars. A long green 'waiting' bar is the server thinking. A long grey bar before it is the network. Learning to tell those apart is the difference between optimising the wrong thing and the right one.",
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Protocol", text: "The rules two parties follow so they can exchange messages without having been written together." },
        { term: "Packet", text: "A small piece of a message, forwarded independently, with headers describing where it is going." },
        { term: "Encapsulation", text: "Each layer wrapping the layer above's data in its own header, and stripping that header on the way back up." },
        { term: "IP address", text: "A number naming a connection to a network. It can change, and a private one is not visible on the internet." },
        { term: "NAT", text: "A router rewriting private source addresses to its own public address, and mapping the replies back." },
        { term: "Hop", text: "One router-to-router step on a packet's path." },
        { term: "TTL", text: "A counter decremented at each hop. At zero the packet is discarded, which is how traceroute draws the path." },
        { term: "TCP", text: "A transport protocol that gives a reliable, ordered byte stream, at the cost of a handshake and retransmission." },
        { term: "UDP", text: "A transport protocol that adds ports and almost nothing else. Fast, and silent about loss." },
        { term: "Port", text: "A number selecting which program on a machine receives the segment." },
        { term: "DNS", text: "The directory that turns a name into an address, cached for each record's TTL." },
        { term: "HTTP", text: "The application protocol of the web: a method, a path, headers, and a body, answered with a status code." },
        { term: "TLS", text: "The encryption and certificate check wrapped around HTTP to make HTTPS." },
        { term: "Latency / bandwidth", text: "How long one bit takes, versus how many bits per second the path can carry." },
      ],
    },
  ],
  practice: {
    challenge:
      "Run a **traceroute** to a public website — `traceroute example.com` on macOS or Linux, `tracert example.com` on Windows — and write down what you see. Record the hop count, the time of the first hop, the time of the last hop, and any hops that answered with stars. Then identify, as far as you can: which hop is your own router, which hop is the first public address, and where the largest jump in time happens. Say what that jump most likely is. If a hop is missing, explain why the connection can still succeed.",
    exercises: [
      {
        prompt: "A 40 KB page is fetched from a server 80 ms away, over a 100 Mbps link, in one round trip after the connection exists. Estimate the transfer time from the formula in this lesson, and say which term dominates.",
        hint: "40 KB is 320,000 bits. Divided by 100,000,000 bits per second that is about 3 ms. The RTT is 80 ms. Latency dominates.",
      },
      {
        prompt: "Your development server is bound to `127.0.0.1:3000` and a classmate on the same Wi-Fi cannot open it. Explain why, and what you would change. Then say what new risk that change creates.",
        hint: "Loopback is not on the network. Binding to `0.0.0.0` makes it reachable, and also makes it reachable by anyone else on that Wi-Fi.",
      },
      {
        prompt: "Sort these into the layer that owns them: a Wi-Fi frame, an IP address, a TCP sequence number, an HTTP status code, a MAC address, a port, a DNS query.",
        hint: "Link: frame and MAC address. Internet: IP address. Transport: sequence number and port. Application: status code and DNS query.",
      },
      {
        prompt: "A video call uses UDP and sounds choppy, while a file download over TCP on the same Wi-Fi completes correctly but slowly. Explain both symptoms from the properties of the two protocols.",
        hint: "UDP does not wait or resend, so lost voice packets become gaps. TCP resends and slows down, so the file arrives whole and late.",
      },
      {
        prompt: "Draw the three packets of a 2,000-byte message with a 1,000-byte limit, including sequence numbers, and say what the receiver does if packet 2 arrives first.",
        hint: "It holds packet 2 until packet 1 arrives, then delivers them in order. That hold is why TCP can add latency under loss.",
      },
      {
        prompt: "You change a DNS A record and the site still shows the old server on your phone, but a friend in another city sees the new one. Explain, using the word TTL, and say what you would check.",
        hint: "Each resolver caches independently until the record's TTL expires. Check the TTL you set, and whether your phone is using a different resolver.",
      },
      {
        prompt: "For each status code, say whose fault it is and one real cause: 200, 301, 400, 401, 403, 404, 500, 504.",
        hint: "2xx and 3xx are outcomes, not faults. 4xx is the client: bad input, no login, no permission, wrong URL. 5xx is the server: a crash, or a backend that did not answer in time.",
      },
      {
        prompt: "A page loads twelve images, each on a new TCP connection, to a server 100 ms away. Estimate the handshake cost alone, before any image bytes, and say how connection reuse changes it.",
        hint: "Each handshake is about 1.5 round trips, so 150 ms, times 12 is 1.8 seconds of pure waiting. Reusing one connection pays the handshake once.",
      },
      {
        prompt: "Explain why a traceroute can show a star at hop 4 and still reach the destination at hop 8. What, exactly, failed to happen at hop 4?",
        hint: "The data packet was forwarded. What failed was the ICMP 'time exceeded' reply, which traceroute needs and the real connection does not.",
      },
    ],
    checkYourself: [
      "What problem does each of the four layers solve, in one sentence each?",
      "Why are messages split into packets instead of being sent whole?",
      "What is encapsulation?",
      "Why can two houses both use the address `192.168.1.1`?",
      "What does NAT rewrite, and why does that stop an outside server connecting in?",
      "How does traceroute use the TTL field?",
      "What does the TCP handshake cost, in round trips, before application data flows?",
      "What does a port number select, and what four values identify a connection?",
      "What is the difference between a `404` and a `500`?",
      "When does adding bandwidth fail to make a page faster?",
    ],
  },
  takeaways: [
    "The internet works because independent networks share protocols, stacked so each layer solves one problem.",
    "Packets are small, headed, and routed independently; encapsulation is how the layers stay out of each other's way.",
    "An IP address names a connection, not a person. Private addresses only make sense inside one network, and NAT is what lets them reach the world.",
    "Routing is a sequence of local decisions. Traceroute draws that sequence by expiring the TTL one hop at a time.",
    "TCP buys reliability and order with a handshake and retransmission. UDP buys speed by promising neither.",
    "A port selects the program. HTTP is the conversation; TLS is what stops the path from reading it.",
    "Latency, bandwidth, and loss are different problems. A page load is usually a latency problem until the files get large.",
  ],
  further: [
    "The web course starts from the protocol this lesson ended on: [[How the web works|/learn/web-foundations/how-the-web-works]].",
    "When you build a server, the runtime is a process waiting on a port: [[The server runtime|/learn/backend-node-apis/server-runtime]].",
    "Run traceroute to two sites on different continents and compare the hop where the time jumps. That jump is the long cable.",
  ],
},
