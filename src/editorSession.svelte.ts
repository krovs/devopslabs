import { tick } from "svelte";

export type EditorSessionOptions = {
  scenarioId: () => string;
  activeFileName: () => string;
  files: () => Record<string, string>;
  selectFile: (fileName: string) => void;
  updateActiveFile: (value: string) => void;
  updateFiles: (patches: Record<string, string>, focusFileName?: string) => void;
  addTerminalLines: (lines: string[]) => void;
  onEvaluate: () => void;
  onCompleted: () => void;
  onSave: () => void;
  onScheduleSave: () => void;
};

export function createEditorSession(options: EditorSessionOptions) {
  let savedScenarioId = $state("");
  let savedFiles = $state<Record<string, string>>({});

  $effect(() => {
    const scenarioId = options.scenarioId();
    if (savedScenarioId === scenarioId) return;
    savedScenarioId = scenarioId;
    savedFiles = { ...options.files() };
  });

  function ensureBaseline(): void {
    const scenarioId = options.scenarioId();
    if (savedScenarioId === scenarioId) return;
    savedScenarioId = scenarioId;
    savedFiles = { ...options.files() };
  }

  function fileDirty(fileName: string): boolean {
    if (savedScenarioId !== options.scenarioId()) return false;
    return (options.files()[fileName] ?? "") !== (savedFiles[fileName] ?? "");
  }

  function activeFileDirty(): boolean {
    return fileDirty(options.activeFileName());
  }

  function updateContent(value: string): void {
    ensureBaseline();
    options.updateActiveFile(value);
    options.onScheduleSave();
  }

  return {
    get isActiveFileDirty() {
      return activeFileDirty();
    },
    isFileDirty(fileName: string): boolean {
      return fileDirty(fileName);
    },
    saveCurrentFile(): void {
      ensureBaseline();
      const fileName = options.activeFileName();
      savedFiles = { ...savedFiles, [fileName]: options.files()[fileName] ?? "" };
      options.addTerminalLines([`Saved ${options.activeFileName()}`]);
      options.onEvaluate();
      options.onCompleted();
      options.onSave();
    },
    selectFile(fileName: string): void {
      ensureBaseline();
      options.selectFile(fileName);
      options.onSave();
    },
    updateContent,
    updateFiles(patches: Record<string, string>, focusFileName?: string): void {
      ensureBaseline();
      options.updateFiles(patches, focusFileName);
      savedFiles = { ...savedFiles, ...patches };
    },
    handleKeydown(event: KeyboardEvent): void {
      if (event.key !== "Tab") return;
      event.preventDefault();

      const textarea = event.currentTarget as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indentation = "  ";
      const nextValue = `${textarea.value.slice(0, start)}${indentation}${textarea.value.slice(end)}`;

      updateContent(nextValue);
      tick().then(() => {
        textarea.selectionStart = start + indentation.length;
        textarea.selectionEnd = start + indentation.length;
      });
    },
  };
}
