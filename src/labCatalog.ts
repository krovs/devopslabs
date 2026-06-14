import type { Scenario } from "./types";

export type MenuGroupId = NonNullable<Scenario["kind"]>;
export type ScenarioCatalogItem = Pick<Scenario, "id" | "kind" | "title" | "description">;
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
  { id: "terraform", title: "IaC", providers: ["Generic", "AWS"], description: "Terraform state, modules, drift, imports, plans, and CloudFormation templates." },
  { id: "awsconfig", title: "IaC Security Baselines", providers: ["AWS"], description: "Cloud guardrails, encryption, backup, and audit baselines." },
  { id: "cicd", title: "Delivery Pipelines", providers: ["GitHub", "AWS"], description: "Pipeline failures, gates, secrets, and deploy flow." },
  { id: "gitops", title: "GitOps", providers: ["K8S"], description: "Reconciliation drift, sync policy, and source paths." },
  { id: "linux", title: "Linux Basics", providers: ["Generic"], description: "Files, logs, services, memory, disk, processes, and sockets." },
  { id: "kubernetes", title: "Kubernetes Basics", providers: ["K8S"], description: "Pods, events, logs, rollout state, scaling, and repair." },
  { id: "appsec", title: "Application Security", providers: ["Java"], description: "Dependencies, secrets, containers, authorization, and injection risk." },
  { id: "threatmodel", title: "Threat Modeling", providers: ["Generic"], description: "Data flows, trust boundaries, STRIDE risks, and mitigations." },
  { id: "cloudsec", title: "Cloud Security Audit", providers: ["AWS"], description: "GuardDuty, CloudTrail, Config, logs, and effective permissions." },
  { id: "mlops", title: "MLOps", providers: ["Generic", "AWS"], description: "Training pipelines, model registry gates, artifacts, metrics, and promotion." },
  { id: "terragrunt", title: "Stack Orchestration", providers: ["Generic"], description: "Stack wiring, source paths, dependencies, and formatting." },
  { id: "iam", title: "Identity & Access", providers: ["AWS", "Azure"], description: "Least privilege policies, role assignments, trust, and KMS access." },
  { id: "scp", title: "Organization Policy", providers: ["AWS"], description: "Organization guardrails, explicit denies, and exceptions." },
  { id: "policy", title: "Policy as Code", providers: ["K8S"], description: "Admission, workload, and network policies tested as code." },
  { id: "secrets", title: "Secrets Management", providers: ["AWS", "HashiCorp"], description: "Secret paths, rotation, KMS keys, and resource policies." },
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
  kubernetesImagePullBackOffTriage: "easy",
  kubernetesReadinessProbePort: "normal",
  kubernetesHelmValuesPort: "normal",
  kubernetesMemoryLimitOom: "normal",
  kubernetesHpaScalingPolicy: "hard",
  kubernetesPdbNodeDrain: "hard",
  kubernetesEksRbacIrsa: "hard",
  semgrepBasicCommandInjection: "easy",
  javaDependencySecretsContainerAudit: "normal",
  containerImageCveGate: "hard",
  javaCodeAuthSqlAudit: "hard",
  strideCheckoutThreatModel: "normal",
  oidcDeploymentThreatModel: "hard",
  awsGuardDutyCloudTrailIamAudit: "hard",
  awsCloudTrailLogIntegrityAudit: "hard",
  cloudFormationDriftDetection: "normal",
  mlopsTrainingDatasetVersion: "normal",
  mlopsModelRegistryPromotionGate: "hard",
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
  secretsVaultKvPolicyPath: "normal",
  dnsRoute53AlbAlias: "easy",
  dnsAcmCloudFrontCertificate: "normal",
  dnsAcmWildcardValidation: "hard",
  observabilityLogRetention: "easy",
  observabilityAlb5xxAlarmDimension: "normal",
  observabilityAlarmAction: "hard",
  observabilityPrometheusScrapeTarget: "normal",
  observabilityOtelExporterEndpoint: "normal",
  observabilityKafkaConsumerLag: "hard",
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
  linux: "A Linux system is unhealthy. Inspect files, logs, service status, memory, disk, processes, and sockets before applying the fix.",
  kubernetes: "A Kubernetes workload is unhealthy. Inspect pods, events, logs, rollout state, scale controls, and deployment configuration before rolling out a fix.",
  appsec: "A Java application has security audit findings. Inspect dependency, secret, container, and source-code signals before applying the smallest safe fix.",
  threatmodel: "A system design has incomplete threat coverage. Inspect data flows, trust boundaries, assets, and mitigations before approving the model.",
  cloudsec: "A cloud security signal needs investigation. Correlate GuardDuty, CloudTrail, logs, AWS Config, and IAM simulation before changing permissions.",
  cloudformation: "A CloudFormation stack has a configuration issue. Validate the template, inspect change sets and stack events, detect drift, and fix the template.",
  mlops: "An ML delivery workflow is blocked. Inspect pipeline status, artifacts, registry metadata, metrics, and promotion gates before approving the model path.",
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

const commandOptionsByKind: Record<NonNullable<Scenario["kind"]>, string[]> = {
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
  cicd: ["gh run view", "gh run rerun", "gh secret list", "gh secret set AWS_ROLE_ARN", "jenkins build log", "jenkins rebuild", "check", "help"],
  gitops: ["argocd app get checkout", "flux reconcile kustomization platform --with-source", "check", "help"],
  linux: ["ls -la", "cat app.log", "grep ERROR app.log", "journalctl -u web -n 20", "systemctl status web", "df -h", "free -m", "ps aux", "top -b -n1", "ss -tulpn", "sudo systemctl restart web", "check", "help"],
  kubernetes: ["kubectl get pods", "kubectl get events", "kubectl describe deployment checkout-api", "kubectl describe pod checkout-api", "kubectl logs checkout-api", "kubectl get hpa checkout-api", "kubectl describe hpa checkout-api", "kubectl get pdb checkout-api", "kubectl apply -f hpa.yaml", "kubectl apply -f pdb.yaml", "kubectl drain ip-10-0-4-21 --ignore-daemonsets --delete-emptydir-data", "kubectl auth can-i get configmaps --as system:serviceaccount:payments:checkout-api -n payments", "aws iam list-roles", "aws iam get-role --role-name eks-checkout-api-payments", "aws sts assume-role-with-web-identity", "kubectl rollout restart deployment checkout-api", "kubectl rollout status deployment checkout-api", "kubectl scale deployment checkout-api --replicas=2", "helm lint checkout ./chart", "helm template checkout ./chart", "helm upgrade checkout ./chart", "check", "help"],
  appsec: ["mvn test", "mvn org.owasp:dependency-check-maven:check", "semgrep scan", "gitleaks detect", "trivy config .", "gh run view", "trivy image checkout-api:pr-184", "docker history checkout-api:pr-184", "npm audit --production", "check", "help"],
  threatmodel: ["threatmodel review", "check", "help"],
  cloudsec: ["aws guardduty list-findings", "aws guardduty get-findings", "aws cloudtrail lookup-events", "aws logs filter-log-events", "aws configservice get-resource-config-history", "aws iam simulate-principal-policy", "check", "help"],
  cloudformation: ["aws cloudformation validate-template", "aws cloudformation create-change-set", "aws cloudformation describe-stack-events", "aws cloudformation detect-stack-drift", "check", "help"],
  mlops: ["ml pipeline status", "ml artifacts list", "ml pipeline run", "ml model describe", "ml model promote", "check", "help"],
  terragrunt: ["terragrunt init", "terragrunt validate", "terragrunt plan", "terragrunt run-all plan", "terragrunt hclfmt", "check", "help"],
  iam: ["aws iam simulate-principal-policy", "aws sts assume-role-with-web-identity", "aws s3 cp", "aws kms decrypt", "az role assignment list", "check", "help"],
  scp: ["aws organizations describe-policy", "aws iam simulate-principal-policy", "check", "help"],
  policy: ["kyverno test .", "kubectl apply --dry-run=server -f policy.yaml", "check", "help"],
  secrets: ["aws secretsmanager describe-secret", "aws ssm get-parameter", "vault policy read checkout-api", "vault token capabilities secret/data/staging/checkout/db", "vault kv get secret/staging/checkout/db", "check", "help"],
  dns: ["aws acm describe-certificate", "dig app.example.com", "check", "help"],
  observability: ["aws cloudwatch describe-alarms", "aws logs describe-log-groups", "promtool targets", "otelcol validate", "kafka-consumer-groups --describe", "check", "help"],
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
  linux: { solved: "Linux: healthy", unsolved: "Linux: failing" },
  kubernetes: { solved: "K8S: healthy", unsolved: "K8S: failing" },
  appsec: { solved: "AppSec: passed", unsolved: "AppSec: findings" },
  threatmodel: { solved: "Threat model: covered", unsolved: "Threat model: gaps" },
  cloudsec: { solved: "Audit: resolved", unsolved: "Audit: active" },
  cloudformation: { solved: "CFN: validated", unsolved: "CFN: failing" },
  mlops: { solved: "MLOps: validated", unsolved: "MLOps: blocked" },
  secrets: { solved: "Secrets: healthy", unsolved: "Secrets: failing" },
  dns: { solved: "DNS/TLS: healthy", unsolved: "DNS/TLS: failing" },
  observability: { solved: "Observability: healthy", unsolved: "Observability: failing" },
  finops: { solved: "Cost: optimized", unsolved: "Cost: review" },
  pr: { solved: "Review: accepted", unsolved: "Review: pending" },
};

export function scenarioMenuGroupId(kind?: Scenario["kind"]): MenuGroupId {
  if (kind === "cloudformation") return "terraform";
  return kind && menuGroupIds.includes(kind) ? kind : "terraform";
}

export function buildLabGroups(scenarios: Record<string, ScenarioCatalogItem>): LabGroup[] {
  const scenarioIds = Object.keys(scenarios);
  return labGroupDefinitions.map((group) => ({
    ...group,
    ids: scenarioIds.filter((id) => scenarioMenuGroupId(scenarios[id].kind) === group.id),
  }));
}

export function scenarioKindLabel(scenario: ScenarioCatalogItem): string {
  return scenarioKindLabels[scenarioMenuGroupId(scenario.kind)];
}

export function incidentDescription(scenario: ScenarioCatalogItem): string {
  return incidentDescriptions[scenarioMenuGroupId(scenario.kind)];
}

export function scenarioDifficultyClass(id: string): string {
  return `difficulty-${scenarioDifficultyTiers[id] ?? "easy"}`;
}

export function terminalCommandOptions(scenario: Scenario): string[] {
  const kind = scenario.kind ?? "terraform";
  const commands = commandOptionsByKind[kind] ?? commandOptionsByKind.terraform;
  if (kind !== "terraform") return commands;
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
