/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import React, { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * Hook providing smoothed arrow-key, WASD, and mobile touch swipe/drag movement vector
 */
export function useKeyboardControls() {
  const keys = useRef({});
  const touchDir = useRef({ x: 0, z: 0, jump: false });
  const touchStart = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
    };
    const onUp = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    // Mobile touch controls: swipe & drag to move, quick tap to jump.
    // Never hijack touches that start on real controls (buttons etc.).
    // A tap only counts as jump on touchend (short + no drag) so orbiting
    // the camera with one finger doesn't fire jumps.
    const onTouchStart = (e) => {
      if (e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, [role="button"]')) return;
      const t = e.touches[0];
      if (t) {
        touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now(), moved: false };
      }
    };
    const onTouchMove = (e) => {
      if (!touchStart.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      if (Math.hypot(dx, dy) > 15) {
        touchStart.current.moved = true;
        touchDir.current.x = Math.max(-1, Math.min(1, dx / 40));
        touchDir.current.z = Math.max(-1, Math.min(1, dy / 40));
      }
    };
    const onTouchEnd = () => {
      const s = touchStart.current;
      if (s && !s.moved && Date.now() - s.t < 260) {
        touchDir.current.jump = true;
        setTimeout(() => { touchDir.current.jump = false; }, 150);
      }
      touchStart.current = null;
      // Keep jump pulse; reset steering.
      touchDir.current = { x: 0, z: 0, jump: touchDir.current.jump };
      setTimeout(() => { touchDir.current.jump = false; }, 160);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return {
    getDir: () => {
      const k = keys.current;
      let x = 0, z = 0;
      if (k.arrowleft || k.a) x -= 1;
      if (k.arrowright || k.d) x += 1;
      if (k.arrowup || k.w) z -= 1;
      if (k.arrowdown || k.s) z += 1;

      // Merge mobile touch swipe/drag
      if (touchDir.current.x !== 0) x = touchDir.current.x;
      if (touchDir.current.z !== 0) z = touchDir.current.z;

      // Merge virtual on-screen d-pad if present
      if (typeof window !== "undefined" && window.__spiderVirtualTouch) {
        if (window.__spiderVirtualTouch.x) x = window.__spiderVirtualTouch.x;
        if (window.__spiderVirtualTouch.z) z = window.__spiderVirtualTouch.z;
      }

      if (x !== 0 && z !== 0) {
        x *= 0.7071;
        z *= 0.7071;
      }
      const jump = !!(k[' '] || k.spacebar || touchDir.current.jump || (typeof window !== "undefined" && window.__spiderVirtualTouch?.jump));
      return { x, z, jump };
    }
  };
}

/**
 * High-fidelity 3D Arena Ground, Lighting, and Boundary Walls
 */
export function ArenaEnv({
  size = 20,
  groundColor = '#15803d',
  gridColor = '#166534',
  wallColor = '#1e3a8a'
}) {
  const half = size / 2;
  const wallH = 1.2;
  const wallThick = 0.6;

  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[12, 18, 12]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Stadium Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={groundColor} roughness={0.6} />
      </mesh>
      <gridHelper args={[size, size, '#ffffff', gridColor]} position={[0, 0.01, 0]} />

      {/* Surrounding Boundary Walls */}
      {/* North */}
      <mesh position={[0, wallH / 2, -half]} castShadow receiveShadow>
        <boxGeometry args={[size + wallThick, wallH, wallThick]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
      {/* South */}
      <mesh position={[0, wallH / 2, half]} castShadow receiveShadow>
        <boxGeometry args={[size + wallThick, wallH, wallThick]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
      {/* West */}
      <mesh position={[-half, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, wallH, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
      {/* East */}
      <mesh position={[half, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThick, wallH, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.3} />
      </mesh>
    </group>
  );
}


/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

/**
 * Animated Floating 3D Gold Coin with Emissive Glow
 */
export function CoinPickup({ position = [0, 0.6, 0], collected = false }) {
  const coinRef = useRef();

  useFrame((state) => {
    if (!coinRef.current || collected) return;
    const t = state.clock.elapsedTime;
    coinRef.current.rotation.y = t * 2.8;
    coinRef.current.position.y = position[1] + Math.sin(t * 3.5 + position[0]) * 0.2;
  });

  if (collected) return null;

  return (
    <mesh ref={coinRef} position={position} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.14, 24]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#d97706"
        emissiveIntensity={0.7}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

/**
 * 3D Obstacle Box
 */
export function ObstacleBox({ position = [0, 0.6, 0], size = [2, 1.2, 2], color = '#dc2626' }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Hazard trim */}
      <mesh position={[0, size[1] / 2 + 0.1, 0]} castShadow>
        <coneGeometry args={[0.3, 0.4, 4]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
    </group>
  );
}

/**
 * On-screen touch controls (d-pad + jump) for phones.
 * Writes into window.__spiderVirtualTouch, merged by useKeyboardControls.
 * Rendered only on touch devices via .spider-only-coarse.
 */
export function TouchControls() {
  const set = (patch) => {
    if (typeof window === "undefined") return;
    window.__spiderVirtualTouch = { x: 0, z: 0, jump: false, ...(window.__spiderVirtualTouch || {}), ...patch };
  };
  const releaseDir = () => {
    if (typeof window === "undefined") return;
    window.__spiderVirtualTouch = { ...(window.__spiderVirtualTouch || {}), x: 0, z: 0 };
  };
  const dir = (x, z) => (e) => { e.preventDefault(); set({ x, z }); };
  const jump = (e) => { e.preventDefault(); set({ jump: true }); setTimeout(() => set({ jump: false }), 180); };
  const noCtx = (e) => e.preventDefault();
  const btn = (label, handlers, style) => (
    <button
      type="button"
      className="spider-touch-btn"
      style={style}
      onPointerDown={handlers[0]}
      onPointerUp={releaseDir}
      onPointerLeave={releaseDir}
      onPointerCancel={releaseDir}
      onContextMenu={noCtx}
    >
      {label}
    </button>
  );
  return (
    <div className="spider-touch-controls spider-only-coarse">
      <div className="spider-touch-pad">
        <span />
        {btn("▲", [dir(0, -1)])}
        <span />
        {btn("◀", [dir(-1, 0)])}
        <span />
        {btn("▶", [dir(1, 0)])}
        <span />
        {btn("▼", [dir(0, 1)])}
        <span />
      </div>
      <button
        type="button"
        className="spider-touch-btn spider-touch-jump"
        onPointerDown={jump}
        onContextMenu={noCtx}
      >
        JUMP
      </button>
    </div>
  );
}

/**
 * Sleek Glassmorphic Game HUD
 */
export function GameHud({ title = 'ARCADE ARENA', score = 0, total = 8, won = false, onRestart }) {
  const isWon = won || (total > 0 && score >= total);

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="spider-hud-top">
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            padding: '8px 14px',
            borderRadius: '14px',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px', color: '#60a5fa', whiteSpace: 'nowrap' }}>
            {title}
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#fbbf24', whiteSpace: 'nowrap' }}>
            Score: {score} / {total}
          </div>
          {onRestart && (
            <button
              onClick={onRestart}
              className="spider-hud-btn"
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              Restart
            </button>
          )}
        </div>
        {isWon && (
          <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '14px', background: 'rgba(15,23,42,0.92)', padding: '6px 14px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
            🎉 VICTORY! 🎉
          </div>
        )}
      </div>
      <TouchControls />
    </Html>
  );
}
