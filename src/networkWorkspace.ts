import type { NetworkNode, NetworkTrace, Scenario } from "./types";

export const defaultNetworkSymptoms = ["Connectivity test failed.", "Review routing, addressing, and policy controls."];

export type RequirementSections = {
  goal: string[];
  constraints: string[];
};

export function getSelectedTrace(traces: NetworkTrace[], traceId: string | null): NetworkTrace | null {
  if (traceId) {
    const trace = traces.find((item) => item.id === traceId);
    if (trace) return trace;
  }
  return traces[0] ?? null;
}

export function getSelectedNetworkControls(scenario: Scenario, node: NetworkNode | null) {
  if (!scenario.networking || !node) return [];
  return scenario.networking.controls.filter((control) => {
    return control.nodeId?.split(",").map((id) => id.trim()).includes(node.id) ?? false;
  });
}

export function parseRequirementSections(text: string): RequirementSections {
  const lines = text.split("\n");
  const goal: string[] = [];
  const constraints: string[] = [];
  let section: "goal" | "constraints" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "Goal:") {
      section = "goal";
      continue;
    }
    if (trimmed === "Constraints:") {
      section = "constraints";
      continue;
    }

    if (section === "goal") goal.push(trimmed.replace(/^- /, ""));
    if (section === "constraints") constraints.push(trimmed.replace(/^- /, ""));
  }

  return { goal, constraints };
}
