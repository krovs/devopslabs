import { parseSimpleYaml } from "./simpleYaml";
import { validateScenario } from "./scenarioValidation";
import type { Scenario } from "./types";

const scenarioSourceModules = import.meta.glob("../scenarios/*.yaml", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const scenarioOrder = [
  "terraformValidateBadReference",
  "terraformModuleMissingVariable",
  "terraformModuleWrongSource",
  "terraformModuleMissingOutput",
  "terraformCheckovPublicS3",
  "terraformModuleSecurityGroup",
  "manualSecurityGroupDrift",
  "missingIamImport",
  "interruptedApplyLock",
  "terraformStateFolderMigration",
  "awsConfigCloudWatchRetention",
  "awsConfigS3Baseline",
  "awsConfigBlankS3SecureBucket",
  "awsConfigRdsPublicBackup",
  "awsConfigCloudTrailBaseline",
  "terragruntHclfmt",
  "terragruntMissingInclude",
  "terragruntWrongSourceRef",
  "terragruntBadDependencyOutput",
  "githubActionsMissingSecret",
  "githubActionsWrongWorkingDirectory",
  "githubActionsNodeCachePath",
  "githubActionsDockerRegistryAuth",
  "githubActionsEnvironmentApproval",
  "githubActionsMatrixNodeVersion",
  "githubActionsCheckovGate",
  "githubActionsOverbroadPermissions",
  "githubActionsAwsOidcTrust",
  "iamBlankSecretsReadonly",
  "iamBlankCloudWatchLogsWrite",
  "iamS3PrefixLeastPrivilege",
  "iamDynamoDbLeadingKeys",
  "iamGithubOidcEnvironmentTrust",
  "iamKmsEncryptionContext",
  "scpDenyLeavingOrg",
  "scpBlankDenyRootUser",
  "scpBlankRequireImdsv2",
  "scpRegionRestrictionBreakGlass",
  "secretsSsmEnvironmentPath",
  "secretsManagerRotationKms",
  "secretsManagerResourcePolicy",
  "dnsRoute53AlbAlias",
  "dnsAcmCloudFrontCertificate",
  "dnsAcmWildcardValidation",
  "observabilityLogRetention",
  "observabilityAlb5xxAlarmDimension",
  "finopsS3Lifecycle",
  "finopsNatGatewayCostSpike",
  "prSecurityGroupAdminCidrReview",
  "prGithubActionsWriteAllReview",
  "prTerraformPublicS3Review",
  "prIamWildcardPolicyReview",
  "networkingSshCidrHardening",
  "networkingSecurityGroupAlbApp",
  "networkingVpcPublicPrivateSubnets",
  "networkingVpcNatEgress",
  "networkingVpcDbIsolation",
  "networkingNaclEphemeralReturn",
  "networkingSiteToSiteVpn",
  "networkingWafAlbProtection",
  "networkingDirectConnectMultiVpc",
];

const scenarioEntries = Object.values(scenarioSourceModules)
  .map((source): [string, Scenario] => {
    const scenario = parseSimpleYaml(source) as Scenario;
    validateScenario(scenario);
    return [scenario.id, scenario];
  })
  .sort(([leftId], [rightId]) => scenarioSortIndex(leftId) - scenarioSortIndex(rightId));

export const scenarios: Record<string, Scenario> = Object.fromEntries(scenarioEntries);

function scenarioSortIndex(id: string): number {
  const order = scenarioOrder.indexOf(id);
  return order === -1 ? Number.MAX_SAFE_INTEGER : order;
}

export { validateScenario };
