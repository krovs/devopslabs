<script lang="ts">
  import type { Scenario } from "./types";

  interface Props {
    runtime: Scenario;
    scenarioTips: string[];
    revealedTipCount: number;
    visibleTips: string[];
    incidentMode: boolean;
    leftResourceTitle: string;
    rightResourceTitle: string;
    workflowEvent: string;
    workflowJob: string;
    workflowFailedStep: string;
    workflowLogLines: string[];
    onrevealtip: () => void;
  }

  let {
    runtime,
    scenarioTips,
    revealedTipCount,
    visibleTips,
    incidentMode,
    leftResourceTitle,
    rightResourceTitle,
    workflowEvent,
    workflowJob,
    workflowFailedStep,
    workflowLogLines,
    onrevealtip,
  }: Props = $props();

  let workflowResource = $derived(runtime.awsResources[0]);
  let repositorySecrets = $derived(runtime.stateResources.filter((resource) => resource.address.startsWith("secret.")));
  let repositoryCredentials = $derived(runtime.stateResources.filter((resource) => resource.address.startsWith("credential.")));
  let repositoryPaths = $derived(runtime.stateResources.filter((resource) => resource.address.startsWith("path.")));
  let stateIdentifierLabel = $derived(rightResourceTitle === "Terraform State" ? "Remote ID" : "Value");

  function statusClass(status: string): string {
    if (status === "exists" || status === "success") return "badge badge-ok";
    if (status === "drifted") return "badge badge-warn";
    return "badge badge-danger";
  }
</script>

<section class="panel resources-panel">
  <div class="panel-header">
    <h2>Resources</h2>
    {#if !incidentMode && scenarioTips.length}
      <button type="button" disabled={revealedTipCount >= scenarioTips.length} onclick={onrevealtip}>
        {revealedTipCount >= scenarioTips.length ? "No more tips" : "Show tip"}
      </button>
    {/if}
  </div>
  {#if runtime.kind === "cicd" && workflowResource}
    <div class="pipeline-dashboard">
      <section class="resource-section run-card">
        <header class="resource-section-header">
          <h3>Workflow Run</h3>
          <span class={statusClass(workflowResource.status)}>{workflowResource.status}</span>
        </header>
        <dl class="kv-grid">
          <div>
            <dt>Workflow</dt>
            <dd>{workflowResource.name}</dd>
          </div>
          <div>
            <dt>Run</dt>
            <dd>{workflowResource.id}</dd>
          </div>
          <div>
            <dt>Event</dt>
            <dd>{workflowEvent}</dd>
          </div>
          <div>
            <dt>Job</dt>
            <dd>{workflowJob}</dd>
          </div>
        </dl>
        <p class="muted">{workflowResource.note}</p>
      </section>

      <section class="resource-section">
        <header class="resource-section-header">
          <h3>{runtime.flags.runPassing ? "Completed Steps" : "Failed Step"}</h3>
          <span class={runtime.flags.runPassing ? "badge badge-ok" : "badge badge-danger"}>
            {workflowFailedStep}
          </span>
        </header>
        <pre class="pipeline-log">{workflowLogLines.join("\n")}</pre>
      </section>

      <section class="resource-section">
        {#if repositoryCredentials.length}
          <header class="resource-section-header">
            <h3>Credentials</h3>
          </header>
          <div class="resource-list">
            {#each repositoryCredentials as credential}
              <div class="resource-row">
                <code>{credential.address.replace("credential.", "")}</code>
                <span class="badge badge-ok">{credential.id}</span>
              </div>
            {/each}
          </div>
        {:else}
          <header class="resource-section-header">
            <h3>Repository Secrets</h3>
          </header>
          <div class="resource-chip-list">
            {#if repositorySecrets.length === 0}
              <p class="resource-empty">No repository secrets configured.</p>
            {/if}
            {#each repositorySecrets as secret}
              <span class={secret.address === "secret.AWS_ROLE_ARN" ? "pill pill-ok" : "pill"}>
                {secret.address.replace("secret.", "")}
              </span>
            {/each}
          </div>
        {/if}
      </section>

      <section class="resource-section">
        <header class="resource-section-header">
          <h3>Repository Paths</h3>
        </header>
        <div class="resource-list">
          {#if repositoryPaths.length === 0}
            <p class="resource-empty">No repository paths modeled.</p>
          {/if}
          {#each repositoryPaths as path}
            <div class="resource-row">
              <code>{path.address.replace("path.", "")}</code>
              <span class={path.id === "missing" ? "badge badge-danger" : "badge badge-ok"}>{path.id}</span>
            </div>
          {/each}
        </div>
      </section>
    </div>
  {:else}
    <div class="resource-grid">
      <section class="resource-section">
        <header class="resource-section-header">
          <h3>{leftResourceTitle}</h3>
        </header>
        <table class="resource-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th class="resource-status-column">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each runtime.awsResources as resource}
              <tr>
                <td>{resource.type}</td>
                <td>{resource.name}<div class="muted">{resource.note || ""}</div></td>
                <td class="resource-status-cell"><span class={statusClass(resource.status)}>{resource.status}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>

      <section class="resource-section">
        <header class="resource-section-header">
          <h3>{rightResourceTitle}</h3>
        </header>
        <table class="resource-table">
          <thead>
            <tr>
              <th>Address</th>
              <th class="resource-value-column">{stateIdentifierLabel}</th>
            </tr>
          </thead>
          <tbody>
            {#if runtime.stateResources.length === 0}
              <tr class="resource-empty-row"><td colspan="2"><span class="resource-empty">No resources tracked.</span></td></tr>
            {/if}
            {#each runtime.stateResources as resource}
              <tr>
                <td>{resource.address}</td>
                <td class="resource-value-cell">{resource.id}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    </div>
  {/if}
  {#if !incidentMode && visibleTips.length}
    <aside class="tips-panel" aria-label="Scenario tips">
      <h3>Tips</h3>
      <ol>
        {#each visibleTips as tip}
          <li>{tip}</li>
        {/each}
      </ol>
    </aside>
  {/if}
</section>
