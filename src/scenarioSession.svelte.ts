import { cloneScenario, getPrimaryFile, restoreRuntime, sessionStorageKey, sessionVersion, type SavedRuntimePatch, type SavedSession } from "./runtimeSession";
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

function readSessionFor(scenarioId: string): { runtimePatch: SavedRuntimePatch; activeFileName?: string } | null {
  const raw = localStorage.getItem(sessionStorageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedSession;
    if (parsed.version !== sessionVersion) return null;
    if (parsed.scenarioId !== scenarioId) return null;
    if (!parsed.runtimePatch) return null;
    return { runtimePatch: parsed.runtimePatch, activeFileName: parsed.activeFileName };
  } catch {
    return null;
  }
}

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
      let restored = false;
      let runtimePatch: SavedRuntimePatch | undefined;
      let restoredActiveFile: string | undefined;

      if (loadOptions.restoreSavedSession) {
        const fresh = readSessionFor(id);
        if (fresh) {
          restored = true;
          runtimePatch = fresh.runtimePatch;
          restoredActiveFile = fresh.activeFileName;
        } else if (options.savedSession?.scenarioId === id) {
          restored = true;
          runtimePatch = options.savedSession.runtimePatch;
          restoredActiveFile = options.savedSession.activeFileName;
        }
      }

      runtime = restored && runtimePatch
        ? restoreRuntime(loadedScenario, runtimePatch)
        : cloneScenario(loadedScenario);
      activeFileName = restored && restoredActiveFile && runtime.files[restoredActiveFile]
        ? restoredActiveFile
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
