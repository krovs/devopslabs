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
    if (!isCompleted(id)) completedScenarioIds = [...completedScenarioIds, id];
    manuallyUncheckedScenarioIds = manuallyUncheckedScenarioIds.filter((scenarioId) => scenarioId !== id);
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
    toggleCompletion(id: string, event: Event): void {
      event.stopPropagation();
      if (isCompleted(id)) {
        completedScenarioIds = completedScenarioIds.filter((scenarioId) => scenarioId !== id);
        if (!isManuallyUnchecked(id)) manuallyUncheckedScenarioIds = [...manuallyUncheckedScenarioIds, id];
      } else {
        markCompleted(id);
      }
      options.onChange();
    },
    markSolved(id: string): void {
      if (isCompleted(id) || isManuallyUnchecked(id)) return;
      completedScenarioIds = [...completedScenarioIds, id];
      options.onChange();
    },
    markCompleted,
  };
}
