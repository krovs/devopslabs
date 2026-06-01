import type { Scenario } from "./types";

export function initialTerminalLines(incidentMode: boolean, title: string): string[] {
  return [incidentMode ? `Loaded incident: ${title}` : `Loaded scenario: ${title}`, "Type 'help' to see available commands."];
}

export function completeTerminalInput(inputValue: string, commandOptions: string[]): { value: string; completions: string[] } {
  const leadingWhitespace = inputValue.match(/^\s*/)?.[0] ?? "";
  const input = inputValue.trimStart();
  const normalizedInput = input.toLowerCase();
  const matches = commandOptions.filter((command) => command.toLowerCase().startsWith(normalizedInput));

  if (matches.length === 1) return { value: `${leadingWhitespace}${matches[0]}`, completions: [] };
  if (matches.length === 0) return { value: inputValue, completions: [] };

  const commonPrefix = longestCommonPrefix(matches);
  if (commonPrefix.length > input.length) return { value: `${leadingWhitespace}${commonPrefix}`, completions: [] };

  return { value: inputValue, completions: matches };
}

export function terminalCommandTitle(runtime: Scenario, incidentMode: boolean, incidentTitle: string): string {
  return incidentMode ? incidentTitle : runtime.title;
}

function longestCommonPrefix(values: string[]): string {
  if (!values.length) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
}
