import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function policyFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "policyKyvernoRequireAppLabel") {
    const policy = runtime.files["policy.yaml"] ?? "";
    return (
      policy.includes("kind: ClusterPolicy") &&
      policy.includes("validationFailureAction: Enforce") &&
      policy.includes("message: Pods must define the app label.") &&
      policy.includes("pattern:") &&
      policy.includes("metadata:") &&
      policy.includes("labels:") &&
      policy.includes("app: \"?*\"")
    );
  }

  if (scenarioId === "policyKubernetesDefaultDenyIngress") {
    const policy = runtime.files["policy.yaml"] ?? "";
    return (
      policy.includes("kind: NetworkPolicy") &&
      policy.includes("name: default-deny-ingress") &&
      policy.includes("namespace: payments") &&
      policy.includes("podSelector: {}") &&
      policy.includes("policyTypes:") &&
      policy.includes("- Ingress") &&
      policy.includes("ingress: []")
    );
  }

  if (scenarioId === "policyIstioDenyUnauthenticated") {
    const policy = runtime.files["policy.yaml"] ?? "";
    return (
      policy.includes("kind: AuthorizationPolicy") &&
      policy.includes("name: require-jwt-checkout") &&
      policy.includes("namespace: checkout") &&
      policy.includes("selector:") &&
      policy.includes("matchLabels:") &&
      policy.includes("app: checkout-api") &&
      policy.includes("action: ALLOW") &&
      policy.includes("requestPrincipals:") &&
      policy.includes("- \"*\"")
    );
  }

  if (scenarioId === "policyCiliumAllowDnsEgress") {
    const policy = runtime.files["policy.yaml"] ?? "";
    return (
      policy.includes("kind: CiliumNetworkPolicy") &&
      policy.includes("name: allow-dns-egress") &&
      policy.includes("namespace: platform") &&
      policy.includes("matchLabels:") &&
      policy.includes("app: worker") &&
      policy.includes("toEndpoints:") &&
      policy.includes("k8s-app: kube-dns") &&
      policy.includes("toPorts:") &&
      policy.includes("port: \"53\"") &&
      policy.includes("protocol: UDP")
    );
  }

  return false;
}

export function policySuccessNote(scenarioId: string): string {
  if (scenarioId === "policyKubernetesDefaultDenyIngress") return "Namespace default deny ingress policy is valid and ready to apply.";
  if (scenarioId === "policyIstioDenyUnauthenticated") return "Istio authorization policy allows only authenticated JWT callers to checkout-api.";
  if (scenarioId === "policyCiliumAllowDnsEgress") return "Cilium policy allows worker egress to kube-dns on UDP/53 only.";
  return "Policy-as-code validation passed.";
}

export function policyFailureNote(scenarioId: string): string {
  if (scenarioId === "policyKubernetesDefaultDenyIngress") return "NetworkPolicy still selects only labeled pods or keeps an ingress allow rule.";
  if (scenarioId === "policyIstioDenyUnauthenticated") return "Istio policy still allows unauthenticated callers or targets the wrong workload.";
  if (scenarioId === "policyCiliumAllowDnsEgress") return "Cilium policy still misses kube-dns endpoint selection or UDP/53 port scoping.";
  return "Policy-as-code guardrail is still misconfigured.";
}

export function kyvernoTest(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "policyKyvernoRequireAppLabel") {
    return ["No Kyverno test suite is configured for this scenario."];
  }

  if (policyFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "policyValidated", "Kyverno policy enforces the required app label on Pods.");
    return [
      "Executing kyverno test .",
      "app-label-policy",
      "  pass: pod-with-app-label accepted",
      "  pass: pod-missing-app-label rejected",
      "Test Summary: 2 passed, 0 failed",
    ];
  }

  markFirstResourceFailed(runtime, "Kyverno test still allows a Pod without the required app label.");
  return [
    "Executing kyverno test .",
    "app-label-policy",
    "  pass: pod-with-app-label accepted",
    "  fail: pod-missing-app-label was accepted",
    "Test Summary: 1 passed, 1 failed",
  ];
}

export function kubectlDryRun(runtime: Scenario, scenarioId: string): string[] {
  if (!["policyKubernetesDefaultDenyIngress", "policyIstioDenyUnauthenticated", "policyCiliumAllowDnsEgress"].includes(scenarioId)) {
    return ["No Kubernetes server dry-run is configured for this scenario."];
  }

  if (policyFixApplied(runtime, scenarioId)) {
    const note = policySuccessNote(scenarioId);
    markOperationalScenarioSolved(runtime, "policyValidated", note);
    return [
      `${runtime.awsResources[0].id} configured (server dry run)`,
      note,
    ];
  }

  const note = policyFailureNote(scenarioId);
  markFirstResourceFailed(runtime, note);
  return [`${runtime.awsResources[0].id} configured (server dry run)`, `warning: ${note}`];
}
