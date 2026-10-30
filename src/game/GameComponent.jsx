import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export default function ZombieDefense() {
  const [kills, setKills] = useState(0);
  const [hp, setHp] = useState(100);
  const heroRef = useRef();
  const enemyRef = useRef();

  useFrame((_, delta) => {
    if (hp <= 0) return;
    const t = window.__spiderVirtualTouch || { x: 0, z: 0 };
    if (heroRef.current) {
      heroRef.current.position.x += t.x * delta * 8;
      heroRef.current.position.z += t.z * delta * 8;
      heroRef.current.position.x = Math.max(-10, Math.min(10, heroRef.current.position.x));
      heroRef.current.position.z = Math.max(-10, Math.min(10, heroRef.current.position.z));
    }
    if (enemyRef.current && heroRef.current) {
      const dx = heroRef.current.position.x - enemyRef.current.position.x;
      const dz = heroRef.current.position.z - enemyRef.current.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.8) {
        enemyRef.current.position.x += (dx / dist) * delta * 3.5;
        enemyRef.current.position.z += (dz / dist) * delta * 3.5;
      } else {
        setHp((h) => Math.max(0, h - 1));
      }
    }
  });

  const onSmiteZombie = () => {
    if (enemyRef.current) {
      enemyRef.current.position.x = (Math.random() - 0.5) * 16;
      enemyRef.current.position.z = (Math.random() - 0.5) * 16;
      setKills((k) => k + 1);
    }
  };

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      {/* Ground arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      {/* Hero */}
      <mesh ref={heroRef} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 1.2, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>
      {/* Zombie target - tap to attack */}
      <mesh ref={enemyRef} position={[5, 0.6, 5]} onPointerDown={onSmiteZombie}>
        <boxGeometry args={[0.9, 1.2, 0.9]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      <Html fullscreen calculatePosition={(_, __, s) => [s.width / 2, 20]}>
        <div style={{
          background: 'rgba(12,10,9,0.9)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 20,
          fontFamily: 'sans-serif',
          fontWeight: 700,
          textAlign: 'center'
        }}>
          <div>HP: {hp}% | Kills: {kills}</div>
          <small style={{ color: '#f87171' }}>Tap the red zombie to attack!</small>
        </div>
      </Html>
    </group>
  );
}