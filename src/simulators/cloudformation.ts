import type { Scenario } from "../types";

export function cloudformationFixApplied(runtime: Scenario): boolean {
  const template = runtime.files["template.yaml"] ?? "";
  return (
    template.includes("AccessControl: Private") &&
    !template.includes("AccessControl: PublicRead")
  );
}

export function cloudformationValidateTemplate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") return ["Template validation is not configured for this lab."];

  if (cloudformationFixApplied(runtime)) {
    runtime.flags.lintPassed = true;
    return [
      "Validating template.yaml ...",
      "Template format: YAML",
      "Template description: S3 bucket for checkout API artifacts",
      "Resource count: 1",
      "Resources:",
      "  AWS::S3::Bucket CheckoutArtifacts OK",
      "AccessControl: Private",
      "PublicAccessBlockConfiguration: BlockPublicAcls=true BlockPublicPolicy=true IgnorePublicAcls=true RestrictPublicBuckets=true",
      "Template validation passed.",
    ];
  }

  return [
    "Validating template.yaml ...",
    "Template format: YAML",
    "Template description: S3 bucket for checkout API artifacts",
    "Resource count: 1",
    "Resources:",
    "  AWS::S3::Bucket CheckoutArtifacts FAILED",
    "CKV_AWS_20: S3 bucket should not allow public-read ACL.",
    "AccessControl: PublicRead — change to Private and add PublicAccessBlockConfiguration.",
    "Template validation failed.",
  ];
}

export function cloudformationCreateChangeSet(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") return ["Change set creation is not configured for this lab."];
  runtime.flags.initialized = true;

  if (cloudformationFixApplied(runtime)) {
    runtime.flags.validationPassed = true;
    return [
      "ChangeSetName: checkout-api-private-fix",
      "StackName: checkout-api-artifacts",
      "Status: CREATE_COMPLETE",
      "Change set includes:",
      "  Modify AWS::S3::Bucket CheckoutArtifacts",
      "    AccessControl: PublicRead -> Private",
      "  Add PublicAccessBlockConfiguration",
      "Changes: 1 modified, 1 added",
    ];
  }

  return [
    "ChangeSetName: checkout-api-public-bucket",
    "StackName: checkout-api-artifacts",
    "Status: CREATE_COMPLETE",
    "Change set includes:",
    "  Add AWS::S3::Bucket CheckoutArtifacts",
    "    AccessControl: PublicRead",
    "No PublicAccessBlockConfiguration present.",
  ];
}

export function cloudformationDescribeStackEvents(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") return ["Stack events are not configured for this lab."];
  runtime.flags.validationPassed = true;

  return [
    "StackName: checkout-api-artifacts",
    "StackStatus: UPDATE_COMPLETE",
    "Events:",
    "  2026-06-11T14:22:01Z AWS::CloudFormation::Stack checkout-api-artifacts UPDATE_IN_PROGRESS",
    "  2026-06-11T14:22:18Z AWS::S3::Bucket CheckoutArtifacts UPDATE_IN_PROGRESS",
    "  2026-06-11T14:22:26Z AWS::S3::Bucket CheckoutArtifacts UPDATE_COMPLETE",
    "  2026-06-11T14:22:28Z AWS::CloudFormation::Stack checkout-api-artifacts UPDATE_COMPLETE",
    "Last update changed AccessControl to PublicRead and removed PublicAccessBlockConfiguration.",
  ];
}

export function cloudformationDetectStackDrift(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") return ["Drift detection is not configured for this lab."];
  runtime.flags.cleanPlan = true;

  return [
    "StackName: checkout-api-artifacts",
    "DriftStatus: DRIFTED",
    "Drifted resources:",
    "  AWS::S3::Bucket CheckoutArtifacts",
    "    Property: AccessControl",
    "    Expected: Private (per original template)",
    "    Actual: PublicRead",
    "    Difference: bucket ACL was changed outside of CloudFormation",
    "    Property: PublicAccessBlockConfiguration",
    "    Expected: BlockPublicAcls=true",
    "    Actual: not present",
    "Drift detected: someone modified the bucket directly in the AWS console.",
  ];
}

export function markCloudformationScenarioSolved(runtime: Scenario): void {
  runtime.flags.cloudformationValidated = true;
}
