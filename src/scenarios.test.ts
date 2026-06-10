import { describe, expect, it } from "vitest";
import { checkScenario, isScenarioSolved } from "./completion";
import { loadAllScenarios, scenarios, validateScenario } from "./scenarios";
import type { Scenario } from "./types";

describe("scenarios", () => {
  it("loads all bundled scenario YAML files", () => {
    const ids = Object.keys(scenarios);

    expect(ids.length).toBeGreaterThan(40);
    expect(ids).toContain("interruptedApplyLock");
    expect(ids).toContain("networkingSiteToSiteVpn");
    expect(ids).toContain("prTerraformPublicS3Review");
  });

  it("has unique IDs and matching map keys", async () => {
    const entries = Object.entries(await loadAllScenarios());
    const ids = entries.map(([, scenario]) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const [key, scenario] of entries) {
      expect(scenario.id).toBe(key);
    }
  });

  it("validates every bundled scenario", async () => {
    for (const scenario of Object.values(await loadAllScenarios())) {
      expect(() => validateScenario(scenario)).not.toThrow();
    }
  });

  it("requires files and resource arrays", () => {
    const invalidScenario = {
      id: "invalid",
      title: "Invalid",
      description: "Missing required fields.",
      backend: {
        bucket: "tf-state-training",
        key: "invalid.tfstate",
        table: "tf-locks",
        locked: false,
        lockId: null,
      },
      files: {},
      awsResources: [],
      stateResources: [],
      flags: {},
    } satisfies Scenario;

    expect(() => validateScenario(invalidScenario)).toThrow("invalid is missing files");
  });

  it("requires tips and solution lists to contain strings", () => {
    const invalidScenario = {
      id: "invalidTips",
      title: "Invalid Tips",
      description: "Tip parsed as an object.",
      tips: [{ requestPrincipals: ["*"] }],
      files: {
        "policy.yaml": "kind: Policy",
      },
      backend: {
        bucket: "tf-state-training",
        key: "invalid.tfstate",
        table: "tf-locks",
        locked: false,
        lockId: null,
      },
      awsResources: [],
      stateResources: [],
      flags: {},
      solution: {
        summary: "Fix it.",
        steps: ["Apply the fix."],
        commands: ["check"],
        explanation: "Explains it.",
        outcome: "Done.",
      },
    } as unknown as Scenario;

    expect(() => validateScenario(invalidScenario)).toThrow("invalidTips has a non-string tip");
  });

  it("requires networking, threat modeling, and PR models for those scenario kinds", () => {
    const baseScenario: Scenario = {
      id: "invalidNetworking",
      kind: "networking",
      title: "Invalid Networking",
      description: "Missing networking model.",
      files: {
        "requirements.md": "Goal: fix routing.",
      },
      backend: {
        bucket: "tf-state-training",
        key: "invalid.tfstate",
        table: "tf-locks",
        locked: false,
        lockId: null,
      },
      awsResources: [],
      stateResources: [],
      flags: {},
    };

    expect(() => validateScenario(baseScenario)).toThrow("invalidNetworking is missing networking");
    expect(() => validateScenario({ ...baseScenario, id: "invalidThreatModel", kind: "threatmodel" })).toThrow("invalidThreatModel is missing threatModel");
    expect(() => validateScenario({ ...baseScenario, id: "invalidPr", kind: "pr" })).toThrow("invalidPr is missing prReview");
  });

  it("has auto-apply solution coverage for every scenario", async () => {
    for (const scenario of Object.values(await loadAllScenarios())) {
      expect(scenario.solution, `${scenario.id} is missing an auto-apply solution`).toBeDefined();
    }
  });

  it("has auto-apply solution replacements that match scenario files", async () => {
    for (const scenario of Object.values(await loadAllScenarios())) {
      if (!scenario.solution) continue;

      for (const replacement of scenario.solution.replacements ?? []) {
        const source = scenario.solution.files?.[replacement.fileName] ?? scenario.files[replacement.fileName];

        expect(source, `${scenario.id} replacement references missing file ${replacement.fileName}`).toBeDefined();
        expect(source, `${scenario.id} replacement for ${replacement.fileName} does not match the current lab file`).toContain(replacement.search);
      }
    }
  });

  it("does not complete a lab after the solution was viewed", () => {
    const scenario = {
      id: "assisted",
      title: "Assisted",
      description: "Looks solved but used the solution.",
      primaryFile: "main.tf",
      files: { "main.tf": "resource fixed" },
      backend: {
        bucket: "tf-state-training",
        key: "assisted.tfstate",
        table: "tf-locks",
        locked: false,
        lockId: null,
      },
      awsResources: [],
      stateResources: [],
      flags: {
        initialized: true,
        cleanPlan: true,
        solutionViewed: true,
      },
      solution: {
        summary: "Fix it.",
        steps: ["Apply the fix."],
        commands: ["terraform plan"],
        explanation: "The lab is solved when Terraform is clean.",
        outcome: "Terraform is clean.",
      },
    } satisfies Scenario;

    expect(isScenarioSolved(scenario, "assisted", "main.tf")).toBe(false);
    expect(checkScenario(scenario, "assisted", "main.tf")).toEqual([
      "Not complete: the solution was viewed for this attempt. Reset the lab and solve it without opening the solution to mark it complete.",
    ]);
  });

  it("reports invalid JSON before scenario-specific completion checks", async () => {
    const scenario = (await loadAllScenarios()).scpRegionRestrictionBreakGlass;

    scenario.files["scp.json"] = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Condition": {
        "ArnNotLike": {
          "aws:PrincipalArn": [
            "arn:aws:iam::*:role/BreakGlassAdmin",
          ]
        }
      }
    }
  ]
}`;

    expect(checkScenario(scenario, scenario.id, "scp.json")[0]).toMatch(/^Invalid JSON in scp\.json:/);
  });

  it("reports invalid YAML before scenario-specific completion checks", async () => {
    const scenario = (await loadAllScenarios()).mlopsTrainingDatasetVersion;

    scenario.files["pipeline.yaml"] = `dataset:
  name: churn
  version churn-2026-05-17
training:
  image: ghcr.io/acme/churn-trainer:2.8.0
`;

    expect(checkScenario(scenario, scenario.id, "pipeline.yaml")[0]).toMatch(/^Invalid YAML in pipeline\.yaml:/);
  });
});
