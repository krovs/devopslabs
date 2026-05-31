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
  if (!scenario.solution) throw new Error(`${scenario.id} is missing solution`);
  if (!scenario.solution.summary) throw new Error(`${scenario.id} is missing solution summary`);
  if (!Array.isArray(scenario.solution.steps) || scenario.solution.steps.length === 0) throw new Error(`${scenario.id} is missing solution steps`);
  if (!Array.isArray(scenario.solution.commands) || scenario.solution.commands.length === 0) throw new Error(`${scenario.id} is missing solution commands`);
  if (!scenario.solution.explanation) throw new Error(`${scenario.id} is missing solution explanation`);
  if (!scenario.solution.outcome) throw new Error(`${scenario.id} is missing solution outcome`);
  if (scenario.solution.apply === "networkingControls" && scenario.kind !== "networking") throw new Error(`${scenario.id} uses networking solution apply mode outside networking`);
  if (scenario.solution.apply === "prReview" && scenario.kind !== "pr") throw new Error(`${scenario.id} uses PR solution apply mode outside PR`);
}
