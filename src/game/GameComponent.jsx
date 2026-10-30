import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// BESPOKE MODERN CITY BLOCK (100% CLEAN-ROOM PROCEDURAL ARCHITECTURE)
// Inspired by the European high-rise residential quarter & commercial streetscape
// Zero third-party proprietary meshes or copyrighted textures
// ============================================================================

export default function GameComponent() {
  const controlsRef = useRef();
  const [cameraMode, setCameraMode] = useState('street'); // 'street' | 'sidewalk' | 'aerial'
  const [lightsOn, setLightsOn] = useState(true);

  // Sound generator for urban ambience and UI interaction
  const playSfx = (freq = 440, type = 'sine', dur = 0.12) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  // Bespoke Procedural Materials
  const mats = useMemo(() => {
    // Generate procedural paver texture on HTML canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    const size = 32;
    for (let x = 0; x <= 256; x += size) {
      for (let y = 0; y <= 256; y += size) {
        ctx.strokeRect(x, y, size, size);
      }
    }
    const paverTex = new THREE.CanvasTexture(canvas);
    paverTex.wrapS = THREE.RepeatWrapping;
    paverTex.wrapT = THREE.RepeatWrapping;
    paverTex.repeat.set(12, 12);

    return {
      asphalt: new THREE.MeshStandardMaterial({ color: '#272a30', roughness: 0.9, metalness: 0.1 }),
      roadLine: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }),
      sidewalk: new THREE.MeshStandardMaterial({ map: paverTex, roughness: 0.8 }),
      curbStone: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.5 }),
      lawnGrass: new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.95 }),
      brickTerracotta: new THREE.MeshStandardMaterial({ color: '#8c3e2b', roughness: 0.85 }),
      concreteWhite: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.55 }),
      metalCharcoal: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35, metalness: 0.5 }),
      metalBlueSiding: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.4 }),
      glassStorefront: new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: '#f59e0b',
        emissiveIntensity: lightsOn ? 2.2 : 0.4,
        roughness: 0.15,
        metalness: 0.8
      }),
      glassDay: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.08,
        metalness: 0.95
      }),
      windowWarm: new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: '#f59e0b',
        emissiveIntensity: lightsOn ? 1.8 : 0.2,
        roughness: 0.2
      }),
      blackIronFence: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.25, metalness: 0.85 })
    };
  }, [lightsOn]);

  // Procedural Windowed Facade Block
  const ResidentialBlock = ({ x, z, floors, width, depth, floorH = 1.65, rotY = 0, style = 'mixed' }) => {
    const floorList = useMemo(() => Array.from({ length: floors }, (_, i) => i), [floors]);

    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        {/* Commercial Retail Ground Base */}
        <group position={[0, floorH, 0]}>
          <mesh scale={[width, floorH * 2, depth]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={mats.metalCharcoal} attach="material" />
          </mesh>
          {/* Large Retail Display Windows */}
          <mesh position={[0, -floorH * 0.1, depth / 2 + 0.06]} scale={[width * 0.94, floorH * 1.3, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={mats.glassStorefront} attach="material" />
          </mesh>
          {/* Glass Entrance Double Doors */}
          <mesh position={[0, -floorH * 0.2, depth / 2 + 0.1]} scale={[2.2, floorH * 1.1, 0.08]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={mats.glassStorefront} attach="material" />
          </mesh>
        </group>

        {/* Horizontal Architectural Transition Siding Band */}
        <mesh position={[0, floorH * 2 + 0.35, depth / 2 + 0.08]} scale={[width * 1.01, 0.7, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.metalBlueSiding} attach="material" />
        </mesh>

        {/* Stacked Residential Floors */}
        {floorList.map((f) => {
          const fy = floorH * 2 + 0.7 + f * floorH + floorH / 2;
          const isEven = f % 2 === 0;

          return (
            <group key={f} position={[0, fy, 0]}>
              {/* White Concrete Balcony Slab */}
              <mesh position={[0, -floorH * 0.38, 0]} scale={[width * 1.03, floorH * 0.14, depth * 1.03]}>
                <boxGeometry args={[1, 1, 1]} />
                <primitive object={mats.concreteWhite} attach="material" />
              </mesh>

              {/* Exterior Wall (Terracotta Brick or White Panel) */}
              <mesh scale={[width, floorH * 0.38, depth]}>
                <boxGeometry args={[1, 1, 1]} />
                <primitive object={isEven ? mats.brickTerracotta : mats.concreteWhite} attach="material" />
              </mesh>

              {/* Window Glass Ribbons */}
              <mesh position={[0, floorH * 0.16, 0]} scale={[width * 1.008, floorH * 0.18, depth * 1.008]}>
                <boxGeometry args={[1, 1, 1]} />
                <primitive object={(f + Math.floor(x)) % 3 === 0 ? mats.windowWarm : mats.glassDay} attach="material" />
              </mesh>
            </group>
          );
        })}

        {/* Roof Mechanical Penthouse & Parapet */}
        <mesh position={[0, floorH * 2 + 0.7 + floors * floorH + 0.5, 0]} scale={[width * 0.92, 1.0, depth * 0.92]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.metalCharcoal} attach="material" />
        </mesh>
      </group>
    );
  };

  // Metal Perimeter Fence
  const PerimeterFence = ({ x, z, length, rotY = 0 }) => {
    const postCount = Math.floor(length / 2);
    const posts = useMemo(() => Array.from({ length: postCount }, (_, i) => i * 2 - length / 2), [postCount, length]);

    return (
      <group position={[x, 0.6, z]} rotation={[0, rotY, 0]}>
        {/* Top & Bottom Horizontal Rails */}
        <mesh position={[0, 0.45, 0]} scale={[length, 0.05, 0.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.blackIronFence} attach="material" />
        </mesh>
        <mesh position={[0, -0.45, 0]} scale={[length, 0.05, 0.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.blackIronFence} attach="material" />
        </mesh>
        {/* Vertical Fence Pickets */}
        {posts.map((px, idx) => (
          <mesh key={idx} position={[px, 0, 0]} scale={[0.06, 1.1, 0.06]}>
            <boxGeometry args={[1, 1, 1]} />
            <primitive object={mats.blackIronFence} attach="material" />
          </mesh>
        ))}
      </group>
    );
  };

  return (
    <>
      <color attach="background" args={['#cde2f2']} />
      <fog attach="fog" args={['#dbeafe', 50, 280]} />

      <PerspectiveCamera makeDefault position={[-4.5, 2.4, -18.0]} fov={54} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={[1.0, 6.0, 15.0]}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 - 0.01}
        minDistance={2}
        maxDistance={160}
      />

      {/* Realistic Daytime Sun & Atmospheric Lighting */}
      <ambientLight intensity={1.1} color="#e0f2fe" />
      <directionalLight
        position={[45, 60, -35]}
        intensity={3.2}
        color="#fffbeb"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-35, 25, 25]} intensity={0.7} color="#93c5fd" />
      <hemisphereLight skyColor="#cde2f2" groundColor="#334155" intensity={0.6} />

      {/* ================================================================= */}
      {/* 1. ASPHALT ROADWAY & MARKINGS (CENTER AVENUE)                    */}
      {/* ================================================================= */}
      <group position={[0, 0, 15]}>
        {/* Main Asphalt Road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[14.0, 180]} />
          <primitive object={mats.asphalt} attach="material" />
        </mesh>

        {/* White Center Road Divider Line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[0.22, 175]} />
          <primitive object={mats.roadLine} attach="material" />
        </mesh>

        {/* White Parking Stall Markings (Left Side of Road) */}
        {Array.from({ length: 12 }, (_, i) => -50 + i * 10).map((pz, idx) => (
          <group key={idx} position={[-4.5, 0.02, pz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[3.2, 0.18]} />
              <primitive object={mats.roadLine} attach="material" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 2. PEDESTRIAN SIDEWALKS, STONE CURBS & LAWN ISLANDS               */}
      {/* ================================================================= */}
      {/* Right Sidewalk (along the commercial retail complex) */}
      <group position={[11.5, 0.12, 15]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9.0, 180]} />
          <primitive object={mats.sidewalk} attach="material" />
        </mesh>
        {/* Concrete Curb along road edge */}
        <mesh position={[-4.6, -0.06, 0]} scale={[0.35, 0.18, 180]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.curbStone} attach="material" />
        </mesh>
      </group>

      {/* Left Sidewalk & Curving Green Grass Lawn (along residential side) */}
      <group position={[-11.5, 0.12, 15]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9.0, 180]} />
          <primitive object={mats.sidewalk} attach="material" />
        </mesh>
        {/* Concrete Curb along road edge */}
        <mesh position={[4.6, -0.06, 0]} scale={[0.35, 0.18, 180]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.curbStone} attach="material" />
        </mesh>
        {/* Green Grass Lawn Strip */}
        <mesh position={[-1.2, 0.02, 0]} scale={[5.0, 0.06, 170]}>
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={mats.lawnGrass} attach="material" />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 3. RESIDENTIAL & COMMERCIAL BUILDINGS (EXACT SCENE COMPOSITION)   */}
      {/* ================================================================= */}
      {/* Right Foreground Building (Commercial Retail Storefront + Terracotta Apartments) */}
      <ResidentialBlock x={24.0} z={8.0} floors={14} width={16.0} depth={26.0} floorH={1.65} rotY={-0.03} />

      {/* Left Foreground Residential Tower */}
      <ResidentialBlock x={-22.0} z={-2.0} floors={16} width={13.0} depth={16.0} floorH={1.65} rotY={0.03} />

      {/* Left Midground High-Rise Tower (white vertical mullions) */}
      <ResidentialBlock x={-24.0} z={32.0} floors={22} width={11.0} depth={12.0} floorH={1.65} rotY={0.04} />

      {/* Background Central Twin Towers (Standing tall against horizon) */}
      <ResidentialBlock x={-4.0} z={65.0} floors={26} width={10.0} depth={10.0} floorH={1.65} />
      <ResidentialBlock x={7.5} z={67.0} floors={25} width={10.0} depth={10.0} floorH={1.65} />

      {/* Right Midground Stepped Block */}
      <ResidentialBlock x={26.0} z={42.0} floors={16} width={14.0} depth={18.0} floorH={1.65} rotY={-0.05} />

      {/* Distant Skyline Towers */}
      <ResidentialBlock x={-35.0} z={95.0} floors={28} width={16.0} depth={16.0} floorH={1.65} />
      <ResidentialBlock x={32.0} z={100.0} floors={30} width={18.0} depth={18.0} floorH={1.65} />

      {/* ================================================================= */}
      {/* 4. PERIMETER METAL FENCES                                         */}
      {/* ================================================================= */}
      <PerimeterFence x={6.8} z={15.0} length={120.0} />
      <PerimeterFence x={-6.8} z={25.0} length={80.0} />

      {/* ================================================================= */}
      {/* 5. INTERACTIVE HUD OVERLAY                                        */}
      {/* ================================================================= */}
      <Html position={[0, 24, 15]} center style={{ pointerEvents: 'none' }}>
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
            MODERN RESIDENTIAL CITY BLOCK
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
            Bespoke Procedural Urban Architecture • 100% Original Clean-Room Synthesis • Zero License Limits
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                playSfx(560);
                setCameraMode('street');
                if (controlsRef.current) {
                  controlsRef.current.target.set(1.0, 6.0, 15.0);
                  controlsRef.current.object.position.set(-4.5, 2.4, -18.0);
                }
              }}
              style={{
                background: cameraMode === 'street' ? '#0284c7' : '#334155',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🚶 Street Perspective
            </button>
            <button
              onClick={() => {
                playSfx(660);
                setCameraMode('sidewalk');
                if (controlsRef.current) {
                  controlsRef.current.target.set(12.0, 4.0, 10.0);
                  controlsRef.current.object.position.set(10.0, 2.2, -12.0);
                }
              }}
              style={{
                background: cameraMode === 'sidewalk' ? '#0284c7' : '#334155',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              🏬 Storefront Sidewalk
            </button>
            <button
              onClick={() => {
                playSfx(780);
                setCameraMode('aerial');
                if (controlsRef.current) {
                  controlsRef.current.target.set(0, 12, 25);
                  controlsRef.current.object.position.set(45, 60, -35);
                }
              }}
              style={{
                background: cameraMode === 'aerial' ? '#0284c7' : '#334155',
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
                playSfx(880);
                setLightsOn(!lightsOn);
              }}
              style={{
                background: lightsOn ? '#f59e0b' : '#475569',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              💡 {lightsOn ? 'Evening Storefronts' : 'Daylight Glass'}
            </button>
          </div>
        </div>
      </Html>
    </>
  );
}
