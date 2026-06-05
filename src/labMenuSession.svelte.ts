export type LabMenuSessionOptions = {
  completedScenarioIds?: string[];
  manuallyUncheckedScenarioIds?: string[];
  onChange: () => void;
};

export function createLabMenuSession(options: LabMenuSessionOptions) {
  let completedScenarioIds = $state<string[]>(options.completedScenarioIds ?? []);
  let manuallyUncheckedScenarioIds = $state<string[]>(options.manuallyUncheckedScenarioIds ?? []);

  function isCompleted(id: string): boolean {
    return completedScenarioIds.includes(id);
  }

  function isManuallyUnchecked(id: string): boolean {
    return manuallyUncheckedScenarioIds.includes(id);
  }

  function markCompleted(id: string): void {
    const changed = !isCompleted(id) || isManuallyUnchecked(id);
    if (!isCompleted(id)) completedScenarioIds = [...completedScenarioIds, id];
    manuallyUncheckedScenarioIds = manuallyUncheckedScenarioIds.filter((scenarioId) => scenarioId !== id);
    if (changed) options.onChange();
  }

  return {
    get completedScenarioIds() {
      return completedScenarioIds;
    },
    get manuallyUncheckedScenarioIds() {
      return manuallyUncheckedScenarioIds;
    },
    isCompleted,
    isManuallyUnchecked,
    groupCompletionLabel(ids: string[]): string {
      const completed = ids.filter((id) => completedScenarioIds.includes(id)).length;
      return `${completed}/${ids.length}`;
    },
    groupCompletionPercent(ids: string[]): number {
      if (!ids.length) return 0;
      const completed = ids.filter((id) => completedScenarioIds.includes(id)).length;
      return Math.round((completed / ids.length) * 100);
    },
    groupCompletionState(ids: string[]): "complete" | "partial" | "empty" {
      const completed = ids.filter((id) => completedScenarioIds.includes(id)).length;
      if (completed === 0) return "empty";
      if (completed === ids.length) return "complete";
      return "partial";
    },
    toggleCompletion(id: string, event: Event): void {
      event.stopPropagation();
      if (isCompleted(id)) {
        completedScenarioIds = completedScenarioIds.filter((scenarioId) => scenarioId !== id);
        if (!isManuallyUnchecked(id)) manuallyUncheckedScenarioIds = [...manuallyUncheckedScenarioIds, id];
        options.onChange();
      } else {
        markCompleted(id);
      }
    },
    toggleGroupCompletion(ids: string[], event: Event): void {
      event.stopPropagation();
      const targetIds = ids.filter(Boolean);
      if (!targetIds.length) return;

      const allCompleted = targetIds.every((id) => completedScenarioIds.includes(id));
      if (allCompleted) {
        completedScenarioIds = completedScenarioIds.filter((id) => !targetIds.includes(id));
        manuallyUncheckedScenarioIds = [...new Set([...manuallyUncheckedScenarioIds, ...targetIds])];
      } else {
        completedScenarioIds = [...new Set([...completedScenarioIds, ...targetIds])];
        manuallyUncheckedScenarioIds = manuallyUncheckedScenarioIds.filter((id) => !targetIds.includes(id));
      }
      options.onChange();
    },
    markSolved(id: string): void {
      if (isCompleted(id)) return;
      markCompleted(id);
    },
    markCompleted,
  };
}
