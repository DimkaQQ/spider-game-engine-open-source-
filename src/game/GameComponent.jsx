import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// SPIDER HORIZON ECO-CITY (100% BESPOKE, OPEN SOURCE PROCEDURAL ARCHITECTURE)
// Completely clean-room procedural synthesis — Zero proprietary third-party assets
// ============================================================================

export default function GameComponent() {
  const controlsRef = useRef();
  const waterRef = useRef();
  const [timeOfDay, setTimeOfDay] = useState('sunset'); // 'day' | 'sunset' | 'night'
  const [viewMode, setViewMode] = useState('promenade'); // 'promenade' | 'drone' | 'fountain'

  // Procedural audio synthesizer for urban ambiance & interactive UI
  const playSfx = (freq = 440, type = 'sine', dur = 0.12) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  // Lighting & Atmospheric Colors by Time of Day
  const env = useMemo(() => {
    if (timeOfDay === 'day') {
      return {
        bg: '#93c5fd',
        fog: '#bae6fd',
        sunColor: '#fffbeb',
        sunIntensity: 2.8,
        sunPos: [50, 70, -40],
        skyFill: '#dbeafe',
        ambient: 0.95,
        windowEmissive: 0.3,
        waterColor: '#0284c7',
        waterEmissive: '#0369a1'
      };
    } else if (timeOfDay === 'sunset') {
      return {
        bg: '#fdba74',
        fog: '#fed7aa',
        sunColor: '#ffedd5',
        sunIntensity: 3.2,
        sunPos: [35, 25, -55],
        skyFill: '#fed7aa',
        ambient: 0.85,
        windowEmissive: 1.8,
        waterColor: '#0369a1',
        waterEmissive: '#ea580c'
      };
    } else {
      // Night Cyberpunk City
      return {
        bg: '#090d16',
        fog: '#0f172a',
        sunColor: '#38bdf8',
        sunIntensity: 0.6,
        sunPos: [-20, 40, -30],
        skyFill: '#1e1b4b',
        ambient: 0.45,
        windowEmissive: 3.5,
        waterColor: '#0f172a',
        waterEmissive: '#06b6d4'
      };
    }
  }, [timeOfDay]);

  // Procedural Materials
  const mats = useMemo(() => {
    return {
      terracotta: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.85, metalness: 0.05 }),
      limestone: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6, metalness: 0.08 }),
      darkSlate: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35, metalness: 0.4 }),
      copperTrim: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.3, metalness: 0.75 }),
      windowWarm: new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: '#f59e0b',
        emissiveIntensity: env.windowEmissive,
        roughness: 0.15
      }),
      windowCyan: new THREE.MeshStandardMaterial({
        color: '#cffafe',
        emissive: '#06b6d4',
        emissiveIntensity: env.windowEmissive * 0.9,
        roughness: 0.15
      }),
      glassDay: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.08, metalness: 0.92 }),
      promenadePaving: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.82 }),
      pathwayStone: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.65 }),
      greenery: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.95 }),
      water: new THREE.MeshStandardMaterial({
        color: env.waterColor,
        emissive: env.waterEmissive,
        emissiveIntensity: 0.35,
        roughness: 0.1,
        metalness: 0.85,
        transparent: true,
        opacity: 0.88
      }),
      neonGold: new THREE.MeshStandardMaterial({
        color: '#fde047',
        emissive: '#eab308',
        emissiveIntensity: timeOfDay === 'night' ? 4.0 : 1.5
      })
    };
  }, [env, timeOfDay]);

  // Animate gentle water ripples in the reflection pool
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (waterRef.current) {
      waterRef.current.position.y = 0.05 + Math.sin(t * 1.5) * 0.02;
    }
  });

  // Procedural Stepped Residential Tower
  const EcoTower = ({ x, z, floors, width, depth, rotY = 0, hasBalconyGreens = true, style = 'terracotta' }) => {
    const floorH = 1.6;
    const floorList = useMemo(() => Array.from({ length: floors }, (_, i) => i), [floors]);

    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        {/* Ground Retail Podium */}
        <mesh position={[0, floorH, 0]} scale={[width, floorH * 2, depth]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.darkSlate} attach="material" />
        </mesh>
        {/* Cafe / Retail Frontage Glow */}
        <mesh position={[0, floorH * 0.9, depth / 2 + 0.06]} scale={[width * 0.92, floorH * 1.2, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.windowWarm} attach="material" />
        </mesh>

        {/* Vertical Floor Stacking */}
        {floorList.map((f) => {
          const fy = floorH * 2 + f * floorH + floorH / 2;
          const isEven = f % 2 === 0;
          const isStepped = f > floors - 4;
          const stepScale = isStepped ? 1.0 - (f - (floors - 4)) * 0.12 : 1.0;

          return (
            <group key={f} position={[0, fy, 0]} scale={[stepScale, 1, stepScale]}>
              {/* White Limestone Architectural Slab */}
              <mesh position={[0, -floorH * 0.38, 0]} scale={[width * 1.03, floorH * 0.14, depth * 1.03]}>
                <boxGeometry args={[1, 1, 1]} />
                <primitive object={mats.limestone} attach="material" />
              </mesh>

              {/* Main Facade Wall Band (Terracotta / Limestone) */}
              <mesh scale={[width, floorH * 0.38, depth]}>
                <boxGeometry args={[1, 1, 1]} />
                <primitive object={isEven ? mats.terracotta : mats.limestone} attach="material" />
              </mesh>

              {/* Copper Trim Architectural Accent */}
              {f % 4 === 0 && (
                <mesh position={[0, -floorH * 0.28, depth / 2 + 0.08]} scale={[width * 0.75, 0.08, 0.08]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <primitive object={mats.copperTrim} attach="material" />
                </mesh>
              )}

              {/* Window Glass Ribbon */}
              <mesh position={[0, floorH * 0.16, 0]} scale={[width * 1.008, floorH * 0.18, depth * 1.008]}>
                <boxGeometry args={[1, 1, 1]} />
                <primitive
                  object={
                    (f + Math.floor(x * 3)) % 5 === 0
                      ? mats.windowWarm
                      : (f + Math.floor(z * 2)) % 7 === 0
                      ? mats.windowCyan
                      : mats.glassDay
                  }
                  attach="material"
                />
              </mesh>

              {/* Vertical Sky-Garden Micro Foliage on Balconies */}
              {hasBalconyGreens && f % 2 === 1 && (
                <mesh position={[width * 0.52, -floorH * 0.2, depth * 0.25]} scale={[0.25, 0.4, depth * 0.35]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <primitive object={mats.greenery} attach="material" />
                </mesh>
              )}
            </group>
          );
        })}

        {/* Solar Canopy Roof Pavilion */}
        <mesh position={[0, floorH * 2 + floors * floorH + 0.8, 0]} scale={[width * 0.85, 0.4, depth * 0.85]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.copperTrim} attach="material" />
        </mesh>
      </group>
    );
  };

  return (
    <>
      <color attach="background" args={[env.bg]} />
      <fog attach="fog" args={[env.fog, 40, 260]} />

      <PerspectiveCamera makeDefault position={[1.5, 3.2, -14.0]} fov={52} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[0, 9, 14]}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 - 0.01}
        minDistance={2}
        maxDistance={150}
      />

      {/* Atmospheric Sun & Sky Lighting */}
      <ambientLight intensity={env.ambient} color={env.skyFill} />
      <directionalLight
        position={env.sunPos}
        intensity={env.sunIntensity}
        color={env.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-30, 25, 20]} intensity={0.6} color="#38bdf8" />
      <hemisphereLight skyColor={env.bg} groundColor="#1e293b" intensity={0.6} />

      {/* 1. Central Promenade Cobblestone Pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 18]}>
        <planeGeometry args={[160, 160]} />
        <primitive object={mats.promenadePaving} attach="material" />
      </mesh>

      {/* 2. Curving Pedestrian Walkways & Green Lawn Islands */}
      {[
        { x: 5.5, z: 6.0, w: 4.2, l: 26.0, rot: 0.08 },
        { x: 14.5, z: 18.0, w: 5.5, l: 34.0, rot: -0.06 },
        { x: -4.5, z: 22.0, w: 3.6, l: 22.0, rot: 0.12 },
        { x: 8.5, z: 36.0, w: 6.0, l: 28.0, rot: -0.08 }
      ].map((p, i) => (
        <group key={i} position={[p.x, 0.03, p.z]} rotation={[0, p.rot, 0]}>
          {/* Green Lawn */}
          <mesh scale={[p.w, 0.08, p.l]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={mats.greenery} attach="material" />
          </mesh>
          {/* Stone Curb */}
          <mesh scale={[p.w + 0.35, 0.12, p.l + 0.35]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={mats.pathwayStone} attach="material" />
          </mesh>
        </group>
      ))}

      {/* 3. Central Architectural Water Plaza & Reflection Pool */}
      <group position={[0, 0.01, 14]}>
        {/* Water Pool Bed */}
        <mesh scale={[12.0, 0.04, 18.0]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.darkSlate} attach="material" />
        </mesh>
        {/* Animated Water Surface */}
        <mesh ref={waterRef} scale={[11.6, 0.02, 17.6]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.water} attach="material" />
        </mesh>
        {/* Luminous Pool Edge Strips */}
        <mesh position={[0, 0.06, 8.9]} scale={[12.0, 0.08, 0.18]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.neonGold} attach="material" />
        </mesh>
        <mesh position={[0, 0.06, -8.9]} scale={[12.0, 0.08, 0.18]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.neonGold} attach="material" />
        </mesh>
      </group>

      {/* 4. Original Procedural Eco-Towers (Clean-Room Architecture) */}
      {/* Right Foreground Tower: Stepped residential terrace block */}
      <EcoTower x={18.5} z={6.0} floors={15} width={15.0} depth={20.0} rotY={-0.06} />

      {/* Left Foreground Tower: Retail base with upper apartments */}
      <EcoTower x={-14.5} z={-1.0} floors={18} width={12.5} depth={14.0} rotY={0.04} />

      {/* Left Midground Skyscraper: Towering residential block */}
      <EcoTower x={-16.5} z={24.0} floors={24} width={11.0} depth={12.0} rotY={0.06} />

      {/* Background Central Twin Skyscrapers */}
      <EcoTower x={-2.5} z={50.0} floors={28} width={9.5} depth={9.5} />
      <EcoTower x={8.5} z={52.0} floors={27} width={9.5} depth={9.5} />

      {/* Right Midground Terraced Block */}
      <EcoTower x={22.0} z={32.0} floors={16} width={13.5} depth={15.0} rotY={-0.08} />

      {/* Distant Skyline Towers */}
      <EcoTower x={-30.0} z={70.0} floors={32} width={15.0} depth={15.0} hasBalconyGreens={false} />
      <EcoTower x={28.0} z={74.0} floors={30} width={16.0} depth={16.0} hasBalconyGreens={false} />

      {/* Interactive HUD Overlay */}
      <Html position={[0, 22, 14]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '18px',
          padding: '14px 26px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          textAlign: 'center',
          boxShadow: '0 16px 44px rgba(0,0,0,0.6)',
          pointerEvents: 'auto',
          minWidth: '320px'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1.2px', color: '#38bdf8' }}>
            SPIDER HORIZON ECO-CITY
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
            100% Original Procedural Architecture • Clean-Room Synthesis • Zero Proprietary Assets
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                playSfx(560);
                setViewMode('promenade');
                if (controlsRef.current) {
                  controlsRef.current.target.set(0, 8, 14);
                  controlsRef.current.object.position.set(1.5, 3.2, -14.0);
                }
              }}
              style={{
                background: viewMode === 'promenade' ? '#0284c7' : '#334155',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🚶 Promenade Walk
            </button>
            <button
              onClick={() => {
                playSfx(680);
                setViewMode('drone');
                if (controlsRef.current) {
                  controlsRef.current.target.set(2, 12, 18);
                  controlsRef.current.object.position.set(40, 52, -28);
                }
              }}
              style={{
                background: viewMode === 'drone' ? '#0284c7' : '#334155',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🚁 Aerial Drone
            </button>
            <button
              onClick={() => {
                playSfx(780);
                const nextTime = timeOfDay === 'sunset' ? 'night' : timeOfDay === 'night' ? 'day' : 'sunset';
                setTimeOfDay(nextTime);
              }}
              style={{
                background: timeOfDay === 'sunset' ? '#f97316' : timeOfDay === 'night' ? '#6366f1' : '#eab308',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              ☀️/🌙 {timeOfDay.toUpperCase()}
            </button>
          </div>
        </div>
      </Html>
    </>
  );
}
