const fs = require("fs");

function loadData(file, name) {
  const src = fs.readFileSync(file, "utf8");
  const i = src.indexOf("[", src.indexOf(name));
  const j = src.indexOf("{", src.indexOf(name));
  const start = Math.min(i < 0 ? 1e9 : i, j < 0 ? 1e9 : j);
  // bracket match from start
  let depth = 0, instr = null, esc = false, open = src[start];
  const close = open === "[" ? "]" : "}";
  for (let k = start; k < src.length; k++) {
    const c = src[k];
    if (instr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === instr) instr = null;
      continue;
    }
    if (c === '"' || c === "'") instr = c;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return new Function("return (" + src.slice(start, k + 1) + ")")();
    }
  }
  throw new Error("parse failed: " + file);
}

const groups = loadData("src/game/scene.js", "GAME_WORLD");
const assets = loadData("src/game/assets.js", "ENVIRONMENT_ASSETS");
const coins = loadData("src/game/coins.js", "COINS");
const level = {
  engine: "Spider Engine 0.9.0",
  scene: "GameWorld",
  exported: new Date().toISOString(),
  groups,
  assets: assets.length,
  coins
};
fs.mkdirSync("src/game/levels", { recursive: true });
fs.writeFileSync("src/game/levels/GameWorld.scene.json", JSON.stringify(level, null, 2), "utf8");
console.log("wrote GameWorld.scene.json", groups.length, "groups /", assets.length, "assets /", coins.length, "coins");
