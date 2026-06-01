<script lang="ts">
  import { tick } from "svelte";
  import Chemistry from "carbon-icons-svelte/lib/Chemistry.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Documentation from "./Documentation.svelte";
  import LabGroupIcon from "./LabGroupIcon.svelte";
  import { dispatchCommand as dispatchSimulatorCommand, type CommandHandlers } from "./commands";
  import {
    buildLabGroups,
    incidentDescription,
    labGroupDetails,
    labHealthClass,
    labHealthLabel,
    menuGroupIds,
    scenarioDifficultyClass,
    scenarioKindLabel,
    scenarioMenuGroupId,
    terminalCommandOptions as getTerminalCommandOptions,
    type MenuGroupId,
  } from "./labCatalog";
  import { scenarios } from "./scenarios";
  import { argocdAppGet as runArgocdAppGet, fluxReconcileKustomization as runFluxReconcileKustomization, gitopsFixApplied as isGitopsFixApplied } from "./simulators/gitops";
  import {
    azureRoleAssignmentList as runAzureRoleAssignmentList,
    iamAssumeRoleWithWebIdentity as runIamAssumeRoleWithWebIdentity,
    iamFixApplied as isIamFixApplied,
    iamKmsDecrypt as runIamKmsDecrypt,
    iamS3Cp as runIamS3Cp,
    iamSimulatePrincipalPolicy as runIamSimulatePrincipalPolicy,
    markIamScenarioSolved as markIamScenarioSolvedInRuntime,
    organizationsDescribePolicy as runOrganizationsDescribePolicy,
    scpFixApplied as isScpFixApplied,
    scpSimulatePrincipalPolicy as runScpSimulatePrincipalPolicy,
    scpSuccessNote,
  } from "./simulators/identity";
  import {
    cloudWatchDescribeAlarms as runCloudWatchDescribeAlarms,
    costAndUsage as runCostAndUsage,
    dnsAcmDescribeCertificate as runDnsAcmDescribeCertificate,
    dnsDigApp as runDnsDigApp,
    dnsFixApplied as isDnsFixApplied,
    ec2DescribeVolumes as runEc2DescribeVolumes,
    finopsFixApplied as isFinopsFixApplied,
    logsDescribeLogGroups as runLogsDescribeLogGroups,
    observabilityFixApplied as isObservabilityFixApplied,
    secretsFixApplied as isSecretsFixApplied,
    secretsManagerDescribeSecret as runSecretsManagerDescribeSecret,
    secretsSsmGetParameter as runSecretsSsmGetParameter,
  } from "./simulators/ops";
  import { kubectlDryRun as runKubectlDryRun, kyvernoTest as runKyvernoTest, policyFixApplied as isPolicyFixApplied } from "./simulators/policy";
  import {
    terragruntHclfmt as runTerragruntHclfmt,
    terragruntInit as runTerragruntInit,
    terragruntPlan as runTerragruntPlan,
    terragruntRunAllPlan as runTerragruntRunAllPlan,
    terragruntValidate as runTerragruntValidate,
  } from "./simulators/terragrunt";
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

  const scenarioIds = Object.keys(scenarios);
  const labGroups = buildLabGroups(scenarios);
  const sessionStorageKey = "terraform-sim-session";
  const sessionVersion = 10;
  const confettiColors = ["#a6e3a1", "#89b4fa", "#f9e2af", "#f38ba8", "#cba6f7", "#94e2d5"];
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
  $: leftResourceTitle = runtime.kind === "terragrunt" ? "Terragrunt Stack" : runtime.kind === "gitops" ? "GitOps" : runtime.kind === "iam" ? "IAM" : runtime.kind === "scp" ? "SCP" : runtime.kind === "secrets" ? "Secrets" : runtime.kind === "dns" ? "DNS/TLS" : runtime.kind === "observability" ? "Observability" : runtime.kind === "finops" ? "Cost" : runtime.kind === "awsconfig" ? "IaC Security" : "AWS";
  $: rightResourceTitle = runtime.kind === "terragrunt" ? "Stack State" : runtime.kind === "gitops" || runtime.kind === "iam" || runtime.kind === "scp" || runtime.kind === "secrets" || runtime.kind === "dns" || runtime.kind === "observability" || runtime.kind === "finops" || runtime.kind === "awsconfig" ? "Context" : "Terraform State";
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
      const parsed = JSON.parse(raw) as string[];
      const valid = parsed.filter((group): group is MenuGroupId => menuGroupIds.includes(group as MenuGroupId));
      return valid.length ? valid : fallback;
    } catch {
      return fallback;
    }
  }

  function scenarioMenuGroup(id: string): MenuGroupId {
    return scenarioMenuGroupId(scenarios[id].kind);
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

  function scenarioKindIds(scenario: Scenario): string[] {
    return labGroups.find((group) => group.id === scenarioMenuGroupId(scenario.kind))?.ids ?? [];
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
    return incidentDescription(runtime);
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

  function markOperationalScenarioSolved(flag: "secretsValidated" | "dnsValidated" | "observabilityValidated" | "finopsValidated" | "policyValidated" | "gitopsValidated", note: string): void {
    runtime.flags[flag] = true;
    runtime.awsResources[0].status = "exists";
    runtime.awsResources[0].note = note;
    runtime = runtime;
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
      argocdAppGet,
      fluxReconcileKustomization,
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
    const output = runCloudWatchDescribeAlarms(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function logsDescribeLogGroups(): string[] {
    const output = runLogsDescribeLogGroups(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function costAndUsage(): string[] {
    const output = runCostAndUsage(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function kyvernoTest(): string[] {
    const output = runKyvernoTest(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function kubectlDryRun(): string[] {
    const output = runKubectlDryRun(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function ec2DescribeVolumes(): string[] {
    const output = runEc2DescribeVolumes(runtime, currentScenarioId);
    runtime = runtime;
    return output;
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
    const output = runSecretsManagerDescribeSecret(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function secretsSsmGetParameter(): string[] {
    const output = runSecretsSsmGetParameter(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function dnsAcmDescribeCertificate(): string[] {
    const output = runDnsAcmDescribeCertificate(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function dnsDigApp(): string[] {
    const output = runDnsDigApp(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function iamSimulatePrincipalPolicy(): string[] {
    const output = runIamSimulatePrincipalPolicy(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function organizationsDescribePolicy(): string[] {
    return runOrganizationsDescribePolicy(runtime, currentScenarioId);
  }

  function scpSimulatePrincipalPolicy(): string[] {
    const output = runScpSimulatePrincipalPolicy(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function iamAssumeRoleWithWebIdentity(): string[] {
    const output = runIamAssumeRoleWithWebIdentity(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function iamS3Cp(): string[] {
    return runIamS3Cp(runtime, currentScenarioId);
  }

  function iamKmsDecrypt(): string[] {
    const output = runIamKmsDecrypt(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function azureRoleAssignmentList(): string[] {
    const output = runAzureRoleAssignmentList(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function terragruntInit(): string[] {
    const output = runTerragruntInit(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function terragruntValidate(): string[] {
    const output = runTerragruntValidate(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function terragruntPlan(): string[] {
    const output = runTerragruntPlan(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function terragruntRunAllPlan(): string[] {
    const output = runTerragruntRunAllPlan(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function terragruntHclfmt(): string[] {
    const output = runTerragruntHclfmt(runtime, currentScenarioId);
    runtime = runtime;
    return output;
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

    if (runtime.kind === "gitops") {
      if (!isGitopsFixApplied(runtime, currentScenarioId)) return ["Not complete: GitOps reconciliation still points at the wrong desired state or is not reconciling."];
      markOperationalScenarioSolved("gitopsValidated", "GitOps reconciliation now matches the intended desired state.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "iam") {
      if (!isIamFixApplied(runtime, currentScenarioId)) return ["Not complete: IAM policy or trust conditions are still too broad or missing required constraints."];
      markIamScenarioSolvedInRuntime(runtime, "IAM validation passed for the requested access path.");
      runtime = runtime;
      return ["Scenario complete."];
    }

    if (runtime.kind === "scp") {
      if (!isScpFixApplied(runtime, currentScenarioId)) return ["Not complete: SCP still blocks or permits the wrong organization-level action."];
      runtime.flags.scpValidated = true;
      runtime.awsResources[0].status = "exists";
      runtime.awsResources[0].note = scpSuccessNote(currentScenarioId);
      runtime = runtime;
      return ["Scenario complete."];
    }

    if (runtime.kind === "secrets") {
      if (!isSecretsFixApplied(runtime, currentScenarioId)) return ["Not complete: secret configuration still misses the required path, KMS, rotation, or decryption setting."];
      markOperationalScenarioSolved("secretsValidated", "Secrets management validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "dns") {
      if (!isDnsFixApplied(runtime, currentScenarioId)) return ["Not complete: DNS/TLS configuration still has an invalid record, alias target, certificate region, or validation value."];
      markOperationalScenarioSolved("dnsValidated", "DNS/TLS validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "observability") {
      if (!isObservabilityFixApplied(runtime, currentScenarioId)) return ["Not complete: observability configuration still has a missing retention policy or incorrect alarm signal."];
      markOperationalScenarioSolved("observabilityValidated", "Observability validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "finops") {
      if (!isFinopsFixApplied(runtime, currentScenarioId)) return ["Not complete: cost optimization configuration still misses the required cost control."];
      markOperationalScenarioSolved("finopsValidated", "FinOps validation passed.");
      return ["Scenario complete."];
    }

    if (runtime.kind === "policy") {
      if (!isPolicyFixApplied(runtime, currentScenarioId)) return ["Not complete: policy-as-code guardrail still does not enforce the required workload behavior."];
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

  function argocdAppGet(): string[] {
    const output = runArgocdAppGet(runtime, currentScenarioId);
    runtime = runtime;
    return output;
  }

  function fluxReconcileKustomization(): string[] {
    const output = runFluxReconcileKustomization(runtime, currentScenarioId);
    runtime = runtime;
    return output;
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
    if (runtime.kind === "gitops") return Boolean(runtime.flags.gitopsValidated);
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
    return getTerminalCommandOptions(runtime);
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
      <button type="button" class:active={currentPage !== "docs"} on:click={openLabs}>
        <Chemistry size={16} aria-hidden="true" />
        <span>Labs</span>
      </button>
      <button type="button" class:active={currentPage === "docs"} on:click={openDocs}>
        <Document size={16} aria-hidden="true" />
        <span>Documentation</span>
      </button>
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
    <Documentation />
  {:else if currentPage === "index"}
    <section class="lab-index" aria-label="Lab index">
      <p class="lab-index-intro">
        Remember the <span>basics</span>. Practice <span class="pill-mauve">hands-on</span>.
      </p>
      {#each labGroups as group}
        <button type="button" class="lab-index-card" on:click={() => openLabGroup(group.id)}>
          <span class="lab-index-icon" aria-hidden="true">
            <LabGroupIcon id={group.id} />
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
