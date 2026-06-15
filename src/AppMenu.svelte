<script lang="ts">
  import { tick } from "svelte";
  import Shuffle from "carbon-icons-svelte/lib/Shuffle.svelte";
  import FireFill from "carbon-icons-svelte/lib/FireFill.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
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
  const labNavSections: { id: string; title: string; groupIds: MenuGroupId[] }[] = [
    { id: "infrastructure", title: "Infrastructure", groupIds: ["terraform", "awsconfig", "terragrunt", "networking"] },
    { id: "delivery", title: "Delivery", groupIds: ["cicd", "gitops"] },
    { id: "runtime", title: "Runtime", groupIds: ["linux", "kubernetes", "observability"] },
    { id: "security", title: "Security", groupIds: ["appsec", "threatmodel", "cloudsec", "iam", "scp", "policy", "secrets"] },
    { id: "cloud-ops", title: "Cloud Ops", groupIds: ["dns", "finops", "mlops", "pr"] },
  ];

  let totalScenarioIds = $derived(labGroups.flatMap((group) => group.ids));
  let completedTotal = $derived(totalScenarioIds.filter((id) => completedScenarioIds.includes(id)).length);
  let totalProgressPercent = $derived(totalScenarioIds.length ? Math.round((completedTotal / totalScenarioIds.length) * 100) : 0);
  let totalProgressColor = $derived(totalProgressPercent >= 100 ? "var(--ok)" : "var(--accent)");
  let menuListElement: HTMLDivElement | null = $state(null);
  let openLabNavSections = $state(new Set<string>(labNavSections.map((section) => section.id)));

  function isSelectedLabGroup(groupId: MenuGroupId): boolean {
    return highlightedMenuGroup === groupId;
  }

  function labGroupById(groupId: MenuGroupId): LabGroup | undefined {
    return labGroups.find((group) => group.id === groupId);
  }

  function sectionIds(section: { groupIds: MenuGroupId[] }): string[] {
    return section.groupIds.flatMap((groupId) => labGroupById(groupId)?.ids ?? []);
  }

  function sectionVisible(section: { groupIds: MenuGroupId[] }): boolean {
    return section.groupIds.some((groupId) => {
      const group = labGroupById(groupId);
      return group ? menugroupvisible(group.ids, menuSearchQuery) : false;
    });
  }

  function sectionContainsSelected(section: { groupIds: MenuGroupId[] }): boolean {
    return Boolean(highlightedMenuGroup && section.groupIds.includes(highlightedMenuGroup));
  }

  function sectionOpen(sectionId: string): boolean {
    return openLabNavSections.has(sectionId) || Boolean(menuSearchQuery.trim());
  }

  function toggleLabNavSection(sectionId: string): void {
    const next = new Set(openLabNavSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    openLabNavSections = next;
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

    await scrollToGroup(groupId);
  }

  async function scrollToGroup(groupId: MenuGroupId): Promise<void> {
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const el = menuListElement
      ?.querySelector<HTMLElement>(`[data-menu-group-id="${groupId}"]`);
    if (el) {
      const listRect = menuListElement!.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollBy = elRect.bottom - listRect.bottom + 12;
      if (scrollBy > 0) {
        menuListElement!.scrollBy({ top: scrollBy, behavior: "smooth" });
      }
    }
  }

  $effect(() => {
    if (open && highlightedMenuGroup) {
      const section = labNavSections.find((item) => item.groupIds.includes(highlightedMenuGroup));
      if (section && !openLabNavSections.has(section.id)) {
        openLabNavSections = new Set([...openLabNavSections, section.id]);
      }
      void scrollToGroup(highlightedMenuGroup);
    }
  });
</script>

{#if open}
  <button class="menu-backdrop" type="button" aria-label="Close menu" onclick={onclose}></button>
{/if}

<aside class:open class="app-menu" aria-label="Application menu" aria-hidden={!open}>
  <div class="menu-header">
    <button type="button" class="menu-close-button" aria-label="Close menu" onclick={onclose}>×</button>
    <button type="button" class="menu-header-logo" aria-label="Back to start" title="Back to start" onclick={onopenindex}>
      <img src={sidebarLogo} width="34" height="34" alt="Back to start" />
    </button>
    <div class="menu-header-controls">
      <button
        type="button"
        class="random-scenario-icon-button"
        aria-label="Random incident"
        title="Random incident"
        onclick={onrandomscenario}
      >
        <Shuffle size={16} aria-hidden="true" />
      </button>
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
    <div class="menu-actions">
      <div class="menu-search">
        <label class="menu-search-label">
          <span class="menu-search-control">
            <input
              value={menuSearchQuery}
              name="lab-search"
              aria-label="Search labs"
              placeholder="Search labs…"
              autocomplete="off"
              spellcheck="false"
              oninput={(event) => onsearchchange(event.currentTarget.value)}
            >
            {#if menuSearchQuery}
              <button type="button" class="menu-search-clear" aria-label="Clear search" onclick={() => onsearchchange("")}>×</button>
            {/if}
          </span>
        </label>
      </div>
    </div>
    <div class="menu-lab-list" bind:this={menuListElement}>
      {#each labNavSections as section}
        {#if sectionVisible(section)}
          {@const ids = sectionIds(section)}
          <div class="menu-lab-nav-section" class:contains-selected={sectionContainsSelected(section)}>
            <button
              type="button"
              class="menu-nav-section-button"
              aria-expanded={sectionOpen(section.id)}
              onclick={() => toggleLabNavSection(section.id)}
            >
              <span>{section.title}</span>
              <small>{groupcompletionlabel(ids)}</small>
            </button>
            {#if sectionOpen(section.id)}
              <div class="menu-nav-section-groups">
                {#each section.groupIds as groupId}
                  {@const group = labGroupById(groupId)}
                  {#if group && menugroupvisible(group.ids, menuSearchQuery)}
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
              </div>
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
