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
    {#if scenarioTips.length}
      <button type="button" disabled={revealedTipCount >= scenarioTips.length} onclick={onrevealtip}>
        {revealedTipCount >= scenarioTips.length ? "No more clues" : incidentMode ? "Reveal clue" : "Show tip"}
      </button>
    {/if}
  </div>
  {#if runtime.kind === "cicd" && workflowResource}
    <div class="pipeline-dashboard">
      <article class="pipeline-card run-card">
        <div class="card-title-row">
          <h3>Workflow Run</h3>
          <span class={statusClass(workflowResource.status)}>{workflowResource.status}</span>
        </div>
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
      </article>

      <article class="pipeline-card">
        <div class="card-title-row">
          <h3>{runtime.flags.runPassing ? "Completed Steps" : "Failed Step"}</h3>
          <span class={runtime.flags.runPassing ? "badge badge-ok" : "badge badge-danger"}>
            {workflowFailedStep}
          </span>
        </div>
        <pre class="pipeline-log">{workflowLogLines.join("\n")}</pre>
      </article>

      <article class="pipeline-card">
        {#if repositoryCredentials.length}
          <h3>Credentials</h3>
          <div class="path-list">
            {#each repositoryCredentials as credential}
              <div class="path-row">
                <code>{credential.address.replace("credential.", "")}</code>
                <span class="badge badge-ok">{credential.id}</span>
              </div>
            {/each}
          </div>
        {:else}
          <h3>Repository Secrets</h3>
          <div class="pill-list">
            {#if repositorySecrets.length === 0}
              <span class="pill pill-danger">none</span>
            {/if}
            {#each repositorySecrets as secret}
              <span class={secret.address === "secret.AWS_ROLE_ARN" ? "pill pill-ok" : "pill"}>
                {secret.address.replace("secret.", "")}
              </span>
            {/each}
          </div>
        {/if}
      </article>

      <article class="pipeline-card">
        <h3>Repository Paths</h3>
        <div class="path-list">
          {#if repositoryPaths.length === 0}
            <p class="muted">No repository paths modeled for this lab.</p>
          {/if}
          {#each repositoryPaths as path}
            <div class="path-row">
              <code>{path.address.replace("path.", "")}</code>
              <span class={path.id === "missing" ? "badge badge-danger" : "badge badge-ok"}>{path.id}</span>
            </div>
          {/each}
        </div>
      </article>
    </div>
  {:else}
    <div class="resource-grid">
      <article>
        <h3>{leftResourceTitle}</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each runtime.awsResources as resource}
              <tr>
                <td>{resource.type}</td>
                <td>{resource.name}<div class="muted">{resource.note || ""}</div></td>
                <td><span class={statusClass(resource.status)}>{resource.status}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </article>

      <article>
        <h3>{rightResourceTitle}</h3>
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>{stateIdentifierLabel}</th>
            </tr>
          </thead>
          <tbody>
            {#if runtime.stateResources.length === 0}
              <tr><td colspan="2">No resources tracked.</td></tr>
            {/if}
            {#each runtime.stateResources as resource}
              <tr>
                <td>{resource.address}</td>
                <td>{resource.id}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </article>
    </div>
  {/if}
  {#if visibleTips.length}
    <aside class="tips-panel" aria-label="Scenario tips">
      <h3>{incidentMode ? "Clues" : "Tips"}</h3>
      <ol>
        {#each visibleTips as tip}
          <li>{tip}</li>
        {/each}
      </ol>
    </aside>
  {/if}
</section>
