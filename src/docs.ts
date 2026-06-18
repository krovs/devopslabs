import type { Scenario } from "./types";

export type DocInline = string | { code: string };

export type DocBlock =
  | { type: "paragraph"; content: DocInline[] }
  | { type: "orderedList"; items: DocInline[][] }
  | { type: "unorderedList"; items: DocInline[][] }
  | { type: "heading"; text: string }
  | { type: "code"; text: string }
  | { type: "table"; headers: string[]; rows: DocInline[][][] }
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
    id: "wiki-terraform",
    navTitle: "Terraform",
    title: "Terraform",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Terraform is an infrastructure-as-code tool. It reads declarative configuration, compares it with state and provider APIs, then creates an execution plan for infrastructure changes.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          [{ code: "main.tf" }, " defines resources, data sources, providers, modules, variables, and outputs."],
          ["State maps Terraform resource addresses to real infrastructure objects."],
          ["A plan shows create, update, replace, and destroy actions before apply."],
          ["Modules package reusable infrastructure behind inputs and outputs."],
          ["Imports attach existing infrastructure to Terraform state."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      {
        type: "code",
        text: "terraform init\nterraform fmt\nterraform validate\nterraform plan\nterraform apply\nterraform state list\nterraform state show <address>\nterraform import <address> <id>\nterraform state mv <old-address> <new-address>\nterraform force-unlock <lock-id>",
      },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Missing variable or output: a module call expects a value that is not declared."],
          ["Wrong resource address: configuration references a name that does not exist."],
          ["Drift: real infrastructure changed outside Terraform."],
          ["State mismatch: an object exists, but Terraform does not track it."],
          ["Replacement risk: a name, immutable field, or resource address changed."],
          ["Interrupted apply: remote objects may exist while state and locks are incomplete."],
        ],
      },
      { type: "heading", text: "State and Lock Recovery" },
      {
        type: "unorderedList",
        items: [
          ["Remote state is the source Terraform uses to decide what it already manages. If an object exists outside state, Terraform may try to create a duplicate."],
          [{ code: "terraform import" }, " attaches an existing object to a resource address without recreating it."],
          [{ code: "terraform state mv" }, " changes the address of an object already tracked in state, useful after moving code into a module."],
          ["A stale backend lock should be released only after confirming no apply is still running and the lock ID matches the failed operation."],
          ["AWS S3 backends commonly inspect locks with DynamoDB; Azure Blob Storage backends use blob leases on the state blob."],
          ["For Azure backends, inspect lease state with ", { code: "az storage blob show" }, " and break a confirmed stale lease with ", { code: "az storage blob lease break" }, "."],
        ],
      },
    ],
  },
  {
    id: "wiki-iac-security-baselines",
    navTitle: "IaC Security",
    title: "IaC Security",
    blocks: [
      {
        type: "paragraph",
        content: [
          "IaC security is the practice of checking infrastructure definitions before deployment. It catches insecure defaults, missing encryption, public exposure, and weak logging controls early in review.",
        ],
      },
      { type: "heading", text: "Common Controls" },
      {
        type: "unorderedList",
        items: [
          ["S3: block public access, enable encryption, versioning, and access logging where needed."],
          ["RDS: disable public access, require encryption, backups, deletion protection, and private subnets."],
          ["CloudTrail: enable multi-region trails, log validation, encrypted storage, and restricted buckets."],
          ["CloudWatch Logs: set retention instead of keeping logs forever by accident."],
          ["Security groups: avoid broad ingress such as ", { code: "0.0.0.0/0" }, " on administrative ports."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "terraform validate\nterraform plan\ncheckov -f main.tf\ncheckov -d ." },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Provider defaults are often operational, not secure."],
          ["Encryption may require both an enabled flag and a KMS key reference."],
          ["A resource can be private but still weakly recoverable without backups or retention."],
          ["Static scanners report the configuration, not the deployed runtime state."],
          ["A CloudTrail can exist but still miss regions, log validation, or encrypted log storage."],
          ["A secure S3 baseline usually needs block public access, ownership controls, encryption, versioning, and least-privilege policy."],
        ],
      },
      { type: "heading", text: "AWS Config Style Checks" },
      {
        type: "unorderedList",
        items: [
          ["S3 checks usually look for public access, encryption, versioning, logging, and bucket policy exposure."],
          ["RDS checks usually look for public accessibility, storage encryption, backup retention, deletion protection, and subnet placement."],
          ["CloudWatch checks look for explicit log group retention so logs do not remain forever by default."],
          ["CloudTrail checks look for multi-region coverage, log file validation, encrypted delivery, and protected destination buckets."],
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
          "Terragrunt is a thin wrapper around Terraform for composing many stacks. It centralizes backend configuration, shared inputs, provider settings, and dependencies across environments.",
        ],
      },
      { type: "heading", text: "Typical Structure" },
      {
        type: "tree",
        ariaLabel: "Terragrunt structure",
        rows: [
          { kind: "root", code: "terragrunt.hcl", text: "shared remote state, provider, inputs" },
          { kind: "branch", code: "live/dev/network/terragrunt.hcl", text: "environment stack" },
          { kind: "branch", code: "live/dev/app/terragrunt.hcl", text: "dependent stack" },
          { kind: "leaf", code: "modules/network/main.tf", text: "Terraform module source" },
          { kind: "leaf", code: "modules/app/main.tf", text: "Terraform module source" },
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "terragrunt init\nterragrunt validate\nterragrunt plan\nterragrunt apply\nterragrunt hclfmt\nterragrunt run-all plan" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Missing ", { code: "include" }, " block means shared root config is not loaded."],
          ["Wrong ", { code: "source" }, " path points at the wrong module or version."],
          ["Dependency output names must match the producing stack's Terraform outputs."],
          ["Run-all ordering depends on declared ", { code: "dependency" }, " blocks."],
          ["Formatting gates fail when ", { code: "terragrunt hclfmt" }, " has not been applied."],
        ],
      },
      { type: "heading", text: "Dependency and Source Checks" },
      {
        type: "unorderedList",
        items: [
          [{ code: "include" }, " commonly pulls root remote state, provider settings, and shared inputs into a live stack."],
          [{ code: "terraform.source" }, " can point to a local module path or a Git source with a ref; wrong paths fail during init."],
          [{ code: "dependency" }, " blocks expose outputs from another stack. Mock outputs must match real output names used by consumers."],
          [{ code: "terragrunt hclfmt --check" }, " is a formatting gate; run ", { code: "terragrunt hclfmt" }, " to rewrite files."],
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
          "GitHub Actions runs workflows from YAML files in ", { code: ".github/workflows" }, ". A workflow contains triggers, jobs, permissions, steps, secrets, and optional environments.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Workflow: event-driven automation file."],
          ["Job: isolated runner execution unit."],
          ["Step: shell command or reusable action."],
          ["Secrets: encrypted repository or environment values."],
          ["Permissions: scoped token capabilities for ", { code: "GITHUB_TOKEN" }, "."],
          ["OIDC: short-lived cloud federation without static cloud keys."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "gh run list\ngh run view\ngh run view --log\ngh run rerun\ngh secret list\ngh secret set NAME" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Wrong working directory for build or deploy commands."],
          ["Missing secret or environment approval."],
          ["Overbroad or insufficient workflow permissions."],
          ["OIDC trust policy does not match repository, branch, tag, or environment."],
          ["Cache key or path does not match the package manager layout."],
          ["Docker push runs before registry login or with the wrong credential binding."],
          ["A matrix includes an unsupported runtime version."],
          ["A scanner gate fails but the workflow hides or ignores the failing result."],
        ],
      },
      { type: "heading", text: "CI/CD Gates" },
      {
        type: "unorderedList",
        items: [
          ["Actionlint catches workflow syntax, permissions, shell, and expression mistakes before a run wastes time."],
          ["Checkov, Semgrep, Trivy, and dependency scanners should fail narrowly on real policy violations, not be disabled globally."],
          ["Docker registry auth should happen before build push steps and use scoped credentials, not long-lived personal tokens when federation is available."],
          ["GitHub environments provide approval gates, environment secrets, and deployment history; the environment name must match exactly."],
          ["Jenkins credentials need explicit binding into the stage that uses them, and logs should avoid echoing secret values."],
        ],
      },
    ],
  },
  {
    id: "wiki-azure-devops",
    navTitle: "Azure DevOps",
    title: "Azure DevOps Pipelines",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Azure DevOps Pipelines run from YAML files (", { code: "azure-pipelines.yml" }, ") in the repository. A pipeline defines triggers, stages, jobs, steps, variable groups, and optional environments.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Pipeline: YAML-defined CI/CD automation with triggers, stages, and jobs."],
          ["Stage: logical boundary such as Build, Test, or Deploy with dependency ordering."],
          ["Job: agent-level execution unit inside a stage."],
          ["Step: task, script, or action inside a job."],
          ["Variable group: named collection of secret and non-secret variables shared across pipelines."],
          ["Service connection: authenticated link to an external service (Azure, AWS, GitHub, Docker registry)."],
          [{ code: "azure-pipelines.yml" }, " lives in the repository root and is discovered automatically or referenced by name."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "az pipelines build list\naz pipelines build show --id <id>\naz pipelines run\naz devops invoke" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Variable group name does not match the group configured in the project."],
          ["Service connection is expired, revoked, or scoped to the wrong subscription."],
          ["Pipeline YAML references a template path that does not exist in the repository."],
          ["Stage dependsOn references a stage name that is missing or misspelled."],
          ["Agent pool is missing required software (SDK, runtime, tool) for a step."],
          ["Pipeline run is blocked by branch policies, required reviewers, or deployment gates."],
          ["Secret variables are not auto-decrypted inside scripts without explicit mapping."],
        ],
      },
    ],
  },
  {
    id: "wiki-jenkins",
    navTitle: "Jenkins",
    title: "Jenkins Pipelines",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Jenkins runs pipelines defined in a ", { code: "Jenkinsfile" }, " (declarative or scripted). A pipeline contains stages, steps, credentials bindings, and optional agents or nodes.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Pipeline: declarative or scripted automation defined in a Jenkinsfile."],
          ["Stage: logical block like Build, Test, or Publish that groups steps."],
          ["Step: single shell command, script, or plugin action."],
          ["Agent: node, Docker container, or label where the pipeline or stage runs."],
          ["Credentials: securely stored secrets accessed through ", { code: "withCredentials" }, " bindings."],
          [{ code: "withCredentials" }, " wraps steps and binds secret ids to environment variables for that scope."],
          ["Credentials never appear in logs when ", { code: "--password-stdin" }, " is used instead of positional password arguments."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "jenkins build log\njenkins rebuild" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Docker login runs without bound registry credentials (username and password or token)."],
          ["Credentials id is misspelled or references a deleted credential."],
          ["Stage-level agent declaration is missing, so shell steps run on an unexpected node."],
          ["Pipeline approval gate is not configured or the environment name does not match a protected resource."],
          ["Build workspace is stale and retains artifacts from a previous run."],
          ["Shared library version is pinned to a broken or unreachable tag."],
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
          "GitOps uses Git as the desired-state source for deployed systems. Controllers such as Argo CD and Flux compare Git state with cluster state and reconcile drift.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Source: Git repository, branch, tag, or revision."],
          ["Path: directory containing Kubernetes manifests, Helm charts, or Kustomize overlays."],
          ["Sync: applying desired state to the cluster."],
          ["Prune: deleting live resources removed from Git."],
          ["Self-heal: reverting manual changes in the cluster."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "argocd app list\nargocd app get <app>\nargocd app sync <app>\nflux get kustomizations\nflux reconcile kustomization <name> --with-source" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Controller watches the wrong branch, tag, or path."],
          ["Prune is disabled, so deleted Git resources stay live."],
          ["Self-heal is disabled, so manual cluster drift remains."],
          ["Flux source or kustomization is suspended."],
        ],
      },
      { type: "heading", text: "Argo CD and Flux" },
      {
        type: "unorderedList",
        items: [
          ["Argo CD Application fields such as ", { code: "repoURL" }, ", ", { code: "targetRevision" }, ", and ", { code: "path" }, " define what desired state is watched."],
          ["Automated sync applies changes without a manual sync click; prune removes resources deleted from Git; self-heal corrects live drift."],
          ["Flux Kustomization reconciliation can be paused with ", { code: "suspend" }, " and can point at the wrong source path even when the source is healthy."],
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
          "Kubernetes is a container orchestration platform. It schedules workloads onto nodes, keeps desired replica counts, exposes services, manages configuration, and reports workload health through status, events, and logs.",
        ],
      },
      { type: "heading", text: "Core Objects" },
      {
        type: "unorderedList",
        items: [
          ["Pod: one or more containers scheduled together."],
          ["Deployment: manages replica sets and rolling updates."],
          ["Service: stable network endpoint for pods."],
          ["ConfigMap and Secret: runtime configuration data."],
          ["ServiceAccount, Role, RoleBinding: workload identity and Kubernetes RBAC."],
          ["Ingress: HTTP routing from outside the cluster."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      {
        type: "code",
        text: "kubectl get pods\nkubectl get events --sort-by=.lastTimestamp\nkubectl describe pod <pod>\nkubectl logs <pod>\nkubectl logs deploy/<deployment>\nkubectl get deploy,svc,ingress\nkubectl get pdb\nkubectl rollout status deploy/<deployment>\nkubectl rollout restart deploy/<deployment>\nkubectl auth can-i <verb> <resource> --as <subject>\nkubectl drain <node> --ignore-daemonsets --delete-emptydir-data\nhelm lint <chart>\nhelm template <release> <chart>\nhelm upgrade <release> <chart>",
      },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          [{ code: "ImagePullBackOff" }, ": image name, tag, registry auth, or pull secret is wrong."],
          [{ code: "CrashLoopBackOff" }, ": process starts and exits repeatedly."],
          ["Readiness probe failure: pod runs but is not receiving traffic."],
          ["Service targetPort mismatch: Service points to the wrong container port."],
          ["RBAC denied: ServiceAccount lacks permission for a Kubernetes API action."],
          ["HPA saturation: maxReplicas is too low or the CPU target is too high, so pods stay hot during demand spikes."],
          ["Unsafe PDB: planned maintenance can evict too many replicas during voluntary disruptions."],
          ["Helm value mismatch: rendered manifest differs from the intended chart setting."],
        ],
      },
      { type: "heading", text: "Horizontal Pod Autoscaler" },
      {
        type: "paragraph",
        content: [
          "Horizontal Pod Autoscaler adjusts replica count from metrics such as CPU utilization. A useful policy is not one exact set of numbers; it should give the workload enough maximum replica headroom and a target that starts scaling before pods are saturated.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          [{ code: "minReplicas" }, " sets the floor. Keep it high enough for baseline availability, but avoid using it as a manual scale fix."],
          [{ code: "maxReplicas" }, " sets the ceiling. If it is below the replicas needed during a spike, HPA reports scaling limited and latency can stay high."],
          [{ code: "averageUtilization" }, " sets the CPU target. A very high target, such as one near current saturation, reacts late even if more replicas are allowed."],
          ["Reasonable values depend on SLOs, pod startup time, traffic shape, cost, cluster capacity, and whether the app scales linearly."],
        ],
      },
      { type: "code", text: "kubectl get hpa <name>\nkubectl describe hpa <name>\nkubectl get pods\nkubectl apply -f hpa.yaml\nkubectl rollout status deploy/<deployment>" },
      { type: "heading", text: "PodDisruptionBudget" },
      {
        type: "paragraph",
        content: [
          "PodDisruptionBudget limits voluntary disruptions, such as node drains and cluster maintenance. It does not protect against involuntary failures like a node crash, container OOM, or an application process exiting.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          [{ code: "maxUnavailable" }, " limits how many matching pods can be unavailable during a voluntary disruption."],
          [{ code: "minAvailable" }, " sets the minimum number or percentage of matching pods that must stay available."],
          ["The selector must match the pods you intend to protect; a mismatched selector can make the budget ineffective."],
          ["A PDB can block or slow maintenance if the workload does not have enough healthy replicas to satisfy the budget."],
          ["For three replicas, ", { code: "maxUnavailable: 1" }, " keeps at least two available during a planned drain."],
        ],
      },
      { type: "code", text: "kubectl get pdb <name>\nkubectl describe pdb <name>\nkubectl get pods -l app=<app>\nkubectl apply -f pdb.yaml\nkubectl drain <node> --ignore-daemonsets --delete-emptydir-data" },
      { type: "heading", text: "Related Issues" },
      {
        type: "unorderedList",
        items: [
          [
            { code: "IRSA" },
            " means IAM Roles for Service Accounts. In EKS, a Kubernetes ServiceAccount can be annotated with an IAM role ARN so pods using that ServiceAccount receive AWS permissions through web identity federation instead of node-wide credentials.",
          ],
          [
            "Kubernetes RBAC and AWS IAM are separate. ",
            { code: "kubectl auth can-i" },
            " checks Kubernetes API permissions, while AWS IAM controls actions such as reading S3, DynamoDB, KMS, or Secrets Manager.",
          ],
          [
            "A Service routes traffic to pods by label selector and port mapping. ",
            { code: "port" },
            " is the Service port, while ",
            { code: "targetPort" },
            " is the container port receiving traffic.",
          ],
          [
            "Readiness probes decide whether a pod should receive traffic. Liveness probes decide whether Kubernetes should restart the container.",
          ],
          [
            "Helm values are inputs, not the final Kubernetes manifest. Use ",
            { code: "helm template" },
            " to inspect the rendered Deployment, Service, probes, labels, and ports.",
          ],
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
          "IAM controls who can perform which actions on which resources. AWS policy evaluation combines identity policies, resource policies, permissions boundaries, SCPs, session policies, and explicit denies.",
        ],
      },
      { type: "heading", text: "Policy Basics" },
      {
        type: "unorderedList",
        items: [
          [{ code: "Action" }, ": API operation, such as ", { code: "s3:GetObject" }, "."],
          [{ code: "Resource" }, ": ARN scope the action applies to."],
          [{ code: "Condition" }, ": context requirement such as prefix, tag, branch, or encryption context."],
          ["Explicit deny always overrides allow."],
          ["Least privilege means narrow action, resource, and condition."],
        ],
      },
      { type: "heading", text: "Azure RBAC" },
      {
        type: "paragraph",
        content: [
          "Azure role-based access control assigns a role definition to a principal at a scope. Effective access comes from the role's allowed data or management actions and the narrowest applicable scope.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          [{ code: "principal" }, ": user, group, service principal, or managed identity receiving access."],
          [{ code: "roleDefinitionName" }, ": built-in or custom role, such as ", { code: "Storage Blob Data Reader" }, "."],
          [{ code: "scope" }, ": management group, subscription, resource group, resource, or child resource path."],
          ["Storage data roles are separate from management roles. ", { code: "Reader" }, " can inspect the storage account, while ", { code: "Storage Blob Data Reader" }, " can read blob data."],
          ["Container-scoped assignments should target the container resource path instead of the whole subscription or storage account."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "aws iam simulate-principal-policy\naws iam get-policy-version\naws sts get-caller-identity\naws sts assume-role-with-web-identity\naws s3 cp\naws kms decrypt\naz role assignment list\naz role definition list --name \"Storage Blob Data Reader\"\naz storage blob list --auth-mode login --account-name <account> --container-name <container>" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Wildcard action or resource grants more access than intended."],
          ["Missing KMS permissions or missing encryption context condition."],
          ["OIDC trust policy subject does not match the caller."],
          ["Azure role assignment is scoped too broadly, such as subscription Owner when only one container needs blob read access."],
          ["DynamoDB table access is granted without tenant key conditions."],
          ["CloudWatch log writer roles often need create stream and put events, not broad logs admin access."],
        ],
      },
      { type: "heading", text: "Service-Specific Conditions" },
      {
        type: "unorderedList",
        items: [
          [{ code: "dynamodb:LeadingKeys" }, " restricts item access by partition key so a tenant role can only read or write its own tenant prefix."],
          [{ code: "kms:EncryptionContext:<key>" }, " ties decrypt permission to expected context, such as a payroll dataset or secret ARN."],
          [{ code: "s3:prefix" }, " constrains ListBucket to approved object prefixes, while object actions still need scoped object ARNs."],
          ["GitHub OIDC trust often uses ", { code: "token.actions.githubusercontent.com:sub" }, " to bind a role to a repository, branch, tag, or environment."],
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
          "Policy as Code expresses guardrails as versioned, testable rules. In Kubernetes, these rules often validate admission requests or control service-to-service traffic.",
        ],
      },
      { type: "heading", text: "Common Tools" },
      {
        type: "unorderedList",
        items: [
          ["Kyverno: Kubernetes admission policies written as Kubernetes resources."],
          ["OPA/Gatekeeper: admission control using Rego policies and constraints."],
          ["Istio AuthorizationPolicy: service mesh request authorization."],
          ["CiliumNetworkPolicy: L3/L4/L7 network policy with Cilium features."],
          ["Kubernetes NetworkPolicy: namespace and pod traffic rules."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "kyverno test .\nkubectl apply --dry-run=server -f policy.yaml\nkubectl get networkpolicy\nkubectl describe authorizationpolicy" },
      { type: "heading", text: "Policy Comparison" },
      {
        type: "table",
        headers: ["Policy", "Purpose", "Main Scope", "When to Use"],
        rows: [
          [
            [{ code: "Kyverno ClusterPolicy" }],
            ["Admission control: validate, mutate, generate, or verify Kubernetes resources before they are accepted."],
            ["Cluster-wide or namespace-scoped Kubernetes API objects."],
            ["Use when the rule is about what Kubernetes objects are allowed to exist, such as required labels, approved images, or pod security settings."],
          ],
          [
            [{ code: "Kubernetes NetworkPolicy" }],
            ["Native pod traffic control for ingress and egress between pods, namespaces, and CIDRs."],
            ["Namespace-local pods selected by ", { code: "podSelector" }, "."],
            ["Use for basic pod network isolation, default-deny posture, and allow rules between namespaces or app tiers."],
          ],
          [
            [{ code: "Istio AuthorizationPolicy" }],
            ["Service mesh request authorization for workload-to-workload or end-user requests."],
            ["Istio-managed workloads selected by labels in a namespace or mesh root namespace."],
            ["Use when access depends on service identity, JWT identity, HTTP path, method, host, or mesh-aware request context."],
          ],
          [
            [{ code: "CiliumNetworkPolicy" }],
            ["Cilium traffic policy with Kubernetes labels plus DNS, service, entity, CIDR, and L7 controls."],
            ["Cilium endpoints selected by labels, with ingress or egress rules."],
            ["Use when native NetworkPolicy is not expressive enough, especially for DNS egress, L7 rules, entities, or Cilium-specific controls."],
          ],
        ],
      },
      { type: "heading", text: "Kyverno Basics" },
      {
        type: "unorderedList",
        items: [
          [{ code: "ClusterPolicy" }, " applies across the cluster; ", { code: "Policy" }, " applies inside one namespace."],
          [{ code: "match" }, " selects resources the rule evaluates. Use ", { code: "any" }, " or ", { code: "all" }, " to combine resource filters."],
          [{ code: "validate.pattern" }, " describes required fields. A resource must match the pattern to pass."],
          [{ code: "?*" }, " means the field must exist and contain a non-empty value."],
          [{ code: "validationFailureAction: Enforce" }, " blocks non-compliant resources; ", { code: "Audit" }, " only reports them."],
        ],
      },
      { type: "heading", text: "Kyverno Test Flow" },
      {
        type: "orderedList",
        items: [
          ["Read ", { code: "kyverno-test.yaml" }, " to see expected pass/fail results."],
          ["Fix the policy rule, usually ", { code: "match" }, ", ", { code: "validate.pattern" }, ", or ", { code: "validationFailureAction" }, "."],
          ["Run ", { code: "kyverno test ." }, " until expected resources pass or fail for the intended reason."],
        ],
      },
      { type: "code", text: "apiVersion: kyverno.io/v1\nkind: ClusterPolicy\nmetadata:\n  name: require-app-label\nspec:\n  validationFailureAction: Enforce\n  rules:\n    - name: require-app-label\n      match:\n        any:\n          - resources:\n              kinds:\n                - Pod\n      validate:\n        message: Pods must set metadata.labels.app.\n        pattern:\n          metadata:\n            labels:\n              app: \"?*\"" },
      { type: "heading", text: "Kubernetes NetworkPolicy" },
      {
        type: "unorderedList",
        items: [
          [{ code: "podSelector" }, " selects pods the policy protects. Empty ", { code: "{}" }, " selects all pods in the namespace."],
          [{ code: "policyTypes" }, " controls whether the policy affects ", { code: "Ingress" }, ", ", { code: "Egress" }, ", or both."],
          ["A default-deny policy has a selector and policy type but no allow rules."],
          [{ code: "ingress.from" }, " and ", { code: "egress.to" }, " define allowed peers by pod, namespace, or IP block."],
          ["NetworkPolicy is additive. Traffic is allowed if any matching policy allows it."],
        ],
      },
      { type: "code", text: "apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: default-deny-ingress\n  namespace: payments\nspec:\n  podSelector: {}\n  policyTypes:\n    - Ingress" },
      { type: "heading", text: "Istio AuthorizationPolicy" },
      {
        type: "unorderedList",
        items: [
          [{ code: "selector.matchLabels" }, " chooses workloads the policy applies to."],
          [{ code: "action: ALLOW" }, " permits matching requests. If an ALLOW policy exists for a workload, unmatched requests are denied."],
          [{ code: "from.source.principals" }, " matches authenticated workload identities."],
          [{ code: "from.source.requestPrincipals" }, " matches authenticated end-user JWT principals."],
          [{ code: "to.operation" }, " constrains methods, paths, hosts, or ports."],
        ],
      },
      { type: "code", text: "apiVersion: security.istio.io/v1beta1\nkind: AuthorizationPolicy\nmetadata:\n  name: checkout-api-jwt\n  namespace: payments\nspec:\n  selector:\n    matchLabels:\n      app: checkout-api\n  action: ALLOW\n  rules:\n    - from:\n        - source:\n            requestPrincipals:\n              - \"issuer.example.com/*\"" },
      { type: "heading", text: "CiliumNetworkPolicy" },
      {
        type: "unorderedList",
        items: [
          [{ code: "endpointSelector" }, " selects Cilium-managed endpoints by labels."],
          [{ code: "egress" }, " and ", { code: "ingress" }, " allow traffic by endpoint, CIDR, entity, service, DNS, or L7 rule."],
          [{ code: "toEndpoints" }, " allows traffic to selected pods. ", { code: "toFQDNs" }, " allows DNS-name based egress."],
          [{ code: "toPorts.rules.dns" }, " can restrict DNS queries while allowing UDP/TCP 53."],
          ["Cilium policy also works with cluster entities such as ", { code: "kube-apiserver" }, ", ", { code: "world" }, ", and ", { code: "cluster" }, "."],
        ],
      },
      { type: "code", text: "apiVersion: cilium.io/v2\nkind: CiliumNetworkPolicy\nmetadata:\n  name: allow-dns-egress\n  namespace: payments\nspec:\n  endpointSelector:\n    matchLabels:\n      app: checkout-api\n  egress:\n    - toEndpoints:\n        - matchLabels:\n            k8s:io.kubernetes.pod.namespace: kube-system\n            k8s:k8s-app: kube-dns\n      toPorts:\n        - ports:\n            - port: \"53\"\n              protocol: UDP\n          rules:\n            dns:\n              - matchPattern: \"*\"" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Selector does not match the intended pods or namespace."],
          ["Default-deny policy is missing, so allow rules are not meaningful."],
          ["Admission rule validates the wrong field path."],
          ["Kyverno rule stays in ", { code: "Audit" }, " mode, so bad resources are reported but not blocked."],
          ["Mesh policy misses principal, namespace, or method constraints."],
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
          "Secrets management stores and controls sensitive values such as API keys, passwords, certificates, and tokens. Good secret systems separate environments, encrypt values, rotate credentials, and restrict read paths.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Secret path: naming convention that separates app, environment, and purpose."],
          ["SSM Parameter Store: hierarchical key/value store often used for application config and encrypted parameters."],
          ["Vault KV: HashiCorp Vault secret engine that stores versioned key/value secrets behind policies and tokens."],
          ["KMS key: encryption key controlling decrypt permissions."],
          ["Rotation: scheduled credential replacement."],
          ["Resource policy: cross-account or service access rule."],
          ["Versioning: ability to stage and roll back secret values."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "aws secretsmanager describe-secret\naws secretsmanager get-secret-value\naws secretsmanager rotate-secret\naws ssm get-parameter --name <path> --with-decryption\naws ssm get-parameters-by-path --path /<env>/<app>/ --recursive --with-decryption\naws kms describe-key" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Application reads the wrong environment path."],
          ["SSM parameter path points at production from a staging or development service."],
          ["SecureString parameter is read without ", { code: "--with-decryption" }, " or without KMS decrypt permission."],
          ["Default AWS-managed key is used when a customer-managed key is required."],
          ["Rotation is disabled or missing a rotation function."],
          ["Rotation changes stored secret but application still caches old credentials."],
          ["KMS key policy or IAM policy allows secret read but denies decrypt."],
          ["Resource policy allows broad cross-account access."],
        ],
      },
      { type: "heading", text: "SSM Parameter Store" },
      {
        type: "paragraph",
        content: [
          "SSM Parameter Store stores parameters under paths such as ",
          { code: "/staging/checkout/db/password" },
          ". Use path segments to separate environment, service, and secret purpose so applications read only the parameters intended for their boundary.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          [{ code: "String" }, " and ", { code: "StringList" }, " are plain parameter types for non-secret configuration."],
          [{ code: "SecureString" }, " encrypts the value with KMS and requires decrypt permission when reading plaintext."],
          ["IAM policies should scope reads to the smallest useful path prefix, such as ", { code: "arn:aws:ssm:region:account:parameter/staging/checkout/*" }, "."],
          ["Parameter names are part of the access boundary; a wrong path can leak production credentials into lower environments."],
        ],
      },
      { type: "heading", text: "Secrets Manager" },
      {
        type: "paragraph",
        content: [
          "AWS Secrets Manager stores secret values, metadata, resource policies, encryption settings, and rotation configuration. It fits credentials that need lifecycle controls such as automatic password rotation.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["Secret versions use staging labels. ", { code: "AWSCURRENT" }, " is active value, ", { code: "AWSPREVIOUS" }, " is prior value, and ", { code: "AWSPENDING" }, " is used during rotation."],
          ["Rotation usually calls a Lambda function that creates a new credential, tests it, then promotes it to ", { code: "AWSCURRENT" }, "."],
          ["Applications should retrieve the current secret by name or ARN and handle refresh after rotation."],
          ["Resource policies can grant cross-account access, but broad principals or wildcard paths expose too much secret material."],
        ],
      },
      { type: "heading", text: "KMS and Rotation" },
      {
        type: "unorderedList",
        items: [
          ["Secrets Manager encrypts secret values with KMS. Customer-managed keys give tighter policy, audit, and separation control than default AWS-managed keys."],
          ["Readers need both secret read permission, such as ", { code: "secretsmanager:GetSecretValue" }, ", and KMS decrypt permission for the key."],
          ["Rotation Lambda needs permission to read and update the secret, decrypt and encrypt with the KMS key, and update the target system credential."],
          ["KMS key policy should allow intended app roles and rotation roles, not broad account-wide decrypt unless that is deliberate."],
        ],
      },
      { type: "code", text: "aws secretsmanager describe-secret --secret-id <name>\naws secretsmanager get-secret-value --secret-id <name>\naws secretsmanager list-secret-version-ids --secret-id <name>\naws secretsmanager rotate-secret --secret-id <name>\naws kms describe-key --key-id <key-id>\naws kms get-key-policy --key-id <key-id> --policy-name default" },
      { type: "heading", text: "HashiCorp Vault KV" },
      {
        type: "paragraph",
        content: [
          "Vault policies grant capabilities on API paths. With KV v2, users read paths like ",
          { code: "secret/staging/checkout/db" },
          ", while policies usually grant read on ",
          { code: "secret/data/staging/checkout/db" },
          ".",
        ],
      },
      {
        type: "unorderedList",
        items: [
          [{ code: "read" }, " capability allows retrieving a secret value. Avoid granting broader capabilities unless the app must write or manage metadata."],
          ["Environment paths should be isolated, so staging tokens cannot read ", { code: "secret/data/prod/..." }, "."],
          [{ code: "vault token capabilities" }, " shows effective access for the current token and path."],
          ["KV v2 metadata paths use ", { code: "secret/metadata/..." }, "; data reads use ", { code: "secret/data/..." }, "."],
        ],
      },
      { type: "code", text: "vault policy read <policy>\nvault token capabilities secret/data/<env>/<app>/<secret>\nvault kv get secret/<env>/<app>/<secret>" },
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
          "DNS maps names to endpoints. TLS certificates prove endpoint identity and enable encrypted HTTPS. In AWS, Route 53, ACM, ALB, and CloudFront are commonly involved.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          [{ code: "A" }, " record: maps a name to IPv4 address or AWS alias target."],
          [{ code: "CNAME" }, " record: aliases one name to another name."],
          ["Alias record: Route 53-specific pointer to AWS resources like ALB or CloudFront."],
          ["ACM validation: DNS record proving domain ownership."],
          ["CloudFront certificate region: viewer certificates must be in ", { code: "us-east-1" }, "."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "dig example.com\ndig +short app.example.com\naws route53 list-resource-record-sets --hosted-zone-id <zone>\naws acm describe-certificate --certificate-arn <arn>" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Validation CNAME name or value is copied incorrectly."],
          ["Certificate exists in the wrong region for CloudFront."],
          ["Alias points at an old load balancer or wrong hosted zone ID."],
          ["TTL delays make old answers appear after a record change."],
        ],
      },
      { type: "heading", text: "ACM and CloudFront" },
      {
        type: "unorderedList",
        items: [
          ["ACM DNS validation creates one or more CNAME records. The record must be placed in the authoritative hosted zone for the requested name."],
          ["Wildcard certificates validate names such as ", { code: "*.example.com" }, ", but the validation record may belong in the parent zone, not a delegated app zone."],
          ["CloudFront viewer certificates must be issued in ", { code: "us-east-1" }, ", even when the origin or Route 53 hosted zone is elsewhere."],
          ["Route 53 alias records for CloudFront and ALB use AWS target DNS names and hosted zone IDs, not arbitrary CNAME values."],
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
          "Cloud networking connects resources while controlling reachability. In AWS VPCs, packet flow is shaped by subnets, route tables, gateways, security groups, NACLs, load balancers, and DNS.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Subnet: IP range inside a VPC, usually tied to one availability zone."],
          ["Route table: decides the next hop for packets."],
          ["Internet gateway: VPC path to the public internet."],
          ["NAT gateway: outbound internet path for private subnets."],
          ["Security group: stateful instance or ENI firewall."],
          ["NACL: stateless subnet-level firewall."],
          ["ALB/WAF: HTTP entry point and application-layer filtering."],
        ],
      },
      { type: "heading", text: "Common Checks" },
      {
        type: "unorderedList",
        items: [
          ["Does the source subnet have a route to the destination?"],
          ["Does the destination security group allow the source and port?"],
          ["Do NACL inbound and outbound rules allow ephemeral return traffic?"],
          ["Does public traffic terminate at the intended load balancer?"],
          ["Are private databases isolated from public subnets?"],
        ],
      },
      { type: "heading", text: "Routing and Isolation" },
      {
        type: "unorderedList",
        items: [
          ["The VPC ", { code: "local" }, " route is the built-in route that lets subnets in the same VPC reach each other, subject to security groups and NACLs."],
          ["A private subnet can reach the internet through a NAT gateway route, but should not have a direct default route to an internet gateway."],
          ["Database subnets usually stay private. App-to-database traffic uses the VPC local route for RDS or self-managed databases, not an internet gateway."],
          ["Gateway endpoints are for services such as S3 and DynamoDB. Interface endpoints provide private ENIs for many AWS APIs and SaaS-style endpoint services."],
          ["Security groups are stateful, so return traffic is automatically allowed. NACLs are stateless, so inbound and outbound return ranges must both be allowed."],
        ],
      },
      { type: "heading", text: "Hybrid and Edge" },
      {
        type: "unorderedList",
        items: [
          ["Site-to-site VPN uses customer gateways, virtual private gateways or transit gateways, tunnel routes, and on-prem CIDRs."],
          ["Direct Connect provides private connectivity from a customer network to AWS; Direct Connect Gateway can connect to multiple VPCs through transit gateways or virtual private gateways."],
          ["Transit Gateway centralizes routing between many VPCs and hybrid links, but each attachment and route table must propagate or associate the intended CIDRs."],
          ["AWS WAF attaches to ALB, CloudFront, or API Gateway to filter HTTP requests by managed rules, IP sets, rate limits, and request patterns."],
        ],
      },
    ],
  },
  {
    id: "wiki-pr",
    navTitle: "PR Review",
    title: "Pull Request Review",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Pull request review is a quality and risk control before code merges. Reviewers inspect changed lines, intended behavior, security impact, operational blast radius, and test evidence.",
        ],
      },
      { type: "heading", text: "Review Signals" },
      {
        type: "unorderedList",
        items: [
          ["What changed: source, config, permissions, dependencies, or infrastructure."],
          ["Who is affected: users, services, environments, accounts, or clusters."],
          ["Failure mode: data loss, exposure, outage, cost spike, or privilege escalation."],
          ["Test evidence: unit, integration, plan, scan, or dry-run output."],
        ],
      },
      { type: "heading", text: "Common Risk Patterns" },
      {
        type: "unorderedList",
        items: [
          ["Public cloud storage or broad network ingress."],
          ["Wildcard IAM actions, resources, or principals."],
          ["CI token permissions broader than the workflow needs."],
          ["Removed approval, scan, test, or policy gate."],
          ["Infrastructure replacement hidden inside a large diff."],
        ],
      },
      { type: "heading", text: "Terraform and Workflow Review" },
      {
        type: "unorderedList",
        items: [
          ["For Terraform PRs, review the plan impact, not only the HCL diff. Look for public exposure, replacement, deleted state, and changed IAM scope."],
          ["Security group admin access should be narrowed to trusted CIDRs and justified with owner, expiry, and operational need."],
          ["IAM policy changes should explain why each action, resource, and condition is needed."],
          ["GitHub workflow changes should keep ", { code: "permissions" }, " minimal, especially avoiding ", { code: "write-all" }, " unless the job truly needs broad write scope."],
          ["A useful review comment names the risky line, expected impact, and concrete safer change."],
        ],
      },
    ],
  },
  {
    id: "wiki-security",
    navTitle: "Security",
    title: "Security Guardrails",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Security guardrails constrain what accounts, workloads, and pipelines can do. They reduce blast radius by applying defaults, explicit denies, validation rules, and detective controls.",
        ],
      },
      { type: "heading", text: "Common Guardrails" },
      {
        type: "unorderedList",
        items: [
          ["Deny root user activity except tightly controlled break-glass flows."],
          ["Restrict regions where workloads may run."],
          ["Require IMDSv2 for EC2 metadata access."],
          ["Block public S3 access by default."],
          ["Require encryption, logging, and backup controls for managed services."],
        ],
      },
      { type: "heading", text: "SCP Policy Basics" },
      {
        type: "unorderedList",
        items: [
          [{ code: "Action" }, ": actions affected by the statement."],
          [{ code: "NotAction" }, ": every action except the listed action or actions. In a Deny statement, this denies everything except the excluded actions."],
          [{ code: "Condition" }, ": context requirement such as principal ARN, requested region, or EC2 metadata token mode."],
          ["SCPs set permission boundaries for accounts; they do not grant permissions by themselves."],
          ["An explicit Deny cannot be overridden by an Allow in another SCP, identity policy, or resource policy."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "aws organizations describe-policy\naws iam simulate-principal-policy\naws cloudtrail lookup-events\naws configservice get-resource-config-history" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Explicit deny applies even when another policy allows the action."],
          ["Break-glass exceptions need narrow principals and conditions."],
          ["A guardrail can block deployment tools if service roles are not accounted for."],
          ["Using ", { code: "NotAction" }, " in a Deny statement can block more than intended if the exception list is too small."],
          ["Root-user denies need explicit exceptions for allowed account or billing operations if those flows are required."],
        ],
      },
      { type: "heading", text: "SCP Patterns" },
      {
        type: "unorderedList",
        items: [
          ["Deny leaving the organization with ", { code: "organizations:LeaveOrganization" }, " so member accounts cannot detach from central governance."],
          ["Region restrictions usually use ", { code: "aws:RequestedRegion" }, " and need exceptions for global services or break-glass roles."],
          ["Require IMDSv2 by denying EC2 launch actions when ", { code: "ec2:MetadataHttpTokens" }, " is not ", { code: "required" }, "."],
          ["Root-user guardrails often use ", { code: "aws:PrincipalArn" }, " or principal account context to deny normal root activity while preserving emergency or billing exceptions."],
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
          "Application security focuses on code, dependencies, secrets, containers, and authorization paths. It reduces vulnerabilities before an application reaches production.",
        ],
      },
      { type: "heading", text: "Common Tools" },
      {
        type: "unorderedList",
        items: [
          ["OWASP Dependency-Check: known vulnerable dependencies."],
          ["Semgrep: source-code security patterns."],
          ["Gitleaks: committed secrets."],
          ["Trivy: container image CVEs, OS package findings, language dependency findings, and configuration scanning."],
          ["Unit tests: behavior and regression checks."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "mvn test\nmvn org.owasp:dependency-check-maven:check\nsemgrep scan\ngitleaks detect\ntrivy config .\ntrivy image <image>\ndocker history <image>\nnpm audit --production" },
      { type: "heading", text: "Semgrep Basics" },
      {
        type: "paragraph",
        content: [
          "Semgrep scans source code for patterns that commonly represent security bugs. It is useful in pull requests because it can catch risky code before tests or runtime traffic exercise the path.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["Treat Semgrep findings as a prompt to inspect data flow: where input comes from, how it is validated, and what interpreter or privileged action receives it."],
          [{ code: "eval" }, ", shell execution, SQL string concatenation, and authorization from headers are common beginner findings."],
          ["The best fix usually removes the dangerous pattern instead of adding a broad ignore comment."],
        ],
      },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Authorization depends on user-controlled request data."],
          ["SQL strings are built with concatenated input."],
          ["A vulnerable dependency remains because the transitive path is unclear."],
          ["Secrets are committed in code, config, or CI files."],
          ["Container image findings come from both the base operating system and application dependencies."],
          ["Installing dev dependencies in a runtime image expands the attack surface and can add scanner findings that production code does not need."],
          ["Scanner exceptions should be narrow: one CVE, a reason, an owner, and an expiry date. Broad ignores or disabled gates remove the control."],
        ],
      },
      { type: "heading", text: "Java and Container Review" },
      {
        type: "unorderedList",
        items: [
          ["Spring authorization should come from authenticated principal and server-side roles, not headers clients can forge."],
          ["SQL queries should use parameters or repository methods instead of string concatenation."],
          ["Dependency updates should remove the vulnerable version from the resolved dependency tree, not only edit a direct dependency line."],
          ["Runtime containers should avoid root users, unnecessary package managers, and secrets baked into images."],
        ],
      },
    ],
  },
  {
    id: "wiki-threatmodel",
    navTitle: "Threat Model",
    title: "Threat Modeling",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Threat modeling identifies how a system can be abused before it is built or changed. It connects assets, actors, trust boundaries, data flows, threats, and mitigations.",
        ],
      },
      { type: "heading", text: "STRIDE Categories" },
      {
        type: "unorderedList",
        items: [
          ["Spoofing: pretending to be another identity."],
          ["Tampering: modifying data or code without authorization."],
          ["Repudiation: denying an action because audit evidence is weak."],
          ["Information disclosure: exposing sensitive data."],
          ["Denial of service: reducing availability."],
          ["Elevation of privilege: gaining capabilities beyond authorization."],
        ],
      },
      { type: "heading", text: "Useful Inputs" },
      {
        type: "unorderedList",
        items: [
          ["Data flow diagram with trust boundaries."],
          ["Sensitive assets and regulated data types."],
          ["Authentication and authorization paths."],
          ["External dependencies and public entry points."],
          ["Mitigations that can be verified in code, config, logs, or tests."],
        ],
      },
      { type: "heading", text: "Review Focus" },
      {
        type: "unorderedList",
        items: [
          ["For OIDC deployment, cover repository identity, workflow edit rights, token claims, artifact provenance, cloud role scope, and production approval path."],
          ["For checkout or payment systems, cover unauthenticated users, payment webhooks, customer data stores, support access, and rate limiting."],
          ["Threats should be concrete enough to test. A mitigation like 'use security' is weak; 'verify webhook HMAC before order update' is actionable."],
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
          "Cloud security audit correlates detections, logs, configuration history, and effective permissions. The goal is to understand what happened, what was exposed, and which control failed.",
        ],
      },
      { type: "heading", text: "Common AWS Signals" },
      {
        type: "unorderedList",
        items: [
          ["GuardDuty: threat detections from logs and telemetry."],
          ["CloudTrail: API activity history."],
          ["CloudWatch Logs: application and service logs."],
          ["AWS Config: resource configuration history."],
          ["IAM simulation: effective permission checks."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "aws guardduty list-findings\naws guardduty get-findings\naws cloudtrail lookup-events\naws logs filter-log-events\naws configservice get-resource-config-history\naws iam simulate-principal-policy" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Finding exists but the responsible principal is unclear."],
          ["CloudTrail event name does not map obviously to a console action."],
          ["Resource history shows a risky change after deployment."],
          ["IAM policy simulation allows more than the intended action."],
        ],
      },
      { type: "heading", text: "Investigation Flow" },
      {
        type: "orderedList",
        items: [
          ["Start with the detection: finding type, affected resource, account, region, and time window."],
          ["Use CloudTrail to identify who changed policy, configuration, or data access near the finding time."],
          ["Use CloudWatch Logs or service logs to confirm whether application activity matches the alert."],
          ["Use AWS Config history to compare approved baseline vs current configuration."],
          ["Use IAM simulation to prove whether the risky action is currently allowed after the fix."],
        ],
      },
    ],
  },
  {
    id: "wiki-mlops",
    navTitle: "MLOps",
    title: "MLOps",
    blocks: [
      {
        type: "paragraph",
        content: [
          "MLOps manages machine learning delivery as a repeatable lifecycle. It tracks datasets, training code, artifacts, metrics, model registry state, approvals, and promotion to serving environments.",
        ],
      },
      { type: "heading", text: "Core Concepts" },
      {
        type: "unorderedList",
        items: [
          ["Dataset version: immutable input data snapshot."],
          ["Training run: code, parameters, data, metrics, and produced model."],
          ["Experiment tracking: record of runs, parameters, metrics, artifacts, and code revision."],
          ["Model registry: controlled catalog of model versions and stages."],
          ["Promotion gate: criteria for moving a model toward production."],
          ["Lineage: relationship between data, code, metrics, and deployed model."],
          ["Feature store: shared source for reusable online/offline features, with versioning and freshness checks."],
        ],
      },
      { type: "heading", text: "Typical Lifecycle" },
      {
        type: "unorderedList",
        items: [
          ["Prepare data, validate quality, and publish an immutable dataset artifact."],
          ["Train with pinned code, dependency, parameter, and dataset versions."],
          ["Evaluate metrics against thresholds such as accuracy, precision, recall, latency, and fairness checks."],
          ["Register the candidate model with lineage, model card, owner, risk notes, and approval state."],
          ["Promote through staging or production only after automated checks and required human approvals pass."],
          ["Monitor serving quality, data drift, prediction drift, latency, errors, and business KPIs after release."],
        ],
      },
      { type: "heading", text: "Dataset and Lineage" },
      {
        type: "paragraph",
        content: [
          "Production training should avoid mutable labels such as latest. A run should identify the exact dataset snapshot, feature definitions, training image, source commit, parameters, and evaluation report that produced the model artifact.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["Good: dataset.version: churn-2026-05-17, source_commit: a1b2c3d, training_image: trainer@sha256:..."],
          ["Risky: dataset.version: latest, unpinned package versions, or a model artifact with no data quality report."],
          ["Lineage helps rollback, reproduce incidents, compare candidates, and answer audit questions."],
        ],
      },
      { type: "heading", text: "Model Registry Gates" },
      {
        type: "paragraph",
        content: [
          "A registry is more than storage for model files. It is the control point for model version state, ownership, approvals, metrics, and deployment eligibility.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["Common stages: candidate, staging, shadow, canary, production, archived."],
          ["Promotion metadata should include owner, approver, approval reason, target stage, evaluation report, and rollback plan."],
          ["High-risk models often need security, privacy, legal, or model-risk approval before production."],
        ],
      },
      { type: "heading", text: "Serving and Monitoring" },
      {
        type: "unorderedList",
        items: [
          ["Serving metrics: request rate, latency, error rate, model load failures, and resource saturation."],
          ["ML quality signals: input schema violations, feature freshness, data drift, prediction drift, and degraded labels when delayed ground truth arrives."],
          ["Deployment patterns: blue/green, canary, shadow traffic, batch scoring, and online inference."],
          ["Rollback should identify the previous production model version and compatible feature/data contracts."],
        ],
      },
      { type: "heading", text: "Common Commands" },
      { type: "code", text: "ml pipeline status\nml artifacts list\nml pipeline run\nml model describe\nml model promote" },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Training uses an unapproved or mutable dataset."],
          ["Metrics do not meet the promotion threshold."],
          ["Registry metadata does not identify approval or owner."],
          ["Artifact lineage cannot prove which data produced the model."],
          ["Offline training features do not match online serving features."],
          ["Model is promoted without rollback metadata or post-deploy monitoring."],
          ["Serving endpoint is healthy, but prediction quality has drifted from training data."],
        ],
      },
    ],
  },
  {
    id: "wiki-cloudformation",
    navTitle: "CloudFormation",
    title: "CloudFormation Drift",
    blocks: [
      {
        type: "paragraph",
        content: [
          "CloudFormation templates define desired AWS resources. Drift happens when a live resource is changed outside CloudFormation, so the stack no longer matches the template.",
        ],
      },
      { type: "heading", text: "Useful Commands" },
      { type: "code", text: "aws cloudformation validate-template\naws cloudformation create-change-set\naws cloudformation describe-stack-events\naws cloudformation detect-stack-drift" },
      { type: "heading", text: "Drift Triage Flow" },
      {
        type: "orderedList",
        items: [
          ["Validate the template first so syntax and obvious policy issues are visible."],
          ["Create a change set before applying changes; it shows what CloudFormation would modify."],
          ["Read stack events to understand the last successful or failed update."],
          ["Run drift detection to compare expected template properties with live resource properties."],
          ["Fix the template as the source of truth, then use a change set to reconcile live resources."],
        ],
      },
      { type: "heading", text: "S3 Public Access Checks" },
      {
        type: "unorderedList",
        items: [
          [{ code: "AccessControl: PublicRead" }, " makes an S3 bucket publicly readable and should be replaced with ", { code: "AccessControl: Private" }, "."],
          [{ code: "PublicAccessBlockConfiguration" }, " should block public ACLs and public policies for production artifact buckets."],
          ["A drifted bucket can show safe template intent but unsafe live state, so inspect both template and drift output."],
          ["Direct console edits are operational changes; CloudFormation needs the template updated and the stack reconciled."],
        ],
      },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["The template allows a public ACL."],
          ["The template is missing public access block properties."],
          ["Stack events show a prior update changed security-sensitive properties."],
          ["Drift detection reports live bucket properties that do not match the template."],
          ["A change set is skipped, so the operator cannot review what will change before deployment."],
        ],
      },
    ],
  },
  {
    id: "wiki-operations",
    navTitle: "Operations",
    title: "Operations",
    blocks: [
      {
        type: "paragraph",
        content: [
          "Operations work focuses on system health, observability, capacity, reliability, and cost. Most investigations start by checking whether the service is running, reachable, logging, and meeting expected signals.",
        ],
      },
      { type: "heading", text: "Linux Commands" },
      { type: "code", text: "systemctl status <service>\njournalctl -u <service> -n 50\ndf -h\nfree -m\nps aux\nss -tulpn\ntop -b -n1" },
      { type: "heading", text: "Linux Service Triage" },
      {
        type: "unorderedList",
        items: [
          [{ code: "systemctl status" }, " shows whether the unit is active, failed, restarting, and which command started it."],
          [{ code: "journalctl -u" }, " shows service logs; read the first real error before changing config."],
          [{ code: "ss -tulpn" }, " confirms whether the expected process is listening on the expected port."],
          ["Disk, memory, and process pressure can make a service fail even when its config is correct."],
          ["Environment files and systemd overrides are common places for missing ports, credentials, or paths."],
        ],
      },
      { type: "heading", text: "Observability Commands" },
      { type: "code", text: "aws cloudwatch describe-alarms\naws logs describe-log-groups\naws logs filter-log-events\npromtool targets\notelcol validate\nkafka-consumer-groups --describe\naws ce get-cost-and-usage\naws ec2 describe-volumes\naws ec2 describe-nat-gateways\naws s3api get-bucket-lifecycle-configuration" },
      { type: "heading", text: "Core Signals" },
      {
        type: "unorderedList",
        items: [
          ["Metrics are numeric time series such as request count, latency, CPU, memory, queue depth, or Kafka lag."],
          ["Logs are timestamped events from applications, systems, and infrastructure."],
          ["Traces show one request path across services, including spans, timings, and errors."],
          ["Alerts should fire from user-impacting symptoms or reliable leading indicators, not every noisy internal detail."],
        ],
      },
      { type: "heading", text: "Common Problems" },
      {
        type: "unorderedList",
        items: [
          ["Service is stopped, crash-looping, or listening on the wrong port."],
          ["Disk, memory, or process pressure affects availability."],
          ["Alarm dimensions do not match the metric being emitted."],
          ["Log retention is missing or too long for cost/compliance goals."],
          ["Prometheus target discovery fails when ServiceMonitor selectors do not match Service labels."],
          ["OpenTelemetry exporters fail when protocol and endpoint port do not match."],
          ["Kafka consumer lag grows when consumer throughput or parallelism cannot keep up with partition load."],
          ["Unattached volumes, NAT gateways, or stale resources drive cost drift."],
        ],
      },
      { type: "heading", text: "Prometheus and OTel" },
      {
        type: "paragraph",
        content: [
          "Prometheus is a metrics system. It discovers scrape targets, pulls ",
          { code: "/metrics" },
          " endpoints, stores time series, and evaluates alert rules. In Kubernetes, the Prometheus Operator commonly uses ",
          { code: "ServiceMonitor" },
          " resources to describe which Services should be scraped.",
        ],
      },
      {
        type: "paragraph",
        content: [
          "OpenTelemetry is a vendor-neutral telemetry standard. Apps and collectors use it to send traces, metrics, and logs to backends. The Collector is often deployed as an agent or gateway between workloads and systems such as Tempo, Jaeger, Prometheus, or a cloud observability platform.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["Prometheus scrapes targets discovered from labels, annotations, or ServiceMonitor resources."],
          ["Scrape path, port name, and selector labels must match the workload and Service shape."],
          ["OpenTelemetry Collector receives telemetry, processes it, then exports to backends such as Tempo, Jaeger, or an OTLP gateway."],
          ["OTLP gRPC commonly uses port ", { code: "4317" }, "; OTLP HTTP commonly uses ", { code: "4318" }, "."],
        ],
      },
      { type: "heading", text: "Kafka Lag" },
      {
        type: "paragraph",
        content: [
          "Kafka is an event streaming platform. Producers write records to topics, topics are split into partitions, and consumers read records as part of a consumer group. It is commonly used for async processing, event-driven systems, audit streams, and buffering traffic spikes.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["A topic is a named event stream. A partition is an ordered shard of that stream."],
          ["A consumer group lets multiple workers share topic partitions so processing can run in parallel."],
          ["Consumer lag is the distance between produced offsets and committed consumer offsets."],
          ["A consumer group can process a topic in parallel up to the number of partitions."],
          ["More consumers than partitions do not add throughput for one topic; too few consumers can let lag grow during spikes."],
          ["Lag fixes may involve replicas, processing speed, partition count, batch size, or downstream dependency capacity."],
        ],
      },
      { type: "heading", text: "FinOps Basics" },
      {
        type: "paragraph",
        content: [
          "FinOps connects engineering decisions to cloud spend. Useful fixes remove waste while preserving reliability, recovery, and performance requirements.",
        ],
      },
      {
        type: "unorderedList",
        items: [
          ["Unattached EBS volumes still incur storage cost until deleted or snapshotted and removed."],
          ["S3 lifecycle rules move old data to cheaper storage classes or expire data after retention requirements are met."],
          ["NAT gateways charge hourly and for processed data. Extra NAT gateways in unused AZs can create cost without resiliency benefit."],
          ["Cost Explorer helps identify spend dimension by service, usage type, tag, account, region, or linked account."],
          ["A good cleanup records owner, age, usage evidence, rollback/recovery path, and expected monthly savings."],
        ],
      },
    ],
  },
];

const referenceSectionByKind: Record<NonNullable<Scenario["kind"]>, string> = {
  terraform: "wiki-terraform",
  awsconfig: "wiki-iac-security-baselines",
  terragrunt: "wiki-terragrunt",
  cicd: "wiki-github",
  gitops: "wiki-gitops",
  linux: "wiki-operations",
  kubernetes: "wiki-kubernetes",
  appsec: "wiki-appsec",
  threatmodel: "wiki-threatmodel",
  cloudsec: "wiki-cloudsec",
  cloudformation: "wiki-cloudformation",
  mlops: "wiki-mlops",
  iam: "wiki-iam",
  scp: "wiki-security",
  policy: "wiki-policy",
  secrets: "wiki-secrets",
  dns: "wiki-dns",
  observability: "wiki-operations",
  finops: "wiki-operations",
  pr: "wiki-pr",
  networking: "wiki-networking",
  incident: "wiki-operations",
  dr: "wiki-operations",
  database: "wiki-operations",
  supplychain: "wiki-appsec",
  sre: "wiki-operations",
  messaging: "wiki-operations",
};

export function contextualDocumentationSections(kind: Scenario["kind"]): DocSection[] {
  const sectionIds = new Set([referenceSectionByKind[kind ?? "terraform"]]);
  if (kind === "cicd") sectionIds.add("wiki-azure-devops");
  if (kind === "cicd") sectionIds.add("wiki-jenkins");
  return documentationSections.filter((section) => sectionIds.has(section.id));
}
