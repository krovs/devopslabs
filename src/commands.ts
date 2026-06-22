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
  azPipelinesBuildList: () => string[];
  azPipelinesBuildShow: () => string[];
  azPipelinesRun: () => string[];
  azPipelinesVariableGroupList: () => string[];
  ansibleInventoryList: () => string[];
  ansiblePlaybookCheck: () => string[];
  ansiblePlaybookRun: () => string[];
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
  azureBlobShow: () => string[];
  azureBlobLeaseBreak: () => string[];
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
  kubernetesBlankDryRun: () => string[];
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
  securityHubGetFindings: () => string[];
  securityHubBatchUpdateFindings: () => string[];
  accessAnalyzerListFindings: () => string[];
  linuxDfInodes: () => string[];
  linuxDuInodes: () => string[];
  linuxSystemctlDaemonReload: () => string[];
  cloudformationValidateTemplate: () => string[];
  cloudformationCreateChangeSet: () => string[];
  cloudformationDescribeStackEvents: () => string[];
  cloudformationDetectStackDrift: () => string[];
  cloudformationUpdateStack: () => string[];
  cfnGetStackPolicy: () => string[];
  cfnDescribeStacks: () => string[];
  cfnListExports: () => string[];
  cfnListStackInstances: () => string[];
  mlPipelineStatus: () => string[];
  mlArtifactsList: () => string[];
  mlPipelineRun: () => string[];
  mlModelDescribe: () => string[];
  mlModelPromote: () => string[];
  pagerdutyIncidentShow: () => string[];
  postmortemReview: () => string[];
  runbookValidate: () => string[];
  pagerdutyAlertsList: () => string[];
  statuspageIncidentShow: () => string[];
  rdsDescribeDbClusters: () => string[];
  route53ListRecordSets: () => string[];
  s3GetBucketReplication: () => string[];
  rdsDescribeEvents: () => string[];
  dbRdsDescribeDbClusters: () => string[];
  rdsDescribeDbLogFiles: () => string[];
  pgbouncerShowPools: () => string[];
  rdsDescribeDbLogs: () => string[];
  dynamodbDescribeTable: () => string[];
  promtoolCheckSli: () => string[];
  promtoolCheckRules: () => string[];
  slothSloValidate: () => string[];
  sreToilAudit: () => string[];
  sqsGetQueueAttributes: () => string[];
  kafkaConsumerGroupsDescribeMsg: () => string[];
  snsListSubscriptions: () => string[];
  kinesisDescribeStream: () => string[];
  sqsReceiveMessage: () => string[];
  syftCheckRelease: () => string[];
  cosignVerify: () => string[];
  grypeScan: () => string[];
  slsaVerifierVerify: () => string[];
  pipAudit: () => string[];
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
    if (input === "az pipelines build list") return handlers.azPipelinesBuildList();
    if (input === "az pipelines build show --id 7231") return handlers.azPipelinesBuildShow();
    if (input === "az pipelines run") return handlers.azPipelinesRun();
    if (input === "az pipelines variable-group list") return handlers.azPipelinesVariableGroupList();
    if (input === "ansible-inventory --list") return handlers.ansibleInventoryList();
    if (input === "ansible-playbook playbook.yml --check") return handlers.ansiblePlaybookCheck();
    if (input === "ansible-playbook playbook.yml") return handlers.ansiblePlaybookRun();
  }

  if (runtime.kind === "linux") {
    if (input === "ls -la") return handlers.linuxLs();
    if (input === "cat app.log") return handlers.linuxCatLog();
    if (input === "grep ERROR app.log") return handlers.linuxGrepError();
    if (input === "df -h") return handlers.linuxDf();
    if (input === "df -hi") return handlers.linuxDfInodes();
    if (input === "du --inodes -d 2 /var") return handlers.linuxDuInodes();
    if (input === "free -m") return handlers.linuxFree();
    if (input === "ps aux") return handlers.linuxPs();
    if (input === "top -b -n1") return handlers.linuxTop();
    if (input === "journalctl -u web -n 20") return handlers.linuxJournalctl();
    if (input === "ss -tulpn") return handlers.linuxSs();
    if (input === "systemctl status web") return handlers.linuxSystemctlStatus();
    if (input === "sudo systemctl daemon-reload") return handlers.linuxSystemctlDaemonReload();
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
    if (input === "kubectl apply --dry-run=server -f deployment.yaml") return handlers.kubernetesBlankDryRun();
    if (input === "kubectl apply --dry-run=server -f rbac.yaml") return handlers.kubernetesBlankDryRun();
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
    if (input === "aws securityhub get-findings") return handlers.securityHubGetFindings();
    if (input === "aws securityhub batch-update-findings") return handlers.securityHubBatchUpdateFindings();
    if (input === "aws accessanalyzer list-findings") return handlers.accessAnalyzerListFindings();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "cloudformation") {
    if (input === "aws cloudformation validate-template") return handlers.cloudformationValidateTemplate();
    if (input === "aws cloudformation create-change-set") return handlers.cloudformationCreateChangeSet();
    if (input === "aws cloudformation describe-stack-events") return handlers.cloudformationDescribeStackEvents();
    if (input === "aws cloudformation describe-stack-events --stack-name checkout-api-artifacts") return handlers.cloudformationDescribeStackEvents();
    if (input === "aws cloudformation describe-stack-events --stack-name checkout-iam-role") return handlers.cloudformationDescribeStackEvents();
    if (input === "aws cloudformation detect-stack-drift") return handlers.cloudformationDetectStackDrift();
    if (input === "aws cloudformation update-stack") return handlers.cloudformationUpdateStack();
    if (input === "aws cloudformation get-stack-policy --stack-name checkout-api-artifacts") return handlers.cfnGetStackPolicy();
    if (input === "aws cloudformation describe-stacks --stack-name checkout-nested") return handlers.cfnDescribeStacks();
    if (input === "aws cloudformation list-exports") return handlers.cfnListExports();
    if (input === "aws cloudformation list-stack-instances --stack-set-name checkout-baseline") return handlers.cfnListStackInstances();
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

  if (runtime.kind === "incident") {
    if (input === "pagerduty incident show INC-2041") return handlers.pagerdutyIncidentShow();
    if (input === "postmortem review INC-2041") return handlers.postmortemReview();
    if (input === "runbook validate checkout-api") return handlers.runbookValidate();
    if (input === "pagerduty alerts list --service checkout-api") return handlers.pagerdutyAlertsList();
    if (input === "statuspage incident show INC-2041") return handlers.statuspageIncidentShow();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "dr") {
    if (input === "aws rds describe-db-clusters --db-cluster-identifier checkout-prod") return handlers.rdsDescribeDbClusters();
    if (input === "aws rds describe-db-clusters --db-cluster-identifier staging-restore") return handlers.rdsDescribeDbClusters();
    if (input === "aws route53 list-resource-record-sets --hosted-zone-id Z123456") return handlers.route53ListRecordSets();
    if (input === "aws s3api get-bucket-replication --bucket checkout-artifacts-prod") return handlers.s3GetBucketReplication();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "database") {
    if (input === "aws rds describe-events --db-cluster-identifier checkout-prod") return handlers.rdsDescribeEvents();
    if (input === "aws rds describe-db-clusters --db-cluster-identifier checkout-read-1") return handlers.dbRdsDescribeDbClusters();
    if (input === "aws rds describe-db-log-files --db-instance-identifier checkout-prod") return handlers.rdsDescribeDbLogFiles();
    if (input === "pgbouncer show pools") return handlers.pgbouncerShowPools();
    if (input === "aws rds describe-db-logs --db-cluster-identifier checkout-prod") return handlers.rdsDescribeDbLogs();
    if (input === "aws dynamodb describe-table --table-name checkout-events") return handlers.dynamodbDescribeTable();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "supplychain") {
    if (input === "syft check release checkout-api:2.5.0") return handlers.syftCheckRelease();
    if (input === "cosign verify ghcr.io/acme/checkout-api:2.5.0") return handlers.cosignVerify();
    if (input === "grype scan checkout-api:2.5.0") return handlers.grypeScan();
    if (input === "slsa-verifier verify-image ghcr.io/acme/checkout-api:2.5.0") return handlers.slsaVerifierVerify();
    if (input === "pip-audit --index-url https://pypi.acme.internal/simple") return handlers.pipAudit();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "sre") {
    if (input === "promtool check sli checkout-api") return handlers.promtoolCheckSli();
    if (input === "promtool check rules burn-rate-alerts") return handlers.promtoolCheckRules();
    if (input === "promtool check rules checkout-api-capacity") return handlers.promtoolCheckRules();
    if (input === "sloth slo validate checkout-api") return handlers.slothSloValidate();
    if (input === "sre toil audit platform-team") return handlers.sreToilAudit();
    if (input === "check") return handlers.checkScenario();
    return unknownCommand(command);
  }

  if (runtime.kind === "messaging") {
    if (input === "aws sqs get-queue-attributes --queue-url https://sqs.eu-west-1.amazonaws.com/123456789012/checkout-orders --attribute-names All") return handlers.sqsGetQueueAttributes();
    if (input === "kafka-consumer-groups --describe --group checkout-worker") return handlers.kafkaConsumerGroupsDescribeMsg();
    if (input === "aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:eu-west-1:123456789012:checkout-events") return handlers.snsListSubscriptions();
    if (input === "aws kinesis describe-stream --stream-name checkout-events") return handlers.kinesisDescribeStream();
    if (input === "aws sqs receive-message --queue-url https://sqs.eu-west-1.amazonaws.com/123456789012/checkout-orders") return handlers.sqsReceiveMessage();
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
  if (input === "az storage blob show --container-name tfstate --name prod/web.tfstate") return handlers.azureBlobShow();
  if (input === "az storage blob lease break --container-name tfstate --blob-name prod/web.tfstate") return handlers.azureBlobLeaseBreak();
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
    return ["Available commands:", "  gh run view", "  gh run rerun", "  gh secret list", "  gh secret set <name>", "  jenkins build log", "  jenkins rebuild", "  az pipelines build list", "  az pipelines build show --id <id>", "  az pipelines variable-group list", "  az pipelines run", "  ansible-inventory --list", "  ansible-playbook playbook.yml --check", "  ansible-playbook playbook.yml", "  check", "  help"];
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
    return ["Available commands:", "  ls -la", "  cat app.log", "  grep ERROR app.log", "  journalctl -u web -n 20", "  systemctl status web", "  df -h", "  df -hi", "  du --inodes -d 2 /var", "  free -m", "  ps aux", "  top -b -n1", "  ss -tulpn", "  sudo systemctl daemon-reload", "  sudo systemctl restart web", "  check", "  help"];
  }

  if (runtime.kind === "kubernetes") {
    return ["Available commands:", "  kubectl get pods", "  kubectl get events", "  kubectl describe deployment checkout-api", "  kubectl describe pod checkout-api", "  kubectl logs checkout-api", "  kubectl get hpa checkout-api", "  kubectl describe hpa checkout-api", "  kubectl get pdb checkout-api", "  kubectl apply -f hpa.yaml", "  kubectl apply -f pdb.yaml", "  kubectl apply --dry-run=server -f deployment.yaml", "  kubectl apply --dry-run=server -f rbac.yaml", "  kubectl drain ip-10-0-4-21 --ignore-daemonsets --delete-emptydir-data", "  kubectl auth can-i get configmaps --as system:serviceaccount:payments:checkout-api -n payments", "  aws iam list-roles", "  aws iam get-role --role-name <name>", "  aws sts assume-role-with-web-identity", "  kubectl rollout restart deployment checkout-api", "  kubectl rollout status deployment checkout-api", "  kubectl scale deployment checkout-api --replicas=2", "  helm lint checkout ./chart", "  helm template checkout ./chart", "  helm upgrade checkout ./chart", "  check", "  help"];
  }

  if (runtime.kind === "appsec") {
    return ["Available commands:", "  mvn test", "  mvn org.owasp:dependency-check-maven:check", "  semgrep scan", "  gitleaks detect", "  trivy config .", "  gh run view", "  trivy image checkout-api:pr-184", "  docker history checkout-api:pr-184", "  npm audit --production", "  check", "  help"];
  }

  if (runtime.kind === "threatmodel") {
    return ["Available commands:", "  threatmodel review", "  check", "  help"];
  }

  if (runtime.kind === "cloudsec") {
    return ["Available commands:", "  aws guardduty list-findings", "  aws guardduty get-findings", "  aws cloudtrail lookup-events", "  aws logs filter-log-events", "  aws configservice get-resource-config-history", "  aws iam simulate-principal-policy", "  aws securityhub get-findings", "  aws securityhub batch-update-findings", "  aws accessanalyzer list-findings", "  check", "  help"];
  }

  if (runtime.kind === "cloudformation") {
    return ["Available commands:", "  aws cloudformation validate-template", "  aws cloudformation create-change-set", "  aws cloudformation describe-stack-events", "  aws cloudformation detect-stack-drift", "  aws cloudformation update-stack", "  aws cloudformation get-stack-policy --stack-name <name>", "  aws cloudformation describe-stacks --stack-name <name>", "  aws cloudformation list-exports", "  aws cloudformation list-stack-instances --stack-set-name <name>", "  check", "  help"];
  }

  if (runtime.kind === "mlops") {
    return ["Available commands:", "  ml pipeline status", "  ml artifacts list", "  ml pipeline run", "  ml model describe", "  ml model promote", "  check", "  help"];
  }

  if (runtime.kind === "incident") {
    return ["Available commands:", "  pagerduty incident show INC-2041", "  postmortem review INC-2041", "  runbook validate checkout-api", "  pagerduty alerts list --service checkout-api", "  statuspage incident show INC-2041", "  check", "  help"];
  }

  if (runtime.kind === "dr") {
    return ["Available commands:", "  aws rds describe-db-clusters --db-cluster-identifier <id>", "  aws route53 list-resource-record-sets --hosted-zone-id Z123456", "  aws s3api get-bucket-replication --bucket checkout-artifacts-prod", "  check", "  help"];
  }

  if (runtime.kind === "database") {
    return ["Available commands:", "  aws rds describe-events --db-cluster-identifier <id>", "  aws rds describe-db-clusters --db-cluster-identifier <id>", "  aws rds describe-db-log-files --db-instance-identifier <id>", "  pgbouncer show pools", "  aws rds describe-db-logs --db-cluster-identifier <id>", "  aws dynamodb describe-table --table-name <name>", "  check", "  help"];
  }

  if (runtime.kind === "supplychain") {
    return ["Available commands:", "  syft check release <image>", "  cosign verify <image>", "  grype scan <image>", "  slsa-verifier verify-image <image>", "  pip-audit --index-url <url>", "  check", "  help"];
  }

  if (runtime.kind === "sre") {
    return ["Available commands:", "  promtool check sli checkout-api", "  promtool check rules burn-rate-alerts", "  promtool check rules checkout-api-capacity", "  sloth slo validate checkout-api", "  sre toil audit platform-team", "  check", "  help"];
  }

  if (runtime.kind === "messaging") {
    return ["Available commands:", "  aws sqs get-queue-attributes --queue-url <url> --attribute-names All", "  kafka-consumer-groups --describe --group <group>", "  aws sns list-subscriptions-by-topic --topic-arn <arn>", "  aws kinesis describe-stream --stream-name <name>", "  aws sqs receive-message --queue-url <url>", "  check", "  help"];
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
    "  az storage blob show --container-name tfstate --name prod/web.tfstate",
    "  az storage blob lease break --container-name tfstate --blob-name prod/web.tfstate",
    "  check",
    "  help",
  ];
}

function unknownCommand(command: string): string[] {
  return [`Command not recognized: ${command}`, "Type 'help' for supported commands."];
}
