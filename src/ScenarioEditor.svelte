<script lang="ts">
  interface Props {
    activeFileName: string;
    fileNames: string[];
    content: string;
    onsave: () => void;
    onselectfile: (fileName: string) => void;
    oncontentchange: (value: string) => void;
    oneditorkeydown: (event: KeyboardEvent) => void;
  }

  let {
    activeFileName,
    fileNames,
    content,
    onsave,
    onselectfile,
    oncontentchange,
    oneditorkeydown,
  }: Props = $props();
</script>

<section class="panel editor-panel">
  <div class="panel-header">
    <h2>{activeFileName}</h2>
    <button type="button" onclick={onsave}>Save</button>
  </div>
  {#if fileNames.length > 1}
    <div class="file-tabs" role="tablist" aria-label="Scenario files">
      {#each fileNames as fileName}
        <button
          type="button"
          role="tab"
          class:active={fileName === activeFileName}
          aria-selected={fileName === activeFileName}
          onclick={() => onselectfile(fileName)}
        >
          {fileName}
        </button>
      {/each}
    </div>
  {/if}
  <textarea
    value={content}
    name="scenario-file-content"
    aria-label={`Edit ${activeFileName}`}
    spellcheck="false"
    oninput={(event) => oncontentchange(event.currentTarget.value)}
    onkeydown={oneditorkeydown}
  ></textarea>
</section>
