import type { Scenario } from "../types";
import { markFirstResourceFailed } from "./shared";

type JsonObject = Record<string, unknown>;

function parseJsonObject(source: string): JsonObject | null {
  try {
    const parsed = JSON.parse(source) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonObject : null;
  } catch {
    return null;
  }
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => stringValues(item));
  return [];
}

function statements(policy: JsonObject | null): JsonObject[] {
  if (!policy) return [];
  const statement = policy.Statement;
  if (Array.isArray(statement)) return statement.filter((item): item is JsonObject => !!item && typeof item === "object" && !Array.isArray(item));
  if (statement && typeof statement === "object" && !Array.isArray(statement)) return [statement as JsonObject];
  return [];
}

function actions(statement: JsonObject): string[] {
  return stringValues(statement.Action);
}

function notActions(statement: JsonObject): string[] {
  return stringValues(statement.NotAction);
}

function resources(statement: JsonObject): string[] {
  return stringValues(statement.Resource);
}

function lowerValues(values: string[]): string[] {
  return values.map((value) => value.toLowerCase());
}

function hasValue(values: string[], expected: string): boolean {
  return lowerValues(values).includes(expected.toLowerCase());
}

function hasAllValues(values: string[], expected: string[]): boolean {
  return expected.every((item) => hasValue(values, item));
}

function conditionPairs(statement: JsonObject): Array<[string, string]> {
  const condition = statement.Condition;
  if (!condition || typeof condition !== "object" || Array.isArray(condition)) return [];

  return Object.values(condition as JsonObject).flatMap((operator) => {
    if (!operator || typeof operator !== "object" || Array.isArray(operator)) return [];
    return Object.entries(operator as JsonObject).flatMap(([key, value]) =>
      stringValues(value).map((conditionValue) => [key, conditionValue] as [string, string]),
    );
  });
}

function hasCondition(statement: JsonObject, key: string, value: string): boolean {
  return conditionPairs(statement).some(
    ([conditionKey, conditionValue]) => conditionKey.toLowerCase() === key.toLowerCase() && conditionValue.toLowerCase() === value.toLowerCase(),
  );
}

function hasConditionValue(statement: JsonObject, value: string): boolean {
  return conditionPairs(statement).some(([, conditionValue]) => conditionValue.toLowerCase() === value.toLowerCase());
}

function isAllow(statement: JsonObject): boolean {
  return typeof statement.Effect === "string" && statement.Effect.toLowerCase() === "allow";
}

function isDeny(statement: JsonObject): boolean {
  return typeof statement.Effect === "string" && statement.Effect.toLowerCase() === "deny";
}

function hasBroadAllow(policy: JsonObject | null, servicePrefix: string): boolean {
  return statements(policy).some((statement) =>
    isAllow(statement)
    && (hasValue(actions(statement), `${servicePrefix}:*`) || hasValue(actions(statement), "*") || hasValue(resources(statement), "*")),
  );
}

function hasBroadDenyAction(policy: JsonObject | null, action: string): boolean {
  return statements(policy).some((statement) =>
    isDeny(statement) && (hasValue(actions(statement), "*") || hasValue(actions(statement), action.split(":")[0] + ":*")),
  );
}

function hasAllowAction(policy: JsonObject | null, action: string): boolean {
  return statements(policy).some((statement) =>
    isAllow(statement) && (hasValue(actions(statement), action) || hasValue(actions(statement), action.split(":")[0] + ":*") || hasValue(actions(statement), "*")),
  );
}

export function iamFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "iamS3PrefixLeastPrivilege") {
    const policy = parseJsonObject(runtime.files["policy.json"] ?? "");
    const policyStatements = statements(policy);
    const listBucket = policyStatements.some((statement) =>
      isAllow(statement)
      && hasValue(actions(statement), "s3:ListBucket")
      && hasValue(resources(statement), "arn:aws:s3:::company-artifacts")
      && hasCondition(statement, "s3:prefix", "team-a/*"),
    );
    const objectAccess = policyStatements.some((statement) =>
      isAllow(statement)
      && hasAllValues(actions(statement), ["s3:GetObject", "s3:PutObject"])
      && hasValue(resources(statement), "arn:aws:s3:::company-artifacts/team-a/*"),
    );
    return listBucket && objectAccess && !hasBroadAllow(policy, "s3");
  }

  if (scenarioId === "iamGithubOidcEnvironmentTrust") {
    const trustPolicy = parseJsonObject(runtime.files["trust-policy.json"] ?? "");
    return statements(trustPolicy).some((statement) =>
      isAllow(statement)
      && hasValue(actions(statement), "sts:AssumeRoleWithWebIdentity")
      && hasCondition(statement, "token.actions.githubusercontent.com:aud", "sts.amazonaws.com")
      && hasCondition(statement, "token.actions.githubusercontent.com:sub", "repo:acme/platform:environment:production"),
    );
  }

  if (scenarioId === "iamKmsEncryptionContext") {
    const policy = parseJsonObject(runtime.files["kms-policy.json"] ?? "");
    return statements(policy).some((statement) =>
      isAllow(statement)
      && hasValue(actions(statement), "kms:Decrypt")
      && hasValue(resources(statement), "arn:aws:kms:eu-west-1:123456789012:key/payroll-key")
      && hasCondition(statement, "kms:EncryptionContext:App", "payroll"),
    ) && !hasBroadAllow(policy, "kms");
  }

  if (scenarioId === "iamDynamoDbLeadingKeys") {
    const policy = parseJsonObject(runtime.files["policy.json"] ?? "");
    return statements(policy).some((statement) =>
      isAllow(statement)
      && hasAllValues(actions(statement), ["dynamodb:GetItem", "dynamodb:PutItem"])
      && hasValue(resources(statement), "arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders")
      && hasCondition(statement, "dynamodb:LeadingKeys", "tenant-a"),
    ) && !hasBroadAllow(policy, "dynamodb");
  }

  if (scenarioId === "iamAzureBlobReaderScope") {
    const assignment = parseJsonObject(runtime.files["role-assignment.json"] ?? "");
    return assignment?.principalName === "reporting-api"
      && assignment.roleDefinitionName === "Storage Blob Data Reader"
      && assignment.scope === "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-prod-data/providers/Microsoft.Storage/storageAccounts/proddata/blobServices/default/containers/reports";
  }

  if (scenarioId === "iamBlankSecretsReadonly") {
    const policy = parseJsonObject(runtime.files["policy.json"] ?? "");
    return statements(policy).some((statement) =>
      isAllow(statement)
      && hasValue(actions(statement), "secretsmanager:GetSecretValue")
      && hasValue(resources(statement), "arn:aws:secretsmanager:eu-west-1:123456789012:secret:prod/db/password-abc123"),
    ) && !hasBroadAllow(policy, "secretsmanager");
  }

  if (scenarioId === "iamBlankCloudWatchLogsWrite") {
    const policy = parseJsonObject(runtime.files["policy.json"] ?? "");
    return statements(policy).some((statement) =>
      isAllow(statement)
      && hasAllValues(actions(statement), ["logs:CreateLogStream", "logs:PutLogEvents"])
      && hasValue(resources(statement), "arn:aws:logs:eu-west-1:123456789012:log-group:/aws/ecs/payments-api:*"),
    ) && !hasBroadAllow(policy, "logs");
  }

  return false;
}

export function scpFixApplied(runtime: Scenario, scenarioId: string): boolean {
  const policy = parseJsonObject(runtime.files["scp.json"] ?? "");
  const policyStatements = statements(policy);

  if (scenarioId === "scpDenyLeavingOrg") {
    return policyStatements.some((statement) =>
      isDeny(statement) && hasValue(actions(statement), "organizations:LeaveOrganization"),
    ) && !hasBroadDenyAction(policy, "organizations:LeaveOrganization");
  }

  if (scenarioId === "scpRegionRestrictionBreakGlass") {
    return policyStatements.some((statement) =>
      isDeny(statement)
      && hasCondition(statement, "aws:RequestedRegion", "eu-west-1")
      && hasCondition(statement, "aws:RequestedRegion", "eu-central-1")
      && hasCondition(statement, "aws:PrincipalArn", "arn:aws:iam::*:role/BreakGlassAdmin")
      && !hasConditionValue(statement, "us-east-1")
      && notActions(statement).length > 0,
    );
  }

  if (scenarioId === "scpBlankDenyRootUser") {
    return policyStatements.some((statement) =>
      isDeny(statement)
      && hasCondition(statement, "aws:PrincipalArn", "arn:aws:iam::*:root")
      && hasValue(notActions(statement), "aws-portal:ViewBilling")
      && !hasValue(actions(statement), "aws-portal:ViewBilling"),
    ) && !hasBroadDenyAction(policy, "aws-portal:ViewBilling");
  }

  if (scenarioId === "scpBlankRequireImdsv2") {
    return policyStatements.some((statement) =>
      isDeny(statement)
      && hasValue(actions(statement), "ec2:RunInstances")
      && hasCondition(statement, "ec2:MetadataHttpTokens", "optional"),
    ) && !hasBroadDenyAction(policy, "ec2:RunInstances");
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
      "EvalActionName: iam:CreateUser",
      "EvalDecision: explicitDeny",
      "MatchedStatement: DenyRootExceptBillingView",
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

export function scpSimulationFailure(scenarioId: string, runtime?: Scenario): string[] {
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
    const policy = runtime ? parseJsonObject(runtime.files["scp.json"] ?? "") : null;
    const policyStatements = statements(policy);
    if (
      hasAllowAction(policy, "aws-portal:ViewBilling")
      && (
        hasBroadDenyAction(policy, "aws-portal:ViewBilling")
        || policyStatements.some((statement) => isDeny(statement) && hasValue(actions(statement), "aws-portal:ViewBilling"))
      )
    ) {
      return [
        "EvalPrincipalArn: arn:aws:iam::123456789012:root",
        "EvalActionName: aws-portal:ViewBilling",
        "EvalDecision: explicitDeny",
        "Finding: the Allow statement does not override DenyRootUser; exclude billing from the Deny with NotAction.",
      ];
    }

    return [
      "EvalPrincipalArn: arn:aws:iam::123456789012:root",
      "EvalActionName: iam:CreateUser",
      "EvalDecision: allowed",
      "Finding: root user actions are not explicitly denied or billing view is also denied.",
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
  return scpSimulationFailure(scenarioId, runtime);
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
