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

export function sqsGetQueueAttributes(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "msgSqsDlqRedrivePolicy") return ["SQS queue attributes are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (messagingFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "messagingValidated", "Redrive policy set, maxReceiveCount=5, idempotency enabled.");
    return [
      "Queue: checkout-orders",
      "MaxReceiveCount: 5",
      "RedrivePolicy: arn:aws:sqs:eu-west-1:123456789012:checkout-orders-dlq",
      "IdempotencyCheck: enabled",
      "ApproximateNumberOfMessages: 42",
    ];
  }
  markFirstResourceFailed(runtime, "No redrive policy; maxReceiveCount is 0 and idempotency is disabled.");
  return [
    "Queue: checkout-orders",
    "MaxReceiveCount: 0",
    "RedrivePolicy: (none)",
    "IdempotencyCheck: disabled",
    "ApproximateNumberOfMessages: 42",
    "Finding: set redrive policy, maxReceiveCount, and idempotency check.",
  ];
}

export function kafkaConsumerGroupsDescribeMsg(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "msgKafkaConsumerRebalanceStorm") return ["Kafka consumer groups are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (messagingFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "messagingValidated", "Consumers use 45s session, static membership, and cooperative-sticky with no rebalance loop.");
    return [
      "GROUP          TOPIC          PARTITIONS  CONSUMERS  LAG",
      "checkout-worker  checkout-events  6           3          42",
      "sessionTimeoutMs: 45000  strategy: cooperative-sticky  static: enabled",
      "Status: stable",
    ];
  }
  markFirstResourceFailed(runtime, "Consumers in rebalance loop; session timeout too short and no static membership.");
  return [
    "GROUP          TOPIC          PARTITIONS  CONSUMERS  LAG",
    "checkout-worker  checkout-events  6           3          18420",
    "sessionTimeoutMs: 10000  strategy: range  static: disabled",
    "Status: rebalance storm (18 rebalances in last 5 minutes)",
    "Finding: raise session timeout, add static membership, switch to cooperative-sticky.",
  ];
}

export function snsListSubscriptions(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "msgSnsFanoutFilterPolicy") return ["SNS subscriptions are not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (messagingFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "messagingValidated", "Order-service subscription filters only order.created events.");
    return [
      "TopicArn: arn:aws:sns:eu-west-1:123456789012:checkout-events",
      "Subscriptions:",
      "  order-service    FilterPolicy: event=order.created    PendingConfirmation: false",
      "  inventory-service   FilterPolicy: (none)             PendingConfirmation: false",
      "  billing-service     FilterPolicy: (none)             PendingConfirmation: false",
    ];
  }
  markFirstResourceFailed(runtime, "Order-service subscription has no FilterPolicy and receives all fan-out messages.");
  return [
    "TopicArn: arn:aws:sns:eu-west-1:123456789012:checkout-events",
    "Subscriptions:",
    "  order-service    FilterPolicy: (none)    PendingConfirmation: false",
    "  inventory-service   FilterPolicy: (none)    PendingConfirmation: false",
    "Finding: order-service receives all topic messages. Add FilterPolicy for event=order.created.",
  ];
}

export function kinesisDescribeStream(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "msgOrderedDeliveryPartitionKey") return ["Kinesis is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (messagingFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "messagingValidated", "Partition key set to orderId with key-sharding and hot partition rebalance.");
    return [
      "Stream: checkout-events",
      "PartitionKey: orderId  Strategy: key-sharding",
      "HotPartitionRebalance: enabled",
      "Shard distribution: balanced",
    ];
  }
  markFirstResourceFailed(runtime, "Ordering broken; empty partition key and one hot partition with random strategy.");
  return [
    "Stream: checkout-events",
    "PartitionKey: (empty)  Strategy: random",
    "HotPartitionRebalance: disabled",
    "Shard-3: 79% of writes",
    "Finding: set partition key to orderId, enable key-sharding and hot partition rebalance.",
  ];
}

export function sqsReceiveMessage(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "msgIdempotencyDuplicateConsume") return ["SQS receive-message is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (messagingFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "messagingValidated", "Consumer dedupes on orderId with dedupe table, no duplicate charges.");
    return [
      "Queue: checkout-orders",
      "MessageId: a1b2c3d4   Body: {orderId: ORD-8142}",
      "IdempotencyCheck: orderId=ORD-8142  DEDUPE TABLE HIT — skipped",
      "DuplicateChargeRisk: false",
    ];
  }
  markFirstResourceFailed(runtime, "Consumer not idempotent; duplicate charges risk from at-least-once delivery.");
  return [
    "Queue: checkout-orders",
    "MessageId: a1b2c3d4   Body: {orderId: ORD-8142}",
    "MessageId: a1b2c3d4   Body: {orderId: ORD-8142}  (DUPLICATE)",
    "IdempotencyCheck: not configured",
    "DuplicateChargeRisk: true",
    "Finding: add idempotency key and dedupe table to prevent double charges.",
  ];
}
