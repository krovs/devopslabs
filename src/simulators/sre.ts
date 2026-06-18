import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function sreFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "sreSliFormulationFromSignal") {
    const file = runtime.files["sli.json"] ?? "";
    return (
      file.includes('"goodEvents": "http_requests_total{status!~5..}"') &&
      file.includes('"totalEvents": "http_requests_total"') &&
      file.includes('"availabilityThreshold": 0.999')
    );
  }

  if (scenarioId === "sreErrorBudgetBurnRate") {
    const file = runtime.files["alert.json"] ?? "";
    return (
      file.includes('"fastBurnWindow": "5m"') &&
      file.includes('"slowBurnWindow": "1h"') &&
      file.includes('"fastThreshold": 14.4') &&
      file.includes('"slowThreshold": 6')
    );
  }

  if (scenarioId === "sreSloTierMismatch") {
    const file = runtime.files["slo.json"] ?? "";
    return (
      file.includes('"tier": 1') &&
      file.includes('"availabilityTarget": 99.95') &&
      file.includes('"errorBudgetPolicy": "strict"')
    );
  }

  if (scenarioId === "sreToilBudgetExceeded") {
    const file = runtime.files["toil.json"] ?? "";
    return file.includes('"toilPercent": 45') && file.includes('"automationProposed": true');
  }

  if (scenarioId === "sreAlertSloBasedReplacement") {
    const file = runtime.files["alert.json"] ?? "";
    return (
      file.includes('"alertType": "slo-burn"') &&
      file.includes('"cpuThreshold": 0') &&
      file.includes('"sloBurnRate": 14.4')
    );
  }

  return false;
}

export function sreValidate(runtime: Scenario, scenarioId: string): string[] {
  if (sreFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "sreValidated", "SRE/SLO configuration passed.");
    return ["sre validate: passed", "SRE/SLO configuration passed."];
  }

  markFirstResourceFailed(runtime, "SLO configuration still has the wrong SLI, burn rate, tier, toil budget, or alert type.");
  return ["sre validate: failed", "SLO configuration still has the wrong SLI, burn rate, tier, toil budget, or alert type."];
}
