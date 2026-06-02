import { buildLabGroups, type ScenarioCatalogItem } from "./labCatalog";
import { createLabMenuFilters } from "./labMenuFilters";
import { getSavedSession } from "./runtimeSession";

const confettiColors = ["#a6e3a1", "#89b4fa", "#f9e2af", "#f38ba8", "#cba6f7", "#94e2d5"];

export function createAppBootstrap(scenarios: Record<string, ScenarioCatalogItem>) {
  const scenarioIds = Object.keys(scenarios);
  const labGroups = buildLabGroups(scenarios);
  const labMenuFilters = createLabMenuFilters({ scenarios, labGroups });
  const savedSession = getSavedSession(scenarioIds);
  const initialScenarioId = savedSession?.scenarioId ?? scenarioIds[0];

  return {
    confettiColors,
    initialScenarioId,
    labGroups,
    labMenuFilters,
    savedSession,
  };
}
