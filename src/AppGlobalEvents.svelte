<script lang="ts">
  import type { createAppShellSession } from "./appShellSession.svelte";
  import type { createTerminalSession } from "./terminalSession.svelte";

  interface Props {
    appShell: ReturnType<typeof createAppShellSession>;
    terminal: ReturnType<typeof createTerminalSession>;
  }

  let { appShell, terminal }: Props = $props();

  function handlePointerDown(event: PointerEvent): void {
    if (!(event.target as HTMLElement | null)?.closest(".terminal-panel")) return;
    window.setTimeout(() => terminal.focusInput(), 0);
  }
</script>

<svelte:window
  onpointerdown={handlePointerDown}
  onpointermove={appShell.resizeTerminal}
  onpointerup={appShell.stopTerminalResize}
  onkeydown={appShell.handleGlobalKeydown}
/>
