import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function drFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "drRdsFailoverVerify") {
    const file = runtime.files["failover.json"] ?? "";
    return (
      file.includes('"action": "promote"') &&
      file.includes('"replicaHealth": "healthy"') &&
      file.includes('"appReconnectVerified": true')
    );
  }

  if (scenarioId === "drRegionFailoverDrill") {
    const file = runtime.files["failover.yaml"] ?? "";
    return (
      file.includes("primary: 0") &&
      file.includes("dr: 100") &&
      file.includes("db: passed") &&
      file.includes("cache: passed") &&
      file.includes("queue: passed")
    );
  }

  if (scenarioId === "drBackupRestoreIntegrity") {
    const file = runtime.files["restore.json"] ?? "";
    return (
      file.includes('"action": "restore"') &&
      file.includes('"checksumDiff": "match"') &&
      file.includes('"rowCountDiff": "match"')
    );
  }

  if (scenarioId === "drRpoRtoCalculation") {
    const file = runtime.files["slo.json"] ?? "";
    return file.includes('"achievedRpoMinutes": 15') && file.includes('"achievedRtoMinutes": 60');
  }

  if (scenarioId === "drCrossRegionReplicationLag") {
    const file = runtime.files["crr.json"] ?? "";
    return file.includes('"status": "active"') && file.includes('"scope": "all"');
  }

  return false;
}

export function drValidate(runtime: Scenario, scenarioId: string): string[] {
  if (drFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "drValidated", "Disaster recovery configuration meets the required RTO/RPO and failover state.");
    return ["dr validate: passed", "Disaster recovery configuration meets the required RTO/RPO and failover state."];
  }

  markFirstResourceFailed(runtime, "Disaster recovery configuration still has the wrong failover action, restore target, RPO/RTO, or replication scope.");
  return ["dr validate: failed", "Disaster recovery configuration still has the wrong failover action, restore target, RPO/RTO, or replication scope."];
}
