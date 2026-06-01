import {
  defaultNetworkSymptoms,
  getSelectedNetworkControls,
  getSelectedTrace,
  parseRequirementSections,
} from "./networkWorkspace";
import type { Scenario } from "./types";

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
      const solved = runtime.networking.controls.every((control) => control.value === control.answer);
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
      if (!selectedTrace) return;

      const steps = selectedTrace.path.split("|").map((step) => step.trim()).filter(Boolean);
      const result = options.solved()
        ? `PASS: ${selectedTrace.success ?? "Packet path completed without policy or routing drops."}`
        : `FAIL: ${selectedTrace.failure}`;

      traceResult = [
        `Probe: ${selectedTrace.source} -> ${selectedTrace.destination} tcp/${selectedTrace.port}`,
        ...steps.map((step) => `- ${step}`),
        result,
      ];
    },
    applyControlAnswers(): void {
      const runtime = options.runtime();
      if (!runtime?.networking) return;
      runtime.networking.controls = runtime.networking.controls.map((control) => ({
        ...control,
        value: control.answer,
      }));
      options.refreshRuntime();
    },
  };
}
