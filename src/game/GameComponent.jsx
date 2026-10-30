import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, Html } from '@react-three/drei';

const s = (f = 440, t = 'sine', d = 0.1) => {
  try {
    const C = window.__ac || (window.__ac = new (window.AudioContext || window.webkitAudioContext)());
    const o = C.createOscillator(), g = C.createGain();
    o.type = t;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.09, C.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, C.currentTime + d);
    o.connect(g);
    g.connect(C.destination);
    o.start();
    o.stop(C.currentTime + d);
  } catch (e) {}
};

function Button3D({ position, text, onClick, color = '#b91c1c', hoverColor = '#dc2626', width = 4.4, height = 0.82 }) {
  const [hov, sHov] = useState(false);
  const [prs, sPrs] = useState(false);
  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); sHov(true); if (typeof document !== 'undefined') document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); sHov(false); sPrs(false); if (typeof document !== 'undefined') document.body.style.cursor = 'default'; }}
      onPointerDown={(e) => { e.stopPropagation(); sPrs(true); }}
      onPointerUp={(e) => { e.stopPropagation(); sPrs(false); onClick?.(); }}
    >
      <mesh position={[0, 0, prs ? -0.06 : 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.22]} />
        <meshStandardMaterial
          color={hov ? hoverColor : color}
          emissive={hov ? hoverColor : '#1e1b4b'}
          emissiveIntensity={hov ? 0.75 : 0.25}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
      <Text position={[0, 0, prs ? 0.08 : 0.15]} fontSize={height * 0.44} color="#ffffff" anchorX="center" anchorY="middle">
        {text}
      </Text>
    </group>
  );
}

export default function GameComponent() {
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'controls' | 'playing' | 'gameover'
  const P = useRef(), A = useRef(), E = useRef([]), PT = useRef(), hb = useRef(), sb = useRef(), ht = useRef(), vg = useRef(), ms = useRef(), K = useRef({});
  const G = useRef({ hp: 100, st: 100, x: 0, z: 6, f: 0, vx: 0, vz: 0, at: 0, cd: 0, hv: 0, hit: 1, cb: 0, cbt: 0, k: 0, w: 1, ifr: 0, pt: 0, pcd: 0, dcd: 0, ct: 0, gcd: 0, vg: 0, en: [], l: 0, h: 0, d: 0, p: 0 });

  const startDuel = () => {
    s(220, 'triangle', 0.2);
    s(880, 'sawtooth', 0.35);
    setGameState('playing');
    wave(1);
  };

  const wave = (w) => {
    const g = G.current;
    g.w = w;
    const n = Math.min(3 + w * 2, 10);
    g.en = Array.from({ length: 10 }, (_, i) => {
      const kd = i % 7 === 6 ? 2 : i % 5 === 4 ? 1 : 0;
      return {
        on: i < n,
        kd,
        hp: kd === 1 ? 85 : kd === 2 ? 70 : 45,
        x: Math.sin((i / Math.max(1, n)) * 6.28) * 14,
        z: Math.cos((i / Math.max(1, n)) * 6.28) * 14 - 4,
        vx: 0,
        vz: 0,
        cd: 1 + Math.random(),
        sg: 0,
        dead: 0
      };
    });
    if (ms.current) ms.current.textContent = `🌸 WAVE ${w} — DRAW YOUR KATANA`;
    s(150, 'sawtooth', 0.25);
  };

  const rst = () => {
    const g = G.current;
    g.hp = 100; g.st = 100; g.x = 0; g.z = 6; g.k = 0; g.cb = 0; g.vx = 0; g.vz = 0;
    startDuel();
  };

  useEffect(() => {
    const dn = (e) => {
      K.current[e.code] = 1;
      if (gameState === 'menu') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          startDuel();
        }
        return;
      }
      if (gameState === 'controls') {
        if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          setGameState('menu');
        }
        return;
      }
      if (gameState === 'gameover') {
        if (e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          rst();
        }
        return;
      }
      if (e.code === 'KeyJ') G.current.l = 1;
      if (e.code === 'KeyK') G.current.h = 1;
      if (e.code === 'Space') { G.current.d = 1; e.preventDefault(); }
      if (e.code === 'KeyF') G.current.p = 1;
      if (e.code === 'KeyR') rst();
    };
    const up = (e) => { K.current[e.code] = 0; };
    const md = (e) => {
      if (gameState !== 'playing') return;
      if (e.button === 0) G.current.l = 1;
      if (e.button === 2) G.current.h = 1;
    };
    const cm = (e) => e.preventDefault();
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    window.addEventListener('mousedown', md);
    window.addEventListener('contextmenu', cm);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousedown', md);
      window.removeEventListener('contextmenu', cm);
    };
  }, [gameState]);

  useFrame((st, dt0) => {
    const dt = Math.min(dt0, 0.033), g = G.current, t = st.clock.elapsedTime;

    // Atmospheric falling sakura petals
    if (PT.current) {
      PT.current.children.forEach((p, i) => {
        p.position.y -= dt * (0.6 + (i % 3) * 0.2);
        p.rotation.x += dt * 2;
        p.rotation.z += dt;
        if (p.position.y < 0.1) {
          p.position.y = 7 + Math.random() * 3;
          p.position.x = g.x + (Math.random() - 0.5) * 32;
          p.position.z = g.z + (Math.random() - 0.5) * 32;
        }
      });
    }

    // MENU CAMERA: Majestic slow cinematic pan around the Torii gate and samurai
    if (gameState === 'menu' || gameState === 'controls') {
      const camT = t * 0.25;
      st.camera.position.set(Math.sin(camT) * 10, 5.2, 8 + Math.cos(camT) * 5);
      st.camera.lookAt(0, 2.5, 0);
      return;
    }

    // GAMEOVER CAMERA: Dramatic slow orbit
    if (gameState === 'gameover') {
      const camT = t * 0.2;
      st.camera.position.set(Math.sin(camT) * 9, 5.5, 9 + Math.cos(camT) * 5);
      st.camera.lookAt(0, 2.5, 0);
      return;
    }

    // COMBAT UPDATE LOOP
    g.cd -= dt; g.ifr -= dt; g.pt -= dt; g.pcd -= dt; g.dcd -= dt; g.cbt -= dt; g.ct -= dt; g.gcd -= dt;
    g.vg = Math.max(0, g.vg - dt);
    if (g.cbt <= 0) g.cb = 0;

    let mx = (K.current.KeyD || K.current.ArrowRight ? 1 : 0) - (K.current.KeyA || K.current.ArrowLeft ? 1 : 0);
    let mz = (K.current.KeyS || K.current.ArrowDown ? 1 : 0) - (K.current.KeyW || K.current.ArrowUp ? 1 : 0);
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml; mz /= ml;
    const blk = K.current.ShiftLeft || K.current.ShiftRight;

    if (g.d) {
      g.d = 0;
      if (g.st >= 22 && g.dcd <= 0) {
        g.st -= 22; g.dcd = 0.45; g.ifr = 0.38;
        g.vx += Math.sin(g.f) * 13; g.vz += Math.cos(g.f) * 13;
        s(320, 'sine', 0.12);
      }
    }
    if (g.p) {
      g.p = 0;
      if (g.pcd <= 0) {
        g.pt = 0.32; g.pcd = 0.65;
        s(760, 'square', 0.1);
      }
    }
    const atk = (hv) => {
      if (g.cd > 0 || (hv && g.st < 15)) return;
      g.st -= hv ? 15 : 4; g.hv = hv; g.at = hv ? 0.42 : 0.26; g.cd = hv ? 0.58 : 0.29; g.hit = 0;
      s(hv ? 130 : 520, hv ? 'sawtooth' : 'triangle', 0.12);
    };
    if (g.l) { g.l = 0; atk(0); }
    if (g.h) { g.h = 0; atk(1); }

    if (mx || mz) {
      g.f = Math.atan2(mx, mz);
      g.x += mx * (blk ? 2.1 : 5.6) * dt;
      g.z += mz * (blk ? 2.1 : 5.6) * dt;
    }
    g.x += g.vx * dt; g.z += g.vz * dt;
    g.vx *= 0.88; g.vz *= 0.88;
    g.st = Math.min(100, g.st + dt * 13);
    const pr = Math.hypot(g.x, g.z);
    if (pr > 24) { g.x *= 24 / pr; g.z *= 24 / pr; }

    if (P.current) {
      P.current.position.set(g.x, Math.abs(Math.sin(t * 8)) * 0.06 * (mx || mz ? 1 : 0), g.z);
      P.current.rotation.y = g.f;
    }
    if (A.current) {
      A.current.rotation.x = g.at > 0 ? -Math.sin((1 - g.at / (g.hv ? 0.42 : 0.26)) * 3.14) * 1.7 : -0.25;
    }

    if (g.at > 0) {
      g.at -= dt;
      if (!g.hit && g.at < (g.hv ? 0.26 : 0.15)) {
        g.hit = 1;
        g.en.forEach((e) => {
          if (!e.on || e.dead > 0) return;
          const dx = e.x - g.x, dz = e.z - g.z, d = Math.hypot(dx, dz);
          const ad = Math.abs(((Math.atan2(dx, dz) - g.f + 9.42) % 6.28) - 3.14);
          if (d < (g.hv ? 3.1 : 2.7) && ad < 1.35) {
            let dm = g.hv ? 34 : (g.cb % 3 === 2 ? 26 : 17);
            if (g.ct > 0) { dm *= 1.9; g.ct = 0; s(980, 'square', 0.2); }
            e.hp -= dm; e.sg = g.hv ? 1 : 0.45;
            e.vx = (dx / (d || 1)) * (g.hv ? 9 : 5); e.vz = (dz / (d || 1)) * (g.hv ? 9 : 5);
            s(190, 'square', 0.08);
            if (e.hp <= 0) { e.dead = 0.85; g.k++; s(85, 'square', 0.3); }
          }
        });
        g.cb++; g.cbt = 2;
      }
    }

    let alive = 0;
    g.en.forEach((e, i) => {
      const m = E.current[i];
      if (!m) return;
      if (!e.on) { m.visible = false; return; }
      alive++;
      m.visible = true;
      if (e.dead > 0) {
        e.dead -= dt;
        m.rotation.x = -1.5 * (1 - Math.max(0, e.dead / 0.85));
        m.position.set(e.x, 0.25, e.z);
        if (e.dead <= 0) e.on = false;
        return;
      }
      m.rotation.x = 0; e.cd -= dt;
      e.x += e.vx * dt; e.z += e.vz * dt;
      e.vx *= 0.85; e.vz *= 0.85;
      const dx = g.x - e.x, dz = g.z - e.z, d = Math.hypot(dx, dz) || 1;
      if (e.sg > 0) {
        e.sg -= dt;
      } else if (d > 1.9) {
        const sp = e.kd === 1 ? 2 : (e.kd === 2 ? 2.6 : 3.3);
        e.x += (dx / d) * sp * dt; e.z += (dz / d) * sp * dt;
      } else if (e.cd <= 0 && g.gcd <= 0) {
        e.cd = e.kd === 1 ? 1.7 : 1.15; g.gcd = 0.4;
        if (g.ifr > 0) {
        } else if (g.pt > 0) {
          e.sg = 1.3; g.ct = 2; g.st = Math.min(100, g.st + 18);
          s(950, 'square', 0.18);
          if (ms.current) ms.current.textContent = '⚡ PERFECT PARRY! COUNTER READY';
        } else {
          let dm = e.kd === 1 ? 14 : (e.kd === 2 ? 10 : 8);
          if (blk) { dm = Math.ceil(dm * 0.25); g.st = Math.max(0, g.st - 9); s(170, 'square', 0.1); }
          g.hp -= dm; g.vg = 0.55; s(105, 'square', 0.16);
          if (g.hp <= 0) {
            s(70, 'sawtooth', 0.5);
            setGameState('gameover');
          }
        }
      }
      m.position.set(e.x, 0, e.z);
      m.rotation.y = Math.atan2(dx, dz);
    });

    if (g.en.length && alive === 0) wave(g.w + 1);

    if (hb.current) hb.current.style.width = `${Math.max(0, g.hp)}%`;
    if (sb.current) sb.current.style.width = `${g.st}%`;
    if (vg.current) vg.current.style.opacity = g.vg;
    if (ht.current) ht.current.textContent = `❤ ${Math.max(0, Math.round(g.hp))}  Wave ${g.w}  Kills ${g.k}  Combo x${g.cb}${g.ct > 0 ? '  ⚡COUNTER!' : ''}${blk ? '  🛡 BLOCKING' : ''}`;

    st.camera.position.set(g.x * 0.55, 10.5, g.z * 0.55 + 12);
    st.camera.lookAt(g.x * 0.8, 0, g.z * 0.8);
  });

  return (
    <group>
      <color attach="background" args={['#87a8c8']} />
      <fog attach="fog" args={['#c7d7e8', 22, 54]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 16, 7]} intensity={1.7} castShadow />

      {/* Arena Ground & Boundary */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[62, 62]} />
        <meshStandardMaterial color="#3f6212" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[16, 32]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[15.6, 16, 32]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>

      {/* Torii Gate */}
      <group position={[0, 0, -15]}>
        <mesh position={[-3, 2.5, 0]} castShadow><cylinderGeometry args={[0.35, 0.4, 5, 10]} /><meshStandardMaterial color="#b91c1c" /></mesh>
        <mesh position={[3, 2.5, 0]} castShadow><cylinderGeometry args={[0.35, 0.4, 5, 10]} /><meshStandardMaterial color="#b91c1c" /></mesh>
        <mesh position={[0, 5.1, 0]} castShadow><boxGeometry args={[8.5, 0.6, 1]} /><meshStandardMaterial color="#991b1b" /></mesh>
        <mesh position={[0, 4.2, 0]}><boxGeometry args={[6, 0.45, 0.8]} /><meshStandardMaterial color="#991b1b" /></mesh>
      </group>

      {/* Cherry Blossom Trees */}
      {[[-11, -9], [11, -10], [-12, 7], [12, 8], [-7, -13], [8, 13]].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.22, 0.32, 2.8, 8]} /><meshStandardMaterial color="#57534e" /></mesh>
          <mesh position={[0, 3.4, 0]} castShadow><sphereGeometry args={[1.9, 12, 10]} /><meshStandardMaterial color={i % 2 ? '#f9a8d4' : '#f472b6'} /></mesh>
          <mesh position={[1, 2.9, 0.5]}><sphereGeometry args={[1.2, 10, 8]} /><meshStandardMaterial color="#fbcfe8" /></mesh>
        </group>
      ))}

      {/* Bamboo Shoots */}
      {[[-6, -6], [6, -7], [-5, 5], [7, 4], [0, -9]].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[j * 0.35 - 0.35, 1.5, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 3, 6]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Zen Rocks */}
      {[[-9, 0], [9, -3], [-3, 11], [4, -12]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.4, p[1]]} castShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}

      {/* Falling Sakura Petals */}
      <group ref={PT}>
        {Array.from({ length: 28 }).map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * 30, 4 + Math.random() * 5, (Math.random() - 0.5) * 30]}>
            <planeGeometry args={[0.22, 0.14]} />
            <meshStandardMaterial color="#fda4af" side={2} />
          </mesh>
        ))}
      </group>

      {/* Samurai Player */}
      <group ref={P} position={[0, 0, 6]}>
        <mesh position={[0, 1, 0]} castShadow><capsuleGeometry args={[0.5, 1, 4, 10]} /><meshStandardMaterial color="#1e3a5f" /></mesh>
        <mesh position={[0, 1.95, 0]}><sphereGeometry args={[0.34, 12, 12]} /><meshStandardMaterial color="#fcd34d" /></mesh>
        <mesh position={[0, 2.22, 0]}><coneGeometry args={[0.62, 0.28, 12]} /><meshStandardMaterial color="#d6b25e" /></mesh>
        <mesh position={[0, 1.25, 0.28]}><boxGeometry args={[0.72, 0.18, 0.1]} /><meshStandardMaterial color="#dc2626" /></mesh>
        <group ref={A} position={[0.62, 1.45, 0]}>
          <mesh position={[0, -0.15, 0.75]} castShadow><boxGeometry args={[0.1, 0.14, 1.6]} /><meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.15} /></mesh>
          <mesh position={[0, -0.15, -0.05]}><boxGeometry args={[0.16, 0.2, 0.22]} /><meshStandardMaterial color="#111827" /></mesh>
        </group>
        {/* Overhead Status Indicator: Directly locked to model position everywhere it moves */}
        <Html position={[0, 2.7, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}>
            <span style={{ color: '#fbcfe8' }}>SAMURAI</span>
            <div style={{ width: 45, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#22c55e', width: '100%' }} />
            </div>
          </div>
        </Html>
      </group>

      {/* Enemy Bandits */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} ref={(e) => { E.current[i] = e; }}>
          <mesh position={[0, 1, 0]} castShadow><capsuleGeometry args={[0.46, 1, 4, 8]} /><meshStandardMaterial color={i % 7 === 6 ? '#d97706' : i % 5 === 4 ? '#7c3aed' : '#991b1b'} /></mesh>
          <mesh position={[0, 1.88, 0]}><sphereGeometry args={[0.32, 12, 12]} /><meshStandardMaterial color="#fca5a5" /></mesh>
          <mesh position={[0, 2.12, 0]}><coneGeometry args={[0.42, 0.35, 8]} /><meshStandardMaterial color="#374151" metalness={0.6} /></mesh>
          <mesh position={[0.55, 1.3, 0.4]} rotation={[0.6, 0, 0]}><boxGeometry args={[0.08, 0.08, 1.7]} /><meshStandardMaterial color="#d6d3d1" /></mesh>
        </group>
      ))}

      {/* ========================================================================= */}
      {/* 🌸 TRUE 3D BILLBOARD TITLE & START MENU (PURE 3D WEBGL — ZERO HTML CUTOFFS) */}
      {/* ========================================================================= */}
      {gameState === 'menu' && (
        <Billboard follow={true} position={[0, 3.8, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[11, 5.8]} />
            <meshStandardMaterial color="#020617" transparent opacity={0.88} roughness={0.25} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[11.15, 5.95]} />
            <meshBasicMaterial color="#eab308" wireframe />
          </mesh>
          <Text position={[0, 1.9, 0.05]} fontSize={0.34} color="#f472b6" letterSpacing={0.2} anchorX="center" anchorY="middle">
            🌸 GHOST OF TSUSHIMA 🌸
          </Text>
          <Text position={[0, 1.15, 0.05]} fontSize={1.05} color="#fef08a" outlineWidth={0.07} outlineColor="#991b1b" anchorX="center" anchorY="middle">
            SAMURAI DUEL
          </Text>
          <Text position={[0, 0.45, 0.05]} fontSize={0.3} color="#cbd5e1" anchorX="center" anchorY="middle">
            The Way of the Ghost · Blade of Honor
          </Text>
          <Button3D position={[0, -0.5, 0.1]} text="⚔️ ENTER DUEL (SPACE)" onClick={startDuel} width={4.8} color="#b91c1c" hoverColor="#dc2626" />
          <Button3D position={[0, -1.5, 0.1]} text="📜 HOW TO PLAY" onClick={() => setGameState('controls')} width={4.8} color="#1e293b" hoverColor="#334155" />
        </Billboard>
      )}

      {/* ========================================================================= */}
      {/* 📜 TRUE 3D CONTROLS GUIDE (PURE 3D BILLBOARD IN WEBGL) */}
      {/* ========================================================================= */}
      {gameState === 'controls' && (
        <Billboard follow={true} position={[0, 3.8, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[12, 6.8]} />
            <meshStandardMaterial color="#020617" transparent opacity={0.93} roughness={0.25} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[12.15, 6.95]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
          <Text position={[0, 2.4, 0.05]} fontSize={0.65} color="#fef08a" outlineWidth={0.05} outlineColor="#0369a1" anchorX="center" anchorY="middle">
            SAMURAI COMBAT STANCES
          </Text>
          <Text position={[0, 1.6, 0.05]} fontSize={0.32} color="#ffffff" anchorX="center" anchorY="middle">
            WASD / Arrows: Move & Steer Samurai
          </Text>
          <Text position={[0, 1.05, 0.05]} fontSize={0.32} color="#f472b6" anchorX="center" anchorY="middle">
            J / Left Click: Light Katana Slash
          </Text>
          <Text position={[0, 0.5, 0.05]} fontSize={0.32} color="#fb923c" anchorX="center" anchorY="middle">
            K / Right Click: Heavy Armor-Breaker Strike
          </Text>
          <Text position={[0, -0.05, 0.05]} fontSize={0.32} color="#a78bfa" anchorX="center" anchorY="middle">
            Spacebar: Quick Dodge Roll
          </Text>
          <Text position={[0, -0.6, 0.05]} fontSize={0.32} color="#34d399" anchorX="center" anchorY="middle">
            Shift: Hold to Block Attacks
          </Text>
          <Text position={[0, -1.15, 0.05]} fontSize={0.32} color="#facc15" anchorX="center" anchorY="middle">
            F Key: Perfect Timed Parry & Counter-Stun
          </Text>
          <Button3D position={[0, -2.15, 0.1]} text="← BACK TO MENU (ESC)" onClick={() => setGameState('menu')} width={4.2} color="#2563eb" hoverColor="#3b82f6" />
        </Billboard>
      )}

      {/* ========================================================================= */}
      {/* 💀 TRUE 3D GAME OVER BILLBOARD (PURE 3D WEBGL — ZERO CUTOFFS) */}
      {/* ========================================================================= */}
      {gameState === 'gameover' && (
        <Billboard follow={true} position={[0, 3.8, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[11, 5.2]} />
            <meshStandardMaterial color="#020617" transparent opacity={0.92} roughness={0.25} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[11.15, 5.35]} />
            <meshBasicMaterial color="#ef4444" wireframe />
          </mesh>
          <Text position={[0, 1.45, 0.05]} fontSize={0.95} color="#ef4444" outlineWidth={0.07} outlineColor="#450a0a" anchorX="center" anchorY="middle">
            FALLEN IN HONOR
          </Text>
          <Text position={[0, 0.65, 0.05]} fontSize={0.34} color="#fef08a" anchorX="center" anchorY="middle">
            {`WAVE ${G.current.w}  ·  KILLS ${G.current.k}  ·  COMBO x${G.current.cb}`}
          </Text>
          <Button3D position={[-2.3, -0.7, 0.1]} text="↺ RETRY DUEL (R)" onClick={rst} width={4.2} color="#b91c1c" hoverColor="#dc2626" />
          <Button3D position={[2.3, -0.7, 0.1]} text="TITLE MENU" onClick={() => setGameState('menu')} width={4.0} color="#1e293b" hoverColor="#334155" />
        </Billboard>
      )}

      {/* ========================================================================= */}
      {/* 🎮 SLEEK CINEMATIC HUD (DOCKED AT BOTTOM-CENTER ON ARENA FLOOR — FIXED VIEWPORT) */}
      {/* ========================================================================= */}
      <Html fullscreen calculatePosition={() => [0, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={vg} style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px rgba(220,0,0,.95)', opacity: 0, transition: 'opacity .1s' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.88)',
            padding: '10px 18px',
            borderRadius: 14,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            zIndex: 40,
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 260
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1.5, color: '#fbcfe8', textAlign: 'center' }}>
            TSUSHIMA SAMURAI DUEL
          </div>
          <div ref={ht} style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: '#e2e8f0', textAlign: 'center' }}>
            ♥ 100 Wave 1 Kills 0 Combo x0
          </div>
          <div style={{ width: 230, height: 7, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
            <div ref={hb} style={{ height: '100%', background: '#22c55e', width: '100%', transition: 'width 0.15s ease' }} />
          </div>
          <div style={{ width: 230, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden', marginTop: 3 }}>
            <div ref={sb} style={{ height: '100%', background: '#38bdf8', width: '100%', transition: 'width 0.15s ease' }} />
          </div>
          <div ref={ms} style={{ color: '#fde68a', fontWeight: 700, marginTop: 5, fontSize: 11, textAlign: 'center' }}>
            🌸 WAVE 1 — DRAW YOUR KATANA
          </div>
        </div>
      </Html>
    </group>
  );
}
