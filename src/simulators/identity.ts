import type { Scenario } from "../types";
import { markFirstResourceFailed } from "./shared";

export function iamFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "iamS3PrefixLeastPrivilege") {
    const policy = runtime.files["policy.json"] ?? "";
    return (
      policy.includes("s3:ListBucket") &&
      policy.includes("s3:GetObject") &&
      policy.includes("s3:PutObject") &&
      policy.includes("arn:aws:s3:::company-artifacts") &&
      policy.includes("arn:aws:s3:::company-artifacts/team-a/*") &&
      policy.includes("s3:prefix") &&
      policy.includes("team-a/*") &&
      !policy.includes('"s3:*"') &&
      !policy.includes('"Resource": "*"')
    );
  }

  if (scenarioId === "iamGithubOidcEnvironmentTrust") {
    const trustPolicy = runtime.files["trust-policy.json"] ?? "";
    return (
      trustPolicy.includes("token.actions.githubusercontent.com:aud") &&
      trustPolicy.includes("sts.amazonaws.com") &&
      trustPolicy.includes("repo:acme/platform:environment:production") &&
      !trustPolicy.includes("repo:acme/platform:*") &&
      !trustPolicy.includes("refs/heads/*")
    );
  }

  if (scenarioId === "iamKmsEncryptionContext") {
    const policy = runtime.files["kms-policy.json"] ?? "";
    return (
      policy.includes("kms:Decrypt") &&
      policy.includes("arn:aws:kms:eu-west-1:123456789012:key/payroll-key") &&
      policy.includes("kms:EncryptionContext:App") &&
      policy.includes("payroll") &&
      !policy.includes('"kms:*"') &&
      !policy.includes('"Resource": "*"')
    );
  }

  if (scenarioId === "iamDynamoDbLeadingKeys") {
    const policy = runtime.files["policy.json"] ?? "";
    return (
      policy.includes("dynamodb:GetItem") &&
      policy.includes("dynamodb:PutItem") &&
      policy.includes("arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders") &&
      policy.includes("dynamodb:LeadingKeys") &&
      policy.includes("tenant-a") &&
      !policy.includes('"dynamodb:*"') &&
      !policy.includes('"Resource": "*"')
    );
  }

  if (scenarioId === "iamAzureBlobReaderScope") {
    const assignment = runtime.files["role-assignment.json"] ?? "";
    return (
      assignment.includes('"principalName": "reporting-api"') &&
      assignment.includes('"roleDefinitionName": "Storage Blob Data Reader"') &&
      assignment.includes('"scope": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-prod-data/providers/Microsoft.Storage/storageAccounts/proddata/blobServices/default/containers/reports"') &&
      !assignment.includes('"roleDefinitionName": "Owner"') &&
      !assignment.includes('"roleDefinitionName": "Contributor"') &&
      !assignment.includes('"scope": "/subscriptions/00000000-0000-0000-0000-000000000000"')
    );
  }

  if (scenarioId === "iamBlankSecretsReadonly") {
    const policy = runtime.files["policy.json"] ?? "";
    return (
      policy.includes("secretsmanager:GetSecretValue") &&
      policy.includes("arn:aws:secretsmanager:eu-west-1:123456789012:secret:prod/db/password-abc123") &&
      !policy.includes("secretsmanager:*") &&
      !policy.includes("secretsmanager:DeleteSecret") &&
      !policy.includes('"Resource": "*"')
    );
  }

  if (scenarioId === "iamBlankCloudWatchLogsWrite") {
    const policy = runtime.files["policy.json"] ?? "";
    return (
      policy.includes("logs:CreateLogStream") &&
      policy.includes("logs:PutLogEvents") &&
      policy.includes("arn:aws:logs:eu-west-1:123456789012:log-group:/aws/ecs/payments-api:*") &&
      !policy.includes("logs:*") &&
      !policy.includes("logs:DeleteLogGroup") &&
      !policy.includes('"Resource": "*"')
    );
  }

  return false;
}

export function scpFixApplied(runtime: Scenario, scenarioId: string): boolean {
  const policy = runtime.files["scp.json"] ?? "";

  if (scenarioId === "scpDenyLeavingOrg") {
    return (
      policy.includes("organizations:LeaveOrganization") &&
      policy.includes('"Effect": "Deny"') &&
      policy.includes('"Action": "organizations:LeaveOrganization"') &&
      !policy.includes('"Action": "*"') &&
      !policy.includes('"Resource": "*"')
    );
  }

  if (scenarioId === "scpRegionRestrictionBreakGlass") {
    return (
      policy.includes("aws:RequestedRegion") &&
      policy.includes("eu-west-1") &&
      policy.includes("eu-central-1") &&
      policy.includes("ArnNotLike") &&
      policy.includes("arn:aws:iam::*:role/BreakGlassAdmin") &&
      !policy.includes("us-east-1")
    );
  }

  if (scenarioId === "scpBlankDenyRootUser") {
    return (
      policy.includes('"Effect": "Deny"') &&
      policy.includes("aws:PrincipalArn") &&
      policy.includes("arn:aws:iam::*:root") &&
      policy.includes("aws-portal:ViewBilling") &&
      !policy.includes('"Action": "*"')
    );
  }

  if (scenarioId === "scpBlankRequireImdsv2") {
    return (
      policy.includes('"Effect": "Deny"') &&
      policy.includes("ec2:RunInstances") &&
      policy.includes("ec2:MetadataHttpTokens") &&
      policy.includes("optional") &&
      !policy.includes('"Action": "ec2:*"') &&
      !policy.includes('"Action": "*"')
    );
  }

  return false;
}

export function markIamScenarioSolved(runtime: Scenario, note: string): void {
  runtime.flags.iamValidated = true;
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = note;
  }
}

export function scpSuccessNote(scenarioId: string): string {
  if (scenarioId === "scpDenyLeavingOrg") return "SCP denies LeaveOrganization without blocking unrelated Organizations read actions.";
  if (scenarioId === "scpRegionRestrictionBreakGlass") return "SCP denies unsupported regions while exempting the break-glass role.";
  if (scenarioId === "scpBlankDenyRootUser") return "SCP denies root-user actions while preserving the billing view exception.";
  if (scenarioId === "scpBlankRequireImdsv2") return "SCP denies EC2 launches when IMDSv2 is not required.";
  return "SCP guardrail is valid.";
}

export function scpFailureNote(scenarioId: string): string {
  if (scenarioId === "scpDenyLeavingOrg") return "SCP still fails to deny LeaveOrganization with a scoped action.";
  if (scenarioId === "scpRegionRestrictionBreakGlass") return "SCP still misses allowed regions or the break-glass exception.";
  if (scenarioId === "scpBlankDenyRootUser") return "SCP still does not deny root-user activity with the required billing exception.";
  if (scenarioId === "scpBlankRequireImdsv2") return "SCP still does not require IMDSv2 for EC2 instance launches.";
  return "SCP still does not match the requirement.";
}

export function scpSimulationSuccess(scenarioId: string): string[] {
  if (scenarioId === "scpDenyLeavingOrg") {
    return [
      "EvalActionName: organizations:LeaveOrganization",
      "EvalDecision: explicitDeny",
      "MatchedStatement: DenyLeaveOrganization",
      "",
      "EvalActionName: organizations:DescribeOrganization",
      "EvalDecision: allowed by account policy, not denied by SCP",
    ];
  }

  if (scenarioId === "scpRegionRestrictionBreakGlass") {
    return [
      "EvalActionName: ec2:RunInstances",
      "Context: aws:RequestedRegion=eu-west-1",
      "EvalDecision: allowed by account policy, not denied by SCP",
      "",
      "EvalActionName: ec2:RunInstances",
      "Context: aws:RequestedRegion=us-west-2",
      "EvalDecision: explicitDeny",
      "",
      "PrincipalArn: arn:aws:iam::123456789012:role/BreakGlassAdmin",
      "EvalDecision: allowed by SCP exception",
    ];
  }

  if (scenarioId === "scpBlankDenyRootUser") {
    return [
      "EvalPrincipalArn: arn:aws:iam::123456789012:root",
      "EvalActionName: ec2:TerminateInstances",
      "EvalDecision: explicitDeny",
      "MatchedStatement: DenyRootUser",
      "",
      "EvalActionName: aws-portal:ViewBilling",
      "EvalDecision: allowed by SCP exception",
    ];
  }

  if (scenarioId === "scpBlankRequireImdsv2") {
    return [
      "EvalActionName: ec2:RunInstances",
      "Context: ec2:MetadataHttpTokens=optional",
      "EvalDecision: explicitDeny",
      "",
      "EvalActionName: ec2:RunInstances",
      "Context: ec2:MetadataHttpTokens=required",
      "EvalDecision: allowed by account policy, not denied by SCP",
    ];
  }

  return ["SCP simulation passed."];
}

export function scpSimulationFailure(scenarioId: string): string[] {
  if (scenarioId === "scpDenyLeavingOrg") {
    return [
      "EvalActionName: organizations:LeaveOrganization",
      "EvalDecision: allowed",
      "Finding: member accounts can still leave the organization.",
    ];
  }

  if (scenarioId === "scpRegionRestrictionBreakGlass") {
    return [
      "EvalActionName: ec2:RunInstances",
      "Context: aws:RequestedRegion=us-west-2",
      "EvalDecision: allowed",
      "Finding: unsupported regions are not denied or break-glass exception is missing.",
    ];
  }

  if (scenarioId === "scpBlankDenyRootUser") {
    return [
      "EvalPrincipalArn: arn:aws:iam::123456789012:root",
      "EvalActionName: ec2:TerminateInstances",
      "EvalDecision: allowed",
      "Finding: root user actions are not explicitly denied or billing exception is missing.",
    ];
  }

  if (scenarioId === "scpBlankRequireImdsv2") {
    return [
      "EvalActionName: ec2:RunInstances",
      "Context: ec2:MetadataHttpTokens=optional",
      "EvalDecision: allowed",
      "Finding: EC2 launches without IMDSv2 required are still permitted.",
    ];
  }

  return ["SCP simulation failed."];
}

export function scpSimulatePrincipalPolicy(runtime: Scenario, scenarioId: string): string[] {
  if (scpFixApplied(runtime, scenarioId)) {
    runtime.flags.scpValidated = true;
    if (runtime.awsResources[0]) {
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = scpSuccessNote(scenarioId);
    }
    return scpSimulationSuccess(scenarioId);
  }

  markFirstResourceFailed(runtime, scpFailureNote(scenarioId));
  return scpSimulationFailure(scenarioId);
}

export function iamSimulatePrincipalPolicy(runtime: Scenario, scenarioId: string): string[] {
  if (runtime.kind === "scp") return scpSimulatePrincipalPolicy(runtime, scenarioId);

  if (scenarioId !== "iamS3PrefixLeastPrivilege" && scenarioId !== "iamDynamoDbLeadingKeys") {
    return ["Simulation skipped: this lab does not use this IAM policy simulation."];
  }

  if (scenarioId === "iamDynamoDbLeadingKeys") {
    if (iamFixApplied(runtime, scenarioId)) {
      markIamScenarioSolved(runtime, "DynamoDB policy allows tenant-a item access only when dynamodb:LeadingKeys is tenant-a.");
      return [
        "EvalActionName: dynamodb:GetItem",
        "EvalResourceName: arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders",
        "EvalDecision: allowed",
        "Condition: dynamodb:LeadingKeys = tenant-a",
        "",
        "EvalActionName: dynamodb:GetItem",
        "ContextKeyName: dynamodb:LeadingKeys",
        "ContextKeyValue: tenant-b",
        "EvalDecision: implicitDeny",
      ];
    }

    markFirstResourceFailed(runtime, "DynamoDB policy still lacks tenant-a LeadingKeys isolation.");
    return [
      "EvalActionName: dynamodb:GetItem",
      "EvalResourceName: arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders",
      "EvalDecision: allowed",
      "Finding: tenant-b partition keys are still reachable because dynamodb:LeadingKeys is missing.",
    ];
  }

  if (iamFixApplied(runtime, scenarioId)) {
    markIamScenarioSolved(runtime, "S3 policy allows only the team-a prefix with separate bucket and object permissions.");
    return [
      "EvalActionName: s3:ListBucket",
      "EvalResourceName: arn:aws:s3:::company-artifacts",
      "EvalDecision: allowed",
      "Condition: s3:prefix = team-a/*",
      "",
      "EvalActionName: s3:GetObject",
      "EvalResourceName: arn:aws:s3:::company-artifacts/team-a/release.zip",
      "EvalDecision: allowed",
      "",
      "EvalActionName: s3:GetObject",
      "EvalResourceName: arn:aws:s3:::company-artifacts/team-b/release.zip",
      "EvalDecision: implicitDeny",
    ];
  }

  markFirstResourceFailed(runtime, "S3 policy still grants broad access or misses the prefix-scoped ListBucket pattern.");
  return [
    "EvalActionName: s3:DeleteBucket",
    "EvalResourceName: arn:aws:s3:::company-artifacts",
    "EvalDecision: allowed",
    "Finding: policy is broader than the team-a deployment requirement.",
  ];
}

export function organizationsDescribePolicy(runtime: Scenario, scenarioId: string): string[] {
  if (runtime.kind !== "scp") return ["DescribePolicy is not the inspection command for this lab."];
  const policyName = runtime.awsResources[0]?.name ?? "organization-scp";
  const state = scpFixApplied(runtime, scenarioId) ? "valid" : "finding";
  const note = scpFixApplied(runtime, scenarioId)
    ? "SCP guardrail matches the organization requirement."
    : runtime.awsResources[0]?.note ?? "SCP still does not match the organization requirement.";

  return [
    `PolicyName: ${policyName}`,
    "Type: SERVICE_CONTROL_POLICY",
    `ValidationState: ${state}`,
    `Finding: ${note}`,
  ];
}

export function iamAssumeRoleWithWebIdentity(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "iamGithubOidcEnvironmentTrust") {
    return ["AssumeRoleWithWebIdentity skipped: this lab does not use GitHub OIDC trust simulation."];
  }

  if (iamFixApplied(runtime, scenarioId)) {
    markIamScenarioSolved(runtime, "Trust policy only accepts the production GitHub environment subject.");
    return [
      "Token issuer: token.actions.githubusercontent.com",
      "aud: sts.amazonaws.com",
      "sub: repo:acme/platform:environment:production",
      "AssumeRoleWithWebIdentity: allowed",
    ];
  }

  markFirstResourceFailed(runtime, "OIDC trust still accepts a wildcard subject or misses the production environment subject.");
  return [
    "Token issuer: token.actions.githubusercontent.com",
    "aud: sts.amazonaws.com",
    "sub: repo:acme/platform:environment:production",
    "AssumeRoleWithWebIdentity: denied by review policy",
    "Finding: trust condition is not constrained to the production environment.",
  ];
}

export function iamS3Cp(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "iamS3PrefixLeastPrivilege") {
    return ["aws s3 cp is not the validation command for this lab."];
  }
  return iamFixApplied(runtime, scenarioId)
    ? ["upload: ./release.zip to s3://company-artifacts/team-a/release.zip", "Access to s3://company-artifacts/team-b/release.zip remains denied."]
    : ["upload: ./release.zip to s3://company-artifacts/team-a/release.zip", "Warning: current policy also allows access outside team-a/."];
}

export function iamKmsDecrypt(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "iamKmsEncryptionContext") {
    return ["aws kms decrypt is not the validation command for this lab."];
  }

  if (iamFixApplied(runtime, scenarioId)) {
    markIamScenarioSolved(runtime, "KMS decrypt is scoped to the payroll key and payroll encryption context.");
    return [
      "Decrypt with EncryptionContext App=payroll: allowed",
      "Decrypt without EncryptionContext App=payroll: implicitDeny",
      "kms:ScheduleKeyDeletion: implicitDeny",
    ];
  }

  markFirstResourceFailed(runtime, "KMS policy still allows broad decrypt or misses the payroll encryption context.");
  return [
    "Decrypt with EncryptionContext App=payroll: allowed",
    "Decrypt without EncryptionContext App=payroll: allowed",
    "Finding: decrypt is not constrained by encryption context.",
  ];
}

export function azureRoleAssignmentList(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "iamAzureBlobReaderScope") {
    return ["az role assignment list is not the validation command for this lab."];
  }

  if (iamFixApplied(runtime, scenarioId)) {
    markIamScenarioSolved(runtime, "Azure RBAC grants Storage Blob Data Reader only at the reports container scope.");
    return [
      "principalName: reporting-api",
      "roleDefinitionName: Storage Blob Data Reader",
      "scope: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-prod-data/providers/Microsoft.Storage/storageAccounts/proddata/blobServices/default/containers/reports",
      "canRead: reports",
      "canWrite: denied",
    ];
  }

  markFirstResourceFailed(runtime, "Azure role assignment is still too broad or grants write/admin access.");
  return [
    "principalName: reporting-api",
    "roleDefinitionName: Owner",
    "scope: /subscriptions/00000000-0000-0000-0000-000000000000",
    "Finding: subscription Owner is broader than read-only access to the reports container.",
  ];
}
