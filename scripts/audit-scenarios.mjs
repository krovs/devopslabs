import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { scenarioOrder } from "../src/scenarioOrder.ts";
import { parseSimpleYaml } from "../src/simpleYaml.ts";
import { validateScenario } from "../src/scenarioValidation.ts";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const scenariosDir = join(rootDir, "scenarios");

const expectedDirectoryByKind = {
  terraform: "iac",
  awsconfig: "iac-security",
  terragrunt: "stack-orchestration",
  cicd: "delivery-pipelines",
  gitops: "gitops",
  linux: "linux-basics",
  kubernetes: "kubernetes-basics",
  appsec: "application-security",
  cloudsec: "cloud-security-audit",
  iam: "identity-access",
  scp: "organization-policy",
  policy: "policy-as-code",
  secrets: "secrets-management",
  dns: "dns-tls",
  observability: "observability",
  finops: "finops",
  pr: "change-review",
  networking: "network-design",
};

const commandsByKind = {
  terraform: [
    "terraform init",
    "terraform plan",
    "terraform apply",
    "terraform validate",
    "terraform state list",
    "terraform state mv",
    "terraform import",
    "terraform force-unlock",
    "checkov -f main.tf",
    "aws dynamodb scan --table-name tf-locks",
    "aws s3 ls",
    "check",
    "help",
  ],
  awsconfig: ["terraform init", "checkov -f main.tf", "terraform plan", "check", "help"],
  cicd: ["gh run view", "gh run rerun", "gh secret list", "gh secret set", "jenkins build log", "jenkins rebuild", "check", "help"],
  gitops: ["argocd app get checkout", "flux reconcile kustomization platform --with-source", "check", "help"],
  linux: ["ls -la", "cat app.log", "grep ERROR app.log", "journalctl -u web -n 20", "systemctl status web", "df -h", "free -m", "ps aux", "top -b -n1", "ss -tulpn", "sudo systemctl restart web", "check", "help"],
  kubernetes: ["kubectl get pods", "kubectl get events", "kubectl describe pod checkout-api", "kubectl logs checkout-api", "kubectl auth can-i", "aws sts assume-role-with-web-identity", "kubectl rollout restart deployment checkout-api", "kubectl rollout status deployment checkout-api", "kubectl scale deployment checkout-api --replicas=2", "helm lint checkout ./chart", "helm template checkout ./chart", "helm upgrade checkout ./chart", "check", "help"],
  appsec: ["mvn test", "mvn org.owasp:dependency-check-maven:check", "semgrep scan", "gitleaks detect", "trivy config .", "check", "help"],
  cloudsec: ["aws guardduty list-findings", "aws guardduty get-findings", "aws cloudtrail lookup-events", "aws logs filter-log-events", "aws configservice get-resource-config-history", "aws iam simulate-principal-policy", "check", "help"],
  terragrunt: ["terragrunt init", "terragrunt validate", "terragrunt plan", "terragrunt run-all plan", "terragrunt hclfmt", "check", "help"],
  iam: ["aws iam simulate-principal-policy", "aws sts assume-role-with-web-identity", "aws s3 cp", "aws kms decrypt", "az role assignment list", "check", "help"],
  scp: ["aws organizations describe-policy", "aws iam simulate-principal-policy", "check", "help"],
  policy: ["kyverno test .", "kubectl apply --dry-run=server -f policy.yaml", "check", "help"],
  secrets: ["aws secretsmanager describe-secret", "aws ssm get-parameter", "check", "help"],
  dns: ["aws acm describe-certificate", "dig app.example.com", "check", "help"],
  observability: ["aws cloudwatch describe-alarms", "aws logs describe-log-groups", "check", "help"],
  finops: ["aws ce get-cost-and-usage", "aws ec2 describe-volumes", "check", "help"],
  pr: ["check", "help"],
  networking: ["check", "help"],
};

const genericPhrases = [
  "complete because the final state now addresses the original failure",
  "The workflow now fails or passes for the right reason",
  "with the underlying path, secret, permission, or gate fixed instead of bypassed",
];

const files = (await scenarioFiles(scenariosDir)).sort();
const failures = [];
const warnings = [];
const ids = new Set();

for (const file of files) {
  const shortPath = relative(scenariosDir, file);
  const source = await readFile(file, "utf8");
  let scenario;

  try {
    scenario = parseSimpleYaml(source);
    validateScenario(scenario);
  } catch (error) {
    failures.push(`${shortPath}: ${errorMessage(error)}`);
    continue;
  }

  if (ids.has(scenario.id)) failures.push(`${shortPath}: duplicate scenario id ${scenario.id}`);
  ids.add(scenario.id);

  if (!scenarioOrder.includes(scenario.id)) failures.push(`${shortPath}: ${scenario.id} is missing from scenarioOrder`);

  const expectedDirectory = expectedDirectoryByKind[scenario.kind ?? "terraform"];
  if (expectedDirectory && !shortPath.startsWith(`${expectedDirectory}/`)) {
    failures.push(`${shortPath}: ${scenario.id} kind ${scenario.kind ?? "terraform"} should live under ${expectedDirectory}/`);
  }

  for (const replacement of scenario.solution?.replacements ?? []) {
    const replacementSource = scenario.solution.files?.[replacement.fileName] ?? scenario.files[replacement.fileName];
    if (!replacementSource) {
      failures.push(`${shortPath}: replacement references missing file ${replacement.fileName}`);
      continue;
    }
    if (!replacementSource.includes(replacement.search)) {
      failures.push(`${shortPath}: replacement for ${replacement.fileName} does not match current content`);
    }
  }

  if (scenario.solution?.apply !== "networkingControls" && scenario.solution?.apply !== "prReview") {
    for (const command of scenario.solution?.commands ?? []) {
      if (!commandSupported(scenario.kind ?? "terraform", command)) {
        failures.push(`${shortPath}: solution command is not supported by terminal: ${command}`);
      }
    }
  }

  const solutionText = [scenario.solution?.summary, scenario.solution?.explanation, scenario.solution?.outcome].filter(Boolean).join("\n");
  for (const phrase of genericPhrases) {
    if (solutionText.includes(phrase)) warnings.push(`${shortPath}: generic solution wording: ${phrase}`);
  }
}

for (const id of scenarioOrder) {
  if (!ids.has(id)) failures.push(`scenarioOrder references missing scenario id ${id}`);
}

if (warnings.length) {
  console.warn(`Scenario audit warnings: ${warnings.length}`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error(`Scenario audit failed: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Scenario audit passed: ${files.length} scenarios, ${warnings.length} warning(s)`);

function commandSupported(kind, command) {
  const supported = commandsByKind[kind] ?? commandsByKind.terraform;
  return supported.some((candidate) => command === candidate || command.startsWith(`${candidate} `));
}

async function scenarioFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return scenarioFiles(path);
    return entry.isFile() && entry.name.endsWith(".yaml") ? [path] : [];
  }));
  return nested.flat();
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
