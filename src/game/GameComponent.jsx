import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// PROCEDURAL AUDIO SYNTHESIZER (DARK RAIN & CITY AMBIENCE)
// ==========================================
class DarkWorldAudio {
  constructor() {
    this.ctx = null;
    this.rainNode = null;
    this.rainGain = null;
    this.droneGain = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Atmospheric Pink/Brown Noise Generator for Rain
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }

      this.rainNode = this.ctx.createBufferSource();
      this.rainNode.buffer = noiseBuffer;
      this.rainNode.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 1100;

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.muted ? 0 : 0.05, this.ctx.currentTime);

      this.rainNode.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      this.rainNode.start();

      // Deep Sub Drone for Cyberpunk City Skyline
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      const droneFilter = this.ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 140;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(this.muted ? 0 : 0.025, this.ctx.currentTime);

      osc.connect(droneFilter);
      droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);
      osc.start();

      this.initialized = true;
    } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) {
      if (this.rainGain) this.rainGain.gain.value = this.muted ? 0 : 0.05;
      if (this.droneGain) this.droneGain.gain.value = this.muted ? 0 : 0.025;
    }
    return this.muted;
  }

  playStep(sprint = false) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(sprint ? 140 : 110, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(sprint ? 0.04 : 0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playJump() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playCollect() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);

        gain.gain.setValueAtTime(0.05, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.36);
      });
    } catch (e) {}
  }
}

const worldAudio = new DarkWorldAudio();

// ==========================================
// 3D HOODED WAYFARER CHARACTER MESH
// (Matches the Try Ur Best Knowledge Park artwork: long trenchcoat, cowl hood, cyber glow)
// ==========================================
const WayfarerMesh = React.memo(({ moving, sprinting, airborne, stridePhase, coatSway }) => {
  const coatLeftRef = useRef();
  const coatRightRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  // Apply procedural leg stride and arm swinging
  useFrame(() => {
    const swingAmp = airborne ? 0.15 : sprinting ? 0.75 : moving ? 0.45 : 0;
    const legRot = Math.sin(stridePhase) * swingAmp;
    const armRot = -Math.sin(stridePhase) * swingAmp * 0.8;

    if (leftLegRef.current) leftLegRef.current.rotation.x = legRot;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legRot;
    if (leftArmRef.current) leftArmRef.current.rotation.x = armRot;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -armRot;

    // Trenchcoat dynamic flare & wind sway
    const coatFlutter = Math.sin(stridePhase * 1.5) * 0.08 + (sprinting ? 0.35 : moving ? 0.15 : 0.05);
    if (coatLeftRef.current) {
      coatLeftRef.current.rotation.x = coatFlutter + coatSway.x * 0.5;
      coatLeftRef.current.rotation.z = 0.08 + coatSway.y * 0.2;
    }
    if (coatRightRef.current) {
      coatRightRef.current.rotation.x = coatFlutter + coatSway.x * 0.5;
      coatRightRef.current.rotation.z = -0.08 - coatSway.y * 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. HEAD & DEEP COWL HOOD */}
      <group position={[0, 1.82, 0]}>
        {/* Outer cowl hood */}
        <mesh castShadow>
          <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Hood peak brim */}
        <mesh position={[0, 0.08, 0.2]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.24]} />
          <meshStandardMaterial color="#090d16" roughness={0.95} />
        </mesh>
        {/* Shadowed inner face cavity */}
        <mesh position={[0, -0.04, 0.12]}>
          <sphereGeometry args={[0.22, 12, 12]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        {/* Cyber Visor / Glowing Cyan Eyes */}
        <mesh position={[0, -0.02, 0.22]}>
          <boxGeometry args={[0.22, 0.035, 0.04]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3.2} />
        </mesh>
      </group>

      {/* 2. HIGH COLLAR & TORSO / TRENCHCOAT UPPER */}
      <group position={[0, 1.35, 0]}>
        {/* High neck protector collar */}
        <mesh position={[0, 0.28, 0.02]} castShadow>
          <cylinderGeometry args={[0.25, 0.32, 0.2, 12]} />
          <meshStandardMaterial color="#090d16" roughness={0.85} />
        </mesh>
        {/* Torso Chest Armor / Cyber Vest */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.54, 0.55, 0.34]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Glowing Spine Power Conduit */}
        <mesh position={[0, 0.04, -0.18]}>
          <boxGeometry args={[0.07, 0.44, 0.03]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.8} />
        </mesh>
        {/* Shoulder Pauldrons */}
        <mesh position={[-0.34, 0.2, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0.34, 0.2, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      {/* 3. ARMS WITH CYBER BRACERS */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.35, 1.45, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.42, 6, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.8} />
        </mesh>
        {/* Left Cyber Vambrace */}
        <mesh position={[0, -0.32, 0.02]}>
          <cylinderGeometry args={[0.1, 0.09, 0.22, 8]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} metalness={0.6} />
        </mesh>
      </group>
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.35, 1.45, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.42, 6, 8]} />
          <meshStandardMaterial color="#111827" roughness={0.8} />
        </mesh>
        {/* Right Cyber Vambrace */}
        <mesh position={[0, -0.32, 0.02]}>
          <cylinderGeometry args={[0.1, 0.09, 0.22, 8]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} metalness={0.6} />
        </mesh>
      </group>

      {/* 4. FLOWING TRENCHCOAT TAILS (DUSTER) */}
      <group position={[0, 1.05, 0]}>
        {/* Waist Tactical Belt with Golden Buckle */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.32, 0.1, 14]} />
          <meshStandardMaterial color="#090d16" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0.31]}>
          <boxGeometry args={[0.14, 0.08, 0.04]} />
          <meshStandardMaterial color="#c79d42" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Coat Tail Left */}
        <group ref={coatLeftRef} position={[-0.14, -0.05, -0.1]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.26, 0.75, 0.06]} />
            <meshStandardMaterial color="#090d16" roughness={0.9} />
          </mesh>
          {/* Cyan Coat Seam Lining */}
          <mesh position={[-0.12, -0.42, 0.03]}>
            <boxGeometry args={[0.02, 0.72, 0.02]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
          </mesh>
        </group>

        {/* Coat Tail Right */}
        <group ref={coatRightRef} position={[0.14, -0.05, -0.1]}>
          <mesh position={[0, -0.42, 0]} castShadow>
            <boxGeometry args={[0.26, 0.75, 0.06]} />
            <meshStandardMaterial color="#090d16" roughness={0.9} />
          </mesh>
          {/* Cyan Coat Seam Lining */}
          <mesh position={[0.12, -0.42, 0.03]}>
            <boxGeometry args={[0.02, 0.72, 0.02]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>

      {/* 5. LEGS & URBAN ARMORED BOOTS */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.16, 0.95, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.75, 6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} />
        </mesh>
        {/* Left Armored Boot */}
        <mesh position={[0, -0.88, 0.06]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.32]} />
          <meshStandardMaterial color="#020617" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.16, 0.95, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <capsuleGeometry args={[0.095, 0.75, 6, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} />
        </mesh>
        {/* Right Armored Boot */}
        <mesh position={[0, -0.88, 0.06]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.32]} />
          <meshStandardMaterial color="#020617" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>
    </group>
  );
});

// ==========================================
// KNOWLEDGE PARK DARK OPEN WORLD ENVIRONMENT
// (Faithful 3D recreation of the Knowledge Park title city)
// ==========================================
const KnowledgeParkWorld = React.memo(({ shards, onCollectShard, playerPos }) => {
  // Rain particles: 350 drops falling continuously
  const rainGeo = useMemo(() => {
    const count = 380;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  const rainRef = useRef();
  useFrame((_, dt) => {
    if (!rainRef.current) return;
    const p = rainRef.current.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 38;
      if (y < 0) y = 45;
      p.setY(i, y);
      // Wind drift
      let x = p.getX(i) - dt * 8;
      if (x < -80) x = 80;
      p.setX(i, x);
    }
    p.needsUpdate = true;
  });

  // Skyscraper window grids (deterministic seeds)
  const leftTowerWindows = useMemo(() => {
    const list = [];
    for (let r = 0; r < 28; r++) {
      for (let c = 0; c < 14; c++) {
        if (Math.random() > 0.3) {
          list.push({
            x: (c - 6.5) * 2.2,
            y: 8 + r * 3.6,
            z: 0.1,
            warm: Math.random() > 0.5,
            intensity: 0.6 + Math.random() * 0.8
          });
        }
      }
    }
    return list;
  }, []);

  const rightTowerWindows = useMemo(() => {
    const list = [];
    for (let r = 0; r < 36; r++) {
      for (let c = 0; c < 16; c++) {
        if (Math.random() > 0.35) {
          list.push({
            x: (c - 7.5) * 2.4,
            y: 10 + r * 3.5,
            z: 0.1,
            warm: Math.random() > 0.65,
            intensity: 0.5 + Math.random() * 0.9
          });
        }
      }
    }
    return list;
  }, []);

  // Streetlamp coordinates along the main promenade
  const streetlamps = useMemo(() => [
    { x: -14, z: -40 }, { x: 14, z: -40 },
    { x: -14, z: -20 }, { x: 14, z: -20 },
    { x: -14, z: 0 },   { x: 14, z: 0 },
    { x: -14, z: 20 },  { x: 14, z: 20 },
    { x: -14, z: 40 },  { x: 14, z: 40 },
    { x: -28, z: 10 },  { x: 28, z: 10 },
  ], []);

  // Cyber fairy-light trees
  const cyberTrees = useMemo(() => [
    { x: -18, z: -30 }, { x: 18, z: -30 },
    { x: -18, z: -10 }, { x: 18, z: -10 },
    { x: -18, z: 10 },  { x: 18, z: 10 },
    { x: -18, z: 30 },  { x: 18, z: 30 },
  ], []);

  return (
    <group>
      {/* 1. ATMOSPHERIC NIGHT SKY & VOLUMETRIC FOG */}
      <color attach="background" args={["#030712"]} />
      <fog attach="fog" args={["#050b16", 35, 175]} />
      <Stars radius={180} depth={50} count={3500} factor={4} fade speed={0.6} />

      {/* Ambient Moody Midnight Lighting */}
      <ambientLight intensity={0.35} color="#38bdf8" />
      <directionalLight
        position={[25, 60, -35]}
        intensity={0.6}
        color="#93c5fd"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* 2. FALLING RAIN PARTICLES */}
      <points ref={rainRef}>
        <primitive object={rainGeo} attach="geometry" />
        <pointsMaterial color="#93c5fd" size={0.22} transparent opacity={0.65} depthWrite={false} />
      </points>

      {/* 3. WET RAIN-SLICKED PLAZA PAVEMENT */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[320, 320]} />
        <meshStandardMaterial
          color="#060c18"
          roughness={0.18}
          metalness={0.7}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Glowing Plaza Guideway Markings & Gridlines */}
      <group position={[0, 0.02, 0]}>
        {/* Central Cyan Promenade Stripes */}
        {[-30, -15, 0, 15, 30].map((z, i) => (
          <mesh key={`pstrip-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]}>
            <planeGeometry args={[1.2, 8]} />
            <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={1.8} />
          </mesh>
        ))}

        {/* Amber Edge Road Borders */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0, 0]}>
          <planeGeometry args={[0.3, 140]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0, 0]}>
          <planeGeometry args={[0.3, 140]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.4} />
        </mesh>
      </group>

      {/* Reflective Rain Puddle Decals on Plaza */}
      {[
        [-5, -12, 6, 12],
        [6, 8, 8, 14],
        [-8, 24, 7, 10],
        [4, -32, 9, 16],
      ].map(([px, pz, rw, rh], idx) => (
        <mesh key={`puddle-${idx}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.015, pz]}>
          <planeGeometry args={[rw, rh]} />
          <meshStandardMaterial color="#0a192f" roughness={0.05} metalness={0.92} transparent opacity={0.88} />
        </mesh>
      ))}

      {/* 4. MASSIVE KNOWLEDGE PARK SKYSCRAPERS */}
      {/* NORTH CENTRAL: KNOWLEDGE PARK PODIUM & GIANT NEON SIGN */}
      <group position={[0, 0, -65]}>
        {/* Grand Podium Building */}
        <mesh position={[0, 12, 0]} castShadow receiveShadow>
          <boxGeometry args={[70, 24, 30]} />
          <meshStandardMaterial color="#071322" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Glass Entrance Facade */}
        <mesh position={[0, 5, 15.2]}>
          <planeGeometry args={[36, 10]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>

        {/* GIANT 3D ILLUMINATED "KNOWLEDGE PARK" SIGN */}
        <group position={[0, 25.5, 15.4]}>
          {/* Sign Backplate */}
          <mesh>
            <boxGeometry args={[46, 5.2, 0.8]} />
            <meshStandardMaterial color="#020617" roughness={0.9} />
          </mesh>
          {/* Neon Border */}
          <mesh position={[0, 0, 0.42]}>
            <boxGeometry args={[45.2, 4.4, 0.1]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3.5} />
          </mesh>
          <Html position={[0, 0, 0.6]} transform center distanceFactor={26}>
            <div className="select-none pointer-events-none px-6 py-2 flex flex-col items-center justify-center">
              <span className="text-4xl font-black tracking-[0.28em] text-cyan-200 drop-shadow-[0_0_24px_rgba(56,189,248,0.9)] whitespace-nowrap font-sans">
                KNOWLEDGE PARK
              </span>
              <span className="text-xs font-bold tracking-[0.45em] text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] mt-1">
                SECTOR IV • ECHOES OF THE SPIRE
              </span>
            </div>
          </Html>
        </group>
      </group>

      {/* WEST SKYSCRAPER (LEFT TOWER - 95m High) */}
      <group position={[-52, 0, -25]}>
        <mesh position={[0, 48, 0]} castShadow receiveShadow>
          <boxGeometry args={[32, 96, 38]} />
          <meshStandardMaterial color="#091424" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Roof Spire Antenna */}
        <mesh position={[0, 104, 0]}>
          <cylinderGeometry args={[0.3, 0.8, 16, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        {/* Red Warning Beacon */}
        <mesh position={[0, 112, 0]}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={4} />
        </mesh>
        {/* Office Window Matrix */}
        {leftTowerWindows.map((w, idx) => (
          <mesh key={`ltw-${idx}`} position={[w.x, w.y, 19.1]}>
            <planeGeometry args={[1.6, 1.8]} />
            <meshStandardMaterial
              color={w.warm ? "#fbbf24" : "#7dd3fc"}
              emissive={w.warm ? "#fbbf24" : "#7dd3fc"}
              emissiveIntensity={w.intensity * 1.6}
            />
          </mesh>
        ))}
      </group>

      {/* EAST SKYSCRAPER (RIGHT SPIRE - 120m High) */}
      <group position={[54, 0, -20]}>
        <mesh position={[0, 60, 0]} castShadow receiveShadow>
          <boxGeometry args={[36, 120, 42]} />
          <meshStandardMaterial color="#06101e" roughness={0.35} metalness={0.7} />
        </mesh>
        {/* Curved Modern Spire Roof */}
        <mesh position={[0, 126, 0]}>
          <cylinderGeometry args={[0.4, 2.5, 24, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} />
        </mesh>
        {/* Pulsing Beacon */}
        <mesh position={[0, 138, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={5} />
        </mesh>
        {/* Office Window Matrix */}
        {rightTowerWindows.map((w, idx) => (
          <mesh key={`rtw-${idx}`} position={[w.x, w.y, 21.1]}>
            <planeGeometry args={[1.8, 2.0]} />
            <meshStandardMaterial
              color={w.warm ? "#f59e0b" : "#38bdf8"}
              emissive={w.warm ? "#f59e0b" : "#38bdf8"}
              emissiveIntensity={w.intensity * 1.5}
            />
          </mesh>
        ))}
      </group>

      {/* HIGH SKYBRIDGE CONNECTING TOWERS */}
      <group position={[0, 52, -22]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[74, 5.5, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Glass Promenade */}
        <mesh position={[0, 0, 4.1]}>
          <planeGeometry args={[70, 3.8]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* 5. STREETLAMPS WITH WARM AMBER LIGHT CONES */}
      {streetlamps.map((lamp, i) => (
        <group key={`lamp-${i}`} position={[lamp.x, 0, lamp.z]}>
          {/* Post */}
          <mesh position={[0, 4, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 8, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          {/* Lamp Head & Arm */}
          <mesh position={[lamp.x < 0 ? 0.8 : -0.8, 7.8, 0]} castShadow>
            <boxGeometry args={[1.4, 0.25, 0.4]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Glowing Amber Bulb */}
          <mesh position={[lamp.x < 0 ? 1.2 : -1.2, 7.6, 0]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={4.5} />
          </mesh>
          {/* Real Spotlight illuminating wet ground */}
          <spotLight
            position={[lamp.x < 0 ? 1.2 : -1.2, 7.5, 0]}
            target-position={[lamp.x < 0 ? 2 : -2, 0, 0]}
            color="#fbbf24"
            intensity={2.8}
            angle={0.7}
            penumbra={0.6}
            distance={28}
          />
        </group>
      ))}

      {/* 6. CYBER TREES WITH FAIRY LIGHTS */}
      {cyberTrees.map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, 0, tree.z]}>
          {/* Trunk */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.4, 5, 8]} />
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
          </mesh>
          {/* Foliage Canopy */}
          <mesh position={[0, 5.2, 0]} castShadow>
            <sphereGeometry args={[2.4, 12, 12]} />
            <meshStandardMaterial color="#052e16" roughness={0.8} />
          </mesh>
          {/* Twinkling Fairy Lights Clusters */}
          {[-1.2, 0, 1.2].map((ox, j) =>
            [-1.2, 0, 1.2].map((oz, k) => (
              <mesh key={`fl-${j}-${k}`} position={[ox * 1.4, 4.8 + ((j + k) % 2) * 0.8, oz * 1.4]}>
                <sphereGeometry args={[0.12, 6, 6]} />
                <meshStandardMaterial
                  color={(j + k) % 2 === 0 ? "#f59e0b" : "#38bdf8"}
                  emissive={(j + k) % 2 === 0 ? "#f59e0b" : "#38bdf8"}
                  emissiveIntensity={3.2}
                />
              </mesh>
            ))
          )}
        </group>
      ))}

      {/* 7. COLLECTIBLE DATA SHARDS (KNOWLEDGE ORBS) */}
      {shards.map((s) => (
        !s.collected && (
          <group key={`shard-${s.id}`} position={[s.x, s.y, s.z]}>
            {/* Spinning Diamond Shard */}
            <mesh rotation={[0.4, s.rotY || 0, 0.3]}>
              <octahedronGeometry args={[0.65, 0]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={3.8}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Pulsing Light halo */}
            <pointLight color="#38bdf8" intensity={1.8} distance={8} />
          </group>
        )
      ))}
    </group>
  );
});

// ==========================================
// MAIN PLAYABLE GAME COMPONENT
// ==========================================
export default function GameComponent() {
  const [hudStats, setHudStats] = useState({
    hp: 100,
    stamina: 100,
    shardsFound: 0,
    totalShards: 12,
    muted: false,
    speed: 0
  });

  // Collectible Shards across Knowledge Park Plaza
  const [shards, setShards] = useState(() => [
    { id: 1, x: 0, y: 1.5, z: -15, collected: false },
    { id: 2, x: -8, y: 1.5, z: -25, collected: false },
    { id: 3, x: 8, y: 1.5, z: -25, collected: false },
    { id: 4, x: -16, y: 1.5, z: 5, collected: false },
    { id: 5, x: 16, y: 1.5, z: 5, collected: false },
    { id: 6, x: 0, y: 1.5, z: 25, collected: false },
    { id: 7, x: -10, y: 1.5, z: -45, collected: false },
    { id: 8, x: 10, y: 1.5, z: -45, collected: false },
    { id: 9, x: 0, y: 1.5, z: -55, collected: false },
    { id: 10, x: -24, y: 1.5, z: -12, collected: false },
    { id: 11, x: 24, y: 1.5, z: -12, collected: false },
    { id: 12, x: 0, y: 1.5, z: 5, collected: false },
  ]);

  // Player Physics & State Refs (60fps reactive loop without React state churn)
  const playerRef = useRef({
    pos: new THREE.Vector3(0, 0, 10),
    vel: new THREE.Vector3(0, 0, 0),
    rotY: Math.PI, // Facing forward (North)
    targetRotY: Math.PI,
    stridePhase: 0,
    coatSway: { x: 0, y: 0 },
    airborne: false,
    moving: false,
    sprinting: false,
    stamina: 100,
  });

  // Third-person Camera Rig State
  const cameraControlRef = useRef({
    orbitAngleX: 0,
    orbitAngleY: 0.22,
    distance: 7.5,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  const keysPressedRef = useRef({});

  // Input Listeners
  useEffect(() => {
    worldAudio.init();

    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      keysPressedRef.current[k] = true;
      if (k === ' ' || k === 'spacebar') {
        e.preventDefault();
        const p = playerRef.current;
        if (!p.airborne) {
          p.vel.y = 9.8; // Jump impulse
          p.airborne = true;
          worldAudio.playJump();
        }
      }
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keysPressedRef.current[k] = false;
    };

    const handleMouseDown = (e) => {
      if (e.button === 0 || e.button === 2) {
        cameraControlRef.current.isDragging = true;
        cameraControlRef.current.lastMouseX = e.clientX;
        cameraControlRef.current.lastMouseY = e.clientY;
      }
      worldAudio.init();
    };

    const handleMouseMove = (e) => {
      const cam = cameraControlRef.current;
      if (!cam.isDragging) return;
      const dx = e.clientX - cam.lastMouseX;
      const dy = e.clientY - cam.lastMouseY;
      cam.orbitAngleX -= dx * 0.0055;
      cam.orbitAngleY = Math.max(-0.15, Math.min(1.15, cam.orbitAngleY + dy * 0.004));
      cam.lastMouseX = e.clientX;
      cam.lastMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      cameraControlRef.current.isDragging = false;
    };

    const handleWheel = (e) => {
      const cam = cameraControlRef.current;
      cam.distance = Math.max(3.5, Math.min(16, cam.distance + e.deltaY * 0.005));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const wayfarerGroupRef = useRef();

  // Core 60 FPS Physics, Animation & Chase Camera Loop
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const keys = keysPressedRef.current;
    const p = playerRef.current;
    const cam = cameraControlRef.current;

    // 1. Calculate directional input
    let moveForward = 0;
    let moveRight = 0;
    if (keys['w'] || keys['arrowup']) moveForward += 1;
    if (keys['s'] || keys['arrowdown']) moveForward -= 1;
    if (keys['d'] || keys['arrowright']) moveRight += 1;
    if (keys['a'] || keys['arrowleft']) moveRight -= 1;

    const wantSprint = Boolean(keys['shift']) && p.stamina > 5;
    const hasInput = moveForward !== 0 || moveRight !== 0;

    // Stamina depletion & regeneration
    if (hasInput && wantSprint) {
      p.stamina = Math.max(0, p.stamina - dt * 25);
    } else {
      p.stamina = Math.min(100, p.stamina + dt * 18);
    }
    p.sprinting = wantSprint && hasInput && p.stamina > 0;
    p.moving = hasInput;

    const currentSpeed = p.sprinting ? 15.5 : 8.5;

    // Movement vector relative to camera yaw
    if (hasInput) {
      const inputAngle = Math.atan2(moveRight, moveForward);
      const moveAngle = cam.orbitAngleX + inputAngle;

      const targetVx = Math.sin(moveAngle) * currentSpeed;
      const targetVz = -Math.cos(moveAngle) * currentSpeed;

      p.vel.x += (targetVx - p.vel.x) * 0.18;
      p.vel.z += (targetVz - p.vel.z) * 0.18;

      p.targetRotY = moveAngle;
    } else {
      p.vel.x *= 0.82;
      p.vel.z *= 0.82;
    }

    // Smooth rotational lerp (Shortest angular distance)
    let rotDiff = (p.targetRotY - p.rotY) % (Math.PI * 2);
    if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    p.rotY += rotDiff * 0.22;

    // Jump Gravity & Ground Floor
    if (p.airborne) {
      p.vel.y -= 26 * dt; // Gravity
      p.pos.y += p.vel.y * dt;
      if (p.pos.y <= 0) {
        p.pos.y = 0;
        p.vel.y = 0;
        p.airborne = false;
        worldAudio.playStep(p.sprinting);
      }
    }

    // Apply horizontal velocity with plaza boundary clamps
    p.pos.x = Math.max(-55, Math.min(55, p.pos.x + p.vel.x * dt));
    p.pos.z = Math.max(-60, Math.min(65, p.pos.z + p.vel.z * dt));

    // Stride Phase & Footstep SFX
    const groundSpeed = Math.hypot(p.vel.x, p.vel.z);
    if (groundSpeed > 0.4 && !p.airborne) {
      const prevPhase = p.stridePhase;
      p.stridePhase += dt * (p.sprinting ? 14 : 9.5);
      // Trigger footstep on half cycle
      if (Math.sin(prevPhase) < 0 && Math.sin(p.stridePhase) >= 0) {
        worldAudio.playStep(p.sprinting);
      }
    } else if (!p.airborne) {
      p.stridePhase *= 0.85;
    }

    // Coat sway calculation
    p.coatSway.x = -p.vel.z * 0.03;
    p.coatSway.y = p.vel.x * 0.03;

    // Update 3D Character Transform
    if (wayfarerGroupRef.current) {
      wayfarerGroupRef.current.position.set(p.pos.x, p.pos.y, p.pos.z);
      wayfarerGroupRef.current.rotation.y = p.rotY;
    }

    // 2. Dynamic 3rd-Person Chase Camera Rig
    const camDist = cam.distance;
    const camHeight = Math.sin(cam.orbitAngleY) * camDist + 1.8;
    const camHorizDist = Math.cos(cam.orbitAngleY) * camDist;

    const targetCamX = p.pos.x + Math.sin(cam.orbitAngleX) * camHorizDist;
    const targetCamY = Math.max(0.8, p.pos.y + camHeight);
    const targetCamZ = p.pos.z + Math.cos(cam.orbitAngleX) * camHorizDist;

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;

    const lookTarget = new THREE.Vector3(p.pos.x, p.pos.y + 1.5, p.pos.z);
    camera.lookAt(lookTarget);

    // 3. Shard Collection Hit Check
    shards.forEach((s) => {
      if (!s.collected) {
        s.rotY = (s.rotY || 0) + dt * 2.5;
        const dist = Math.hypot(p.pos.x - s.x, p.pos.z - s.z);
        if (dist < 2.0 && Math.abs(p.pos.y - s.y) < 2.5) {
          s.collected = true;
          worldAudio.playCollect();
          setHudStats((prev) => ({
            ...prev,
            shardsFound: prev.shardsFound + 1,
          }));
        }
      }
    });

    // Update HUD stats (throttled)
    if (Math.random() > 0.85) {
      setHudStats((prev) => ({
        ...prev,
        stamina: Math.round(p.stamina),
        speed: Math.round(groundSpeed),
      }));
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={50} />

      {/* THE DARK OPEN WORLD */}
      <KnowledgeParkWorld shards={shards} playerPos={playerRef.current.pos} />

      {/* PLAYABLE HOODED WAYFARER */}
      <group ref={wayfarerGroupRef}>
        <WayfarerMesh
          moving={playerRef.current.moving}
          sprinting={playerRef.current.sprinting}
          airborne={playerRef.current.airborne}
          stridePhase={playerRef.current.stridePhase}
          coatSway={playerRef.current.coatSway}
        />
      </group>

      {/* AAA IN-GAME HUD OVERLAY */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full flex flex-col justify-between p-6 select-none font-sans text-white">
          {/* TOP BAR: Chapter Title & Knowledge Shards */}
          <div className="flex items-start justify-between">
            {/* Mission / Chapter Banner */}
            <div className="bg-slate-950/85 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4">
              <div className="w-2.5 h-10 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-bold">
                  Chapter IV: Echoes of the Spire
                </div>
                <div className="text-sm font-black tracking-wider text-slate-100 uppercase">
                  Knowledge Park District
                </div>
              </div>
            </div>

            {/* Score & Audio Controls */}
            <div className="flex items-center gap-3">
              {/* Shards Collected Badge */}
              <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-cyan-500/30 shadow-2xl flex items-center gap-2.5">
                <div className="w-3 h-3 rotate-45 bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
                <span className="text-xs font-semibold text-cyan-200">Data Shards:</span>
                <span className="text-sm font-black text-cyan-300">
                  {hudStats.shardsFound} / {hudStats.totalShards}
                </span>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  const m = worldAudio.toggleMute();
                  setHudStats((p) => ({ ...p, muted: m }));
                }}
                className="pointer-events-auto px-3 py-2.5 bg-slate-950/85 hover:bg-slate-900 border border-white/15 rounded-2xl text-xs font-bold text-slate-300 transition cursor-pointer active:scale-95 shadow-xl"
                title="Toggle Rain & City Audio"
              >
                {hudStats.muted ? '🔇 Sound: Off' : '🔊 Sound: On'}
              </button>

              {/* Return to Menu Button */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('spider:return-to-menu'));
                }}
                className="pointer-events-auto px-3.5 py-2.5 bg-gradient-to-r from-rose-950/80 to-slate-950/80 hover:from-rose-900 hover:to-slate-900 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-300 transition cursor-pointer active:scale-95 shadow-xl flex items-center gap-1.5"
                title="Return to AAA Title Menu (or press Esc)"
              >
                <span>✕ Title Menu</span>
              </button>
            </div>
          </div>

          {/* BOTTOM CONTROLS & STATUS BAR */}
          <div className="flex items-end justify-between">
            {/* Health & Stamina Bars */}
            <div className="bg-slate-950/85 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl space-y-2.5 min-w-[220px]">
              {/* Health */}
              <div>
                <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">
                  <span>Vitality</span>
                  <span>100%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full" />
                </div>
              </div>

              {/* Sprint Stamina */}
              <div>
                <div className="flex justify-between text-[10px] font-bold tracking-wider text-cyan-400 uppercase mb-1">
                  <span>Stamina</span>
                  <span>{hudStats.stamina}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-75"
                    style={{ width: `${hudStats.stamina}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Controls Legend */}
            <div className="bg-slate-950/85 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-amber-300 font-mono">WASD</kbd>
                Move
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-cyan-300 font-mono">Shift</kbd>
                Sprint
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-white font-mono">Space</kbd>
                Jump
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300 font-mono">Mouse Drag</kbd>
                Look 360°
              </span>
            </div>
          </div>
        </div>
      </Html>
    </>
  );
}
