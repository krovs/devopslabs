import {
  defaultNetworkSymptoms,
  getSelectedNetworkControls,
  getSelectedTrace,
  parseRequirementSections,
} from "./networkWorkspace";
import type { NetworkControl, Scenario } from "./types";

export type NetworkSessionOptions = {
  runtime: () => Scenario | null;
  activeFileContent: () => string;
  solved: () => boolean;
  refreshRuntime: () => void;
  addTerminalLines: (lines: string[]) => void;
  onCompleted: () => void;
  onSave: () => void;
};

export function createNetworkSession(options: NetworkSessionOptions) {
  let selectedNodeId = $state<string | null>(null);
  let selectedTraceId = $state<string | null>(null);
  let traceResult = $state<string[]>([]);
  let checkAttempted = $state(false);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStartX = $state(0);
  let panStartY = $state(0);
  let panOriginX = $state(0);
  let panOriginY = $state(0);
  let dragDistance = $state(0);
  let pointerNodeId = $state<string | null>(null);

  let networking = $derived(options.runtime()?.networking ?? null);
  let selectedNode = $derived(networking?.nodes.find((node) => node.id === selectedNodeId) ?? null);
  let requirementSections = $derived(parseRequirementSections(options.activeFileContent()));
  let selectedControls = $derived(options.runtime() ? getSelectedNetworkControls(options.runtime() as Scenario, selectedNode) : []);
  let traces = $derived(networking?.traces ?? []);
  let selectedTrace = $derived(getSelectedTrace(traces, selectedTraceId));
  let incidentSummary = $derived(networking?.symptoms ?? defaultNetworkSymptoms);
  let symptoms = $derived(networking?.symptoms ?? defaultNetworkSymptoms);

  function resetPan(): void {
    panX = 0;
    panY = 0;
    isPanning = false;
  }

  function resetForScenario(traceId?: string | null): void {
    selectedNodeId = null;
    selectedTraceId = traceId ?? null;
    traceResult = [];
    checkAttempted = false;
    resetPan();
  }

  function clampPan(value: number): number {
    return Math.max(-260, Math.min(260, value));
  }

  function controlsAreSolved(runtime: Scenario): boolean {
    return Boolean(runtime.networking?.controls.every((control) => String(control.value).trim() === String(control.answer).trim()));
  }

  function controlIsSolved(control: { value: string; answer: string }): boolean {
    return String(control.value).trim() === String(control.answer).trim();
  }

  function traceSegmentLines(runtime: Scenario, steps: string[]): string[] {
    if (!runtime.networking) return [];

    const lines: string[] = [];
    const nodeIdByLabel = new Map(runtime.networking.nodes.map((node) => [node.label, node.id]));
    const controlsById = new Map(runtime.networking.controls.map((control) => [control.id, control]));

    for (let index = 0; index < steps.length - 1; index += 1) {
      const fromLabel = steps[index];
      const toLabel = steps[index + 1];
      const from = nodeIdByLabel.get(fromLabel);
      const to = nodeIdByLabel.get(toLabel);
      const segment = `${fromLabel} -> ${toLabel}`;
      const link = runtime.networking.links.find((item) => item.from === from && item.to === to);

      if (!link) {
        lines.push(`INFO ${segment}: no modeled link.`);
        continue;
      }

      const controlIds = link.controlIds?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
      const controls = controlIds.map((id) => controlsById.get(id)).filter((control): control is NetworkControl => Boolean(control));
      if (!controls.length) {
        lines.push(`PASS ${segment}: ${link.label}.`);
        continue;
      }

      const failedControls = controls.filter((control) => !controlIsSolved(control));
      if (!failedControls.length) {
        lines.push(`PASS ${segment}: ${controls.map((control) => control?.label).join(", ")}.`);
        continue;
      }

      lines.push(`FAIL ${segment}: ${link.label}.`);
      for (const control of failedControls) {
        if (!control) continue;
        lines.push(`  - ${control.label}: current ${String(control.value).trim()}, expected ${String(control.answer).trim()}`);
      }
    }

    return lines;
  }

  return {
    get selectedNodeId() {
      return selectedNodeId;
    },
    get selectedTraceId() {
      return selectedTraceId;
    },
    get traceResult() {
      return traceResult;
    },
    get checkAttempted() {
      return checkAttempted;
    },
    get panX() {
      return panX;
    },
    get panY() {
      return panY;
    },
    get isPanning() {
      return isPanning;
    },
    get selectedNode() {
      return selectedNode;
    },
    get requirementSections() {
      return requirementSections;
    },
    get selectedControls() {
      return selectedControls;
    },
    get traces() {
      return traces;
    },
    get selectedTrace() {
      return selectedTrace;
    },
    get incidentSummary() {
      return incidentSummary;
    },
    get symptoms() {
      return symptoms;
    },
    resetPan,
    resetForScenario,
    startPan(event: PointerEvent): void {
      if (event.button !== 0) return;
      isPanning = true;
      dragDistance = 0;
      pointerNodeId = (event.target as HTMLElement).closest<HTMLElement>(".network-node")?.dataset.nodeId ?? null;
      panStartX = event.clientX;
      panStartY = event.clientY;
      panOriginX = panX;
      panOriginY = panY;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    movePan(event: PointerEvent): void {
      if (!isPanning) return;
      const deltaX = event.clientX - panStartX;
      const deltaY = event.clientY - panStartY;
      dragDistance = Math.max(dragDistance, Math.hypot(deltaX, deltaY));
      panX = clampPan(panOriginX + deltaX);
      panY = clampPan(panOriginY + deltaY);
    },
    stopPan(event: PointerEvent): void {
      if (!isPanning) return;
      isPanning = false;
      if (dragDistance <= 5 && pointerNodeId) selectedNodeId = pointerNodeId;
      pointerNodeId = null;
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    },
    handleCanvasKeydown(event: KeyboardEvent): void {
      if (event.key !== "Home" && event.key !== "Escape") return;
      event.preventDefault();
      resetPan();
    },
    updateControl(controlId: string, value: string): void {
      const runtime = options.runtime();
      if (!runtime?.networking) return;
      runtime.networking.controls = runtime.networking.controls.map((control) =>
        control.id === controlId ? { ...control, value } : control,
      );
      runtime.flags.networkConfigured = false;
      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Network design has pending validation.";
      options.refreshRuntime();
      checkAttempted = false;
      traceResult = [];
      options.onSave();
    },
    checkScenario(): void {
      const runtime = options.runtime();
      if (!runtime?.networking) return;
      const solved = controlsAreSolved(runtime);
      runtime.flags.networkConfigured = solved;
      runtime.awsResources[0].status = solved ? "exists" : "failed";
      runtime.awsResources[0].note = solved
        ? "Network design matches the scenario requirements."
        : "Some route or attachment settings still do not match the requirements.";
      options.refreshRuntime();
      checkAttempted = true;
      options.addTerminalLines([solved ? "Networking scenario complete." : "Networking check failed. Review the symptom log."]);
      options.onCompleted();
      options.onSave();
    },
    selectTrace(traceId: string): void {
      selectedTraceId = traceId;
      traceResult = [];
    },
    runTrace(): void {
      const runtime = options.runtime();
      if (!selectedTrace || !runtime?.networking) return;

      const steps = selectedTrace.path.split("|").map((step) => step.trim()).filter(Boolean);
      const segmentLines = traceSegmentLines(runtime, steps);
      const result = controlsAreSolved(runtime)
        ? `PASS: ${selectedTrace.success ?? "Packet path completed without policy or routing drops."}`
        : `FAIL: ${selectedTrace.failure}`;

      traceResult = [
        `Probe: ${selectedTrace.source} -> ${selectedTrace.destination} tcp/${selectedTrace.port}`,
        ...segmentLines,
        result,
      ];
    },
    applyControlAnswers(): void {
      const runtime = options.runtime();
      if (!runtime?.networking) return;
      runtime.networking.controls = runtime.networking.controls.map((control) => ({
        ...control,
        value: String(control.answer),
      }));
      options.refreshRuntime();
    },
  };
}
