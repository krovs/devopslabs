import type { Scenario } from "./types";

export type SavedRuntimePatch = {
  files: Record<string, string>;
  backend?: Scenario["backend"];
  flags: Scenario["flags"];
  awsResources?: Scenario["awsResources"];
  stateResources?: Scenario["stateResources"];
  networkingControls?: Record<string, string>;
  threatModelControls?: Record<string, string>;
  prReview?: {
    decision?: string;
    selectedFindingIds: string[];
  };
};

export type SavedSession = {
  version: 10;
  scenarioId: string;
  runtimePatch: SavedRuntimePatch;
  activeFileName?: string;
  terminalLines: string[];
  commandHistory: string[];
  revealedTipCount: number;
  completedScenarioIds?: string[];
  manuallyUncheckedScenarioIds?: string[];
};

type LegacySavedSession = {
  version: 9;
  scenarioId: string;
  runtime: Scenario;
  mainTf: string;
  activeFileName?: string;
  terminalLines: string[];
  commandHistory: string[];
  revealedTipCount: number;
  completedScenarioIds?: string[];
  manuallyUncheckedScenarioIds?: string[];
};

export const sessionStorageKey = "terraform-sim-session";
export const sessionVersion = 10;

export function cloneScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}

export function restoreRuntime(baseScenario: Scenario, patch: SavedRuntimePatch): Scenario {
  const restored = cloneScenario(baseScenario);
  restored.files = { ...restored.files, ...patch.files };
  if (patch.backend) restored.backend = patch.backend;
  restored.flags = { ...restored.flags, ...patch.flags };
  if (patch.awsResources) restored.awsResources = patch.awsResources;
  if (patch.stateResources) restored.stateResources = patch.stateResources;

  if (restored.networking && patch.networkingControls) {
    restored.networking.controls = restored.networking.controls.map((control) => ({
      ...control,
      value: String(patch.networkingControls?.[control.id] ?? control.value),
    }));
  }

  if (restored.threatModel && patch.threatModelControls) {
    restored.threatModel.controls = restored.threatModel.controls.map((control) => ({
      ...control,
      value: patch.threatModelControls?.[control.id] ?? control.value,
    }));
  }

  if (restored.prReview && patch.prReview) {
    restored.prReview.decision = patch.prReview.decision;
    restored.prReview.findings = restored.prReview.findings.map((finding) => ({
      ...finding,
      selected: patch.prReview?.selectedFindingIds.includes(finding.id) ?? finding.selected,
    }));
  }

  return restored;
}

export function createRuntimePatch(current: Scenario, baseScenario: Scenario): SavedRuntimePatch {
  const changedFiles = Object.fromEntries(
    Object.entries(current.files).filter(([fileName, content]) => baseScenario.files[fileName] !== content),
  );
  const changedFlags = Object.fromEntries(
    Object.entries(current.flags).filter(([flag, value]) => baseScenario.flags[flag as keyof Scenario["flags"]] !== value),
  ) as Scenario["flags"];

  return {
    files: changedFiles,
    backend: valuesMatch(current.backend, baseScenario.backend) ? undefined : current.backend,
    flags: changedFlags,
    awsResources: valuesMatch(current.awsResources, baseScenario.awsResources) ? undefined : current.awsResources,
    stateResources: valuesMatch(current.stateResources, baseScenario.stateResources) ? undefined : current.stateResources,
    networkingControls: current.networking
      ? Object.fromEntries(current.networking.controls.map((control) => [control.id, control.value]))
      : undefined,
    threatModelControls: current.threatModel
      ? Object.fromEntries(current.threatModel.controls.map((control) => [control.id, control.value]))
      : undefined,
    prReview: current.prReview
      ? {
          decision: current.prReview.decision,
          selectedFindingIds: current.prReview.findings.filter((finding) => finding.selected).map((finding) => finding.id),
        }
      : undefined,
  };
}

export function getPrimaryFile(scenario: Scenario): string {
  return scenario.primaryFile ?? "main.tf";
}

export function getSavedSession(scenarioIds: string[]): SavedSession | null {
  const rawSession = localStorage.getItem(sessionStorageKey);
  if (!rawSession) return null;

  try {
    const parsed = JSON.parse(rawSession) as SavedSession | LegacySavedSession;
    if (!scenarioIds.includes(parsed.scenarioId)) return null;

    if (parsed.version === 9) {
      return null;
    }

    if (parsed.version !== sessionVersion) return null;
    if (!parsed.runtimePatch || !Array.isArray(parsed.terminalLines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistSession(session: Omit<SavedSession, "version">): void {
  localStorage.setItem(sessionStorageKey, JSON.stringify({ version: sessionVersion, ...session }));
}

export function persistCurrentSession({
  scenarioId,
  runtime,
  baseScenario,
  activeFileName,
  terminalLines,
  commandHistory,
  revealedTipCount,
  completedScenarioIds,
  manuallyUncheckedScenarioIds,
}: {
  scenarioId: string;
  runtime: Scenario;
  baseScenario: Scenario;
  activeFileName?: string;
  terminalLines: string[];
  commandHistory: string[];
  revealedTipCount: number;
  completedScenarioIds: string[];
  manuallyUncheckedScenarioIds: string[];
}): void {
  persistSession({
    scenarioId,
    runtimePatch: createRuntimePatch(runtime, baseScenario),
    activeFileName,
    terminalLines,
    commandHistory,
    revealedTipCount,
    completedScenarioIds,
    manuallyUncheckedScenarioIds,
  });
}

function valuesMatch(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
