/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
const fs = require("fs");
const b = fs.readFileSync("dist/assets/index-D29H5pA6.js", "utf8");

function extractArray(marker) {
  const mi = b.indexOf(marker);
  if (mi < 0) throw new Error("marker not found: " + marker);
  // walk back to the opening '[' of the array literal
  let start = -1;
  for (let i = mi; i >= 0; i--) {
    if (b[i] === "[") { start = i; break; }
  }
  // walk forward with bracket matching (skip strings)
  let depth = 0, instr = null, esc = false;
  for (let i = start; i < b.length; i++) {
    const c = b[i];
    if (instr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === instr) instr = null;
      continue;
    }

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

    if (c === '"' || c === "'" || c === "`") instr = c;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return b.slice(start, i + 1);
    }
  }
  throw new Error("no match for " + marker);
}

const sceneSrc = extractArray("env-group");
const assetsSrc = extractArray("asset-mountains");
const scene = new Function("return (" + sceneSrc + ")")();
const assets = new Function("return (" + assetsSrc + ")")();
console.log("scene groups:", scene.length, "assets:", assets.length);

const sceneOut =
  "export const GAME_WORLD = " + JSON.stringify(scene, null, 2) + ";\n";
const assetsOut =
  "export const ENVIRONMENT_ASSETS = " + JSON.stringify(assets, null, 2) + ";\n";
fs.writeFileSync("src/game/scene.js", sceneOut, "utf8");
fs.writeFileSync("src/game/assets.js", assetsOut, "utf8");
console.log("wrote clean utf8 game files");
