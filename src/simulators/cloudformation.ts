import type { Scenario } from "../types";

function markResource(runtime: Scenario, index: number, status: string, note: string): void {
  const resource = runtime.awsResources[index];
  if (resource) {
    resource.status = status;
    resource.note = note;
  }
}

export function cloudformationFixApplied(runtime: Scenario, scenarioId: string): boolean {
  const template = runtime.files["template.yaml"] ?? "";
  if (scenarioId === "cloudFormationDriftDetection") {
    return template.includes("AccessControl: Private") && !template.includes("AccessControl: PublicRead");
  }
  if (scenarioId === "cfnStackPolicyDenyUpdate") {
    return (
      template.includes("rds:ModifyDBInstance") &&
      template.includes("rds:DescribeDBInstances") &&
      template.includes("Effect: Allow")
    );
  }
  if (scenarioId === "cfnRollbackFailedContinue") {
    const rollback = runtime.files["rollback.json"] ?? "";
    return (
      rollback.includes('"action": "continue-update-rollback"') &&
      rollback.includes('"skipResource": "CheckoutDatabase"')
    );
  }
  if (scenarioId === "cfnNestedStackParameterMismatch") {
    const parent = runtime.files["parent.yaml"] ?? "";
    return parent.includes("DatabaseName") && !parent.includes("DBName");
  }
  if (scenarioId === "cfnIamCapabilityMissing") {
    const deploy = runtime.files["deploy.json"] ?? "";
    return deploy.includes("CAPABILITY_IAM");
  }
  if (scenarioId === "cfnExportImportConflict") {
    const importer = runtime.files["importer.yaml"] ?? "";
    return importer.includes("vpc-abc123def456") && !importer.includes("Fn::ImportValue");
  }
  if (scenarioId === "cfnStackSetInstanceFailed") {
    const fix = runtime.files["fix.json"] ?? "";
    return (
      fix.includes('"trusted": true') &&
      fix.includes('"action": "trust-execution-role"')
    );
  }
  return false;
}

export function cloudformationValidateTemplate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") {
    runtime.flags.lintPassed = true;
    return ["Validating template...", "Template format: YAML", "Template syntax: valid", "Template validation passed. Use the scenario-specific diagnostic command to inspect the configuration issue."];
  }

  if (cloudformationFixApplied(runtime, scenarioId)) {
    runtime.flags.lintPassed = true;
    markResource(runtime, 1, "exists", "S3 bucket ACL is Private and PublicAccessBlockConfiguration is present.");
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
  if (scenarioId !== "cloudFormationDriftDetection") {
    runtime.flags.initialized = true;
    return ["Change set not applicable for this scenario. Use the scenario-specific diagnostic command instead."];
  }
  runtime.flags.initialized = true;

  if (cloudformationFixApplied(runtime, scenarioId)) {
    runtime.flags.validationPassed = true;
    markResource(runtime, 0, "drifted", "Change set ready: AccessControl -> Private, PublicAccessBlockConfiguration added.");
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
  if (scenarioId === "cfnRollbackFailedContinue") {
    runtime.flags.initialized = true;
    runtime.flags.validationPassed = true;
    if (cloudformationFixApplied(runtime, scenarioId)) {
      runtime.flags.lintPassed = true;
      runtime.flags.cleanPlan = true;
      markResource(runtime, 0, "success", "Rollback continued. CheckoutDatabase skipped, stack recovered to UPDATE_ROLLBACK_COMPLETE.");
      return [
        "StackName: checkout-api-artifacts",
        "StackStatus: UPDATE_ROLLBACK_COMPLETE",
        "Events:",
        "  2026-06-19T14:30:00Z AWS::CloudFormation::Stack checkout-api-artifacts UPDATE_ROLLBACK_IN_PROGRESS",
        "  2026-06-19T14:30:15Z AWS::RDS::DBInstance CheckoutDatabase UPDATE_ROLLBACK_FAILED",
        "  2026-06-19T14:30:45Z AWS::CloudFormation::Stack checkout-api-artifacts UPDATE_ROLLBACK_COMPLETE",
        "  2026-06-19T14:30:45Z Resource skipped: CheckoutDatabase (DeletionPolicy: Retain)",
      ];
    }
    markResource(runtime, 0, "failed", "Stack stuck in UPDATE_ROLLBACK_FAILED. Continue rollback skipping the RDS resource.");
    return [
      "StackName: checkout-api-artifacts",
      "StackStatus: UPDATE_ROLLBACK_FAILED",
      "Events:",
      "  2026-06-19T14:25:00Z AWS::CloudFormation::Stack checkout-api-artifacts UPDATE_ROLLBACK_IN_PROGRESS",
      "  2026-06-19T14:25:12Z AWS::RDS::DBInstance CheckoutDatabase DELETE_FAILED",
      "      Reason: RDS instance has termination protection enabled.",
      "  2026-06-19T14:25:45Z AWS::CloudFormation::Stack checkout-api-artifacts UPDATE_ROLLBACK_FAILED",
      "Finding: stack stuck. Continue rollback, skipping CheckoutDatabase.",
    ];
  }

  if (scenarioId === "cfnIamCapabilityMissing") {
    runtime.flags.validationPassed = true;
    runtime.flags.cleanPlan = true;
    if (cloudformationFixApplied(runtime, scenarioId)) {
      runtime.flags.initialized = true;
      runtime.flags.lintPassed = true;
      markResource(runtime, 0, "drifted", "CAPABILITY_IAM added, stack can now create IAM resources.");
      return [
        "StackName: checkout-iam-role",
        "StackStatus: CREATE_COMPLETE",
        "Events:",
        "  2026-06-19T15:10:00Z AWS::CloudFormation::Stack checkout-iam-role CREATE_IN_PROGRESS",
        "  2026-06-19T15:10:22Z AWS::IAM::Role CheckoutServiceRole CREATE_COMPLETE",
        "  2026-06-19T15:10:28Z AWS::CloudFormation::Stack checkout-iam-role CREATE_COMPLETE",
      ];
    }
    markResource(runtime, 0, "failed", "Stack creation failed because CAPABILITY_IAM was not specified for the IAM role resource.");
    return [
      "StackName: checkout-iam-role",
      "StackStatus: ROLLBACK_COMPLETE",
      "Events:",
      "  2026-06-19T15:10:00Z AWS::CloudFormation::Stack checkout-iam-role CREATE_IN_PROGRESS",
      "  2026-06-19T15:10:22Z AWS::IAM::Role CheckoutServiceRole CREATE_FAILED",
      "      Reason: Requires capabilities: [CAPABILITY_IAM]",
      "  2026-06-19T15:10:28Z AWS::CloudFormation::Stack checkout-iam-role ROLLBACK_IN_PROGRESS",
      "  2026-06-19T15:10:35Z AWS::CloudFormation::Stack checkout-iam-role ROLLBACK_COMPLETE",
      "Finding: add CAPABILITY_IAM to acknowledge creation of IAM resources.",
    ];
  }

  if (scenarioId !== "cloudFormationDriftDetection") {
    runtime.flags.validationPassed = true;
    return ["Stack events retrieved.", "Run the scenario-specific diagnostic command to inspect the configuration."];
  }
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

export function cfnGetStackPolicy(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cfnStackPolicyDenyUpdate") return ["Stack policy is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (cloudformationFixApplied(runtime, scenarioId)) {
    runtime.flags.lintPassed = true;
    runtime.flags.cleanPlan = true;
    markResource(runtime, 0, "drifted", "Stack policy updated: Allow rds:ModifyDBInstance and rds:DescribeDBInstances for the RDS change set.");
    return [
      "StackName: checkout-api-artifacts",
      "StackPolicy:",
      "  Statement:",
      "    Effect: Deny",
      "    Principal: *",
      "    Action: Update:*",
      "    Resource: *",
      "    Condition: StringEquals { ResourceType: [AWS::RDS::DBInstance] }",
      "  Statement:",
      "    Effect: Allow",
      "    Principal: *",
      "    Action: [rds:ModifyDBInstance, rds:DescribeDBInstances]",
      "    Resource: LogicalResourceId/CheckoutDatabase",
    ];
  }
  markResource(runtime, 0, "failed", "Stack update blocked by stack policy denying all RDS modifications.");
  return [
    "StackName: checkout-api-artifacts",
    "StackPolicy:",
    "  Statement:",
    "    Effect: Deny",
    "    Principal: *",
    "    Action: Update:*",
    "    Resource: *",
    "    Condition: StringEquals { ResourceType: [AWS::RDS::DBInstance] }",
    "Finding: stack policy denies all RDS updates. Add an Allow statement for the specific change.",
  ];
}

export function cfnDescribeStacks(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cfnNestedStackParameterMismatch") return ["Describe-stacks is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (cloudformationFixApplied(runtime, scenarioId)) {
    runtime.flags.lintPassed = true;
    runtime.flags.cleanPlan = true;
    markResource(runtime, 0, "success", "Nested stack created: parameter DatabaseName correctly mapped from parent.");
    return [
      "StackName: checkout-nested",
      "StackStatus: CREATE_COMPLETE",
      "Parent: checkout-parent",
      "Parameters:",
      "  DatabaseName: checkout-prod",
      "  Engine: aurora-postgresql",
      "  InstanceClass: db.r6g.large",
      "Resources: 1 created (AWS::RDS::DBCluster)",
    ];
  }
  markResource(runtime, 0, "failed", "Nested stack failed: parent passes DBName, child expects DatabaseName.");
  return [
    "StackName: checkout-nested",
    "StackStatus: ROLLBACK_COMPLETE",
    "Parent: checkout-parent",
    "Parameter mismatch: parent passes 'DBName', but child template expects 'DatabaseName'",
    "Finding: fix the parameter name in parent.yaml to match the child template.",
  ];
}

export function cfnListExports(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cfnExportImportConflict") return ["List-exports is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (cloudformationFixApplied(runtime, scenarioId)) {
    runtime.flags.lintPassed = true;
    runtime.flags.cleanPlan = true;
    markResource(runtime, 0, "success", "Importer stack updated: hardcoded VPC ID replaces Fn::ImportValue. Exporting stack deletion now unblocked.");
    return [
      "Exports:",
      "  checkout-vpc-id  vpc-abc123def456  used-by: 0 stacks",
      "  checkout-subnet-a  subnet-789  used-by: 1 stacks",
      "No cross-stack references to checkout-vpc-id. Exporting stack can be safely deleted.",
    ];
  }
  markResource(runtime, 0, "failed", "Export checkout-vpc-id still imported by another stack. Remove Fn::ImportValue first.");
  return [
    "Exports:",
    "  checkout-vpc-id  vpc-abc123def456  used-by: 1 stacks",
    "    Importing stack: checkout-importer",
    "  checkout-subnet-a  subnet-789  used-by: 1 stacks",
    "Finding: checkout-vpc-id is imported by checkout-importer. Replace Fn::ImportValue with the hardcoded VPC ID.",
  ];
}

export function cloudformationDetectStackDrift(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") {
    runtime.flags.cleanPlan = true;
    return ["Drift detection not applicable for this scenario. Use the scenario-specific diagnostic command instead."];
  }
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

export function cloudformationUpdateStack(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cloudFormationDriftDetection") {
    runtime.flags.validationPassed = true;
    runtime.flags.cleanPlan = true;
    runtime.flags.lintPassed = true;
    return ["Stack update not applicable for this scenario. The configuration fix has been applied through the primary file."];
  }

  if (!cloudformationFixApplied(runtime, scenarioId)) {
    return [
      "Error: template validation failed.",
      "Fix the template first: change AccessControl to Private and add PublicAccessBlockConfiguration.",
    ];
  }

  runtime.flags.cleanPlan = true;
  runtime.flags.validationPassed = true;
  markResource(runtime, 0, "success", "Stack updated: AccessControl set to Private with full public access block.");
  markResource(runtime, 1, "success", "Bucket ACL is Private. PublicAccessBlockConfiguration prevents public exposure.");
  return [
    "StackId: arn:aws:cloudformation:eu-west-1:123456789012:stack/checkout-api-artifacts",
    "Status: UPDATE_COMPLETE",
    "Modified resources:",
    "  AWS::S3::Bucket CheckoutArtifacts — AccessControl: Private, PublicAccessBlockConfiguration applied",
    "Drift status: IN_SYNC",
    "Stack update complete.",
  ];
}

export function markCloudformationScenarioSolved(runtime: Scenario): void {
  runtime.flags.cloudformationValidated = true;
}

export function cfnListStackInstances(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "cfnStackSetInstanceFailed") return ["StackSet instances are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (cloudformationFixApplied(runtime, scenarioId)) {
    runtime.flags.lintPassed = true;
    runtime.flags.cleanPlan = true;
    markResource(runtime, 0, "success", "StackSet instance trusted. Execution role registered for account 210987654321. Operations resumed.");
    return [
      "StackSet: checkout-baseline",
      "Instances:",
      "  Account: 123456789012  Region: eu-west-1  Status: CURRENT  Drift: IN_SYNC",
      "  Account: 123456789012  Region: eu-west-2  Status: CURRENT  Drift: IN_SYNC",
      "  Account: 210987654321  Region: eu-west-1  Status: CURRENT  Drift: IN_SYNC",
      "All 3 instances in sync.",
    ];
  }
  markResource(runtime, 0, "failed", "StackSet instance failed in account 210987654321. Execution role not trusted in target account.");
  return [
    "StackSet: checkout-baseline",
    "AdministrationRole: AWSCloudFormationStackSetAdministrationRole",
    "ExecutionRole: AWSCloudFormationStackSetExecutionRole",
    "Instances:",
    "  Account: 123456789012  Region: eu-west-1  Status: CURRENT  Drift: IN_SYNC",
    "  Account: 123456789012  Region: eu-west-2  Status: CURRENT  Drift: IN_SYNC",
    "  Account: 210987654321  Region: eu-west-1  Status: FAILED  Reason: ExecutionRole not trusted in target account",
    "Finding: register the execution role as trusted in account 210987654321.",
  ];
}
