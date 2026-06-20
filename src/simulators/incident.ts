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

export function pagerdutyIncidentShow(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "incidentSev1CommandTriage") return ["PagerDuty incident is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (incidentFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "incidentValidated", "Incident INC-2041 has commander priya@acme.com, SEV1 severity, and detected status.");
    return [
      "Incident: INC-2041",
      "Service: checkout-api",
      "Status: detected",
      "Severity: SEV1",
      "Commander: priya@acme.com",
      "Created: 2026-06-19T09:03:00Z",
      "Acknowledged: 2026-06-19T09:05:00Z",
      "Urgency: high",
    ];
  }
  markFirstResourceFailed(runtime, "Incident INC-2041 has no commander, severity is SEV3, and status is investigating.");
  return [
    "Incident: INC-2041",
    "Service: checkout-api",
    "Status: investigating",
    "Severity: SEV3",
    "Commander: (unassigned)",
    "Created: 2026-06-19T09:03:00Z",
    "Acknowledged: 2026-06-19T09:05:00Z",
    "Urgency: high",
    "Finding: no incident commander assigned and severity is too low for a user-facing 5xx spike.",
  ];
}

export function postmortemReview(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "incidentPostmortemBlameless") return ["Postmortem review is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (incidentFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "incidentValidated", "Postmortem INC-2041 has a technical root cause, action items, and no blame language.");
    return [
      "postmortem review INC-2041",
      "rootCause: bad migration deployed without canary deploy.",
      "actionItems: add canary gate, require DB migration review, add rollback runbook.",
      "blame check: passed (no individual blame language detected)",
      "Status: ready for review",
    ];
  }
  markFirstResourceFailed(runtime, "Postmortem still has no root cause, no action items, or contains blame language.");
  return [
    "postmortem review INC-2041",
    "rootCause: (empty)",
    "actionItems: (empty)",
    "blame check: FAILED — 'Caused by dev pushing bad code without review.'",
    "Finding: postmortem needs a technical root cause, concrete action items, and blameless language.",
  ];
}

export function runbookValidate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "incidentRunbookExecutionGap") return ["Runbook validation is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (incidentFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "incidentValidated", "Runbook port matches the live checkout-api service on port 8080.");
    return [
      "runbook validate checkout-api",
      "service: checkout-api",
      "port: 8080 — matches live service",
      "healthCheck: /healthz",
      "restartCommand: sudo systemctl restart checkout-api",
      "drift check: passed",
    ];
  }
  markFirstResourceFailed(runtime, "Runbook port 9090 does not match the live checkout-api service on port 8080.");
  return [
    "runbook validate checkout-api",
    "service: checkout-api",
    "port: 9090 — DRIFT: live service listens on 8080",
    "healthCheck: /healthz",
    "restartCommand: sudo systemctl restart checkout-api",
    "Finding: runbook is stale. Update port to 8080.",
  ];
}

export function pagerdutyAlertsList(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "incidentAlertStormTriage") return ["PagerDuty alerts are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (incidentFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "incidentValidated", "Root alert db-cpu-100 identified, downstream symptom alerts suppressed.");
    return [
      "Service: checkout-api",
      "Alerts: 1 active, 3 suppressed",
      "  db-cpu-100        [triggered]  CPU > 95% on checkout-db     root_alert",
      "  api-latency-1     [suppressed] p99 > 1.5s on checkout-api  symptom",
      "  api-latency-2     [suppressed] p99 > 1.5s on checkout-api  symptom",
      "  queue-depth-1     [suppressed] depth > 1000 on checkout-q  symptom",
    ];
  }
  markFirstResourceFailed(runtime, "Alert storm: 4 active alerts with no root alert identified and no suppressions.");
  return [
    "Service: checkout-api",
    "Alerts: 4 active",
    "  db-cpu-100        [triggered]  CPU > 95% on checkout-db",
    "  api-latency-1     [triggered]  p99 > 1.5s on checkout-api",
    "  api-latency-2     [triggered]  p99 > 1.5s on checkout-api",
    "  queue-depth-1     [triggered]  depth > 1000 on checkout-q",
    "Finding: 4 active alerts with no root alert identified and no suppressions.",
  ];
}

export function statuspageIncidentShow(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "incidentCustomerFacingCommsDraft") return ["Statuspage is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (incidentFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "incidentValidated", "Status page has t+0, t+15, and t+60 updates with impact wording.");
    return [
      "Incident: INC-2041",
      "Status: monitoring",
      "Updates: 3",
      "  t+0   investigating  We are investigating checkout failures. impact: checkout API errors for 12% of orders.",
      "  t+15  identified      Root cause identified, mitigation in progress. impact: checkout API errors for 12% of orders.",
      "  t+60  mitigated        Mitigated, monitoring recovery. impact: checkout API errors for 12% of orders.",
    ];
  }
  markFirstResourceFailed(runtime, "Status page has no updates for the active incident INC-2041.");
  return [
    "Incident: INC-2041",
    "Status: investigating",
    "Updates: 0",
    "Finding: no status page updates published. Draft t+0, t+15, and t+60 updates.",
  ];
}
