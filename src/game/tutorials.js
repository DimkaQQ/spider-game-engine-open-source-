// Tutorial scripts per template — steps auto-complete on real game events.
export const TUTORIALS = {
  folder: [
    { title: "Your folder, live", text: "Every model in it spawned into GameWorld. Drag to orbit.", check: null },
    { title: "Remix", text: "Ask AI: “spawn castle” — or drag any gizmo.", check: null },
    { title: "Play", text: "Hit Play and test it like a game.", check: "play" }
  ],
  normal: [
    { title: "Move", text: "WASD or arrow keys to walk the hero.", check: "moved" },
    { title: "Jump", text: "Press Space to jump.", check: "jumped" },
    { title: "Collect", text: "Grab all 3 gold coins. Score 300 to win.", check: "coins" },
    { title: "Camera", text: "Drag to orbit, scroll to zoom, WASD flies the camera in the free Viewport.", check: null }
  ],
  tpp: [
    { title: "Move", text: "WASD moves your shooter. Camera follows behind.", check: "moved" },
    { title: "Aim", text: "Drag the mouse to aim. Targets glow downrange.", check: null },
    { title: "Shoot", text: "Click to fire the rifle.", check: "shot" },
    { title: "Clear the range", text: "Destroy all 3 red targets (+50 each).", check: "targets" },
    { title: "Jump", text: "Space to jump between shots.", check: "jumped" }
  ],
  fpp: [
    { title: "Look", text: "Drag the mouse — you ARE the camera.", check: null },
    { title: "Move", text: "WASD to walk, Q / E for height.", check: "moved" },
    { title: "Shoot", text: "Click to fire at anything suspicious.", check: "shot" },
    { title: "Sweep", text: "Clear every target you can find.", check: "targets" }
  ],
  racing: [
    { title: "Run", text: "WASD to sprint — the boat is your ride.", check: "moved" },
    { title: "Jump", text: "Space over obstacles.", check: "jumped" },
    { title: "Checkpoints", text: "Coins are checkpoints — grab all 3.", check: "coins" }
  ],
  custom: [
    { title: "Explore", text: "This is your scene, duplicated. WASD to walk it.", check: "moved" },
    { title: "Remix", text: "Ask AI: “spawn castle” — or drag any gizmo.", check: null },
    { title: "Play", text: "Hit Play and test it like a game.", check: "play" }
  ],
  blank: [
    { title: "Spawn", text: "Content Browser → click any asset to spawn it.", check: "spawned" },
    { title: "Select", text: "Click it in the viewport, drag the move gizmo.", check: null },
    { title: "Play", text: "Hit Play — WASD drives the hero.", check: "play" }
  ]
};
