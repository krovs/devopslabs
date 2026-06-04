import { describe, expect, it } from "vitest";
import { checkScenario, isScenarioSolved } from "../completion";
import type { Scenario } from "../types";
import { mlArtifactsList, mlModelDescribe, mlModelPromote, mlPipelineRun, mlPipelineStatus } from "./mlops";

describe("MLOps simulator", () => {
  it("solves the training dataset scenario after pinning the approved artifact and running the pipeline", () => {
    const scenario = trainingScenario("churn-2026-05-17");

    expect(mlPipelineStatus(scenario, "mlopsTrainingDatasetVersion")).toContain("status: ready");
    expect(mlArtifactsList(scenario, "mlopsTrainingDatasetVersion")).toContain(
      "customer-churn@churn-2026-05-17 status=approved quality=passed pii=reviewed",
    );
    expect(mlPipelineRun(scenario, "mlopsTrainingDatasetVersion")).toContain("candidate: churn-risk@candidate-ready");

    expect(checkScenario(scenario, "mlopsTrainingDatasetVersion", "pipeline.yaml")).toEqual(["Scenario complete."]);
    expect(isScenarioSolved(scenario, "mlopsTrainingDatasetVersion", "pipeline.yaml")).toBe(true);
    expect(scenario.stateResources.find((resource) => resource.address === "artifact.customer-churn")?.id).toBe("churn-2026-05-17");
  });

  it("does not solve the training dataset scenario before validation runs", () => {
    const scenario = trainingScenario("churn-2026-05-17");
    mlPipelineStatus(scenario, "mlopsTrainingDatasetVersion");

    expect(checkScenario(scenario, "mlopsTrainingDatasetVersion", "pipeline.yaml")).toEqual([
      "Not complete: run the MLOps validation command after applying the fix.",
    ]);
  });

  it("solves the registry promotion scenario after approval metadata is fixed and promoted", () => {
    const scenario = registryScenario({
      approval: "security-review",
      approver: "ml-risk-board",
      stage: "production",
    });

    expect(mlModelDescribe(scenario, "mlopsModelRegistryPromotionGate")).toContain("promotion_gate: blocked");
    expect(mlModelPromote(scenario, "mlopsModelRegistryPromotionGate")).toContain("stage: production");

    expect(checkScenario(scenario, "mlopsModelRegistryPromotionGate", "model-card.md")).toEqual(["Scenario complete."]);
    expect(isScenarioSolved(scenario, "mlopsModelRegistryPromotionGate", "model-card.md")).toBe(true);
    expect(scenario.stateResources.find((resource) => resource.address === "gate.security-review")?.id).toBe("approved");
  });
});

function trainingScenario(version: string): Scenario {
  return {
    id: "mlopsTrainingDatasetVersion",
    kind: "mlops",
    title: "MLOps Training Dataset Version",
    description: "Test fixture.",
    primaryFile: "pipeline.yaml",
    files: {
      "pipeline.yaml": `dataset:\n  version: ${version}\n`,
    },
    backend: {
      bucket: "mlops",
      key: "churn-risk-training",
      table: "model-runs",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "ml_pipeline",
        name: "churn-risk-training",
        id: "run-20260604-0913",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "artifact.customer-churn", id: "latest" },
      { address: "model.churn-risk", id: "missing-candidate" },
    ],
    flags: {
      initialized: false,
      validationPassed: false,
      runPassing: false,
      mlopsValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Pin the dataset version."],
      commands: ["ml pipeline run"],
      explanation: "The run must use an immutable dataset artifact.",
      outcome: "Pipeline passes.",
    },
  };
}

function registryScenario({
  approval,
  approver,
  stage,
}: {
  approval: string;
  approver: string;
  stage: string;
}): Scenario {
  return {
    id: "mlopsModelRegistryPromotionGate",
    kind: "mlops",
    title: "MLOps Model Registry Promotion Gate",
    description: "Test fixture.",
    primaryFile: "model-card.md",
    files: {
      "model-card.md": `Approval: ${approval}\nApproved by: ${approver}\nTarget stage: ${stage}\n`,
    },
    backend: {
      bucket: "mlops",
      key: "fraud-detector-registry",
      table: "model-registry",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "model_registry",
        name: "fraud-detector",
        id: "fraud-detector:v42",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "model.fraud-detector.v42", id: "candidate" },
      { address: "gate.security-review", id: "pending" },
    ],
    flags: {
      initialized: false,
      validationPassed: false,
      runPassing: false,
      mlopsValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Add approval metadata."],
      commands: ["ml model promote"],
      explanation: "Promotion requires model governance metadata.",
      outcome: "Model is promoted.",
    },
  };
}
