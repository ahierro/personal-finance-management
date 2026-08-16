/**
 * Reader for Java-style `.properties` bundles.
 *
 * Supports what the format actually needs here: `#` and `!` comments, `=` and `:`
 * separators, line continuation with a trailing backslash, and the usual escapes
 * including `\\uXXXX`. Files are read as UTF-8, so accented characters can be typed
 * directly instead of being escaped.
 */

function unescapeValue(value: string): string {
  let result = '';
  let index = 0;

  while (index < value.length) {
    const character = value[index];
    if (character !== '\\') {
      result += character;
      index += 1;
      continue;
    }

    const next = value[index + 1];
    if (next === undefined) {
      break;
    }
    if (next === 'u') {
      const code = value.slice(index + 2, index + 6);
      if (/^[0-9a-fA-F]{4}$/.test(code)) {
        result += String.fromCharCode(Number.parseInt(code, 16));
        index += 6;
        continue;
      }
    }

    const escapes: Record<string, string> = { n: '\n', r: '\r', t: '\t', f: '\f' };
    result += escapes[next] ?? next;
    index += 2;
  }

  return result;
}

/** True when the trailing backslashes are unbalanced, meaning the entry continues below. */
function continuesOnNextLine(line: string): boolean {
  let backslashes = 0;
  for (let index = line.length - 1; index >= 0 && line[index] === '\\'; index -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function splitEntry(line: string): { key: string; value: string } {
  let index = 0;
  let escaped = false;

  while (index < line.length) {
    const character = line[index];
    if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '=' || character === ':') {
      break;
    }
    index += 1;
  }

  return {
    key: unescapeValue(line.slice(0, index)).trim(),
    value: line.slice(index + 1).replace(/^\s+/, ''),
  };
}

export function parseProperties(content: string): Record<string, string> {
  const messages: Record<string, string> = {};
  let pending = '';

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/^\s+/, '');

    if (pending === '' && (line === '' || line.startsWith('#') || line.startsWith('!'))) {
      continue;
    }

    if (continuesOnNextLine(line)) {
      pending += line.slice(0, -1);
      continue;
    }

    const { key, value } = splitEntry(pending + line);
    pending = '';
    if (key !== '') {
      messages[key] = unescapeValue(value);
    }
  }

  return messages;
}
