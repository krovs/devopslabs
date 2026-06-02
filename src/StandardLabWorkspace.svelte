<script lang="ts">
  import ScenarioEditor from "./ScenarioEditor.svelte";
  import ScenarioResources from "./ScenarioResources.svelte";
  import TerminalPanel from "./TerminalPanel.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

{#if app.view.runtime}
  <section class="workspace">
    <ScenarioEditor
      activeFileName={app.view.activeFileName}
      fileNames={app.view.scenarioFileNames}
      content={app.view.activeFileContent}
      onsave={app.editorSession.saveCurrentFile}
      onselectfile={app.editorSession.selectFile}
      oncontentchange={app.editorSession.updateContent}
      oneditorkeydown={app.editorSession.handleKeydown}
    />

    <ScenarioResources
      runtime={app.view.runtime}
      scenarioTips={app.view.scenarioTips}
      revealedTipCount={app.view.revealedTipCount}
      visibleTips={app.view.visibleTips}
      incidentMode={app.view.incidentMode}
      leftResourceTitle={app.view.leftResourceTitle}
      rightResourceTitle={app.view.rightResourceTitle}
      workflowEvent={app.commandSession.workflowEvent()}
      workflowJob={app.commandSession.workflowJob()}
      workflowFailedStep={app.commandSession.workflowFailedStep()}
      workflowLogLines={app.commandSession.workflowLogLines()}
      onrevealtip={app.callbacks.revealTip}
    />
  </section>

  <TerminalPanel
    lines={app.terminal.lines}
    input={app.terminal.input}
    oninputchange={(value) => (app.terminal.input = value)}
    onrun={app.commandSession.runCommand}
    onclear={() => {
      app.terminal.clear();
      app.saveSession();
    }}
    oncommandkeydown={(event) => app.terminal.handleKeydown(event)}
    onresizepointerdown={app.appShell.startTerminalResize}
    onresizekeydown={app.appShell.resizeTerminalWithKeyboard}
    outputref={(element) => app.terminal.setOutputElement(element)}
    inputref={(element) => app.terminal.setInputElement(element)}
  />
{/if}
