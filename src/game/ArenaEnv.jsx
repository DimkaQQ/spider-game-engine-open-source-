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
 * Hook providing smoothed arrow-key and WASD movement vector
 */
export function useKeyboardControls() {
  const keys = useRef({});

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
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
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
      if (x !== 0 && z !== 0) {
        x *= 0.7071;
        z *= 0.7071;
      }
      return { x, z, jump: !!(k[' '] || k.spacebar) };
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
 * Sleek Glassmorphic Game HUD
 */
export function GameHud({ title = 'ARCADE ARENA', score = 0, total = 8, won = false, onRestart }) {
  const isWon = won || (total > 0 && score >= total);

  return (
    <Html position={[0, 5.5, -8]} center style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          padding: '10px 22px',
          borderRadius: '14px',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.5px', color: '#60a5fa' }}>
            {title}
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#fbbf24' }}>
            Score: {score} / {total}
          </div>
          {onRestart && (
            <button
              onClick={onRestart}
              style={{
                pointerEvents: 'auto',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px'
              }}
            >
              Restart
            </button>
          )}
        </div>
        {isWon && (
          <div style={{ color: '#4ade80', fontWeight: 800, fontSize: '14px' }}>
            🎉 VICTORY! ALL COINS COLLECTED! 🎉
          </div>
        )}
      </div>
    </Html>
  );
}
