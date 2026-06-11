import { describe, expect, it } from "vitest";
import { isScenarioSolved } from "../completion";
import type { Scenario } from "../types";
import { cloudWatchDescribeAlarms, kafkaConsumerGroupsDescribe, otelcolValidate, promtoolTargets, vaultKvGet, vaultPolicyRead, vaultTokenCapabilities } from "./ops";

describe("Secrets simulator", () => {
  it("solves Vault KV policy path after inspecting policy and validating capabilities", () => {
    const scenario: Scenario = {
      id: "secretsVaultKvPolicyPath",
      kind: "secrets",
      title: "Vault KV Policy Path",
      description: "Test fixture.",
      primaryFile: "vault-policy.hcl",
      files: {
        "vault-policy.hcl": 'path "secret/data/staging/checkout/db" {\n  capabilities = ["read"]\n}\n',
      },
      backend: { bucket: "secrets-training", key: "vault", table: "none", locked: false, lockId: null },
      awsResources: [{ type: "vault_policy", name: "checkout-api", id: "vault/policy/checkout-api", status: "failed" }],
      stateResources: [{ address: "vault.policy.checkout-api.path", id: "secret/data/prod/checkout/db" }],
      flags: { secretsValidated: false },
    };

    vaultPolicyRead(scenario, "secretsVaultKvPolicyPath");
    const capabilities = vaultTokenCapabilities(scenario, "secretsVaultKvPolicyPath");
    const secret = vaultKvGet(scenario, "secretsVaultKvPolicyPath");

    expect(capabilities).toEqual(["read"]);
    expect(secret).toContain("secret/data/staging/checkout/db");
    expect(scenario.flags.secretsValidated).toBe(true);
    expect(isScenarioSolved(scenario, "secretsVaultKvPolicyPath", "vault-policy.hcl")).toBe(true);
  });

  it("rejects Vault KV policy when staging path is not granted", () => {
    const scenario: Scenario = {
      id: "secretsVaultKvPolicyPath",
      kind: "secrets",
      title: "Vault KV Policy Path",
      description: "Test fixture.",
      primaryFile: "vault-policy.hcl",
      files: {
        "vault-policy.hcl": 'path "secret/data/prod/checkout/db" {\n  capabilities = ["read"]\n}\n',
      },
      backend: { bucket: "secrets-training", key: "vault", table: "none", locked: false, lockId: null },
      awsResources: [{ type: "vault_policy", name: "checkout-api", id: "vault/policy/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { secretsValidated: false },
    };

    vaultPolicyRead(scenario, "secretsVaultKvPolicyPath");
    const capabilities = vaultTokenCapabilities(scenario, "secretsVaultKvPolicyPath");

    expect(capabilities).toContain("deny");
    expect(scenario.flags.secretsValidated).toBe(false);
  });
});

describe("Observability simulator", () => {
  it("explains ALB alarm dimension name when ARN suffix is right but key is wrong", () => {
    const scenario: Scenario = {
      id: "observabilityAlb5xxAlarmDimension",
      kind: "observability",
      title: "CloudWatch ALB 5xx Alarm Dimension",
      description: "Test fixture.",
      primaryFile: "alarm.json",
      files: {
        "alarm.json": JSON.stringify({
          alarmName: "alb-5xx-prod",
          namespace: "AWS/ApplicationELB",
          metricName: "HTTPCode_ELB_5XX_Count",
          dimensions: [{ name: "LoadBalancerName", value: "app/prod-web/50dc6c495c0c9188" }],
          threshold: 5,
          evaluationPeriods: 2,
        }, null, 2),
      },
      backend: { bucket: "observability-training", key: "alb", table: "none", locked: false, lockId: null },
      awsResources: [{ type: "cloudwatch_alarm", name: "alb-5xx-prod", id: "alb-5xx-prod", status: "failed" }],
      stateResources: [],
      flags: { observabilityValidated: false },
    };

    const output = cloudWatchDescribeAlarms(scenario, "observabilityAlb5xxAlarmDimension");

    expect(output).toContain("Finding: Application Load Balancer metrics use dimension name LoadBalancer, not LoadBalancerName.");
    expect(scenario.flags.observabilityValidated).toBe(false);
  });

  it("solves Prometheus scrape target after selector matches service labels", () => {
    const scenario: Scenario = {
      id: "observabilityPrometheusScrapeTarget",
      kind: "observability",
      title: "Prometheus Missing Scrape Target",
      description: "Test fixture.",
      primaryFile: "servicemonitor.yaml",
      files: {
        "servicemonitor.yaml": "selector:\n  matchLabels:\n    app: checkout-api\nendpoints:\n  - port: http\n    path: /metrics\n",
      },
      backend: { bucket: "observability-training", key: "prometheus", table: "none", locked: false, lockId: null },
      awsResources: [{ type: "prometheus_target", name: "checkout-api", id: "prometheus/targets/checkout-api", status: "failed" }],
      stateResources: [],
      flags: { observabilityValidated: false },
    };

    const output = promtoolTargets(scenario, "observabilityPrometheusScrapeTarget");

    expect(output).toContain("checkout-api.default.svc:8080/metrics  UP  labels: app=checkout-api");
    expect(scenario.flags.observabilityValidated).toBe(true);
    expect(isScenarioSolved(scenario, "observabilityPrometheusScrapeTarget", "servicemonitor.yaml")).toBe(true);
  });

  it("solves OpenTelemetry exporter endpoint after OTLP gRPC port is fixed", () => {
    const scenario: Scenario = {
      id: "observabilityOtelExporterEndpoint",
      kind: "observability",
      title: "OpenTelemetry Exporter Endpoint",
      description: "Test fixture.",
      primaryFile: "otel-collector.yaml",
      files: {
        "otel-collector.yaml": "exporters:\n  otlp:\n    endpoint: tempo.observability.svc:4317\nservice:\n  pipelines:\n    traces:\n      exporters: [otlp]\n",
      },
      backend: { bucket: "observability-training", key: "otel", table: "none", locked: false, lockId: null },
      awsResources: [{ type: "otel_exporter", name: "traces", id: "otel/exporter/otlp", status: "failed" }],
      stateResources: [],
      flags: { observabilityValidated: false },
    };

    const output = otelcolValidate(scenario, "observabilityOtelExporterEndpoint");

    expect(output).toContain("otelcol config valid");
    expect(scenario.flags.observabilityValidated).toBe(true);
    expect(isScenarioSolved(scenario, "observabilityOtelExporterEndpoint", "otel-collector.yaml")).toBe(true);
  });

  it("solves Kafka consumer lag after worker replicas match partitions", () => {
    const scenario: Scenario = {
      id: "observabilityKafkaConsumerLag",
      kind: "observability",
      title: "Kafka Consumer Lag Spike",
      description: "Test fixture.",
      primaryFile: "consumer-deployment.yaml",
      files: {
        "consumer-deployment.yaml": "replicas: 6\nvalue: checkout-worker\n",
      },
      backend: { bucket: "observability-training", key: "kafka", table: "none", locked: false, lockId: null },
      awsResources: [{ type: "kafka_consumer_group", name: "checkout-worker", id: "kafka/checkout-events/checkout-worker", status: "failed" }],
      stateResources: [],
      flags: { observabilityValidated: false },
    };

    const output = kafkaConsumerGroupsDescribe(scenario, "observabilityKafkaConsumerLag");

    expect(output).toContain("checkout-worker  checkout-events  6           6          12");
    expect(scenario.flags.observabilityValidated).toBe(true);
    expect(isScenarioSolved(scenario, "observabilityKafkaConsumerLag", "consumer-deployment.yaml")).toBe(true);
  });
});
