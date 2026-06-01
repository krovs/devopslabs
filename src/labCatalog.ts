import type { Scenario } from "./types";

export type MenuGroupId = NonNullable<Scenario["kind"]>;
export type DifficultyTier = "easy" | "normal" | "hard" | "legendary";

export type LabGroupDefinition = {
  id: MenuGroupId;
  title: string;
  providers: string[];
  description: string;
};

export type LabGroup = LabGroupDefinition & {
  ids: string[];
};

export const labGroupDefinitions: LabGroupDefinition[] = [
  { id: "terraform", title: "IaC", providers: ["Generic", "AWS"], description: "State, modules, drift, imports, and plans." },
  { id: "awsconfig", title: "IaC Security Baselines", providers: ["AWS"], description: "Cloud guardrails, encryption, backup, and audit baselines." },
  { id: "cicd", title: "Delivery Pipelines", providers: ["GitHub", "AWS"], description: "Pipeline failures, gates, secrets, and deploy flow." },
  { id: "gitops", title: "GitOps", providers: ["K8S"], description: "Reconciliation drift, sync policy, and source paths." },
  { id: "terragrunt", title: "Stack Orchestration", providers: ["Generic"], description: "Stack wiring, source paths, dependencies, and formatting." },
  { id: "iam", title: "Identity & Access", providers: ["AWS", "Azure"], description: "Least privilege policies, role assignments, trust, and KMS access." },
  { id: "scp", title: "Organization Policy", providers: ["AWS"], description: "Organization guardrails, explicit denies, and exceptions." },
  { id: "policy", title: "Policy as Code", providers: ["K8S"], description: "Admission, workload, and network policies tested as code." },
  { id: "secrets", title: "Secrets Management", providers: ["AWS"], description: "Secret paths, rotation, KMS keys, and resource policies." },
  { id: "dns", title: "DNS & TLS", providers: ["AWS"], description: "Aliases, certificate validation, and edge regions." },
  { id: "observability", title: "Observability", providers: ["AWS"], description: "Alarms, logs, dimensions, and retention." },
  { id: "finops", title: "FinOps", providers: ["AWS"], description: "Cost signals, waste reduction, lifecycle, and NAT spend." },
  { id: "pr", title: "Change Review", providers: ["Generic", "AWS"], description: "Review risky diffs and identify blocking findings." },
  { id: "networking", title: "Network Design", providers: ["AWS"], description: "Routes, subnet design, security controls, and packet paths." },
];

export const menuGroupIds = labGroupDefinitions.map((group) => group.id);

export const labGroupDetails = Object.fromEntries(
  labGroupDefinitions.map(({ id, providers, description }) => [id, { providers, description }]),
) as Record<MenuGroupId, { providers: string[]; description: string }>;

export const scenarioDifficultyTiers: Partial<Record<string, DifficultyTier>> = {
  terraformValidateBadReference: "easy",
  terraformModuleMissingVariable: "easy",
  terraformModuleWrongSource: "normal",
  terraformModuleMissingOutput: "normal",
  terraformCheckovPublicS3: "normal",
  terraformModuleSecurityGroup: "hard",
  manualSecurityGroupDrift: "hard",
  missingIamImport: "hard",
  interruptedApplyLock: "hard",
  terraformStateFolderMigration: "legendary",
  awsConfigCloudWatchRetention: "easy",
  awsConfigS3Baseline: "normal",
  awsConfigBlankS3SecureBucket: "normal",
  awsConfigRdsPublicBackup: "hard",
  awsConfigCloudTrailBaseline: "hard",
  terragruntHclfmt: "easy",
  terragruntMissingInclude: "normal",
  terragruntWrongSourceRef: "hard",
  terragruntBadDependencyOutput: "hard",
  githubActionsMissingSecret: "easy",
  githubActionsWrongWorkingDirectory: "easy",
  githubActionsNodeCachePath: "normal",
  githubActionsDockerRegistryAuth: "normal",
  githubActionsEnvironmentApproval: "normal",
  githubActionsMatrixNodeVersion: "hard",
  githubActionsCheckovGate: "hard",
  githubActionsOverbroadPermissions: "hard",
  githubActionsAwsOidcTrust: "legendary",
  gitopsArgoCdTargetRevisionDrift: "easy",
  gitopsArgoCdPruneSelfHeal: "normal",
  gitopsFluxWrongKustomizationPath: "easy",
  gitopsFluxSuspendedKustomization: "normal",
  iamBlankSecretsReadonly: "easy",
  iamBlankCloudWatchLogsWrite: "normal",
  iamS3PrefixLeastPrivilege: "normal",
  iamDynamoDbLeadingKeys: "hard",
  iamGithubOidcEnvironmentTrust: "hard",
  iamKmsEncryptionContext: "legendary",
  iamAzureBlobReaderScope: "normal",
  scpDenyLeavingOrg: "easy",
  scpBlankDenyRootUser: "normal",
  scpBlankRequireImdsv2: "hard",
  scpRegionRestrictionBreakGlass: "legendary",
  policyKyvernoRequireAppLabel: "easy",
  policyKubernetesDefaultDenyIngress: "easy",
  policyIstioDenyUnauthenticated: "normal",
  policyCiliumAllowDnsEgress: "hard",
  secretsSsmEnvironmentPath: "easy",
  secretsManagerRotationKms: "normal",
  secretsManagerResourcePolicy: "hard",
  dnsRoute53AlbAlias: "easy",
  dnsAcmCloudFrontCertificate: "normal",
  dnsAcmWildcardValidation: "hard",
  observabilityLogRetention: "easy",
  observabilityAlb5xxAlarmDimension: "normal",
  observabilityAlarmAction: "hard",
  finopsS3Lifecycle: "easy",
  finopsNatGatewayCostSpike: "normal",
  finopsUnattachedEbsCleanup: "hard",
  prSecurityGroupAdminCidrReview: "easy",
  prGithubActionsWriteAllReview: "normal",
  prTerraformPublicS3Review: "hard",
  prIamWildcardPolicyReview: "hard",
  networkingSshCidrHardening: "easy",
  networkingSecurityGroupAlbApp: "normal",
  networkingVpcPublicPrivateSubnets: "normal",
  networkingVpcNatEgress: "hard",
  networkingVpcDbIsolation: "hard",
  networkingNaclEphemeralReturn: "hard",
  networkingSiteToSiteVpn: "hard",
  networkingWafAlbProtection: "hard",
  networkingDirectConnectMultiVpc: "legendary",
};

const scenarioKindLabels: Record<MenuGroupId, string> = Object.fromEntries(
  labGroupDefinitions.map((group) => [group.id, group.title]),
) as Record<MenuGroupId, string>;

const incidentDescriptions: Record<MenuGroupId, string> = {
  terraform: "An infrastructure deployment is unhealthy. Reproduce the failure, inspect state and configuration, then apply the smallest safe repair.",
  awsconfig: "A Terraform change contains AWS service misconfigurations. Scan the code, add the missing guardrails, and verify with Checkov.",
  cicd: "A delivery pipeline is failing. Inspect the run output, repository settings, and workflow files to identify the smallest safe fix.",
  gitops: "A GitOps controller is out of sync. Inspect the watched Git target, source path, sync policy, and reconciliation state.",
  terragrunt: "A stack operation is blocked. Reproduce the failure and inspect stack wiring, formatting, source paths, and dependency outputs.",
  networking: "A network path does not meet the operational requirement. Use the diagram, symptoms, and packet traces to isolate the broken component.",
  iam: "An access path is either failing or too broad. Simulate the principal, inspect policy conditions, and constrain the permission boundary.",
  scp: "An organization guardrail is blocking or allowing the wrong action. Inspect the SCP, Deny precedence, conditions, and exceptions.",
  policy: "A platform policy is not enforcing the intended workload guardrail. Inspect the policy, run the policy test, and apply the smallest rule fix.",
  secrets: "A service is using secret material unsafely or from the wrong environment. Inspect secret configuration, paths, KMS, and rotation.",
  dns: "A hostname or certificate is unhealthy. Inspect DNS records, alias targets, validation records, and certificate region.",
  observability: "Monitoring is missing or misleading. Inspect alarms, logs, dimensions, retention, and the smallest telemetry fix.",
  finops: "Cloud spend has drifted. Inspect the cost signal, identify the waste source, and apply the smallest cost control.",
  pr: "A pull request needs review. Inspect the diff, identify the risky lines, and submit the correct review decision.",
};

const commandOptionsByKind: Record<MenuGroupId, string[]> = {
  terraform: [
    "terraform init",
    "terraform plan",
    "terraform apply",
    "terraform validate",
    "terraform state list",
    "terraform state mv aws_s3_bucket.logs module.logging.aws_s3_bucket.logs",
    "terraform import aws_s3_bucket.logs prod-logs-training",
    "terraform import aws_iam_role.app training-app-role",
    "checkov -f main.tf",
    "aws dynamodb scan --table-name tf-locks",
    "aws s3 ls",
    "check",
    "help",
  ],
  awsconfig: ["terraform init", "checkov -f main.tf", "terraform plan", "check", "help"],
  cicd: ["gh run view", "gh run rerun", "gh secret list", "gh secret set AWS_ROLE_ARN", "check", "help"],
  gitops: ["argocd app get checkout", "flux reconcile kustomization platform --with-source", "check", "help"],
  terragrunt: ["terragrunt init", "terragrunt validate", "terragrunt plan", "terragrunt run-all plan", "terragrunt hclfmt", "check", "help"],
  iam: ["aws iam simulate-principal-policy", "aws sts assume-role-with-web-identity", "aws s3 cp", "aws kms decrypt", "az role assignment list", "check", "help"],
  scp: ["aws organizations describe-policy", "aws iam simulate-principal-policy", "check", "help"],
  policy: ["kyverno test .", "kubectl apply --dry-run=server -f policy.yaml", "check", "help"],
  secrets: ["aws secretsmanager describe-secret", "aws ssm get-parameter", "check", "help"],
  dns: ["aws acm describe-certificate", "dig app.example.com", "check", "help"],
  observability: ["aws cloudwatch describe-alarms", "aws logs describe-log-groups", "check", "help"],
  finops: ["aws ce get-cost-and-usage", "aws ec2 describe-volumes", "check", "help"],
  pr: ["check", "help"],
  networking: ["check", "help"],
};

const simpleHealthLabels: Partial<Record<MenuGroupId, { solved: string; unsolved: string }>> = {
  awsconfig: { solved: "AWS config: passed", unsolved: "AWS config: failing" },
  cicd: { solved: "Workflow: passing", unsolved: "Workflow: failing" },
  gitops: { solved: "GitOps: synced", unsolved: "GitOps: drift" },
  iam: { solved: "IAM: validated", unsolved: "IAM: needs review" },
  scp: { solved: "SCP: validated", unsolved: "SCP: needs review" },
  policy: { solved: "Policy: passing", unsolved: "Policy: failing" },
  secrets: { solved: "Secrets: healthy", unsolved: "Secrets: failing" },
  dns: { solved: "DNS/TLS: healthy", unsolved: "DNS/TLS: failing" },
  observability: { solved: "Observability: healthy", unsolved: "Observability: failing" },
  finops: { solved: "Cost: optimized", unsolved: "Cost: review" },
  pr: { solved: "Review: accepted", unsolved: "Review: pending" },
};

export function scenarioMenuGroupId(kind?: Scenario["kind"]): MenuGroupId {
  return kind && menuGroupIds.includes(kind) ? kind : "terraform";
}

export function buildLabGroups(scenarios: Record<string, Scenario>): LabGroup[] {
  const scenarioIds = Object.keys(scenarios);
  return labGroupDefinitions.map((group) => ({
    ...group,
    ids: scenarioIds.filter((id) => scenarioMenuGroupId(scenarios[id].kind) === group.id),
  }));
}

export function scenarioKindLabel(scenario: Scenario): string {
  return scenarioKindLabels[scenarioMenuGroupId(scenario.kind)];
}

export function incidentDescription(scenario: Scenario): string {
  return incidentDescriptions[scenarioMenuGroupId(scenario.kind)];
}

export function scenarioDifficultyClass(id: string): string {
  return `difficulty-${scenarioDifficultyTiers[id] ?? "easy"}`;
}

export function terminalCommandOptions(scenario: Scenario): string[] {
  const groupId = scenarioMenuGroupId(scenario.kind);
  const commands = commandOptionsByKind[groupId];
  if (groupId !== "terraform") return commands;
  const unlockCommand = scenario.backend.lockId ? `terraform force-unlock ${scenario.backend.lockId}` : "terraform force-unlock";
  return [...commands.slice(0, 8), unlockCommand, ...commands.slice(8)];
}

export function labHealthClass(solved: boolean, scenario: Scenario): string {
  const groupId = scenarioMenuGroupId(scenario.kind);
  if (simpleHealthLabels[groupId]) return solved ? "badge badge-ok" : "badge badge-danger";
  return scenario.backend.locked ? "badge badge-danger" : "badge badge-ok";
}

export function labHealthLabel(solved: boolean, scenario: Scenario): string {
  const groupId = scenarioMenuGroupId(scenario.kind);
  const simpleLabel = simpleHealthLabels[groupId];
  if (simpleLabel) return solved ? simpleLabel.solved : simpleLabel.unsolved;
  if (groupId === "terragrunt") return solved ? "Terragrunt: healthy" : `Remote state: ${scenario.backend.key}`;
  return scenario.backend.locked ? `Backend: locked (${scenario.backend.lockId})` : `Backend: unlocked (${scenario.backend.key})`;
}
