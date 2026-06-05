import { isScenarioSolved } from "./completion";
import type { createCommandSession } from "./commandSession.svelte";
import type { createEditorSession } from "./editorSession.svelte";
import type { createLabMenuSession } from "./labMenuSession.svelte";
import type { createLabProgress } from "./labProgress.svelte";
import type { createNetworkSession } from "./networkSession.svelte";
import type { createPrReviewSession } from "./prReviewSession.svelte";
import type { createScenarioSession } from "./scenarioSession.svelte";
import { applyLessonSolution } from "./solutionApplier";
import type { createTerminalSession } from "./terminalSession.svelte";
import type { createThreatModelSession } from "./threatModelSession.svelte";

export type LabActionsOptions = {
  scenario: ReturnType<typeof createScenarioSession>;
  labMenu: ReturnType<typeof createLabMenuSession>;
  labProgress: ReturnType<typeof createLabProgress>;
  networkSession: ReturnType<typeof createNetworkSession>;
  prReviewSession: ReturnType<typeof createPrReviewSession>;
  threatModelSession: ReturnType<typeof createThreatModelSession>;
  editorSession: ReturnType<typeof createEditorSession>;
  commandSession: ReturnType<typeof createCommandSession>;
  terminal: ReturnType<typeof createTerminalSession>;
  onSave: () => void;
};

export type LabActions = ReturnType<typeof createLabActions>;

export function createLabActionsRef() {
  const ref: { current?: LabActions } = {};

  return {
    set(actions: LabActions): void {
      ref.current = actions;
    },
    get<Key extends keyof LabActions>(key: Key): LabActions[Key] {
      if (!ref.current) throw new Error("Lab actions are not initialized.");
      return ref.current[key];
    },
  };
}

export function createLabActionCallbacks(labActionsRef: ReturnType<typeof createLabActionsRef>) {
  return {
    solved(): boolean {
      return labActionsRef.get("isSolved")();
    },
    addTerminalLines(lines: string[]): void {
      labActionsRef.get("addTerminalLines")(lines);
    },
    onCompleted(): void {
      labActionsRef.get("celebrateIfScenarioCompleted")();
    },
    onEvaluate(): void {
      labActionsRef.get("evaluateWinCondition")();
    },
  };
}

export function createLabActions(options: LabActionsOptions) {
  function isSolved(): boolean {
    if (!options.scenario.runtime) return false;
    return isScenarioSolved(options.scenario.runtime, options.scenario.currentId, options.scenario.activeFileName);
  }

  function addTerminalLines(lines: string[]): void {
    options.terminal.append(lines);
    options.onSave();
  }

  function celebrateIfScenarioCompleted(): void {
    const solved = isSolved();
    const transition = options.labProgress.recordSolvedTransition({
      scenarioId: options.scenario.currentId,
      solved,
      isCompleted: options.labMenu.completedScenarioIds.includes(options.scenario.currentId),
    });
    if (transition.shouldMarkCompleted) {
      options.labMenu.markCompleted(options.scenario.currentId);
    }
  }

  return {
    isSolved,
    addTerminalLines,
    celebrateIfScenarioCompleted,
    openSolutionModal(): void {
      if (
        options.scenario.runtime &&
        !isSolved() &&
        !options.labMenu.completedScenarioIds.includes(options.scenario.currentId)
      ) {
        options.scenario.runtime.flags.solutionViewed = true;
        options.scenario.refresh();
        options.onSave();
      }
      options.labProgress.openSolutionModal();
    },
    closeLabModal(): void {
      options.labProgress.closeModal();
    },
    applySolution(): void {
      if (!options.scenario.runtime) return;
      applyLessonSolution({
        runtime: options.scenario.runtime,
        addTerminalLines,
        updateFiles: options.editorSession.updateFiles,
        dispatchCommand: options.commandSession.dispatchCommand,
        applyNetworkingSolution: () => {
          options.networkSession.applyControlAnswers();
          options.networkSession.checkScenario();
        },
        applyPrReviewSolution: () => {
          options.prReviewSession.applyExpectedReview();
          options.prReviewSession.submit();
        },
        applyThreatModelSolution: () => {
          options.threatModelSession.applyControlAnswers();
          options.threatModelSession.reviewScenario();
        },
        onCompleted: celebrateIfScenarioCompleted,
        onSave: options.onSave,
      });
    },
    evaluateWinCondition(): void {
      if (!options.scenario.runtime) return;
      if (isSolved()) return;
      if (options.scenario.runtime.flags.cleanPlan && !options.scenario.runtime.backend.locked) {
        if (options.scenario.currentId === "interruptedApplyLock" && options.scenario.runtime.flags.importedBucket) return;
        if (options.scenario.currentId === "missingIamImport" && options.scenario.runtime.flags.importedRole) return;
        if (options.scenario.currentId === "manualSecurityGroupDrift") return;
      }
    },
  };
}
