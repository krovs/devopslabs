import { describe, expect, it } from "vitest";
import { checkScenario, isScenarioSolved } from "../completion";
import type { Scenario } from "../types";
import { threatModelReview } from "./threatmodel";

describe("Threat Modeling simulator", () => {
  it("solves the STRIDE scenario after concrete threat-model coverage is reviewed", () => {
    const scenario = strideScenarioWith(`
# STRIDE Threat Model

| Area | STRIDE | Threat | Mitigation |
| --- | --- | --- | --- |
| Checkout API | Spoofing | Attacker forges a JWT to act as another customer. | Validate issuer, audience, expiry, and signature on every request. |
| Payment webhook | Tampering | Attacker modifies or replays a webhook callback. | Verify webhook signature, timestamp tolerance, and idempotency keys. |
| Orders database | Information Disclosure | Customer order data could be exposed through broad access. | Encrypt order data and restrict access with least privilege roles. |
| Public API | Denial of Service | High-volume requests could exhaust checkout capacity. | Apply rate limiting and request throttling before expensive operations. |
`);

    const output = threatModelReview(scenario, "strideCheckoutThreatModel");
    const completion = checkScenario(scenario, "strideCheckoutThreatModel", "threat-model.md");

    expect(output).toContain("Review result: pass");
    expect(completion).toEqual(["Scenario complete."]);
    expect(scenario.flags.securityPassed).toBe(true);
    expect(isScenarioSolved(scenario, "strideCheckoutThreatModel", "threat-model.md")).toBe(true);
    expect(scenario.stateResources.every((resource) => resource.id === "covered")).toBe(true);
  });

  it("does not solve the STRIDE scenario before threatmodel review runs", () => {
    const scenario = strideScenarioWith(`
# STRIDE Threat Model

| Area | STRIDE | Threat | Mitigation |
| --- | --- | --- | --- |
| Checkout API | Spoofing | Attacker forges a JWT to act as another customer. | Validate issuer, audience, expiry, and signature on every request. |
| Payment webhook | Tampering | Attacker modifies or replays a webhook callback. | Verify webhook signature, timestamp tolerance, and idempotency keys. |
| Orders database | Information Disclosure | Customer order data could be exposed through broad access. | Encrypt order data and restrict access with least-privilege roles. |
| Public API | Denial of Service | High-volume requests could exhaust checkout capacity. | Apply rate limiting and request throttling before expensive operations. |
`);

    expect(checkScenario(scenario, "strideCheckoutThreatModel", "threat-model.md")).toEqual([
      "Not complete: run threatmodel review after completing the STRIDE table.",
    ]);
    expect(isScenarioSolved(scenario, "strideCheckoutThreatModel", "threat-model.md")).toBe(false);
  });

  it("solves a threat-model scenario from completed diagram controls", () => {
    const scenario = diagramControlScenario();
    for (const control of scenario.threatModel?.controls ?? []) {
      control.value = control.answer;
    }

    const output = threatModelReview(scenario, "oidcDeploymentThreatModel");
    const completion = checkScenario(scenario, "oidcDeploymentThreatModel", "threat-model.md");

    expect(output).toContain("Review result: pass");
    expect(completion).toEqual(["Scenario complete."]);
    expect(scenario.flags.securityPassed).toBe(true);
    expect(scenario.stateResources.every((resource) => resource.id === "covered")).toBe(true);
  });
});

function strideScenarioWith(threatModel: string): Scenario {
  return {
    id: "strideCheckoutThreatModel",
    kind: "threatmodel",
    title: "STRIDE Checkout Threat Model",
    description: "Test fixture.",
    primaryFile: "threat-model.md",
    files: {
      "threat-model.md": threatModel,
    },
    backend: {
      bucket: "threatmodel",
      key: "checkout-api-stride",
      table: "threat-models",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "threat_model",
        name: "checkout-api",
        id: "stride-checkout",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "stride.spoofing", id: "missing" },
      { address: "stride.tampering", id: "missing" },
      { address: "stride.information-disclosure", id: "missing" },
      { address: "stride.denial-of-service", id: "missing" },
    ],
    flags: {
      securityPassed: false,
      threatModelValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Complete STRIDE rows."],
      commands: ["threatmodel review"],
      explanation: "Concrete risks must map to architecture.",
      outcome: "Review passes.",
    },
  };
}

function diagramControlScenario(): Scenario {
  return {
    id: "oidcDeploymentThreatModel",
    kind: "threatmodel",
    title: "OIDC Deployment Threat Model",
    description: "Test fixture.",
    primaryFile: "threat-model.md",
    files: {
      "threat-model.md": "TODO",
    },
    backend: {
      bucket: "threatmodel",
      key: "oidc-deployment-stride",
      table: "threat-models",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "threat_model",
        name: "oidc-deployment",
        id: "oidc-deploy",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "threat.oidc-subject", id: "missing" },
      { address: "threat.workflow-tampering", id: "missing" },
    ],
    flags: {
      securityPassed: false,
      threatModelValidated: false,
    },
    threatModel: {
      nodes: [],
      links: [],
      controls: [
        {
          id: "threat_oidc_subject",
          rowId: "oidc_subject",
          field: "threat",
          label: "GitHub OIDC subject threat",
          stride: "Spoofing",
          value: "TODO",
          answer: "Attacker runs workflow from an untrusted branch or fork to request a deploy token",
          options: "TODO,Attacker runs workflow from an untrusted branch or fork to request a deploy token",
        },
        {
          id: "mitigation_oidc_subject",
          rowId: "oidc_subject",
          field: "mitigation",
          label: "GitHub OIDC subject mitigation",
          stride: "Spoofing",
          value: "TODO",
          answer: "Restrict OIDC trust to repository branch environment and audience claims",
          options: "TODO,Restrict OIDC trust to repository branch environment and audience claims",
        },
      ],
    },
    solution: {
      summary: "Fix it.",
      steps: ["Complete the controls."],
      commands: ["threatmodel review"],
      explanation: "Concrete risks must map to architecture.",
      outcome: "Review passes.",
    },
  };
}
