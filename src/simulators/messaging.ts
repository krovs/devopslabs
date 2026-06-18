import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function messagingFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "msgSqsDlqRedrivePolicy") {
    const file = runtime.files["queue.json"] ?? "";
    return (
      file.includes('"maxReceiveCount": 5') &&
      file.includes('"redrivePolicy": "arn:aws:sqs:eu-west-1:123456789012:checkout-orders-dlq"') &&
      file.includes('"idempotencyCheck": true')
    );
  }

  if (scenarioId === "msgKafkaConsumerRebalanceStorm") {
    const file = runtime.files["consumer.yaml"] ?? "";
    return (
      file.includes("sessionTimeoutMs: 45000") &&
      file.includes("groupInstanceId: checkout-worker-1") &&
      file.includes("partitionAssignmentStrategy: cooperative-sticky")
    );
  }

  if (scenarioId === "msgSnsFanoutFilterPolicy") {
    const file = runtime.files["subscription.json"] ?? "";
    return file.includes('"event": ["order.created"]');
  }

  if (scenarioId === "msgOrderedDeliveryPartitionKey") {
    const file = runtime.files["producer.json"] ?? "";
    return (
      file.includes('"partitionKey": "orderId"') &&
      file.includes('"hotPartitionRebalance": true') &&
      file.includes('"strategy": "key-sharding"')
    );
  }

  if (scenarioId === "msgIdempotencyDuplicateConsume") {
    const file = runtime.files["consumer.json"] ?? "";
    return (
      file.includes('"idempotencyKey": "orderId"') &&
      file.includes('"dedupeTable": true') &&
      file.includes('"duplicateChargeRisk": false')
    );
  }

  return false;
}

export function messagingValidate(runtime: Scenario, scenarioId: string): string[] {
  if (messagingFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "messagingValidated", "Messaging troubleshooting completed.");
    return ["msg validate: passed", "Messaging troubleshooting completed."];
  }

  markFirstResourceFailed(runtime, "Messaging configuration still has the wrong redrive, rebalance, filter, ordering, or idempotency setting.");
  return ["msg validate: failed", "Messaging configuration still has the wrong redrive, rebalance, filter, ordering, or idempotency setting."];
}
