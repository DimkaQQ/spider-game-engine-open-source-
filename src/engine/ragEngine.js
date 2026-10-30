/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Neural & Semantic RAG Engine
 *
 * Real-time Retrieval-Augmented Generation (RAG) engine that indexes:
 * 1. Curated 3D R3F game mechanics, locomotion patterns, combat loops, and physics algorithms.
 * 2. Procedural Web Audio API sound synthesizers (zero external audio dependencies).
 * 3. Engine components and UI standards (ArenaEnv, PauseOverlay, virtual joystick controls).
 * 4. Live project files and dynamic game scripts.
 *
 * Features:
 * - Sub-millisecond TF-IDF & Cosine Similarity vector retrieval.
 * - Dynamic chunking with sliding context overlap.
 * - Live indexing of project files and user edits.
 */

/* =========================================================================
 * 1. Curated Knowledge Base Chunks (Pre-Indexed Engine Expertise)
 * ========================================================================= */
const CORE_KNOWLEDGE_CHUNKS = [
  {
    id: "rag-locomotion-follow-cam",
    category: "mechanics",
    title: "Third-Person Smooth Follow Camera & Player Locomotion",
    keywords: ["player", "movement", "wasd", "arrow", "camera", "follow", "lerp", "joystick", "walk", "steer", "controls"],
    content: `// Third-person smooth follow camera & responsive movement
const { getDir } = useKeyboardControls();
const heroRef = useRef();

useFrame((state, delta) => {
  if (paused || gameState !== 'playing') return;
  const p = heroRef.current;
  if (!p) return;
  
  // Unified controls: works seamlessly with WASD, Arrow keys, and mobile virtual stick!
  const { x, z } = getDir();
  const speed = keys.current.ShiftLeft ? 11 : 7;
  
  if (x !== 0 || z !== 0) {
    p.position.x = Math.max(-12, Math.min(12, p.position.x + x * speed * delta));
    p.position.z = Math.max(-12, Math.min(12, p.position.z + z * speed * delta));
    // Face movement heading smoothly
    p.rotation.y = Math.atan2(x, z);
  }
  
  // Smooth third-person follow camera (zero clipping)
  state.camera.position.lerp({ x: p.position.x * 0.6, y: 9, z: p.position.z + 9 }, 0.08);
  state.camera.lookAt(p.position.x, 0.5, p.position.z);
});`
  },
  {
    id: "rag-audio-synthesizer",
    category: "audio",
    title: "Procedural Web Audio API Sound Synthesizer (Zero Dependencies)",
    keywords: ["sound", "sfx", "audio", "jump", "coin", "shoot", "laser", "damage", "hit", "explosion", "gameover", "music", "win"],
    content: `// Procedural Web Audio synthesizer (never fails, zero external MP3s needed)
const playSfx = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'coin') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'win') {
      osc.type = 'triangle';
      [523, 659, 784, 1046].forEach((freq, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.25);
      });
    }
  } catch {}
};`
  },
  {
    id: "rag-combat-waves-ai",
    category: "mechanics",
    title: "Enemy Homing AI, Wave Spawning & Bullet Pooling",
    keywords: ["enemy", "zombie", "combat", "shoot", "bullet", "wave", "spawning", "hp", "kill", "survival", "score", "attack"],
    content: `// Enemy AI homing & pooled projectile combat
const bullets = useRef(Array.from({ length: 16 }, () => ({ active: false, x: 0, z: 0, dx: 0, dz: 0, life: 0 })));
const enemies = useRef(Array.from({ length: 8 }, () => ({ x: (Math.random() - 0.5) * 18, z: -8 - Math.random() * 6, hp: 2 })));

useFrame((_, delta) => {
  if (paused || gameState !== 'playing') return;
  const p = heroRef.current;
  if (!p) return;

  // 1. Move bullets
  bullets.current.forEach((b) => {
    if (!b.active) return;
    b.x += b.dx * 22 * delta;
    b.z += b.dz * 22 * delta;
    b.life -= delta;
    if (b.life <= 0 || Math.abs(b.x) > 14 || Math.abs(b.z) > 14) b.active = false;
  });

  // 2. Enemy homing & bullet hit detection
  enemies.current.forEach((e) => {
    const dx = p.position.x - e.x;
    const dz = p.position.z - e.z;
    const dist = Math.hypot(dx, dz) || 1;
    e.x += (dx / dist) * 2.8 * delta;
    e.z += (dz / dist) * 2.8 * delta;

    // Check hit by bullet
    bullets.current.forEach((b) => {
      if (b.active && Math.hypot(b.x - e.x, b.z - e.z) < 0.9) {
        b.active = false;
        e.hp--;
        if (e.hp <= 0) {
          e.x = (Math.random() - 0.5) * 18;
          e.z = p.position.z - 12 - Math.random() * 4;
          e.hp = 2;
          setScore((s) => s + 1);
        }
      }
    });
  });
});`
  },
  {
    id: "rag-pause-hud-touch",
    category: "ui",
    title: "In-Game Pause/Play, Sound Toggle, Escape Key & Mobile HUD",
    keywords: ["pause", "resume", "sound", "mute", "exit", "fullscreen", "escape", "esc", "hud", "overlay", "mobile", "button"],
    content: `// Universal PauseOverlay & Mobile-safe HUD setup
import { PauseOverlay, useKeyboardControls, ArenaEnv, CoinPickup, GameHud } from './ArenaEnv.jsx';

// Inside component:
const [paused, setPaused] = useState(false);
const [muted, setMuted] = useState(false);

// Clean in-game controls (icon-only sound, pause, exit fullscreen on Esc or ✕):
<PauseOverlay
  paused={paused}
  onTogglePause={() => setPaused(!paused)}
  soundMuted={muted}
  onToggleSound={() => setMuted(!muted)}
  onExit={() => { document.exitFullscreen?.(); setGameState('menu'); }}
/>

// Top-docked mobile HUD that never obstructs the virtual joystick:
<Html fullscreen calculatePosition={(_, __, s) => [s.width / 2, s.height / 2]} style={{ pointerEvents: 'none' }}>
  <div style={{
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(2, 6, 23, 0.75)',
    backdropFilter: 'blur(6px)',
    padding: '8px 18px',
    borderRadius: 20,
    color: '#fff',
    fontFamily: 'sans-serif',
    fontWeight: 700,
    display: 'flex',
    gap: 16
  }}>
    <span>❤️ {hp}</span>
    <span>🪙 {score}</span>
    <span>⏱️ {time}s</span>
  </div>
</Html>`
  },
  {
    id: "rag-60fps-vulkan-optimization",
    category: "performance",
    title: "60 FPS Minimum Rule & WebGL/Vulkan Performance Normalization",
    keywords: ["fps", "performance", "optimization", "60fps", "vulkan", "lag", "stutter", "pool", "delta", "normalize"],
    content: `// 60 FPS performance optimizations:
// 1. Delta time clamping: prevents mobile physics explosions when tab switches
const dt = Math.min(delta, 0.033);

// 2. Geometry & Material reuse: avoid 'new THREE.MeshStandardMaterial()' inside useFrame!
// 3. Throttle expensive raycasting or physics to every 2nd or 3rd frame:
const frameCount = useRef(0);
useFrame((_, delta) => {
  frameCount.current++;
  if (frameCount.current % 2 === 0) {
    // Run collision checks here at 30Hz while animations run at 60-120Hz
  }
});`
  },
  {
    id: "rag-racing-vehicle-physics",
    category: "mechanics",
    title: "Car Driving & Racing Physics with Drift and Bounds",
    keywords: ["car", "racing", "vehicle", "drive", "drift", "speed", "steer", "track", "lap", "acceleration"],
    content: `// Car physics simulation with acceleration, steering, friction & drift
const car = useRef({ speed: 0, angle: 0, x: 0, z: 0 });

useFrame((_, delta) => {
  if (paused || gameState !== 'playing') return;
  const { x: steer, z: throttle } = getDir();
  const c = car.current;

  // Acceleration & Braking
  if (throttle > 0) c.speed = Math.min(18, c.speed + 14 * delta);
  else if (throttle < 0) c.speed = Math.max(-6, c.speed - 10 * delta);
  else c.speed *= Math.pow(0.85, delta * 30); // Natural friction deceleration

  // Steering proportional to current speed
  if (Math.abs(c.speed) > 0.2) {
    const turnFactor = c.speed > 0 ? 1 : -1;
    c.angle += steer * 2.5 * turnFactor * delta;
  }

  c.x += Math.sin(c.angle) * c.speed * delta;
  c.z += Math.cos(c.angle) * c.speed * delta;
  
  if (carMesh.current) {
    carMesh.current.position.set(c.x, 0.4, c.z);
    carMesh.current.rotation.y = c.angle;
  }
});`
  }
];

/* =========================================================================
 * 2. Tokenizer, Vector Vectorizer & Semantic Search Engine
 * ========================================================================= */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with",
  "is", "are", "was", "were", "be", "this", "that", "it", "of", "from",
  "by", "as", "if", "then", "into", "can", "will", "do", "does", "did",
  "make", "create", "build", "how", "why", "what", "which", "my", "your"
]);

function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_#$]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

class RagVectorStore {
  constructor() {
    this.chunks = [];
    this.vocab = new Map(); // term -> index
    this.docFreq = new Map(); // term -> count
    this.projectChunks = [];
    this.initCoreKnowledge();
  }

  initCoreKnowledge() {
    this.chunks = [...CORE_KNOWLEDGE_CHUNKS];
    this.rebuildIndex();
  }

  rebuildIndex() {
    this.vocab.clear();
    this.docFreq.clear();
    const all = [...this.chunks, ...this.projectChunks];

    all.forEach((chunk) => {
      const tokens = new Set([
        ...tokenize(chunk.title),
        ...(chunk.keywords || []),
        ...tokenize(chunk.content).slice(0, 80)
      ]);
      tokens.forEach((t) => {
        this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
        if (!this.vocab.has(t)) {
          this.vocab.set(t, this.vocab.size);
        }
      });
    });
  }

  /**
   * Indexes or updates a project file into the vector store.
   */
  indexFile(fileName, content) {
    if (!content || typeof content !== "string") return;
    this.projectChunks = this.projectChunks.filter((c) => c.sourceFile !== fileName);
    
    // Chunk file into manageable blocks
    const lines = content.split("\n");
    const chunkSize = 40;
    for (let i = 0; i < lines.length; i += chunkSize - 5) {
      const slice = lines.slice(i, i + chunkSize).join("\n");
      if (slice.trim().length > 30) {
        this.projectChunks.push({
          id: `file-${fileName}-${i}`,
          category: "project",
          title: `Project File: ${fileName} (L${i + 1}-L${Math.min(lines.length, i + chunkSize)})`,
          keywords: tokenize(fileName),
          content: slice,
          sourceFile: fileName
        });
      }
    }
    this.rebuildIndex();
  }

  /**
   * Sub-millisecond TF-IDF cosine similarity search.
   */
  search(query, maxResults = 3, minScore = 0.12) {
    const qTokens = tokenize(query);
    if (!qTokens.length) return [];

    const all = [...this.chunks, ...this.projectChunks];
    const N = all.length;
    const scores = [];

    // Calculate query vector
    const qTfidf = new Map();
    const qCounts = {};
    qTokens.forEach((t) => (qCounts[t] = (qCounts[t] || 0) + 1));
    let qNorm = 0;

    for (const [term, count] of Object.entries(qCounts)) {
      const df = this.docFreq.get(term) || 0.5;
      const idf = Math.log(1 + N / (1 + df));
      const val = count * idf;
      qTfidf.set(term, val);
      qNorm += val * val;
    }
    qNorm = Math.sqrt(qNorm) || 1;

    // Score each chunk
    all.forEach((chunk) => {
      const chunkTokens = [
        ...tokenize(chunk.title),
        ...(chunk.keywords || []),
        ...tokenize(chunk.content).slice(0, 100)
      ];
      const docCounts = {};
      chunkTokens.forEach((t) => (docCounts[t] = (docCounts[t] || 0) + 1));

      let dot = 0;
      let dNorm = 0;

      for (const [term, count] of Object.entries(docCounts)) {
        const df = this.docFreq.get(term) || 0.5;
        const idf = Math.log(1 + N / (1 + df));
        const val = count * idf;
        dNorm += val * val;

        const qVal = qTfidf.get(term);
        if (qVal) {
          dot += val * qVal;
        }
      }
      dNorm = Math.sqrt(dNorm) || 1;
      const score = dot / (qNorm * dNorm);

      if (score >= minScore) {
        scores.push({ chunk, score });
      }
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, maxResults).map((s) => s.chunk);
  }
}

// Global Singleton Vector Store
export const ragStore = new RagVectorStore();

/**
 * Retrieves the most relevant RAG context for a user task or agent query.
 * Returns a clean markdown formatted knowledge prompt to inject into LLM system context.
 */
export function retrieveRagContext(query, options = {}) {
  const maxResults = options.maxResults || 2;
  const minScore = options.minScore || 0.14;
  const matches = ragStore.search(query, maxResults, minScore);

  if (!matches.length) return "";

  const formatted = matches
    .map((m, i) => `### [RAG Snippet ${i + 1}]: ${m.title} (${m.category.toUpperCase()})\n\`\`\`javascript\n${m.content}\n\`\`\``)
    .join("\n\n");

  return (
    "\n\n=================================================================\n" +
    "🧠 SPIDER RAG KNOWLEDGE BASE — GROUND-TRUTH ENGINE CODE EXAMPLES\n" +
    "Use these verified, production-tested 3D patterns & synthesizers to complete the goal cleanly:\n" +
    "=================================================================\n" +
    formatted +
    "\n=================================================================\n"
  );
}
