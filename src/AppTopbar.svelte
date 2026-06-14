<script lang="ts">
  import ChevronDown from "carbon-icons-svelte/lib/ChevronDown.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import ManagedSolutions from "carbon-icons-svelte/lib/ManagedSolutions.svelte";
  import Reset from "carbon-icons-svelte/lib/Reset.svelte";
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

  let actionsOpen = $state(false);

  $effect(() => {
    if (currentPage !== "labs") actionsOpen = false;
  });

  function toggleActions(): void {
    actionsOpen = !actionsOpen;
  }

  function closeActionsOnBlur(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget instanceof HTMLElement && event.currentTarget.contains(nextTarget)) return;
    actionsOpen = false;
  }

  function handleActionsKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    actionsOpen = false;
    (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(".actions-menu-button")?.focus();
  }

  function runAction(action: () => void): void {
    actionsOpen = false;
    action();
  }
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
        <img class="topbar-title-icon" src={octopusIcon} width="32" height="32" alt="" />
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
    <div class="topbar-actions" onfocusout={closeActionsOnBlur}>
      <button
        type="button"
        class="actions-menu-button"
        aria-haspopup="menu"
        aria-expanded={actionsOpen}
        onclick={toggleActions}
        onkeydown={handleActionsKeydown}
      >
        <span>Actions</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {#if actionsOpen}
        <div class="actions-menu" role="menu" aria-label="Lab actions">
          <button type="button" role="menuitem" onclick={() => runAction(onopenreference)} onkeydown={handleActionsKeydown}>
            <Document size={16} aria-hidden="true" />
            <span>Reference</span>
          </button>
          {#if !incidentMode}
            <button type="button" role="menuitem" onclick={() => runAction(onopensolution)} onkeydown={handleActionsKeydown}>
              <ManagedSolutions size={16} aria-hidden="true" />
              <span>Show solution</span>
            </button>
          {/if}
          <button type="button" role="menuitem" class="danger" onclick={() => runAction(onreset)} onkeydown={handleActionsKeydown}>
            <Reset size={16} aria-hidden="true" />
            <span>Reset lab</span>
          </button>
        </div>
      {/if}
    </div>
  {/if}
</header>
