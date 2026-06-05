<script lang="ts">
  import { controlOptions } from "./threatModelWorkspace";
  import type { ThreatModelControl, ThreatModelNode } from "./types";

  interface Props {
    incidentMode: boolean;
    solved: boolean;
    scenarioTips: string[];
    revealedTipCount: number;
    visibleTips: string[];
    selectedNode: ThreatModelNode | null;
    selectedControls: ThreatModelControl[];
    reviewAttempted: boolean;
    securityPassed?: boolean;
    findings: string[];
    onrevealtip: () => void;
    onreview: () => void;
    onupdatecontrol: (controlId: string, value: string) => void;
  }

  let {
    incidentMode,
    solved,
    scenarioTips,
    revealedTipCount,
    visibleTips,
    selectedNode,
    selectedControls,
    reviewAttempted,
    securityPassed,
    findings,
    onrevealtip,
    onreview,
    onupdatecontrol,
  }: Props = $props();
</script>

<section class="panel threat-controls-panel">
  <div class="panel-header">
    <h2>STRIDE Review</h2>
    <div class="network-design-actions">
      {#if !incidentMode && scenarioTips.length}
        <button type="button" disabled={revealedTipCount >= scenarioTips.length} onclick={onrevealtip}>
          {revealedTipCount >= scenarioTips.length ? "No more tips" : "Tip"}
        </button>
      {/if}
      <button type="button" onclick={onreview}>Review</button>
    </div>
  </div>
  <div class="network-brief-content">
    {#if incidentMode && !solved}
      <section>
        <h3>Observed Gaps</h3>
        <ul>
          {#each findings as finding}
            <li>{finding}</li>
          {/each}
        </ul>
      </section>
    {:else}
      <section>
        <h3>Goal</h3>
        <p>Complete concrete STRIDE coverage for identity, webhook integrity, order data disclosure, and public API availability.</p>
      </section>
      <section>
        <h3>Constraints</h3>
        <ul>
          <li>Each entry must map to a checkout data flow or trust boundary.</li>
          <li>Mitigations must be testable controls, not generic STRIDE definitions.</li>
        </ul>
      </section>
    {/if}
  </div>
  {#if !incidentMode && visibleTips.length}
    <aside class="tips-panel network-design-tips" aria-label="Scenario tips">
      <h3>Tips</h3>
      <ol>
        {#each visibleTips as tip}
          <li>{tip}</li>
        {/each}
      </ol>
    </aside>
  {/if}
  <div class="network-detail">
    <h3>Selected Component</h3>
    {#if selectedNode}
      <strong>{selectedNode.label}</strong>
      <p>{selectedNode.note}</p>
    {:else}
      <p>Select a data-flow component to review its STRIDE coverage.</p>
    {/if}
  </div>
  <div class="network-controls threat-controls">
    {#if reviewAttempted && securityPassed === false}
      <section class="network-symptom-log" aria-label="Threat model gaps">
        <h3>Coverage Gaps</h3>
        <ul>
          {#each findings as finding}
            <li>{finding}</li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if selectedNode && selectedControls.length === 0}
      <p class="network-empty-controls">No editable STRIDE entries for this component.</p>
    {/if}
    {#each selectedControls as control}
      <label class:control-error={reviewAttempted && control.value !== control.answer}>
        <span>{control.label}</span>
        <em>{control.stride}</em>
        <select value={control.value} onchange={(event) => onupdatecontrol(control.id, event.currentTarget.value)}>
          {#each controlOptions(control.options) as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
        <small>{control.note}</small>
      </label>
    {/each}
  </div>
</section>
