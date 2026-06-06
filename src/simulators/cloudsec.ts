import type { Scenario } from "../types";

function markFirstResource(runtime: Scenario, status: string, note: string): void {
  if (!runtime.awsResources[0]) return;
  runtime.awsResources[0].status = status;
  runtime.awsResources[0].note = note;
}

function scopedDeveloperSupportPolicy(runtime: Scenario): boolean {
  const policy = runtime.files["iam/policy.json"] ?? "";
  return (
    policy.includes('"s3:GetObject"') &&
    policy.includes('"s3:ListBucket"') &&
    policy.includes('"arn:aws:s3:::prod-audit-logs"') &&
    policy.includes('"arn:aws:s3:::prod-audit-logs/support-cases/*"') &&
    policy.includes('"s3:prefix"') &&
    policy.includes('"support-cases/*"') &&
    !policy.includes('"s3:*"') &&
    !policy.includes('"iam:PassRole"') &&
    !policy.includes('"Resource": "*"')
  );
}

export function cloudsecFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return false;
  return scopedDeveloperSupportPolicy(runtime);
}

export function guardDutyListFindings(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["Findings: []"];
  runtime.flags.initialized = true;
  return [
    "DetectorId: 12abc34d567e8f901g2h345i678j901k",
    "FindingIds:",
    "  gd-9f3b2c1a",
    "Severity: HIGH",
    "Type: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS",
  ];
}

export function guardDutyGetFindings(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["No finding details for this lab."];
  runtime.flags.validationPassed = true;
  return [
    "Id: gd-9f3b2c1a",
    "Type: UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS",
    "Severity: 8.1",
    "Resource: arn:aws:iam::123456789012:role/DeveloperSupportRole",
    "API: s3:GetObject",
    "Bucket: prod-customer-data",
    "Object: exports/full-customer-list.csv",
    "RemoteIpAddress: 198.51.100.77",
  ];
}

export function cloudTrailLookupEvents(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["No CloudTrail events for this lab."];
  runtime.flags.validationPassed = true;
  return [
    "2026-06-03T07:42:11Z sts.amazonaws.com AssumeRole user/alex -> DeveloperSupportRole",
    "2026-06-03T07:43:02Z s3.amazonaws.com GetObject role/DeveloperSupportRole prod-customer-data/exports/full-customer-list.csv",
    "Finding: access is outside the approved support scope prod-audit-logs/support-cases/*",
  ];
}

export function logsFilterLogEvents(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["No matching log events for this lab."];
  runtime.flags.validationPassed = true;
  return [
    "logGroup: /aws/cloudtrail/org-trail",
    "eventName=GetObject sourceIPAddress=198.51.100.77 userIdentity.sessionContext.sessionIssuer.userName=DeveloperSupportRole",
    "requestParameters.bucketName=prod-customer-data requestParameters.key=exports/full-customer-list.csv",
  ];
}

export function configResourceHistory(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["No AWS Config history for this lab."];
  runtime.flags.cleanPlan = true;
  return [
    "ResourceType: AWS::IAM::Policy",
    "ResourceName: DeveloperSupportPolicy",
    "CaptureTime: 2026-06-02T18:21:54Z",
    "ChangedBy: arn:aws:iam::123456789012:user/alex",
    "ChangeSummary: policy broadened from support-case log access to s3:* and iam:PassRole on *",
    "PreviousStatement: Allow s3:ListBucket on arn:aws:s3:::prod-audit-logs with s3:prefix=support-cases/*",
    "PreviousStatement: Allow s3:GetObject on arn:aws:s3:::prod-audit-logs/support-cases/*",
    "CurrentStatement: Allow s3:* and iam:PassRole on *",
  ];
}

export function cloudsecSimulatePrincipalPolicy(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["IAM simulation is not configured for this lab."];
  if (scopedDeveloperSupportPolicy(runtime)) {
    runtime.flags.securityPassed = true;
    runtime.stateResources = runtime.stateResources.map((resource) => {
      if (resource.address === "iam.role.DeveloperSupportRole.s3") return { ...resource, id: "support-case-readonly" };
      if (resource.address === "iam.role.DeveloperSupportRole.passrole") return { ...resource, id: "denied" };
      return resource;
    });
    markFirstResource(runtime, "drifted", "DeveloperSupportRole policy is scoped; verify the scenario after the investigation trail is complete.");
    return [
      "EvalActionName: s3:GetObject Resource: arn:aws:s3:::prod-audit-logs/support-cases/case-1842.log Decision: allowed",
      "EvalActionName: s3:ListBucket Resource: arn:aws:s3:::prod-audit-logs ContextKeyName=s3:prefix ContextKeyValue=support-cases/ Decision: allowed",
      "EvalActionName: s3:GetObject Resource: arn:aws:s3:::prod-customer-data/exports/full-customer-list.csv Decision: explicitDeny",
      "EvalActionName: s3:ListBucket Resource: arn:aws:s3:::prod-customer-data Decision: explicitDeny",
      "EvalActionName: iam:PassRole Resource: * Decision: explicitDeny",
    ];
  }

  markFirstResource(runtime, "failed", "IAM simulation still allows broad S3 or iam:PassRole access for DeveloperSupportRole.");
  return [
    "EvalActionName: s3:GetObject Resource: arn:aws:s3:::prod-customer-data/exports/full-customer-list.csv Decision: allowed",
    "EvalActionName: s3:DeleteObject Resource: arn:aws:s3:::prod-customer-data/exports/full-customer-list.csv Decision: allowed",
    "EvalActionName: iam:PassRole Resource: arn:aws:iam::123456789012:role/AdminBreakGlass Decision: allowed",
    "Finding: DeveloperSupportRole is still over-permissive.",
  ];
}

export function markCloudsecScenarioSolved(runtime: Scenario): void {
  runtime.flags.cloudsecValidated = true;
  markFirstResource(runtime, "success", "GuardDuty, CloudTrail, CloudWatch Logs, AWS Config, and IAM simulation confirm the risky permission path was removed.");
}
