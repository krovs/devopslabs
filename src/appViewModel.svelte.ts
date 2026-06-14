import { getResourcePanelTitles } from "./appUi";
import type { createAppShellSession } from "./appShellSession.svelte";
import type { createLabMenuFilters } from "./labMenuFilters";
import type { createLabMenuSession } from "./labMenuSession.svelte";
import type { createLabProgress, SolutionDetails } from "./labProgress.svelte";
import { getSolutionDetails } from "./labProgress.svelte";
import { pageHeading as getPageHeading } from "./pageChrome";
import type { ScenarioSummary } from "./scenarioManifest";
import type { createScenarioSession } from "./scenarioSession.svelte";
import type { createTipsSession } from "./tipsSession.svelte";
import type { Scenario } from "./types";

export type AppViewModelOptions = {
  appShell: ReturnType<typeof createAppShellSession>;
  scenario: ReturnType<typeof createScenarioSession>;
  labMenu: ReturnType<typeof createLabMenuSession>;
  labMenuFilters: ReturnType<typeof createLabMenuFilters>;
  labProgress: ReturnType<typeof createLabProgress>;
  tipsSession: ReturnType<typeof createTipsSession>;
  scenarios: Record<string, ScenarioSummary>;
  isSolved: () => boolean;
};

export function createAppViewModel(options: AppViewModelOptions) {
  let currentScenarioId = $derived(options.scenario.currentId);
  let runtime = $derived(options.scenario.runtime);
  let activeFileName = $derived(options.scenario.activeFileName);
  let scenarioLoading = $derived(options.scenario.loading);
  let scenarioLoadError = $derived(options.scenario.error);
  let scenarioFileNames = $derived(options.scenario.fileNames);
  let activeFileContent = $derived(options.scenario.activeFileContent);
  let incidentMode = $derived(options.appShell.incidentMode);
  let currentPage = $derived(options.appShell.currentPage);
  let completedScenarioIds = $derived(options.labMenu.completedScenarioIds);
  let manuallyUncheckedScenarioIds = $derived(options.labMenu.manuallyUncheckedScenarioIds);
  let referenceKind = $derived(options.scenarios[currentScenarioId]?.kind ?? runtime?.kind);
  let solved = $derived(Boolean(options.scenario.runtime && options.scenario.currentId && options.scenario.activeFileName) && options.isSolved());
  let pageHeading = $derived(getPageHeading({
    page: currentPage,
    incidentMode,
    solved,
    runtime,
    scenarioTitle: options.scenarios[currentScenarioId].title,
    incidentTitle: options.labMenuFilters.incidentDisplayTitle(currentScenarioId),
  }));
  let scenarioTips = $derived(options.scenario.runtime?.tips ?? []);
  let revealedTipCount = $derived(options.tipsSession.revealedTipCount);
  let visibleTips = $derived(options.tipsSession.visibleTips(scenarioTips));
  let resourcePanelTitles = $derived(getResourcePanelTitles(options.scenario.runtime?.kind));
  let modalKind = $derived(runtime ? options.labProgress.activeModal : null);
  let modalTitle = $derived(runtime ? modalTitleFor(runtime, currentScenarioId, options.labProgress.completionScenarioId, options.scenarios, modalKind) : "");
  let solutionDetails = $derived<SolutionDetails | null>(runtime ? getSolutionDetails(runtime, currentScenarioId) : null);

  return {
    get currentScenarioId() {
      return currentScenarioId;
    },
    get runtime() {
      return runtime;
    },
    get activeFileName() {
      return activeFileName;
    },
    get scenarioLoading() {
      return scenarioLoading;
    },
    get scenarioLoadError() {
      return scenarioLoadError;
    },
    get scenarioFileNames() {
      return scenarioFileNames;
    },
    get activeFileContent() {
      return activeFileContent;
    },
    get incidentMode() {
      return incidentMode;
    },
    get currentPage() {
      return currentPage;
    },
    get referenceKind() {
      return referenceKind;
    },
    get completedScenarioIds() {
      return completedScenarioIds;
    },
    get manuallyUncheckedScenarioIds() {
      return manuallyUncheckedScenarioIds;
    },
    get solved() {
      return solved;
    },
    get pageHeading() {
      return pageHeading;
    },
    get scenarioTips() {
      return scenarioTips;
    },
    get revealedTipCount() {
      return revealedTipCount;
    },
    get visibleTips() {
      return visibleTips;
    },
    get leftResourceTitle() {
      return resourcePanelTitles.left;
    },
    get rightResourceTitle() {
      return resourcePanelTitles.right;
    },
    get modalKind() {
      return modalKind;
    },
    get modalTitle() {
      return modalTitle;
    },
    get solutionDetails() {
      return solutionDetails;
    },
  };
}

function modalTitleFor(
  runtime: Scenario,
  currentScenarioId: string,
  completionScenarioId: string | null,
  scenarios: Record<string, ScenarioSummary>,
  modalKind: string | null,
): string {
  if (modalKind === "solution") return runtime.title;
  return scenarios[completionScenarioId ?? currentScenarioId]?.title ?? runtime.title;
}
