import type { Scenario } from "./types";

export type CommandHandlers = {
  secretsManagerDescribeSecret: () => string[];
  secretsSsmGetParameter: () => string[];
  dnsAcmDescribeCertificate: () => string[];
  dnsDigApp: () => string[];
  iamSimulatePrincipalPolicy: () => string[];
  iamAssumeRoleWithWebIdentity: () => string[];
  iamS3Cp: () => string[];
  iamKmsDecrypt: () => string[];
  azureRoleAssignmentList: () => string[];
  organizationsDescribePolicy: () => string[];
  scpSimulatePrincipalPolicy: () => string[];
  githubRunView: () => string[];
  githubRunRerun: () => string[];
  githubSecretList: () => string[];
  githubSecretSet: (name?: string) => string[];
  argocdAppGet: () => string[];
  fluxReconcileKustomization: () => string[];
  terragruntInit: () => string[];
  terragruntValidate: () => string[];
  terragruntPlan: () => string[];
  terragruntRunAllPlan: () => string[];
  terragruntHclfmt: () => string[];
  terraformInit: () => string[];
  terraformStateList: () => string[];
  terraformValidate: () => string[];
  terraformPlan: () => string[];
  terraformApply: () => string[];
  checkovScan: () => string[];
  forceUnlock: (lockId?: string) => string[];
  terraformImport: (address?: string, id?: string) => string[];
  terraformStateMv: (source?: string, destination?: string) => string[];
  scanLocks: () => string[];
  awsS3Ls: () => string[];
  cloudWatchDescribeAlarms: () => string[];
  logsDescribeLogGroups: () => string[];
  costAndUsage: () => string[];
  ec2DescribeVolumes: () => string[];
  kyvernoTest: () => string[];
  kubectlDryRun: () => string[];
  checkScenario: () => string[];
};

export function dispatchCommand(input: string, runtime: Scenario, handlers: CommandHandlers): string[] {
  const args = input.split(/\s+/);
  const command = args.join(" ");

  if (input === "help") return commandHelp(runtime);

  if (runtime.kind === "secrets") {
    if (input === "aws secretsmanager describe-secret") return handlers.secretsManagerDescribeSecret();
    if (input === "aws ssm get-parameter") return handlers.secretsSsmGetParameter();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "dns") {
    if (input === "aws acm describe-certificate") return handlers.dnsAcmDescribeCertificate();
    if (input === "dig app.example.com") return handlers.dnsDigApp();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "iam") {
    if (input === "aws iam simulate-principal-policy") return handlers.iamSimulatePrincipalPolicy();
    if (input === "aws sts assume-role-with-web-identity") return handlers.iamAssumeRoleWithWebIdentity();
    if (input === "aws s3 cp") return handlers.iamS3Cp();
    if (input === "aws kms decrypt") return handlers.iamKmsDecrypt();
    if (input === "az role assignment list") return handlers.azureRoleAssignmentList();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "scp") {
    if (input === "aws organizations describe-policy") return handlers.organizationsDescribePolicy();
    if (input === "aws iam simulate-principal-policy") return handlers.scpSimulatePrincipalPolicy();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "cicd") {
    if (input === "gh run view") return handlers.githubRunView();
    if (input === "gh run rerun") return handlers.githubRunRerun();
    if (input === "gh secret list") return handlers.githubSecretList();
    if (args[0] === "gh" && args[1] === "secret" && args[2] === "set") return handlers.githubSecretSet(args[3]);
  }

  if (runtime.kind === "gitops") {
    if (input === "argocd app get checkout") return handlers.argocdAppGet();
    if (input === "flux reconcile kustomization platform --with-source") return handlers.fluxReconcileKustomization();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "terragrunt") {
    if (input === "terragrunt init") return handlers.terragruntInit();
    if (input === "terragrunt validate") return handlers.terragruntValidate();
    if (input === "terragrunt plan") return handlers.terragruntPlan();
    if (input === "terragrunt run-all plan") return handlers.terragruntRunAllPlan();
    if (input === "terragrunt hclfmt") return handlers.terragruntHclfmt();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "observability") {
    if (input === "aws cloudwatch describe-alarms") return handlers.cloudWatchDescribeAlarms();
    if (input === "aws logs describe-log-groups") return handlers.logsDescribeLogGroups();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "finops") {
    if (input === "aws ce get-cost-and-usage") return handlers.costAndUsage();
    if (input === "aws ec2 describe-volumes") return handlers.ec2DescribeVolumes();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "policy") {
    if (input === "kyverno test .") return handlers.kyvernoTest();
    if (input === "kubectl apply --dry-run=server -f policy.yaml") return handlers.kubectlDryRun();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (input === "terraform init") return handlers.terraformInit();
  if (input === "terraform state list") return handlers.terraformStateList();
  if (input === "terraform validate") return handlers.terraformValidate();
  if (input === "terraform plan") return handlers.terraformPlan();
  if (input === "terraform apply") return handlers.terraformApply();
  if (input === "checkov -f main.tf") return handlers.checkovScan();
  if (args[0] === "terraform" && args[1] === "force-unlock") return handlers.forceUnlock(args[2]);
  if (args[0] === "terraform" && args[1] === "import") return handlers.terraformImport(args[2], args[3]);
  if (args[0] === "terraform" && args[1] === "state" && args[2] === "mv") return handlers.terraformStateMv(args[3], args[4]);
  if (input === "aws dynamodb scan --table-name tf-locks") return handlers.scanLocks();
  if (input === "aws s3 ls") return handlers.awsS3Ls();
  if (input === "check") return handlers.checkScenario();

  return unknownCommand(command);
}

function commandHelp(runtime: Scenario): string[] {
  if (runtime.kind === "awsconfig") {
    return ["Available commands:", "  terraform init", "  checkov -f main.tf", "  terraform plan", "  check", "  help"];
  }

  if (runtime.kind === "secrets") {
    return ["Available commands:", "  aws secretsmanager describe-secret", "  aws ssm get-parameter", "  check", "  help"];
  }

  if (runtime.kind === "dns") {
    return ["Available commands:", "  aws acm describe-certificate", "  dig app.example.com", "  check", "  help"];
  }

  if (runtime.kind === "iam") {
    return ["Available commands:", "  aws iam simulate-principal-policy", "  aws sts assume-role-with-web-identity", "  aws s3 cp", "  aws kms decrypt", "  az role assignment list", "  check", "  help"];
  }

  if (runtime.kind === "scp") {
    return ["Available commands:", "  aws organizations describe-policy", "  aws iam simulate-principal-policy", "  check", "  help"];
  }

  if (runtime.kind === "cicd") {
    return ["Available commands:", "  gh run view", "  gh run rerun", "  gh secret list", "  gh secret set <name>", "  check", "  help"];
  }

  if (runtime.kind === "gitops") {
    return ["Available commands:", "  argocd app get checkout", "  flux reconcile kustomization platform --with-source", "  check", "  help"];
  }

  if (runtime.kind === "terragrunt") {
    return ["Available commands:", "  terragrunt init", "  terragrunt validate", "  terragrunt plan", "  terragrunt run-all plan", "  terragrunt hclfmt", "  check", "  help"];
  }

  if (runtime.kind === "observability") {
    return ["Available commands:", "  aws cloudwatch describe-alarms", "  aws logs describe-log-groups", "  check", "  help"];
  }

  if (runtime.kind === "finops") {
    return ["Available commands:", "  aws ce get-cost-and-usage", "  aws ec2 describe-volumes", "  check", "  help"];
  }

  if (runtime.kind === "policy") {
    return ["Available commands:", "  kyverno test .", "  kubectl apply --dry-run=server -f policy.yaml", "  check", "  help"];
  }

  return [
    "Available commands:",
    "  terraform init",
    "  terraform plan",
    "  terraform apply",
    "  terraform validate",
    "  terraform state list",
    "  terraform state mv <source> <destination>",
    "  terraform import <address> <id>",
    "  terraform force-unlock <lock-id>",
    "  checkov -f main.tf",
    "  aws dynamodb scan --table-name tf-locks",
    "  aws s3 ls",
    "  check",
  ];
}

function unknownCommand(command: string): string[] {
  return [`Command not recognized: ${command}`, "Type 'help' for supported commands."];
}
