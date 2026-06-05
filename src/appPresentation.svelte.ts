import { createAppCallbacks } from "./appCallbacks";
import type { createAppShellSession } from "./appShellSession.svelte";
import { createAppViewModel } from "./appViewModel.svelte";
import type { createLabMenuFilters } from "./labMenuFilters";
import type { createLabMenuSession } from "./labMenuSession.svelte";
import type { createLabProgress } from "./labProgress.svelte";
import type { createNetworkSession } from "./networkSession.svelte";
import type { createPersistenceSession } from "./persistenceSession.svelte";
import type { SavedSession } from "./runtimeSession";
import type { ScenarioSummary } from "./scenarioManifest";
import { createScenarioNavigation } from "./scenarioNavigation.svelte";
import type { createScenarioSession } from "./scenarioSession.svelte";
import type { createTerminalSession } from "./terminalSession.svelte";
import type { createThreatModelSession } from "./threatModelSession.svelte";
import type { createTipsSession } from "./tipsSession.svelte";

type AppPresentationOptions = {
  appShell: ReturnType<typeof createAppShellSession>;
  scenario: ReturnType<typeof createScenarioSession>;
  labMenu: ReturnType<typeof createLabMenuSession>;
  labMenuFilters: ReturnType<typeof createLabMenuFilters>;
  labProgress: ReturnType<typeof createLabProgress>;
  networkSession: ReturnType<typeof createNetworkSession>;
  threatModelSession: ReturnType<typeof createThreatModelSession>;
  terminal: ReturnType<typeof createTerminalSession>;
  tipsSession: ReturnType<typeof createTipsSession>;
  persistenceSession: ReturnType<typeof createPersistenceSession>;
  savedSession: SavedSession | null;
  scenarios: Record<string, ScenarioSummary>;
  isSolved: () => boolean;
  onSave: () => void;
};

export function createAppPresentation({
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
  isSolved,
  onSave,
}: AppPresentationOptions) {
  const view = createAppViewModel({
    appShell,
    scenario,
    labMenu,
    labMenuFilters,
    labProgress,
    tipsSession,
    scenarios,
    isSolved,
  });
  const scenarioNavigation = createScenarioNavigation({
    appShell,
    scenario,
    scenarioIds: Object.keys(scenarios),
    labMenuFilters,
    labProgress,
    networkSession,
    threatModelSession,
    terminal,
    tipsSession,
    savedSession,
    incidentMode: () => view.incidentMode,
    completedScenarioIds: () => view.completedScenarioIds,
    isSolved,
    onFlushPending: persistenceSession.flushPending,
    onSave,
  });
  const callbacks = createAppCallbacks({
    appShell,
    labMenu,
    labMenuFilters,
    tipsSession,
    incidentMode: () => view.incidentMode,
    completedScenarioIds: () => view.completedScenarioIds,
    scenarioTips: () => view.scenarioTips,
  });

  return {
    callbacks,
    scenarioNavigation,
    view,
  };
}
