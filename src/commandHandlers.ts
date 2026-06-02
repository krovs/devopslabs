import type { CommandHandlers } from "./commands";
import { checkScenario as checkScenarioCompletion } from "./completion";
import {
  githubRunRerun as runGithubRunRerun,
  githubRunView as runGithubRunView,
  githubSecretList as runGithubSecretList,
  githubSecretSet as runGithubSecretSet,
  jenkinsBuildLog as runJenkinsBuildLog,
  jenkinsRebuild as runJenkinsRebuild,
} from "./simulators/cicd";
import { argocdAppGet as runArgocdAppGet, fluxReconcileKustomization as runFluxReconcileKustomization } from "./simulators/gitops";
import {
  runKubectlDescribePod,
  runKubectlGetEvents,
  runKubectlGetPods,
  runKubectlLogs,
  runKubectlRolloutRestart,
  runKubectlRolloutStatus,
  runKubectlScale,
  runLinuxCatLog,
  runLinuxDf,
  runLinuxFree,
  runLinuxGrepError,
  runLinuxJournalctl,
  runLinuxLs,
  runLinuxPs,
  runLinuxSs,
  runLinuxSystemctlRestart,
  runLinuxSystemctlStatus,
  runLinuxTop,
} from "./simulators/fundamentals";
import {
  azureRoleAssignmentList as runAzureRoleAssignmentList,
  iamAssumeRoleWithWebIdentity as runIamAssumeRoleWithWebIdentity,
  iamKmsDecrypt as runIamKmsDecrypt,
  iamS3Cp as runIamS3Cp,
  iamSimulatePrincipalPolicy as runIamSimulatePrincipalPolicy,
  organizationsDescribePolicy as runOrganizationsDescribePolicy,
  scpSimulatePrincipalPolicy as runScpSimulatePrincipalPolicy,
} from "./simulators/identity";
import {
  cloudWatchDescribeAlarms as runCloudWatchDescribeAlarms,
  costAndUsage as runCostAndUsage,
  dnsAcmDescribeCertificate as runDnsAcmDescribeCertificate,
  dnsDigApp as runDnsDigApp,
  ec2DescribeVolumes as runEc2DescribeVolumes,
  logsDescribeLogGroups as runLogsDescribeLogGroups,
  secretsManagerDescribeSecret as runSecretsManagerDescribeSecret,
  secretsSsmGetParameter as runSecretsSsmGetParameter,
} from "./simulators/ops";
import { kubectlDryRun as runKubectlDryRun, kyvernoTest as runKyvernoTest } from "./simulators/policy";
import {
  terragruntHclfmt as runTerragruntHclfmt,
  terragruntInit as runTerragruntInit,
  terragruntPlan as runTerragruntPlan,
  terragruntRunAllPlan as runTerragruntRunAllPlan,
  terragruntValidate as runTerragruntValidate,
} from "./simulators/terragrunt";
import {
  awsS3Ls as runAwsS3Ls,
  checkovScan as runCheckovScan,
  forceUnlock as runForceUnlock,
  scanLocks as runScanLocks,
  terraformApply as runTerraformApply,
  terraformImport as runTerraformImport,
  terraformInit as runTerraformInit,
  terraformPlan as runTerraformPlan,
  terraformStateList as runTerraformStateList,
  terraformStateMv as runTerraformStateMv,
  terraformValidate as runTerraformValidate,
} from "./simulators/terraform";
import type { Scenario } from "./types";

export type CommandHandlerContext = {
  runtime: () => Scenario;
  scenarioId: () => string;
  activeFileName: () => string;
  refreshRuntime: () => void;
};

export function createCommandHandlers(context: CommandHandlerContext): CommandHandlers {
  function scenarioId(): string {
    return context.scenarioId();
  }

  function runtime(): Scenario {
    return context.runtime();
  }

  function activeFileName(): string {
    return context.activeFileName();
  }

  function withRuntimeRefresh(run: () => string[]): string[] {
    const output = run();
    context.refreshRuntime();
    return output;
  }

  return {
    secretsManagerDescribeSecret: () => withRuntimeRefresh(() => runSecretsManagerDescribeSecret(runtime(), scenarioId())),
    secretsSsmGetParameter: () => withRuntimeRefresh(() => runSecretsSsmGetParameter(runtime(), scenarioId())),
    dnsAcmDescribeCertificate: () => withRuntimeRefresh(() => runDnsAcmDescribeCertificate(runtime(), scenarioId())),
    dnsDigApp: () => withRuntimeRefresh(() => runDnsDigApp(runtime(), scenarioId())),
    iamSimulatePrincipalPolicy: () => withRuntimeRefresh(() => runIamSimulatePrincipalPolicy(runtime(), scenarioId())),
    iamAssumeRoleWithWebIdentity: () => withRuntimeRefresh(() => runIamAssumeRoleWithWebIdentity(runtime(), scenarioId())),
    iamS3Cp: () => runIamS3Cp(runtime(), scenarioId()),
    iamKmsDecrypt: () => withRuntimeRefresh(() => runIamKmsDecrypt(runtime(), scenarioId())),
    azureRoleAssignmentList: () => withRuntimeRefresh(() => runAzureRoleAssignmentList(runtime(), scenarioId())),
    organizationsDescribePolicy: () => runOrganizationsDescribePolicy(runtime(), scenarioId()),
    scpSimulatePrincipalPolicy: () => withRuntimeRefresh(() => runScpSimulatePrincipalPolicy(runtime(), scenarioId())),
    githubRunView: () => runGithubRunView(runtime(), scenarioId()),
    githubRunRerun: () => withRuntimeRefresh(() => runGithubRunRerun(runtime(), scenarioId(), activeFileName())),
    githubSecretList: () => runGithubSecretList(runtime()),
    githubSecretSet: (name?: string) => withRuntimeRefresh(() => runGithubSecretSet(runtime(), name)),
    jenkinsBuildLog: () => runJenkinsBuildLog(runtime(), scenarioId()),
    jenkinsRebuild: () => withRuntimeRefresh(() => runJenkinsRebuild(runtime(), scenarioId(), activeFileName())),
    argocdAppGet: () => withRuntimeRefresh(() => runArgocdAppGet(runtime(), scenarioId())),
    fluxReconcileKustomization: () => withRuntimeRefresh(() => runFluxReconcileKustomization(runtime(), scenarioId())),
    terragruntInit: () => withRuntimeRefresh(() => runTerragruntInit(runtime(), scenarioId())),
    terragruntValidate: () => withRuntimeRefresh(() => runTerragruntValidate(runtime(), scenarioId())),
    terragruntPlan: () => withRuntimeRefresh(() => runTerragruntPlan(runtime(), scenarioId())),
    terragruntRunAllPlan: () => withRuntimeRefresh(() => runTerragruntRunAllPlan(runtime(), scenarioId())),
    terragruntHclfmt: () => withRuntimeRefresh(() => runTerragruntHclfmt(runtime(), scenarioId())),
    terraformInit: () => withRuntimeRefresh(() => runTerraformInit(runtime(), scenarioId())),
    terraformStateList: () => runTerraformStateList(runtime()),
    terraformValidate: () => withRuntimeRefresh(() => runTerraformValidate(runtime(), scenarioId(), activeFileName())),
    terraformPlan: () => withRuntimeRefresh(() => runTerraformPlan(runtime(), scenarioId())),
    terraformApply: () => withRuntimeRefresh(() => runTerraformApply(runtime(), scenarioId())),
    checkovScan: () => withRuntimeRefresh(() => runCheckovScan(runtime(), scenarioId(), activeFileName())),
    forceUnlock: (lockId?: string) => withRuntimeRefresh(() => runForceUnlock(runtime(), lockId)),
    terraformImport: (address?: string, id?: string) => withRuntimeRefresh(() => runTerraformImport(runtime(), scenarioId(), address, id)),
    terraformStateMv: (source?: string, destination?: string) => withRuntimeRefresh(() => runTerraformStateMv(runtime(), scenarioId(), source, destination)),
    scanLocks: () => runScanLocks(runtime()),
    awsS3Ls: () => runAwsS3Ls(runtime()),
    cloudWatchDescribeAlarms: () => withRuntimeRefresh(() => runCloudWatchDescribeAlarms(runtime(), scenarioId())),
    logsDescribeLogGroups: () => withRuntimeRefresh(() => runLogsDescribeLogGroups(runtime(), scenarioId())),
    costAndUsage: () => withRuntimeRefresh(() => runCostAndUsage(runtime(), scenarioId())),
    ec2DescribeVolumes: () => withRuntimeRefresh(() => runEc2DescribeVolumes(runtime(), scenarioId())),
    kyvernoTest: () => withRuntimeRefresh(() => runKyvernoTest(runtime(), scenarioId())),
    kubectlDryRun: () => withRuntimeRefresh(() => runKubectlDryRun(runtime(), scenarioId())),
    linuxLs: () => withRuntimeRefresh(() => runLinuxLs(runtime())),
    linuxCatLog: () => withRuntimeRefresh(() => runLinuxCatLog(runtime())),
    linuxGrepError: () => withRuntimeRefresh(() => runLinuxGrepError(runtime())),
    linuxDf: () => withRuntimeRefresh(() => runLinuxDf(runtime())),
    linuxFree: () => withRuntimeRefresh(() => runLinuxFree(runtime())),
    linuxPs: () => withRuntimeRefresh(() => runLinuxPs(runtime())),
    linuxTop: () => withRuntimeRefresh(() => runLinuxTop(runtime())),
    linuxJournalctl: () => withRuntimeRefresh(() => runLinuxJournalctl(runtime())),
    linuxSs: () => withRuntimeRefresh(() => runLinuxSs(runtime())),
    linuxSystemctlStatus: () => withRuntimeRefresh(() => runLinuxSystemctlStatus(runtime())),
    linuxSystemctlRestart: () => withRuntimeRefresh(() => runLinuxSystemctlRestart(runtime())),
    kubectlGetPods: () => withRuntimeRefresh(() => runKubectlGetPods(runtime(), scenarioId())),
    kubectlDescribePod: () => withRuntimeRefresh(() => runKubectlDescribePod(runtime(), scenarioId())),
    kubectlGetEvents: () => withRuntimeRefresh(() => runKubectlGetEvents(runtime(), scenarioId())),
    kubectlLogs: () => withRuntimeRefresh(() => runKubectlLogs(runtime(), scenarioId())),
    kubectlRolloutRestart: () => withRuntimeRefresh(() => runKubectlRolloutRestart(runtime(), scenarioId())),
    kubectlRolloutStatus: () => withRuntimeRefresh(() => runKubectlRolloutStatus(runtime(), scenarioId())),
    kubectlScaleDeployment: () => withRuntimeRefresh(() => runKubectlScale(runtime())),
    checkScenario: () => withRuntimeRefresh(() => checkScenarioCompletion(runtime(), scenarioId(), activeFileName())),
  };
}
