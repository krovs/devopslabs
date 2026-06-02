import type { createCommandSession } from "./commandSession.svelte";
import type { SavedSession } from "./runtimeSession";
import { createTerminalSession } from "./terminalSession.svelte";
import { initialTerminalLines } from "./terminalUtils";

export type AppCommandSessionRef = {
  current?: ReturnType<typeof createCommandSession>;
};

export type AppTerminalSession = ReturnType<typeof createTerminalSession>;

type AppTerminalOptions = {
  savedSession: SavedSession | null;
  initialIncidentMode: boolean;
  initialScenarioTitle: string;
  initialIncidentTitle: string;
  onChange: () => void;
};

export function createAppTerminalSession({
  savedSession,
  initialIncidentMode,
  initialScenarioTitle,
  initialIncidentTitle,
  onChange,
}: AppTerminalOptions) {
  const commandSessionRef: AppCommandSessionRef = {};
  const terminal = createTerminalSession({
    lines: savedSession?.terminalLines ?? initialTerminalLines(initialIncidentMode, initialIncidentMode ? initialIncidentTitle : initialScenarioTitle),
    commandHistory: savedSession?.commandHistory ?? [],
    commandOptions: () => commandSessionRef.current?.commandOptions() ?? [],
    onChange,
  });

  return {
    commandSessionRef,
    terminal,
  };
}
