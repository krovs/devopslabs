import { createAppBootstrap } from "./appBootstrap";
import { createAppInteractionSessions } from "./appInteractionSessions.svelte";
import { createAppLearningSessions } from "./appLearningSessions.svelte";
import { startAppLifecycle } from "./appLifecycle.svelte";
import { createAppPresentation } from "./appPresentation.svelte";
import { createAppShellSession } from "./appShellSession.svelte";
import { createAppSpecialtySessions } from "./appSpecialtySessions.svelte";
import { createAppTerminalSession } from "./appTerminal.svelte";
import { createLabActions } from "./labActions.svelte";
import { createAppPersistenceSession } from "./appPersistence.svelte";
import { loadScenario as loadScenarioDefinition, scenarios } from "./scenarios";
import { createScenarioSession } from "./scenarioSession.svelte";

export type AppController = ReturnType<typeof createAppController>;

export function createAppController() {
  const { confettiColors, initialScenarioId, labGroups, labMenuFilters, savedSession } = createAppBootstrap(scenarios);
  const appShell = createAppShellSession({ initialScenarioId, scenarioMenuGroup: labMenuFilters.scenarioMenuGroup });
  const initialIncidentMode = appShell.incidentMode;
  const scenario = createScenarioSession({
    initialScenarioId,
    savedSession,
    loadScenario: loadScenarioDefinition,
  });
  const { labActionCallbacks, labActionsRef, labMenu, labProgress, tipsSession } = createAppLearningSessions({
    confettiColors,
    savedSession,
    onSave: saveSession,
  });
  const { networkSession, prReviewSession, threatModelSession } = createAppSpecialtySessions({
    scenario,
    labActionCallbacks,
    onSave: saveSession,
  });
  const { commandSessionRef, terminal } = createAppTerminalSession({
    savedSession,
    initialIncidentMode,
    initialScenarioTitle: scenarios[initialScenarioId].title,
    initialIncidentTitle: labMenuFilters.incidentDisplayTitle(initialScenarioId),
    onChange: scheduleSaveSession,
  });
  const persistenceSession = createAppPersistenceSession({ scenario, labMenu, terminal, tipsSession });
  const { commandSession, editorSession } = createAppInteractionSessions({
    scenario,
    terminal,
    commandSessionRef,
    labActionCallbacks,
    onSave: saveSession,
    onScheduleSave: scheduleSaveSession,
  });
  const labActions = createLabActions({
    scenario,
    labMenu,
    labProgress,
    networkSession,
    prReviewSession,
    threatModelSession,
    editorSession,
    commandSession,
    terminal,
    onSave: saveSession,
  });
  labActionsRef.set(labActions);

  const { callbacks, scenarioNavigation, view } = createAppPresentation({
    appShell,
    scenario,
    labMenu,
    labMenuFilters,
    labProgress,
    networkSession,
    threatModelSession,
    terminal,
    tipsSession,
    persistenceSession,
    savedSession,
    scenarios,
    isSolved: labActions.isSolved,
    onSave: saveSession,
  });

  startAppLifecycle({ labMenu, scenarioNavigation, view, initialScenarioId, savedSession });

  function saveSession(): void {
    persistenceSession.save();
  }

  function scheduleSaveSession(): void {
    persistenceSession.schedule();
  }

  return {
    appShell,
    callbacks,
    commandSession,
    editorSession,
    labActions,
    labGroups,
    labProgress,
    networkSession,
    prReviewSession,
    threatModelSession,
    scenarioNavigation,
    saveSession,
    terminal,
    view,
  };
}
