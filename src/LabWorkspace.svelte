<script lang="ts">
  import NetworkingWorkspace from "./NetworkingWorkspace.svelte";
  import PrWorkspace from "./PrWorkspace.svelte";
  import StandardLabWorkspace from "./StandardLabWorkspace.svelte";
  import ThreatModelWorkspace from "./ThreatModelWorkspace.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

{#if app.view.scenarioLoading || !app.view.runtime}
  <section class="workspace">
    <section class="panel editor-panel">
      <div class="panel-header">
        <h2>{app.view.scenarioLoadError ? "Scenario failed to load" : "Loading lab"}</h2>
      </div>
      <p>{app.view.scenarioLoadError ?? "Loading scenario content."}</p>
    </section>
  </section>
{:else if app.view.runtime.kind === "networking" && app.view.runtime.networking}
  <NetworkingWorkspace {app} />
{:else if app.view.runtime.kind === "threatmodel" && app.view.runtime.threatModel}
  <ThreatModelWorkspace {app} />
{:else if app.view.runtime.kind === "pr" && app.view.runtime.prReview}
  <PrWorkspace {app} />
{:else}
  <StandardLabWorkspace {app} />
{/if}
