import { checkScenario as checkScenarioCompletion } from "./completion";
import { threatModelReview } from "./simulators/threatmodel";
import { defaultThreatModelFindings, getSelectedThreatModelControls } from "./threatModelWorkspace";
import type { Scenario } from "./types";

export type ThreatModelSessionOptions = {
  runtime: () => Scenario | null;
  refreshRuntime: () => void;
  addTerminalLines: (lines: string[]) => void;
  onCompleted: () => void;
  onSave: () => void;
};

export function createThreatModelSession(options: ThreatModelSessionOptions) {
  let selectedNodeId = $state<string | null>(null);
  let reviewAttempted = $state(false);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStartX = $state(0);
  let panStartY = $state(0);
  let panOriginX = $state(0);
  let panOriginY = $state(0);
  let dragDistance = $state(0);
  let pointerNodeId = $state<string | null>(null);

  let threatModel = $derived(options.runtime()?.threatModel ?? null);
  let selectedNode = $derived(threatModel?.nodes.find((node) => node.id === selectedNodeId) ?? null);
  let selectedControls = $derived(options.runtime() ? getSelectedThreatModelControls(options.runtime() as Scenario, selectedNode) : []);
  let findings = $derived(threatModel?.findings ?? defaultThreatModelFindings);

  function resetPan(): void {
    panX = 0;
    panY = 0;
    isPanning = false;
  }

  function resetForScenario(): void {
    selectedNodeId = null;
    reviewAttempted = false;
    resetPan();
  }

  function clampPan(value: number): number {
    return Math.max(-260, Math.min(260, value));
  }

  function reviewScenario(): void {
    const runtime = options.runtime();
    if (!runtime?.threatModel) return;

    const reviewOutput = threatModelReview(runtime, runtime.id);
    const completionOutput = checkScenarioCompletion(runtime, runtime.id, runtime.primaryFile ?? "threat-model.md");
    reviewAttempted = true;
    options.refreshRuntime();
    options.addTerminalLines(["$ threatmodel review", ...reviewOutput, "$ check", ...completionOutput]);
    options.onCompleted();
    options.onSave();
  }

  return {
    get selectedNodeId() {
      return selectedNodeId;
    },
    get selectedNode() {
      return selectedNode;
    },
    get selectedControls() {
      return selectedControls;
    },
    get findings() {
      return findings;
    },
    get reviewAttempted() {
      return reviewAttempted;
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
    resetPan,
    resetForScenario,
    startPan(event: PointerEvent): void {
      if (event.button !== 0) return;
      isPanning = true;
      dragDistance = 0;
      pointerNodeId = (event.target as HTMLElement).closest<HTMLElement>(".threat-node")?.dataset.nodeId ?? null;
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
      if (!runtime?.threatModel) return;
      runtime.threatModel.controls = runtime.threatModel.controls.map((control) =>
        control.id === controlId ? { ...control, value } : control,
      );
      runtime.flags.securityPassed = false;
      runtime.flags.threatModelValidated = false;
      runtime.awsResources[0].status = "failed";
      runtime.awsResources[0].note = "Threat model has pending validation.";
      runtime.stateResources = runtime.stateResources.map((resource) =>
        resource.address.startsWith("stride.") ? { ...resource, id: "missing" } : resource,
      );
      options.refreshRuntime();
      reviewAttempted = false;
      options.onSave();
    },
    reviewScenario,
    applyControlAnswers(): void {
      const runtime = options.runtime();
      if (!runtime?.threatModel) return;
      runtime.threatModel.controls = runtime.threatModel.controls.map((control) => ({
        ...control,
        value: control.answer,
      }));
      options.refreshRuntime();
    },
  };
}
