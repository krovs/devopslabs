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
    outputref: (element: HTMLPreElement) => void;
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

  let outputElement = $state<HTMLPreElement>();
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
    <button type="button" onclick={onclear}>Clear</button>
  </div>
  <pre bind:this={outputElement} aria-live="polite">{lines.join("\n")}</pre>
  <form onsubmit={submitCommand}>
    <span>$</span>
    <input
      bind:this={inputElement}
      value={input}
      autocomplete="off"
      spellcheck="false"
      oninput={(event) => oninputchange(event.currentTarget.value)}
      onkeydown={oncommandkeydown}
    >
  </form>
</section>
