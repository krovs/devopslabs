import { parseRoute, replaceRoute, type Route } from "./appRouter";
import { buildLabGroups, type ScenarioCatalogItem } from "./labCatalog";
import { createLabMenuFilters } from "./labMenuFilters";
import { getSavedSession } from "./runtimeSession";

const confettiColors = ["#a6e3a1", "#89b4fa", "#f9e2af", "#f38ba8", "#cba6f7", "#94e2d5"];

export function createAppBootstrap(scenarios: Record<string, ScenarioCatalogItem>) {
  const scenarioIds = Object.keys(scenarios);
  const labGroups = buildLabGroups(scenarios);
  const labMenuFilters = createLabMenuFilters({ scenarios, labGroups });
  const savedSession = getSavedSession(scenarioIds);
  const route = parseRoute(window.location.pathname, new Set(scenarioIds));

  let initialPage: Route["page"];
  let initialScenarioId: string;

  if (route) {
    initialPage = route.page;
    initialScenarioId = route.page === "labs" ? route.scenarioId : scenarioIds[0];
  } else {
    initialPage = savedSession ? "labs" : "index";
    initialScenarioId = savedSession?.scenarioId ?? scenarioIds[0];
  }

  return {
    confettiColors,
    initialPage,
    initialScenarioId,
    labGroups,
    labMenuFilters,
    savedSession,
  };
}
