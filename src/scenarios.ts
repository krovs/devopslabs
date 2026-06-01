import { scenarioManifest, scenarioSummaries, type ScenarioSummary } from "./scenarioManifest";
import { parseSimpleYaml } from "./simpleYaml";
import { validateScenario } from "./scenarioValidation";
import type { Scenario } from "./types";

const scenarioSourceModules = import.meta.glob("../scenarios/**/*.yaml", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const scenarioCache = new Map<string, Scenario>();

export const scenarios: Record<string, ScenarioSummary> = scenarioSummaries;

export async function loadScenario(id: string): Promise<Scenario> {
  const cached = scenarioCache.get(id);
  if (cached) return cached;

  const summary = scenarioSummaries[id];
  if (!summary) throw new Error(`Unknown scenario: ${id}`);

  const loadSource = scenarioSourceModules[summary.path];
  if (!loadSource) throw new Error(`Scenario source not found: ${summary.path}`);

  const scenario = parseSimpleYaml(await loadSource()) as Scenario;
  validateScenario(scenario);
  if (scenario.id !== id) throw new Error(`Scenario id mismatch: requested ${id}, loaded ${scenario.id}`);
  scenarioCache.set(id, scenario);
  return scenario;
}

export async function loadAllScenarios(): Promise<Record<string, Scenario>> {
  const entries = await Promise.all(scenarioManifest.map(async ({ id }) => [id, await loadScenario(id)] as const));
  return Object.fromEntries(entries);
}

export { validateScenario };
