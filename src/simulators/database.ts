import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function databaseFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "dbRdsFailoverStuck") {
    const file = runtime.files["failover.json"] ?? "";
    return (
      file.includes('"action": "force-failover"') &&
      file.includes('"standbyHealth": "healthy"') &&
      file.includes('"dnsVerified": true')
    );
  }

  if (scenarioId === "dbReplicationLagSpike") {
    const file = runtime.files["replica.json"] ?? "";
    return file.includes('"killLargestTxn": true') && file.includes('"checkpointStatus": "completed"');
  }

  if (scenarioId === "dbSlowQueryPlanRegression") {
    const file = runtime.files["query.json"] ?? "";
    return (
      file.includes('"addIndex": true') &&
      file.includes('"indexName": "orders_user_idx"') &&
      file.includes('"plan": "indexScan"')
    );
  }

  if (scenarioId === "dbConnectionPoolExhaustion") {
    const file = runtime.files["pool.json"] ?? "";
    return (
      file.includes('"maxClientConn": 1000') &&
      file.includes('"poolMode": "transaction"') &&
      file.includes('"leakyClientUnfixed": false')
    );
  }

  if (scenarioId === "dbPitrRestoreToPoint") {
    const file = runtime.files["restore.json"] ?? "";
    return (
      file.includes('"targetTime": "2026-06-18T11:30:00Z"') &&
      file.includes('"withinRetentionWindow": true') &&
      file.includes('"action": "pitr-restore"')
    );
  }

  if (scenarioId === "dbDynamoThrottledOnHotKey") {
    const file = runtime.files["throughput.json"] ?? "";
    return file.includes('"hotKeySharding": true') && file.includes('"partitionStrategy": "distributed"');
  }

  return false;
}

export function databaseValidate(runtime: Scenario, scenarioId: string): string[] {
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "Database operations troubleshooting completed.");
    return ["db validate: passed", "Database operations troubleshooting completed."];
  }

  markFirstResourceFailed(runtime, "Database troubleshooting still has the wrong failover, replication, query, pool, restore, or throughput fix.");
  return ["db validate: failed", "Database troubleshooting still has the wrong failover, replication, query, pool, restore, or throughput fix."];
}
