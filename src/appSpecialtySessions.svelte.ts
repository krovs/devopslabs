import type { createLabActionCallbacks } from "./labActions.svelte";
import { createNetworkSession } from "./networkSession.svelte";
import { createPrReviewSession } from "./prReviewSession.svelte";
import type { createScenarioSession } from "./scenarioSession.svelte";

type AppSpecialtySessionsOptions = {
  scenario: ReturnType<typeof createScenarioSession>;
  labActionCallbacks: ReturnType<typeof createLabActionCallbacks>;
  onSave: () => void;
};

export function createAppSpecialtySessions({ scenario, labActionCallbacks, onSave }: AppSpecialtySessionsOptions) {
  const networkSession = createNetworkSession({
    runtime: () => scenario.runtime,
    activeFileContent: () => scenario.activeFileContent,
    solved: labActionCallbacks.solved,
    refreshRuntime: scenario.refresh,
    addTerminalLines: labActionCallbacks.addTerminalLines,
    onCompleted: labActionCallbacks.onCompleted,
    onSave,
  });
  const prReviewSession = createPrReviewSession({
    runtime: () => scenario.runtime,
    refreshRuntime: scenario.refresh,
    addTerminalLines: labActionCallbacks.addTerminalLines,
    onCompleted: labActionCallbacks.onCompleted,
    onSave,
  });

  return {
    networkSession,
    prReviewSession,
  };
}
