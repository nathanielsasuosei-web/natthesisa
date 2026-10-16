import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cloud Computing & DevOps — running software on somebody else's computers,
 * and shipping it there safely.
 *
 * The course is two halves that only make sense together: what the cloud gives
 * you (elastic infrastructure, managed services, a bill that follows usage) and
 * how professionals deliver to it (containers, infrastructure as code, CI/CD,
 * observability and incident response). Every lesson ends with something the
 * learner has actually configured, not only read about.
 */

export const CLOUD_COMPUTING_DEVOPS_MODULES: CourseModule[] = [
  module(
    "cloud-foundations",
    "01 · Cloud foundations",
    "What the cloud is, who is responsible for what, and how to design for it.",
    [
      lesson({
        id: "what-the-cloud-is",
        title: "What the cloud actually is",
        summary:
          "The cloud is other people's computers, rented by the second, with an API. This lesson separates the marketing from the engineering: the three service models and what each one moves to the provider, regions and availability zones, the shared-responsibility line that decides who fixes what, the core service categories you will use, and the pricing model that makes a badly designed system expensive while a well-designed one scales down as well as up.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Every organisation in Ghana that runs software now faces the same decision: a server in a room with a UPS, or a cloud account billed monthly. The honest answer is usually \"both, for different things\" — and the reason to understand the cloud properly is that the wrong choice is expensive in a way that is hard to reverse. Migration is cheap in one direction (a test database) and painful in the other (three years of accumulated configuration nobody documented).",
          },
          {
            heading: "Definition: cloud, service models and deployment models",
            kind: "definition",
            body:
              "**Cloud computing** is on-demand access to a shared pool of configurable computing resources — compute, storage, network, databases — that can be provisioned and released through an API, with usage-based billing. The three defining properties are *self-service* (no ticket to get a server), *elasticity* (more when you need it, less when you do not) and *measured usage* (you pay for what you consume, not for a box).\n\nThe three service models move a different amount of responsibility to the provider:\n\n- **IaaS — Infrastructure as a Service.** You rent virtual machines, disks and networks. You install and patch the operating system and everything above it. Maximum control, maximum work. Example: a Compute Engine or EC2 instance.\n- **PaaS — Platform as a Service.** You give it code or a container; it runs, scales and patches the platform. You give up control of the runtime. Example: a managed app platform or a container service.\n- **SaaS — Software as a Service.** You use finished software: email, a CRM, a payments dashboard.\n\nBeyond those, the modern cloud is mostly **managed services** for the hard parts: managed databases (with backups and replicas handled), object storage, queues, identity, logging and machine learning. Choosing managed services is usually the single biggest reduction in operational work available to a small team.\n\n**Deployment models:** *public* (a provider's shared infrastructure), *private* (your own cloud stack, on your own hardware — control at a cost), *hybrid* (some workloads on-premises for latency, data-residency or legacy reasons, connected to public cloud), and *multi-cloud* (deliberately using two providers, which doubles the skill set unless there is a real reason).",
          },
          {
            heading: "Regions, zones and the shared-responsibility line",
            kind: "paragraph",
            body:
              "A **region** is a geographic cluster of data centres (for example, `europe-west1` or a South African region). A region contains two or more **availability zones** — physically separate buildings with independent power and cooling, connected by fast private links. This hierarchy is the basis of every high-availability design: a single instance in a single zone is one backhoe away from an outage; the same workload across two zones survives the loss of one building. Multi-region is a different, much more expensive decision, justified by disaster recovery or by serving users on another continent with low latency.\n\n**Data residency** matters legally, not just technically. If personal data must stay in a jurisdiction, the region you pick is a compliance decision. Under Ghana's Data Protection Act (2012, Act 843), a data controller that transfers personal data abroad must ensure an adequate level of protection — and the simplest way to honour that is often to choose a region and document why.\n\nThe **shared-responsibility model** draws the line between you and the provider, and it moves with the service model:\n\n- In **IaaS**, the provider secures the buildings, hardware and hypervisor. You patch the operating system, configure the firewall rules, manage the application and its data.\n- In **PaaS**, the provider also patches the runtime and the platform. You still own your code, your configuration and your data.\n- In **SaaS**, the provider runs the application; you own the accounts, permissions and the data you put in it.\n\nMost real incidents are not \"the cloud went down\". They are configurations on the customer's side of that line: a storage bucket left world-readable, a security group opened to `0.0.0.0/0`, an access key committed to a public repository. The line is a design tool: if you cannot say which side a control is on, you cannot say who is accountable for it.",
          },
          {
            heading: "Worked example: the same service, three ways",
            kind: "example",
            body:
              "Take one small web application with a database and about 5,000 daily users, and price the three approaches honestly by *work*, not just money.\n\n**A server in the office.** A tower machine, a UPS, a fixed IP from the ISP, and somebody on call when the power or disk fails. Monthly cost is low and known; risk sits entirely with you, and scaling means buying hardware. This is still the right answer for some workloads — a lab machine, an internal tool with no public exposure — and it is a good place to learn Linux.\n\n**IaaS.** Two virtual machines across two zones behind a load balancer, a managed database with automated backups, object storage for uploads. You patch the operating system, harden SSH, manage certificates and write the deployment scripts. You get real availability and an hourly bill.\n\n**PaaS plus managed services.** Push a container or a repository; the platform builds, runs, scales and issues TLS certificates. The database is a managed connection string. You now spend your time on the application and the data model. The trade-off is less control (you cannot tune the kernel) and vendor-specific behaviours you must learn.\n\nThe lesson is that the decision is not \"cloud or not\". It is *which layer of responsibility you want to own* for each part of your system — and it is normal to answer differently for different components.",
            code:
              "# The same application, described three ways (abbreviated)\n\n# 1. IaaS — you own the operating system\nresource \"aws_instance\" \"web\" { ami = \"ubuntu\"  instance_type = \"t3.small\" }\nresource \"aws_instance\" \"web_b\" { ami = \"ubuntu\" instance_type = \"t3.small\" }\nresource \"aws_db_instance\" \"db\" { engine = \"postgres\" multi_az = true }\n# plus: security groups, ssh keys, nginx config, TLS certs, deploys, patches\n\n# 2. PaaS — the platform owns the runtime\n#   git push  →  build  →  container  →  3 replicas  →  TLS  →  autoscale\n#   environment variables supply DATABASE_URL; the platform handles restarts\n\n# 3. SaaS — you own the configuration\n#   the CRM, the mail, the payments dashboard: accounts, roles, exports, retention",
            language: "text",
            codeLabel: "Where the responsibility line sits in each model",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"The cloud is automatically available and secure.\"** The provider guarantees the building and the hypervisor. Availability across zones, backups, access control and patching your side of the line are yours to design.\n- **\"Cloud is always cheaper.\"** A steady 24/7 workload with high, predictable utilisation can be cheaper on owned hardware. The cloud wins on elasticity, low capital cost and speed — not on every bill.\n- **Forgetting egress.** Storing data is cheap; moving it out is not. A video-heavy design can be dominated by bandwidth charges, which is why an architecture question is usually a *pricing* question in disguise.\n- **No budget guardrails.** One runaway loop, one forgotten GPU instance or one log-everything setting can cost more than a year of hosting. Budgets and alerts are a first-day task, not a February clean-up.\n- **Treating regions as interchangeable.** Latency to users, price, service availability and legal regime all differ. Choose region deliberately and write down why.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Category", "What it gives you", "You still own", "Typical use"],
              ["Compute (VMs, containers)", "CPU, memory, disk, network", "OS patching, app, firewalls", "Anything custom, legacy software, full control"],
              ["Objects and block storage", "Durable files, virtual disks", "Lifecycle rules, permissions, encryption", "Uploads, backups, static site assets"],
              ["Managed database", "Engine, replicas, backups, patching", "Schema, queries, access, retention", "Almost every application database"],
              ["Identity and access", "Users, roles, tokens, MFA", "Who gets which role, key rotation", "First service to configure, always"],
              ["Messaging and queues", "Durable hand-off between services", "Message design, retries, dead letters", "Background jobs, spikes, decoupling"],
              ["Managed AI / ML", "Model APIs, training and serving", "Prompts, data, evaluation, cost", "Assistants, classification, translation"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "The cloud is rented, elastic, API-driven infrastructure whose value is less about technology than about the responsibility you choose to delegate. Service models move that line (IaaS keeps it with you, PaaS and managed services move it to the provider), regions and zones are the units of latency and resilience, and the shared-responsibility model is what makes a security or availability plan answerable. Design decisions here are commercial as much as technical, and the ones that get expensive are the ones nobody wrote down.",
          },
        ],
        keyPoints: [
          "Define cloud computing by self-service, elasticity and measured usage, and distinguish it from a rented server.",
          "Compare IaaS, PaaS and SaaS by who owns the operating system, runtime and application.",
          "Explain regions, availability zones and when a multi-region design is justified.",
          "Use the shared-responsibility model to assign accountability for a specific control.",
          "Name the cost pitfalls (egress, idle resources, missing budgets) and the guardrail that catches each.",
        ],
        exercises: [
          "Take a system you use daily — a school portal, a shop's POS, a bank app — and state, for three of its parts, which service model each most resembles and why.",
          "Draw the shared-responsibility line for a VM, a managed database and a SaaS email service. Put patching, firewalls, backups and user accounts on the correct side of each.",
          "Choose a cloud region for a Ghanaian organisation serving users in West Africa. Justify it with latency, service availability, price and data-protection considerations.",
          "Estimate the monthly cost of a small web app three ways: one VM, two VMs with a managed database, and a PaaS deployment. Use published price lists and note your assumptions.",
          "List five configuration mistakes on the customer's side of the shared-responsibility line that cause breaches, and the setting that prevents each.",
        ],
        challenge:
          "Write a two-page decision note for an organisation choosing where to host a customer-facing service: the workload and its peak-to-average ratio, three options (on-premises, IaaS, managed platform) with monthly cost and operational effort estimated, the data-protection constraint, the failure modes of each, and a recommendation with the reasoning that a non-technical director could follow and challenge.",
      }),

      lesson({
        id: "cloud-native-architecture",
        title: "Cloud-native architecture",
        summary:
          "The cloud rewards systems that assume machines can disappear and demand can change: stateless services, externalised state, horizontal scaling, and failure handled as a normal event rather than an exception. This lesson covers those patterns — load balancing, autoscaling, object storage, managed databases, queues, caching, serverless — and the discipline of designing for cost and resilience at the same time, because in the cloud the two are the same conversation.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "A server that has been running in a cupboard for three years is designed around the assumption that it will keep running. The cloud breaks that assumption deliberately: instances are replaced, zones fail, capacity moves. Software that was written for the cupboard behaves badly in the cloud — losing sessions when it scales, storing uploads on a disk that vanishes with the instance, and failing entirely when a dependency slows down.",
          },
          {
            heading: "Definition: the properties of a cloud-native system",
            kind: "definition",
            body:
              "**Stateless services.** Any instance can serve any request, because nothing important is kept in that instance's memory or local disk. Sessions live in a shared store or are carried in signed tokens; uploads go to object storage; session data goes to Redis or a database. Statelessness is what makes scaling and replacement possible at all.\n\n**Externalised configuration.** Everything that differs between environments — database URLs, API keys, feature flags — comes from environment variables or a secret manager, never from a file committed to the repository. The same image runs in staging and production.\n\n**Horizontal scaling.** Add instances, not bigger instances. This works when services are stateless, idempotent where it matters, and able to share state through a store.\n\n**Loose coupling.** Services talk through queues, events or stable APIs with retries and timeouts, so one slow dependency degrades a feature instead of taking down the site.\n\n**Design for failure.** Assume every dependency will fail occasionally. Set timeouts shorter than a user's patience, retry with exponential backoff and jitter, use circuit breakers, and make sure removing a dependency leaves the system usable in a reduced form.\n\n**Health and readiness.** Liveness tells the platform when to restart an instance; readiness tells it when an instance may receive traffic. Confusing the two produces restart loops under load — one of the most common production mistakes.",
          },
          {
            heading: "The building blocks, and when each earns its place",
            kind: "paragraph",
            body:
              "**Load balancer.** Distributes requests, terminates TLS, performs health checks, and is the piece that makes several instances look like one address. Managed versions also handle certificates and DDoS absorption.\n\n**Autoscaling.** Adds instances when CPU, memory, queue depth or request rate crosses a threshold. Configure a minimum (so the system is never cold), a maximum (so a bug cannot bankrupt you), and a scale-in delay longer than your startup time.\n\n**Object storage.** For uploads, exports, backups and static assets. Cheap, effectively unlimited, served through a CDN. Never store user uploads on an instance's local disk in a system that scales.\n\n**Managed database.** Backups, point-in-time recovery, read replicas, failover. Two habits matter: keep migrations in version control and runnable by a pipeline, and never point production at a database with no tested restore. A backup you have not restored is a rumour.\n\n**Queue and workers.** Anything slow or bursty — sending email, generating a video, calling a model — belongs in a queue with a worker pool. The queue absorbs spikes, gives retries a home, and keeps request latency honest. Design dead-letter queues and decide what happens to a message that fails five times.\n\n**Cache.** Reduces database load and latency. Cache with a TTL and an explicit invalidation story, and be honest about staleness: caching a page that shows account balances is a product decision, not just a performance one.\n\n**Serverless.** Pay-per-invocation functions, no server to patch, instant scale to zero. Excellent for event handlers, webhooks and spiky traffic; awkward for long-running work, for workloads with heavy cold starts, and for teams without local emulation.\n\n**Containers.** Package the application and its runtime so that \"works on my machine\" stops being a category of bug. Covered properly in the next lesson — they are the delivery format the rest of this course assumes.",
          },
          {
            heading: "Worked example: making a session-breaking app scale",
            kind: "example",
            body:
              "An application keeps logins in memory, stores uploads on the instance disk, and calls a payment API synchronously with no timeout. On one server it works for years. Behind a load balancer with two instances, users are logged out at random and half the avatars are broken, and when the payment provider slows down the whole site waits.\n\nThe repair is four changes, none of them exotic:\n\n1. **Move sessions to a shared store.** A Redis instance (or a signed cookie if the session is small) means any instance can serve any request.\n2. **Move uploads to object storage.** The instance becomes disposable; images are served through a CDN.\n3. **Put the payment call behind a queue.** The request returns \"payment pending\" immediately; a worker processes it with retries and the UI polls status. Slow providers now cost latency in one feature, not availability of the site.\n4. **Add timeouts, retries and a circuit breaker** on every outbound call, and health/readiness endpoints so the platform replaces a sick instance instead of routing traffic into it.\n\nRead the Terraform below as the shape of the change: stateless compute, managed state, a queue in the middle, and a bucket for files.",
            code:
              "# The architecture, in the cloud's own vocabulary\n\n  Internet\n     │\n  [ CDN ] ── static assets ────────────────► [ Object storage ]\n     │                                              ▲\n  [ Load balancer, TLS ]                           │ uploads\n     │                                             │\n  [ App instances × N, stateless, autoscaled ] ────┘\n     │            │\n     │            └──► [ Queue ] ──► [ Workers ] ──► payment API (retries, DLQ)\n     │\n  [ Managed Postgres, multi-AZ ] ◄── [ Read replica ] ◄── reporting\n  [ Redis / cache ] ◄── sessions, rate limits\n\n# The properties that matter, stated as rules:\n#  • any instance can serve any request       (no local state)\n#  • no request waits on a third party        (queue the slow work)\n#  • every outbound call has a timeout        (2 s, then fail fast)\n#  • instances can be killed at any moment    (uploads, sessions external)\n#  • one zone can disappear                   (multi-AZ database, N ≥ 2 app)",
            language: "text",
            codeLabel: "From one box to a system that survives its own scaling",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Scaling out a stateful app.** Two instances with in-memory sessions produce \"logged out at random\", which teams often misdiagnose as a cookie bug for weeks.\n- **Synchronous calls to slow third parties.** A payment, SMS or model API with no timeout converts the provider's bad day into your outage. Queue it or time it out.\n- **Autoscaling with no maximum.** A retry storm or a badly indexed query scales until the budget or the database gives out.\n- **Backups that are never restored.** Test the restore into a scratch environment on a schedule, and write down how long it takes — that number is your real recovery time.\n- **Caching without invalidation.** A TTL you chose at random is a promise you are not keeping. Decide what staleness is acceptable and say it out loud.\n- **Multi-AZ everywhere except the disk.** Instances spread across zones with a single-zone database still fail together; redundancy has to cover the stateful parts too.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Pattern", "Solves", "Costs", "Do not use when"],
              ["Stateless service + LB", "Scale-out and instance replacement", "Shared session store, discipline", "The workload is genuinely single-instance and small"],
              ["Queue + workers", "Spikes, slow dependencies, retries", "Eventual consistency, more moving parts", "The work must complete inside the request"],
              ["Cache", "Database load and latency", "Staleness, invalidation complexity", "Data must be perfectly fresh"],
              ["Read replicas", "Read-heavy reporting", "Replication lag, cost", "All traffic is writes or consistency-critical"],
              ["Serverless", "Spiky, event-driven workloads", "Cold starts, execution limits, vendor lock-in", "Long-running jobs or heavy steady traffic"],
              ["CDN", "Latency for distant users, bandwidth cost", "Cache configuration, purging", "Content is fully private and uncacheable"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Cloud-native design is a set of consequences of two facts: instances can disappear and demand can change. Make services stateless, push state into managed services, put slow work behind a queue, set timeouts and retries on every outbound call, and design for the failure of each dependency. Done well it also makes the system cheap, because idle instances autoscale away, caches reduce database size, and a queue turns a traffic spike into a slightly longer wait instead of a second purchase order.",
          },
        ],
        keyPoints: [
          "Explain why statelessness is the precondition for scaling and instance replacement.",
          "Choose between load balancing, autoscaling and queues for a given bottleneck.",
          "Design timeouts, retries, backoff and dead-letter handling for a dependency that fails.",
          "Say where sessions, uploads and configuration must live in a scaled system.",
          "Pair every resilience decision with its cost consequence, and name the guardrail that limits it.",
        ],
        exercises: [
          "Take an application you have built or studied and list everything it keeps in local memory or on local disk. Move each item to a shared service on paper.",
          "Design the request flow for image upload: browser → API → object storage → CDN → browser, naming the access control at each step.",
          "Write the timeout, retry and circuit-breaker policy for a payment API and a model API, and justify the numbers.",
          "Sketch a queue-based design for sending 20,000 emails after a registration spike, including retries and a dead-letter queue.",
          "Define what staleness is acceptable for three kinds of data — a leaderboard, an account balance, a product catalogue — and choose a caching strategy for each.",
        ],
        challenge:
          "Produce an architecture diagram and a one-page rationale for a service that must survive the loss of one availability zone, a surge of five times normal traffic for an hour, and a slow third-party API — while staying inside a stated monthly budget. Label every managed service, state the maximum instance count, and list the three failure modes you accept rather than solve.",
      }),
    ]
  ),

  module(
    "devops-delivery",
    "02 · DevOps and delivery",
    "Containers, infrastructure as code, pipelines and running what you shipped.",
    [
      lesson({
        id: "containers-and-infrastructure-as-code",
        title: "Containers and infrastructure as code",
        summary:
          "Containers solved the oldest problem in delivery — it works on my machine — by packaging an application with its dependencies into one immutable image. Infrastructure as code solved the second — nobody remembers what we clicked — by describing servers, networks and databases in versioned files. This lesson covers what a container really is, how images and registries work, what orchestration adds, and how to write infrastructure that can be reviewed, reproduced and rolled back.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "Two teams describe the same outage. One says \"it worked in staging\", because staging had Python 3.11 and production had 3.9. The other says \"the security group was fine\", because somebody changed it in the console in February and nobody wrote it down. Containers and infrastructure as code exist to remove both sentences from your vocabulary, and together they are the difference between environments that can be recreated and environments that can only be feared.",
          },
          {
            heading: "Definition: image, container, registry, orchestration",
            kind: "definition",
            body:
              "**A container** is a process (or a few) running in an isolated view of the operating system: its own filesystem, its own network namespace, its own process tree. It shares the host kernel, which is why containers start in milliseconds and weigh megabytes, unlike a virtual machine that carries a whole operating system.\n\n**An image** is the immutable, layered template a container is created from: a base (a minimal Linux distribution), your runtime, your dependencies, your code. Each instruction in the Dockerfile creates a layer, layers are cached and shared, and the same image ID runs identically on your laptop, in CI and in production.\n\n**A registry** stores images by tag. `app:1.4.2` is a release; `app:latest` is a moving target and should never be what production runs — deploy an immutable tag or, better, the image digest.\n\n**Orchestration** (Kubernetes and its managed variants) schedules containers across a cluster, restarts the ones that die, scales them, exposes them through services, and rolls out new versions gradually. It is a genuinely large system: use it when you have several services and a team, and consider a simpler managed container platform when you have one service and one person.\n\n**Infrastructure as code (IaC)** describes resources in files — networks, subnets, firewall rules, databases, buckets, clusters — which a tool compares against reality and makes true. **Terraform/OpenTofu** is declarative and provider-agnostic; **Pulumi** uses a general-purpose language; cloud-native tools (CloudFormation, ARM/Bicep) are provider-specific. The properties that matter are the same in all of them: the definition lives in version control, changes are reviewed as pull requests, and the same files can create a second environment in another region.",
          },
          {
            heading: "How an image is built well",
            kind: "paragraph",
            body:
              "A Dockerfile is a short document with outsized consequences. Six habits:\n\n1. **Start from a small, specific base.** Pin the version (`node:22-alpine`, `python:3.13-slim`) rather than `latest`, so a rebuild tomorrow does not silently change the runtime.\n2. **Order instructions by how often they change.** Copy dependency manifests and install first, then copy source. A one-line code change then reuses the cached dependency layer instead of reinstalling everything.\n3. **Run as a non-root user.** A container that is compromised should not be root inside its own namespace.\n4. **Keep secrets out.** No keys in the image, ever — environment variables or a secret manager inject them at run time. An image is a downloadable file; a key inside it is a key you have published.\n5. **Add a health check and a graceful shutdown.** The orchestrator needs to know when to send traffic and must be able to stop the process without dropping in-flight requests.\n6. **Keep the image small.** Fewer packages mean fewer vulnerabilities to patch and faster pulls; a `.dockerignore` that excludes `.git`, tests and local data is free performance.",
          },
          {
            heading: "Worked example: a container and the infrastructure it runs on",
            kind: "example",
            body:
              "The Dockerfile below builds a Node.js API: dependencies installed first, a non-root user, one process per container, and a start command that is the only thing that varies between environments — everything else comes from the environment.\n\nThe Terraform that follows describes the same application in a cloud account: a network, two app instances behind a load balancer, and a managed database in a separate private subnet that nothing on the internet can reach. Nothing here is clicked in a console, so the whole environment can be created in a second region, reviewed by a colleague, and destroyed without leftovers.\n\nRead them together and the division of responsibility is clear: the *image* says what the application is; the *infrastructure* says where it runs and what it may talk to.",
            code:
              "# Dockerfile — the application, packaged\nFROM node:22-alpine\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci --omit=dev            # dependencies first: cached unless they change\n\nCOPY . .\nRUN addgroup -S app && adduser -S app -G app\nUSER app                          # never root in the container\n\nENV NODE_ENV=production PORT=3000\nEXPOSE 3000\nHEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1\nCMD [\"node\", \"dist/server.js\"]\n\n# terraform/main.tf — where it runs\nresource \"aws_vpc\" \"main\" { cidr_block = \"10.30.0.0/16\" tags = { Name = \"app\" } }\nresource \"aws_subnet\" \"public\"  { vpc_id = aws_vpc.main.id  cidr_block = \"10.30.1.0/24\" }\nresource \"aws_subnet\" \"private\" { vpc_id = aws_vpc.main.id  cidr_block = \"10.30.9.0/24\" }\n\nresource \"aws_lb\" \"app\" { internal = false  load_balancer_type = \"application\" }\nresource \"aws_lb_target_group\" \"app\" { port = 3000  health_check { path = \"/health\" } }\n\nresource \"aws_appautoscaling_target\" \"app\" {\n  min_capacity = 2\n  max_capacity = 6                # the guardrail against a runaway bill\n}\n\nresource \"aws_db_instance\" \"db\" {\n  engine = \"postgres\"  multi_az = true  publicly_accessible = false\n  storage_encrypted = true  backup_retention_period = 14\n}\n\n# $ terraform plan   → shows exactly what will change, before it changes\n# $ terraform apply  → makes reality match the files, in a reviewed commit",
            language: "text",
            codeLabel: "The image, and the environment it lives in",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **\"Containers are lightweight virtual machines.\"** They share the host kernel, which is why they are fast and why a kernel vulnerability crosses container boundaries. Isolation is real but different.\n- **Running as root and mounting the Docker socket.** Both are common in tutorials and both hand an attacker the host.\n- **Storing data inside a container.** Anything not on a mounted volume disappears when the container is replaced — which the orchestrator does constantly and on purpose.\n- **Editing the console \"just this once\".** Now the code and reality disagree. Either import the resource into Terraform or make the change in code; drift is how environments become unreproducible.\n- **`latest` in production.** You lose the ability to say what is deployed, to roll back, and to reason about a bug that only appears on some instances.\n- **Secrets in the Dockerfile or Terraform state.** State files contain everything in plain text: store them in an encrypted, access-controlled backend, and inject secrets at run time from a manager.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Question", "Container", "Virtual machine", "Serverless function"],
              ["Startup time", "Milliseconds", "Tens of seconds", "Cold start, then instant while warm"],
              ["Isolation", "OS-level namespaces", "Own kernel, hypervisor", "Provider-managed sandbox"],
              ["Packaging unit", "Image (layered, shareable)", "Disk image", "Code + dependencies + config"],
              ["You patch the OS?", "Base image and dependencies", "Yes, entirely", "No"],
              ["Long-running processes", "Yes", "Yes", "Limited by the platform's timeout"],
              ["Best for", "Reproducible services and jobs", "Legacy software, kernel control, strong isolation", "Event-driven handlers and spiky traffic"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Containers turn an application plus its dependencies into an immutable artifact that behaves the same everywhere; infrastructure as code turns the environment into files that can be reviewed, recreated and destroyed. Together they make environments disposable, which is the precondition for everything in the next lesson: automated pipelines, safe deploys and rollbacks you can trust at 2 a.m.",
          },
        ],
        keyPoints: [
          "Explain what a container is, why it is not a virtual machine, and what an image layer is.",
          "Write a Dockerfile that builds efficiently, runs as a non-root user and keeps secrets out.",
          "Describe what orchestration adds and when a simpler managed platform is the right answer.",
          "Explain how infrastructure as code makes environments reproducible and reviewable.",
          "Name the drift, state-file and tagging pitfalls that break repeatable deployments.",
        ],
        exercises: [
          "Containerise a small application you have written. Build the image twice — once after changing only one line of source — and time the second build to prove layer caching.",
          "Compare image sizes for the same app built on a slim base and a full base, and list what the extra megabytes contain.",
          "Write a Dockerfile that runs as non-root with a health check. Run `docker history` and explain the two largest layers.",
          "Describe the same three resources (network, app instances, database) in Terraform and run `terraform plan`. Explain every line of the planned output before applying.",
          "Introduce deliberate drift: change one resource in the console, re-run `plan`, and record how the tool reports the difference.",
        ],
        challenge:
          "Deliver one application as a container plus infrastructure as code: a pinned, multi-stage Dockerfile running as non-root, a compose file for local development, and Terraform that creates a network, two app instances, an autoscaling maximum and a private managed database. Deploy it, destroy it, redeploy it in under thirty minutes, and write the commands into a README that a colleague can run without asking you anything.",
      }),

      lesson({
        id: "ci-cd-observability-and-incidents",
        title: "CI/CD, observability and incident response",
        summary:
          "Delivery is not a file transfer; it is a pipeline with tests, and a deploy you can undo. This lesson covers what belongs in a pipeline and why, the difference between continuous delivery and continuous deployment, strategies for releasing without downtime, and then the part most teams learn too late: observability — logs, metrics, traces and SLOs — plus an incident process that turns a bad hour into a permanent improvement.",
        sections: [
          {
            heading: "Learning context",
            kind: "paragraph",
            body:
              "The goal of this lesson is boring deployments. A team that can ship ten times a day and roll back in two minutes has an enormous advantage over one that ships monthly and holds its breath: smaller changes, faster feedback, less pressure to be perfect. Getting there needs a pipeline, a release strategy, and enough visibility to know when something is wrong — before a customer tells you.",
          },
          {
            heading: "Definition: pipeline, CI, CD, environments",
            kind: "definition",
            body:
              "**Continuous integration (CI)** means every push is built and tested automatically against the main branch. The point is feedback within minutes on a change that is still small enough to reason about.\n\n**Continuous delivery (CD)** means every commit that passes the pipeline produces a deployable artifact, and a human decides when to release. **Continuous deployment** removes the decision: passing the pipeline deploys to production. The difference is organisational, not technical — continuous deployment requires strong automated tests, fast rollback and monitoring you trust.\n\n**A pipeline** is a sequence of stages, each of which can stop the release:\n\n1. **Lint and type check** — the cheapest defects caught first.\n2. **Test** — unit tests, then integration tests against real dependencies (a containerised database, not a mock).\n3. **Build** — produce the artifact once, tag it immutably, store it. The same artifact is promoted to every environment; nothing is rebuilt per environment.\n4. **Security and dependency checks** — vulnerability scanning of the image and the lock files. Fail on critical findings with a fix available, not on all findings, or the build becomes noise and people learn to override it.\n5. **Deploy to staging** — with migrations and smoke tests.\n6. **Deploy to production** — using the release strategy below, ideally during working hours when people are awake to watch.\n\n**Environments** should differ only by configuration. If staging and production are built separately, you are testing a different artifact than you ship, which is how a release passes every test and still breaks users.",
          },
          {
            heading: "Releasing without downtime",
            kind: "paragraph",
            body:
              "**Rolling deploy.** Replace instances a few at a time, waiting for health checks. The default in most orchestrators. Requires your schema changes to be backward compatible during the overlap.\n\n**Blue/green.** Run two full environments, deploy to the idle one, test it, switch the router, keep the old one ready. Instant rollback; twice the infrastructure while both exist.\n\n**Canary.** Send 1% of traffic to the new version, watch error rate and latency, then increase. The best strategy when you have good metrics and statistically meaningful traffic; it also gives you the ability to catch a bug in production without exposing everyone.\n\n**Feature flags.** Deploy code dark and enable it per user, per region or per percentage. This separates *deployment* (technical) from *release* (a product decision) and makes rollback a toggle rather than a deploy.\n\n**Database migrations** are the hard part. The safe pattern is expand-and-contract: add the new column (or table), deploy code that writes both, backfill, switch reads, then remove the old field in a later release. Anything that drops a column the running code still reads is a deploy that takes the site down even though it was \"only a migration\".\n\n**Rollback** must be a decision somebody can make in under a minute, and it must be rehearsed. Prefer rolling back the artifact to forward-fixing under pressure: the previous version is known to work, the fix under pressure is not.",
          },
          {
            heading: "Observability: the three signals and the discipline around them",
            kind: "paragraph",
            body:
              "**Logs** are discrete events with context — request ID, user, latency, outcome. Structured (JSON) logs can be searched; printed sentences cannot. Never log passwords, tokens or full card numbers, and decide a retention period that respects data-protection obligations.\n\n**Metrics** are numbers over time: request rate, error rate, duration percentiles, queue depth, database connections, memory and CPU. Percentiles matter more than averages — a mean latency of 120 ms can hide 5% of users waiting four seconds. Watch p50, p95 and p99, and watch saturation: how close is each finite resource to its limit?\n\n**Traces** follow one request across services, with timing per span. This is how you answer \"which of the seven services behind this page is slow?\" in one screen rather than a day of guesswork.\n\nThen **SLOs**: pick the few journeys that matter (login, lesson open, payment), define a service-level objective (99.5% under 400 ms over 30 days), and alert on the **error budget** — the amount of failure allowed — rather than on every spike. This is the discipline that stops a monitoring system from crying wolf: an alert should mean a user is being affected, or is about to be.\n\nFinally, instrument the business, not just the machine: signups completed, lessons finished, payments succeeded. Infrastructure metrics can look perfect while a bug makes every checkout fail.",
          },
          {
            heading: "Worked example: a pipeline, and the incident it caught",
            kind: "example",
            body:
              "The pipeline below is deliberately ordinary. The interesting part is what happened after it deployed: a canary caught a regression that unit tests could not, because the bug was in a query plan rather than in logic.\n\nRead the sequence as a narrative. The canary is at 5%; the error rate for the new version is 3.1% against a baseline of 0.4%; the alert fires on the SLO rather than on a CPU threshold; and because the artifact was tagged and the previous version is still running in the other half of the fleet, the rollback is a single re-point of the traffic rule. Total exposure: eleven minutes and about 200 users.\n\nThen the post-incident habit: a blameless review written within 48 hours, with a timeline, the contributing causes, and two action items — a missing index and an alert that arrives before the canary threshold does. No individual is named, because the goal is a better system, not a culpable person.",
            code:
              "# .github/workflows/deploy.yml (abbreviated)\nname: deploy\non: { push: { branches: [main] } }\njobs:\n  verify:\n    steps:\n      - run: npm ci\n      - run: npm run lint && npm run typecheck\n      - run: npm test -- --coverage\n      - run: docker build -t registry.example.com/app:${{ github.sha }} .\n      - run: trivy image --severity CRITICAL --exit-code 1 registry.example.com/app:${{ github.sha }}\n  deliver:\n    needs: verify\n    steps:\n      - run: docker push registry.example.com/app:${{ github.sha }}\n      - run: ./scripts/migrate.sh --expand-only      # backward-compatible only\n      - run: ./scripts/deploy.sh --canary 5% --watch error_rate,duration_p99\n      - run: ./scripts/promote.sh --to 100%          # or: rollback.sh --previous\n\n# 11:02  deploy started (canary 5%)\n# 11:06  p99 duration 410 ms → 1 900 ms on the canary  |  error rate 0.4% → 3.1%\n# 11:07  SLO alert: \"checkout & lesson-open latency budget burning 12× fast\"\n# 11:09  rollback.sh --previous   (old artifact still running; no rebuild)\n# 11:13  error rate back to 0.4%  |  exposure ≈ 200 users, 11 minutes\n# 11:40  incident review written: missing index on lesson_progress(user_id, course_id)\n#        actions: add the index; alert on p99 before the canary step, not after",
            language: "text",
            codeLabel: "A pipeline, a canary, and a rollback that took four minutes",
          },
          {
            heading: "Common mistakes and misconceptions",
            kind: "warning",
            body:
              "- **Building a different artifact per environment.** You then ship something no environment has ever run. Build once, promote the same digest.\n- **Flaky tests ignored or skipped.** A suite people do not trust is a suite people bypass, and the pipeline becomes decoration. Fix or delete flaky tests; there is no third option.\n- **Alerting on causes instead of symptoms.** \"CPU is 85%\" is normal at peak. \"Checkout success rate fell below 99%\" is an incident.\n- **Deploying at 5 p.m. on a Friday because it is ready.** Deploy when people are awake and can act. Readiness is a property of the change, not of the clock.\n- **A migration that is not backward compatible.** During any rolling or canary deploy, old and new code run at the same time against the same database. Expand-and-contract exists for exactly this.\n- **Treating post-incident review as blame.** If people are afraid of the review, you will lose the only free source of improvements you have.",
          },
          {
            heading: "Reference table",
            kind: "table",
            rows: [
              ["Signal", "Answers", "Cost", "Pitfall"],
              ["Logs", "What exactly happened to this request?", "Storage and search cost", "Unstructured, secrets, no request ID"],
              ["Metrics", "Is the system healthy now, and how does it compare?", "Cheap to store, needs cardinality discipline", "Averages hiding tail latency; too many labels"],
              ["Traces", "Which service or query is responsible for the delay?", "Sampling needed at volume", "Incomplete instrumentation = unusable"],
              ["SLO / error budget", "Should we ship or stabilise?", "Needs product agreement", "Objectives nobody believes or reviews"],
              ["Synthetic checks", "Is it broken from outside, before users notice?", "Small", "Testing only the happy path"],
            ],
          },
          {
            heading: "Summary",
            kind: "paragraph",
            body:
              "Delivery is a pipeline that builds once, tests honestly and deploys with a strategy you can undo: rolling, blue/green, canary or flags. Observability — structured logs, percentile metrics, traces and a small number of SLOs — is what makes deploying safe, because you find out in minutes rather than in a support ticket. And incidents are not a failure of process but the raw material for it, provided the review is blameless and the actions are real.",
          },
        ],
        keyPoints: [
          "Describe the stages of a pipeline and what each one prevents.",
          "Distinguish continuous delivery from continuous deployment and say what each demands of a team.",
          "Compare rolling, blue/green, canary and feature-flag releases, and choose one for a stated risk.",
          "Explain expand-and-contract migrations and why they are required for rolling deploys.",
          "Use logs, metrics, traces and SLOs to decide whether to ship or stabilise.",
        ],
        exercises: [
          "Write a pipeline definition for an application of yours with lint, type check, tests, image build, vulnerability scan and a deploy step. Run it on a pull request and record what it caught.",
          "Perform a blue/green deploy of a small app: two environments, a traffic switch, and a rollback. Time the rollback.",
          "Plan an expand-and-contract migration for renaming a column in a table that is being written to continuously, listing each release and what it changes.",
          "Define three SLOs for a service you know, with a 30-day window and an error budget. Say what each alert means and who acts on it.",
          "Write a blameless post-incident review for a real failure you experienced, with a timeline, contributing causes and two actions. Do not name individuals.",
        ],
        challenge:
          "Take one service from commit to production with a real pipeline: tests running on every push, one immutable artifact, a canary deploy with automatic rollback on error-rate regression, structured logs, latency percentiles and one SLO with an alert. Then deliberately introduce a subtle bug behind a feature flag, watch the canary and the alert catch it, roll back, and write the incident review with the two actions that would have caught it earlier.",
      }),
    ]
  ),
];
