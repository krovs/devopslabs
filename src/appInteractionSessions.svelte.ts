import { createCommandSession } from "./commandSession.svelte";
import { createEditorSession } from "./editorSession.svelte";
import type { createLabActionCallbacks } from "./labActions.svelte";
import type { createScenarioSession } from "./scenarioSession.svelte";
import type { AppCommandSessionRef, AppTerminalSession } from "./appTerminal.svelte";

type AppInteractionSessionsOptions = {
  scenario: ReturnType<typeof createScenarioSession>;
  terminal: AppTerminalSession;
  commandSessionRef: AppCommandSessionRef;
  labActionCallbacks: ReturnType<typeof createLabActionCallbacks>;
  onSave: () => void;
  onScheduleSave: () => void;
};

export function createAppInteractionSessions({
  scenario,
  terminal,
  commandSessionRef,
  labActionCallbacks,
  onSave,
  onScheduleSave,
}: AppInteractionSessionsOptions) {
  const commandSession = createCommandSession({
    runtime: () => scenario.runtime,
    requireRuntime: scenario.requireRuntime,
    scenarioId: () => scenario.currentId,
    activeFileName: () => scenario.activeFileName,
    refreshRuntime: scenario.refresh,
    terminal,
    onEvaluate: labActionCallbacks.onEvaluate,
    onCompleted: labActionCallbacks.onCompleted,
    onSave,
  });
  commandSessionRef.current = commandSession;

  const editorSession = createEditorSession({
    scenarioId: () => scenario.currentId,
    activeFileName: () => scenario.activeFileName,
    files: () => scenario.runtime?.files ?? {},
    selectFile: scenario.selectFile,
    updateActiveFile: scenario.updateActiveFile,
    updateFiles: scenario.updateFiles,
    addTerminalLines: labActionCallbacks.addTerminalLines,
    onEvaluate: labActionCallbacks.onEvaluate,
    onCompleted: labActionCallbacks.onCompleted,
    onSave,
    onScheduleSave,
  });

  return {
    commandSession,
    editorSession,
  };
}
