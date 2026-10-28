/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import { writeFileSync, mkdirSync } from "fs";
import { GAME_WORLD } from "../src/game/scene.js";
import { COINS } from "../src/game/coins.js";
import { PLAYER } from "../src/game/player.js";

const level = {
  engine: "Spider Engine 0.9.0",
  scene: "GameWorld",
  exported: new Date().toISOString(),
  player: PLAYER,
  coins: COINS,
  groups: GAME_WORLD
};
mkdirSync(new URL("../src/game/levels/", import.meta.url), { recursive: true });
const out = new URL("../src/game/levels/GameWorld.scene.json", import.meta.url);
writeFileSync(out, JSON.stringify(level, null, 2));
console.log("wrote", out.pathname, JSON.stringify(level).length, "bytes");
