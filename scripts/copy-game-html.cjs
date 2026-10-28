/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'dist-game', 'game.html');
const dest = path.join(__dirname, '..', 'dist-game', 'index.html');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Synced dist-game/index.html');
}
