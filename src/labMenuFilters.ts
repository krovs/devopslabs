import { getIncidentDisplayTitle } from "./appUi";
import { scenarioKindLabel, scenarioMenuGroupId, type LabGroup, type MenuGroupId, type ScenarioCatalogItem } from "./labCatalog";

const kindSubLabels: Partial<Record<NonNullable<ScenarioCatalogItem["kind"]>, string>> = {
  terraform: "Terraform",
  terragrunt: "Terragrunt",
  cloudformation: "CloudFormation",
  cicd: "CI/CD",
  pr: "Pull Request Review",
  kubernetes: "Kubernetes",
  policy: "Policy as Code",
  iam: "IAM",
  secrets: "Secrets",
  observability: "Observability",
  finops: "FinOps",
  networking: "Networking",
  dns: "DNS & TLS",
};

export type LabMenuFilterOptions = {
  scenarios: Record<string, ScenarioCatalogItem>;
  labGroups: LabGroup[];
};

export function createLabMenuFilters({ scenarios, labGroups }: LabMenuFilterOptions) {
  function scenarioMenuGroup(id: string): MenuGroupId {
    return scenarioMenuGroupId(scenarios[id].kind);
  }

  function scenarioKindIds(scenario: ScenarioCatalogItem): string[] {
    return labGroups.find((group) => group.id === scenarioMenuGroupId(scenario.kind))?.ids ?? [];
  }

  function incidentDisplayTitle(id: string): string {
    const scenario = scenarios[id];
    return getIncidentDisplayTitle(scenario, scenarioKindIds(scenario));
  }

  function filteredScenarioIds(ids: string[], query: string): string[] {
    const queryTokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!queryTokens.length) return ids;
    return ids.filter((id) => {
      const scenario = scenarios[id];
      const searchable = `${scenario.title} ${id} ${scenario.description} ${scenarioKindLabel(scenario)}`.toLowerCase();
      return queryTokens.every((token) => searchable.includes(token));
    });
  }

  return {
    scenarioMenuGroup,
    incidentDisplayTitle,
    filteredScenarioIds,
    menuGroupVisible(ids: string[], query: string): boolean {
      return filteredScenarioIds(ids, query).length > 0;
    },
    subgroupedScenarioIds(groupId: MenuGroupId, ids: string[], query: string): { kind: string; label: string; ids: string[] }[] {
      const filtered = filteredScenarioIds(ids, query);
      const grouped = new Map<string, string[]>();
      for (const id of filtered) {
        const kind = scenarios[id].kind ?? "terraform";
        const list = grouped.get(kind) ?? [];
        list.push(id);
        grouped.set(kind, list);
      }
      const entries = [...grouped.entries()];
      if (entries.length <= 1) return entries.map(([kind, ids]) => ({ kind, label: kindSubLabels[kind as keyof typeof kindSubLabels] ?? kind, ids }));
      return entries.map(([kind, ids]) => ({ kind, label: kindSubLabels[kind as keyof typeof kindSubLabels] ?? kind, ids }));
    },
    labMenuTitle(id: string, incidentMode: boolean, completedScenarioIds: string[]): string {
      if (incidentMode && !completedScenarioIds.includes(id)) return incidentDisplayTitle(id);
      return scenarios[id].title;
    },
  };
}
