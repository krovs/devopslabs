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

  function handlePointerMove(event: PointerEvent): void {
    appShell.resizeTerminal(event);
    appShell.resizeWorkspace(event);
  }

  function handlePointerUp(): void {
    appShell.stopTerminalResize();
    appShell.stopWorkspaceResize();
  }
</script>

<svelte:window
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onkeydown={appShell.handleGlobalKeydown}
/>
