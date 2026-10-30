import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PauseOverlay } from './ArenaEnv.jsx';

const sfx = (freq = 440, type = 'sine', dur = 0.1) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
};

export default function GameComponent() {
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const ballRef = useRef();

  useFrame((state, delta) => {
    if (paused) return;
    if (ballRef.current) {
      ballRef.current.rotation.y += delta * 1.5;
      ballRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
    }
  });

  const onCollect = () => {
    if (paused) return;
    setScore((s) => s + 1);
    if (!muted) sfx(660, 'triangle', 0.15);
  };

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#065f46" roughness={0.8} />
      </mesh>
      <mesh ref={ballRef} position={[0, 1, 0]} onClick={onCollect}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.5} />
      </mesh>
      <Html fullscreen calculatePosition={(_, __, s) => [s.width / 2, 30]}>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: 16,
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          💎 Orbs Collected: {score} (Click the blue orb!)
        </div>
      </Html>
      <PauseOverlay
        paused={paused}
        onTogglePause={() => setPaused(!paused)}
        soundMuted={muted}
        onToggleSound={() => setMuted(!muted)}
        onExit={() => setPaused(false)}
      />
    </group>
  );
}