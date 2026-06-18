import type { Scenario } from "./types";

export type ScenarioSummary = Pick<Scenario, "id" | "kind" | "title" | "description"> & {
  path: string;
};

export const scenarioManifest = [
  {
    "id": "terraformValidateBadReference",
    "kind": "terraform",
    "title": "Terraform Validate Bad Reference",
    "description": "Validation fails because an output references a resource name that does not exist.",
    "path": "../scenarios/iac/terraform-validate-bad-reference.yaml"
  },
  {
    "id": "terraformModuleMissingVariable",
    "kind": "terraform",
    "title": "Terraform Module Missing Required Variable",
    "description": "A child module requires environment, but the root module does not pass it.",
    "path": "../scenarios/iac/terraform-module-missing-variable.yaml"
  },
  {
    "id": "terraformModuleWrongSource",
    "kind": "terraform",
    "title": "Terraform Module Wrong Source Path",
    "description": "Terraform init fails because the root module points at a module directory that does not exist.",
    "path": "../scenarios/iac/terraform-module-wrong-source.yaml"
  },
  {
    "id": "terraformModuleMissingOutput",
    "kind": "terraform",
    "title": "Terraform Module Missing Output",
    "description": "A root module consumes an output that the child module does not expose.",
    "path": "../scenarios/iac/terraform-module-missing-output.yaml"
  },
  {
    "id": "terraformCheckovPublicS3",
    "kind": "terraform",
    "title": "Terraform Checkov Public S3 Finding",
    "description": "A security scan blocks the plan because an S3 bucket allows public ACLs.",
    "path": "../scenarios/iac/terraform-checkov-public-s3.yaml"
  },
  {
    "id": "terraformModuleSecurityGroup",
    "kind": "terraform",
    "title": "Terraform Module Security Group Checkov",
    "description": "A reusable security group module defaults ingress to 0.0.0.0/0 and fails a security scan.",
    "path": "../scenarios/iac/terraform-module-security-group.yaml"
  },
  {
    "id": "manualSecurityGroupDrift",
    "kind": "terraform",
    "title": "Terraform Manual Security Group Drift",
    "description": "Someone changed a security group rule outside Terraform. Bring code and reality back into agreement.",
    "path": "../scenarios/iac/manual-security-group-drift.yaml"
  },
  {
    "id": "missingIamImport",
    "kind": "terraform",
    "title": "Terraform Existing IAM Role Missing From State",
    "description": "Terraform wants to create an IAM role that already exists in AWS, but the state file does not know about it.",
    "path": "../scenarios/iac/missing-iam-import.yaml"
  },
  {
    "id": "interruptedApplyLock",
    "kind": "terraform",
    "title": "Terraform Interrupted Apply With Lock",
    "description": "An apply died mid-run. The S3 bucket exists, state missed it, and the DynamoDB lock is still present.",
    "path": "../scenarios/iac/interrupted-apply-lock.yaml"
  },
  {
    "id": "terraformStateFolderMigration",
    "kind": "terraform",
    "title": "Terraform Folder Migration State Move",
    "description": "Code was migrated into a logging module, but state still tracks the bucket at the old root address.",
    "path": "../scenarios/iac/terraform-state-folder-migration.yaml"
  },
  {
    "id": "terraformBlankEc2WebServer",
    "kind": "terraform",
    "title": "Terraform From Scratch: EC2 Web Server",
    "description": "Build a complete EC2 web server Terraform configuration from an empty file, including provider, security group, and instance resources.",
    "path": "../scenarios/iac/terraform-blank-ec2-web-server.yaml"
  },
  {
    "id": "terraformBlankAzureWebApp",
    "kind": "terraform",
    "title": "Terraform From Scratch: Azure Web App",
    "description": "Build a complete Azure Linux Web App Terraform configuration from an empty file, including provider, resource group, service plan, and secure web app.",
    "path": "../scenarios/iac/terraform-blank-azure-web-app.yaml"
  },
  {
    "id": "terraformAzureBlobLeaseLock",
    "kind": "terraform",
    "title": "Terraform Azure Blob Lease Lock",
    "description": "A Terraform apply crashed while using an Azure Blob Storage backend. The state blob lease is still locked and an Azure resource group exists outside state.",
    "path": "../scenarios/iac/terraform-azure-blob-lease-lock.yaml"
  },
  {
    "id": "terraformAzureNsgDrift",
    "kind": "terraform",
    "title": "Terraform Azure NSG Drift",
    "description": "An Azure Network Security Group rule was changed in the portal. Terraform must detect the drift and bring code back in line with the accepted live state.",
    "path": "../scenarios/iac/terraform-azure-nsg-drift.yaml"
  },
  {
    "id": "awsConfigCloudWatchRetention",
    "kind": "awsconfig",
    "title": "IaC Security Baselines CloudWatch Retention",
    "description": "Find the missing log retention setting that will keep production logs forever.",
    "path": "../scenarios/iac-security/aws-config-cloudwatch-retention.yaml"
  },
  {
    "id": "awsConfigS3Baseline",
    "kind": "awsconfig",
    "title": "IaC Security Baselines S3 Baseline",
    "description": "Spot missing S3 guardrails before deploying a production document bucket.",
    "path": "../scenarios/iac-security/aws-config-s3-baseline.yaml"
  },
  {
    "id": "awsConfigBlankS3SecureBucket",
    "kind": "awsconfig",
    "title": "IaC Security Baselines Blank S3 Secure Bucket",
    "description": "Build a secure S3 bucket Terraform configuration from an empty file.",
    "path": "../scenarios/iac-security/aws-config-blank-s3-secure-bucket.yaml"
  },
  {
    "id": "awsConfigRdsPublicBackup",
    "kind": "awsconfig",
    "title": "IaC Security Baselines RDS Public Backup",
    "description": "Review an RDS Terraform resource that is public and has weak recovery settings.",
    "path": "../scenarios/iac-security/aws-config-rds-public-backup.yaml"
  },
  {
    "id": "awsConfigCloudTrailBaseline",
    "kind": "awsconfig",
    "title": "IaC Security Baselines CloudTrail Baseline",
    "description": "A governance trail exists but does not cover every region or log file validation.",
    "path": "../scenarios/iac-security/aws-config-cloudtrail-baseline.yaml"
  },
  {
    "id": "terragruntHclfmt",
    "kind": "terragrunt",
    "title": "Terragrunt HCL Formatting Gate",
    "description": "A pull request gate fails because terragrunt hclfmt detects unformatted Terragrunt configuration.",
    "path": "../scenarios/stack-orchestration/terragrunt-hclfmt.yaml"
  },
  {
    "id": "terragruntMissingInclude",
    "kind": "terragrunt",
    "title": "Terragrunt Missing Root Include",
    "description": "A live app stack does not inherit the root remote state and shared inputs because include is missing.",
    "path": "../scenarios/stack-orchestration/terragrunt-missing-include.yaml"
  },
  {
    "id": "terragruntWrongSourceRef",
    "kind": "terragrunt",
    "title": "Terragrunt Wrong Module Source",
    "description": "Terragrunt init fails because the live stack points at the wrong module path.",
    "path": "../scenarios/stack-orchestration/terragrunt-wrong-source-ref.yaml"
  },
  {
    "id": "terragruntBadDependencyOutput",
    "kind": "terragrunt",
    "title": "Terragrunt Bad Dependency Output",
    "description": "An app stack depends on network.outputs.vpc_id, but the dependency mock exposes the wrong output name.",
    "path": "../scenarios/stack-orchestration/terragrunt-bad-dependency-output.yaml"
  },
  {
    "id": "githubActionsMissingSecret",
    "kind": "cicd",
    "title": "GitHub Actions Missing AWS Secret",
    "description": "A deploy workflow fails because the AWS role secret required by OIDC is not configured in the repository.",
    "path": "../scenarios/delivery-pipelines/github-actions-missing-secret.yaml"
  },
  {
    "id": "githubActionsWrongWorkingDirectory",
    "kind": "cicd",
    "title": "GitHub Actions Wrong Working Directory",
    "description": "A Terraform validation workflow fails because it runs from the wrong folder.",
    "path": "../scenarios/delivery-pipelines/github-actions-wrong-working-directory.yaml"
  },
  {
    "id": "githubActionsNodeCachePath",
    "kind": "cicd",
    "title": "GitHub Actions Node Cache Path",
    "description": "A Node.js CI workflow fails before tests because npm ci cannot find the lockfile in the configured working directory.",
    "path": "../scenarios/delivery-pipelines/github-actions-node-cache-path.yaml"
  },
  {
    "id": "githubActionsDockerRegistryAuth",
    "kind": "cicd",
    "title": "GitHub Actions Docker Registry Auth",
    "description": "A Docker publish workflow fails because docker push runs before logging in to the registry.",
    "path": "../scenarios/delivery-pipelines/github-actions-docker-registry-auth.yaml"
  },
  {
    "id": "githubActionsEnvironmentApproval",
    "kind": "cicd",
    "title": "GitHub Actions Environment Approval",
    "description": "A production deploy workflow cannot reach the protected approval gate because the job targets an environment named prod, while the repository only protects production.",
    "path": "../scenarios/delivery-pipelines/github-actions-environment-approval.yaml"
  },
  {
    "id": "githubActionsMatrixNodeVersion",
    "kind": "cicd",
    "title": "GitHub Actions Matrix Node Version",
    "description": "A test matrix fails because one job still runs on an unsupported Node.js version.",
    "path": "../scenarios/delivery-pipelines/github-actions-matrix-node-version.yaml"
  },
  {
    "id": "githubActionsCheckovGate",
    "kind": "cicd",
    "title": "GitHub Actions Checkov Gate",
    "description": "A pull request workflow fails because the Checkov IaC security scan detects a public S3 bucket.",
    "path": "../scenarios/delivery-pipelines/github-actions-checkov-gate.yaml"
  },
  {
    "id": "githubActionsOverbroadPermissions",
    "kind": "cicd",
    "title": "GitHub Actions Overbroad Permissions",
    "description": "actionlint blocks a deploy workflow because it grants write-all permissions at workflow scope.",
    "path": "../scenarios/delivery-pipelines/github-actions-overbroad-permissions.yaml"
  },
  {
    "id": "githubActionsAwsOidcTrust",
    "kind": "cicd",
    "title": "GitHub Actions AWS OIDC Trust Policy",
    "description": "A deploy workflow has id-token permission, but AWS rejects AssumeRoleWithWebIdentity because the role trust policy allows the wrong branch.",
    "path": "../scenarios/delivery-pipelines/github-actions-aws-oidc-trust.yaml"
  },
  {
    "id": "jenkinsMissingCredentialsBinding",
    "kind": "cicd",
    "title": "Jenkins Missing Credentials Binding",
    "description": "A Jenkins image publish stage fails because docker login runs without binding the registry credentials.",
    "path": "../scenarios/delivery-pipelines/jenkins-missing-credentials-binding.yaml"
  },
  {
    "id": "azureDevOpsPipelineWrongVariableGroup",
    "kind": "cicd",
    "title": "Azure DevOps Pipeline Wrong Variable Group",
    "description": "An Azure DevOps YAML pipeline fails to deploy because it references a variable group named prod-secrets while the actual group is named production-secrets.",
    "path": "../scenarios/delivery-pipelines/azure-devops-pipeline-wrong-variable-group.yaml"
  },
  {
    "id": "ansiblePlaybookWrongHostGroup",
    "kind": "cicd",
    "title": "Ansible Playbook Wrong Host Group",
    "description": "An Ansible playbook fails because it targets a host group named app-servers, but the inventory only defines a group named web-servers.",
    "path": "../scenarios/delivery-pipelines/ansible-playbook-wrong-host-group.yaml"
  },
  {
    "id": "gitopsArgoCdTargetRevisionDrift",
    "kind": "gitops",
    "title": "Argo CD Target Revision Drift",
    "description": "An Argo CD application keeps syncing staging manifests because the Application points at the wrong Git revision.",
    "path": "../scenarios/gitops/gitops-argocd-target-revision-drift.yaml"
  },
  {
    "id": "gitopsArgoCdPruneSelfHeal",
    "kind": "gitops",
    "title": "Argo CD Prune And Self Heal",
    "description": "A production Application reports drift because automated sync does not prune deleted resources or repair manual changes.",
    "path": "../scenarios/gitops/gitops-argocd-prune-self-heal.yaml"
  },
  {
    "id": "gitopsFluxWrongKustomizationPath",
    "kind": "gitops",
    "title": "Flux Wrong Kustomization Path",
    "description": "Flux reconciles successfully but deploys the staging overlay because the Kustomization path points at the wrong environment.",
    "path": "../scenarios/gitops/gitops-flux-wrong-kustomization-path.yaml"
  },
  {
    "id": "gitopsFluxSuspendedKustomization",
    "kind": "gitops",
    "title": "Flux Suspended Kustomization",
    "description": "Flux is not applying a production fix because the Kustomization is suspended and pruning is disabled.",
    "path": "../scenarios/gitops/gitops-flux-suspended-kustomization.yaml"
  },
  {
    "id": "linuxServiceLogTriage",
    "kind": "linux",
    "title": "Linux Sysadmin Service Triage",
    "description": "A Linux web service is failed; troubleshoot logs, service status, memory, disk, processes, and sockets before restoring the missing PORT value.",
    "path": "../scenarios/linux-basics/linux-service-log-triage.yaml"
  },
  {
    "id": "linuxDiskInodeFull",
    "kind": "linux",
    "title": "Linux Disk Full Inode Exhaustion",
    "description": "df shows free space but writes fail. df -i shows 100% inode usage. Find the small-file culprit directory and clean it up.",
    "path": "../scenarios/linux-basics/linux-disk-inode-full.yaml"
  },
  {
    "id": "linuxSystemdUnitFailed",
    "kind": "linux",
    "title": "Linux Systemd Unit Failed Start",
    "description": "A systemd service fails at boot because the unit file has the wrong ExecStart path, runs as root, and has no Restart policy.",
    "path": "../scenarios/linux-basics/linux-systemd-unit-failed.yaml"
  },
  {
    "id": "kubernetesImagePullBackOffTriage",
    "kind": "kubernetes",
    "title": "Kubernetes Rollout And Events Triage",
    "description": "A Kubernetes pod is stuck in ImagePullBackOff; inspect pods, events, logs, rollout state, and scaling before repairing the image tag.",
    "path": "../scenarios/kubernetes-basics/kubernetes-imagepullbackoff-triage.yaml"
  },
  {
    "id": "kubernetesReadinessProbePort",
    "kind": "kubernetes",
    "title": "Kubernetes Readiness Probe Port Triage",
    "description": "A Kubernetes deployment is running but never becomes ready; inspect pods, events, logs, rollout state, and scaling before repairing the readiness probe port.",
    "path": "../scenarios/kubernetes-basics/kubernetes-readiness-probe-port.yaml"
  },
  {
    "id": "kubernetesHelmValuesPort",
    "kind": "kubernetes",
    "title": "Kubernetes Helm Values Port Triage",
    "description": "A Helm-managed checkout-api release is unhealthy because chart values render the container on the wrong port; inspect Helm output and Kubernetes state before upgrading the release.",
    "path": "../scenarios/kubernetes-basics/kubernetes-helm-values-port.yaml"
  },
  {
    "id": "kubernetesMemoryLimitOom",
    "kind": "kubernetes",
    "title": "Kubernetes Memory Limit OOM Triage",
    "description": "A checkout-api pod keeps restarting after OOMKilled; inspect pod state, events, logs, and resource limits before raising the memory limit.",
    "path": "../scenarios/kubernetes-basics/kubernetes-memory-limit-oom.yaml"
  },
  {
    "id": "kubernetesHpaScalingPolicy",
    "kind": "kubernetes",
    "title": "Kubernetes HPA Scaling Policy",
    "description": "checkout-api cannot handle increased traffic because the HorizontalPodAutoscaler is capped too low and reacts too late; inspect HPA state before fixing scaling policy.",
    "path": "../scenarios/kubernetes-basics/kubernetes-hpa-scaling-policy.yaml"
  },
  {
    "id": "kubernetesPdbNodeDrain",
    "kind": "kubernetes",
    "title": "Kubernetes PodDisruptionBudget Node Drain",
    "description": "A planned node drain can evict every checkout-api replica because the PodDisruptionBudget allows too much voluntary disruption; inspect the PDB before tightening it.",
    "path": "../scenarios/kubernetes-basics/kubernetes-pdb-node-drain.yaml"
  },
  {
    "id": "kubernetesEksRbacIrsa",
    "kind": "kubernetes",
    "title": "Kubernetes EKS RBAC And IRSA Triage",
    "description": "An EKS workload uses the wrong service account IAM role and is not bound to the namespace Role; fix the ServiceAccount annotation and RBAC subject before rolling out.",
    "path": "../scenarios/kubernetes-basics/kubernetes-eks-rbac-irsa.yaml"
  },
  {
    "id": "kubernetesBlankDeploymentService",
    "kind": "kubernetes",
    "title": "Kubernetes From Scratch: Deployment and Service",
    "description": "Build a complete Kubernetes Deployment and Service YAML from an empty file, including labels, container port, replicas, and a ClusterIP service.",
    "path": "../scenarios/kubernetes-basics/kubernetes-blank-deployment-service.yaml"
  },
  {
    "id": "kubernetesEksRbacWrongRules",
    "kind": "kubernetes",
    "title": "Kubernetes EKS RBAC Wrong Rules",
    "description": "An EKS workload's service account has a RoleBinding but the Role grants access to secrets instead of configmaps, and the pod cannot read its configuration.",
    "path": "../scenarios/kubernetes-basics/kubernetes-eks-rbac-wrong-rules.yaml"
  },
  {
    "id": "semgrepBasicCommandInjection",
    "kind": "appsec",
    "title": "Semgrep Basic Command Injection",
    "description": "A Node.js discount preview endpoint uses eval on request input, and Semgrep blocks the change.",
    "path": "../scenarios/application-security/semgrep-basic-command-injection.yaml"
  },
  {
    "id": "javaDependencySecretsContainerAudit",
    "kind": "appsec",
    "title": "Java Dependency Secrets And Container Audit",
    "description": "A Spring Boot service fails DevSecOps gates because it uses a vulnerable logging dependency, commits a JWT secret, and runs the container as root.",
    "path": "../scenarios/application-security/java-dependency-secrets-container-audit.yaml"
  },
  {
    "id": "containerImageCveGate",
    "kind": "appsec",
    "title": "Container Image CVE Gate",
    "description": "A container release is blocked by image vulnerability findings and needs a patched base image plus a narrow, documented scanner exception.",
    "path": "../scenarios/application-security/container-image-cve-gate.yaml"
  },
  {
    "id": "javaCodeAuthSqlAudit",
    "kind": "appsec",
    "title": "Java Code Authorization And SQL Audit",
    "description": "A Spring Boot code review finds an admin endpoint trusting a request header for authorization and a repository query built with string concatenation.",
    "path": "../scenarios/application-security/java-code-auth-sql-audit.yaml"
  },
  {
    "id": "pythonSemgrepHardcodedSecret",
    "kind": "appsec",
    "title": "Semgrep Python Hardcoded Secret",
    "description": "A Python config file commits an AWS secret access key. Semgrep blocks the change until the secret is moved to an environment variable.",
    "path": "../scenarios/application-security/python-semgrep-hardcoded-secret.yaml"
  },
  {
    "id": "npmTransitiveCveAudit",
    "kind": "appsec",
    "title": "NPM Transitive CVE Audit",
    "description": "A critical CVE sits in a deep transitive dependency. Add an npm override to pin the safe version and pass the production audit.",
    "path": "../scenarios/application-security/npm-transitive-cve-audit.yaml"
  },
  {
    "id": "strideCheckoutThreatModel",
    "kind": "threatmodel",
    "title": "STRIDE Checkout Threat Model",
    "description": "A checkout API threat model is missing key STRIDE risks across user identity, payment webhooks, order storage, and rate limiting.",
    "path": "../scenarios/threat-modeling/stride-checkout-threat-model.yaml"
  },
  {
    "id": "oidcDeploymentThreatModel",
    "kind": "threatmodel",
    "title": "OIDC Deployment Threat Model",
    "description": "A GitHub Actions OIDC deployment design is missing STRIDE coverage for repository identity, workflow integrity, artifact provenance, and production role scope.",
    "path": "../scenarios/threat-modeling/oidc-deployment-threat-model.yaml"
  },
  {
    "id": "awsGuardDutyCloudTrailIamAudit",
    "kind": "cloudsec",
    "title": "AWS GuardDuty CloudTrail IAM Audit",
    "description": "Investigate a GuardDuty finding with CloudTrail, CloudWatch Logs, AWS Config, and IAM simulation, then narrow an overbroad developer support role.",
    "path": "../scenarios/cloud-security-audit/aws-guardduty-cloudtrail-iam-audit.yaml"
  },
  {
    "id": "awsCloudTrailLogIntegrityAudit",
    "kind": "cloudsec",
    "title": "AWS CloudTrail Log Integrity Audit",
    "description": "GuardDuty detects the organization CloudTrail trail was stopped and restarted with log file validation, multi-region, and global service events disabled. Investigate the tampering and restore the approved integrity baseline.",
    "path": "../scenarios/cloud-security-audit/aws-cloudtrail-log-integrity-audit.yaml"
  },
  {
    "id": "secHubFindingsTriageSuppress",
    "kind": "cloudsec",
    "title": "Security Hub Findings Triage",
    "description": "Security Hub floods with LOW and CRITICAL findings. Suppress the accepted LOW findings and escalate the CRITICAL finding to the on-call owner.",
    "path": "../scenarios/cloud-security-audit/sec-hub-findings-triage-suppress.yaml"
  },
  {
    "id": "accessAnalyzerExternalFinding",
    "kind": "cloudsec",
    "title": "IAM Access Analyzer External Access",
    "description": "Access Analyzer finds an S3 bucket policy that grants read access to an external account. Trace the finding and tighten the principal to the same account.",
    "path": "../scenarios/cloud-security-audit/access-analyzer-external-finding.yaml"
  },
  {
    "id": "cloudFormationDriftDetection",
    "kind": "cloudformation",
    "title": "CloudFormation Drift Detection",
    "description": "A CloudFormation stack for checkout API artifact storage has drifted — someone changed the S3 bucket ACL to public-read directly in the AWS console.",
    "path": "../scenarios/cloudformation/cloudformation-drift-detection.yaml"
  },
  {
    "id": "mlopsTrainingDatasetVersion",
    "kind": "mlops",
    "title": "MLOps Training Dataset Version",
    "description": "A churn training pipeline fails because it uses an unpinned dataset alias instead of the approved dataset artifact version.",
    "path": "../scenarios/mlops/mlops-training-dataset-version.yaml"
  },
  {
    "id": "mlopsModelRegistryPromotionGate",
    "kind": "mlops",
    "title": "MLOps Model Registry Promotion Gate",
    "description": "A fraud model candidate cannot be promoted because the model card is missing approval metadata required by the registry gate.",
    "path": "../scenarios/mlops/mlops-model-registry-promotion-gate.yaml"
  },
  {
    "id": "iamBlankSecretsReadonly",
    "kind": "iam",
    "title": "IAM Blank Secrets Read Only",
    "description": "Build a least-privilege policy from a blank file so an app can read exactly one production secret.",
    "path": "../scenarios/identity-access/iam-blank-secrets-readonly.yaml"
  },
  {
    "id": "iamBlankCloudWatchLogsWrite",
    "kind": "iam",
    "title": "IAM Blank CloudWatch Logs Write",
    "description": "Build a minimal log-writer policy from an empty file for an ECS task role.",
    "path": "../scenarios/identity-access/iam-blank-cloudwatch-logs-write.yaml"
  },
  {
    "id": "iamS3PrefixLeastPrivilege",
    "kind": "iam",
    "title": "IAM S3 Prefix Least Privilege",
    "description": "A deployment role can read and write every object in the artifacts bucket. Restrict it to the team-a prefix without breaking ListBucket.",
    "path": "../scenarios/identity-access/iam-s3-prefix-least-privilege.yaml"
  },
  {
    "id": "iamDynamoDbLeadingKeys",
    "kind": "iam",
    "title": "IAM DynamoDB Leading Keys",
    "description": "A tenant service can read every item in a shared DynamoDB table instead of only its tenant partition.",
    "path": "../scenarios/identity-access/iam-dynamodb-leading-keys.yaml"
  },
  {
    "id": "iamAzureBlobReaderScope",
    "kind": "iam",
    "title": "Azure Blob Reader Scope",
    "description": "An Azure managed identity has subscription Owner access but only needs read access to one storage container.",
    "path": "../scenarios/identity-access/iam-azure-blob-reader-scope.yaml"
  },
  {
    "id": "iamGithubOidcEnvironmentTrust",
    "kind": "iam",
    "title": "IAM GitHub OIDC Environment Trust",
    "description": "A production deploy role accepts too many GitHub OIDC subjects. Lock it to the production environment.",
    "path": "../scenarios/identity-access/iam-github-oidc-environment-trust.yaml"
  },
  {
    "id": "iamKmsEncryptionContext",
    "kind": "iam",
    "title": "IAM KMS Encryption Context",
    "description": "A service can decrypt too broadly with a shared KMS key. Require the expected encryption context for payroll data.",
    "path": "../scenarios/identity-access/iam-kms-encryption-context.yaml"
  },
  {
    "id": "scpDenyLeavingOrg",
    "kind": "scp",
    "title": "SCP Deny Leaving Organization",
    "description": "Member accounts can leave the AWS Organization because the baseline SCP does not deny LeaveOrganization.",
    "path": "../scenarios/organization-policy/scp-deny-leaving-org.yaml"
  },
  {
    "id": "scpBlankDenyRootUser",
    "kind": "scp",
    "title": "SCP Blank Deny Root User",
    "description": "Build an SCP from a blank policy that denies root-user actions while preserving a billing exception.",
    "path": "../scenarios/organization-policy/scp-blank-deny-root-user.yaml"
  },
  {
    "id": "scpBlankRequireImdsv2",
    "kind": "scp",
    "title": "SCP Blank Require IMDSv2",
    "description": "Build an SCP from scratch that prevents launching EC2 instances without IMDSv2 required.",
    "path": "../scenarios/organization-policy/scp-blank-require-imdsv2.yaml"
  },
  {
    "id": "scpRegionRestrictionBreakGlass",
    "kind": "scp",
    "title": "SCP Region Restriction Break Glass",
    "description": "A region restriction SCP blocks operations inconsistently and lacks a break-glass role exception.",
    "path": "../scenarios/organization-policy/scp-region-restriction-break-glass.yaml"
  },
  {
    "id": "policyKyvernoRequireAppLabel",
    "kind": "policy",
    "title": "Kyverno Require App Label",
    "description": "Fix a Kyverno ClusterPolicy so Pods without the app label are rejected by the admission policy test.",
    "path": "../scenarios/policy-as-code/policy-kyverno-require-app-label.yaml"
  },
  {
    "id": "policyKubernetesDefaultDenyIngress",
    "kind": "policy",
    "title": "Kubernetes Default Deny Ingress",
    "description": "Fix a Kubernetes NetworkPolicy so every Pod in the payments namespace denies ingress by default.",
    "path": "../scenarios/policy-as-code/policy-kubernetes-default-deny-ingress.yaml"
  },
  {
    "id": "policyIstioDenyUnauthenticated",
    "kind": "policy",
    "title": "Istio Require Authenticated Requests",
    "description": "Fix an Istio AuthorizationPolicy so checkout-api only accepts requests with an authenticated JWT principal.",
    "path": "../scenarios/policy-as-code/policy-istio-deny-unauthenticated.yaml"
  },
  {
    "id": "policyCiliumAllowDnsEgress",
    "kind": "policy",
    "title": "Cilium Allow DNS Egress",
    "description": "Fix a CiliumNetworkPolicy so worker Pods can resolve DNS without opening broad egress.",
    "path": "../scenarios/policy-as-code/policy-cilium-allow-dns-egress.yaml"
  },
  {
    "id": "secretsSsmEnvironmentPath",
    "kind": "secrets",
    "title": "SSM Parameter Environment Path",
    "description": "A staging service reads the production database password parameter.",
    "path": "../scenarios/secrets-management/secrets-ssm-environment-path.yaml"
  },
  {
    "id": "secretsManagerRotationKms",
    "kind": "secrets",
    "title": "Secrets Manager Rotation and KMS",
    "description": "A production database secret uses the default KMS key and has rotation disabled.",
    "path": "../scenarios/secrets-management/secrets-manager-rotation-kms.yaml"
  },
  {
    "id": "secretsManagerResourcePolicy",
    "kind": "secrets",
    "title": "Secrets Manager Resource Policy",
    "description": "A production API key secret has a resource policy that allows cross-account wildcard access.",
    "path": "../scenarios/secrets-management/secrets-manager-resource-policy.yaml"
  },
  {
    "id": "secretsVaultKvPolicyPath",
    "kind": "secrets",
    "title": "Vault KV Policy Path",
    "description": "checkout-api runs in staging, but its Vault policy allows reading the production KV path.",
    "path": "../scenarios/secrets-management/secrets-vault-kv-policy-path.yaml"
  },
  {
    "id": "dnsRoute53AlbAlias",
    "kind": "dns",
    "title": "DNS Route 53 ALB Alias",
    "description": "The application hostname resolves to an old load balancer instead of the current ALB alias target.",
    "path": "../scenarios/dns-tls/dns-route53-alb-alias.yaml"
  },
  {
    "id": "dnsAcmCloudFrontCertificate",
    "kind": "dns",
    "title": "DNS TLS CloudFront ACM Certificate",
    "description": "A CloudFront distribution cannot attach its certificate because the certificate is in the wrong region and DNS validation is incomplete.",
    "path": "../scenarios/dns-tls/dns-acm-cloudfront-certificate.yaml"
  },
  {
    "id": "dnsAcmWildcardValidation",
    "kind": "dns",
    "title": "DNS ACM Wildcard Validation",
    "description": "A CloudFront wildcard certificate is stuck pending because the DNS validation record is in the wrong hosted zone.",
    "path": "../scenarios/dns-tls/dns-acm-wildcard-validation.yaml"
  },
  {
    "id": "observabilityLogRetention",
    "kind": "observability",
    "title": "CloudWatch Log Retention",
    "description": "An ECS service log group keeps logs forever and is driving avoidable storage growth.",
    "path": "../scenarios/observability/observability-log-retention.yaml"
  },
  {
    "id": "observabilityAlb5xxAlarmDimension",
    "kind": "observability",
    "title": "CloudWatch ALB 5xx Alarm Dimension",
    "description": "An ALB 5xx alarm never fires because it uses the classic ELB namespace and dimension shape.",
    "path": "../scenarios/observability/observability-alb-5xx-alarm-dimension.yaml"
  },
  {
    "id": "observabilityAlarmAction",
    "kind": "observability",
    "title": "CloudWatch Alarm Missing Action",
    "description": "A critical latency alarm enters ALARM state but never notifies the on-call SNS topic.",
    "path": "../scenarios/observability/observability-alarm-action.yaml"
  },
  {
    "id": "observabilityPrometheusScrapeTarget",
    "kind": "observability",
    "title": "Prometheus Missing Scrape Target",
    "description": "checkout-api metrics are absent because the ServiceMonitor selector does not match the Service labels.",
    "path": "../scenarios/observability/observability-prometheus-scrape-target.yaml"
  },
  {
    "id": "observabilityOtelExporterEndpoint",
    "kind": "observability",
    "title": "OpenTelemetry Exporter Endpoint",
    "description": "traces are not reaching the collector backend because the OTLP exporter uses the wrong protocol endpoint.",
    "path": "../scenarios/observability/observability-otel-exporter-endpoint.yaml"
  },
  {
    "id": "observabilityKafkaConsumerLag",
    "kind": "observability",
    "title": "Kafka Consumer Lag Spike",
    "description": "checkout-worker consumer lag is growing because the deployment has too few consumers for the current partition count.",
    "path": "../scenarios/observability/observability-kafka-consumer-lag.yaml"
  },
  {
    "id": "finopsS3Lifecycle",
    "kind": "finops",
    "title": "S3 Lifecycle Cost Control",
    "description": "A logs and exports bucket stores all data in S3 Standard forever.",
    "path": "../scenarios/finops/finops-s3-lifecycle.yaml"
  },
  {
    "id": "finopsNatGatewayCostSpike",
    "kind": "finops",
    "title": "NAT Gateway Cost Spike",
    "description": "VPC costs doubled after extra NAT gateways were created in AZs with no private workloads.",
    "path": "../scenarios/finops/finops-nat-gateway-cost-spike.yaml"
  },
  {
    "id": "finopsUnattachedEbsCleanup",
    "kind": "finops",
    "title": "Unattached EBS Cleanup",
    "description": "An old unattached EBS volume is still accruing storage cost because cleanup is disabled.",
    "path": "../scenarios/finops/finops-unattached-ebs-cleanup.yaml"
  },
  {
    "id": "prSecurityGroupAdminCidrReview",
    "kind": "pr",
    "title": "PR Review Security Group Admin CIDR",
    "description": "Review a Terraform change that opens admin ingress to the internet to unblock maintenance access.",
    "path": "../scenarios/change-review/pr-security-group-admin-cidr-review.yaml"
  },
  {
    "id": "prGithubActionsWriteAllReview",
    "kind": "pr",
    "title": "PR Review GitHub Actions Write-All",
    "description": "Review a workflow change that broadens repository token permissions for an AWS deployment.",
    "path": "../scenarios/change-review/pr-github-actions-write-all-review.yaml"
  },
  {
    "id": "prTerraformPublicS3Review",
    "kind": "pr",
    "title": "PR Review Terraform Public S3",
    "description": "Review a Terraform change that adds an artifacts bucket with risky public access settings.",
    "path": "../scenarios/change-review/pr-terraform-public-s3-review.yaml"
  },
  {
    "id": "prIamWildcardPolicyReview",
    "kind": "pr",
    "title": "PR Review IAM Wildcard Policy",
    "description": "Review an IAM policy change that fixes an access issue by adding broad Secrets Manager permissions.",
    "path": "../scenarios/change-review/pr-iam-wildcard-policy-review.yaml"
  },
  {
    "id": "networkingSshCidrHardening",
    "kind": "networking",
    "title": "Networking SSH CIDR Hardening",
    "description": "Restrict bastion SSH access to the corporate office CIDR and avoid exposing private instances.",
    "path": "../scenarios/network-design/networking-ssh-cidr-hardening.yaml"
  },
  {
    "id": "networkingSecurityGroupAlbApp",
    "kind": "networking",
    "title": "Networking ALB to App Security Group",
    "description": "Fix security group rules so internet traffic reaches the ALB and only the ALB can reach the application instances.",
    "path": "../scenarios/network-design/networking-security-group-alb-app.yaml"
  },
  {
    "id": "networkingVpcPublicPrivateSubnets",
    "kind": "networking",
    "title": "Networking VPC Public and Private Subnets",
    "description": "Configure a VPC with public and private subnets, correct route tables, and no accidental public route for private workloads.",
    "path": "../scenarios/network-design/networking-vpc-public-private-subnets.yaml"
  },
  {
    "id": "networkingVpcNatEgress",
    "kind": "networking",
    "title": "Networking Private Subnet NAT Egress",
    "description": "Configure private subnet outbound internet through a NAT gateway while keeping inbound access private.",
    "path": "../scenarios/network-design/networking-vpc-nat-egress.yaml"
  },
  {
    "id": "networkingVpcDbIsolation",
    "kind": "networking",
    "title": "Networking Database Subnet Isolation",
    "description": "Keep database subnets isolated while allowing app subnets to reach them inside the VPC.",
    "path": "../scenarios/network-design/networking-vpc-db-isolation.yaml"
  },
  {
    "id": "networkingNaclEphemeralReturn",
    "kind": "networking",
    "title": "Networking NACL Ephemeral Return Traffic",
    "description": "Fix a network ACL that allows inbound HTTPS but blocks return traffic from private app subnets.",
    "path": "../scenarios/network-design/networking-nacl-ephemeral-return.yaml"
  },
  {
    "id": "networkingSiteToSiteVpn",
    "kind": "networking",
    "title": "Networking Site-to-Site VPN Routes",
    "description": "Wire an on-prem network to private VPC subnets through a site-to-site VPN without routing private workloads to the internet.",
    "path": "../scenarios/network-design/networking-site-to-site-vpn.yaml"
  },
  {
    "id": "networkingWafAlbProtection",
    "kind": "networking",
    "title": "Networking WAF ALB Protection",
    "description": "Attach a WAF web ACL to the public ALB and block suspicious requests while allowing normal traffic.",
    "path": "../scenarios/network-design/networking-waf-alb-protection.yaml"
  },
  {
    "id": "networkingDirectConnectMultiVpc",
    "kind": "networking",
    "title": "Networking Direct Connect Multi-VPC Routing",
    "description": "Connect a company network to multiple AWS VPCs through Direct Connect, a DX gateway, and a transit gateway.",
    "path": "../scenarios/network-design/networking-direct-connect-multi-vpc.yaml"
  },
  {
    "id": "incidentSev1CommandTriage",
    "kind": "incident",
    "title": "SEV1 Incident Command Triage",
    "description": "A production checkout-api 5xx spike is open without an incident commander or severity; assign command, set SEV1, and move to detected.",
    "path": "../scenarios/incident-response/incident-sev1-command-triage.yaml"
  },
  {
    "id": "incidentPostmortemBlameless",
    "kind": "incident",
    "title": "Blameless Postmortem Draft",
    "description": "Draft a blameless postmortem from a raw incident timeline: fill the root cause and action items and remove blame language.",
    "path": "../scenarios/incident-response/incident-postmortem-blameless.yaml"
  },
  {
    "id": "incidentRunbookExecutionGap",
    "kind": "incident",
    "title": "Runbook Execution Gap",
    "description": "On-call follows a stale runbook whose steps diverge from the live service port; flag the drift and patch the runbook.",
    "path": "../scenarios/incident-response/incident-runbook-execution-gap.yaml"
  },
  {
    "id": "incidentAlertStormTriage",
    "kind": "incident",
    "title": "Alert Storm Triage",
    "description": "Two hundred correlated alerts flood the pager; identify the root alert and suppress the noise.",
    "path": "../scenarios/incident-response/incident-alert-storm-triage.yaml"
  },
  {
    "id": "incidentCustomerFacingCommsDraft",
    "kind": "incident",
    "title": "Customer-Facing Status Comms",
    "description": "Draft status page updates at t+0, t+15, and t+60 that balance transparency with SLA wording.",
    "path": "../scenarios/incident-response/incident-customer-facing-comms-draft.yaml"
  },
  {
    "id": "drRdsFailoverVerify",
    "kind": "dr",
    "title": "RDS Multi-AZ Failover and Verify",
    "description": "Promote the RDS standby, verify the application reconnects, and confirm replica health before cutover.",
    "path": "../scenarios/disaster-recovery/dr-rds-failover-verify.yaml"
  },
  {
    "id": "drRegionFailoverDrill",
    "kind": "dr",
    "title": "Region Failover Drill Runbook",
    "description": "Shift Route 53 weighted routing to the DR region and verify database, cache, and queue state after failover.",
    "path": "../scenarios/disaster-recovery/dr-region-failover-drill.yaml"
  },
  {
    "id": "drBackupRestoreIntegrity",
    "kind": "dr",
    "title": "Backup Restore Integrity Check",
    "description": "Restore the nightly PostgreSQL backup to staging and verify row-count and checksum diffs against the production snapshot.",
    "path": "../scenarios/disaster-recovery/dr-backup-restore-integrity.yaml"
  },
  {
    "id": "drRpoRtoCalculation",
    "kind": "dr",
    "title": "RPO/RTO Calculation From Metrics",
    "description": "Given the backup cadence and replication lag logs, compute the achieved RPO and RTO against the SLO.",
    "path": "../scenarios/disaster-recovery/dr-rpo-rto-calculation.yaml"
  },
  {
    "id": "drCrossRegionReplicationLag",
    "kind": "dr",
    "title": "Cross-Region Replication Lag Triage",
    "description": "S3 cross-region replication lag exceeds the RPO; find the bucket with paused replication and the wrong scope.",
    "path": "../scenarios/disaster-recovery/dr-cross-region-replication-lag.yaml"
  },
  {
    "id": "dbRdsFailoverStuck",
    "kind": "database",
    "title": "RDS Failover Stuck",
    "description": "A Multi-AZ failover is stuck; diagnose the event log, DNS, and standby health before forcing failover.",
    "path": "../scenarios/database-ops/db-rds-failover-stuck.yaml"
  },
  {
    "id": "dbReplicationLagSpike",
    "kind": "database",
    "title": "Read Replica Replication Lag Spike",
    "description": "Read replica lag is climbing; identify the long-running transaction on the primary and the stalled checkpoint.",
    "path": "../scenarios/database-ops/db-replication-lag-spike.yaml"
  },
  {
    "id": "dbSlowQueryPlanRegression",
    "kind": "database",
    "title": "Slow Query Plan Regression",
    "description": "A query plan flipped to a sequential scan after a statistics refresh; analyze the explain and add the missing index.",
    "path": "../scenarios/database-ops/db-slow-query-plan-regression.yaml"
  },
  {
    "id": "dbConnectionPoolExhaustion",
    "kind": "database",
    "title": "Connection Pool Exhaustion",
    "description": "PgBouncer is saturated; identify the leaky client, tune the pool mode, and raise the client connection limit.",
    "path": "../scenarios/database-ops/db-connection-pool-exhaustion.yaml"
  },
  {
    "id": "dbPitrRestoreToPoint",
    "kind": "database",
    "title": "PITR Restore to Specific Timestamp",
    "description": "Restore RDS to 30 minutes before a bad migration; verify the target time is inside the retention window.",
    "path": "../scenarios/database-ops/db-pitr-restore-to-point.yaml"
  },
  {
    "id": "dbDynamoThrottledOnHotKey",
    "kind": "database",
    "title": "DynamoDB Hot Key Throttling",
    "description": "A single partition key absorbs almost all traffic; diagnose the WCU skew and fix the key distribution.",
    "path": "../scenarios/database-ops/db-dynamo-throttled-on-hot-key.yaml"
  },
  {
    "id": "supplyChainSbomGenerationGate",
    "kind": "supplychain",
    "title": "SBOM Generation Gate",
    "description": "A release is blocked because the CI job does not emit a CycloneDX SBOM; generate the SBOM and unblock the gate.",
    "path": "../scenarios/supply-chain/supply-chain-sbom-generation-gate.yaml"
  },
  {
    "id": "supplyChainCosignVerifyProvenance",
    "kind": "supplychain",
    "title": "Cosign Verify Image Provenance",
    "description": "A Kubernetes admission controller rejects a pod because the image lacks a cosign signature; verify the signing identity.",
    "path": "../scenarios/supply-chain/supply-chain-cosign-verify-provenance.yaml"
  },
  {
    "id": "supplyChainSyftGrypeVulnGate",
    "kind": "supplychain",
    "title": "Syft Grype Vulnerability Gate",
    "description": "An image scan finds a CVE; rebuild on a distroless base image and add a narrow, justified scanner exception.",
    "path": "../scenarios/supply-chain/supply-chain-syft-grype-vuln-gate.yaml"
  },
  {
    "id": "supplyChainSlsaLevel3Provenance",
    "kind": "supplychain",
    "title": "SLSA Level 3 Provenance Check",
    "description": "Build provenance attestation is missing the builder identity; fix the workflow and verify with slsa-verifier.",
    "path": "../scenarios/supply-chain/supply-chain-slsa-level3-provenance.yaml"
  },
  {
    "id": "supplyChainDependencyConfusion",
    "kind": "supplychain",
    "title": "Dependency Confusion Poisoning",
    "description": "A private package name was registered publicly and pip pulls the malicious public version; pin to the private index.",
    "path": "../scenarios/supply-chain/supply-chain-dependency-confusion.yaml"
  },
  {
    "id": "sreSliFormulationFromSignal",
    "kind": "sre",
    "title": "SLI Formulation From Signal",
    "description": "Given service metrics and a user journey, define the good-events and total-events SLI with the availability threshold.",
    "path": "../scenarios/sre-slo/sre-sli-formulation-from-signal.yaml"
  },
  {
    "id": "sreErrorBudgetBurnRate",
    "kind": "sre",
    "title": "Error Budget Burn Rate Alert",
    "description": "A multi-window burn rate alert is misconfigured; fix the fast-burn and slow-burn windows and thresholds.",
    "path": "../scenarios/sre-slo/sre-error-budget-burn-rate.yaml"
  },
  {
    "id": "sreSloTierMismatch",
    "kind": "sre",
    "title": "SLO Tier Mismatch",
    "description": "A tier-1 service inherits a tier-3 SLO; tighten the tier, availability target, and error budget policy.",
    "path": "../scenarios/sre-slo/sre-slo-tier-mismatch.yaml"
  },
  {
    "id": "sreToilBudgetExceeded",
    "kind": "sre",
    "title": "Toil Budget Exceeded",
    "description": "Team toil is above 50% of the sprint; classify the repeat offender and propose automation to bring it under budget.",
    "path": "../scenarios/sre-slo/sre-toil-budget-exceeded.yaml"
  },
  {
    "id": "sreAlertSloBasedReplacement",
    "kind": "sre",
    "title": "Alert SLO-Based Replacement",
    "description": "Replace a CPU threshold alert with an SLO burn-rate alert that maps user impact to burn rate.",
    "path": "../scenarios/sre-slo/sre-alert-slo-based-replacement.yaml"
  },
  {
    "id": "msgSqsDlqRedrivePolicy",
    "kind": "messaging",
    "title": "SQS DLQ Redrive Policy",
    "description": "A DLQ is filling with poison messages; fix the redrive target, maxReceiveCount, and add an idempotency check.",
    "path": "../scenarios/messaging/msg-sqs-dlq-redrive-policy.yaml"
  },
  {
    "id": "msgKafkaConsumerRebalanceStorm",
    "kind": "messaging",
    "title": "Kafka Consumer Rebalance Storm",
    "description": "Consumers are stuck in a rebalance loop; fix the session timeout, heartbeat, and static membership strategy.",
    "path": "../scenarios/messaging/msg-kafka-consumer-rebalance-storm.yaml"
  },
  {
    "id": "msgSnsFanoutFilterPolicy",
    "kind": "messaging",
    "title": "SNS Fan-out Filter Policy",
    "description": "Subscribers receive the wrong messages; fix the SNS subscription FilterPolicy on message attributes.",
    "path": "../scenarios/messaging/msg-sns-fanout-filter-policy.yaml"
  },
  {
    "id": "msgOrderedDeliveryPartitionKey",
    "kind": "messaging",
    "title": "Ordered Delivery Partition Key",
    "description": "Ordering is broken and one partition is hot; fix the partition key strategy and rebalance the hot partition.",
    "path": "../scenarios/messaging/msg-ordered-delivery-partition-key.yaml"
  },
  {
    "id": "msgIdempotencyDuplicateConsume",
    "kind": "messaging",
    "title": "Idempotency Duplicate Consume",
    "description": "At-least-once delivery causes double charges; add an idempotency key and a dedupe table to the consumer.",
    "path": "../scenarios/messaging/msg-idempotency-duplicate-consume.yaml"
  }
] as const satisfies readonly ScenarioSummary[];

export const scenarioSummaries: Record<string, ScenarioSummary> = Object.fromEntries(
  scenarioManifest.map((scenario) => [scenario.id, scenario]),
);
