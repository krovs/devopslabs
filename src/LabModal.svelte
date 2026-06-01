<script lang="ts">
  type LabModalKind = "solution" | "completion";

  interface Props {
    kind: LabModalKind;
    title: string;
    summary: string;
    steps: string[];
    commands: string[];
    explanationParagraphs: string[];
    outcome: string;
    onclose: () => void;
    onapplysolution: () => void;
  }

  let {
    kind,
    title,
    summary,
    steps,
    commands,
    explanationParagraphs,
    outcome,
    onclose,
    onapplysolution,
  }: Props = $props();
</script>

<button class="modal-backdrop" type="button" aria-label="Close dialog" onclick={onclose}></button>
<div class="lab-modal" role="dialog" aria-modal="true" aria-labelledby="lab-modal-title">
  <div class="lab-modal-header">
    <div>
      <p>{kind === "solution" ? "Solution guide" : "Lab complete"}</p>
      <h2 id="lab-modal-title">{title}</h2>
    </div>
    <button type="button" class="menu-close-button" aria-label="Close dialog" onclick={onclose}>×</button>
  </div>
  <div class="lab-modal-body">
    {#if kind === "solution"}
      <p>{summary}</p>
      <h3>Steps</h3>
      <ol>
        {#each steps as step}
          <li>{step}</li>
        {/each}
      </ol>
      <h3>Commands</h3>
      <pre>{commands.join("\n")}</pre>
    {:else}
      {#each explanationParagraphs as paragraph}
        <p>{paragraph}</p>
      {/each}
      <h3>Outcome</h3>
      <p>{outcome}</p>
    {/if}
  </div>
  <div class="lab-modal-actions">
    {#if kind === "solution"}
      <button type="button" class="solution-apply-button" onclick={onapplysolution}>Apply solution</button>
    {/if}
    <button type="button" onclick={onclose}>Close</button>
  </div>
</div>
