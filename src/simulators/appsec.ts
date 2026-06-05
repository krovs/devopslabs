import type { Scenario } from "../types";

function markFirstResource(runtime: Scenario, status: string, note: string): void {
  if (!runtime.awsResources[0]) return;
  runtime.awsResources[0].status = status;
  runtime.awsResources[0].note = note;
}

function dependencyAuditFixed(runtime: Scenario): boolean {
  const pom = runtime.files["pom.xml"] ?? "";
  return pom.includes("<artifactId>logback-classic</artifactId>") && pom.includes("<version>1.4.14</version>");
}

function secretAuditFixed(runtime: Scenario): boolean {
  const applicationConfig = runtime.files["src/main/resources/application.yml"] ?? "";
  return /secret:\s*\$\{[A-Z_][A-Z0-9_]*\}/.test(applicationConfig) && !applicationConfig.includes("dev-secret-please-change");
}

function containerAuditFixed(runtime: Scenario): boolean {
  const dockerfile = runtime.files["Dockerfile"] ?? "";
  const userMatch = dockerfile.match(/^\s*USER\s+([^\s#]+)/m);
  if (!userMatch) return false;

  const user = userMatch[1].trim().toLowerCase();
  return user !== "root" && user !== "0";
}

function authAuditFixed(runtime: Scenario): boolean {
  const controller = runtime.files["src/main/java/com/acme/checkout/UserController.java"] ?? "";
  return controller.includes('@PreAuthorize("hasRole(\'ADMIN\')"') && !controller.includes("@RequestHeader(\"X-Role\")");
}

function sqlAuditFixed(runtime: Scenario): boolean {
  const repository = runtime.files["src/main/java/com/acme/checkout/UserRepository.java"] ?? "";
  return repository.includes("where email = ?") && repository.includes("email)") && !repository.includes("+ email +");
}

function trivyIgnoreEntries(trivyIgnore: string): string[] {
  return trivyIgnore
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function trivyExceptionStatus(trivyIgnore: string): {
  cve: boolean;
  wildcard: boolean;
  valid: boolean;
} {
  const entries = trivyIgnoreEntries(trivyIgnore);
  const status = {
    cve: entries.includes("CVE-2024-99999"),
    wildcard: entries.some((entry) => entry.includes("*")),
  };

  return {
    ...status,
    valid: status.cve && !status.wildcard,
  };
}

function containerImageGateState(runtime: Scenario) {
  const dockerfile = runtime.files["Dockerfile"] ?? "";
  const trivyIgnore = runtime.files[".trivyignore"] ?? "";
  const workflow = runtime.files[".github/workflows/container-security.yml"] ?? "";

  return {
    baseFixed: dockerfile.includes("FROM node:20-bookworm-slim"),
    prodOnly: dockerfile.includes("npm ci --omit=dev"),
    gateEnabled: workflow.includes("--exit-code 1") && workflow.includes("--severity HIGH,CRITICAL"),
    gateDisabled: workflow.includes("--exit-code 0") || workflow.includes("--severity CRITICAL"),
    exception: trivyExceptionStatus(trivyIgnore),
  };
}

export function containerImageGateIssues(runtime: Scenario): string[] {
  const { baseFixed, prodOnly, gateEnabled, gateDisabled, exception } = containerImageGateState(runtime);
  const issues: string[] = [];

  if (!baseFixed) issues.push("Dockerfile must use FROM node:20-bookworm-slim.");
  if (!prodOnly) issues.push("Dockerfile must change RUN npm ci to RUN npm ci --omit=dev.");
  if (!gateEnabled || gateDisabled) issues.push("Trivy gate must keep --exit-code 1 and --severity HIGH,CRITICAL.");
  if (!exception.cve) issues.push(".trivyignore must include CVE-2024-99999.");
  if (exception.wildcard) issues.push(".trivyignore must not use wildcard ignores.");

  return issues;
}

function containerImageGateFixed(runtime: Scenario): boolean {
  const { baseFixed, prodOnly, gateEnabled, gateDisabled, exception } = containerImageGateState(runtime);

  return baseFixed
    && prodOnly
    && gateEnabled
    && exception.valid
    && !gateDisabled;
}

export function appsecFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "javaDependencySecretsContainerAudit") {
    return dependencyAuditFixed(runtime) && secretAuditFixed(runtime) && containerAuditFixed(runtime);
  }
  if (scenarioId === "javaCodeAuthSqlAudit") return authAuditFixed(runtime) && sqlAuditFixed(runtime);
  if (scenarioId === "containerImageCveGate") return containerImageGateFixed(runtime);
  return false;
}

export function mvnTest(runtime: Scenario, scenarioId: string): string[] {
  runtime.flags.initialized = true;
  runtime.flags.runPassing = true;

  if (scenarioId === "javaCodeAuthSqlAudit" && !appsecFixApplied(runtime, scenarioId)) {
    return ["[INFO] Running com.acme.checkout.UserControllerTest", "[INFO] Tests run: 4, Failures: 0", "[WARNING] Unit tests passed, but security scan findings remain."];
  }

  return ["[INFO] Running com.acme.checkout.CheckoutApiTest", "[INFO] Tests run: 6, Failures: 0, Errors: 0", "[INFO] BUILD SUCCESS"];
}

export function dependencyCheck(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "javaDependencySecretsContainerAudit") return ["Dependency-Check completed", "No vulnerable dependencies found."];

  if (dependencyAuditFixed(runtime)) {
    runtime.flags.securityPassed = true;
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "maven.logback-classic" ? { ...resource, id: "1.4.14" } : resource,
    );
    return ["Dependency-Check completed", "No vulnerable dependencies found.", "logback-classic: 1.4.14"];
  }

  markFirstResource(runtime, "failed", "Dependency-check still finds vulnerable logback-classic 1.2.10.");
  return [
    "Dependency-Check completed",
    "CRITICAL CVE finding: ch.qos.logback:logback-classic:1.2.10",
    "Fix: upgrade logback-classic to 1.4.14 or newer approved version.",
  ];
}

export function semgrepScan(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "javaCodeAuthSqlAudit") return ["semgrep scan completed", "0 findings"];

  if (authAuditFixed(runtime) && sqlAuditFixed(runtime)) {
    runtime.flags.securityPassed = true;
    runtime.stateResources = runtime.stateResources.map((resource) => {
      if (resource.address === "controller.admin.authorization") return { ...resource, id: "spring-security-preauthorize" };
      if (resource.address === "repository.user.findByEmail") return { ...resource, id: "parameterized-query" };
      return resource;
    });
    return ["semgrep scan completed", "0 blocking findings"];
  }

  const findings = ["semgrep scan completed"];
  if (!authAuditFixed(runtime)) findings.push("HIGH java.spring.security.header-auth: admin endpoint trusts client-controlled X-Role header.");
  if (!sqlAuditFixed(runtime)) findings.push("HIGH java.sql.injection: findByEmail concatenates user input into SQL.");
  markFirstResource(runtime, "failed", "Semgrep still finds authorization or SQL injection issues.");
  return findings;
}

export function gitleaksDetect(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "javaDependencySecretsContainerAudit") return ["gitleaks detect completed", "no leaks found"];

  if (secretAuditFixed(runtime)) {
    runtime.flags.secretsConfigured = true;
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "secret.jwt" ? { ...resource, id: "externalized" } : resource,
    );
    return ["gitleaks detect completed", "no leaks found"];
  }

  markFirstResource(runtime, "failed", "Gitleaks still finds committed JWT material in application.yml.");
  return ["gitleaks detect completed", "Finding: generic-api-key in src/main/resources/application.yml", "Secret: dev-secret-please-change"];
}

export function trivyConfig(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "javaDependencySecretsContainerAudit") return ["trivy config . completed", "No misconfigurations detected"];

  if (containerAuditFixed(runtime)) {
    runtime.flags.lintPassed = true;
    runtime.stateResources = runtime.stateResources.map((resource) =>
      resource.address === "container.user" ? { ...resource, id: "non-root" } : resource,
    );
    return ["trivy config . completed", "No HIGH or CRITICAL misconfigurations detected", "Dockerfile runs as a non-root user"];
  }

  markFirstResource(runtime, "failed", "Trivy still finds a container image that runs as root.");
  return ["trivy config . completed", "HIGH DS002: Specify at least 1 USER command in Dockerfile with non-root user."];
}

export function githubRunView(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "containerImageCveGate") return ["GitHub Actions run completed", "No container security failure found."];

  runtime.flags.initialized = true;
  return [
    "container-security / image-scan",
    "Build image: docker build -t checkout-api:pr-184 .",
    "Scan image: trivy image --exit-code 1 --severity HIGH,CRITICAL checkout-api:pr-184",
    "Result: failed",
    "HIGH CVE-2024-11111 in debian openssl from node:18-bullseye",
    "CRITICAL CVE-2024-22222 in debian glibc from node:18-bullseye",
    "MEDIUM CVE-2024-99999 in webpack-dev-server dev dependency",
    "Policy: approved Node.js runtime baseline is node:20-bookworm-slim",
  ];
}

export function dockerHistory(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "containerImageCveGate") return ["IMAGE          CREATED BY", "checkout-api    Dockerfile"];

  const dockerfile = runtime.files["Dockerfile"] ?? "";
  const base = dockerfile.includes("node:20-bookworm-slim") ? "node:20-bookworm-slim" : "node:18-bullseye";
  return [
    "IMAGE          CREATED BY",
    "<checkout>    CMD [\"node\", \"src/server.js\"]",
    "<checkout>    USER node",
    "<checkout>    COPY src ./src",
    "<checkout>    RUN npm ci" + (dockerfile.includes("--omit=dev") ? " --omit=dev" : ""),
    `<base>        FROM ${base}`,
  ];
}

export function npmAuditProduction(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "containerImageCveGate") return ["npm audit --production completed", "found 0 vulnerabilities"];

  runtime.flags.runPassing = true;
  return [
    "npm audit --production",
    "production dependencies: express@4.18.3",
    "found 0 vulnerabilities",
    "dev dependency webpack-dev-server is not included in production audit scope",
  ];
}

export function trivyImage(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "containerImageCveGate") return ["trivy image completed", "No HIGH or CRITICAL vulnerabilities detected"];

  const { baseFixed, prodOnly, gateEnabled, gateDisabled, exception } = containerImageGateState(runtime);

  if (baseFixed && prodOnly && gateEnabled && !gateDisabled && exception.valid) {
    runtime.flags.securityPassed = true;
    runtime.flags.lintPassed = true;
    runtime.stateResources = runtime.stateResources.map((resource) => {
      if (resource.address === "image.base") return { ...resource, id: "node:20-bookworm-slim" };
      if (resource.address === "image.dependencies") return { ...resource, id: "production-only" };
      if (resource.address === "scanner.trivy.exception") return { ...resource, id: "CVE-2024-99999" };
      return resource;
    });
    return [
      "trivy image checkout-api:pr-184",
      "HIGH/CRITICAL vulnerabilities: 0",
      "ignored: CVE-2024-99999 from .trivyignore",
      "Result: passed",
    ];
  }

  markFirstResource(runtime, "failed", "Trivy image gate still has blocking findings or unsafe exception handling.");
  const findings = ["trivy image checkout-api:pr-184", "Result: failed"];
  if (!baseFixed) {
    findings.push(
      "HIGH CVE-2024-11111 openssl fixed in newer Debian/Node base image.",
      "CRITICAL CVE-2024-22222 glibc fixed in newer Debian/Node base image.",
      "Policy: use approved Node.js runtime baseline node:20-bookworm-slim.",
    );
  }
  if (!prodOnly) {
    findings.push(
      "MEDIUM CVE-2024-99999 webpack-dev-server is present because dev dependencies are installed in the runtime image.",
      "Dockerfile issue: change RUN npm ci to RUN npm ci --omit=dev.",
    );
  }
  if (!gateEnabled || gateDisabled) findings.push("Gate issue: Trivy HIGH/CRITICAL exit-code enforcement must remain enabled.");
  if (!exception.valid) {
    if (!exception.cve) findings.push("Exception issue: .trivyignore must include CVE-2024-99999.");
    if (exception.wildcard) findings.push("Exception issue: wildcard ignores are not allowed.");
  }
  return findings;
}

export function markAppsecScenarioSolved(runtime: Scenario, note: string): void {
  runtime.flags.appsecValidated = true;
  markFirstResource(runtime, "success", note);
}
