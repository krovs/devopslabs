<script lang="ts">
  import { tick } from "svelte";
  import AppMenu from "./AppMenu.svelte";
  import AppTopbar from "./AppTopbar.svelte";
  import ConfettiOverlay, { type ConfettiPiece } from "./ConfettiOverlay.svelte";
  import Documentation from "./Documentation.svelte";
  import LabModal from "./LabModal.svelte";
  import LabIndex from "./LabIndex.svelte";
  import NetworkControlsPanel from "./NetworkControlsPanel.svelte";
  import PrDiffPanel from "./PrDiffPanel.svelte";
  import PrReviewPanel from "./PrReviewPanel.svelte";
  import NetworkDiagramPanel from "./NetworkDiagramPanel.svelte";
  import ScenarioEditor from "./ScenarioEditor.svelte";
  import ScenarioResources from "./ScenarioResources.svelte";
  import TerminalPanel from "./TerminalPanel.svelte";
  import {
    clampTerminalHeight,
    getIncidentDisplayTitle,
    getInitialIncidentMode,
    getInitialOpenMenuGroups,
    getInitialTerminalHeight,
    getInitialTheme,
    getPageDescription as getAppPageDescription,
    getResourcePanelTitles,
    scenarioMenuGroupForScenario,
    type AppPage,
    type LabModalKind,
    type ThemeName,
  } from "./appUi";
  import { createCommandHandlers } from "./commandHandlers";
  import { dispatchCommand as dispatchSimulatorCommand } from "./commands";
  import { isScenarioSolved, prReviewIsCorrect as runtimePrReviewIsCorrect } from "./completion";
  import {
    workflowEvent as getWorkflowEvent,
    workflowFailedStep as getWorkflowFailedStep,
    workflowJob as getWorkflowJob,
    workflowLogLines as getWorkflowLogLines,
  } from "./simulators/cicd";
  import {
    buildLabGroups,
    labGroupDetails,
    labHealthClass,
    labHealthLabel,
    scenarioKindLabel,
    terminalCommandOptions as getTerminalCommandOptions,
    type MenuGroupId,
    type ScenarioCatalogItem,
  } from "./labCatalog";
  import {
    defaultNetworkSymptoms,
    getSelectedNetworkControls,
    getSelectedTrace,
    parseRequirementSections,
  } from "./networkWorkspace";
  import { loadScenario as loadScenarioDefinition, scenarios } from "./scenarios";
  import { cloneScenario, getPrimaryFile, getSavedSession, persistCurrentSession, restoreRuntime } from "./runtimeSession";
  import { completeTerminalInput as getTerminalInputCompletion, initialTerminalLines } from "./terminalUtils";
  import type { Scenario } from "./types";

  const scenarioIds = Object.keys(scenarios);
  const labGroups = buildLabGroups(scenarios);
  const confettiColors = ["#a6e3a1", "#89b4fa", "#f9e2af", "#f38ba8", "#cba6f7", "#94e2d5"];
  const savedSession = getSavedSession(scenarioIds);
  const initialScenarioId = savedSession?.scenarioId ?? scenarioIds[0];
  const initialIncidentMode = getInitialIncidentMode();
  let currentScenarioId = $state(initialScenarioId);
  let baseScenario = $state<Scenario | null>(null);
  let runtime = $state<Scenario | null>(null);
  let activeFileName = $state(savedSession?.activeFileName ?? "");
  let incidentMode = $state(initialIncidentMode);
  let terminalLines = $state(savedSession?.terminalLines ?? initialTerminalLines(initialIncidentMode, initialIncidentMode ? incidentDisplayTitle(initialScenarioId) : scenarios[initialScenarioId].title));
  let terminalInput = $state("");
  let terminalOutput = $state<HTMLPreElement | undefined>();
  let terminalInputElement = $state<HTMLInputElement | undefined>();
  let commandHistory = $state<string[]>(savedSession?.commandHistory ?? []);
  let revealedTipCount = $state(savedSession?.revealedTipCount ?? 0);
  let completedScenarioIds = $state<string[]>(savedSession?.completedScenarioIds ?? []);
  let manuallyUncheckedScenarioIds = $state<string[]>(savedSession?.manuallyUncheckedScenarioIds ?? []);
  let historyIndex = $state(-1);
  let theme = $state<ThemeName>(getInitialTheme());
  let terminalHeight = $state(getInitialTerminalHeight(clampTerminalHeight));
  let isResizingTerminal = $state(false);
  let isMenuOpen = $state(false);
  let menuSearchQuery = $state("");
  let openMenuGroups = $state<MenuGroupId[]>(getInitialOpenMenuGroups(initialScenarioId, scenarioMenuGroup));
  let currentPage = $state<AppPage>("index");
  let selectedNetworkNodeId = $state<string | null>(null);
  let selectedTraceId = $state<string | null>(null);
  let traceResult = $state<string[]>([]);
  let networkCheckAttempted = $state(false);
  let scenarioLoading = $state(true);
  let scenarioLoadError = $state<string | null>(null);
  let scenarioLoadToken = 0;
  let networkPanX = $state(0);
  let networkPanY = $state(0);
  let isPanningNetwork = $state(false);
  let networkPanStartX = $state(0);
  let networkPanStartY = $state(0);
  let networkPanOriginX = $state(0);
  let networkPanOriginY = $state(0);
  let networkDragDistance = $state(0);
  let networkPointerNodeId = $state<string | null>(null);
  let wasSolved = $state(false);
  let activeLabModal = $state<LabModalKind | null>(null);
  let completionModalScenarioId = $state<string | null>(null);
  let confettiPieces = $state<ConfettiPiece[]>([]);
  let confettiTimeout = $state<number | undefined>();
  let saveSessionTimeout = $state<number | undefined>();
  const terminalCommandHandlers = createCommandHandlers({
    runtime: requireRuntime,
    scenarioId: () => currentScenarioId,
    activeFileName: () => activeFileName,
    refreshRuntime: () => (runtime = runtime),
  });

  let solved = $derived(Boolean(runtime && currentScenarioId && activeFileName) && isSolved());
  let pageHeading = $derived(currentPage === "docs" ? "Documentation" : currentPage === "index" ? "DevOpsLabs" : incidentMode && !solved ? incidentDisplayTitle(currentScenarioId) : runtime?.title ?? scenarios[currentScenarioId].title);
  let pageSubheading = $derived(runtime ? getPageDescription(solved) : "Loading scenario content.");
  let scenarioTips = $derived(runtime?.tips ?? []);
  let visibleTips = $derived(scenarioTips.slice(0, revealedTipCount));
  let scenarioFileNames = $derived(runtime ? Object.keys(runtime.files) : []);
  let activeFileContent = $derived(runtime?.files[activeFileName] ?? "");
  let resourcePanelTitles = $derived(getResourcePanelTitles(runtime?.kind));
  let leftResourceTitle = $derived(resourcePanelTitles.left);
  let rightResourceTitle = $derived(resourcePanelTitles.right);
  let selectedNetworkNode = $derived(runtime?.networking?.nodes.find((node) => node.id === selectedNetworkNodeId) ?? null);
  let networkingRequirementSections = $derived(parseRequirementSections(runtime?.files[activeFileName] ?? ""));
  let selectedNetworkControls = $derived(runtime ? getSelectedNetworkControls(runtime, selectedNetworkNode) : []);
  let networkTraces = $derived(runtime?.networking?.traces ?? []);
  let selectedTrace = $derived(getSelectedTrace(networkTraces, selectedTraceId));

  $effect(() => {
    if (solved && !completedScenarioIds.includes(currentScenarioId) && !manuallyUncheckedScenarioIds.includes(currentScenarioId)) {
      completedScenarioIds = [...completedScenarioIds, currentScenarioId];
      saveSession();
    }
  });

  $effect(() => {
    document.body.classList.toggle("dark-mode", theme === "mocha");
    document.body.classList.toggle("dracula-mode", theme === "dracula");
    document.body.classList.toggle("cyberpunk-mode", theme === "cyberpunk");
    localStorage.setItem("terraform-sim-theme", theme);
    localStorage.setItem("terraform-sim-incident-mode", String(incidentMode));
    localStorage.setItem("terraform-sim-open-menu-groups", JSON.stringify(openMenuGroups));
  });

  void loadScenarioRuntime(initialScenarioId, { restoreSavedSession: Boolean(savedSession), persist: false });

  function requireRuntime(): Scenario {
    if (!runtime) throw new Error("Scenario runtime is not loaded.");
    return runtime;
  }

  function saveSession(): void {
    if (!runtime || !baseScenario) return;
    if (saveSessionTimeout) {
      window.clearTimeout(saveSessionTimeout);
      saveSessionTimeout = undefined;
    }

    persistCurrentSession({
      scenarioId: currentScenarioId,
      runtime,
      baseScenario,
      activeFileName,
      terminalLines,
      commandHistory,
      revealedTipCount,
      completedScenarioIds,
      manuallyUncheckedScenarioIds,
    });
  }

  function scheduleSaveSession(): void {
    if (saveSessionTimeout) window.clearTimeout(saveSessionTimeout);
    saveSessionTimeout = window.setTimeout(saveSession, 300);
  }

  function scenarioMenuGroup(id: string): MenuGroupId {
    return scenarioMenuGroupForScenario(scenarios[id]);
  }

  function toggleMenuGroup(group: MenuGroupId): void {
    openMenuGroups = openMenuGroups.includes(group)
      ? openMenuGroups.filter((item) => item !== group)
      : [...openMenuGroups, group];
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

  function scenarioKindIds(scenario: ScenarioCatalogItem): string[] {
    return labGroups.find((group) => group.id === scenarioMenuGroupForScenario(scenario))?.ids ?? [];
  }

  function incidentDisplayTitle(id: string): string {
    const scenario = scenarios[id];
    const ids = scenarioKindIds(scenario);
    return getIncidentDisplayTitle(scenario, ids);
  }

  function labMenuTitle(id: string): string {
    if (incidentMode && !completedScenarioIds.includes(id)) return incidentDisplayTitle(id);
    return scenarios[id].title;
  }

  function getPageDescription(solvedState: boolean): string {
    return runtime ? getAppPageDescription(currentPage, incidentMode, solvedState, runtime) : "Loading scenario content.";
  }

  function networkingIncidentSummary(): string[] {
    return runtime?.networking?.symptoms ?? defaultNetworkSymptoms;
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") isMenuOpen = false;
  }

  function handleGlobalPointerDown(event: PointerEvent): void {
    if (!(event.target as HTMLElement | null)?.closest(".terminal-panel")) return;
    window.setTimeout(() => focusTerminalInput(), 0);
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

  async function loadScenarioRuntime(id: string, options: { restoreSavedSession?: boolean; persist?: boolean } = {}): Promise<void> {
    if (saveSessionTimeout) saveSession();

    const loadToken = ++scenarioLoadToken;
    currentScenarioId = id;
    const group = scenarioMenuGroup(id);
    if (!openMenuGroups.includes(group)) openMenuGroups = [...openMenuGroups, group];
    scenarioLoading = true;
    scenarioLoadError = null;
    runtime = null;

    try {
      const scenario = await loadScenarioDefinition(id);
      if (loadToken !== scenarioLoadToken) return;

      baseScenario = scenario;
      runtime = options.restoreSavedSession && savedSession?.scenarioId === id
        ? restoreRuntime(scenario, savedSession.runtimePatch)
        : cloneScenario(scenario);
      activeFileName = options.restoreSavedSession && savedSession?.activeFileName && runtime.files[savedSession.activeFileName]
        ? savedSession.activeFileName
        : getPrimaryFile(runtime);
      terminalLines = options.restoreSavedSession
        ? savedSession?.terminalLines ?? initialTerminalLines(incidentMode, incidentMode ? incidentDisplayTitle(id) : runtime.title)
        : initialTerminalLines(incidentMode, incidentMode ? incidentDisplayTitle(id) : runtime.title);
      commandHistory = options.restoreSavedSession ? savedSession?.commandHistory ?? [] : [];
      revealedTipCount = options.restoreSavedSession ? savedSession?.revealedTipCount ?? 0 : 0;
      selectedTraceId = runtime.networking?.traces?.[0]?.id ?? null;
      wasSolved = isSolved();
      if (options.persist ?? true) saveSession();
      scrollTerminal();
    } catch (error) {
      if (loadToken !== scenarioLoadToken) return;
      scenarioLoadError = error instanceof Error ? error.message : String(error);
    } finally {
      if (loadToken === scenarioLoadToken) scenarioLoading = false;
    }

    historyIndex = -1;
    selectedNetworkNodeId = null;
    traceResult = [];
    networkCheckAttempted = false;
    activeLabModal = null;
    completionModalScenarioId = null;
    confettiPieces = [];
    if (confettiTimeout) window.clearTimeout(confettiTimeout);
    resetNetworkPan();
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
    void loadScenarioRuntime(id);
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
    if (!runtime) return;
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

  function handleTerminalKeydown(event: KeyboardEvent): void {
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
  }

  function updateNetworkControl(controlId: string, value: string): void {
    if (!runtime?.networking) return;
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
    if (!runtime?.networking) return;
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

  function selectNetworkTrace(traceId: string): void {
    selectedTraceId = traceId;
    traceResult = [];
  }

  function setPrDecision(decision: "approve" | "request_changes"): void {
    if (!runtime?.prReview) return;
    runtime.prReview.decision = decision;
    runtime.flags.reviewPassed = false;
    runtime.awsResources[0].status = "failed";
    runtime.awsResources[0].note = "Review decision has not passed validation.";
    runtime = runtime;
    saveSession();
  }

  function togglePrFinding(findingId: string): void {
    if (!runtime?.prReview) return;
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
    if (!runtime?.prReview) return;
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
    if (!runtime) return false;
    return runtimePrReviewIsCorrect(runtime);
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

  function selectFile(fileName: string): void {
    activeFileName = fileName;
    saveSession();
  }

  function runCommand(): void {
    if (!runtime) return;
    const input = terminalInput.trim();
    if (!input) return;

    commandHistory = [...commandHistory, input];
    historyIndex = commandHistory.length;
    terminalLines = [...terminalLines, `$ ${input}`, ...dispatchSimulatorCommand(input, runtime, terminalCommandHandlers)];
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
    if (!runtime) return;
    runtime.files = { ...runtime.files, ...patches };
    if (focusFileName && runtime.files[focusFileName] !== undefined) {
      activeFileName = focusFileName;
    }
    runtime = runtime;
  }

  function applySolution(): void {
    if (!runtime) return;
    const lessonSolution = runtime.solution;
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

    const currentRuntime = runtime;
    const commandOutput = (lessonSolution.commands ?? []).flatMap((command) => [
      `$ ${command}`,
      ...dispatchSimulatorCommand(command, currentRuntime, terminalCommandHandlers),
    ]);
    if (commandOutput.length) addTerminalLines(commandOutput);

    celebrateIfScenarioCompleted();
    saveSession();
  }

  function evaluateWinCondition(): void {
    if (!runtime) return;
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
    if (!runtime) return false;
    return isScenarioSolved(runtime, currentScenarioId, activeFileName);
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
    const solution = runtime?.solution;
    if (!solution) throw new Error(`Scenario ${currentScenarioId} is missing solution metadata.`);
    return solution;
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
    if (!runtime) return [];
    return getTerminalCommandOptions(runtime);
  }

  function completeTerminalInput(): void {
    const completion = getTerminalInputCompletion(terminalInput, terminalCommandOptions());
    terminalInput = completion.value;
    if (completion.completions.length) {
      addTerminalLines(["Completions:", ...completion.completions.map((match) => `  ${match}`)]);
      focusTerminalInput();
    }
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

  function workflowEvent(): string {
    return getWorkflowEvent(currentScenarioId);
  }

  function workflowJob(): string {
    return getWorkflowJob(currentScenarioId);
  }

  function workflowFailedStep(): string {
    if (!runtime) return "";
    return getWorkflowFailedStep(runtime, currentScenarioId);
  }

  function workflowLogLines(): string[] {
    if (!runtime) return [];
    return getWorkflowLogLines(runtime, currentScenarioId);
  }
</script>

<svelte:window onpointerdown={handleGlobalPointerDown} onpointermove={resizeTerminal} onpointerup={stopTerminalResize} onkeydown={handleGlobalKeydown} />

<ConfettiOverlay pieces={confettiPieces} />

{#if activeLabModal && runtime}
  <LabModal
    kind={activeLabModal}
    title={activeLabModal === "solution" ? runtime.title : scenarios[completionModalScenarioId ?? currentScenarioId]?.title ?? runtime.title}
    summary={solutionSummary()}
    steps={solutionSteps()}
    commands={solutionCommands()}
    explanationParagraphs={completionExplanationParagraphs()}
    outcome={completionOutcome()}
    onclose={closeLabModal}
    onapplysolution={applySolution}
  />
{/if}

<AppMenu
  open={isMenuOpen}
  {theme}
  {currentPage}
  {incidentMode}
  {menuSearchQuery}
  {labGroups}
  {openMenuGroups}
  {currentScenarioId}
  {completedScenarioIds}
  onclose={() => (isMenuOpen = false)}
  onthemechange={(nextTheme) => (theme = nextTheme)}
  onopenlabs={openLabs}
  onopendocs={openDocs}
  onincidentmodechange={(enabled) => {
    incidentMode = enabled;
    openMenuGroups = [...openMenuGroups];
  }}
  onsearchchange={(query) => (menuSearchQuery = query)}
  ontogglegroup={toggleMenuGroup}
  onselectscenario={selectScenario}
  ontogglecompletion={toggleScenarioCompletion}
  groupcompletionlabel={groupCompletionLabel}
  menugroupvisible={menuGroupVisible}
  filteredscenarioids={filteredScenarioIds}
  labmenutitle={labMenuTitle}
/>

<main class:is-resizing-terminal={isResizingTerminal} class:docs-page={currentPage === "docs"} class:index-page={currentPage === "index"} class:network-page={currentPage === "labs" && runtime?.kind === "networking"} class="app-shell" style={`--terminal-height: ${terminalHeight}px`}>
  <AppTopbar
    currentPage={currentPage}
    heading={pageHeading}
    menuOpen={isMenuOpen}
    {solved}
    healthClass={runtime ? labHealthClass(solved, runtime) : "badge badge-warn"}
    healthLabel={runtime ? labHealthLabel(solved, runtime) : "Loading"}
    {incidentMode}
    onopenmenu={() => (isMenuOpen = true)}
    onopensolution={openSolutionModal}
    onreset={() => void loadScenarioRuntime(currentScenarioId)}
  />

  {#if currentPage === "docs"}
    <Documentation />
  {:else if currentPage === "index"}
    <LabIndex
      {labGroups}
      groupcompletionlabel={groupCompletionLabel}
      onopenlabgroup={openLabGroup}
    />
  {:else}
  {#if scenarioLoading || !runtime}
    <section class="workspace">
      <section class="panel editor-panel">
        <div class="panel-header">
          <h2>{scenarioLoadError ? "Scenario failed to load" : "Loading lab"}</h2>
        </div>
        <p>{scenarioLoadError ?? "Loading scenario content."}</p>
      </section>
    </section>
  {:else if runtime.kind === "networking" && runtime.networking}
    <section class="networking-workspace">
      <div class="network-main-row">
        <NetworkDiagramPanel
          networking={runtime.networking}
          selectedNodeId={selectedNetworkNodeId}
          {solved}
          panning={isPanningNetwork}
          panX={networkPanX}
          panY={networkPanY}
          onreset={resetNetworkPan}
          onpointerdown={startNetworkPan}
          onpointermove={moveNetworkPan}
          onpointerup={stopNetworkPan}
          onkeydown={handleNetworkCanvasKeydown}
        />

        <NetworkControlsPanel
          {incidentMode}
          {solved}
          {scenarioTips}
          {revealedTipCount}
          {visibleTips}
          requirementSections={networkingRequirementSections}
          incidentSummary={networkingIncidentSummary()}
          traces={networkTraces}
          {selectedTrace}
          {traceResult}
          selectedNode={selectedNetworkNode}
          selectedControls={selectedNetworkControls}
          {networkCheckAttempted}
          networkConfigured={runtime.flags.networkConfigured}
          symptoms={runtime.networking.symptoms ?? defaultNetworkSymptoms}
          onrevealtip={revealTip}
          oncheckdesign={checkNetworkingScenario}
          onruntrace={runNetworkTrace}
          onselecttrace={selectNetworkTrace}
          onupdatecontrol={updateNetworkControl}
        />
      </div>
    </section>
  {:else if runtime.kind === "pr" && runtime.prReview}
    <section class="pr-workspace">
      <PrDiffPanel
        {activeFileName}
        fileNames={scenarioFileNames}
        content={activeFileContent}
        prNumber={runtime.prReview.number}
        {solved}
        onselectfile={selectFile}
      />

      <PrReviewPanel
        review={runtime.prReview}
        {solved}
        tips={visibleTips}
        {incidentMode}
        onsubmit={submitPrReview}
        ondecision={setPrDecision}
        ontogglefinding={togglePrFinding}
      />
    </section>
  {:else}
  <section class="workspace">
    <ScenarioEditor
      {activeFileName}
      fileNames={scenarioFileNames}
      content={activeFileContent}
      onsave={saveCurrentFile}
      onselectfile={selectFile}
      oncontentchange={updateMainTf}
      oneditorkeydown={handleEditorKeydown}
    />

    <ScenarioResources
      {runtime}
      {scenarioTips}
      {revealedTipCount}
      {visibleTips}
      {incidentMode}
      {leftResourceTitle}
      {rightResourceTitle}
      workflowEvent={workflowEvent()}
      workflowJob={workflowJob()}
      workflowFailedStep={workflowFailedStep()}
      workflowLogLines={workflowLogLines()}
      onrevealtip={revealTip}
    />
  </section>

  <TerminalPanel
    lines={terminalLines}
    input={terminalInput}
    oninputchange={(value) => (terminalInput = value)}
    onrun={runCommand}
    onclear={() => {
      terminalLines = [];
      saveSession();
    }}
    oncommandkeydown={handleTerminalKeydown}
    onresizepointerdown={startTerminalResize}
    onresizekeydown={resizeTerminalWithKeyboard}
    outputref={(element) => (terminalOutput = element)}
    inputref={(element) => (terminalInputElement = element)}
  />
  {/if}
  {/if}
</main>
