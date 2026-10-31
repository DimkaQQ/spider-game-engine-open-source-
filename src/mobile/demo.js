/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — demo provider (no API key)
 * Lets anyone watch the real agent loop build a playable game without a key. It answers with a
 * fixed script: render the game, look at the viewport, report. The code is mounted, compiled and
 * checked exactly like model output, so the whole pipeline is exercised. Not an AI model.
 */
export const DEMO_GAME_CODE = `import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTouch, TouchControls, Hud } from 'spider-touch';

const COINS = Array.from({ length: 14 }, (_, i) => {
  const a = i * 2.4;
  return [Math.cos(a) * (3 + (i % 5) * 1.6), 0.7, Math.sin(a) * (3 + (i % 5) * 1.6)];
});
const BLOCKS = [[-6, 3], [5, -4], [-3, -7], [8, 6], [0, 9], [-9, -2]];

function Coin({ position }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 3; }); // each coin turns on its own spot
  return (
    <mesh ref={ref} position={position} rotation-x={Math.PI / 2} castShadow>
      <cylinderGeometry args={[0.45, 0.45, 0.12, 20]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} metalness={0.7} roughness={0.25} />
    </mesh>
  );
}

export default function GameComponent() {
  const touch = useTouch();
  const hero = useRef();
  const pos = useRef(new THREE.Vector3(0, 0.6, 0));
  const vel = useRef(new THREE.Vector3());
  const [taken, setTaken] = useState([]);
  const [t, setT] = useState(45);
  const left = COINS.length - taken.length;
  const over = t <= 0 || left === 0;

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.033);
    if (!over) setT((v) => Math.max(0, v - dt));
    const dir = new THREE.Vector3(touch.move.x, 0, -touch.move.y); // stick up = forward = away from the camera (-Z)
    vel.current.lerp(over ? new THREE.Vector3() : dir.multiplyScalar(7), 0.18);
    pos.current.addScaledVector(vel.current, dt);
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -12, 12);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -12, 12);
    BLOCKS.forEach(([bx, bz]) => {
      const d = new THREE.Vector2(pos.current.x - bx, pos.current.z - bz);
      if (d.length() < 1.5) { d.setLength(1.5); pos.current.x = bx + d.x; pos.current.z = bz + d.y; }
    });
    if (hero.current) {
      hero.current.position.copy(pos.current);
      hero.current.position.y = 0.6 + Math.abs(Math.sin(state.clock.elapsedTime * 9)) * 0.12 * Math.min(1, vel.current.length());
    }
    COINS.forEach((c, i) => {
      if (!taken.includes(i) && Math.hypot(pos.current.x - c[0], pos.current.z - c[2]) < 0.9) setTaken((a) => [...a, i]);
    });
    state.camera.position.lerp(new THREE.Vector3(pos.current.x * 0.6, 12, pos.current.z * 0.6 + 12), 0.06);
    state.camera.lookAt(pos.current.x * 0.6, 0, pos.current.z * 0.6);
  });

  return (
    <group>
      <color attach="background" args={['#1b1740']} />
      <fog attach="fog" args={['#1b1740', 18, 48]} />
      <hemisphereLight args={['#c4b5fd', '#1e1b4b', 0.9]} />
      <directionalLight position={[8, 16, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[15, 48]} /><meshStandardMaterial color="#312e81" roughness={0.9} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}><ringGeometry args={[14.4, 15, 64]} /><meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={1.4} /></mesh>
      {BLOCKS.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.9 + (i % 3) * 0.3, z]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.8 + (i % 3) * 0.6, 1.8]} /><meshStandardMaterial color={['#6366f1', '#8b5cf6', '#ec4899'][i % 3]} roughness={0.5} />
        </mesh>
      ))}
      {COINS.map((c, i) => !taken.includes(i) && <Coin key={i} position={c} />)}
      <mesh ref={hero} castShadow><sphereGeometry args={[0.6, 28, 20]} /><meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={0.35} roughness={0.35} /></mesh>
      <Hud>
        <div style={{ position: 'absolute', top: 64, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', color: '#fff', font: '700 15px system-ui', textShadow: '0 1px 6px #000a' }}>
          <span>Coins {taken.length}/{COINS.length}</span><span>{Math.ceil(t)}s</span>
        </div>
        {over && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#0008', color: '#fff', font: '700 22px system-ui', textAlign: 'center', pointerEvents: 'auto' }}>
            <div>{left === 0 ? 'You got every coin!' : 'Time is up'}<br /><small style={{ font: '500 14px system-ui' }}>{taken.length} of {COINS.length} coins</small><br />
              <button onClick={() => { setTaken([]); setT(45); pos.current.set(0, 0.6, 0); }} style={{ marginTop: 12, padding: '10px 22px', borderRadius: 12, border: 0, font: '700 15px system-ui', background: '#8b5cf6', color: '#fff' }}>Play again</button></div>
          </div>
        )}
      </Hud>
      <TouchControls touch={touch} buttons={[]} />
    </group>
  );
}`;

const act = (thought, tool, args) => JSON.stringify({ thought, action: { tool, args } });
const REPLIES = [
  () => act("Demo: building a coin-chase arena with a rolling hero, lit neon ring, obstacles, timer and restart.", "render_jsx", { name: "GameComponent.jsx", code: DEMO_GAME_CODE }),
  () => act("Checking the viewport to make sure it renders.", "check3DView", {}),
  () => JSON.stringify({ thought: "Done.", final: "Demo game ready: collect all 14 coins in 45 seconds. Drag the stick (or use WASD) to roll. This was a scripted demo, add an API key in Settings to build your own idea with a real model." }),
];

/** Same contract as the real chat(): streams the reply through onToken and reports via onFinish. */
export async function demoChat({ messages, onToken, onFinish, signal }) {
  const seen = messages.filter((m) => typeof m.content === "string" ? m.content.startsWith("OBSERVATION:") : Array.isArray(m.content) && m.content.some((p) => String(p?.text || "").startsWith("OBSERVATION:"))).length;
  const reply = REPLIES[Math.min(seen, REPLIES.length - 1)]();
  for (let i = 0; i < reply.length; i += 900) {
    if (signal?.aborted) throw new Error("Stopped.");
    onToken?.(reply.slice(i, i + 900), reply.slice(0, i + 900));
    await new Promise((r) => setTimeout(r, 40));
  }
  onFinish?.({ finishReason: "stop", truncated: false, usage: null, maxTokens: 0, model: "demo" });
  return reply;
}
