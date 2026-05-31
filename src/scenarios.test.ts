import { describe, expect, it } from "vitest";
import { scenarios, validateScenario } from "./scenarios";
import type { Scenario } from "./types";

describe("scenarios", () => {
  it("loads all bundled scenario YAML files", () => {
    const ids = Object.keys(scenarios);

    expect(ids.length).toBeGreaterThan(40);
    expect(ids).toContain("interruptedApplyLock");
    expect(ids).toContain("networkingSiteToSiteVpn");
    expect(ids).toContain("prTerraformPublicS3Review");
  });

  it("has unique IDs and matching map keys", () => {
    const entries = Object.entries(scenarios);
    const ids = entries.map(([, scenario]) => scenario.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const [key, scenario] of entries) {
      expect(scenario.id).toBe(key);
    }
  });

  it("validates every bundled scenario", () => {
    for (const scenario of Object.values(scenarios)) {
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

  it("requires networking and PR models for those scenario kinds", () => {
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
    expect(() => validateScenario({ ...baseScenario, id: "invalidPr", kind: "pr" })).toThrow("invalidPr is missing prReview");
  });

  it("has auto-apply solution coverage for every scenario", () => {
    for (const scenario of Object.values(scenarios)) {
      expect(scenario.solution, `${scenario.id} is missing an auto-apply solution`).toBeDefined();
    }
  });

  it("has auto-apply solution replacements that match scenario files", () => {
    for (const scenario of Object.values(scenarios)) {
      if (!scenario.solution) continue;

      for (const replacement of scenario.solution.replacements ?? []) {
        const source = scenario.solution.files?.[replacement.fileName] ?? scenario.files[replacement.fileName];

        expect(source, `${scenario.id} replacement references missing file ${replacement.fileName}`).toBeDefined();
        expect(source, `${scenario.id} replacement for ${replacement.fileName} does not match the current lab file`).toContain(replacement.search);
      }
    }
  });
});
