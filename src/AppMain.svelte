<script lang="ts">
  import AppTopbar from "./AppTopbar.svelte";
  import Documentation from "./Documentation.svelte";
  import LabIndex from "./LabIndex.svelte";
  import LabWorkspace from "./LabWorkspace.svelte";
  import type { AppController } from "./appController.svelte";
  import { labHealthClass, labHealthLabel } from "./labCatalog";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

<main
  class:is-resizing-terminal={app.appShell.isResizingTerminal}
  class:docs-page={app.view.currentPage === "docs"}
  class:index-page={app.view.currentPage === "index"}
  class:network-page={app.view.currentPage === "labs" && app.view.runtime?.kind === "networking"}
  class="app-shell"
  style={`--terminal-height: ${app.appShell.terminalHeight}px`}
>
  <AppTopbar
    currentPage={app.view.currentPage}
    heading={app.view.pageHeading}
    menuOpen={app.appShell.isMenuOpen}
    solved={app.view.solved}
    healthClass={app.view.runtime ? labHealthClass(app.view.solved, app.view.runtime) : "badge badge-warn"}
    healthLabel={app.view.runtime ? labHealthLabel(app.view.solved, app.view.runtime) : "Loading"}
    incidentMode={app.view.incidentMode}
    onopenmenu={() => {
      if (app.view.currentPage === "labs") app.appShell.openMenuForScenario(app.view.currentScenarioId);
      else app.appShell.openMenu();
    }}
    onopensolution={app.labActions.openSolutionModal}
    onreset={() => void app.scenarioNavigation.load(app.view.currentScenarioId)}
  />

  {#if app.view.currentPage === "docs"}
    <Documentation />
  {:else if app.view.currentPage === "index"}
    <LabIndex
      labGroups={app.labGroups}
      groupcompletionlabel={app.callbacks.groupCompletionLabel}
      onopenlabgroup={app.scenarioNavigation.openLabGroup}
    />
  {:else}
    <LabWorkspace {app} />
  {/if}
</main>
