<script lang="ts">
  import type { NetworkLink, NetworkingModel } from "./types";

  interface Props {
    networking: NetworkingModel;
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
    networking,
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

  function networkEdgePath(fromX: string, fromY: string, toX: string, toY: string): string {
    const x1 = Number(fromX);
    const y1 = Number(fromY);
    const x2 = Number(toX);
    const y2 = Number(toY);
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
  }

  function linkIsFailed(link: NetworkLink): boolean {
    if (solved) return false;
    if (!link.controlIds) return link.status === "failed";

    const controlIds = link.controlIds.split(",").map((id) => id.trim()).filter(Boolean);
    return networking.controls.some((control) => controlIds.includes(control.id) && String(control.value).trim() !== String(control.answer).trim());
  }
</script>

<section class="panel network-diagram-panel">
  <div class="panel-header">
    <h2>Network Diagram</h2>
    <div class="network-diagram-actions">
      <button type="button" onclick={onreset}>Reset view</button>
      <span class={solved ? "badge badge-ok" : "badge badge-danger"}>{solved ? "working" : "misconfigured"}</span>
    </div>
  </div>
  <div
    class="network-canvas"
    class:network-success={solved}
    class:is-panning={panning}
    role="button"
    tabindex="0"
    aria-label="Pannable network diagram. Drag to move the diagram. Press Home or Escape to reset the view."
    onpointerdown={onpointerdown}
    onpointermove={onpointermove}
    onpointerup={onpointerup}
    onpointercancel={onpointerup}
    {onkeydown}
  >
    <div class="network-pan-surface" style={`transform: translate(${panX}px, ${panY}px)`}>
      <svg class="network-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {#each networking.links as link}
          {@const fromNode = networking.nodes.find((node) => node.id === link.from)}
          {@const toNode = networking.nodes.find((node) => node.id === link.to)}
          {#if fromNode && toNode}
            <path
              class:failed-link={linkIsFailed(link)}
              d={networkEdgePath(fromNode.x, fromNode.y, toNode.x, toNode.y)}
            />
          {/if}
        {/each}
      </svg>
      {#each networking.nodes as node}
        <button
          type="button"
          class="network-node"
          class:network-container={node.type === "vpc" || node.type === "subnet"}
          class:selected={selectedNodeId === node.id}
          data-node-id={node.id}
          style={`left: ${node.x}%; top: ${node.y}%; --node-width: ${node.width ?? "112px"}; --node-height: ${node.height ?? "52px"}`}
        >
          <span>{node.label}</span>
          <small>{node.type}</small>
        </button>
      {/each}
    </div>
  </div>
  <div class="network-link-list">
    {#each networking.links as link}
      <span class={linkIsFailed(link) ? "badge badge-danger" : "badge badge-ok"}>{link.label}</span>
    {/each}
  </div>
</section>
