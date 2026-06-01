import type { Scenario } from "./types";

export type SolutionApplierOptions = {
  runtime: Scenario;
  addTerminalLines: (lines: string[]) => void;
  updateFiles: (patches: Record<string, string>, focusFileName?: string) => void;
  dispatchCommand: (command: string, runtime: Scenario) => string[];
  applyNetworkingSolution: () => void;
  applyPrReviewSolution: () => void;
  onCompleted: () => void;
  onSave: () => void;
};

export function applyLessonSolution({
  runtime,
  addTerminalLines,
  updateFiles,
  dispatchCommand,
  applyNetworkingSolution,
  applyPrReviewSolution,
  onCompleted,
  onSave,
}: SolutionApplierOptions): void {
  const lessonSolution = runtime.solution;
  if (!lessonSolution) {
    addTerminalLines(["No auto-apply solution is configured for this lab."]);
    onSave();
    return;
  }

  if (lessonSolution.apply === "networkingControls" && runtime.networking) {
    applyNetworkingSolution();
    onSave();
    return;
  }

  if (lessonSolution.apply === "prReview" && runtime.prReview) {
    applyPrReviewSolution();
    onSave();
    return;
  }

  const filePatches = { ...(lessonSolution.files ?? {}) };
  for (const replacement of lessonSolution.replacements ?? []) {
    const currentContent = filePatches[replacement.fileName] ?? runtime.files[replacement.fileName] ?? "";
    if (!currentContent.includes(replacement.search)) {
      if (currentContent.includes(replacement.replace)) continue;

      addTerminalLines([`Solution patch could not be applied to ${replacement.fileName}.`]);
      onSave();
      return;
    }
    filePatches[replacement.fileName] = currentContent.replace(replacement.search, replacement.replace);
  }

  if (Object.keys(filePatches).length) {
    updateFiles(filePatches, lessonSolution.focusFileName);
  }

  const commandOutput = (lessonSolution.commands ?? []).flatMap((command) => [
    `$ ${command}`,
    ...dispatchCommand(command, runtime),
  ]);
  if (commandOutput.length) addTerminalLines(commandOutput);

  onCompleted();
  onSave();
}
