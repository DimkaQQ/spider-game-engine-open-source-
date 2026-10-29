import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  Sparkles, 
  RotateCcw
} from 'lucide-react';

// --- CUSTOM SVG ASSETS FOR EXACT HUD MATCHING ---

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

export default function App() {
  // --- INTERACTIVE RPG STATE ---
  const [hp, setHp] = useState(73);
  const [stamina, setStamina] = useState(86);
  const [level, setLevel] = useState(12);
  // x: lateral road/plaza position, y: forward/backward depth along the road
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0, angle: 0, walkCycle: 0 });
  const [activeKeys, setActiveKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false,
  });
  const [isJumping, setIsJumping] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [rainIntensity, setRainIntensity] = useState(1);
  const [messageIndex, setMessageIndex] = useState(0);
  const [scannerPulse, setScannerPulse] = useState(false);

  const canvasRef = useRef(null);

  const messages = [
    {
      sender: 'INCOMING MESSAGE',
      text: 'Welcome back. Something has changed in Knowledge Park.',
      objective: 'Investigate the signal in Knowledge Park'
    },
    {
      sender: 'ENCRYPTED TRANSMISSION',
      text: 'The neural spire ahead is broadcasting on an ancient frequency.',
      objective: 'Walk down the Knowledge Park avenue'
    },
    {
      sender: 'WAYFARER NETWORK',
      text: 'Security patrols have doubled near the wet transit concourse.',
      objective: 'Evade surveillance & reach the terminal'
    }
  ];

  // --- KEYBOARD LISTENERS FOR LIVE ROAD MOVEMENT ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setActiveKeys((prev) => ({ ...prev, [key]: true }));
      } else if (e.key === 'Shift') {
        setActiveKeys((prev) => ({ ...prev, shift: true }));
      } else if (e.code === 'Space') {
        e.preventDefault();
        setActiveKeys((prev) => ({ ...prev, space: true }));
        triggerJump();
      } else if (key === 'arrowup') {
        setActiveKeys((prev) => ({ ...prev, w: true }));
      } else if (key === 'arrowdown') {
        setActiveKeys((prev) => ({ ...prev, s: true }));
      } else if (key === 'arrowleft') {
        setActiveKeys((prev) => ({ ...prev, a: true }));
      } else if (key === 'arrowright') {
        setActiveKeys((prev) => ({ ...prev, d: true }));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setActiveKeys((prev) => ({ ...prev, [key]: false }));
      } else if (e.key === 'Shift') {
        setActiveKeys((prev) => ({ ...prev, shift: false }));
      } else if (e.code === 'Space') {
        setActiveKeys((prev) => ({ ...prev, space: false }));
      } else if (key === 'arrowup') {
        setActiveKeys((prev) => ({ ...prev, w: false }));
      } else if (key === 'arrowdown') {
        setActiveKeys((prev) => ({ ...prev, s: false }));
      } else if (key === 'arrowleft') {
        setActiveKeys((prev) => ({ ...prev, a: false }));
      } else if (key === 'arrowright') {
        setActiveKeys((prev) => ({ ...prev, d: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerJump = () => {
    setIsJumping((currentlyJumping) => {
      if (!currentlyJumping) {
        setStamina((prev) => Math.max(5, prev - 10));
        setTimeout(() => setIsJumping(false), 550);
        return true;
      }
      return currentlyJumping;
    });
  };

  // --- GAME LOOP FOR WALKING ON THE ROAD & STAMINA ---
  useEffect(() => {
    const interval = setInterval(() => {
      const isMoving = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;
      const isSprinting = isMoving && activeKeys.shift && stamina > 2;

      // Update Stamina
      setStamina((prev) => {
        if (isSprinting) return Math.max(0, prev - 1.1);
        if (isMoving) return Math.min(100, prev + 0.15);
        return Math.min(100, prev + 0.7);
      });

      // Update Player Road Coordinates & Walk Animation Cycle
      if (isMoving) {
        const speed = isSprinting ? 2.4 : 1.25;
        setPlayerPos((prev) => {
          let dx = 0;
          let dy = 0;
          if (activeKeys.w) dy += speed;
          if (activeKeys.s) dy -= speed;
          if (activeKeys.a) dx -= speed;
          if (activeKeys.d) dx += speed;

          let newAngle = prev.angle;
          if (dx !== 0 || dy !== 0) {
            newAngle = Math.atan2(dx, dy) * (180 / Math.PI);
          }

          return {
            x: Math.max(-140, Math.min(180, prev.x + dx)),
            y: Math.max(-45, Math.min(115, prev.y + dy)),
            angle: newAngle,
            walkCycle: prev.walkCycle + (isSprinting ? 0.42 : 0.24)
          };
        });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [activeKeys, stamina]);

  // --- PROCEDURAL 3D ROAD, WET PLAZA, TRAFFIC & HOODED WAYFARER CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Raindrops & Puddle Ripples
    const raindrops = Array.from({ length: 180 }, () => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      length: 15 + Math.random() * 18,
      speed: 15 + Math.random() * 10
    }));

    const ripples = Array.from({ length: 40 }, () => ({
      x: Math.random() * 1920,
      y: 600 + Math.random() * 460,
      radius: Math.random() * 18,
      maxRadius: 12 + Math.random() * 24,
      speed: 0.25 + Math.random() * 0.35
    }));

    // Skyscraper Definitions
    const buildingDefs = [
      { x: -30, y: -40, w: 330, h: 630, color: '#0a101d', winColor1: '#fde68a', winColor2: '#38bdf8', rows: 28, cols: 8 },
      // Iconic cylindrical orange-crowned tower (left-center)
      { x: 465, y: 18, w: 245, h: 565, color: '#0c1626', winColor1: '#fef08a', winColor2: '#7dd3fc', rows: 32, cols: 12, roundedCrown: true },
      // Mid-background central tower with orange top rim
      { x: 755, y: 115, w: 145, h: 470, color: '#0b1320', winColor1: '#fbd38d', winColor2: '#90cdf4', rows: 26, cols: 7, roundedCrown: true },
      // Distant central skyscrapers at the road vanishing point
      { x: 915, y: 265, w: 85, h: 320, color: '#0f1b2d', winColor1: '#63b3ed', winColor2: '#fefcbf', rows: 18, cols: 5 },
      { x: 1020, y: 175, w: 78, h: 410, color: '#0c1524', winColor1: '#f6e05e', winColor2: '#63b3ed', rows: 22, cols: 4 },
      // Massive Right High-Tech Skyscraper (Knowledge Park Main Tower)
      { x: 1115, y: -60, w: 540, h: 645, color: '#091322', winColor1: '#38bdf8', winColor2: '#fef08a', rows: 36, cols: 18 },
      // Far right tower
      { x: 1680, y: 35, w: 270, h: 550, color: '#080e1a', winColor1: '#fbbf24', winColor2: '#60a5fa', rows: 25, cols: 8 }
    ];

    const windowMatrix = buildingDefs.map((b, bIdx) => {
      const grid = [];
      for (let r = 0; r < b.rows; r++) {
        const row = [];
        for (let c = 0; c < b.cols; c++) {
          const hash = Math.sin(bIdx * 99 + r * 37 + c * 13) * 10000;
          const rand = hash - Math.floor(hash);
          row.push({
            lit: rand > 0.32,
            warm: rand > 0.65,
            brightness: 0.45 + rand * 0.55
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

      const isMoving = activeKeys.w || activeKeys.a || activeKeys.s || activeKeys.d;
      const isSprinting = isMoving && activeKeys.shift && stamina > 2;

      // World camera shift for immersive 3D perspective when walking
      const camX = -playerPos.x * 0.85;
      const camY = (isJumping ? -22 : 0) + (isMoving ? Math.sin(playerPos.walkCycle * 2) * 3.5 : Math.sin(time * 2) * 1.2);

      // Vanishing Point of the Avenue Road
      const vpX = 955 + camX * 0.55;
      const vpY = horizonY;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // =========================================================================
      
      // =========================================================================
      // 1. MIDNIGHT SKY & STARS
      // =========================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#040813');
      skyGrad.addColorStop(0.5, '#081224');
      skyGrad.addColorStop(1, '#0e1d35');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 20);

      // Subtle twinkling stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const sx = (i * 47 + 80) % width;
        const sy = (i * 29 + 30) % (horizonY - 140);
        const sa = 0.2 + ((Math.sin(time * 3 + i * 2) + 1) * 0.35);
        ctx.globalAlpha = sa;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // =========================================================================
      // 2. CITY SKYLINE & SKYSCRAPERS WITH LIT WINDOWS
      // =========================================================================
      buildingDefs.forEach((b, bIdx) => {
        const bx = b.x + camX * 0.3;
        const by = b.y + camY * 0.3;

        // Building mass
        ctx.fillStyle = b.color;
        ctx.fillRect(bx, by, b.w, b.h);

        // Edge structure lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, b.w, b.h);

        // Rounded glowing amber crown for iconic cylindrical tower
        if (b.roundedCrown) {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(bx + b.w / 2, by + 12, b.w / 2, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          // Glowing horizontal amber rings
          for (let ring = 0; ring < 4; ring++) {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
            ctx.fillRect(bx + 6, by + 16 + ring * 14, b.w - 12, 4);
          }
        }

        // Office Windows Grid
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

      // Pedestrian Skybridge across the boulevard
      const bridgeY = horizonY - 142 + camY * 0.42;
      const bridgeH = 36;
      ctx.fillStyle = '#08101e';
      ctx.fillRect(440 + camX * 0.4, bridgeY, 830, bridgeH);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(440 + camX * 0.4, bridgeY, 830, bridgeH);

      // Skybridge illuminated interior windows
      ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
      for (let bw = 0; bw < 19; bw++) {
        ctx.fillRect(455 + camX * 0.4 + bw * 42, bridgeY + 8, 26, 20);
      }

      // Bright Glowing 'KNOWLEDGE PARK' Facade Sign
      const signX = 890 + camX * 0.42;
      const signY = bridgeY - 30;
      ctx.fillStyle = '#020617';
      ctx.fillRect(signX - 14, signY - 8, 380, 36);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(signX - 14, signY - 8, 380, 36);

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillStyle = '#e0f2fe';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.fillText('KNOWLEDGE PARK', signX + 16, signY + 18);
      ctx.shadowBlur = 0;

      // =========================================================================
      // 3. TREE CANOPIES WITH GOLDEN FAIRY LIGHTS
      // =========================================================================
      const drawBoulevardTree = (tx, ty, scale) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);
        // Foliage
        ctx.fillStyle = '#09131a';
        ctx.beginPath();
        ctx.arc(0, -90, 68, 0, Math.PI * 2);
        ctx.arc(-36, -72, 52, 0, Math.PI * 2);
        ctx.arc(36, -72, 52, 0, Math.PI * 2);
        ctx.fill();
        // Warm golden fairy lights
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

      // =========================================================================
      // 4. THE WET ROAD: RAIN-SLICKED BOULEVARD, BOLLARDS & SPORTS CAR
      // =========================================================================
      // Wet asphalt dark base
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#0e1726');
      roadGrad.addColorStop(0.35, '#0a0f19');
      roadGrad.addColorStop(0.7, '#070b13');
      roadGrad.addColorStop(1, '#04060a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Perspective pavement grid seams converging to vpX, vpY
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.24)';
      ctx.lineWidth = 1.3;
      for (let lane = -6; lane <= 6; lane++) {
        const bottomX = width / 2 + lane * 225 + camX;
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Horizontal pavement seams in perspective
      for (let hStep = 1; hStep <= 18; hStep++) {
        const py = horizonY + Math.pow(hStep / 18, 2.2) * (height - horizonY);
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
        { x: 1515 + camX * 0.7, color: 'rgba(245, 158, 11, 0.35)', w: 105 },
      ];

      lightPillars.forEach(p => {
        const refGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        refGrad.addColorStop(0, p.color);
        refGrad.addColorStop(0.4, p.color.replace(/[\d.]+\)$/, '0.22)'));
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(p.x - p.w / 2, horizonY, p.w, height - horizonY);
      });

      // Roadside Amber Lantern Bollards (Glowing Light Cubes)
      const bollardList = [
        { x: 335, y: horizonY + 22, s: 0.38 },
        { x: 415, y: horizonY + 65, s: 0.52 },
        { x: 505, y: horizonY + 125, s: 0.72 },
        { x: 615, y: horizonY + 215, s: 0.95 },
        { x: 1325, y: horizonY + 215, s: 0.95 },
        { x: 1435, y: horizonY + 125, s: 0.72 },
        { x: 1525, y: horizonY + 65, s: 0.52 },
        { x: 1605, y: horizonY + 22, s: 0.38 },
      ];

      bollardList.forEach(b => {
        const bx = b.x + camX * (0.5 + b.s * 0.4);
        const by = b.y;
        const bw = 24 * b.s;
        const bh = 54 * b.s;

        // Dark Post
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - bw / 2, by - bh, bw, bh);

        // Glowing Amber Cube
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 24 * b.s;
        ctx.fillRect(bx - bw * 0.6, by - bh - bw * 1.1, bw * 1.2, bw * 1.1);
        ctx.shadowBlur = 0;

        // Warm light cast on wet pavement
        const poolGrad = ctx.createRadialGradient(bx, by, 2, bx, by, 75 * b.s);
        poolGrad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
        poolGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.32)');
        poolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = poolGrad;
        ctx.beginPath();
        ctx.ellipse(bx, by, 75 * b.s, 22 * b.s, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Black Sports Coupe parked on right side with Glowing Red LED Taillight
      const carX = 1420 + camX * 0.85;
      const carY = horizonY + 140;
      const carS = 0.88;
      ctx.save();
      ctx.translate(carX, carY);
      ctx.scale(carS, carS);

      // Car Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 52, 145, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car Body
      const carGrad = ctx.createLinearGradient(-120, -50, 120, 50);
      carGrad.addColorStop(0, '#1e293b');
      carGrad.addColorStop(0.4, '#030712');
      carGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.roundRect(-110, -20, 220, 68, 14);
      ctx.fill();

      // Cabin Glass
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(-75, -20);
      ctx.lineTo(-50, -52);
      ctx.lineTo(60, -52);
      ctx.lineTo(85, -20);
      ctx.closePath();
      ctx.fill();

      // Glowing Red LED Taillight Bar
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 18;
      ctx.fillRect(-95, 6, 190, 8);
      ctx.shadowBlur = 0;

      // Red reflection on wet pavement
      const carRefGrad = ctx.createRadialGradient(0, 52, 5, 0, 52, 95);
      carRefGrad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
      carRefGrad.addColorStop(0.6, 'rgba(185, 28, 28, 0.22)');
      carRefGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = carRefGrad;
      ctx.beginPath();
      ctx.ellipse(0, 52, 95, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

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
      // 6. ATMOSPHERIC RAIN & ROAD RIPPLES
      // =========================================================================
      if (rainIntensity > 0) {
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.24)';
        ctx.lineWidth = 1;
        ripples.forEach((rip) => {
          rip.radius += rip.speed * rainIntensity;
          if (rip.radius > rip.maxRadius) {
            rip.radius = 1;
            rip.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.ellipse(rip.x, rip.y, rip.radius * 2.2, rip.radius * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
        });

        ctx.strokeStyle = 'rgba(203, 213, 225, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        raindrops.forEach((drop) => {
          drop.y += drop.speed * rainIntensity;
          drop.x -= 1.5 * rainIntensity;
          if (drop.y > height) {
            drop.y = -20;
            drop.x = Math.random() * width;
          }
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2.5, drop.y + drop.length);
        });
        ctx.stroke();
      }

      // 7. CINEMATIC VIGNETTE
      const vigGrad = ctx.createRadialGradient(width / 2, height / 2, 540, width / 2, height / 2, 1100);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.52)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, isJumping, activeKeys, rainIntensity, stamina]);

  // Simulate manual key press for mouse/touch users clicking the HUD keys
  const handleVirtualKey = (key, state) => {
    if (key === 'space' && state) {
      triggerJump();
    }
    setActiveKeys((prev) => ({ ...prev, [key]: state }));
  };

  const currentMsg = messages[messageIndex];

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none font-sans">
      {/*Load Cinzel & Cormorant Garamond for exact RPG Serif UI typography*/}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-rpg-title {
          font-family: 'Cinzel', Georgia, serif;
        }
        .font-rpg-body {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .hud-glass {
          background: linear-gradient(90deg, rgba(12, 16, 24, 0.88) 0%, rgba(16, 21, 32, 0.72) 75%, rgba(16, 21, 32, 0.15) 100%);
          backdrop-filter: blur(8px);
        }
        .gold-line-fade {
          background: linear-gradient(90deg, rgba(229, 193, 88, 0.85) 0%, rgba(229, 193, 88, 0.35) 60%, rgba(229, 193, 88, 0) 100%);
        }
      `}</style>

      {/* --- FULLSCREEN DYNAMIC 3D-PERSPECTIVE CITY & ROAD CANVAS --- */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* DOM Location Sign - KNOWLEDGE PARK as real HUD text (not only canvas paint) */}
      <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="bg-slate-950/90 border border-sky-400/80 px-5 py-2 rounded-sm shadow-[0_0_18px_rgba(56,189,248,0.45)]">
          <span className="font-rpg-title text-sky-100 text-sm sm:text-base tracking-[0.28em] font-bold">KNOWLEDGE PARK</span>
        </div>
      </div>

      {/* --- SCANNER PULSE EFFECT OVERLAY --- */}
      {scannerPulse && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="w-96 h-96 rounded-full border-2 border-amber-400/60 animate-ping" />
        </div>
      )}

      {/* --- INTERACTIVE HUD OVERLAY --- */}
      {hudVisible && (
        <div className="relative z-20 w-full h-full pointer-events-none flex flex-col justify-between p-5 sm:p-8">
          
          {/* ================= TOP ROW: OBJECTIVE & WAYFARER BADGE ================= */}
          <div className="flex justify-between items-start w-full">
            
            {/* TOP-LEFT: NEW OBJECTIVE PANEL & INCOMING MESSAGE POPUP */}
            <div className="flex flex-col gap-2.5 max-w-md">
              <div 
                onClick={() => {
                  setScannerPulse(true);
                  setTimeout(() => setScannerPulse(false), 1000);
                }}
                className="pointer-events-auto group cursor-pointer hud-glass relative px-5 py-3.5 rounded-sm border-l-2 border-amber-400/70 transition-all duration-300 hover:brightness-110"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] gold-line-fade" />
                <div className="absolute bottom-0 left-0 right-0 h-[1px] gold-line-fade" />

                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex-shrink-0">
                    <DiamondIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-rpg-title text-[13px] tracking-[0.16em] text-[#e5c158] font-semibold uppercase drop-shadow">
                      NEW OBJECTIVE
                    </div>
                    <div className="font-rpg-body text-white text-lg sm:text-[21px] font-medium leading-snug tracking-wide drop-shadow-md mt-0.5">
                      {currentMsg.objective}
                    </div>
                  </div>
                </div>
              </div>

              {/* INCOMING MESSAGE POPUP WITH HOODED AVATAR */}
              <div 
                onClick={() => setMessageIndex((prev) => (prev + 1) % messages.length)}
                className="pointer-events-auto cursor-pointer hud-glass relative px-4 py-2.5 rounded-sm border-l-2 border-amber-400/70 flex items-center gap-3.5 transition-all duration-300 hover:brightness-110 shadow-lg"
                title="Click to cycle incoming transmission"
              >
                <div className="w-11 h-11 rounded overflow-hidden border border-slate-600/60 shrink-0 bg-slate-900 shadow">
                  <HoodedAvatarSVG />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-rpg-title text-xs tracking-wider text-[#e5c158] font-semibold uppercase drop-shadow">
                    <StarSparkle className="w-3.5 h-3.5 text-[#e5c158]" />
                    <span>{currentMsg.sender}</span>
                  </div>
                  <div className="font-rpg-body text-slate-100 text-sm sm:text-[15px] font-medium leading-snug tracking-wide drop-shadow mt-0.5">
                    {currentMsg.text}
                  </div>
                </div>
              </div>
            </div>

            {/* TOP-RIGHT: WAYFARER LEVEL 12 CREST */}
            <div 
              onClick={() => setLevel((l) => l + 1)}
              title="Click to Level Up"
              className="pointer-events-auto cursor-pointer hud-glass relative px-5 py-2.5 rounded-sm border border-amber-400/30 flex items-center gap-3.5 shadow-2xl transition-transform hover:scale-105"
              style={{
                background: 'linear-gradient(270deg, rgba(12, 16, 24, 0.9) 0%, rgba(18, 24, 36, 0.78) 100%)'
              }}
            >
              <WayfarerCrest className="w-11 h-11 flex-shrink-0" />
              <div className="pr-2">
                <div className="font-rpg-title text-white text-sm sm:text-[15px] tracking-[0.18em] font-semibold leading-tight">
                  WAYFARER
                </div>
                <div className="font-rpg-title text-[#e5c158] text-xs sm:text-[13px] tracking-[0.15em] mt-0.5">
                  LEVEL {level}
                </div>
              </div>
            </div>
          </div>

          {/* ================= BOTTOM ROW: MINIMAP, HP/STAMINA, KEYBOARD CONTROLS ================= */}
          <div className="flex flex-row items-end justify-between w-full gap-3 sm:gap-4">
            
            {/* BOTTOM-LEFT: CIRCULAR RADAR MINIMAP */}
            <div className="pointer-events-auto relative flex items-center justify-center shrink-0">
              <div className="absolute -top-3 z-30 bg-slate-950/90 px-1.5 py-0.2 rounded text-[13px] font-bold text-white tracking-wider border border-slate-600/60 shadow">
                N
              </div>

              <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full border-2 border-slate-300/70 shadow-[0_0_30px_rgba(0,0,0,0.85)] overflow-hidden relative bg-[#12161f]">
                <svg 
                  viewBox="0 0 200 200" 
                  className="w-full h-full transition-transform duration-150"
                  style={{
                    transform: `translate(${-playerPos.x * 0.35}px, ${playerPos.y * 0.45}px)`
                  }}
                >
                  <rect width="200" height="200" fill="#10141d" />
                  
                  {/* City Blocks */}
                  <path d="M10 10 H70 V65 H10 Z" fill="#1c2230" />
                  <path d="M95 5 H185 V55 H95 Z" fill="#1c2230" />
                  <path d="M10 85 H65 V150 H10 Z" fill="#1c2230" />
                  <path d="M100 75 H190 V135 H100 Z" fill="#232a3b" />
                  <path d="M25 165 H85 V210 H25 Z" fill="#1c2230" />
                  <path d="M105 152 H185 V205 H105 Z" fill="#1c2230" />

                  {/* Major Intersecting Roads */}
                  <path 
                    d="M82 -20 L65 220 M-20 72 L220 118 M-10 155 Q90 130 210 155 M115 -10 L155 210" 
                    stroke="#364156" 
                    strokeWidth="12" 
                    fill="none" 
                  />
                  <path 
                    d="M35 0 L25 200 M0 40 L200 30" 
                    stroke="#262f40" 
                    strokeWidth="5" 
                    fill="none" 
                  />

                  {/* Golden Objective Diamond Marker */}
                  <g transform="translate(45, 72)">
                    <polygon points="0,-10 10,0 0,10 -10,0" fill="#0f172a" stroke="#e5c158" strokeWidth="2" />
                    <polygon points="0,-5 5,0 0,5 -5,0" fill="#e5c158" />
                  </g>

                  {/* Classical Bank/Museum Column Icon */}
                  <g transform="translate(148, 96)">
                    <circle r="11" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M-6 -3 L0 -7 L6 -3 Z" fill="#f8fafc" />
                    <rect x="-5" y="-2" width="2" height="6" fill="#f8fafc" />
                    <rect x="-1" y="-2" width="2" height="6" fill="#f8fafc" />
                    <rect x="3" y="-2" width="2" height="6" fill="#f8fafc" />
                    <rect x="-6" y="4" width="12" height="1.8" fill="#f8fafc" />
                  </g>

                  {/* Safe House / Home Icon */}
                  <g transform="translate(62, 174)">
                    <circle r="9" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M-4.5 1 L0 -4 L4.5 1 V5 H-4.5 Z" fill="none" stroke="#f8fafc" strokeWidth="1.5" />
                  </g>
                </svg>

                {/* Player Center Navigation Cursor Arrow */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ transform: `rotate(${playerPos.angle}deg)` }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    <path d="M12 2 L20 20 L12 16 L4 20 Z" fill="#ffffff" />
                  </svg>
                </div>

                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_18px_rgba(0,0,0,0.85)] pointer-events-none" />
              </div>
            </div>

            {/* BOTTOM-CENTER: HP & STAMINA BARS */}
            <div className="pointer-events-auto flex flex-col gap-2 w-72 sm:w-[360px] mb-1">
              <div className="flex items-center justify-end gap-3">
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.14em] font-semibold drop-shadow">
                  HP
                </span>
                <div 
                  onClick={() => setHp((h) => (h > 25 ? h - 15 : 100))}
                  title="Click to test HP damage/heal"
                  className="cursor-pointer w-56 sm:w-72 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden"
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
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.14em] font-semibold drop-shadow">
                  STAMINA
                </span>
                <div className="w-56 sm:w-72 h-2.5 bg-slate-950/90 border border-slate-500/60 p-[1px] rounded-[1px] shadow-lg overflow-hidden">
                  <div 
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${stamina}%`,
                      background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 70%, #bae6fd 100%)',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.65)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM-RIGHT: KEYBOARD PROMPTS (W A S D MOVE | SHIFT SPRINT | SPACE JUMP) */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-4 sm:gap-6 mb-1">
              
              {/* W A S D MOVE */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {['w', 'a', 's', 'd'].map((k) => (
                    <button
                      key={k}
                      onMouseDown={() => handleVirtualKey(k, true)}
                      onMouseUp={() => handleVirtualKey(k, false)}
                      onMouseLeave={() => handleVirtualKey(k, false)}
                      onTouchStart={() => handleVirtualKey(k, true)}
                      onTouchEnd={() => handleVirtualKey(k, false)}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[3px] border text-xs font-semibold uppercase flex items-center justify-center transition-all ${
                        activeKeys[k]
                          ? 'bg-amber-400 text-slate-950 border-amber-200 scale-95 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                          : 'bg-slate-950/85 text-white border-slate-300/80 hover:border-amber-300'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.12em] font-medium drop-shadow">
                  MOVE
                </span>
              </div>

              {/* SHIFT SPRINT */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => handleVirtualKey('shift', true)}
                  onMouseUp={() => handleVirtualKey('shift', false)}
                  onMouseLeave={() => handleVirtualKey('shift', false)}
                  onTouchStart={() => handleVirtualKey('shift', true)}
                  onTouchEnd={() => handleVirtualKey('shift', false)}
                  className={`px-2.5 h-6 sm:h-7 rounded-[3px] border text-xs font-semibold uppercase flex items-center justify-center transition-all ${
                    activeKeys.shift
                      ? 'bg-sky-400 text-slate-950 border-sky-200 scale-95 shadow-[0_0_12px_rgba(56,189,248,0.8)]'
                      : 'bg-slate-950/85 text-white border-slate-300/80 hover:border-sky-300'
                  }`}
                >
                  SHIFT
                </button>
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.12em] font-medium drop-shadow">
                  SPRINT
                </span>
              </div>

              {/* EXIT TO ENGINE MENU */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('spider:return-to-menu'));
                }}
                className="pointer-events-auto px-3 h-6 sm:h-7 rounded-[3px] border border-rose-400/50 hover:border-rose-400 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold uppercase flex items-center justify-center transition-all shadow cursor-pointer active:scale-95"
                title="Return to Spider Engine Menu (or press Esc)"
              >
                ✕ Menu
              </button>

              {/* SPACE JUMP */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => handleVirtualKey('space', true)}
                  onMouseUp={() => handleVirtualKey('space', false)}
                  onTouchStart={() => handleVirtualKey('space', true)}
                  onTouchEnd={() => handleVirtualKey('space', false)}
                  className={`px-2.5 h-6 sm:h-7 rounded-[3px] border text-xs font-semibold uppercase flex items-center justify-center transition-all ${
                    activeKeys.space || isJumping
                      ? 'bg-amber-400 text-slate-950 border-amber-200 scale-95 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                      : 'bg-slate-950/85 text-white border-slate-300/80 hover:border-amber-300'
                  }`}
                >
                  SPACE
                </button>
                <span className="font-rpg-title text-white text-xs sm:text-[13px] tracking-[0.12em] font-medium drop-shadow">
                  JUMP
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- FLOATING MINI QUICK-CONTROLS (Top Center) --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity bg-slate-950/85 px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs text-slate-300">
        <button
          onClick={() => setPlayerPos({ x: 0, y: 0, angle: 0, walkCycle: 0 })}
          className="flex items-center gap-1 hover:text-amber-300 px-1.5"
          title="Reset Character Position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Pos</span>
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => setHudVisible(!hudVisible)}
          className="flex items-center gap-1 hover:text-amber-300 px-1.5"
          title="Toggle HUD Visibility"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{hudVisible ? 'Hide HUD' : 'Show HUD'}</span>
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => setRainIntensity((r) => (r === 1 ? 2 : r === 2 ? 0 : 1))}
          className="flex items-center gap-1 hover:text-sky-300 px-1.5"
          title="Cycle Rain Weather"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rain: {rainIntensity === 0 ? 'Off' : rainIntensity === 1 ? 'Normal' : 'Storm'}</span>
        </button>
      </div>
    </div>
  );
}