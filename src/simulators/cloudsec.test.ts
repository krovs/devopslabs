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
  it("exposes the intended scoped bucket through investigation commands and solves after IAM simulation", () => {
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
