import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function incidentFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "incidentSev1CommandTriage") {
    const file = runtime.files["incident.json"] ?? "";
    return (
      file.includes('"commander": "priya@acme.com"') &&
      file.includes('"severity": "SEV1"') &&
      file.includes('"status": "detected"')
    );
  }

  if (scenarioId === "incidentPostmortemBlameless") {
    const file = runtime.files["postmortem.md"] ?? "";
    return (
      file.includes("rootCause: bad migration deployed without canary deploy.") &&
      file.includes("actionItems: add canary gate, require DB migration review, add rollback runbook.") &&
      !file.includes("Caused by dev")
    );
  }

  if (scenarioId === "incidentRunbookExecutionGap") {
    const file = runtime.files["runbook.yaml"] ?? "";
    return file.includes("port: 8080") && !file.includes("port: 9090");
  }

  if (scenarioId === "incidentAlertStormTriage") {
    const file = runtime.files["alerts.json"] ?? "";
    return (
      file.includes('"rootAlertId": "db-cpu-100"') &&
      file.includes('"suppressed": ["api-latency-1", "api-latency-2", "queue-depth-1"]')
    );
  }

  if (scenarioId === "incidentCustomerFacingCommsDraft") {
    const file = runtime.files["status-update.json"] ?? "";
    return (
      file.includes('"time": "t+0"') &&
      file.includes('"time": "t+15"') &&
      file.includes('"time": "t+60"') &&
      file.includes("impact: checkout API errors for 12% of orders")
    );
  }

  return false;
}

export function incidentValidate(runtime: Scenario, scenarioId: string): string[] {
  if (incidentFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "incidentValidated", "Incident response artifact meets the required on-call process state.");
    return ["incident validate: passed", "Incident response artifact meets the required on-call process state."];
  }

  markFirstResourceFailed(runtime, "Incident response artifact still misses the required commander, severity, root cause, alert root, comms draft, or runbook fix.");
  return ["incident validate: failed", "Incident response artifact still misses the required commander, severity, root cause, alert root, comms draft, or runbook fix."];
}
