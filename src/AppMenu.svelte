<script lang="ts">
  import { tick } from "svelte";
  import Shuffle from "carbon-icons-svelte/lib/Shuffle.svelte";
  import FireFill from "carbon-icons-svelte/lib/FireFill.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import footerFern from "./assets/fern.png";
  import sidebarLogo from "./assets/octopus.png";
  import { scenarioDifficultyClass, type LabGroup, type MenuGroupId } from "./labCatalog";

  type ThemeName = "latte" | "mocha" | "dracula" | "cyberpunk";

  interface Props {
    open: boolean;
    theme: ThemeName;
    incidentMode: boolean;
    menuSearchQuery: string;
    labGroups: LabGroup[];
    openMenuGroups: MenuGroupId[];
    highlightedMenuGroup: MenuGroupId | null;
    currentScenarioId: string;
    completedScenarioIds: string[];
    onclose: () => void;
    onopenindex: () => void;
    onthemechange: (theme: ThemeName) => void;
    onrandomscenario: () => void;
    onincidentmodechange: (enabled: boolean) => void;
    onsearchchange: (query: string) => void;
    ontogglegroup: (group: MenuGroupId) => void;
    onselectscenario: (id: string) => void;
    ontogglecompletion: (id: string, event: Event) => void;
    ontogglegroupcompletion: (ids: string[], event: Event) => void;
    groupcompletionlabel: (ids: string[]) => string;
    groupcompletionpercent: (ids: string[]) => number;
    groupcompletionstate: (ids: string[]) => "complete" | "partial" | "empty";
    menugroupvisible: (ids: string[], query: string) => boolean;
    filteredscenarioids: (ids: string[], query: string) => string[];
    labmenutitle: (id: string) => string;
  }

  let {
    open,
    theme,
    incidentMode,
    menuSearchQuery,
    labGroups,
    openMenuGroups,
    highlightedMenuGroup,
    currentScenarioId,
    completedScenarioIds,
    onclose,
    onopenindex,
    onthemechange,
    onrandomscenario,
    onincidentmodechange,
    onsearchchange,
    ontogglegroup,
    onselectscenario,
    ontogglecompletion,
    ontogglegroupcompletion,
    groupcompletionlabel,
    groupcompletionpercent,
    groupcompletionstate,
    menugroupvisible,
    filteredscenarioids,
    labmenutitle,
  }: Props = $props();

  const themes: { id: ThemeName; label: string }[] = [
    { id: "latte", label: "Latte theme" },
    { id: "mocha", label: "Mocha theme" },
    { id: "dracula", label: "Dracula theme" },
    { id: "cyberpunk", label: "Cyber theme" },
  ];

  let totalScenarioIds = $derived(labGroups.flatMap((group) => group.ids));
  let completedTotal = $derived(totalScenarioIds.filter((id) => completedScenarioIds.includes(id)).length);
  let totalProgressPercent = $derived(totalScenarioIds.length ? Math.round((completedTotal / totalScenarioIds.length) * 100) : 0);
  let totalProgressColor = $derived(totalProgressPercent >= 100 ? "var(--ok)" : "var(--accent)");
  let menuListElement: HTMLDivElement | null = $state(null);
  let searchInputElement: HTMLInputElement | null = $state(null);
  let searchExpanded = $state(false);
  let searchOpen = $derived(searchExpanded || Boolean(menuSearchQuery.trim()));

  function isSelectedLabGroup(groupId: MenuGroupId): boolean {
    return highlightedMenuGroup === groupId;
  }

  function toggleCompletionWithKeyboard(id: string, event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") ontogglecompletion(id, event);
  }

  function toggleGroupCompletionWithKeyboard(ids: string[], event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") ontogglegroupcompletion(ids, event);
  }

  async function toggleLabGroup(groupId: MenuGroupId): Promise<void> {
    const wasOpen = openMenuGroups.includes(groupId) || Boolean(menuSearchQuery.trim());
    ontogglegroup(groupId);
    if (wasOpen) return;

    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    menuListElement
      ?.querySelector<HTMLElement>(`[data-menu-group-id="${groupId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  async function openSearch(): Promise<void> {
    searchExpanded = true;
    await tick();
    searchInputElement?.focus();
  }

  function collapseSearchIfEmpty(): void {
    if (!menuSearchQuery.trim()) searchExpanded = false;
  }

  function handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (menuSearchQuery) onsearchchange("");
    searchExpanded = false;
  }
</script>

{#if open}
  <button class="menu-backdrop" type="button" aria-label="Close menu" onclick={onclose}></button>
{/if}

<aside class:open class="app-menu" aria-label="Application menu" aria-hidden={!open}>
  <div class="menu-header">
    <button type="button" class="menu-close-button" aria-label="Close menu" onclick={onclose}>×</button>
    <div class="menu-header-controls">
      <button
        type="button"
        class="incident-mode-button"
        class:active={incidentMode}
        aria-label="Incident Mode. Hide lab names and direct requirements for unsolved labs."
        aria-pressed={incidentMode}
        title="Incident Mode: hide lab names until solved."
        onclick={() => onincidentmodechange(!incidentMode)}
      >
        <FireFill size={16} aria-hidden="true" />
      </button>
      <div class="theme-dots" aria-label="Theme">
        {#each themes as option}
          <button
            type="button"
            class={`theme-dot theme-dot-${option.id}`}
            class:active={theme === option.id}
            aria-label={option.label}
            onclick={() => onthemechange(option.id)}
          ></button>
        {/each}
      </div>
    </div>
  </div>

  <div class="menu-logo-row">
    <button type="button" class="menu-logo-button" aria-label="Open lab index" onclick={onopenindex}>
      <img class="menu-logo" src={sidebarLogo} width="118" height="118" alt="" />
    </button>
  </div>

  <section class="menu-section">
    <div
      class="menu-global-progress"
      aria-label={`Overall lab progress ${completedTotal} of ${totalScenarioIds.length}`}
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax={totalScenarioIds.length}
      aria-valuenow={completedTotal}
      style={`--menu-global-progress: ${totalProgressPercent}%; --menu-global-progress-color: ${totalProgressColor}`}
    >
      <div class="menu-global-progress-track">
        <span></span>
      </div>
      <div class="menu-progress-summary">
        <span>{completedTotal}/{totalScenarioIds.length} complete</span>
        <span>{totalProgressPercent}%</span>
      </div>
    </div>
  </section>

  <section class="menu-section lab-menu-section">
    <div class="menu-actions" class:search-open={searchOpen}>
      <button type="button" class="random-scenario-button" onclick={onrandomscenario}>
        <Shuffle size={16} aria-hidden="true" />
        <span>Random Incident</span>
      </button>
      <div class="menu-search">
        {#if searchOpen}
          <label class="menu-search-label">
            <span class="menu-search-control">
              <input
                bind:this={searchInputElement}
                value={menuSearchQuery}
                name="lab-search"
                aria-label="Search labs"
                placeholder="Search labs…"
                autocomplete="off"
                spellcheck="false"
                oninput={(event) => onsearchchange(event.currentTarget.value)}
                onblur={collapseSearchIfEmpty}
                onkeydown={handleSearchKeydown}
              >
            </span>
          </label>
        {:else}
          <button type="button" class="menu-search-button" aria-label="Search labs" onclick={() => void openSearch()}>
            <Search size={16} aria-hidden="true" />
          </button>
        {/if}
      </div>
    </div>
    <div class="menu-lab-list" bind:this={menuListElement}>
      {#each labGroups as group}
        {#if menugroupvisible(group.ids, menuSearchQuery)}
          {@const visibleIds = filteredscenarioids(group.ids, menuSearchQuery)}
          {@const groupState = groupcompletionstate(group.ids)}
          {@const groupPercent = groupcompletionpercent(group.ids)}
          <div class="menu-lab-group" class:selected-section={isSelectedLabGroup(group.id)} data-menu-group-id={group.id}>
            <div class="menu-group-header">
              <span
                class:scenario-check-empty={groupState !== "complete"}
                class:group-check-progress={groupState === "partial"}
                class="scenario-check group-check"
                role="checkbox"
                tabindex="0"
                style={`--group-completion-percent: ${groupPercent}%`}
                aria-label={groupState === "complete" ? `Mark ${group.title} incomplete` : `Mark ${group.title} complete`}
                aria-checked={groupState === "partial" ? "mixed" : groupState === "complete" ? "true" : "false"}
                onclick={(event) => ontogglegroupcompletion(group.ids, event)}
                onkeydown={(event) => toggleGroupCompletionWithKeyboard(group.ids, event)}
              >{groupState === "complete" ? "✓" : ""}</span>
              <button
                type="button"
                class="menu-group-button"
                aria-expanded={openMenuGroups.includes(group.id) || Boolean(menuSearchQuery.trim())}
                onclick={() => void toggleLabGroup(group.id)}
              >
                <span>
                  <strong>{group.title}</strong>
                </span>
                <small>{groupcompletionlabel(group.ids)}</small>
              </button>
            </div>
            {#if openMenuGroups.includes(group.id) || menuSearchQuery.trim()}
              {#key incidentMode}
                <div class="scenario-list">
                  {#each visibleIds as id}
                    <button
                      type="button"
                      class={`scenario-difficulty ${scenarioDifficultyClass(id)}`}
                      class:active={id === currentScenarioId}
                      class:completed={completedScenarioIds.includes(id)}
                      aria-current={id === currentScenarioId ? "page" : undefined}
                      onclick={() => onselectscenario(id)}
                    >
                      <span class="scenario-title">{labmenutitle(id)}</span>
                      {#if completedScenarioIds.includes(id)}
                        <span
                          class="scenario-check"
                          role="button"
                          tabindex="0"
                          aria-label="Mark incomplete"
                          onclick={(event) => ontogglecompletion(id, event)}
                          onkeydown={(event) => toggleCompletionWithKeyboard(id, event)}
                        >✓</span>
                      {:else}
                        <span
                          class="scenario-check scenario-check-empty"
                          role="button"
                          tabindex="0"
                          aria-label="Mark complete"
                          onclick={(event) => ontogglecompletion(id, event)}
                          onkeydown={(event) => toggleCompletionWithKeyboard(id, event)}
                        ></span>
                      {/if}
                    </button>
                  {/each}
                </div>
              {/key}
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </section>

  <footer class="menu-footer">
    <a class="menu-repo-link" href="https://krovs.dev" target="_blank" rel="noreferrer">
      <img class="menu-footer-icon" src={footerFern} width="28" height="28" alt="" />krovs@2026
    </a>
    <a class="menu-github-link" href="https://github.com/krovs/devopslabs" target="_blank" rel="noreferrer" aria-label="Open GitHub repository">
      <LogoGithub size={20} aria-hidden="true" />
    </a>
  </footer>
</aside>
