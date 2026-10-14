import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Cloud security · Module 03: Posture and response.
 *
 * Two lessons: cloud security posture, including infrastructure as code that is
 * checked before it deploys, and cloud detection and incident response, using
 * the audit trail, managed threat detection and the containment steps that
 * stop a compromised identity or workload. The course closes here, with the
 * practicals in an account you control and a complete response to a
 * deliberately leaked credential.
 */

export const CS_CLOUD_POSTURE_MODULE: CourseModule = module(
  "cloud-posture-and-response",
  "03 · Posture and response",
  "Checking configuration before it ships, watching the control plane, and containing a compromise in minutes.",
  [
    lesson({
      id: "posture-and-infrastructure-as-code",
      title: "Cloud security posture and infrastructure as code",
      summary:
        "A cloud account is configured thousands of times a year, by people and by automation, and the configuration drifts. Cloud security posture management (CSPM) is the practice of continuously comparing the real configuration against a benchmark. Infrastructure as code (IaC) moves that comparison to before deployment, where a mistake costs a pull-request comment instead of a breach. This lesson covers both, with the benchmarks that define 'secure', the tools that check them, and the policy-as-code approach that keeps a team's standards in version control.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Security reviews of cloud environments usually find the same handful of problems: public storage, over-permissive roles, unencrypted disks, logging turned off, and resources in regions nobody reviews. These are not exotic. They are the predictable result of creating infrastructure by hand, quickly, under pressure, and never checking it again. The answer is to make the checks automatic and to run them at the point where a change is proposed.",
        },
        {
          heading: "Benchmarks: what 'secure' means in writing",
          kind: "definition",
          body:
            "A **benchmark** is a consensus, written definition of secure configuration. The **CIS Benchmarks** from the Center for Internet Security include a CIS AWS Foundations Benchmark, a CIS Microsoft Azure Foundations Benchmark and a CIS Google Cloud Platform Foundation Benchmark. Each recommendation states the setting, the rationale, the impact of applying it and the audit method. Cloud providers also publish security best-practice checks that map to their own services.\n\nPosture management products evaluate resources against these checks continuously. In AWS, **Security Hub** aggregates findings and scores accounts against the CIS standard; **Microsoft Defender for Cloud** provides a secure score and recommendations on Azure; **Security Command Center** serves the same role on Google Cloud. Open-source tools such as **Prowler** and **ScoutSuite** run the same kinds of checks from the command line, which is useful for learning and for independent verification.\n\nA benchmark is a starting point. Some recommendations do not fit your architecture, and a documented exception with an owner and a review date is better than an ignored finding.",
        },
        {
          heading: "Infrastructure as code, and checking it before it runs",
          kind: "definition",
          body:
            "**Infrastructure as code** describes cloud resources in files, such as Terraform, AWS CloudFormation or Bicep, which can be reviewed, versioned and deployed the same way every time. The security advantage is that a configuration can be analysed before it exists. A **static analysis** tool reads the files and reports, for example, that a bucket has no public access block, that a security group allows SSH from anywhere, or that a database has no encryption set.\n\nThe main tools are **Checkov** (Python-based, with many built-in policies for Terraform, CloudFormation and Kubernetes manifests), **tfsec** (Terraform-focused, now part of the Trivy project) and **Terrascan**. They run in the pipeline and fail the build on findings above a set severity. Policy-as-code engines such as **Open Policy Agent** (with its Rego language) or HashiCorp Sentinel let a team express its own rules, such as 'every resource must have an owner tag', as code that is reviewed like any other.\n\nThe pattern to adopt is: write the rule once, test it against a deliberately bad example so that you know it fires, and keep it in the same repository as the infrastructure it protects.",
        },
        {
          heading: "Worked example: a Terraform file that fails review",
          kind: "example",
          body:
            "A developer writes the following Terraform for a reports bucket and a firewall rule. Before it runs, the pipeline executes a static analysis tool. Read the file, then the findings that a tool such as Checkov would raise, then the corrected version.",
          code:
            "resource \"aws_s3_bucket\" \"reports\" {\n  bucket = \"example-reports-bucket\"\n  acl    = \"public-read\"\n}\n\nresource \"aws_security_group\" \"web\" {\n  name = \"web\"\n  ingress {\n    from_port   = 22\n    to_port     = 22\n    protocol    = \"tcp\"\n    cidr_blocks = [\"0.0.0.0/0\"]\n  }\n}",
          language: "hcl",
          codeLabel: "The configuration as first written",
        },
        {
          heading: "The findings and the fixes",
          kind: "table",
          body:
            "A static analysis run reports the problems below. Each finding has a fix that is specific enough to apply without further investigation.",
          rows: [
            ["Finding", "Why it matters", "Fix"],
            ["Bucket ACL is public-read", "Anyone on the internet can read every object", "Remove the public ACL; add a public access block with all four settings enabled"],
            ["Bucket has no default encryption", "Objects are stored with keys the team does not control", "Add a server-side encryption configuration with a customer-managed key"],
            ["SSH open to 0.0.0.0/0", "Administrative port reachable by every address", "Remove the rule and use session-manager access; if a bastion is required, restrict to its address range"],
            ["Security group has no description", "Reviewers cannot tell the intent of the rule", "Add a description naming the owner and purpose"],
          ],
        },
        {
          heading: "Drift and continuous checking",
          kind: "paragraph",
          body:
            "Static analysis checks what the code says. It cannot see a change made by hand in the console, which is precisely the change that causes drift. Continuous posture checks compare the live configuration with the benchmark and the code. Where a difference exists, either the code is updated to reflect a deliberate change, or the change is reverted. Cloud configuration-compliance services and tools such as AWS Config record configuration history, which also makes it possible to answer 'when did this setting change, and who changed it?' during an investigation.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Scanning once at launch.** Configuration changes after launch. Scan continuously and compare with the code.\n- **Ignoring findings because the score is high.** A score is an aggregate. Read the individual findings, and fix the ones that expose data.\n- **Writing rules and never testing them.** A rule that never fires might be correct, or might be broken. Feed it a known-bad example to find out.\n- **Making the pipeline a bypass.** A check that developers can skip with a flag is a suggestion. Protect the main branch and make the check required.\n- **Treating a benchmark as the whole standard.** It is the floor. Your data classification and threat model set the rest.\n- **Hand-editing production.** Every manual change is drift. If an emergency change is needed, record it and bring the code into line before the incident closes.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Checkov", "Static analysis of Terraform, CloudFormation and Kubernetes configuration", "pip install checkov, or checkov.io"],
            ["tfsec and Trivy", "Terraform security checks and broader vulnerability scanning", "aquasecurity.github.io/tfsec, trivy.dev"],
            ["Terraform", "Declarative infrastructure as code", "developer.hashicorp.com/terraform"],
            ["Open Policy Agent (OPA)", "Policy-as-code evaluated against configuration", "openpolicyagent.org"],
            ["Prowler and ScoutSuite", "Live cloud posture audits from the command line", "github.com/prowler-cloud/prowler, github.com/nccgroup/ScoutSuite"],
            ["AWS Security Hub and AWS Config", "Aggregated findings and configuration history on AWS", "AWS console and CLI"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Write the Terraform files but do not apply them to a production account. Use `terraform validate` and `terraform plan` (which needs no resources to be created) to check syntax and intent.",
          items: [
            "Save the configuration from the worked example to a folder called `insecure-lab`. Install Checkov and run `checkov -d insecure-lab`. Record every failed check ID and its description.",
            "For each finding, apply the fix from the table. Save the corrected files to `secure-lab` and rerun Checkov. Show that the number of failed checks has fallen and explain any remaining failures.",
            "Run `terraform fmt -check` and `terraform validate` on the corrected folder. Fix any reported issue.",
            "Write a custom rule in your chosen policy engine that requires every bucket resource to carry an `owner` tag. Demonstrate that it fails on a bucket without the tag and passes with it.",
            "Run Prowler or ScoutSuite against a lab account (or against LocalStack where supported) and choose three findings to investigate. For each, write whether it is a true positive, a false positive, or an accepted risk, with a reason.",
            "Write an exception record for one finding you decided to accept: the owner, the business reason, the compensating control, and the review date.",
            "Add the Checkov step to a simple CI workflow (for example a GitHub Actions file) so that the build fails on a high-severity finding. Show a failing run and a passing run.",
          ],
        },
      ],
      challenge:
        "Create a Terraform project for a small web application with a public load balancer, a private database and a reports bucket. Enforce the benchmark with Checkov in a CI workflow, write one custom policy for your organisation's tagging standard, and show a pull request that fails the check and one that passes. Document every exception with its owner and review date.",
      keyPoints: [
        "Explain the purpose of a CIS benchmark and how it differs from a single scan",
        "Use a static analysis tool to find misconfigurations before deployment",
        "Fix a configuration finding with a specific, verifiable change",
        "Write and test a custom policy-as-code rule",
        "Detect and reconcile configuration drift between code and the live account",
      ],
      exercises: [
        "Why does checking infrastructure code before deployment catch problems that a live scan finds only after the resource exists?",
        "A finding is marked 'accepted risk' by a manager who does not own the system. Describe what the exception process should require.",
        "Explain why a policy that has never failed should still be tested with a known-bad input before you rely on it.",
        "Write the Terraform for a bucket that is private, encrypted with a customer-managed key, and versioned.",
        "Practical problem: an engineer changed a security group in the console during an outage, and the next deployment reverted it, causing a second outage. Describe the process failure and the change that prevents a repeat.",
      ],
    }),
    lesson({
      id: "cloud-detection-and-response",
      title: "Cloud detection and incident response",
      summary:
        "In the cloud the control plane is the crime scene. Every creation, change and access is an API call recorded by the platform, and the same records that let an investigator reconstruct an attack let a detection system find it. This lesson covers the cloud audit trails and the managed threat detection services built on them, the common attack paths against cloud accounts, and the containment and eradication steps for a compromised identity, which differ from those for a compromised server. It ends the course with a complete response to a leaked credential.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Traditional incident response assumes that you can disconnect a machine and examine its disk. In a cloud account the attacker often never touches a machine. They use a valid credential to call the platform's API, create a new user, an access key or a virtual machine, and leave. The evidence is in the audit trail, and the response is to revoke access to the identity and check everything it touched. This is faster than a disk investigation and more demanding in its logging requirements.",
        },
        {
          heading: "The audit trail: what the cloud records",
          kind: "definition",
          body:
            "Each major provider records management activity by default or with a single switch, and most of the value comes from configuring it deliberately:\n\n- **AWS CloudTrail** records API calls across an account, with the identity, time, source address, request parameters and result. Management events are recorded by default for the last 90 days in the console's event history; a **trail** delivers them to an S3 bucket for long-term retention. Data events (object-level access to storage, for example) are optional and must be enabled.\n- **Azure Activity Log** records control-plane operations on subscriptions, with diagnostic settings used to send them to a workspace. Microsoft Entra ID sign-in and audit logs record identity activity.\n- **Google Cloud Audit Logs** record administrative and data-access activity, with admin activity logs on by default.\n\nNetwork flow logs (AWS VPC Flow Logs, Azure NSG flow logs, Google VPC Flow Logs) record connection metadata, which is useful for detecting data exfiltration and scanning. They do not record content.\n\nThe key property is **immutability and separation**: the logs should be delivered to a separate account or workspace, with restricted deletion, so that the principal under investigation cannot remove the evidence.",
        },
        {
          heading: "Managed threat detection",
          kind: "paragraph",
          body:
            "Managed services analyse these logs continuously with threat intelligence and anomaly models. **Amazon GuardDuty** analyses CloudTrail management events, DNS query logs and VPC flow logs for indicators such as credentials used from an unusual location, crypto-mining traffic and communication with known malicious addresses. **Microsoft Defender for Cloud** and **Microsoft Sentinel** provide similar detection and a SIEM across Azure and other sources. **Google Security Command Center** surfaces threat findings from Google's detection systems. These services produce findings, not verdicts: each needs triage in the same way as the alerts in the defensive security module.\n\nA detection is only useful if someone is notified and knows what to do. Route high-severity findings to an on-call channel, and link each finding type to a playbook.",
        },
        {
          heading: "Common attack paths in cloud accounts",
          kind: "definition",
          body:
            "Most cloud incidents follow a small number of paths:\n\n1. **Leaked credential.** A long-lived key is found in a repository, a log, a container image or a shared document. The attacker uses it from an address outside the normal range.\n2. **Privilege escalation through permissions.** The credential can create or modify identities and policies, so the attacker grants itself more rights. A permission such as the ability to pass a role to a compute service, or to create new access keys for other users, is often the lever.\n3. **Persistence.** The attacker creates a new user, access key, role trust or scheduled task that survives the revocation of the original credential.\n4. **Impact.** Data is read or copied out of storage, or compute is started for cryptocurrency mining, or resources are deleted. Unexpected cost is often the first visible symptom.\n\nEach path leaves a characteristic trail in the audit log, which is why detection rules often focus on identity and policy changes.",
        },
        {
          heading: "Worked example: responding to a leaked credential",
          kind: "example",
          body:
            "A secret scanner alerts that a long-lived access key for the user `reports-sync` appeared in a public repository commit made four hours ago. The response runs in a fixed order, because each step protects the evidence needed for the next.\n\n1. **Contain the identity first.** Deactivate the access key (`aws iam update-access-key --status Inactive`). Do not delete it yet, because deletion removes the link between the key and its history in some views. Attach a deny policy to the user if it has other keys or a console password.\n2. **Establish the timeline.** Find the key's identifier, then search the audit trail for every action it took. Start from the first event in the commit's window, not from the alert time.\n3. **Look for persistence.** Search for identity and policy changes made by the same principal: new users, new access keys, new roles, changes to trust policies, and changes to security groups or logging configuration.\n4. **Check for impact.** Review data access events for the storage services the user could reach, and review compute and network creation events for mining or exfiltration.\n5. **Eradicate.** Delete any persistence found, delete the compromised key, and remove the secret from the repository history. Rotate any other credential the attacker could have read.\n6. **Restore and recover.** Replace the key with a role assumed through the build system's identity, scoped to the deployment actions only.\n7. **Review.** Record the timeline, the detection gap (why the key was in the repository in the first place), and the actions with owners.\n\nIn a real case the step that is most often skipped is step 3. A deleted key with a surviving backdoor user is a re-entry waiting to happen.",
          code:
            "# Every action taken with a specific access key since the commit window\naws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAEXAMPLEKEYID \\\n  --start-time 2026-10-13T06:00:00Z --end-time 2026-10-13T12:00:00Z \\\n  --query 'Events[].[EventTime,EventName,Username]' --output table\n\n# Persistence check: identity changes made in the same window\naws cloudtrail lookup-events \\\n  --lookup-attributes AttributeKey=EventName,AttributeValue=CreateAccessKey \\\n  --start-time 2026-10-13T06:00:00Z --end-time 2026-10-13T12:00:00Z",
          language: "bash",
          codeLabel: "Scoping the activity of a leaked key, then looking for persistence",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Deleting the key before investigating.** Deactivate first. Deletion can remove the evidence you need.\n- **Assuming the alert time is the start of the compromise.** The credential may have been used long before anyone noticed. Search from the earliest plausible time.\n- **Stopping after the key is revoked.** Persistence is the usual reason an incident recurs.\n- **Logs in the same account as the attacker.** If the principal under investigation can delete the trail, the trail is not evidence.\n- **Rotating one credential and leaving others the attacker could read.** Check what the compromised identity could access, not just what it was.\n- **Treating a cost spike as a billing problem.** Unexplained cost is an incident until proven otherwise.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["AWS CloudTrail and lookup-events", "Recording and searching API activity", "AWS console and CLI"],
            ["Amazon GuardDuty", "Managed threat detection over logs, DNS and flow data", "AWS console; use create-sample-findings to test alerts"],
            ["Microsoft Sentinel and Defender for Cloud", "SIEM and posture-linked threat detection on Azure", "Azure portal"],
            ["Google Cloud Audit Logs and Security Command Center", "Administrative and access logs, with threat findings", "Google Cloud console and CLI"],
            ["gitleaks", "Finding leaked credentials in repository history", "github.com/gitleaks/gitleaks"],
            ["Prowler", "Checks for overly permissive identities and logging gaps", "github.com/prowler-cloud/prowler"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Do all of this in a lab account, with a fake key that you create for the exercise and delete at the end. Record the time of every step in UTC.",
          items: [
            "Confirm that a CloudTrail trail exists in your lab account and that it delivers to a bucket in a separate location. If you cannot create a trail, explain what the event history will and will not retain.",
            "Enable GuardDuty in the lab region with `aws guardduty create-detector --enable`. Find the detector ID with `aws guardduty list-detectors`, then run `aws guardduty create-sample-findings --detector-id ID` and list the findings to see how they look.",
            "Create a test user `lab-leak-test`, create an access key for it, and make a few harmless calls with that key (for example `aws sts get-caller-identity`). Note the key ID and the time.",
            "Pretend the key has leaked. Deactivate it with `aws iam update-access-key --status Inactive`. Try one call with it and record the error.",
            "Use `lookup-events` with `AttributeKey=AccessKeyId` to list the calls made with that key. Confirm that your harmless calls appear, with their times and sources.",
            "Search for persistence: list the user's keys and attached policies, and search for `CreateUser` and `CreateAccessKey` events in the same window. Record what you find.",
            "Delete the test key and user, and write the full incident timeline with the containment, eradication and review steps from the worked example.",
          ],
        },
      ],
      challenge:
        "Write a complete incident-response playbook for a leaked cloud access key, with the commands for containment, the audit queries for scoping and persistence, the eradication checklist and the review template. Run it against a lab key, time each step, and attach the timeline and the evidence. Identify the one step you would most want to automate, and explain why.",
      keyPoints: [
        "Describe what cloud audit trails record and why they must be stored separately from the principal they monitor",
        "Identify the common cloud attack paths and the trail each one leaves",
        "Contain a compromised identity by deactivating before deleting",
        "Search for persistence as a distinct step of an incident response",
        "Write a repeatable playbook and test it against a controlled exercise",
      ],
      exercises: [
        "Why is 'delete the access key' a weaker first response than 'deactivate the access key', and when might you still delete it?",
        "Explain why a read of storage data from an unusual address is more significant than a read from the normal application address.",
        "A GuardDuty finding reports credentials used from an unusual location. List the questions you would answer before deciding whether it is an incident.",
        "Describe the persistence mechanisms an attacker might create after gaining a leaked key with the permission to create access keys, and how you would find each one.",
        "Practical problem: the cloud bill rises 400 per cent overnight in a region nobody uses. Write your first two hours of response, in order, including who you tell and what evidence you collect first.",
      ],
    }),
  ],
);
