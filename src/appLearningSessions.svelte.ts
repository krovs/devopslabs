import { createLabActionCallbacks, createLabActionsRef } from "./labActions.svelte";
import { createLabMenuSession } from "./labMenuSession.svelte";
import { createLabProgress } from "./labProgress.svelte";
import type { SavedSession } from "./runtimeSession";
import { createTipsSession } from "./tipsSession.svelte";

type AppLearningSessionsOptions = {
  confettiColors: string[];
  savedSession: SavedSession | null;
  onSave: () => void;
};

export function createAppLearningSessions({ confettiColors, savedSession, onSave }: AppLearningSessionsOptions) {
  const labProgress = createLabProgress({ confettiColors });
  const labActionsRef = createLabActionsRef();
  const labActionCallbacks = createLabActionCallbacks(labActionsRef);
  const labMenu = createLabMenuSession({
    completedScenarioIds: savedSession?.completedScenarioIds,
    manuallyUncheckedScenarioIds: savedSession?.manuallyUncheckedScenarioIds,
    onChange: onSave,
  });
  const tipsSession = createTipsSession({
    revealedTipCount: savedSession?.revealedTipCount,
    onChange: onSave,
  });

  return {
    labActionCallbacks,
    labActionsRef,
    labMenu,
    labProgress,
    tipsSession,
  };
}
