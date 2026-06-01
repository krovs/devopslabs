<script lang="ts">
  interface Props {
    activeFileName: string;
    fileNames: string[];
    content: string;
    prNumber: string;
    solved: boolean;
    onselectfile: (fileName: string) => void;
  }

  let { activeFileName, fileNames, content, prNumber, solved, onselectfile }: Props = $props();

  let diffLines = $derived(content.split("\n"));

  function diffLineClass(line: string): string {
    if (line.startsWith("diff --git") || line.startsWith("index ")) return "diff-line diff-line-meta";
    if (line.startsWith("@@")) return "diff-line diff-line-hunk";
    if (line.startsWith("+++") || line.startsWith("---")) return "diff-line diff-line-file";
    if (line.startsWith("+")) return "diff-line diff-line-add";
    if (line.startsWith("-")) return "diff-line diff-line-remove";
    return "diff-line";
  }
</script>

<section class="panel pr-diff-panel">
  <div class="panel-header">
    <h2>{activeFileName}</h2>
    <span class={solved ? "badge badge-ok" : "badge badge-warn"}>{prNumber}</span>
  </div>
  {#if fileNames.length > 1}
    <div class="file-tabs" role="tablist" aria-label="Pull request files">
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
  <div class="pr-diff-view" aria-label="Pull request diff">
    {#each diffLines as line}
      <code class={diffLineClass(line)}>{line || " "}</code>
    {/each}
  </div>
</section>
