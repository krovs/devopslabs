import { describe, expect, it } from "vitest";
import { checkScenario, isScenarioSolved } from "../completion";
import type { Scenario } from "../types";
import { dependencyCheck, gitleaksDetect, mvnTest, trivyConfig, trivyImage } from "./appsec";

describe("AppSec simulator", () => {
  it("accepts env-backed secrets and any explicit non-root container user", () => {
    const scenario = javaDependencySecretsContainerAuditScenario();

    expect(dependencyCheck(scenario, "javaDependencySecretsContainerAudit")).toContain("No vulnerable dependencies found.");
    expect(gitleaksDetect(scenario, "javaDependencySecretsContainerAudit")).toContain("no leaks found");
    expect(trivyConfig(scenario, "javaDependencySecretsContainerAudit")).toContain("Dockerfile runs as a non-root user");
    expect(mvnTest(scenario, "javaDependencySecretsContainerAudit")).toContain("[INFO] BUILD SUCCESS");

    expect(checkScenario(scenario, "javaDependencySecretsContainerAudit", "pom.xml")).toEqual(["Scenario complete."]);
    expect(isScenarioSolved(scenario, "javaDependencySecretsContainerAudit", "pom.xml")).toBe(true);
    expect(scenario.stateResources.find((resource) => resource.address === "container.user")?.id).toBe("non-root");
  });

  it("accepts a real Trivy CVE ignore for the container image CVE gate", () => {
    const scenario = containerImageCveGateScenario("# accepted image finding\nCVE-2024-99999\n");

    expect(trivyImage(scenario, "containerImageCveGate")).toContain("Result: passed");
    expect(checkScenario(scenario, "containerImageCveGate", "Dockerfile")).toEqual(["Scenario complete."]);
  });

  it("rejects missing or wildcard Trivy ignores for the container image CVE gate", () => {
    const missingCve = containerImageCveGateScenario("");
    const wildcard = containerImageCveGateScenario("CVE-2024-99999\nCVE-2024-*\n");

    expect(trivyImage(missingCve, "containerImageCveGate")).toContain("Exception issue: .trivyignore must include CVE-2024-99999.");
    expect(trivyImage(wildcard, "containerImageCveGate")).toContain("Exception issue: wildcard ignores are not allowed.");
  });

  it("accepts newer safe logback versions instead of one exact version", () => {
    const scenario = javaDependencySecretsContainerAuditScenario();
    scenario.files["pom.xml"] = scenario.files["pom.xml"].replace("<version>1.4.14</version>", "<version>1.5.6</version>");

    expect(dependencyCheck(scenario, "javaDependencySecretsContainerAudit")).toContain("logback-classic: 1.5.6");
    expect(gitleaksDetect(scenario, "javaDependencySecretsContainerAudit")).toContain("no leaks found");
    expect(trivyConfig(scenario, "javaDependencySecretsContainerAudit")).toContain("Dockerfile runs as a non-root user");
    expect(mvnTest(scenario, "javaDependencySecretsContainerAudit")).toContain("[INFO] BUILD SUCCESS");
    expect(checkScenario(scenario, "javaDependencySecretsContainerAudit", "pom.xml")).toEqual(["Scenario complete."]);
    expect(scenario.stateResources.find((resource) => resource.address === "maven.logback-classic")?.id).toBe("1.5.6");
  });

  it("explains when the image tag and Trivy ignore are fixed but dev dependencies remain", () => {
    const scenario = containerImageCveGateScenario("CVE-2024-99999\n");
    scenario.files["Dockerfile"] = scenario.files["Dockerfile"].replace("RUN npm ci --omit=dev", "RUN npm ci");

    expect(trivyImage(scenario, "containerImageCveGate")).toContain("Dockerfile issue: change RUN npm ci to RUN npm ci --omit=dev.");
    expect(checkScenario(scenario, "containerImageCveGate", "Dockerfile")).toEqual([
      "Not complete: Dockerfile must change RUN npm ci to RUN npm ci --omit=dev.",
    ]);
  });
});

function javaDependencySecretsContainerAuditScenario(): Scenario {
  return {
    id: "javaDependencySecretsContainerAudit",
    kind: "appsec",
    title: "Java Dependency Secrets And Container Audit",
    description: "Test fixture.",
    primaryFile: "pom.xml",
    files: {
      "pom.xml": `
        <project>
          <dependencies>
            <dependency>
              <groupId>ch.qos.logback</groupId>
              <artifactId>logback-classic</artifactId>
              <version>1.4.14</version>
            </dependency>
          </dependencies>
        </project>
      `,
      "src/main/resources/application.yml": `
        security:
          jwt:
            issuer: checkout-api
            secret: \${SECRET}
      `,
      "Dockerfile": `
        FROM eclipse-temurin:17-jre
        WORKDIR /app
        COPY target/checkout-api.jar /app/checkout-api.jar
        RUN adduser --system user
        USER user
        ENTRYPOINT ["java", "-jar", "/app/checkout-api.jar"]
      `,
    },
    backend: {
      bucket: "appsec",
      key: "checkout-api-java-hygiene",
      table: "application-security",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "java_service",
        name: "checkout-api",
        id: "checkout-api",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "maven.logback-classic", id: "1.2.10" },
      { address: "secret.jwt", id: "committed" },
      { address: "container.user", id: "root" },
    ],
    flags: {
      initialized: false,
      securityPassed: false,
      secretsConfigured: false,
      lintPassed: false,
      runPassing: false,
      appsecValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Fix dependency, secret, and container findings."],
      commands: ["mvn org.owasp:dependency-check-maven:check", "gitleaks detect", "trivy config .", "mvn test"],
      explanation: "The release needs clean AppSec gates.",
      outcome: "AppSec gates pass.",
    },
  };
}

function containerImageCveGateScenario(trivyIgnore: string): Scenario {
  return {
    id: "containerImageCveGate",
    kind: "appsec",
    title: "Container Image CVE Gate",
    description: "Test fixture.",
    primaryFile: "Dockerfile",
    files: {
      "Dockerfile": "FROM node:20-bookworm-slim\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY src ./src\nUSER node\nCMD [\"node\", \"src/server.js\"]\n",
      ".github/workflows/container-security.yml": "run: trivy image --exit-code 1 --severity HIGH,CRITICAL checkout-api:pr-184\n",
      ".trivyignore": trivyIgnore,
    },
    backend: {
      bucket: "appsec",
      key: "checkout-api-container-cve-gate",
      table: "application-security",
      locked: false,
      lockId: null,
    },
    awsResources: [
      {
        type: "container_image",
        name: "checkout-api:pr-184",
        id: "checkout-api",
        status: "failed",
      },
    ],
    stateResources: [
      { address: "image.base", id: "node:18-bullseye" },
      { address: "image.dependencies", id: "includes-dev" },
      { address: "scanner.trivy.gate", id: "enabled-high-critical" },
      { address: "scanner.trivy.exception", id: "missing" },
    ],
    flags: {
      initialized: false,
      securityPassed: false,
      lintPassed: false,
      runPassing: true,
      appsecValidated: false,
    },
    solution: {
      summary: "Fix it.",
      steps: ["Document the exception."],
      commands: ["trivy image checkout-api:pr-184", "npm audit --production"],
      explanation: "The release needs a narrow exception.",
      outcome: "Image gate passes.",
    },
  };
}
