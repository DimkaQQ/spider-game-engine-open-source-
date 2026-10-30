/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — tiny JS/JSX syntax highlighter for the code editor
 * Returns HTML with <i class="tk-*"> spans. Everything is escaped first.
 */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const KEYWORDS =
  "import|export|default|from|as|const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|async|await|try|catch|finally|throw|typeof|instanceof|of|in|void|delete|this";
const CONSTS = "true|false|null|undefined|NaN|Infinity";

const TOKEN = new RegExp(
  [
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?(?:\\*\\/|$))", // 1 comment
    "('(?:\\\\.|[^'\\\\\\n])*'?|\"(?:\\\\.|[^\"\\\\\\n])*\"?|`(?:\\\\[\\s\\S]|[^`\\\\])*`?)", // 2 string
    `\\b(${KEYWORDS})\\b`, // 3 keyword
    `\\b(${CONSTS})\\b`, // 4 constant
    "\\b(0x[\\da-fA-F]+|\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?)\\b", // 5 number
    "(<\\/?[A-Za-z][\\w.:-]*)", // 6 jsx tag
    "\\b([A-Za-z_$][\\w$]*)(?=\\s*\\()", // 7 call
  ].join("|"),
  "g"
);

export function highlight(src) {
  let out = "";
  let last = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(src)) !== null) {
    if (m[0] === "") {
      TOKEN.lastIndex++;
      continue;
    }
    out += esc(src.slice(last, m.index));
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "n" : m[5] ? "n" : m[6] ? "t" : "f";
    out += `<i class="tk-${cls}">${esc(m[0])}</i>`;
    last = m.index + m[0].length;
  }
  out += esc(src.slice(last));
  // a trailing newline would be collapsed by <pre>; keep the last empty line
  return out.endsWith("\n") ? `${out} ` : out;
}
