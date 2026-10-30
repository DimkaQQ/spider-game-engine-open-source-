import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF, Sky, Html } from '@react-three/drei';
import * as THREE from 'three';

function ModernCityModel() {
  const { scene } = useGLTF('./assets/modern_city_block.glb');
  return <primitive object={scene} position={[0, 0, 0]} scale={[0.12, 0.12, 0.12]} />;
}

export default function GameComponent() {
  const controlsRef = useRef();
  const [view, setView] = useState('street');

  const playSfx = (freq = 440) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  };

  return (
    <>
      <color attach="background" args={['#b8d2ea']} />
      <fog attach="fog" args={['#c5dcee', 60, 320]} />

      <PerspectiveCamera makeDefault position={[-8.0, 3.2, -18.0]} fov={55} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 4, 0]}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={2}
        maxDistance={220}
      />

      <ambientLight intensity={1.1} color="#f0f9ff" />
      <directionalLight
        position={[60, 80, -45]}
        intensity={3.2}
        color="#fff5ed"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-40, 30, 30]} intensity={0.7} color="#93c5fd" />
      <hemisphereLight skyColor="#bae6fd" groundColor="#334155" intensity={0.65} />

      <Sky
        sunPosition={[60, 80, -45]}
        turbidity={5}
        rayleigh={1.1}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <Suspense fallback={
        <Html center>
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            color: '#38bdf8',
            padding: '16px 28px',
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            textAlign: 'center'
          }}>
            <div>🏙 Loading Modern City Block (4K PBR)...</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>22.5 MB Textures & Geometry • Blender 5.4 Master</div>
          </div>
        </Html>
      }>
        <ModernCityModel />
      </Suspense>

      <Html position={[0, 24, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '16px',
          padding: '12px 24px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          pointerEvents: 'auto',
          minWidth: '300px'
        }}>
          <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '1px', color: '#38bdf8' }}>
            MODERN CITY BLOCK
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
            Imported from Downloads/modern-city-block • Assembled & PBR Textured in Blender 5.4
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                playSfx(560);
                setView('street');
                if (controlsRef.current) {
                  controlsRef.current.target.set(0, 3, 5);
                  controlsRef.current.object.position.set(-8.0, 3.2, -18.0);
                }
              }}
              style={{
                background: view === 'street' ? '#0284c7' : '#334155',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🚶 Street View
            </button>
            <button
              onClick={() => {
                playSfx(700);
                setView('aerial');
                if (controlsRef.current) {
                  controlsRef.current.target.set(0, 0, 0);
                  controlsRef.current.object.position.set(45, 65, -55);
                }
              }}
              style={{
                background: view === 'aerial' ? '#0284c7' : '#334155',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🚁 Aerial Drone View
            </button>
          </div>
        </div>
      </Html>
    </>
  );
}
