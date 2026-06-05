import { incidentDescription, menuGroupIds, scenarioKindLabel, scenarioMenuGroupId, type MenuGroupId, type ScenarioCatalogItem } from "./labCatalog";
import type { Scenario } from "./types";

export type ThemeName = "latte" | "mocha" | "dracula" | "cyberpunk";
export type AppPage = "index" | "labs";
export type LabModalKind = "solution" | "completion";

const resourceTitleByKind: Partial<Record<NonNullable<Scenario["kind"]>, string>> = {
  terragrunt: "Terragrunt Stack",
  gitops: "GitOps",
  kubernetes: "Kubernetes",
  iam: "IAM",
  scp: "SCP",
  secrets: "Secrets",
  dns: "DNS/TLS",
  observability: "Observability",
  finops: "Cost",
  awsconfig: "IaC Security",
  policy: "Policy",
  linux: "Linux",
  networking: "Network",
  threatmodel: "Threat Model",
};

const contextualStateKinds = new Set<Scenario["kind"]>([
  "terragrunt",
  "gitops",
  "kubernetes",
  "iam",
  "scp",
  "secrets",
  "dns",
  "observability",
  "finops",
  "awsconfig",
  "policy",
  "linux",
  "networking",
  "threatmodel",
]);

export function getInitialTheme(): ThemeName {
  const savedTheme = localStorage.getItem("terraform-sim-theme");
  if (savedTheme === "latte" || savedTheme === "mocha" || savedTheme === "dracula" || savedTheme === "cyberpunk") return savedTheme;
  if (savedTheme === "dark") return "mocha";
  if (savedTheme === "light") return "latte";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "mocha" : "latte";
}

export function getInitialIncidentMode(): boolean {
  return localStorage.getItem("terraform-sim-incident-mode") === "true";
}

export function getInitialOpenMenuGroups(currentScenarioId: string, scenarioMenuGroup: (id: string) => MenuGroupId): MenuGroupId[] {
  const fallback: MenuGroupId[] = [scenarioMenuGroup(currentScenarioId)];
  const raw = localStorage.getItem("terraform-sim-open-menu-groups");
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((group): group is MenuGroupId => menuGroupIds.includes(group as MenuGroupId));
    return valid.length ? valid : fallback;
  } catch {
    return fallback;
  }
}

export function getInitialTerminalHeight(clampTerminalHeight: (height: number) => number): number {
  const savedHeight = Number(localStorage.getItem("terraform-sim-terminal-height"));
  if (Number.isFinite(savedHeight) && savedHeight > 0) return clampTerminalHeight(savedHeight);
  return 260;
}

export function clampTerminalHeight(height: number): number {
  const maxHeight = Math.max(220, Math.floor(window.innerHeight * 0.72));
  return Math.min(maxHeight, Math.max(150, height));
}

export function getResourcePanelTitles(kind: Scenario["kind"]): { left: string; right: string } {
  return {
    left: resourceTitleByKind[kind ?? "terraform"] ?? "AWS",
    right: contextualStateKinds.has(kind) ? "Context" : "Terraform State",
  };
}

export function scenarioMenuGroupForScenario(scenario: ScenarioCatalogItem): MenuGroupId {
  return scenarioMenuGroupId(scenario.kind);
}

export function getIncidentDisplayTitle(scenario: ScenarioCatalogItem, scenarioIds: string[]): string {
  const index = Math.max(0, scenarioIds.indexOf(scenario.id)) + 1;
  return `${scenarioKindLabel(scenario)} Incident ${index}`;
}

export function getPageDescription(page: AppPage, incidentMode: boolean, solved: boolean, runtime: Scenario): string {
  if (page === "index") return "Choose a lab. Completed scenarios are marked in the list.";
  if (!incidentMode || solved) return runtime.description;
  return incidentDescription(runtime);
}
