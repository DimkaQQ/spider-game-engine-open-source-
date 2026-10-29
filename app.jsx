/*
 * ============================================================================
 * SPIDER GAME ENGINE — Pocket Editor (mobile-first, light edition)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 * Облегчённый редактор для телефона:
 *  - Tab "Игра": живой вьюпорт (GameViewport) + Play + камера-пилюли
 *  - Tab "Код": встроенный мини-редактор GameComponent.jsx + Render
 *  - Tab "Сцены": список сцены (плоский), глаз видимости, тап = select
 *  - Tab "Рендер": текстовое поле задачи + кнопка, лог шагов агента
 * Всё управление — 44px тапы, нижний таб-бар над home-indicator,
 * панели не перекрывают вьюпорт (вкладки80, а не оверлеи).
 * ============================================================================
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameViewport, { viewportApi } from "./src/engine/GameViewport.jsx";
import { compileJsxComponent } from "./src/engine/DynamicJsxRenderer.jsx";
import { runAgent, systemPrompt, GAME_STEPS, extractCodeFromRaw } from "./src/engine/agentHarness.js";
import { GAME_WORLD } from "./src/game/index.js";
import { Play, Square, Code2, Boxes, Sparkles, Eye, EyeOff, Camera, Sun, Moon, RotateCcw, Eraser, Plus, Trash2 } from "lucide-react";

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

const STARTER_CODE = `import React from "react";
import { OrbitControls } from "@react-three/drei";

export default function GameComponent() {
  return (
    <group>
      <OrbitControls makeDefault target={[0,0,0]} maxPolarAngle={Math.PI/2.05} enablePan={false} minDistance={6} maxDistance={26} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8,16,10]} intensity={1.5} castShadow />
      <mesh rotation-x={-Math.PI/2} receiveShadow>
        <planeGeometry args={[20,20]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
      <mesh position={[0,0.5,0]} castShadow>
        <boxGeometry args={[1,1,1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    </group>
  );
}
`;

function flattenGroups(groups, out = []) {
  for (const g of groups || []) {
    for (const c of g.children || []) {
      out.push(c);
    }
  }
  return out;
}

function TabBtn({ id, active, onTap, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={() => onTap(id)}
      aria-pressed={active === id}
      className={`spider-tab-btn ${active === id ? "is-active" : ""}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

const SPAWNABLES = [
  { mesh: "box", name: "Box", color: "#6366f1" },
  { mesh: "sphere", name: "Ball", color: "#3b82f6" },
  { mesh: "cylinder", name: "Pole", color: "#10b981" },
  { mesh: "cone", name: "Cone", color: "#f59e0b" },
  { mesh: "torus", name: "Ring", color: "#ec4899" },
  { mesh: "ramp", name: "Ramp", color: "#8b5cf6" },
];

const QUICK_TASKS = [
  { label: "♟️ Chess", task: "3D chess board with full rules, tap pieces to move, blue restart button" },
  { label: "🎲 Ludo", task: "3D ludo board 52 tiles staggered elevations, 4 colored pawns, tap dice to roll and tap pawn to move" },
  { label: "🪙 Coins", task: "arena 20x20 green ground blue walls, ball hero, 8 gold coins, tap to jump swipe to steer, score HUD" },
  { label: "🚀 Shooter", task: "spaceship shooter, drag to move touch to shoot, enemies drones, score and lives HUD" },
];

const CODE_SNIPPETS = [
  { label: "📦 Box", code: `<mesh position={[0,0.5,0]} castShadow>\n  <boxGeometry args={[1,1,1]} />\n  <meshStandardMaterial color="#3b82f6" />\n</mesh>` },
  { label: "🔮 Ball", code: `<mesh position={[0,0.5,0]} castShadow>\n  <sphereGeometry args={[0.5,20,20]} />\n  <meshStandardMaterial color="#ef4444" />\n</mesh>` },
  { label: "💡 Light", code: `<directionalLight position={[8,16,10]} intensity={1.5} castShadow />` },
  { label: "🟩 Ground", code: `<mesh rotation-x={-Math.PI/2} receiveShadow>\n  <planeGeometry args={[20,20]} />\n  <meshStandardMaterial color="#15803d" />\n</mesh>` },
];

export default function App() {
  const [tab, setTab] = useState("game");
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraMode, setCameraMode] = useState("Viewport");
  const [groups, setGroups] = useState(() => GAME_WORLD);
  const [selectedId, setSelectedId] = useState("player");
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem("spider-pocket-code") || STARTER_CODE;
    } catch {
      return STARTER_CODE;
    }
  });
  const [activeJsx, setActiveJsx] = useState(null);
  const [codeError, setCodeError] = useState(null);
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const [fps, setFps] = useState(0);
  const [shot, setShot] = useState(null);
  const logRef = useRef(null);
  const keysPressed = useMemo(() => ({}), []);

  const flat = useMemo(() => flattenGroups(groups), [groups]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  useEffect(() => {
    try {
      localStorage.setItem("spider-pocket-code", code);
    } catch {}
  }, [code]);

  const pushLog = useCallback((line) => {
    setLog((prev) => [...prev.slice(-120), line]);
  }, []);

  const toggleVisible = useCallback((id) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        children: (g.children || []).map((c) => (c.id === id ? { ...c, visible: c.visible === false ? true : false } : c)),
      }))
    );
  }, []);

  const handleSpawn = useCallback((mesh, name, color) => {
    const id = `spawn-${mesh}-${Date.now().toString(36)}`;
    const node = {
      id,
      name: `${name} ${flat.length + 1}`,
      type: "prop",
      mesh,
      color,
      visible: true,
      pos: { x: Math.round((Math.random() - 0.5) * 60), y: 0, z: Math.round((Math.random() - 0.5) * 60) },
      rot: { x: 0, y: Math.round(Math.random() * 360), z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };
    setGroups((prev) =>
      prev.map((g) =>
        g.id === "props-group"
          ? { ...g, children: [...(g.children || []), node] }
          : g
      )
    );
    setSelectedId(id);
    pushLog(`＋ ${node.name}`);
  }, [flat.length, pushLog]);

  const handleDeleteSpawn = useCallback((id) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        children: (g.children || []).filter((c) => c.id !== id),
      }))
    );
    setSelectedId((cur) => (cur === id ? "player" : cur));
    pushLog(`－ removed`);
  }, [pushLog]);

  const handleShot = useCallback(() => {
    try {
      const url = viewportApi?.capture ? viewportApi.capture(false, 640) : null;
      if (url) {
        setShot(url);
        pushLog("📸 screenshot taken");
      } else {
        pushLog("✗ camera not ready — open Игра tab first");
      }
    } catch (e) {
      pushLog(`✗ shot: ${String(e?.message || e)}`);
    }
  }, [pushLog]);

  const handleRender = useCallback(() => {
    const comp = compileJsxComponent(code, {}, (e) => setCodeError(String(e?.message || e)));
    if (comp) {
      setActiveJsx(code);
      setCodeError(null);
      pushLog("✓ GameComponent mounted");
      setTab("game");
    } else {
      pushLog("✗ compile error — see message");
    }
  }, [code, pushLog]);

  const handleReset = useCallback(() => {
    setCode(STARTER_CODE);
    setActiveJsx(null);
    setCodeError(null);
    setGroups(GAME_WORLD);
    pushLog("↺ reset to starter");
  }, [pushLog]);

  const insertSnippet = useCallback((snippet) => {
    setCode((prev) => {
      const marker = "    </group>";
      const idx = prev.lastIndexOf(marker);
      if (idx === -1) return `${prev}\n${snippet}\n`;
      return `${prev.slice(0, idx)}      ${snippet.split("\n").join("\n      ")}\n${prev.slice(idx)}`;
    });
    pushLog("＋ snippet inserted");
  }, [pushLog]);

  const handleRunTask = useCallback(async () => {
    const text = task.trim();
    if (!text || busy) return;
    setBusy(true);
    pushLog(`▶ ${text}`);
    try {
      const snapshot = `SCENE: ${flat.map((c) => `${c.id}@(${c.pos?.x ?? 0},${c.pos?.y ?? 0},${c.pos?.z ?? 0})`).join(" ")}`;
      const prompt = systemPrompt(snapshot, { isMobile: true });
      await runAgent(`${prompt}\n\nUSER TASK: ${text}`, {
        ctx: { scene: snapshot },
        callModel: async () => {
          throw new Error("No model bridge on this device — type JSX in the Код tab and press Render.");
        },
        onEvent: (ev) => {
          if (ev?.tool) pushLog(`⚙ ${ev.tool}`);
          if (ev?.code) {
            const extracted = extractCodeFromRaw(ev.code) || ev.code;
            setCode(extracted);
            setActiveJsx(extracted);
            pushLog("✓ agent code mounted");
            setTab("game");
          }
          if (ev?.final) pushLog(`✓ ${String(ev.final).slice(0, 140)}`);
        },
        maxSteps: GAME_STEPS,
      });
    } catch (e) {
      pushLog(`✗ ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }, [task, busy, flat, pushLog]);

  return (
    <div className="spider-pocket">
      {/* ── Top bar ─────────────────────────────── */}
      <header className="spider-topbar">
        <div className="spider-brand">
          <span className="spider-brand-dot">🕷️</span>
          <span className="spider-brand-name">SPIDER <em>POCKET</em></span>
          <span className="spider-fps">{fps > 0 ? `${fps} FPS` : ""}</span>
        </div>
        <div className="spider-top-actions">
          <button
            type="button"
            className="spider-chip-btn"
            onClick={handleShot}
            aria-label="Screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`spider-chip-btn ${isPlaying ? "is-live" : ""}`}
            onClick={() => setIsPlaying((p) => !p)}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </header>

      {/* ── Tab body ────────────────────────────── */}
      <main className="spider-body">
        {tab === "game" && (
          <section className="spider-viewport-wrap">
            <GameViewport
              sceneGroups={groups}
              selectedNodeId={selectedId}
              onSelectNode={setSelectedId}
              isPlaying={isPlaying}
              cameraMode={cameraMode}
              keysPressed={keysPressed}
              activeGizmo="select"
              activeJsxCode={activeJsx}
              activeJsxName="GameComponent.jsx"
              onFps={setFps}
            />
            <div className="spider-cam-pills">
              {["Viewport", "Game View", "Cinematic"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCameraMode(m)}
                  className={`spider-pill ${cameraMode === m ? "is-active" : ""}`}
                >
                  {m === "Viewport" ? <Camera className="w-3.5 h-3.5" /> : m === "Game View" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  {m}
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "code" && (
          <section className="spider-pane">
            <div className="spider-pane-row">
              <span className="spider-pane-title">GameComponent.jsx</span>
              <div className="spider-row-actions">
                <button type="button" className="spider-chip-btn" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button type="button" className="spider-chip-btn primary" onClick={handleRender}>
                  <Play className="w-4 h-4" /> Render
                </button>
              </div>
            </div>
            {codeError && <div className="spider-error">{codeError}</div>}
            <div className="spider-snippet-row">
              {CODE_SNIPPETS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => insertSnippet(s.code)}
                  className="spider-snippet-btn"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="spider-code-wrap">
              <pre className="spider-code-lines" aria-hidden="true">
                {code.split("\n").map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </pre>
              <textarea
                className="spider-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const s = el.selectionStart ?? 0;
                    const en = el.selectionEnd ?? 0;
                    setCode((prev) => `${prev.slice(0, s)}  ${prev.slice(en)}`);
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = s + 2;
                    });
                  }
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                wrap="off"
              />
            </div>
            <p className="spider-hint">Render монтирует код во вкладку Игра. Ошибки — красной строкой выше.</p>
          </section>
        )}

        {tab === "scene" && (
          <section className="spider-pane">
            <div className="spider-pane-row">
              <span className="spider-pane-title">Сцена · {flat.length}</span>
              <span className="spider-hint">тап — выбрать</span>
            </div>
            <div className="spider-spawn-grid">
              {SPAWNABLES.map((s) => (
                <button
                  key={s.mesh}
                  type="button"
                  onClick={() => handleSpawn(s.mesh, s.name, s.color)}
                  className="spider-spawn-btn"
                >
                  <span className="spider-scene-dot" style={{ background: s.color }} />
                  <Plus className="w-3.5 h-3.5" /> {s.name}
                </button>
              ))}
            </div>
            <ul className="spider-scene-list">
              {flat.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(n.id);
                      setTab("game");
                    }}
                    className={`spider-scene-row ${selectedId === n.id ? "is-active" : ""}`}
                  >
                    <span className="spider-scene-dot" style={{ background: n.color || "#6366f1" }} />
                    <span className="spider-scene-name">{n.name || n.id}</span>
                    <span className="spider-scene-meta">
                      {Math.round(n.pos?.x ?? 0)},{Math.round(n.pos?.y ?? 0)},{Math.round(n.pos?.z ?? 0)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={n.visible === false ? "Показать" : "Скрыть"}
                    onClick={() => toggleVisible(n.id)}
                    className="spider-icon-btn"
                  >
                    {n.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {String(n.id).startsWith("spawn-") && (
                    <button
                      type="button"
                      aria-label="Удалить"
                      onClick={() => handleDeleteSpawn(n.id)}
                      className="spider-icon-btn danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "render" && (
          <section className="spider-pane">
            <div className="spider-pane-row">
              <span className="spider-pane-title">Рендер из слов</span>
            </div>
            <div className="spider-spawn-grid">
              {QUICK_TASKS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setTask(q.task)}
                  className="spider-spawn-btn"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <div className="spider-render-box">
              <textarea
                className="spider-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Опиши игру: арена 20×20, шар-герой, 8 монет…"
                rows={4}
              />
              <button
                type="button"
                className="spider-big-btn"
                disabled={busy || !task.trim()}
                onClick={handleRunTask}
              >
                <Sparkles className="w-4 h-4" /> {busy ? "Рендерю…" : "Сгенерировать"}
              </button>
              <button type="button" className="spider-chip-btn" onClick={() => setLog([])}>
                <Eraser className="w-4 h-4" /> Очистить лог
              </button>
            </div>
            <div ref={logRef} className="spider-log">
              {log.length === 0 && <span className="spider-hint">Лог пуст. Без моста модели код пишется во вкладке Код.</span>}
              {log.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            {shot && (
              <div className="spider-shot">
                <img src={shot} alt="Viewport screenshot" />
                <button type="button" className="spider-chip-btn" onClick={() => setShot(null)}>
                  Закрыть
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Bottom tab bar ──────────────────────── */}
      <nav className="spider-tabbar">
        <TabBtn id="game" active={tab} onTap={setTab} icon={Play} label="Игра" />
        <TabBtn id="code" active={tab} onTap={setTab} icon={Code2} label="Код" />
        <TabBtn id="scene" active={tab} onTap={setTab} icon={Boxes} label="Сцены" />
        <TabBtn id="render" active={tab} onTap={setTab} icon={Sparkles} label="Рендер" />
      </nav>
    </div>
  );
}
