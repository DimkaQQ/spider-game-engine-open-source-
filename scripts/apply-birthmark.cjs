const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EXCLUDE = ['node_modules', 'dist', 'dist-game', 'build-exe', 'release', 'target', '.git', '.system_generated', 'gen', 'schemas'];

const FINGERPRINT_TAG = 'M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552';

const JS_BANNER = `/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER <support@m4spider.com>
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
`;

const RS_BANNER = `// ============================================================================
// SPIDER GAME ENGINE (OPEN SOURCE)
// Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
// Author: M4SPIDER <support@m4spider.com>
// Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
// ============================================================================
`;

const HTML_BANNER = `<!--
  SPIDER GAME ENGINE (OPEN SOURCE)
  Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
  Author: M4SPIDER <support@m4spider.com>
  Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
-->
`;

const CSS_BANNER = `/*
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER <support@m4spider.com>
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 */
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
      watermarkFile(full);
    }
  }
}

let modifiedCount = 0;

function watermarkFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const rel = path.relative(ROOT, filePath);

  if (['.js', '.jsx', '.cjs', '.mjs'].includes(ext)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('support@m4spider.com')) {
      content = content.replace(/helpm4spider@gmail\.com/g, 'support@m4spider.com');
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Updated email in:', rel);
      return;
    }
    if (content.includes(FINGERPRINT_TAG)) return;
    if (content.startsWith('#!')) {
      const idx = content.indexOf('\n');
      const shebang = content.slice(0, idx + 1);
      const rest = content.slice(idx + 1);
      content = shebang + JS_BANNER + rest;
    } else {
      content = JS_BANNER + content;
    }

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log('Watermarked code:', rel);
  } else if (ext === '.rs') {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('support@m4spider.com')) {
      content = content.replace(/helpm4spider@gmail\.com/g, 'support@m4spider.com');
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Updated email in rust:', rel);
      return;
    }
    if (content.includes(FINGERPRINT_TAG)) return;
    content = RS_BANNER + content;
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log('Watermarked rust:', rel);
  } else if (ext === '.html') {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('support@m4spider.com')) {
      content = content.replace(/helpm4spider@gmail\.com/g, 'support@m4spider.com');
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Updated email in html:', rel);
      return;
    }
    if (content.includes(FINGERPRINT_TAG)) return;
    content = HTML_BANNER + content;
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log('Watermarked html:', rel);
  } else if (ext === '.css') {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('support@m4spider.com')) {
      content = content.replace(/helpm4spider@gmail\.com/g, 'support@m4spider.com');
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedCount++;
      console.log('Updated email in css:', rel);
      return;
    }
    if (content.includes(FINGERPRINT_TAG)) return;
    content = CSS_BANNER + content;
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log('Watermarked css:', rel);
  } else if (rel === 'package.json' || rel === path.join('mcp-server', 'package.json')) {
    let pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    pkg.author = 'M4SPIDER <support@m4spider.com>';
    pkg.homepage = 'https://github.com/M4SPIDER/spider-game-engine-open-source-';
    pkg.repository = {
      type: 'git',
      url: 'https://github.com/M4SPIDER/spider-game-engine-open-source-'
    };
    pkg.birthmark = FINGERPRINT_TAG;
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    modifiedCount++;
    console.log('Updated email in package.json:', rel);
  } else if (rel === path.join('src', 'game', 'levels', 'GameWorld.scene.json')) {
    let scene = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    scene._birthmark = FINGERPRINT_TAG;
    scene._author = 'support@m4spider.com';
    fs.writeFileSync(filePath, JSON.stringify(scene, null, 2) + '\n', 'utf8');
    modifiedCount++;
    console.log('Updated email in scene json:', rel);
  }
}

processDir(ROOT);
console.log('Total files processed/updated:', modifiedCount);
