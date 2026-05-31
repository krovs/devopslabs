<script lang="ts">
  import { tick } from "svelte";
  import CertificateCheck from "carbon-icons-svelte/lib/CertificateCheck.svelte";
  import ChartLineData from "carbon-icons-svelte/lib/ChartLineData.svelte";
  import CloudAuditing from "carbon-icons-svelte/lib/CloudAuditing.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import ContinuousDeployment from "carbon-icons-svelte/lib/ContinuousDeployment.svelte";
  import Cost from "carbon-icons-svelte/lib/Cost.svelte";
  import DocumentTasks from "carbon-icons-svelte/lib/DocumentTasks.svelte";
  import Firewall from "carbon-icons-svelte/lib/Firewall.svelte";
  import FlowLogsVpc from "carbon-icons-svelte/lib/FlowLogsVpc.svelte";
  import FolderTree from "carbon-icons-svelte/lib/FolderTree.svelte";
  import GroupSecurity from "carbon-icons-svelte/lib/GroupSecurity.svelte";
  import IbmSecurity from "carbon-icons-svelte/lib/IbmSecurity.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import { dispatchCommand as dispatchSimulatorCommand, type CommandHandlers } from "./commands";
  import { scenarios } from "./scenarios";
  import type { NetworkNode, NetworkTrace, PrFinding, Scenario } from "./types";

  type ConfettiPiece = {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    rotation: number;
    drift: number;
  };

  type SavedRuntimePatch = {
    files: Record<string, string>;
    backend?: Scenario["backend"];
    flags: Scenario["flags"];
    awsResources?: Scenario["awsResources"];
    stateResources?: Scenario["stateResources"];
    networkingControls?: Record<string, string>;
    prReview?: {
      decision?: string;
      selectedFindingIds: string[];
    };
  };

  type SavedSession = {
    version: 10;
    scenarioId: string;
    runtimePatch: SavedRuntimePatch;
    activeFileName?: string;
    terminalLines: string[];
    commandHistory: string[];
    revealedTipCount: number;
    completedScenarioIds?: string[];
    manuallyUncheckedScenarioIds?: string[];
  };

  type LegacySavedSession = {
    version: 9;
    scenarioId: string;
    runtime: Scenario;
    mainTf: string;
    activeFileName?: string;
    terminalLines: string[];
    commandHistory: string[];
    revealedTipCount: number;
    completedScenarioIds?: string[];
    manuallyUncheckedScenarioIds?: string[];
  };

  type ThemeName = "latte" | "mocha" | "dracula" | "cyberpunk";
  type MenuGroupId = "terraform" | "awsconfig" | "cicd" | "terragrunt" | "iam" | "scp" | "policy" | "secrets" | "dns" | "observability" | "finops" | "pr" | "networking";
  type DifficultyTier = "easy" | "normal" | "hard" | "legendary";

  const scenarioIds = Object.keys(scenarios);
  const terraformScenarioIds = scenarioIds.filter((id) => (scenarios[id].kind ?? "terraform") === "terraform");
  const awsConfigScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "awsconfig");
  const terragruntScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "terragrunt");
  const cicdScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "cicd");
  const iamScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "iam");
  const scpScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "scp");
  const policyScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "policy");
  const secretsScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "secrets");
  const dnsScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "dns");
  const observabilityScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "observability");
  const finopsScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "finops");
  const prScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "pr");
  const networkingScenarioIds = scenarioIds.filter((id) => scenarios[id].kind === "networking");
  const labGroups: { id: MenuGroupId; title: string; ids: string[] }[] = [
    { id: "terraform", title: "IaC", ids: terraformScenarioIds },
    { id: "awsconfig", title: "IaC Security Baselines", ids: awsConfigScenarioIds },
    { id: "cicd", title: "Delivery Pipelines", ids: cicdScenarioIds },
    { id: "terragrunt", title: "Stack Orchestration", ids: terragruntScenarioIds },
    { id: "iam", title: "Identity & Access", ids: iamScenarioIds },
    { id: "scp", title: "Organization Policy", ids: scpScenarioIds },
    { id: "policy", title: "Policy as Code", ids: policyScenarioIds },
    { id: "secrets", title: "Secrets Management", ids: secretsScenarioIds },
    { id: "dns", title: "DNS & TLS", ids: dnsScenarioIds },
    { id: "observability", title: "Observability", ids: observabilityScenarioIds },
    { id: "finops", title: "FinOps", ids: finopsScenarioIds },
    { id: "pr", title: "Change Review", ids: prScenarioIds },
    { id: "networking", title: "Network Design", ids: networkingScenarioIds },
  ];
  const labGroupDetails: Record<MenuGroupId, { providers: string[]; description: string }> = {
    terraform: { providers: ["Generic", "AWS"], description: "State, modules, drift, imports, and plans." },
    awsconfig: { providers: ["AWS"], description: "Cloud guardrails, encryption, backup, and audit baselines." },
    cicd: { providers: ["GitHub", "AWS"], description: "Pipeline failures, gates, secrets, and deploy flow." },
    terragrunt: { providers: ["Generic"], description: "Stack wiring, source paths, dependencies, and formatting." },
    iam: { providers: ["AWS", "Azure"], description: "Least privilege policies, role assignments, trust, and KMS access." },
    scp: { providers: ["AWS"], description: "Organization guardrails, explicit denies, and exceptions." },
    policy: { providers: ["K8S"], description: "Admission, workload, and network policies tested as code." },
    secrets: { providers: ["AWS"], description: "Secret paths, rotation, KMS keys, and resource policies." },
    dns: { providers: ["AWS"], description: "Aliases, certificate validation, and edge regions." },
    observability: { providers: ["AWS"], description: "Alarms, logs, dimensions, and retention." },
    finops: { providers: ["AWS"], description: "Cost signals, waste reduction, lifecycle, and NAT spend." },
    pr: { providers: ["Generic", "AWS"], description: "Review risky diffs and identify blocking findings." },
    networking: { providers: ["AWS"], description: "Routes, subnet design, security controls, and packet paths." },
  };
  const sessionStorageKey = "terraform-sim-session";
  const sessionVersion = 10;
  const confettiColors = ["#a6e3a1", "#89b4fa", "#f9e2af", "#f38ba8", "#cba6f7", "#94e2d5"];
  const scenarioDifficultyTiers: Partial<Record<string, DifficultyTier>> = {
    terraformValidateBadReference: "easy",
    terraformModuleMissingVariable: "easy",
    terraformModuleWrongSource: "normal",
    terraformModuleMissingOutput: "normal",
    terraformCheckovPublicS3: "normal",
    terraformModuleSecurityGroup: "hard",
    manualSecurityGroupDrift: "hard",
    missingIamImport: "hard",
    interruptedApplyLock: "hard",
    terraformStateFolderMigration: "legendary",
    awsConfigCloudWatchRetention: "easy",
    awsConfigS3Baseline: "normal",
    awsConfigBlankS3SecureBucket: "normal",
    awsConfigRdsPublicBackup: "hard",
    awsConfigCloudTrailBaseline: "hard",
    terragruntHclfmt: "easy",
    terragruntMissingInclude: "normal",
    terragruntWrongSourceRef: "hard",
    terragruntBadDependencyOutput: "hard",
    githubActionsMissingSecret: "easy",
    githubActionsWrongWorkingDirectory: "easy",
    githubActionsNodeCachePath: "normal",
    githubActionsDockerRegistryAuth: "normal",
    githubActionsEnvironmentApproval: "normal",
    githubActionsMatrixNodeVersion: "hard",
    githubActionsCheckovGate: "hard",
    githubActionsOverbroadPermissions: "hard",
    githubActionsAwsOidcTrust: "legendary",
    iamBlankSecretsReadonly: "easy",
    iamBlankCloudWatchLogsWrite: "normal",
    iamS3PrefixLeastPrivilege: "normal",
    iamDynamoDbLeadingKeys: "hard",
    iamGithubOidcEnvironmentTrust: "hard",
    iamKmsEncryptionContext: "legendary",
    iamAzureBlobReaderScope: "normal",
    scpDenyLeavingOrg: "easy",
    scpBlankDenyRootUser: "normal",
    scpBlankRequireImdsv2: "hard",
    scpRegionRestrictionBreakGlass: "legendary",
    policyKyvernoRequireAppLabel: "easy",
    policyKubernetesDefaultDenyIngress: "easy",
    policyIstioDenyUnauthenticated: "normal",
    policyCiliumAllowDnsEgress: "hard",
    secretsSsmEnvironmentPath: "easy",
    secretsManagerRotationKms: "normal",
    secretsManagerResourcePolicy: "hard",
    dnsRoute53AlbAlias: "easy",
    dnsAcmCloudFrontCertificate: "normal",
    dnsAcmWildcardValidation: "hard",
    observabilityLogRetention: "easy",
    observabilityAlb5xxAlarmDimension: "normal",
    observabilityAlarmAction: "hard",
    finopsS3Lifecycle: "easy",
    finopsNatGatewayCostSpike: "normal",
    finopsUnattachedEbsCleanup: "hard",
    prSecurityGroupAdminCidrReview: "easy",
    prGithubActionsWriteAllReview: "normal",
    prTerraformPublicS3Review: "hard",
    prIamWildcardPolicyReview: "hard",
    networkingSshCidrHardening: "easy",
    networkingSecurityGroupAlbApp: "normal",
    networkingVpcPublicPrivateSubnets: "normal",
    networkingVpcNatEgress: "hard",
    networkingVpcDbIsolation: "hard",
    networkingNaclEphemeralReturn: "hard",
    networkingSiteToSiteVpn: "hard",
    networkingWafAlbProtection: "hard",
    networkingDirectConnectMultiVpc: "legendary",
  };
  const savedSession = getSavedSession();
  let currentScenarioId = savedSession?.scenarioId ?? scenarioIds[0];
  let runtime = savedSession ? restoreRuntime(scenarios[currentScenarioId], savedSession.runtimePatch) : cloneScenario(scenarios[currentScenarioId]);
  let activeFileName = savedSession?.activeFileName && runtime.files[savedSession.activeFileName] ? savedSession.activeFileName : getPrimaryFile(runtime);
  let incidentMode = getInitialIncidentMode();
  let terminalLines = savedSession?.terminalLines ?? [incidentMode ? `Loaded incident: ${incidentDisplayTitle(currentScenarioId)}` : `Loaded scenario: ${runtime.title}`, "Type 'help' to see available commands."];
  let terminalInput = "";
  let terminalOutput: HTMLPreElement;
  let terminalInputElement: HTMLInputElement;
  let commandHistory: string[] = savedSession?.commandHistory ?? [];
  let revealedTipCount = savedSession?.revealedTipCount ?? 0;
  let completedScenarioIds = savedSession?.completedScenarioIds ?? [];
  let manuallyUncheckedScenarioIds = savedSession?.manuallyUncheckedScenarioIds ?? [];
  let historyIndex = -1;
  let theme = getInitialTheme();
  let terminalHeight = getInitialTerminalHeight();
  let isResizingTerminal = false;
  let isMenuOpen = false;
  let menuSearchQuery = "";
  let openMenuGroups = getInitialOpenMenuGroups();
  let currentPage: "index" | "labs" | "docs" = "index";
  let selectedNetworkNodeId: string | null = null;
  let selectedTraceId: string | null = runtime.networking?.traces?.[0]?.id ?? null;
  let traceResult: string[] = [];
  let networkCheckAttempted = false;
  let networkPanX = 0;
  let networkPanY = 0;
  let isPanningNetwork = false;
  let networkPanStartX = 0;
  let networkPanStartY = 0;
  let networkPanOriginX = 0;
  let networkPanOriginY = 0;
  let networkDragDistance = 0;
  let networkPointerNodeId: string | null = null;
  let wasSolved = isSolved();
  let activeLabModal: "solution" | "completion" | null = null;
  let completionModalScenarioId: string | null = null;
  let confettiPieces: ConfettiPiece[] = [];
  let confettiTimeout: number | undefined;
  let saveSessionTimeout: number | undefined;

  $: solved = Boolean(runtime && currentScenarioId && activeFileName) && isSolved();
  $: pageHeading = currentPage === "docs" ? "Documentation" : currentPage === "index" ? "DevOpsLabs" : incidentMode && !solved ? incidentDisplayTitle(currentScenarioId) : runtime.title;
  $: pageSubheading = getPageDescription(solved);
  $: scenarioTips = scenarios[currentScenarioId].tips ?? [];
  $: visibleTips = scenarioTips.slice(0, revealedTipCount);
  $: scenarioFileNames = Object.keys(runtime.files);
  $: activeFileContent = runtime.files[activeFileName] ?? "";
  $: workflowResource = runtime.awsResources[0];
  $: repositorySecrets = runtime.stateResources.filter((resource) => resource.address.startsWith("secret."));
  $: repositoryPaths = runtime.stateResources.filter((resource) => resource.address.startsWith("path."));
  $: leftResourceTitle = runtime.kind === "terragrunt" ? "Terragrunt Stack" : runtime.kind === "iam" ? "IAM" : runtime.kind === "scp" ? "SCP" : runtime.kind === "secrets" ? "Secrets" : runtime.kind === "dns" ? "DNS/TLS" : runtime.kind === "observability" ? "Observability" : runtime.kind === "finops" ? "Cost" : runtime.kind === "awsconfig" ? "IaC Security" : "AWS";
  $: rightResourceTitle = runtime.kind === "terragrunt" ? "Stack State" : runtime.kind === "iam" || runtime.kind === "scp" || runtime.kind === "secrets" || runtime.kind === "dns" || runtime.kind === "observability" || runtime.kind === "finops" || runtime.kind === "awsconfig" ? "Context" : "Terraform State";
  $: selectedNetworkNode = runtime.networking?.nodes.find((node) => node.id === selectedNetworkNodeId) ?? null;
  $: networkingRequirementSections = parseRequirementSections(runtime.files[activeFileName] ?? "");
  $: selectedNetworkControls = getSelectedNetworkControls(runtime, selectedNetworkNode);
  $: networkTraces = runtime.networking?.traces ?? [];
  $: selectedTrace = getSelectedTrace(networkTraces, selectedTraceId);
  $: if (solved && !completedScenarioIds.includes(currentScenarioId) && !manuallyUncheckedScenarioIds.includes(currentScenarioId)) {
    completedScenarioIds = [...completedScenarioIds, currentScenarioId];
    saveSession();
  }
  $: document.body.classList.toggle("dark-mode", theme === "mocha");
  $: document.body.classList.toggle("dracula-mode", theme === "dracula");
  $: document.body.classList.toggle("cyberpunk-mode", theme === "cyberpunk");
  $: localStorage.setItem("terraform-sim-theme", theme);
  $: localStorage.setItem("terraform-sim-incident-mode", String(incidentMode));
  $: localStorage.setItem("terraform-sim-open-menu-groups", JSON.stringify(openMenuGroups));

  function cloneScenario(scenario: Scenario): Scenario {
    return JSON.parse(JSON.stringify(scenario)) as Scenario;
  }

  function restoreRuntime(baseScenario: Scenario, patch: SavedRuntimePatch): Scenario {
    const restored = cloneScenario(baseScenario);
    restored.files = { ...restored.files, ...patch.files };
    if (patch.backend) restored.backend = patch.backend;
    restored.flags = { ...restored.flags, ...patch.flags };
    if (patch.awsResources) restored.awsResources = patch.awsResources;
    if (patch.stateResources) restored.stateResources = patch.stateResources;

    if (restored.networking && patch.networkingControls) {
      restored.networking.controls = restored.networking.controls.map((control) => ({
        ...control,
        value: patch.networkingControls?.[control.id] ?? control.value,
      }));
    }

    if (restored.prReview && patch.prReview) {
      restored.prReview.decision = patch.prReview.decision;
      restored.prReview.findings = restored.prReview.findings.map((finding) => ({
        ...finding,
        selected: patch.prReview?.selectedFindingIds.includes(finding.id) ?? finding.selected,
      }));
    }

    return restored;
  }

  function createRuntimePatch(current: Scenario, baseScenario: Scenario): SavedRuntimePatch {
    const changedFiles = Object.fromEntries(
      Object.entries(current.files).filter(([fileName, content]) => baseScenario.files[fileName] !== content),
    );
    const changedFlags = Object.fromEntries(
      Object.entries(current.flags).filter(([flag, value]) => baseScenario.flags[flag as keyof Scenario["flags"]] !== value),
    ) as Scenario["flags"];

    return {
      files: changedFiles,
      backend: valuesMatch(current.backend, baseScenario.backend) ? undefined : current.backend,
      flags: changedFlags,
      awsResources: valuesMatch(current.awsResources, baseScenario.awsResources) ? undefined : current.awsResources,
      stateResources: valuesMatch(current.stateResources, baseScenario.stateResources) ? undefined : current.stateResources,
      networkingControls: current.networking
        ? Object.fromEntries(current.networking.controls.map((control) => [control.id, control.value]))
        : undefined,
      prReview: current.prReview
        ? {
            decision: current.prReview.decision,
            selectedFindingIds: current.prReview.findings.filter((finding) => finding.selected).map((finding) => finding.id),
          }
        : undefined,
    };
  }

  function valuesMatch(left: unknown, right: unknown): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function getPrimaryFile(scenario: Scenario): string {
    return scenario.primaryFile ?? "main.tf";
  }

  function getSavedSession(): SavedSession | null {
    const rawSession = localStorage.getItem(sessionStorageKey);
    if (!rawSession) return null;

    try {
      const parsed = JSON.parse(rawSession) as SavedSession | LegacySavedSession;
      if (!scenarioIds.includes(parsed.scenarioId)) return null;

      if (parsed.version === 9) {
        if (!parsed.runtime || !parsed.mainTf || !Array.isArray(parsed.terminalLines)) return null;
        return {
          version: sessionVersion,
          scenarioId: parsed.scenarioId,
          runtimePatch: createRuntimePatch(parsed.runtime, scenarios[parsed.scenarioId]),
          activeFileName: parsed.activeFileName,
          terminalLines: parsed.terminalLines,
          commandHistory: parsed.commandHistory,
          revealedTipCount: parsed.revealedTipCount,
          completedScenarioIds: parsed.completedScenarioIds,
          manuallyUncheckedScenarioIds: parsed.manuallyUncheckedScenarioIds,
        };
      }

      if (parsed.version !== sessionVersion) return null;
      if (!parsed.runtimePatch || !Array.isArray(parsed.terminalLines)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveSession(): void {
    if (saveSessionTimeout) {
      window.clearTimeout(saveSessionTimeout);
      saveSessionTimeout = undefined;
    }

    const session: SavedSession = {
      version: sessionVersion,
      scenarioId: currentScenarioId,
      runtimePatch: createRuntimePatch(runtime, scenarios[currentScenarioId]),
      activeFileName,
      terminalLines,
      commandHistory,
      revealedTipCount,
      completedScenarioIds,
      manuallyUncheckedScenarioIds,
    };

    localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  }

  function scheduleSaveSession(): void {
    if (saveSessionTimeout) window.clearTimeout(saveSessionTimeout);
    saveSessionTimeout = window.setTimeout(saveSession, 300);
  }

  function getInitialTheme(): ThemeName {
    const savedTheme = localStorage.getItem("terraform-sim-theme");
    if (savedTheme === "latte" || savedTheme === "mocha" || savedTheme === "dracula" || savedTheme === "cyberpunk") return savedTheme;
    if (savedTheme === "dark") return "mocha";
    if (savedTheme === "light") return "latte";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "mocha" : "latte";
  }

  function getInitialIncidentMode(): boolean {
    return localStorage.getItem("terraform-sim-incident-mode") === "true";
  }

  function getInitialOpenMenuGroups(): MenuGroupId[] {
    const fallback: MenuGroupId[] = [scenarioMenuGroup(currentScenarioId)];
    const raw = localStorage.getItem("terraform-sim-open-menu-groups");
    if (!raw) return fallback;

    try {
      const parsed = JSON.parse(raw) as MenuGroupId[];
      const valid = parsed.filter((group) => ["terraform", "awsconfig", "cicd", "terragrunt", "iam", "scp", "policy", "secrets", "dns", "observability", "finops", "pr", "networking"].includes(group));
      return valid.length ? valid : fallback;
    } catch {
      return fallback;
    }
  }

  function scenarioMenuGroup(id: string): MenuGroupId {
    const kind = scenarios[id].kind ?? "terraform";
    if (kind === "awsconfig" || kind === "cicd" || kind === "terragrunt" || kind === "iam" || kind === "scp" || kind === "policy" || kind === "secrets" || kind === "dns" || kind === "observability" || kind === "finops" || kind === "pr" || kind === "networking") return kind;
    return "terraform";
  }

  function toggleMenuGroup(group: MenuGroupId): void {
    openMenuGroups = openMenuGroups.includes(group)
      ? openMenuGroups.filter((item) => item !== group)
      : [...openMenuGroups, group];
  }

  function setIncidentMode(event: Event): void {
    incidentMode = (event.currentTarget as HTMLInputElement).checked;
    openMenuGroups = [...openMenuGroups];
  }

  function providerClass(provider: string): string {
    return `provider-${provider.toLowerCase()}`;
  }

  function filteredScenarioIds(ids: string[], query: string): string[] {
    const queryTokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!queryTokens.length) return ids;
    return ids.filter((id) => {
      const scenario = scenarios[id];
      const providers = labGroupDetails[scenarioMenuGroup(id)].providers.join(" ");
      const searchable = `${scenario.title} ${id} ${scenarioKindLabel(scenario)} ${providers}`.toLowerCase();
      return queryTokens.every((token) => searchable.includes(token));
    });
  }

  function menuGroupVisible(ids: string[], query: string): boolean {
    return filteredScenarioIds(ids, query).length > 0;
  }

  function groupCompletionLabel(ids: string[]): string {
    const completed = ids.filter((id) => completedScenarioIds.includes(id)).length;
    return `${completed}/${ids.length}`;
  }

  function toggleScenarioCompletion(id: string, event: Event): void {
    event.stopPropagation();
    if (completedScenarioIds.includes(id)) {
      completedScenarioIds = completedScenarioIds.filter((scenarioId) => scenarioId !== id);
      if (!manuallyUncheckedScenarioIds.includes(id)) manuallyUncheckedScenarioIds = [...manuallyUncheckedScenarioIds, id];
    } else {
      completedScenarioIds = [...completedScenarioIds, id];
      manuallyUncheckedScenarioIds = manuallyUncheckedScenarioIds.filter((scenarioId) => scenarioId !== id);
    }
    saveSession();
  }

  function scenarioDifficultyClass(id: string): string {
    return `difficulty-${scenarioDifficultyTiers[id] ?? "easy"}`;
  }

  function scenarioKindLabel(scenario: Scenario): string {
    if (scenario.kind === "cicd") return "Delivery Pipeline";
    if (scenario.kind === "awsconfig") return "IaC Security Baselines";
    if (scenario.kind === "terragrunt") return "Stack Orchestration";
    if (scenario.kind === "networking") return "Network Design";
    if (scenario.kind === "iam") return "Identity & Access";
    if (scenario.kind === "scp") return "Organization Policy";
    if (scenario.kind === "policy") return "Policy as Code";
    if (scenario.kind === "secrets") return "Secrets Management";
    if (scenario.kind === "dns") return "DNS & TLS";
    if (scenario.kind === "observability") return "Observability";
    if (scenario.kind === "finops") return "FinOps";
    if (scenario.kind === "pr") return "Change Review";
    return "IaC";
  }

  function scenarioKindIds(scenario: Scenario): string[] {
    if (scenario.kind === "cicd") return cicdScenarioIds;
    if (scenario.kind === "awsconfig") return awsConfigScenarioIds;
    if (scenario.kind === "terragrunt") return terragruntScenarioIds;
    if (scenario.kind === "networking") return networkingScenarioIds;
    if (scenario.kind === "iam") return iamScenarioIds;
    if (scenario.kind === "scp") return scpScenarioIds;
    if (scenario.kind === "policy") return policyScenarioIds;
    if (scenario.kind === "secrets") return secretsScenarioIds;
    if (scenario.kind === "dns") return dnsScenarioIds;
    if (scenario.kind === "observability") return observabilityScenarioIds;
    if (scenario.kind === "finops") return finopsScenarioIds;
    if (scenario.kind === "pr") return prScenarioIds;
    return terraformScenarioIds;
  }

  function incidentDisplayTitle(id: string): string {
    const scenario = scenarios[id];
    const ids = scenarioKindIds(scenario);
    const index = Math.max(0, ids.indexOf(id)) + 1;
    return `${scenarioKindLabel(scenario)} Incident ${index}`;
  }

  function labMenuTitle(id: string): string {
    if (incidentMode && !completedScenarioIds.includes(id)) return incidentDisplayTitle(id);
    return scenarios[id].title;
  }

  function getPageDescription(solvedState: boolean): string {
    if (currentPage === "docs") return "Commands, best practices, and troubleshooting notes for the labs.";
    if (currentPage === "index") return "Choose a lab. Completed scenarios are marked in the list.";
    if (!incidentMode || solvedState) return runtime.description;
    if (runtime.kind === "cicd") return "A delivery pipeline is failing. Inspect the run output, repository settings, and workflow files to identify the smallest safe fix.";
    if (runtime.kind === "awsconfig") return "A Terraform change contains AWS service misconfigurations. Scan the code, add the missing guardrails, and verify with Checkov.";
    if (runtime.kind === "terragrunt") return "A stack operation is blocked. Reproduce the failure and inspect stack wiring, formatting, source paths, and dependency outputs.";
    if (runtime.kind === "networking") return "A network path does not meet the operational requirement. Use the diagram, symptoms, and packet traces to isolate the broken component.";
    if (runtime.kind === "iam") return "An access path is either failing or too broad. Simulate the principal, inspect policy conditions, and constrain the permission boundary.";
    if (runtime.kind === "scp") return "An organization guardrail is blocking or allowing the wrong action. Inspect the SCP, Deny precedence, conditions, and exceptions.";
    if (runtime.kind === "secrets") return "A service is using secret material unsafely or from the wrong environment. Inspect secret configuration, paths, KMS, and rotation.";
    if (runtime.kind === "dns") return "A hostname or certificate is unhealthy. Inspect DNS records, alias targets, validation records, and certificate region.";
    if (runtime.kind === "observability") return "Monitoring is missing or misleading. Inspect alarms, logs, dimensions, retention, and the smallest telemetry fix.";
    if (runtime.kind === "finops") return "Cloud spend has drifted. Inspect the cost signal, identify the waste source, and apply the smallest cost control.";
    if (runtime.kind === "policy") return "A platform policy is not enforcing the intended workload guardrail. Inspect the policy, run the policy test, and apply the smallest rule fix.";
    if (runtime.kind === "pr") return "A pull request needs review. Inspect the diff, identify the risky lines, and submit the correct review decision.";
    return "An infrastructure deployment is unhealthy. Reproduce the failure, inspect state and configuration, then apply the smallest safe repair.";
  }

  function networkingIncidentSummary(): string[] {
    return runtime.networking?.symptoms ?? ["Connectivity test failed.", "Review routing, addressing, and policy controls."];
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") isMenuOpen = false;
  }

  function handleGlobalPointerDown(event: PointerEvent): void {
    if (!(event.target as HTMLElement | null)?.closest(".terminal-panel")) return;
    window.setTimeout(() => focusTerminalInput(), 0);
  }

  function getInitialTerminalHeight(): number {
    const savedHeight = Number(localStorage.getItem("terraform-sim-terminal-height"));
    if (Number.isFinite(savedHeight) && savedHeight > 0) return clampTerminalHeight(savedHeight);
    return 260;
  }

  function clampTerminalHeight(height: number): number {
    const maxHeight = Math.max(220, Math.floor(window.innerHeight * 0.72));
    return Math.min(maxHeight, Math.max(150, height));
  }

  function startTerminalResize(event: PointerEvent): void {
    isResizingTerminal = true;
    resizeTerminal(event);
  }

  function resizeTerminal(event: PointerEvent): void {
    if (!isResizingTerminal) return;
    terminalHeight = clampTerminalHeight(window.innerHeight - event.clientY - 12);
    localStorage.setItem("terraform-sim-terminal-height", String(terminalHeight));
  }

  function stopTerminalResize(): void {
    isResizingTerminal = false;
  }

  function resizeTerminalWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const delta = event.key === "ArrowUp" ? 20 : -20;
    terminalHeight = clampTerminalHeight(terminalHeight + delta);
    localStorage.setItem("terraform-sim-terminal-height", String(terminalHeight));
  }

  function loadScenario(id: string): void {
    if (saveSessionTimeout) saveSession();

    currentScenarioId = id;
    const group = scenarioMenuGroup(id);
    if (!openMenuGroups.includes(group)) openMenuGroups = [...openMenuGroups, group];
    runtime = cloneScenario(scenarios[id]);
    activeFileName = getPrimaryFile(runtime);
    terminalLines = [incidentMode ? `Loaded incident: ${incidentDisplayTitle(id)}` : `Loaded scenario: ${runtime.title}`, "Type 'help' to see available commands."];
    commandHistory = [];
    revealedTipCount = 0;
    historyIndex = -1;
    selectedNetworkNodeId = null;
    selectedTraceId = runtime.networking?.traces?.[0]?.id ?? null;
    traceResult = [];
    networkCheckAttempted = false;
    wasSolved = isSolved();
    activeLabModal = null;
    completionModalScenarioId = null;
    confettiPieces = [];
    if (confettiTimeout) window.clearTimeout(confettiTimeout);
    resetNetworkPan();
    saveSession();
    scrollTerminal();
  }

  function startNetworkPan(event: PointerEvent): void {
    if (event.button !== 0) return;
    isPanningNetwork = true;
    networkDragDistance = 0;
    networkPointerNodeId = (event.target as HTMLElement).closest<HTMLElement>(".network-node")?.dataset.nodeId ?? null;
    networkPanStartX = event.clientX;
    networkPanStartY = event.clientY;
    networkPanOriginX = networkPanX;
    networkPanOriginY = networkPanY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function moveNetworkPan(event: PointerEvent): void {
    if (!isPanningNetwork) return;
    const deltaX = event.clientX - networkPanStartX;
    const deltaY = event.clientY - networkPanStartY;
    networkDragDistance = Math.max(networkDragDistance, Math.hypot(deltaX, deltaY));
    networkPanX = clampNetworkPan(networkPanOriginX + deltaX);
    networkPanY = clampNetworkPan(networkPanOriginY + deltaY);
  }

  function stopNetworkPan(event: PointerEvent): void {
    if (!isPanningNetwork) return;
    isPanningNetwork = false;
    if (networkDragDistance <= 5 && networkPointerNodeId) selectedNetworkNodeId = networkPointerNodeId;
    networkPointerNodeId = null;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }

  function handleNetworkCanvasKeydown(event: KeyboardEvent): void {
    if (event.key !== "Home" && event.key !== "Escape") return;
    event.preventDefault();
    resetNetworkPan();
  }

  function resetNetworkPan(): void {
    networkPanX = 0;
    networkPanY = 0;
    isPanningNetwork = false;
  }

  function clampNetworkPan(value: number): number {
    return Math.max(-260, Math.min(260, value));
  }

  function selectScenario(id: string): void {
    loadScenario(id);
    currentPage = "labs";
    isMenuOpen = false;
  }

  function openDocs(): void {
    currentPage = "docs";
    isMenuOpen = false;
  }

  function openLabs(): void {
    currentPage = "index";
    isMenuOpen = false;
  }

  function openLabGroup(group: MenuGroupId): void {
    openMenuGroups = [group];
    currentPage = "index";
    isMenuOpen = true;
  }

  function saveCurrentFile(): void {
    addTerminalLines([`Saved ${activeFileName}`]);
    evaluateWinCondition();
    celebrateIfScenarioCompleted();
    saveSession();
  }

  function revealTip(): void {
    if (revealedTipCount >= scenarioTips.length) return;
    revealedTipCount += 1;
    saveSession();
  }

  function updateMainTf(value: string): void {
    runtime.files[activeFileName] = value;
    runtime = runtime;
    scheduleSaveSession();
  }

  function handleEditorKeydown(event: KeyboardEvent): void {
    if (event.key !== "Tab") return;
    event.preventDefault();

    const textarea = event.currentTarget as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indentation = "  ";
    const nextValue = `${textarea.value.slice(0, start)}${indentation}${textarea.value.slice(end)}`;

    updateMainTf(nextValue);
    tick().then(() => {
      textarea.selectionStart = start + indentation.length;
      textarea.selectionEnd = start + indentation.length;
    });
  }

  function updateNetworkControl(controlId: string, value: string): void {
    if (!runtime.networking) return;
    runtime.networking.controls = runtime.networking.controls.map((control) =>
      control.id === controlId ? { ...control, value } : control,
    );
    runtime.flags.networkConfigured = false;
    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Network design has pending validation.";
    runtime = runtime;
    networkCheckAttempted = false;
    traceResult = [];
    saveSession();
  }

  function checkNetworkingScenario(): void {
    if (!runtime.networking) return;
    const solved = runtime.networking.controls.every((control) => control.value === control.answer);
    runtime.flags.networkConfigured = solved;
    runtime.awsResources[0].status = solved ? "exists" : "failed";
    runtime.awsResources[0].note = solved
      ? "Network design matches the scenario requirements."
      : "Some route or attachment settings still do not match the requirements.";
    runtime = runtime;
    networkCheckAttempted = true;
    addTerminalLines([solved ? "Networking scenario complete." : "Networking check failed. Review the symptom log."]);
    celebrateIfScenarioCompleted();
    saveSession();
  }

  function getSelectedTrace(traces: NetworkTrace[], traceId: string | null): NetworkTrace | null {
    if (traceId) {
      const trace = traces.find((item) => item.id === traceId);
      if (trace) return trace;
    }
    return traces[0] ?? null;
  }

  function selectNetworkTrace(traceId: string): void {
    selectedTraceId = traceId;
    traceResult = [];
  }

  function setPrDecision(decision: "approve" | "request_changes"): void {
    if (!runtime.prReview) return;
    runtime.prReview.decision = decision;
    runtime.flags.reviewPassed = false;
    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Review decision has not passed validation.";
    runtime = runtime;
    saveSession();
  }

  function togglePrFinding(findingId: string): void {
    if (!runtime.prReview) return;
    runtime.prReview.findings = runtime.prReview.findings.map((finding) =>
      finding.id === findingId ? { ...finding, selected: !finding.selected } : finding,
    );
    runtime.flags.reviewPassed = false;
    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Review findings changed. Submit the review again.";
    runtime = runtime;
    saveSession();
  }

  function submitPrReview(): void {
    if (!runtime.prReview) return;
    const passed = prReviewIsCorrect();
    runtime.flags.reviewPassed = passed;
    runtime.awsResources[0].status = passed ? "success" : "failed";
    runtime.awsResources[0].note = passed
      ? "Review decision and required findings match the pull request risk."
      : "Review does not match the pull request risk. Check the decision and selected findings.";
    runtime = runtime;
    addTerminalLines([passed ? "PR review accepted." : "PR review rejected by training checks."]);
    celebrateIfScenarioCompleted();
    saveSession();
  }

  function prReviewIsCorrect(): boolean {
    if (!runtime.prReview) return false;
    const decisionMatches = runtime.prReview.decision === runtime.prReview.expectedDecision;
    const requiredFindingsSelected = runtime.prReview.findings.every((finding) => finding.required === finding.selected);
    return decisionMatches && requiredFindingsSelected;
  }

  function selectedPrFindings(): PrFinding[] {
    return runtime.prReview?.findings.filter((finding) => finding.selected) ?? [];
  }

  function markOperationalScenarioSolved(flag: "secretsValidated" | "dnsValidated" | "observabilityValidated" | "finopsValidated" | "policyValidated", note: string): void {
    runtime.flags[flag] = true;
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = note;
    runtime = runtime;
  }

  function secretsFixApplied(): boolean {
    if (currentScenarioId === "secretsManagerRotationKms") {
      const config = runtime.files["secret-config.json"] ?? "";
      return (
        config.includes('"kmsKeyId": "alias/prod-secrets-kms"') &&
        config.includes('"rotationEnabled": true') &&
        config.includes('"rotationDays": 30')
      );
    }

    if (currentScenarioId === "secretsSsmEnvironmentPath") {
      const config = runtime.files["app-config.yaml"] ?? "";
      return (
        config.includes("environment: staging") &&
        config.includes("databasePasswordParameter: /staging/checkout/db/password") &&
        config.includes("withDecryption: true") &&
        !config.includes("databasePasswordParameter: /prod/checkout/db/password")
      );
    }

    if (currentScenarioId === "secretsManagerResourcePolicy") {
      const policy = runtime.files["resource-policy.json"] ?? "";
      return (
        policy.includes('"blockPublicPolicy": true') &&
        policy.includes('"Principal": "arn:aws:iam::210987654321:role/security-audit"') &&
        policy.includes('"Action": "secretsmanager:GetSecretValue"') &&
        !policy.includes('"Principal": "*"') &&
        !policy.includes('"Resource": "*"')
      );
    }

    return false;
  }

  function dnsFixApplied(): boolean {
    if (currentScenarioId === "dnsAcmCloudFrontCertificate") {
      const config = runtime.files["certificate.json"] ?? "";
      return (
        config.includes('"region": "us-east-1"') &&
        config.includes('"validationRecordName": "_9f3b.app.example.com"') &&
        config.includes('"validationRecordValue": "_7a1d.acm-validations.aws"')
      );
    }

    if (currentScenarioId === "dnsRoute53AlbAlias") {
      const config = runtime.files["route53-record.json"] ?? "";
      return (
        config.includes('"type": "A"') &&
        config.includes('"value": "app-prod-456.eu-west-1.elb.amazonaws.com"') &&
        config.includes('"aliasHostedZoneId": "Z32O12XQLNTSW2"') &&
        config.includes('"evaluateTargetHealth": true')
      );
    }

    if (currentScenarioId === "dnsAcmWildcardValidation") {
      const config = runtime.files["certificate.json"] ?? "";
      return (
        config.includes('"region": "us-east-1"') &&
        config.includes('"validationRecordName": "_a1b2.example.com"') &&
        config.includes('"validationRecordValue": "_c3d4.acm-validations.aws"') &&
        config.includes('"hostedZone": "example.com"')
      );
    }

    return false;
  }

  function observabilityFixApplied(): boolean {
    if (currentScenarioId === "observabilityAlb5xxAlarmDimension") {
      const config = runtime.files["alarm.json"] ?? "";
      return (
        config.includes('"namespace": "AWS/ApplicationELB"') &&
        config.includes('"metricName": "HTTPCode_ELB_5XX_Count"') &&
        config.includes('"name": "LoadBalancer"') &&
        config.includes('"value": "app/prod-web/50dc6c495c0c9188"') &&
        !config.includes('"namespace": "AWS/ELB"') &&
        !config.includes('"name": "LoadBalancerName"')
      );
    }

    if (currentScenarioId === "observabilityLogRetention") {
      const config = runtime.files["log-group.json"] ?? "";
      return (
        config.includes('"logGroupName": "/aws/ecs/payments-api"') &&
        config.includes('"retentionInDays": 30') &&
        !config.includes('"retentionInDays": null')
      );
    }

    if (currentScenarioId === "observabilityAlarmAction") {
      const config = runtime.files["alarm.json"] ?? "";
      return (
        config.includes('"alarmActions": ["arn:aws:sns:eu-west-1:123456789012:oncall-critical"]') &&
        config.includes('"okActions": ["arn:aws:sns:eu-west-1:123456789012:oncall-critical"]') &&
        !config.includes('"alarmActions": []')
      );
    }

    return false;
  }

  function finopsFixApplied(): boolean {
    if (currentScenarioId === "finopsNatGatewayCostSpike") {
      const config = runtime.files["nat-gateways.json"] ?? "";
      return (
        config.includes('"natGatewayCount": 2') &&
        config.includes('"privateWorkloadAzs": ["eu-west-1a", "eu-west-1b"]') &&
        config.includes('"removeIdleGateways": true')
      );
    }

    if (currentScenarioId === "finopsS3Lifecycle") {
      const config = runtime.files["lifecycle.json"] ?? "";
      return (
        config.includes('"transitionAfterDays": 30') &&
        config.includes('"storageClass": "STANDARD_IA"') &&
        config.includes('"expireTempExportsAfterDays": 14')
      );
    }

    if (currentScenarioId === "finopsUnattachedEbsCleanup") {
      const config = runtime.files["volume-cleanup.json"] ?? "";
      return (
        config.includes('"deleteUnattached": true') &&
        config.includes('"snapshotBeforeDelete": true') &&
        config.includes('"minimumUnattachedDays": 14')
      );
    }

    return false;
  }

  function policyFixApplied(): boolean {
    if (currentScenarioId === "policyKyvernoRequireAppLabel") {
      const policy = runtime.files["policy.yaml"] ?? "";
      return (
        policy.includes("kind: ClusterPolicy") &&
        policy.includes("validationFailureAction: Enforce") &&
        policy.includes("message: Pods must define the app label.") &&
        policy.includes("pattern:") &&
        policy.includes("metadata:") &&
        policy.includes("labels:") &&
        policy.includes("app: \"?*\"")
      );
    }

    if (currentScenarioId === "policyKubernetesDefaultDenyIngress") {
      const policy = runtime.files["policy.yaml"] ?? "";
      return (
        policy.includes("kind: NetworkPolicy") &&
        policy.includes("name: default-deny-ingress") &&
        policy.includes("namespace: payments") &&
        policy.includes("podSelector: {}") &&
        policy.includes("policyTypes:") &&
        policy.includes("- Ingress") &&
        policy.includes("ingress: []")
      );
    }

    if (currentScenarioId === "policyIstioDenyUnauthenticated") {
      const policy = runtime.files["policy.yaml"] ?? "";
      return (
        policy.includes("kind: AuthorizationPolicy") &&
        policy.includes("name: require-jwt-checkout") &&
        policy.includes("namespace: checkout") &&
        policy.includes("selector:") &&
        policy.includes("matchLabels:") &&
        policy.includes("app: checkout-api") &&
        policy.includes("action: ALLOW") &&
        policy.includes("requestPrincipals:") &&
        policy.includes("- \"*\"")
      );
    }

    if (currentScenarioId === "policyCiliumAllowDnsEgress") {
      const policy = runtime.files["policy.yaml"] ?? "";
      return (
        policy.includes("kind: CiliumNetworkPolicy") &&
        policy.includes("name: allow-dns-egress") &&
        policy.includes("namespace: platform") &&
        policy.includes("matchLabels:") &&
        policy.includes("app: worker") &&
        policy.includes("toEndpoints:") &&
        policy.includes("k8s-app: kube-dns") &&
        policy.includes("toPorts:") &&
        policy.includes("port: \"53\"") &&
        policy.includes("protocol: UDP")
      );
    }

    return false;
  }

  function runNetworkTrace(): void {
    if (!selectedTrace) return;

    const steps = selectedTrace.path.split("|").map((step) => step.trim()).filter(Boolean);
    const result = isSolved()
      ? `PASS: ${selectedTrace.success ?? "Packet path completed without policy or routing drops."}`
      : `FAIL: ${selectedTrace.failure}`;

    traceResult = [
      `Probe: ${selectedTrace.source} -> ${selectedTrace.destination} tcp/${selectedTrace.port}`,
      ...steps.map((step) => `- ${step}`),
      result,
    ];
  }

  function networkControlOptions(options: string): string[] {
    return options.split(",").map((option) => option.trim()).filter(Boolean);
  }

  function networkLinkIsFailed(link: { status?: string; controlIds?: string }): boolean {
    if (isSolved()) return false;
    if (!runtime.networking) return link.status === "failed";
    if (!link.controlIds) return link.status === "failed";

    const controlIds = link.controlIds.split(",").map((id) => id.trim()).filter(Boolean);
    return runtime.networking.controls.some((control) => controlIds.includes(control.id) && control.value !== control.answer);
  }

  function getSelectedNetworkControls(scenario: Scenario, node: NetworkNode | null) {
    if (!scenario.networking || !node) return [];
    const nodeTokens = new Set([node.id, node.type, ...node.id.split("_")].map((token) => token.toLowerCase()));
    const ignoredTokens = new Set(["subnet", "route", "table", "security", "group", "edge", "compute", "vpc"]);

    return scenario.networking.controls.filter((control) => {
      if (control.nodeId) {
        return control.nodeId.split(",").map((id) => id.trim()).includes(node.id);
      }
      const searchable = `${control.id} ${control.label} ${control.note ?? ""}`.toLowerCase();
      return [...nodeTokens].some((token) => token.length > 2 && !ignoredTokens.has(token) && searchable.includes(token));
    });
  }

  function parseRequirementSections(text: string): { goal: string[]; constraints: string[] } {
    const lines = text.split("\n");
    const goal: string[] = [];
    const constraints: string[] = [];
    let section: "goal" | "constraints" | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === "Goal:") {
        section = "goal";
        continue;
      }
      if (trimmed === "Constraints:") {
        section = "constraints";
        continue;
      }

      if (section === "goal") goal.push(trimmed.replace(/^- /, ""));
      if (section === "constraints") constraints.push(trimmed.replace(/^- /, ""));
    }

    return { goal, constraints };
  }

  function diffLineClass(line: string): string {
    if (line.startsWith("diff --git") || line.startsWith("index ")) return "diff-line diff-line-meta";
    if (line.startsWith("@@")) return "diff-line diff-line-hunk";
    if (line.startsWith("+++") || line.startsWith("---")) return "diff-line diff-line-file";
    if (line.startsWith("+")) return "diff-line diff-line-add";
    if (line.startsWith("-")) return "diff-line diff-line-remove";
    return "diff-line";
  }

  function networkEdgePath(fromX: string, fromY: string, toX: string, toY: string): string {
    const x1 = Number(fromX);
    const y1 = Number(fromY);
    const x2 = Number(toX);
    const y2 = Number(toY);
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
  }

  function selectFile(fileName: string): void {
    activeFileName = fileName;
    saveSession();
  }

  function runCommand(): void {
    const input = terminalInput.trim();
    if (!input) return;

    commandHistory = [...commandHistory, input];
    historyIndex = commandHistory.length;
    terminalLines = [...terminalLines, `$ ${input}`, ...dispatchSimulatorCommand(input, runtime, commandHandlers())];
    terminalInput = "";
    evaluateWinCondition();
    celebrateIfScenarioCompleted();
    saveSession();
    scrollTerminal();
  }

  function openSolutionModal(): void {
    activeLabModal = "solution";
  }

  function closeLabModal(): void {
    activeLabModal = null;
  }

  function updateScenarioFiles(patches: Record<string, string>, focusFileName?: string): void {
    runtime.files = { ...runtime.files, ...patches };
    if (focusFileName && runtime.files[focusFileName] !== undefined) {
      activeFileName = focusFileName;
    }
    runtime = runtime;
  }

  function applySolution(): void {
    const lessonSolution = scenarios[currentScenarioId].solution;
    if (!lessonSolution) {
      addTerminalLines(["No auto-apply solution is configured for this lab."]);
      saveSession();
      return;
    }

    if (lessonSolution.apply === "networkingControls" && runtime.networking) {
      runtime.networking.controls = runtime.networking.controls.map((control) => ({
        ...control,
        value: control.answer,
      }));
      runtime = runtime;
      checkNetworkingScenario();
      saveSession();
      return;
    }

    if (lessonSolution.apply === "prReview" && runtime.prReview) {
      runtime.prReview.decision = runtime.prReview.expectedDecision;
      runtime.prReview.findings = runtime.prReview.findings.map((finding) => ({
        ...finding,
        selected: finding.required,
      }));
      runtime = runtime;
      submitPrReview();
      saveSession();
      return;
    }

    const filePatches = { ...(lessonSolution.files ?? {}) };
    for (const replacement of lessonSolution.replacements ?? []) {
      const currentContent = filePatches[replacement.fileName] ?? runtime.files[replacement.fileName] ?? "";
      if (!currentContent.includes(replacement.search)) {
        if (currentContent.includes(replacement.replace)) continue;

        addTerminalLines([`Solution patch could not be applied to ${replacement.fileName}.`]);
        saveSession();
        return;
      }
      filePatches[replacement.fileName] = currentContent.replace(replacement.search, replacement.replace);
    }

    if (Object.keys(filePatches).length) {
      updateScenarioFiles(filePatches, lessonSolution.focusFileName);
    }

    const handlers = commandHandlers();
    const commandOutput = (lessonSolution.commands ?? []).flatMap((command) => [
      `$ ${command}`,
      ...dispatchSimulatorCommand(command, runtime, handlers),
    ]);
    if (commandOutput.length) addTerminalLines(commandOutput);

    celebrateIfScenarioCompleted();
    saveSession();
  }

  function commandHandlers(): CommandHandlers {
    return {
      secretsManagerDescribeSecret,
      secretsSsmGetParameter,
      dnsAcmDescribeCertificate,
      dnsDigApp,
      iamSimulatePrincipalPolicy,
      iamAssumeRoleWithWebIdentity,
      iamS3Cp,
      iamKmsDecrypt,
      azureRoleAssignmentList,
      organizationsDescribePolicy,
      githubRunView,
      githubRunRerun,
      githubSecretList,
      githubSecretSet,
      terragruntInit,
      terragruntValidate,
      terragruntPlan,
      terragruntRunAllPlan,
      terragruntHclfmt,
      terraformInit,
      terraformStateList,
      terraformValidate,
      terraformPlan,
      terraformApply,
      checkovScan,
      forceUnlock,
      terraformImport,
      terraformStateMv,
      scanLocks,
      awsS3Ls,
      cloudWatchDescribeAlarms,
      logsDescribeLogGroups,
      costAndUsage,
      ec2DescribeVolumes,
      kyvernoTest,
      kubectlDryRun,
      checkScenario,
    };
  }

  function terraformInit(): string[] {
    if (currentScenarioId === "terraformModuleWrongSource") {
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
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Root module source points at ./modules/network.";
      runtime = runtime;
      return ["Initializing modules...", "- network in ./modules/network", "Successfully configured the backend."];
    }

    runtime.flags.initialized = true;
    return [
      "Initializing the backend...",
      `Successfully configured backend s3://${runtime.backend.bucket}/${runtime.backend.key}`,
    ];
  }

  function terraformStateList(): string[] {
    if (!runtime.stateResources.length) return ["No resources currently tracked in state."];
    return runtime.stateResources.map((resource) => resource.address);
  }

  function awsS3Ls(): string[] {
    return runtime.awsResources
      .filter((resource) => resource.type === "s3_bucket")
      .map((resource) => `s3://${resource.name}`);
  }

  function cloudWatchDescribeAlarms(): string[] {
    if (currentScenarioId === "observabilityAlb5xxAlarmDimension") {
      if (observabilityFixApplied()) {
        markOperationalScenarioSolved("observabilityValidated", "ALB 5xx alarm uses the ApplicationELB namespace and LoadBalancer dimension.");
        return [
          "AlarmName: alb-5xx-prod",
          "Namespace: AWS/ApplicationELB",
          "MetricName: HTTPCode_ELB_5XX_Count",
          "Dimensions: LoadBalancer=app/prod-web/50dc6c495c0c9188",
          "StateValue: OK",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Alarm still uses the wrong namespace or missing LoadBalancer dimension.";
      runtime = runtime;
      return [
        "AlarmName: alb-5xx-prod",
        "Namespace: AWS/ELB",
        "MetricName: HTTPCode_ELB_5XX_Count",
        "Dimensions: LoadBalancerName=prod-web",
        "StateValue: INSUFFICIENT_DATA",
      ];
    }

    if (currentScenarioId === "observabilityAlarmAction") {
      if (observabilityFixApplied()) {
        markOperationalScenarioSolved("observabilityValidated", "Critical alarm notifies the on-call SNS topic for alarm and recovery states.");
        return [
          "AlarmName: api-latency-critical",
          "MetricName: TargetResponseTime",
          "AlarmActions: arn:aws:sns:eu-west-1:123456789012:oncall-critical",
          "OKActions: arn:aws:sns:eu-west-1:123456789012:oncall-critical",
          "StateValue: OK",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Critical alarm still has no notification actions.";
      runtime = runtime;
      return [
        "AlarmName: api-latency-critical",
        "MetricName: TargetResponseTime",
        "AlarmActions: []",
        "OKActions: []",
        "StateValue: ALARM",
        "Finding: no on-call topic is notified.",
      ];
    }

    return ["No CloudWatch alarm data for this scenario."];
  }

  function logsDescribeLogGroups(): string[] {
    if (currentScenarioId === "observabilityLogRetention") {
      if (observabilityFixApplied()) {
        markOperationalScenarioSolved("observabilityValidated", "Application log group retention is set to 30 days.");
        return [
          "logGroupName: /aws/ecs/payments-api",
          "retentionInDays: 30",
          "storedBytes: 1829342",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Application log group still has no retention policy.";
      runtime = runtime;
      return [
        "logGroupName: /aws/ecs/payments-api",
        "retentionInDays: Never expire",
        "storedBytes: 9182736455",
      ];
    }

    return ["No CloudWatch Logs data for this scenario."];
  }

  function costAndUsage(): string[] {
    if (currentScenarioId === "finopsNatGatewayCostSpike") {
      if (finopsFixApplied()) {
        markOperationalScenarioSolved("finopsValidated", "NAT gateway topology keeps high-availability egress while removing duplicate idle gateways.");
        return [
          "Service: Amazon Virtual Private Cloud",
          "UsageType: NatGateway-Hours",
          "MonthlyCost: 96.00 USD",
          "Finding: expected two production NAT gateways remain.",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Cost Explorer still shows extra idle NAT gateways.";
      runtime = runtime;
      return [
        "Service: Amazon Virtual Private Cloud",
        "UsageType: NatGateway-Hours",
        "MonthlyCost: 384.00 USD",
        "Finding: four NAT gateways are running, but only two AZs serve private workloads.",
      ];
    }

    if (currentScenarioId === "finopsS3Lifecycle") {
      if (finopsFixApplied()) {
        markOperationalScenarioSolved("finopsValidated", "S3 lifecycle transitions old logs and expires temporary exports.");
        return [
          "Service: Amazon Simple Storage Service",
          "UsageType: TimedStorage-ByteHrs",
          "Trend: decreasing",
          "Finding: lifecycle policy is active.",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "S3 storage cost is still growing without lifecycle controls.";
      runtime = runtime;
      return [
        "Service: Amazon Simple Storage Service",
        "UsageType: TimedStorage-ByteHrs",
        "Trend: increasing 38% month over month",
        "Finding: access logs and exports never transition or expire.",
      ];
    }

    return ["No Cost Explorer data for this scenario."];
  }

  function kyvernoTest(): string[] {
    if (currentScenarioId !== "policyKyvernoRequireAppLabel") {
      return ["No Kyverno test suite is configured for this scenario."];
    }

    if (policyFixApplied()) {
      markOperationalScenarioSolved("policyValidated", "Kyverno policy enforces the required app label on Pods.");
      return [
        "Executing kyverno test .",
        "app-label-policy",
        "  pass: pod-with-app-label accepted",
        "  pass: pod-missing-app-label rejected",
        "Test Summary: 2 passed, 0 failed",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Kyverno test still allows a Pod without the required app label.";
    runtime = runtime;
    return [
      "Executing kyverno test .",
      "app-label-policy",
      "  pass: pod-with-app-label accepted",
      "  fail: pod-missing-app-label was accepted",
      "Test Summary: 1 passed, 1 failed",
    ];
  }

  function kubectlDryRun(): string[] {
    if (!["policyKubernetesDefaultDenyIngress", "policyIstioDenyUnauthenticated", "policyCiliumAllowDnsEgress"].includes(currentScenarioId)) {
      return ["No Kubernetes server dry-run is configured for this scenario."];
    }

    if (policyFixApplied()) {
      markOperationalScenarioSolved("policyValidated", policySuccessNote());
      return [
        `${runtime.awsResources[0].id} configured (server dry run)`,
        policySuccessNote(),
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = policyFailureNote();
    runtime = runtime;
    return [`${runtime.awsResources[0].id} configured (server dry run)`, `warning: ${policyFailureNote()}`];
  }

  function policySuccessNote(): string {
    if (currentScenarioId === "policyKubernetesDefaultDenyIngress") return "Namespace default deny ingress policy is valid and ready to apply.";
    if (currentScenarioId === "policyIstioDenyUnauthenticated") return "Istio authorization policy allows only authenticated JWT callers to checkout-api.";
    if (currentScenarioId === "policyCiliumAllowDnsEgress") return "Cilium policy allows worker egress to kube-dns on UDP/53 only.";
    return "Policy-as-code validation passed.";
  }

  function policyFailureNote(): string {
    if (currentScenarioId === "policyKubernetesDefaultDenyIngress") return "NetworkPolicy still selects only labeled pods or keeps an ingress allow rule.";
    if (currentScenarioId === "policyIstioDenyUnauthenticated") return "Istio policy still allows unauthenticated callers or targets the wrong workload.";
    if (currentScenarioId === "policyCiliumAllowDnsEgress") return "Cilium policy still misses kube-dns endpoint selection or UDP/53 port scoping.";
    return "Policy-as-code guardrail is still misconfigured.";
  }

  function ec2DescribeVolumes(): string[] {
    if (currentScenarioId === "finopsUnattachedEbsCleanup" && finopsFixApplied()) {
      markOperationalScenarioSolved("finopsValidated", "Unattached EBS volume is snapshotted and removed after the retention window.");
      return ["Volumes: []", "No unattached candidate volumes remain in this lab."];
    }

    if (currentScenarioId !== "finopsUnattachedEbsCleanup") return ["No EC2 volume inventory for this scenario."];

    return [
      "VolumeId: vol-0abc123",
      "State: available",
      "Size: 500",
      "CreateTime: 2025-10-18T11:20:00Z",
      "Finding: unattached EBS volume is still accruing storage cost.",
    ];
  }

  function terraformPlan(): string[] {
    if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
    if (runtime.backend.locked) return lockError();

    if (currentScenarioId === "interruptedApplyLock") {
      if (!hasStateAddress("aws_s3_bucket.logs")) {
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

    if (currentScenarioId === "missingIamImport") {
      if (!hasStateAddress("aws_iam_role.app")) {
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

    if (currentScenarioId === "manualSecurityGroupDrift") {
      if (runtime.files["main.tf"].includes('cidr_blocks = ["0.0.0.0/0"]')) {
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "Code now accepts the manually changed ingress CIDR.";
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

    if (currentScenarioId === "terraformCheckovPublicS3") {
      if (!runtime.flags.securityPassed) {
        return [
          "Plan blocked by policy gate.",
          "Run checkov -f main.tf and fix the security finding before planning.",
        ];
      }
      runtime.flags.cleanPlan = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "S3 public access is blocked by configuration.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    if (currentScenarioId === "terraformValidateBadReference") {
      if (!runtime.flags.validationPassed) {
        return ["Error: validation failed. Run terraform validate and fix the invalid reference first."];
      }
      runtime.flags.cleanPlan = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Terraform configuration validates cleanly.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    if (currentScenarioId === "terraformModuleMissingOutput") {
      if (!runtime.flags.validationPassed) {
        return ["Error: module output is missing. Run terraform validate and expose bucket_name from the child module."];
      }
      runtime.flags.cleanPlan = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Child module exposes bucket_name and root module can consume it.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    if (currentScenarioId === "terraformModuleWrongSource") {
      if (!runtime.flags.validationPassed) {
        return ["Error: module source is invalid. Run terraform init after fixing source = \"./modules/network\"."];
      }
      runtime.flags.cleanPlan = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Network module source path is valid.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    if (currentScenarioId === "terraformModuleMissingVariable") {
      if (!runtime.flags.validationPassed) {
        return ["Error: missing required module argument. Run terraform validate and pass environment."];
      }
      runtime.flags.cleanPlan = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Queue module receives all required arguments.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    if (currentScenarioId === "terraformModuleSecurityGroup") {
      if (!runtime.flags.securityPassed) {
        return ["Plan blocked by policy gate. Run checkov -f main.tf and fix the module default ingress CIDR."];
      }
      runtime.flags.cleanPlan = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Security group module default ingress is restricted.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    if (runtime.kind === "awsconfig") {
      if (!runtime.flags.securityPassed) {
        return ["Plan blocked by AWS config review. Run checkov -f main.tf and fix the failed checks first."];
      }
      runtime.flags.cleanPlan = true;
      runtime.flags.configValidated = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "AWS service configuration meets the required guardrails.";
      runtime = runtime;
      return ["No changes. AWS configuration guardrails are satisfied."];
    }

    if (currentScenarioId === "terraformStateFolderMigration") {
      if (!hasStateAddress("module.logging.aws_s3_bucket.logs")) {
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
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "State address was moved to module.logging.aws_s3_bucket.logs.";
      return ["No changes. Infrastructure matches the configuration."];
    }

    return ["No changes. Infrastructure matches the configuration."];
  }

  function terraformValidate(): string[] {
    if (currentScenarioId === "terraformValidateBadReference") {
      if (runtime.files[activeFileName].includes("aws_s3_bucket.logs.bucket")) {
        runtime.flags.validationPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "output.bucket_name references aws_s3_bucket.logs.";
        runtime = runtime;
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

    if (currentScenarioId === "terraformModuleMissingOutput") {
      const moduleFile = runtime.files["modules/s3/main.tf"] ?? "";
      const hasOutput = moduleFile.includes('output "bucket_name"') && moduleFile.includes("aws_s3_bucket.this.bucket");

      if (hasOutput) {
        runtime.flags.validationPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "modules/s3 now exports bucket_name.";
        runtime = runtime;
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

    if (currentScenarioId === "terraformModuleMissingVariable") {
      const rootFile = runtime.files["main.tf"] ?? "";
      const passesEnvironment = rootFile.includes('environment = "dev"') || rootFile.includes("environment = var.environment");

      if (passesEnvironment) {
        runtime.flags.validationPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "Root module passes environment to modules/queue.";
        runtime = runtime;
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

    return ["Success! The configuration is valid."];
  }

  function checkovScan(): string[] {
    if (runtime.kind === "awsconfig") return awsConfigCheckovScan();

    if (currentScenarioId === "terraformCheckovPublicS3") {
      const hasPrivateAcl = runtime.files[activeFileName].includes('acl    = "private"') || runtime.files[activeFileName].includes('acl = "private"');
      const hasPublicAccessBlock = runtime.files[activeFileName].includes("aws_s3_bucket_public_access_block");

      if (hasPrivateAcl && hasPublicAccessBlock) {
        runtime.flags.securityPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "Checkov passed: bucket ACL is private and public access block exists.";
        runtime = runtime;
        return ["Check: CKV_AWS_20: PASSED", "Check: CKV_AWS_53: PASSED", "Passed checks: 2, Failed checks: 0"];
      }

      return [
        "Check: CKV_AWS_20: FAILED",
        "S3 Bucket has an ACL defined which allows public access.",
        "Check: CKV_AWS_53: FAILED",
        "S3 bucket should block public ACLs.",
      ];
    }

    if (currentScenarioId === "terraformModuleSecurityGroup") {
      const moduleFile = runtime.files["modules/security-group/main.tf"] ?? "";
      const restrictedDefault = moduleFile.includes('default = "10.0.0.0/16"') || moduleFile.includes('default = "172.16.0.0/12"');

      if (restrictedDefault) {
        runtime.flags.securityPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "Checkov passed: module ingress default is restricted.";
        runtime = runtime;
        return ["Check: CKV_AWS_260: PASSED", "Security group ingress is not open to 0.0.0.0/0.", "Passed checks: 1, Failed checks: 0"];
      }

      return [
        "Check: CKV_AWS_260: FAILED",
        "Security group ingress should not allow 0.0.0.0/0.",
        "Finding is in modules/security-group/main.tf.",
      ];
    }

    return ["Passed checks: 1, Failed checks: 0"];
  }

  function awsConfigCheckovScan(): string[] {
    const file = runtime.files["main.tf"] ?? "";

    if (currentScenarioId === "awsConfigS3Baseline") {
      const hasEncryption = file.includes("aws_s3_bucket_server_side_encryption_configuration");
      const hasVersioning = file.includes("aws_s3_bucket_versioning") && file.includes("status = \"Enabled\"");
      const hasPublicAccessBlock = file.includes("aws_s3_bucket_public_access_block");

      if (hasEncryption && hasVersioning && hasPublicAccessBlock) {
        markAwsConfigPassed("S3 bucket has encryption, versioning, and public access block.");
        return ["Check: CKV_AWS_19: PASSED", "Check: CKV_AWS_21: PASSED", "Check: CKV_AWS_53: PASSED", "Passed checks: 3, Failed checks: 0"];
      }

      return [
        hasEncryption ? "Check: CKV_AWS_19: PASSED" : "Check: CKV_AWS_19: FAILED - S3 bucket should have server-side encryption.",
        hasVersioning ? "Check: CKV_AWS_21: PASSED" : "Check: CKV_AWS_21: FAILED - S3 bucket should have versioning enabled.",
        hasPublicAccessBlock ? "Check: CKV_AWS_53: PASSED" : "Check: CKV_AWS_53: FAILED - S3 bucket should block public ACLs.",
      ];
    }

    if (currentScenarioId === "awsConfigRdsPublicBackup") {
      const privateDb = file.includes("publicly_accessible  = false") || file.includes("publicly_accessible = false");
      const hasBackups = !file.includes("backup_retention_period = 0") && /backup_retention_period\s*=\s*([1-9]|[1-2][0-9]|3[0-5])/.test(file);
      const hasDeletionProtection = file.includes("deletion_protection  = true") || file.includes("deletion_protection = true");
      const finalSnapshot = file.includes("skip_final_snapshot  = false") || file.includes("skip_final_snapshot = false");

      if (privateDb && hasBackups && hasDeletionProtection && finalSnapshot) {
        markAwsConfigPassed("RDS is private, backed up, deletion-protected, and keeps a final snapshot.");
        return ["Check: CKV_AWS_16: PASSED", "Check: CKV_AWS_133: PASSED", "Check: CKV_AWS_157: PASSED", "Passed checks: 3, Failed checks: 0"];
      }

      return [
        privateDb ? "Check: CKV_AWS_16: PASSED" : "Check: CKV_AWS_16: FAILED - RDS instance should not be publicly accessible.",
        hasBackups ? "Check: CKV_AWS_133: PASSED" : "Check: CKV_AWS_133: FAILED - RDS backup retention should be enabled.",
        hasDeletionProtection && finalSnapshot ? "Check: CKV_AWS_157: PASSED" : "Check: CKV_AWS_157: FAILED - RDS should use deletion protection and final snapshots.",
      ];
    }

    if (currentScenarioId === "awsConfigCloudWatchRetention") {
      const hasRetention = file.includes("retention_in_days = 30") || file.includes("retention_in_days  = 30");

      if (hasRetention) {
        markAwsConfigPassed("CloudWatch log group retention is set to 30 days.");
        return ["Check: CKV_AWS_338: PASSED", "Log group retention is configured.", "Passed checks: 1, Failed checks: 0"];
      }

      return ["Check: CKV_AWS_338: FAILED", "CloudWatch log group should define retention_in_days = 30."];
    }

    if (currentScenarioId === "awsConfigCloudTrailBaseline") {
      const multiRegion = file.includes("is_multi_region_trail         = true") || file.includes("is_multi_region_trail = true");
      const globalEvents = file.includes("include_global_service_events = true");
      const validation = file.includes("enable_log_file_validation    = true") || file.includes("enable_log_file_validation = true");

      if (multiRegion && globalEvents && validation) {
        markAwsConfigPassed("CloudTrail is multi-region, includes global service events, and validates log files.");
        return ["Check: CKV_AWS_67: PASSED", "Check: CKV_AWS_35: PASSED", "Passed checks: 2, Failed checks: 0"];
      }

      return [
        multiRegion && globalEvents ? "Check: CKV_AWS_67: PASSED" : "Check: CKV_AWS_67: FAILED - CloudTrail should be multi-region and include global service events.",
        validation ? "Check: CKV_AWS_35: PASSED" : "Check: CKV_AWS_35: FAILED - CloudTrail log file validation should be enabled.",
      ];
    }

    if (currentScenarioId === "awsConfigBlankS3SecureBucket") {
      const hasBucket = file.includes("aws_s3_bucket") && file.includes("secure_logs");
      const hasEncryption = file.includes("aws_s3_bucket_server_side_encryption_configuration");
      const hasVersioning = file.includes("aws_s3_bucket_versioning") && file.includes('status = "Enabled"');
      const hasPublicAccessBlock = file.includes("aws_s3_bucket_public_access_block");

      if (hasBucket && hasEncryption && hasVersioning && hasPublicAccessBlock) {
        markAwsConfigPassed("Blank S3 bucket configuration now includes encryption, versioning, and public access block.");
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

  function markAwsConfigPassed(note: string): void {
    runtime.flags.securityPassed = true;
    runtime.flags.configValidated = true;
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = note;
    runtime = runtime;
  }

  function terraformApply(): string[] {
    if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
    if (runtime.backend.locked) return lockError();

    if (currentScenarioId === "interruptedApplyLock" && !hasStateAddress("aws_s3_bucket.logs")) {
      return [
        "aws_s3_bucket.logs: Creating...",
        "Error: BucketAlreadyOwnedByYou: prod-logs-training already exists",
        "Import the existing bucket into state before applying.",
      ];
    }

    if (currentScenarioId === "missingIamImport" && !hasStateAddress("aws_iam_role.app")) {
      return [
        "aws_iam_role.app: Creating...",
        "Error: EntityAlreadyExists: Role with name training-app-role already exists.",
        "Import the role into state before applying.",
      ];
    }

    return terraformPlan();
  }

  function terraformImport(address?: string, id?: string): string[] {
    if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
    if (runtime.backend.locked) return lockError();
    if (!address || !id) return ["Usage: terraform import <address> <id>"];

    if (currentScenarioId === "interruptedApplyLock" && address === "aws_s3_bucket.logs" && id === "prod-logs-training") {
      addStateResource(address, id);
      runtime.flags.importedBucket = true;
      return [`Import successful: ${address} (${id})`];
    }

    if (currentScenarioId === "missingIamImport" && address === "aws_iam_role.app" && id === "training-app-role") {
      addStateResource(address, id);
      runtime.flags.importedRole = true;
      return [`Import successful: ${address} (${id})`];
    }

    return [`Import failed: no matching remote object for ${address} with id ${id}.`];
  }

  function terraformStateMv(source?: string, destination?: string): string[] {
    if (!runtime.flags.initialized) return ["Error: backend not initialized. Run terraform init first."];
    if (runtime.backend.locked) return lockError();
    if (!source || !destination) return ["Usage: terraform state mv <source> <destination>"];

    if (
      currentScenarioId === "terraformStateFolderMigration" &&
      source === "aws_s3_bucket.logs" &&
      destination === "module.logging.aws_s3_bucket.logs"
    ) {
      const stateResource = runtime.stateResources.find((resource) => resource.address === source);
      if (!stateResource) return [`State move failed: ${source} is not in state.`];

      stateResource.address = destination;
      runtime.flags.cleanPlan = false;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "State now tracks the bucket at the module address.";
      runtime = runtime;
      return [
        `Move "${source}" to "${destination}"`,
        "Successfully moved 1 object.",
      ];
    }

    return [`State move failed: no matching migration from ${source} to ${destination}.`];
  }

  function forceUnlock(lockId?: string): string[] {
    if (!runtime.backend.locked) return ["State is not locked."];
    if (!lockId) return [`Usage: terraform force-unlock ${runtime.backend.lockId}`];
    if (lockId !== runtime.backend.lockId) return [`Lock ID ${lockId} does not match the current lock.`];

    runtime = {
      ...runtime,
      backend: {
        ...runtime.backend,
        locked: false,
        lockId: null,
      },
    };
    return ["Terraform state has been successfully unlocked."];
  }

  function scanLocks(): string[] {
    if (!runtime.backend.locked) return ["Items: []"];
    return [
      "Items: [",
      `  { LockID: "${runtime.backend.lockId}", Path: "${runtime.backend.bucket}/${runtime.backend.key}" }`,
      "]",
    ];
  }

  function secretsManagerDescribeSecret(): string[] {
    if (currentScenarioId !== "secretsManagerRotationKms" && currentScenarioId !== "secretsManagerResourcePolicy") {
      return ["DescribeSecret is not the validation command for this lab."];
    }

    if (currentScenarioId === "secretsManagerResourcePolicy") {
      if (secretsFixApplied()) {
        markOperationalScenarioSolved("secretsValidated", "Secret resource policy blocks public access and trusts only the security audit role.");
        return [
          "Name: prod/payments/api-key",
          "BlockPublicPolicy: true",
          "Principal: arn:aws:iam::210987654321:role/security-audit",
          "Action: secretsmanager:GetSecretValue",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Secret resource policy still allows wildcard principal access or public policies.";
      runtime = runtime;
      return [
        "Name: prod/payments/api-key",
        "BlockPublicPolicy: false",
        "Finding: resource policy allows public or cross-account wildcard access.",
      ];
    }

    if (secretsFixApplied()) {
      markOperationalScenarioSolved("secretsValidated", "Secret uses customer managed KMS and 30 day rotation.");
      return [
        "Name: prod/db/password",
        "KmsKeyId: alias/prod-secrets-kms",
        "RotationEnabled: true",
        "RotationRules.AutomaticallyAfterDays: 30",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Secret rotation or KMS key is still outside policy.";
    runtime = runtime;
    return [
      "Name: prod/db/password",
      "KmsKeyId: alias/aws/secretsmanager",
      "RotationEnabled: false",
      "Finding: production database secret does not meet rotation and KMS requirements.",
    ];
  }

  function secretsSsmGetParameter(): string[] {
    if (currentScenarioId !== "secretsSsmEnvironmentPath") return ["GetParameter is not the validation command for this lab."];

    if (secretsFixApplied()) {
      markOperationalScenarioSolved("secretsValidated", "Staging service reads the staging SSM parameter with decryption.");
      return [
        "Name: /staging/checkout/db/password",
        "Type: SecureString",
        "WithDecryption: true",
        "Access path matches environment staging.",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Service still points at the wrong environment parameter.";
    runtime = runtime;
    return [
      "Name: /prod/checkout/db/password",
      "Type: SecureString",
      "Warning: staging workload is reading a production parameter path.",
    ];
  }

  function dnsAcmDescribeCertificate(): string[] {
    if (currentScenarioId !== "dnsAcmCloudFrontCertificate" && currentScenarioId !== "dnsAcmWildcardValidation") {
      return ["DescribeCertificate is not the validation command for this lab."];
    }

    if (currentScenarioId === "dnsAcmWildcardValidation") {
      if (dnsFixApplied()) {
        markOperationalScenarioSolved("dnsValidated", "Wildcard certificate is in us-east-1 with the public hosted-zone validation CNAME.");
        return [
          "DomainName: *.example.com",
          "Region: us-east-1",
          "Status: ISSUED",
          "Validation CNAME: _a1b2.example.com -> _c3d4.acm-validations.aws",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Wildcard certificate region or validation CNAME is still wrong.";
      runtime = runtime;
      return [
        "DomainName: *.example.com",
        "Region: eu-west-1",
        "Status: PENDING_VALIDATION",
        "Finding: wildcard certificate must be validated from us-east-1 in the public example.com hosted zone.",
      ];
    }

    if (dnsFixApplied()) {
      markOperationalScenarioSolved("dnsValidated", "CloudFront certificate is in us-east-1 and DNS validation is complete.");
      return [
        "DomainName: app.example.com",
        "Region: us-east-1",
        "Status: ISSUED",
        "Validation CNAME: _9f3b.app.example.com -> _7a1d.acm-validations.aws",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Certificate region or validation record is still wrong.";
    runtime = runtime;
    return [
      "DomainName: app.example.com",
      "Region: eu-west-1",
      "Status: PENDING_VALIDATION",
      "Finding: CloudFront viewer certificate must be issued in us-east-1 with the expected validation CNAME.",
    ];
  }

  function dnsDigApp(): string[] {
    if (currentScenarioId !== "dnsRoute53AlbAlias") return ["dig app.example.com is not the validation command for this lab."];

    if (dnsFixApplied()) {
      markOperationalScenarioSolved("dnsValidated", "Route 53 app record aliases to the current ALB target.");
      return [
        "app.example.com. 60 IN A ALIAS app-prod-456.eu-west-1.elb.amazonaws.com.",
        "alias hosted zone: Z32O12XQLNTSW2",
        "evaluate target health: true",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Record still resolves to the old load balancer or is not an alias A record.";
    runtime = runtime;
    return [
      "app.example.com. 300 IN CNAME old-alb-123.eu-west-1.elb.amazonaws.com.",
      "Finding: app hostname is still pointed at the old load balancer.",
    ];
  }

  function iamSimulatePrincipalPolicy(): string[] {
    if (runtime.kind === "scp") return scpSimulatePrincipalPolicy();

    if (currentScenarioId !== "iamS3PrefixLeastPrivilege" && currentScenarioId !== "iamDynamoDbLeadingKeys") {
      return ["Simulation skipped: this lab does not use this IAM policy simulation."];
    }

    if (currentScenarioId === "iamDynamoDbLeadingKeys") {
      if (iamFixApplied()) {
        markIamScenarioSolved("DynamoDB policy allows tenant-a item access only when dynamodb:LeadingKeys is tenant-a.");
        return [
          "EvalActionName: dynamodb:GetItem",
          "EvalResourceName: arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders",
          "EvalDecision: allowed",
          "Condition: dynamodb:LeadingKeys = tenant-a",
          "",
          "EvalActionName: dynamodb:GetItem",
          "ContextKeyName: dynamodb:LeadingKeys",
          "ContextKeyValue: tenant-b",
          "EvalDecision: implicitDeny",
        ];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "DynamoDB policy still lacks tenant-a LeadingKeys isolation.";
      runtime = runtime;
      return [
        "EvalActionName: dynamodb:GetItem",
        "EvalResourceName: arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders",
        "EvalDecision: allowed",
        "Finding: tenant-b partition keys are still reachable because dynamodb:LeadingKeys is missing.",
      ];
    }

    if (iamFixApplied()) {
      markIamScenarioSolved("S3 policy allows only the team-a prefix with separate bucket and object permissions.");
      return [
        "EvalActionName: s3:ListBucket",
        "EvalResourceName: arn:aws:s3:::company-artifacts",
        "EvalDecision: allowed",
        "Condition: s3:prefix = team-a/*",
        "",
        "EvalActionName: s3:GetObject",
        "EvalResourceName: arn:aws:s3:::company-artifacts/team-a/release.zip",
        "EvalDecision: allowed",
        "",
        "EvalActionName: s3:GetObject",
        "EvalResourceName: arn:aws:s3:::company-artifacts/team-b/release.zip",
        "EvalDecision: implicitDeny",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "S3 policy still grants broad access or misses the prefix-scoped ListBucket pattern.";
    runtime = runtime;
    return [
      "EvalActionName: s3:DeleteBucket",
      "EvalResourceName: arn:aws:s3:::company-artifacts",
      "EvalDecision: allowed",
      "Finding: policy is broader than the team-a deployment requirement.",
    ];
  }

  function organizationsDescribePolicy(): string[] {
    if (runtime.kind !== "scp") return ["DescribePolicy is not the inspection command for this lab."];
    const policyName = runtime.awsResources[0]?.name ?? "organization-scp";
    const state = scpFixApplied() ? "valid" : "finding";
    const note = scpFixApplied()
      ? "SCP guardrail matches the organization requirement."
      : runtime.awsResources[0]?.note ?? "SCP still does not match the organization requirement.";

    return [
      `PolicyName: ${policyName}`,
      "Type: SERVICE_CONTROL_POLICY",
      `ValidationState: ${state}`,
      `Finding: ${note}`,
    ];
  }

  function scpSimulatePrincipalPolicy(): string[] {
    if (scpFixApplied()) {
      runtime.flags.scpValidated = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = scpSuccessNote();
      runtime = runtime;
      return scpSimulationSuccess();
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = scpFailureNote();
    runtime = runtime;
    return scpSimulationFailure();
  }

  function iamAssumeRoleWithWebIdentity(): string[] {
    if (currentScenarioId !== "iamGithubOidcEnvironmentTrust") {
      return ["AssumeRoleWithWebIdentity skipped: this lab does not use GitHub OIDC trust simulation."];
    }

    if (iamFixApplied()) {
      markIamScenarioSolved("Trust policy only accepts the production GitHub environment subject.");
      return [
        "Token issuer: token.actions.githubusercontent.com",
        "aud: sts.amazonaws.com",
        "sub: repo:acme/platform:environment:production",
        "AssumeRoleWithWebIdentity: allowed",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "OIDC trust still accepts a wildcard subject or misses the production environment subject.";
    runtime = runtime;
    return [
      "Token issuer: token.actions.githubusercontent.com",
      "aud: sts.amazonaws.com",
      "sub: repo:acme/platform:environment:production",
      "AssumeRoleWithWebIdentity: denied by review policy",
      "Finding: trust condition is not constrained to the production environment.",
    ];
  }

  function iamS3Cp(): string[] {
    if (currentScenarioId !== "iamS3PrefixLeastPrivilege") {
      return ["aws s3 cp is not the validation command for this lab."];
    }
    return iamFixApplied()
      ? ["upload: ./release.zip to s3://company-artifacts/team-a/release.zip", "Access to s3://company-artifacts/team-b/release.zip remains denied."]
      : ["upload: ./release.zip to s3://company-artifacts/team-a/release.zip", "Warning: current policy also allows access outside team-a/."];
  }

  function iamKmsDecrypt(): string[] {
    if (currentScenarioId !== "iamKmsEncryptionContext") {
      return ["aws kms decrypt is not the validation command for this lab."];
    }

    if (iamFixApplied()) {
      markIamScenarioSolved("KMS decrypt is scoped to the payroll key and payroll encryption context.");
      return [
        "Decrypt with EncryptionContext App=payroll: allowed",
        "Decrypt without EncryptionContext App=payroll: implicitDeny",
        "kms:ScheduleKeyDeletion: implicitDeny",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "KMS policy still allows broad decrypt or misses the payroll encryption context.";
    runtime = runtime;
    return [
      "Decrypt with EncryptionContext App=payroll: allowed",
      "Decrypt without EncryptionContext App=payroll: allowed",
      "Finding: decrypt is not constrained by encryption context.",
    ];
  }

  function azureRoleAssignmentList(): string[] {
    if (currentScenarioId !== "iamAzureBlobReaderScope") {
      return ["az role assignment list is not the validation command for this lab."];
    }

    if (iamFixApplied()) {
      markIamScenarioSolved("Azure RBAC grants Storage Blob Data Reader only at the reports container scope.");
      return [
        "principalName: reporting-api",
        "roleDefinitionName: Storage Blob Data Reader",
        "scope: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-prod-data/providers/Microsoft.Storage/storageAccounts/proddata/blobServices/default/containers/reports",
        "canRead: reports",
        "canWrite: denied",
      ];
    }

    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Azure role assignment is still too broad or grants write/admin access.";
    runtime = runtime;
    return [
      "principalName: reporting-api",
      "roleDefinitionName: Owner",
      "scope: /subscriptions/00000000-0000-0000-0000-000000000000",
      "Finding: subscription Owner is broader than read-only access to the reports container.",
    ];
  }

  function markIamScenarioSolved(note: string): void {
    runtime.flags.iamValidated = true;
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = note;
    runtime = runtime;
  }

  function terragruntInit(): string[] {
    if (currentScenarioId === "terragruntWrongSourceRef") {
      const stackFile = runtime.files["live/dev/app/terragrunt.hcl"] ?? "";
      const hasCorrectSource = stackFile.includes('source = "../../../modules/app"');

      if (!hasCorrectSource) {
        runtime.awsResources[0].status = "failed";
        runtime.awsResources[0].note = "Terragrunt tried to use ../../../module/app, which does not exist.";
        runtime = runtime;
        return [
          "Initializing Terragrunt stack live/dev/app...",
          "Downloading Terraform configurations from ../../../module/app",
          "Error: Unreadable module directory",
          "lstat ../../../module/app: no such file or directory",
        ];
      }
    }

    runtime.flags.initialized = true;
    if (currentScenarioId === "terragruntWrongSourceRef") runtime.flags.validationPassed = true;
    runtime.awsResources[0].status = runtime.flags.validationPassed ? "exists" : runtime.awsResources[0].status;
    runtime = runtime;
    return [
      "Initializing Terragrunt stack...",
      `Remote state: s3://${runtime.backend.bucket}/${runtime.backend.key}`,
      "Terraform has been successfully initialized by Terragrunt.",
    ];
  }

  function terragruntValidate(): string[] {
    if (currentScenarioId === "terragruntMissingInclude") {
      const stackFile = runtime.files["live/dev/app/terragrunt.hcl"] ?? "";
      const hasInclude = stackFile.includes('include "root"') && stackFile.includes("find_in_parent_folders()");

      if (hasInclude) {
        runtime.flags.validationPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "App stack inherits root remote_state and shared inputs.";
        runtime = runtime;
        return ["Success! Terragrunt configuration is valid."];
      }

      return [
        "Error: Missing required variable",
        "The root input environment was not inherited by live/dev/app.",
        "Add include \"root\" { path = find_in_parent_folders() } to the child terragrunt.hcl.",
      ];
    }

    if (currentScenarioId === "terragruntBadDependencyOutput") {
      const networkFile = runtime.files["live/dev/network/terragrunt.hcl"] ?? "";
      const hasVpcIdOutput = networkFile.includes("vpc_id") && !networkFile.includes("vpcID");

      if (hasVpcIdOutput) {
        runtime.flags.validationPassed = true;
        runtime.awsResources[0].status = "exists";
        runtime.awsResources[0].note = "Dependency mock_outputs now expose vpc_id.";
        runtime = runtime;
        return ["Success! Terragrunt dependencies are valid."];
      }

      return [
        "Error: Unsupported attribute",
        "dependency.network.outputs does not have an attribute named vpc_id.",
        "The network mock_outputs block currently exposes vpcID.",
      ];
    }

    if (currentScenarioId === "terragruntHclfmt") {
      if (!runtime.flags.lintPassed) return ["Error: terragrunt.hcl files are not formatted. Run terragrunt hclfmt first."];
      runtime.flags.validationPassed = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = "Terragrunt HCL is formatted and validates.";
      runtime = runtime;
      return ["Success! Terragrunt configuration is valid."];
    }

    runtime.flags.validationPassed = true;
    runtime = runtime;
    return ["Success! Terragrunt configuration is valid."];
  }

  function terragruntPlan(): string[] {
    if (!runtime.flags.initialized) return ["Error: Terragrunt stack is not initialized. Run terragrunt init first."];
    if (!runtime.flags.validationPassed) return ["Error: Terragrunt validation failed. Run terragrunt validate and fix the configuration first."];
    if (currentScenarioId === "terragruntHclfmt" && !runtime.flags.lintPassed) return ["Plan blocked: terragrunt hclfmt is still failing."];

    runtime.flags.cleanPlan = true;
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = terragruntSuccessNote();
    runtime = runtime;
    return [
      "Terragrunt will run terraform plan in the selected stack.",
      "",
      "No changes. Infrastructure matches the configuration.",
    ];
  }

  function terragruntRunAllPlan(): string[] {
    if (!runtime.flags.initialized) runtime.flags.initialized = true;

    if (currentScenarioId === "terragruntBadDependencyOutput" && !runtime.flags.validationPassed) {
      return [
        "Running plan in dependency order:",
        "- live/dev/network",
        "- live/dev/app",
        "",
        "Error: Unsupported attribute",
        "dependency.network.outputs.vpc_id is not available.",
      ];
    }

    return terragruntPlan();
  }

  function terragruntHclfmt(): string[] {
    if (currentScenarioId !== "terragruntHclfmt") return ["All Terragrunt files are already formatted."];

    const stackFile = runtime.files["live/dev/app/terragrunt.hcl"] ?? "";
    const formatted =
      stackFile.includes('include "root" {\n') &&
      stackFile.includes('terraform {\n') &&
      stackFile.includes("inputs = {\n") &&
      !stackFile.includes("{ path =") &&
      !stackFile.includes('terraform { source =');

    if (!formatted) {
      return [
        "live/dev/app/terragrunt.hcl",
        "terragrunt hclfmt found formatting changes.",
        "Rewrite the one-line blocks as normal multi-line HCL blocks.",
      ];
    }

    runtime.flags.lintPassed = true;
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = "terragrunt hclfmt passed.";
    runtime = runtime;
    return ["All Terragrunt files are formatted correctly."];
  }

  function terragruntSuccessNote(): string {
    if (currentScenarioId === "terragruntMissingInclude") return "Stack inherits root remote state and shared inputs.";
    if (currentScenarioId === "terragruntBadDependencyOutput") return "App stack can read dependency.network.outputs.vpc_id.";
    if (currentScenarioId === "terragruntWrongSourceRef") return "Stack source points at ../../../modules/app.";
    if (currentScenarioId === "terragruntHclfmt") return "Formatting gate passed before planning.";
    return "Terragrunt stack is healthy.";
  }

  function checkScenario(): string[] {
    if (isSolved()) return ["Scenario complete."];

    if (runtime.kind === "cicd") {
      if (currentScenarioId === "githubActionsMissingSecret" && !runtime.flags.secretsConfigured) {
        return ["Not complete: AWS_ROLE_ARN is still missing from repository secrets."];
      }
      if (currentScenarioId === "githubActionsWrongWorkingDirectory" && !runtime.flags.workflowFixed) {
        return ["Not complete: the workflow still needs the correct working-directory."];
      }
      if (currentScenarioId === "githubActionsAwsOidcTrust" && !runtime.flags.workflowFixed) {
        return ["Not complete: the AWS OIDC trust policy still allows the wrong branch subject."];
      }
      if (currentScenarioId === "githubActionsCheckovGate" && !runtime.flags.securityPassed) {
        return ["Not complete: Checkov is still failing."];
      }
      if (currentScenarioId === "githubActionsOverbroadPermissions" && !runtime.flags.lintPassed) {
        return ["Not complete: actionlint is still failing on workflow permissions."];
      }
      if (["githubActionsNodeCachePath", "githubActionsDockerRegistryAuth", "githubActionsEnvironmentApproval", "githubActionsMatrixNodeVersion"].includes(currentScenarioId) && !runtime.flags.workflowFixed) {
        return [`Not complete: ${workflowFailedStep()} is still failing.`];
      }
      return ["Not complete: re-run the workflow and inspect the result."];
    }

    if (runtime.kind === "iam") {
      if (!iamFixApplied()) return ["Not complete: IAM policy or trust conditions are still too broad or missing required constraints."];
      markIamScenarioSolved("IAM validation passed for the requested access path.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "scp") {
      if (!scpFixApplied()) return ["Not complete: SCP still blocks or permits the wrong organization-level action."];
      runtime.flags.scpValidated = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = scpSuccessNote();
      runtime = runtime;
      return ["Scenario complete."];
    }

    if (runtime.kind === "secrets") {
      if (!secretsFixApplied()) return ["Not complete: secret configuration still misses the required path, KMS, rotation, or decryption setting."];
      markOperationalScenarioSolved("secretsValidated", "Secrets management validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "dns") {
      if (!dnsFixApplied()) return ["Not complete: DNS/TLS configuration still has an invalid record, alias target, certificate region, or validation value."];
      markOperationalScenarioSolved("dnsValidated", "DNS/TLS validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "observability") {
      if (!observabilityFixApplied()) return ["Not complete: observability configuration still has a missing retention policy or incorrect alarm signal."];
      markOperationalScenarioSolved("observabilityValidated", "Observability validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "finops") {
      if (!finopsFixApplied()) return ["Not complete: cost optimization configuration still misses the required cost control."];
      markOperationalScenarioSolved("finopsValidated", "FinOps validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "policy") {
      if (!policyFixApplied()) return ["Not complete: policy-as-code guardrail still does not enforce the required workload behavior."];
      markOperationalScenarioSolved("policyValidated", "Policy-as-code validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "awsconfig") {
      if (!runtime.flags.securityPassed) return ["Not complete: Checkov is still finding AWS service misconfigurations."];
      if (!runtime.flags.cleanPlan) return ["Not complete: run terraform plan after the config review passes."];
      runtime.flags.configValidated = true;
      runtime = runtime;
      return ["Scenario complete."];
    }

    if (runtime.kind === "pr") {
      if (!runtime.prReview?.decision || runtime.prReview.decision === "pending") return ["Not complete: submit a PR review decision."];
      if (!prReviewIsCorrect()) return ["Not complete: review decision or selected findings do not match the PR risk."];
      runtime.flags.reviewPassed = true;
      runtime.awsResources[0].status = "success";
      runtime.awsResources[0].note = "PR review blocks the risky change with the right findings.";
      runtime = runtime;
      return ["Scenario complete."];
    }

    if (runtime.kind === "terragrunt") {
      if (!runtime.flags.initialized) return ["Not complete: Terragrunt has not initialized the stack."];
      if (currentScenarioId === "terragruntHclfmt" && !runtime.flags.lintPassed) return ["Not complete: terragrunt hclfmt is still failing."];
      if (!runtime.flags.validationPassed) return ["Not complete: run terragrunt validate until it succeeds."];
      if (!runtime.flags.cleanPlan) return ["Not complete: run terragrunt plan until it returns no changes."];
      return ["Not complete: inspect the stack and dependency state."];
    }

    if (runtime.backend.locked) return ["Not complete: state is still locked."];
    if (!runtime.flags.initialized) return ["Not complete: Terraform has not been initialized."];
    if (!runtime.flags.cleanPlan) return ["Not complete: run terraform plan until it returns no changes."];
    return ["Not complete: inspect the plan and resource state."];
  }

  function githubRunView(): string[] {
    if (currentScenarioId === "githubActionsMissingSecret") {
      if (runtime.flags.runPassing) {
        return [
          "workflow: deploy",
          "status: success",
          "deploy: completed after configure-aws-credentials received AWS_ROLE_ARN.",
        ];
      }

      return [
        "workflow: deploy",
        "status: failure",
        "failed step: aws-actions/configure-aws-credentials@v4",
        "error: The security token included in the request is invalid or role-to-assume is empty.",
        "hint: secrets.AWS_ROLE_ARN is not available to this workflow.",
      ];
    }

    if (currentScenarioId === "githubActionsWrongWorkingDirectory") {
      if (runtime.flags.runPassing) {
        return [
          "workflow: terraform-check",
          "status: success",
          "terraform fmt, init, and validate completed from infra/dev.",
        ];
      }

      return [
        "workflow: terraform-check",
        "status: failure",
        "failed step: terraform fmt -check",
        "error: chdir infra/prod: no such file or directory",
      ];
    }

    if (currentScenarioId === "githubActionsAwsOidcTrust") {
      if (runtime.flags.runPassing) {
        return [
          "workflow: deploy-oidc",
          "status: success",
          "AssumeRoleWithWebIdentity succeeded for refs/heads/main.",
        ];
      }

      return [
        "workflow: deploy-oidc",
        "status: failure",
        "failed step: aws-actions/configure-aws-credentials@v4",
        "error: Not authorized to perform sts:AssumeRoleWithWebIdentity",
        "hint: trust policy subject allows refs/heads/master, but this run is refs/heads/main.",
      ];
    }

    if (currentScenarioId === "githubActionsCheckovGate") {
      if (runtime.flags.runPassing) {
        return [
          "workflow: iac-security",
          "status: success",
          "checkov -f main.tf completed with no failed checks.",
        ];
      }

      return [
        "workflow: iac-security",
        "status: failure",
        "failed step: checkov -f main.tf",
        "CKV_AWS_20: S3 Bucket has an ACL defined which allows public access.",
      ];
    }

    if (currentScenarioId === "githubActionsOverbroadPermissions") {
      if (runtime.flags.runPassing) {
        return [
          "workflow: deploy-permissions",
          "status: success",
          "actionlint passed: permissions are scoped to id-token: write and contents: read.",
        ];
      }

      return [
        "workflow: deploy-permissions",
        "status: failure",
        "failed step: actionlint",
        "permissions: write-all is not allowed by repository policy.",
      ];
    }

    if (isGenericGithubActionsScenario()) {
      if (runtime.flags.runPassing) {
        return [
          `workflow: ${workflowResource.name}`,
          "status: success",
          `${workflowJob()} completed successfully.`,
        ];
      }

      return [
        `workflow: ${workflowResource.name}`,
        "status: failure",
        `failed step: ${workflowFailedStep()}`,
        workflowFailureSummary(),
      ];
    }

    return ["No GitHub Actions run data for this scenario."];
  }

  function githubRunRerun(): string[] {
    if (currentScenarioId === "githubActionsMissingSecret") {
      if (!runtime.flags.secretsConfigured) {
        runtime.awsResources[0].status = "failed";
        runtime.awsResources[0].note = "AWS_ROLE_ARN is still missing from repository secrets.";
        runtime = runtime;
        return ["Re-running workflow deploy...", "Run failed: missing repository secret AWS_ROLE_ARN."];
      }

      runtime.flags.runPassing = true;
      runtime.awsResources[0].status = "success";
      runtime.awsResources[0].note = "Workflow completed after AWS_ROLE_ARN was configured.";
      runtime = runtime;
      return ["Re-running workflow deploy...", "Run succeeded."];
    }

    if (currentScenarioId === "githubActionsWrongWorkingDirectory") {
      if (!runtime.files[activeFileName].includes("working-directory: infra/dev")) {
        runtime.awsResources[0].status = "failed";
        runtime.awsResources[0].note = "Workflow still points at infra/prod.";
        runtime = runtime;
        return ["Re-running workflow terraform-check...", "Run failed: infra/prod does not exist."];
      }

      runtime.flags.workflowFixed = true;
      runtime.flags.runPassing = true;
      runtime.awsResources[0].status = "success";
      runtime.awsResources[0].note = "Workflow validates Terraform from infra/dev.";
      runtime = runtime;
      return ["Re-running workflow terraform-check...", "Run succeeded."];
    }

    if (currentScenarioId === "githubActionsAwsOidcTrust") {
      const trustPolicy = runtime.files["trust-policy.json"] ?? "";
      const workflow = runtime.files[".github/workflows/deploy-oidc.yml"] ?? "";
      const trustAllowsMain = trustPolicy.includes("repo:acme/platform:ref:refs/heads/main");
      const hasOidcPermission = workflow.includes("id-token: write");

      if (trustAllowsMain && hasOidcPermission) {
        runtime.flags.workflowFixed = true;
        runtime.flags.runPassing = true;
        runtime.awsResources[0].status = "success";
        runtime.awsResources[0].note = "OIDC trust subject now matches refs/heads/main.";
        runtime.stateResources = runtime.stateResources.map((resource) =>
          resource.address === "policy.aws-role-trust" ? { ...resource, id: "refs/heads/main" } : resource,
        );
        runtime = runtime;
        return ["Re-running workflow deploy-oidc...", "Run succeeded."];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "OIDC trust policy still does not match the workflow branch or id-token permission is missing.";
      runtime = runtime;
      return ["Re-running workflow deploy-oidc...", "Run failed: AssumeRoleWithWebIdentity is not authorized."];
    }

    if (currentScenarioId === "githubActionsCheckovGate") {
      if (runtime.files[activeFileName].includes('acl    = "private"') || runtime.files[activeFileName].includes('acl = "private"')) {
        runtime.flags.securityPassed = true;
        runtime.flags.runPassing = true;
        runtime.awsResources[0].status = "success";
        runtime.awsResources[0].note = "Checkov passed after public ACL was removed.";
        runtime = runtime;
        return ["Re-running workflow iac-security...", "Run succeeded."];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Checkov still detects public-read ACL.";
      runtime = runtime;
      return ["Re-running workflow iac-security...", "Run failed: CKV_AWS_20 public ACL finding."];
    }

    if (currentScenarioId === "githubActionsOverbroadPermissions") {
      const permissionsScoped = runtime.files[activeFileName].includes("id-token: write") && runtime.files[activeFileName].includes("contents: read") && !runtime.files[activeFileName].includes("write-all");

      if (permissionsScoped) {
        runtime.flags.lintPassed = true;
        runtime.flags.runPassing = true;
        runtime.awsResources[0].status = "success";
        runtime.awsResources[0].note = "actionlint passed with scoped workflow permissions.";
        runtime = runtime;
        return ["Re-running workflow deploy-permissions...", "Run succeeded."];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "permissions write-all is still present or scoped permissions are missing.";
      runtime = runtime;
      return ["Re-running workflow deploy-permissions...", "Run failed: overbroad permissions."];
    }

    if (isGenericGithubActionsScenario()) {
      if (genericGithubActionsFixApplied()) {
        runtime.flags.workflowFixed = true;
        runtime.flags.runPassing = true;
        runtime.awsResources[0].status = "success";
        runtime.awsResources[0].note = genericGithubActionsSuccessNote();
        runtime = runtime;
        return [`Re-running workflow ${workflowResource.name}...`, "Run succeeded."];
      }

      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = genericGithubActionsFailureNote();
      runtime = runtime;
      return [`Re-running workflow ${workflowResource.name}...`, `Run failed: ${workflowFailureSummary()}`];
    }

    return ["No workflow is configured for this scenario."];
  }

  function githubSecretList(): string[] {
    const secrets = runtime.stateResources
      .filter((resource) => resource.address.startsWith("secret."))
      .map((resource) => resource.address.replace("secret.", ""));

    if (!secrets.length) return ["No repository secrets configured."];
    return secrets;
  }

  function githubSecretSet(name?: string): string[] {
    if (!name) return ["Usage: gh secret set <name>"];
    if (name !== "AWS_ROLE_ARN") return [`Secret ${name} saved, but this scenario needs AWS_ROLE_ARN.`];
    if (!runtime.stateResources.some((resource) => resource.address === "secret.AWS_ROLE_ARN")) {
      runtime.stateResources = [...runtime.stateResources, { address: "secret.AWS_ROLE_ARN", id: "arn:aws:iam::123456789012:role/github-actions-deploy" }];
    }
    runtime.flags.secretsConfigured = true;
    runtime = runtime;
    return ["Secret AWS_ROLE_ARN saved."];
  }

  function evaluateWinCondition(): void {
    if (isSolved()) return;
    if (runtime.flags.cleanPlan && !runtime.backend.locked) {
      if (currentScenarioId === "interruptedApplyLock" && runtime.flags.importedBucket) return;
      if (currentScenarioId === "missingIamImport" && runtime.flags.importedRole) return;
      if (currentScenarioId === "manualSecurityGroupDrift") return;
    }
  }

  function celebrateIfScenarioCompleted(): void {
    const solved = isSolved();
    if (solved && !completedScenarioIds.includes(currentScenarioId) && !manuallyUncheckedScenarioIds.includes(currentScenarioId)) {
      completedScenarioIds = [...completedScenarioIds, currentScenarioId];
    }
    if (solved && !wasSolved) {
      completionModalScenarioId = currentScenarioId;
      activeLabModal = "completion";
      launchConfetti();
    }
    wasSolved = solved;
  }

  function launchConfetti(): void {
    if (confettiTimeout) window.clearTimeout(confettiTimeout);

    confettiPieces = Array.from({ length: 90 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 100,
      delay: Math.random() * 0.45,
      duration: 4.6 + Math.random() * 2.1,
      size: 6 + Math.random() * 7,
      color: confettiColors[index % confettiColors.length],
      rotation: Math.random() * 360,
      drift: -90 + Math.random() * 180,
    }));

    confettiTimeout = window.setTimeout(() => {
      confettiPieces = [];
    }, 7200);
  }

  function isSolved(): boolean {
    if (runtime.kind === "iam") return Boolean(runtime.flags.iamValidated);
    if (runtime.kind === "scp") return Boolean(runtime.flags.scpValidated);
    if (runtime.kind === "pr") return Boolean(runtime.flags.reviewPassed);
    if (runtime.kind === "secrets") return Boolean(runtime.flags.secretsValidated);
    if (runtime.kind === "dns") return Boolean(runtime.flags.dnsValidated);
    if (runtime.kind === "observability") return Boolean(runtime.flags.observabilityValidated);
    if (runtime.kind === "finops") return Boolean(runtime.flags.finopsValidated);
    if (runtime.kind === "policy") return Boolean(runtime.flags.policyValidated);
    if (runtime.kind === "awsconfig") return Boolean(runtime.flags.configValidated && runtime.flags.cleanPlan);
    if (currentScenarioId === "githubActionsMissingSecret") return Boolean(runtime.flags.secretsConfigured && runtime.flags.runPassing);
    if (currentScenarioId === "githubActionsWrongWorkingDirectory") return Boolean(runtime.flags.workflowFixed && runtime.flags.runPassing);
    if (currentScenarioId === "githubActionsAwsOidcTrust") return Boolean(runtime.flags.workflowFixed && runtime.flags.runPassing);
    if (currentScenarioId === "githubActionsCheckovGate") return Boolean(runtime.flags.securityPassed && runtime.flags.runPassing);
    if (currentScenarioId === "githubActionsOverbroadPermissions") return Boolean(runtime.flags.lintPassed && runtime.flags.runPassing);
    if (["githubActionsNodeCachePath", "githubActionsDockerRegistryAuth", "githubActionsEnvironmentApproval", "githubActionsMatrixNodeVersion"].includes(currentScenarioId)) {
      return Boolean(runtime.flags.workflowFixed && runtime.flags.runPassing);
    }
    if (currentScenarioId === "terraformCheckovPublicS3") return Boolean(runtime.flags.securityPassed && runtime.flags.cleanPlan);
    if (currentScenarioId === "terraformValidateBadReference") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
    if (currentScenarioId === "terraformModuleMissingOutput") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
    if (currentScenarioId === "terraformModuleWrongSource") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
    if (currentScenarioId === "terraformModuleMissingVariable") return Boolean(runtime.flags.validationPassed && runtime.flags.cleanPlan);
    if (currentScenarioId === "terraformModuleSecurityGroup") return Boolean(runtime.flags.securityPassed && runtime.flags.cleanPlan);
    if (currentScenarioId === "terraformStateFolderMigration") return Boolean(hasStateAddress("module.logging.aws_s3_bucket.logs") && runtime.flags.cleanPlan);
    if (runtime.kind === "terragrunt") {
      if (currentScenarioId === "terragruntHclfmt") return Boolean(runtime.flags.initialized && runtime.flags.lintPassed && runtime.flags.validationPassed && runtime.flags.cleanPlan);
      return Boolean(runtime.flags.initialized && runtime.flags.validationPassed && runtime.flags.cleanPlan);
    }
    if (runtime.kind === "networking") return Boolean(runtime.flags.networkConfigured);
    if (runtime.backend.locked || !runtime.flags.initialized || !runtime.flags.cleanPlan) return false;
    if (currentScenarioId === "interruptedApplyLock") return Boolean(runtime.flags.importedBucket);
    if (currentScenarioId === "missingIamImport") return Boolean(runtime.flags.importedRole);
    if (currentScenarioId === "manualSecurityGroupDrift") {
      return runtime.files[activeFileName].includes('cidr_blocks = ["0.0.0.0/0"]');
    }
    return false;
  }

  function solutionSummary(): string {
    return currentSolution().summary ?? "";
  }

  function solutionSteps(): string[] {
    return currentSolution().steps ?? [];
  }

  function solutionCommands(): string[] {
    return currentSolution().commands ?? [];
  }

  function completionExplanation(): string {
    return currentSolution().explanation ?? "";
  }

  function completionExplanationParagraphs(): string[] {
    return completionExplanation()
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  function completionOutcome(): string {
    return currentSolution().outcome ?? "";
  }

  function currentSolution(): NonNullable<Scenario["solution"]> {
    const solution = scenarios[currentScenarioId].solution;
    if (!solution) throw new Error(`Scenario ${currentScenarioId} is missing solution metadata.`);
    return solution;
  }

  function iamFixApplied(): boolean {
    if (currentScenarioId === "iamS3PrefixLeastPrivilege") {
      const policy = runtime.files["policy.json"] ?? "";
      return (
        policy.includes("s3:ListBucket") &&
        policy.includes("s3:GetObject") &&
        policy.includes("s3:PutObject") &&
        policy.includes("arn:aws:s3:::company-artifacts") &&
        policy.includes("arn:aws:s3:::company-artifacts/team-a/*") &&
        policy.includes("s3:prefix") &&
        policy.includes("team-a/*") &&
        !policy.includes('"s3:*"') &&
        !policy.includes('"Resource": "*"')
      );
    }

    if (currentScenarioId === "iamGithubOidcEnvironmentTrust") {
      const trustPolicy = runtime.files["trust-policy.json"] ?? "";
      return (
        trustPolicy.includes("token.actions.githubusercontent.com:aud") &&
        trustPolicy.includes("sts.amazonaws.com") &&
        trustPolicy.includes("repo:acme/platform:environment:production") &&
        !trustPolicy.includes("repo:acme/platform:*") &&
        !trustPolicy.includes("refs/heads/*")
      );
    }

    if (currentScenarioId === "iamKmsEncryptionContext") {
      const policy = runtime.files["kms-policy.json"] ?? "";
      return (
        policy.includes("kms:Decrypt") &&
        policy.includes("arn:aws:kms:eu-west-1:123456789012:key/payroll-key") &&
        policy.includes("kms:EncryptionContext:App") &&
        policy.includes("payroll") &&
        !policy.includes('"kms:*"') &&
        !policy.includes('"Resource": "*"')
      );
    }

    if (currentScenarioId === "iamDynamoDbLeadingKeys") {
      const policy = runtime.files["policy.json"] ?? "";
      return (
        policy.includes("dynamodb:GetItem") &&
        policy.includes("dynamodb:PutItem") &&
        policy.includes("arn:aws:dynamodb:eu-west-1:123456789012:table/shared-orders") &&
        policy.includes("dynamodb:LeadingKeys") &&
        policy.includes("tenant-a") &&
        !policy.includes('"dynamodb:*"') &&
        !policy.includes('"Resource": "*"')
      );
    }

    if (currentScenarioId === "iamAzureBlobReaderScope") {
      const assignment = runtime.files["role-assignment.json"] ?? "";
      return (
        assignment.includes('"principalName": "reporting-api"') &&
        assignment.includes('"roleDefinitionName": "Storage Blob Data Reader"') &&
        assignment.includes('"scope": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg-prod-data/providers/Microsoft.Storage/storageAccounts/proddata/blobServices/default/containers/reports"') &&
        !assignment.includes('"roleDefinitionName": "Owner"') &&
        !assignment.includes('"roleDefinitionName": "Contributor"') &&
        !assignment.includes('"scope": "/subscriptions/00000000-0000-0000-0000-000000000000"')
      );
    }

    if (currentScenarioId === "iamBlankSecretsReadonly") {
      const policy = runtime.files["policy.json"] ?? "";
      return (
        policy.includes("secretsmanager:GetSecretValue") &&
        policy.includes("arn:aws:secretsmanager:eu-west-1:123456789012:secret:prod/db/password-abc123") &&
        !policy.includes("secretsmanager:*") &&
        !policy.includes("secretsmanager:DeleteSecret") &&
        !policy.includes('"Resource": "*"')
      );
    }

    if (currentScenarioId === "iamBlankCloudWatchLogsWrite") {
      const policy = runtime.files["policy.json"] ?? "";
      return (
        policy.includes("logs:CreateLogStream") &&
        policy.includes("logs:PutLogEvents") &&
        policy.includes("arn:aws:logs:eu-west-1:123456789012:log-group:/aws/ecs/payments-api:*") &&
        !policy.includes("logs:*") &&
        !policy.includes("logs:DeleteLogGroup") &&
        !policy.includes('"Resource": "*"')
      );
    }

    return false;
  }

  function scpFixApplied(): boolean {
    const policy = runtime.files["scp.json"] ?? "";

    if (currentScenarioId === "scpDenyLeavingOrg") {
      return (
        policy.includes("organizations:LeaveOrganization") &&
        policy.includes('"Effect": "Deny"') &&
        policy.includes('"Action": "organizations:LeaveOrganization"') &&
        !policy.includes('"Action": "*"') &&
        !policy.includes('"Resource": "*"')
      );
    }

    if (currentScenarioId === "scpRegionRestrictionBreakGlass") {
      return (
        policy.includes("aws:RequestedRegion") &&
        policy.includes("eu-west-1") &&
        policy.includes("eu-central-1") &&
        policy.includes("ArnNotLike") &&
        policy.includes("arn:aws:iam::*:role/BreakGlassAdmin") &&
        !policy.includes("us-east-1")
      );
    }

    if (currentScenarioId === "scpBlankDenyRootUser") {
      return (
        policy.includes('"Effect": "Deny"') &&
        policy.includes("aws:PrincipalArn") &&
        policy.includes("arn:aws:iam::*:root") &&
        policy.includes("aws-portal:ViewBilling") &&
        !policy.includes('"Action": "*"')
      );
    }

    if (currentScenarioId === "scpBlankRequireImdsv2") {
      return (
        policy.includes('"Effect": "Deny"') &&
        policy.includes("ec2:RunInstances") &&
        policy.includes("ec2:MetadataHttpTokens") &&
        policy.includes("optional") &&
        !policy.includes('"Action": "ec2:*"') &&
        !policy.includes('"Action": "*"')
      );
    }

    return false;
  }

  function scpSuccessNote(): string {
    if (currentScenarioId === "scpDenyLeavingOrg") return "SCP denies LeaveOrganization without blocking unrelated Organizations read actions.";
    if (currentScenarioId === "scpRegionRestrictionBreakGlass") return "SCP denies unsupported regions while exempting the break-glass role.";
    if (currentScenarioId === "scpBlankDenyRootUser") return "SCP denies root-user actions while preserving the billing view exception.";
    if (currentScenarioId === "scpBlankRequireImdsv2") return "SCP denies EC2 launches when IMDSv2 is not required.";
    return "SCP guardrail is valid.";
  }

  function scpFailureNote(): string {
    if (currentScenarioId === "scpDenyLeavingOrg") return "SCP still fails to deny LeaveOrganization with a scoped action.";
    if (currentScenarioId === "scpRegionRestrictionBreakGlass") return "SCP still misses allowed regions or the break-glass exception.";
    if (currentScenarioId === "scpBlankDenyRootUser") return "SCP still does not deny root-user activity with the required billing exception.";
    if (currentScenarioId === "scpBlankRequireImdsv2") return "SCP still does not require IMDSv2 for EC2 instance launches.";
    return "SCP still does not match the requirement.";
  }

  function scpSimulationSuccess(): string[] {
    if (currentScenarioId === "scpDenyLeavingOrg") {
      return [
        "EvalActionName: organizations:LeaveOrganization",
        "EvalDecision: explicitDeny",
        "MatchedStatement: DenyLeaveOrganization",
        "",
        "EvalActionName: organizations:DescribeOrganization",
        "EvalDecision: allowed by account policy, not denied by SCP",
      ];
    }

    if (currentScenarioId === "scpRegionRestrictionBreakGlass") {
      return [
        "EvalActionName: ec2:RunInstances",
        "Context: aws:RequestedRegion=eu-west-1",
        "EvalDecision: allowed by account policy, not denied by SCP",
        "",
        "EvalActionName: ec2:RunInstances",
        "Context: aws:RequestedRegion=us-west-2",
        "EvalDecision: explicitDeny",
        "",
        "PrincipalArn: arn:aws:iam::123456789012:role/BreakGlassAdmin",
        "EvalDecision: allowed by SCP exception",
      ];
    }

    if (currentScenarioId === "scpBlankDenyRootUser") {
      return [
        "EvalPrincipalArn: arn:aws:iam::123456789012:root",
        "EvalActionName: ec2:TerminateInstances",
        "EvalDecision: explicitDeny",
        "MatchedStatement: DenyRootUser",
        "",
        "EvalActionName: aws-portal:ViewBilling",
        "EvalDecision: allowed by SCP exception",
      ];
    }

    if (currentScenarioId === "scpBlankRequireImdsv2") {
      return [
        "EvalActionName: ec2:RunInstances",
        "Context: ec2:MetadataHttpTokens=optional",
        "EvalDecision: explicitDeny",
        "",
        "EvalActionName: ec2:RunInstances",
        "Context: ec2:MetadataHttpTokens=required",
        "EvalDecision: allowed by account policy, not denied by SCP",
      ];
    }

    return ["SCP simulation passed."];
  }

  function scpSimulationFailure(): string[] {
    if (currentScenarioId === "scpDenyLeavingOrg") {
      return [
        "EvalActionName: organizations:LeaveOrganization",
        "EvalDecision: allowed",
        "Finding: member accounts can still leave the organization.",
      ];
    }

    if (currentScenarioId === "scpRegionRestrictionBreakGlass") {
      return [
        "EvalActionName: ec2:RunInstances",
        "Context: aws:RequestedRegion=us-west-2",
        "EvalDecision: allowed",
        "Finding: unsupported regions are not denied or break-glass exception is missing.",
      ];
    }

    if (currentScenarioId === "scpBlankDenyRootUser") {
      return [
        "EvalPrincipalArn: arn:aws:iam::123456789012:root",
        "EvalActionName: ec2:TerminateInstances",
        "EvalDecision: allowed",
        "Finding: root user actions are not explicitly denied or billing exception is missing.",
      ];
    }

    if (currentScenarioId === "scpBlankRequireImdsv2") {
      return [
        "EvalActionName: ec2:RunInstances",
        "Context: ec2:MetadataHttpTokens=optional",
        "EvalDecision: allowed",
        "Finding: EC2 launches without IMDSv2 required are still permitted.",
      ];
    }

    return ["SCP simulation failed."];
  }

  function lockError(): string[] {
    return [
      "Error: Error acquiring the state lock",
      `Lock Info: ID ${runtime.backend.lockId}`,
      "Terraform acquires a state lock to protect the state from being written by multiple users at the same time.",
    ];
  }

  function hasStateAddress(address: string): boolean {
    return runtime.stateResources.some((resource) => resource.address === address);
  }

  function addStateResource(address: string, id: string): void {
    if (!hasStateAddress(address)) {
      runtime.stateResources = [...runtime.stateResources, { address, id }];
      runtime = runtime;
    }
  }

  function moveHistory(direction: number): void {
    if (!commandHistory.length) return;
    historyIndex = Math.min(commandHistory.length, Math.max(0, historyIndex + direction));
    terminalInput = commandHistory[historyIndex] || "";
  }

  function focusTerminalInput(): void {
    terminalInputElement?.focus();
  }

  function terminalCommandOptions(): string[] {
    if (runtime.kind === "awsconfig") return ["terraform init", "checkov -f main.tf", "terraform plan", "check", "help"];
    if (runtime.kind === "secrets") return ["aws secretsmanager describe-secret", "aws ssm get-parameter", "check", "help"];
    if (runtime.kind === "dns") return ["aws acm describe-certificate", "dig app.example.com", "check", "help"];
    if (runtime.kind === "iam") return ["aws iam simulate-principal-policy", "aws sts assume-role-with-web-identity", "aws s3 cp", "aws kms decrypt", "az role assignment list", "check", "help"];
    if (runtime.kind === "scp") return ["aws organizations describe-policy", "aws iam simulate-principal-policy", "check", "help"];
    if (runtime.kind === "cicd") return ["gh run view", "gh run rerun", "gh secret list", "gh secret set AWS_ROLE_ARN", "check", "help"];
    if (runtime.kind === "terragrunt") return ["terragrunt init", "terragrunt validate", "terragrunt plan", "terragrunt run-all plan", "terragrunt hclfmt", "check", "help"];
    if (runtime.kind === "observability") return ["aws cloudwatch describe-alarms", "aws logs describe-log-groups", "check", "help"];
    if (runtime.kind === "finops") return ["aws ce get-cost-and-usage", "aws ec2 describe-volumes", "check", "help"];
    if (runtime.kind === "policy") return ["kyverno test .", "kubectl apply --dry-run=server -f policy.yaml", "check", "help"];
    return [
      "terraform init",
      "terraform plan",
      "terraform apply",
      "terraform validate",
      "terraform state list",
      "terraform state mv aws_s3_bucket.logs module.logging.aws_s3_bucket.logs",
      "terraform import aws_s3_bucket.logs prod-logs-training",
      "terraform import aws_iam_role.app training-app-role",
      runtime.backend.lockId ? `terraform force-unlock ${runtime.backend.lockId}` : "terraform force-unlock",
      "checkov -f main.tf",
      "aws dynamodb scan --table-name tf-locks",
      "aws s3 ls",
      "check",
      "help",
    ];
  }

  function completeTerminalInput(): void {
    const rawInput = terminalInput;
    const leadingWhitespace = rawInput.match(/^\s*/)?.[0] ?? "";
    const input = rawInput.trimStart();
    const normalizedInput = input.toLowerCase();
    const matches = terminalCommandOptions().filter((command) => command.toLowerCase().startsWith(normalizedInput));
    if (matches.length === 1) {
      terminalInput = `${leadingWhitespace}${matches[0]}`;
      return;
    }
    if (matches.length > 1) {
      const commonPrefix = longestCommonPrefix(matches);
      if (commonPrefix.length > input.length) {
        terminalInput = `${leadingWhitespace}${commonPrefix}`;
        return;
      }
      addTerminalLines(["Completions:", ...matches.map((match) => `  ${match}`)]);
      focusTerminalInput();
    }
  }

  function longestCommonPrefix(values: string[]): string {
    if (!values.length) return "";
    let prefix = values[0];
    for (const value of values.slice(1)) {
      while (!value.toLowerCase().startsWith(prefix.toLowerCase())) {
        prefix = prefix.slice(0, -1);
        if (!prefix) return "";
      }
    }
    return prefix;
  }

  function addTerminalLines(lines: string[]): void {
    terminalLines = [...terminalLines, ...lines];
    saveSession();
    scrollTerminal();
  }

  async function scrollTerminal(): Promise<void> {
    await tick();
    if (terminalOutput) terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function statusClass(status: string): string {
    if (status === "exists" || status === "success") return "badge badge-ok";
    if (status === "drifted") return "badge badge-warn";
    return "badge badge-danger";
  }

  function labHealthClass(solvedState: boolean, scenario: Scenario): string {
    if (scenario.kind === "cicd" || scenario.kind === "awsconfig" || scenario.kind === "iam" || scenario.kind === "scp" || scenario.kind === "policy" || scenario.kind === "secrets" || scenario.kind === "dns" || scenario.kind === "observability" || scenario.kind === "finops" || scenario.kind === "pr") {
      return solvedState ? "badge badge-ok" : "badge badge-danger";
    }
    return scenario.backend.locked ? "badge badge-danger" : "badge badge-ok";
  }

  function labHealthLabel(solvedState: boolean, scenario: Scenario): string {
    if (scenario.kind === "cicd") return solvedState ? "Workflow: passing" : "Workflow: failing";
    if (scenario.kind === "awsconfig") return solvedState ? "AWS config: passed" : "AWS config: failing";
    if (scenario.kind === "iam") return solvedState ? "IAM: validated" : "IAM: needs review";
    if (scenario.kind === "scp") return solvedState ? "SCP: validated" : "SCP: needs review";
    if (scenario.kind === "policy") return solvedState ? "Policy: passing" : "Policy: failing";
    if (scenario.kind === "secrets") return solvedState ? "Secrets: healthy" : "Secrets: failing";
    if (scenario.kind === "dns") return solvedState ? "DNS/TLS: healthy" : "DNS/TLS: failing";
    if (scenario.kind === "observability") return solvedState ? "Observability: healthy" : "Observability: failing";
    if (scenario.kind === "finops") return solvedState ? "Cost: optimized" : "Cost: review";
    if (scenario.kind === "pr") return solvedState ? "Review: accepted" : "Review: pending";
    if (scenario.kind === "terragrunt") return solvedState ? "Terragrunt: healthy" : `Remote state: ${scenario.backend.key}`;
    return scenario.backend.locked ? `Backend: locked (${scenario.backend.lockId})` : `Backend: unlocked (${scenario.backend.key})`;
  }

  function workflowEvent(): string {
    if (currentScenarioId === "githubActionsMissingSecret") return "push on main";
    if (currentScenarioId === "githubActionsWrongWorkingDirectory") return "pull_request on main";
    if (currentScenarioId === "githubActionsAwsOidcTrust") return "push on main";
    if (currentScenarioId === "githubActionsCheckovGate") return "pull_request on main";
    if (currentScenarioId === "githubActionsOverbroadPermissions") return "push on main";
    if (currentScenarioId === "githubActionsNodeCachePath") return "pull_request on main";
    if (currentScenarioId === "githubActionsDockerRegistryAuth") return "push on main";
    if (currentScenarioId === "githubActionsEnvironmentApproval") return "workflow_dispatch";
    if (currentScenarioId === "githubActionsMatrixNodeVersion") return "pull_request on main";
    return "workflow_dispatch";
  }

  function workflowJob(): string {
    if (currentScenarioId === "githubActionsMissingSecret") return "deploy";
    if (currentScenarioId === "githubActionsWrongWorkingDirectory") return "validate";
    if (currentScenarioId === "githubActionsAwsOidcTrust") return "deploy";
    if (currentScenarioId === "githubActionsCheckovGate") return "checkov";
    if (currentScenarioId === "githubActionsOverbroadPermissions") return "actionlint";
    if (currentScenarioId === "githubActionsNodeCachePath") return "test";
    if (currentScenarioId === "githubActionsDockerRegistryAuth") return "publish";
    if (currentScenarioId === "githubActionsEnvironmentApproval") return "deploy";
    if (currentScenarioId === "githubActionsMatrixNodeVersion") return "test";
    return "workflow";
  }

  function workflowFailedStep(): string {
    if (runtime.flags.runPassing) return "none";
    if (currentScenarioId === "githubActionsMissingSecret") return "aws-actions/configure-aws-credentials@v4";
    if (currentScenarioId === "githubActionsWrongWorkingDirectory") return "terraform fmt -check";
    if (currentScenarioId === "githubActionsAwsOidcTrust") return "aws-actions/configure-aws-credentials@v4";
    if (currentScenarioId === "githubActionsCheckovGate") return "checkov -f main.tf";
    if (currentScenarioId === "githubActionsOverbroadPermissions") return "actionlint";
    if (currentScenarioId === "githubActionsNodeCachePath") return "npm ci";
    if (currentScenarioId === "githubActionsDockerRegistryAuth") return "docker push";
    if (currentScenarioId === "githubActionsEnvironmentApproval") return "environment approval";
    if (currentScenarioId === "githubActionsMatrixNodeVersion") return "npm test (node 16)";
    return "unknown";
  }

  function workflowLogLines(): string[] {
    if (runtime.flags.runPassing) {
      if (currentScenarioId === "githubActionsMissingSecret") {
        return [
          "aws-actions/configure-aws-credentials@v4 completed",
          "terraform init completed",
          "terraform apply -auto-approve completed",
        ];
      }

      if (currentScenarioId === "githubActionsAwsOidcTrust") {
        return [
          "OIDC token requested",
          "AssumeRoleWithWebIdentity succeeded",
          "terraform plan completed",
        ];
      }

      if (currentScenarioId === "githubActionsCheckovGate") {
        return [
          "Running checkov -f main.tf",
          "CKV_AWS_20 passed",
          "Failed checks: 0",
        ];
      }

      if (currentScenarioId === "githubActionsOverbroadPermissions") {
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

    if (currentScenarioId === "githubActionsMissingSecret") {
      return [
        "Configuring AWS credentials",
        "role-to-assume resolved to an empty value",
        "secrets.AWS_ROLE_ARN is not available to this workflow",
      ];
    }

    if (currentScenarioId === "githubActionsWrongWorkingDirectory") {
      return [
        "Running terraform fmt -check",
        "Working directory: infra/prod",
        "Error: chdir infra/prod: no such file or directory",
      ];
    }

    if (currentScenarioId === "githubActionsAwsOidcTrust") {
      return [
        "Requesting GitHub OIDC token",
        "Calling sts:AssumeRoleWithWebIdentity",
        "AccessDenied: token subject does not match trust policy",
      ];
    }

    if (currentScenarioId === "githubActionsCheckovGate") {
      return [
        "Running checkov -f main.tf",
        "CKV_AWS_20 failed: S3 bucket ACL allows public access",
        "Failed checks: 1",
      ];
    }

    if (currentScenarioId === "githubActionsOverbroadPermissions") {
      return [
        "Running actionlint",
        "permissions: write-all is not allowed",
        "Use id-token: write and contents: read instead",
      ];
    }

    if (isGenericGithubActionsScenario()) {
      return genericGithubActionsLogLines();
    }

    return ["No logs available."];
  }

  function isGenericGithubActionsScenario(): boolean {
    return ["githubActionsNodeCachePath", "githubActionsDockerRegistryAuth", "githubActionsEnvironmentApproval", "githubActionsMatrixNodeVersion"].includes(currentScenarioId);
  }

  function genericGithubActionsFixApplied(): boolean {
    const file = runtime.files[activeFileName] ?? "";

    if (currentScenarioId === "githubActionsNodeCachePath") {
      return file.includes("working-directory: app");
    }

    if (currentScenarioId === "githubActionsDockerRegistryAuth") {
      return file.includes("docker/login-action") && file.indexOf("docker/login-action") < file.indexOf("docker push");
    }

    if (currentScenarioId === "githubActionsEnvironmentApproval") {
      return file.includes("environment:\n      name: production") && !file.includes("environment:\n      name: prod");
    }

    if (currentScenarioId === "githubActionsMatrixNodeVersion") {
      return !file.includes("16") && (file.includes("20") || file.includes("22"));
    }

    return false;
  }

  function workflowFailureSummary(): string {
    if (currentScenarioId === "githubActionsNodeCachePath") return "npm ci cannot find package-lock.json in the current working directory.";
    if (currentScenarioId === "githubActionsDockerRegistryAuth") return "denied: unauthenticated request to ghcr.io.";
    if (currentScenarioId === "githubActionsEnvironmentApproval") return "environment prod is not configured or protected.";
    if (currentScenarioId === "githubActionsMatrixNodeVersion") return "matrix node-version 16 is unsupported by this project.";
    return "workflow failed.";
  }

  function genericGithubActionsFailureNote(): string {
    if (currentScenarioId === "githubActionsNodeCachePath") return "npm ci still runs outside app/.";
    if (currentScenarioId === "githubActionsDockerRegistryAuth") return "docker push still runs without a registry login.";
    if (currentScenarioId === "githubActionsEnvironmentApproval") return "workflow still targets prod instead of production.";
    if (currentScenarioId === "githubActionsMatrixNodeVersion") return "matrix still includes unsupported Node.js 16.";
    return "Workflow is still failing.";
  }

  function genericGithubActionsSuccessNote(): string {
    if (currentScenarioId === "githubActionsNodeCachePath") return "npm ci and npm test run from app/.";
    if (currentScenarioId === "githubActionsDockerRegistryAuth") return "Workflow logs in to ghcr.io before pushing the image.";
    if (currentScenarioId === "githubActionsEnvironmentApproval") return "Workflow targets the configured production environment.";
    if (currentScenarioId === "githubActionsMatrixNodeVersion") return "Matrix only uses supported Node.js versions.";
    return "Workflow completed successfully.";
  }

  function genericGithubActionsLogLines(): string[] {
    if (runtime.flags.runPassing) {
      return [genericGithubActionsSuccessNote(), "Workflow completed successfully."];
    }

    if (currentScenarioId === "githubActionsNodeCachePath") {
      return ["Running npm ci", "cwd: /home/runner/work/repo/repo", "npm ERR! The package-lock.json file was not found"];
    }

    if (currentScenarioId === "githubActionsDockerRegistryAuth") {
      return ["docker push ghcr.io/acme/app:${{ github.sha }}", "denied: unauthenticated request", "Add docker/login-action before pushing"];
    }

    if (currentScenarioId === "githubActionsEnvironmentApproval") {
      return ["Preparing deployment", "environment: prod", "Environment prod is not configured for this repository"];
    }

    if (currentScenarioId === "githubActionsMatrixNodeVersion") {
      return ["matrix.node-version: 16", "npm test", "Error: package requires Node.js >= 20"];
    }

    return ["No logs available."];
  }
</script>

<svelte:window on:pointerdown={handleGlobalPointerDown} on:pointermove={resizeTerminal} on:pointerup={stopTerminalResize} on:keydown={handleGlobalKeydown} />

{#if confettiPieces.length}
  <div class="confetti-layer" aria-hidden="true">
    {#each confettiPieces as piece (piece.id)}
      <span
        class="confetti-piece"
        style={`
          --left: ${piece.left}vw;
          --delay: ${piece.delay}s;
          --duration: ${piece.duration}s;
          --size: ${piece.size}px;
          --color: ${piece.color};
          --rotation: ${piece.rotation}deg;
          --drift: ${piece.drift}px;
        `}
      ></span>
    {/each}
  </div>
{/if}

{#if isMenuOpen}
  <button class="menu-backdrop" type="button" aria-label="Close menu" on:click={() => (isMenuOpen = false)}></button>
{/if}

{#if activeLabModal}
  <button class="modal-backdrop" type="button" aria-label="Close dialog" on:click={closeLabModal}></button>
  <div class="lab-modal" role="dialog" aria-modal="true" aria-labelledby="lab-modal-title">
    <div class="lab-modal-header">
      <div>
        <p>{activeLabModal === "solution" ? "Solution guide" : "Lab complete"}</p>
        <h2 id="lab-modal-title">{activeLabModal === "solution" ? runtime.title : scenarios[completionModalScenarioId ?? currentScenarioId]?.title ?? runtime.title}</h2>
      </div>
      <button type="button" class="menu-close-button" aria-label="Close dialog" on:click={closeLabModal}>×</button>
    </div>
    <div class="lab-modal-body">
      {#if activeLabModal === "solution"}
        <p>{solutionSummary()}</p>
        <h3>Steps</h3>
        <ol>
          {#each solutionSteps() as step}
            <li>{step}</li>
          {/each}
        </ol>
        <h3>Commands</h3>
        <pre>{solutionCommands().join("\n")}</pre>
      {:else}
        {#each completionExplanationParagraphs() as paragraph}
          <p>{paragraph}</p>
        {/each}
        <h3>Outcome</h3>
        <p>{completionOutcome()}</p>
      {/if}
    </div>
    <div class="lab-modal-actions">
      {#if activeLabModal === "solution"}
        <button type="button" class="solution-apply-button" on:click={applySolution}>Apply solution</button>
      {/if}
      <button type="button" on:click={closeLabModal}>Close</button>
    </div>
  </div>
{/if}

<aside class:open={isMenuOpen} class="app-menu" aria-label="Application menu" aria-hidden={!isMenuOpen}>
  <div class="menu-header">
    <button type="button" class="menu-close-button" aria-label="Close menu" on:click={() => (isMenuOpen = false)}>×</button>
    <div class="theme-dots" aria-label="Theme">
      <button type="button" class="theme-dot theme-dot-latte" class:active={theme === "latte"} aria-label="Latte theme" on:click={() => (theme = "latte")}></button>
      <button type="button" class="theme-dot theme-dot-mocha" class:active={theme === "mocha"} aria-label="Mocha theme" on:click={() => (theme = "mocha")}></button>
      <button type="button" class="theme-dot theme-dot-dracula" class:active={theme === "dracula"} aria-label="Dracula theme" on:click={() => (theme = "dracula")}></button>
      <button type="button" class="theme-dot theme-dot-cyberpunk" class:active={theme === "cyberpunk"} aria-label="Cyber theme" on:click={() => (theme = "cyberpunk")}></button>
    </div>
  </div>

  <section class="menu-section">
    <div class="menu-actions menu-page-actions">
      <button type="button" class:active={currentPage !== "docs"} on:click={openLabs}>Labs</button>
      <button type="button" class:active={currentPage === "docs"} on:click={openDocs}>Documentation</button>
    </div>
  </section>

  <section class="menu-section">
    <div class="menu-actions">
      <label class="menu-toggle">
        <span>
          <strong>Incident Mode</strong>
          <small>Hide lab names and direct requirements for unsolved labs.</small>
        </span>
        <input type="checkbox" checked={incidentMode} on:change={setIncidentMode}>
      </label>
    </div>
  </section>

  <section class="menu-section lab-menu-section">
    <label class="menu-search">
      <span class="menu-search-control">
        <input bind:value={menuSearchQuery} placeholder="Filter by name, category, or description" autocomplete="off" spellcheck="false">
      </span>
    </label>
    {#each labGroups as group}
      {#if menuGroupVisible(group.ids, menuSearchQuery)}
        <div class="menu-lab-group">
          <button
            type="button"
            class="menu-group-button"
            aria-expanded={openMenuGroups.includes(group.id) || Boolean(menuSearchQuery.trim())}
            on:click={() => toggleMenuGroup(group.id)}
          >
            <span>
              <strong>{group.title}</strong>
            </span>
            <small>{groupCompletionLabel(group.ids)}</small>
          </button>
          {#if openMenuGroups.includes(group.id) || menuSearchQuery.trim()}
            {#key incidentMode}
              <div class="scenario-list">
                {#each filteredScenarioIds(group.ids, menuSearchQuery) as id}
                  <button
                    type="button"
                    class={`scenario-difficulty ${scenarioDifficultyClass(id)}`}
                    class:active={id === currentScenarioId}
                    class:completed={completedScenarioIds.includes(id)}
                    aria-current={id === currentScenarioId ? "page" : undefined}
                    on:click={() => selectScenario(id)}
                  >
                    <span class="scenario-title">{labMenuTitle(id)}</span>
                    {#if completedScenarioIds.includes(id)}
                      <span
                        class="scenario-check"
                        role="button"
                        tabindex="0"
                        aria-label="Mark incomplete"
                        on:click={(event) => toggleScenarioCompletion(id, event)}
                        on:keydown={(event) => {
                          if (event.key === "Enter" || event.key === " ") toggleScenarioCompletion(id, event);
                        }}
                      >✓</span>
                    {:else}
                      <span
                        class="scenario-check scenario-check-empty"
                        role="button"
                        tabindex="0"
                        aria-label="Mark complete"
                        on:click={(event) => toggleScenarioCompletion(id, event)}
                        on:keydown={(event) => {
                          if (event.key === "Enter" || event.key === " ") toggleScenarioCompletion(id, event);
                        }}
                      ></span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/key}
          {/if}
        </div>
      {/if}
    {/each}
  </section>

  <a class="menu-repo-link" href="https://github.com/krovs/devopslabs" target="_blank" rel="noreferrer">
    <span>🌵 krovs@2026</span>
    <Launch size={16} aria-hidden="true" />
  </a>

</aside>

<main class:is-resizing-terminal={isResizingTerminal} class:docs-page={currentPage === "docs"} class:index-page={currentPage === "index"} class:network-page={currentPage === "labs" && runtime.kind === "networking"} class="app-shell" style={`--terminal-height: ${terminalHeight}px`}>
  <header class="topbar">
    <button
      type="button"
      class="hamburger-button"
      aria-label="Open menu"
      aria-expanded={isMenuOpen}
      on:click={() => (isMenuOpen = true)}
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div>
      <h1>{pageHeading}</h1>
    </div>
    {#if currentPage === "labs"}
      <div class="topbar-badges">
        <span class={solved ? "badge badge-ok" : "badge badge-warn"}>
          Status: {solved ? "complete" : "in progress"}
        </span>
        <span class={labHealthClass(solved, runtime)}>{labHealthLabel(solved, runtime)}</span>
        {#if incidentMode && !solved}
          <span class="badge badge-warn">incident</span>
        {/if}
      </div>
      {#if !incidentMode}
        <button type="button" class="solution-button" on:click={openSolutionModal}>Show solution</button>
      {/if}
      <button type="button" class="reset-button" on:click={() => loadScenario(currentScenarioId)}>Reset</button>
    {/if}
  </header>

  {#if currentPage === "docs"}
    <section class="wiki-layout" aria-label="Documentation">
      <nav class="wiki-toc" aria-label="Documentation sections">
        <a href="#wiki-workflow">Workflow</a>
        <a href="#wiki-terraform">IaC</a>
        <a href="#wiki-iac-security-baselines">IaC Security</a>
        <a href="#wiki-terragrunt">Terragrunt</a>
        <a href="#wiki-github">GitHub Actions</a>
        <a href="#wiki-iam">IAM</a>
        <a href="#wiki-policy">Policy as Code</a>
        <a href="#wiki-secrets">Secrets</a>
        <a href="#wiki-dns">DNS/TLS</a>
        <a href="#wiki-networking">Networking</a>
        <a href="#wiki-pr">PR Review</a>
        <a href="#wiki-security">Security</a>
        <a href="#wiki-troubleshooting">Troubleshooting</a>
      </nav>

      <article class="wiki-article">
        <section id="wiki-workflow">
          <h2>Lab Workflow</h2>
          <p>
            Start every lab by reproducing the failure. The terminal output tells you which system is unhealthy:
            Terraform state, AWS resources, Terragrunt stack wiring, or a GitHub Actions job.
          </p>
          <ol>
            <li>Run the obvious inspection command, such as <code>terraform plan</code> or <code>gh run view</code>.</li>
            <li>Open the file tab mentioned by the error.</li>
            <li>Fix the smallest thing that explains the failure.</li>
            <li>Run the validation or plan command again.</li>
            <li>Use <code>check</code> only after the run is clean.</li>
          </ol>
          <p>
            Incident Mode hides unsolved lab names and direct scenario descriptions. Use it when you want symptoms
            first and clues only when needed.
          </p>
        </section>

        <section id="wiki-terraform">
          <h2>IaC</h2>
          <p>
            Terraform labs focus on the relationship between configuration, remote infrastructure, and state.
            A clean fix usually makes the state address, the code address, and the real AWS object agree.
          </p>
          <div class="wiki-diagram" aria-label="Terraform troubleshooting relationship diagram">
            <div class="diagram-node">Configuration<br><span>main.tf / modules</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">State<br><span>tracked addresses</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">AWS<br><span>real resources</span></div>
          </div>
          <pre>terraform init
terraform validate
terraform plan
terraform apply
terraform state list
terraform import &lt;address&gt; &lt;id&gt;
terraform state mv &lt;old-address&gt; &lt;new-address&gt;
terraform force-unlock &lt;lock-id&gt;</pre>
          <h3>State And Drift</h3>
          <p>
            Import is for a real object that exists but is not tracked in state. State move is for a tracked
            object whose Terraform address changed after a folder, module, or resource rename migration.
          </p>
          <p>
            Force unlock is a recovery action. Use it only when you know the apply that created the lock is no
            longer running.
          </p>
        </section>

        <section id="wiki-iac-security-baselines">
          <h2>IaC Security Baselines</h2>
          <p>
            IaC Security Baselines labs are Terraform exercises focused on spotting missing cloud guardrails
            before deployment. The goal is to identify bad or incomplete service configuration, fix the Terraform,
            then pass the simulated Checkov gate.
          </p>
          <div class="wiki-diagram" aria-label="IaC security baseline review flow">
            <div class="diagram-node">Terraform<br><span>AWS service config</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Policy Scan<br><span>checkov -f main.tf</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Guardrails<br><span>encryption, backup, audit</span></div>
          </div>
          <pre>terraform init
checkov -f main.tf
terraform plan
check</pre>
          <p>
            Common fixes include S3 public access blocks, bucket encryption and versioning, RDS private access,
            backup retention, deletion protection, CloudWatch log retention, and multi-region CloudTrail with log
            file validation.
          </p>
        </section>

        <section id="wiki-terragrunt">
          <h2>Terragrunt</h2>
          <p>
            Terragrunt labs add stack composition on top of Terraform. Most failures come from a wrong module
            source, a missing root include, unformatted HCL, or a dependency output name mismatch.
          </p>
          <div class="tree-diagram" aria-label="Terragrunt file structure diagram">
            <div class="tree-row tree-root"><code>terragrunt.hcl</code><span>root config, remote_state, shared inputs</span></div>
            <div class="tree-row tree-branch"><code>live/dev/network/terragrunt.hcl</code><span>network stack</span></div>
            <div class="tree-row tree-branch"><code>live/dev/app/terragrunt.hcl</code><span>app stack, depends on network</span></div>
            <div class="tree-row tree-leaf"><code>modules/network/main.tf</code><span>Terraform network module</span></div>
            <div class="tree-row tree-leaf"><code>modules/app/main.tf</code><span>Terraform app module</span></div>
          </div>
          <pre>terragrunt init
terragrunt validate
terragrunt plan
terragrunt run-all plan
terragrunt hclfmt</pre>
          <p>
            Check <code>include</code> blocks before debugging Terraform variables. If a child stack does not
            include the root config, it may miss shared inputs and remote state settings.
          </p>
          <p>
            For dependency labs, compare what the consumer reads, for example
            <code>dependency.network.outputs.vpc_id</code>, with what the producer exposes.
          </p>
        </section>

        <section id="wiki-github">
          <h2>GitHub Actions</h2>
          <p>
            CI/CD labs are solved by reading the failed job, fixing the workflow or repo settings, and rerunning
            the pipeline. Avoid guessing from the workflow file alone; the failing step usually gives the shortest path.
          </p>
          <div class="wiki-diagram" aria-label="GitHub Actions troubleshooting flow">
            <div class="diagram-node">Run Fails<br><span>gh run view</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Fix Cause<br><span>secret, path, OIDC, permissions</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Rerun<br><span>gh run rerun</span></div>
          </div>
          <pre>gh run view
gh run rerun
gh secret list
gh secret set AWS_ROLE_ARN</pre>
          <p>
            For AWS deployments, prefer OIDC over long-lived access keys. The workflow needs
            <code>id-token: write</code>, the role ARN must be available, and the IAM trust policy subject must
            match the branch or environment that is running.
          </p>
        </section>

        <section id="wiki-iam">
          <h2>IAM</h2>
          <p>
            IAM labs focus on whether a principal can perform a specific action on a specific resource, and
            whether the policy also blocks nearby access that should remain denied.
          </p>
          <div class="wiki-diagram" aria-label="IAM evaluation flow">
            <div class="diagram-node">Principal<br><span>role or OIDC subject</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Policy<br><span>action, resource, condition</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Decision<br><span>allow or deny</span></div>
          </div>
          <pre>aws iam simulate-principal-policy
aws sts assume-role-with-web-identity
aws s3 cp
aws kms decrypt
az role assignment list</pre>
          <p>
            For least privilege, check all three dimensions: action, resource, and condition or scope. A policy that
            allows the happy path can still be wrong if it also allows another prefix, another branch, decrypt without
            the required encryption context, or a subscription-wide Azure role assignment where a container scope is enough.
          </p>
        </section>

        <section id="wiki-policy">
          <h2>Policy as Code</h2>
          <p>
            Policy as Code labs model platform and workload guardrails. These are separate from organization policy:
            they run close to Kubernetes admission, service mesh authorization, or runtime network enforcement.
          </p>
          <div class="wiki-diagram" aria-label="Policy as code validation flow">
            <div class="diagram-node">Policy<br><span>Kyverno, Istio, Cilium</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Validation<br><span>test or dry-run</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Guardrail<br><span>admission or traffic control</span></div>
          </div>
          <pre>kyverno test .
kubectl apply --dry-run=server -f policy.yaml</pre>
          <p>
            Use these labs for Kubernetes NetworkPolicy, Kyverno admission policy, Istio AuthorizationPolicy, and
            CiliumNetworkPolicy patterns. Organization-wide cloud guardrails still belong in Organization Policy.
          </p>
        </section>

        <section id="wiki-secrets">
          <h2>Secrets Management</h2>
          <p>
            Secrets labs focus on safe lookup paths, customer managed KMS keys, rotation, and environment separation.
            The common failure is not only that a secret cannot be read; it may be readable from the wrong environment
            or protected by a weak default.
          </p>
          <div class="wiki-diagram" aria-label="Secrets lookup flow">
            <div class="diagram-node">Service<br><span>environment</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Secret Path<br><span>SSM or Secrets Manager</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Protection<br><span>KMS and rotation</span></div>
          </div>
          <pre>aws secretsmanager describe-secret
aws ssm get-parameter</pre>
          <p>
            Check whether the app is using the correct environment prefix before changing permissions. For Secrets
            Manager, verify rotation and KMS key choice together; enabling one without the other can still leave the
            operational control incomplete.
          </p>
        </section>

        <section id="wiki-dns">
          <h2>DNS/TLS</h2>
          <p>
            DNS/TLS labs model Route 53, ACM, ALB aliases, and CloudFront certificate problems. The fix is usually a
            precise record or region change, not a broad infrastructure rewrite.
          </p>
          <div class="wiki-diagram" aria-label="DNS TLS resolution and certificate flow">
            <div class="diagram-node">Hostname<br><span>Route 53 record</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Endpoint<br><span>ALB or CloudFront</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Certificate<br><span>ACM validation</span></div>
          </div>
          <pre>aws acm describe-certificate
dig app.example.com</pre>
          <p>
            CloudFront viewer certificates must be issued in <code>us-east-1</code>. ALB aliases need the current
            load balancer DNS name and hosted zone ID, and should normally use an alias <code>A</code> record rather
            than a stale CNAME to an old load balancer.
          </p>
        </section>

        <section id="wiki-networking">
          <h2>Networking</h2>
          <p>
            Networking labs use a diagram instead of a terminal. Select components to inspect editable settings,
            run packet traces to see where traffic fails, and use the design check only when the path matches the
            requirement.
          </p>
          <div class="wiki-diagram" aria-label="Networking troubleshooting flow">
            <div class="diagram-node">Symptoms<br><span>failed path</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Diagram<br><span>routes and controls</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Trace<br><span>component failure</span></div>
          </div>
          <p>
            Treat VPCs and subnets as containment boundaries. Routes decide where packets go, security groups and
            NACLs decide whether traffic is allowed, and WAF/ALB controls decide how public requests enter the app.
          </p>
        </section>

        <section id="wiki-pr">
          <h2>PR Review</h2>
          <p>
            PR review labs are solved by reading the diff, choosing the right review decision, and selecting the
            findings that should be left on the review. The goal is to catch risky changes before they merge.
          </p>
          <div class="wiki-diagram" aria-label="PR review flow">
            <div class="diagram-node">Diff<br><span>changed lines</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Risk<br><span>required findings</span></div>
            <div class="diagram-arrow">-></div>
            <div class="diagram-node">Decision<br><span>approve or changes</span></div>
          </div>
          <p>
            Request changes when the diff introduces public access, broad IAM, overbroad GitHub token permissions,
            or skips a required guardrail. Do not select harmless context lines as findings.
          </p>
        </section>

        <section id="wiki-security">
          <h2>Security Checks</h2>
          <p>
            Security exercises model checks that should fail before deployment. Treat them as release gates, not
            warnings to ignore.
          </p>
          <pre>checkov -f main.tf</pre>
          <ul>
            <li>Block public S3 access unless the lab explicitly requires public access.</li>
            <li>Avoid module defaults that expose <code>0.0.0.0/0</code>.</li>
            <li>Use scoped GitHub Actions permissions instead of <code>write-all</code>.</li>
            <li>Keep AWS OIDC trust policies narrow to the intended repository, branch, or environment.</li>
            <li>Scope secret access to the correct environment path and customer managed KMS key where required.</li>
            <li>Validate DNS and certificate changes before routing production traffic to a new endpoint.</li>
            <li>Review AWS managed service defaults; many secure settings are opt-in in Terraform.</li>
          </ul>
        </section>

        <section id="wiki-troubleshooting">
          <h2>Troubleshooting Patterns</h2>
          <p>
            When a plan wants to create something that already exists, check whether the object should be imported.
            When a plan wants to destroy and recreate the same object after a refactor, check whether the state
            address should be moved.
          </p>
          <p>
            When a GitHub Actions job fails, fix the first failing step. Later failures often disappear after the
            first broken permission, secret, path, or version is corrected.
          </p>
          <p>
            When DNS or certificate validation fails, compare the exact record name, record value, region, and alias
            target. Small string mismatches are more common than missing infrastructure.
          </p>
          <p>
            When reviewing a PR, separate required findings from harmless context. A good review blocks the risky
            change and explains the smallest safer alternative.
          </p>
        </section>
      </article>
    </section>
  {:else if currentPage === "index"}
    <section class="lab-index" aria-label="Lab index">
      <p class="lab-index-intro">
        Remember the <span>basics</span>. Practice <span class="pill-mauve">hands-on</span>.
      </p>
      {#each labGroups as group}
        <button type="button" class="lab-index-card" on:click={() => openLabGroup(group.id)}>
          <span class="lab-index-icon" aria-hidden="true">
            {#if group.id === "terraform"}
              <Code size={32} />
            {:else if group.id === "awsconfig"}
              <CloudAuditing size={32} />
            {:else if group.id === "cicd"}
              <ContinuousDeployment size={32} />
            {:else if group.id === "terragrunt"}
              <FolderTree size={32} />
            {:else if group.id === "iam"}
              <GroupSecurity size={32} />
            {:else if group.id === "scp"}
              <IbmSecurity size={32} />
            {:else if group.id === "policy"}
              <DocumentTasks size={32} />
            {:else if group.id === "secrets"}
              <CertificateCheck size={32} />
            {:else if group.id === "dns"}
              <FlowLogsVpc size={32} />
            {:else if group.id === "observability"}
              <ChartLineData size={32} />
            {:else if group.id === "finops"}
              <Cost size={32} />
            {:else if group.id === "pr"}
              <DocumentTasks size={32} />
            {:else}
              <Firewall size={32} />
            {/if}
          </span>
          <span class="lab-index-content">
            <strong>{group.title}</strong>
            <span class="lab-index-providers">
              {#each labGroupDetails[group.id].providers as provider}
                <span class={providerClass(provider)}>{provider}</span>
              {/each}
            </span>
            <small>{labGroupDetails[group.id].description}</small>
          </span>
          <span class="lab-index-count">{groupCompletionLabel(group.ids)}</span>
        </button>
      {/each}
    </section>
  {:else}
  {#if runtime.kind === "networking" && runtime.networking}
    <section class="networking-workspace">
      <div class="network-main-row">
        <section class="panel network-diagram-panel">
          <div class="panel-header">
            <h2>Network Diagram</h2>
            <div class="network-diagram-actions">
              <button type="button" on:click={resetNetworkPan}>Reset view</button>
              <span class={isSolved() ? "badge badge-ok" : "badge badge-danger"}>{isSolved() ? "working" : "misconfigured"}</span>
            </div>
          </div>
          <div
            class="network-canvas"
            class:network-success={isSolved()}
            class:is-panning={isPanningNetwork}
            role="button"
            tabindex="0"
            aria-label="Pannable network diagram. Drag to move the diagram. Press Home or Escape to reset the view."
            on:pointerdown={startNetworkPan}
            on:pointermove={moveNetworkPan}
            on:pointerup={stopNetworkPan}
            on:pointercancel={stopNetworkPan}
            on:keydown={handleNetworkCanvasKeydown}
          >
            <div class="network-pan-surface" style={`transform: translate(${networkPanX}px, ${networkPanY}px)`}>
              <svg class="network-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {#each runtime.networking.links as link}
                  {@const fromNode = runtime.networking.nodes.find((node) => node.id === link.from)}
                  {@const toNode = runtime.networking.nodes.find((node) => node.id === link.to)}
                  {#if fromNode && toNode}
                    <path
                      class:failed-link={networkLinkIsFailed(link)}
                      d={networkEdgePath(fromNode.x, fromNode.y, toNode.x, toNode.y)}
                    />
                  {/if}
                {/each}
              </svg>
              {#each runtime.networking.nodes as node}
                <button
                  type="button"
                  class="network-node"
                  class:network-container={node.type === "vpc" || node.type === "subnet"}
                  class:selected={selectedNetworkNode?.id === node.id}
                  data-node-id={node.id}
                  style={`left: ${node.x}%; top: ${node.y}%; --node-width: ${node.width ?? "112px"}; --node-height: ${node.height ?? "52px"}`}
                >
                  <span>{node.label}</span>
                  <small>{node.type}</small>
                </button>
              {/each}
            </div>
          </div>
          <div class="network-link-list">
            {#each runtime.networking.links as link}
              <span class={networkLinkIsFailed(link) ? "badge badge-danger" : "badge badge-ok"}>{link.label}</span>
            {/each}
          </div>
        </section>

        <section class="panel network-controls-panel">
          <div class="panel-header">
            <h2>Design</h2>
            <div class="network-design-actions">
              {#if scenarioTips.length}
                <button type="button" disabled={revealedTipCount >= scenarioTips.length} on:click={revealTip}>
                  {revealedTipCount >= scenarioTips.length ? "No more clues" : incidentMode ? "Reveal clue" : "Tip"}
                </button>
              {/if}
              <button type="button" on:click={checkNetworkingScenario}>Check design</button>
            </div>
          </div>
          <div class="network-brief-content">
            {#if incidentMode && !isSolved()}
              <section>
                <h3>Observed Symptoms</h3>
                <ul>
                  {#each networkingIncidentSummary() as line}
                    <li>{line}</li>
                  {/each}
                </ul>
              </section>
            {:else}
              <section>
                <h3>Goal</h3>
                {#each networkingRequirementSections.goal as line}
                  <p>{line}</p>
                {/each}
              </section>
              <section>
                <h3>Constraints</h3>
                <ul>
                  {#each networkingRequirementSections.constraints as line}
                    <li>{line}</li>
                  {/each}
                </ul>
              </section>
            {/if}
          </div>
          {#if visibleTips.length}
            <aside class="tips-panel network-design-tips" aria-label="Scenario tips">
              <h3>{incidentMode ? "Clues" : "Tips"}</h3>
              <ol>
                {#each visibleTips as tip}
                  <li>{tip}</li>
                {/each}
              </ol>
            </aside>
          {/if}
          {#if networkTraces.length}
            <section class="network-trace-panel" aria-label="Packet trace">
              <div class="network-trace-heading">
                <h3>Packet Trace</h3>
                <button type="button" on:click={runNetworkTrace}>Run trace</button>
              </div>
              <label>
                <span>Probe</span>
                <select value={selectedTrace?.id ?? ""} on:change={(event) => selectNetworkTrace(event.currentTarget.value)}>
                  {#each networkTraces as trace}
                    <option value={trace.id}>{trace.label}</option>
                  {/each}
                </select>
              </label>
              {#if selectedTrace}
                <dl class="network-trace-meta">
                  <div>
                    <dt>From</dt>
                    <dd>{selectedTrace.source}</dd>
                  </div>
                  <div>
                    <dt>To</dt>
                    <dd>{selectedTrace.destination}</dd>
                  </div>
                  <div>
                    <dt>Port</dt>
                    <dd>tcp/{selectedTrace.port}</dd>
                  </div>
                </dl>
              {/if}
              {#if traceResult.length}
                <pre class="network-trace-output">{traceResult.join("\n")}</pre>
              {/if}
            </section>
          {/if}
          <div class="network-detail">
            <h3>Selected Component</h3>
            {#if selectedNetworkNode}
              <strong>{selectedNetworkNode.label}</strong>
              <p>{selectedNetworkNode.note}</p>
            {:else}
              <p>Select a diagram component to inspect or configure it.</p>
            {/if}
          </div>
          <div class="network-controls">
            {#if networkCheckAttempted && runtime.flags.networkConfigured === false}
              <section class="network-symptom-log" aria-label="Symptom log">
                <h3>Symptom Log</h3>
                <ul>
                  {#each runtime.networking.symptoms ?? ["Connectivity test failed.", "Review routing, addressing, and policy controls."] as symptom}
                    <li>{symptom}</li>
                  {/each}
                </ul>
              </section>
            {/if}
            {#if selectedNetworkNode && selectedNetworkControls.length === 0}
              <p class="network-empty-controls">No editable settings for this component.</p>
            {/if}
            {#each selectedNetworkControls as control}
              <label>
                <span>{control.label}</span>
                {#if control.inputType === "text"}
                  <input
                    value={control.value}
                    placeholder={control.placeholder ?? "CIDR or IP address"}
                    spellcheck="false"
                    on:input={(event) => updateNetworkControl(control.id, event.currentTarget.value.trim())}
                  >
                {:else}
                  <select value={control.value} on:change={(event) => updateNetworkControl(control.id, event.currentTarget.value)}>
                    {#each networkControlOptions(control.options) as option}
                      <option value={option}>{option}</option>
                    {/each}
                  </select>
                {/if}
                <small>{control.note}</small>
              </label>
            {/each}
          </div>
        </section>
      </div>
    </section>
  {:else if runtime.kind === "pr" && runtime.prReview}
    <section class="pr-workspace">
      <section class="panel pr-diff-panel">
        <div class="panel-header">
          <h2>{activeFileName}</h2>
          <span class={isSolved() ? "badge badge-ok" : "badge badge-warn"}>{runtime.prReview.number}</span>
        </div>
        {#if scenarioFileNames.length > 1}
          <div class="file-tabs" role="tablist" aria-label="Pull request files">
            {#each scenarioFileNames as fileName}
              <button
                type="button"
                role="tab"
                class:active={fileName === activeFileName}
                aria-selected={fileName === activeFileName}
                on:click={() => selectFile(fileName)}
              >
                {fileName}
              </button>
            {/each}
          </div>
        {/if}
        <div class="pr-diff-view" aria-label="Pull request diff">
          {#each activeFileContent.split("\n") as line}
            <code class={diffLineClass(line)}>{line || " "}</code>
          {/each}
        </div>
      </section>

      <section class="panel pr-review-panel">
        <div class="panel-header">
          <h2>Review</h2>
          <button type="button" on:click={submitPrReview}>Submit review</button>
        </div>
        <div class="pr-review-body">
          <article class="pr-summary">
            <div class="card-title-row">
              <h3>{runtime.prReview.number}</h3>
              <span class={isSolved() ? "badge badge-ok" : "badge badge-danger"}>{isSolved() ? "accepted" : "needs review"}</span>
            </div>
            <dl class="kv-grid pr-kv-grid">
              <div>
                <dt>Author</dt>
                <dd>{runtime.prReview.author}</dd>
              </div>
              <div>
                <dt>Base</dt>
                <dd>{runtime.prReview.base}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{runtime.prReview.branch}</dd>
              </div>
            </dl>
            <p>{runtime.prReview.summary}</p>
            <p class="muted">{runtime.prReview.risk}</p>
          </article>

          <section class="pr-decision-group" aria-label="Review decision">
            <h3>Decision</h3>
            <div class="segmented-control">
              <button type="button" class:active={runtime.prReview.decision === "approve"} on:click={() => setPrDecision("approve")}>Approve</button>
              <button type="button" class:active={runtime.prReview.decision === "request_changes"} on:click={() => setPrDecision("request_changes")}>Request changes</button>
            </div>
          </section>

          <section class="pr-findings" aria-label="Review findings">
            <h3>Findings</h3>
            {#each runtime.prReview.findings as finding}
              <label class="pr-finding" class:selected={finding.selected}>
                <input type="checkbox" checked={finding.selected} on:change={() => togglePrFinding(finding.id)}>
                <span>
                  <strong>{finding.label}</strong>
                  <small>{finding.file}:{finding.line}</small>
                  <em>{finding.note}</em>
                </span>
              </label>
            {/each}
          </section>

          <section class="pr-selected-summary" aria-label="Selected review findings">
            <h3>Review Comment</h3>
            {#if selectedPrFindings().length}
              <ul>
                {#each selectedPrFindings() as finding}
                  <li>{finding.label}</li>
                {/each}
              </ul>
            {:else}
              <p class="muted">Select the findings you would leave on the review.</p>
            {/if}
          </section>

          {#if visibleTips.length}
            <aside class="tips-panel pr-tips" aria-label="Scenario tips">
              <h3>{incidentMode ? "Clues" : "Tips"}</h3>
              <ol>
                {#each visibleTips as tip}
                  <li>{tip}</li>
                {/each}
              </ol>
            </aside>
          {/if}
        </div>
      </section>
    </section>
  {:else}
  <section class="workspace">
    <section class="panel editor-panel">
      <div class="panel-header">
        <h2>{activeFileName}</h2>
        <button type="button" on:click={saveCurrentFile}>Save</button>
      </div>
      {#if scenarioFileNames.length > 1}
        <div class="file-tabs" role="tablist" aria-label="Scenario files">
          {#each scenarioFileNames as fileName}
            <button
              type="button"
              role="tab"
              class:active={fileName === activeFileName}
              aria-selected={fileName === activeFileName}
              on:click={() => selectFile(fileName)}
            >
              {fileName}
            </button>
          {/each}
        </div>
      {/if}
      <textarea value={activeFileContent} spellcheck="false" on:input={(event) => updateMainTf(event.currentTarget.value)} on:keydown={handleEditorKeydown}></textarea>
    </section>

    <section class="panel resources-panel">
      <div class="panel-header">
        <h2>Resources</h2>
        {#if scenarioTips.length}
          <button type="button" disabled={revealedTipCount >= scenarioTips.length} on:click={revealTip}>
            {revealedTipCount >= scenarioTips.length ? "No more clues" : incidentMode ? "Reveal clue" : "Show tip"}
          </button>
        {/if}
      </div>
      {#if runtime.kind === "cicd"}
        <div class="pipeline-dashboard">
          <article class="pipeline-card run-card">
            <div class="card-title-row">
              <h3>Workflow Run</h3>
              <span class={statusClass(workflowResource.status)}>{workflowResource.status}</span>
            </div>
            <dl class="kv-grid">
              <div>
                <dt>Workflow</dt>
                <dd>{workflowResource.name}</dd>
              </div>
              <div>
                <dt>Run</dt>
                <dd>{workflowResource.id}</dd>
              </div>
              <div>
                <dt>Event</dt>
                <dd>{workflowEvent()}</dd>
              </div>
              <div>
                <dt>Job</dt>
                <dd>{workflowJob()}</dd>
              </div>
            </dl>
            <p class="muted">{workflowResource.note}</p>
          </article>

          <article class="pipeline-card">
            <div class="card-title-row">
              <h3>{runtime.flags.runPassing ? "Completed Steps" : "Failed Step"}</h3>
              <span class={runtime.flags.runPassing ? "badge badge-ok" : "badge badge-danger"}>
                {workflowFailedStep()}
              </span>
            </div>
            <pre class="pipeline-log">{workflowLogLines().join("\n")}</pre>
          </article>

          <article class="pipeline-card">
            <h3>Repository Secrets</h3>
            <div class="pill-list">
              {#if repositorySecrets.length === 0}
                <span class="pill pill-danger">none</span>
              {/if}
              {#each repositorySecrets as secret}
                <span class={secret.address === "secret.AWS_ROLE_ARN" ? "pill pill-ok" : "pill"}>
                  {secret.address.replace("secret.", "")}
                </span>
              {/each}
            </div>
          </article>

          <article class="pipeline-card">
            <h3>Repository Paths</h3>
            <div class="path-list">
              {#if repositoryPaths.length === 0}
                <p class="muted">No repository paths modeled for this lab.</p>
              {/if}
              {#each repositoryPaths as path}
                <div class="path-row">
                  <code>{path.address.replace("path.", "")}</code>
                  <span class={path.id === "missing" ? "badge badge-danger" : "badge badge-ok"}>{path.id}</span>
                </div>
              {/each}
            </div>
          </article>
        </div>
      {:else}
        <div class="resource-grid">
          <article>
            <h3>{leftResourceTitle}</h3>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {#each runtime.awsResources as resource}
                  <tr>
                    <td>{resource.type}</td>
                    <td>{resource.name}<div class="muted">{resource.note || ""}</div></td>
                    <td><span class={statusClass(resource.status)}>{resource.status}</span></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </article>

          <article>
            <h3>{rightResourceTitle}</h3>
            <table>
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Remote ID</th>
                </tr>
              </thead>
              <tbody>
                {#if runtime.stateResources.length === 0}
                  <tr><td colspan="2">No resources tracked.</td></tr>
                {/if}
                {#each runtime.stateResources as resource}
                  <tr>
                    <td>{resource.address}</td>
                    <td>{resource.id}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </article>
        </div>
      {/if}
      {#if visibleTips.length}
        <aside class="tips-panel" aria-label="Scenario tips">
          <h3>{incidentMode ? "Clues" : "Tips"}</h3>
          <ol>
            {#each visibleTips as tip}
              <li>{tip}</li>
            {/each}
          </ol>
        </aside>
      {/if}
    </section>
  </section>

  <section
    class="panel terminal-panel"
    role="application"
  >
    <button
      type="button"
      class="terminal-resize-handle"
      aria-label="Resize terminal"
      on:pointerdown={startTerminalResize}
      on:keydown={resizeTerminalWithKeyboard}
    ></button>
    <div class="panel-header">
      <h2>Terminal</h2>
      <button
        type="button"
        on:click={() => {
          terminalLines = [];
          saveSession();
        }}
      >Clear</button>
    </div>
    <pre bind:this={terminalOutput} aria-live="polite">{terminalLines.join("\n")}</pre>
    <form on:submit|preventDefault={runCommand}>
      <span>$</span>
      <input
        bind:this={terminalInputElement}
        bind:value={terminalInput}
        autocomplete="off"
        spellcheck="false"
        on:keydown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            completeTerminalInput();
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHistory(-1);
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHistory(1);
          }
        }}
      >
    </form>
  </section>
  {/if}
  {/if}
</main>
