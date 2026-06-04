import type { Scenario } from "../types";

function markFirstResource(runtime: Scenario, status: string, note: string): void {
  if (!runtime.awsResources[0]) return;
  runtime.awsResources[0].status = status;
  runtime.awsResources[0].note = note;
}

function includesAll(source: string, terms: string[]): boolean {
  const lowerSource = source.toLowerCase();
  return terms.every((term) => lowerSource.includes(term));
}

function includesAny(source: string, terms: string[]): boolean {
  const lowerSource = source.toLowerCase();
  return terms.some((term) => lowerSource.includes(term));
}

function threatModelControlsFixed(runtime: Scenario): boolean {
  if (runtime.threatModel?.controls.length) {
    return runtime.threatModel.controls.every((control) => control.value === control.answer);
  }

  const threatModel = runtime.files["threat-model.md"] ?? "";
  return (
    !threatModel.includes("TODO") &&
    includesAll(threatModel, ["spoofing", "jwt", "issuer", "audience", "signature"]) &&
    includesAll(threatModel, ["tampering", "webhook", "signature", "idempotency"]) &&
    includesAll(threatModel, ["information disclosure", "customer", "encrypt"]) &&
    includesAny(threatModel, ["least-privilege", "least privilege"]) &&
    includesAll(threatModel, ["denial of service", "rate limiting", "throttling"])
  );
}

function syncStrideMarkdown(runtime: Scenario): void {
  if (!runtime.threatModel?.controls.length) return;
  const controls = Object.fromEntries(runtime.threatModel.controls.map((control) => [control.id, control.value]));
  runtime.files["threat-model.md"] = `# STRIDE Threat Model

| Area | STRIDE | Threat | Mitigation |
| --- | --- | --- | --- |
| Checkout API | Spoofing | ${controls.threat_checkout_identity} | ${controls.mitigation_checkout_identity}. |
| Payment webhook | Tampering | ${controls.threat_payment_webhook} | ${controls.mitigation_payment_webhook}. |
| Orders database | Information Disclosure | ${controls.threat_orders_disclosure} | ${controls.mitigation_orders_disclosure}. |
| Public API | Denial of Service | ${controls.threat_public_api_dos} | ${controls.mitigation_public_api_dos}. |
`;
}

export function threatModelFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (runtime.threatModel?.controls.length) return threatModelControlsFixed(runtime);
  if (scenarioId === "strideCheckoutThreatModel") return threatModelControlsFixed(runtime);
  return false;
}

export function threatModelReview(runtime: Scenario, scenarioId: string): string[] {
  if (threatModelControlsFixed(runtime)) {
    if (scenarioId === "strideCheckoutThreatModel") syncStrideMarkdown(runtime);
    runtime.flags.securityPassed = true;
    runtime.stateResources = runtime.stateResources.map((resource) => ({ ...resource, id: "covered" }));
    const coveredCategories = [...new Set(runtime.threatModel?.controls.map((control) => control.stride) ?? [])];
    const coverageLine = coveredCategories.length ? `${coveredCategories.join(", ")}: covered` : "Threat coverage: covered";
    markFirstResource(runtime, "success", "Threat model review covers the required data flows, trust boundaries, and mitigations.");
    return [
      "threatmodel review completed",
      coverageLine,
      "Review result: pass",
    ];
  }

  markFirstResource(runtime, "failed", "Threat model review still has missing or generic threat and mitigation entries.");
  return [
    "threatmodel review completed",
    "Review result: fail",
    "Missing concrete coverage for one or more data flows, trust boundaries, threats, or mitigations.",
  ];
}

export function markThreatModelScenarioSolved(runtime: Scenario): void {
  runtime.flags.threatModelValidated = true;
  markFirstResource(runtime, "success", "Threat model review passed.");
}
