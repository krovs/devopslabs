import type { createLabMenuSession } from "./labMenuSession.svelte";
import { createPersistenceSession, type PersistSnapshot } from "./persistenceSession.svelte";
import type { createScenarioSession } from "./scenarioSession.svelte";
import type { createTerminalSession } from "./terminalSession.svelte";
import type { createTipsSession } from "./tipsSession.svelte";

type AppPersistenceOptions = {
  scenario: ReturnType<typeof createScenarioSession>;
  labMenu: ReturnType<typeof createLabMenuSession>;
  terminal: ReturnType<typeof createTerminalSession>;
  tipsSession: ReturnType<typeof createTipsSession>;
};

export function createAppPersistenceSession(options: AppPersistenceOptions) {
  return createPersistenceSession({
    getSnapshot: createAppPersistenceSnapshot(options),
  });
}

function createAppPersistenceSnapshot({
  scenario,
  labMenu,
  terminal,
  tipsSession,
}: AppPersistenceOptions): () => PersistSnapshot | null {
  return () => {
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
  };
}
