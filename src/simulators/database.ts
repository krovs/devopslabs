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

export function rdsDescribeEvents(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dbRdsFailoverStuck") return ["RDS events are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "RDS failover completed: standby healthy, DNS verified, force-failover executed.");
    return [
      "DBClusterIdentifier: checkout-prod",
      "Events:",
      "  2026-06-19T10:42:00Z  failover-started",
      "  2026-06-19T10:44:00Z  failover-completed",
      "  2026-06-19T10:44:00Z  standby-health-check: healthy",
      "  2026-06-19T10:44:30Z  dns-verified: checkout-prod.cluster-xyz.eu-west-1.rds.amazonaws.com",
      "Status: available",
    ];
  }
  markFirstResourceFailed(runtime, "RDS failover is stuck on wait with unknown standby health and unverified DNS.");
  return [
    "DBClusterIdentifier: checkout-prod",
    "Events:",
    "  2026-06-19T10:42:00Z  failover-started",
    "  2026-06-19T10:42:30Z  failover-stuck: standby health unknown, DNS unverified",
    "Finding: failover stalled. Check standby health and DNS, then force failover.",
  ];
}

export function rdsDescribeDbClusters(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dbReplicationLagSpike") return ["RDS describe-db-clusters is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "Long-running transaction killed, checkpoint completed, replica lag draining.");
    return [
      "DBClusterIdentifier: checkout-prod",
      "Replicas:",
      "  checkout-read-1  lag: 12s  checkpoint: completed  largestTxn: none",
      "  checkout-read-2  lag: 8s   checkpoint: completed  largestTxn: none",
    ];
  }
  markFirstResourceFailed(runtime, "Read replica lag climbing; largest transaction not killed and checkpoint stalled.");
  return [
    "DBClusterIdentifier: checkout-prod",
    "Replicas:",
    "  checkout-read-1  lag: 320s  checkpoint: stalled  largestTxn: idle-in-transaction (pid=8142)",
    "  checkout-read-2  lag: 290s  checkpoint: stalled",
    "Finding: replica lag driven by long-running transaction and stalled checkpoint. Kill largest txn.",
  ];
}

export function rdsDescribeDbLogFiles(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dbSlowQueryPlanRegression") return ["RDS log files are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "Index orders_user_idx added, plan returns to index scan.");
    return [
      "DBInstanceIdentifier: checkout-prod",
      "Slow query log:",
      "  2026-06-19T09:15:00Z  QUERY: SELECT * FROM orders WHERE user_id = $1",
      "  2026-06-19T09:15:00Z  PLAN: Index Scan using orders_user_idx on orders",
      "  2026-06-19T09:15:00Z  ROWS: 42  TIME: 0.8ms",
    ];
  }
  markFirstResourceFailed(runtime, "Query plan regressed to a sequential scan; missing index orders_user_idx.");
  return [
    "DBInstanceIdentifier: checkout-prod",
    "Slow query log:",
    "  2026-06-19T09:15:00Z  QUERY: SELECT * FROM orders WHERE user_id = $1",
    "  2026-06-19T09:15:00Z  PLAN: Seq Scan on orders (rows=2500000) (actual time=1840ms)",
    "  2026-06-19T09:15:00Z  REGRESSION: plan flipped after statistics refresh. Missing index.",
    "Finding: query uses sequential scan. Add index orders_user_idx on user_id.",
  ];
}

export function pgbouncerShowPools(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dbConnectionPoolExhaustion") return ["PgBouncer is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "Leaky client fixed, pool mode switched to transaction, maxClientConn raised to 1000.");
    return [
      "pgbouncer pools:",
      "  database: checkout-prod  pool_mode: transaction  max_client_conn: 1000",
      "  active: 42  waiting: 0  total: 42",
      "  leaky_client: fixed",
    ];
  }
  markFirstResourceFailed(runtime, "PgBouncer saturated in session mode; leaky client unfixed and maxClientConn too low.");
  return [
    "pgbouncer pools:",
    "  database: checkout-prod  pool_mode: session  max_client_conn: 100",
    "  active: 100  waiting: 23  total: 100",
    "  leaky_client: checkout-batch holding 34 session connections",
    "Finding: pool exhausted. Fix leaky client, switch to transaction mode, raise maxClientConn.",
  ];
}

export function rdsDescribeDbLogs(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dbPitrRestoreToPoint") return ["RDS logs are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "PITR restore queued to 2026-06-18T11:30:00Z inside the retention window.");
    return [
      "DBClusterIdentifier: checkout-prod",
      "PITR window: 2026-05-15T00:00:00Z to 2026-06-19T12:00:00Z",
      "Target time: 2026-06-18T11:30:00Z (inside window)",
      "Restore action: pitr-restore queued",
    ];
  }
  markFirstResourceFailed(runtime, "PITR restore not queued; target time empty and retention window unverified.");
  return [
    "DBClusterIdentifier: checkout-prod",
    "PITR window: 2026-05-15T00:00:00Z to 2026-06-19T12:00:00Z",
    "Target time: (not set)",
    "Restore action: none",
    "Finding: set target time and verify it is inside the retention window before restoring.",
  ];
}

export function dynamodbDescribeTable(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dbDynamoThrottledOnHotKey") return ["DynamoDB is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (databaseFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "databaseValidated", "Hot key sharding enabled, partition strategy distributed, throttling resolved.");
    return [
      "Table: checkout-events",
      "BillingMode: PROVISIONED",
      "WCU: 5000  RCU: 2000",
      "PartitionKey: eventType (key-sharding enabled)",
      "HotPartitionRebalance: enabled",
      "WriteThrottleEvents: 0",
    ];
  }
  markFirstResourceFailed(runtime, "One partition absorbs 87% of WCUs; hot key sharding disabled and single partition strategy.");
  return [
    "Table: checkout-events",
    "BillingMode: PROVISIONED",
    "WCU: 5000  RCU: 2000",
    "PartitionKey: eventType (single)",
    "HotPartitionRebalance: disabled",
    "WriteThrottleEvents: 47 (past 5 minutes)",
    "Finding: 87% of writes hit one partition. Enable hot key sharding and switch to distributed strategy.",
  ];
}
