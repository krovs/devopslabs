import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSimpleYaml } from "../src/simpleYaml.ts";
import { validateScenario } from "../src/scenarioValidation.ts";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const scenariosDir = join(rootDir, "scenarios");

const files = (await readdir(scenariosDir)).filter((file) => file.endsWith(".yaml")).sort();
const ids = new Set();
const failures = [];

for (const file of files) {
  try {
    const source = await readFile(join(scenariosDir, file), "utf8");
    const scenario = parseSimpleYaml(source);
    validateScenario(scenario);

    if (ids.has(scenario.id)) {
      throw new Error(`duplicate scenario id ${scenario.id}`);
    }
    ids.add(scenario.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${file}: ${message}`);
  }
}

if (failures.length) {
  console.error(`Scenario validation failed: ${failures.length}/${files.length} invalid`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Scenario validation passed: ${files.length} scenarios, ${ids.size} unique IDs`);
