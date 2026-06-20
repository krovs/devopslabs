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

export function promtoolCheckSli(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "sreSliFormulationFromSignal") return ["promtool check sli is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (sreFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "sreValidated", "SLI formulated: good non-5xx requests over all requests with 99.9% threshold.");
    return [
      "promtool check sli checkout-api",
      "SLI: http_requests_total{status!~5..} / http_requests_total",
      "Availability target: 99.9% (threshold 0.999)",
      "Status: PASSED",
    ];
  }
  markFirstResourceFailed(runtime, "SLI not formulated; good events, total events, and availability threshold are empty.");
  return [
    "promtool check sli checkout-api",
    "SLI: (not defined)",
    "goodEvents: empty",
    "totalEvents: empty",
    "availabilityThreshold: 0",
    "Finding: define good events, total events, and availability threshold.",
  ];
}

export function promtoolCheckRules(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "sreErrorBudgetBurnRate") {
    runtime.flags.initialized = true;
    runtime.flags.validationPassed = true;
    if (sreFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "sreValidated", "Burn rate alert uses 5m fast window and 1h slow window with 14.4 and 6 thresholds.");
      return [
        "promtool check rules burn-rate-alerts",
        "alert: error-budget-burn",
        "fastBurnWindow: 5m   threshold: 14.4   PASS",
        "slowBurnWindow: 1h   threshold: 6     PASS",
        "Status: 0 errors",
      ];
    }
    markFirstResourceFailed(runtime, "Burn rate alert has no windows or thresholds configured.");
    return [
      "promtool check rules burn-rate-alerts",
      "alert: error-budget-burn",
      "fastBurnWindow: (empty)  threshold: 0   FAIL",
      "slowBurnWindow: (empty)  threshold: 0   FAIL",
      "Finding: set fast and slow burn windows and thresholds for a 99.9% SLO.",
    ];
  }

  if (scenarioId === "sreAlertSloBasedReplacement") {
    runtime.flags.initialized = true;
    runtime.flags.validationPassed = true;
    if (sreFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "sreValidated", "Alert replaced with SLO burn-rate alert at 14.4 rate, CPU threshold removed.");
      return [
        "promtool check rules checkout-api-capacity",
        "alert: checkout-api-capacity",
        "type: slo-burn  burnRate: 14.4",
        "cpuThreshold: removed",
        "Status: user-impact-aligned",
      ];
    }
    markFirstResourceFailed(runtime, "Alert is still a CPU threshold that does not map to user impact.");
    return [
      "promtool check rules checkout-api-capacity",
      "alert: checkout-api-capacity",
      "type: cpu-threshold  cpuThreshold: 90",
      "sloBurnRate: 0",
      "Finding: replace CPU threshold with SLO burn-rate alert.",
    ];
  }

  return ["promtool check rules is not configured for this lab."];
}

export function slothSloValidate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "sreSloTierMismatch") return ["sloth slo validate is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (sreFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "sreValidated", "checkout-api SLO aligned to tier 1 with 99.95% availability and strict error budget.");
    return [
      "sloth slo validate checkout-api",
      "Service: checkout-api",
      "Tier: 1   Availability: 99.95%   Budget: strict",
      "Status: PASSED — matches declared tier",
    ];
  }
  markFirstResourceFailed(runtime, "Tier-1 service is using a tier-3 SLO with 99.0% and lenient policy.");
  return [
    "sloth slo validate checkout-api",
    "Service: checkout-api (declared tier 1)",
    "Tier: 3   Availability: 99.0%   Budget: lenient",
    "MISMATCH: tier-1 service should have 99.95% availability and strict policy.",
  ];
}

export function sreToilAudit(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "sreToilBudgetExceeded") return ["sre toil audit is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (sreFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "sreValidated", "Toil brought to 45% with automation proposed for manual-db-restart.");
    return [
      "sre toil audit platform-team",
      "Team: platform   Toil: 45%   Budget: 50%",
      "Repeat offender: manual-db-restart",
      "Automation proposed: true",
      "Status: within budget",
    ];
  }
  markFirstResourceFailed(runtime, "Toil at 70% exceeds the 50% budget; no automation proposed.");
  return [
    "sre toil audit platform-team",
    "Team: platform   Toil: 70%   Budget: 50% (EXCEEDED)",
    "Repeat offender: manual-db-restart",
    "Automation proposed: false",
    "Finding: toil over budget. Propose automation for the repeat offender.",
  ];
}
