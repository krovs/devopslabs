import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function gitopsFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "gitopsArgoCdTargetRevisionDrift") {
    const app = runtime.files["application.yaml"] ?? "";
    return app.includes("targetRevision: main") && !app.includes("targetRevision: develop");
  }

  if (scenarioId === "gitopsArgoCdPruneSelfHeal") {
    const app = runtime.files["application.yaml"] ?? "";
    return app.includes("automated:") && app.includes("prune: true") && app.includes("selfHeal: true");
  }

  if (scenarioId === "gitopsFluxWrongKustomizationPath") {
    const kustomization = runtime.files["kustomization.yaml"] ?? "";
    return kustomization.includes("path: ./clusters/prod/apps/checkout") && !kustomization.includes("path: ./clusters/staging/apps/checkout");
  }

  if (scenarioId === "gitopsFluxSuspendedKustomization") {
    const kustomization = runtime.files["kustomization.yaml"] ?? "";
    return kustomization.includes("suspend: false") && kustomization.includes("prune: true");
  }

  return false;
}

export function argocdAppGet(runtime: Scenario, scenarioId: string): string[] {
  if (!["gitopsArgoCdTargetRevisionDrift", "gitopsArgoCdPruneSelfHeal"].includes(scenarioId)) {
    return ["No Argo CD application is configured for this scenario."];
  }

  if (gitopsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "gitopsValidated", "Argo CD application reconciles the desired Git state.");
    return [
      "Name: checkout",
      "Health Status: Healthy",
      "Sync Status: Synced",
      "Operation: Succeeded",
    ];
  }

  markFirstResourceFailed(runtime, "Argo CD application is still OutOfSync.");
  return [
    "Name: checkout",
    "Health Status: Degraded",
    "Sync Status: OutOfSync",
    "Finding: target revision or automated sync policy does not match the desired state.",
  ];
}

export function fluxReconcileKustomization(runtime: Scenario, scenarioId: string): string[] {
  if (!["gitopsFluxWrongKustomizationPath", "gitopsFluxSuspendedKustomization"].includes(scenarioId)) {
    return ["No Flux Kustomization is configured for this scenario."];
  }

  if (gitopsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "gitopsValidated", "Flux Kustomization reconciles the intended source path.");
    return [
      "reconciling Kustomization platform/checkout",
      "applied revision main@sha1:6f3ab42",
      "Ready=True",
    ];
  }

  markFirstResourceFailed(runtime, "Flux Kustomization is still not ready.");
  return [
    "reconciling Kustomization platform/checkout",
    "Ready=False",
    "Finding: source path is wrong or reconciliation is suspended.",
  ];
}
