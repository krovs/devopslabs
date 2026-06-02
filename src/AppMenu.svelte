<script lang="ts">
  import Chemistry from "carbon-icons-svelte/lib/Chemistry.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import { scenarioDifficultyClass, type LabGroup, type MenuGroupId } from "./labCatalog";

  type PageName = "index" | "labs" | "docs";
  type ThemeName = "latte" | "mocha" | "dracula" | "cyberpunk";

  interface Props {
    open: boolean;
    theme: ThemeName;
    currentPage: PageName;
    incidentMode: boolean;
    menuSearchQuery: string;
    labGroups: LabGroup[];
    openMenuGroups: MenuGroupId[];
    currentScenarioId: string;
    completedScenarioIds: string[];
    onclose: () => void;
    onthemechange: (theme: ThemeName) => void;
    onopenlabs: () => void;
    onopendocs: () => void;
    onincidentmodechange: (enabled: boolean) => void;
    onsearchchange: (query: string) => void;
    ontogglegroup: (group: MenuGroupId) => void;
    onselectscenario: (id: string) => void;
    ontogglecompletion: (id: string, event: Event) => void;
    groupcompletionlabel: (ids: string[]) => string;
    menugroupvisible: (ids: string[], query: string) => boolean;
    filteredscenarioids: (ids: string[], query: string) => string[];
    labmenutitle: (id: string) => string;
  }

  let {
    open,
    theme,
    currentPage,
    incidentMode,
    menuSearchQuery,
    labGroups,
    openMenuGroups,
    currentScenarioId,
    completedScenarioIds,
    onclose,
    onthemechange,
    onopenlabs,
    onopendocs,
    onincidentmodechange,
    onsearchchange,
    ontogglegroup,
    onselectscenario,
    ontogglecompletion,
    groupcompletionlabel,
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

  function isSelectedLabGroup(groupId: MenuGroupId): boolean {
    return currentPage === "index" && openMenuGroups.length === 1 && openMenuGroups[0] === groupId;
  }

  function toggleCompletionWithKeyboard(id: string, event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") ontogglecompletion(id, event);
  }
</script>

{#if open}
  <button class="menu-backdrop" type="button" aria-label="Close menu" onclick={onclose}></button>
{/if}

<aside class:open class="app-menu" aria-label="Application menu" aria-hidden={!open}>
  <div class="menu-header">
    <button type="button" class="menu-close-button" aria-label="Close menu" onclick={onclose}>×</button>
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

  <section class="menu-section">
    <div class="menu-actions menu-page-actions">
      <button type="button" class:active={currentPage !== "docs"} onclick={onopenlabs}>
        <Chemistry size={16} aria-hidden="true" />
        <span>Labs</span>
      </button>
      <button type="button" class:active={currentPage === "docs"} onclick={onopendocs}>
        <Document size={16} aria-hidden="true" />
        <span>Documentation</span>
      </button>
    </div>
  </section>

  <section class="menu-section">
    <div class="menu-actions">
      <label class="menu-toggle">
        <span>
          <strong>Incident Mode</strong>
          <small>Hide lab names and direct requirements for unsolved labs.</small>
        </span>
        <input type="checkbox" checked={incidentMode} onchange={(event) => onincidentmodechange(event.currentTarget.checked)}>
      </label>
    </div>
  </section>

  <section class="menu-section lab-menu-section">
    <label class="menu-search">
      <span class="menu-search-control">
        <input
          value={menuSearchQuery}
          placeholder="Filter by name, category, or description"
          autocomplete="off"
          spellcheck="false"
          oninput={(event) => onsearchchange(event.currentTarget.value)}
        >
      </span>
    </label>
    {#each labGroups as group}
      {#if menugroupvisible(group.ids, menuSearchQuery)}
        <div class="menu-lab-group" class:selected-section={isSelectedLabGroup(group.id)}>
          <button
            type="button"
            class="menu-group-button"
            aria-expanded={openMenuGroups.includes(group.id) || Boolean(menuSearchQuery.trim())}
            onclick={() => ontogglegroup(group.id)}
          >
            <span>
              <strong>{group.title}</strong>
            </span>
            <small>{groupcompletionlabel(group.ids)}</small>
          </button>
          {#if openMenuGroups.includes(group.id) || menuSearchQuery.trim()}
            {#key incidentMode}
              <div class="scenario-list">
                {#each filteredscenarioids(group.ids, menuSearchQuery) as id}
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
  </section>

  <a class="menu-repo-link" href="https://github.com/krovs/devopslabs" target="_blank" rel="noreferrer">
    <span>🌵 krovs@2026</span>
    <Launch size={16} aria-hidden="true" />
  </a>
</aside>
