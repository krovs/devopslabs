import type { createAppShellSession } from "./appShellSession.svelte";
import type { createLabMenuFilters } from "./labMenuFilters";
import type { createLabProgress } from "./labProgress.svelte";
import type { MenuGroupId } from "./labCatalog";
import type { createNetworkSession } from "./networkSession.svelte";
import type { SavedSession } from "./runtimeSession";
import type { createScenarioSession, ScenarioSessionLoadOptions } from "./scenarioSession.svelte";
import type { createTerminalSession } from "./terminalSession.svelte";
import { initialTerminalLines } from "./terminalUtils";
import type { createTipsSession } from "./tipsSession.svelte";

export type ScenarioNavigationLoadOptions = ScenarioSessionLoadOptions & {
  persist?: boolean;
};

export type ScenarioNavigationOptions = {
  appShell: ReturnType<typeof createAppShellSession>;
  scenario: ReturnType<typeof createScenarioSession>;
  labMenuFilters: ReturnType<typeof createLabMenuFilters>;
  labProgress: ReturnType<typeof createLabProgress>;
  networkSession: ReturnType<typeof createNetworkSession>;
  terminal: ReturnType<typeof createTerminalSession>;
  tipsSession: ReturnType<typeof createTipsSession>;
  savedSession: SavedSession | null;
  incidentMode: () => boolean;
  isSolved: () => boolean;
  onFlushPending: () => void;
  onSave: () => void;
};

export function createScenarioNavigation(options: ScenarioNavigationOptions) {
  async function load(id: string, loadOptions: ScenarioNavigationLoadOptions = {}): Promise<void> {
    options.onFlushPending();

    const group = options.labMenuFilters.scenarioMenuGroup(id);
    options.appShell.ensureMenuGroupOpen(group);

    const result = await options.scenario.load(id, { restoreSavedSession: loadOptions.restoreSavedSession });

    if (!result) {
      options.networkSession.resetForScenario();
      options.labProgress.resetForScenario(false);
      return;
    }

    const incidentMode = options.incidentMode();
    const initialLines = initialTerminalLines(
      incidentMode,
      incidentMode ? options.labMenuFilters.incidentDisplayTitle(id) : result.runtime.title,
    );

    options.terminal.reset(
      result.restored ? options.savedSession?.terminalLines ?? initialLines : initialLines,
      result.restored ? options.savedSession?.commandHistory ?? [] : [],
    );
    options.tipsSession.reset(result.restored ? options.savedSession?.revealedTipCount ?? 0 : 0);
    options.networkSession.resetForScenario(result.runtime.networking?.traces?.[0]?.id ?? null);
    options.labProgress.resetForScenario(options.isSolved());
    if (loadOptions.persist ?? true) options.onSave();
    void options.terminal.scroll();
  }

  return {
    load,
    selectScenario(id: string): void {
      void load(id);
      options.appShell.openScenario();
    },
    openDocs(): void {
      options.appShell.openDocs();
    },
    openLabs(): void {
      options.appShell.openLabs();
    },
    openLabGroup(group: MenuGroupId): void {
      options.appShell.openLabGroup(group);
    },
  };
}
