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
  threatmodel: "threat-modeling",
  cloudsec: "cloud-security-audit",
  cloudformation: "cloudformation",
  mlops: "mlops",
  iam: "identity-access",
  scp: "organization-policy",
  policy: "policy-as-code",
  secrets: "secrets-management",
  dns: "dns-tls",
  observability: "observability",
  finops: "finops",
  pr: "change-review",
  networking: "network-design",
  supplychain: "supply-chain",
  messaging: "messaging",
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
    "az storage blob show --container-name tfstate --name prod/web.tfstate",
    "az storage blob lease break --container-name tfstate --blob-name prod/web.tfstate",
    "check",
    "help",
  ],
  awsconfig: ["terraform init", "checkov -f main.tf", "terraform plan", "check", "help"],
  cicd: ["gh run view", "gh run rerun", "gh secret list", "gh secret set", "jenkins build log", "jenkins rebuild", "az pipelines build list", "az pipelines build show", "az pipelines run", "az pipelines variable-group list", "ansible-inventory --list", "ansible-playbook playbook.yml --check", "ansible-playbook playbook.yml", "check", "help"],
  gitops: ["argocd app get checkout", "flux reconcile kustomization platform --with-source", "check", "help"],
  linux: ["ls -la", "cat app.log", "grep ERROR app.log", "journalctl -u web -n 20", "systemctl status web", "df -h", "df -hi", "free -m", "ps aux", "top -b -n1", "ss -tulpn", "sudo systemctl daemon-reload", "sudo systemctl restart web", "check", "help"],
  kubernetes: ["kubectl get pods", "kubectl get events", "kubectl describe deployment checkout-api", "kubectl describe pod checkout-api", "kubectl logs checkout-api", "kubectl get hpa checkout-api", "kubectl describe hpa checkout-api", "kubectl get pdb checkout-api", "kubectl apply -f", "kubectl apply --dry-run=server -f deployment.yaml", "kubectl apply --dry-run=server -f rbac.yaml", "kubectl drain ip-10-0-4-21 --ignore-daemonsets --delete-emptydir-data", "kubectl auth can-i", "aws iam list-roles", "aws iam get-role", "aws sts assume-role-with-web-identity", "kubectl rollout restart deployment checkout-api", "kubectl rollout status deployment checkout-api", "kubectl scale deployment checkout-api --replicas=2", "helm lint checkout ./chart", "helm template checkout ./chart", "helm upgrade checkout ./chart", "check", "help"],
  appsec: ["mvn test", "mvn org.owasp:dependency-check-maven:check", "semgrep scan", "gitleaks detect", "trivy config .", "gh run view", "trivy image checkout-api:pr-184", "docker history checkout-api:pr-184", "npm audit --production", "check", "help"],
  threatmodel: ["threatmodel review", "check", "help"],
  cloudsec: ["aws guardduty list-findings", "aws guardduty get-findings", "aws cloudtrail lookup-events", "aws logs filter-log-events", "aws configservice get-resource-config-history", "aws iam simulate-principal-policy", "aws securityhub get-findings", "aws securityhub batch-update-findings", "aws accessanalyzer list-findings", "check", "help"],
  mlops: ["ml pipeline status", "ml artifacts list", "ml pipeline run", "ml model describe", "ml model promote", "check", "help"],
  terragrunt: ["terragrunt init", "terragrunt validate", "terragrunt plan", "terragrunt run-all plan", "terragrunt hclfmt", "check", "help"],
  iam: ["aws iam simulate-principal-policy", "aws sts assume-role-with-web-identity", "aws s3 cp", "aws kms decrypt", "az role assignment list", "check", "help"],
  scp: ["aws organizations describe-policy", "aws iam simulate-principal-policy", "check", "help"],
  policy: ["kyverno test .", "kubectl apply --dry-run=server -f policy.yaml", "check", "help"],
  dns: ["aws acm describe-certificate", "dig app.example.com", "check", "help"],
  cloudformation: ["aws cloudformation validate-template", "aws cloudformation create-change-set", "aws cloudformation describe-stack-events", "aws cloudformation describe-stack-events --stack-name checkout-api-artifacts", "aws cloudformation describe-stack-events --stack-name checkout-iam-role", "aws cloudformation detect-stack-drift", "aws cloudformation update-stack", "aws cloudformation get-stack-policy --stack-name checkout-api-artifacts", "aws cloudformation describe-stacks --stack-name checkout-nested", "aws cloudformation list-exports", "aws cloudformation list-stack-instances --stack-set-name checkout-baseline", "check", "help"],
  observability: ["aws cloudwatch describe-alarms", "aws logs describe-log-groups", "promtool targets", "otelcol validate", "kafka-consumer-groups --describe", "check", "help"],
  finops: ["aws ce get-cost-and-usage", "aws ec2 describe-volumes", "check", "help"],
  pr: ["check", "help"],
  networking: ["check", "help"],
  secrets: ["aws secretsmanager describe-secret", "aws ssm get-parameter", "vault policy read checkout-api", "vault token capabilities secret/data/staging/checkout/db", "vault kv get secret/staging/checkout/db", "check", "help"],
  supplychain: ["syft check release checkout-api:2.5.0", "cosign verify ghcr.io/acme/checkout-api:2.5.0", "grype scan checkout-api:2.5.0", "slsa-verifier verify-image ghcr.io/acme/checkout-api:2.5.0", "pip-audit --index-url https://pypi.acme.internal/simple", "check", "help"],
  messaging: ["aws sqs get-queue-attributes --queue-url https://sqs.eu-west-1.amazonaws.com/123456789012/checkout-orders --attribute-names All", "kafka-consumer-groups --describe --group checkout-worker", "aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:eu-west-1:123456789012:checkout-events", "aws kinesis describe-stream --stream-name checkout-events", "aws sqs receive-message --queue-url https://sqs.eu-west-1.amazonaws.com/123456789012/checkout-orders", "check", "help"],
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
