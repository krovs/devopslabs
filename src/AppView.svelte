<script lang="ts">
  import AppChrome from "./AppChrome.svelte";
  import AppGlobalEvents from "./AppGlobalEvents.svelte";
  import AppMain from "./AppMain.svelte";
  import type { AppController } from "./appController.svelte";

  interface Props {
    app: AppController;
  }

  let { app }: Props = $props();
</script>

<AppGlobalEvents appShell={app.appShell} terminal={app.terminal} />

<AppChrome {app} />

<AppMain {app} />
