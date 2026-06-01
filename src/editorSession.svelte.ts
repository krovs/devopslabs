import { tick } from "svelte";

export type EditorSessionOptions = {
  activeFileName: () => string;
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
  function updateContent(value: string): void {
    options.updateActiveFile(value);
    options.onScheduleSave();
  }

  return {
    saveCurrentFile(): void {
      options.addTerminalLines([`Saved ${options.activeFileName()}`]);
      options.onEvaluate();
      options.onCompleted();
      options.onSave();
    },
    selectFile(fileName: string): void {
      options.selectFile(fileName);
      options.onSave();
    },
    updateContent,
    updateFiles(patches: Record<string, string>, focusFileName?: string): void {
      options.updateFiles(patches, focusFileName);
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
