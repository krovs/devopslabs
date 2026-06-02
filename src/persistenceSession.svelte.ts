import { persistCurrentSession } from "./runtimeSession";

export type PersistSnapshot = Parameters<typeof persistCurrentSession>[0];

export type PersistenceSessionOptions = {
  getSnapshot: () => PersistSnapshot | null;
};

export function createPersistenceSession(options: PersistenceSessionOptions) {
  let saveTimeout = $state<number | undefined>();

  function save(): void {
    if (saveTimeout) {
      window.clearTimeout(saveTimeout);
      saveTimeout = undefined;
    }

    const snapshot = options.getSnapshot();
    if (!snapshot) return;
    persistCurrentSession(snapshot);
  }

  return {
    get hasPendingSave() {
      return saveTimeout !== undefined;
    },
    save,
    schedule(): void {
      if (saveTimeout) window.clearTimeout(saveTimeout);
      saveTimeout = window.setTimeout(save, 300);
    },
    flushPending(): void {
      if (saveTimeout) save();
    },
  };
}
