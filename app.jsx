/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 * Root application shell (mobile-first).
 * Full-bleed game viewport: the mounted game brings its own camera
 * controls + HUD overlays (see spider-hud-* classes in src/index.css),
 * this shell only guarantees a stable dvh-sized stage with safe areas.
 * ============================================================================
 */
import React from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import MyGame from "./src/game/MyGame.jsx";

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

export default function App() {
  return (
    <div className="spider-game-root">
      <Canvas
        camera={{ position: [0, 8.5, 14.5], fov: 50 }}
        shadows
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 15]} intensity={1.5} castShadow />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        {/* NOTE: no OrbitControls here — each game template (GameComponent,
            GalaxyDefender, ChessBoardEnv) brings its own camera rig so touch
            gestures never fight a second controller. */}
        {typeof MyGame === "function" ? <MyGame /> : null}
      </Canvas>
    </div>
  );
}
