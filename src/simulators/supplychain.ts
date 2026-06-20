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

export function syftCheckRelease(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "supplyChainSbomGenerationGate") return ["Syft is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (supplyChainFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "supplyChainValidated", "CycloneDX SBOM generated for checkout-api:2.5.0, release gate passed.");
    return [
      "syft check release checkout-api:2.5.0",
      "SBOM format: CycloneDX 1.4",
      "SBOM present: true",
      "Components: 142 packages catalogued",
      "Gate: passed",
    ];
  }
  markFirstResourceFailed(runtime, "No SBOM emitted; CycloneDX format required, release gate blocked.");
  return [
    "syft check release checkout-api:2.5.0",
    "SBOM format: (none)",
    "SBOM present: false",
    "Gate: blocked — no SBOM emitted",
    "Finding: generate a CycloneDX SBOM before release.",
  ];
}

export function cosignVerify(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "supplyChainCosignVerifyProvenance") return ["Cosign is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (supplyChainFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "supplyChainValidated", "Image signature verified, signing identity acme-signer confirmed.");
    return [
      "cosign verify ghcr.io/acme/checkout-api:2.5.0",
      "Verification for ghcr.io/acme/checkout-api:2.5.0 —",
      "The following checks were performed:",
      "  - The cosign claims were validated",
      "  - The signatures were verified against the specified public key",
      "  - Signing identity: acme-signer",
      "Verification: PASSED",
    ];
  }
  markFirstResourceFailed(runtime, "Image verification disabled or signing identity missing; pod admission rejected.");
  return [
    "cosign verify ghcr.io/acme/checkout-api:2.5.0",
    "Error: no matching signatures found",
    "signingIdentity: (empty)",
    "Verification: FAILED — pod admission rejected",
    "Finding: enable verification and set signing identity to acme-signer.",
  ];
}

export function grypeScan(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "supplyChainSyftGrypeVulnGate") return ["Grype is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (supplyChainFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "supplyChainValidated", "Image rebuilt on distroless base with justified exception, gate passed.");
    return [
      "grype scan checkout-api:2.5.0",
      "Base image: distroless",
      "Vulnerabilities: 0 (HIGH/CRITICAL)",
      "Exception: CVE-2024-99999 (justified, narrow scope)",
      "Gate: passed",
    ];
  }
  markFirstResourceFailed(runtime, "CVE in ubuntu base image; no justified exception and gate blocked.");
  return [
    "grype scan checkout-api:2.5.0",
    "Base image: ubuntu:22.04",
    "HIGH CVE-2024-11111  openssl  1.1.1t",
    "MEDIUM CVE-2024-99999  webpack-dev-server  5.0.0",
    "Gate: blocked — HIGH CVEs in base image",
    "Finding: rebuild on distroless and add a narrow justified exception.",
  ];
}

export function slsaVerifierVerify(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "supplyChainSlsaLevel3Provenance") return ["SLSA verifier is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (supplyChainFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "supplyChainValidated", "SLSA level 3 provenance verified with builder github-actions.");
    return [
      "slsa-verifier verify-image ghcr.io/acme/checkout-api:2.5.0",
      "Verifying image ghcr.io/acme/checkout-api:2.5.0",
      "Provenance: builderId=github-actions  slsaLevel=3",
      "Predicate type: https://slsa.dev/provenance/v1",
      "Verification: PASSED",
    ];
  }
  markFirstResourceFailed(runtime, "Provenance missing builder identity; SLSA level below 3.");
  return [
    "slsa-verifier verify-image ghcr.io/acme/checkout-api:2.5.0",
    "Verifying image ghcr.io/acme/checkout-api:2.5.0",
    "Provenance: builderId=(empty)  slsaLevel=0",
    "FAILED: builderId is required for SLSA level 3.",
    "Finding: set builderId to github-actions and slsaLevel to 3.",
  ];
}

export function pipAudit(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "supplyChainDependencyConfusion") return ["pip-audit is not configured for this lab."];
  runtime.flags.initialized = true;
  runtime.flags.validationPassed = true;
  if (supplyChainFixApplied(runtime, scenarioId)) {
    markOperationalScenarioSolved(runtime, "supplyChainValidated", "Dependencies resolved from private index with acme-internal-utils pinned to 1.2.3.");
    return [
      "pip-audit --index-url https://pypi.acme.internal/simple",
      "Index: pypi.acme.internal",
      "acme-internal-utils: 1.2.3 (pinned, private index)",
      "fastapi: 0.110.0 (public, transitive deps clean)",
      "Vulnerabilities: 0",
    ];
  }
  markFirstResourceFailed(runtime, "pip pulls from public pypi.org; acme-internal-utils unpinned and could resolve malicious version.");
  return [
    "pip-audit --index-url https://pypi.org/simple",
    "Index: pypi.org (PUBLIC)",
    "acme-internal-utils: 9.9.9 (latest public, potentially malicious)",
    "WARNING: private package resolved from public index",
    "Finding: pin to private index URL and exact version to avoid dependency confusion.",
  ];
}
