import type { Scenario } from "../types";

const DATASET_VERSION = "churn-2026-05-17";
const REQUIRED_APPROVAL = "security-review";
const REQUIRED_APPROVER = "ml-risk-board";
const PRODUCTION_STAGE = "production";

function markFirstResource(runtime: Scenario, status: string, note: string): void {
  if (!runtime.awsResources[0]) return;
  runtime.awsResources[0].status = status;
  runtime.awsResources[0].note = note;
}

function file(runtime: Scenario, fileName: string): string {
  return runtime.files[fileName] ?? "";
}

export function mlopsFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "mlopsTrainingDatasetVersion") {
    return file(runtime, "pipeline.yaml").includes(`version: ${DATASET_VERSION}`);
  }

  if (scenarioId === "mlopsModelRegistryPromotionGate") {
    const modelCard = file(runtime, "model-card.md");
    return (
      modelCard.includes(`Approval: ${REQUIRED_APPROVAL}`) &&
      modelCard.includes(`Approved by: ${REQUIRED_APPROVER}`) &&
      modelCard.includes(`Target stage: ${PRODUCTION_STAGE}`)
    );
  }

  return false;
}

export function mlPipelineStatus(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;

  if (scenarioId !== "mlopsTrainingDatasetVersion") {
    return ["ml pipeline status", "No training pipeline is configured for this lab."];
  }

  if (mlopsFixApplied(runtime, scenarioId)) {
    return [
      "pipeline: churn-risk-training",
      "status: ready",
      `dataset: customer-churn@${DATASET_VERSION}`,
      "policy: immutable dataset version is pinned",
    ];
  }

  markFirstResource(runtime, "failed", "Training is blocked because dataset.version is latest.");
  return [
    "pipeline: churn-risk-training",
    "status: failed",
    "failed step: resolve-dataset",
    "reason: dataset.version latest is not allowed for production candidate training",
  ];
}

export function mlArtifactsList(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;

  if (scenarioId !== "mlopsTrainingDatasetVersion") {
    return ["artifact registry", "No dataset artifacts are configured for this lab."];
  }

  return [
    "artifact registry",
    "customer-churn@churn-2026-05-03 status=archived quality=passed",
    `customer-churn@${DATASET_VERSION} status=approved quality=passed pii=reviewed`,
    "customer-churn@latest status=alias quality=not-allowed-for-production",
  ];
}

export function mlPipelineRun(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;

  if (scenarioId !== "mlopsTrainingDatasetVersion") {
    return ["ml pipeline run", "No training pipeline is configured for this lab."];
  }

  if (!mlopsFixApplied(runtime, scenarioId)) {
    runtime.flags.runPassing = false;
    markFirstResource(runtime, "failed", "Training is still blocked because the dataset version is not pinned.");
    return [
      "pipeline run submitted",
      "resolve-dataset: failed",
      "reason: dataset.version must be an approved immutable artifact version",
    ];
  }

  runtime.flags.validationPassed = true;
  runtime.flags.runPassing = true;
  runtime.stateResources = runtime.stateResources.map((resource) => {
    if (resource.address === "artifact.customer-churn") return { ...resource, id: DATASET_VERSION };
    if (resource.address === "model.churn-risk") return { ...resource, id: "candidate-ready" };
    return resource;
  });
  markFirstResource(runtime, "success", "Training pipeline completed with the approved dataset artifact.");
  return [
    "pipeline run submitted",
    `resolve-dataset: customer-churn@${DATASET_VERSION}`,
    "train: completed",
    "evaluate: auc=0.923 threshold=0.91 result=pass",
    "candidate: churn-risk@candidate-ready",
  ];
}

export function mlModelDescribe(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;

  if (scenarioId !== "mlopsModelRegistryPromotionGate") {
    return ["model registry", "No model registry gate is configured for this lab."];
  }

  return [
    "model: fraud-detector",
    "version: v42",
    "stage: candidate",
    "validation_auc: 0.947 required>=0.94 result=pass",
    "bias_review: passed",
    "promotion_gate: blocked",
    "missing: Approval security-review, Approved by ml-risk-board, Target stage production",
  ];
}

export function mlModelPromote(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;

  if (scenarioId !== "mlopsModelRegistryPromotionGate") {
    return ["ml model promote", "No model registry gate is configured for this lab."];
  }

  if (!mlopsFixApplied(runtime, scenarioId)) {
    runtime.flags.runPassing = false;
    markFirstResource(runtime, "failed", "Promotion is still blocked by missing approval metadata.");
    return [
      "promotion request: fraud-detector:v42",
      "metric gate: pass",
      "bias gate: pass",
      "approval gate: failed",
      "reason: model-card.md must record security-review approval by ml-risk-board for production",
    ];
  }

  runtime.flags.validationPassed = true;
  runtime.flags.runPassing = true;
  runtime.stateResources = runtime.stateResources.map((resource) => {
    if (resource.address === "model.fraud-detector.v42") return { ...resource, id: "production" };
    if (resource.address === "gate.security-review") return { ...resource, id: "approved" };
    return resource;
  });
  markFirstResource(runtime, "success", "Model registry promoted fraud-detector:v42 to production with required approval metadata.");
  return [
    "promotion request: fraud-detector:v42",
    "metric gate: pass",
    "bias gate: pass",
    "approval gate: pass",
    "stage: production",
  ];
}

export function markMlopsScenarioSolved(runtime: Scenario): void {
  runtime.flags.mlopsValidated = true;
  markFirstResource(runtime, "success", "MLOps validation passed.");
}
