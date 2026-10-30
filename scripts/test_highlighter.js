function highlightJsx(code) {
  if (!code) return '';
  const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tokenRegex = /((\/\/[^\n]*)|(\/\*[\s\S]*?\*\/))|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b(?:import|export|default|from|const|let|var|function|return|if|else|switch|case|break|for|while|do|try|catch|finally|throw|new|typeof|instanceof|async|await|class|extends|super|this|yield|null|undefined|true|false)\b)|(\b(?:useState|useEffect|useRef|useMemo|useCallback|useFrame|useThree|useGLTF|useTexture|useLoader)\b)|(&lt;\/?[A-Za-z0-9_.]+|&gt;)|(\b[a-zA-Z-]+(?==))|(\b\d+(?:\.\d+)?\b)|([{}()[\],.;:+\-*\/=<>!&|?])/g;

  const escaped = escapeHtml(code);
  return escaped.replace(tokenRegex, (match, comment, lC, bC, str, kw, hook, tag, attr, num, punct) => {
    if (comment) return '<span style="color: #64748b; font-style: italic;">' + match + '</span>';
    if (str) return '<span style="color: #4ade80;">' + match + '</span>';
    if (kw) return '<span style="color: #c084fc; font-weight: 600;">' + match + '</span>';
    if (hook) return '<span style="color: #38bdf8; font-weight: 700;">' + match + '</span>';
    if (tag) return '<span style="color: #38bdf8; font-weight: bold;">' + match + '</span>';
    if (attr) return '<span style="color: #fcd34d;">' + match + '</span>';
    if (num) return '<span style="color: #fb923c;">' + match + '</span>';
    if (punct) return '<span style="color: #94a3b8;">' + match + '</span>';
    return match;
  });
}

const test = `import React, { useState } from 'react';
// Test comment
const a = 123;
<group position={[0, 1, 2]}>`;

console.log(highlightJsx(test));
