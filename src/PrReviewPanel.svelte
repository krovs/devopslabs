<script lang="ts">
  import type { PrFinding, PrReviewModel } from "./types";

  type ReviewDecision = "approve" | "request_changes";

  interface Props {
    review: PrReviewModel;
    solved: boolean;
    tips: string[];
    incidentMode: boolean;
    onsubmit: () => void;
    ondecision: (decision: ReviewDecision) => void;
    ontogglefinding: (findingId: string) => void;
  }

  let { review, solved, tips, incidentMode, onsubmit, ondecision, ontogglefinding }: Props = $props();

  let selectedFindings = $derived<PrFinding[]>(review.findings.filter((finding) => finding.selected));
</script>

<section class="panel pr-review-panel">
  <div class="panel-header">
    <h2>Review</h2>
    <button type="button" onclick={onsubmit}>Submit review</button>
  </div>
  <div class="pr-review-body">
    <article class="resource-section pr-summary">
      <header class="resource-section-header">
        <h3>{review.number}</h3>
        <span class={solved ? "badge badge-ok" : "badge badge-danger"}>{solved ? "accepted" : "needs review"}</span>
      </header>
      <dl class="kv-grid pr-kv-grid">
        <div>
          <dt>Author</dt>
          <dd>{review.author}</dd>
        </div>
        <div>
          <dt>Base</dt>
          <dd>{review.base}</dd>
        </div>
        <div>
          <dt>Branch</dt>
          <dd>{review.branch}</dd>
        </div>
      </dl>
      <p>{review.summary}</p>
      <p class="muted">{review.risk}</p>
    </article>

    <section class="resource-section pr-decision-group" aria-label="Review decision">
      <header class="resource-section-header">
        <h3>Decision</h3>
      </header>
      <div class="segmented-control">
        <button type="button" class:active={review.decision === "approve"} onclick={() => ondecision("approve")}>Approve</button>
        <button type="button" class:active={review.decision === "request_changes"} onclick={() => ondecision("request_changes")}>Request changes</button>
      </div>
    </section>

    <section class="resource-section pr-findings" aria-label="Review findings">
      <header class="resource-section-header">
        <h3>Findings</h3>
      </header>
      <div class="resource-list">
        {#each review.findings as finding}
          <label class="resource-row pr-finding" class:selected={finding.selected}>
            <input type="checkbox" checked={finding.selected} onchange={() => ontogglefinding(finding.id)}>
            <span>
              <strong>{finding.label}</strong>
              <small>{finding.file}:{finding.line}</small>
              <em>{finding.note}</em>
            </span>
          </label>
        {/each}
      </div>
    </section>

    <section class="resource-section pr-selected-summary" aria-label="Selected review findings">
      <header class="resource-section-header">
        <h3>Review Comment</h3>
      </header>
      {#if selectedFindings.length}
        <ul class="resource-list">
          {#each selectedFindings as finding}
            <li class="resource-row">{finding.label}</li>
          {/each}
        </ul>
      {:else}
        <p class="resource-empty">Select the findings you would leave on the review.</p>
      {/if}
    </section>

    {#if !incidentMode && tips.length}
      <aside class="resource-section tips-panel pr-tips" aria-label="Scenario tips">
        <header class="resource-section-header">
          <h3>Tips</h3>
        </header>
        <ol>
          {#each tips as tip}
            <li>{tip}</li>
          {/each}
        </ol>
      </aside>
    {/if}
  </div>
</section>
