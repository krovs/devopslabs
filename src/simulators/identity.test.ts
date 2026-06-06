import { describe, expect, it } from "vitest";
import type { Scenario } from "../types";
import { iamAssumeRoleWithWebIdentity, iamFixApplied, iamSimulatePrincipalPolicy, scpFixApplied, scpSimulatePrincipalPolicy } from "./identity";

describe("Identity simulator", () => {
  it("accepts real S3 prefix least-privilege policy shapes", () => {
    const scenario = identityScenario("iam", {
      "policy.json": JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "TeamAObjects",
            Effect: "Allow",
            Resource: ["arn:aws:s3:::company-artifacts/team-a/*"],
            Action: ["s3:PutObject", "s3:GetObject"],
          },
          {
            Sid: "TeamAList",
            Effect: "Allow",
            Resource: "arn:aws:s3:::company-artifacts",
            Action: "s3:ListBucket",
            Condition: {
              StringLike: {
                "s3:prefix": ["team-a/*"],
              },
            },
          },
        ],
      }),
    });

    expect(iamFixApplied(scenario, "iamS3PrefixLeastPrivilege")).toBe(true);
    expect(iamSimulatePrincipalPolicy(scenario, "iamS3PrefixLeastPrivilege")).toContain("EvalDecision: implicitDeny");
    expect(scenario.flags.iamValidated).toBe(true);
  });

  it("rejects S3 policies that keep broad allow access", () => {
    const scenario = identityScenario("iam", {
      "policy.json": JSON.stringify({
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:ListBucket", "s3:GetObject", "s3:PutObject"],
            Resource: "*",
            Condition: { StringLike: { "s3:prefix": "team-a/*" } },
          },
        ],
      }),
    });

    expect(iamFixApplied(scenario, "iamS3PrefixLeastPrivilege")).toBe(false);
  });

  it("accepts GitHub OIDC trust conditions without relying on text order", () => {
    const scenario = identityScenario("iam", {
      "trust-policy.json": JSON.stringify({
        Version: "2012-10-17",
        Statement: {
          Effect: "Allow",
          Principal: {
            Federated: "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com",
          },
          Action: "sts:AssumeRoleWithWebIdentity",
          Condition: {
            StringEquals: {
              "token.actions.githubusercontent.com:sub": "repo:acme/platform:environment:production",
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            },
          },
        },
      }),
    });

    expect(iamFixApplied(scenario, "iamGithubOidcEnvironmentTrust")).toBe(true);
    expect(iamAssumeRoleWithWebIdentity(scenario, "iamGithubOidcEnvironmentTrust")).toContain("AssumeRoleWithWebIdentity: allowed");
  });

  it("accepts normal SCP Resource star for IMDSv2 enforcement", () => {
    const scenario = identityScenario("scp", {
      "scp.json": JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "DenyRunInstancesWithoutImdsv2",
            Effect: "Deny",
            Action: ["ec2:RunInstances"],
            Resource: "*",
            Condition: {
              StringEquals: {
                "ec2:MetadataHttpTokens": "optional",
              },
            },
          },
        ],
      }),
    });

    expect(scpFixApplied(scenario, "scpBlankRequireImdsv2")).toBe(true);
    expect(scpSimulatePrincipalPolicy(scenario, "scpBlankRequireImdsv2")).toContain("EvalDecision: explicitDeny");
    expect(scenario.flags.scpValidated).toBe(true);
  });
});

function identityScenario(kind: "iam" | "scp", files: Record<string, string>): Scenario {
  return {
    id: "identity-test",
    kind,
    title: "Identity test",
    description: "Test fixture.",
    primaryFile: Object.keys(files)[0],
    files,
    backend: {
      bucket: "identity",
      key: "test",
      table: "none",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "policy",
        name: "test-policy",
        id: "test-policy",
        status: "failed",
      },
    ],
    stateResources: [],
    flags: {},
    solution: {
      summary: "Fix policy.",
      steps: [],
      commands: [],
      explanation: "Fix policy.",
      outcome: "Policy passes.",
    },
  };
}
