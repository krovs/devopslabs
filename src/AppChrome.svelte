<script lang="ts">
  import AppMenu from "./AppMenu.svelte";
  import ConfettiOverlay from "./ConfettiOverlay.svelte";
  import Documentation from "./Documentation.svelte";
  import LabModal from "./LabModal.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

<ConfettiOverlay pieces={app.labProgress.confettiPieces} />

{#if app.view.modalKind && app.view.solutionDetails}
  <LabModal
    kind={app.view.modalKind}
    title={app.view.modalTitle}
    summary={app.view.solutionDetails.summary}
    steps={app.view.solutionDetails.steps}
    commands={app.view.solutionDetails.commands}
    explanationParagraphs={app.view.solutionDetails.explanationParagraphs}
    outcome={app.view.solutionDetails.outcome}
    onclose={app.labActions.closeLabModal}
    onapplysolution={app.labActions.applySolution}
  />
{/if}

{#if app.appShell.isDocsOpen}
  <Documentation kind={app.view.runtime?.kind} onclose={app.appShell.closeDocs} />
{/if}

<AppMenu
  open={app.appShell.isMenuOpen}
  theme={app.appShell.theme}
  incidentMode={app.view.incidentMode}
  menuSearchQuery={app.appShell.menuSearchQuery}
  labGroups={app.labGroups}
  openMenuGroups={app.appShell.openMenuGroups}
  highlightedMenuGroup={app.appShell.highlightedMenuGroup}
  currentScenarioId={app.view.currentScenarioId}
  completedScenarioIds={app.view.completedScenarioIds}
  onclose={app.appShell.closeMenu}
  onopenindex={app.scenarioNavigation.openLabs}
  onthemechange={app.appShell.setTheme}
  onrandomscenario={app.scenarioNavigation.selectRandomScenario}
  onincidentmodechange={app.appShell.setIncidentMode}
  onsearchchange={app.appShell.setMenuSearchQuery}
  ontogglegroup={app.callbacks.toggleMenuGroup}
  onselectscenario={app.scenarioNavigation.selectScenario}
  ontogglecompletion={app.callbacks.toggleScenarioCompletion}
  ontogglegroupcompletion={app.callbacks.toggleGroupCompletion}
  groupcompletionlabel={app.callbacks.groupCompletionLabel}
  groupcompletionpercent={app.callbacks.groupCompletionPercent}
  groupcompletionstate={app.callbacks.groupCompletionState}
  menugroupvisible={app.callbacks.menuGroupVisible}
  filteredscenarioids={app.callbacks.filteredScenarioIds}
  labmenutitle={app.callbacks.labMenuTitle}
/>
