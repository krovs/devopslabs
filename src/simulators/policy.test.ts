import { describe, expect, it } from "vitest";
import { checkScenario } from "../completion";
import type { Scenario } from "../types";
import { kubectlDryRun, kyvernoTest } from "./policy";

function kyvernoScenario(policy: string): Scenario {
  return {
    id: "policyKyvernoRequireAppLabel",
    kind: "policy",
    title: "Kyverno Require App Label",
    description: "Fix a Kyverno policy.",
    primaryFile: "policy.yaml",
    files: {
      "policy.yaml": policy,
    },
    backend: {
      bucket: "policy-as-code",
      key: "kyverno-require-app-label",
      table: "none",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "policy_as_code",
        name: "require-app-label",
        id: "kyverno/require-app-label",
        status: "failed",
      },
    ],
    stateResources: [],
    flags: {
      policyValidated: false,
    },
  };
}

function policyScenario(id: string, policy: string): Scenario {
  return {
    ...kyvernoScenario(policy),
    id,
    title: "Policy Scenario",
  };
}

describe("policy simulator", () => {
  it("accepts valid Kyverno app-label policy regardless of message text", () => {
    const scenario = kyvernoScenario(`apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-app-label
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-app-label
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: Pods should define useful ownership metadata.
        pattern:
          metadata:
            labels:
              app: "?*"
`);

    expect(kyvernoTest(scenario, scenario.id)).toContain("Test Summary: 2 passed, 0 failed");
    expect(checkScenario(scenario, scenario.id, "policy.yaml")).toEqual(["Scenario complete."]);
  });

  it("accepts Kubernetes default-deny ingress without an explicit empty ingress list", () => {
    const scenario = policyScenario("policyKubernetesDefaultDenyIngress", `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: payments
spec:
  podSelector: {}
  policyTypes:
    - Ingress
`);

    expect(kubectlDryRun(scenario, scenario.id)).toContain("Namespace default deny ingress policy is valid and ready to apply.");
    expect(checkScenario(scenario, scenario.id, "policy.yaml")).toEqual(["Scenario complete."]);
  });

  it("accepts Istio requestPrincipals as an inline YAML list", () => {
    const scenario = policyScenario("policyIstioDenyUnauthenticated", `apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt-checkout
  namespace: checkout
spec:
  selector:
    matchLabels:
      app: checkout-api
  action: ALLOW
  rules:
    - from:
        - source:
            requestPrincipals: ["*"]
    - to:
        - operation:
            methods: ["GET", "POST"]
`);

    expect(kubectlDryRun(scenario, scenario.id)).toContain("Istio authorization policy allows only authenticated JWT callers to checkout-api.");
    expect(checkScenario(scenario, scenario.id, "policy.yaml")).toEqual(["Scenario complete."]);
  });
});
