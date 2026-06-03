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
  return applicationConfig.includes("secret: ${JWT_SECRET}") && !applicationConfig.includes("dev-secret-please-change");
}

function containerAuditFixed(runtime: Scenario): boolean {
  const dockerfile = runtime.files["Dockerfile"] ?? "";
  return /USER\s+appuser/.test(dockerfile);
}

function authAuditFixed(runtime: Scenario): boolean {
  const controller = runtime.files["src/main/java/com/acme/checkout/UserController.java"] ?? "";
  return controller.includes('@PreAuthorize("hasRole(\'ADMIN\')"') && !controller.includes("@RequestHeader(\"X-Role\")");
}

function sqlAuditFixed(runtime: Scenario): boolean {
  const repository = runtime.files["src/main/java/com/acme/checkout/UserRepository.java"] ?? "";
  return repository.includes("where email = ?") && repository.includes("email)") && !repository.includes("+ email +");
}

export function appsecFixApplied(runtime: Scenario, scenarioId: string): boolean {
  if (scenarioId === "javaDependencySecretsContainerAudit") {
    return dependencyAuditFixed(runtime) && secretAuditFixed(runtime) && containerAuditFixed(runtime);
  }
  if (scenarioId === "javaCodeAuthSqlAudit") return authAuditFixed(runtime) && sqlAuditFixed(runtime);
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
      resource.address === "container.user" ? { ...resource, id: "appuser" } : resource,
    );
    return ["trivy config . completed", "No HIGH or CRITICAL misconfigurations detected", "Dockerfile runs as appuser"];
  }

  markFirstResource(runtime, "failed", "Trivy still finds a container image that runs as root.");
  return ["trivy config . completed", "HIGH DS002: Specify at least 1 USER command in Dockerfile with non-root user."];
}

export function markAppsecScenarioSolved(runtime: Scenario, note: string): void {
  runtime.flags.appsecValidated = true;
  markFirstResource(runtime, "success", note);
}
