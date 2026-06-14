<script lang="ts">
  interface Props {
    activeFileName: string;
    fileNames: string[];
    content: string;
    dirty: boolean;
    filedirty: (fileName: string) => boolean;
    onsave: () => void;
    onselectfile: (fileName: string) => void;
    oncontentchange: (value: string) => void;
    oneditorkeydown: (event: KeyboardEvent) => void;
  }

  let {
    activeFileName,
    fileNames,
    content,
    dirty,
    filedirty,
    onsave,
    onselectfile,
    oncontentchange,
    oneditorkeydown,
  }: Props = $props();
</script>

<section class="panel editor-panel">
  <div class="panel-header">
    <h2>{activeFileName}</h2>
    <div class="editor-save-state" aria-live="polite">
      {#if dirty}
        <span>Unsaved</span>
      {/if}
      <button type="button" class:dirty disabled={!dirty} onclick={onsave}>Save</button>
    </div>
  </div>
  {#if fileNames.length > 1}
    <div class="file-tabs" role="tablist" aria-label="Scenario files">
      {#each fileNames as fileName}
        {@const tabDirty = filedirty(fileName)}
        <button
          type="button"
          role="tab"
          class:active={fileName === activeFileName}
          class:dirty={tabDirty}
          aria-selected={fileName === activeFileName}
          aria-label={`${fileName}${tabDirty ? ", unsaved changes" : ""}`}
          title={`${fileName}${tabDirty ? " - unsaved changes" : ""}`}
          onclick={() => onselectfile(fileName)}
        >
          <span class="file-tab-label">{fileName}</span>
          {#if tabDirty}
            <span class="file-tab-dot" aria-hidden="true"></span>
          {/if}
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
