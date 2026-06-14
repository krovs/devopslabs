<script lang="ts">
  interface Props {
    lines: string[];
    input: string;
    oninputchange: (value: string) => void;
    onrun: () => void;
    onclear: () => void;
    oncommandkeydown: (event: KeyboardEvent) => void;
    onresizepointerdown: (event: PointerEvent) => void;
    onresizekeydown: (event: KeyboardEvent) => void;
    outputref: (element: HTMLDivElement) => void;
    inputref: (element: HTMLInputElement) => void;
  }

  let {
    lines,
    input,
    oninputchange,
    onrun,
    onclear,
    oncommandkeydown,
    onresizepointerdown,
    onresizekeydown,
    outputref,
    inputref,
  }: Props = $props();

  let outputElement = $state<HTMLDivElement>();
  let inputElement = $state<HTMLInputElement>();

  $effect(() => {
    if (outputElement) outputref(outputElement);
  });

  $effect(() => {
    if (inputElement) inputref(inputElement);
  });

  function submitCommand(event: SubmitEvent): void {
    event.preventDefault();
    onrun();
  }

  function terminalLineClass(line: string): string {
    const normalized = line.trim().toLowerCase();
    if (line.startsWith("$ ")) return "terminal-line terminal-line-command";
    if (
      normalized.startsWith("error") ||
      normalized.includes(" failed") ||
      normalized.startsWith("failed") ||
      normalized.startsWith("not complete") ||
      normalized.includes("invalid")
    ) return "terminal-line terminal-line-error";
    if (normalized.startsWith("warning") || normalized.startsWith("warn") || normalized.includes("blocked")) {
      return "terminal-line terminal-line-warn";
    }
    if (
      normalized.startsWith("pass") ||
      normalized.includes("success") ||
      normalized.includes("complete") ||
      normalized.includes("successfully") ||
      normalized.includes("no changes") ||
      normalized.includes("passed")
    ) return "terminal-line terminal-line-success";
    return "terminal-line";
  }
</script>

<section class="panel terminal-panel" role="application">
  <button
    type="button"
    class="terminal-resize-handle"
    aria-label="Resize terminal"
    onpointerdown={onresizepointerdown}
    onkeydown={onresizekeydown}
  ></button>
  <div class="panel-header">
    <h2>Terminal</h2>
    <button type="button" disabled={!lines.length} onclick={onclear}>Clear</button>
  </div>
  <div class="terminal-output" bind:this={outputElement} aria-live="polite">
    {#if lines.length}
      {#each lines as line}
        <code class={terminalLineClass(line)}>{line || " "}</code>
      {/each}
    {:else}
      <p class="terminal-empty">Type help to list available commands.</p>
    {/if}
  </div>
  <form onsubmit={submitCommand}>
    <span>$</span>
    <input
      bind:this={inputElement}
      value={input}
      name="terminal-command"
      aria-label="Terminal command"
      autocomplete="off"
      spellcheck="false"
      oninput={(event) => oninputchange(event.currentTarget.value)}
      onkeydown={oncommandkeydown}
    >
  </form>
</section>
