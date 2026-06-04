<script lang="ts">
  import ThreatModelControlsPanel from "./ThreatModelControlsPanel.svelte";
  import ThreatModelDiagramPanel from "./ThreatModelDiagramPanel.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

{#if app.view.runtime?.threatModel}
  <section class="threat-model-workspace">
    <div class="network-main-row threat-main-row">
      <ThreatModelDiagramPanel
        threatModel={app.view.runtime.threatModel}
        selectedNodeId={app.threatModelSession.selectedNodeId}
        solved={app.view.solved}
        panning={app.threatModelSession.isPanning}
        panX={app.threatModelSession.panX}
        panY={app.threatModelSession.panY}
        onreset={app.threatModelSession.resetPan}
        onpointerdown={(event) => app.threatModelSession.startPan(event)}
        onpointermove={(event) => app.threatModelSession.movePan(event)}
        onpointerup={(event) => app.threatModelSession.stopPan(event)}
        onkeydown={(event) => app.threatModelSession.handleCanvasKeydown(event)}
      />

      <ThreatModelControlsPanel
        incidentMode={app.view.incidentMode}
        solved={app.view.solved}
        scenarioTips={app.view.scenarioTips}
        revealedTipCount={app.view.revealedTipCount}
        visibleTips={app.view.visibleTips}
        selectedNode={app.threatModelSession.selectedNode}
        selectedControls={app.threatModelSession.selectedControls}
        reviewAttempted={app.threatModelSession.reviewAttempted}
        securityPassed={app.view.runtime.flags.securityPassed}
        findings={app.threatModelSession.findings}
        onrevealtip={app.callbacks.revealTip}
        onreview={app.threatModelSession.reviewScenario}
        onupdatecontrol={app.threatModelSession.updateControl}
      />
    </div>
  </section>
{/if}
