import { isGenericGithubActionsScenario, workflowFailedStep } from "./simulators/cicd";
import { appsecFixApplied, containerImageGateIssues, markAppsecScenarioSolved } from "./simulators/appsec";
import { cloudsecFixApplied, markCloudsecScenarioSolved } from "./simulators/cloudsec";
import { gitopsFixApplied } from "./simulators/gitops";
import { iamFixApplied, markIamScenarioSolved, scpFixApplied, scpSuccessNote } from "./simulators/identity";
import { markMlopsScenarioSolved, mlopsFixApplied } from "./simulators/mlops";
import { dnsFixApplied, finopsFixApplied, observabilityFixApplied, secretsFixApplied } from "./simulators/ops";
import { policyFixApplied } from "./simulators/policy";
import { hasStateAddress } from "./simulators/terraform";
import { markThreatModelScenarioSolved, threatModelFixApplied } from "./simulators/threatmodel";
import { parseSimpleYaml } from "./simpleYaml";
import type { Scenario, ScenarioFlags } from "./types";

type OperationalCompletionFlag = Extract<
  keyof ScenarioFlags,
  "secretsValidated" | "dnsValidated" | "observabilityValidated" | "finopsValidated" | "policyValidated" | "gitopsValidated"
  | "linuxValidated" | "kubernetesValidated" | "appsecValidated" | "threatModelValidated" | "cloudsecValidated" | "mlopsValidated"
>;

function markFirstResource(runtime: Scenario, status: string, note: string): void {
  if (!runtime.awsResources[0]) return;
  runtime.awsResources[0].status = status;
  runtime.awsResources[0].note = note;
}

function markOperationalScenarioSolved(runtime: Scenario, flag: OperationalCompletionFlag, note: string): void {
  runtime.flags[flag] = true;
  markFirstResource(runtime, "exists", note);
}

function jsonValidationErrors(runtime: Scenario): string[] {
  return Object.entries(runtime.files)
    .filter(([fileName]) => fileName.endsWith(".json"))
    .flatMap(([fileName, source]) => {
      try {
        JSON.parse(source);
        return [];
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON";
        return [`Invalid JSON in ${fileName}: ${message}`];
      }
    });
}

function yamlValidationErrors(runtime: Scenario): string[] {
  return Object.entries(runtime.files)
    .filter(([fileName]) => fileName.endsWith(".yaml") || fileName.endsWith(".yml"))
    .flatMap(([fileName, source]) => {
      try {
        parseSimpleYaml(source);
        return [];
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid YAML";
        return [`Invalid YAML in ${fileName}: ${message}`];
      }
    });
}

function syntaxValidationErrors(runtime: Scenario): string[] {
  return [...jsonValidationErrors(runtime), ...yamlValidationErrors(runtime)];
}

export function prReviewIsCorrect(runtime: Scenario): boolean {
  if (!runtime.prReview) return false;
  const decisionMatches = runtime.prReview.decision === runtime.prReview.expectedDecision;
  const requiredFindingsSelected = runtime.prReview.findings.every((finding) => finding.required === finding.selected);
  return decisionMatches && requiredFindingsSelected;
}

export function checkScenario(runtime: Scenario, scenarioId: string, activeFileName: string): string[] {
  const syntaxErrors = syntaxValidationErrors(runtime);
  if (syntaxErrors.length > 0) return syntaxErrors;

  if (isScenarioSolved(runtime, scenarioId, activeFileName)) return ["Scenario complete."];
  if (runtime.flags.solutionViewed) return ["Not complete: the solution was viewed for this attempt. Reset the lab and solve it without opening the solution to mark it complete."];

  if (runtime.kind === "cicd") {
    if (scenarioId === "githubActionsMissingSecret" && !runtime.flags.secretsConfigured) {
      return ["Not complete: AWS_ROLE_ARN is still missing from repository secrets."];
    }
    if (scenarioId === "githubActionsWrongWorkingDirectory" && !runtime.flags.workflowFixed) {
      return ["Not complete: the workflow still needs the correct working-directory."];
    }
    if (scenarioId === "githubActionsAwsOidcTrust" && !runtime.flags.workflowFixed) {
      return ["Not complete: the AWS OIDC trust policy still allows the wrong branch subject."];
    }
    if (scenarioId === "githubActionsCheckovGate" && !runtime.flags.securityPassed) {
      return ["Not complete: Checkov is still failing."];
    }
    if (scenarioId === "githubActionsOverbroadPermissions" && !runtime.flags.lintPassed) {
      return ["Not complete: actionlint is still failing on workflow permissions."];
    }
    if (isGenericGithubActionsScenario(scenarioId) && !runtime.flags.workflowFixed) {
      return [`Not complete: ${workflowFailedStep(runtime, scenarioId)} is still failing.`];
    }
    return ["Not complete: re-run the workflow and inspect the result."];
  }

  if (runtime.kind === "gitops") {
    if (!gitopsFixApplied(runtime, scenarioId)) return ["Not complete: GitOps reconciliation still points at the wrong desired state or is not reconciling."];
    markOperationalScenarioSolved(runtime, "gitopsValidated", "GitOps reconciliation now matches the intended desired state.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "linux") {
    if (!runtime.flags.linuxValidated) return ["Not complete: inspect the log, restore the missing service environment, and restart the service."];
    markOperationalScenarioSolved(runtime, "linuxValidated", "Linux service triage completed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "kubernetes") {
    if (!runtime.flags.kubernetesValidated) return ["Not complete: inspect the workload, fix the Kubernetes configuration, and verify the rollout."];
    markOperationalScenarioSolved(runtime, "kubernetesValidated", "Kubernetes workload troubleshooting completed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "appsec") {
    if (scenarioId === "containerImageCveGate" && !appsecFixApplied(runtime, scenarioId)) {
      return containerImageGateIssues(runtime).map((issue) => `Not complete: ${issue}`);
    }
    if (!appsecFixApplied(runtime, scenarioId)) return ["Not complete: application security findings still exist in dependencies, secrets, container config, source code, or image gate configuration."];
    const javaAppsecScenario = scenarioId === "javaDependencySecretsContainerAudit" || scenarioId === "javaCodeAuthSqlAudit";
    if (scenarioId === "containerImageCveGate") {
      if (!runtime.flags.securityPassed) return ["Not complete: run trivy image after fixing the base image, dependency scope, and scanner exception."];
      if (!runtime.flags.runPassing) return ["Not complete: run npm audit --production to confirm production dependencies are clean."];
      markAppsecScenarioSolved(runtime, "Container image CVE gate passed.");
      return ["Scenario complete."];
    }
    if (scenarioId === "javaDependencySecretsContainerAudit") {
      if (!runtime.flags.securityPassed) return ["Not complete: dependency-check has not passed after the dependency fix."];
      if (!runtime.flags.secretsConfigured) return ["Not complete: gitleaks has not passed after externalizing the JWT secret."];
      if (!runtime.flags.lintPassed) return ["Not complete: trivy config has not passed after adding the non-root container user."];
    }
    if (scenarioId === "javaCodeAuthSqlAudit" && !runtime.flags.securityPassed) return ["Not complete: semgrep still needs to pass after the code fixes."];
    if (javaAppsecScenario && !runtime.flags.runPassing) return ["Not complete: run mvn test after the Java security fixes."];
    markAppsecScenarioSolved(runtime, "Java application security audit passed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "threatmodel") {
    if (!threatModelFixApplied(runtime, scenarioId)) return ["Not complete: STRIDE table still needs concrete threats and mitigations."];
    if (!runtime.flags.securityPassed) return ["Not complete: run threatmodel review after completing the STRIDE table."];
    markThreatModelScenarioSolved(runtime);
    return ["Scenario complete."];
  }

  if (runtime.kind === "cloudsec") {
    if (!runtime.flags.initialized) return ["Not complete: start from the GuardDuty finding list."];
    if (!runtime.flags.validationPassed) return ["Not complete: inspect GuardDuty, CloudTrail, and CloudWatch Logs before changing IAM."];
    if (!runtime.flags.cleanPlan) return ["Not complete: inspect AWS Config resource history for the policy change."];
    if (!cloudsecFixApplied(runtime, scenarioId)) return ["Not complete: DeveloperSupportRole still has broad S3 or iam:PassRole access."];
    if (!runtime.flags.securityPassed) return ["Not complete: run IAM simulation after narrowing the policy."];
    markCloudsecScenarioSolved(runtime);
    return ["Scenario complete."];
  }

  if (runtime.kind === "mlops") {
    if (!runtime.flags.initialized) return ["Not complete: inspect the MLOps pipeline or model registry status before applying the fix."];
    if (!mlopsFixApplied(runtime, scenarioId)) return ["Not complete: MLOps configuration still has the wrong dataset version or promotion metadata."];
    if (!runtime.flags.runPassing) return ["Not complete: run the MLOps validation command after applying the fix."];
    markMlopsScenarioSolved(runtime);
    return ["Scenario complete."];
  }

  if (runtime.kind === "iam") {
    if (!iamFixApplied(runtime, scenarioId)) return ["Not complete: IAM policy or trust conditions are still too broad or missing required constraints."];
    markIamScenarioSolved(runtime, "IAM validation passed for the requested access path.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "scp") {
    if (!scpFixApplied(runtime, scenarioId)) return ["Not complete: SCP still blocks or permits the wrong organization-level action."];
    runtime.flags.scpValidated = true;
    markFirstResource(runtime, "exists", scpSuccessNote(scenarioId));
    return ["Scenario complete."];
  }

  if (runtime.kind === "secrets") {
    if (!secretsFixApplied(runtime, scenarioId)) return ["Not complete: secret configuration still misses the required path, KMS, rotation, or decryption setting."];
    markOperationalScenarioSolved(runtime, "secretsValidated", "Secrets management validation passed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "dns") {
    if (!dnsFixApplied(runtime, scenarioId)) return ["Not complete: DNS/TLS configuration still has an invalid record, alias target, certificate region, or validation value."];
    markOperationalScenarioSolved(runtime, "dnsValidated", "DNS/TLS validation passed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "observability") {
    if (!observabilityFixApplied(runtime, scenarioId)) return ["Not complete: observability configuration still has a missing retention policy or incorrect alarm signal."];
    markOperationalScenarioSolved(runtime, "observabilityValidated", "Observability validation passed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "finops") {
    if (!finopsFixApplied(runtime, scenarioId)) return ["Not complete: cost optimization configuration still misses the required cost control."];
    markOperationalScenarioSolved(runtime, "finopsValidated", "FinOps validation passed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "policy") {
    if (!policyFixApplied(runtime, scenarioId)) return ["Not complete: policy-as-code guardrail still does not enforce the required workload behavior."];
    markOperationalScenarioSolved(runtime, "policyValidated", "Policy-as-code validation passed.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "awsconfig") {
    if (!runtime.flags.securityPassed) return ["Not complete: Checkov is still finding AWS service misconfigurations."];
    if (!runtime.flags.cleanPlan) return ["Not complete: run terraform plan after the config review passes."];
    runtime.flags.configValidated = true;
    return ["Scenario complete."];
  }

  if (runtime.kind === "pr") {
    if (!runtime.prReview?.decision || runtime.prReview.decision === "pending") return ["Not complete: submit a PR review decision."];
    if (!prReviewIsCorrect(runtime)) return ["Not complete: review decision or selected findings do not match the PR risk."];
    runtime.flags.reviewPassed = true;
    markFirstResource(runtime, "success", "PR review blocks the risky change with the right findings.");
    return ["Scenario complete."];
  }

  if (runtime.kind === "terragrunt") {
    if (!runtime.flags.initialized) return ["Not complete: Terragrunt has not initialized the stack."];
    if (scenarioId === "terragruntHclfmt" && !runtime.flags.lintPassed) return ["Not complete: terragrunt hclfmt is still failing."];
    if (!runtime.flags.validationPassed) return ["Not complete: run terragrunt validate until it succeeds."];
    if (!runtime.flags.cleanPlan) return ["Not complete: run terragrunt plan until it returns no changes."];
    return ["Not complete: inspect the stack and dependency state."];
  }

  if (runtime.backend.locked) return ["Not complete: state is still locked."];
  if (!runtime.flags.initialized) return ["Not complete: Terraform has not been initialized."];
  if (!runtime.flags.cleanPlan) return ["Not complete: run terraform plan until it returns no changes."];
  return ["Not complete: inspect the plan and resource state."];
}

export function isScenarioSolved(runtime: Scenario, scenarioId: string, activeFileName: string): boolean {
  if (runtime.flags.solutionViewed) return false;
  if (runtime.kind === "iam") return Boolean(runtime.flags.iamValidated);
  if (runtime.kind === "scp") return Boolean(runtime.flags.scpValidated);
  if (runtime.kind === "pr") return Boolean(runtime.flags.reviewPassed);
  if (runtime.kind === "secrets") return Boolean(runtime.flags.secretsValidated);
  if (runtime.kind === "dns") return Boolean(runtime.flags.dnsValidated);
  if (runtime.kind === "observability") return Boolean(runtime.flags.observabilityValidated);
  if (runtime.kind === "finops") return Boolean(runtime.flags.finopsValidated);
  if (runtime.kind === "policy") return Boolean(runtime.flags.policyValidated);
  if (runtime.kind === "gitops") return Boolean(runtime.flags.gitopsValidated);
  if (runtime.kind === "linux") return Boolean(runtime.flags.linuxValidated);
  if (runtime.kind === "kubernetes") return Boolean(runtime.flags.kubernetesValidated);
  if (runtime.kind === "appsec") return Boolean(runtime.flags.appsecValidated);
  if (runtime.kind === "threatmodel") return Boolean(runtime.flags.threatModelValidated);
  if (runtime.kind === "cloudsec") return Boolean(runtime.flags.cloudsecValidated);
  if (runtime.kind === "mlops") return Boolean(runtime.flags.mlopsValidated);
  if (runtime.kind === "awsconfig") return Boolean(runtime.flags.configValidated && runtime.flags.cleanPlan);
  if (scenarioId === "githubActionsMissingSecret") return Boolean(runtime.flags.secretsConfigured && runtime.flags.runPassing);
  if (scenarioId === "githubActionsWrongWorkingDirectory") return Boolean(runtime.flags.workflowFixed && runtime.flags.runPassing);
  if (scenarioId === "githubActionsAwsOidcTrust") return Boolean(runtime.flags.workflowFixed && runtime.flags.runPassing);
  if (scenarioId === "githubActionsCheckovGate") return Boolean(runtime.flags.securityPassed && runtime.flags.runPassing);
  if (scenarioId === "githubActionsOverbroadPermissions") return Boolean(runtime.flags.lintPassed && runtime.flags.runPassing);
  if (isGenericGithubActionsScenario(scenarioId)) return Boolean(runtime.flags.workflowFixed && runtime.flags.runPassing);
  if (scenarioId === "terraformCheckovPublicS3") return Boolean(runtime.flags.securityPassed && runtime.flags.cleanPlan);
  if (scenarioId === "terraformValidateBadReference") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
  if (scenarioId === "terraformModuleMissingOutput") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
  if (scenarioId === "terraformModuleWrongSource") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
  if (scenarioId === "terraformModuleMissingVariable") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
  if (scenarioId === "terraformModuleSecurityGroup") return Boolean(runtime.flags.securityPassed && runtime.flags.cleanPlan);
  if (scenarioId === "terraformStateFolderMigration") return Boolean(hasStateAddress(runtime, "module.logging.aws_s3_bucket.logs") && runtime.flags.cleanPlan);
  if (runtime.kind === "terragrunt") {
    if (scenarioId === "terragruntHclfmt") return Boolean(runtime.flags.initialized && runtime.flags.lintPassed && runtime.flags.validationPassed && runtime.flags.cleanPlan);
    return Boolean(runtime.flags.initialized && runtime.flags.validationPassed && runtime.flags.cleanPlan);
  }
  if (runtime.kind === "networking") return Boolean(runtime.flags.networkConfigured);
  if (runtime.backend.locked || !runtime.flags.initialized || !runtime.flags.cleanPlan) return false;
  if (scenarioId === "interruptedApplyLock") return Boolean(runtime.flags.importedBucket);
  if (scenarioId === "missingIamImport") return Boolean(runtime.flags.importedRole);
  if (scenarioId === "manualSecurityGroupDrift") return runtime.files[activeFileName].includes('cidr_blocks = ["0.0.0.0/0"]');
  return false;
}
