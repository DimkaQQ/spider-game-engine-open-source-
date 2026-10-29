/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Open World hero tuning — WASD speed, Sprint, jump, world bounds (editor units).
// The Play-mode loop in app.jsx + Hero animation in GameViewport.jsx read this.
export const PLAYER = {
  id: "player",
  moveStep: 0.7, // base walk per tick at 60ms (~12 units/sec)
  sprintMult: 2.5, // athletic sprint multiplier (~30 units/sec)
  jumpImpulse: 11,
  gravity: 0.85,
  groundY: 0,
  bounds: { minX: -180, maxX: 180, minZ: -180, maxZ: 180 }
};

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }


// Heavier props fall faster in Play mode (see physics loop in app.jsx).
export const physicsFallSpeed = (mass = 100) => Math.min(2.5, 0.35 + mass / 800);
