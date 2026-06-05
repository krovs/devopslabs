import type { LabModalKind } from "./appUi";
import type { ConfettiPiece } from "./ConfettiOverlay.svelte";
import type { Scenario } from "./types";

export type LabProgressOptions = {
  confettiColors: string[];
};

export type SolvedTransition = {
  shouldMarkCompleted: boolean;
  openedCompletion: boolean;
};

export type SolutionDetails = {
  summary: string;
  steps: string[];
  commands: string[];
  explanationParagraphs: string[];
  outcome: string;
};

export function createLabProgress(options: LabProgressOptions) {
  let wasSolved = $state(false);
  let activeModal = $state<LabModalKind | null>(null);
  let completionScenarioId = $state<string | null>(null);
  let confettiPieces = $state<ConfettiPiece[]>([]);
  let confettiTimeout = $state<number | undefined>();

  function clearConfetti(): void {
    confettiPieces = [];
    if (confettiTimeout) {
      window.clearTimeout(confettiTimeout);
      confettiTimeout = undefined;
    }
  }

  function launchConfetti(): void {
    clearConfetti();

    confettiPieces = Array.from({ length: 90 }, (_, index) => ({
      id: Date.now() + index,
      left: Math.random() * 100,
      delay: Math.random() * 0.45,
      duration: 4.6 + Math.random() * 2.1,
      size: 6 + Math.random() * 7,
      color: options.confettiColors[index % options.confettiColors.length],
      rotation: Math.random() * 360,
      drift: -90 + Math.random() * 180,
    }));

    confettiTimeout = window.setTimeout(() => {
      confettiPieces = [];
      confettiTimeout = undefined;
    }, 7200);
  }

  return {
    get wasSolved() {
      return wasSolved;
    },
    get activeModal() {
      return activeModal;
    },
    get completionScenarioId() {
      return completionScenarioId;
    },
    get confettiPieces() {
      return confettiPieces;
    },
    setSolvedState(solved: boolean): void {
      wasSolved = solved;
    },
    openSolutionModal(): void {
      activeModal = "solution";
    },
    closeModal(): void {
      activeModal = null;
    },
    resetForScenario(solved: boolean): void {
      activeModal = null;
      completionScenarioId = null;
      clearConfetti();
      wasSolved = solved;
    },
    recordSolvedTransition({
      scenarioId,
      solved,
      isCompleted,
    }: {
      scenarioId: string;
      solved: boolean;
      isCompleted: boolean;
    }): SolvedTransition {
      const shouldMarkCompleted = solved && !isCompleted;
      let openedCompletion = false;

      if (solved && !wasSolved) {
        completionScenarioId = scenarioId;
        activeModal = "completion";
        launchConfetti();
        openedCompletion = true;
      }

      wasSolved = solved;
      return { shouldMarkCompleted, openedCompletion };
    },
  };
}

export function getSolutionDetails(runtime: Scenario | null, scenarioId: string): SolutionDetails {
  const solution = runtime?.solution;
  if (!solution) throw new Error(`Scenario ${scenarioId} is missing solution metadata.`);

  const explanationParagraphs = (solution.explanation ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    summary: solution.summary ?? "",
    steps: solution.steps ?? [],
    commands: solution.commands ?? [],
    explanationParagraphs,
    outcome: solution.outcome ?? "",
  };
}
