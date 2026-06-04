import type { Scenario, ThreatModelControl, ThreatModelNode } from "./types";

export const defaultThreatModelFindings = ["Threat model coverage is incomplete.", "Review data flows, trust boundaries, STRIDE categories, and mitigations."];

export function getSelectedThreatModelControls(scenario: Scenario, node: ThreatModelNode | null): ThreatModelControl[] {
  if (!scenario.threatModel || !node) return [];
  return scenario.threatModel.controls.filter((control) =>
    control.nodeId?.split(",").map((id) => id.trim()).includes(node.id),
  );
}

export function threatModelControlsSolved(scenario: Scenario): boolean {
  return Boolean(scenario.threatModel?.controls.every((control) => control.value === control.answer));
}

export function controlOptions(options: string): string[] {
  return options.split(",").map((option) => option.trim()).filter(Boolean);
}

