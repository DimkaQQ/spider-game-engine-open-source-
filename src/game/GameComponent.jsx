import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Sparkles, 
  RotateCcw,
  Zap,
  Radio,
  Shield,
  Volume2,
  VolumeX,
  Compass,
  Award,
  Terminal,
  Cpu,
  MapPin,
  ChevronRight,
  X
} from 'lucide-react';

// ============================================================================
// 1. WEB AUDIO SYNTHESIS ENGINE (Footsteps, Rain, EMP, Collision Audio)
// ============================================================================
class WayfarerAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.rainGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;

      // Ambient rain sound
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      noise.start();
    } catch {}
  }

  playFootstep(isSprint = false) {
    if (!this.ctx || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime((isSprint ? 140 : 110) + Math.random() * 25, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(isSprint ? 0.08 : 0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  playJump() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.15);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch {}
  }

  playLanding() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  playCarBump() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(22, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  playEmpBlast() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } catch {}
  }

  playChime(success = true) {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = success ? [523.25, 659.25, 783.99, 1046.50] : [330, 290, 220];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {}
  }
}

const audio = new WayfarerAudio();

// ============================================================================
// 2. SVG ASSETS & ICONS
// ============================================================================
const DiamondIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    {/* Outer ornate diamond */}
    <path 
      d="M16 2 L30 16 L16 30 L2 16 Z" 
      stroke="#e5c158" 
      strokeWidth="1.5" 
      fill="rgba(229, 193, 88, 0.12)"
    />
    {/* Corner ticks */}
    <path d="M16 0 L16 5 M16 27 L16 32 M0 16 L5 16 M27 16 L32 16" stroke="#e5c158" strokeWidth="1.2" />
    {/* Glowing inner core */}
    <path 
      d="M16 8 L24 16 L16 24 L8 16 Z" 
      fill="#fff6d6" 
      className="animate-pulse"
    />
  </svg>
);

const StarSparkle = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#e5c158">
    <path d="M12 0 C12.5 8 16 11.5 24 12 C16 12.5 12.5 16 12 24 C11.5 16 8 12.5 0 12 C8 11.5 11.5 8 12 0 Z" />
  </svg>
);

const WayfarerCrest = ({ className = "w-11 h-11" }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none">
    {/* Shield Base */}
    <path 
      d="M10 8 H54 V32 C54 46 32 58 32 58 C32 58 10 46 10 32 V8 Z" 
      fill="rgba(25, 22, 18, 0.85)" 
      stroke="#d4af37" 
      strokeWidth="2"
    />
    <path 
      d="M14 12 H50 V31 C50 42 32 52 32 52 C32 52 14 42 14 31 V12 Z" 
      stroke="#d4af37" 
      strokeWidth="0.8" 
      strokeOpacity="0.6"
    />
    {/* Geometric Wings / Eagle Motif */}
    <path 
      d="M32 16 L44 22 L40 34 L32 28 L24 34 L20 22 Z" 
      fill="#e5c158" 
    />
    <path 
      d="M16 18 L26 26 M48 18 L38 26 M18 26 L26 31 M46 26 L38 31" 
      stroke="#fff3c4" 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
    {/* Center Sword / Spire */}
    <path d="M32 10 V48" stroke="#ffffff" strokeWidth="2" />
    <circle cx="32" cy="24" r="3" fill="#ffffff" />
  </svg>
);

const HoodedAvatarSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950">
    {/* Subtle city bokeh in avatar background */}
    <circle cx="20" cy="30" r="8" fill="#fbbf24" opacity="0.15" />
    <circle cx="80" cy="25" r="12" fill="#38bdf8" opacity="0.12" />
    {/* Shoulders / Cloak */}
    <path d="M8 100 C12 72 28 65 50 65 C72 65 88 72 92 100 Z" fill="#111318" stroke="#2d3340" strokeWidth="1" />
    {/* Outer Hood */}
    <path d="M26 68 C22 40 32 14 50 12 C68 14 78 40 74 68 Z" fill="#181b22" stroke="#374151" strokeWidth="1.2" />
    {/* Hood Inner Shadow Void */}
    <path d="M34 64 C32 43 38 24 50 22 C62 24 68 43 66 64 Z" fill="#050608" />
    {/* Subtle Rim Highlight on Hood */}
    <path d="M32 25 C40 15 55 15 65 25" stroke="#9ca3af" strokeWidth="1" fill="none" opacity="0.4" />
    {/* Mysterious faint collar detail */}
    <path d="M35 66 L50 78 L65 66" stroke="#cba358" strokeWidth="1" fill="none" opacity="0.5" />
  </svg>
);



// ============================================================================
// 3. STORY ACTS & OPEN-WORLD CAMPAIGN (30+ MIN PLAYTIME)
// ============================================================================
const STORY_ACTS = [
  {
    act: 1,
    district: "Knowledge Park Boulevard",
    targetZ: 120,
    title: "Investigate the Signal in Knowledge Park",
    details: "Sprint down Knowledge Park boulevard to the Skybridge Access Terminal at Z = 120m.",
    sender: "INCOMING MESSAGE",
    transmission: "Welcome back, Wayfarer. A rogue encrypted signal has appeared in Knowledge Park. Investigate the terminal.",
    xpReward: 350,
    terminalId: "term_1"
  },
  {
    act: 2,
    district: "Nexus Highway Interchange",
    targetZ: 650,
    title: "Deactivate Nexus Highway Jammer",
    details: "Evade moving highway traffic and neutralise the signal jammer at Z = 650m.",
    sender: "CIPHER // ENCRYPTED",
    transmission: "Aegis security has activated highway patrol drones. Press [E] for EMP Shockwave to disable them.",
    xpReward: 500,
    terminalId: "term_2"
  },
  {
    act: 3,
    district: "Aegis Corporate Plaza",
    targetZ: 1600,
    title: "Infiltrate Aegis Data Substation",
    details: "Reach the grand corporate plaza and override the security substation at Z = 1600m.",
    sender: "WAYFARER SYNDICATE",
    transmission: "You have breached Aegis territory. Use [Q] Cyber Scanner to reveal hidden Data Shards.",
    xpReward: 750,
    terminalId: "term_3"
  },
  {
    act: 4,
    district: "Old Cyber Bazaar",
    targetZ: 2800,
    title: "Locate the Underground Bazaar Merchant",
    details: "Reach the neon alley bazaar at Z = 2800m. Spend Energy Cores on suit and stamina upgrades.",
    sender: "BAZAAR FIXER",
    transmission: "Over here, Wayfarer. My shop is behind the neon signs. Upgrade your gear before the final spire.",
    xpReward: 1000,
    terminalId: "term_4"
  },
  {
    act: 5,
    district: "Apex Spire - Knowledge Core",
    targetZ: 4500,
    title: "Override the Knowledge Grid Core",
    details: "Reach the Apex Spire at Z = 4500m, evade the heavy Overseer Drone, and trigger master override.",
    sender: "SYSTEM OVERRIDE READY",
    transmission: "The final core is within reach. Connect all shards to free the Knowledge Park network!",
    xpReward: 2000,
    terminalId: "term_5"
  }
];

// World Data Shards
const WORLD_DATA_SHARDS = [
  { id: 'shard_1', z: 340, x: -65, name: 'Nexus Route Key', collected: false },
  { id: 'shard_2', z: 880, x: 75, name: 'Aegis Security Firmware', collected: false },
  { id: 'shard_3', z: 1850, x: -80, name: 'Corporate Grid Map', collected: false },
  { id: 'shard_4', z: 3100, x: 70, name: 'Bazaar Black-Market Code', collected: false },
  { id: 'shard_5', z: 4350, x: -60, name: 'Apex Master Encryption Key', collected: false }
];

// World Terminals
const WORLD_TERMINALS = [
  { id: 'term_1', z: 120, x: -65, name: 'Skybridge Network Hub', hacked: false },
  { id: 'term_2', z: 650, x: 70, name: 'Nexus Jammer Pedestal', hacked: false },
  { id: 'term_3', z: 1600, x: -70, name: 'Aegis Substation Console', hacked: false },
  { id: 'term_4', z: 2800, x: 75, name: 'Bazaar Vendor Terminal', hacked: false },
  { id: 'term_5', z: 4500, x: 0, name: 'Apex Core Master Terminal', hacked: false }
];

export default function App() {
  // Player State
  const [playerPos, setPlayerPos] = useState({
    x: 0,
    z: 15, // Forward world distance along boulevard
    y: 0,  // Lateral offset on road
    angle: 0,
    walkCycle: 0,
    jumpY: 0,
    vy: 0,
    isGrounded: true
  });

  const [hp, setHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [maxStamina, setMaxStamina] = useState(100);
  const [level, setLevel] = useState(12);
  const [xp, setXp] = useState(350);
  const [energyCores, setEnergyCores] = useState(3);
  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [dataShards, setDataShards] = useState(WORLD_DATA_SHARDS);
  const [terminals, setTerminals] = useState(WORLD_TERMINALS);

  // Abilities
  const [empCooldown, setEmpCooldown] = useState(0);
  const [scannerPulse, setScannerPulse] = useState(false);
  const [empShockwave, setEmpShockwave] = useState(null);
  const [screenToast, setScreenToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'hack' | 'vendor' | 'victory'
  const [hudVisible, setHudVisible] = useState(true);
  const [rainIntensity, setRainIntensity] = useState(1);

  const canvasRef = useRef(null);
  const activeKeys = useRef({
    w: false, a: false, s: false, d: false,
    shift: false, space: false, e: false, q: false, f: false
  });
  const stepTimerRef = useRef(0);

  const currentAct = STORY_ACTS[currentActIdx] || STORY_ACTS[STORY_ACTS.length - 1];

  // Sound init gesture
  useEffect(() => {
    const handleGesture = () => {
      audio.init();
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('mousedown', handleGesture);
    };
    window.addEventListener('keydown', handleGesture);
    window.addEventListener('mousedown', handleGesture);
    return () => {
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('mousedown', handleGesture);
    };
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      audio.init();
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') activeKeys.current.w = true;
      if (k === 's' || e.key === 'ArrowDown') activeKeys.current.s = true;
      if (k === 'a' || e.key === 'ArrowLeft') activeKeys.current.a = true;
      if (k === 'd' || e.key === 'ArrowRight') activeKeys.current.d = true;
      if (e.key === 'Shift') activeKeys.current.shift = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerJump();
      }
      if (k === 'e') triggerEmp();
      if (k === 'q') triggerScanner();
      if (k === 'f') triggerInteract();
      if (e.key === 'Escape') setActiveModal(null);
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') activeKeys.current.w = false;
      if (k === 's' || e.key === 'ArrowDown') activeKeys.current.s = false;
      if (k === 'a' || e.key === 'ArrowLeft') activeKeys.current.a = false;
      if (k === 'd' || e.key === 'ArrowRight') activeKeys.current.d = false;
      if (e.key === 'Shift') activeKeys.current.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerPos.isGrounded, empCooldown, activeModal]);

  // Jump trigger
  const triggerJump = () => {
    if (activeModal) return;
    setPlayerPos((prev) => {
      if (!prev.isGrounded) return prev;
      audio.playJump();
      return { ...prev, vy: 7.2, isGrounded: false };
    });
  };

  // EMP trigger
  const triggerEmp = () => {
    if (empCooldown > 0 || activeModal) return;
    setEmpCooldown(9);
    audio.playEmpBlast();
    setEmpShockwave({ radius: 10, maxRadius: 280, alpha: 1 });
    setScreenToast("⚡ EMP SHOCKWAVE DISCHARGED — SURVEILLANCE DRONES DISABLED!");
    setTimeout(() => setScreenToast(null), 3000);
  };

  // Scanner trigger
  const triggerScanner = () => {
    if (scannerPulse || activeModal) return;
    audio.playChime(true);
    setScannerPulse(true);
    setTimeout(() => setScannerPulse(false), 1200);
  };

  // Interact trigger
  const triggerInteract = () => {
    if (activeModal) return;

    // Check terminal within 35 meters or near current objective target
    const nearTerm = terminals.find((t) => Math.abs(t.z - playerPos.z) < 35);
    if (nearTerm || Math.abs(currentAct.targetZ - playerPos.z) < 35) {
      const termToHack = nearTerm || terminals.find((t) => t.id === currentAct.terminalId);
      if (termToHack && termToHack.id === 'term_4') {
        setActiveModal('vendor');
        audio.playChime(true);
        return;
      }
      setActiveModal('hack');
      audio.playChime(true);
      return;
    }

    // Check collectible shard within 25 meters
    const nearShard = dataShards.find((s) => !s.collected && Math.abs(s.z - playerPos.z) < 25);
    if (nearShard) {
      setDataShards((prev) => prev.map((s) => s.id === nearShard.id ? { ...s, collected: true } : s));
      setEnergyCores((c) => c + 1);
      setXp((x) => x + 250);
      audio.playChime(true);
      setScreenToast(`💾 RECOVERED DATA SHARD: ${nearShard.name} (+1 CORE, +250 XP)`);
      setTimeout(() => setScreenToast(null), 3500);
      return;
    }

    // Check parked sports coupe
    if (Math.abs(45 - playerPos.z) < 20 && playerPos.x > 35) {
      audio.playCarBump();
      setScreenToast("🚗 BLACK SPORTS COUPE: Biometric security active. Registered to Knowledge Park Transit.");
      setTimeout(() => setScreenToast(null), 2500);
    }
  };

  // Hack complete
  const handleHackSuccess = () => {
    const curTerm = terminals.find((t) => t.id === currentAct.terminalId);
    if (curTerm) {
      setTerminals((prev) => prev.map((t) => t.id === curTerm.id ? { ...t, hacked: true } : t));
    }
    setActiveModal(null);
    audio.playChime(true);
    setXp((x) => x + currentAct.xpReward);

    if (currentActIdx < STORY_ACTS.length - 1) {
      setCurrentActIdx((i) => i + 1);
      setScreenToast(`🎉 ACT ${currentAct.act} COMPLETE! UNLOCKED: ${STORY_ACTS[currentActIdx + 1].district}`);
    } else {
      setActiveModal('victory');
    }
  };

  // Level Up Check
  useEffect(() => {
    if (xp >= 1000) {
      setLevel((l) => l + 1);
      setXp((x) => x - 1000);
      setMaxStamina((s) => s + 20);
      setHp(100);
      audio.playChime(true);
      setScreenToast("⭐ WAYFARER LEVEL UP! MAX STAMINA & HP RESTORED");
      setTimeout(() => setScreenToast(null), 4000);
    }
  }, [xp]);

  // EMP Cooldown
  useEffect(() => {
    if (empCooldown <= 0) return;
    const t = setInterval(() => setEmpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [empCooldown]);

  // ============================================================================
  // 4. REALISTIC KINEMATICS, COLLISION & OPEN-WORLD FORWARD MOVEMENT LOOP
  // ============================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeModal) return;

      const keys = activeKeys.current;
      const isMoving = keys.w || keys.a || keys.s || keys.d;
      const isSprinting = isMoving && keys.shift && stamina > 2;

      // Stamina update
      setStamina((prev) => {
        if (isSprinting) return Math.max(0, prev - 0.7);
        if (isMoving) return Math.min(maxStamina, prev + 0.12);
        return Math.min(maxStamina, prev + 0.4);
      });

      // EMP Shockwave expansion
      setEmpShockwave((prev) => {
        if (!prev) return null;
        const nextR = prev.radius + 6;
        if (nextR > prev.maxRadius) return null;
        return { ...prev, radius: nextR, alpha: Math.max(0, 1 - nextR / prev.maxRadius) };
      });

      // Kinematics & Collision
      setPlayerPos((prev) => {
        const speed = isSprinting ? 2.6 : 1.35;
        let dx = 0;
        let dz = 0; // Forward travel in meters!

        if (keys.w) dz += speed * 0.8;
        if (keys.s) dz -= speed * 0.55;
        if (keys.a) dx -= speed * 0.95;
        if (keys.d) dx += speed * 0.95;

        // Vertical Jump / Gravity Physics
        let newJumpY = prev.jumpY + prev.vy;
        let newVy = prev.vy - 0.65; // Gravity
        let grounded = false;

        if (newJumpY <= 0) {
          newJumpY = 0;
          newVy = 0;
          grounded = true;
          if (!prev.isGrounded) audio.playLanding();
        }

        // Candidate next positions
        let nextX = prev.x + dx;
        let nextZ = Math.max(0, prev.z + dz); // INFINITE FORWARD TRAVEL!

        // --- SOLID COLLISION RESOLUTION ---
        // 1. Sidewalk Curbs / Road Boundaries
        if (nextX < -155) nextX = -155;
        if (nextX > 175) nextX = 175;

        // 2. Parked Sports Coupe Solid Collision at Z = 45m, X: [65, 145]
        if (Math.abs(45 - nextZ) < 5.5 && nextX > 65 && nextX < 145) {
          // Rebound deflection
          if (keys.w) nextZ = 39.5;
          if (keys.s) nextZ = 50.5;
          if (keys.d) nextX = 65;
          audio.playCarBump();
        }

        // Footstep Audio Synchronization
        if (grounded && isMoving) {
          stepTimerRef.current += (isSprinting ? 1.6 : 1.0);
          if (stepTimerRef.current > 18) {
            stepTimerRef.current = 0;
            audio.playFootstep(isSprinting);
          }
        }

        let newAngle = prev.angle;
        if (dx !== 0 || dz !== 0) {
          newAngle = Math.atan2(dx, dz) * (180 / Math.PI);
        }

        return {
          x: nextX,
          z: nextZ,
          y: 0,
          jumpY: newJumpY,
          vy: newVy,
          angle: newAngle,
          walkCycle: prev.walkCycle + (isSprinting ? 0.38 : 0.22),
          isGrounded: grounded
        };
      });
    }, 25);

    return () => clearInterval(interval);
  }, [stamina, maxStamina, activeModal]);

  // ============================================================================
  // 5. PROCEDURAL 3D ROAD, SKYSCRAPER SKYLINE & HOODED WAYFARER CANVAS
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Building definitions for procedural skyline
    const buildingDefs = [
      { x: -50, y: 40, w: 180, h: 540, cols: 5, rows: 22, winColor1: '#fbbf24', winColor2: '#38bdf8', color: '#070b14' },
      { x: 140, y: 70, w: 220, h: 510, cols: 6, rows: 20, winColor1: '#fde047', winColor2: '#60a5fa', color: '#090e18' },
      { x: 370, y: 110, w: 190, h: 470, cols: 5, rows: 18, winColor1: '#f59e0b', winColor2: '#38bdf8', color: '#060a12', roundedCrown: true },
      { x: 570, y: 150, w: 150, h: 430, cols: 4, rows: 16, winColor1: '#fbbf24', winColor2: '#93c5fd', color: '#080d16' },
      { x: 730, y: 190, w: 260, h: 390, cols: 7, rows: 14, winColor1: '#fde047', winColor2: '#38bdf8', color: '#0a101d' },
      { x: 1000, y: 160, w: 200, h: 420, cols: 5, rows: 16, winColor1: '#f59e0b', winColor2: '#60a5fa', color: '#070c16' },
      { x: 1210, y: 120, w: 280, h: 460, cols: 8, rows: 18, winColor1: '#fbbf24', winColor2: '#38bdf8', color: '#090f1b' },
      { x: 1500, y: 80, w: 210, h: 500, cols: 6, rows: 20, winColor1: '#fde047', winColor2: '#93c5fd', color: '#060a12' },
      { x: 1720, y: 40, w: 250, h: 540, cols: 7, rows: 22, winColor1: '#f59e0b', winColor2: '#38bdf8', color: '#080d18' }
    ];

    const windowMatrix = buildingDefs.map((b) => {
      const grid = [];
      for (let r = 0; r < b.rows; r++) {
        const row = [];
        for (let c = 0; c < b.cols; c++) {
          row.push({
            lit: Math.random() > 0.42,
            warm: Math.random() > 0.35,
            brightness: 0.4 + Math.random() * 0.6
          });
        }
        grid.push(row);
      }
      return grid;
    });

    let time = 0;

    const render = () => {
      time += 0.016;
      const width = 1920;
      const height = 1080;
      const horizonY = 582;

      const isMoving = activeKeys.current.w || activeKeys.current.a || activeKeys.current.s || activeKeys.current.d;
      const isSprinting = isMoving && activeKeys.current.shift && stamina > 2;
      const isJumping = !playerPos.isGrounded;

      // Parallax camera offsets driven by lateral position and forward travel
      const camX = -playerPos.x * 0.85;
      const camY = (isJumping ? -22 : 0) + (isMoving ? Math.sin(playerPos.walkCycle * 2) * 3.5 : Math.sin(time * 2) * 1.2);

      const vpX = 955 + camX * 0.55;
      const vpY = horizonY;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // --- 1. MIDNIGHT SKY & STARS ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#040813');
      skyGrad.addColorStop(0.5, '#081224');
      skyGrad.addColorStop(1, '#0e1d35');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 20);

      // Twinkling stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const sx = (i * 47 + 80) % width;
        const sy = (i * 29 + 30) % (horizonY - 140);
        const sa = 0.2 + ((Math.sin(time * 3 + i * 2) + 1) * 0.35);
        ctx.globalAlpha = sa;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // --- 2. CITY SKYLINE & SKYSCRAPERS WITH LIT WINDOWS ---
      buildingDefs.forEach((b, bIdx) => {
        const bx = b.x + camX * 0.3;
        const by = b.y + camY * 0.3;

        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        if (b.roundedCrown) {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(bx + b.w / 2, by + 12, b.w / 2, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          for (let ring = 0; ring < 4; ring++) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
            ctx.fillRect(bx + 6, by + 16 + ring * 14, b.w - 12, 4);
          }
        }

        const cellW = (b.w - 18) / b.cols;
        const cellH = (b.h - 55) / b.rows;
        const matrix = windowMatrix[bIdx];

        if (matrix) {
          for (let r = 0; r < b.rows; r++) {
            for (let c = 0; c < b.cols; c++) {
              const wInfo = matrix[r] && matrix[r][c];
              if (wInfo && wInfo.lit) {
                const wx = bx + 9 + c * cellW + cellW * 0.12;
                const wy = by + 40 + r * cellH + cellH * 0.18;
                const ww = cellW * 0.76;
                const wh = cellH * 0.64;
                ctx.fillStyle = wInfo.warm ? b.winColor1 : b.winColor2;
                ctx.globalAlpha = wInfo.brightness * 0.8;
                ctx.fillRect(wx, wy, ww, wh);
              }
            }
          }
          ctx.globalAlpha = 1;
        }
      });

      // --- 3. PEDESTRIAN SKYBRIDGE & DISTRICT SIGNS IN PERSPECTIVE ---
      // Distance from player to skybridge
      const skybridgeRelZ = 120 - playerPos.z;
      const bridgeScale = Math.max(0.45, Math.min(2.2, 120 / Math.max(10, skybridgeRelZ + 120)));
      const bridgeY = horizonY - 142 * bridgeScale + camY * 0.42;
      const bridgeH = 36 * bridgeScale;

      ctx.fillStyle = '#08101e';
      ctx.fillRect(440 + camX * 0.4, bridgeY, 830 * bridgeScale, bridgeH);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(440 + camX * 0.4, bridgeY, 830 * bridgeScale, bridgeH);

      // Skybridge windows
      ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
      for (let bw = 0; bw < 19; bw++) {
        ctx.fillRect(455 + camX * 0.4 + bw * 42 * bridgeScale, bridgeY + 8 * bridgeScale, 26 * bridgeScale, 20 * bridgeScale);
      }

      // Bright Glowing Facade Sign (dynamically shows active district!)
      const signX = 890 + camX * 0.42;
      const signY = bridgeY - 30 * bridgeScale;
      ctx.fillStyle = '#020617';
      ctx.fillRect(signX - 14, signY - 8, 380 * bridgeScale, 36 * bridgeScale);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(signX - 14, signY - 8, 380 * bridgeScale, 36 * bridgeScale);

      ctx.font = `bold ${Math.round(22 * bridgeScale)}px Inter, sans-serif`;
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.fillText(currentAct.district.toUpperCase(), signX + 16, signY + 18 * bridgeScale);
      ctx.shadowBlur = 0;

      // --- 4. TREE CANOPIES WITH GOLDEN FAIRY LIGHTS ---
      const drawBoulevardTree = (tx, ty, scale) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#09131a';
        ctx.beginPath();
        ctx.arc(0, -90, 68, 0, Math.PI * 2);
        ctx.arc(-36, -72, 52, 0, Math.PI * 2);
        ctx.arc(36, -72, 52, 0, Math.PI * 2);
        ctx.fill();
        for (let f = 0; f < 36; f++) {
          const fx = Math.sin(f * 2.3) * 62;
          const fy = -102 + Math.cos(f * 1.7) * 46;
          const fa = 0.45 + Math.sin(time * 3.5 + f) * 0.55;
          ctx.fillStyle = '#fde047';
          ctx.globalAlpha = fa;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
      };

      drawBoulevardTree(270 + camX * 0.6, horizonY + 25, 0.68);
      drawBoulevardTree(385 + camX * 0.7, horizonY + 48, 0.88);
      drawBoulevardTree(1450 + camX * 0.7, horizonY + 48, 0.88);
      drawBoulevardTree(1620 + camX * 0.6, horizonY + 25, 0.68);

      // --- 5. THE WET ROAD: RAIN-SLICKED BOULEVARD, BOLLARDS & TRAFFIC ---
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#0e1726');
      roadGrad.addColorStop(0.35, '#0a0f19');
      roadGrad.addColorStop(0.7, '#070b13');
      roadGrad.addColorStop(1, '#04060a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Longitudinal perspective lane seams
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.24)';
      ctx.lineWidth = 1.3;
      for (let lane = -6; lane <= 6; lane++) {
        const bottomX = width / 2 + lane * 225 + camX;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Transverse pavement seams STREAMING FORWARD as player walks forward!
      const roadForwardScroll = (playerPos.z * 22) % 180;
      for (let hStep = 1; hStep <= 22; hStep++) {
        const norm = (hStep * 32 - roadForwardScroll) / 704;
        if (norm <= 0) continue;
        const py = horizonY + Math.pow(norm, 2.2) * (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }

      // Specular Golden Light Reflections stretching down the wet asphalt
      const lightPillars = [
        { x: 385 + camX * 0.65, color: 'rgba(251, 191, 36, 0.38)', w: 90 },
        { x: 575 + camX * 0.6, color: 'rgba(245, 158, 11, 0.45)', w: 125 },
        { x: 790 + camX * 0.55, color: 'rgba(253, 224, 71, 0.35)', w: 90 },
        { x: 1045 + camX * 0.55, color: 'rgba(56, 189, 248, 0.35)', w: 110 },
        { x: 1285 + camX * 0.65, color: 'rgba(251, 191, 36, 0.42)', w: 145 },
        { x: 1515 + camX * 0.7, color: 'rgba(245, 158, 11, 0.35)', w: 105 }
      ];

      lightPillars.forEach((p) => {
        const refGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        refGrad.addColorStop(0, p.color);
        refGrad.addColorStop(0.4, p.color.replace(/[\d.]+\)$/, '0.22)'));
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(p.x - p.w / 2, horizonY, p.w, height - horizonY);
      });

      // Roadside Amber Lantern Bollards (scrolling smoothly as player travels forward)
      const bollardList = [
        { x: 335, y: horizonY + 22, s: 0.38 },
        { x: 415, y: horizonY + 65, s: 0.52 },
        { x: 505, y: horizonY + 125, s: 0.72 },
        { x: 615, y: horizonY + 215, s: 0.95 },
        { x: 1325, y: horizonY + 215, s: 0.95 },
        { x: 1435, y: horizonY + 125, s: 0.72 },
        { x: 1525, y: horizonY + 65, s: 0.52 },
        { x: 1605, y: horizonY + 22, s: 0.38 }
      ];

      bollardList.forEach((b) => {
        const bx = b.x + camX * (0.5 + b.s * 0.4);
        const by = b.y;
        const bw = 24 * b.s;
        const bh = 54 * b.s;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx - bw / 2, by, bw, bh);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.strokeRect(bx - bw / 2, by, bw, bh);

        // Glowing cube
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14 * b.s;
        ctx.fillRect(bx - bw / 2 + 2, by + 4, bw - 4, 18 * b.s);

        const pool = ctx.createRadialGradient(bx, by + bh + 4, 2, bx, by + bh + 4, 38 * b.s);
        pool.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
        pool.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.ellipse(bx, by + bh + 4, 38 * b.s, 12 * b.s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Parked Black Sports Coupe (Solid Collision Obstacle at Z = 45m)
      const carRelZ = 45 - playerPos.z;
      const carScale = Math.max(0.4, Math.min(1.4, 45 / Math.max(10, carRelZ + 45)));
      const carX = 1420 + camX * 0.72;
      const carY = horizonY + 175;

      // Car shadow & ground reflection
      const carGlow = ctx.createRadialGradient(carX, carY + 36 * carScale, 5, carX, carY + 36 * carScale, 90 * carScale);
      carGlow.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
      carGlow.addColorStop(0.65, 'rgba(239, 68, 68, 0.12)');
      carGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = carGlow;
      ctx.beginPath();
      ctx.ellipse(carX, carY + 36 * carScale, 120 * carScale, 28 * carScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car Body
      ctx.fillStyle = '#070b12';
      ctx.beginPath();
      ctx.roundRect(carX - 110 * carScale, carY, 220 * carScale, 48 * carScale, 8 * carScale);
      ctx.fill();

      // Glowing Red LED Taillight Strip
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
      ctx.fillRect(carX - 90 * carScale, carY + 18 * carScale, 180 * carScale, 6 * carScale);
      ctx.shadowBlur = 0;

      // Interactive Terminals on Road
      terminals.forEach((term) => {
        const tRelZ = term.z - playerPos.z;
        if (tRelZ > -10 && tRelZ < 80) {
          const tScale = Math.max(0.5, Math.min(1.5, 30 / Math.max(8, tRelZ + 30)));
          const tx = 955 + term.x * 2.2 + camX;
          const ty = horizonY + 180 * tScale;
          // Pedestal
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(tx - 12 * tScale, ty, 24 * tScale, 48 * tScale);
          ctx.strokeStyle = term.hacked ? '#22c55e' : '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tx - 12 * tScale, ty, 24 * tScale, 48 * tScale);
          // Hologram Screen
          ctx.fillStyle = term.hacked ? 'rgba(34, 197, 94, 0.85)' : 'rgba(56, 189, 248, 0.85)';
          ctx.shadowColor = term.hacked ? '#22c55e' : '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillRect(tx - 18 * tScale, ty - 22 * tScale, 36 * tScale, 16 * tScale);
          ctx.shadowBlur = 0;
        }
      });

      // EMP Shockwave Ripple on Wet Road
      if (empShockwave) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${empShockwave.alpha})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(785 + playerPos.x * 2.1, 668 + 322, empShockwave.radius, empShockwave.radius * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // =========================================================================
      // 5. THE PROTAGONIST (Hyper-Detailed Realistic Hooded Wayfarer from ss.txt)
      // =========================================================================
// 5. THE PROTAGONIST (Hyper-Detailed Realistic Hooded Wayfarer)
      // =========================================================================
      const charScale = Math.max(0.68, Math.min(1.18, 1 - playerPos.y * 0.0022));
      const charX = 785 + playerPos.x * 2.1;
      const charY = 668 - playerPos.y * 1.15 + (isJumping ? -55 : 0);

      // Walk & Sprint Kinematics
      const stride = isMoving ? Math.sin(playerPos.walkCycle) * (isSprinting ? 28 : 18) : 0;
      const oppStride = -stride;
      const leftLegLift = isMoving ? Math.max(0, Math.cos(playerPos.walkCycle) * 18) : 0;
      const rightLegLift = isMoving ? Math.max(0, -Math.cos(playerPos.walkCycle) * 18) : 0;
      const breathBob = Math.sin(time * 2.6) * 2.2;
      const bodyLean = (activeKeys.d ? 0.035 : activeKeys.a ? -0.035 : 0) + (isSprinting ? 0.025 : 0);
      const coatBillow = Math.sin(time * 3.4) * 7 + (isSprinting ? 26 : isMoving ? 14 : 6);

      ctx.save();
      ctx.translate(charX, charY + breathBob);
      ctx.scale(charScale, charScale);
      ctx.rotate(bodyLean);

      // --- 5A. REALISTIC WET ASPHALT CONTACT SHADOWS & REFLECTION ---
      const shadowGrad = ctx.createRadialGradient(-8, 322, 10, -8, 322, 125);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
      shadowGrad.addColorStop(0.55, 'rgba(3, 5, 10, 0.65)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(-8, 322, 125, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inverted dark silhouette reflection on wet stone/asphalt
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#05070c';
      ctx.beginPath();
      ctx.ellipse(-55 - stride * 0.45, 355, 22, 38, 0.1, 0, Math.PI * 2);
      ctx.ellipse(28 + stride * 0.45, 355, 22, 38, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Dynamic Rain Puddle Ripples around Boots
      const leftBootX = -56 - stride * 0.48;
      const leftBootY = 316 - leftLegLift;
      const rightBootX = 28 + stride * 0.48;
      const rightBootY = 316 - rightLegLift;

      if (isMoving || isJumping) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
        ctx.lineWidth = 1.6;
        const rPhase = (time * 48) % 42;
        ctx.beginPath();
        ctx.ellipse(leftBootX, 320, 18 + rPhase, (18 + rPhase) * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
        ctx.beginPath();
        ctx.ellipse(rightBootX, 320, 14 + ((rPhase + 21) % 42), (14 + ((rPhase + 21) % 42)) * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // --- 5B. INNER COAT LINING (Deep shadowed interior behind legs) ---
      const innerCoatGrad = ctx.createLinearGradient(-60, 40, 90, 235);
      innerCoatGrad.addColorStop(0, '#040508');
      innerCoatGrad.addColorStop(1, '#0d111a');
      ctx.fillStyle = innerCoatGrad;
      ctx.beginPath();
      ctx.moveTo(-58, 30);
      ctx.lineTo(54, 30);
      ctx.lineTo(148 + coatBillow, 212);
      ctx.lineTo(12, 236);
      ctx.lineTo(-82 - stride * 0.2, 208);
      ctx.closePath();
      ctx.fill();

      // --- 5C. ANATOMICAL TACTICAL CARGO PANTS & COMBAT BOOTS ---
      const drawRealisticLegAndBoot = (hipX, footX, footY, isRightLeg) => {
        ctx.save();
        const kneeX = (hipX + footX) * 0.5 + (isRightLeg ? 5 : -5);
        const kneeY = 195 - (316 - footY) * 0.45;

        // Tactical BDU Pants with knee articulation & folds
        const pantGrad = ctx.createLinearGradient(hipX - 28, 95, footX + 28, footY);
        pantGrad.addColorStop(0, '#0a0d14');
        pantGrad.addColorStop(0.5, '#161c28');
        pantGrad.addColorStop(1, '#090c12');
        ctx.fillStyle = pantGrad;

        ctx.beginPath();
        ctx.moveTo(hipX - 25, 85);
        ctx.quadraticCurveTo(kneeX - 27, kneeY, footX - 20, footY - 58);
        ctx.lineTo(footX + 20, footY - 58);
        ctx.quadraticCurveTo(kneeX + 25, kneeY, hipX + 25, 85);
        ctx.closePath();
        ctx.fill();

        // Fabric Wrinkles behind the knee & thigh
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(kneeX - 18, kneeY - 12);
        ctx.quadraticCurveTo(kneeX, kneeY - 4, kneeX + 16, kneeY - 14);
        ctx.moveTo(kneeX - 15, kneeY + 6);
        ctx.quadraticCurveTo(kneeX + 2, kneeY + 14, kneeX + 18, kneeY + 4);
        ctx.moveTo(footX - 18, footY - 72);
        ctx.quadraticCurveTo(footX, footY - 64, footX + 18, footY - 74);
        ctx.stroke();

        // Warm Golden Rim Highlight along outer leg edge
        ctx.strokeStyle = isRightLeg ? 'rgba(251, 191, 36, 0.42)' : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (isRightLeg) {
          ctx.moveTo(hipX + 23, 95);
          ctx.quadraticCurveTo(kneeX + 24, kneeY, footX + 19, footY - 58);
        } else {
          ctx.moveTo(hipX - 23, 95);
          ctx.quadraticCurveTo(kneeX - 25, kneeY, footX - 19, footY - 58);
        }
        ctx.stroke();

        // Heavy Combat Boot (Shin guard, ankle straps, heel & lug sole)
        const bootGrad = ctx.createLinearGradient(footX - 24, footY - 62, footX + 24, footY + 6);
        bootGrad.addColorStop(0, '#12161f');
        bootGrad.addColorStop(0.55, '#080a0f');
        bootGrad.addColorStop(1, '#1e2433');
        ctx.fillStyle = bootGrad;

        ctx.beginPath();
        ctx.moveTo(footX - 21, footY - 62);
        ctx.lineTo(footX + 21, footY - 62);
        ctx.lineTo(footX + 24, footY - 12);
        ctx.lineTo(footX + 27, footY + 4);
        ctx.lineTo(footX - 26, footY + 4);
        ctx.lineTo(footX - 23, footY - 14);
        ctx.closePath();
        ctx.fill();

        // Boot Leather Straps & Metallic Buckles
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(footX - 21, footY - 46);
        ctx.lineTo(footX + 21, footY - 46);
        ctx.moveTo(footX - 22, footY - 26);
        ctx.lineTo(footX + 22, footY - 26);
        ctx.stroke();

        // Gold Specular Highlight on Boot Heel & Buckles
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(footX + (isRightLeg ? 12 : -18), footY - 49, 6, 6);
        ctx.fillRect(footX + (isRightLeg ? 13 : -19), footY - 29, 6, 6);

        // Thick Treads on Boot Sole
        ctx.fillStyle = '#040609';
        ctx.fillRect(footX - 27, footY - 2, 54, 8);
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.38)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(footX - 24, footY + 5);
        ctx.lineTo(footX + 24, footY + 5);
        ctx.stroke();

        ctx.restore();
      };

      drawRealisticLegAndBoot(-38, leftBootX, leftBootY, false);
      drawRealisticLegAndBoot(26, rightBootX, rightBootY, true);

      // --- 5D. MULTI-PANEL FLOWING WET LEATHER TRENCH COAT SKIRT ---
      // Sweeps dramatically to the right with deep vertical pleats and wet sheen
      const coatSkirtGrad = ctx.createLinearGradient(-95, -25, 175 + coatBillow, 235);
      coatSkirtGrad.addColorStop(0, '#0f131c');
      coatSkirtGrad.addColorStop(0.28, '#1d2434');
      coatSkirtGrad.addColorStop(0.55, '#090c12');
      coatSkirtGrad.addColorStop(0.82, '#232b3d');
      coatSkirtGrad.addColorStop(1, '#0d111a');

      ctx.fillStyle = coatSkirtGrad;
      ctx.beginPath();
      // Waistband top
      ctx.moveTo(-54, -22);
      ctx.lineTo(54, -22);
      // Right sweeping outer edge
      ctx.bezierCurveTo(
        92, 42,
        142 + coatBillow * 0.7, 128,
        176 + coatBillow, 204 - Math.abs(stride) * 0.35
      );
      // Jagged pleated bottom hem matching the reference coat
      ctx.lineTo(132 + coatBillow * 0.85, 224 - Math.abs(stride) * 0.3);
      ctx.lineTo(106 + coatBillow * 0.7, 212);
      ctx.lineTo(68 + coatBillow * 0.5, 236);
      // Center vent split between coat tails
      ctx.lineTo(8 + coatBillow * 0.15, 108);
      ctx.lineTo(-22 - stride * 0.18, 222);
      ctx.lineTo(-58 - stride * 0.25, 216);
      ctx.lineTo(-72 - stride * 0.28, 198);
      ctx.lineTo(-95 - stride * 0.3, 186);
      // Left outer coat edge
      ctx.bezierCurveTo(
        -82 - stride * 0.2, 112,
        -68, 42,
        -54, -22
      );
      ctx.closePath();
      ctx.fill();

      // Deep Realistic Leather Folds & Pleat Shadows on the Coat Tails
      const pleats = [
        { x1: -36, y1: -15, x2: -74 - stride * 0.25, y2: 192, light: false },
        { x1: -18, y1: -15, x2: -38 - stride * 0.2, y2: 214, light: true },
        { x1: 14, y1: -15, x2: 58 + coatBillow * 0.45, y2: 228, light: false },
        { x1: 28, y1: -15, x2: 98 + coatBillow * 0.65, y2: 212, light: true },
        { x1: 42, y1: -15, x2: 142 + coatBillow * 0.88, y2: 215, light: true }
      ];

      pleats.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.quadraticCurveTo((p.x1 + p.x2) * 0.52 + 8, (p.y1 + p.y2) * 0.5, p.x2, p.y2);
        ctx.strokeStyle = p.light ? 'rgba(253, 224, 71, 0.28)' : 'rgba(2, 4, 8, 0.85)';
        ctx.lineWidth = p.light ? 2.2 : 4.5;
        ctx.stroke();
      });

      // Crisp Golden Streetlight Rim Reflection on the Right Flowing Coat Edge
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(53, -18);
      ctx.bezierCurveTo(
        92, 42,
        142 + coatBillow * 0.7, 128,
        175 + coatBillow, 203 - Math.abs(stride) * 0.35
      );
      ctx.lineTo(132 + coatBillow * 0.85, 223 - Math.abs(stride) * 0.3);
      ctx.stroke();

      // Cool Cyan Neon Edge Reflection on Left Coat Hem
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.32)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-53, -18);
      ctx.bezierCurveTo(-68, 42, -82 - stride * 0.2, 112, -94 - stride * 0.3, 185);
      ctx.stroke();

      // --- 5E. UPPER TORSO, LAYERED PAULDRONS & ARMORED LEATHER JACKET ---
      const torsoGrad = ctx.createLinearGradient(-76, -182, 76, -18);
      torsoGrad.addColorStop(0, '#1e2536');
      torsoGrad.addColorStop(0.5, '#0e121b');
      torsoGrad.addColorStop(1, '#171d2b');
      ctx.fillStyle = torsoGrad;

      ctx.beginPath();
      ctx.moveTo(-64, -176); // Left shoulder
      ctx.lineTo(64, -176);  // Right shoulder
      ctx.lineTo(74, -142);  // Outer deltoid
      ctx.lineTo(54, -18);   // Right waist
      ctx.lineTo(-54, -18);  // Left waist
      ctx.lineTo(-74, -142); // Left outer deltoid
      ctx.closePath();
      ctx.fill();

      // Quilted / Armored Shoulder Pauldrons with Stitching
      ctx.fillStyle = '#171d29';
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.36)';
      ctx.lineWidth = 1.5;
      // Left Pauldron
      ctx.beginPath();
      ctx.moveTo(-42, -178);
      ctx.quadraticCurveTo(-78, -172, -84, -136);
      ctx.lineTo(-56, -126);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Right Pauldron
      ctx.beginPath();
      ctx.moveTo(42, -178);
      ctx.quadraticCurveTo(78, -172, 84, -136);
      ctx.lineTo(56, -126);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- 5F. ARTICULATED SLEEVES, ELBOW CREASES, VAMBRACES & GLOVED HANDS ---
      const drawRealisticArm = (isRightArm) => {
        const dir = isRightArm ? 1 : -1;
        const armSwing = isRightArm ? oppStride * 0.45 : stride * 0.45;
        const shoulderX = dir * 70;
        const shoulderY = -162;
        const elbowX = dir * 92 + armSwing * 0.5;
        const elbowY = -74;
        const wristX = dir * 86 + armSwing;
        const wristY = 24 - Math.abs(armSwing) * 0.22;

        ctx.save();
        // Leather Jacket Sleeve
        const sleeveGrad = ctx.createLinearGradient(shoulderX - 20, shoulderY, wristX + 20, wristY);
        sleeveGrad.addColorStop(0, '#1b2230');
        sleeveGrad.addColorStop(0.5, '#0d1017');
        sleeveGrad.addColorStop(1, '#19202e');
        ctx.fillStyle = sleeveGrad;

        ctx.beginPath();
        ctx.moveTo(shoulderX - dir * 16, shoulderY);
        ctx.quadraticCurveTo(elbowX + dir * 16, elbowY, wristX + dir * 14, wristY);
        ctx.lineTo(wristX - dir * 15, wristY + 4);
        ctx.quadraticCurveTo(elbowX - dir * 18, elbowY + 6, shoulderX - dir * 24, shoulderY + 36);
        ctx.closePath();
        ctx.fill();

        // Forearm Tactical Vambrace / Gauntlet Straps
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(wristX - 14, wristY - 32);
        ctx.lineTo(wristX + 14, wristY - 30);
        ctx.moveTo(wristX - 14, wristY - 14);
        ctx.lineTo(wristX + 14, wristY - 12);
        ctx.stroke();

        // Realistic Leather Creases at the Elbow
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(elbowX - 12, elbowY - 6);
        ctx.lineTo(elbowX + 10, elbowY + 2);
        ctx.moveTo(elbowX - 10, elbowY + 5);
        ctx.lineTo(elbowX + 12, elbowY + 11);
        ctx.stroke();

        // Golden / Cyan Rim Lighting along Outer Arm
        ctx.strokeStyle = isRightArm ? 'rgba(253, 224, 71, 0.55)' : 'rgba(125, 211, 252, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.quadraticCurveTo(elbowX + dir * 15, elbowY, wristX + dir * 13, wristY);
        ctx.stroke();

        // Gloved Clenched Hand with Knuckle Guard
        ctx.fillStyle = '#080a0f';
        ctx.beginPath();
        ctx.roundRect(wristX - 14, wristY, 28, 26, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(wristX - 11, wristY + 4, 22, 8);

        ctx.restore();
      };

      drawRealisticArm(false);
      drawRealisticArm(true);

      // --- 5G. UTILITY BELT, HOLSTERS & METAL HARDWARE AT WAIST ---
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(-58, -32, 116, 20);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-58, -32, 116, 20);

      // Tactical Pouches & Hanging D-Rings
      const pouchPositions = [-48, -22, 16, 38];
      pouchPositions.forEach((px) => {
        ctx.fillStyle = '#141923';
        ctx.fillRect(px, -36, 18, 26);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(px, -36, 18, 26);
        // Brass snap button
        ctx.fillStyle = '#e5c158';
        ctx.beginPath();
        ctx.arc(px + 9, -27, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- 5H. CONTOURED HARDSHELL TACTICAL BACKPACK & HARNESS STRAPS ---
      // Shoulder Harness Straps curving over chest/shoulders
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(-48, -175);
      ctx.quadraticCurveTo(-38, -110, -45, -45);
      ctx.moveTo(48, -175);
      ctx.quadraticCurveTo(38, -110, 45, -45);
      ctx.stroke();

      // Backpack Main Contoured Body
      const packGrad = ctx.createLinearGradient(-44, -162, 46, -38);
      packGrad.addColorStop(0, '#1a2130');
      packGrad.addColorStop(0.45, '#0b0e15');
      packGrad.addColorStop(1, '#141a26');
      ctx.fillStyle = packGrad;

      ctx.beginPath();
      ctx.moveTo(-34, -160);
      ctx.lineTo(34, -160);
      ctx.quadraticCurveTo(46, -150, 44, -95);
      ctx.lineTo(38, -42);
      ctx.quadraticCurveTo(0, -34, -38, -42);
      ctx.lineTo(-44, -95);
      ctx.quadraticCurveTo(-46, -150, -34, -160);
      ctx.closePath();
      ctx.fill();

      // Backpack Molded Armor Plates, Zippers, Carabiners & Wet Sheen
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Upper & Lower Molded Compartments
      ctx.fillStyle = '#080b11';
      ctx.beginPath();
      ctx.roundRect(-30, -148, 60, 38, 6);
      ctx.roundRect(-32, -102, 64, 48, 8);
      ctx.fill();

      // Golden Specular Rim Light on Right Side of Backpack
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(28, -156);
      ctx.lineTo(42, -98);
      ctx.lineTo(36, -44);
      ctx.stroke();

      // Subtle Wayfarer Signal Indicator LED on Backpack
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(16, -136, 8, 3);
      ctx.shadowBlur = 0;

      // --- 5I. LAYERED COWL SCARF & DEEP POINTED ASSASSIN/WAYFARER HOOD ---
      // Draped Neck Cowl / Scarf folds resting over the collar
      const cowlGrad = ctx.createLinearGradient(-52, -195, 52, -155);
      cowlGrad.addColorStop(0, '#1e2536');
      cowlGrad.addColorStop(0.5, '#0d111a');
      cowlGrad.addColorStop(1, '#252e42');
      ctx.fillStyle = cowlGrad;
      ctx.beginPath();
      ctx.moveTo(-54, -172);
      ctx.quadraticCurveTo(0, -148, 54, -172);
      ctx.lineTo(44, -194);
      ctx.quadraticCurveTo(0, -178, -44, -194);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-46, -178);
      ctx.quadraticCurveTo(0, -160, 46, -178);
      ctx.stroke();

      // Main Sculpted Hood with Center Seam & Natural Fabric Drape
      const hoodGrad = ctx.createLinearGradient(-46, -268, 48, -172);
      hoodGrad.addColorStop(0, '#2c3548');
      hoodGrad.addColorStop(0.38, '#151a24');
      hoodGrad.addColorStop(0.75, '#090c12');
      hoodGrad.addColorStop(1, '#1e2536');
      ctx.fillStyle = hoodGrad;

      ctx.beginPath();
      ctx.moveTo(-46, -182);
      ctx.bezierCurveTo(-50, -218, -36, -256, 0, -270); // Pointed crown peak
      ctx.bezierCurveTo(36, -256, 50, -218, 46, -182);
      ctx.quadraticCurveTo(0, -168, -46, -182);
      ctx.closePath();
      ctx.fill();

      // Center Stitched Seam & Fabric Folds on Back of Hood
      ctx.strokeStyle = 'rgba(2, 4, 8, 0.8)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -268);
      ctx.quadraticCurveTo(2, -220, 0, -176);
      ctx.stroke();

      // Warm Streetlight Rim Lighting on Hood Crown & Right Edge
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.68)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-12, -265);
      ctx.quadraticCurveTo(0, -270, 14, -262);
      ctx.bezierCurveTo(36, -248, 47, -215, 45, -184);
      ctx.stroke();

      // Cool Cyan Skyscraper Reflection on Left Hood Edge
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -265);
      ctx.bezierCurveTo(-36, -250, -47, -216, -45, -184);
      ctx.stroke();

      ctx.restore();

      // =========================================================================
      

      // --- 6. ATMOSPHERIC RAIN STREAKS ---
      if (rainIntensity > 0) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.lineWidth = 1.2;
        const count = rainIntensity === 1 ? 85 : 150;
        for (let r = 0; r < count; r++) {
          const rx = (r * 37 + time * 650) % width;
          const ry = (r * 29 + time * 1200) % height;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 7, ry + 24);
          ctx.stroke();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, rainIntensity, empShockwave, terminals, currentAct]);

  const distanceToTarget = Math.max(0, Math.round(currentAct.targetZ - playerPos.z));

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-rpg-title { font-family: 'Cinzel', Georgia, serif; }
        .font-rpg-body { font-family: 'Cormorant Garamond', Georgia, serif; }
        .hud-glass {
          background: linear-gradient(90deg, rgba(12, 16, 24, 0.92) 0%, rgba(16, 21, 32, 0.82) 75%, rgba(16, 21, 32, 0.25) 100%);
          backdrop-filter: blur(10px);
        }
        .gold-line-fade {
          background: linear-gradient(90deg, rgba(229, 193, 88, 0.9) 0%, rgba(229, 193, 88, 0.4) 60%, rgba(229, 193, 88, 0) 100%);
        }
      `}</style>

      {/* 2D HIGH-FIDELITY CANVAS */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* DISTRICT SIGN NOTIFICATION (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <div className="bg-slate-950/90 border border-sky-400/80 px-6 py-2 rounded shadow-[0_0_22px_rgba(56,189,248,0.45)]">
          <span className="font-rpg-title text-sky-100 text-sm sm:text-base tracking-[0.3em] font-bold">
            {currentAct.district.toUpperCase()}
          </span>
          <span className="ml-3 text-xs text-amber-400 font-mono">Z: {Math.round(playerPos.z)}m</span>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {screenToast && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-950/95 border border-amber-400/80 px-6 py-2.5 rounded shadow-2xl text-amber-200 font-semibold text-sm">
            {screenToast}
          </div>
        </div>
      )}

      {/* INTERACTIVE HUD */}
      {hudVisible && (
        <div className="relative z-20 w-full h-full pointer-events-none flex flex-col justify-between p-4 sm:p-6">
          {/* TOP ROW: OBJECTIVE & CREST */}
          <div className="flex justify-between items-start w-full">
            {/* TOP-LEFT: OBJECTIVE & INCOMING MESSAGE */}
            <div className="flex flex-col gap-2.5 max-w-md">
              <div 
                className="pointer-events-auto group cursor-pointer hud-glass relative px-5 py-3 rounded-sm border-l-2 border-amber-400/70 transition-all hover:brightness-110 shadow-xl"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    <DiamondIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-rpg-title text-[12px] tracking-[0.16em] text-[#e5c158] font-semibold uppercase">
                        ACT {currentAct.act} // OBJECTIVE
                      </span>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                        🎯 {distanceToTarget}m
                      </span>
                    </div>
                    <div className="font-rpg-body text-white text-lg sm:text-[20px] font-medium leading-snug tracking-wide drop-shadow mt-0.5">
                      {currentAct.title}
                    </div>
                  </div>
                </div>
              </div>

              {/* INCOMING TRANSMISSION WITH HOODED AVATAR */}
              <div className="pointer-events-auto hud-glass relative px-4 py-2 rounded-sm border-l-2 border-amber-400/70 flex items-center gap-3.5 shadow-lg">
                <div className="w-10 h-10 rounded overflow-hidden border border-slate-600/60 shrink-0 bg-slate-900">
                  <HoodedAvatarSVG />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-rpg-title text-xs tracking-wider text-[#e5c158] font-semibold uppercase">
                    <StarSparkle className="w-3 h-3 text-[#e5c158]" />
                    <span>{currentAct.sender}</span>
                  </div>
                  <div className="font-rpg-body text-slate-100 text-xs sm:text-[14px] leading-snug tracking-wide mt-0.5">
                    {currentAct.transmission}
                  </div>
                </div>
              </div>
            </div>

            {/* TOP-RIGHT: WAYFARER LEVEL CREST */}
            <div 
              onClick={() => setXp((x) => x + 300)}
              title="Click to test XP gain"
              className="pointer-events-auto cursor-pointer hud-glass relative px-5 py-2.5 rounded-sm border border-amber-400/30 flex items-center gap-3.5 shadow-2xl transition-transform hover:scale-105"
            >
              <WayfarerCrest className="w-11 h-11 shrink-0" />
              <div>
                <div className="font-rpg-title text-white text-sm sm:text-[15px] tracking-[0.18em] font-semibold leading-tight">
                  WAYFARER
                </div>
                <div className="font-rpg-title text-[#e5c158] text-xs sm:text-[13px] tracking-[0.15em] mt-0.5">
                  LEVEL {level}
                </div>
                <div className="w-24 h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden border border-slate-700">
                  <div className="h-full bg-amber-400" style={{ width: `${(xp / 1000) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: RADAR, HP/STAMINA, KEY BADGES */}
          <div className="flex flex-row items-end justify-between w-full gap-4">
            {/* BOTTOM-LEFT: RADAR MINIMAP */}
            <div className="pointer-events-auto relative flex items-center justify-center shrink-0">
              <div className="absolute -top-3 z-30 bg-slate-950/90 px-2 py-0.5 rounded text-[11px] font-bold text-white tracking-wider border border-slate-600/60 shadow">
                N
              </div>
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full border-2 border-slate-300/70 shadow-2xl overflow-hidden relative bg-[#0e131d]">
                <svg viewBox="-40 -40 80 80" className="w-full h-full">
                  <rect x="-40" y="-40" width="80" height="80" fill="#0c1018" />
                  {/* Street boundaries */}
                  <line x1="-16" y1="-40" x2="-16" y2="40" stroke="#334155" strokeWidth="1.2" />
                  <line x1="16" y1="-40" x2="16" y2="40" stroke="#334155" strokeWidth="1.2" />
                  <line x1="-40" y1="0" x2="40" y2="0" stroke="#1e293b" strokeWidth="0.8" />

                  {/* Objective Marker Diamond */}
                  <g transform={`translate(${currentAct.targetZ > playerPos.z ? 0 : -8}, ${Math.max(-32, Math.min(32, -(currentAct.targetZ - playerPos.z) * 0.12))})`}>
                    <polygon points="0,-4 4,0 0,4 -4,0" fill="#e5c158" />
                  </g>

                  {/* Shards */}
                  {dataShards.filter((s) => !s.collected).map((s) => (
                    <circle key={s.id} cx={s.x * 0.2} cy={-(s.z - playerPos.z) * 0.12} r="2.2" fill="#38bdf8" />
                  ))}

                  {/* Terminals */}
                  {terminals.map((t) => (
                    <rect key={t.id} x={t.x * 0.2 - 2} y={-(t.z - playerPos.z) * 0.12 - 2} width="4" height="4" fill={t.hacked ? '#22c55e' : '#38bdf8'} />
                  ))}

                  {/* Center Player Heading Arrow */}
                  <polygon
                    points="0,-5 4,5 0,3 -4,5"
                    fill="#ffffff"
                    transform={`rotate(${playerPos.angle})`}
                  />
                </svg>
              </div>
            </div>

            {/* BOTTOM-CENTER: HP & STAMINA */}
            <div className="pointer-events-auto flex flex-col gap-2 w-64 sm:w-80 mb-1">
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs tracking-wider font-semibold">HP</span>
                <div 
                  onClick={() => setHp((h) => (h > 20 ? h - 20 : 100))}
                  title="Click to test HP damage/heal"
                  className="cursor-pointer flex-1 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden"
                >
                  <div 
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${hp}%`,
                      background: 'linear-gradient(90deg, #dc2626 0%, #f87171 65%, #fecaca 100%)',
                      boxShadow: '0 0 10px rgba(248, 113, 113, 0.65)'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs tracking-wider font-semibold">STAMINA</span>
                <div className="flex-1 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden">
                  <div 
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${(stamina / maxStamina) * 100}%`,
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 70%, #bae6fd 100%)',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.65)'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono px-1">
                <span>⚡ Cores: {energyCores}</span>
                <span>💾 Shards: {dataShards.filter((s) => s.collected).length}/5</span>
              </div>
            </div>

            {/* BOTTOM-RIGHT: INTERACTIVE KEY BADGES */}
            <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-1">
                {['W', 'A', 'S', 'D'].map((k) => (
                  <button key={k} className="w-6 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                    {k}
                  </button>
                ))}
                <span className="font-rpg-title text-white text-xs ml-1">MOVE</span>
              </div>

              <button className="px-2 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                SHIFT
              </button>
              <span className="font-rpg-title text-white text-xs">SPRINT</span>

              <button onClick={triggerJump} className="px-2 h-6 rounded bg-slate-950/85 text-white border border-slate-500/60 text-xs font-bold">
                SPACE
              </button>
              <span className="font-rpg-title text-white text-xs">JUMP</span>

              <button 
                onClick={triggerEmp}
                className={`px-2 h-6 rounded border text-xs font-bold flex items-center gap-1 ${
                  empCooldown === 0 ? 'bg-cyan-950 text-cyan-200 border-cyan-400' : 'bg-slate-900 text-slate-500 border-slate-700'
                }`}
              >
                <span>[E] EMP</span>
                {empCooldown > 0 && <span className="font-mono">({empCooldown}s)</span>}
              </button>

              <button 
                onClick={triggerInteract}
                className="px-2 h-6 rounded bg-amber-950 text-amber-200 border border-amber-400 text-xs font-bold"
              >
                [F] INTERACT
              </button>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent('spider:return-to-menu'))}
                className="px-2.5 h-6 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-400/50 text-xs font-bold"
              >
                ✕ MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HACKING CONSOLE MODAL --- */}
      {activeModal === 'hack' && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-sky-400 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sky-500/30">
              <div className="flex items-center gap-2 text-sky-300 font-rpg-title font-bold text-lg">
                <Terminal className="w-5 h-5 text-sky-400" />
                <span>TERMINAL OVERRIDE // {currentAct.district}</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="py-4 text-sm text-slate-300 leading-relaxed">
              <p>Security protocol detected. Bypass firewall nodes to extract encrypted district data.</p>
              <div className="my-4 p-3 bg-slate-950 rounded border border-slate-700 font-mono text-xs text-emerald-400">
                &gt; Target: {currentAct.title}<br />
                &gt; Frequency Match: 104.8 MHz<br />
                &gt; Shards Connected: {dataShards.filter((s) => s.collected).length}/5<br />
                &gt; Access Level: WAYFARER RANK {level}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-sm">
                Cancel
              </button>
              <button onClick={handleHackSuccess} className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow">
                Execute Bypass (+{currentAct.xpReward} XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BAZAAR VENDOR MODAL --- */}
      {activeModal === 'vendor' && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-300 font-rpg-title font-bold text-lg">
                <Cpu className="w-5 h-5 text-amber-400" />
                <span>CYBER BAZAAR // TECH MOD SHOP</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                <div>
                  <div className="text-white font-bold text-sm">Synthetic Adrenaline (+25 Max Stamina)</div>
                  <div className="text-xs text-slate-400">Current: {maxStamina} Stamina</div>
                </div>
                <button 
                  onClick={() => {
                    if (energyCores >= 1) {
                      setEnergyCores((c) => c - 1);
                      setMaxStamina((s) => s + 25);
                      setStamina((s) => s + 25);
                      audio.playChime(true);
                    }
                  }}
                  disabled={energyCores < 1}
                  className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-40"
                >
                  Buy (1 Core)
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                <div>
                  <div className="text-white font-bold text-sm">Nano-Plating (+Full Health Restore)</div>
                  <div className="text-xs text-slate-400">Restores player HP to 100%</div>
                </div>
                <button 
                  onClick={() => {
                    if (energyCores >= 1) {
                      setEnergyCores((c) => c - 1);
                      setHp(100);
                      audio.playChime(true);
                    }
                  }}
                  disabled={energyCores < 1}
                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
                >
                  Heal (1 Core)
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs text-amber-300 font-mono">
              <span>Available Energy Cores: {energyCores}</span>
              <button onClick={() => setActiveModal(null)} className="px-4 py-1.5 rounded bg-slate-800 text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VICTORY MODAL --- */}
      {activeModal === 'victory' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-400 rounded-lg p-8 max-w-lg w-full text-center shadow-2xl">
            <Award className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h2 className="font-rpg-title text-2xl font-bold text-emerald-300">
              KNOWLEDGE GRID OVERRIDDEN // CAMPAIGN COMPLETE!
            </h2>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              You ran the entire 5km wet boulevard from Knowledge Park through the Apex Spire, neutralized security drone patrols, and secured all encrypted shards. The open city is now fully unlocked for free-roam exploration!
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setPlayerPos((p) => ({ ...p, z: 15 }));
                }}
                className="px-6 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
              >
                Restart Campaign
              </button>
              <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow"
              >
                Continue Free Roam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
