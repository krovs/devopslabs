import { cloneScenario, getPrimaryFile, restoreRuntime, type SavedSession } from "./runtimeSession";
import type { Scenario } from "./types";

export type ScenarioSessionLoadOptions = {
  restoreSavedSession?: boolean;
};

export type ScenarioSessionLoadResult = {
  id: string;
  runtime: Scenario;
  restored: boolean;
};

export type ScenarioSessionOptions = {
  initialScenarioId: string;
  savedSession: SavedSession | null;
  loadScenario: (id: string) => Promise<Scenario>;
};

export function createScenarioSession(options: ScenarioSessionOptions) {
  let currentId = $state(options.initialScenarioId);
  let base = $state<Scenario | null>(null);
  let runtime = $state<Scenario | null>(null);
  let activeFileName = $state(options.savedSession?.activeFileName ?? "");
  let loading = $state(true);
  let error = $state<string | null>(null);
  let loadToken = 0;

  let fileNames = $derived(runtime ? Object.keys(runtime.files) : []);
  let activeFileContent = $derived(runtime?.files[activeFileName] ?? "");

  async function load(id: string, loadOptions: ScenarioSessionLoadOptions = {}): Promise<ScenarioSessionLoadResult | null> {
    const token = ++loadToken;
    currentId = id;
    loading = true;
    error = null;
    runtime = null;

    try {
      const loadedScenario = await options.loadScenario(id);
      if (token !== loadToken) return null;

      base = loadedScenario;
      const restored = Boolean(loadOptions.restoreSavedSession && options.savedSession?.scenarioId === id);
      runtime = restored && options.savedSession
        ? restoreRuntime(loadedScenario, options.savedSession.runtimePatch)
        : cloneScenario(loadedScenario);
      activeFileName = restored && options.savedSession?.activeFileName && runtime.files[options.savedSession.activeFileName]
        ? options.savedSession.activeFileName
        : getPrimaryFile(runtime);

      return { id, runtime, restored };
    } catch (loadError) {
      if (token !== loadToken) return null;
      error = loadError instanceof Error ? loadError.message : String(loadError);
      return null;
    } finally {
      if (token === loadToken) loading = false;
    }
  }

  return {
    get currentId() {
      return currentId;
    },
    get base() {
      return base;
    },
    get runtime() {
      return runtime;
    },
    set runtime(nextRuntime: Scenario | null) {
      runtime = nextRuntime;
    },
    get activeFileName() {
      return activeFileName;
    },
    set activeFileName(fileName: string) {
      activeFileName = fileName;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get fileNames() {
      return fileNames;
    },
    get activeFileContent() {
      return activeFileContent;
    },
    requireRuntime(): Scenario {
      if (!runtime) throw new Error("Scenario runtime is not loaded.");
      return runtime;
    },
    load,
    selectFile(fileName: string): void {
      activeFileName = fileName;
    },
    updateActiveFile(value: string): void {
      if (!runtime) return;
      runtime.files[activeFileName] = value;
      runtime = runtime;
    },
    updateFiles(patches: Record<string, string>, focusFileName?: string): void {
      if (!runtime) return;
      runtime.files = { ...runtime.files, ...patches };
      if (focusFileName && runtime.files[focusFileName] !== undefined) {
        activeFileName = focusFileName;
      }
      runtime = runtime;
    },
    refresh(): void {
      runtime = runtime;
    },
  };
}
