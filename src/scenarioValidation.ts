import type { Scenario } from "./types";

export function validateScenario(scenario: Scenario): void {
  if (!scenario.id) throw new Error("Scenario is missing id");
  if (!scenario.files || Object.keys(scenario.files).length === 0) throw new Error(`${scenario.id} is missing files`);
  if (scenario.tips && !scenario.tips.every((tip) => typeof tip === "string")) throw new Error(`${scenario.id} has a non-string tip`);
  if (scenario.primaryFile && !scenario.files[scenario.primaryFile]) throw new Error(`${scenario.id} primaryFile is not in files`);
  if (!scenario.backend) throw new Error(`${scenario.id} is missing backend`);
  if (!Array.isArray(scenario.awsResources)) throw new Error(`${scenario.id} is missing awsResources`);
  if (!Array.isArray(scenario.stateResources)) throw new Error(`${scenario.id} is missing stateResources`);
  if (scenario.kind === "networking" && !scenario.networking) throw new Error(`${scenario.id} is missing networking`);
  if (scenario.kind === "threatmodel" && !scenario.threatModel) throw new Error(`${scenario.id} is missing threatModel`);
  if (scenario.kind === "pr" && !scenario.prReview) throw new Error(`${scenario.id} is missing prReview`);
  if (!scenario.solution) throw new Error(`${scenario.id} is missing solution`);
  if (!scenario.solution.summary) throw new Error(`${scenario.id} is missing solution summary`);
  if (!Array.isArray(scenario.solution.steps) || scenario.solution.steps.length === 0) throw new Error(`${scenario.id} is missing solution steps`);
  if (!scenario.solution.steps.every((step) => typeof step === "string")) throw new Error(`${scenario.id} has a non-string solution step`);
  if (!Array.isArray(scenario.solution.commands) || scenario.solution.commands.length === 0) throw new Error(`${scenario.id} is missing solution commands`);
  if (!scenario.solution.commands.every((command) => typeof command === "string")) throw new Error(`${scenario.id} has a non-string solution command`);
  if (!scenario.solution.explanation) throw new Error(`${scenario.id} is missing solution explanation`);
  if (!scenario.solution.outcome) throw new Error(`${scenario.id} is missing solution outcome`);
  if (scenario.solution.apply === "networkingControls" && scenario.kind !== "networking") throw new Error(`${scenario.id} uses networking solution apply mode outside networking`);
  if (scenario.solution.apply === "prReview" && scenario.kind !== "pr") throw new Error(`${scenario.id} uses PR solution apply mode outside PR`);
  if (scenario.solution.apply === "threatModelControls" && scenario.kind !== "threatmodel") throw new Error(`${scenario.id} uses threat model solution apply mode outside threat modeling`);
}
