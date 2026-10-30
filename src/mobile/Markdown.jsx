/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — minimal Markdown renderer for the licenses screen
 * Handles headings, paragraphs, bullets, numbered items, fenced code, rules, **bold**, `code`, [links](url).
 */
import React from "react";

function inline(text, key) {
  const parts = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|<(https?:\/\/[^>\s]+)>)/g;
  let last = 0;
  let m;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<b key={`${key}-${n++}`}>{m[2]}</b>);
    else if (m[3]) parts.push(<code key={`${key}-${n++}`}>{m[3]}</code>);
    else if (m[4]) parts.push(<a key={`${key}-${n++}`} href={m[5]} target="_blank" rel="noopener noreferrer">{m[4]}</a>);
    else parts.push(<a key={`${key}-${n++}`} href={m[6]} target="_blank" rel="noopener noreferrer">{m[6]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  // drop leftover emphasis markers that did not form a pair
  return parts.map((p) => (typeof p === "string" ? p.replace(/\*\*/g, "").replace(/(^|\s)\*(\S)/g, "$1$2") : p));
}

export default function Markdown({ source }) {
  const lines = String(source).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
      i++;
      out.push(<pre key={k++} className="md-code">{buf.join("\n")}</pre>);
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      out.push(<Tag key={k++} className={`md-h${level}`}>{inline(h[2], `h${k}`)}</Tag>);
      i++;
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      out.push(<hr key={k++} />);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      out.push(<ul key={k++} className="md-ul">{items.map((t, j) => <li key={j}>{inline(t, `l${k}-${j}`)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      out.push(<ol key={k++} className="md-ul">{items.map((t, j) => <li key={j}>{inline(t, `o${k}-${j}`)}</li>)}</ol>);
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|\s*[-*]\s|\s*\d+\.\s|\s*---)/.test(lines[i])) buf.push(lines[i++]);
    out.push(<p key={k++} className="md-p">{inline(buf.join(" "), `p${k}`)}</p>);
  }
  return <>{out}</>;
}
