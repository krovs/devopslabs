<script lang="ts">
  import type { NetworkControl, NetworkNode, NetworkTrace } from "./types";

  interface RequirementSections {
    goal: string[];
    constraints: string[];
  }

  interface Props {
    incidentMode: boolean;
    solved: boolean;
    scenarioTips: string[];
    revealedTipCount: number;
    visibleTips: string[];
    requirementSections: RequirementSections;
    incidentSummary: string[];
    traces: NetworkTrace[];
    selectedTrace: NetworkTrace | null;
    traceResult: string[];
    selectedNode: NetworkNode | null;
    selectedControls: NetworkControl[];
    networkCheckAttempted: boolean;
    networkConfigured?: boolean;
    symptoms: string[];
    onrevealtip: () => void;
    oncheckdesign: () => void;
    onruntrace: () => void;
    onselecttrace: (traceId: string) => void;
    onupdatecontrol: (controlId: string, value: string) => void;
  }

  let {
    incidentMode,
    solved,
    scenarioTips,
    revealedTipCount,
    visibleTips,
    requirementSections,
    incidentSummary,
    traces,
    selectedTrace,
    traceResult,
    selectedNode,
    selectedControls,
    networkCheckAttempted,
    networkConfigured,
    symptoms,
    onrevealtip,
    oncheckdesign,
    onruntrace,
    onselecttrace,
    onupdatecontrol,
  }: Props = $props();

  function controlOptions(options: string): string[] {
    return options.split(",").map((option) => option.trim()).filter(Boolean);
  }
</script>

<section class="panel network-controls-panel">
  <div class="panel-header">
    <h2>Design</h2>
    <div class="network-design-actions">
      {#if scenarioTips.length}
        <button type="button" disabled={revealedTipCount >= scenarioTips.length} onclick={onrevealtip}>
          {revealedTipCount >= scenarioTips.length ? "No more clues" : incidentMode ? "Reveal clue" : "Tip"}
        </button>
      {/if}
      <button type="button" onclick={oncheckdesign}>Check design</button>
    </div>
  </div>
  <div class="network-brief-content">
    {#if incidentMode && !solved}
      <section>
        <h3>Observed Symptoms</h3>
        <ul>
          {#each incidentSummary as line}
            <li>{line}</li>
          {/each}
        </ul>
      </section>
    {:else}
      <section>
        <h3>Goal</h3>
        {#each requirementSections.goal as line}
          <p>{line}</p>
        {/each}
      </section>
      <section>
        <h3>Constraints</h3>
        <ul>
          {#each requirementSections.constraints as line}
            <li>{line}</li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
  {#if visibleTips.length}
    <aside class="tips-panel network-design-tips" aria-label="Scenario tips">
      <h3>{incidentMode ? "Clues" : "Tips"}</h3>
      <ol>
        {#each visibleTips as tip}
          <li>{tip}</li>
        {/each}
      </ol>
    </aside>
  {/if}
  {#if traces.length}
    <section class="network-trace-panel" aria-label="Packet trace">
      <div class="network-trace-heading">
        <h3>Packet Trace</h3>
        <button type="button" onclick={onruntrace}>Run trace</button>
      </div>
      <label>
        <span>Probe</span>
        <select value={selectedTrace?.id ?? ""} onchange={(event) => onselecttrace(event.currentTarget.value)}>
          {#each traces as trace}
            <option value={trace.id}>{trace.label}</option>
          {/each}
        </select>
      </label>
      {#if selectedTrace}
        <dl class="network-trace-meta">
          <div>
            <dt>From</dt>
            <dd>{selectedTrace.source}</dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>{selectedTrace.destination}</dd>
          </div>
          <div>
            <dt>Port</dt>
            <dd>tcp/{selectedTrace.port}</dd>
          </div>
        </dl>
      {/if}
      {#if traceResult.length}
        <pre class="network-trace-output">{traceResult.join("\n")}</pre>
      {/if}
    </section>
  {/if}
  <div class="network-detail">
    <h3>Selected Component</h3>
    {#if selectedNode}
      <strong>{selectedNode.label}</strong>
      <p>{selectedNode.note}</p>
    {:else}
      <p>Select a diagram component to inspect or configure it.</p>
    {/if}
  </div>
  <div class="network-controls">
    {#if networkCheckAttempted && networkConfigured === false}
      <section class="network-symptom-log" aria-label="Symptom log">
        <h3>Symptom Log</h3>
        <ul>
          {#each symptoms as symptom}
            <li>{symptom}</li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if selectedNode && selectedControls.length === 0}
      <p class="network-empty-controls">No editable settings for this component.</p>
    {/if}
    {#each selectedControls as control}
      <label>
        <span>{control.label}</span>
        {#if control.inputType === "text"}
          <input
            value={control.value}
            placeholder={control.placeholder ?? "CIDR or IP address"}
            spellcheck="false"
            oninput={(event) => onupdatecontrol(control.id, event.currentTarget.value.trim())}
          >
        {:else}
          <select value={control.value} onchange={(event) => onupdatecontrol(control.id, event.currentTarget.value)}>
            {#each controlOptions(control.options) as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {/if}
        <small>{control.note}</small>
      </label>
    {/each}
  </div>
</section>
