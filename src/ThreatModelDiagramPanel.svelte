<script lang="ts">
  import type { ThreatModelLink, ThreatModelModel, ThreatModelNode } from "./types";

  interface Props {
    threatModel: ThreatModelModel;
    selectedNodeId: string | null;
    solved: boolean;
    panning: boolean;
    panX: number;
    panY: number;
    onreset: () => void;
    onpointerdown: (event: PointerEvent) => void;
    onpointermove: (event: PointerEvent) => void;
    onpointerup: (event: PointerEvent) => void;
    onkeydown: (event: KeyboardEvent) => void;
  }

  let {
    threatModel,
    selectedNodeId,
    solved,
    panning,
    panX,
    panY,
    onreset,
    onpointerdown,
    onpointermove,
    onpointerup,
    onkeydown,
  }: Props = $props();

  function edgePath(link: ThreatModelLink, fromNode: ThreatModelNode, toNode: ThreatModelNode): string {
    const x1 = Number(fromNode.x);
    const y1 = Number(fromNode.y);
    const x2 = Number(toNode.x);
    const y2 = Number(toNode.y);
    if (link.routeY) {
      const laneY = Number(link.routeY);
      const targetY = y2 + (laneY < y2 ? -targetVerticalOffset(toNode) : targetVerticalOffset(toNode));
      return `M ${x1} ${y1} V ${laneY} H ${x2} V ${targetY}`;
    }
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) >= Math.abs(dy)) {
      const direction = dx >= 0 ? 1 : -1;
      const startX = x1 + direction * targetHorizontalOffset(fromNode);
      const targetX = x2 - direction * targetHorizontalOffset(toNode);
      if (Math.abs(dy) < 1) return `M ${startX} ${y1} H ${targetX}`;
      const midX = (startX + targetX) / 2;
      return `M ${startX} ${y1} H ${midX} V ${y2} H ${targetX}`;
    }

    const direction = dy >= 0 ? 1 : -1;
    const startY = y1 + direction * targetVerticalOffset(fromNode);
    const targetY = y2 - direction * targetVerticalOffset(toNode);
    return `M ${x1} ${startY} V ${targetY}`;
  }

  function targetHorizontalOffset(node: ThreatModelNode): number {
    if (node.type === "process" || node.type === "multiple-process") return 5.4;
    if (node.type === "datastore") return 5.6;
    return 4.8;
  }

  function targetVerticalOffset(node: ThreatModelNode): number {
    if (node.type === "process" || node.type === "multiple-process") return 5.4;
    if (node.type === "datastore") return 4.8;
    return 4.1;
  }

  function linkIsFailed(link: ThreatModelLink): boolean {
    if (solved) return false;
    if (!link.controlIds) return link.status === "failed";
    const controlIds = link.controlIds.split(",").map((id) => id.trim()).filter(Boolean);
    return threatModel.controls.some((control) => controlIds.includes(control.id) && control.value !== control.answer);
  }
</script>

<section class="panel threat-diagram-panel">
  <div class="panel-header">
    <h2>Data Flow Diagram</h2>
    <div class="network-diagram-actions">
      <button type="button" onclick={onreset}>Reset view</button>
      <span class={solved ? "badge badge-ok" : "badge badge-danger"}>{solved ? "covered" : "gaps"}</span>
    </div>
  </div>
  <div
    class="network-canvas threat-canvas"
    class:network-success={solved}
    class:is-panning={panning}
    role="button"
    tabindex="0"
    aria-label="Pannable threat model diagram. Drag to move the diagram. Press Home or Escape to reset the view."
    onpointerdown={onpointerdown}
    onpointermove={onpointermove}
    onpointerup={onpointerup}
    onpointercancel={onpointerup}
    {onkeydown}
  >
    <div class="network-pan-surface" style={`transform: translate(${panX}px, ${panY}px)`}>
      {#each threatModel.boundaries ?? [] as boundary}
        <div
          class="threat-boundary-line"
          style={`left: ${boundary.x}%; top: ${boundary.y ?? "8"}%; height: ${boundary.height ?? "84"}%`}
          aria-hidden="true"
        >
          <span>{boundary.label}</span>
        </div>
      {/each}
      <svg class="network-links threat-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="threat-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
          <marker id="threat-arrow-failed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {#each threatModel.links as link}
          {@const fromNode = threatModel.nodes.find((node) => node.id === link.from)}
          {@const toNode = threatModel.nodes.find((node) => node.id === link.to)}
          {#if fromNode && toNode}
            <path
              class:failed-link={linkIsFailed(link)}
              d={edgePath(link, fromNode, toNode)}
              marker-end={linkIsFailed(link) ? "url(#threat-arrow-failed)" : "url(#threat-arrow)"}
            />
          {/if}
        {/each}
      </svg>
      {#each threatModel.nodes as node}
        {@const nodeControls = threatModel.controls.filter((control) => control.nodeId?.split(",").map((id) => id.trim()).includes(node.id))}
        {@const nodeCovered = nodeControls.length > 0 && nodeControls.every((control) => control.value === control.answer)}
        <button
          type="button"
          class="network-node threat-node"
          class:threat-external={node.type === "external"}
          class:threat-process={node.type === "process"}
          class:threat-multiple-process={node.type === "multiple-process"}
          class:threat-internal={node.type === "internal"}
          class:threat-datastore={node.type === "datastore"}
          class:threat-covered={nodeCovered}
          class:selected={selectedNodeId === node.id}
          data-node-id={node.id}
          style={`left: ${node.x}%; top: ${node.y}%; --node-width: ${node.width ?? "122px"}; --node-height: ${node.height ?? "56px"}`}
        >
          <span>{node.label}</span>
          <small>{node.type}</small>
        </button>
      {/each}
    </div>
  </div>
  <div class="network-link-list">
    {#each threatModel.links as link}
      <span class={linkIsFailed(link) ? "badge badge-danger" : "badge badge-ok"}>{link.label}</span>
    {/each}
  </div>
</section>
