/**
 * Syntax colouring for the code slides.
 *
 * The palette matches the code panel in the lesson reader (`#1d1a23` with
 * lilac text), so a learner who has seen the site recognises the video.
 *
 * This is a highlighting *sketch*, not a parser: it colours comments, strings,
 * numbers, keywords and call sites, which is what makes a short clip readable.
 * A real parser per language would be a dependency and a lot of code for no
 * visible gain at 26 pixels.
 */

export interface Token {
  text: string;
  color: string;
}

export const CODE_COLORS = {
  plain: "#d9d2e1",
  keyword: "#c4a6ff",
  string: "#7ee2b8",
  number: "#ffb27a",
  comment: "#7a7486",
  call: "#8ec7ff",
  property: "#a9d5ff",
  punctuation: "#8f89a0",
};

const KEYWORDS = new Set([
  // JavaScript / TypeScript
  "const", "let", "var", "function", "return", "if", "else", "for", "of", "in", "while", "do",
  "new", "await", "async", "class", "extends", "import", "export", "from", "default", "try",
  "catch", "finally", "throw", "typeof", "instanceof", "null", "undefined", "true", "false",
  "this", "super", "interface", "type", "enum", "implements", "public", "private", "protected",
  "readonly", "static", "as", "satisfies", "keyof", "never", "void", "yield", "delete", "switch",
  "case", "break", "continue", "declare", "namespace", "abstract", "is", "get", "set",
  // HTML / CSS
  "html", "head", "body", "title", "main", "nav", "header", "footer", "section", "article",
  "div", "span", "form", "input", "label", "button", "img", "a", "ul", "ol", "li", "table",
  "tr", "td", "th", "style", "script", "link", "meta", "doctype", "display", "grid", "flex",
  "color", "background", "padding", "margin", "border", "font", "size", "width", "height",
  // SQL / shell / python-ish
  "select", "from", "where", "insert", "into", "values", "create", "table", "join", "on",
  "group", "by", "order", "limit", "update", "set", "delete", "and", "or", "not", "primary",
  "key", "foreign", "references", "def", "export", "print", "echo", "cd", "npm", "git", "node",
]);

const HTML_LANGUAGES = /^(html|xml|svg|jsx|tsx)$/i;

/**
 * Splits one line of a worked example into coloured runs.
 *
 * `properties` marks identifiers that follow a dot, which is how a reader tells
 * `user.name` from a local variable, and `call` marks an identifier followed by
 * an opening bracket.
 */
export function highlightLine(line: string, language?: string): Token[] {
  const tokens: Token[] = [];
  const push = (text: string, color: string) => {
    if (!text) return;
    const previous = tokens[tokens.length - 1];
    if (previous && previous.color === color) previous.text += text;
    else tokens.push({ text, color });
  };

  const htmlMode = HTML_LANGUAGES.test(language ?? "");
  let index = 0;
  while (index < line.length) {
    const rest = line.slice(index);

    const comment = /^(\/\/|#|--|\/\*)/.exec(rest);
    if (comment && (comment[1] !== "#" || /\s|^/.test(line[index - 1] ?? " "))) {
      push(rest, CODE_COLORS.comment);
      break;
    }

    const string = /^("([^"\\]|\\.)*"?|'([^'\\]|\\.)*'?|`([^`\\]|\\.)*`?)/.exec(rest);
    if (string) {
      push(string[1], CODE_COLORS.string);
      index += string[1].length;
      continue;
    }

    const number = /^(\d+(?:\.\d+)?(?:px|rem|em|s|ms|%)?)/.exec(rest);
    if (number) {
      push(number[1], CODE_COLORS.number);
      index += number[1].length;
      continue;
    }

    const word = /^([A-Za-z_$][\w$-]*)/.exec(rest);
    if (word) {
      const value = word[1];
      const lower = value.toLowerCase();
      const after = line.slice(index + value.length);
      const before = line.slice(0, index);
      const property = /[.[]$/.test(before.trimEnd().slice(-1)) && !/<\/?$/.test(before);
      if (htmlMode) push(value, property ? CODE_COLORS.property : /^[A-Za-z]/.test(value) && before.endsWith("<") ? CODE_COLORS.keyword : CODE_COLORS.plain);
      else if (KEYWORDS.has(lower) && !property) push(value, CODE_COLORS.keyword);
      else if (property) push(value, CODE_COLORS.property);
      else if (/^\s*\(/.test(after)) push(value, CODE_COLORS.call);
      else if (/^[A-Z][A-Z0-9_]+$/.test(value)) push(value, CODE_COLORS.number);
      else push(value, CODE_COLORS.plain);
      index += value.length;
      continue;
    }

    const punctuation = /^([^\w\s]+)/.exec(rest);
    if (punctuation) {
      push(punctuation[1], CODE_COLORS.punctuation);
      index += punctuation[1].length;
      continue;
    }

    const space = /^(\s+)/.exec(rest);
    if (space) {
      push(space[1], CODE_COLORS.plain);
      index += space[1].length;
      continue;
    }

    push(line[index], CODE_COLORS.plain);
    index += 1;
  }
  return tokens;
}

/** Trims a code block to the lines a slide can hold, marking the cut. */
export function codeLines(code: string, maxLines: number): { lines: string[]; truncated: boolean } {
  const lines = code.replace(/\t/g, "  ").split("\n");
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (lines.length <= maxLines) return { lines, truncated: false };
  return { lines: [...lines.slice(0, maxLines - 1), "…"], truncated: true };
}
