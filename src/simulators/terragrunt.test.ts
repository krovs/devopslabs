import { describe, expect, it } from "vitest";
import { checkScenario, isScenarioSolved } from "../completion";
import type { Scenario } from "../types";
import { terragruntHclfmt, terragruntInit, terragruntPlan, terragruntValidate } from "./terragrunt";

describe("Terragrunt simulator", () => {
  it("formats semantically valid multiline HCL without requiring exact whitespace", () => {
    const scenario = terragruntHclfmtScenario(`include "root"
{
path = find_in_parent_folders()
}
terraform {
source = "../../../modules/app"
}
inputs = {
name = "orders-api"
}
`);

    expect(terragruntInit(scenario, "terragruntHclfmt")).toContain("Terraform has been successfully initialized by Terragrunt.");
    expect(terragruntHclfmt(scenario, "terragruntHclfmt")).toContain("terragrunt hclfmt formatted the file.");
    expect(scenario.files["live/dev/app/terragrunt.hcl"]).toContain('include "root" {\n  path = find_in_parent_folders()\n}');
    expect(terragruntValidate(scenario, "terragruntHclfmt")).toContain("Success! Terragrunt configuration is valid.");
    expect(terragruntPlan(scenario, "terragruntHclfmt")).toContain("No changes. Infrastructure matches the configuration.");

    expect(checkScenario(scenario, "terragruntHclfmt", "live/dev/app/terragrunt.hcl")).toEqual(["Scenario complete."]);
    expect(isScenarioSolved(scenario, "terragruntHclfmt", "live/dev/app/terragrunt.hcl")).toBe(true);
  });

  it("does not pass hclfmt when the required source is missing", () => {
    const scenario = terragruntHclfmtScenario(`include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../module/app"
}

inputs = {
  name = "orders-api"
}
`);

    expect(terragruntHclfmt(scenario, "terragruntHclfmt")).toContain(
      "terragrunt hclfmt could not format the file because the expected include, terraform source, or inputs block is missing.",
    );
    expect(scenario.flags.lintPassed).toBe(false);
  });
});

function terragruntHclfmtScenario(stackFile: string): Scenario {
  return {
    id: "terragruntHclfmt",
    kind: "terragrunt",
    title: "Terragrunt HCL Formatting Gate",
    description: "Test fixture.",
    primaryFile: "live/dev/app/terragrunt.hcl",
    files: {
      "live/dev/app/terragrunt.hcl": stackFile,
    },
    backend: {
      bucket: "tf-state-training",
      key: "live/dev/app/terraform.tfstate",
      table: "tf-locks",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "lint",
        name: "terragrunt hclfmt",
        id: "live/dev/app/terragrunt.hcl",
        status: "failed",
      },
    ],
    stateResources: [],
    flags: {
      initialized: false,
      cleanPlan: false,
      validationPassed: false,
      lintPassed: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Run hclfmt."],
      commands: ["terragrunt hclfmt", "terragrunt validate", "terragrunt plan"],
      explanation: "hclfmt formats valid HCL.",
      outcome: "Formatting gate passes.",
    },
  };
}
