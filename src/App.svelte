<script lang="ts">
  import { createAppController } from "./appController.svelte";
  import AppView from "./AppView.svelte";
  import { parseRoute, replaceRoute } from "./appRouter";
  import { scenarios } from "./scenarios";

  const app = createAppController();
  const scenarioIds = new Set(Object.keys(scenarios));
  let handlingPop = false;

  function handlePopState(): void {
    if (handlingPop) return;
    handlingPop = true;

    const route = parseRoute(window.location.pathname, scenarioIds);
    if (route?.page === "labs") {
      void app.scenarioNavigation.load(route.scenarioId, { restoreSavedSession: true, persist: false });
      app.appShell.openScenario();
    } else if (route?.page === "index") {
      app.scenarioNavigation.openLabs();
    }

    handlingPop = false;
  }

  $effect(() => {
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });
</script>

<AppView {app} />
