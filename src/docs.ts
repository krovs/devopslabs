export type DocInline = string | { code: string };

export type DocBlock =
  | { type: "paragraph"; content: DocInline[] }
  | { type: "orderedList"; items: DocInline[][] }
  | { type: "unorderedList"; items: DocInline[][] }
  | { type: "heading"; text: string }
  | { type: "code"; text: string }
  | { type: "diagram"; ariaLabel: string; nodes: { title: string; detail: string }[] }
  | { type: "tree"; ariaLabel: string; rows: { kind: "root" | "branch" | "leaf"; code: string; text: string }[] };

export type DocSection = {
  id: string;
  navTitle: string;
  title: string;
  blocks: DocBlock[];
};

export const documentationSections: DocSection[] = [
  {
    id: "wiki-workflow",
    navTitle: "Workflow",
    title: "Lab Workflow",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Start every lab by reproducing the failure. The terminal output tells you which system is unhealthy: Terraform state, AWS resources, Terragrunt stack wiring, or a GitHub Actions job.",
        ],
      },
      {
        type: "orderedList",
        items: [
          ["Run the obvious inspection command, such as ", { code: "terraform plan" }, " or ", { code: "gh run view" }, "."],
          ["Open the file tab mentioned by the error."],
          ["Fix the smallest thing that explains the failure."],
          ["Run the validation or plan command again."],
          ["Use ", { code: "check" }, " only after the run is clean."],
        ],
      },
      {
        type: "paragraph",
        content: [
          "Incident Mode hides unsolved lab names and direct scenario descriptions. Use it when you want symptoms first and clues only when needed.",
        ],
      },
    ],
  },
  {
    id: "wiki-terraform",
    navTitle: "IaC",
    title: "IaC",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Terraform labs focus on the relationship between configuration, remote infrastructure, and state. A clean fix usually makes the state address, the code address, and the real AWS object agree.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "Terraform troubleshooting relationship diagram",
        nodes: [
          { title: "Configuration", detail: "main.tf / modules" },
          { title: "State", detail: "tracked addresses" },
          { title: "AWS", detail: "real resources" },
        ],
      },
      {
        type: "code",
        text: "terraform init\nterraform validate\nterraform plan\nterraform apply\nterraform state list\nterraform import <address> <id>\nterraform state mv <old-address> <new-address>\nterraform force-unlock <lock-id>",
      },
      { type: "heading", text: "State And Drift" },
      {
        type: "paragraph",
        content: [
          "Import is for a real object that exists but is not tracked in state. State move is for a tracked object whose Terraform address changed after a folder, module, or resource rename migration.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "Force unlock is a recovery action. Use it only when you know the apply that created the lock is no longer running.",
        ],
      },
    ],
  },
  {
    id: "wiki-iac-security-baselines",
    navTitle: "IaC Security",
    title: "IaC Security Baselines",
    blocks: [
      {
        type: "paragraph",
        content: [
          "IaC Security Baselines labs are Terraform exercises focused on spotting missing cloud guardrails before deployment. The goal is to identify bad or incomplete service configuration, fix the Terraform, then pass the simulated Checkov gate.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "IaC security baseline review flow",
        nodes: [
          { title: "Terraform", detail: "AWS service config" },
          { title: "Policy Scan", detail: "checkov -f main.tf" },
          { title: "Guardrails", detail: "encryption, backup, audit" },
        ],
      },
      { type: "code", text: "terraform init\ncheckov -f main.tf\nterraform plan\ncheck" },
      {
        type: "paragraph",
        content: [
          "Common fixes include S3 public access blocks, bucket encryption and versioning, RDS private access, backup retention, deletion protection, CloudWatch log retention, and multi-region CloudTrail with log file validation.",
        ],
      },
    ],
  },
  {
    id: "wiki-terragrunt",
    navTitle: "Terragrunt",
    title: "Terragrunt",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Terragrunt labs add stack composition on top of Terraform. Most failures come from a wrong module source, a missing root include, unformatted HCL, or a dependency output name mismatch.",
        ],
      },
      {
        type: "tree",
        ariaLabel: "Terragrunt file structure diagram",
        rows: [
          { kind: "root", code: "terragrunt.hcl", text: "root config, remote_state, shared inputs" },
          { kind: "branch", code: "live/dev/network/terragrunt.hcl", text: "network stack" },
          { kind: "branch", code: "live/dev/app/terragrunt.hcl", text: "app stack, depends on network" },
          { kind: "leaf", code: "modules/network/main.tf", text: "Terraform network module" },
          { kind: "leaf", code: "modules/app/main.tf", text: "Terraform app module" },
        ],
      },
      { type: "code", text: "terragrunt init\nterragrunt validate\nterragrunt plan\nterragrunt run-all plan\nterragrunt hclfmt" },
      {
        type: "paragraph",
        content: [
          "Check ",
          { code: "include" },
          " blocks before debugging Terraform variables. If a child stack does not include the root config, it may miss shared inputs and remote state settings.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "For dependency labs, compare what the consumer reads, for example ",
          { code: "dependency.network.outputs.vpc_id" },
          ", with what the producer exposes.",
        ],
      },
    ],
  },
  {
    id: "wiki-github",
    navTitle: "GitHub Actions",
    title: "GitHub Actions",
    blocks: [
      {
        type: "paragraph",
        content: [
          "CI/CD labs are solved by reading the failed job, fixing the workflow or repo settings, and rerunning the pipeline. Avoid guessing from the workflow file alone; the failing step usually gives the shortest path.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "GitHub Actions troubleshooting flow",
        nodes: [
          { title: "Run Fails", detail: "gh run view" },
          { title: "Fix Cause", detail: "secret, path, OIDC, permissions" },
          { title: "Rerun", detail: "gh run rerun" },
        ],
      },
      { type: "code", text: "gh run view\ngh run rerun\ngh secret list\ngh secret set AWS_ROLE_ARN" },
      {
        type: "paragraph",
        content: [
          "For AWS deployments, prefer OIDC over long-lived access keys. The workflow needs ",
          { code: "id-token: write" },
          ", the role ARN must be available, and the IAM trust policy subject must match the branch or environment that is running.",
        ],
      },
    ],
  },
  {
    id: "wiki-gitops",
    navTitle: "GitOps",
    title: "GitOps",
    blocks: [
      {
        type: "paragraph",
        content: [
          "GitOps labs focus on reconciliation controllers such as Argo CD and Flux. The failure is usually that the controller is watching the wrong Git target, applying the wrong path, or not reconciling drift.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "GitOps reconciliation flow",
        nodes: [
          { title: "Git", detail: "branch and path" },
          { title: "Controller", detail: "Argo CD or Flux" },
          { title: "Cluster", detail: "live resources" },
        ],
      },
      { type: "code", text: "argocd app get checkout\nflux reconcile kustomization platform --with-source" },
      {
        type: "paragraph",
        content: [
          "Check target revisions, source paths, prune settings, self-heal behavior, and suspended reconciliation before editing workload manifests.",
        ],
      },
    ],
  },
  {
    id: "wiki-kubernetes",
    navTitle: "Kubernetes",
    title: "Kubernetes",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Kubernetes labs focus on workload health, rendered manifests, namespace access, and rollout convergence. Start from symptoms in pods and events, then inspect the source that owns the workload: a Deployment manifest, ServiceAccount, RBAC binding, or Helm values.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "Kubernetes troubleshooting flow",
        nodes: [
          { title: "Cluster", detail: "pods, events, logs" },
          { title: "Source", detail: "manifest, RBAC, or Helm chart" },
          { title: "Rollout", detail: "restart, upgrade, status" },
        ],
      },
      {
        type: "code",
        text: "kubectl get pods\nkubectl get events\nkubectl describe pod checkout-api\nkubectl logs checkout-api\nkubectl auth can-i get configmaps --as system:serviceaccount:payments:checkout-api -n payments\naws sts assume-role-with-web-identity\nkubectl rollout restart deployment checkout-api\nkubectl rollout status deployment checkout-api\nkubectl scale deployment checkout-api --replicas=2\nhelm lint checkout ./chart\nhelm template checkout ./chart\nhelm upgrade checkout ./chart",
      },
      {
        type: "paragraph",
        content: [
          "For EKS service account labs, check both identities. ",
          { code: "kubectl auth can-i" },
          " validates Kubernetes RBAC for the service account subject, while ",
          { code: "aws sts assume-role-with-web-identity" },
          " validates the IAM role trust path exposed by the ServiceAccount annotation.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "For Helm labs, render before upgrading. ",
          { code: "helm template checkout ./chart" },
          " shows the Deployment and Service Kubernetes will receive, while ",
          { code: "values.yaml" },
          " is usually the smallest safe place to fix a bad port, image tag, replica count, or probe setting.",
        ],
      },
    ],
  },
  {
    id: "wiki-iam",
    navTitle: "IAM",
    title: "IAM",
    blocks: [
      {
        type: "paragraph",
        content: [
          "IAM labs focus on whether a principal can perform a specific action on a specific resource, and whether the policy also blocks nearby access that should remain denied.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "IAM evaluation flow",
        nodes: [
          { title: "Principal", detail: "role or OIDC subject" },
          { title: "Policy", detail: "action, resource, condition" },
          { title: "Decision", detail: "allow or deny" },
        ],
      },
      {
        type: "code",
        text: "aws iam simulate-principal-policy\naws sts assume-role-with-web-identity\naws s3 cp\naws kms decrypt\naz role assignment list",
      },
      {
        type: "paragraph",
        content: [
          "For least privilege, check all three dimensions: action, resource, and condition or scope. A policy that allows the happy path can still be wrong if it also allows another prefix, another branch, decrypt without the required encryption context, or a subscription-wide Azure role assignment where a container scope is enough.",
        ],
      },
    ],
  },
  {
    id: "wiki-policy",
    navTitle: "Policy as Code",
    title: "Policy as Code",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Policy as Code labs model platform and workload guardrails. These are separate from organization policy: they run close to Kubernetes admission, service mesh authorization, or runtime network enforcement.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "Policy as code validation flow",
        nodes: [
          { title: "Policy", detail: "Kyverno, Istio, Cilium" },
          { title: "Validation", detail: "test or dry-run" },
          { title: "Guardrail", detail: "admission or traffic control" },
        ],
      },
      { type: "code", text: "kyverno test .\nkubectl apply --dry-run=server -f policy.yaml" },
      {
        type: "paragraph",
        content: [
          "Use these labs for Kubernetes NetworkPolicy, Kyverno admission policy, Istio AuthorizationPolicy, and CiliumNetworkPolicy patterns. Organization-wide cloud guardrails still belong in Organization Policy.",
        ],
      },
    ],
  },
  {
    id: "wiki-secrets",
    navTitle: "Secrets",
    title: "Secrets Management",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Secrets labs focus on safe lookup paths, customer managed KMS keys, rotation, and environment separation. The common failure is not only that a secret cannot be read; it may be readable from the wrong environment or protected by a weak default.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "Secrets lookup flow",
        nodes: [
          { title: "Service", detail: "environment" },
          { title: "Secret Path", detail: "SSM or Secrets Manager" },
          { title: "Protection", detail: "KMS and rotation" },
        ],
      },
      { type: "code", text: "aws secretsmanager describe-secret\naws ssm get-parameter" },
      {
        type: "paragraph",
        content: [
          "Check whether the app is using the correct environment prefix before changing permissions. For Secrets Manager, verify rotation and KMS key choice together; enabling one without the other can still leave the operational control incomplete.",
        ],
      },
    ],
  },
  {
    id: "wiki-dns",
    navTitle: "DNS/TLS",
    title: "DNS/TLS",
    blocks: [
      {
        type: "paragraph",
        content: [
          "DNS/TLS labs model Route 53, ACM, ALB aliases, and CloudFront certificate problems. The fix is usually a precise record or region change, not a broad infrastructure rewrite.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "DNS TLS resolution and certificate flow",
        nodes: [
          { title: "Hostname", detail: "Route 53 record" },
          { title: "Endpoint", detail: "ALB or CloudFront" },
          { title: "Certificate", detail: "ACM validation" },
        ],
      },
      { type: "code", text: "aws acm describe-certificate\ndig app.example.com" },
      {
        type: "paragraph",
        content: [
          "CloudFront viewer certificates must be issued in ",
          { code: "us-east-1" },
          ". ALB aliases need the current load balancer DNS name and hosted zone ID, and should normally use an alias ",
          { code: "A" },
          " record rather than a stale CNAME to an old load balancer.",
        ],
      },
    ],
  },
  {
    id: "wiki-networking",
    navTitle: "Networking",
    title: "Networking",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Networking labs use a diagram instead of a terminal. Select components to inspect editable settings, run packet traces to see where traffic fails, and use the design check only when the path matches the requirement.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "Networking troubleshooting flow",
        nodes: [
          { title: "Symptoms", detail: "failed path" },
          { title: "Diagram", detail: "routes and controls" },
          { title: "Trace", detail: "component failure" },
        ],
      },
      {
        type: "paragraph",
        content: [
          "Treat VPCs and subnets as containment boundaries. Routes decide where packets go, security groups and NACLs decide whether traffic is allowed, and WAF/ALB controls decide how public requests enter the app.",
        ],
      },
    ],
  },
  {
    id: "wiki-pr",
    navTitle: "PR Review",
    title: "PR Review",
    blocks: [
      {
        type: "paragraph",
        content: [
          "PR review labs are solved by reading the diff, choosing the right review decision, and selecting the findings that should be left on the review. The goal is to catch risky changes before they merge.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "PR review flow",
        nodes: [
          { title: "Diff", detail: "changed lines" },
          { title: "Risk", detail: "required findings" },
          { title: "Decision", detail: "approve or changes" },
        ],
      },
      {
        type: "paragraph",
        content: [
          "Request changes when the diff introduces public access, broad IAM, overbroad GitHub token permissions, or skips a required guardrail. Do not select harmless context lines as findings.",
        ],
      },
    ],
  },
  {
    id: "wiki-security",
    navTitle: "Security",
    title: "Security Checks",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Security exercises model checks that should fail before deployment. Treat them as release gates, not warnings to ignore.",
        ],
      },
      { type: "code", text: "checkov -f main.tf" },
      {
        type: "unorderedList",
        items: [
          ["Block public S3 access unless the lab explicitly requires public access."],
          ["Avoid module defaults that expose ", { code: "0.0.0.0/0" }, "."],
          ["Use scoped GitHub Actions permissions instead of ", { code: "write-all" }, "."],
          ["Keep AWS OIDC trust policies narrow to the intended repository, branch, or environment."],
          ["Scope secret access to the correct environment path and customer managed KMS key where required."],
          ["Validate DNS and certificate changes before routing production traffic to a new endpoint."],
          ["Review AWS managed service defaults; many secure settings are opt-in in Terraform."],
        ],
      },
    ],
  },
  {
    id: "wiki-appsec",
    navTitle: "AppSec",
    title: "Application Security",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Application Security labs model DevSecOps review of Java services. Treat package risk, source-code findings, committed secrets, and container hardening as separate signals that all need clean validation before release.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "Java application security audit flow",
        nodes: [
          { title: "Dependencies", detail: "dependency-check" },
          { title: "Code", detail: "semgrep" },
          { title: "Release", detail: "gitleaks, trivy, tests" },
        ],
      },
      {
        type: "code",
        text: "mvn test\nmvn org.owasp:dependency-check-maven:check\nsemgrep scan\ngitleaks detect\ntrivy config .",
      },
      {
        type: "paragraph",
        content: [
          "For Java code review, verify that authorization decisions come from trusted security context and that user input does not change SQL structure. ",
          { code: "@PreAuthorize" },
          " and parameterized queries are common safe patterns in Spring applications.",
        ],
      },
    ],
  },
  {
    id: "wiki-cloudsec",
    navTitle: "Cloud Audit",
    title: "Cloud Security Audit",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Cloud Security Audit labs model AWS security investigations. Start from a detection signal, correlate it with activity logs and configuration history, then prove the effective permission path before changing IAM.",
        ],
      },
      {
        type: "diagram",
        ariaLabel: "AWS cloud security audit flow",
        nodes: [
          { title: "Detection", detail: "GuardDuty finding" },
          { title: "Evidence", detail: "CloudTrail, Logs, Config" },
          { title: "Access", detail: "IAM simulation" },
        ],
      },
      {
        type: "code",
        text: "aws guardduty list-findings\naws guardduty get-findings\naws cloudtrail lookup-events\naws logs filter-log-events\naws configservice get-resource-config-history\naws iam simulate-principal-policy",
      },
      {
        type: "paragraph",
        content: [
          "Use ",
          { code: "aws configservice get-resource-config-history" },
          " for AWS Config resource history. The CLI namespace is ",
          { code: "configservice" },
          ", not ",
          { code: "config" },
          ".",
        ],
      },
    ],
  },
  {
    id: "wiki-troubleshooting",
    navTitle: "Troubleshooting",
    title: "Troubleshooting Patterns",
    blocks: [
      {
        type: "paragraph",
        content: [
          "When a plan wants to create something that already exists, check whether the object should be imported. When a plan wants to destroy and recreate the same object after a refactor, check whether the state address should be moved.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "When a GitHub Actions job fails, fix the first failing step. Later failures often disappear after the first broken permission, secret, path, or version is corrected.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "When a Kubernetes rollout is unhealthy, compare pod events, logs, and the rendered manifest. For Helm-managed workloads, fix the value that renders the bad manifest before running ",
          { code: "helm upgrade" },
          ".",
        ],
      },
      {
        type: "paragraph",
        content: [
          "When DNS or certificate validation fails, compare the exact record name, record value, region, and alias target. Small string mismatches are more common than missing infrastructure.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "When reviewing a PR, separate required findings from harmless context. A good review blocks the risky change and explains the smallest safer alternative.",
        ],
      },
    ],
  },
];
