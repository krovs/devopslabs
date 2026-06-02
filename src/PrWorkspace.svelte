<script lang="ts">
  import PrDiffPanel from "./PrDiffPanel.svelte";
  import PrReviewPanel from "./PrReviewPanel.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

{#if app.view.runtime?.prReview}
  <section class="pr-workspace">
    <PrDiffPanel
      activeFileName={app.view.activeFileName}
      fileNames={app.view.scenarioFileNames}
      content={app.view.activeFileContent}
      prNumber={app.view.runtime.prReview.number}
      solved={app.view.solved}
      onselectfile={app.editorSession.selectFile}
    />

    <PrReviewPanel
      review={app.view.runtime.prReview}
      solved={app.view.solved}
      tips={app.view.visibleTips}
      incidentMode={app.view.incidentMode}
      onsubmit={app.prReviewSession.submit}
      ondecision={app.prReviewSession.setDecision}
      ontogglefinding={app.prReviewSession.toggleFinding}
    />
  </section>
{/if}
