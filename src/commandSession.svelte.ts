import { createCommandHandlers } from "./commandHandlers";
import { dispatchCommand as dispatchSimulatorCommand, type CommandHandlers } from "./commands";
import { terminalCommandOptions as getTerminalCommandOptions } from "./labCatalog";
import {
  workflowEvent as getWorkflowEvent,
  workflowFailedStep as getWorkflowFailedStep,
  workflowJob as getWorkflowJob,
  workflowLogLines as getWorkflowLogLines,
} from "./simulators/cicd";
import type { Scenario } from "./types";

type TerminalController = {
  input: string;
  recordCommand: (command: string) => void;
  append: (lines: string[]) => void;
  clearInput: () => void;
  scroll: () => Promise<void>;
};

export type CommandSessionOptions = {
  runtime: () => Scenario | null;
  requireRuntime: () => Scenario;
  scenarioId: () => string;
  activeFileName: () => string;
  refreshRuntime: () => void;
  terminal: TerminalController;
  onEvaluate: () => void;
  onCompleted: () => void;
  onSave: () => void;
};

export function createCommandSession(options: CommandSessionOptions) {
  const handlers = createCommandHandlers({
    runtime: options.requireRuntime,
    scenarioId: options.scenarioId,
    activeFileName: options.activeFileName,
    refreshRuntime: options.refreshRuntime,
  });

  function dispatch(command: string, runtime: Scenario = options.requireRuntime()): string[] {
    return dispatchSimulatorCommand(command, runtime, handlers);
  }

  return {
    get handlers(): CommandHandlers {
      return handlers;
    },
    commandOptions(): string[] {
      const runtime = options.runtime();
      return runtime ? getTerminalCommandOptions(runtime) : [];
    },
    dispatchCommand: dispatch,
    runCommand(): void {
      const runtime = options.runtime();
      if (!runtime) return;
      const input = options.terminal.input.trim();
      if (!input) return;

      options.terminal.recordCommand(input);
      options.terminal.append([`$ ${input}`, ...dispatch(input, runtime)]);
      options.terminal.clearInput();
      options.onEvaluate();
      options.onCompleted();
      options.onSave();
      void options.terminal.scroll();
    },
    workflowEvent(): string {
      return getWorkflowEvent(options.scenarioId());
    },
    workflowJob(): string {
      return getWorkflowJob(options.scenarioId());
    },
    workflowFailedStep(): string {
      const runtime = options.runtime();
      return runtime ? getWorkflowFailedStep(runtime, options.scenarioId()) : "";
    },
    workflowLogLines(): string[] {
      const runtime = options.runtime();
      return runtime ? getWorkflowLogLines(runtime, options.scenarioId()) : [];
    },
  };
}
