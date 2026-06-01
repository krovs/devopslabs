<script lang="ts">
  import AppMenu from "./AppMenu.svelte";
  import AppTopbar from "./AppTopbar.svelte";
  import ConfettiOverlay from "./ConfettiOverlay.svelte";
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
    getResourcePanelTitles,
  } from "./appUi";
  import { createAppShellSession } from "./appShellSession.svelte";
  import { createCommandSession } from "./commandSession.svelte";
  import { isScenarioSolved } from "./completion";
  import {
    buildLabGroups,
    labHealthClass,
    labHealthLabel,
    type MenuGroupId,
  } from "./labCatalog";
  import { createEditorSession } from "./editorSession.svelte";
  import { createLabMenuFilters } from "./labMenuFilters";
  import { createLabMenuSession } from "./labMenuSession.svelte";
  import { createNetworkSession } from "./networkSession.svelte";
  import { pageHeading as getPageHeading, pageSubheading as getPageSubheading } from "./pageChrome";
  import { createPersistenceSession } from "./persistenceSession.svelte";
  import { loadScenario as loadScenarioDefinition, scenarios } from "./scenarios";
  import { createLabProgress, getSolutionDetails } from "./labProgress.svelte";
  import { createPrReviewSession } from "./prReviewSession.svelte";
  import { getSavedSession } from "./runtimeSession";
  import { createScenarioSession } from "./scenarioSession.svelte";
  import { applyLessonSolution } from "./solutionApplier";
  import { createTerminalSession } from "./terminalSession.svelte";
  import { initialTerminalLines } from "./terminalUtils";
  import { createTipsSession } from "./tipsSession.svelte";
  import type { Scenario } from "./types";

  const scenarioIds = Object.keys(scenarios);
  const labGroups = buildLabGroups(scenarios);
  const labMenuFilters = createLabMenuFilters({ scenarios, labGroups });
  const confettiColors = ["#a6e3a1", "#89b4fa", "#f9e2af", "#f38ba8", "#cba6f7", "#94e2d5"];
  const savedSession = getSavedSession(scenarioIds);
  const initialScenarioId = savedSession?.scenarioId ?? scenarioIds[0];
  const appShell = createAppShellSession({ initialScenarioId, scenarioMenuGroup: labMenuFilters.scenarioMenuGroup });
  const initialIncidentMode = appShell.incidentMode;
  const scenario = createScenarioSession({
    initialScenarioId,
    savedSession,
    loadScenario: loadScenarioDefinition,
  });
  const labProgress = createLabProgress({ confettiColors });
  const networkSession = createNetworkSession({
    runtime: () => scenario.runtime,
    activeFileContent: () => scenario.activeFileContent,
    solved: () => isSolved(),
    refreshRuntime: scenario.refresh,
    addTerminalLines,
    onCompleted: celebrateIfScenarioCompleted,
    onSave: saveSession,
  });
  const prReviewSession = createPrReviewSession({
    runtime: () => scenario.runtime,
    refreshRuntime: scenario.refresh,
    addTerminalLines,
    onCompleted: celebrateIfScenarioCompleted,
    onSave: saveSession,
  });
  const labMenu = createLabMenuSession({
    completedScenarioIds: savedSession?.completedScenarioIds,
    manuallyUncheckedScenarioIds: savedSession?.manuallyUncheckedScenarioIds,
    onChange: saveSession,
  });
  const tipsSession = createTipsSession({
    revealedTipCount: savedSession?.revealedTipCount,
    onChange: saveSession,
  });
  const persistenceSession = createPersistenceSession({
    getSnapshot: () => {
      if (!scenario.runtime || !scenario.base) return null;
      return {
        scenarioId: scenario.currentId,
        runtime: scenario.runtime,
        baseScenario: scenario.base,
        activeFileName: scenario.activeFileName,
        terminalLines: terminal.lines,
        commandHistory: terminal.commandHistory,
        revealedTipCount: tipsSession.revealedTipCount,
        completedScenarioIds: labMenu.completedScenarioIds,
        manuallyUncheckedScenarioIds: labMenu.manuallyUncheckedScenarioIds,
      };
    },
  });
  const commandSessionRef: { current?: ReturnType<typeof createCommandSession> } = {};
  const terminal = createTerminalSession({
    lines: savedSession?.terminalLines ?? initialTerminalLines(initialIncidentMode, initialIncidentMode ? incidentDisplayTitle(initialScenarioId) : scenarios[initialScenarioId].title),
    commandHistory: savedSession?.commandHistory ?? [],
    commandOptions: () => commandSessionRef.current?.commandOptions() ?? [],
    onChange: scheduleSaveSession,
  });
  const commandSession = createCommandSession({
    runtime: () => scenario.runtime,
    requireRuntime: scenario.requireRuntime,
    scenarioId: () => scenario.currentId,
    activeFileName: () => scenario.activeFileName,
    refreshRuntime: scenario.refresh,
    terminal,
    onEvaluate: evaluateWinCondition,
    onCompleted: celebrateIfScenarioCompleted,
    onSave: saveSession,
  });
  commandSessionRef.current = commandSession;
  const editorSession = createEditorSession({
    activeFileName: () => scenario.activeFileName,
    selectFile: scenario.selectFile,
    updateActiveFile: scenario.updateActiveFile,
    updateFiles: scenario.updateFiles,
    addTerminalLines,
    onEvaluate: evaluateWinCondition,
    onCompleted: celebrateIfScenarioCompleted,
    onSave: saveSession,
    onScheduleSave: scheduleSaveSession,
  });

  let currentScenarioId = $derived(scenario.currentId);
  let runtime = $derived(scenario.runtime);
  let activeFileName = $derived(scenario.activeFileName);
  let scenarioLoading = $derived(scenario.loading);
  let scenarioLoadError = $derived(scenario.error);
  let scenarioFileNames = $derived(scenario.fileNames);
  let activeFileContent = $derived(scenario.activeFileContent);
  let incidentMode = $derived(appShell.incidentMode);
  let currentPage = $derived(appShell.currentPage);
  let completedScenarioIds = $derived(labMenu.completedScenarioIds);
  let manuallyUncheckedScenarioIds = $derived(labMenu.manuallyUncheckedScenarioIds);
  let solved = $derived(Boolean(scenario.runtime && scenario.currentId && scenario.activeFileName) && isSolved());
  let pageHeading = $derived(getPageHeading({
    page: currentPage,
    incidentMode,
    solved,
    runtime,
    scenarioTitle: scenarios[currentScenarioId].title,
    incidentTitle: incidentDisplayTitle(currentScenarioId),
  }));
  let pageSubheading = $derived(getPageSubheading({
    page: currentPage,
    incidentMode,
    solved,
    runtime,
    scenarioTitle: scenarios[currentScenarioId].title,
    incidentTitle: incidentDisplayTitle(currentScenarioId),
  }));
  let scenarioTips = $derived(scenario.runtime?.tips ?? []);
  let revealedTipCount = $derived(tipsSession.revealedTipCount);
  let visibleTips = $derived(tipsSession.visibleTips(scenarioTips));
  let resourcePanelTitles = $derived(getResourcePanelTitles(scenario.runtime?.kind));
  let leftResourceTitle = $derived(resourcePanelTitles.left);
  let rightResourceTitle = $derived(resourcePanelTitles.right);
  let solutionDetails = $derived(getSolutionDetails(runtime, currentScenarioId));

  $effect(() => {
    if (solved) labMenu.markSolved(currentScenarioId);
  });

  void loadScenarioRuntime(initialScenarioId, { restoreSavedSession: Boolean(savedSession), persist: false });

  function saveSession(): void {
    persistenceSession.save();
  }

  function scheduleSaveSession(): void {
    persistenceSession.schedule();
  }

  function scenarioMenuGroup(id: string): MenuGroupId {
    return labMenuFilters.scenarioMenuGroup(id);
  }

  function toggleMenuGroup(group: MenuGroupId): void {
    appShell.toggleMenuGroup(group);
  }

  function filteredScenarioIds(ids: string[], query: string): string[] {
    return labMenuFilters.filteredScenarioIds(ids, query);
  }

  function menuGroupVisible(ids: string[], query: string): boolean {
    return labMenuFilters.menuGroupVisible(ids, query);
  }

  function groupCompletionLabel(ids: string[]): string {
    return labMenu.groupCompletionLabel(ids);
  }

  function toggleScenarioCompletion(id: string, event: Event): void {
    labMenu.toggleCompletion(id, event);
  }

  function incidentDisplayTitle(id: string): string {
    return labMenuFilters.incidentDisplayTitle(id);
  }

  function labMenuTitle(id: string): string {
    return labMenuFilters.labMenuTitle(id, incidentMode, completedScenarioIds);
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    appShell.handleGlobalKeydown(event);
  }

  function handleGlobalPointerDown(event: PointerEvent): void {
    if (!(event.target as HTMLElement | null)?.closest(".terminal-panel")) return;
    window.setTimeout(() => terminal.focusInput(), 0);
  }

  function startTerminalResize(event: PointerEvent): void {
    appShell.startTerminalResize(event);
  }

  function resizeTerminal(event: PointerEvent): void {
    appShell.resizeTerminal(event);
  }

  function stopTerminalResize(): void {
    appShell.stopTerminalResize();
  }

  function resizeTerminalWithKeyboard(event: KeyboardEvent): void {
    appShell.resizeTerminalWithKeyboard(event);
  }

  async function loadScenarioRuntime(id: string, options: { restoreSavedSession?: boolean; persist?: boolean } = {}): Promise<void> {
    persistenceSession.flushPending();

    const group = scenarioMenuGroup(id);
    appShell.ensureMenuGroupOpen(group);

    const result = await scenario.load(id, { restoreSavedSession: options.restoreSavedSession });

    if (!result) {
      networkSession.resetForScenario();
      labProgress.resetForScenario(false);
      return;
    }

    terminal.reset(
      result.restored
        ? savedSession?.terminalLines ?? initialTerminalLines(incidentMode, incidentMode ? incidentDisplayTitle(id) : result.runtime.title)
        : initialTerminalLines(incidentMode, incidentMode ? incidentDisplayTitle(id) : result.runtime.title),
      result.restored ? savedSession?.commandHistory ?? [] : [],
    );
    tipsSession.reset(result.restored ? savedSession?.revealedTipCount ?? 0 : 0);
    networkSession.resetForScenario(result.runtime.networking?.traces?.[0]?.id ?? null);
    labProgress.resetForScenario(isSolved());
    if (options.persist ?? true) saveSession();
    void terminal.scroll();
  }

  function selectScenario(id: string): void {
    void loadScenarioRuntime(id);
    appShell.openScenario();
  }

  function openDocs(): void {
    appShell.openDocs();
  }

  function openLabs(): void {
    appShell.openLabs();
  }

  function openLabGroup(group: MenuGroupId): void {
    appShell.openLabGroup(group);
  }

  function revealTip(): void {
    tipsSession.reveal(scenarioTips);
  }

  function openSolutionModal(): void {
    labProgress.openSolutionModal();
  }

  function closeLabModal(): void {
    labProgress.closeModal();
  }

  function applySolution(): void {
    if (!runtime) return;
    applyLessonSolution({
      runtime,
      addTerminalLines,
      updateFiles: editorSession.updateFiles,
      dispatchCommand: commandSession.dispatchCommand,
      applyNetworkingSolution: () => {
        networkSession.applyControlAnswers();
        networkSession.checkScenario();
      },
      applyPrReviewSolution: () => {
        prReviewSession.applyExpectedReview();
        prReviewSession.submit();
      },
      onCompleted: celebrateIfScenarioCompleted,
      onSave: saveSession,
    });
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
    const transition = labProgress.recordSolvedTransition({
      scenarioId: currentScenarioId,
      solved,
      isCompleted: completedScenarioIds.includes(currentScenarioId),
      isManuallyUnchecked: manuallyUncheckedScenarioIds.includes(currentScenarioId),
    });
    if (transition.shouldMarkCompleted) {
      labMenu.markCompleted(currentScenarioId);
    }
  }

  function isSolved(): boolean {
    if (!runtime) return false;
    return isScenarioSolved(runtime, currentScenarioId, activeFileName);
  }

  function addTerminalLines(lines: string[]): void {
    terminal.append(lines);
    saveSession();
  }
</script>

<svelte:window onpointerdown={handleGlobalPointerDown} onpointermove={resizeTerminal} onpointerup={stopTerminalResize} onkeydown={handleGlobalKeydown} />

<ConfettiOverlay pieces={labProgress.confettiPieces} />

{#if labProgress.activeModal && runtime}
  <LabModal
    kind={labProgress.activeModal}
    title={labProgress.activeModal === "solution" ? runtime.title : scenarios[labProgress.completionScenarioId ?? currentScenarioId]?.title ?? runtime.title}
    summary={solutionDetails.summary}
    steps={solutionDetails.steps}
    commands={solutionDetails.commands}
    explanationParagraphs={solutionDetails.explanationParagraphs}
    outcome={solutionDetails.outcome}
    onclose={closeLabModal}
    onapplysolution={applySolution}
  />
{/if}

<AppMenu
  open={appShell.isMenuOpen}
  theme={appShell.theme}
  {currentPage}
  {incidentMode}
  menuSearchQuery={appShell.menuSearchQuery}
  {labGroups}
  openMenuGroups={appShell.openMenuGroups}
  {currentScenarioId}
  {completedScenarioIds}
  onclose={appShell.closeMenu}
  onthemechange={appShell.setTheme}
  onopenlabs={openLabs}
  onopendocs={openDocs}
  onincidentmodechange={appShell.setIncidentMode}
  onsearchchange={appShell.setMenuSearchQuery}
  ontogglegroup={toggleMenuGroup}
  onselectscenario={selectScenario}
  ontogglecompletion={toggleScenarioCompletion}
  groupcompletionlabel={groupCompletionLabel}
  menugroupvisible={menuGroupVisible}
  filteredscenarioids={filteredScenarioIds}
  labmenutitle={labMenuTitle}
/>

<main class:is-resizing-terminal={appShell.isResizingTerminal} class:docs-page={currentPage === "docs"} class:index-page={currentPage === "index"} class:network-page={currentPage === "labs" && runtime?.kind === "networking"} class="app-shell" style={`--terminal-height: ${appShell.terminalHeight}px`}>
  <AppTopbar
    currentPage={currentPage}
    heading={pageHeading}
    menuOpen={appShell.isMenuOpen}
    {solved}
    healthClass={runtime ? labHealthClass(solved, runtime) : "badge badge-warn"}
    healthLabel={runtime ? labHealthLabel(solved, runtime) : "Loading"}
    {incidentMode}
    onopenmenu={appShell.openMenu}
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
          selectedNodeId={networkSession.selectedNodeId}
          {solved}
          panning={networkSession.isPanning}
          panX={networkSession.panX}
          panY={networkSession.panY}
          onreset={networkSession.resetPan}
          onpointerdown={(event) => networkSession.startPan(event)}
          onpointermove={(event) => networkSession.movePan(event)}
          onpointerup={(event) => networkSession.stopPan(event)}
          onkeydown={(event) => networkSession.handleCanvasKeydown(event)}
        />

        <NetworkControlsPanel
          {incidentMode}
          {solved}
          {scenarioTips}
          {revealedTipCount}
          {visibleTips}
          requirementSections={networkSession.requirementSections}
          incidentSummary={networkSession.incidentSummary}
          traces={networkSession.traces}
          selectedTrace={networkSession.selectedTrace}
          traceResult={networkSession.traceResult}
          selectedNode={networkSession.selectedNode}
          selectedControls={networkSession.selectedControls}
          networkCheckAttempted={networkSession.checkAttempted}
          networkConfigured={runtime.flags.networkConfigured}
          symptoms={networkSession.symptoms}
          onrevealtip={revealTip}
          oncheckdesign={networkSession.checkScenario}
          onruntrace={networkSession.runTrace}
          onselecttrace={networkSession.selectTrace}
          onupdatecontrol={networkSession.updateControl}
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
        onselectfile={editorSession.selectFile}
      />

      <PrReviewPanel
        review={runtime.prReview}
        {solved}
        tips={visibleTips}
        {incidentMode}
        onsubmit={prReviewSession.submit}
        ondecision={prReviewSession.setDecision}
        ontogglefinding={prReviewSession.toggleFinding}
      />
    </section>
  {:else}
  <section class="workspace">
    <ScenarioEditor
      {activeFileName}
      fileNames={scenarioFileNames}
      content={activeFileContent}
      onsave={editorSession.saveCurrentFile}
      onselectfile={editorSession.selectFile}
      oncontentchange={editorSession.updateContent}
      oneditorkeydown={editorSession.handleKeydown}
    />

    <ScenarioResources
      {runtime}
      {scenarioTips}
      {revealedTipCount}
      {visibleTips}
      {incidentMode}
      {leftResourceTitle}
      {rightResourceTitle}
      workflowEvent={commandSession.workflowEvent()}
      workflowJob={commandSession.workflowJob()}
      workflowFailedStep={commandSession.workflowFailedStep()}
      workflowLogLines={commandSession.workflowLogLines()}
      onrevealtip={revealTip}
    />
  </section>

  <TerminalPanel
    lines={terminal.lines}
    input={terminal.input}
    oninputchange={(value) => (terminal.input = value)}
    onrun={commandSession.runCommand}
    onclear={() => {
      terminal.clear();
      saveSession();
    }}
    oncommandkeydown={(event) => terminal.handleKeydown(event)}
    onresizepointerdown={startTerminalResize}
    onresizekeydown={resizeTerminalWithKeyboard}
    outputref={(element) => terminal.setOutputElement(element)}
    inputref={(element) => terminal.setInputElement(element)}
  />
  {/if}
  {/if}
</main>
