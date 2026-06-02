import type { createAppViewModel } from "./appViewModel.svelte";
import type { createLabMenuSession } from "./labMenuSession.svelte";
import type { SavedSession } from "./runtimeSession";
import type { createScenarioNavigation } from "./scenarioNavigation.svelte";

type AppLifecycleOptions = {
  labMenu: ReturnType<typeof createLabMenuSession>;
  scenarioNavigation: ReturnType<typeof createScenarioNavigation>;
  view: ReturnType<typeof createAppViewModel>;
  initialScenarioId: string;
  savedSession: SavedSession | null;
};

export function startAppLifecycle({
  labMenu,
  scenarioNavigation,
  view,
  initialScenarioId,
  savedSession,
}: AppLifecycleOptions): void {
  $effect(() => {
    if (view.solved) labMenu.markSolved(view.currentScenarioId);
  });

  void scenarioNavigation.load(initialScenarioId, { restoreSavedSession: Boolean(savedSession), persist: false });
}
