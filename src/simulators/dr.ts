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

export function rdsDescribeDbClusters(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "drRdsFailoverVerify") {
    runtime.flags.initialized = true;
    runtime.flags.validationPassed = true;
    if (drFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "drValidated", "RDS failover promoted standby, replica is healthy, and app reconnects verified.");
      return [
        "DBClusterIdentifier: checkout-prod",
        "Status: available",
        "MultiAZ: true",
        "CurrentWriter: checkout-prod-instance-1 (eu-west-1a)",
        "StandbyReplica: checkout-prod-instance-2 (eu-west-1b)",
        "FailoverAction: promote",
        "ReplicaHealth: healthy",
        "AppReconnectVerified: true",
      ];
    }
    markFirstResourceFailed(runtime, "RDS failover is still on monitor with unknown replica health and unverified reconnect.");
    return [
      "DBClusterIdentifier: checkout-prod",
      "Status: available",
      "MultiAZ: true",
      "CurrentWriter: checkout-prod-instance-1 (eu-west-1a)",
      "StandbyReplica: checkout-prod-instance-2 (eu-west-1b)",
      "FailoverAction: monitor",
      "ReplicaHealth: unknown",
      "AppReconnectVerified: false",
      "Finding: failover not promoted. Replica health unknown and app reconnect unverified.",
    ];
  }

  if (scenarioId === "drBackupRestoreIntegrity") {
    runtime.flags.initialized = true;
    runtime.flags.validationPassed = true;
    if (drFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "drValidated", "Backup restored, checksum and row-count diffs match production snapshot.");
      return [
        "DBClusterIdentifier: staging-restore",
        "Status: available",
        "SnapshotSource: nightly-pg-backup",
        "RestoreAction: restore",
        "ChecksumDiff: match",
        "RowCountDiff: match",
        "IntegrityCheck: passed",
      ];
    }
    markFirstResourceFailed(runtime, "Backup not restored; checksum and row-count diffs still mismatch.");
    return [
      "DBClusterIdentifier: checkout-prod",
      "LatestSnapshot: nightly-pg-backup",
      "RestoreAction: none",
      "ChecksumDiff: mismatch",
      "RowCountDiff: mismatch",
      "Finding: backup not restored. Run restore and verify checksum and row-count diffs.",
    ];
  }

  return ["RDS describe-db-clusters is not configured for this lab."];
}

export function route53ListRecordSets(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "drRegionFailoverDrill") return ["Route 53 record sets are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (drFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "drValidated", "Route 53 weighted routing shifted to DR region and post-failover checks pass.");
    return [
      "HostedZoneId: Z123456 (checkout.example.com)",
      "Name: checkout.example.com.  Type: A  TTL: 60",
      "SetIdentifier: primary  Weight: 0  Value: 203.0.113.10",
      "SetIdentifier: dr  Weight: 100  Value: 203.0.113.20",
      "EvaluateTargetHealth: true",
      "Post-failover checks: db=passed cache=passed queue=passed",
    ];
  }
  markFirstResourceFailed(runtime, "Route 53 weighted routing still directs all traffic to the primary region.");
  return [
    "HostedZoneId: Z123456 (checkout.example.com)",
    "Name: checkout.example.com.  Type: A  TTL: 60",
    "SetIdentifier: primary  Weight: 100  Value: 203.0.113.10",
    "SetIdentifier: dr  Weight: 0  Value: 203.0.113.20",
    "EvaluateTargetHealth: true",
    "Finding: traffic still routes 100% to primary. Shift to DR for the drill.",
  ];
}

export function s3GetBucketReplication(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "drCrossRegionReplicationLag") return ["S3 replication is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (drFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "drValidated", "S3 cross-region replication is active with scope all and lag is draining.");
    return [
      "Bucket: checkout-artifacts-prod",
      "ReplicationConfiguration:",
      "  Role: arn:aws:iam::123456789012:role/s3-crr-role",
      "  Status: active",
      "  Scope: all",
      "  Destination: arn:aws:s3:::checkout-artifacts-dr",
      "  LagSeconds: 45",
    ];
  }
  markFirstResourceFailed(runtime, "S3 replication is paused and scoped to a single prefix; lag exceeds the RPO.");
  return [
    "Bucket: checkout-artifacts-prod",
    "ReplicationConfiguration:",
    "  Role: arn:aws:iam::123456789012:role/s3-crr-role",
    "  Status: paused",
    "  Scope: prefix-only",
    "  Destination: arn:aws:s3:::checkout-artifacts-dr",
    "  LagSeconds: 4200",
    "  Finding: replication is paused with prefix-only scope. Resume and set scope to all.",
  ];
}
