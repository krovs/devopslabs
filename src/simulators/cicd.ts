import type { Scenario } from "../types";

const genericGithubActionsScenarioIds = [
  "githubActionsNodeCachePath",
  "githubActionsDockerRegistryAuth",
  "githubActionsEnvironmentApproval",
  "githubActionsMatrixNodeVersion",
  "jenkinsMissingCredentialsBinding",
];

function fileLines(file: string): string[] {
  return file.split("\n");
}

function lineIndexContaining(lines: string[], text: string): number {
  return lines.findIndex((line) => line.includes(text));
}

function lineIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

export function hasDefaultsRunWorkingDirectory(file: string, expectedDirectory: string): boolean {
  const lines = fileLines(file);

  for (let index = 0; index < lines.length; index += 1) {
    const defaultsMatch = lines[index].match(/^(\s*)defaults:\s*$/);
    if (!defaultsMatch) continue;

    const defaultsIndent = defaultsMatch[1].length;
    for (let runIndex = index + 1; runIndex < lines.length; runIndex += 1) {
      const runLine = lines[runIndex];
      if (!runLine.trim()) continue;
      const runIndent = lineIndent(runLine);
      if (runIndent <= defaultsIndent) break;
      if (!/^\s*run:\s*$/.test(runLine)) continue;

      for (let workingDirectoryIndex = runIndex + 1; workingDirectoryIndex < lines.length; workingDirectoryIndex += 1) {
        const workingDirectoryLine = lines[workingDirectoryIndex];
        if (!workingDirectoryLine.trim()) continue;
        const workingDirectoryIndent = lineIndent(workingDirectoryLine);
        if (workingDirectoryIndent <= runIndent) break;
        if (new RegExp(`^\\s*working-directory:\\s*${escapeRegExp(expectedDirectory)}\\s*$`).test(workingDirectoryLine)) {
          return true;
        }
      }
    }
  }

  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setFirstResource(runtime: Scenario, status: string, note: string): void {
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = status;
    runtime.awsResources[0].note = note;
  }
}

export function workflowEvent(scenarioId: string): string {
  if (scenarioId === "githubActionsMissingSecret") return "push on main";
  if (scenarioId === "githubActionsWrongWorkingDirectory") return "pull_request on main";
  if (scenarioId === "githubActionsAwsOidcTrust") return "push on main";
  if (scenarioId === "githubActionsCheckovGate") return "pull_request on main";
  if (scenarioId === "githubActionsOverbroadPermissions") return "push on main";
  if (scenarioId === "githubActionsNodeCachePath") return "pull_request on main";
  if (scenarioId === "githubActionsDockerRegistryAuth") return "push on main";
  if (scenarioId === "githubActionsEnvironmentApproval") return "workflow_dispatch";
  if (scenarioId === "githubActionsMatrixNodeVersion") return "pull_request on main";
  if (scenarioId === "jenkinsMissingCredentialsBinding") return "manual build";
  return "workflow_dispatch";
}

export function workflowJob(scenarioId: string): string {
  if (scenarioId === "githubActionsMissingSecret") return "deploy";
  if (scenarioId === "githubActionsWrongWorkingDirectory") return "validate";
  if (scenarioId === "githubActionsAwsOidcTrust") return "deploy";
  if (scenarioId === "githubActionsCheckovGate") return "checkov";
  if (scenarioId === "githubActionsOverbroadPermissions") return "actionlint";
  if (scenarioId === "githubActionsNodeCachePath") return "test";
  if (scenarioId === "githubActionsDockerRegistryAuth") return "publish";
  if (scenarioId === "githubActionsEnvironmentApproval") return "deploy";
  if (scenarioId === "githubActionsMatrixNodeVersion") return "test";
  if (scenarioId === "jenkinsMissingCredentialsBinding") return "publish-image";
  return "workflow";
}

export function workflowFailedStep(runtime: Scenario, scenarioId: string): string {
  if (runtime.flags.runPassing) return "none";
  if (scenarioId === "githubActionsMissingSecret") return "aws-actions/configure-aws-credentials@v4";
  if (scenarioId === "githubActionsWrongWorkingDirectory") return "terraform fmt -check";
  if (scenarioId === "githubActionsAwsOidcTrust") return "aws-actions/configure-aws-credentials@v4";
  if (scenarioId === "githubActionsCheckovGate") return "checkov -f main.tf";
  if (scenarioId === "githubActionsOverbroadPermissions") return "actionlint";
  if (scenarioId === "githubActionsNodeCachePath") return "npm ci";
  if (scenarioId === "githubActionsDockerRegistryAuth") return "docker push";
  if (scenarioId === "githubActionsEnvironmentApproval") return "environment approval";
  if (scenarioId === "githubActionsMatrixNodeVersion") return "npm test (node 16)";
  if (scenarioId === "jenkinsMissingCredentialsBinding") return "docker login";
  return "unknown";
}

export function isGenericGithubActionsScenario(scenarioId: string): boolean {
  return genericGithubActionsScenarioIds.includes(scenarioId);
}

export function genericGithubActionsFixApplied(runtime: Scenario, scenarioId: string, activeFileName: string): boolean {
  const file = runtime.files[activeFileName] ?? "";

  if (scenarioId === "githubActionsNodeCachePath") {
    return hasDefaultsRunWorkingDirectory(file, "app");
  }

  if (scenarioId === "githubActionsDockerRegistryAuth") {
    const loginIndex = file.indexOf("docker/login-action@");
    const buildIndex = file.indexOf("docker build");
    const pushIndex = file.indexOf("docker push");
    return loginIndex !== -1
      && buildIndex !== -1
      && pushIndex !== -1
      && loginIndex < buildIndex
      && buildIndex < pushIndex
      && file.includes("registry: ghcr.io")
      && file.includes("username: ${{ github.actor }}")
      && file.includes("password: ${{ secrets.GITHUB_TOKEN }}");
  }

  if (scenarioId === "githubActionsEnvironmentApproval") {
    return /^\s*environment:\s*\n\s*name:\s*production\s*$/m.test(file) && !/^\s*name:\s*prod\s*$/m.test(file);
  }

  if (scenarioId === "githubActionsMatrixNodeVersion") {
    return /^\s*strategy:\s*$/m.test(file)
      && /^\s*matrix:\s*$/m.test(file)
      && /^\s*node-version:\s*\[(20,\s*22|22,\s*20)\]\s*$/m.test(file)
      && file.includes("node-version: ${{ matrix.node-version }}")
      && !/\b16\b/.test(file);
  }

  if (scenarioId === "jenkinsMissingCredentialsBinding") {
    const lines = fileLines(file);
    const withCredentialsIndex = lineIndexContaining(lines, "withCredentials([usernamePassword(");
    const loginIndex = lineIndexContaining(lines, "docker login");
    const pushIndex = lineIndexContaining(lines, "docker push");
    return withCredentialsIndex !== -1
      && loginIndex !== -1
      && pushIndex !== -1
      && withCredentialsIndex < loginIndex
      && loginIndex < pushIndex
      && file.includes("credentialsId: 'ghcr-push'")
      && file.includes("usernameVariable: 'REGISTRY_USER'")
      && file.includes("passwordVariable: 'REGISTRY_TOKEN'")
      && file.includes("--password-stdin");
  }

  return false;
}

export function workflowFailureSummary(scenarioId: string): string {
  if (scenarioId === "githubActionsNodeCachePath") return "npm ci cannot find package-lock.json in the current working directory.";
  if (scenarioId === "githubActionsDockerRegistryAuth") return "denied: unauthenticated request to ghcr.io.";
  if (scenarioId === "githubActionsEnvironmentApproval") return "environment prod is not configured or protected.";
  if (scenarioId === "githubActionsMatrixNodeVersion") return "matrix node-version 16 is unsupported by this project.";
  if (scenarioId === "jenkinsMissingCredentialsBinding") return "docker login has no registry credentials bound in the Jenkins stage.";
  return "workflow failed.";
}

export function genericGithubActionsFailureNote(scenarioId: string): string {
  if (scenarioId === "githubActionsNodeCachePath") return "npm ci still runs outside app/.";
  if (scenarioId === "githubActionsDockerRegistryAuth") return "docker push still runs without a registry login.";
  if (scenarioId === "githubActionsEnvironmentApproval") return "workflow still targets prod instead of production.";
  if (scenarioId === "githubActionsMatrixNodeVersion") return "matrix still includes unsupported Node.js 16.";
  if (scenarioId === "jenkinsMissingCredentialsBinding") return "Jenkinsfile still pushes without binding registry credentials.";
  return "Workflow is still failing.";
}

export function genericGithubActionsSuccessNote(scenarioId: string): string {
  if (scenarioId === "githubActionsNodeCachePath") return "npm ci and npm test run from app/.";
  if (scenarioId === "githubActionsDockerRegistryAuth") return "Workflow logs in to ghcr.io before pushing the image.";
  if (scenarioId === "githubActionsEnvironmentApproval") return "Workflow targets the configured production environment.";
  if (scenarioId === "githubActionsMatrixNodeVersion") return "Matrix only uses supported Node.js versions.";
  if (scenarioId === "jenkinsMissingCredentialsBinding") return "Jenkins binds registry credentials before docker login and push.";
  return "Workflow completed successfully.";
}

export function genericGithubActionsLogLines(runtime: Scenario, scenarioId: string): string[] {
  if (runtime.flags.runPassing) {
    return [genericGithubActionsSuccessNote(scenarioId), "Workflow completed successfully."];
  }

  if (scenarioId === "githubActionsNodeCachePath") {
    return ["Running npm ci", "cwd: /home/runner/work/repo/repo", "npm ERR! The package-lock.json file was not found"];
  }

  if (scenarioId === "githubActionsDockerRegistryAuth") {
    return ["docker push ghcr.io/acme/app:${{ github.sha }}", "denied: unauthenticated request", "Add docker/login-action before pushing"];
  }

  if (scenarioId === "githubActionsEnvironmentApproval") {
    return ["Preparing deployment", "environment: prod", "Environment prod is not configured for this repository"];
  }

  if (scenarioId === "githubActionsMatrixNodeVersion") {
    return ["matrix.node-version: 16", "npm test", "Error: package requires Node.js >= 20"];
  }

  if (scenarioId === "jenkinsMissingCredentialsBinding") {
    return ["docker login ghcr.io", "Error: Cannot perform an interactive login from a non TTY device", "Bind registry credentials before docker login"];
  }

  return ["No logs available."];
}

export function workflowLogLines(runtime: Scenario, scenarioId: string): string[] {
  if (runtime.flags.runPassing) {
    if (scenarioId === "githubActionsMissingSecret") {
      return [
        "aws-actions/configure-aws-credentials@v4 completed",
        "terraform init completed",
        "terraform apply -auto-approve completed",
      ];
    }

    if (scenarioId === "githubActionsAwsOidcTrust") {
      return [
        "OIDC token requested",
        "AssumeRoleWithWebIdentity succeeded",
        "terraform plan completed",
      ];
    }

    if (scenarioId === "githubActionsCheckovGate") {
      return [
        "Running checkov -f main.tf",
        "CKV_AWS_20 passed",
        "Failed checks: 0",
      ];
    }

    if (scenarioId === "githubActionsOverbroadPermissions") {
      return [
        "Running actionlint",
        "permissions are explicitly scoped",
        "No lint findings",
      ];
    }

    return [
      "terraform fmt -check completed",
      "terraform init completed",
      "terraform validate completed",
    ];
  }

  if (scenarioId === "githubActionsMissingSecret") {
    return [
      "Configuring AWS credentials",
      "role-to-assume resolved to an empty value",
      "secrets.AWS_ROLE_ARN is not available to this workflow",
    ];
  }

  if (scenarioId === "githubActionsWrongWorkingDirectory") {
    return [
      "Running terraform fmt -check",
      "Working directory: infra/prod",
      "Error: chdir infra/prod: no such file or directory",
    ];
  }

  if (scenarioId === "githubActionsAwsOidcTrust") {
    return [
      "Requesting GitHub OIDC token",
      "Calling sts:AssumeRoleWithWebIdentity",
      "AccessDenied: token subject does not match trust policy",
    ];
  }

  if (scenarioId === "githubActionsCheckovGate") {
    return [
      "Running checkov -f main.tf",
      "CKV_AWS_20 failed: S3 bucket ACL allows public access",
      "Failed checks: 1",
    ];
  }

  if (scenarioId === "githubActionsOverbroadPermissions") {
    return [
      "Running actionlint",
      "permissions: write-all is not allowed",
      "Use id-token: write and contents: read instead",
    ];
  }

  if (isGenericGithubActionsScenario(scenarioId)) {
    return genericGithubActionsLogLines(runtime, scenarioId);
  }

  return ["No logs available."];
}

export function githubRunView(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "githubActionsMissingSecret") {
    if (runtime.flags.runPassing) {
      return ["workflow: deploy", "status: success", "deploy: completed after configure-aws-credentials received AWS_ROLE_ARN."];
    }
    return [
      "workflow: deploy",
      "status: failure",
      "failed step: aws-actions/configure-aws-credentials@v4",
      "error: The security token included in the request is invalid or role-to-assume is empty.",
      "hint: secrets.AWS_ROLE_ARN is not available to this workflow.",
    ];
  }

  if (scenarioId === "githubActionsWrongWorkingDirectory") {
    if (runtime.flags.runPassing) {
      return ["workflow: terraform-check", "status: success", "terraform fmt, init, and validate completed from infra/dev."];
    }
    return ["workflow: terraform-check", "status: failure", "failed step: terraform fmt -check", "error: chdir infra/prod: no such file or directory"];
  }

  if (scenarioId === "githubActionsAwsOidcTrust") {
    if (runtime.flags.runPassing) {
      return ["workflow: deploy-oidc", "status: success", "AssumeRoleWithWebIdentity succeeded for refs/heads/main."];
    }
    return [
      "workflow: deploy-oidc",
      "status: failure",
      "failed step: aws-actions/configure-aws-credentials@v4",
      "error: Not authorized to perform sts:AssumeRoleWithWebIdentity",
      "hint: trust policy subject allows refs/heads/master, but this run is refs/heads/main.",
    ];
  }

  if (scenarioId === "githubActionsCheckovGate") {
    if (runtime.flags.runPassing) {
      return ["workflow: iac-security", "status: success", "checkov -f main.tf completed with no failed checks."];
    }
    return ["workflow: iac-security", "status: failure", "failed step: checkov -f main.tf", "CKV_AWS_20: S3 Bucket has an ACL defined which allows public access."];
  }

  if (scenarioId === "githubActionsOverbroadPermissions") {
    if (runtime.flags.runPassing) {
      return ["workflow: deploy-permissions", "status: success", "actionlint passed: permissions are scoped to id-token: write and contents: read."];
    }
    return ["workflow: deploy-permissions", "status: failure", "failed step: actionlint", "permissions: write-all is not allowed by repository policy."];
  }

  if (isGenericGithubActionsScenario(scenarioId)) {
    const workflowName = runtime.awsResources[0]?.name ?? "workflow";
    if (runtime.flags.runPassing) {
      return [`workflow: ${workflowName}`, "status: success", `${workflowJob(scenarioId)} completed successfully.`];
    }
    return [`workflow: ${workflowName}`, "status: failure", `failed step: ${workflowFailedStep(runtime, scenarioId)}`, workflowFailureSummary(scenarioId)];
  }

  return ["No GitHub Actions run data for this scenario."];
}

export function jenkinsBuildLog(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId !== "jenkinsMissingCredentialsBinding") return ["No Jenkins build is configured for this scenario."];
  if (runtime.flags.runPassing) return ["job: publish-image", "status: success", "docker login completed with credentialsId ghcr-push", "docker push completed"];
  return [
    "job: publish-image",
    "status: failure",
    "stage: Publish image",
    "docker login ghcr.io",
    "Cannot perform an interactive login from a non TTY device",
    "hint: Jenkins folder platform-delivery has a GHCR username/password credential; see jenkins/credentials.md",
  ];
}

export function jenkinsRebuild(runtime: Scenario, scenarioId: string, activeFileName: string): string[] {
  if (scenarioId !== "jenkinsMissingCredentialsBinding") return ["No Jenkins build is configured for this scenario."];
  if (genericGithubActionsFixApplied(runtime, scenarioId, activeFileName)) {
    runtime.flags.workflowFixed = true;
    runtime.flags.runPassing = true;
    setFirstResource(runtime, "success", genericGithubActionsSuccessNote(scenarioId));
    return ["Rebuilding Jenkins job publish-image...", "Build succeeded."];
  }

  setFirstResource(runtime, "failed", genericGithubActionsFailureNote(scenarioId));
  return ["Rebuilding Jenkins job publish-image...", "Build failed: docker login still has no bound credentials."];
}

export function githubRunRerun(runtime: Scenario, scenarioId: string, activeFileName: string): string[] {
  if (scenarioId === "githubActionsMissingSecret") {
    if (!runtime.flags.secretsConfigured) {
      setFirstResource(runtime, "failed", "AWS_ROLE_ARN is still missing from repository secrets.");
      return ["Re-running workflow deploy...", "Run failed: missing repository secret AWS_ROLE_ARN."];
    }
    runtime.flags.runPassing = true;
    setFirstResource(runtime, "success", "Workflow completed after AWS_ROLE_ARN was configured.");
    return ["Re-running workflow deploy...", "Run succeeded."];
  }

  if (scenarioId === "githubActionsWrongWorkingDirectory") {
    if (!hasDefaultsRunWorkingDirectory(runtime.files[activeFileName] ?? "", "infra/dev")) {
      setFirstResource(runtime, "failed", "Workflow still points at infra/prod.");
      return ["Re-running workflow terraform-check...", "Run failed: infra/prod does not exist."];
    }
    runtime.flags.workflowFixed = true;
    runtime.flags.runPassing = true;
    setFirstResource(runtime, "success", "Workflow validates Terraform from infra/dev.");
    return ["Re-running workflow terraform-check...", "Run succeeded."];
  }

  if (scenarioId === "githubActionsAwsOidcTrust") {
    const trustPolicy = runtime.files["trust-policy.json"] ?? "";
    const workflow = runtime.files[".github/workflows/deploy-oidc.yml"] ?? "";
    const trustAllowsMain = trustPolicy.includes("repo:acme/platform:ref:refs/heads/main");
    const hasOidcPermission = workflow.includes("id-token: write");

    if (trustAllowsMain && hasOidcPermission) {
      runtime.flags.workflowFixed = true;
      runtime.flags.runPassing = true;
      setFirstResource(runtime, "success", "OIDC trust subject now matches refs/heads/main.");
      runtime.stateResources = runtime.stateResources.map((resource) =>
        resource.address === "policy.aws-role-trust" ? { ...resource, id: "refs/heads/main" } : resource,
      );
      return ["Re-running workflow deploy-oidc...", "Run succeeded."];
    }

    setFirstResource(runtime, "failed", "OIDC trust policy still does not match the workflow branch or id-token permission is missing.");
    return ["Re-running workflow deploy-oidc...", "Run failed: AssumeRoleWithWebIdentity is not authorized."];
  }

  if (scenarioId === "githubActionsCheckovGate") {
    if (runtime.files[activeFileName].includes('acl    = "private"') || runtime.files[activeFileName].includes('acl = "private"')) {
      runtime.flags.securityPassed = true;
      runtime.flags.runPassing = true;
      setFirstResource(runtime, "success", "Checkov passed after public ACL was removed.");
      return ["Re-running workflow iac-security...", "Run succeeded."];
    }

    setFirstResource(runtime, "failed", "Checkov still detects public-read ACL.");
    return ["Re-running workflow iac-security...", "Run failed: CKV_AWS_20 public ACL finding."];
  }

  if (scenarioId === "githubActionsOverbroadPermissions") {
    const permissionsScoped = runtime.files[activeFileName].includes("id-token: write") && runtime.files[activeFileName].includes("contents: read") && !runtime.files[activeFileName].includes("write-all");

    if (permissionsScoped) {
      runtime.flags.lintPassed = true;
      runtime.flags.runPassing = true;
      setFirstResource(runtime, "success", "actionlint passed with scoped workflow permissions.");
      return ["Re-running workflow deploy-permissions...", "Run succeeded."];
    }

    setFirstResource(runtime, "failed", "permissions write-all is still present or scoped permissions are missing.");
    return ["Re-running workflow deploy-permissions...", "Run failed: overbroad permissions."];
  }

  if (isGenericGithubActionsScenario(scenarioId)) {
    const workflowName = runtime.awsResources[0]?.name ?? "workflow";
    if (genericGithubActionsFixApplied(runtime, scenarioId, activeFileName)) {
      runtime.flags.workflowFixed = true;
      runtime.flags.runPassing = true;
      setFirstResource(runtime, "success", genericGithubActionsSuccessNote(scenarioId));
      return [`Re-running workflow ${workflowName}...`, "Run succeeded."];
    }

    setFirstResource(runtime, "failed", genericGithubActionsFailureNote(scenarioId));
    return [`Re-running workflow ${workflowName}...`, `Run failed: ${workflowFailureSummary(scenarioId)}`];
  }

  return ["No workflow is configured for this scenario."];
}

export function githubSecretList(runtime: Scenario): string[] {
  const secrets = runtime.stateResources
    .filter((resource) => resource.address.startsWith("secret."))
    .map((resource) => resource.address.replace("secret.", ""));

  if (!secrets.length) return ["No repository secrets configured."];
  return secrets;
}

export function githubSecretSet(runtime: Scenario, name?: string): string[] {
  if (!name) return ["Usage: gh secret set <name>"];
  if (name !== "AWS_ROLE_ARN") return [`Secret ${name} saved, but this scenario needs AWS_ROLE_ARN.`];
  if (!runtime.stateResources.some((resource) => resource.address === "secret.AWS_ROLE_ARN")) {
    runtime.stateResources = [...runtime.stateResources, { address: "secret.AWS_ROLE_ARN", id: "arn:aws:iam::123456789012:role/github-actions-deploy" }];
  }
  runtime.flags.secretsConfigured = true;
  return ["Secret AWS_ROLE_ARN saved."];
}
