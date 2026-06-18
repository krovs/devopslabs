import type { Scenario } from "../types";
import { markFirstResourceFailed, markOperationalScenarioSolved } from "./shared";

export function supplyChainFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "supplyChainSbomGenerationGate") {
    const file = runtime.files["release.json"] ?? "";
    return (
      file.includes('"sbomFormat": "CycloneDX"') &&
      file.includes('"sbomPresent": true') &&
      file.includes('"gate": "passed"')
    );
  }

  if (scenarioId === "supplyChainCosignVerifyProvenance") {
    const file = runtime.files["admission.yaml"] ?? "";
    return file.includes("verify: true") && file.includes("signingIdentity: acme-signer");
  }

  if (scenarioId === "supplyChainSyftGrypeVulnGate") {
    const file = runtime.files["scan.json"] ?? "";
    return (
      file.includes('"baseImage": "distroless"') &&
      file.includes('"ignoreJustified": true') &&
      file.includes('"gate": "passed"')
    );
  }

  if (scenarioId === "supplyChainSlsaLevel3Provenance") {
    const file = runtime.files["provenance.json"] ?? "";
    return file.includes('"builderId": "github-actions"') && file.includes('"slsaLevel": 3');
  }

  if (scenarioId === "supplyChainDependencyConfusion") {
    const file = runtime.files["requirements.txt"] ?? "";
    return (
      file.includes("--index-url https://pypi.acme.internal/simple") &&
      file.includes("acme-internal-utils==1.2.3") &&
      !file.includes("--index-url https://pypi.org/simple")
    );
  }

  return false;
}

export function supplyChainValidate(runtime: Scenario, scenarioId: string): string[] {
  if (supplyChainFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "supplyChainValidated", "Supply chain security gate passed.");
    return ["supply-chain validate: passed", "Supply chain security gate passed."];
  }

  markFirstResourceFailed(runtime, "Supply chain configuration still misses the required SBOM, signature, provenance, base image, or package scope fix.");
  return ["supply-chain validate: failed", "Supply chain configuration still misses the required SBOM, signature, provenance, base image, or package scope fix."];
}
