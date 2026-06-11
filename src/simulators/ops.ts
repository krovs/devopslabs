import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function secretsFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "secretsManagerRotationKms") {
    const config = runtime.files["secret-config.json"] ?? "";
    return (
      config.includes('"kmsKeyId": "alias/prod-secrets-kms"') &&
      config.includes('"rotationEnabled": true') &&
      config.includes('"rotationDays": 30')
    );
  }

  if (scenarioId === "secretsSsmEnvironmentPath") {
    const config = runtime.files["app-config.yaml"] ?? "";
    return (
      config.includes("environment: staging") &&
      config.includes("databasePasswordParameter: /staging/checkout/db/password") &&
      config.includes("withDecryption: true") &&
      !config.includes("databasePasswordParameter: /prod/checkout/db/password")
    );
  }

  if (scenarioId === "secretsManagerResourcePolicy") {
    const policy = runtime.files["resource-policy.json"] ?? "";
    return (
      policy.includes('"blockPublicPolicy": true') &&
      policy.includes('"Principal": "arn:aws:iam::210987654321:role/security-audit"') &&
      policy.includes('"Action": "secretsmanager:GetSecretValue"') &&
      !policy.includes('"Principal": "*"') &&
      !policy.includes('"Resource": "*"')
    );
  }

  if (scenarioId === "secretsVaultKvPolicyPath") {
    const policy = runtime.files["vault-policy.hcl"] ?? "";
    return (
      policy.includes('path "secret/data/staging/checkout/db"') &&
      policy.includes('capabilities = ["read"]') &&
      !policy.includes('path "secret/data/prod/checkout/db"')
    );
  }

  return false;
}

export function dnsFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "dnsAcmCloudFrontCertificate") {
    const config = runtime.files["certificate.json"] ?? "";
    return (
      config.includes('"region": "us-east-1"') &&
      config.includes('"validationRecordName": "_9f3b.app.example.com"') &&
      config.includes('"validationRecordValue": "_7a1d.acm-validations.aws"')
    );
  }

  if (scenarioId === "dnsRoute53AlbAlias") {
    const config = runtime.files["route53-record.json"] ?? "";
    return (
      config.includes('"type": "A"') &&
      config.includes('"value": "app-prod-456.eu-west-1.elb.amazonaws.com"') &&
      config.includes('"aliasHostedZoneId": "Z32O12XQLNTSW2"') &&
      config.includes('"evaluateTargetHealth": true')
    );
  }

  if (scenarioId === "dnsAcmWildcardValidation") {
    const config = runtime.files["certificate.json"] ?? "";
    return (
      config.includes('"region": "us-east-1"') &&
      config.includes('"validationRecordName": "_a1b2.example.com"') &&
      config.includes('"validationRecordValue": "_c3d4.acm-validations.aws"') &&
      config.includes('"hostedZone": "example.com"')
    );
  }

  return false;
}

export function observabilityFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "observabilityAlb5xxAlarmDimension") {
    const config = runtime.files["alarm.json"] ?? "";
    return (
      config.includes('"namespace": "AWS/ApplicationELB"') &&
      config.includes('"metricName": "HTTPCode_ELB_5XX_Count"') &&
      config.includes('"name": "LoadBalancer"') &&
      config.includes('"value": "app/prod-web/50dc6c495c0c9188"') &&
      !config.includes('"namespace": "AWS/ELB"') &&
      !config.includes('"name": "LoadBalancerName"')
    );
  }

  if (scenarioId === "observabilityLogRetention") {
    const config = runtime.files["log-group.json"] ?? "";
    return (
      config.includes('"logGroupName": "/aws/ecs/payments-api"') &&
      config.includes('"retentionInDays": 30') &&
      !config.includes('"retentionInDays": null')
    );
  }

  if (scenarioId === "observabilityAlarmAction") {
    const config = runtime.files["alarm.json"] ?? "";
    return (
      config.includes('"alarmActions": ["arn:aws:sns:eu-west-1:123456789012:oncall-critical"]') &&
      config.includes('"okActions": ["arn:aws:sns:eu-west-1:123456789012:oncall-critical"]') &&
      !config.includes('"alarmActions": []')
    );
  }

  if (scenarioId === "observabilityPrometheusScrapeTarget") {
    const config = runtime.files["servicemonitor.yaml"] ?? "";
    return config.includes("app: checkout-api") && config.includes("path: /metrics") && config.includes("port: http");
  }

  if (scenarioId === "observabilityOtelExporterEndpoint") {
    const config = runtime.files["otel-collector.yaml"] ?? "";
    return (
      config.includes("endpoint: tempo.observability.svc:4317") &&
      config.includes("exporters: [otlp]") &&
      !config.includes("endpoint: tempo.observability.svc:4318")
    );
  }

  if (scenarioId === "observabilityKafkaConsumerLag") {
    const config = runtime.files["consumer-deployment.yaml"] ?? "";
    return config.includes("replicas: 6") && config.includes("value: checkout-worker");
  }

  return false;
}

export function finopsFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "finopsNatGatewayCostSpike") {
    const config = runtime.files["nat-gateways.json"] ?? "";
    return (
      config.includes('"natGatewayCount": 2') &&
      config.includes('"privateWorkloadAzs": ["eu-west-1a", "eu-west-1b"]') &&
      config.includes('"removeIdleGateways": true')
    );
  }

  if (scenarioId === "finopsS3Lifecycle") {
    const config = runtime.files["lifecycle.json"] ?? "";
    return (
      config.includes('"transitionAfterDays": 30') &&
      config.includes('"storageClass": "STANDARD_IA"') &&
      config.includes('"expireTempExportsAfterDays": 14')
    );
  }

  if (scenarioId === "finopsUnattachedEbsCleanup") {
    const config = runtime.files["volume-cleanup.json"] ?? "";
    return (
      config.includes('"deleteUnattached": true') &&
      config.includes('"snapshotBeforeDelete": true') &&
      config.includes('"minimumUnattachedDays": 14')
    );
  }

  return false;
}

export function secretsManagerDescribeSecret(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "secretsManagerRotationKms" && scenarioId !== "secretsManagerResourcePolicy") {
    return ["DescribeSecret is not the validation command for this lab."];
  }

  if (scenarioId === "secretsManagerResourcePolicy") {
    if (secretsFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "secretsValidated", "Secret resource policy blocks public access and trusts only the security audit role.");
      return [
        "Name: prod/payments/api-key",
        "BlockPublicPolicy: true",
        "Principal: arn:aws:iam::210987654321:role/security-audit",
        "Action: secretsmanager:GetSecretValue",
      ];
    }

    markFirstResourceFailed(runtime, "Secret resource policy still allows wildcard principal access or public policies.");
    return [
      "Name: prod/payments/api-key",
      "BlockPublicPolicy: false",
      "Finding: resource policy allows public or cross-account wildcard access.",
    ];
  }

  if (secretsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "secretsValidated", "Secret uses customer managed KMS and 30 day rotation.");
    return [
      "Name: prod/db/password",
      "KmsKeyId: alias/prod-secrets-kms",
      "RotationEnabled: true",
      "RotationRules.AutomaticallyAfterDays: 30",
    ];
  }

  markFirstResourceFailed(runtime, "Secret rotation or KMS key is still outside policy.");
  return [
    "Name: prod/db/password",
    "KmsKeyId: alias/aws/secretsmanager",
    "RotationEnabled: false",
    "Finding: production database secret does not meet rotation and KMS requirements.",
  ];
}

export function secretsSsmGetParameter(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "secretsSsmEnvironmentPath") return ["GetParameter is not the validation command for this lab."];

  if (secretsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "secretsValidated", "Staging service reads the staging SSM parameter with decryption.");
    return [
      "Name: /staging/checkout/db/password",
      "Type: SecureString",
      "WithDecryption: true",
      "Access path matches environment staging.",
    ];
  }

  markFirstResourceFailed(runtime, "Service still points at the wrong environment parameter.");
  return [
    "Name: /prod/checkout/db/password",
    "Type: SecureString",
    "Warning: staging workload is reading a production parameter path.",
  ];
}

export function vaultPolicyRead(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "secretsVaultKvPolicyPath") return ["Vault policy read is not the validation command for this lab."];

  runtime.flags.validationPassed = true;
  return (runtime.files["vault-policy.hcl"] ?? "").split("\n").filter((line) => line.length > 0);
}

export function vaultTokenCapabilities(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "secretsVaultKvPolicyPath") return ["Vault token capabilities is not the validation command for this lab."];

  if (!runtime.flags.validationPassed) return ["Run vault policy read checkout-api before validating capabilities."];

  if (secretsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "secretsValidated", "Vault policy allows only the staging checkout KV path.");
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "vault.policy.checkout-api.path" ? { ...resource, id: "secret/data/staging/checkout/db" } : resource,
    );
    return ["read"];
  }

  markFirstResourceFailed(runtime, "Vault policy still grants the wrong KV environment path.");
  return ["deny", "Finding: checkout-api policy does not grant secret/data/staging/checkout/db"];
}

export function vaultKvGet(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "secretsVaultKvPolicyPath") return ["Vault KV get is not the validation command for this lab."];

  if (secretsFixApplied(runtime, scenarioId)) {
    return ["====== Secret Path ======", "secret/data/staging/checkout/db", "password: ********"];
  }

  return ["Error reading secret/data/staging/checkout/db: permission denied"];
}

export function dnsAcmDescribeCertificate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dnsAcmCloudFrontCertificate" && scenarioId !== "dnsAcmWildcardValidation") {
    return ["DescribeCertificate is not the validation command for this lab."];
  }

  if (scenarioId === "dnsAcmWildcardValidation") {
    if (dnsFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "dnsValidated", "Wildcard certificate is in us-east-1 with the public hosted-zone validation CNAME.");
      return [
        "DomainName: *.example.com",
        "Region: us-east-1",
        "Status: ISSUED",
        "Validation CNAME: _a1b2.example.com -> _c3d4.acm-validations.aws",
      ];
    }

    markFirstResourceFailed(runtime, "Wildcard certificate region or validation CNAME is still wrong.");
    return [
      "DomainName: *.example.com",
      "Region: eu-west-1",
      "Status: PENDING_VALIDATION",
      "Finding: wildcard certificate must be validated from us-east-1 in the public example.com hosted zone.",
    ];
  }

  if (dnsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "dnsValidated", "CloudFront certificate is in us-east-1 and DNS validation is complete.");
    return [
      "DomainName: app.example.com",
      "Region: us-east-1",
      "Status: ISSUED",
      "Validation CNAME: _9f3b.app.example.com -> _7a1d.acm-validations.aws",
    ];
  }

  markFirstResourceFailed(runtime, "Certificate region or validation record is still wrong.");
  return [
    "DomainName: app.example.com",
    "Region: eu-west-1",
    "Status: PENDING_VALIDATION",
    "Finding: CloudFront viewer certificate must be issued in us-east-1 with the expected validation CNAME.",
  ];
}

export function dnsDigApp(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "dnsRoute53AlbAlias") return ["dig app.example.com is not the validation command for this lab."];

  if (dnsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "dnsValidated", "Route 53 app record aliases to the current ALB target.");
    return [
      "app.example.com. 60 IN A ALIAS app-prod-456.eu-west-1.elb.amazonaws.com.",
      "alias hosted zone: Z32O12XQLNTSW2",
      "evaluate target health: true",
    ];
  }

  markFirstResourceFailed(runtime, "Record still resolves to the old load balancer or is not an alias A record.");
  return [
    "app.example.com. 300 IN CNAME old-alb-123.eu-west-1.elb.amazonaws.com.",
    "Finding: app hostname is still pointed at the old load balancer.",
  ];
}

export function cloudWatchDescribeAlarms(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "observabilityAlb5xxAlarmDimension") {
    if (observabilityFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "observabilityValidated", "ALB 5xx alarm uses the ApplicationELB namespace and LoadBalancer dimension.");
      return [
        "AlarmName: alb-5xx-prod",
        "Namespace: AWS/ApplicationELB",
        "MetricName: HTTPCode_ELB_5XX_Count",
        "Dimensions: LoadBalancer=app/prod-web/50dc6c495c0c9188",
        "StateValue: OK",
      ];
    }

    const config = runtime.files["alarm.json"] ?? "";
    const namespace = config.includes('"namespace": "AWS/ApplicationELB"') ? "AWS/ApplicationELB" : "AWS/ELB";
    const dimensionValue = config.includes('"value": "app/prod-web/50dc6c495c0c9188"') ? "app/prod-web/50dc6c495c0c9188" : "prod-web";
    const dimensionName = config.includes('"name": "LoadBalancerName"') ? "LoadBalancerName" : "unknown";
    const finding = config.includes('"name": "LoadBalancerName"') && config.includes('"value": "app/prod-web/50dc6c495c0c9188"')
      ? "Finding: Application Load Balancer metrics use dimension name LoadBalancer, not LoadBalancerName."
      : "Finding: alarm must use namespace AWS/ApplicationELB and dimension LoadBalancer=app/prod-web/50dc6c495c0c9188.";
    markFirstResourceFailed(runtime, "Alarm still uses the wrong namespace or missing LoadBalancer dimension.");
    return [
      "AlarmName: alb-5xx-prod",
      `Namespace: ${namespace}`,
      "MetricName: HTTPCode_ELB_5XX_Count",
      `Dimensions: ${dimensionName}=${dimensionValue}`,
      "StateValue: INSUFFICIENT_DATA",
      finding,
    ];
  }

  if (scenarioId === "observabilityAlarmAction") {
    if (observabilityFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "observabilityValidated", "Critical alarm notifies the on-call SNS topic for alarm and recovery states.");
      return [
        "AlarmName: api-latency-critical",
        "MetricName: TargetResponseTime",
        "AlarmActions: arn:aws:sns:eu-west-1:123456789012:oncall-critical",
        "OKActions: arn:aws:sns:eu-west-1:123456789012:oncall-critical",
        "StateValue: OK",
      ];
    }

    markFirstResourceFailed(runtime, "Critical alarm still has no notification actions.");
    return [
      "AlarmName: api-latency-critical",
      "MetricName: TargetResponseTime",
      "AlarmActions: []",
      "OKActions: []",
      "StateValue: ALARM",
      "Finding: no on-call topic is notified.",
    ];
  }

  return ["No CloudWatch alarm data for this scenario."];
}

export function logsDescribeLogGroups(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "observabilityLogRetention") {
    if (observabilityFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "observabilityValidated", "Application log group retention is set to 30 days.");
      return [
        "logGroupName: /aws/ecs/payments-api",
        "retentionInDays: 30",
        "storedBytes: 1829342",
      ];
    }

    markFirstResourceFailed(runtime, "Application log group still has no retention policy.");
    return [
      "logGroupName: /aws/ecs/payments-api",
      "retentionInDays: Never expire",
      "storedBytes: 9182736455",
    ];
  }

  return ["No CloudWatch Logs data for this scenario."];
}

export function promtoolTargets(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "observabilityPrometheusScrapeTarget") return ["promtool targets is not the validation command for this lab."];

  if (observabilityFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "observabilityValidated", "Prometheus scrapes checkout-api /metrics successfully.");
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "servicemonitor.checkout-api.selector" ? { ...resource, id: "app=checkout-api" } : resource,
    );
    return ["ACTIVE TARGETS", "checkout-api.default.svc:8080/metrics  UP  labels: app=checkout-api"];
  }

  markFirstResourceFailed(runtime, "ServiceMonitor selector still does not match checkout-api Service labels.");
  return ["DROPPED TARGETS", "checkout-api.default.svc:8080/metrics  DROPPED  selector app=checkout does not match service label app=checkout-api"];
}

export function otelcolValidate(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "observabilityOtelExporterEndpoint") return ["otelcol validate is not the validation command for this lab."];

  if (observabilityFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "observabilityValidated", "OpenTelemetry Collector exports traces to the OTLP gRPC endpoint.");
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "otel.exporter.otlp.endpoint" ? { ...resource, id: "tempo.observability.svc:4317" } : resource,
    );
    return ["otelcol config valid", "exporter otlp endpoint tempo.observability.svc:4317", "traces pipeline exporting"];
  }

  markFirstResourceFailed(runtime, "OTLP exporter still points at the wrong protocol endpoint.");
  return ["otelcol config warning", "exporter otlp endpoint tempo.observability.svc:4318", "export failed: gRPC exporter is pointed at HTTP OTLP port"];
}

export function kafkaConsumerGroupsDescribe(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "observabilityKafkaConsumerLag") return ["kafka-consumer-groups is not the validation command for this lab."];

  if (observabilityFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "observabilityValidated", "checkout-worker replicas match the six partition workload and lag is draining.");
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "deployment.checkout-worker.replicas" ? { ...resource, id: "6" } : resource,
    );
    return ["GROUP            TOPIC            PARTITIONS  CONSUMERS  LAG", "checkout-worker  checkout-events  6           6          12"];
  }

  markFirstResourceFailed(runtime, "Consumer deployment still has too few replicas for the six partition spike.");
  return ["GROUP            TOPIC            PARTITIONS  CONSUMERS  LAG", "checkout-worker  checkout-events  6           2          18420"];
}

export function costAndUsage(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "finopsNatGatewayCostSpike") {
    if (finopsFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "finopsValidated", "NAT gateway topology keeps high-availability egress while removing duplicate idle gateways.");
      return [
        "Service: Amazon Virtual Private Cloud",
        "UsageType: NatGateway-Hours",
        "MonthlyCost: 96.00 USD",
        "Finding: expected two production NAT gateways remain.",
      ];
    }

    markFirstResourceFailed(runtime, "Cost Explorer still shows extra idle NAT gateways.");
    return [
      "Service: Amazon Virtual Private Cloud",
      "UsageType: NatGateway-Hours",
      "MonthlyCost: 384.00 USD",
      "Finding: four NAT gateways are running, but only two AZs serve private workloads.",
    ];
  }

  if (scenarioId === "finopsS3Lifecycle") {
    if (finopsFixApplied(runtime, scenarioId)) {
      markOperationalScenarioSolved(runtime, "finopsValidated", "S3 lifecycle transitions old logs and expires temporary exports.");
      return [
        "Service: Amazon Simple Storage Service",
        "UsageType: TimedStorage-ByteHrs",
        "Trend: decreasing",
        "Finding: lifecycle policy is active.",
      ];
    }

    markFirstResourceFailed(runtime, "S3 storage cost is still growing without lifecycle controls.");
    return [
      "Service: Amazon Simple Storage Service",
      "UsageType: TimedStorage-ByteHrs",
      "Trend: increasing 38% month over month",
      "Finding: access logs and exports never transition or expire.",
    ];
  }

  return ["No Cost Explorer data for this scenario."];
}

export function ec2DescribeVolumes(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "finopsUnattachedEbsCleanup" && finopsFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "finopsValidated", "Unattached EBS volume is snapshotted and removed after the retention window.");
    return ["Volumes: []", "No unattached candidate volumes remain in this lab."];
  }

  if (scenarioId !== "finopsUnattachedEbsCleanup") return ["No EC2 volume inventory for this scenario."];

  return [
    "VolumeId: vol-0abc123",
    "State: available",
    "Size: 500",
    "CreateTime: 2025-10-18T11:20:00Z",
    "Finding: unattached EBS volume is still accruing storage cost.",
  ];
}
