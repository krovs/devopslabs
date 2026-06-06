import type { Scenario } from "../types";
import { markFirstResourceFailed } from "./shared";

const formattedHclfmtStack = `include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/app"
}

inputs = {
  name = "orders-api"
}`;

function hclfmtStackIsSemanticallyValid(stackFile: string): boolean {
  return (
    /include\s+"root"\s*\{[\s\S]*path\s*=\s*find_in_parent_folders\(\)[\s\S]*\}/.test(stackFile) &&
    /terraform\s*\{[\s\S]*source\s*=\s*"..\/..\/..\/modules\/app"[\s\S]*\}/.test(stackFile) &&
    /inputs\s*=\s*\{[\s\S]*name\s*=\s*"orders-api"[\s\S]*\}/.test(stackFile)
  );
}

function hclfmtStackIsFormatted(stackFile: string): boolean {
  return stackFile.trim() === formattedHclfmtStack;
}

export function terragruntInit(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "terragruntWrongSourceRef") {
    const stackFile = runtime.files["live/dev/app/terragrunt.hcl"] ?? "";
    const hasCorrectSource = stackFile.includes('source = "../../../modules/app"');

    if (!hasCorrectSource) {
      markFirstResourceFailed(runtime, "Terragrunt tried to use ../../../module/app, which does not exist.");
      return [
        "Initializing Terragrunt stack live/dev/app...",
        "Downloading Terraform configurations from ../../../module/app",
        "Error: Unreadable module directory",
        "lstat ../../../module/app: no such file or directory",
      ];
    }
  }

  runtime.flags.initialized = true;
  if (scenarioId === "terragruntWrongSourceRef") runtime.flags.validationPassed = true;
  if (runtime.awsResources[0]) runtime.awsResources[0].status = runtime.flags.validationPassed ? "exists" : runtime.awsResources[0].status;
  return [
    "Initializing Terragrunt stack...",
    `Remote state: s3://${runtime.backend.bucket}/${runtime.backend.key}`,
    "Terraform has been successfully initialized by Terragrunt.",
  ];
}

export function terragruntValidate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "terragruntMissingInclude") {
    const stackFile = runtime.files["live/dev/app/terragrunt.hcl"] ?? "";
    const hasInclude = stackFile.includes('include "root"') && stackFile.includes("find_in_parent_folders()");

    if (hasInclude) {
      runtime.flags.validationPassed = true;
      if (runtime.awsResources[0]) {
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "App stack inherits root remote_state and shared inputs.";
      }
      return ["Success! Terragrunt configuration is valid."];
    }

    return [
      "Error: Missing required variable",
      "The root input environment was not inherited by live/dev/app.",
      "Add include \"root\" { path = find_in_parent_folders() } to the child terragrunt.hcl.",
    ];
  }

  if (scenarioId === "terragruntBadDependencyOutput") {
    const networkFile = runtime.files["live/dev/network/terragrunt.hcl"] ?? "";
    const hasVpcIdOutput = networkFile.includes("vpc_id") && !networkFile.includes("vpcID");

    if (hasVpcIdOutput) {
      runtime.flags.validationPassed = true;
      if (runtime.awsResources[0]) {
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "Dependency mock_outputs now expose vpc_id.";
      }
      return ["Success! Terragrunt dependencies are valid."];
    }

    return [
      "Error: Unsupported attribute",
      "dependency.network.outputs does not have an attribute named vpc_id.",
      "The network mock_outputs block currently exposes vpcID.",
    ];
  }

  if (scenarioId === "terragruntHclfmt") {
    if (!runtime.flags.lintPassed) return ["Error: terragrunt.hcl files are not formatted. Run terragrunt hclfmt first."];
    runtime.flags.validationPassed = true;
    if (runtime.awsResources[0]) {
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Terragrunt HCL is formatted and validates.";
    }
    return ["Success! Terragrunt configuration is valid."];
  }

  runtime.flags.validationPassed = true;
  return ["Success! Terragrunt configuration is valid."];
}

export function terragruntPlan(runtime: Scenario, scenarioId: string): string[] {
  if (!runtime.flags.initialized) return ["Error: Terragrunt stack is not initialized. Run terragrunt init first."];
  if (!runtime.flags.validationPassed) return ["Error: Terragrunt validation failed. Run terragrunt validate and fix the configuration first."];
  if (scenarioId === "terragruntHclfmt" && !runtime.flags.lintPassed) return ["Plan blocked: terragrunt hclfmt is still failing."];

  runtime.flags.cleanPlan = true;
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = terragruntSuccessNote(scenarioId);
  }
  return [
    "Terragrunt will run terraform plan in the selected stack.",
    "",
    "No changes. Infrastructure matches the configuration.",
  ];
}

export function terragruntRunAllPlan(runtime: Scenario, scenarioId: string): string[] {
  if (!runtime.flags.initialized) runtime.flags.initialized = true;

  if (scenarioId === "terragruntBadDependencyOutput" && !runtime.flags.validationPassed) {
    return [
      "Running plan in dependency order:",
      "- live/dev/network",
      "- live/dev/app",
      "",
      "Error: Unsupported attribute",
      "dependency.network.outputs.vpc_id is not available.",
    ];
  }

  return terragruntPlan(runtime, scenarioId);
}

export function terragruntHclfmt(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "terragruntHclfmt") return ["All Terragrunt files are already formatted."];

  const stackFile = runtime.files["live/dev/app/terragrunt.hcl"] ?? "";
  const valid = hclfmtStackIsSemanticallyValid(stackFile);

  if (!valid) {
    return [
      "live/dev/app/terragrunt.hcl",
      "terragrunt hclfmt could not format the file because the expected include, terraform source, or inputs block is missing.",
      "Keep include root, source ../../../modules/app, and input name orders-api.",
    ];
  }

  if (!hclfmtStackIsFormatted(stackFile)) {
    runtime.files["live/dev/app/terragrunt.hcl"] = `${formattedHclfmtStack}\n`;
  }

  runtime.flags.lintPassed = true;
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = "terragrunt hclfmt passed.";
  }
  return hclfmtStackIsFormatted(stackFile)
    ? ["All Terragrunt files are formatted correctly."]
    : ["live/dev/app/terragrunt.hcl", "terragrunt hclfmt formatted the file.", "All Terragrunt files are formatted correctly."];
}

export function terragruntSuccessNote(scenarioId: string): string {
  if (scenarioId === "terragruntMissingInclude") return "Stack inherits root remote state and shared inputs.";
  if (scenarioId === "terragruntBadDependencyOutput") return "App stack can read dependency.network.outputs.vpc_id.";
  if (scenarioId === "terragruntWrongSourceRef") return "Stack source points at ../../../modules/app.";
  if (scenarioId === "terragruntHclfmt") return "Formatting gate passed before planning.";
  return "Terragrunt stack is healthy.";
}
