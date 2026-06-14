import { tick } from "svelte";
import { completeTerminalInput } from "./terminalUtils";

export type TerminalSessionOptions = {
  lines: string[];
  commandHistory: string[];
  commandOptions: () => string[];
  onChange: () => void;
};

export function createTerminalSession(options: TerminalSessionOptions) {
  let lines = $state<string[]>(options.lines);
  let input = $state("");
  let commandHistory = $state<string[]>(options.commandHistory);
  let historyIndex = $state(-1);
  let outputElement = $state<HTMLDivElement | undefined>();
  let inputElement = $state<HTMLInputElement | undefined>();

  async function scroll(): Promise<void> {
    await tick();
    if (outputElement) outputElement.scrollTop = outputElement.scrollHeight;
  }

  function changed(): void {
    options.onChange();
  }

  return {
    get lines() {
      return lines;
    },
    get input() {
      return input;
    },
    set input(value: string) {
      input = value;
    },
    get commandHistory() {
      return commandHistory;
    },
    setOutputElement(element: HTMLDivElement): void {
      outputElement = element;
    },
    setInputElement(element: HTMLInputElement): void {
      inputElement = element;
    },
    replaceLines(nextLines: string[]): void {
      lines = nextLines;
      changed();
      void scroll();
    },
    reset(nextLines: string[], nextHistory: string[] = []): void {
      lines = nextLines;
      input = "";
      commandHistory = nextHistory;
      historyIndex = -1;
      changed();
      void scroll();
    },
    clear(): void {
      lines = [];
      changed();
    },
    append(nextLines: string[]): void {
      lines = [...lines, ...nextLines];
      changed();
      void scroll();
    },
    recordCommand(command: string): void {
      commandHistory = [...commandHistory, command];
      historyIndex = commandHistory.length;
      changed();
    },
    clearInput(): void {
      input = "";
    },
    moveHistory(direction: number): void {
      if (!commandHistory.length) return;
      historyIndex = Math.min(commandHistory.length, Math.max(0, historyIndex + direction));
      input = commandHistory[historyIndex] || "";
    },
    completeInput(): void {
      const completion = completeTerminalInput(input, options.commandOptions());
      input = completion.value;
      if (completion.completions.length) {
        this.append(["Completions:", ...completion.completions.map((match) => `  ${match}`)]);
        this.focusInput();
      }
    },
    handleKeydown(event: KeyboardEvent): void {
      if (event.key === "Tab") {
        event.preventDefault();
        this.completeInput();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.moveHistory(-1);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.moveHistory(1);
      }
    },
    focusInput(): void {
      inputElement?.focus();
    },
    scroll,
  };
}
