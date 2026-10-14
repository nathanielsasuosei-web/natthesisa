import { lesson, module } from "@/lib/lesson-builder";
import type { CourseModule } from "@/lib/courses";

/**
 * Cyber Security · Cloud security · Module 02: Workloads and data.
 *
 * Two lessons: network and workload protection (private subnets, least-exposed
 * services, container and Kubernetes hardening) and data protection (encryption,
 * secrets, backups and immutability, and personal data under Ghana's Data
 * Protection Act). Practicals are scripted so that each control is checked by a
 * command, not by a screenshot.
 */

export const CS_CLOUD_WORKLOADS_MODULE: CourseModule = module(
  "cloud-workloads-and-data",
  "02 · Workloads and data",
  "Keeping compute private, containers minimal, secrets secret and personal data protected.",
  [
    lesson({
      id: "network-and-workload-protection",
      title: "Network and workload protection",
      summary:
        "A cloud workload is only as exposed as its network rules allow. This lesson covers how to design a virtual network so that only the components that must face the internet do, how security groups and network access control lists differ and how to audit them, how to replace open administrative ports with managed access, and how to harden the containers and clusters that run modern applications. Each control is paired with a command that proves it is in place.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "The most common cloud exposure is not sophisticated. It is a database or an administrative port that was opened to every address during a fault investigation and never closed. Network design is the discipline of making that kind of mistake hard to make and easy to find. The principle is layered: a workload should have no route to the internet unless it needs one, and each route should carry only the traffic it needs.\n\nThe lesson applies to virtual machines, managed services and containers alike, because they all sit inside a virtual network with rules that someone wrote.",
        },
        {
          heading: "Designing the network: public, private and the paths between",
          kind: "definition",
          body:
            "A **virtual private cloud** (VPC, or a virtual network in Azure, or a VPC network in Google Cloud) is an isolated address space that you divide into **subnets**. A subnet is **public** if its route table sends traffic to an internet gateway, and **private** if it does not. The standard three-tier design places only the load balancer in a public subnet, the application servers in a private subnet that reaches the internet through a managed NAT gateway for outbound updates, and the database in a private subnet that accepts connections only from the application tier.\n\nTwo controls shape traffic. A **security group** is a stateful firewall attached to a network interface: if it allows a request in, the reply is allowed out automatically. A **network access control list** (NACL) is a stateless rule set applied to a subnet, evaluated in numbered order, and it must allow return traffic explicitly. Most designs use security groups for precision and NACLs only for coarse subnet-level blocks.\n\nAdministrative access should not depend on an open port. Session-manager services (such as AWS Systems Manager Session Manager, or Azure Bastion) open an authenticated, logged shell without any inbound port on the instance. Where a bastion host is still used, it should be the only machine with an inbound SSH rule, and that rule should name a known address range.",
        },
        {
          heading: "Worked example: the open administrative port",
          kind: "example",
          body:
            "A web application runs on a virtual machine. During an outage, an engineer adds a security group rule allowing SSH from `0.0.0.0/0` (any address) so that they can log in from home. The outage is fixed; the rule remains.\n\nTrace what an attacker sees:\n\n1. A scanner on the internet probes the public address and finds port 22 open. The response is a banner identifying the SSH server version.\n2. The attacker tries common usernames and passwords. If the instance allows password authentication, the attempts are only limited by the attacker's patience.\n3. Automated scanning of the cloud provider's address ranges means that this exposure is found within hours of creation, not weeks.\n\nThe defender's version of the same trace reads the audit records. A rule creation event for the security group, made by an identity that normally does not change firewall rules, is the signal. The corrective controls are: remove the rule, use session-manager access instead, require key-only authentication, and add a policy that alerts on any rule that opens a sensitive port to the whole internet.",
          code:
            "# Find every security group that allows any address to reach SSH (22) or RDP (3389)\naws ec2 describe-security-groups \\\n  --query 'SecurityGroups[?IpPermissions[?(FromPort==`22` || FromPort==`3389`) && IpRanges[?CidrIp==`0.0.0.0/0`]]].[GroupId,GroupName]' \\\n  --output table\n\n# Confirm that a bucket blocks every form of public access\naws s3api get-public-access-block --bucket example-reports-bucket",
          language: "bash",
          codeLabel: "Two audits every cloud account should run weekly",
        },
        {
          heading: "Containers and Kubernetes",
          kind: "definition",
          body:
            "A **container** packages an application with its dependencies and runs it as an isolated process sharing the host's kernel. Containers are not a security boundary as strong as a virtual machine, so the controls around them matter.\n\nThe main ones:\n\n- **Minimal images.** Build from a small base image, pin versions by digest, and remove build tools from the runtime image. Every package in an image is attack surface and a possible vulnerability.\n- **Scan images.** Tools such as **Trivy** find known vulnerabilities in operating system packages and language dependencies, and can be run in the build pipeline to block high-severity findings.\n- **Do not run as root.** A process running as UID 0 inside a container is much closer to the host than it should be. Set a non-root `USER` in the image and drop Linux capabilities the application does not need.\n- **Read-only filesystems.** Mount the root filesystem read-only and provide writable directories explicitly, which limits what a compromised process can change.\n- **Kubernetes controls.** Use **role-based access control** (RBAC) to limit what users and service accounts can do in the cluster; apply the **Pod Security Standards** (privileged, baseline and restricted profiles) to forbid host access and privileged containers; and use **network policies** to limit which pods can talk to which. The **CIS Kubernetes Benchmark** and the tool **kube-bench** check a cluster against it.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Opening a port 'temporarily'.** Temporary rules outlive the outage. Use session-manager access, and alert on any rule that opens an administrative port to the whole internet.\n- **Putting databases in public subnets.** A database should have no public address. If an application needs it, route through private connectivity.\n- **Treating NAT as a firewall.** A NAT gateway controls outbound routing; security groups and network policies decide what is accepted.\n- **Running containers as root with privileged mode.** Privileged containers are close to a host compromise. Refuse them in policy.\n- **Scanning once.** Images and clusters change daily. Scan in the pipeline and continuously in the environment.\n- **Default service accounts with broad rights.** Give each workload its own identity with only the permissions it uses.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["Trivy", "Scanning container images, filesystems and infrastructure code for known vulnerabilities", "trivy.dev or the Docker image aquasec/trivy"],
            ["kube-bench", "Checking a Kubernetes cluster against the CIS benchmark", "github.com/aquasecurity/kube-bench"],
            ["kind or minikube", "A local Kubernetes cluster for practice", "kind.sigs.k8s.io, minikube.sigs.k8s.io"],
            ["Docker", "Building and running containers locally", "docker.com"],
            ["Cloud CLI security group commands", "Auditing network rules from the command line", "aws ec2, az network nsg, gcloud compute firewall-rules"],
            ["Prowler or ScoutSuite", "Automated cloud configuration audits, including network rules", "github.com/prowler-cloud/prowler, github.com/nccgroup/ScoutSuite"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use a free-tier account, LocalStack for the network commands where it supports them, and a local cluster for the Kubernetes work. Do not scan systems you do not own.",
          items: [
            "Create a VPC with one public subnet and one private subnet. Place a test instance in the private subnet and confirm, from your own machine, that it has no public address.",
            "Run the security group audit command from the lesson on your account. If it returns nothing, create a deliberately open rule in a test group, run the audit again, and then delete the rule.",
            "Create a security group that allows port 443 from the internet and nothing else. Attach it to a test instance, then check with `nmap` from outside that only port 443 is reported open.",
            "Build a small container image from a Dockerfile of your own, first running as root and then as a non-root user. Confirm the difference with `docker run --rm IMAGE id`.",
            "Scan the image with Trivy (`trivy image IMAGE`). Choose one high-severity finding, update the base image or package, rebuild, and rescan to show the finding is gone.",
            "Start a local kind cluster, run kube-bench against it, and record three failing checks. For one, write the change that would fix it and the risk of leaving it unfixed.",
            "Write a one-page network standard for the fictional company from the previous module: which subnets exist, what each may reach, and the single approved path for administrative access.",
          ],
        },
      ],
      challenge:
        "Build a three-tier network in a lab account with a public load balancer, a private application tier and a private database. Use session-manager access only. Then produce an audit script that fails if any security group allows a sensitive port from the internet, and demonstrate that it fails on a deliberately bad change and passes on the corrected design.",
      keyPoints: [
        "Design public and private subnets for a three-tier application",
        "Distinguish stateful security groups from stateless network access control lists",
        "Replace open administrative ports with authenticated, logged access",
        "Scan container images and reduce their privileges and filesystem write access",
        "Audit a Kubernetes cluster against a benchmark and apply pod security policies",
      ],
      exercises: [
        "Explain why a security group allowing SSH from 0.0.0.0/0 is a finding even if the instance has strong key-only authentication.",
        "Why does a stateless NACL require an explicit rule for return traffic, and what breaks if you forget one?",
        "Describe the attack that a read-only root filesystem makes harder, and one legitimate workload that would need a writable directory.",
        "A developer asks for a privileged container to 'fix a permission issue quickly'. Write the reply you would give and the alternative you would offer.",
        "Practical problem: a scan reports 40 high-severity vulnerabilities in a base image, 38 of which are in a package the application never uses. Describe your triage and the change you would make to the image.",
      ],
    }),
    lesson({
      id: "data-protection-and-secrets",
      title: "Data protection and secrets",
      summary:
        "Data is what attackers want, and it is also what regulators ask about. This lesson covers encryption at rest and in transit, the key-management decisions that determine who can read encrypted data, the storage of application secrets and their rotation, backups that resist ransomware through immutability, and the obligations that Ghana's Data Protection Act, 2012 places on anyone who processes personal data. The practicals encrypt, store, rotate and recover real objects in a lab account.",
      sections: [
        {
          heading: "Learning context",
          kind: "paragraph",
          body:
            "Data protection has three questions: where is the data, who can read it, and what happens if a copy is taken. Encryption answers the second question only if the keys are controlled. Secrets management answers it for credentials. Backups answer the third, but only if an attacker who controls the production system cannot also destroy the backups. Privacy law adds a fourth question: is the data necessary at all?",
        },
        {
          heading: "Encryption at rest and in transit",
          kind: "definition",
          body:
            "Modern cloud storage is encrypted at rest by default, usually with keys the provider manages. That protects against someone obtaining the physical disks, but not against a principal who can read the storage through the normal interface, because the service decrypts transparently for it.\n\nThe stronger patterns are:\n\n- **Customer-managed keys** in a key management service (AWS KMS, Azure Key Vault, Google Cloud KMS). The key has its own access policy, can be disabled, and every use is logged. A principal who can read the data but not use the key cannot decrypt it.\n- **Envelope encryption**: data is encrypted with a data key, and the data key is encrypted with a master key held in the key service. This allows large objects to be encrypted efficiently and lets the master key be rotated without re-encrypting everything.\n- **Encryption in transit** using TLS 1.2 or later for every connection, including between services inside the cloud. Require it on storage endpoints and databases, and reject plaintext connections in configuration.\n\nKey rotation is a process, not a single event. Rotate master keys on a schedule, and keep the old keys available for decryption until data encrypted under them is re-encrypted or expired.",
          code:
            "# Create a customer-managed key and make an S3 bucket default to it\nKEY_ID=$(aws kms create-key --description 'reports bucket key' --query KeyMetadata.KeyId --output text)\naws s3api put-bucket-encryption --bucket example-reports-bucket \\\n  --server-side-encryption-configuration \"{\\\"Rules\\\":[{\\\"ApplyServerSideEncryptionByDefault\\\":{\\\"SSEAlgorithm\\\":\\\"aws:kms\\\",\\\"KMSMasterKeyID\\\":\\\"$KEY_ID\\\"}}]}\"\naws s3api get-bucket-encryption --bucket example-reports-bucket",
          language: "bash",
          codeLabel: "Customer-managed encryption, set and then verified",
        },
        {
          heading: "Secrets: stored, scoped and rotated",
          kind: "paragraph",
          body:
            "A **secret** is any value that authenticates or authorises: a database password, an API token, a signing key. The rules are simple to state. Secrets are never in source code, container images, client-side bundles or chat messages. They are stored in a dedicated service (AWS Secrets Manager, Azure Key Vault, Google Secret Manager, or HashiCorp Vault where an organisation runs its own), read at runtime through an identity the workload already has, and rotated automatically where the service supports it.\n\nThe weakest common pattern is an environment variable baked into a deployment template in plain text. The template is readable by anyone who can read the deployment history, which is usually more people than can read the secret itself.",
        },
        {
          heading: "Backups that survive an attacker",
          kind: "definition",
          body:
            "Ransomware and destructive attacks target backups along with production, so a cloud backup strategy needs a separate control plane. The properties to require are: **immutability** (object lock or immutable blob storage, which prevents deletion or overwrite for a fixed retention period, even by an administrator); **separation** (backups in a separate account with different administrators); **encryption with separate keys**; and **tested restores**, timed against the recovery objectives agreed with the business.\n\nS3 Object Lock must be enabled when a bucket is created in the case of AWS, which is why it is a design decision, not a setting to add later. Azure offers immutable blob storage with time-based retention policies on containers.",
        },
        {
          heading: "Personal data and Ghana's Data Protection Act, 2012",
          kind: "warning",
          body:
            "The **Data Protection Act, 2012 (Act 843)** applies to the processing of personal data by controllers and processors established in Ghana, and to processing that uses equipment in Ghana. It sets principles that a cloud design should reflect: data should be collected for specified purposes, kept no longer than necessary, kept accurate and secure, and processed with the consent of the individual or on another lawful basis. Controllers must register with the Data Protection Commission, and personal data may be transferred outside Ghana only under conditions the Act sets out, such as adequate protection in the destination.\n\nFor a cloud designer, the practical translation is: know which systems hold personal data, minimise it, restrict access by role, encrypt it with controlled keys, log access to it, define retention and deletion, and be able to say which country it is stored in. Check the current text of the Act and any Commission guidance with a qualified adviser, because obligations and enforcement practice change.",
        },
        {
          heading: "Common mistakes and misconceptions",
          kind: "warning",
          body:
            "- **Believing default encryption is enough.** If any principal can read the data, the service will decrypt it for them. Consider who holds the keys.\n- **Secrets in deployment templates or images.** Read them at runtime from a secrets store, and audit who can read the store.\n- **Rotating a key without a plan for old data.** Keep decryption capability for old keys until the data is re-encrypted or expired.\n- **Backups in the same account and with the same administrators.** One compromised credential then destroys both production and recovery.\n- **Copying production data into development.** It is a privacy breach in waiting. Use synthetic or de-identified data.\n- **Keeping personal data 'just in case'.** Retention is a legal duty as well as a cost. Define it and enforce deletion.",
        },
        {
          heading: "Tools for this lesson",
          kind: "table",
          rows: [
            ["Tool", "What it is for", "Where to get it"],
            ["AWS KMS, Azure Key Vault, Google Cloud KMS", "Managing encryption keys with access policies and logs", "Cloud consoles and CLIs"],
            ["AWS Secrets Manager or equivalent", "Storing, reading and rotating application secrets", "Cloud consoles and CLIs"],
            ["HashiCorp Vault", "Self-managed secrets and dynamic credentials", "developer.hashicorp.com/vault"],
            ["gitleaks", "Finding secrets committed to repositories before they leak", "github.com/gitleaks/gitleaks"],
            ["restic or rclone", "Encrypted backups to object storage", "restic.net, rclone.org"],
            ["Data Protection Act, 2012 (Act 843)", "The legal basis for personal data obligations in Ghana", "Official Gazette or the Data Protection Commission website"],
          ],
        },
        {
          heading: "Practicals",
          kind: "exercise",
          body:
            "Use a lab account with synthetic data only. Record the command and its output for each step, because the evidence is what proves the control.",
          items: [
            "Create a bucket for reports. Enable Block Public Access with `aws s3api put-public-access-block` using all four settings set to true, then confirm with `get-public-access-block`.",
            "Create a customer-managed KMS key and set the bucket's default encryption to use it, as in the lesson. Upload a test file and confirm with `aws s3api head-object` that it is encrypted with the key.",
            "Store a fake database password in Secrets Manager with `aws secretsmanager create-secret`. Read it back with `get-secret-value` using an identity that has only that permission, and show that a second identity without the permission is refused.",
            "Rotate the secret's value and show that the old value is no longer the current one. Record the time and the new version identifier.",
            "Run gitleaks against a sample repository with a fake key committed to history. Remove it with a history rewrite in your lab copy, and explain why the key must still be rotated.",
            "Enable versioning on a second bucket and, if your environment supports it, object lock with a retention period. Delete a test object and show that the version is still recoverable (or that the lock blocks deletion).",
            "Write a data-inventory table for the fictional company: each data set, whether it is personal data, the lawful basis, the storage location, the retention period and the deletion method.",
          ],
        },
      ],
      challenge:
        "Design the data protection for a fictional clinic's patient-booking application. Specify the storage encryption and key policy, the secrets flow from store to application, the backup and restore design with immutability, the data inventory and retention periods, and the cross-border transfer position under the Data Protection Act. Demonstrate the technical controls in a lab with synthetic records and attach the command evidence.",
      keyPoints: [
        "Explain the difference between default encryption and customer-managed keys",
        "Store, scope, read and rotate application secrets without placing them in code or templates",
        "Design immutable, separately controlled backups and test their restore",
        "Map cloud data handling to the principles of Ghana's Data Protection Act, 2012",
        "Recover from a committed secret by rotating it, not merely deleting it",
      ],
      exercises: [
        "Explain why a principal who can read an encrypted object through the storage service may still be unable to decrypt it when the key is customer-managed.",
        "Why does deleting a secret from the latest commit fail to remove the exposure, and what must happen instead?",
        "An attacker with administrator access to production attempts to delete the backups. Describe the three controls that should stop them and which one matters most.",
        "List four questions a data protection officer would ask about a new analytics tool that stores customer email addresses in a foreign region.",
        "Practical problem: a rotation of a database password breaks an application for ten minutes. Describe the design change that makes the next rotation invisible to users.",
      ],
    }),
  ],
);
