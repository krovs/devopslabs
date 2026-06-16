import type { Scenario } from "../types";

function markFirstResource(runtime: Scenario, status: string, note: string): void {
  if (runtime.awsResources[0]) {
    runtime.awsResources[0].status = status;
    runtime.awsResources[0].note = note;
  }
}

export function hasStateAddress(runtime: Scenario, address: string): boolean {
  return runtime.stateResources.some((resource) => resource.address === address);
}

function addStateResource(runtime: Scenario, address: string, id: string): void {
  if (!hasStateAddress(runtime, address)) {
    runtime.stateResources = [...runtime.stateResources, { address, id }];
  }
}

function azureWebAppChecks(file: string) {
  const hasProvider = file.includes('provider "azurerm"') && file.includes("features {}");
  const hasResourceGroup = file.includes('resource "azurerm_resource_group"') && /name\s*=\s*"rg-devopslabs-web"/.test(file) && /location\s*=\s*"westeurope"/.test(file);
  const hasServicePlan = file.includes('resource "azurerm_service_plan"') && /os_type\s*=\s*"Linux"/.test(file) && /sku_name\s*=\s*"B1"/.test(file);
  const hasWebApp = file.includes('resource "azurerm_linux_web_app"') && /name\s*=\s*"devopslabs-web"/.test(file) && file.includes("service_plan_id");
  const hasHttpsOnly = /https_only\s*=\s*true/.test(file);
  const hasNodeStack = /node_version\s*=\s*"20-lts"/.test(file);
  return { hasProvider, hasResourceGroup, hasServicePlan, hasWebApp, hasHttpsOnly, hasNodeStack };
}

export function lockError(runtime: Scenario): string[] {
  if (runtime.backend.table === "tfstate") {
    return [
      "Error: Error acquiring the state lock",
      `Lock Info: ID ${runtime.backend.lockId}`,
      "Azure Blob Storage backend uses a blob lease to lock the Terraform state file.",
      "Run az storage blob show to inspect the lease, then break it.",
    ];
  }

  return [
    "Error: Error acquiring the state lock",
    `Lock Info: ID ${runtime.backend.lockId}`,
    "Terraform acquires a state lock to protect the state from being written by multiple users at the same time.",
  ];
}

export function terraformInit(runtime: Scenario, scenarioId: string): string[] {
  if (scenarioId === "terraformModuleWrongSource") {
    const hasCorrectSource = runtime.files["main.tf"].includes('source = "./modules/network"');

    if (!hasCorrectSource) {
      return [
        "Initializing modules...",
        "- network in ./module/network",
        "Error: Unreadable module directory",
        "Unable to evaluate directory symlink: lstat module/network: no such file or directory",
      ];
    }

    runtime.flags.initialized = true;
    runtime.flags.validationPassed = true;
    markFirstResource(runtime, "exists", "Root module source points at ./modules/network.");
    return ["Initializing modules...", "- network in ./modules/network", "Successfully configured the backend."];
  }

  runtime.flags.initialized = true;
  if (runtime.backend.table === "tfstate") {
    return [
      "Initializing the backend...",
      `Successfully configured backend azurerm://${runtime.backend.bucket}/${runtime.backend.table}/${runtime.backend.key}`,
    ];
  }

  return [
    "Initializing the backend...",
    `Successfully configured backend s3://${runtime.backend.bucket}/${runtime.backend.key}`,
  ];
}

export function terraformStateList(runtime: Scenario): string[] {
  if (!runtime.stateResources.length) return ["No resources currently tracked in state."];
  return runtime.stateResources.map((resource) => resource.address);
}

export function awsS3Ls(runtime: Scenario): string[] {
  return runtime.awsResources
    .filter((resource) => resource.type === "s3_bucket")
    .map((resource) => `s3://${resource.name}`);
}

export function terraformPlan(runtime: Scenario, scenarioId: string): string[] {
  if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
  if (runtime.backend.locked) return lockError(runtime);

  if (scenarioId === "interruptedApplyLock") {
    if (!hasStateAddress(runtime, "aws_s3_bucket.logs")) {
      return [
        "Terraform will perform the following actions:",
        "  + create aws_s3_bucket.logs",
        "",
        "Plan: 1 to add, 0 to change, 0 to destroy.",
        "Warning: prod-logs-training already exists in AWS but is missing from state.",
      ];
    }
    runtime.flags.cleanPlan = true;
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "missingIamImport") {
    if (!hasStateAddress(runtime, "aws_iam_role.app")) {
      return [
        "Terraform will perform the following actions:",
        "  + create aws_iam_role.app",
        "",
        "Plan: 1 to add, 0 to change, 0 to destroy.",
      ];
    }
    runtime.flags.cleanPlan = true;
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "manualSecurityGroupDrift") {
    if (runtime.files["main.tf"].includes('cidr_blocks = ["0.0.0.0/0"]')) {
      markFirstResource(runtime, "exists", "Code now accepts the manually changed ingress CIDR.");
      runtime.flags.cleanPlan = true;
      return ["No changes. Infrastructure matches the configuration."];
    }
    return [
      "Note: Objects have changed outside of Terraform.",
      "  aws_security_group.web ingress cidr_blocks: state has 10.0.0.0/16, AWS has 0.0.0.0/0",
      "",
      "Plan: 0 to add, 1 to change, 0 to destroy.",
    ];
  }

  if (scenarioId === "terraformAzureNsgDrift") {
    if (runtime.files["main.tf"].includes('source_address_prefix      = "0.0.0.0/0"') || runtime.files["main.tf"].includes('source_address_prefix = "0.0.0.0/0"')) {
      markFirstResource(runtime, "exists", "Code now accepts the manually changed Azure NSG source prefix.");
      runtime.flags.cleanPlan = true;
      return ["No changes. Azure infrastructure matches the configuration."];
    }
    return [
      "Note: Objects have changed outside of Terraform.",
      "  azurerm_network_security_group.web security_rule[Allow-HTTP].source_address_prefix: state has 10.20.0.0/16, Azure has 0.0.0.0/0",
      "",
      "Plan: 0 to add, 1 to change, 0 to destroy.",
    ];
  }

  if (scenarioId === "terraformAzureBlobLeaseLock") {
    if (!hasStateAddress(runtime, "azurerm_resource_group.app")) {
      return [
        "Terraform will perform the following actions:",
        "  + create azurerm_resource_group.app",
        "",
        "Plan: 1 to add, 0 to change, 0 to destroy.",
        "Warning: rg-prod-web already exists in Azure but is missing from state.",
      ];
    }
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Azure resource group was imported into Terraform state.");
    return ["No changes. Azure infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformCheckovPublicS3") {
    if (!runtime.flags.securityPassed) {
      return ["Plan blocked by policy gate.", "Run checkov -f main.tf and fix the security finding before planning."];
    }
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "S3 public access is blocked by configuration.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformValidateBadReference") {
    if (!runtime.flags.validationPassed) return ["Error: validation failed. Run terraform validate and fix the invalid reference first."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Terraform configuration validates cleanly.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformModuleMissingOutput") {
    if (!runtime.flags.validationPassed) return ["Error: module output is missing. Run terraform validate and expose bucket_name from the child module."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Child module exposes bucket_name and root module can consume it.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformModuleWrongSource") {
    if (!runtime.flags.validationPassed) return ["Error: module source is invalid. Run terraform init after fixing source = \"./modules/network\"."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Network module source path is valid.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformModuleMissingVariable") {
    if (!runtime.flags.validationPassed) return ["Error: missing required module argument. Run terraform validate and pass environment."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Queue module receives all required arguments.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformModuleSecurityGroup") {
    if (!runtime.flags.securityPassed) return ["Plan blocked by policy gate. Run checkov -f main.tf and fix the module default ingress CIDR."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Security group module default ingress is restricted.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformBlankEc2WebServer") {
    if (!runtime.flags.securityPassed) return ["Plan blocked by policy gate. Run checkov -f main.tf and add the provider, security group, and EC2 instance."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "EC2 web server, security group, and HTTP ingress are configured.");
    return ["No changes. EC2 web server infrastructure matches the configuration."];
  }

  if (scenarioId === "terraformBlankAzureWebApp") {
    if (!runtime.flags.validationPassed) return ["Error: configuration is incomplete. Run terraform validate and add the missing Azure resources first."];
    if (!runtime.flags.securityPassed) return ["Plan blocked by policy gate. Run checkov -f main.tf and enforce HTTPS on the Linux Web App."];
    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "Azure Linux Web App, resource group, service plan, and HTTPS enforcement are configured.");
    return ["No changes. Azure Web App infrastructure matches the configuration."];
  }

  if (runtime.kind === "awsconfig") {
    if (!runtime.flags.securityPassed) return ["Plan blocked by AWS config review. Run checkov -f main.tf and fix the failed checks first."];
    runtime.flags.cleanPlan = true;
    runtime.flags.configValidated = true;
    markFirstResource(runtime, "exists", "AWS service configuration meets the required guardrails.");
    return ["No changes. AWS configuration guardrails are satisfied."];
  }

  if (scenarioId === "terraformStateFolderMigration") {
    if (!hasStateAddress(runtime, "module.logging.aws_s3_bucket.logs")) {
      return [
        "Terraform will perform the following actions:",
        "  - destroy aws_s3_bucket.logs",
        "  + create module.logging.aws_s3_bucket.logs",
        "",
        "Plan: 1 to add, 0 to change, 1 to destroy.",
        "The remote bucket is already tracked at aws_s3_bucket.logs. Move the state address instead of recreating it.",
      ];
    }

    runtime.flags.cleanPlan = true;
    markFirstResource(runtime, "exists", "State address was moved to module.logging.aws_s3_bucket.logs.");
    return ["No changes. Infrastructure matches the configuration."];
  }

  return ["No changes. Infrastructure matches the configuration."];
}

export function terraformValidate(runtime: Scenario, scenarioId: string, activeFileName: string): string[] {
  if (scenarioId === "terraformValidateBadReference") {
    if (runtime.files[activeFileName].includes("aws_s3_bucket.logs.bucket")) {
      runtime.flags.validationPassed = true;
      markFirstResource(runtime, "exists", "output.bucket_name references aws_s3_bucket.logs.");
      return ["Success! The configuration is valid."];
    }

    return [
      "Error: Reference to undeclared resource",
      "",
      "  on main.tf line 20, in output \"bucket_name\":",
      "  20: value = aws_s3_bucket.log.bucket",
      "",
      "A managed resource \"aws_s3_bucket\" \"log\" has not been declared in the root module.",
    ];
  }

  if (scenarioId === "terraformModuleMissingOutput") {
    const moduleFile = runtime.files["modules/s3/main.tf"] ?? "";
    const hasOutput = moduleFile.includes('output "bucket_name"') && moduleFile.includes("aws_s3_bucket.this.bucket");

    if (hasOutput) {
      runtime.flags.validationPassed = true;
      markFirstResource(runtime, "exists", "modules/s3 now exports bucket_name.");
      return ["Success! The configuration is valid."];
    }

    return [
      "Error: Unsupported attribute",
      "",
      "  on main.tf line 20, in output \"log_bucket_name\":",
      "  20: value = module.logs.bucket_name",
      "",
      "This object does not have an attribute named \"bucket_name\".",
    ];
  }

  if (scenarioId === "terraformModuleMissingVariable") {
    const rootFile = runtime.files["main.tf"] ?? "";
    const passesEnvironment = rootFile.includes('environment = "dev"') || rootFile.includes("environment = var.environment");

    if (passesEnvironment) {
      runtime.flags.validationPassed = true;
      markFirstResource(runtime, "exists", "Root module passes environment to modules/queue.");
      return ["Success! The configuration is valid."];
    }

    return [
      "Error: Missing required argument",
      "",
      "  on main.tf line 15, in module \"queue\":",
      "  15: module \"queue\" {",
      "",
      "The argument \"environment\" is required, but no definition was found.",
    ];
  }

  if (scenarioId === "terraformBlankAzureWebApp") {
    const file = runtime.files[activeFileName] ?? "";
    const checks = azureWebAppChecks(file);
    const completeShape = checks.hasProvider && checks.hasResourceGroup && checks.hasServicePlan && checks.hasWebApp && checks.hasNodeStack;

    if (completeShape) {
      runtime.flags.validationPassed = true;
      markFirstResource(runtime, "drifted", "Azure resources are declared. Run checkov to enforce HTTPS, then plan.");
      return ["Success! The Azure configuration is valid."];
    }

    return [
      checks.hasProvider ? "Provider azurerm: OK" : "Error: provider \"azurerm\" with features {} is missing.",
      checks.hasResourceGroup ? "Resource group: OK" : "Error: azurerm_resource_group.web with westeurope location is missing.",
      checks.hasServicePlan ? "Linux service plan: OK" : "Error: azurerm_service_plan.web with os_type Linux and sku_name B1 is missing.",
      checks.hasWebApp ? "Linux Web App: OK" : "Error: azurerm_linux_web_app.web connected to the service plan is missing.",
      checks.hasNodeStack ? "Runtime stack: OK" : "Error: Node 20 LTS application_stack is missing.",
    ];
  }

  return ["Success! The configuration is valid."];
}

export function checkovScan(runtime: Scenario, scenarioId: string, activeFileName: string): string[] {
  if (runtime.kind === "awsconfig") return awsConfigCheckovScan(runtime, scenarioId);

  if (scenarioId === "terraformCheckovPublicS3") {
    const hasPrivateAcl = runtime.files[activeFileName].includes('acl    = "private"') || runtime.files[activeFileName].includes('acl = "private"');
    const hasPublicAccessBlock = runtime.files[activeFileName].includes("aws_s3_bucket_public_access_block");

    if (hasPrivateAcl && hasPublicAccessBlock) {
      runtime.flags.securityPassed = true;
      markFirstResource(runtime, "exists", "Checkov passed: bucket ACL is private and public access block exists.");
      return ["Check: CKV_AWS_20: PASSED", "Check: CKV_AWS_53: PASSED", "Passed checks: 2, Failed checks: 0"];
    }

    return [
      "Check: CKV_AWS_20: FAILED",
      "S3 Bucket has an ACL defined which allows public access.",
      "Check: CKV_AWS_53: FAILED",
      "S3 bucket should block public ACLs.",
    ];
  }

  if (scenarioId === "terraformModuleSecurityGroup") {
    const moduleFile = runtime.files["modules/security-group/main.tf"] ?? "";
    const restrictedDefault = moduleFile.includes('default = "10.0.0.0/16"') || moduleFile.includes('default = "172.16.0.0/12"');

    if (restrictedDefault) {
      runtime.flags.securityPassed = true;
      markFirstResource(runtime, "exists", "Checkov passed: module ingress default is restricted.");
      return ["Check: CKV_AWS_260: PASSED", "Security group ingress is not open to 0.0.0.0/0.", "Passed checks: 1, Failed checks: 0"];
    }

    return ["Check: CKV_AWS_260: FAILED", "Security group ingress should not allow 0.0.0.0/0.", "Finding is in modules/security-group/main.tf."];
  }

  if (scenarioId === "terraformBlankEc2WebServer") {
    const file = runtime.files[activeFileName] ?? "";
    const hasProvider = file.includes('provider "aws"');
    const hasSecurityGroup = file.includes("aws_security_group") && (file.includes("from_port   = 80") || file.includes("from_port = 80"));
    const hasInstance = file.includes("aws_instance") && file.includes("vpc_security_group_ids");

    if (hasProvider && hasSecurityGroup && hasInstance) {
      runtime.flags.securityPassed = true;
      markFirstResource(runtime, "exists", "Checkov passed: provider, security group with HTTP ingress, and EC2 instance configured.");
      return ["Check: provider aws present: PASSED", "Check: security group with HTTP ingress: PASSED", "Check: EC2 instance with security group: PASSED", "Passed checks: 3, Failed checks: 0"];
    }

    return [
      hasProvider ? "Check: provider aws present: PASSED" : "Check: FAILED — provider \"aws\" block is missing.",
      hasSecurityGroup ? "Check: security group with HTTP ingress: PASSED" : "Check: FAILED — aws_security_group with ingress on port 80 is missing.",
      hasInstance ? "Check: EC2 instance with security group: PASSED" : "Check: FAILED — aws_instance with vpc_security_group_ids is missing.",
    ];
  }

  if (scenarioId === "terraformBlankAzureWebApp") {
    const file = runtime.files[activeFileName] ?? "";
    const checks = azureWebAppChecks(file);

    if (checks.hasProvider && checks.hasResourceGroup && checks.hasServicePlan && checks.hasWebApp && checks.hasHttpsOnly && checks.hasNodeStack) {
      runtime.flags.securityPassed = true;
      markFirstResource(runtime, "exists", "Checkov passed: Azure Linux Web App enforces HTTPS and required resources are present.");
      return ["Check: provider azurerm present: PASSED", "Check: Linux Web App HTTPS-only: PASSED", "Check: service plan and resource group present: PASSED", "Passed checks: 3, Failed checks: 0"];
    }

    return [
      checks.hasProvider ? "Check: provider azurerm present: PASSED" : "Check: FAILED - provider \"azurerm\" block is missing.",
      checks.hasResourceGroup ? "Check: resource group present: PASSED" : "Check: FAILED - azurerm_resource_group.web is missing.",
      checks.hasServicePlan ? "Check: Linux service plan present: PASSED" : "Check: FAILED - azurerm_service_plan.web with Linux/B1 is missing.",
      checks.hasWebApp ? "Check: Linux Web App present: PASSED" : "Check: FAILED - azurerm_linux_web_app.web is missing.",
      checks.hasHttpsOnly ? "Check: HTTPS-only enabled: PASSED" : "Check: FAILED - azurerm_linux_web_app.web should set https_only = true.",
      checks.hasNodeStack ? "Check: Node 20 runtime configured: PASSED" : "Check: FAILED - Node 20 LTS application stack is missing.",
    ];
  }

  return ["Passed checks: 1, Failed checks: 0"];
}

function markAwsConfigPassed(runtime: Scenario, note: string): void {
  runtime.flags.securityPassed = true;
  runtime.flags.configValidated = true;
  markFirstResource(runtime, "exists", note);
}

export function awsConfigCheckovScan(runtime: Scenario, scenarioId: string): string[] {
  const file = runtime.files["main.tf"] ?? "";

  if (scenarioId === "awsConfigS3Baseline") {
    const hasEncryption = file.includes("aws_s3_bucket_server_side_encryption_configuration");
    const hasVersioning = file.includes("aws_s3_bucket_versioning") && file.includes("status = \"Enabled\"");
    const hasPublicAccessBlock = file.includes("aws_s3_bucket_public_access_block");

    if (hasEncryption && hasVersioning && hasPublicAccessBlock) {
      markAwsConfigPassed(runtime, "S3 bucket has encryption, versioning, and public access block.");
      return ["Check: CKV_AWS_19: PASSED", "Check: CKV_AWS_21: PASSED", "Check: CKV_AWS_53: PASSED", "Passed checks: 3, Failed checks: 0"];
    }

    return [
      hasEncryption ? "Check: CKV_AWS_19: PASSED" : "Check: CKV_AWS_19: FAILED - S3 bucket should have server-side encryption.",
      hasVersioning ? "Check: CKV_AWS_21: PASSED" : "Check: CKV_AWS_21: FAILED - S3 bucket should have versioning enabled.",
      hasPublicAccessBlock ? "Check: CKV_AWS_53: PASSED" : "Check: CKV_AWS_53: FAILED - S3 bucket should block public ACLs.",
    ];
  }

  if (scenarioId === "awsConfigRdsPublicBackup") {
    const privateDb = file.includes("publicly_accessible  = false") || file.includes("publicly_accessible = false");
    const hasBackups = !file.includes("backup_retention_period = 0") && /backup_retention_period\s*=\s*([1-9]|[1-2][0-9]|3[0-5])/.test(file);
    const hasDeletionProtection = file.includes("deletion_protection  = true") || file.includes("deletion_protection = true");
    const finalSnapshot = file.includes("skip_final_snapshot  = false") || file.includes("skip_final_snapshot = false");

    if (privateDb && hasBackups && hasDeletionProtection && finalSnapshot) {
      markAwsConfigPassed(runtime, "RDS is private, backed up, deletion-protected, and keeps a final snapshot.");
      return ["Check: CKV_AWS_16: PASSED", "Check: CKV_AWS_133: PASSED", "Check: CKV_AWS_157: PASSED", "Passed checks: 3, Failed checks: 0"];
    }

    return [
      privateDb ? "Check: CKV_AWS_16: PASSED" : "Check: CKV_AWS_16: FAILED - RDS instance should not be publicly accessible.",
      hasBackups ? "Check: CKV_AWS_133: PASSED" : "Check: CKV_AWS_133: FAILED - RDS backup retention should be enabled.",
      hasDeletionProtection && finalSnapshot ? "Check: CKV_AWS_157: PASSED" : "Check: CKV_AWS_157: FAILED - RDS should use deletion protection and final snapshots.",
    ];
  }

  if (scenarioId === "awsConfigCloudWatchRetention") {
    const hasRetention = file.includes("retention_in_days = 30") || file.includes("retention_in_days  = 30");
    if (hasRetention) {
      markAwsConfigPassed(runtime, "CloudWatch log group retention is set to 30 days.");
      return ["Check: CKV_AWS_338: PASSED", "Log group retention is configured.", "Passed checks: 1, Failed checks: 0"];
    }
    return ["Check: CKV_AWS_338: FAILED", "CloudWatch log group should define retention_in_days = 30."];
  }

  if (scenarioId === "awsConfigCloudTrailBaseline") {
    const multiRegion = file.includes("is_multi_region_trail         = true") || file.includes("is_multi_region_trail = true");
    const globalEvents = file.includes("include_global_service_events = true");
    const validation = file.includes("enable_log_file_validation    = true") || file.includes("enable_log_file_validation = true");

    if (multiRegion && globalEvents && validation) {
      markAwsConfigPassed(runtime, "CloudTrail is multi-region, includes global service events, and validates log files.");
      return ["Check: CKV_AWS_67: PASSED", "Check: CKV_AWS_35: PASSED", "Passed checks: 2, Failed checks: 0"];
    }

    return [
      multiRegion && globalEvents ? "Check: CKV_AWS_67: PASSED" : "Check: CKV_AWS_67: FAILED - CloudTrail should be multi-region and include global service events.",
      validation ? "Check: CKV_AWS_35: PASSED" : "Check: CKV_AWS_35: FAILED - CloudTrail log file validation should be enabled.",
    ];
  }

  if (scenarioId === "awsConfigBlankS3SecureBucket") {
    const hasBucket = file.includes("aws_s3_bucket") && file.includes("secure_logs");
    const hasEncryption = file.includes("aws_s3_bucket_server_side_encryption_configuration");
    const hasVersioning = file.includes("aws_s3_bucket_versioning") && file.includes('status = "Enabled"');
    const hasPublicAccessBlock = file.includes("aws_s3_bucket_public_access_block");

    if (hasBucket && hasEncryption && hasVersioning && hasPublicAccessBlock) {
      markAwsConfigPassed(runtime, "Blank S3 bucket configuration now includes encryption, versioning, and public access block.");
      return ["Check: CKV_AWS_19: PASSED", "Check: CKV_AWS_21: PASSED", "Check: CKV_AWS_53: PASSED", "Passed checks: 3, Failed checks: 0"];
    }

    return [
      hasBucket ? "Check: bucket resource present" : "Check: FAILED - aws_s3_bucket secure_logs is missing.",
      hasEncryption ? "Check: CKV_AWS_19: PASSED" : "Check: CKV_AWS_19: FAILED - S3 bucket should have server-side encryption.",
      hasVersioning ? "Check: CKV_AWS_21: PASSED" : "Check: CKV_AWS_21: FAILED - S3 bucket should have versioning enabled.",
      hasPublicAccessBlock ? "Check: CKV_AWS_53: PASSED" : "Check: CKV_AWS_53: FAILED - S3 bucket should block public ACLs.",
    ];
  }

  return ["No AWS config checks modeled for this scenario."];
}

export function terraformApply(runtime: Scenario, scenarioId: string): string[] {
  if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
  if (runtime.backend.locked) return lockError(runtime);

  if (scenarioId === "interruptedApplyLock" && !hasStateAddress(runtime, "aws_s3_bucket.logs")) {
    return ["aws_s3_bucket.logs: Creating...", "Error: BucketAlreadyOwnedByYou: prod-logs-training already exists", "Import the existing bucket into state before applying."];
  }

  if (scenarioId === "missingIamImport" && !hasStateAddress(runtime, "aws_iam_role.app")) {
    return ["aws_iam_role.app: Creating...", "Error: EntityAlreadyExists: Role with name training-app-role already exists.", "Import the role into state before applying."];
  }

  if (scenarioId === "terraformAzureBlobLeaseLock" && !hasStateAddress(runtime, "azurerm_resource_group.app")) {
    return ["azurerm_resource_group.app: Creating...", "Error: A resource with the ID rg-prod-web already exists.", "Import the existing Azure resource group into state before applying."];
  }

  return terraformPlan(runtime, scenarioId);
}

export function terraformImport(runtime: Scenario, scenarioId: string, address?: string, id?: string): string[] {
  if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
  if (runtime.backend.locked) return lockError(runtime);
  if (!address || !id) return ["Usage: terraform import <address> <id>"];

  if (scenarioId === "interruptedApplyLock" && address === "aws_s3_bucket.logs" && id === "prod-logs-training") {
    addStateResource(runtime, address, id);
    runtime.flags.importedBucket = true;
    return [`Import successful: ${address} (${id})`];
  }

  if (scenarioId === "missingIamImport" && address === "aws_iam_role.app" && id === "training-app-role") {
    addStateResource(runtime, address, id);
    runtime.flags.importedRole = true;
    return [`Import successful: ${address} (${id})`];
  }

  if (scenarioId === "terraformAzureBlobLeaseLock" && address === "azurerm_resource_group.app" && id === "rg-prod-web") {
    addStateResource(runtime, address, id);
    runtime.flags.importedRole = true;
    return [`Import successful: ${address} (${id})`];
  }

  return [`Import failed: no matching remote object for ${address} with id ${id}.`];
}

export function terraformStateMv(runtime: Scenario, scenarioId: string, source?: string, destination?: string): string[] {
  if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
  if (runtime.backend.locked) return lockError(runtime);
  if (!source || !destination) return ["Usage: terraform state mv <source> <destination>"];

  if (scenarioId === "terraformStateFolderMigration" && source === "aws_s3_bucket.logs" && destination === "module.logging.aws_s3_bucket.logs") {
    const stateResource = runtime.stateResources.find((resource) => resource.address === source);
    if (!stateResource) return [`State move failed: ${source} is not in state.`];

    stateResource.address = destination;
    runtime.flags.cleanPlan = false;
    markFirstResource(runtime, "exists", "State now tracks the bucket at the module address.");
    return [`Move "${source}" to "${destination}"`, "Successfully moved 1 object."];
  }

  return [`State move failed: no matching migration from ${source} to ${destination}.`];
}

export function forceUnlock(runtime: Scenario, lockId?: string): string[] {
  if (!runtime.backend.locked) return ["State is not locked."];
  if (!lockId) return [`Usage: terraform force-unlock ${runtime.backend.lockId}`];
  if (lockId !== runtime.backend.lockId) return [`Lock ID ${lockId} does not match the current lock.`];

  runtime.backend = {
    ...runtime.backend,
    locked: false,
    lockId: null,
  };
  return ["Terraform state has been successfully unlocked."];
}

export function scanLocks(runtime: Scenario): string[] {
  if (!runtime.backend.locked) return ["Items: []"];
  return ["Items: [", `  { LockID: "${runtime.backend.lockId}", Path: "${runtime.backend.bucket}/${runtime.backend.key}" }`, "]"];
}

export function azureBlobShow(runtime: Scenario): string[] {
  if (runtime.backend.table !== "tfstate") return ["No Azure Blob Storage backend is configured for this lab."];
  return [
    `name: ${runtime.backend.key}`,
    `container: ${runtime.backend.table}`,
    `account: ${runtime.backend.bucket}`,
    `leaseState: ${runtime.backend.locked ? "leased" : "available"}`,
    `leaseStatus: ${runtime.backend.locked ? "locked" : "unlocked"}`,
    `metadata.terraformlockid: ${runtime.backend.lockId ?? "none"}`,
  ];
}

export function azureBlobLeaseBreak(runtime: Scenario): string[] {
  if (runtime.backend.table !== "tfstate") return ["No Azure Blob Storage backend is configured for this lab."];
  if (!runtime.backend.locked) return ["Blob lease is already available."];
  runtime.backend = {
    ...runtime.backend,
    locked: false,
    lockId: null,
  };
  return ["Breaking lease on prod/web.tfstate...", "Lease break completed. Blob lease state is now available."];
}
