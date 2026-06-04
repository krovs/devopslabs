import type { createAppShellSession } from "./appShellSession.svelte";
import type { createLabMenuFilters } from "./labMenuFilters";
import type { createLabMenuSession } from "./labMenuSession.svelte";
import type { MenuGroupId } from "./labCatalog";
import type { createTipsSession } from "./tipsSession.svelte";

export type AppCallbacksOptions = {
  appShell: ReturnType<typeof createAppShellSession>;
  labMenu: ReturnType<typeof createLabMenuSession>;
  labMenuFilters: ReturnType<typeof createLabMenuFilters>;
  tipsSession: ReturnType<typeof createTipsSession>;
  incidentMode: () => boolean;
  completedScenarioIds: () => string[];
  scenarioTips: () => string[];
};

export function createAppCallbacks(options: AppCallbacksOptions) {
  return {
    toggleMenuGroup(group: MenuGroupId): void {
      options.appShell.toggleMenuGroup(group);
    },
    filteredScenarioIds(ids: string[], query: string): string[] {
      return options.labMenuFilters.filteredScenarioIds(ids, query);
    },
    menuGroupVisible(ids: string[], query: string): boolean {
      return options.labMenuFilters.menuGroupVisible(ids, query);
    },
    groupCompletionLabel(ids: string[]): string {
      return options.labMenu.groupCompletionLabel(ids);
    },
    groupCompletionPercent(ids: string[]): number {
      return options.labMenu.groupCompletionPercent(ids);
    },
    groupCompletionState(ids: string[]): "complete" | "partial" | "empty" {
      return options.labMenu.groupCompletionState(ids);
    },
    toggleScenarioCompletion(id: string, event: Event): void {
      options.labMenu.toggleCompletion(id, event);
    },
    toggleGroupCompletion(ids: string[], event: Event): void {
      options.labMenu.toggleGroupCompletion(ids, event);
    },
    incidentDisplayTitle(id: string): string {
      return options.labMenuFilters.incidentDisplayTitle(id);
    },
    labMenuTitle(id: string): string {
      return options.labMenuFilters.labMenuTitle(id, options.incidentMode(), options.completedScenarioIds());
    },
    revealTip(): void {
      options.tipsSession.reveal(options.scenarioTips());
    },
  };
}
