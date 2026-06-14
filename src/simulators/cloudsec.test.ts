import { describe, expect, it } from "vitest";
import { checkScenario, isScenarioSolved } from "../completion";
import type { Scenario } from "../types";
import {
  cloudsecSimulatePrincipalPolicy,
  cloudTrailLookupEvents,
  configResourceHistory,
  guardDutyGetFindings,
  guardDutyListFindings,
  logsFilterLogEvents,
} from "./cloudsec";

describe("CloudSec simulator", () => {
  it("awsGuardDutyCloudTrailIamAudit: exposes the intended scoped bucket through investigation commands and solves after IAM simulation", () => {
    const scenario = awsGuardDutyCloudTrailIamAuditScenario();

    expect(guardDutyListFindings(scenario, "awsGuardDutyCloudTrailIamAudit")).toContain("  gd-9f3b2c1a");
    expect(guardDutyGetFindings(scenario, "awsGuardDutyCloudTrailIamAudit")).toContain("Resource: arn:aws:iam::123456789012:role/DeveloperSupportRole");
    expect(cloudTrailLookupEvents(scenario, "awsGuardDutyCloudTrailIamAudit")).toContain(
      "2026-06-03T07:43:02Z s3.amazonaws.com GetObject role/DeveloperSupportRole prod-customer-data/exports/full-customer-list.csv",
    );
    expect(cloudTrailLookupEvents(scenario, "awsGuardDutyCloudTrailIamAudit")).toContain(
      "Finding: access is outside the approved support scope prod-audit-logs/support-cases/*",
    );
    expect(logsFilterLogEvents(scenario, "awsGuardDutyCloudTrailIamAudit")).toContain(
      "requestParameters.bucketName=prod-customer-data requestParameters.key=exports/full-customer-list.csv",
    );
    expect(configResourceHistory(scenario, "awsGuardDutyCloudTrailIamAudit")).toEqual([
      "ResourceType: AWS::IAM::Policy",
      "ResourceName: DeveloperSupportPolicy",
      "CaptureTime: 2026-06-02T18:21:54Z",
      "ChangedBy: arn:aws:iam::123456789012:user/alex",
      "ChangeSummary: policy broadened from support-case log access to s3:* and iam:PassRole on *",
      "PreviousStatement: Allow s3:ListBucket on arn:aws:s3:::prod-audit-logs with s3:prefix=support-cases/*",
      "PreviousStatement: Allow s3:GetObject on arn:aws:s3:::prod-audit-logs/support-cases/*",
      "CurrentStatement: Allow s3:* and iam:PassRole on *",
    ]);

    scenario.files["iam/policy.json"] = scopedPolicy();

    expect(cloudsecSimulatePrincipalPolicy(scenario, "awsGuardDutyCloudTrailIamAudit")).toContain(
      "EvalActionName: s3:GetObject Resource: arn:aws:s3:::prod-audit-logs/support-cases/case-1842.log Decision: allowed",
    );
    expect(checkScenario(scenario, "awsGuardDutyCloudTrailIamAudit", "iam/policy.json")).toEqual(["Scenario complete."]);
    expect(isScenarioSolved(scenario, "awsGuardDutyCloudTrailIamAudit", "iam/policy.json")).toBe(true);
  });

  it("awsCloudTrailLogIntegrityAudit: exposes the tampered trail through investigation commands and solves after restoring integrity controls", () => {
    const scenario = awsCloudTrailLogIntegrityAuditScenario();

    expect(guardDutyListFindings(scenario, "awsCloudTrailLogIntegrityAudit")).toContain("  gd-7e4a1b8c");
    expect(guardDutyListFindings(scenario, "awsCloudTrailLogIntegrityAudit")).toContain("Type: Stealth:IAMUser/CloudTrailStopped");
    expect(guardDutyGetFindings(scenario, "awsCloudTrailLogIntegrityAudit")).toContain("Resource: arn:aws:cloudtrail:us-east-1:123456789012:trail/org-cloudtrail");
    expect(guardDutyGetFindings(scenario, "awsCloudTrailLogIntegrityAudit")).toContain("Finding: org-cloudtrail was stopped and restarted with weakened integrity controls");
    expect(cloudTrailLookupEvents(scenario, "awsCloudTrailLogIntegrityAudit")).toContain(
      "2026-06-10T02:16:18Z cloudtrail.amazonaws.com UpdateTrail user/deploy-bot logValidation=false multiRegion=false globalServices=false",
    );
    expect(cloudTrailLookupEvents(scenario, "awsCloudTrailLogIntegrityAudit")).toContain(
      "Finding: trail was stopped, reconfigured without integrity controls, then restarted by deploy-bot",
    );
    expect(logsFilterLogEvents(scenario, "awsCloudTrailLogIntegrityAudit")).toContain(
      "eventName=UpdateTrail userIdentity.userName=deploy-bot enableLogFileValidation=false isMultiRegionTrail=false includeGlobalServiceEvents=false",
    );
    expect(configResourceHistory(scenario, "awsCloudTrailLogIntegrityAudit")).toEqual([
      "ResourceType: AWS::CloudTrail::Trail",
      "ResourceName: org-cloudtrail",
      "CaptureTime: 2026-06-09T14:22:01Z (approved baseline)",
      "CaptureTime: 2026-06-10T02:18:42Z (tampered)",
      "ChangedBy: arn:aws:iam::123456789012:user/deploy-bot",
      "ChangeSummary: trail tampered — log file validation disabled, multi-region turned off, global service events excluded",
      "ApprovedBaseline: EnableLogFileValidation=true IsMultiRegionTrail=true IncludeGlobalServiceEvents=true",
      "TamperedState: EnableLogFileValidation=false IsMultiRegionTrail=false IncludeGlobalServiceEvents=false",
    ]);

    // Not yet fixed
    expect(cloudsecSimulatePrincipalPolicy(scenario, "awsCloudTrailLogIntegrityAudit")).toContain(
      "EnableLogFileValidation: false — WARNING: log files can be tampered without detection",
    );
    expect(checkScenario(scenario, "awsCloudTrailLogIntegrityAudit", "cloudtrail/config.json")).toContain(
      "Not complete: the security configuration is not yet corrected. Review the investigation trail and fix the configuration.",
    );

    // Fix the config
    scenario.files["cloudtrail/config.json"] = fixedTrailConfig();

    expect(cloudsecSimulatePrincipalPolicy(scenario, "awsCloudTrailLogIntegrityAudit")).toContain(
      "EnableLogFileValidation: true — log files are cryptographically signed and verifiable",
    );
    expect(checkScenario(scenario, "awsCloudTrailLogIntegrityAudit", "cloudtrail/config.json")).toEqual(["Scenario complete."]);
    expect(isScenarioSolved(scenario, "awsCloudTrailLogIntegrityAudit", "cloudtrail/config.json")).toBe(true);
  });
});

function awsGuardDutyCloudTrailIamAuditScenario(): Scenario {
  return {
    id: "awsGuardDutyCloudTrailIamAudit",
    kind: "cloudsec",
    title: "AWS GuardDuty CloudTrail IAM Audit",
    description: "Test fixture.",
    primaryFile: "iam/policy.json",
    files: {
      "iam/policy.json": `{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": ["s3:*", "iam:PassRole"],
          "Resource": "*"
        }]
      }`,
    },
    backend: {
      bucket: "cloud-security-audit",
      key: "guardduty-cloudtrail-iam-audit",
      table: "investigations",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "guardduty_finding",
        name: "gd-9f3b2c1a",
        id: "UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "guardduty.finding.gd-9f3b2c1a", id: "active" },
      { address: "iam.role.DeveloperSupportRole.s3", id: "s3:*" },
      { address: "iam.role.DeveloperSupportRole.passrole", id: "allowed" },
    ],
    flags: {
      initialized: false,
      validationPassed: false,
      securityPassed: false,
      cleanPlan: false,
      cloudsecValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Investigate the finding.", "Scope the policy."],
      commands: ["aws configservice get-resource-config-history", "aws iam simulate-principal-policy"],
      explanation: "AWS Config exposes the previous scoped policy.",
      outcome: "Broad access is removed.",
    },
  };
}

function scopedPolicy(): string {
  return `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": "s3:ListBucket",
        "Resource": "arn:aws:s3:::prod-audit-logs",
        "Condition": {
          "StringLike": {
            "s3:prefix": "support-cases/*"
          }
        }
      },
      {
        "Effect": "Allow",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::prod-audit-logs/support-cases/*"
      }
    ]
  }`;
}

function awsCloudTrailLogIntegrityAuditScenario(): Scenario {
  return {
    id: "awsCloudTrailLogIntegrityAudit",
    kind: "cloudsec",
    title: "AWS CloudTrail Log Integrity Audit",
    description: "Test fixture.",
    primaryFile: "cloudtrail/config.json",
    files: {
      "cloudtrail/config.json": `{
        "Name": "org-cloudtrail",
        "S3BucketName": "org-cloudtrail-logs",
        "EnableLogFileValidation": false,
        "IsMultiRegionTrail": false,
        "IncludeGlobalServiceEvents": false,
        "IsOrganizationTrail": true
      }`,
    },
    backend: {
      bucket: "cloud-security-audit",
      key: "cloudtrail-log-integrity-audit",
      table: "investigations",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "guardduty_finding",
        name: "gd-7e4a1b8c",
        id: "Stealth:IAMUser/CloudTrailStopped",
        status: "failed",
      },
      {
        type: "cloudtrail_trail",
        name: "org-cloudtrail",
        id: "arn:aws:cloudtrail:us-east-1:123456789012:trail/org-cloudtrail",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "guardduty.finding.gd-7e4a1b8c", id: "active" },
      { address: "cloudtrail.trail.org-cloudtrail.validation", id: "disabled" },
      { address: "cloudtrail.trail.org-cloudtrail.multi-region", id: "disabled" },
      { address: "cloudtrail.trail.org-cloudtrail.global-services", id: "disabled" },
    ],
    flags: {
      initialized: false,
      validationPassed: false,
      securityPassed: false,
      cleanPlan: false,
      cloudsecValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Investigate the finding.", "Restore trail integrity."],
      commands: ["aws configservice get-resource-config-history", "aws iam simulate-principal-policy"],
      explanation: "AWS Config shows the approved baseline.",
      outcome: "Integrity controls restored.",
    },
  };
}

function fixedTrailConfig(): string {
  return `{
    "Name": "org-cloudtrail",
    "S3BucketName": "org-cloudtrail-logs",
    "EnableLogFileValidation": true,
    "IsMultiRegionTrail": true,
    "IncludeGlobalServiceEvents": true,
    "IsOrganizationTrail": true
  }`;
}
