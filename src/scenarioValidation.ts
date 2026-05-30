import type { Scenario } from "./types";

export function validateScenario(scenario: Scenario): void {
  if (!scenario.id) throw new Error("Scenario is missing id");
  if (!scenario.files || Object.keys(scenario.files).length === 0) throw new Error(`${scenario.id} is missing files`);
  if (scenario.primaryFile && !scenario.files[scenario.primaryFile]) throw new Error(`${scenario.id} primaryFile is not in files`);
  if (!scenario.backend) throw new Error(`${scenario.id} is missing backend`);
  if (!Array.isArray(scenario.awsResources)) throw new Error(`${scenario.id} is missing awsResources`);
  if (!Array.isArray(scenario.stateResources)) throw new Error(`${scenario.id} is missing stateResources`);
  if (scenario.kind === "networking" && !scenario.networking) throw new Error(`${scenario.id} is missing networking`);
  if (scenario.kind === "pr" && !scenario.prReview) throw new Error(`${scenario.id} is missing prReview`);
}
