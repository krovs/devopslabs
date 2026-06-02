<script lang="ts">
  import NetworkControlsPanel from "./NetworkControlsPanel.svelte";
  import NetworkDiagramPanel from "./NetworkDiagramPanel.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

{#if app.view.runtime?.networking}
  <section class="networking-workspace">
    <div class="network-main-row">
      <NetworkDiagramPanel
        networking={app.view.runtime.networking}
        selectedNodeId={app.networkSession.selectedNodeId}
        solved={app.view.solved}
        panning={app.networkSession.isPanning}
        panX={app.networkSession.panX}
        panY={app.networkSession.panY}
        onreset={app.networkSession.resetPan}
        onpointerdown={(event) => app.networkSession.startPan(event)}
        onpointermove={(event) => app.networkSession.movePan(event)}
        onpointerup={(event) => app.networkSession.stopPan(event)}
        onkeydown={(event) => app.networkSession.handleCanvasKeydown(event)}
      />

      <NetworkControlsPanel
        incidentMode={app.view.incidentMode}
        solved={app.view.solved}
        scenarioTips={app.view.scenarioTips}
        revealedTipCount={app.view.revealedTipCount}
        visibleTips={app.view.visibleTips}
        requirementSections={app.networkSession.requirementSections}
        incidentSummary={app.networkSession.incidentSummary}
        traces={app.networkSession.traces}
        selectedTrace={app.networkSession.selectedTrace}
        traceResult={app.networkSession.traceResult}
        selectedNode={app.networkSession.selectedNode}
        selectedControls={app.networkSession.selectedControls}
        networkCheckAttempted={app.networkSession.checkAttempted}
        networkConfigured={app.view.runtime.flags.networkConfigured}
        symptoms={app.networkSession.symptoms}
        onrevealtip={app.callbacks.revealTip}
        oncheckdesign={app.networkSession.checkScenario}
        onruntrace={app.networkSession.runTrace}
        onselecttrace={app.networkSession.selectTrace}
        onupdatecontrol={app.networkSession.updateControl}
      />
    </div>
  </section>
{/if}
