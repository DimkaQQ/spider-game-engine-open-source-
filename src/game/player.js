// Demo game hero tuning — WASD speed, jump, world bounds (editor units).
// The Play-mode loop in app.jsx + Hero animation in GameViewport.jsx read this.
export const PLAYER = {
  id: "player",
  moveStep: 0.6, // per tick at 60ms
  jumpImpulse: 9,
  gravity: 0.85,
  groundY: 0,
  bounds: { minX: -25, maxX: 25, minZ: -15, maxZ: 35 }
};

// Heavier props fall faster in Play mode (see physics loop in app.jsx).
export const physicsFallSpeed = (mass = 100) => Math.min(2.5, 0.35 + mass / 800);
