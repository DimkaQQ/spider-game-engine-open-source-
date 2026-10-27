<p align="center">
  <img src="./Spider Engine.png" alt="Spider Engine" width="220" />
</p>

# Spider Engine — open-source game engine (React + Three.js + Electron)

A real-time 3D game engine and editor that runs as a desktop app. All JSX — no C++ in this build.

## Run it

```bash
npm install
npm run dev        # web preview (http://localhost:5173)
npx electron . --built   # desktop app (after npm run build)
npm run dist       # Windows installer + portable exe
```

## What's inside

- **Editor** — Scene Hierarchy, Inspector (Transform/Mesh/Materials/Animation/Physics), Content Browser, Console, Build Log, Timeline sun scrub, Game/CinematicViewport modes
- **Real 3D viewport** — Three.js: castle, terrain, water, trees, guards on patrol, day/night sun, shadows, wireframe, live axis gizmo
- **Playable demo game** (`src/game/`) — hero (WASD + Space), 3 spinning coins, score + win state, BlockAll collision, falling physics props
- **Import** — `.glb/.gltf/.fbx/.obj` models, images as textures, audio preview, whole-folder parse, or open a folder as a project
- **Projects** — multiple saved scenes (Unreal-style New Project wizard: Normal, TPP/FPP Shooting, Racing, Custom, Blank), autosaved locally
- **Ask AI panel** — Gemini-style assistant: natural-language scene commands, recent chats, thinking levels, per-message actions, MCP tool bridge (`window.spiderEngine`), Meta Model API chat with encrypted key storage
- **Build** — validates + exports portable `GameWorld.scene.json` (assets embedded)

## Demo game files

```
src/game/
  scene.js      — GameWorld level
  assets.js     — spawnable props
  coins.js      — collectibles + rules
  player.js     — hero tuning
  materials.js  — material library
  levels/GameWorld.scene.json  — exported playable level
```

MIT — build games with it.
