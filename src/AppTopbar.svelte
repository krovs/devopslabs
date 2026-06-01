<script lang="ts">
  type PageName = "index" | "labs" | "docs";

  interface Props {
    currentPage: PageName;
    heading: string;
    menuOpen: boolean;
    solved: boolean;
    healthClass: string;
    healthLabel: string;
    incidentMode: boolean;
    onopenmenu: () => void;
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
  <div>
    <h1>{heading}</h1>
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
    {#if !incidentMode}
      <button type="button" class="solution-button" onclick={onopensolution}>Show solution</button>
    {/if}
    <button type="button" class="reset-button" onclick={onreset}>Reset</button>
  {/if}
</header>
