<script lang="ts">
  import { createAppController } from "./appController.svelte";
  import AppView from "./AppView.svelte";

  const app = createAppController();
</script>

<AppView {app} />
