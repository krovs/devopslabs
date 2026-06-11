<script lang="ts">
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import octopusIcon from "./assets/octopus.png";

  type PageName = "index" | "labs";

  interface Props {
    currentPage: PageName;
    heading: string;
    menuOpen: boolean;
    solved: boolean;
    healthClass: string;
    healthLabel: string;
    incidentMode: boolean;
    onopenmenu: () => void;
    onopenreference: () => void;
    onopensolution: () => void;
    onreset: () => void;
  }

  let {
    currentPage,
    heading,
    menuOpen,
    solved,
    healthClass,
    healthLabel,
    incidentMode,
    onopenmenu,
    onopenreference,
    onopensolution,
    onreset,
  }: Props = $props();
</script>

<header class="topbar">
  <button
    type="button"
    class="hamburger-button"
    aria-label="Open menu"
    aria-expanded={menuOpen}
    onclick={onopenmenu}
  >
    <span></span>
    <span></span>
    <span></span>
  </button>
  <div class="topbar-title">
    <h1>
      {#if currentPage === "index"}
        <img class="topbar-title-icon" src={octopusIcon} alt="" />
      {/if}
      <span>{heading}</span>
    </h1>
  </div>
  {#if currentPage === "labs"}
    <div class="topbar-badges">
      <span class={solved ? "badge badge-ok" : "badge badge-warn"}>
        Status: {solved ? "complete" : "in progress"}
      </span>
      <span class={healthClass}>{healthLabel}</span>
      {#if incidentMode && !solved}
        <span class="badge badge-warn">incident</span>
      {/if}
    </div>
    <button type="button" class="reference-button" onclick={onopenreference}>
      <Document size={16} aria-hidden="true" />
      <span>Reference</span>
    </button>
    {#if !incidentMode}
      <button type="button" class="solution-button" onclick={onopensolution}>Show solution</button>
    {/if}
    <button type="button" class="reset-button" onclick={onreset}>Reset</button>
  {/if}
</header>
