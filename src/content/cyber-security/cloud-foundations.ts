import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Cloud security · Module 01: Cloud foundations.
 *
 * Two lessons: the cloud models and the shared-responsibility boundary that
 * decides who secures what, and identity and access management, which is where
 * most cloud breaches begin. Practicals run on a free-tier account with budget
 * alerts, or on LocalStack, which runs the AWS API on your own machine.
 */

export const CS_CLOUD_FOUNDATIONS_MODULE: CourseModule = module(
  "cloud-foundations",
  "01 · Cloud foundations",
  "What the cloud provider secures, what you secure, and how identities decide who can do what.",
  [
    lesson({
      id: "cloud-models-and-shared-responsibility",
      title: "Cloud models and the shared-responsibility boundary",
      summary:
        "Moving to the cloud does not move the responsibility for security; it redistributes it along a line that changes with the service you choose. This lesson defines cloud computing, compares the service and deployment models, and sets out the shared-responsibility model that determines who patches, configures and monitors each layer. It ends with the account structure that contains the blast radius of a mistake, and with the data-residency questions that a Ghanaian organisation must answer before it stores personal data abroad.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Most serious cloud incidents are not caused by a failure of the provider's data centres. They are caused by a customer setting that was left open, a credential that was copied into the wrong place, or a service that was assumed to be private. The provider's security is extensive, but it is bounded, and the customer's part is the part that is most often misunderstood.\n\nThis lesson gives you the vocabulary and the boundary. The rest of the course applies them to identities, networks, data, posture and response.",
        },
        {
          heading: "What cloud computing is",
          kind: "definition",
          body:
            "The US National Institute of Standards and Technology (NIST) defines **cloud computing** in Special Publication 800-145 by five characteristics: on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service. The definition matters for security because each characteristic creates a risk: self-service means anyone with the right permission can create resources, pooling means tenants share hardware, elasticity means a resource can appear and grow without a review, and measured service means every action can be logged and billed.\n\nThe **service models** describe how much of the stack you manage:\n\n- **IaaS (Infrastructure as a Service)**: you rent virtual machines, networks and storage. You manage the operating system, the runtime, the applications and the data. Examples: Amazon EC2, Azure Virtual Machines, Google Compute Engine.\n- **PaaS (Platform as a Service)**: you deploy code onto a managed runtime or database. You manage the application and the data; the provider patches the platform. Examples: AWS Elastic Beanstalk, Azure App Service, Google App Engine.\n- **SaaS (Software as a Service)**: you use a finished application. You manage your users, their settings and your data; the provider manages almost everything else. Examples: email and office suites, customer relationship systems.\n- **FaaS (Function as a Service)**: you deploy individual functions that run on events. The provider manages the servers. Examples: AWS Lambda, Azure Functions.\n\nThe **deployment models** are public cloud (shared infrastructure, sold as a service), private cloud (dedicated infrastructure, operated for one organisation), hybrid (both, connected), and community cloud (shared by organisations with common requirements, such as a national government).",
        },
        {
          heading: "Shared responsibility: where the line falls",
          kind: "table",
          body:
            "The **shared-responsibility model** divides security into what the provider operates and what the customer configures. The line moves depending on the service model. The table below is a simplified guide; each provider publishes a detailed matrix, and you should read the one for your provider and services.",
          rows: [
            ["Layer", "IaaS (e.g. virtual machine)", "PaaS (e.g. managed database)", "SaaS (e.g. email)"],
            ["Physical data centres and hardware", "Provider", "Provider", "Provider"],
            ["Hypervisor and virtual network fabric", "Provider", "Provider", "Provider"],
            ["Operating system patches", "**Customer**", "Provider", "Provider"],
            ["Application code and runtime", "**Customer**", "**Customer**", "Provider"],
            ["Network rules (security groups, firewalls)", "**Customer**", "**Customer**", "Shared"],
            ["Identities, accounts and MFA", "**Customer**", "**Customer**", "**Customer**"],
            ["Data classification, encryption choices, backups", "**Customer**", "**Customer**", "**Customer**"],
            ["Logging, monitoring and response", "**Customer**", "Shared", "Shared"],
          ],
        },
        {
          heading: "Worked example: a 'secure' database that was not",
          kind: "example",
          body:
            "A team uses a managed database service. The provider encrypts the storage, patches the engine and replicates the data across availability zones. A developer wants to connect from a laptop, so the team sets the database's network rule to allow connections from anywhere, and creates one shared username and password.\n\nTrace the responsibilities:\n\n1. **Provider**: the storage is encrypted at rest, and the engine is patched. Nothing the provider did was wrong.\n2. **Customer, network**: the rule allowing any source address is the customer's configuration. The database is now reachable from the internet, which is the provider's default for a service that a customer chose to expose.\n3. **Customer, identity**: a shared account with a password that is also in a repository means that no one can be identified in the logs and anyone with the repository can connect.\n4. **Customer, data**: whether the data is classified as personal data determines what notification duties apply if it is exposed.\n\nThe fix is entirely in the customer's column: a private network address, an identity per person or per workload, the password moved into a secrets store, and logs turned on and reviewed. The provider could not have prevented any of these decisions.",
        },
        {
          heading: "Accounts, subscriptions and projects: containing the blast radius",
          kind: "definition",
          body:
            "Every cloud has a hierarchy that groups resources for billing, access and policy. AWS uses **accounts** inside an **organization**, with **Organizations** policies that apply to groups of accounts. Microsoft Azure uses **subscriptions** inside **management groups**. Google Cloud uses **projects** inside **folders** and an **organization**.\n\nThe security reason for this structure is the **blast radius**: the damage an attacker or a mistake can cause. A separate account for production, one for development, and one for security logging means that a compromised development credential cannot delete production or the audit trail. Put logging in a dedicated account that few people can administer, and enforce baseline controls at the organisation level so that individual teams cannot switch them off.",
        },
        {
          heading: "Data residency and the Data Protection Act",
          kind: "warning",
          body:
            "Where data is stored is a legal question as well as a technical one. Ghana's **Data Protection Act, 2012 (Act 843)** governs the processing of personal data by data controllers and processors, and it sets conditions for transferring personal data outside the country. Before you choose a region, identify which personal data you hold, whether any law requires it to remain in Ghana, and what safeguards the provider's contract offers. The nearest major regions to Ghana are in South Africa (such as the Cape Town and Johannesburg regions offered by several providers), and availability of services varies by region, so check that the service you need is offered there.\n\nSecurity and privacy are separate questions. An encrypted database in the right region can still be a breach if the people who can read it are not authorised to see the personal data inside it.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Assuming the provider secures the workload.** The provider secures the platform. Your configuration, identities and data are yours.\n- **Using one account for everything.** A single account means a single compromise can reach everything. Separate by environment and by function.\n- **Leaving the root or owner account in daily use.** The top-level account has unlimited power and cannot be restricted by ordinary policies. Lock it with MFA and use it only for the few tasks that need it.\n- **Creating resources in regions nobody monitors.** Attackers often use regions that a team does not use. Restrict regions with organisation policy.\n- **No budget alert.** An unexpected cost spike is one of the earliest signs of a compromised account, such as cryptomining. Set a budget alert on day one.\n- **Trusting the default configuration.** Defaults favour convenience. Review every new service against the provider's security baseline.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["AWS CLI v2", "Command-line access to AWS services", "aws.amazon.com/cli"],
            ["Azure CLI", "Command-line access to Azure resources", "learn.microsoft.com (Azure CLI install)"],
            ["Google Cloud CLI (gcloud)", "Command-line access to Google Cloud", "cloud.google.com/sdk"],
            ["LocalStack", "Runs many AWS APIs on your own machine for free practice", "localstack.cloud (Docker image)"],
            ["Docker", "Running LocalStack and other lab services", "docker.com"],
            ["Provider shared-responsibility matrices", "Authoritative statements of the security boundary", "Published on each provider's documentation site"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use a free-tier cloud account with a budget alert, or LocalStack on your own machine for work that does not need a real provider. Never use a real customer's data in practice accounts.",
          items: [
            "Create a cloud account (or use LocalStack). If using a real account, enable MFA on the root or owner login, create a budget alert at a small amount, and confirm the alert email arrives.",
            "Install the CLI for your chosen provider. Run its identity command (for AWS: `aws sts get-caller-identity`) and record which principal you are acting as.",
            "Run LocalStack with `docker run -d -p 4566:4566 localstack/localstack`. Set `AWS_ENDPOINT_URL=http://localhost:4566` and create a bucket with `aws s3 mb s3://lab-bucket`. Confirm it exists with `aws s3 ls`.",
            "Download the shared-responsibility documentation for the service you used, and fill in a table with three rows of your own: the control, who owns it, and the setting you would check.",
            "Write a one-page data-residency note for a fictional Ghanaian company that stores customer records. List the personal data, the question you would ask the legal adviser, and the region choice you would propose, with its reason.",
            "Draw an account structure for a company with production, development and security logging. Write which controls you would apply at the organisation level and why.",
          ],
        },
      ],
      challenge:
        "For a small fictional application (a web front end, an API and a managed database), write a shared-responsibility table for its deployment, a list of the five decisions the customer must make, and the account structure that contains the blast radius. Then identify the one decision in your design that would most increase risk if it were made carelessly, and explain the control that protects against it.",
      keyPoints: [
        "Explain the five NIST characteristics of cloud computing and the security risk each one creates",
        "Compare IaaS, PaaS and SaaS by which layers the customer still manages",
        "Locate the customer's responsibilities in a shared-responsibility matrix",
        "Use accounts or subscriptions to contain the blast radius of a compromise",
        "Identify data-residency and personal-data obligations before choosing a region",
      ],
      exercises: [
        "Why does moving a database from a self-managed server to a managed service change the customer's responsibilities but not remove them?",
        "A team says 'the cloud is secure, so we do not need to monitor it.' Write the two-paragraph response you would give.",
        "Explain why a separate logging account is more secure than a logging folder inside the production account.",
        "Under the shared-responsibility model, who is responsible for patching the operating system of a managed container service that the customer deploys? Justify your answer from the provider's published matrix.",
        "Practical problem: a budget alert fires at 3 a.m. for a service you did not create. Write the first five steps you take, in order.",
      ],
    }),
    lesson({
      id: "identity-and-access-management",
      title: "Identity and access management",
      summary:
        "In the cloud the identity is the perimeter. Every action is an API call made by a principal, and the question 'who can do what, to which resource, under which conditions' is answered by policies rather than by a locked door. This lesson covers principals, policies and the principle of least privilege, the difference between long-lived keys and temporary credentials, multi-factor authentication, and the audit tools that find over-privilege. The examples use AWS, with the equivalents on Azure and Google Cloud noted.",
      sections: [
        {
          heading: "Principals, actions, resources and conditions",
          kind: "definition",
          body:
            "Cloud authorisation is built from four parts. A **principal** is the identity making a request: a human user, a **role** assumed temporarily, or a service. An **action** is the operation requested, such as `s3:GetObject` (read an object) or `iam:CreateAccessKey`. A **resource** is what the action applies to, identified by an Amazon Resource Name (ARN). A **condition** narrows when the rule applies, such as only when multi-factor authentication is present or only from a particular network.\n\nA **policy** is a document that grants or denies combinations of these. Azure expresses the same idea with **role assignments** (a role, a principal and a scope) and **Microsoft Entra ID** for identities; Google Cloud uses **IAM bindings** on resources. The vocabulary differs, but the principle of granting specific actions on specific resources is the same.\n\nThe **principle of least privilege** says that a principal should have exactly the actions it needs on exactly the resources it uses, and nothing more. It is easy to state and hard to achieve, which is why the rest of this lesson is about finding the gap between what is granted and what is used.",
        },
        {
          heading: "Reading a policy",
          kind: "example",
          body:
            "The policy below grants read access to one prefix of one bucket, and only to principals who have signed in with multi-factor authentication within the last hour. Read it as a checklist.\n\n1. `Effect: Allow` grants what follows; an explicit `Deny` in any applicable policy always overrides an allow.\n2. `Action` lists the single operation needed, not `s3:*`.\n3. `Resource` names one bucket and one prefix, using the ARN form. A wildcard on the bucket would grant access to every bucket in the account.\n4. `Condition` requires a recent MFA sign-in, so a stolen long-lived password alone is not enough.\n\nAn over-permissive version of the same grant would use `\"Action\": \"s3:*\"` and `\"Resource\": \"*\"`. It would work in testing and would give an attacker with the same credentials the ability to read, change and delete every bucket in the account.",
          code:
            "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"ReadReportsWithMfa\",\n      \"Effect\": \"Allow\",\n      \"Action\": \"s3:GetObject\",\n      \"Resource\": \"arn:aws:s3:::example-reports-bucket/finance/*\",\n      \"Condition\": {\n        \"Bool\": { \"aws:MultiFactorAuthPresent\": \"true\" },\n        \"NumericLessThan\": { \"aws:MultiFactorAuthAge\": \"3600\" }\n      }\n    }\n  ]\n}",
          language: "json",
          codeLabel: "A narrow grant with an MFA condition",
        },
        {
          heading: "Temporary credentials and the end of long-lived keys",
          kind: "paragraph",
          body:
            "There are two kinds of credential. **Long-lived access keys** (an access key ID and secret) do not expire unless someone rotates or deletes them, and they are the most common cause of cloud breaches because they are copied into scripts, repositories, chat messages and laptops. **Temporary credentials** are issued by a security token service when a principal assumes a role, and they expire after a set period, typically minutes to hours.\n\nThe modern pattern is to avoid long-lived keys for people and workloads altogether. People sign in through single sign-on with MFA and assume roles. Workloads running in the cloud receive credentials from the platform (an instance profile, a managed identity or a workload identity). Keys that remain are inventoried, rotated and deleted when unused. Google Cloud and Azure follow the same direction, with managed identities and short-lived tokens.",
        },
        {
          heading: "Worked example: from a leaked key to least privilege",
          kind: "example",
          body:
            "A developer commits a configuration file to a public repository. It contains a long-lived access key belonging to a user named `build-bot`. Secret scanners find the key within minutes. The response and the redesign proceed in four steps.\n\n1. **Contain.** Deactivate the key immediately, which is reversible, rather than deleting it, which destroys evidence you may need. Attach a deny-all policy to the user if it has other keys.\n2. **Investigate.** Use the audit log to see every action taken with that key since it was created, including any new users, keys or roles it created. The lesson in the next module covers this in depth.\n3. **Measure the grant.** Run `aws iam simulate-principal-policy` to see exactly what the user could do, and compare it with what the build process actually needs. In this case the bot had administrator access 'to make deployments easier'.\n4. **Redesign.** Replace the key with a role that the build system assumes through its identity provider, scoped to the deployment actions only. Delete the key, and add a repository scan to block the next commit.\n\nThe lesson is not that the developer was careless, though committing a secret was a mistake. It is that a standing administrator key for a build bot made the mistake costly.",
          code:
            "# Inventory: which users have keys, and when were they last used?\naws iam generate-credential-report\naws iam get-credential-report --query Content --output text | base64 -d > creds.csv\n\n# What can this principal actually do? Simulate a specific action.\naws iam simulate-principal-policy \\\n  --policy-source-arn arn:aws:iam::111122223333:user/build-bot \\\n  --action-names s3:DeleteBucket iam:CreateAccessKey \\\n  --query 'EvaluationResults[].[EvalActionName,EvalDecision]' --output table",
          language: "bash",
          codeLabel: "Inventory and simulation, the two first questions in any review",
        },
        {
          heading: "Multi-factor authentication and the root account",
          kind: "paragraph",
          body:
            "**Multi-factor authentication (MFA)** requires a second proof of identity alongside a password. The strongest forms are phishing-resistant: hardware security keys and passkeys, which bind the login to the legitimate site. Authenticator apps using time-based codes are good; SMS codes are better than nothing but vulnerable to SIM-swap fraud, which is a real risk in the region. Enforce MFA for every human identity, and for the root or owner account enforce a hardware key, store recovery codes offline, and never create access keys for the root identity.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Wildcards in production policies.** `Action: *` and `Resource: *` are placeholders that were never replaced. Search for them in every review.\n- **Long-lived keys in code, chat and tickets.** Use secret scanning on repositories and rotate any key that has been exposed, even briefly.\n- **Shared accounts.** If five people use one login, no action can be attributed to anyone.\n- **Assuming a deny in one policy is undone by an allow in another.** An explicit deny always wins; check for it when debugging access.\n- **Forgetting the trust policy.** A role can be assumed only by the principals its trust policy names. A trust policy with `Principal: *` lets any account try.\n- **Granting admin 'temporarily' and never removing it.** Use just-in-time elevation with an expiry, such as Azure Privileged Identity Management, or a time-limited role session.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["IAM Access Analyzer", "Finding resources shared outside the account and unused access", "AWS console and CLI (accessanalyzer commands)"],
            ["IAM Policy Simulator and simulate-principal-policy", "Testing what a principal may do before it does it", "AWS console or aws iam command"],
            ["Credential report", "Inventory of users, keys, MFA status and last use", "aws iam generate-credential-report"],
            ["Microsoft Entra ID and Privileged Identity Management", "Identity, MFA and just-in-time admin on Azure", "Azure portal"],
            ["gitleaks or trufflehog", "Finding secrets committed to repositories", "github.com/gitleaks/gitleaks, github.com/trufflesecurity/trufflehog"],
            ["Prowler", "Automated checks that include IAM findings", "github.com/prowler-cloud/prowler"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use a free-tier account or LocalStack. For a real account, perform every step with the MFA-protected identity, and never run these commands with the root login.",
          items: [
            "Create an IAM group called `readers`, attach a policy that allows only `s3:ListBucket` and `s3:GetObject` on one bucket, and add one test user to the group.",
            "Sign in as the test user (or assume its permissions with the CLI) and try to delete the bucket. Record the error, and explain which policy statement is missing.",
            "Generate the credential report, decode it, and identify every user with an access key older than 90 days or with no MFA. Write the list in your notes.",
            "Run `aws iam simulate-principal-policy` for the test user against three actions: one allowed, one denied, one denied by absence. Record the three results and explain each.",
            "Write a second policy that adds a condition restricting the grant to requests made within a specific source address range. Test it and confirm the behaviour changes.",
            "Create a role with a trust policy that allows only your own user to assume it. Assume the role from the CLI, run `aws sts get-caller-identity`, and show that the principal is now the role.",
            "Run gitleaks against a sample repository that you create with a fake, clearly labelled key in a commit. Confirm the finding, remove the key from history, and write a sentence about why removing it from the latest commit alone is not enough.",
          ],
        },
      ],
      challenge:
        "In a lab account, design an identity model for three roles: a developer who deploys to a non-production environment, a build pipeline that deploys to production, and an auditor who reads logs but changes nothing. Write the policies, the trust relationships and the MFA requirements. Then use the simulator to prove that each role can do its job and cannot do the others' jobs, and attach the results to your design.",
      keyPoints: [
        "Describe the principal, action, resource and condition model behind cloud policies",
        "Write a narrow grant with conditions and explain why wildcards are dangerous",
        "Prefer temporary credentials and role assumption to long-lived access keys",
        "Respond to a leaked key by containing, investigating, measuring and redesigning",
        "Use the credential report and policy simulator to find and test over-privilege",
      ],
      exercises: [
        "Explain why an explicit deny overrides an allow, and give a situation where that behaviour is what you want.",
        "A key belonging to a service account was last used 14 months ago and has administrator rights. Write the steps and the justification for removing it.",
        "Why is SMS-based MFA weaker than a hardware security key, and what is the practical threat that makes the difference?",
        "Describe the difference between an identity-based policy and a resource-based policy, and give one case where each is the right choice.",
        "Practical problem: a developer says they need administrator rights 'just for this release'. Write the request you would require them to submit, and the control you would apply instead.",
      ],
    }),
  ],
);
