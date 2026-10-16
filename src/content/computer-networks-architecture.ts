import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Computer Networks & Architecture — the engineering course behind a small
 * network course.
 *
 * Where the beginner course asks "how do I connect this and fix it?", this one
 * asks "why is the internet built this way, and how do I design one that
 * behaves at scale?" Layers and protocol design, routing and switching
 * internals, subnetting as arithmetic, redundancy, quality of service, and
 * measurement. Written for people who will be asked to defend a network design.
 */

export const COMPUTER_NETWORKS_ARCHITECTURE_MODULES: CourseModule[] = [
  module(
    "network-architecture",
    "01 · How networks are built",
    "Layers, protocol design, and what really happens inside a packet's journey.",
    [
      lesson({
        id: "layered-architecture",
        title: "The layered architecture of networks",
        summary:
          "Layering is the single design decision that made the internet grow: each layer offers a service to the layer above and uses the layers below without knowing how they work. This lesson covers the OSI and TCP/IP models properly — not as a diagram to memorise but as an engineering tool — and shows what the separation buys you: interchangeable technologies, independent security boundaries and interfaces that can be reasoned about one at a time.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Interviewers ask about layers because misuse of the model is the root cause of a large share of real network bugs: a VPN that breaks at one layer, a firewall rule that assumes a port means a service, a TLS inspection appliance that changes certificates. The model is how engineers argue about which layer a problem belongs to — and therefore whose job it is.",
          },
          {
            heading: "Definition: the two models, and the service each layer offers",
            kind: "definition",
            body:
              "**The OSI model (7 layers)** is the teaching vocabulary: Physical, Data Link, Network, Transport, Session, Presentation, Application. **The TCP/IP model (4 layers)** describes what runs in practice: Link, Internet, Transport, Application. The mapping is routine — OSI 5–7 collapse into TCP/IP's application layer.\n\nWhat each layer promises:\n\n- **Physical** — moves bits across a medium: voltage, light, radio. Offers a raw bit stream.\n- **Data link** — moves frames between devices on the *same* link, with MAC addressing, error detection (CRC) and media access control.\n- **Network** — moves packets between *any* two hosts, across many networks, using IP addressing and routing. It is deliberately unreliable: it drops packets happily and tells you why (ICMP).\n- **Transport** — end-to-end delivery between programs: TCP's reliability and ordering, UDP's minimalism, ports for demultiplexing.\n- **Application** — the protocols users meet: HTTP, DNS, SMTP, SSH, SIP.\n\nThe engineering property that matters is **encapsulation with independence**: in the middle of the internet, a router forwards a packet using only the network-layer header. It does not parse your HTTP, does not know whether you are on Wi-Fi or fibre, and does not care whether the payload is encrypted. That blindness is why the network keeps working as new applications appear — and why we still need security at every layer.",
          },
          {
            heading: "Why layering works, and where it leaks",
            kind: "paragraph",
            body:
              "Layering buys four practical things:\n\n1. **Substitution.** Ethernet replaced Token Ring, Wi-Fi replaced cables in offices, IPv6 is replacing IPv4 — each change stayed inside its layer for the most part.\n2. **Independent ownership.** The web developer owns layers 5–7; the network team owns 1–4. Escalation paths follow the model.\n3. **Incremental security.** TLS at the transport-adjacent layer, IPsec at the network layer, WPA at the link layer: three separate controls, three separate threat models.\n4. **Simpler implementation.** A web server never implements retransmission; TCP does it once for every application.\n\nThe model leaks in ways worth knowing:\n\n- **NAT breaks the clean story.** It rewrites addresses *and* ports, so the transport layer is not fully transparent, which is why peer-to-peer, SIP and some games need STUN or relays.\n- **Middleboxes inspect above their layer.** Firewalls read HTTP, DPI reads application payloads, TLS-inspection proxies mint their own certificates. Useful, but they break end-to-end guarantees.\n- **Cross-layer hacks are common.** TCP tuning based on link quality, or a video app changing its encoding because it saw packet loss (QUIC does exactly this), deliberately violates the boundary because performance demands it.\n\nA senior engineer's habit is to ask, for any change: *which layer does this belong to, and what does it assume about the other layers?* Most outages are caused by an assumption across a boundary.",
          },
          {
            heading: "Worked example: one frame at every layer",
            kind: "example",
            body:
              "Requesting a page from a server produces a stack of headers. Reading the capture from the outside in shows exactly what each layer decided.\n\nThe Ethernet frame carries the MAC addresses of your machine and the gateway — not of the server, which is thousands of kilometres away. Inside it, the IP header carries your address and the server's, and that pair stays constant end to end. Inside that, the TCP header carries ephemeral source port `51932` and destination `443`, and a sequence number. Inside that, TLS carries an encrypted record, and only at the far end is the HTTP request visible.\n\nNotice the pattern: **link addresses are rewritten at every hop; IP addresses are not**. That is the whole architecture in one sentence, and it is why a traceroute shows a chain of routers while the destination address never changes.",
            code:
              "Frame 6: 1434 bytes on wire\n  Ethernet II:   src a4:5e:60:1c:22:9f → dst 34:97:f6:1a:2b:80   (rewritten each hop)\n    Internet Protocol v4: src 192.168.1.24 → dst 93.184.215.14     (constant end to end)\n      TCP: src port 51932 → dst port 443, Seq=1, Ack=1, Flags [PSH, ACK]\n        TLSv1.3 Record: Application Data (encrypted)\n          HTTP/2 HEADERS + DATA:  GET /courses/computer-networks-architecture\n\n# Read outside-in: link decides the next hop; network decides the destination;\n# transport decides the program; application decides the meaning.",
            language: "text",
            codeLabel: "One packet, four layers of decisions",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Treating OSI as a rigid implementation.** Real stacks are messier: TLS sits between transport and application, and Wi-Fi's MAC layer has its own retransmission. Learn it as an analysis tool, not a specification.\n- **Assuming a firewall sees what you see.** If traffic is encrypted, an L3/L4 firewall knows addresses, ports and volume — not intent. That gap is why zero-trust designs exist.\n- **Thinking a switch is a router.** A switch forwards within one network by MAC; a router forwards between networks by IP. Confusing the two leads to flat, insecure networks.\n- **Believing the network layer guarantees delivery.** IP is best-effort by design. Reliability is TCP's job, and UDP applications that need it must build it themselves.\n- **Ignoring MTU.** A layer-2 limit of 1500 bytes and a path that fragments badly is a classic cause of \"the VPN connects but nothing loads\".",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Layer (TCP/IP)", "OSI layers", "Address used", "Typical device", "Failure looks like"],
              ["Link", "1–2", "MAC", "Switch, access point", "No link light, bad cable, Wi-Fi association failures"],
              ["Internet", "3", "IP", "Router, firewall", "Unreachable host, no route, wrong gateway"],
              ["Transport", "4", "Port", "Firewall, load balancer", "Connection refused, timeouts, blocked port"],
              ["Application", "5–7", "Name / URL / user", "Proxy, WAF, server", "500 errors, DNS failures, TLS certificate errors"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Layering turns an impossible problem — connecting everything to everything — into a set of independent problems with defined interfaces: bits on the medium, frames on the link, packets across networks, segments between programs, protocols for users. The model is not a description of a perfect system; it is the vocabulary engineers use to decide where a fault lives and where a control belongs, and knowing where it leaks is what separates a textbook answer from an engineering one.",
          },
        ],
        keyPoints: [
          "Map the OSI layers onto the TCP/IP model and name the service each layer offers.",
          "Explain encapsulation and independence, and why a router never reads your HTTP request.",
          "Give two examples of cross-layer design hacks and why they exist.",
          "Name the address type and the typical device at each layer, and how each layer fails.",
          "Explain how NAT and TLS inspection violate the clean layering story.",
        ],
        exercises: [
          "Take a packet capture and write out one packet's four headers with the source and destination identifier at each layer.",
          "For each of these faults, name the layer: a laptop with a `169.254` address; a website that resolves but returns a certificate error; a service that answers only at 1 Mbps because it dropped to a 100 Mbps link.",
          "Explain in one paragraph each why NAT and a TLS-inspection proxy break end-to-end arguments, and what each gains.",
          "Research QUIC and list two ways it deliberately ignores the classic layer boundaries. Justify each decision.",
          "Draw the same five-device network twice: once as a physical view (boxes and cables) and once as a layered view (which layer each box operates at).",
        ],
        challenge:
          "Choose one widely used protocol — HTTP/2, QUIC, WireGuard or MQTT — and write a two-page architecture note describing which layers it touches, what it assumes about the layers below, which boundary it deliberately crosses, and what that gains. End with the failure modes that design creates, and how you would monitor for them.",
      }),

      lesson({
        id: "routing-and-switching-internals",
        title: "Routing and switching internals",
        summary:
          "A router does not know the way; it knows one next hop at a time, chosen by the longest matching prefix in a table. A switch does not route at all; it learns which MAC addresses live on which ports and floods anything it does not know. This lesson covers forwarding decisions, the routing table, the protocols that fill it (OSPF, BGP), switching and VLANs, NAT in practice, and the MTU and fragmentation problems that produce the strangest bugs in production.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "This is the layer where design decisions are made and outages begin: a route advertised to the wrong neighbour, a VLAN that was never trunked, an MTU set below what the tunnel in the middle can carry. None of these are visible in a simple ping, which is exactly why engineers who understand forwarding debug in minutes and everyone else replaces hardware for a week.",
          },
          {
            heading: "Definition: the forwarding decisions",
            kind: "definition",
            body:
              "**Forwarding** is the per-packet action of moving a packet out of one interface towards a destination, guided by a table. **Routing** is the ongoing process of building that table, either statically (an administrator writes each route) or dynamically (routers exchange reachability information).\n\n**Longest prefix match** is the rule every router uses: when several routes match a destination, the one with the *most specific* prefix wins. A packet to `10.20.30.40` matches `10.0.0.0/8`, `10.20.0.0/16` and `10.20.30.0/24`; the `/24` wins, always, regardless of the order the routes were learned in. The **default route** (`0.0.0.0/0`) is simply the prefix that matches everything and is therefore chosen last — your way out to the internet.\n\n**Switching** forwards frames within one network by MAC address. A switch **learns** by watching the source MAC of incoming frames, stores MAC → port in a table, and forwards known destinations out of a single port. For unknown destinations it **floods** out of every port except the one it arrived on. That is why a loop is catastrophic without spanning tree.",
          },
          {
            heading: "Routing protocols: who tells the routers about each other",
            kind: "paragraph",
            body:
              "Two families:\n\n**Interior — inside one organisation.** OSPF (link-state) and IS-IS build a map of the network and compute shortest paths by cost, converging in seconds. EIGRP is Cisco's distance-vector equivalent. These are what a campus or an office uses; the metric is usually bandwidth-based.\n\n**Exterior — between organisations.** BGP is how the internet's ~75,000 autonomous systems tell each other which IP prefixes they can reach. It is a policy protocol, not a shortest-path one: a bank prefers a route for commercial or regulatory reasons even when a longer path exists. Two facts explain most internet incidents: a misconfigured BGP announcement can attract traffic for a prefix belonging to somebody else (a **route hijack**, as happened to a well-known cryptocurrency service in 2018), and the internet has no global authority enforcing that announcements are truthful — mechanisms such as RPKI exist precisely because of this.\n\n**Static routes** are right for a small network with one or two exits. They never converge and never surprise you, which is a virtue: a route you wrote is a route you can explain.",
          },
          {
            heading: "Worked example: reading a routing table and finding a black hole",
            kind: "example",
            body:
              "Read `ip route`/`route print` from the top down and remember that only the prefix length decides the winner.\n\nThe first three lines are the local subnets, then a default route via the gateway. A host is unreachable when the table has no matching prefix at all — you will see the OS report \"Network is unreachable\" rather than a timeout, and that distinction is diagnostic gold: *no route* is a local table problem; *timeout* means a route existed and something beyond it dropped the packet silently.\n\nNow add the classic failure: a VPN pushes a route for `10.8.0.0/24`, and suddenly a user cannot reach the internal payroll server at `10.8.0.17` that they reached before. Both routes match — the VPN's `/24` and the office's `/16` — and longest prefix match sends the traffic down the tunnel, where nothing answers. Reading the table with its prefix lengths makes the cause obvious in seconds; pinging in the dark never would.",
            code:
              "$ ip route\n default via 192.168.1.1 dev wlan0 proto dhcp metric 600\n 192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.24\n 10.0.0.0/16 via 192.168.1.254 dev wlan0        # office network, learned\n 10.8.0.0/24 dev tun0                            # VPN pushed this — more specific\n\n$ ip route get 10.8.0.17\n10.8.0.17 dev tun0 src 10.8.0.6 uid 1000        # it matched /24, so it went to the tunnel\n\n# After removing the VPN route, the office route wins again:\n$ ip route get 10.8.0.17\n10.8.0.17 via 192.168.1.254 dev wlan0 src 192.168.1.24",
            language: "text",
            codeLabel: "Longest prefix match decides, every time",
          },
          {
            heading: "VLANs, NAT and MTU in real deployments",
            kind: "paragraph",
            body:
              "**VLANs** let one physical switch behave as several independent networks. Ports are assigned to a VLAN, and inter-VLAN traffic must pass through a router or a layer-3 switch — which is exactly the point: it creates a place to apply policy. A trunk carries several VLANs over one cable using 802.1Q tags. The most common mistake is forgetting to configure the same VLAN list at both ends of a trunk, which produces a network that works for some hosts and silently drops everyone else.\n\n**NAT** rewrites addresses (and ports for PAT) as packets cross the router. It conserves IPv4 addresses and incidentally hides internal structure, which people mistake for security. Practical consequences: inbound connections require port forwarding or a relay; protocols that embed IP addresses in payloads need ALG helpers; and logs at the destination show the router's public address, so network forensics requires NAT logging on the gateway.\n\n**MTU** is the largest frame a link will carry, normally 1500 bytes of payload. Efficient transport requires discovering the largest size the whole path allows — **PMTUD** does this using ICMP \"fragmentation needed\" messages. Blocking ICMP at a firewall is therefore not harmless: it breaks PMTUD, and users see pages that hang on load and connections that fail only in one direction. Tunnels (IPsec, GRE, WireGuard on some setups) shrink the usable MTU, so the standard fix is to lower the tunnel interface MTU or clamp TCP MSS — and the standard mistake is to do neither.",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"The router chooses the fastest route.\"** It chooses the most specific, then the lowest metric. Nothing measures the current speed of a link per packet.\n- **Redistributing a default route into a routing domain.** One leaked `0.0.0.0/0` can pull an organisation's traffic through the wrong exit; this is one of the most common self-inflicted outages.\n- **Blocking ICMP entirely.** You lose ping (annoying) and PMTUD (a genuine fault), and you make traceroute useless for everyone who will have to debug your network.\n- **Assuming symmetric routing.** Traffic out and back can take different paths. Anything that inspects state — many firewalls, some load balancers — depends on both directions returning the same way.\n- **Treating BGP as a routing protocol with guarantees.** It is policy-based and globally unauthenticated by default; treat prefix announcements as claims you should validate.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Concept", "Decides", "Scale", "Failure signature"],
              ["MAC learning / flooding", "Which port a frame leaves by", "One link", "Unknown frames flood everywhere; loops saturate the LAN"],
              ["VLAN", "Which logical network a frame belongs to", "One campus", "Some hosts work, others vanish after a switch change"],
              ["OSPF / IS-IS", "Best path inside an organisation", "One organisation", "Slow convergence, suboptimal routes, adjacency flaps"],
              ["BGP", "Which organisation can reach a prefix", "The internet", "Traffic goes to a stranger; a prefix disappears worldwide"],
              ["NAT / PAT", "Which internal host an external reply belongs to", "One gateway", "Inbound connections fail; logs show only the gateway"],
              ["PMTUD / MSS clamping", "How large a packet may be", "One path", "Connections establish, then hang on large transfers"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Routers forward one packet at a time using the most specific matching route, and routing protocols are how those tables are built and shared: OSPF inside, BGP between organisations. Switches forward by learned MAC addresses inside one network, with VLANs carving that network into segments that force policy through a router. NAT and MTU handling are the two implementation details that most often break real deployments, and both are visible in a routing table and a packet capture long before they are visible in a support ticket.",
          },
        ],
        keyPoints: [
          "Explain longest prefix match and why the default route is only chosen last.",
          "Distinguish interior routing (OSPF, IS-IS) from exterior policy routing (BGP) and say what each optimises for.",
          "Describe how a switch learns and floods, and why loops require spanning tree.",
          "Explain what a VLAN does, and why inter-VLAN traffic must cross a router.",
          "Diagnose a path MTU problem from its symptoms, and explain why blocking ICMP breaks it.",
        ],
        exercises: [
          "Print your routing table and identify which route a packet to three different destinations would take, quoting the matching prefix for each.",
          "Capture a traceroute and explain why the destination IP never changes while the link addresses do, at every hop.",
          "Configure two VLANs on a managed switch (or a simulator) with a trunk between two switches, then break the trunk's VLAN list deliberately and record the symptom.",
          "Find the MTU of your own connection path by sending packets with the DF bit set at decreasing sizes, and record the largest size that succeeds.",
          "Read one published BGP incident report and summarise, in four sentences, what was announced, who was affected, and what would have prevented it.",
        ],
        challenge:
          "Design the addressing and routing plan for a three-site organisation: subnets per site and per function (staff, servers, guests, cameras), the routes each site's router needs, the metric or policy for choosing between two ISPs, and the MTU and MSS settings for the tunnel between sites. Write it as a configuration note another engineer could implement, including the two failure modes your plan tolerates and the one it does not.",
      }),
    ]
  ),

  module(
    "designing-networks",
    "02 · Designing networks that behave",
    "Subnetting as arithmetic, redundancy, quality of service, and the evidence that it works.",
    [
      lesson({
        id: "subnetting-and-redundancy",
        title: "Subnetting, segmentation and redundancy",
        summary:
          "A network design is mostly two decisions repeated: how you slice the address space, and what happens when a piece fails. This lesson makes subnetting arithmetic routine — masks, usable ranges, host counts, VLSM planning — then covers segmentation as a security control, redundancy and the trade-off between availability and complexity, and capacity planning based on measured traffic rather than vendors' claims.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Subnetting looks like arithmetic homework until the moment you have one `/24` left, eight departments, and cameras that must not share a broadcast domain with staff laptops. Then it is a design exercise with consequences: a badly planned subnet means renumbering a building later, or flattening the network and losing the ability to filter anything.",
          },
          {
            heading: "Definition: mask, prefix and usable hosts",
            kind: "definition",
            body:
              "A **subnet mask** marks how many bits of an IPv4 address identify the network. `/24` (`255.255.255.0`) means 24 network bits and 8 host bits.\n\nUsable hosts for a prefix are `2^(32 − prefix) − 2`: subtract the network address (all host bits zero) and the broadcast address (all host bits one). So a `/24` has 254, a `/26` has 62, a `/30` has exactly 2 — which is why point-to-point links use `/30` or `/31`.\n\n**VLSM (variable-length subnet masking)** is simply planning different-sized subnets from one block: take `192.168.10.0/23` and carve `/26` for the server room (62 hosts), `/25` for staff (126), `/28` for cameras (14) and `/29` for the uplink. Allocate from largest to smallest, write the plan down, and reserve a block you have not spent yet.\n\nSegmentation is the security half of the same idea: each subnet is a place to apply a rule. Guest Wi-Fi on its own subnet cannot reach the records server at all; cameras cannot originate connections to the internet; the management interface of the switch is reachable only from the admin VLAN.",
          },
          {
            heading: "Redundancy: what you are actually buying",
            kind: "paragraph",
            body:
              "Availability is a product of every component in the path, and redundancy only helps when the components fail independently. Practical patterns:\n\n- **Dual WAN.** Two providers (say a fibre link and a 5G router) with automatic failover to a second default route. Buy from two *different* carriers: two lines from one ISP usually share a duct and a regional exchange.\n- **Link aggregation / redundant links.** Two cables between switches, with LACP for capacity or spanning tree for resilience. Loops are only safe with STP or LACP in place.\n- **Dual power.** Two power supplies in the core switch, each on a different circuit, both on UPS. The UPS covers the gap until the generator (if any) starts.\n- **First-hop redundancy.** VRRP or HSRP gives end devices one virtual gateway address that survives the failure of one router, so nobody has to change DHCP leases at 2 a.m.\n- **Diverse paths.** Redundant links in the same conduit are not redundant if a backhoe cuts the conduit.\n\nCost and complexity are real. Every redundant path doubles the possible states of the network, and a design nobody can debug is not highly available — it is merely complicated. A common, defensible order of work: UPS first, then dual power, then a second ISP, then redundant switching, then diverse paths.\n\nFor each component, ask three questions: how likely is it to fail, how long does it take to replace, and does the business stop while it is gone? That last question is what justifies spending.",
          },
          {
            heading: "Worked example: planning a two-floor clinic",
            kind: "example",
            body:
              "The requirement: 60 staff devices, 20 guest devices, 12 cameras, 8 printers, 2 servers, 4 wireless access points, one fibre uplink, and a facility network for the lab equipment.\n\nStart from a private block and allocate by size, largest first, leaving room to grow: give each floor's staff a `/25` (126 hosts) — two floors, two subnets, so a broadcast storm on one floor does not affect the other. Cameras on a `/28` (14). Guests on a `/26`, isolated from everything except the internet. Servers on a `/27`. The lab equipment on a `/28`. Uplinks and switch management on `/30` or `/29` slices, one per device.\n\nThen write the rule set that segmentation enables: guests → internet only; staff → servers and internet; cameras → nothing except the recorder and NTP; management ports → admin subnet only; all inter-subnet traffic through the layer-3 switch or firewall, where it can be logged.\n\nFinally, the resilience plan: a UPS sized for 20 minutes at the measured load, dual power supplies to the core switch, a 5G failover router, and a written, rehearsed instruction card for what staff do when the main link dies.",
            code:
              "# The plan, written out as a table in a design note\n  10.20.0.0/16   facility block, reserved\n  10.20.0.0/25     Floor 1 staff        126 hosts   gateway .1\n  10.20.0.128/25   Floor 2 staff        126 hosts   gateway .129\n  10.20.2.0/27     Servers               30 hosts   gateway .1\n  10.20.2.32/28    Lab equipment         14 hosts   gateway .33\n  10.20.2.48/28    Cameras               14 hosts   gateway .49\n  10.20.2.64/26    Guests                62 hosts   gateway .65\n  10.20.2.128/28   Management            14 hosts   gateway .129\n  10.20.2.144/30   Fibre uplink          point-to-point\n  10.20.2.148/30   5G failover           point-to-point\n  10.20.4.0/22     Unallocated — leave empty on purpose\n\n# Rules that only exist because the network is segmented:\n#  guests     → any (internet only, client isolation on)\n#  staff      → servers, internet, printers\n#  cameras    → recorder, NTP   (and nothing can start a connection to them)\n#  lab        → servers, internet\n#  management → admin VLAN only",
            language: "text",
            codeLabel: "A subnet plan and the policy it makes possible",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Flat networks \"because it is simpler\".** One subnet for everyone means no useful filtering, one broadcast domain and one blast radius. Simplicity at design time is paid for at incident time.\n- **Allocating subnets in order of asking.** Plan by size, largest first, or you will fragment the block and run out while addresses remain free but unusable.\n- **Redundancy that is not independent.** Two switches on the same power strip, two links in the same duct, two ISPs on the same poles: each fails together.\n- **DHCP for everything.** Printers, cameras, servers and access points should have reserved or static addresses, outside the DHCP pool, documented in one place.\n- **Sizing for today.** A clinic adds a floor; a school adds a lab. Keep a block that is genuinely free, and note it in the plan rather than discovering it later.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Prefix", "Mask", "Total addresses", "Usable hosts", "Typical use"],
              ["/24", "255.255.255.0", "256", "254", "Small office, one department"],
              ["/25", "255.255.255.128", "128", "126", "Half a floor, ~100 devices"],
              ["/26", "255.255.255.192", "64", "62", "Guest Wi-Fi, small lab"],
              ["/27", "255.255.255.224", "32", "30", "Server segment, small teams"],
              ["/28", "255.255.255.240", "16", "14", "Cameras, printers, small device groups"],
              ["/30", "255.255.255.252", "4", "2", "Point-to-point links"],
              ["/31", "255.255.255.254", "2", "2 (RFC 3021)", "Modern point-to-point links"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Subnetting is arithmetic in service of policy: `2^(32 − prefix) − 2` usable hosts, allocated largest-area-first, giving every function its own blast radius and its own rule set. Redundancy is bought in independent layers — power, link, path, provider — and only counts when the components fail separately. A design note with a subnet table, a rule set and a rehearsed failure plan is what turns networking from a series of emergencies into engineering.",
          },
        ],
        keyPoints: [
          "Compute usable hosts for any prefix and choose a prefix for a given host count.",
          "Plan a VLSM allocation from one block, largest first, and reserve spare space deliberately.",
          "Write the firewall rules that segmentation makes possible for staff, guests, servers and devices.",
          "List five redundancy techniques and name the failure each one covers.",
          "Decide what deserves a static address and where the DHCP pool should sit.",
        ],
        exercises: [
          "From `172.20.8.0/22`, allocate subnets for 200 staff devices, 50 guests, 30 servers, 14 cameras and four point-to-point links. Show the binary boundary for each and state how many addresses remain free.",
          "For each prefix from `/22` to `/30`, write the mask and the usable host count without using a calculator, then check yourself.",
          "Take a flat `/24` network you know and redesign it with at least three subnets. Write the rule between each pair of subnets and one attack the segmentation prevents.",
          "List every single point of failure on your own network and order them by (likely to fail) × (cost of downtime). Propose the cheapest fix for the top three.",
          "Write the one-page failure card a non-technical colleague should follow if the main internet link dies: what to check, who to call, and what the fallback is.",
        ],
        challenge:
          "Produce a complete network design document for a two-floor organisation of your choice: a subnet plan with addresses and sizes, a device inventory with static and DHCP ranges, a segmentation policy expressed as rules, a redundancy plan justified against cost, and a measured capacity estimate for the uplink. Present it as if a client were paying for it, and be explicit about one trade-off you accepted rather than solved.",
      }),

      lesson({
        id: "network-performance-and-observability",
        title: "Network performance, monitoring and failure",
        summary:
          "The last lesson of the course is about evidence: how to measure a network so that arguments end, how throughput, latency, jitter and loss interact with TCP's own behaviour, how to monitor a network for the failures that matter, and how modern topologies — spine-and-leaf, SDN, CDNs and cloud networks — change the way performance is designed rather than repaired.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "\"The network is slow\" is not an observation, it is a complaint. Turning it into a measurement — which hop, which direction, which time of day, which application, and what the numbers were before — is what network engineers are paid for. This lesson builds the toolkit: what to measure, how to interpret it, and what to watch continuously so that problems are known before users report them.",
          },
          {
            heading: "Definition: the four measurements and how TCP reacts to each",
            kind: "definition",
            body:
              "**Throughput** is achieved bit rate. **Latency** is round-trip delay. **Jitter** is the variation in that delay. **Loss** is the percentage of packets never delivered.\n\nThese four interact through TCP's congestion control, and the interaction explains nearly every \"slow network\" that is not actually a slow link:\n\n- **Bandwidth-delay product.** A link's capacity is rate × delay. A 10 Mbps link with 200 ms of round-trip time has 250 KB of data \"in flight\" at any moment. A single TCP stream will not fill it unless the window is large enough — which is why a file download from Europe can be slow on a link that is idle.\n- **Loss is treated as congestion.** TCP assumes a lost packet means a full queue and halves its sending rate. One per cent loss on a long path can reduce throughput by more than half, so loss is usually a *throughput* problem, not an annoyance.\n- **Jitter and loss break real-time media first.** Voice and video do not retransmit; they buffer. Beyond roughly 150 ms of one-way delay, 30 ms of jitter or 1% loss, users hear it.\n- **Header and protocol overhead is real.** VLAN tags, tunnels and encryption each subtract usable payload. A VPN can halve throughput while bandwidth graphs look unchanged.\n\nMeasuring well means measuring the right thing: `iperf3` for capacity between two hosts, `ping` for latency and loss over time, `mtr`/`traceroute` for *where* the loss starts, a packet capture for what is actually on the wire, and flow data (NetFlow, sFlow) for who is using the link.",
          },
          {
            heading: "Monitoring a network without drowning in alerts",
            kind: "paragraph",
            body:
              "Three layers of visibility, cheapest first:\n\n1. **Availability.** ICMP to gateway, uplink and key services; SNMP for interface up/down, CPU and temperature; DHCP lease counts. Alert on state changes, not on every poll.\n2. **Performance.** Round-trip latency and loss to a small set of references, interface utilisation with a threshold, error and discard counters, Wi-Fi client counts and retry rates. Trends are more useful than spikes: a link that is 70% utilised at 8 p.m. every day is a planning signal.\n3. **Flow and content.** NetFlow/IPFIX or sFlow summaries show which host, application or subnet is consuming the link, without capturing anything. Full packet capture is for incidents and should be time-boxed and stored deliberately, because it contains personal data.\n\nThen, the discipline that makes monitoring useful: **alert on symptoms users feel**, define thresholds you can defend, and write a runbook for each alert that says what to check and who to call. An alert nobody acts on trains everybody to ignore alerts. Two metrics that earn their keep where most fail: median latency per site, and the count of failed DHCP leases — both move before users complain.",
          },
          {
            heading: "Modern topologies and what they change",
            kind: "paragraph",
            body:
              "**Spine-and-leaf** replaced the three-tier core/distribution/access design in data centres because it gives predictable, equal-cost paths: every leaf connects to every spine, and routing (often BGP, even inside) balances traffic across them. Predictability, not peak speed, is the goal — worst-case latency between any two racks is fixed.\n\n**SDN and network automation** move configuration from individual devices to a controller and source-controlled templates. The benefit is consistency and auditability: 200 switches configured from one template cannot drift. The risk is blast radius — one bad template applies everywhere — so change windows, canaries and rollback matter more, not less.\n\n**Overlay networks** (VXLAN, WireGuard, service meshes) build a logical network on top of the physical one, which is how cloud providers give each customer an address space that looks private and how Kubernetes gives every pod an address. Overlays trade simplicity for isolation, and typically cost 5–15% of throughput and a chunk of MTU.\n\n**Cloud networking** turns the physical design into configuration: virtual private clouds, subnets per availability zone, security groups as stateful firewalls, and load balancers that most teams never see. The engineering habits that carry over are the ones this course taught: segment by function, keep infrastructure out of the DHCP range, avoid single points of failure, and measure rather than assume.\n\n**CDNs** are latency engineering made a product: caching content at hundreds of locations so that a learner in Accra fetches a video from a cache in Accra instead of from Europe. Every millisecond saved is multiplied by the number of round trips a page needs, which is why a well-configured CDN can make a site feel twice as fast with no change to the code.",
          },
          {
            heading: "Worked example: proving where the problem is",
            kind: "example",
            body:
              "A user reports that the platform is slow. Four measurements, in order, take five minutes and produce a defensible answer.\n\nStart with latency and loss over a minute to the gateway, the ISP's first hop and the destination. `mtr` combines traceroute and ping and shows loss per hop *and* per hop cumulative — the key skill is reading column by column: loss that appears at hop 3 and continues to the end is a real problem at hop 3; loss that appears only in the last column is at the destination or beyond.\n\nThen measure capacity with `iperf3`, once against the gateway and once against an external reference. If the LAN gives 940 Mbps and the external path gives 12 Mbps on a 50 Mbps plan, the LAN is innocent and the wide area is the suspect.\n\nThen look at the browser's own numbers. A page that spends 1.8 s in \"waiting for server response\" is a server or database problem, not a network one; a page that spends its time in connection setup is latency; a page slowed by many parallel requests is a caching or bundling problem.\n\nFinally, check utilisation and flows on the uplink at the time the complaint happened. A backup job that runs at 14:00 and saturates the link is a scheduling problem, and the fix is a policy change, not new hardware.",
            code:
              "$ mtr -r -c 20 93.184.215.14\nHOST                     Loss%   Snt   Last   Avg  Best  Wrst StDev\n1  192.168.1.1            0.0%    20    2.1   2.3   1.9   4.0   0.5\n2  10.11.0.1              0.0%    20    9.8  10.2   9.1  14.6   1.1\n3  core.isp.gh            0.0%    20   18.4  19.0  17.7  26.2   2.0\n4  * * *                  0.0%    20    —     —     —     —      —     (no ICMP reply, not a fault)\n5  lon1.example.net      35.0%    20  198.4 201.7 196.2 244.9  12.4\n6  edge.example.net      35.0%    20  199.0 202.4 197.1 251.0  13.1\n\n# Reading: loss appears at hop 5 and persists → the problem is at or after hop 5,\n# not at hop 4, which simply does not answer ICMP.  Average 200 ms RTT.\n\n$ iperf3 -c 192.168.1.254\n[SUM]   0.00-10.00 sec   1.10 GBytes   944 Mbits/sec     # LAN is healthy\n$ iperf3 -c speedtest.example.net\n[SUM]   0.00-10.00 sec  14.9 MBytes  12.5 Mbits/sec      # WAN is the bottleneck",
            language: "text",
            codeLabel: "From complaint to evidence, in four measurements",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Reading per-hop loss as a fault at that hop.** Routers deprioritise ICMP when busy. Loss must appear at a hop *and continue* to be meaningful.\n- **Trusting one ping.** Run enough packets to see the distribution: p50 and p95 latency, and loss over minutes, not four samples.\n- **Blaming bandwidth when the problem is a single stream.** One TCP connection cannot always fill a fast, high-latency link; more streams can.\n- **Monitoring everything equally.** A hundred useless alerts hide the three that matter. Alert on user-visible symptoms and write a runbook for each.\n- **Ignoring the Wi-Fi side.** In practice, most \"slow internet\" in offices is retries, channel overlap or a client stuck on 2.4 GHz with a weak signal. Interface statistics on the access point tell the truth.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Tool / data", "Question it answers", "Watch out for"],
              ["ping", "Latency, jitter, loss to one host over time", "ICMP may be rate-limited; small samples mislead"],
              ["mtr / traceroute", "Which hop introduces loss or delay", "Per-hop loss that does not continue is usually cosmetic"],
              ["iperf3", "Achievable throughput between two hosts", "Test both directions; a single stream may understate capacity"],
              ["Packet capture", "What exactly is on the wire", "Privacy: time-box it and store it deliberately"],
              ["SNMP / interface counters", "Utilisation, errors, discards, device health", "Poll safely; counters alone do not describe user experience"],
              ["NetFlow / sFlow", "Who and what consumes the link", "Sampling rates affect accuracy; keep retention short"],
              ["Synthetic tests", "Is the service reachable and fast from outside-in", "Test from where your users actually are"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Performance is four measurements — throughput, latency, jitter and loss — interpreted through TCP's congestion behaviour, and monitoring is the discipline of watching the few things that move before users complain. Modern designs (spine-and-leaf, overlays, software-defined and cloud networking, CDNs) change where the engineering happens but not what it optimises: predictable paths, independent failure domains, and evidence. The engineer who arrives at a problem with `mtr`, `iperf3`, flow data and a browser timeline wins the argument before it starts.",
          },
        ],
        keyPoints: [
          "Define throughput, latency, jitter and loss, and explain how TCP's congestion control couples loss to throughput.",
          "Explain the bandwidth-delay product and why one TCP stream may not fill a fast link.",
          "Use mtr, iperf3, a packet capture and flow data to locate a performance problem.",
          "Design monitoring in three layers and write a runbook for each alert worth keeping.",
          "Explain what spine-and-leaf, overlays, SDN and CDNs each change about network design.",
        ],
        exercises: [
          "Run `mtr` to three destinations in different regions for a minute each. Record p50/p95 latency and any loss, and state which hop introduces it.",
          "Measure the same transfer with one TCP stream and with eight parallel streams. Explain the difference using the bandwidth-delay product.",
          "Instrument one connection with interface counters before, during and after a large download, and identify the actual bottleneck.",
          "Define three alerts for a small network — one availability, one performance, one capacity — with thresholds you can defend, and write the runbook line for each.",
          "Compare the same page load from your home link and from a mobile hotspot. Record the browser's own phase timings and explain the largest difference.",
        ],
        challenge:
          "Take one real \"slow network\" complaint and produce an evidence pack: a timeline of when it happens, latency and loss graphs from at least two vantage points, a throughput measurement on the LAN and the WAN, the top talkers at that time, and a written conclusion naming the cause and the fix with its cost. If your conclusion is \"the ISP\", show the measurement that proves it and would survive a support argument.",
      }),
    ]
  ),
];
