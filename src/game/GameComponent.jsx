import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Camera, Shield, Sliders, Award, LogOut, Play, PlusCircle, FolderOpen, Sparkles, Check, RotateCcw } from 'lucide-react';

// ==========================================
// WEB AUDIO API SOUND SYNTHESIZER (AAA UI SFX)
// ==========================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playHover() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Subtle airy high-tech/fantasy metallic shimmer + low thump
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(65, now + 0.09);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1200, now);
      osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.06);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(0.015, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc1.connect(gain);
      osc2.connect(gain2);
      gain.connect(this.ctx.destination);
      gain2.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.09);
      osc2.stop(now + 0.06);
    } catch (e) {
      // Ignore audio errors if blocked by autoplay policy
    }
  }

  playSelect() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Cinematic resonant chord chime + deep impact
      const freqs = [220, 440, 659.25, 880];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.015, now + 0.45);

        gain.gain.setValueAtTime(idx === 0 ? 0.12 : 0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.46);
      });
    } catch (e) {}
  }

  playBack() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }
}

const sfx = new SoundEffects();

// ==========================================
// PROCEDURAL 2D CANVAS CITY & CHARACTER SCENE
// (Faithfully recreates the Knowledge Park night scene)
// ==========================================
const ProceduralNightCityCanvas = ({ mousePos, customBgUrl, bokehIntensity = 1 }) => {
  const canvasRef = useRef(null);
  const sceneDataRef = useRef(null);

  // Generate deterministic building windows, street trees, and rain particles once
  useEffect(() => {
    const leftTowerWindows = [];
    const floorsLeft = 17;
    const colsLeft = 22;
    for (let r = 0; r < floorsLeft; r++) {
      for (let c = 0; c < colsLeft; c++) {
        const lit = Math.random() > 0.22;
        const warm = Math.random() > 0.55;
        const brightness = 0.4 + Math.random() * 0.6;
        leftTowerWindows.push({ r, c, lit, warm, brightness, flickerSpeed: 0.5 + Math.random() * 2 });
      }
    }

    const rightTowerWindows = [];
    const floorsRight = 24;
    const colsRight = 28;
    for (let r = 0; r < floorsRight; r++) {
      for (let c = 0; c < colsRight; c++) {
        const lit = Math.random() > 0.25;
        const warm = Math.random() > 0.62;
        const brightness = 0.35 + Math.random() * 0.65;
        rightTowerWindows.push({ r, c, lit, warm, brightness, flickerSpeed: 0.4 + Math.random() * 1.8 });
      }
    }

    // Fairy light trees along the plaza
    const treeClusters = [
      { x: 0.33, y: 0.68, radius: 0.055, count: 65 },
      { x: 0.44, y: 0.71, radius: 0.038, count: 48 },
      { x: 0.74, y: 0.69, radius: 0.042, count: 50 },
      { x: 0.80, y: 0.67, radius: 0.058, count: 72 },
    ];

    const fairyLights = [];
    treeClusters.forEach((cluster) => {
      for (let i = 0; i < cluster.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.7) * cluster.radius;
        fairyLights.push({
          x: cluster.x + Math.cos(angle) * dist * 1.25,
          y: cluster.y + Math.sin(angle) * dist * 0.85,
          size: 1.1 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          warm: Math.random() > 0.15,
        });
      }
    });

    // Floating rain & ember particles
    const rainDrops = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      len: 0.015 + Math.random() * 0.025,
      speed: 0.006 + Math.random() * 0.008,
      opacity: 0.08 + Math.random() * 0.18,
    }));

    // Ground puddle ripples
    const ripples = Array.from({ length: 24 }, () => ({
      x: 0.15 + Math.random() * 0.75,
      y: 0.77 + Math.random() * 0.21,
      radius: Math.random() * 18,
      maxRadius: 14 + Math.random() * 24,
      speed: 0.18 + Math.random() * 0.25,
    }));

    sceneDataRef.current = {
      leftTowerWindows,
      rightTowerWindows,
      fairyLights,
      rainDrops,
      ripples,
      floorsLeft,
      colsLeft,
      floorsRight,
      colsRight,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let startTime = performance.now();

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 640;
      const h = parent ? parent.clientHeight : 360;
      if (w > 0 && h > 0) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let resizeObs;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      resizeObs = new ResizeObserver(updateSize);
      resizeObs.observe(canvas.parentElement);
    }

    const render = (now) => {
      const elapsed = (now - startTime) * 0.001;
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 640;
      const h = parent ? parent.clientHeight : 360;
      const data = sceneDataRef.current;

      if (!data || w <= 0 || h <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Subtle camera parallax based on mouse
      const px = (mousePos.x - 0.5) * 22;
      const py = (mousePos.y - 0.5) * 12;

      ctx.clearRect(0, 0, w, h);

      // 1. DEEP NIGHT SKY BACKGROUND
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.78);
      skyGrad.addColorStop(0, '#020408');
      skyGrad.addColorStop(0.45, '#06101e');
      skyGrad.addColorStop(0.75, '#0a192c');
      skyGrad.addColorStop(1, '#07111e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant city skyline silhouettes
      ctx.fillStyle = '#050c17';
      const bgBuildings = [
        { x: 0.14, y: 0.34, bw: 0.06, bh: 0.42 },
        { x: 0.21, y: 0.28, bw: 0.07, bh: 0.48 },
        { x: 0.53, y: 0.48, bw: 0.05, bh: 0.28 },
        { x: 0.91, y: 0.18, bw: 0.09, bh: 0.58 },
      ];
      bgBuildings.forEach((b) => {
        ctx.fillRect(w * b.x + px * 0.25, h * b.y + py * 0.2, w * b.bw, h * b.bh);
      });

      // 2. LEFT CYLINDRICAL HIGH-TECH TOWER (Orange-lit crown + blue/warm glass floors)
      const ltX = w * 0.275 + px * 0.45;
      const ltY = h * 0.045 + py * 0.35;
      const ltW = w * 0.265;
      const ltH = h * 0.69;

      // Ambient orange glow behind left tower crown
      const crownGlow = ctx.createRadialGradient(
        ltX + ltW * 0.5,
        ltY + ltH * 0.06,
        10,
        ltX + ltW * 0.5,
        ltY + ltH * 0.06,
        ltW * 0.75
      );
      crownGlow.addColorStop(0, 'rgba(255, 130, 40, 0.34)');
      crownGlow.addColorStop(0.5, 'rgba(255, 95, 20, 0.10)');
      crownGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = crownGlow;
      ctx.fillRect(ltX - ltW * 0.4, ltY - ltH * 0.15, ltW * 1.8, ltH * 0.5);

      // Left Tower Main Cylinder Body
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ltX + ltW * 0.5, ltY + 26, ltW * 0.5, 26, 0, Math.PI, 0, false);
      ctx.lineTo(ltX + ltW, ltY + ltH);
      ctx.lineTo(ltX, ltY + ltH);
      ctx.closePath();
      const ltBodyGrad = ctx.createLinearGradient(ltX, ltY, ltX + ltW, ltY);
      ltBodyGrad.addColorStop(0, '#050b14');
      ltBodyGrad.addColorStop(0.25, '#0b1829');
      ltBodyGrad.addColorStop(0.6, '#0d1f33');
      ltBodyGrad.addColorStop(1, '#040911');
      ctx.fillStyle = ltBodyGrad;
      ctx.fill();

      // Glowing Vertical Orange Fin Crown along top curve
      const numCrownFins = 40;
      for (let i = 0; i < numCrownFins; i++) {
        const t = i / (numCrownFins - 1);
        const angle = Math.PI + t * Math.PI;
        const fx = ltX + ltW * 0.5 + Math.cos(angle) * (ltW * 0.495);
        const fy = ltY + 28 + Math.sin(angle) * 22 + t * 14;
        const pulse = 0.82 + 0.18 * Math.sin(elapsed * 2 + i * 0.3);

        ctx.fillStyle = `rgba(255, 165, 75, ${0.85 * pulse})`;
        ctx.fillRect(fx - 1.5, fy - 14, 3, 18);
        ctx.fillStyle = `rgba(255, 235, 190, ${0.95 * pulse})`;
        ctx.fillRect(fx - 0.8, fy - 12, 1.6, 13);
      }

      // Left Tower Curved Glass Floor Windows
      const floorH = (ltH - 45) / data.floorsLeft;
      data.leftTowerWindows.forEach((win) => {
        if (!win.lit) return;
        const t = win.c / (data.colsLeft - 1);
        const angle = Math.PI + t * Math.PI;
        const wx = ltX + ltW * 0.5 + Math.cos(angle) * (ltW * 0.485);
        const curveOffset = Math.sin(angle) * 14;
        const wy = ltY + 48 + win.r * floorH + curveOffset * (1 - (win.r / data.floorsLeft) * 0.65);
        const wWidth = Math.max(2, Math.sin(t * Math.PI) * (ltW / data.colsLeft) * 0.85);

        const shimmer = 0.85 + 0.15 * Math.sin(elapsed * win.flickerSpeed + win.r);
        if (win.warm) {
          ctx.fillStyle = `rgba(255, 195, 120, ${win.brightness * shimmer * 0.85})`;
        } else {
          ctx.fillStyle = `rgba(145, 215, 255, ${win.brightness * shimmer * 0.82})`;
        }
        ctx.fillRect(wx - wWidth * 0.5, wy, wWidth, floorH * 0.56);
      });

      // Horizontal steel spandrel rings on Left Tower
      ctx.strokeStyle = 'rgba(10, 22, 38, 0.92)';
      ctx.lineWidth = 3.2;
      for (let r = 0; r <= data.floorsLeft; r++) {
        const ry = ltY + 46 + r * floorH;
        ctx.beginPath();
        ctx.moveTo(ltX, ry);
        ctx.quadraticCurveTo(ltX + ltW * 0.5, ry - 14 * (1 - r / data.floorsLeft), ltX + ltW, ry);
        ctx.stroke();
      }
      ctx.restore();

      // 3. RIGHT CURVED MODERN GLASS SKYSCRAPER
      const rtX = w * 0.585 + px * 0.55;
      const rtY = -h * 0.04 + py * 0.4;
      const rtW = w * 0.36;
      const rtH = h * 0.78;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rtX, rtY + rtH * 0.22);
      ctx.quadraticCurveTo(rtX + rtW * 0.48, rtY - rtH * 0.02, rtX + rtW, rtY - 10);
      ctx.lineTo(rtX + rtW, rtY + rtH);
      ctx.lineTo(rtX, rtY + rtH);
      ctx.closePath();

      const rtGrad = ctx.createLinearGradient(rtX, rtY, rtX + rtW, rtY + rtH);
      rtGrad.addColorStop(0, '#071426');
      rtGrad.addColorStop(0.5, '#0b1e36');
      rtGrad.addColorStop(1, '#040b14');
      ctx.fillStyle = rtGrad;
      ctx.fill();

      // Right Tower Windows in perspective
      const rFloorH = (rtH * 0.82) / data.floorsRight;
      data.rightTowerWindows.forEach((win) => {
        if (!win.lit) return;
        const colRatio = win.c / data.colsRight;
        const topSlope = (1 - colRatio) * (rtH * 0.21);
        const wx = rtX + colRatio * rtW;
        const wy = rtY + topSlope + win.r * rFloorH * (0.85 + colRatio * 0.22);
        if (wy > h * 0.73) return;

        const wWidth = (rtW / data.colsRight) * 0.68;
        const shimmer = 0.85 + 0.15 * Math.cos(elapsed * win.flickerSpeed + win.c);
        if (win.warm) {
          ctx.fillStyle = `rgba(255, 190, 110, ${win.brightness * shimmer * 0.8})`;
        } else {
          ctx.fillStyle = `rgba(130, 205, 255, ${win.brightness * shimmer * 0.78})`;
        }
        ctx.fillRect(wx, wy, wWidth, rFloorH * 0.55);
      });
      ctx.restore();

      // 4. LOWER CURVED PODIUM & "KNOWLEDGE PARK" NEON SIGN
      const podX = w * 0.39 + px * 0.5;
      const podY = h * 0.61 + py * 0.35;
      const podW = w * 0.44;
      const podH = h * 0.145;

      const podGrad = ctx.createLinearGradient(podX, podY, podX, podY + podH);
      podGrad.addColorStop(0, 'rgba(26, 48, 72, 0.92)');
      podGrad.addColorStop(0.45, 'rgba(15, 30, 48, 0.96)');
      podGrad.addColorStop(1, 'rgba(6, 13, 22, 0.98)');
      ctx.fillStyle = podGrad;
      ctx.beginPath();
      ctx.roundRect(podX, podY, podW, podH, [18, 18, 0, 0]);
      ctx.fill();

      // Podium subtle vertical ribs
      ctx.strokeStyle = 'rgba(120, 180, 230, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 18; i++) {
        const rx = podX + (podW / 18) * i;
        ctx.beginPath();
        ctx.moveTo(rx, podY + 4);
        ctx.lineTo(rx, podY + podH * 0.55);
        ctx.stroke();
      }

      // Glowing Cyan/White "KNOWLEDGE PARK" Architectural Sign
      const signX = w * 0.668 + px * 0.55;
      const signY = h * 0.768 + py * 0.35;
      ctx.save();
      ctx.font = `800 ${Math.max(11, Math.floor(w * 0.0115))}px "Inter", "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#e0f7ff';
      ctx.fillText('KNOWLEDGE  PARK', signX, signY);
      ctx.restore();

      // 5. WARM FAIRY-LIGHT STREET TREES & BLUE STREETLAMPS
      // Streetlamps cyan glow
      const streetLamps = [
        { x: 0.445, y: 0.455 },
        { x: 0.585, y: 0.575 },
      ];
      streetLamps.forEach((lamp) => {
        const lx = w * lamp.x + px * 0.55;
        const ly = h * lamp.y + py * 0.4;
        const lampGlow = ctx.createRadialGradient(lx, ly, 2, lx, ly, w * 0.06);
        lampGlow.addColorStop(0, 'rgba(220, 248, 255, 0.95)');
        lampGlow.addColorStop(0.2, 'rgba(56, 189, 248, 0.45)');
        lampGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lx, ly, w * 0.06, 0, Math.PI * 2);
        ctx.fill();
      });

      // Tree trunks & fairy lights
      data.fairyLights.forEach((fl) => {
        const fx = w * fl.x + px * 0.6;
        const fy = h * fl.y + py * 0.42;
        const twinkle = 0.65 + 0.35 * Math.sin(elapsed * 3.2 + fl.phase);
        ctx.fillStyle = fl.warm
          ? `rgba(255, 200, 115, ${0.85 * twinkle * bokehIntensity})`
          : `rgba(165, 225, 255, ${0.75 * twinkle * bokehIntensity})`;
        ctx.beginPath();
        ctx.arc(fx, fy, fl.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. WET RAIN-SLICKED PAVEMENT & REALISTIC REFLECTIONS
      const groundY = h * 0.755 + py * 0.35;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
      groundGrad.addColorStop(0, '#050c16');
      groundGrad.addColorStop(0.3, '#071322');
      groundGrad.addColorStop(1, '#02060c');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, w, h - groundY);

      // Vertical neon & amber reflections stretched across wet asphalt
      const reflections = [
        { x: 0.32, w: 0.14, color1: 'rgba(255, 145, 45, 0.28)', color2: 'rgba(56, 189, 248, 0.18)' },
        { x: 0.44, w: 0.09, color1: 'rgba(255, 180, 85, 0.34)', color2: 'rgba(255, 120, 30, 0.08)' },
        { x: 0.59, w: 0.12, color1: 'rgba(56, 189, 248, 0.30)', color2: 'rgba(255, 160, 70, 0.20)' },
        { x: 0.668, w: 0.11, color1: 'rgba(125, 225, 255, 0.32)', color2: 'rgba(30, 140, 220, 0.10)' },
        { x: 0.78, w: 0.12, color1: 'rgba(255, 160, 60, 0.26)', color2: 'rgba(56, 189, 248, 0.14)' },
      ];

      reflections.forEach((ref) => {
        const rx = w * ref.x + px * 0.55;
        const rw = w * ref.w;
        const refGrad = ctx.createLinearGradient(rx, groundY, rx, h);
        refGrad.addColorStop(0, ref.color1);
        refGrad.addColorStop(0.55, ref.color2);
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.fillRect(rx - rw * 0.5, groundY, rw, h - groundY);
      });

      // Mirrored upside-down "KNOWLEDGE PARK" reflection on wet pavement
      ctx.save();
      ctx.translate(signX, groundY + (groundY - signY) + 28);
      ctx.scale(1, -0.85);
      ctx.font = `800 ${Math.max(11, Math.floor(w * 0.0115))}px "Inter", "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(125, 220, 255, 0.28)';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
      ctx.shadowBlur = 10;
      ctx.fillText('KNOWLEDGE  PARK', 0, 0);
      ctx.restore();

      // Horizontal wet asphalt ripple streaks
      ctx.fillStyle = 'rgba(255, 185, 100, 0.14)';
      for (let i = 0; i < 65; i++) {
        const streakY = groundY + ((i * 19) % (h - groundY));
        const streakX = ((i * 173) % (w * 0.75)) + w * 0.15 + Math.sin(elapsed * 2 + i) * 6;
        const streakW = 14 + (i % 5) * 12;
        ctx.fillRect(streakX, streakY, streakW, 1.4);
      }

      // Puddle Ripples
      ctx.strokeStyle = 'rgba(140, 210, 255, 0.16)';
      ctx.lineWidth = 1;
      data.ripples.forEach((rep) => {
        rep.radius += rep.speed;
        if (rep.radius > rep.maxRadius) rep.radius = 1;
        const alpha = (1 - rep.radius / rep.maxRadius) * 0.25;
        ctx.strokeStyle = `rgba(170, 225, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(w * rep.x + px * 0.6, h * rep.y + py * 0.4, rep.radius, rep.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 7. LONE HOODED WAYFARER SILHOUETTE IN LONG DARK TRENCH COAT (CENTER FOREGROUND)
      const charX = w * 0.518 + px * 0.85;
      const charBottomY = h * 0.915 + py * 0.55;
      const charScale = Math.min(w / 1366, h / 768) * 1.05;
      const windSway = Math.sin(elapsed * 2.1) * 6 * charScale;

      ctx.save();
      ctx.translate(charX, charBottomY);
      ctx.scale(charScale, charScale);

      // Character dark shadow & reflection on wet ground
      const charShadow = ctx.createRadialGradient(0, 0, 8, 0, 12, 95);
      charShadow.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
      charShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
      charShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = charShadow;
      ctx.beginPath();
      ctx.ellipse(0, 4, 90, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Boots & Legs
      ctx.fillStyle = '#070b10';
      // Left leg & boot
      ctx.beginPath();
      ctx.moveTo(-26, -155);
      ctx.lineTo(-10, -155);
      ctx.lineTo(-14, -8);
      ctx.lineTo(-32, -2);
      ctx.lineTo(-30, -18);
      ctx.closePath();
      ctx.fill();

      // Right leg & boot
      ctx.beginPath();
      ctx.moveTo(6, -155);
      ctx.lineTo(22, -155);
      ctx.lineTo(24, -10);
      ctx.lineTo(38, -2);
      ctx.lineTo(10, -2);
      ctx.lineTo(8, -80);
      ctx.closePath();
      ctx.fill();

      // Billowing Long Tactical Trench Coat (with dramatic right-side wind flare like the reference)
      const coatGrad = ctx.createLinearGradient(-45, -310, 85, -70);
      coatGrad.addColorStop(0, '#0d1520');
      coatGrad.addColorStop(0.45, '#070b11');
      coatGrad.addColorStop(1, '#04070b');
      ctx.fillStyle = coatGrad;

      ctx.beginPath();
      ctx.moveTo(-34, -305); // Left shoulder
      ctx.lineTo(28, -305);  // Right shoulder
      ctx.lineTo(44, -225);  // Right waist
      // Dramatic flowing coat tail to the right
      ctx.quadraticCurveTo(82 + windSway * 0.6, -155, 118 + windSway, -96);
      ctx.lineTo(66 + windSway * 0.7, -75);
      ctx.lineTo(26 + windSway * 0.3, -110);
      ctx.lineTo(18, -90);
      ctx.lineTo(-4, -125); // Center split
      ctx.lineTo(-16, -92);
      ctx.lineTo(-36 + windSway * 0.2, -102);
      ctx.quadraticCurveTo(-40, -175, -36, -225);
      ctx.closePath();
      ctx.fill();

      // Coat folds & cyan/amber rim-lighting on coat edges
      ctx.strokeStyle = 'rgba(130, 200, 255, 0.32)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(28, -305);
      ctx.lineTo(46, -210);
      ctx.quadraticCurveTo(80 + windSway * 0.6, -152, 116 + windSway, -97);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 170, 90, 0.22)';
      ctx.beginPath();
      ctx.moveTo(-34, -305);
      ctx.lineTo(-48, -220);
      ctx.lineTo(-42, -185);
      ctx.stroke();

      // Left & Right Armored Arms
      ctx.fillStyle = '#090e15';
      // Left arm
      ctx.beginPath();
      ctx.moveTo(-34, -305);
      ctx.lineTo(-50, -240);
      ctx.lineTo(-44, -182);
      ctx.lineTo(-31, -182);
      ctx.lineTo(-33, -238);
      ctx.closePath();
      ctx.fill();

      // Right arm
      ctx.beginPath();
      ctx.moveTo(28, -305);
      ctx.lineTo(46, -242);
      ctx.lineTo(54, -186);
      ctx.lineTo(40, -184);
      ctx.lineTo(31, -236);
      ctx.closePath();
      ctx.fill();

      // Back Harness / Tactical Gear Details
      ctx.strokeStyle = 'rgba(70, 95, 120, 0.38)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-22, -302);
      ctx.lineTo(14, -235);
      ctx.moveTo(18, -302);
      ctx.lineTo(-16, -235);
      ctx.stroke();

      // Hood & Cowl
      const hoodGrad = ctx.createLinearGradient(-22, -365, 22, -305);
      hoodGrad.addColorStop(0, '#121d2b');
      hoodGrad.addColorStop(0.5, '#090e16');
      hoodGrad.addColorStop(1, '#05080d');
      ctx.fillStyle = hoodGrad;
      ctx.beginPath();
      ctx.moveTo(-24, -305);
      ctx.quadraticCurveTo(-22, -358, -2, -364);
      ctx.quadraticCurveTo(19, -358, 22, -305);
      ctx.closePath();
      ctx.fill();

      // Subtle cyan rim light on right edge of hood
      ctx.strokeStyle = 'rgba(155, 220, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, -364);
      ctx.quadraticCurveTo(18, -356, 21, -307);
      ctx.stroke();

      ctx.restore();

      // 8. ATMOSPHERIC RAIN STREAKS
      ctx.strokeStyle = 'rgba(185, 225, 255, 0.14)';
      ctx.lineWidth = 1;
      data.rainDrops.forEach((drop) => {
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.12;
        if (drop.y > 1) {
          drop.y = -0.05;
          drop.x = Math.random();
        }
        const rx = drop.x * w;
        const ry = drop.y * h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + drop.len * h);
        ctx.stroke();
      });

      // 9. LEFT & BOTTOM CINEMATIC VIGNETTE FOR MENU READABILITY
      const leftVig = ctx.createLinearGradient(0, 0, w * 0.46, 0);
      leftVig.addColorStop(0, 'rgba(1, 3, 7, 0.92)');
      leftVig.addColorStop(0.55, 'rgba(2, 6, 12, 0.58)');
      leftVig.addColorStop(1, 'rgba(2, 6, 12, 0)');
      ctx.fillStyle = leftVig;
      ctx.fillRect(0, 0, w * 0.46, h);

      const topBottomVig = ctx.createLinearGradient(0, 0, 0, h);
      topBottomVig.addColorStop(0, 'rgba(0, 2, 5, 0.65)');
      topBottomVig.addColorStop(0.18, 'rgba(0, 0, 0, 0)');
      topBottomVig.addColorStop(0.82, 'rgba(0, 0, 0, 0)');
      topBottomVig.addColorStop(1, 'rgba(0, 2, 5, 0.78)');
      ctx.fillStyle = topBottomVig;
      ctx.fillRect(0, 0, w, h);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateSize);
      if (resizeObs) resizeObs.disconnect();
    };
  }, [mousePos, bokehIntensity]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {customBgUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{
            backgroundImage: `url(${customBgUrl})`,
            transform: `scale(1.03) translate(${(mousePos.x - 0.5) * -14}px, ${(mousePos.y - 0.5) * -10}px)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent" />
        </div>
      )}
    </div>
  );
};

// ==========================================
// ORNATE SVG COMPONENTS (Exact match to image)
// ==========================================

// Glowing 4-Pointed Star Diamond Indicator next to active menu item
const ActiveStarIndicator = () => (
  <div className="relative flex items-center justify-center w-4 h-4 mr-2 shrink-0">
    {/* Outer warm flare */}
    <div className="absolute w-5 h-5 rounded-full bg-amber-300/35 blur-md animate-pulse" />
    {/* Horizontal & vertical light rays */}
    <div className="absolute w-5 h-[1.2px] bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
    <div className="absolute h-5 w-[1.2px] bg-gradient-to-b from-transparent via-amber-200 to-transparent" />
    {/* Crisp 4-point diamond star SVG */}
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 relative z-10 drop-shadow-[0_0_6px_rgba(255,220,130,0.95)]">
      <path
        d="M12 1 L14.8 9.2 L23 12 L14.8 14.8 L12 23 L9.2 14.8 L1 12 L9.2 9.2 Z"
        fill="#fffbeb"
        stroke="#f59e0b"
        strokeWidth="0.6"
      />
    </svg>
  </div>
);

// Ornate Divider under "TRY UR BEST" title
const TitleOrnateDivider = () => (
  <div className="flex items-center justify-center w-full max-w-[330px] my-2.5 select-none">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#c7a96b]/60 to-[#d4af37]/90" />
    <div className="mx-2 flex items-center space-x-1 text-[#dcb971]">
      <span className="w-1 h-1 rotate-45 bg-[#dcb971]/80 inline-block" />
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
      </svg>
      <span className="w-1 h-1 rotate-45 bg-[#dcb971]/80 inline-block" />
    </div>
    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#c7a96b]/60 to-[#d4af37]/90" />
  </div>
);

// Delicate Gold Filigree Dividers at the bottom-left of the menu list
const BottomGoldFiligree = () => (
  <div className="mt-7 space-y-7 pl-2 select-none opacity-85">
    {[0, 1].map((idx) => (
      <div key={idx} className="flex items-center w-44">
        <span className="w-1 h-1 rounded-full bg-[#c9a45c]" />
        <div className="h-[1px] flex-1 bg-gradient-to-r from-[#c9a45c]/70 via-[#e5c883] to-[#c9a45c]/70 relative flex items-center justify-center">
          <span className="w-1.5 h-1.5 rotate-45 border border-[#e5c883] bg-[#0a0f18]" />
        </div>
        <span className="w-1 h-1 rounded-full bg-[#c9a45c]" />
      </div>
    ))}
  </div>
);

// Top-Right Crest Shield Emblem ("Wayfarer Level 12")
const WayfarerCrestSVG = () => (
  <svg viewBox="0 0 48 54" className="w-9 h-10 shrink-0 drop-shadow-[0_2px_6px_rgba(212,175,55,0.35)]">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f6e29c" />
        <stop offset="50%" stopColor="#c99e46" />
        <stop offset="100%" stopColor="#7e5b1b" />
      </linearGradient>
    </defs>
    {/* Shield Outer */}
    <path
      d="M6 6 H42 V24 C42 37 24 47 24 49 C24 47 6 37 6 24 Z"
      fill="#0d131c"
      stroke="url(#goldGrad)"
      strokeWidth="2.2"
    />
    {/* Shield Inner Border */}
    <path
      d="M10 10 H38 V23 C38 33.5 24 42 24 44 C24 42 10 33.5 10 23 Z"
      fill="none"
      stroke="url(#goldGrad)"
      strokeWidth="0.9"
      strokeDasharray="2 1"
    />
    {/* Stylized Double-Winged Phoenix / Eagle Crest */}
    <path
      d="M24 14 L27 20 L34 16 L31 25 L35 29 L27 28 L24 37 L21 28 L13 29 L17 25 L14 16 L21 20 Z"
      fill="url(#goldGrad)"
    />
    <circle cx="24" cy="11.5" r="1.5" fill="#f6e29c" />
  </svg>
);

// Bottom-Right Ornate Compass Rose SVG inside "WELCOME, ADVENTURER" card
const CompassRoseSVG = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-20 h-20 shrink-0 text-[#d3ad5e] opacity-90 drop-shadow-[0_0_10px_rgba(211,173,94,0.25)] transition-transform duration-1000 group-hover:rotate-45"
  >
    <defs>
      <linearGradient id="compassGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5dfa0" />
        <stop offset="50%" stopColor="#c79c44" />
        <stop offset="100%" stopColor="#6e5015" />
      </linearGradient>
    </defs>
    {/* Outer & Inner Rings */}
    <circle cx="50" cy="50" r="36" fill="none" stroke="url(#compassGold)" strokeWidth="1.2" opacity="0.7" />
    <circle
      cx="50"
      cy="50"
      r="31"
      fill="none"
      stroke="url(#compassGold)"
      strokeWidth="0.8"
      strokeDasharray="3 2"
      opacity="0.65"
    />
    <circle cx="50" cy="50" r="14" fill="none" stroke="url(#compassGold)" strokeWidth="1" opacity="0.6" />

    {/* Minor Diagonal Points */}
    <g transform="rotate(45 50 50)">
      <polygon points="50,12 54,44 50,50 46,44" fill="url(#compassGold)" opacity="0.75" />
      <polygon points="50,88 54,56 50,50 46,56" fill="url(#compassGold)" opacity="0.75" />
      <polygon points="12,50 44,46 50,50 44,54" fill="url(#compassGold)" opacity="0.75" />
      <polygon points="88,50 56,46 50,50 56,54" fill="url(#compassGold)" opacity="0.75" />
    </g>

    {/* Major Cardinal Points */}
    <polygon points="50,4 55,43 50,50 45,43" fill="url(#compassGold)" />
    <polygon points="50,96 55,57 50,50 45,57" fill="url(#compassGold)" />
    <polygon points="4,50 43,45 50,50 43,55" fill="url(#compassGold)" />
    <polygon points="96,50 57,45 50,50 57,55" fill="url(#compassGold)" />

    {/* Center Gem */}
    <circle cx="50" cy="50" r="3.5" fill="#fff6d6" stroke="#b38728" strokeWidth="1" />
  </svg>
);

// ==========================================
// MAIN AAA GAME MENU APPLICATION
// ==========================================
export default function App({ onLaunchGame, onClose, isStandalone = false } = {}) {
  const menuItems = [
    { id: 'continue', label: 'CONTINUE', icon: Play },
    { id: 'new_game', label: 'NEW GAME', icon: PlusCircle },
    { id: 'load_game', label: 'LOAD GAME', icon: FolderOpen },
    { id: 'settings', label: 'SETTINGS', icon: Sliders },
    { id: 'photo_mode', label: 'PHOTO MODE', icon: Camera },
    { id: 'credits', label: 'CREDITS', icon: Award },
    { id: 'exit', label: 'EXIT TO DESKTOP', icon: LogOut },
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeModal, setActiveModal] = useState(null); // null | 'continue' | 'new_game' | 'load_game' | 'settings' | 'photo_mode' | 'credits' | 'exit'
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [soundMuted, setSoundMuted] = useState(false);
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [notification, setNotification] = useState(null);

  // Interactive Settings State
  const [settings, setSettings] = useState({
    resolution: '3840 x 2160 (4K UHD)',
    rayTracing: 'ULTRA (PATH TRACING)',
    dlss: 'QUALITY',
    bokehIntensity: 1,
    hudOpacity: 95,
    masterVolume: 85,
  });

  // Save Slots Data for "LOAD GAME"
  const [saveSlots, setSaveSlots] = useState([
    {
      id: 1,
      title: 'AUTOSAVE - KNOWLEDGE PARK PLAZA',
      chapter: 'Chapter IV: Echoes of the Spire',
      level: 'Level 12 Wayfarer',
      playtime: '34h 18m',
      timestamp: 'Today, 22:41',
      active: true,
    },
    {
      id: 2,
      title: 'MANUAL SAVE - CITADEL OVERLOOK',
      chapter: 'Chapter III: Neon Rain',
      level: 'Level 11 Wayfarer',
      playtime: '31h 05m',
      timestamp: 'Yesterday, 19:14',
      active: false,
    },
    {
      id: 3,
      title: 'MANUAL SAVE - OLD DISTRICT GATES',
      chapter: 'Chapter II: The Awakening',
      level: 'Level 8 Wayfarer',
      playtime: '19h 42m',
      timestamp: 'Oct 24, 01:12',
      active: false,
    },
  ]);

  const showToast = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Mouse Parallax Handler
  const handleMouseMove = (e) => {
    const rect = e.currentTarget ? e.currentTarget.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const x = (e.clientX - rect.left) / (rect.width || 1);
    const y = (e.clientY - rect.top) / (rect.height || 1);
    setMousePos({ x, y });
  };

  // Trigger Menu Item Action
  const handleTriggerItem = useCallback(
    (index) => {
      const item = menuItems[index];
      if (!item) return;
      sfx.playSelect();
      setActiveModal(item.id);
    },
    [menuItems]
  );

  // Full Keyboard Navigation (Up/Down/W/S/Enter/Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeModal) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          sfx.playBack();
          setActiveModal(null);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % menuItems.length;
          sfx.playHover();
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + menuItems.length) % menuItems.length;
          sfx.playHover();
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTriggerItem(selectedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        sfx.playBack();
        showToast('Press EXIT TO DESKTOP or select an option.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, selectedIndex, menuItems.length, handleTriggerItem, showToast]);

  const toggleMute = () => {
    sfx.muted = !soundMuted;
    setSoundMuted(!soundMuted);
  };

  const isPhotoMode = activeModal === 'photo_mode';

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-0 overflow-hidden bg-[#03070e] text-stone-100 select-none font-sans"
    >
      {/* Google Fonts Injection for authentic distressed title & classic serif UI typography */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Oswald:wght@700&display=swap');

        .aaa-title-distressed {
          font-family: 'Oswald', Impact, sans-serif;
          letter-spacing: 0.04em;
          background: linear-gradient(180deg, #ffffff 0%, #e6e9ef 48%, #b8c0cc 82%, #7d8796 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0px 6px 18px rgba(0, 0, 0, 0.92));
        }

        .aaa-serif {
          font-family: 'Cinzel', 'Cormorant Garamond', Georgia, serif;
        }

        .aaa-body-serif {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
      `}</style>

      {/* SVG Grunge Displacement Filter to give "TRY UR BEST" the exact weathered metallic texture */}
      <svg className="hidden">
        <defs>
          <filter id="grunge-roughness" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 1. ANIMATED PROCEDURAL NIGHT CITY & CHARACTER SCENE */}
      <ProceduralNightCityCanvas
        mousePos={mousePos}
        customBgUrl={customBgUrl}
        bokehIntensity={settings.bokehIntensity}
      />

      {/* 2. MAIN HUD OVERLAY (Hidden smoothly when inside Photo Mode) */}
      <div
        style={{ opacity: isPhotoMode ? 0 : settings.hudOpacity / 100 }}
        className={`relative z-10 w-full h-full flex flex-col justify-between p-2 sm:p-3 transition-all duration-500 overflow-hidden ${
          isPhotoMode ? 'pointer-events-none scale-105' : 'scale-100'
        }`}
      >
        {/* TOP BAR: Sound Toggle & Top-Right Player Profile Badge ("Wayfarer Level 12") */}
        <div className="flex items-start justify-between w-full shrink-0">
          {/* Subtle Audio/Custom BG Quick Bar */}
          <div className="flex items-center space-x-2 opacity-75 hover:opacity-100 transition-opacity">
            <button
              onClick={toggleMute}
              title={soundMuted ? 'Unmute UI Audio' : 'Mute UI Audio'}
              className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] text-stone-300 hover:border-[#d4af37]/60 hover:text-white transition cursor-pointer"
            >
              {soundMuted ? <VolumeX className="w-3 h-3 text-amber-400" /> : <Volume2 className="w-3 h-3 text-amber-400" />}
              <span className="aaa-serif tracking-wider text-[9px] uppercase">{soundMuted ? 'Muted' : 'SFX On'}</span>
            </button>
          </div>

          {/* TOP-RIGHT PLAYER BADGE */}
          <div
            onClick={() => {
              sfx.playSelect();
              showToast('Wayfarer Profile • 34h 18m Played • Knowledge Park District');
            }}
            className="cursor-pointer group flex items-center space-x-2 px-2.5 py-1 bg-gradient-to-r from-[#090d14]/90 via-[#0d131d]/90 to-[#090d14]/75 border border-white/10 hover:border-[#d4af37]/50 rounded-sm shadow-md backdrop-blur-md transition-all"
          >
            <WayfarerCrestSVG />
            <div className="flex flex-col pr-0.5">
              <span className="aaa-body-serif text-stone-100 font-semibold text-xs leading-tight tracking-wide group-hover:text-amber-200 transition-colors">
                Wayfarer
              </span>
              <span className="aaa-body-serif text-[#d4a953] text-[9px] tracking-wider font-medium">
                Level 12
              </span>
            </div>
          </div>
        </div>

        {/* CENTER-LEFT TITLE & MENU NAVIGATION */}
        <div className="flex flex-col justify-center my-auto max-w-xs pl-1 sm:pl-2">
          {/* DISTRESSED BLOCK TITLE: "TRY UR BEST" */}
          <div className="select-none">
            <h1
              style={{ filter: 'url(#grunge-roughness) drop-shadow(0 4px 12px rgba(0,0,0,0.95))' }}
              className="aaa-title-distressed text-xl sm:text-2xl font-bold uppercase leading-none tracking-tight"
            >
              TRY UR BEST
            </h1>

            {/* Ornate Center Star Line Divider */}
            <div className="my-0.5 scale-75 origin-left">
              <TitleOrnateDivider />
            </div>

            {/* Subtitle: "AN OPEN WORLD ADVENTURE" */}
            <p className="aaa-serif text-[#c7a667] text-[8.5px] sm:text-[9.5px] tracking-[0.2em] uppercase font-medium pl-0.5 mb-1 drop-shadow">
              AN OPEN WORLD ADVENTURE
            </p>
          </div>

          {/* VERTICAL MENU ITEMS */}
          <nav aria-label="Main Game Menu" className="flex flex-col space-y-0.5 w-full max-w-[220px] sm:max-w-[250px]">
            {menuItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={item.id}
                  onMouseEnter={() => {
                    if (selectedIndex !== idx) {
                      setSelectedIndex(idx);
                      sfx.playHover();
                    }
                  }}
                  onClick={() => handleTriggerItem(idx)}
                  className={`group relative flex items-center text-left py-0.5 px-2 transition-all duration-150 focus:outline-none cursor-pointer ${
                    isSelected ? 'pl-1.5' : 'pl-3.5 hover:pl-4'
                  }`}
                >
                  {/* Active Golden Horizontal Gradient Highlight Banner */}
                  {isSelected && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full bg-gradient-to-r from-[#d4a94e]/25 via-[#b58932]/12 to-transparent" />
                      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f3d285]/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#f3d285]/70 to-transparent" />
                    </div>
                  )}

                  {/* Glowing 4-Pointed Star Indicator */}
                  {isSelected && <ActiveStarIndicator />}

                  {/* Menu Item Text */}
                  <span
                    className={`aaa-serif relative z-10 text-[10.5px] sm:text-[11.5px] tracking-[0.12em] uppercase transition-all duration-150 ${
                      isSelected
                        ? 'text-[#fff8e7] font-semibold drop-shadow-[0_0_8px_rgba(255,215,130,0.6)]'
                        : 'text-stone-300/80 font-normal group-hover:text-stone-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Bottom-Left Delicate Gold Filigree Lines */}
          <div className="mt-0.5 scale-65 origin-left">
            <BottomGoldFiligree />
          </div>
        </div>

        {/* BOTTOM BAR: Welcome Adventurer Card & [ESC] Prompt */}
        <div className="flex items-end justify-between w-full mt-auto shrink-0 pt-1">
          <div className="text-[9px] text-stone-500 font-mono tracking-wider">
            [W/S/↑↓] NAVIGATE • [ENTER] SELECT
          </div>

          <div className="flex flex-col items-end space-y-1">
            {/* WELCOME, ADVENTURER CARD (shown on larger viewport heights) */}
            <div
              onClick={() => {
                sfx.playSelect();
                showToast('Thank you for playing Try Ur Best: Open World Edition!');
              }}
              className="group relative cursor-pointer hidden xl:flex items-center justify-between max-w-[260px] px-3 py-1.5 bg-gradient-to-r from-[#080d15]/95 via-[#0d1624]/90 to-[#111c2d]/90 border border-white/10 hover:border-[#d4af37]/45 rounded-sm shadow-md backdrop-blur-md transition-all"
            >
              <div className="flex flex-col pr-2 space-y-0.5">
                <h3 className="aaa-serif text-[#d8b162] text-[10px] tracking-[0.12em] uppercase font-semibold">
                  WELCOME, ADVENTURER
                </h3>
                <p className="aaa-body-serif text-stone-300/90 text-[11px] leading-snug">
                  Your legend begins now in Knowledge Park.
                </p>
              </div>
              <div className="shrink-0 w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity">
                <CompassRoseSVG />
              </div>
            </div>

            {/* [ESC] BACK PROMPT */}
            <button
              onClick={() => {
                sfx.playBack();
                if (activeModal) {
                  setActiveModal(null);
                } else {
                  showToast('Already at the Main Title Screen.');
                }
              }}
              className="group flex items-center space-x-1.5 text-stone-400 hover:text-white transition cursor-pointer pt-0.5"
            >
              <span className="px-1 py-0.2 text-[8px] font-medium tracking-wider uppercase bg-white/5 border border-stone-400/40 rounded-[2px] text-stone-300 group-hover:border-amber-300/70 group-hover:text-amber-200 transition">
                ESC
              </span>
              <span className="aaa-serif text-[9px] tracking-[0.16em] text-stone-400 group-hover:text-white uppercase">
                BACK
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PHOTO MODE FLOATING HUD */}
      {isPhotoMode && (
        <div className="absolute inset-x-0 bottom-4 z-40 flex flex-col items-center justify-center pointer-events-auto px-4 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-[#070c14]/90 border border-[#d4af37]/40 rounded-sm shadow-2xl backdrop-blur-md">
            <div className="flex items-center space-x-2 pr-3 border-r border-white/10">
              <Camera className="w-3.5 h-3.5 text-[#d8b162]" />
              <span className="aaa-serif text-[11px] tracking-[0.18em] text-[#f3dca2] uppercase">
                PHOTO MODE ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-stone-300">Move mouse to pan camera.</p>
            <button
              onClick={() => {
                sfx.playBack();
                setActiveModal(null);
              }}
              className="px-2.5 py-1 bg-[#d4af37]/20 hover:bg-[#d4af37]/35 border border-[#d4af37]/60 text-amber-200 text-[10px] aaa-serif tracking-widest uppercase transition cursor-pointer"
            >
              [ESC] Exit Photo Mode
            </button>
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE AAA SUB-MODALS (Continue, New Game, Load Game, Settings, Credits, Exit) */}
      {activeModal && !isPhotoMode && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0b1320]/95 to-[#060a12]/98 border border-[#d4af37]/40 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-6 sm:p-9 text-stone-100">
            {/* Top gold accent bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#f3d285] to-transparent" />

            {/* CONTINUE / NEW GAME MODAL */}
            {(activeModal === 'continue' || activeModal === 'new_game') && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="aaa-serif text-xl sm:text-2xl text-[#f3dca2] tracking-[0.18em] uppercase">
                      {activeModal === 'continue' ? 'RESUME CAMPAIGN' : 'BEGIN NEW ODYSSEY'}
                    </h2>
                    <p className="aaa-body-serif text-stone-400 text-base mt-0.5">
                      {activeModal === 'continue'
                        ? 'Continuing from Knowledge Park Plaza • Chapter IV'
                        : 'Select your starting difficulty and world seed'}
                    </p>
                  </div>
                  <WayfarerCrestSVG />
                </div>

                {activeModal === 'continue' ? (
                  <div className="bg-black/40 border border-white/10 p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="aaa-serif text-xs tracking-[0.2em] text-amber-400 uppercase">
                        ACTIVE CHECKPOINT
                      </span>
                      <span className="text-xs text-stone-400">Autosaved • Today 22:41</span>
                    </div>
                    <h3 className="aaa-serif text-lg text-white tracking-wider">
                      KNOWLEDGE PARK — RAIN-SLICKED PROMENADE
                    </h3>
                    <p className="aaa-body-serif text-stone-300 text-base leading-relaxed">
                      The syndicate signal leads toward the twin glass towers at the heart of Knowledge Park. Meet the informant before the midnight lockdown.
                    </p>
                    <div className="pt-2 flex items-center space-x-6 text-xs text-stone-400">
                      <span>Level 12 Wayfarer</span>
                      <span>•</span>
                      <span>Playtime: 34h 18m</span>
                      <span>•</span>
                      <span>World Completion: 68%</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {[
                      {
                        name: 'STORY WAYFARER',
                        desc: 'Focus on exploration, narrative choices, and cinematic combat.',
                      },
                      {
                        name: 'VETERAN STALKER',
                        desc: 'Balanced tactical encounters requiring stealth and reflexes.',
                      },
                      {
                        name: 'NIGHTMARE PROTOCOL',
                        desc: 'Lethal enemies, minimal HUD, and permadeath checkpoints.',
                      },
                    ].map((diff, i) => (
                      <div
                        key={diff.name}
                        onClick={() => {
                          sfx.playSelect();
                          setActiveModal(null);
                          showToast(`Starting New Game on ${diff.name} difficulty...`);
                        }}
                        className={`cursor-pointer p-4 border transition-all ${
                          i === 1
                            ? 'bg-[#d4af37]/15 border-[#d4af37]'
                            : 'bg-black/40 border-white/10 hover:border-[#d4af37]/60'
                        }`}
                      >
                        <h4 className="aaa-serif text-xs tracking-[0.16em] text-[#f3dca2] uppercase mb-2">
                          {diff.name}
                        </h4>
                        <p className="aaa-body-serif text-sm text-stone-300">{diff.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      sfx.playBack();
                      setActiveModal(null);
                    }}
                    className="px-5 py-2 border border-white/15 hover:border-white/40 text-xs aaa-serif tracking-[0.18em] uppercase text-stone-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      sfx.playSelect();
                      setActiveModal(null);
                      if (onLaunchGame) {
                        onLaunchGame(activeModal);
                      } else {
                        showToast(
                          activeModal === 'continue'
                            ? 'Loading Knowledge Park Sector...'
                            : 'Initializing New World Seed...'
                        );
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-[#c79d42] to-[#9e7522] hover:from-[#ddb558] hover:to-[#b58930] text-black font-semibold text-xs aaa-serif tracking-[0.2em] uppercase shadow-lg cursor-pointer"
                  >
                    {activeModal === 'continue' ? 'Launch Game' : 'Start Journey'}
                  </button>
                </div>
              </div>
            )}

            {/* LOAD GAME MODAL */}
            {activeModal === 'load_game' && (
              <div className="space-y-5">
                <div className="border-b border-white/10 pb-3">
                  <h2 className="aaa-serif text-xl text-[#f3dca2] tracking-[0.18em] uppercase">
                    LOAD CHRONICLE
                  </h2>
                  <p className="aaa-body-serif text-stone-400 text-base">
                    Select a saved memory slot to restore your timeline.
                  </p>
                </div>

                <div className="space-y-3">
                  {saveSlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => {
                        sfx.playSelect();
                        setSaveSlots((prev) => prev.map((s) => ({ ...s, active: s.id === slot.id })));
                      }}
                      className={`cursor-pointer p-4 border transition-all flex items-center justify-between ${
                        slot.active
                          ? 'bg-gradient-to-r from-[#d4af37]/20 to-transparent border-[#d4af37]/70'
                          : 'bg-black/40 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          {slot.active && <Check className="w-4 h-4 text-amber-400" />}
                          <span className="aaa-serif text-sm tracking-[0.14em] text-white uppercase">
                            {slot.title}
                          </span>
                        </div>
                        <p className="aaa-body-serif text-stone-300 text-sm">
                          {slot.chapter} • {slot.level}
                        </p>
                      </div>
                      <div className="text-right text-xs text-stone-400 space-y-1">
                        <div className="text-amber-300/90 font-medium">{slot.playtime}</div>
                        <div>{slot.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      sfx.playBack();
                      setActiveModal(null);
                    }}
                    className="px-5 py-2 border border-white/15 hover:border-white/40 text-xs aaa-serif tracking-[0.18em] uppercase text-stone-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const chosen = saveSlots.find((s) => s.active);
                      sfx.playSelect();
                      setActiveModal(null);
                      showToast(`Loaded: ${chosen?.title}`);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-[#c79d42] to-[#9e7522] text-black font-semibold text-xs aaa-serif tracking-[0.2em] uppercase"
                  >
                    Load Selected Slot
                  </button>
                </div>
              </div>
            )}

            {/* SETTINGS MODAL */}
            {activeModal === 'settings' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="aaa-serif text-xl text-[#f3dca2] tracking-[0.18em] uppercase">
                      SYSTEM & GRAPHICS SETTINGS
                    </h2>
                    <p className="aaa-body-serif text-stone-400 text-base">
                      Customize visual fidelity, audio synthesis, and custom background artwork.
                    </p>
                  </div>
                  <Sliders className="w-5 h-5 text-[#d4af37]" />
                </div>

                <div className="space-y-4 text-sm">
                  {/* City Bokeh & Fairy Light Brilliance */}
                  <div className="flex items-center justify-between bg-black/35 p-3.5 border border-white/5">
                    <div>
                      <div className="aaa-serif text-xs tracking-[0.15em] text-stone-200 uppercase">
                        CITY LIGHT & BOKEH INTENSITY
                      </div>
                      <div className="text-xs text-stone-400">
                        Adjusts the glow of Knowledge Park fairy lights and reflections
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.6"
                      step="0.1"
                      value={settings.bokehIntensity}
                      onChange={(e) =>
                        setSettings({ ...settings, bokehIntensity: parseFloat(e.target.value) })
                      }
                      className="w-36 accent-[#d4af37] cursor-pointer"
                    />
                  </div>

                  {/* HUD Opacity */}
                  <div className="flex items-center justify-between bg-black/35 p-3.5 border border-white/5">
                    <div>
                      <div className="aaa-serif text-xs tracking-[0.15em] text-stone-200 uppercase">
                        HUD INTERFACE OPACITY ({settings.hudOpacity}%)
                      </div>
                      <div className="text-xs text-stone-400">Transparency of the main menu overlay</div>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="5"
                      value={settings.hudOpacity}
                      onChange={(e) =>
                        setSettings({ ...settings, hudOpacity: parseInt(e.target.value, 10) })
                      }
                      className="w-36 accent-[#d4af37] cursor-pointer"
                    />
                  </div>

                  {/* Ray Tracing Preset */}
                  <div className="flex items-center justify-between bg-black/35 p-3.5 border border-white/5">
                    <span className="aaa-serif text-xs tracking-[0.15em] text-stone-200 uppercase">
                      RAY-TRACED PUDDLE REFLECTIONS
                    </span>
                    <select
                      value={settings.rayTracing}
                      onChange={(e) => setSettings({ ...settings, rayTracing: e.target.value })}
                      className="bg-[#0c1422] border border-[#d4af37]/40 px-3 py-1.5 text-xs aaa-serif tracking-wider text-amber-200 focus:outline-none"
                    >
                      <option>ULTRA (PATH TRACING)</option>
                      <option>HIGH (RAY TRACED)</option>
                      <option>MEDIUM (SCREEN SPACE)</option>
                    </select>
                  </div>

                  {/* Custom Background Image URL Override */}
                  <div className="bg-black/35 p-3.5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="aaa-serif text-xs tracking-[0.15em] text-amber-300 uppercase">
                        CUSTOM WALLPAPER URL (OPTIONAL)
                      </span>
                      {customBgUrl && (
                        <button
                          onClick={() => setCustomBgUrl('')}
                          className="flex items-center space-x-1 text-xs text-stone-400 hover:text-white"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset to Procedural Scene</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Paste any image URL to use as background (or leave empty for built-in animated scene)..."
                      value={customBgUrl}
                      onChange={(e) => setCustomBgUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 px-3 py-2 text-xs text-stone-200 focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      sfx.playSelect();
                      setActiveModal(null);
                      showToast('Graphics & Interface settings applied.');
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-[#c79d42] to-[#9e7522] text-black font-semibold text-xs aaa-serif tracking-[0.2em] uppercase"
                  >
                    Apply & Close
                  </button>
                </div>
              </div>
            )}

            {/* CREDITS MODAL */}
            {activeModal === 'credits' && (
              <div className="space-y-6 text-center py-4">
                <TitleOrnateDivider />
                <h2 className="aaa-title-distressed text-4xl uppercase">TRY UR BEST</h2>
                <p className="aaa-serif text-xs tracking-[0.28em] text-[#d4af37] uppercase">
                  AN OPEN WORLD ADVENTURE
                </p>
                <div className="space-y-3 aaa-body-serif text-stone-300 text-base max-w-md mx-auto">
                  <p>
                    <strong className="text-amber-200">World Architecture & Direction:</strong> Knowledge Park Interactive Studios
                  </p>
                  <p>
                    <strong className="text-amber-200">Lead UI & Atmospheric Engineering:</strong> Crafted in React & HTML5 Procedural Canvas
                  </p>
                  <p>
                    <strong className="text-amber-200">Special Thanks:</strong> To every Wayfarer exploring the rain-lit streets.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      sfx.playBack();
                      setActiveModal(null);
                    }}
                    className="px-6 py-2 border border-[#d4af37]/60 text-xs aaa-serif tracking-[0.2em] text-amber-200 uppercase hover:bg-[#d4af37]/20"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            )}

            {/* EXIT TO DESKTOP MODAL */}
            {activeModal === 'exit' && (
              <div className="space-y-6 text-center py-3">
                <h2 className="aaa-serif text-xl text-[#f3dca2] tracking-[0.2em] uppercase">
                  EXIT TO DESKTOP?
                </h2>
                <p className="aaa-body-serif text-stone-300 text-base max-w-md mx-auto">
                  Any unsaved progress since your last checkpoint at Knowledge Park Plaza will be lost. Are you sure you wish to depart?
                </p>
                <div className="flex justify-center space-x-4 pt-2">
                  <button
                    onClick={() => {
                      sfx.playBack();
                      setActiveModal(null);
                    }}
                    className="px-6 py-2 border border-white/20 hover:border-white/50 text-xs aaa-serif tracking-[0.18em] uppercase text-stone-200"
                  >
                    Stay in World
                  </button>
                  <button
                    onClick={() => {
                      sfx.playSelect();
                      setActiveModal(null);
                      if (onClose) {
                        onClose();
                      } else {
                        showToast('Session closed safely. See you next time, Wayfarer.');
                      }
                    }}
                    className="px-6 py-2 bg-red-900/80 hover:bg-red-800 border border-red-400/50 text-xs aaa-serif tracking-[0.18em] uppercase text-red-100 cursor-pointer"
                  >
                    Confirm Exit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CINEMATIC TOAST NOTIFICATION BANNER */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 px-4 py-2 bg-[#09101b]/95 border border-[#d4af37]/60 shadow-[0_10px_30px_rgba(0,0,0,0.9)] backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-[#f3d285]" />
          <span className="aaa-serif text-xs tracking-[0.16em] text-amber-100 uppercase">
            {notification}
          </span>
        </div>
      )}
    </div>
  );
}