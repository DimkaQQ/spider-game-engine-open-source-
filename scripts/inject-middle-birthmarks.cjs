const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXCLUDE = ['node_modules', 'dist', 'dist-game', 'build-exe', 'release', 'target', '.git', '.system_generated', 'gen', 'schemas'];

const CODE_MARKER = `
/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
`;

function processDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (EXCLUDE.includes(item)) continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      processDir(full);
    } else {
      injectMiddle(full);
    }
  }
}

let count = 0;

function injectMiddle(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const rel = path.relative(ROOT, filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Avoid duplicate injection
  if (content.includes('vivek') && content.includes('venom')) return;

  const lines = content.split('\n');

  if (['.js', '.jsx', '.cjs', '.mjs'].includes(ext)) {
    const mid = Math.floor(lines.length / 2);
    let insertIdx = mid;
    for (let i = mid; i < lines.length - 1; i++) {
      if (lines[i].trim() === '' || lines[i].trim() === '};' || lines[i].trim() === '}') {
        insertIdx = i + 1;
        break;
      }
    }
    lines.splice(insertIdx, 0, CODE_MARKER);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    count++;
    console.log('Injected middle marker into JS/JSX:', rel, 'at line', insertIdx);
  } else if (ext === '.rs') {
    const mid = Math.floor(lines.length / 2);
    const rsMarker = `
// [LINEAGE-AUTHORS]: vivek / venom / quick / qucik
pub const _M4_LINEAGE_AUTHORS: &str = "vivek::venom::quick::qucik::m4spider";
`;
    lines.splice(mid, 0, rsMarker);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    count++;
    console.log('Injected middle marker into Rust:', rel);
  } else if (ext === '.html') {
    const htmlMarker = `    <!-- [LINEAGE-AUTHORS]: vivek / venom / quick / qucik -->\n    <meta name="engine-provenance" content="vivek / venom / quick / qucik / m4spider" />\n`;
    const headIdx = lines.findIndex(l => l.includes('</head>'));
    if (headIdx !== -1) {
      lines.splice(headIdx, 0, htmlMarker);
    } else {
      lines.splice(Math.floor(lines.length / 2), 0, htmlMarker);
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    count++;
    console.log('Injected marker into HTML:', rel);
  } else if (ext === '.css') {
    const cssMarker = `\n/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */\n[data-engine-provenance="vivek-venom-quick-qucik"] { display: none; }\n`;
    lines.splice(Math.floor(lines.length / 2), 0, cssMarker);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    count++;
    console.log('Injected marker into CSS:', rel);
  } else if (rel === 'package.json' || rel === path.join('mcp-server', 'package.json')) {
    let pkg = JSON.parse(content);
    pkg.contributors = ['vivek <support@m4spider.com>', 'venom', 'quick', 'qucik'];
    pkg.lineage = 'vivek / venom / quick / qucik / m4spider';
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    count++;
    console.log('Injected lineage into JSON:', rel);
  } else if (rel === path.join('src', 'game', 'levels', 'GameWorld.scene.json')) {
    let scene = JSON.parse(content);
    scene._lineage_authors = ['vivek', 'venom', 'quick', 'qucik', 'm4spider'];
    fs.writeFileSync(filePath, JSON.stringify(scene, null, 2) + '\n', 'utf8');
    count++;
    console.log('Injected lineage into scene JSON:', rel);
  }
}

processDir(ROOT);
console.log('Finished! Injected middle birthmarks into', count, 'files.');
