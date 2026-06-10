type Parsed<T> = {
  value: T;
  index: number;
};

export function parseSimpleYaml(text: string): unknown {
  const lines = text.replace(/\r/g, "").split("\n");
  return parseYamlObject(lines, 0, 0).value;
}

function parseYamlObject(lines: string[], index: number, indent: number): Parsed<Record<string, unknown>> {
  const object: Record<string, unknown> = {};
  let i = index;

  while (i < lines.length) {
    if (isSkippableYamlLine(lines[i])) {
      i += 1;
      continue;
    }

    const currentIndent = getIndent(lines[i]);
    if (currentIndent < indent || currentIndent > indent) break;

    const trimmed = lines[i].trim();
    if (trimmed.startsWith("- ")) break;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) throw new Error(`Invalid YAML line: ${trimmed}`);

    const key = normalizeYamlKey(trimmed.slice(0, separatorIndex));
    const rest = trimmed.slice(separatorIndex + 1).trim();

    if (rest === "|") {
      const block = readYamlBlockScalar(lines, i + 1, currentIndent + 2);
      object[key] = block.value;
      i = block.index;
      continue;
    }

    if (rest === "") {
      const next = nextYamlContentLine(lines, i + 1);
      if (!next || next.indent <= currentIndent) {
        object[key] = {};
        i += 1;
        continue;
      }

      if (next.text.trim().startsWith("- ")) {
        const parsed = parseYamlArray(lines, next.index, next.indent);
        object[key] = parsed.value;
        i = parsed.index;
      } else {
        const parsed = parseYamlObject(lines, next.index, next.indent);
        object[key] = parsed.value;
        i = parsed.index;
      }
      continue;
    }

    object[key] = parseYamlScalar(rest);
    i += 1;
  }

  return { value: object, index: i };
}

function parseYamlArray(lines: string[], index: number, indent: number): Parsed<unknown[]> {
  const array: unknown[] = [];
  let i = index;

  while (i < lines.length) {
    if (isSkippableYamlLine(lines[i])) {
      i += 1;
      continue;
    }

    const currentIndent = getIndent(lines[i]);
    const trimmed = lines[i].trim();
    if (currentIndent < indent || currentIndent > indent || !trimmed.startsWith("- ")) break;

    const itemText = trimmed.slice(2).trim();
    if (itemText === "") {
      const nested = parseYamlObject(lines, i + 1, currentIndent + 2);
      array.push(nested.value);
      i = nested.index;
      continue;
    }

    if (isQuotedYamlScalar(itemText)) {
      array.push(parseYamlScalar(itemText));
      i += 1;
      continue;
    }

    if (/^["']?[\w.-]+["']?:($|\s)/.test(itemText)) {
      const separatorIndex = itemText.indexOf(":");
      const key = normalizeYamlKey(itemText.slice(0, separatorIndex));
      const rest = itemText.slice(separatorIndex + 1).trim();
      const item = { [key]: rest === "" ? {} : parseYamlScalar(rest) };
      const nested = parseYamlObject(lines, i + 1, currentIndent + 2);
      array.push({ ...item, ...nested.value });
      i = nested.index;
      continue;
    }

    array.push(parseYamlScalar(itemText));
    i += 1;
  }

  return { value: array, index: i };
}

function readYamlBlockScalar(lines: string[], index: number, indent: number): Parsed<string> {
  const blockLines: string[] = [];
  let i = index;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      blockLines.push("");
      i += 1;
      continue;
    }

    const currentIndent = getIndent(line);
    if (currentIndent < indent) break;
    blockLines.push(line.slice(indent));
    i += 1;
  }

  return { value: blockLines.join("\n").replace(/\n+$/, ""), index: i };
}

function parseYamlScalar(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value === "[]") return [];
  if (isQuotedYamlScalar(value)) {
    return value.slice(1, -1);
  }
  return value;
}

function isQuotedYamlScalar(value: string): boolean {
  return (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
}

function normalizeYamlKey(key: string): string {
  return key.trim().replace(/^["']|["']$/g, "");
}

function getIndent(line: string): number {
  return line.match(/^ */)?.[0].length ?? 0;
}

function isSkippableYamlLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "" || trimmed.startsWith("#");
}

function nextYamlContentLine(lines: string[], index: number): { index: number; indent: number; text: string } | null {
  for (let i = index; i < lines.length; i += 1) {
    if (!isSkippableYamlLine(lines[i])) {
      return { index: i, indent: getIndent(lines[i]), text: lines[i] };
    }
  }
  return null;
}
