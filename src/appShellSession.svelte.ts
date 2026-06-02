import {
  clampTerminalHeight,
  getInitialIncidentMode,
  getInitialOpenMenuGroups,
  getInitialTerminalHeight,
  getInitialTheme,
  type AppPage,
  type ThemeName,
} from "./appUi";
import type { MenuGroupId } from "./labCatalog";

export type AppShellSessionOptions = {
  initialScenarioId: string;
  scenarioMenuGroup: (id: string) => MenuGroupId;
};

export function createAppShellSession(options: AppShellSessionOptions) {
  let theme = $state<ThemeName>(getInitialTheme());
  let incidentMode = $state(getInitialIncidentMode());
  let terminalHeight = $state(getInitialTerminalHeight(clampTerminalHeight));
  let isResizingTerminal = $state(false);
  let isMenuOpen = $state(false);
  let menuSearchQuery = $state("");
  let openMenuGroups = $state<MenuGroupId[]>(getInitialOpenMenuGroups(options.initialScenarioId, options.scenarioMenuGroup));
  let highlightedMenuGroup = $state<MenuGroupId | null>(null);
  let currentPage = $state<AppPage>("index");

  $effect(() => {
    document.body.classList.toggle("dark-mode", theme === "mocha");
    document.body.classList.toggle("dracula-mode", theme === "dracula");
    document.body.classList.toggle("cyberpunk-mode", theme === "cyberpunk");
    localStorage.setItem("terraform-sim-theme", theme);
    localStorage.setItem("terraform-sim-incident-mode", String(incidentMode));
    localStorage.setItem("terraform-sim-open-menu-groups", JSON.stringify(openMenuGroups));
  });

  function persistTerminalHeight(): void {
    localStorage.setItem("terraform-sim-terminal-height", String(terminalHeight));
  }

  function resizeTerminal(event: PointerEvent): void {
    if (!isResizingTerminal) return;
    terminalHeight = clampTerminalHeight(window.innerHeight - event.clientY - 12);
    persistTerminalHeight();
  }

  return {
    get theme() {
      return theme;
    },
    get incidentMode() {
      return incidentMode;
    },
    get terminalHeight() {
      return terminalHeight;
    },
    get isResizingTerminal() {
      return isResizingTerminal;
    },
    get isMenuOpen() {
      return isMenuOpen;
    },
    get menuSearchQuery() {
      return menuSearchQuery;
    },
    get openMenuGroups() {
      return openMenuGroups;
    },
    get highlightedMenuGroup() {
      return highlightedMenuGroup;
    },
    get currentPage() {
      return currentPage;
    },
    setTheme(nextTheme: ThemeName): void {
      theme = nextTheme;
    },
    setIncidentMode(enabled: boolean): void {
      incidentMode = enabled;
      openMenuGroups = [...openMenuGroups];
    },
    setMenuSearchQuery(query: string): void {
      menuSearchQuery = query;
      highlightedMenuGroup = null;
    },
    openMenu(): void {
      isMenuOpen = true;
      openMenuGroups = [];
      highlightedMenuGroup = null;
    },
    openMenuForScenario(scenarioId: string): void {
      const group = options.scenarioMenuGroup(scenarioId);
      isMenuOpen = true;
      openMenuGroups = [group];
      highlightedMenuGroup = group;
    },
    closeMenu(): void {
      isMenuOpen = false;
      openMenuGroups = [];
      highlightedMenuGroup = null;
    },
    handleGlobalKeydown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        isMenuOpen = false;
        openMenuGroups = [];
        highlightedMenuGroup = null;
      }
    },
    toggleMenuGroup(group: MenuGroupId): void {
      if (openMenuGroups.includes(group)) {
        openMenuGroups = [];
        highlightedMenuGroup = null;
        return;
      }

      openMenuGroups = [group];
      highlightedMenuGroup = group;
    },
    ensureMenuGroupOpen(group: MenuGroupId): void {
      if (!openMenuGroups.includes(group)) openMenuGroups = [...openMenuGroups, group];
    },
    openDocs(): void {
      currentPage = "docs";
      isMenuOpen = false;
      openMenuGroups = [];
      highlightedMenuGroup = null;
    },
    openLabs(): void {
      currentPage = "index";
      isMenuOpen = false;
      openMenuGroups = [];
      highlightedMenuGroup = null;
    },
    openLabGroup(group: MenuGroupId): void {
      openMenuGroups = [group];
      highlightedMenuGroup = group;
      currentPage = "index";
      isMenuOpen = true;
    },
    openScenario(): void {
      currentPage = "labs";
      isMenuOpen = false;
      openMenuGroups = [];
      highlightedMenuGroup = null;
    },
    startTerminalResize(event: PointerEvent): void {
      isResizingTerminal = true;
      resizeTerminal(event);
    },
    resizeTerminal,
    stopTerminalResize(): void {
      isResizingTerminal = false;
    },
    resizeTerminalWithKeyboard(event: KeyboardEvent): void {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

      event.preventDefault();
      const delta = event.key === "ArrowUp" ? 20 : -20;
      terminalHeight = clampTerminalHeight(terminalHeight + delta);
      persistTerminalHeight();
    },
  };
}
