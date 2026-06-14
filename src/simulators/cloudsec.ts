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

function cloudTrailLogIntegrityFixed(runtime: Scenario): boolean {
  const config = runtime.files["cloudtrail/config.json"] ?? "";
  return (
    config.includes('"EnableLogFileValidation": true') &&
    config.includes('"IsMultiRegionTrail": true') &&
    config.includes('"IncludeGlobalServiceEvents": true') &&
    !config.includes('"EnableLogFileValidation": false') &&
    !config.includes('"IsMultiRegionTrail": false') &&
    !config.includes('"IncludeGlobalServiceEvents": false')
  );
}

export function cloudsecFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "awsGuardDutyCloudTrailIamAudit") return scopedDeveloperSupportPolicy(runtime);
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") return cloudTrailLogIntegrityFixed(runtime);
  return false;
}

export function guardDutyListFindings(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") {
    runtime.flags.initialized = true;
    return [
      "DetectorId: 12abc34d567e8f901g2h345i678j901k",
      "FindingIds:",
      "  gd-7e4a1b8c",
      "Severity: HIGH",
      "Type: Stealth:IAMUser/CloudTrailStopped",
    ];
  }
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
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") {
    runtime.flags.validationPassed = true;
    return [
      "Id: gd-7e4a1b8c",
      "Type: Stealth:IAMUser/CloudTrailStopped",
      "Severity: 8.6",
      "Resource: arn:aws:cloudtrail:us-east-1:123456789012:trail/org-cloudtrail",
      "API: cloudtrail:UpdateTrail",
      "ServiceName: cloudtrail.amazonaws.com",
      "RemoteIpAddress: 203.0.113.42",
      "Finding: org-cloudtrail was stopped and restarted with weakened integrity controls",
    ];
  }
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
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") {
    runtime.flags.validationPassed = true;
    return [
      "2026-06-10T02:14:33Z cloudtrail.amazonaws.com StopLogging user/deploy-bot -> org-cloudtrail STOPPED",
      "2026-06-10T02:16:18Z cloudtrail.amazonaws.com UpdateTrail user/deploy-bot logValidation=false multiRegion=false globalServices=false",
      "2026-06-10T02:17:05Z cloudtrail.amazonaws.com StartLogging user/deploy-bot -> org-cloudtrail RESTARTED with weakened controls",
      "Finding: trail was stopped, reconfigured without integrity controls, then restarted by deploy-bot",
    ];
  }
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["No CloudTrail events for this lab."];
  runtime.flags.validationPassed = true;
  return [
    "2026-06-03T07:42:11Z sts.amazonaws.com AssumeRole user/alex -> DeveloperSupportRole",
    "2026-06-03T07:43:02Z s3.amazonaws.com GetObject role/DeveloperSupportRole prod-customer-data/exports/full-customer-list.csv",
    "Finding: access is outside the approved support scope prod-audit-logs/support-cases/*",
  ];
}

export function logsFilterLogEvents(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") {
    runtime.flags.validationPassed = true;
    return [
      "logGroup: /aws/cloudtrail/org-trail",
      "eventName=StopLogging userIdentity.userName=deploy-bot requestParameters.name=org-cloudtrail",
      "eventName=UpdateTrail userIdentity.userName=deploy-bot enableLogFileValidation=false isMultiRegionTrail=false includeGlobalServiceEvents=false",
      "eventName=StartLogging userIdentity.userName=deploy-bot requestParameters.name=org-cloudtrail",
      "Finding: three API calls from deploy-bot within a 3-minute window stopped and weakened the trail",
    ];
  }
  if (scenarioId !== "awsGuardDutyCloudTrailIamAudit") return ["No matching log events for this lab."];
  runtime.flags.validationPassed = true;
  return [
    "logGroup: /aws/cloudtrail/org-trail",
    "eventName=GetObject sourceIPAddress=198.51.100.77 userIdentity.sessionContext.sessionIssuer.userName=DeveloperSupportRole",
    "requestParameters.bucketName=prod-customer-data requestParameters.key=exports/full-customer-list.csv",
  ];
}

export function configResourceHistory(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") {
    runtime.flags.cleanPlan = true;
    return [
      "ResourceType: AWS::CloudTrail::Trail",
      "ResourceName: org-cloudtrail",
      "CaptureTime: 2026-06-09T14:22:01Z (approved baseline)",
      "CaptureTime: 2026-06-10T02:18:42Z (tampered)",
      "ChangedBy: arn:aws:iam::123456789012:user/deploy-bot",
      "ChangeSummary: trail tampered — log file validation disabled, multi-region turned off, global service events excluded",
      "ApprovedBaseline: EnableLogFileValidation=true IsMultiRegionTrail=true IncludeGlobalServiceEvents=true",
      "TamperedState: EnableLogFileValidation=false IsMultiRegionTrail=false IncludeGlobalServiceEvents=false",
    ];
  }
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
  if (scenarioId === "awsCloudTrailLogIntegrityAudit") {
    if (cloudTrailLogIntegrityFixed(runtime)) {
      runtime.flags.securityPassed = true;
      runtime.stateResources = runtime.stateResources.map((resource) => {
        if (resource.address === "cloudtrail.trail.org-cloudtrail.validation") return { ...resource, id: "enabled" };
        if (resource.address === "cloudtrail.trail.org-cloudtrail.multi-region") return { ...resource, id: "enabled" };
        if (resource.address === "cloudtrail.trail.org-cloudtrail.global-services") return { ...resource, id: "enabled" };
        return resource;
      });
      markFirstResource(runtime, "drifted", "CloudTrail integrity controls restored; verify the scenario after the investigation trail is complete.");
      return [
        "Simulating: cloudtrail:DescribeTrails on org-cloudtrail",
        "EnableLogFileValidation: true — log files are cryptographically signed and verifiable",
        "IsMultiRegionTrail: true — all regions are monitored",
        "IncludeGlobalServiceEvents: true — IAM, STS, and CloudFront events are captured",
        "KMS encryption: active — log files are encrypted at rest",
        "CloudWatchLogs: configured — API events delivered to log group",
        "Result: org-cloudtrail integrity controls match approved security baseline",
      ];
    }

    markFirstResource(runtime, "failed", "CloudTrail integrity controls are still disabled. Restore log validation, multi-region, and global service events in cloudtrail/config.json.");
    return [
      "Simulating: cloudtrail:DescribeTrails on org-cloudtrail",
      "EnableLogFileValidation: false — WARNING: log files can be tampered without detection",
      "IsMultiRegionTrail: false — WARNING: regions outside us-east-1 are not monitored",
      "IncludeGlobalServiceEvents: false — WARNING: IAM and STS activity is not captured",
      "Finding: org-cloudtrail does not meet the security baseline for log integrity",
    ];
  }

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
