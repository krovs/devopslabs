import type { Scenario } from "./types";

export type CommandHandlers = {
  secretsManagerDescribeSecret: () => string[];
  secretsSsmGetParameter: () => string[];
  vaultPolicyRead: () => string[];
  vaultTokenCapabilities: () => string[];
  vaultKvGet: () => string[];
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
  jenkinsBuildLog: () => string[];
  jenkinsRebuild: () => string[];
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
  promtoolTargets: () => string[];
  otelcolValidate: () => string[];
  kafkaConsumerGroupsDescribe: () => string[];
  costAndUsage: () => string[];
  ec2DescribeVolumes: () => string[];
  kyvernoTest: () => string[];
  kubectlDryRun: () => string[];
  linuxLs: () => string[];
  linuxCatLog: () => string[];
  linuxGrepError: () => string[];
  linuxDf: () => string[];
  linuxFree: () => string[];
  linuxPs: () => string[];
  linuxTop: () => string[];
  linuxJournalctl: () => string[];
  linuxSs: () => string[];
  linuxSystemctlStatus: () => string[];
  linuxSystemctlRestart: () => string[];
  kubectlGetPods: () => string[];
  kubectlDescribeDeployment: () => string[];
  kubectlDescribePod: () => string[];
  kubectlGetEvents: () => string[];
  kubectlLogs: () => string[];
  kubectlGetHpa: () => string[];
  kubectlDescribeHpa: () => string[];
  kubectlGetPdb: () => string[];
  kubectlApplyManifest: (fileName?: string) => string[];
  kubectlDrainNode: () => string[];
  kubectlAuthCanI: () => string[];
  eksIamListRoles: () => string[];
  eksIamGetRole: (roleName?: string) => string[];
  eksAssumeRoleWithWebIdentity: () => string[];
  kubectlRolloutRestart: () => string[];
  kubectlRolloutStatus: () => string[];
  kubectlScaleDeployment: () => string[];
  helmLint: () => string[];
  helmTemplate: () => string[];
  helmUpgrade: () => string[];
  mvnTest: () => string[];
  dependencyCheck: () => string[];
  semgrepScan: () => string[];
  gitleaksDetect: () => string[];
  trivyConfig: () => string[];
  trivyImage: () => string[];
  dockerHistory: () => string[];
  npmAuditProduction: () => string[];
  threatModelReview: () => string[];
  guardDutyListFindings: () => string[];
  guardDutyGetFindings: () => string[];
  cloudTrailLookupEvents: () => string[];
  logsFilterLogEvents: () => string[];
  configResourceHistory: () => string[];
  cloudsecSimulatePrincipalPolicy: () => string[];
  cloudformationValidateTemplate: () => string[];
  cloudformationCreateChangeSet: () => string[];
  cloudformationDescribeStackEvents: () => string[];
  cloudformationDetectStackDrift: () => string[];
  cloudformationUpdateStack: () => string[];
  mlPipelineStatus: () => string[];
  mlArtifactsList: () => string[];
  mlPipelineRun: () => string[];
  mlModelDescribe: () => string[];
  mlModelPromote: () => string[];
  checkScenario: () => string[];
};

export function dispatchCommand(input: string, runtime: Scenario, handlers: CommandHandlers): string[] {
  const args = input.split(/\s+/);
  const command = args.join(" ");

  if (input === "help") return commandHelp(runtime);

  if (runtime.kind === "secrets") {
    if (input === "aws secretsmanager describe-secret") return handlers.secretsManagerDescribeSecret();
    if (input === "aws ssm get-parameter") return handlers.secretsSsmGetParameter();
    if (input === "vault policy read checkout-api") return handlers.vaultPolicyRead();
    if (input === "vault token capabilities secret/data/staging/checkout/db") return handlers.vaultTokenCapabilities();
    if (input === "vault kv get secret/staging/checkout/db") return handlers.vaultKvGet();
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
    if (input === "jenkins build log") return handlers.jenkinsBuildLog();
    if (input === "jenkins rebuild") return handlers.jenkinsRebuild();
  }

  if (runtime.kind === "linux") {
    if (input === "ls -la") return handlers.linuxLs();
    if (input === "cat app.log") return handlers.linuxCatLog();
    if (input === "grep ERROR app.log") return handlers.linuxGrepError();
    if (input === "df -h") return handlers.linuxDf();
    if (input === "free -m") return handlers.linuxFree();
    if (input === "ps aux") return handlers.linuxPs();
    if (input === "top -b -n1") return handlers.linuxTop();
    if (input === "journalctl -u web -n 20") return handlers.linuxJournalctl();
    if (input === "ss -tulpn") return handlers.linuxSs();
    if (input === "systemctl status web") return handlers.linuxSystemctlStatus();
    if (input === "sudo systemctl restart web") return handlers.linuxSystemctlRestart();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "kubernetes") {
    if (input === "kubectl get pods") return handlers.kubectlGetPods();
    if (input === "kubectl describe deployment checkout-api") return handlers.kubectlDescribeDeployment();
    if (input === "kubectl describe pod checkout-api") return handlers.kubectlDescribePod();
    if (input === "kubectl get events") return handlers.kubectlGetEvents();
    if (input === "kubectl logs checkout-api") return handlers.kubectlLogs();
    if (input === "kubectl get hpa checkout-api") return handlers.kubectlGetHpa();
    if (input === "kubectl describe hpa checkout-api") return handlers.kubectlDescribeHpa();
    if (input === "kubectl get pdb checkout-api") return handlers.kubectlGetPdb();
    if (args[0] === "kubectl" && args[1] === "apply" && args[2] === "-f") return handlers.kubectlApplyManifest(args[3]);
    if (input === "kubectl drain ip-10-0-4-21 --ignore-daemonsets --delete-emptydir-data") return handlers.kubectlDrainNode();
    if (input === "kubectl auth can-i get configmaps --as system:serviceaccount:payments:checkout-api -n payments") return handlers.kubectlAuthCanI();
    if (input === "aws iam list-roles") return handlers.eksIamListRoles();
    if (args[0] === "aws" && args[1] === "iam" && args[2] === "get-role" && args[3] === "--role-name") return handlers.eksIamGetRole(args[4]);
    if (input === "aws sts assume-role-with-web-identity") return handlers.eksAssumeRoleWithWebIdentity();
    if (input === "kubectl rollout restart deployment checkout-api") return handlers.kubectlRolloutRestart();
    if (input === "kubectl rollout status deployment checkout-api") return handlers.kubectlRolloutStatus();
    if (input === "kubectl scale deployment checkout-api --replicas=2") return handlers.kubectlScaleDeployment();
    if (input === "helm lint checkout ./chart") return handlers.helmLint();
    if (input === "helm template checkout ./chart") return handlers.helmTemplate();
    if (input === "helm upgrade checkout ./chart") return handlers.helmUpgrade();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "appsec") {
    if (input === "mvn test") return handlers.mvnTest();
    if (input === "mvn org.owasp:dependency-check-maven:check") return handlers.dependencyCheck();
    if (input === "semgrep scan") return handlers.semgrepScan();
    if (input === "gitleaks detect") return handlers.gitleaksDetect();
    if (input === "trivy config .") return handlers.trivyConfig();
    if (input === "gh run view") return handlers.githubRunView();
    if (input === "trivy image checkout-api:pr-184") return handlers.trivyImage();
    if (input === "docker history checkout-api:pr-184") return handlers.dockerHistory();
    if (input === "npm audit --production") return handlers.npmAuditProduction();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "threatmodel") {
    if (input === "threatmodel review") return handlers.threatModelReview();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "cloudsec") {
    if (input === "aws guardduty list-findings") return handlers.guardDutyListFindings();
    if (input === "aws guardduty get-findings") return handlers.guardDutyGetFindings();
    if (input === "aws cloudtrail lookup-events") return handlers.cloudTrailLookupEvents();
    if (input === "aws logs filter-log-events") return handlers.logsFilterLogEvents();
    if (input === "aws configservice get-resource-config-history") return handlers.configResourceHistory();
    if (input === "aws iam simulate-principal-policy") return handlers.cloudsecSimulatePrincipalPolicy();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "cloudformation") {
    if (input === "aws cloudformation validate-template") return handlers.cloudformationValidateTemplate();
    if (input === "aws cloudformation create-change-set") return handlers.cloudformationCreateChangeSet();
    if (input === "aws cloudformation describe-stack-events") return handlers.cloudformationDescribeStackEvents();
    if (input === "aws cloudformation detect-stack-drift") return handlers.cloudformationDetectStackDrift();
    if (input === "aws cloudformation update-stack") return handlers.cloudformationUpdateStack();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "mlops") {
    if (input === "ml pipeline status") return handlers.mlPipelineStatus();
    if (input === "ml artifacts list") return handlers.mlArtifactsList();
    if (input === "ml pipeline run") return handlers.mlPipelineRun();
    if (input === "ml model describe") return handlers.mlModelDescribe();
    if (input === "ml model promote") return handlers.mlModelPromote();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
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
    if (input === "promtool targets") return handlers.promtoolTargets();
    if (input === "otelcol validate") return handlers.otelcolValidate();
    if (input === "kafka-consumer-groups --describe") return handlers.kafkaConsumerGroupsDescribe();
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
    return ["Available commands:", "  aws secretsmanager describe-secret", "  aws ssm get-parameter", "  vault policy read checkout-api", "  vault token capabilities secret/data/staging/checkout/db", "  vault kv get secret/staging/checkout/db", "  check", "  help"];
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
    return ["Available commands:", "  gh run view", "  gh run rerun", "  gh secret list", "  gh secret set <name>", "  jenkins build log", "  jenkins rebuild", "  check", "  help"];
  }

  if (runtime.kind === "gitops") {
    return ["Available commands:", "  argocd app get checkout", "  flux reconcile kustomization platform --with-source", "  check", "  help"];
  }

  if (runtime.kind === "terragrunt") {
    return ["Available commands:", "  terragrunt init", "  terragrunt validate", "  terragrunt plan", "  terragrunt run-all plan", "  terragrunt hclfmt", "  check", "  help"];
  }

  if (runtime.kind === "observability") {
    return ["Available commands:", "  aws cloudwatch describe-alarms", "  aws logs describe-log-groups", "  promtool targets", "  otelcol validate", "  kafka-consumer-groups --describe", "  check", "  help"];
  }

  if (runtime.kind === "finops") {
    return ["Available commands:", "  aws ce get-cost-and-usage", "  aws ec2 describe-volumes", "  check", "  help"];
  }

  if (runtime.kind === "policy") {
    return ["Available commands:", "  kyverno test .", "  kubectl apply --dry-run=server -f policy.yaml", "  check", "  help"];
  }

  if (runtime.kind === "linux") {
    return ["Available commands:", "  ls -la", "  cat app.log", "  grep ERROR app.log", "  journalctl -u web -n 20", "  systemctl status web", "  df -h", "  free -m", "  ps aux", "  top -b -n1", "  ss -tulpn", "  sudo systemctl restart web", "  check", "  help"];
  }

  if (runtime.kind === "kubernetes") {
    return ["Available commands:", "  kubectl get pods", "  kubectl get events", "  kubectl describe deployment checkout-api", "  kubectl describe pod checkout-api", "  kubectl logs checkout-api", "  kubectl get hpa checkout-api", "  kubectl describe hpa checkout-api", "  kubectl get pdb checkout-api", "  kubectl apply -f hpa.yaml", "  kubectl apply -f pdb.yaml", "  kubectl drain ip-10-0-4-21 --ignore-daemonsets --delete-emptydir-data", "  kubectl auth can-i get configmaps --as system:serviceaccount:payments:checkout-api -n payments", "  aws iam list-roles", "  aws iam get-role --role-name <name>", "  aws sts assume-role-with-web-identity", "  kubectl rollout restart deployment checkout-api", "  kubectl rollout status deployment checkout-api", "  kubectl scale deployment checkout-api --replicas=2", "  helm lint checkout ./chart", "  helm template checkout ./chart", "  helm upgrade checkout ./chart", "  check", "  help"];
  }

  if (runtime.kind === "appsec") {
    return ["Available commands:", "  mvn test", "  mvn org.owasp:dependency-check-maven:check", "  semgrep scan", "  gitleaks detect", "  trivy config .", "  gh run view", "  trivy image checkout-api:pr-184", "  docker history checkout-api:pr-184", "  npm audit --production", "  check", "  help"];
  }

  if (runtime.kind === "threatmodel") {
    return ["Available commands:", "  threatmodel review", "  check", "  help"];
  }

  if (runtime.kind === "cloudsec") {
    return ["Available commands:", "  aws guardduty list-findings", "  aws guardduty get-findings", "  aws cloudtrail lookup-events", "  aws logs filter-log-events", "  aws configservice get-resource-config-history", "  aws iam simulate-principal-policy", "  check", "  help"];
  }

  if (runtime.kind === "cloudformation") {
    return ["Available commands:", "  aws cloudformation validate-template", "  aws cloudformation create-change-set", "  aws cloudformation describe-stack-events", "  aws cloudformation detect-stack-drift", "  aws cloudformation update-stack", "  check", "  help"];
  }

  if (runtime.kind === "mlops") {
    return ["Available commands:", "  ml pipeline status", "  ml artifacts list", "  ml pipeline run", "  ml model describe", "  ml model promote", "  check", "  help"];
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
