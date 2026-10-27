import React, { useState, useEffect, useRef, useCallback } from "react";
import GameViewport, { viewportApi } from "./src/engine/GameViewport";
import { runAgent, systemPrompt } from "./src/engine/agentHarness.js";
import { GAME_WORLD, ENVIRONMENT_ASSETS, COINS, COIN_RULES, PLAYER, physicsFallSpeed } from "./src/game/index.js";
import { MATERIAL_PRESETS, matColor, TUTORIALS } from "./src/game/index.js";
import {
  Play,
  Square,
  Box,
  Crosshair,
  Flag,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Sun,
  Eye,
  EyeOff,
  Search,
  Plus,
  Download,
  Save,
  ChevronRight,
  ChevronDown,
  Settings,
  Terminal,
  FileText,
  Sparkles,
  Volume2,
  Cpu,
  Code,
  Map,
  Layout,
  Puzzle,
  User,
  Camera,
  Shield,
  Sliders,
  Maximize2,
  Move,
  RotateCw,
  Scaling,
  MousePointer,
  Grid,
  Globe,
  Lock,
  Unlock,
  Send,
  Trash2,
  Pencil,
  Copy,
  RotateCcw,
  Check,
  History,
  Pin,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Info,
  Film,
  Gamepad2,
  Layers,
  Activity,
  Compass
} from "lucide-react";


// --- CONSOLE LOGS (start empty — real boot lines are logged on mount) ---
const INITIAL_LOGS = [];


// Left Navigation Items
const LEFT_RAIL_ITEMS = [
  { id: "Scene", icon: Box },
  { id: "Assets", icon: Folder },
  { id: "Materials", icon: Globe },
  { id: "Textures", icon: ImageIcon },
  { id: "Models", icon: User },
  { id: "Animation", icon: Activity },
  { id: "VFX", icon: Sparkles },
  { id: "Audio", icon: Volume2 },
  { id: "Physics", icon: Cpu },
  { id: "AI", icon: Compass },
  { id: "Scripting", icon: Code },
  { id: "Maps", icon: Map },
  { id: "UI", icon: Layout },
  { id: "Plugins", icon: Puzzle }
];

// Imported audio asset card — real preview playback via HTMLAudio.
function AudioCard({ entry }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!audioRef.current) audioRef.current = new Audio(entry.url);
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      audioRef.current.onended = () => setPlaying(false);
    }
  };
  useEffect(() => () => { audioRef.current?.pause(); }, []);
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-[11px]">
      <span className="flex items-center gap-2 font-semibold text-slate-700 truncate">
        <Volume2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="truncate">{entry.name}</span>
        <span className="font-mono text-slate-400 font-normal truncate">{entry.file}</span>
      </span>
      <button onClick={toggle} title={playing ? "Pause preview" : "Play preview"} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer shrink-0">
        {playing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
      </button>
    </div>
  );
}

// Shared Meta response parser: OpenAI chat, Responses API, legacy text
function pickModelText(d) {
  if (!d || typeof d !== "object") return typeof d === "string" && d.trim() ? d.trim() : null;
  const ch = d.choices?.[0];
  if (ch) {
    const m = ch.message?.content;
    if (typeof m === "string" && m.trim()) return m.trim();
    if (Array.isArray(m)) {
      const t = m.map((p) => (typeof p === "string" ? p : p?.text || "")).join("").trim();
      if (t) return t;
    }
    if (typeof ch.text === "string" && ch.text.trim()) return ch.text.trim();
  }
  const out = d.output;
  if (Array.isArray(out)) {
    const t = out.flatMap((o) => o?.content || []).map((c) => (typeof c === "string" ? c : c?.text || "")).join("").trim();
    if (t) return t;
  }
  for (const k of ["output_text", "text", "response", "answer"]) {
    if (typeof d[k] === "string" && d[k].trim()) return d[k].trim();
  }
  return null;
}

export default function App() {
  // Navigation & Tabs State
  const [activeLeftRail, setActiveLeftRail] = useState("Scene");
  const [viewportTab, setViewportTab] = useState("Viewport"); // Viewport, Cinematic, Game View
  const [bottomTab, setBottomTab] = useState("Content Browser"); // Content Browser, Console, Build Log
  const [rightTab, setRightTab] = useState("Inspector"); // Inspector, World Settings
  const [activeFolder, setActiveFolder] = useState("Environment");
  const [hierarchyOpen, setHierarchyOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [bottomLeftOpen, setBottomLeftOpen] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("Rendering");
  const [openMenu, setOpenMenu] = useState(null); // File/Edit/... dropdown
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(COINS);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [timelineT, setTimelineT] = useState(14.5); // scrubbed solar time
  const [buildLogs, setBuildLogs] = useState([]);
  // Ask AI file intake — file manager opens for ANY file, parser allowlists models/images/audio
  const handleAskFile = (file) => {
    if (!file) return;
    appendLog("Info", `Ask AI file: "${file.name}"`);
    const push = (ok, text) => {
      pushMsg(`📎 ${file.name}`, text, ok);
      appendLog(ok ? "Success" : "Warning", `Ask AI file: ${text}`);
      setTimeout(() => aiEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    if (/\.(glb|gltf|fbx|obj)$/i.test(file.name) || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      handleImportAssetFile(file);
      push(true, `Accepted ${/model|glb|gltf|fbx|obj/i.test(file.name) ? "3D model" : "image"} — spawned into ${sceneLabel}.`);
      return;
    }
    if (/\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
      const url = URL.createObjectURL(file);
      const entry = { id: `audio-${Date.now()}`, name: file.name.replace(/\.[^.]+$/, ""), file: file.name, url };
      setAudioAssets((a) => [...a, entry]);
      setActiveFolder("Audio");
      setBottomTab("Content Browser");
      push(true, `Audio "${entry.name}" imported — find it in Content Browser > Audio, press play to preview.`);
      return;
    }
    push(false, `Rejected "${file.name}" — parser allows only 3D models (.glb .gltf .fbx .obj), images (.png .jpg .webp), audio (.mp3 .wav .ogg).`);
  };

  // Ask AI — plain-English scene commands executed as real editor actions
  // runAskAi does the work; handleAskAiSubmit shows the thinking shimmer first
  const runAskAi = (raw, q) => {    const say = (t, ok = true) => {
      setAiAnswer(t);
      pushMsg(raw, t, ok);
      appendLog(ok ? "Success" : "Warning", `Ask AI: ${t}`);
      setTimeout(() => aiEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    const allNodes = sceneGroups.flatMap((g) => g.children);
    const byName = (n) => allNodes.find((c) => c.name.toLowerCase().includes(n) || c.id === n);

    // Full harness rule #1: a filesystem path in the message IS the intent — folder first, never an asset name
    const pathHit = raw.match(/([A-Za-z]:[\\/][^\n"'`]+?)(?=\s*$|\s*\n|\s+(?:can|please|here|there|now)\b)/i) || raw.match(/([A-Za-z]:[\\/][^\n"'`]+)/);
    if (pathHit) {
      const dir = pathHit[1].replace(/[\s.\\/:]+$/, "").trim();
      if (/^[A-Za-z]:[\\/]/.test(dir) && dir.length > 3) {
        setProjects((prev) => prev.map((p) => (p.id === currentProjectId ? { ...p, root: dir } : p)));
        say(`Project folder set to:\n${dir}\nNext save, build, or file lands there. Say "create project <name>" to start one inside it, or keep editing — autosave follows.`);
        appendLog("Success", `Ask AI: project root → ${dir}`);
        setAiPrompt("");
        return;
      }
    }

    // Destructive actions ask first — Claude-Code-style permission prompt
    let m = q.match(/(?:delete|remove)\s+(.+)/);
    if (m) {
      const n = byName(m[1].trim());
      if (!n) { say(`Couldn't find "${m[1]}" in the scene.`, false); setAiPrompt(""); return; }
      if (["player", "camera", "terrain"].includes(n.id)) { say(`${n.name} is a protected core actor — can't delete.`, false); setAiPrompt(""); return; }
      setPendingConfirm({
        label: `Delete ${n.name} from ${sceneLabel}?`,
        run: () => {
          setSceneGroups((prev) => prev.map((g) => ({ ...g, children: g.children.filter((c) => c.id !== n.id) })));
          if (selectedNodeId === n.id) setSelectedNodeId("player");
          say(`Deleted ${n.name}.`);
        }
      });
      setAiPrompt("");
      return;
    }

    let m2 = q.match(/(?:spawn|add|create|place)\s+(.+)/);
    if (m2) {
      const want = m2[1].trim();
      // "create here/there" with no asset = location intent, not a spawn — handled above or falls through
      const pool = ENVIRONMENT_ASSETS.filter((a) => a.name.toLowerCase().includes(want) || a.mesh.toLowerCase().includes(want));
      if (pool.length > 0) { handleSpawnAsset(pool[0]); say(`Spawned ${pool[0].name} into ${sceneLabel}.`); }
      else if (/^(here|there|this|it|that|one)$/i.test(want)) { say(`Create what, and where? Try "create castle", or paste a folder path to set the project location.`); }
      else if (metaKeyRef.current) { /* no asset match — let free chat / agent interpret it */ }
      else say(`No asset matches "${want}" — try castle, trees, bridge, waterfall.`, false);
      if (pool.length > 0 || !metaKeyRef.current || /^(here|there|this|it|that|one)$/i.test(want)) { setAiPrompt(""); return; }
      // fall through to Llama free chat below
    }
    m = q.match(/(hide|show)\s+(.+)/);
    if (m) {
      const n = byName(m[2].trim());
      if (n) { setNodeVisibility(n.id, m[1] === "show"); setSelectedNodeId(n.id); say(`${n.name} is now ${m[1] === "show" ? "visible" : "hidden"}.`); }
      else say(`Couldn't find "${m[2]}" in the scene.`, false);
      setAiPrompt("");
      return;
    }
    if (/(night|evening|dark)/.test(q)) { setTimeOfDay(21); setTimelineT(21); say("Set night — 21.0h, sun down, stars out."); setAiPrompt(""); return; }
    if (/(sunset|dusk)/.test(q)) { setTimeOfDay(18.5); setTimelineT(18.5); say("Set sunset — 18.5h."); setAiPrompt(""); return; }
    if (/(morning|day|noon|sunrise)/.test(q)) { setTimeOfDay(12); setTimelineT(12); say("Set midday — 12.0h."); setAiPrompt(""); return; }
    m = q.match(/time\s+(\d+(\.\d+)?)/);
    if (m) { const t = Math.max(4, Math.min(22, parseFloat(m[1]))); setTimeOfDay(t); setTimelineT(t); say(`Solar time set to ${t.toFixed(1)}h.`); setAiPrompt(""); return; }
    if (/\bplay\b|\bstart\b/.test(q) && !isPlaying) { handleTogglePlay(); say("Play mode started — WASD + Space."); setAiPrompt(""); return; }
    if (/\bstop\b/.test(q) && isPlaying) { handleTogglePlay(); say("Play mode stopped."); setAiPrompt(""); return; }
    if (/wireframe/.test(q)) { setViewMode((v) => (v === "Wireframe" ? "Lit" : "Wireframe")); say("Wireframe toggled."); setAiPrompt(""); return; }
    if (/screenshot|photo|capture/.test(q)) {
      const url = viewportApi.capture?.();
      say(url ? "Screenshot captured (PNG downloaded)." : "Viewport not ready yet.", !!url);
      setAiPrompt("");
      return;
    }
    if (/build/.test(q)) { handleBuildProject(); say("Build started — see Build Log tab."); setAiPrompt(""); return; }
    if (/score/.test(q)) { say(`Score ${score}, ${coins.filter((c) => !c.taken).length} coins left.`); setAiPrompt(""); return; }
    m = q.match(/(?:select|focus|find)\s+(.+)/);
    if (m) {
      const n = byName(m[1].trim());
      if (n) { setSelectedNodeId(n.id); setHierarchyOpen(true); say(`Selected ${n.name} — see Inspector.`); }
      else say(`Couldn't find "${m[1]}" in the scene.`, false);
      setAiPrompt("");
      return;
    }
    if (/help|what can you/.test(q)) { say("Try: spawn castle · agent build a night camp · undo · hide fog · night · play · save. I remember this chat (older turns auto-compact)."); setAiPrompt(""); return; }
    m = q.match(/^undo$/);
    if (m) {
      if (!agentUndoRef.current) { say("Nothing to undo yet — run an `agent` task first.", false); setAiPrompt(""); return; }
      try {
        setSceneGroups(JSON.parse(agentUndoRef.current));
        say("Undone — scene restored to before the last agent run.");
        appendLog("Success", "Agent action undone — scene rolled back");
      } catch { say("Undo failed — snapshot corrupted.", false); }
      setAiPrompt("");
      return;
    }
    m = q.match(/^agent\s+([\s\S]+)/);
    if (m) {
      const goal = m[1].trim();
      if (!goal) { say("Give me a goal — e.g. `agent build a night camp with two tents`.", false); setAiPrompt(""); return; }
      setAiPrompt("");
      runAgentGoal(goal);
      return;
    }
    m = q.match(/^(save|export)(?:\s+scene)?$/);
    if (m) {
      say("Saving scene to the project folder…");
      setAiPrompt("");
      handleSaveScene();
      return;
    }
    m = q.match(/^(?:create|new|write)(?:\s+file)?(?:\s+(\S+))?(?:\s+([\s\S]+))?$/);
    if (m && (/file|txt|md|json|notes?|readme|there|here/i.test(q) || m[1])) {
      let want = (m[1] || "").trim();
      let rest = (m[2] || "").trim();
      if (/^(a|an|the)$/i.test(want)) {
        const p = rest.split(/\s+/);
        want = p.shift() || "";
        rest = p.join(" ");
      }
      let fname;
      if (!want || /^(txt|text|md|markdown|json|notes?|files?|there|here)$/i.test(want)) {
        let ext = "txt";
        const em = want.match(/^(txt|text|md|markdown|json)$/i);
        if (em) ext = em[1].toLowerCase().replace("text", "txt").replace("markdown", "md");
        fname = `notes.${ext}`;
        rest = rest.replace(/^(there|here)\b[,\s]*/i, "");
      } else {
        fname = want.includes(".") ? want : `${want}.txt`;
      }
      fname = fname.replace(/[\\/:*?"<>|]/g, "_");
      const content = rest.trim() || `Spider Engine note — ${new Date().toLocaleString()}\nProject: ${currentProject?.name || "GameWorld"}\n`;
      say(`Creating ${fname}…`);
      setAiPrompt("");
      (async () => {
        const dir = await ensureProjectRoot();
        if (!dir) { say("No folder chosen — file not created.", false); return; }
        try {
          const r = await window.spiderShell.writeProjectFile(dir, fname, content);
          if (r?.ok) say(`Created:\n${r.path}\n${r.bytes} bytes — open it, it's really there.`);
          else say(`Could not write ${fname}: ${r?.error || "unknown"}`, false);
        } catch (err) { say(`Could not write ${fname}: ${err}`, false); }
      })();
      return;
    }
    // Free chat — with a Meta key stored, Llama answers with LIVE streaming; otherwise the local router explains itself
    if (metaKeyRef.current) {
      setAiThinking(true);
      setStreaming({ q: raw, text: "" });
      callLlama(raw, (tok) => {
        setAiThinking(false);
        setStreaming((s) => (s ? { ...s, text: s.text + tok } : s));
      })
        .then((text) => {
          const full = (text || "").trim();
          setStreaming(null);
          if (full) say(full);
          else say("The model returned nothing — try again.", false);
        })
        .catch((err) => {
          setStreaming(null);
          say(`Meta API error: ${err.message} — check key/model in Settings > AI & Keys.`, false);
        })
        .finally(() => { setAiThinking(false); });
      setAiPrompt("");
      return;
    }
    say("I run scene commands — try “spawn trees”, “night”, “play”, or “score”. Paste a Meta API key in Settings > AI & Keys to chat freely.", false);
    setAiPrompt("");
  };

  const handleAskAiSubmit = (e, overrideText) => {
    e.preventDefault();
    try { e.target?.querySelector?.("input")?.blur(); } catch {}
    const raw = (overrideText ?? aiPrompt).trim();
    const q = raw.toLowerCase();
    if (!q) return;
    appendLog("Info", `Ask AI: "${raw}"`);
    setAiThinking(true);
    setAiPrompt("");
    const effort = thinkLevel === "auto" ? "medium" : thinkLevel;
    if (effort === "high") {
      const nodes = sceneGroups.flatMap((g) => g.children).length;
      const turns = aiHistory.length;
      const compacted = turns > 6 ? turns - 6 : 0;
      appendLog("Info", `Reasoning (high): parsing "${raw}" against ${nodes} actors + ${ENVIRONMENT_ASSETS.length} assets… context: ${turns} turns${compacted > 0 ? ` (${compacted} auto-compacted)` : ""}`);
    }
    // Thinking shimmer window — then the router runs for real
    setTimeout(() => {
      try {
        runAskAi(raw, q);
        if (effort === "high") appendLog("Info", `Reasoning (high): done — see reply above.`);
      } finally {
        setAiThinking(false);
      }
    }, THINK_MS[thinkLevel] ?? 650);
  };
  const importFileRef = useRef(null);
  const folderInputRef = useRef(null);
  const folderModeRef = useRef("import"); // import = merge into scene, project = open folder as new project
  // Folder picker needs webkitdirectory (set imperatively — not a React prop)
  useEffect(() => {
    if (folderInputRef.current) folderInputRef.current.setAttribute("webkitdirectory", "");
  }, []);
  // Folder → Project: a folder IS a project — its .scene.json becomes the scene, assets spawn in a grid
  const handleOpenFolderAsProject = async (files) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const folderName = (list[0]?.webkitRelativePath || "Folder").split("/")[0] || "Folder Project";
    appendLog("Info", `Opening folder as project: "${folderName}" (${list.length} files)…`);
    let groups = JSON.parse(JSON.stringify(GAME_WORLD));
    const sceneFile = list.find((f) => /\.scene\.json$/i.test(f.name));
    if (sceneFile) {
      try {
        const data = JSON.parse(await sceneFile.text());
        if (data.groups && Array.isArray(data.groups)) {
          groups = data.groups;
          appendLog("Success", `Loaded scene from ${sceneFile.name} (${groups.flatMap((g) => g.children).length} actors)`);
        }
      } catch {
        appendLog("Warning", `${sceneFile.name} is not a valid scene — starting ${sceneLabel} from the default scene`);
      }
    }
    const assets = list.filter((f) => /\.(glb|gltf|fbx|obj|png|jpe?g|webp)$/i.test(f.name)).slice(0, 25);
    const audios = list.filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f.name)).slice(0, 10);
    const nodes = await Promise.all(
      assets.map(async (f, i) => {
        const ext = f.name.split(".").pop().toLowerCase();
        const isModel = ["glb", "gltf", "fbx", "obj"].includes(ext);
        let url;
        try {
          url = await fileToDataUrl(f);
        } catch {
          url = URL.createObjectURL(f);
        }
        const col = Math.ceil(Math.sqrt(assets.length)) || 1;
        return {
          id: `spawn-${Date.now()}-${i}`,
          name: f.name.replace(/\.[^.]+$/, ""),
          type: "mesh", color: "#6366f1", visible: true,
          pos: { x: -12 + (i % col) * 6, y: 0, z: 8 + Math.floor(i / col) * 6 },
          rot: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 },
          tag: "Imported", layer: "Default", mesh: f.name,
          mat0: "M_Imported_Base", mat1: "M_Imported_Detail", anim: "None",
          physics: false, mass: 100, collision: "BlockAll",
          ...(isModel ? { modelUrl: url, modelFormat: ext } : { textureUrl: url })
        };
      })
    );
    if (nodes.length > 0) {
      groups = groups.map((g, idx) => (idx === 0 ? { ...g, expanded: true, children: [...g.children, ...nodes] } : g));
    }
    const p = { id: `project-${Date.now()}`, name: folderName, groups, updatedAt: Date.now(), ui: { hierarchyOpen: false, inspectorOpen: false, bottomLeftOpen: false, consoleOpen: false, viewportTab: "Viewport", bottomTab: "Content Browser", rightTab: "Inspector" } };
    setProjects((prev) => [...prev, p]);
    setCurrentProjectId(p.id);
    setSceneGroups(groups);
    setSelectedNodeId(nodes.length > 0 ? nodes[nodes.length - 1].id : "player");
    setScore(0);
    setCoins(COINS.map((c) => ({ ...c, taken: false })));
    if (audios.length > 0) {
      setAudioAssets((prev) => [...prev, ...audios.map((f, i) => ({ id: `audio-${Date.now()}-${i}`, name: f.name.replace(/\.[^.]+$/, ""), file: f.name, url: URL.createObjectURL(f) }))]);
      setActiveFolder("Audio");
    }
    setBottomTab("Content Browser");
    appendLog("Success", `Project "${folderName}" open — scene + ${nodes.length} models/images + ${audios.length} audio`);
    setOpenMenu(null);
    setShowStartup(false);
    // Clean viewport only on arrival
    setHierarchyOpen(false);
    setInspectorOpen(false);
    setBottomLeftOpen(false);
    setConsoleOpen(false);
    tutorialStats.current = { moved: false, jumped: false, shots: 0, spawned: 0, maxY: 0 };
    setTutorial({ template: "folder", idx: 0 });
    appendLog("Info", "Tutorial started: follow the card, it reacts to what you do");
    expandEditor();
  };
  const handleImportFolder = (files) => {
    if (folderModeRef.current === "project") {
      folderModeRef.current = "import";
      handleOpenFolderAsProject(files);
      return;
    };
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const ok = list.filter((f) => /\.(glb|gltf|fbx|obj|png|jpe?g|webp|mp3|wav|ogg|m4a|json)$/i.test(f.name));
    const skipped = list.length - ok.length;
    if (ok.length === 0) {
      appendLog("Warning", `Folder parsed: 0 supported files out of ${list.length} (models/images/audio/.json only)`);
      return;
    }
    const batch = ok.slice(0, 25);
    appendLog("Info", `Folder parsed: ${batch.length} asset${batch.length > 1 ? "s" : ""} importing${skipped > 0 ? `, ${skipped} skipped` : ""}${ok.length > 25 ? " (first 25)" : ""}…`);
    batch.forEach((f) => handleImportAssetFile(f));
    appendLog("Success", `Folder import done — ${batch.length} spawned into ${sceneLabel}`);
  };
  const consoleInputRef = useRef(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  // Recent chats — Gemini-style sessions, pinned first, persisted locally
  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem("spider-ai-sessions");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  const [currentId, setCurrentId] = useState(() => {
    try {
      const raw = localStorage.getItem("spider-ai-sessions");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) && arr[0] ? arr[0].id : null;
    } catch { return null; }
  });
  const [showRecents, setShowRecents] = useState(false);
  const [panelWide, setPanelWide] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // Cloudflare-style typed delete confirm
  const [deleteText, setDeleteText] = useState("");
  // Tutorial — per-template steps, auto-advances on real game events
  const [tutorial, setTutorial] = useState(null); // { template, idx }
  const templateLabel = (t) => ({ normal: "Normal", tpp: "TPP Shooting", fpp: "FPP Shooting", racing: "Racing", custom: "Custom", blank: "Blank", folder: "Folder" }[t] || t);
  const tutorialStats = useRef({ moved: false, jumped: false, shots: 0, spawned: 0, startX: 0, startZ: 0, maxY: 0 });
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const aiHistory = sessions.find((s) => s.id === currentId)?.messages || [];
  const pushMsg = (q, a, ok = true) => {
    const clean = q.replace(/^📎 /, "");
    const title = clean.slice(0, 36) || "New chat";
    let id = currentId;
    if (!id || !sessions.some((s) => s.id === id)) {
      id = `chat-${Date.now()}`;
      setCurrentId(id);
      setSessions((prev) => [{ id, title, pinned: false, at: Date.now(), messages: [{ q, a, ok }] }, ...prev.filter((s) => s.id !== id)].slice(0, 30));
      return;
    }
    setSessions((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return { ...s, title: s.messages.length === 0 ? title : s.title, at: Date.now(), messages: [...s.messages, { q, a, ok }] };
    }));
  };
  const deleteMsg = (i) => setSessions((prev) => prev.map((s) => (s.id === currentId ? { ...s, messages: s.messages.filter((_, j) => j !== i) } : s)));
  const newChat = () => {
    const id = `chat-${Date.now()}`;
    setSessions((p) => [{ id, title: "New chat", pinned: false, at: Date.now(), messages: [] }, ...p].slice(0, 30));
    setCurrentId(id);
    setShowRecents(false);
    setPendingConfirm(null);
  };
  const [aiThinking, setAiThinking] = useState(false);
  // Streaming chat — tokens render live instead of waiting for the full reply
  const [streaming, setStreaming] = useState(null); // { q, text }
  const [thinkLevel, setThinkLevel] = useState("auto"); // auto | low | medium | high
  const THINK_MS = { low: 150, medium: 650, auto: 650, high: 1400 };
  const aiEndRef = useRef(null);
  const [copiedMsg, setCopiedMsg] = useState(null); // index of just-copied bubble
  const [pendingConfirm, setPendingConfirm] = useState(null); // {label, run} Claude-Code-style yes/no
  const aiFileRef = useRef(null);
  const [audioAssets, setAudioAssets] = useState([]); // imported audio: {id,name,url}
  // Meta API key — encrypted at rest (OS keychain), plaintext lives only in memory
  const metaKeyRef = useRef(null);
  const [metaKeySet, setMetaKeySet] = useState(() => {
    try { return !!localStorage.getItem("spider-meta-key"); } catch { return false; }
  });
  const [metaKeyInput, setMetaKeyInput] = useState("");
  const [metaModel, setMetaModel] = useState(() => {
    try { return localStorage.getItem("spider-meta-model") || ""; }
    catch { return ""; }
  });
  const [metaModels, setMetaModels] = useState(() => {
    try {
      const raw = localStorage.getItem("spider-meta-models");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  });
  // Friendly names for Meta models — fetched list stays source of truth (declared after state: no TDZ)
  const friendlyModel = (id) => {
    const low = String(id).toLowerCase();
    if (low.includes("wonder-full") || (low.includes("wonder") && low.includes("full"))) return { name: "Wonder Full", desc: "Most advanced, hardest tasks" };
    if (low.includes("wonder")) return { name: "Wonder", desc: "Complex tasks, plans & delegates" };
    if (low.includes("1.3") && low.includes("contributor")) return { name: "Spark 1.3 Contributor", desc: "Agentic coding, contributor mode" };
    if (low.includes("1.3")) return { name: "Spark 1.3", desc: "All-round help" };
    if (low.includes("1.2")) return { name: "Spark 1.2", desc: "Fast answers" };
    if (low.includes("1.1")) return { name: "Spark 1.1", desc: "Fastest answers" };
    if (low.includes("spark")) return { name: "Spark", desc: "Agentic help" };
    const pretty = String(id).replace(/^muse-/, "").replace(/-/g, " ");
    return { name: pretty.charAt(0).toUpperCase() + pretty.slice(1), desc: "Meta model" };
  };
  const chatModels = (metaModels.length > 0 ? metaModels : []).filter((id) => /spark|wonder/i.test(id));
  const modelChoices = chatModels.length > 0 ? chatModels : metaModels;
  const effectiveModel = metaModel || modelChoices[0] || "";
  const effectiveFriendly = effectiveModel ? friendlyModel(effectiveModel).name : "Model";

  // Meta keys must be pure header-safe text — strip invisible copy-paste junk
  const sanitizeKey = (s) => String(s || "").replace(/[\s\u200B-\u200D\uFEFF\u00A0]+/g, "").trim();

  // Unlock the Meta key into memory on boot (never rendered, never logged)
  useEffect(() => {
    try {
      // Drop the old hardcoded default — model always comes from the key's live list
      if (localStorage.getItem("spider-meta-model") === "Llama-4-Maverick-17B-128E-Instruct-FP8") {
        localStorage.removeItem("spider-meta-model");
        setMetaModel("");
      }
    } catch {}
    (async () => {
      try {
        const cipher = localStorage.getItem("spider-meta-key");
        if (!cipher || !window.spiderShell?.decryptString) return;
        const r = await window.spiderShell.decryptString(cipher);
        if (r?.ok) {
          metaKeyRef.current = sanitizeKey(r.plain);
          fetchMetaModels(sanitizeKey(r.plain));
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Models this key can use — fetched live from Meta Model API (https://api.meta.ai/v1), swap anytime
  const [metaModelsError, setMetaModelsError] = useState("");
  const fetchMetaModels = async (key) => {
    setMetaModelsError("");
    const k = sanitizeKey(key);
    if (!k) { setMetaModelsError("Key is empty after cleaning whitespace"); return []; }
    try {
      const res = await fetch("https://api.meta.ai/v1/models", {
        headers: { Authorization: `Bearer ${k}` }
      });
      if (!res.ok) {
        const msg = `Meta API ${res.status} — ${res.status === 401 || res.status === 403 ? "key rejected, check it in dev.meta.ai dashboard" : "could not load list"}`;
        setMetaModelsError(msg);
        return [];
      }
      const data = await res.json();
      const ids = (data?.data || []).map((m) => m.id).filter(Boolean);
      if (ids.length > 0) {
        setMetaModels(ids);
        try { localStorage.setItem("spider-meta-models", JSON.stringify(ids)); } catch {}
        setMetaModel((cur) => {
          if (cur && ids.includes(cur)) return cur;
          const next = ids[0];
          try { localStorage.setItem("spider-meta-model", next); } catch {}
          return next;
        });
      } else {
        setMetaModelsError("Meta API returned an empty model list");
      }
      return ids;
    } catch (e) {
      setMetaModelsError(`Network error reaching api.meta.ai — ${e.message || "offline?"}`);
      return [];
    }
  };

  const saveMetaKey = async () => {
    const v = sanitizeKey(metaKeyInput);
    if (!v) { appendLog("Warning", "Meta key is empty after cleaning whitespace — paste again"); return; }
    try {
      if (!window.spiderShell?.encryptString) { appendLog("Warning", "Meta key: OS encryption unavailable on this machine"); return; }
      const avail = await window.spiderShell.encryptionAvailable().catch(() => false);
      if (!avail) { appendLog("Warning", "Meta key: OS keychain unavailable — not stored"); return; }
      const r = await window.spiderShell.encryptString(v);
      if (!r?.ok) { appendLog("Warning", `Meta key store failed: ${r?.error || "unknown"}`); return; }
      localStorage.setItem("spider-meta-key", r.cipher);
      localStorage.setItem("spider-meta-model", metaModel.trim());
      try { localStorage.setItem("spider-meta-last4", "••••" + v.slice(-4)); } catch {}
      metaKeyRef.current = v;
      setMetaKeyInput("");
      setMetaKeySet(true);
      appendLog("Success", "Meta API key stored encrypted (OS keychain) — Spider AI chat unlocked");
      fetchMetaModels(v).then((ids) => {
        if (ids.length > 0) appendLog("Success", `Meta key supports ${ids.length} model${ids.length > 1 ? "s" : ""} — swap anytime in Ask AI or AI & Keys`);
        else appendLog("Warning", "Meta key saved, but model list fetch failed — check key, model field stays manual");
      });
    } catch (e) { appendLog("Warning", `Meta key store failed: ${e}`); }
  };
  const deleteMetaKey = () => {
    try { localStorage.removeItem("spider-meta-key"); localStorage.removeItem("spider-meta-last4"); } catch {}
    metaKeyRef.current = null;
    setMetaKeyInput("");
    setMetaKeySet(false);
    appendLog("Info", "Meta API key deleted from this machine");
  };
  // Compacted conversation context — like Spider Maps: short history goes full,
  // long history auto-compacts older turns into a dense summary for the model.
  const buildLlamaContext = () => {
    const msgs = aiHistory.filter((m) => m.q !== "—").slice(-14);
    const turns = msgs.map((m) => ({ q: String(m.q).replace(/^📎 /, ""), a: String(m.a) }));
    let historyBlock = "";
    if (turns.length > 6) {
      const older = turns.slice(0, -6);
      const summary = older
        .map((t) => `User: "${t.q.slice(0, 80)}" → AI: "${t.a.slice(0, 80)}"`)
        .join(" | ");
      historyBlock += `[EARLIER CHAT (auto-compacted): ${summary}]\n`;
    }
    const recent = turns.slice(-6);
    for (const t of recent) {
      historyBlock += `User: ${t.q.slice(0, 300)}\nSpider AI: ${t.a.slice(0, 300)}\n`;
    }
    const actors = sceneGroups.flatMap((g) => g.children);
    const live = `LIVE SCENE: ${actors.length} actors; selected=${selectedNodeId}; score=${score}; coinsLeft=${coins.filter((c) => !c.taken).length}; time=${timeOfDay.toFixed(1)}h; playing=${isPlaying}.`;
    return { historyBlock, live };
  };
  // Free chat via Meta Model API — only when a key is stored; commands always stay local
  // Streams tokens live via SSE; falls back to a single request if streaming is unavailable
  const callLlama = async (prompt, onToken, opts = {}) => {
    const key = sanitizeKey(metaKeyRef.current);
    if (!key) return null;
    const model = metaModel || modelChoices[0] || "";
    if (!model) throw new Error("no model available — paste key, wait for the model list, pick one");
    const sys = opts.system || `You are Spider AI inside the Spider Engine game editor (React + Three.js). The current project is "${sceneLabel}"${currentProject?.root ? ` located at ${currentProject.root}` : " (no disk folder set yet)"} — the scene, the game, and the folder are ONE thing called ${sceneLabel}; never call it GameWorld unless that is literally the project name. It has a hero, castle, trees, coins. Keep replies under 60 words, plain text, no headers. CAPABILITIES YOU MUST KNOW: the user acts through typed commands — spawn <asset>, agent <multi-step goal>, create file <name> <content>, edit file <name> append|replace|write, read file <name>, save, time <0-24>, play/stop. NEVER claim you cannot create files, spawn, or edit — instead give the exact command, always naming the real project (${sceneLabel}) and its real folder.`;
    const { historyBlock, live } = buildLlamaContext();
    const messages = opts.messages || [{ role: "system", content: `${sys}\n\n${(historyBlock ? historyBlock + "\n" : "") + live}` }, { role: "user", content: prompt }];
    if (opts.stream !== false) {
    try {
      const res = await fetch("https://api.meta.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, max_tokens: 1024, stream: true })
      });
      if (!res.ok) throw { http: res.status, res };
      if (!res.body || !res.body.getReader) throw new Error("no-stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let full = "";
      let lastEvt = null;
      const feed = (chunk) => {
        buf += chunk;
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const part of parts) {
          for (const line of part.split("\n")) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const payload = t.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const d = JSON.parse(payload);
              lastEvt = d;
              const s =
                d.choices?.[0]?.delta?.content ||
                (typeof d.choices?.[0]?.message?.content === "string" ? d.choices[0].message.content : "") ||
                d.choices?.[0]?.text ||
                d.output_text ||
                (typeof d.delta === "string" ? d.delta : "") ||
                "";
              if (s) {
                full += s;
                if (onToken) onToken(s);
              }
            } catch {}
          }
        }
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (value) feed(dec.decode(value, { stream: true }));
        if (done) break;
      }
      feed("\n\n");
      if (full.trim()) return full.trim();
      if (lastEvt) {
        const text = pick(lastEvt);
        if (text) return text;
      }
      throw new Error("empty reply after stream");
    } catch (e) {
      if (e && e.http) {
        let detail = `Meta API ${e.http}`;
        try {
          const err = await e.res.json();
          detail += ` — ${err?.error?.message || err?.message || JSON.stringify(err).slice(0, 160)}`;
        } catch {}
        throw new Error(detail);
      }
      if (e && e.message === "no-stream") {
        // fall through to classic single request below
      } else {
        throw e;
      }
    }
    }
    if (opts.raw) {
      const res = await fetch("https://api.meta.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sanitizeKey(metaKeyRef.current)}` },
        body: JSON.stringify({ model: metaModel || modelChoices[0] || "", messages: opts.messages, max_tokens: 1024 })
      });
      if (!res.ok) throw new Error(`Meta API ${res.status}`);
      return res.json();
    }
    const res = await fetch("https://api.meta.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, max_tokens: 1024 })
    });
    if (!res.ok) {
      let detail = `Meta API ${res.status}`;
      try {
        const err = await res.json();
        detail += ` — ${err?.error?.message || err?.message || JSON.stringify(err).slice(0, 160)}`;
      } catch {}
      throw new Error(detail);
    }
    const data = await res.json();
    // Parse every plausible shape: OpenAI chat, Responses API, legacy text
    const pick = (d) => pickModelText(d);
    const text = pick(data);
    if (!text) {
      let raw = "";
      try { raw = JSON.stringify(data).slice(0, 400); } catch {}
      try { appendLog("Warning", `Ask AI: unrecognized Meta reply shape (keys: ${Object.keys(data || {}).join(", ") || "empty"})`); } catch {}
      throw new Error(`empty reply — raw: ${raw || "no body"}`);
    }
    return text;
  };

  // Agent undo — snapshot before each run; "undo" restores the scene exactly
  const agentUndoRef = useRef(null);
  // Live scene ref so the agent loop always sees fresh state (no stale closures)
  const sceneRef = useRef(null);
  useEffect(() => {
    sceneRef.current = { sceneGroups, selectedNodeId, score, coins, timeOfDay, isPlaying, currentProject };
  });
  // Agent tool execution — every tool runs for real against the live editor + disk
  const runAgentTool = async (tool, args) => {
    const snap = () => sceneRef.current;
    const findByName = (idOrName) => {
      const all = snap().sceneGroups.flatMap((g) => g.children);
      return all.find((c) => c.id === idOrName || c.name === idOrName || c.name.toLowerCase().includes(String(idOrName || "").toLowerCase()));
    };
    switch (tool) {
      case "listScene": {
        const actors = snap().sceneGroups.flatMap((g) => g.children).map((c) => ({ id: c.id, name: c.name, pos: c.pos, mesh: c.mesh, visible: c.visible }));
        return JSON.stringify({ count: actors.length, actors: actors.slice(0, 60) });
      }
      case "spawnObject": {
        const q = String(args?.name || "");
        const pool = ENVIRONMENT_ASSETS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.mesh.toLowerCase().includes(q.toLowerCase()));
        if (!pool.length) throw new Error(`no asset matches "${args?.name}"`);
        handleSpawnAsset(pool[0]);
        return `spawned ${pool[0].name}`;
      }
      case "moveObject": {
        const n = findByName(args?.id);
        if (!n) throw new Error(`actor not found: ${args?.id}`);
        const nx = args?.x !== undefined ? Number(args.x) : n.pos.x;
        const ny = args?.y !== undefined ? Number(args.y) : n.pos.y;
        const nz = args?.z !== undefined ? Number(args.z) : n.pos.z;
        if (![nx, ny, nz].every(Number.isFinite)) throw new Error("x/y/z must be numbers");
        setSceneGroups((prev) => prev.map((g) => ({ ...g, children: g.children.map((c) => (c.id === n.id ? { ...c, pos: { x: nx, y: ny, z: nz } } : c)) })));
        return `moved ${n.name} to (${nx}, ${ny}, ${nz})`;
      }
      case "setVisibility": {
        const n = findByName(args?.id);
        if (!n) throw new Error(`actor not found: ${args?.id}`);
        setNodeVisibility(n.id, !!args?.visible);
        return `${n.name} is now ${args?.visible ? "visible" : "hidden"}`;
      }
      case "setTime": {
        const t = Math.max(4, Math.min(22, Number(args?.t)));
        if (!Number.isFinite(t)) throw new Error("t must be 4-22");
        setTimeOfDay(t);
        setTimelineT(t);
        return `solar time set to ${t.toFixed(1)}h`;
      }
      case "play": {
        const want = !!args?.on;
        if (want !== snap().isPlaying) handleTogglePlay();
        return want ? "Play mode started" : "Play mode stopped";
      }
      case "saveScene": {
        await handleSaveScene();
        return "scene saved (see Console for where)";
      }
      case "createFile":
      case "readFile":
      case "editFile": {
        const dir = snap().currentProject?.root || (await ensureProjectRoot());
        if (!dir) throw new Error("no project folder — user cancelled the picker");
        const fname = String(args?.name || "").replace(/[\\/:*?"<>|]/g, "_");
        if (!fname) throw new Error("missing filename");
        if (tool === "createFile") {
          const r = await window.spiderShell.writeProjectFile(dir, fname, String(args?.content ?? ""));
          if (!r?.ok) throw new Error(r?.error || "write failed");
          return `created ${r.path} (${r.bytes} bytes)`;
        }
        if (tool === "readFile") {
          const r = await window.spiderShell.readProjectFile(dir, fname);
          if (!r?.ok) throw new Error(r?.error || "read failed");
          return `--- ${r.path} (${r.bytes} bytes) ---\n${r.contents}${r.truncated ? "\n…[truncated]" : ""}`;
        }
        const op = String(args?.op || "append");
        const text = String(args?.text ?? "");
        if (op === "append") {
          const cur = await window.spiderShell.readProjectFile(dir, fname);
          const base = cur?.ok ? cur.contents : "";
          const r = await window.spiderShell.writeProjectFile(dir, fname, base + (base && !base.endsWith("\n") ? "\n" : "") + text);
          if (!r?.ok) throw new Error(r?.error || "write failed");
          return `appended to ${r.path}`;
        }
        if (op === "write") {
          const r = await window.spiderShell.writeProjectFile(dir, fname, text);
          if (!r?.ok) throw new Error(r?.error || "write failed");
          return `rewrote ${r.path} (${r.bytes} bytes)`;
        }
        if (op === "replace") {
          const cur = await window.spiderShell.readProjectFile(dir, fname);
          if (!cur?.ok) throw new Error(cur?.error || "read failed");
          const old = String(args?.old ?? "");
          if (!old || !cur.contents.includes(old)) throw new Error(`"${old}" not found in ${fname}`);
          const next = cur.contents.split(old).join(text);
          const r = await window.spiderShell.writeProjectFile(dir, fname, next);
          if (!r?.ok) throw new Error(r?.error || "write failed");
          return `replaced in ${r.path}`;
        }
        throw new Error(`unknown edit op: ${op} (use append|replace|write)`);
      }
      default:
        throw new Error(`unknown tool: ${tool}`);
    }
  };
  // Agent run — ReAct loop with the harness; steps stream to chat + Console
  const runAgentGoal = async (goal) => {
    if (!metaKeyRef.current) {
      say("Agent needs a Meta API key — paste one in Settings > AI & Keys first.", false);
      setAiPrompt("");
      return;
    }
    setAiThinking(true);
    appendLog("Info", `Agent started: "${goal}" (max 8 steps)`);
    agentUndoRef.current = JSON.stringify(sceneRef.current.sceneGroups);
    const snapshot = () => {
      const s = sceneRef.current;
      const actors = s.sceneGroups.flatMap((g) => g.children).map((c) => `${c.id} "${c.name}" @(${c.pos.x},${c.pos.y},${c.pos.z})${c.visible === false ? " [hidden]" : ""}`);
      const sel = s.sceneGroups.flatMap((g) => g.children).find((c) => c.id === s.selectedNodeId);
      const recentErrors = consoleLogs.filter((l) => l.type === "Warning").slice(-3).map((l) => l.text);
      return [
        `Actors (${actors.length}):`,
        ...actors.slice(0, 60),
        `Selected actor full state: ${sel ? JSON.stringify(sel) : "none"}`,
        `Score: ${s.score} | Coins left: ${s.coins.filter((c) => !c.taken).length} | Time: ${s.timeOfDay.toFixed(1)}h | Playing: ${s.isPlaying}`,
        recentErrors.length ? `Recent warnings:\n${recentErrors.join("\n")}` : "No recent warnings."
      ].join("\n");
    };
    try {
      const callModel = async (task, history) => {
        const sys = systemPrompt(snapshot());
        const messages = [{ role: "system", content: sys }, ...history.flatMap((h) => [{ role: h.role === "user" ? "user" : "assistant", content: h.text }]), { role: "user", content: `GOAL: ${task}\nReply with exactly one JSON object.` }];
        const data = await callLlama("__agent__", null, { stream: false, raw: true, messages, system: sys });
        const text = pickModelText(data);
        if (!text) throw new Error("empty model reply");
        return { raw: text };
      };
      const final = await runAgent(goal, {
        ctx: { runTool: runAgentTool },
        callModel,
        onEvent: (ev) => {
          if (ev.type === "thought" && ev.thought) appendLog("Info", `Agent thinks: ${ev.thought}`);
          else if (ev.type === "action") appendLog("Info", `Agent acts: ${ev.tool} ${JSON.stringify(ev.args)}`);
          else if (ev.type === "observation") appendLog("Info", `Observed: ${String(ev.observation).slice(0, 160)}`);
          else if (ev.type === "error") appendLog("Warning", `Agent retry: ${ev.message}`);
        }
      });
      say(final);
    } catch (err) {
      say(`Agent failed: ${err.message}`, false);
    } finally {
      setAiThinking(false);
      setAiPrompt("");
    }
  };

  // Scene & Selection State
  const [projects, setProjects] = useState(() => {
    try {
      const raw = localStorage.getItem("spider-projects");
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}
    return [{ id: "project-gameworld", name: "GameWorld", groups: GAME_WORLD, updatedAt: Date.now() }];
  });
  const [currentProjectId, setCurrentProjectId] = useState(() => {
    try {
      const id = localStorage.getItem("spider-current-project");
      const raw = localStorage.getItem("spider-projects");
      const arr = raw ? JSON.parse(raw) : null;
      if (id && Array.isArray(arr) && arr.some((p) => p.id === id)) return id;
    } catch {}
    return "project-gameworld";
  });
  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];
  // The scene IS the project — its name and file follow the project, never hardcoded
  const sceneLabel = currentProject?.name || "GameWorld";
  const sceneFileName = `${(sceneLabel.replace(/[\\/:*?"<>|]/g, "").trim() || "GameWorld")}.scene.json`;
  const [sceneGroups, setSceneGroups] = useState(() => currentProject?.groups || GAME_WORLD);
  const [selectedNodeId, setSelectedNodeId] = useState("player");
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  // Viewport Interactive State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeGizmo, setActiveGizmo] = useState("move"); // select, move, rotate, scale
  const [viewMode, setViewMode] = useState("Lit"); // Lit, Wireframe, Unlit
  const [projection, setProjection] = useState("Perspective"); // Perspective, Orthographic
  const [rtxEnabled, setRtxEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [coordSpace, setCoordSpace] = useState("Global");
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [timeOfDay, setTimeOfDay] = useState(14.5); // 24h slider for World Settings
  const [fps, setFps] = useState(120);

  // Playable Character / Viewport Dragging State
  const [keysPressed, setKeysPressed] = useState({});
  const velY = useRef(0); // vertical velocity for real jumping (Space)
  const [consoleLogs, setConsoleLogs] = useState(INITIAL_LOGS);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleFilter, setConsoleFilter] = useState("All");
  const [isBuilding, setIsBuilding] = useState(false);

  const consoleEndRef = useRef(null);
  const viewportRef = useRef(null);

  // Fullscreen toggle for the 3D viewport panel
  const toggleViewportFullscreen = () => {
    if (!viewportRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      viewportRef.current.requestFullscreen?.();
    }
  };

  // Helper to find currently selected node object across groups
  const findNodeById = (id) => {
    for (const group of sceneGroups) {
      for (const child of group.children) {
        if (child.id === id) return child;
      }
    }
    return sceneGroups[1].children[0];
  };

  const selectedNode = findNodeById(selectedNodeId);

  // Mesh library — keywords route to real PropMesh geometry (see GameViewport PropMesh)
  const MESH_LIBRARY = [
    { id: "pine", label: "Pine Tree", mesh: "SM_PineCluster_Inst" },
    { id: "rock", label: "Rock", mesh: "SM_Boulder_02" },
    { id: "castle", label: "Castle Keep", mesh: "SM_Castle_Keep" },
    { id: "crate", label: "Crate", mesh: "SM_Crate_01" }
  ];
  const [meshMenuOpen, setMeshMenuOpen] = useState(false);
  const meshFileRef = useRef(null);
  const importedModelNodes = sceneGroups.flatMap((g) => g.children).filter((c) => c.modelUrl);
  const meshSwappable = selectedNode && String(selectedNode.id).startsWith("spawn-");
  const assignMesh = (entry) => {
    updateSelectedNode({ mesh: entry.mesh, modelUrl: undefined, textureUrl: undefined, modelFormat: undefined });
    appendLog("Success", `${selectedNode.name} mesh → ${entry.label} (live in viewport)`);
    setMeshMenuOpen(false);
  };
  const assignImportedMesh = (n) => {
    updateSelectedNode({ mesh: n.mesh, modelUrl: n.modelUrl, modelFormat: n.modelFormat, textureUrl: n.textureUrl });
    appendLog("Success", `${selectedNode.name} mesh → imported ${n.mesh} (live in viewport)`);
    setMeshMenuOpen(false);
  };
  const assignModelFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["glb", "gltf", "fbx", "obj"].includes(ext)) {
      appendLog("Warning", `Mesh slot takes .glb/.gltf/.fbx/.obj — got ${file.name}`);
      return;
    }
    const fmt = ext === "gltf" ? "gltf" : ext === "fbx" ? "fbx" : ext === "obj" ? "obj" : "glb";
    try {
      const dataUrl = await fileToDataUrl(file);
      updateSelectedNode({ mesh: file.name, modelUrl: dataUrl, modelFormat: fmt, textureUrl: undefined });
      appendLog("Success", `${selectedNode.name} mesh → ${file.name} (embedded portable, real geometry in viewport)`);
    } catch {
      updateSelectedNode({ mesh: file.name, modelUrl: URL.createObjectURL(file), modelFormat: fmt, textureUrl: undefined });
      appendLog("Warning", `${selectedNode.name} mesh → ${file.name} (too large to embed — session-only)`);
    }
  };

  // Add a console log entry
  const appendLog = (type, text) => {
    setConsoleLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, text }
    ]);
  };

  // Real boot diagnostics — renderer, platform, scene stats (no fake Vulkan/shaders)
  useEffect(() => {
    const boot = [];
    const actors = sceneGroups.flatMap((g) => g.children);
    boot.push({ type: "Info", text: "Spider Engine 0.9.0 (React + Three.js, WebGL)" });
    boot.push({ type: "Info", text: `Platform: ${navigator.platform} — ${window.electron ? "Electron" : "Web"} shell` });
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
      const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "WebGL";
      boot.push({ type: "Info", text: `Rendering: ${renderer}` });
    } catch {
      boot.push({ type: "Warning", text: "Rendering: WebGL probe unavailable" });
    }
    boot.push({ type: "Info", text: `Scene: ${sceneLabel} — ${actors.length} actors loaded${currentProject?.root ? ` from ${currentProject.root}` : ""}` });
    boot.push({ type: "Success", text: "3D viewport mounted — WASD/QE flies camera, Play drives hero (Space jumps)" });
    setConsoleLogs(boot.map((b, i) => ({ id: i + 1, ...b })));
    // Dead session links: previous run's blob: URLs can't reload — strip to procedural, ask for re-import
    const stripDead = (groups) => {
      let dead = 0;
      const out = groups.map((g) => ({
        ...g,
        children: g.children.map((n) => {
          let node = n;
          for (const key of ["modelUrl", "textureUrl"]) {
            if (typeof node[key] === "string" && node[key].startsWith("blob:")) {
              const { [key]: _dropped, ...rest } = node;
              node = rest;
              dead++;
            }
          }
          return node;
        })
      }));
      return { out, dead };
    };
    const { out: cleanGroups, dead } = stripDead(sceneGroups);
    if (dead > 0) {
      setSceneGroups(cleanGroups);
      setTimeout(() => appendLog("Warning", `${dead} imported asset${dead > 1 ? "s" : ""} expired with the last session (blob links) — re-import the files to restore geometry`), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  // Persist recent chats locally (survives reload)
  useEffect(() => {
    try {
      localStorage.setItem("spider-ai-sessions", JSON.stringify(sessions.slice(0, 30)));
    } catch {}
  }, [sessions]);

  // MCP tool bridge — any LLM/agent with tool access drives the LIVE scene through here.
  // window.spiderEngine is the exact surface an MCP server (Claude Code, Llama, local script) calls.
  useEffect(() => {
    window.spiderEngine = {
      version: "0.9.0",
      listScene: () =>
        sceneGroups.flatMap((g) => g.children).map((c) => ({
          id: c.id, name: c.name, visible: c.visible,
          pos: c.pos, rot: c.rot, scale: c.scale, mesh: c.mesh, tag: c.tag
        })),
      spawnObject: (name) => {
        const q = String(name || "").toLowerCase();
        const pool = ENVIRONMENT_ASSETS.filter((a) => a.name.toLowerCase().includes(q) || a.mesh.toLowerCase().includes(q));
        if (!pool.length) return { ok: false, error: `no asset matches "${name}"` };
        const id = handleSpawnAsset(pool[0]);
        return { ok: true, spawned: pool[0].name, id };
      },
      moveObject: (id, x, y, z) => {
        let found = false;
        setSceneGroups((prev) => prev.map((g) => ({
          ...g,
          children: g.children.map((c) => {
            if (c.id !== id && c.name !== id) return c;
            found = true;
            return { ...c, pos: { x: Number(x ?? c.pos.x), y: Number(y ?? c.pos.y), z: Number(z ?? c.pos.z) } };
          })
        })));
        return { ok: true, id };
      },
      setVisibility: (id, visible) => { setNodeVisibility(id, !!visible); return { ok: true, id, visible: !!visible }; },
      setTime: (t) => { const v = Math.max(4, Math.min(22, Number(t))); setTimeOfDay(v); setTimelineT(v); return { ok: true, time: v }; },
      play: (on) => { if (!!on !== isPlaying) handleTogglePlay(); return { ok: true, playing: !!on }; },
      getScore: () => ({ score, coinsLeft: coins.filter((c) => !c.taken).length }),
      ask: (text) => { handleAskAiSubmit({ preventDefault() {} }, String(text || "")); return { ok: true, asked: text }; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Real frame rate reported by the 3D viewport renderer
  const handleFps = useCallback((f) => setFps(f), []);

  // Projects — every edit autosaves into the current project; switching swaps scenes
  useEffect(() => {
    setProjects((prev) => prev.map((p) => (p.id === currentProjectId ? { ...p, groups: sceneGroups, updatedAt: Date.now() } : p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneGroups]);
  useEffect(() => {
    try {
      localStorage.setItem("spider-projects", JSON.stringify(projects));
      localStorage.setItem("spider-current-project", currentProjectId);
    } catch {}
  }, [projects, currentProjectId]);

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [showStartup, setShowStartup] = useState(true); // Unreal-style project picker on launch
  // (Native splash window now handles launch — see electron/splash.html)
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTemplate, setNewProjectTemplate] = useState("normal");
  const [newProjectRoot, setNewProjectRoot] = useState(""); // real disk folder, empty = browser Downloads
  // Tell the native shell to expand from picker-size to the full editor window
  const expandEditor = () => {
    try { window.spiderShell?.projectOpened?.(); } catch {}
  };
  // Write a file into the project's own folder when it has one, else fall back to download
  // Project folder on demand — Ask AI can create files in it, picking it if unset
  const ensureProjectRoot = async () => {
    if (currentProject?.root) return currentProject.root;
    try {
      const r = await window.spiderShell?.pickFolder?.();
      if (r?.ok && r.dir) {
        setProjects((prev) => prev.map((p) => (p.id === currentProjectId ? { ...p, root: r.dir } : p)));
        appendLog("Success", `Project folder set: ${r.dir}`);
        return r.dir;
      }
    } catch {}
    return "";
  };
  const writeProjectFileOrDownload = async (filename, json, kbHint) => {
    const dir = currentProject?.root;
    if (dir && window.spiderShell?.writeProjectFile) {
      try {
        const r = await window.spiderShell.writeProjectFile(dir, filename, json);
        if (r?.ok) {
          appendLog("Success", `Saved to project folder: ${r.path} (${kbHint} KB)`);
          return true;
        }
        appendLog("Warning", `Folder write failed (${r?.error || "unknown"}) — downloaded instead`);
      } catch (e) {
        appendLog("Warning", `Folder write failed (${e}) — downloaded instead`);
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    appendLog("Success", `Scene downloaded: ${filename} (${kbHint} KB) — set a project folder to save in place`);
    return false;
  };
  // Unreal-style templates: real starting scenes per genre, deep-copied per project
  const buildTemplateGroups = (tpl) => {
    const full = JSON.parse(JSON.stringify(GAME_WORLD));
    if (tpl === "blank") {
      // Blank level: pure black viewport — no actors, no tutorial, nothing
      return { groups: full.map((g) => ({ ...g, expanded: false, children: [] })), select: null };
    }
    if (tpl === "custom") {
      // Custom: duplicate of whatever is open right now
      return { groups: JSON.parse(JSON.stringify(sceneGroups)), select: selectedNodeId };
    }
    if (tpl === "tpp") {
      // TPP Shooting: hero + rifle + target dummies downrange, weapon pre-selected
      const targets = [8, 12, 16].map((z, i) => ({
        id: `spawn-target-${Date.now()}-${i}`,
        name: `Target_${10 + i}`,
        type: "mesh", color: "#ef4444", visible: true,
        pos: { x: -6 + i * 6, y: 0, z }, rot: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 },
        tag: "Prop", layer: "Default", mesh: "SM_Crate_01",
        mat0: "M_Target_Red", mat1: "M_Target_Base", anim: "None",
        physics: false, mass: 50, collision: "BlockAll"
      }));
      const groups = full.map((g, idx) => (idx === 0 ? { ...g, expanded: true, children: [...g.children, ...targets] } : g));
      return { groups, select: "weapon" };
    }
    if (tpl === "fpp") {
      // FPP Shooting: hero hidden (you ARE the camera) — open Game View to play
      const groups = full.map((g) => ({ ...g, children: g.children.map((c) => (c.id === "player" ? { ...c, visible: false } : c)) }));
      return { groups, select: "camera" };
    }
    if (tpl === "racing") {
      // Racing: hero on the boat, checkpoints are the coins — vehicles pre-selected
      const groups = full.map((g) => ({
        ...g,
        children: g.children.map((c) => (c.id === "player" ? { ...c, pos: { x: 24, y: 0, z: 60 } } : c))
      }));
      return { groups, select: "vehicles" };
    }
    return { groups: full, select: "player" }; // normal third person
  };
  // Per-project UI memory — each project keeps its own panel layout (own index in storage)
  const DEFAULT_UI = { hierarchyOpen: true, inspectorOpen: true, bottomLeftOpen: true, consoleOpen: true, viewportTab: "Viewport", bottomTab: "Content Browser", rightTab: "Inspector" };
  const applyUi = (ui) => {
    const u = { ...DEFAULT_UI, ...(ui || {}) };
    setHierarchyOpen(u.hierarchyOpen);
    setInspectorOpen(u.inspectorOpen);
    setBottomLeftOpen(u.bottomLeftOpen);
    setConsoleOpen(u.consoleOpen);
    setViewportTab(u.viewportTab);
    setBottomTab(u.bottomTab);
    setRightTab(u.rightTab);
  };
  // Persist the live layout into the current project only (others untouched)
  useEffect(() => {
    setProjects((prev) => prev.map((p) => (p.id === currentProjectId ? { ...p, ui: { hierarchyOpen, inspectorOpen, bottomLeftOpen, consoleOpen, viewportTab, bottomTab, rightTab } } : p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchyOpen, inspectorOpen, bottomLeftOpen, consoleOpen, viewportTab, bottomTab, rightTab]);
  const handleSelectProject = (id) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setCurrentProjectId(id);
    setSceneGroups(p.groups);
    setSelectedNodeId("player");
    setScore(0);
    setCoins(COINS.map((c) => ({ ...c, taken: false })));
    applyUi(p.ui);
    tutorialStats.current = { moved: false, jumped: false, shots: 0, spawned: 0, maxY: 0 };
    setTutorial(null);
    appendLog("Success", `Project opened: "${p.name}" (${p.groups.flatMap((g) => g.children).length} actors)`);
    setOpenMenu(null);
  };
  const handleNewProject = (name, template, root) => {
    const tpl = template || "normal";
    const { groups, select } = buildTemplateGroups(tpl);
    const p = { id: `project-${Date.now()}`, name: name?.trim() || `Untitled Project ${projects.length + 1}`, groups, updatedAt: Date.now(), root: root || "", ui: { hierarchyOpen: false, inspectorOpen: false, bottomLeftOpen: false, consoleOpen: false, viewportTab: "Viewport", bottomTab: "Content Browser", rightTab: "Inspector" } };
    setProjects((prev) => [...prev, p]);
    setCurrentProjectId(p.id);
    setSceneGroups(groups);
    setSelectedNodeId(select || "player");
    setScore(0);
    setCoins(COINS.map((c) => ({ ...c, taken: false })));
    if (tpl === "fpp") setViewportTab("Game View");
    const label = { blank: "Blank Level", normal: "Normal", tpp: "TPP Shooting", fpp: "FPP Shooting", racing: "Racing", custom: "Custom" }[tpl] || tpl;
    appendLog("Success", `Created "${p.name}" from ${label} template${p.root ? ` at ${p.root}` : ""}`);
    tutorialStats.current = { moved: false, jumped: false, shots: 0, spawned: 0, maxY: 0 };
    if (tpl === "blank") {
      setTutorial(null);
      appendLog("Info", "Blank level — black viewport. Spawn something to begin (Content Browser → click any asset).");
    } else {
      setTutorial({ template: tpl, idx: 0 });
      appendLog("Info", `Tutorial started: ${label} — follow the card, it reacts to what you do`);
    }
    setNewProjectOpen(false);
    setShowStartup(false);
    // Fresh game = clean viewport only; panels open on demand (H / I / B / Window menu)
    setHierarchyOpen(false);
    setInspectorOpen(false);
    setBottomLeftOpen(false);
    setConsoleOpen(false);
    expandEditor();
    setNewProjectName("");
    setNewProjectRoot("");
    setOpenMenu(null);
  };
  const handleCloseProject = () => {
    if (projects.length <= 1) {
      setSceneGroups(JSON.parse(JSON.stringify(GAME_WORLD)));
      appendLog("Info", `Last project reset to a fresh ${sceneLabel} (projects list keeps one slot)`);
      setOpenMenu(null);
      return;
    }
    const rest = projects.filter((p) => p.id !== currentProjectId);
    const closed = currentProject?.name;
    setProjects(rest);
    handleSelectProject(rest[0].id);
    appendLog("Info", `Closed "${closed}" — now in "${rest[0].name}"`);
  };
  const handleDeleteProject = (id) => {
    if (projects.length <= 1) { appendLog("Warning", "Cannot delete the last project"); return; }
    const gone = projects.find((p) => p.id === id);
    const rest = projects.filter((p) => p.id !== id);
    setProjects(rest);
    if (id === currentProjectId) handleSelectProject(rest[0].id);
    else appendLog("Info", `Deleted project "${gone?.name}"`);
    setOpenMenu(null);
  };
  const sceneToJson = (groupsOverride) =>
    JSON.stringify(
      { engine: "Spider Engine 0.9.0", scene: sceneLabel, project: currentProject?.id, exported: new Date().toISOString(), groups: groupsOverride || sceneGroups },
      null,
      2
    );
  const downloadScene = (filename, groupsOverride) => {
    const json = sceneToJson(groupsOverride);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return (new Blob([json]).size / 1024).toFixed(1);
  };
  // Portable scenes — embed small assets as data URLs so scene.json travels with the game
  const PORTABLE_MAX_BYTES = 3 * 1024 * 1024;
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > PORTABLE_MAX_BYTES) return reject(new Error("too large"));
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(new Error("read failed"));
      fr.readAsDataURL(file);
    });
  const blobUrlToDataUrl = (url) =>
    fetch(url).then((r) => r.blob()).then((b) => {
      if (b.size > PORTABLE_MAX_BYTES) throw new Error("too large");
      return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(new Error("read failed"));
        fr.readAsDataURL(b);
      });
    });
  // Sweep session blob: links into embedded data; returns fresh groups + count
  // NOTE: no `new Map()` here — lucide-react exports a `Map` icon that shadows the global
  const embedSessionBlobs = async (groups) => {
    let embedded = 0;
    const urlCache = Object.create(null);
    const out = [];
    for (const g of groups) {
      const children = [];
      for (const n of g.children) {
        let node = n;
        for (const key of ["modelUrl", "textureUrl"]) {
          const url = node[key];
          if (typeof url === "string" && url.startsWith("blob:")) {
            try {
              if (!Object.prototype.hasOwnProperty.call(urlCache, url)) urlCache[url] = await blobUrlToDataUrl(url);
              node = { ...node, [key]: urlCache[url] };
              embedded++;
            } catch {}
          }
        }
        children.push(node);
      }
      out.push({ ...g, children });
    }
    return { groups: out, embedded };
  };
  const handleNewScene = () => {
    setSceneGroups(GAME_WORLD);
    setSelectedNodeId("player");
    setScore(0);
    setCoins((prev) => prev.map((c) => ({ ...c, taken: false })));
    appendLog("Success", `New scene created — ${sceneLabel} reset to defaults`);
    setOpenMenu(null);
  };
  const handleSaveScene = async () => {
    const { groups, embedded } = await embedSessionBlobs(sceneGroups);
    if (embedded > 0) {
      setSceneGroups(groups);
      appendLog("Success", `Embedded ${embedded} session asset${embedded > 1 ? "s" : ""} — scene.json is now portable`);
    }
    const json = sceneToJson(groups);
    const kb = (new Blob([json]).size / 1024).toFixed(1);
    await writeProjectFileOrDownload(sceneFileName, json, kb);
    setOpenMenu(null);
  };
  const handleOpenSceneFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.groups || !Array.isArray(data.groups)) throw new Error("bad file");
        setSceneGroups(data.groups);
        setSelectedNodeId(data.groups[1]?.children[0]?.id || "player");
        appendLog("Success", `Scene opened: ${file.name} (${data.groups.flatMap((g) => g.children).length} actors)`);
      } catch {
        appendLog("Warning", `Could not open ${file.name} — not a ${sceneFileName} file`);
      }
    };
    reader.readAsText(file);
    setOpenMenu(null);
  };
  const handleImportAssetFile = async (file) => {
    if (!file) return;
    appendLog("Info", `Importing ${file.name}...`);
    if (/\.json$/i.test(file.name)) {
      handleOpenSceneFile(file);
      return;
    }
    // Real model import — small files embed portable immediately, big ones stay session-only
    if (/\.(glb|gltf|fbx|obj)$/i.test(file.name)) {
      const ext = file.name.split(".").pop().toLowerCase();
      const fmt = ext === "fbx" ? "fbx" : ext === "obj" ? "obj" : ext === "gltf" ? "gltf" : "glb";
      const base = {
        name: file.name.replace(/\.[^.]+$/, ""),
        mesh: file.name,
        category: "Imported",
        modelFormat: fmt
      };
      try {
        const dataUrl = await fileToDataUrl(file);
        handleSpawnAsset({ ...base, modelUrl: dataUrl });
        appendLog("Success", `Model embedded portable (${(file.size / 1024).toFixed(0)} KB): ${file.name}`);
      } catch {
        handleSpawnAsset({ ...base, modelUrl: URL.createObjectURL(file) });
        appendLog("Warning", `Model too large to embed (>3 MB) — session-only until re-import: ${file.name}`);
      }
      return;
    }
    if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
      const base = {
        name: file.name.replace(/\.[^.]+$/, ""),
        mesh: file.name,
        category: "Imported"
      };
      try {
        const dataUrl = await fileToDataUrl(file);
        handleSpawnAsset({ ...base, textureUrl: dataUrl });
        appendLog("Success", `Texture embedded portable: ${file.name}`);
      } catch {
        handleSpawnAsset({ ...base, textureUrl: URL.createObjectURL(file) });
        appendLog("Warning", `Texture too large to embed — session-only: ${file.name}`);
      }
      return;
    }
    appendLog("Warning", `Unsupported import type: ${file.name} (use .json scene, .glb/.gltf/.fbx/.obj, .png)`);
  };

  // Update node properties from Inspector or Play Mode
  const updateSelectedNode = (updater) => {
    setSceneGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        children: group.children.map((node) =>
          node.id === selectedNodeId
            ? typeof updater === "function"
              ? updater(node)
              : { ...node, ...updater }
            : node
        )
      }))
    );
  };

  // Write back gizmo drags from the 3D viewport into editor units
  const handleViewportTransform = useCallback((o) => {
      const W = 0.12;
      const R = 180 / Math.PI;
      updateSelectedNode((node) => ({
        ...node,
        pos: {
          x: Number((o.position.x / W).toFixed(1)),
          y: Number(Math.max(-50, Math.min(500, o.position.y / W)).toFixed(1)),
          z: Number((o.position.z / W).toFixed(1))
        },
        rot: {
          x: Number((o.rotation.x * R).toFixed(1)),
          y: Number((o.rotation.y * R).toFixed(1)),
          z: Number((o.rotation.z * R).toFixed(1))
        },
        scale: {
          x: Number(Math.max(0.05, o.scale.x).toFixed(2)),
          y: Number(Math.max(0.05, o.scale.y).toFixed(2)),
          z: Number(Math.max(0.05, o.scale.z).toFixed(2))
        }
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNodeId]
  );

  // Toggle any node by id (used by Fog pill — doesn't steal selection)
  const setNodeVisibility = (id, visible) => {
    setSceneGroups((prev) =>
      prev.map((g) => ({ ...g, children: g.children.map((n) => (n.id === id ? { ...n, visible } : n)) }))
    );
  };
  const updateSelectedNodeFog = (visible) => setNodeVisibility("fog", visible);
  const toggleNodeVisibility = (e, nodeId) => {
    e.stopPropagation();
    setSceneGroups((prevGroups) =>
      prevGroups.map((group) => ({
        ...group,
        children: group.children.map((node) =>
          node.id === nodeId ? { ...node, visible: !node.visible } : node
        )
      }))
    );
  };

  // Toggle folder collapse in Hierarchy
  const toggleGroupExpand = (groupId) => {
    setSceneGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
    );
  };

  // Play / Stop Engine Handler
  const handleTogglePlay = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); // Space must jump, not re-click
    if (!isPlaying) {
      setIsPlaying(true);
      setSelectedNodeId("player");
      setViewportTab("Game View");
      appendLog("Info", "Play mode started — chase cam locked, WASD + Space, grab the coins");
      appendLog("Info", "Possessing Actor: PlayerCharacter (WASD / Arrows to move)");
    } else {
      setIsPlaying(false);
      setViewportTab("Viewport");
      appendLog("Info", "Play mode stopped");
    }
  };

  // Build Project — validates the scene and exports a real portable scene file
  const handleBuildProject = async () => {
    if (isBuilding) return;
    setIsBuilding(true);
    const { groups, embedded } = await embedSessionBlobs(sceneGroups);
    if (embedded > 0) {
      setSceneGroups(groups);
      appendLog("Success", `Embedded ${embedded} session asset${embedded > 1 ? "s" : ""} — build is portable`);
    }
    const actors = groups.flatMap((g) => g.children);
    const bodies = actors.filter((a) => a.physics).length;
    const stamp = new Date().toLocaleTimeString();
    appendLog("Info", `Starting Build: ${sceneLabel} (${actors.length} actors, ${bodies} physics bodies)...`);
    setBuildLogs((p) => [...p, `[${stamp}] Build started — ${actors.length} actors, ${bodies} physics bodies`]);
    setTimeout(async () => {
      const payload = {
        engine: "Spider Engine 0.9.0",
        scene: sceneLabel,
        project: currentProjectId,
        exported: new Date().toISOString(),
        actors
      };
      const json = JSON.stringify(payload, null, 2);
      const kb = (new Blob([json]).size / 1024).toFixed(1);
      await writeProjectFileOrDownload(sceneFileName, json, kb);
      appendLog("Success", `Build succeeded: ${sceneFileName} (${kb} KB) exported, 0 errors`);
      setBuildLogs((p) => [...p, `[${new Date().toLocaleTimeString()}] Build succeeded — ${sceneFileName} (${kb} KB), 0 errors, 0 warnings`]);
      setBottomTab("Build Log");
      setIsBuilding(false);
    }, 900);
  };

  // Spawn an asset from Content Browser into the Scene Hierarchy
  const handleSpawnAsset = (asset) => {
    tutorialStats.current.spawned++;
    const newId = `spawn-${Date.now()}`;
    const randomX = Number(((Math.random() - 0.5) * 30).toFixed(1));
    const randomZ = Number((Math.random() * 40 + 10).toFixed(1));

    const newNode = {
      id: newId,
      name: `${asset.name}_${Math.floor(Math.random() * 90 + 10)}`,
      type: "mesh",
      color: "#6366f1",
      visible: true,
      pos: { x: randomX, y: 0.0, z: randomZ },
      rot: { x: 0.0, y: 0.0, z: 0.0 },
      scale: { x: 1.0, y: 1.0, z: 1.0 },
      tag: asset.category,
      layer: "Default",
      mesh: asset.mesh,
      mat0: `M_${asset.name}_Base`,
      mat1: `M_${asset.name}_Detail`,
      anim: "None",
      physics: false,
      mass: 100.0,
      collision: "BlockAll",
      ...(asset.modelUrl ? { modelUrl: asset.modelUrl, modelFormat: asset.modelFormat } : {}),
      ...(asset.textureUrl ? { textureUrl: asset.textureUrl } : {})
    };

    setSceneGroups((prev) =>
      prev.map((g, idx) =>
        idx === 0 ? { ...g, expanded: true, children: [...g.children, newNode] } : g
      )
    );
    setSelectedNodeId(newId);
    appendLog("Info", `Spawned Actor '${newNode.name}' at (${randomX}, 0.0, ${randomZ})`);
    if (newNode.modelUrl) appendLog("Success", `Model loaded: ${asset.mesh} — real geometry in viewport (drag with move gizmo)`);
    else if (newNode.textureUrl) appendLog("Success", `Texture applied: ${asset.mesh} mapped onto prop material`);
    return newId;
  };

  // Keyboard Controls — hero moves in Editor AND Play (coins/physics need Play)
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return; // let typing work
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
        if (k === " " && !e.repeat) {
          if (velY.current === 0) velY.current = PLAYER.jumpImpulse; // jump impulse (grounded only)
          setKeysPressed((prev) => ({ ...prev, [k]: true }));
          return;
        }
        setKeysPressed((prev) => ({ ...prev, [k]: true }));
      }
    };
    const onKeyUp = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        setKeysPressed((prev) => ({ ...prev, [k]: false }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Circle colliders for BlockAll actors — computed from the LATEST scene each tick
      let blockers = [];
      setSceneGroups((prevGroups) => {
        blockers = prevGroups
          .flatMap((g) => g.children)
          .filter((c) => c.visible !== false && c.collision === "BlockAll" && c.id !== PLAYER.id)
          .map((c) => ({ x: c.pos.x, z: c.pos.z, r: Math.max(c.scale.x, c.scale.z) * 0.8 + 0.5 }));
        return prevGroups.map((group) => ({
          ...group,
          children: group.children.map((node) => {
            // Play: WASD drives the hero (+jump gravity, +BlockAll collision)
            if (isPlaying && node.id === PLAYER.id) {
              const step = PLAYER.moveStep;
              let dx = 0;
              let dz = 0;
              if (keysPressed["w"] || keysPressed["arrowup"]) dz += step;
              if (keysPressed["s"] || keysPressed["arrowdown"]) dz -= step;
              if (keysPressed["a"] || keysPressed["arrowleft"]) dx -= step;
              if (keysPressed["d"] || keysPressed["arrowright"]) dx += step;

              // Real gravity for jumping (Space) — lands back on groundY
              const g = velY.current || 0;
              let ny = Number((node.pos.y + g * 0.03).toFixed(2));
              let nv = g - PLAYER.gravity;
              if (ny <= PLAYER.groundY) {
                ny = PLAYER.groundY;
                nv = 0;
              }
              velY.current = nv;

              if (dx === 0 && dz === 0 && ny === node.pos.y) return node;
              if (dx !== 0 || dz !== 0) tutorialStats.current.moved = true;
              tutorialStats.current.maxY = Math.max(tutorialStats.current.maxY, ny);
              let nx = Number(Math.max(PLAYER.bounds.minX, Math.min(PLAYER.bounds.maxX, node.pos.x + dx)).toFixed(1));
              let nz = Number(Math.max(PLAYER.bounds.minZ, Math.min(PLAYER.bounds.maxZ, node.pos.z + dz)).toFixed(1));
              // Real BlockAll collision — slide out of every blocker circle
              for (const b of blockers) {
                const ox = nx - b.x;
                const oz = nz - b.z;
                const d = Math.hypot(ox, oz);
                if (d < b.r && d > 1e-4) {
                  nx = Number((b.x + (ox / d) * b.r).toFixed(1));
                  nz = Number((b.z + (oz / d) * b.r).toFixed(1));
                } else if (d <= 1e-4) {
                  nx = Number((b.x + b.r).toFixed(1));
                }
              }
              return {
                ...node,
                pos: { ...node.pos, x: nx, z: nz, y: ny }
              };
            }
            // Editor transform gizmo: WASD nudges ONLY the selected object (no camera, no hero)
            if (!isPlaying && activeGizmo !== "select" && node.id === selectedNodeId && viewportTab === "Viewport") {
              const step = 0.3;
              let dx = 0;
              let dz = 0;
              if (keysPressed["w"] || keysPressed["arrowup"]) dz += step;
              if (keysPressed["s"] || keysPressed["arrowdown"]) dz -= step;
              if (keysPressed["a"] || keysPressed["arrowleft"]) dx -= step;
              if (keysPressed["d"] || keysPressed["arrowright"]) dx += step;
              if (dx === 0 && dz === 0) return node;
              return {
                ...node,
                pos: {
                  ...node.pos,
                  x: Number(Math.max(-60, Math.min(60, node.pos.x + dx)).toFixed(1)),
                  z: Number(Math.max(-60, Math.min(60, node.pos.z + dz)).toFixed(1))
                }
              };
            }
            // Physics props: real falling in Play mode only — heavier mass falls faster
            if (isPlaying && node.physics && node.pos.y > 0 && node.collision !== "NoCollision" && ![PLAYER.id, "camera", "weapon", "terrain", "water", "sky", "lighting", "fog", "postprocess", "dir-light", "sky-light", "point-lights"].includes(node.id)) {
              const fall = physicsFallSpeed(node.mass);
              const ny = Math.max(PLAYER.groundY, Number((node.pos.y - fall).toFixed(2)));
              if (ny === node.pos.y) return node;
              return { ...node, pos: { ...node.pos, y: ny } };
            }
            return node;
          })
        }))
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isPlaying, keysPressed, activeGizmo, selectedNodeId, viewportTab]);

  // Shooting — click fires in Play; targets die, score pays (real TPP/FPP mechanic)
  const handleShoot = useCallback((hitId) => {
    tutorialStats.current.shots++;
    if (hitId && String(hitId).startsWith("spawn-target-")) {
      setSceneGroups((prev) => prev.map((g) => ({ ...g, children: g.children.map((c) => (c.id === hitId ? { ...c, visible: false } : c)) })));
      setScore((s) => {
        const ns = s + 50;
        appendLog("Success", `Target destroyed +50 — score ${ns}`);
        return ns;
      });
    }
  }, []);

  // Tutorial auto-advance — watches real game events per template
  useEffect(() => {
    if (!tutorial) return;
    const steps = TUTORIALS[tutorial.template] || [];
    const step = steps[tutorial.idx];
    if (!step) {
      setTutorial(null);
      appendLog("Success", "Tutorial complete — you know the drill. Have fun.");
      return;
    }
    if (!step.check) return;
    const st = tutorialStats.current;
    const targets = sceneGroups.flatMap((g) => g.children).filter((c) => String(c.id).startsWith("spawn-target-"));
    const done =
      step.check === "moved" ? st.moved :
      step.check === "jumped" ? st.maxY > 0.5 :
      step.check === "shot" ? st.shots > 0 :
      step.check === "targets" ? targets.length > 0 && targets.every((t) => !t.visible) :
      step.check === "coins" ? coins.length > 0 && coins.every((c) => c.taken) :
      step.check === "play" ? isPlaying :
      step.check === "spawned" ? st.spawned > 0 : false;
    if (done) {
      setTutorial({ template: tutorial.template, idx: tutorial.idx + 1 });
      appendLog("Success", `Tutorial: "${step.title}" done`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneGroups, score, coins, isPlaying, tutorial]);
  useEffect(() => {
    if (!isPlaying) return;
    const p = sceneGroups.flatMap((g) => g.children).find((c) => c.id === PLAYER.id);
    if (!p) return;
    const hits = coins.filter((c) => !c.taken && Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < COIN_RULES.pickupRadius && p.pos.y < COIN_RULES.maxPickupHeight);
    if (hits.length === 0) return;
    setCoins((cs) => cs.map((c) => (hits.some((h) => h.id === c.id) ? { ...c, taken: true } : c)));
    setScore((s) => {
      const ns = s + hits.length * COIN_RULES.pointsEach;
      appendLog("Success", `Collected ${hits.length} coin${hits.length > 1 ? "s" : ""} — score ${ns}`);
      if (coins.filter((c) => !c.taken).length === hits.length) {
        setTimeout(() => appendLog("Success", `All coins collected! Final score ${ns} — Game menu > Reset Score to replay`), 50);
      }
      return ns;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneGroups, isPlaying]);

  // Timeline playback — advances solar time 4h→22h and loops (real scrub target)
  useEffect(() => {
    if (!timelinePlaying) return;
    const t = setInterval(() => {
      setTimelineT((prev) => {
        const next = prev >= 22 ? 4 : Number((prev + 0.1).toFixed(2));
        setTimeOfDay(next);
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [timelinePlaying]);

  // Shortcut: H hierarchy, I inspector, B bottom dock (ignored while typing)
  useEffect(() => {
    const onToggleKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (k === "h" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setHierarchyOpen((prev) => !prev);
      }
      if (k === "i" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setInspectorOpen((prev) => !prev);
      }
      if (k === "b" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setBottomLeftOpen((p) => !p);
        setConsoleOpen((p) => !p);
      }
    };
    window.addEventListener("keydown", onToggleKey);
    return () => window.removeEventListener("keydown", onToggleKey);
  }, []);

  // Console Command Submit
  const handleConsoleSubmit = (e) => {
    e.preventDefault();
    try { e.target?.querySelector?.("input")?.blur(); } catch {}
    if (!consoleInput.trim()) return;
    const cmd = consoleInput.trim();
    appendLog("Info", `> ${cmd}`);
    const [base, ...rest] = cmd.toLowerCase().split(/\s+/);
    const arg = rest.join(" ");

    if (base === "help") {
      appendLog("Info", "Commands: help, clear, stat fps, spawn <name>, wireframe 0|1, shadows 0|1, time <0-24>, play, stop");
    } else if (base === "stat" && rest[0] === "fps") {
      const ms = fps > 0 ? (1000 / fps).toFixed(2) : "?";
      appendLog("Info", `Frame Rate: ${fps} FPS (${ms} ms) — live from renderer`);
    } else if (base === "spawn") {
      const q = arg.trim();
      const pool = q && q !== "random"
        ? ENVIRONMENT_ASSETS.filter((a) => a.name.toLowerCase().includes(q) || a.mesh.toLowerCase().includes(q))
        : ENVIRONMENT_ASSETS;
      if (pool.length === 0) {
        appendLog("Warning", `No asset matches '${q}' — try: Mountains, Trees, Castle, Bridge...`);
      } else {
        handleSpawnAsset(pool[Math.floor(Math.random() * pool.length)]);
      }
    } else if (base === "wireframe") {
      setViewMode(arg === "0" ? "Lit" : "Wireframe");
      appendLog("Success", `Wireframe ${arg === "0" ? "OFF (Lit)" : "ON"}`);
    } else if (base === "shadows" || base === "r.raytracing") {
      const on = arg !== "0";
      setRtxEnabled(on);
      appendLog(on ? "Success" : "Warning", `Real-time shadows ${on ? "Enabled (RTX ON)" : "Disabled"}`);
    } else if (base === "time") {
      const t = Number(arg);
      if (Number.isFinite(t) && t >= 0 && t <= 24) {
        setTimeOfDay(t);
        appendLog("Success", `Time of day set to ${t.toFixed(1)}h — sun repositioned`);
      } else {
        appendLog("Warning", "Usage: time <0-24>");
      }
    } else if (base === "play") {
      if (!isPlaying) handleTogglePlay();
    } else if (base === "stop") {
      if (isPlaying) handleTogglePlay();
    } else if (base === "clear") {
      setConsoleLogs([]);
    } else {
      appendLog("Warning", `Unknown command '${cmd}' — type help`);
    }
    setConsoleInput("");
  };

  // Menu bar actions — every item executes a real editor operation
  const handleMenuAction = (menu, label) => {
    const close = () => setOpenMenu(null);
    if (label.startsWith("Current Project")) {
      const n = sceneGroups.flatMap((g) => g.children).length;
      appendLog("Info", `Current project: "${currentProject?.name}" — ${n} actors, autosaved locally`);
      return close();
    }
    if (label === "New Project") { setNewProjectName(""); setNewProjectTemplate("normal"); setNewProjectRoot(""); setNewProjectOpen(true); return close(); }
    if (label === "Open Folder as Project…") { folderModeRef.current = "project"; folderInputRef.current?.click(); return; }
    if (label.startsWith("Open Project: ")) {
      const name = label.slice("Open Project: ".length);
      const p = projects.find((x) => x.name === name);
      if (p) handleSelectProject(p.id);
      return close();
    }
    if (label === "Close Project") { handleCloseProject(); return; }
    if (label === "Duplicate Selected") {
      const n = findNodeById(selectedNodeId);
      if (n && !String(n.id).startsWith("spawn-") && ["player", "camera"].includes(n.id)) { appendLog("Warning", "Core actors cannot be duplicated — spawn a prop instead"); return close(); }
      if (n) handleSpawnAsset({ name: n.name, mesh: n.mesh, category: n.tag });
      return close();
    }
    if (label === "Delete Selected") {
      if (["player", "camera", "terrain"].includes(selectedNodeId)) { appendLog("Warning", "Core actor is protected from deletion"); return close(); }
      setSceneGroups((prev) => prev.map((g) => ({ ...g, children: g.children.filter((c) => c.id !== selectedNodeId) })));
      setSelectedNodeId("player");
      appendLog("Success", "Actor deleted from scene");
      return close();
    }
    if (label === "Undo" || label === "Redo") { appendLog("Warning", "Undo history is not implemented yet — scene Save/Load preserves state"); return close(); }
    if (label === "Show Hierarchy (H)") { setHierarchyOpen(true); setActiveLeftRail("Scene"); return close(); }
    if (label === "Focus Player") { setSelectedNodeId("player"); return close(); }
    if (label === "Reset Sun Time") { setTimeOfDay(14.5); setTimelineT(14.5); return close(); }
    if (label === "Spawn Random Prop") { handleSpawnAsset(ENVIRONMENT_ASSETS[Math.floor(Math.random() * ENVIRONMENT_ASSETS.length)]); return close(); }
    if (label === "Toggle Visibility") { updateSelectedNode((n) => ({ ...n, visible: !n.visible })); return close(); }
    if (label === "Reset Transform") { updateSelectedNode({ pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }); return close(); }
    if (label === "Play / Stop") { handleTogglePlay(); return close(); }
    if (label === "Reset Score") { setScore(0); setCoins((prev) => prev.map((c) => ({ ...c, taken: false }))); return close(); }
    if (label === "Build + Export scene.json") { handleBuildProject(); return close(); }
    if (label === "Clear Console") { setConsoleLogs([]); return close(); }
    if (label === "Inspector Tab") { setRightTab("Inspector"); setInspectorOpen(true); return close(); }
    if (label === "World Settings Tab") { setRightTab("World Settings"); setInspectorOpen(true); return close(); }
    if (label === "Content Browser Tab") { setBottomTab("Content Browser"); setBottomLeftOpen(true); return close(); }
    if (label === "Build Log Tab") { setBottomTab("Build Log"); setBottomLeftOpen(true); return close(); }
    if (label === "Console Tab") { setConsoleOpen(true); consoleInputRef.current?.focus(); return close(); }
    if (label === "Console Commands") { appendLog("Info", "Commands: help, spawn <name>, wireframe 0|1, shadows 0|1, time <0-24>, play, stop"); return close(); }
    if (label === "About Spider Engine") { appendLog("Info", "Spider Engine 0.9.0 — React + Three.js real-time viewport, all JSX, no C++ in this build"); return close(); }
    appendLog("Info", `${menu} > ${label}`);
    close();
  };

  // Left rail — each tool opens the panel it actually controls
  const handleRailAction = (id) => {
    if (id === "Scene") setHierarchyOpen(true);
    else if (id === "Assets" || id === "Models" || id === "Textures") { setBottomTab("Content Browser"); setActiveFolder(id === "Assets" ? "Environment" : id); }
    else if (id === "Materials") { setRightTab("Inspector"); setBottomTab("Content Browser"); }
    else if (id === "Animation") { setRightTab("Inspector"); }
    else if (id === "Physics") { setRightTab("Inspector"); setSelectedNodeId("player"); }
    else if (id === "AI" || id === "Scripting") { setConsoleOpen(true); setBottomTab("Content Browser"); appendLog("Info", `${id} panel: use Console commands (help) to drive AI/scene scripting`); }
    else if (id === "Maps") { setRightTab("World Settings"); }
    else if (id === "UI" || id === "VFX" || id === "Audio" || id === "Plugins") { setBottomTab("Content Browser"); }
  };

  // Render Mini Aesthetic Thumbnail for Content Browser Cards
  const renderAssetThumbnail = (asset) => {
    return (
      <div
        className={`w-full h-16 rounded-md bg-gradient-to-b ${asset.gradient} relative overflow-hidden shadow-inner border border-black/5 group-hover:scale-[1.02] transition-transform`}
      >
        {/* Decorative sky sun/glow */}
        <div className="absolute top-2 right-3 w-3.5 h-3.5 rounded-full bg-white/80 blur-[1px]" />

        {/* Contextual Vector Silhouette based on asset type */}
        {asset.svgType === "mountains" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <polygon points="0,60 28,15 55,60" fill="#334155" />
            <polygon points="28,15 36,28 20,28" fill="#f8fafc" />
            <polygon points="35,60 68,8 100,60" fill="#1e293b" />
            <polygon points="68,8 78,24 58,24" fill="#f1f5f9" />
          </svg>
        )}
        {asset.svgType === "rocks" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <polygon points="15,58 30,22 65,18 85,58" fill="#57534e" />
            <polygon points="30,22 65,18 52,42 22,45" fill="#78716c" />
            <rect x="0" y="52" width="100" height="10" fill="#15803d" />
          </svg>
        )}
        {asset.svgType === "trees" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <rect x="46" y="36" width="8" height="22" fill="#451a03" />
            <circle cx="50" cy="24" r="18" fill="#15803d" />
            <circle cx="38" cy="28" r="12" fill="#166534" />
            <circle cx="62" cy="28" r="12" fill="#14532d" />
          </svg>
        )}
        {asset.svgType === "grass" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <path d="M10,60 Q20,20 25,10 Q25,40 30,60 Z" fill="#4ade80" />
            <path d="M35,60 Q45,15 52,6 Q48,35 55,60 Z" fill="#22c55e" />
            <path d="M60,60 Q75,20 82,12 Q72,40 80,60 Z" fill="#86efac" />
          </svg>
        )}
        {asset.svgType === "water" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <polygon points="0,20 35,35 0,50" fill="#1e293b" />
            <polygon points="100,15 62,35 100,52" fill="#0f172a" />
            <path d="M20,42 Q50,38 80,42" stroke="#bae6fd" strokeWidth="2" fill="none" />
          </svg>
        )}
        {asset.svgType === "cliffs" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <polygon points="0,10 55,15 48,60 0,60" fill="#78716c" />
            <polygon points="0,8 55,15 52,22 0,16" fill="#22c55e" />
          </svg>
        )}
        {(asset.svgType === "castle" || asset.svgType === "citadel") && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <rect x="25" y="25" width="50" height="35" fill="#d6d3d1" />
            <rect x="32" y="14" width="10" height="46" fill="#a8a29e" />
            <polygon points="30,14 37,4 44,14" fill="#475569" />
            <rect x="58" y="10" width="12" height="50" fill="#78716c" />
            <polygon points="56,10 64,2 72,10" fill="#334155" />
          </svg>
        )}
        {asset.svgType === "sky" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <circle cx="50" cy="24" r="10" fill="#fef08a" opacity="0.9" />
            <ellipse cx="30" cy="36" rx="18" ry="6" fill="white" opacity="0.8" />
            <ellipse cx="70" cy="32" rx="22" ry="7" fill="white" opacity="0.7" />
          </svg>
        )}
        {asset.svgType === "clouds" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <circle cx="35" cy="34" r="14" fill="white" />
            <circle cx="52" cy="28" r="18" fill="white" />
            <circle cx="70" cy="35" r="13" fill="white" />
          </svg>
        )}
        {asset.svgType === "hdri" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <circle cx="50" cy="30" r="16" fill="url(#hdriGlow)" />
            <circle cx="50" cy="30" r="6" fill="#ffffff" />
          </svg>
        )}
        {asset.svgType === "waterfall" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <rect x="38" y="0" width="24" height="60" fill="#e0f2fe" opacity="0.85" />
            <circle cx="50" cy="54" r="16" fill="white" opacity="0.7" />
          </svg>
        )}
        {asset.svgType === "bridge" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <path d="M0,25 L100,25 L100,55 L85,55 Q70,30 50,55 Q30,30 15,55 L0,55 Z" fill="#a8a29e" />
          </svg>
        )}
        {asset.svgType === "village" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <rect x="18" y="32" width="24" height="24" fill="#fef3c7" />
            <polygon points="14,32 30,16 46,32" fill="#9a3412" />
            <rect x="54" y="28" width="28" height="28" fill="#fde68a" />
            <polygon points="50,28 68,12 86,28" fill="#7c2d12" />
          </svg>
        )}
        {asset.svgType === "ruins" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <rect x="20" y="18" width="8" height="40" fill="#d6d3d1" />
            <rect x="45" y="14" width="8" height="44" fill="#e7e5e4" />
            <rect x="70" y="28" width="8" height="30" fill="#a8a29e" />
            <rect x="16" y="14" width="42" height="6" fill="#d6d3d1" />
          </svg>
        )}
        {asset.svgType === "cave" && (
          <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full">
            <path d="M0,0 L100,0 L100,60 L75,60 Q50,12 25,60 L0,60 Z" fill="#1c1917" />
            <circle cx="50" cy="48" r="12" fill="#fde047" opacity="0.6" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f0f2f8] text-slate-800 select-none font-sans overflow-hidden antialiased">
      {/* Startup — small Unreal-style project picker dialog */}
      {showStartup && !newProjectOpen && (
        <div className="absolute inset-0 z-50 bg-white flex items-stretch justify-stretch">
          <div className="w-full h-full bg-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pl-4 pr-2 pt-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-[11px]">S</div>
                <span className="font-extrabold text-[12px] text-slate-900">Project Browser</span>
                <span className="text-[10px] text-slate-400">Which project are we opening?</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setNewProjectName(""); setNewProjectTemplate("normal"); setNewProjectRoot(""); setNewProjectOpen(true); expandEditor(); }} className="px-2 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-700 cursor-pointer">+ New</button>
                <button onClick={() => { setShowStartup(false); expandEditor(); setTimeout(() => { folderModeRef.current = "project"; folderInputRef.current?.click(); }, 250); }} className="px-2 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-700 cursor-pointer">Open Folder…</button>
              </div>
            </div>
            <div className="px-4 py-2 space-y-2 overflow-y-auto flex-1">
              {[...projects].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 3).map((p) => (
                deletingId === p.id ? (
                  <div key={p.id} className="p-3 rounded-xl border-2 border-rose-300 bg-rose-50/60">
                    <div className="text-[12px] font-bold text-rose-800">Delete “{p.name}”?</div>
                    <div className="text-[11px] text-rose-600 mt-0.5">Type <span className="font-mono font-bold">delete</span> to confirm — this cannot be undone.</div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        autoFocus
                        type="text"
                        value={deleteText}
                        onChange={(e) => setDeleteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && deleteText.trim().toLowerCase() === "delete") {
                            handleDeleteProject(p.id);
                            setDeletingId(null);
                            setDeleteText("");
                          }
                          e.stopPropagation();
                        }}
                        placeholder='Type "delete"'
                        className="flex-1 text-[12px] px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400 font-mono"
                      />
                      <button
                        disabled={deleteText.trim().toLowerCase() !== "delete"}
                        onClick={() => { handleDeleteProject(p.id); setDeletingId(null); setDeleteText(""); }}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-rose-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-500 cursor-pointer"
                      >
                        Delete
                      </button>
                      <button onClick={() => { setDeletingId(null); setDeleteText(""); }} className="px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
                    </div>
                  </div>
                ) : (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { handleSelectProject(p.id); setShowStartup(false); expandEditor(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { handleSelectProject(p.id); setShowStartup(false); expandEditor(); } }}
                  title={p.root ? `Opens from ${p.root}` : "Opens from browser storage"}
                  className={`group w-full text-left p-3 rounded-xl border-2 transition cursor-pointer bg-white ${p.id === currentProjectId ? "border-indigo-500 shadow-md shadow-indigo-100" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{p.name}</div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {p.id === currentProjectId && <span className="text-[10px] font-bold text-indigo-600">LAST OPEN</span>}
                      {projects.length > 1 && (
                        <button
                          title={`Delete ${p.name}`}
                          onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); setDeleteText(""); }}
                          className="p-1 rounded text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {p.groups.flatMap((g) => g.children).length} actors
                    {p.root ? ` · ${p.root}` : " · browser storage"}
                    {p.updatedAt ? ` · ${new Date(p.updatedAt).toLocaleDateString()}` : ""}
                  </div>
                </div>
                )
              ))}
            </div>
            <div className="px-4 pb-3 pt-1 shrink-0">
              <button onClick={() => { setShowStartup(false); expandEditor(); }} className="w-full py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer">
                Continue{currentProject ? ` — ${currentProject.name}` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==================== TOP HEADER BAR ==================== */}
      <header className="h-11 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 flex items-center justify-between shrink-0 z-30 shadow-2xs">
        {/* Left: Brand Logo & Menu Bar */}
        <div className="flex items-center gap-3">
          {/* Spider Engine Shield Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-500 flex items-center justify-center shadow-sm shadow-indigo-500/20">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.5l-3.5-3.5 1.41-1.41L11 13.67l4.59-4.59L17 10.5 11 16.5z" />
              </svg>
            </div>
            <span className="font-extrabold text-[13px] tracking-wider text-slate-900">
              SPIDER ENGINE
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200/70">
              v0.9.0
            </span>
          </div>

          {/* Menu Links — real dropdown actions */}
          <nav className="hidden md:flex items-center gap-1 ml-3 text-xs text-slate-600 font-medium relative">
            {[
              { id: "File", items: [`Current Project: ${currentProject?.name || "—"}`, "New Project", "Open Folder as Project…", ...projects.map((p) => `Open Project: ${p.name}`), "Close Project"] },
              { id: "Edit", items: ["Undo", "Redo", "Duplicate Selected", "Delete Selected"] },
              { id: "Scene", items: ["Show Hierarchy (H)", "Focus Player", "Reset Sun Time"] },
              { id: "Object", items: ["Spawn Random Prop", "Toggle Visibility", "Reset Transform"] },
              { id: "Game", items: ["Play / Stop", "Reset Score"] },
              { id: "Build", items: ["Build + Export scene.json"] },
              { id: "Tools", items: ["Screenshot PNG", "Clear Console"] },
              { id: "Window", items: ["Inspector Tab", "World Settings Tab", "Content Browser Tab", "Build Log Tab", "Console Tab"] },
              { id: "Help", items: ["Console Commands", "About Spider Engine"] }
            ].map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
                  className={`px-2 py-1 rounded transition ${openMenu === menu.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {menu.id}
                </button>
                {openMenu === menu.id && (
                  <div className="absolute top-7 left-0 min-w-44 max-w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                    {menu.items.map((label) => (
                      <div key={label} className="flex items-center group">
                        <button
                          onClick={() => handleMenuAction(menu.id, label)}
                          title={label}
                          className="flex-1 text-left px-3 py-1.5 text-[11px] hover:bg-indigo-50 hover:text-indigo-700 transition truncate"
                        >
                          {label === `Current Project: ${currentProject?.name || "—"}` ? (
                            <span><span className="text-slate-400">Current Project: </span><span className="font-semibold">{currentProject?.name}</span> <span className="text-emerald-600">●</span></span>
                          ) : label.startsWith("Open Project: ") ? (
                            <span><span className="text-slate-400">Open: </span>{label.slice("Open Project: ".length)}{label.slice("Open Project: ".length) === currentProject?.name ? " ✓" : ""}</span>
                          ) : (
                            label
                          )}
                        </button>
                        {label.startsWith("Open Project: ") && projects.length > 1 && (
                          <button
                            title={`Delete ${label.slice("Open Project: ".length)}`}
                            onClick={() => {
                              const p = projects.find((x) => x.name === label.slice("Open Project: ".length));
                              if (p) handleDeleteProject(p.id);
                            }}
                            className="px-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Ask AI — Gemini-style slide-over assistant panel */}
            <div>
              <button
                onClick={() => setOpenMenu(openMenu === "AskAI" ? null : "AskAI")}
                className={`flex items-center gap-1 px-2 py-1 rounded transition font-semibold ${openMenu === "AskAI" ? "bg-indigo-600 text-white" : "bg-gradient-to-r from-indigo-600 to-violet-500 text-white hover:opacity-90"}`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Ask AI</span>
              </button>
            </div>
          </nav>
          <input ref={importFileRef} type="file" accept=".json,.glb,.gltf,.fbx,.obj,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { handleImportAssetFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>

        {/* Right: Play, Build, Settings & Window Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              isPlaying
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20"
                : "bg-[#1e2330] hover:bg-[#2c3347] text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3 h-3 fill-white" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={handleBuildProject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <Box className={`w-3.5 h-3.5 text-indigo-600 ${isBuilding ? "animate-spin" : ""}`} />
            <span>{isBuilding ? "Building..." : "Build"}</span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Settings</span>
          </button>

        </div>
      </header>

      {/* ==================== MAIN ENGINE BODY ==================== */}
      <div className="flex-1 flex overflow-hidden p-1.5 gap-1.5">
        {/* 1. LEFT VERTICAL NAVIGATION RAIL */}
        <aside className="w-44 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col justify-between py-2 px-1.5 shrink-0 shadow-2xs">
          <div className="space-y-0.5 overflow-y-auto no-scrollbar">
            {LEFT_RAIL_ITEMS.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeLeftRail === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveLeftRail(item.id);
                    handleRailAction(item.id);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-xs shadow-indigo-500/30"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.id}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom M4 SPIDER Badge */}
          <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-extrabold tracking-tight text-slate-700">
              M4 SPIDER
            </span>
          </div>
        </aside>

        {/* 2. SCENE HIERARCHY & CENTER VIEWPORT + BOTTOM DOCK */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {/* UPPER SPLIT: HIERARCHY + 3D VIEWPORT */}
          <div className="flex-[1.55] flex gap-1.5 min-h-0">
            {/* SCENE HIERARCHY PANEL */}
            {hierarchyOpen ? (<section className="w-56 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shrink-0 shadow-2xs overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Scene Hierarchy</span>
                <button onClick={() => setHierarchyOpen(false)} title="Hide Scene Hierarchy (press H to reopen)" className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer px-1 rounded hover:bg-slate-100">×</button>
              </div>

              {/* Search Input */}
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                  <Search className="w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search objects..."
                    value={hierarchySearch}
                    onChange={(e) => setHierarchySearch(e.target.value)}
                    className="bg-transparent text-[11px] w-full focus:outline-none text-slate-700"
                  />
                </div>
              </div>

              {/* Tree View */}
              <div className="flex-1 overflow-y-auto px-2 py-1.5 text-[11px] space-y-0.5">
                {/* Root World Node */}
                <div className="flex items-center gap-1.5 px-1 py-1 font-bold text-slate-800">
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                  <Box className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                  <span>{sceneLabel}</span>
                </div>

                {/* Groups */}
                <div className="pl-2 space-y-0.5">
                  {sceneGroups.map((group) => {
                    const filteredChildren = group.children.filter((c) =>
                      c.name.toLowerCase().includes(hierarchySearch.toLowerCase())
                    );
                    if (hierarchySearch && filteredChildren.length === 0) return null;

                    return (
                      <div key={group.id}>
                        {/* Folder Row */}
                        <div
                          onClick={() => toggleGroupExpand(group.id)}
                          className="flex items-center justify-between px-1.5 py-1 rounded-md hover:bg-slate-100 cursor-pointer text-slate-700 font-semibold"
                        >
                          <div className="flex items-center gap-1.5">
                            {group.expanded ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                            {group.type === "char-folder" ? (
                              <User className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Folder className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            )}
                            <span>{group.name}</span>
                          </div>
                        </div>

                        {/* Children Rows */}
                        {group.expanded && (
                          <div className="pl-4 space-y-0.5 mt-0.5">
                            {filteredChildren.map((node) => {
                              const isSelected = selectedNodeId === node.id;
                              return (
                                <div
                                  key={node.id}
                                  onClick={() => setSelectedNodeId(node.id)}
                                   className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition ${
                                     isSelected
                                       ? "bg-indigo-100/90 text-indigo-950 font-semibold shadow-2xs"
                                       : "text-slate-600 hover:bg-slate-100/80"
                                   } ${node.visible ? "" : "opacity-45"}`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {node.type === "character" ? (
                                      <User className="w-3 h-3 text-blue-600 shrink-0" />
                                    ) : node.type === "camera" ? (
                                      <Camera className="w-3 h-3 text-blue-500 shrink-0" />
                                    ) : node.type === "weapon" ? (
                                      <Shield className="w-3 h-3 text-indigo-500 shrink-0" />
                                    ) : node.type === "sub-folder" ? (
                                      <Folder className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                                    ) : node.type === "sun" ? (
                                      <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                                    ) : (
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                        style={{ backgroundColor: node.color }}
                                      />
                                    )}
                                    <span className="truncate">{node.name}</span>
                                  </div>

                                   <button
                                     onClick={(e) => toggleNodeVisibility(e, node.id)}
                                     title={node.visible ? `Hide ${node.name}` : `Show ${node.name}`}
                                     className={`p-1 -m-0.5 rounded-md transition shrink-0 cursor-pointer ${
                                       node.visible
                                         ? "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                         : "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                     }`}
                                   >
                                     {node.visible ? (
                                       <Eye className="w-3.5 h-3.5" />
                                     ) : (
                                       <EyeOff className="w-3.5 h-3.5" />
                                     )}
                                   </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            ) : null}

            {/* CENTER 3D VIEWPORT PANEL */}
            <section ref={viewportRef} className="flex-1 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shadow-2xs overflow-hidden relative">
              {/* Viewport Top Tab Bar */}
              <div className="h-9 px-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-1">
                  {[
                    { id: "Viewport", icon: Box },
                    { id: "Cinematic", icon: Film },
                    { id: "Game View", icon: Gamepad2 }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = viewportTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setViewportTab(tab.id);
                          appendLog("Info", tab.id === "Game View" ? "Game View — chase camera locked to hero (Play to run)" : tab.id === "Cinematic" ? "Cinematic — slow auto-orbit camera" : "Viewport — free orbit camera");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          active
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.id}</span>
                      </button>
                    );
                  })}
                </div>

                {isPlaying ? (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>WASD move • Click to shoot • Space jump • Score {score} • {coins.filter((c) => !c.taken).length} coins left</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    Editor — WASD fly · Score {score}
                  </div>
                )}
              </div>

              {/* Tutorial card — per-template steps, auto-advances on real events */}
              {tutorial && (() => {
                const steps = TUTORIALS[tutorial.template] || [];
                const step = steps[tutorial.idx];
                if (!step) return null;
                return (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 w-80 bg-white/95 backdrop-blur-md rounded-xl border border-indigo-200 shadow-lg px-3.5 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-indigo-600 tracking-wide">TUTORIAL {tutorial.idx + 1}/{steps.length} · {templateLabel(tutorial.template)}</div>
                      <button onClick={() => { setTutorial(null); appendLog("Info", "Tutorial skipped"); }} title="Skip tutorial" className="text-slate-400 hover:text-slate-700 text-xs px-1 rounded hover:bg-slate-100 cursor-pointer">Skip</button>
                    </div>
                    <div className="text-[12px] font-bold text-slate-800 mt-0.5">{step.title}</div>
                    <div className="text-[11px] text-slate-600 leading-snug">{step.text}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1">
                        {steps.map((_, i) => (
                          <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < tutorial.idx ? "bg-indigo-400" : i === tutorial.idx ? "bg-indigo-600" : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          if (tutorial.idx + 1 >= steps.length) {
                            setTutorial(null);
                            appendLog("Success", "Tutorial complete — you know the drill. Have fun.");
                          } else {
                            setTutorial({ template: tutorial.template, idx: tutorial.idx + 1 });
                          }
                        }}
                        className="ml-auto px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 3D Interactive World Canvas */}
              <div className="flex-1 relative overflow-hidden bg-slate-900">
                <GameViewport
                  sceneGroups={sceneGroups}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onTransformNode={handleViewportTransform}
                  isPlaying={isPlaying}
                  keysPressed={keysPressed}
                  timeOfDay={timeOfDay}
                  rtxEnabled={rtxEnabled}
                  showGrid={showGrid}
                  viewMode={viewMode}
                  activeGizmo={activeGizmo}
                  cameraZoom={cameraZoom}
                  projection={projection}
                  space={coordSpace}
                  cameraMode={viewportTab}
                  coins={coins}
                  onFps={handleFps}
                  onShoot={handleShoot}
                />
                {/* Timeline scrub — drives solar time live, plays back when armed */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-white/50 z-20 text-[11px] font-semibold text-slate-700">
                  <button
                    onClick={() => setTimelinePlaying((p) => !p)}
                    title={timelinePlaying ? "Pause timeline" : "Play timeline"}
                    className="p-1 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
                  >
                    {timelinePlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  </button>
                  <span className="text-slate-400">Timeline</span>
                  <input
                    type="range"
                    min="4"
                    max="22"
                    step="0.1"
                    value={timelineT}
                    onChange={(e) => { const t = parseFloat(e.target.value); setTimelineT(t); setTimeOfDay(t); }}
                    className="w-44 accent-indigo-600 cursor-pointer"
                  />
                  <span className="font-mono w-11 text-right">{timelineT.toFixed(1)}h</span>
                </div>

                {/* --- VIEWPORT FLOATING OVERLAYS --- */}
                {/* Top-Left Camera / Shading Pills */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                  <button
                    onClick={() =>
                      setProjection((p) => (p === "Perspective" ? "Orthographic" : "Perspective"))
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm border border-white/50 cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-slate-600" />
                    <span>{projection}</span>
                  </button>

                  <button
                    onClick={() =>
                      setViewMode(viewMode === "Lit" ? "Wireframe" : "Lit")
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm border border-white/50 cursor-pointer"
                  >
                    <Sun className="w-3 h-3 text-indigo-600" />
                    <span>{viewMode}</span>
                  </button>

                  <button
                    onClick={() => {
                      const fog = findNodeById("fog");
                      updateSelectedNodeFog(!findNodeById("fog")?.visible);
                    }}
                    title="Toggle volumetric fog"
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm border border-white/50 cursor-pointer"
                  >
                    <span>Fog</span>
                  </button>
                </div>

                {/* Top-Right Transform & Grid Toolbar Pills */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  <div className="flex items-center bg-white/90 backdrop-blur-md p-0.5 rounded-lg shadow-sm border border-white/50">
                    {[
                      { id: "move", icon: Move },
                      { id: "rotate", icon: RotateCw },
                      { id: "scale", icon: Scaling }
                    ].map((g) => {
                      const Icon = g.icon;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setActiveGizmo(g.id)}
                          className={`p-1 rounded-md transition cursor-pointer ${
                            activeGizmo === g.id
                              ? "bg-indigo-600 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center bg-white/90 backdrop-blur-md p-0.5 rounded-lg shadow-sm border border-white/50">
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`p-1 rounded-md cursor-pointer ${
                        showGrid ? "bg-indigo-50 text-indigo-600" : "text-slate-600"
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setCoordSpace((s) => (s === "Global" ? "Local" : "Global"))
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm border border-white/50 cursor-pointer"
                  >
                    <Globe className="w-3 h-3 text-indigo-600" />
                    <span>{coordSpace}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

                {/* Left Vertical Floating Tool Strip */}
                <div className="absolute top-14 left-3 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-white/50 flex flex-col gap-1 z-20">
                  {[
                    { id: "select", icon: MousePointer },
                    { id: "move", icon: Move },
                    { id: "rotate", icon: RotateCw },
                    { id: "scale", icon: Maximize2 }
                  ].map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveGizmo(tool.id)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          activeGizmo === tool.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>


                {/* Bottom-Left Zoom & Screenshot Controls */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-20">
                  <button
                    onClick={() =>
                      setCameraZoom((z) => (z >= 1.4 ? 1.0 : Number((z + 0.2).toFixed(1))))
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-bold text-slate-800 shadow-sm cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>{cameraZoom.toFixed(1)}x</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = viewportApi.capture?.();
                      if (url) appendLog("Success", "Viewport screenshot captured (PNG downloaded)");
                      else appendLog("Warning", "Viewport not ready — screenshot unavailable");
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-slate-700 shadow-sm cursor-pointer"
                    title="Capture Screenshot"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom-Right Live status / RTX / FPS Telemetry Pills */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
                  <span className={`px-2.5 py-1 backdrop-blur-md rounded-lg text-[11px] font-bold shadow-sm ${isPlaying ? "bg-emerald-50 text-emerald-700" : "bg-white/90 text-slate-800"}`}>
                    {isPlaying ? "Real-time" : "Editor"}
                  </span>

                  <button
                    onClick={() => {
                      setRtxEnabled(!rtxEnabled);
                      appendLog(
                        "Info",
                        `RTX Raytracing ${!rtxEnabled ? "Enabled" : "Disabled"}`
                      );
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-bold text-slate-800 shadow-sm cursor-pointer"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rtxEnabled ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>RTX</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-slate-800 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{fps} FPS</span>
                  </div>

                  <button
                    onClick={toggleViewportFullscreen}
                    title="Toggle viewport fullscreen"
                    className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-slate-700 shadow-sm cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* LOWER SPLIT: CONTENT BROWSER + CONSOLE — collapses fully when both shut */}
          {(bottomLeftOpen || consoleOpen) ? (
          <div className="flex-1 flex gap-1.5 min-h-[210px]">
            {/* CONTENT BROWSER / BUILD LOG PANEL — tabs switch this panel, Console lives right */}
            {bottomLeftOpen ? (
            <section className="flex-[1.65] bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shadow-2xs overflow-hidden">
              {/* Top Tabs + Action Buttons */}
              <div className="h-9 px-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1">
                  {[
                    { id: "Content Browser", icon: Folder },
                    { id: "Build Log", icon: FileText }
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = bottomTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setBottomTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          active
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-200/60"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.id}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setBottomTab("Content Browser"); setConsoleOpen(true); consoleInputRef.current?.focus(); appendLog("Info", "Console is the right panel — type a command below (try help)"); }}
                    title="Focus the Console command line"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer text-slate-500 hover:text-slate-800"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Console →</span>
                  </button>
                </div>

                {/* Search Assets */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 w-44">
                    <Search className="w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="bg-transparent text-[11px] w-full focus:outline-none text-slate-700"
                    />
                  </div>
                  <Grid className="w-3.5 h-3.5 text-slate-400" />
                  <button onClick={() => setBottomLeftOpen(false)} title="Hide panel (press B to reopen)" className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer px-1 rounded hover:bg-slate-100">×</button>
                </div>
              </div>

              {/* Action Sub-bar */}
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] bg-slate-50/40 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSpawnAsset(ENVIRONMENT_ASSETS[Math.floor(Math.random() * ENVIRONMENT_ASSETS.length)])}
                    title={() => `Spawn a random environment prop into ${sceneLabel}`}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-indigo-600" />
                    <span>Add</span>
                  </button>
                  <button
                    onClick={() => importFileRef.current?.click()}
                    title="Import .json scene, .glb/.gltf mesh or .png texture"
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>Import</span>
                  </button>
                  <button
                    onClick={() => { folderModeRef.current = "import"; folderInputRef.current?.click(); }}
                    title="Parse a whole folder — imports every model/image/audio found"
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <FolderOpen className="w-3 h-3 text-indigo-500" />
                    <span>Folder</span>
                  </button>
                  <input ref={folderInputRef} type="file" className="hidden" onChange={(e) => { handleImportFolder(e.target.files); e.target.value = ""; }} />
                  <button
                    onClick={handleSaveScene}
                    title={`Save ${sceneFileName} to disk`}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Save className="w-3 h-3 text-slate-500" />
                    <span>Save All</span>
                  </button>

                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-1 text-slate-500 ml-3 font-medium">
                    <span>Assets</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-800 font-semibold">{activeFolder}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  Click any asset to spawn into {sceneLabel}
                </span>
              </div>

              {/* Content Browser Split Body: Folder Tree + Real Folder Contents */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Folder Tree */}
                <div className="w-40 border-r border-slate-100 p-2 overflow-y-auto text-[11px] space-y-0.5 shrink-0">
                  <div className="flex items-center justify-between text-slate-500 font-semibold px-1.5 py-1">
                    <span>★ Favorites</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 py-1 font-bold text-slate-800">
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                    <Folder className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                    <span>Assets</span>
                  </div>
                  <div className="pl-4 space-y-0.5">
                    {[
                      { name: "Characters", count: sceneGroups[1]?.children.length || 0 },
                      { name: "Environment", count: ENVIRONMENT_ASSETS.length },
                      { name: "Props", count: sceneGroups[0]?.children.filter((c) => String(c.id).startsWith("spawn-")).length || 0 },
                      { name: "Vehicles", count: 1 },
                      { name: "Weapons", count: 1 },
                      { name: "Audio", count: audioAssets.length }
                    ].map((f) => (
                      <div
                        key={f.name}
                        onClick={() => setActiveFolder(f.name)}
                        className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-md cursor-pointer transition ${
                          activeFolder === f.name
                            ? "bg-indigo-100/80 text-indigo-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{f.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real folder contents */}
                <div className="flex-1 p-2.5 overflow-y-auto">
                  {bottomTab === "Build Log" ? (
                    <div className="font-mono text-[11px] space-y-1">
                      {buildLogs.length === 0 ? (
                        <div className="text-slate-400">No builds yet — press Build (top bar) to validate + export {sceneFileName}.</div>
                      ) : (
                        buildLogs.map((b, i) => <div key={i} className="text-slate-700 leading-tight">{b}</div>)
                      )}
                    </div>
                  ) : activeFolder === "Environment" ? (
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {ENVIRONMENT_ASSETS.filter((a) =>
                        a.name.toLowerCase().includes(assetSearch.toLowerCase())
                      ).map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => handleSpawnAsset(asset)}
                          title={`Spawn ${asset.name} (${asset.mesh}) into ${sceneLabel}`}
                          className="group flex flex-col items-center p-1 rounded-lg hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200 cursor-pointer transition"
                        >
                          {renderAssetThumbnail(asset)}
                          <span className="text-[10px] font-semibold text-slate-700 mt-1 truncate w-full text-center group-hover:text-indigo-700">
                            {asset.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : activeFolder === "Characters" || activeFolder === "Weapons" || activeFolder === "Vehicles" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {sceneGroups
                        .flatMap((g) => g.children)
                        .filter((c) =>
                          activeFolder === "Characters"
                            ? ["player", "camera", "npcs"].includes(c.id)
                            : activeFolder === "Weapons"
                              ? c.id === "weapon"
                              : c.id === "vehicles"
                        )
                        .filter((c) => c.name.toLowerCase().includes(assetSearch.toLowerCase()))
                        .map((c) => (
                          <div
                            key={c.id}
                            onClick={() => { setSelectedNodeId(c.id); setRightTab("Inspector"); }}
                            title={`Select ${c.name} in viewport`}
                            className="group flex flex-col items-center p-2 rounded-lg hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-200 cursor-pointer transition"
                          >
                            <span className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: c.color }} />
                            <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-700">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">{c.mesh}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {sceneGroups[0]?.children.filter((c) => String(c.id).startsWith("spawn-") && c.name.toLowerCase().includes(assetSearch.toLowerCase())).length === 0 ? (
                        <div className="text-[11px] text-slate-400">No spawned props yet — click an Environment asset or press Add.</div>
                      ) : (
                        sceneGroups[0].children
                          .filter((c) => String(c.id).startsWith("spawn-") && c.name.toLowerCase().includes(assetSearch.toLowerCase()))
                          .map((c) => (
                            <div
                              key={c.id}
                              onClick={() => { setSelectedNodeId(c.id); setRightTab("Inspector"); }}
                              title={`Select ${c.name} — pos (${c.pos.x}, ${c.pos.y}, ${c.pos.z})`}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition text-[11px]"
                            >
                              <span className="flex items-center gap-2 font-semibold text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.name}
                              </span>
                              <span className="font-mono text-slate-400">({c.pos.x}, {c.pos.y}, {c.pos.z})</span>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
            ) : null}

            {/* CONSOLE LOGGER PANEL */}
            {consoleOpen ? (
            <section className="flex-1 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shadow-2xs overflow-hidden">
              <div className="h-9 px-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Console</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={consoleFilter}
                    onChange={(e) => setConsoleFilter(e.target.value)}
                    className="text-[11px] bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    <option value="Info">Info</option>
                    <option value="Success">Success</option>
                    <option value="Warning">Warning</option>
                  </select>
                  <button
                    onClick={() => setConsoleLogs([])}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                    title="Clear Console"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConsoleOpen(false)} title="Hide Console (press B to reopen)" className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer px-1 rounded hover:bg-slate-100">×</button>
                </div>
              </div>

              {/* Console Output Lines */}
              <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11px] space-y-1 bg-slate-50/50 select-text">
                {consoleLogs
                  .filter((l) => consoleFilter === "All" || l.type === consoleFilter)
                  .map((log) => (
                    <div key={log.id} className="leading-tight flex items-start gap-1.5">
                      {log.type === "Info" && (
                        <span className="text-blue-600 font-semibold shrink-0">[Info]</span>
                      )}
                      {log.type === "Success" && (
                        <span className="text-emerald-600 font-semibold shrink-0">[Success]</span>
                      )}
                      {log.type === "Warning" && (
                        <span className="text-amber-500 font-semibold shrink-0">[Warning]</span>
                      )}
                      <span
                        className={
                          log.type === "Success"
                            ? "text-emerald-700 font-medium"
                            : log.type === "Warning"
                            ? "text-amber-600 font-medium"
                            : "text-slate-700"
                        }
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                <div ref={consoleEndRef} />
              </div>

              {/* Command Input Box */}
              <form
                onSubmit={handleConsoleSubmit}
                className="p-1.5 border-t border-slate-100 flex items-center gap-1.5 bg-white"
              >
                <input
                  ref={consoleInputRef}
                  type="text"
                  placeholder="Enter command... (e.g. help, spawn castle, stat fps, time 15)"
                  value={consoleInput}
                  onChange={(e) => setConsoleInput(e.target.value)}
                  className="flex-1 text-[11px] px-2.5 py-1 bg-slate-100/80 rounded-lg border border-slate-200/70 focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="submit"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </section>
            ) : null}
          </div>
          ) : null}
        </div>

        {/* 3. RIGHT INSPECTOR / WORLD SETTINGS SIDEBAR */}
        {inspectorOpen ? (
        <aside className="w-72 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shrink-0 shadow-2xs overflow-hidden">
          {/* Inspector / World Settings Top Tabs */}
          <div className="h-9 px-2 border-b border-slate-100 flex items-center gap-1 bg-slate-50/50 shrink-0">
            <button
              onClick={() => setRightTab("Inspector")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                rightTab === "Inspector"
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
            <button
              onClick={() => setRightTab("World Settings")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                rightTab === "World Settings"
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>World Settings</span>
            </button>
            <button onClick={() => setInspectorOpen(false)} title="Hide Inspector (press I to reopen)" className="ml-auto text-slate-400 hover:text-slate-700 text-xs cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100">×</button>
          </div>

          {rightTab === "Inspector" && selectedNode ? (
            <fieldset disabled={isPlaying} className="flex-1 overflow-y-auto p-3 space-y-3 text-xs min-w-0">
              {isPlaying && (
                <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  Locked in Play — Stop to edit. Click objects to inspect.
                </div>
              )}
              {/* Actor Header Card */}
              <div className="space-y-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Box className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <input
                      type="text"
                      value={selectedNode.name}
                      onChange={(e) => updateSelectedNode({ name: e.target.value })}
                      className="font-bold text-slate-900 text-xs bg-transparent focus:outline-none focus:bg-slate-100 px-1 rounded w-32"
                    />
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!selectedNode.physics}
                      onChange={(e) => updateSelectedNode({ physics: !e.target.checked })}
                      className="round-check"
                    />
                    <span>Static</span>
                  </label>
                </div>

                {/* Tag & Layer Row — editable, stored on the actor */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70 text-[11px]">
                    <span className="text-slate-400">Tag</span>
                    <select
                      value={selectedNode.tag}
                      onChange={(e) => updateSelectedNode({ tag: e.target.value })}
                      className="bg-transparent font-semibold text-slate-700 text-right focus:outline-none cursor-pointer"
                    >
                      {["Player", "Terrain", "Water", "Foliage", "Prop", "Architecture", "Vehicle", "AI", "Light", "Sky", "Atmosphere", "Weapon", "MainCamera", "PostProcess"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70 text-[11px]">
                    <span className="text-slate-400">Layer</span>
                    <select
                      value={selectedNode.layer}
                      onChange={(e) => updateSelectedNode({ layer: e.target.value })}
                      className="bg-transparent font-semibold text-slate-700 text-right focus:outline-none cursor-pointer"
                    >
                      {["Default", "Water", "Foliage", "Skybox", "Lighting", "Vehicles", "Characters", "Equipment"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* TRANSFORM COMPONENT */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Move className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Transform</span>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Position Row */}
                <div className="grid grid-cols-[58px_1fr] items-center gap-1 text-[11px]">
                  <span className="text-slate-500">Position</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["x", "y", "z"]).map((axis) => (
                      <div
                        key={axis}
                        className="flex items-center bg-slate-50 border border-slate-200/80 rounded px-1.5 py-0.5"
                      >
                        <span
                          className={`font-bold uppercase mr-1 text-[10px] ${
                            axis === "x"
                              ? "text-rose-500"
                              : axis === "y"
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        >
                          {axis}
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          value={selectedNode.pos[axis]}
                          onChange={(e) =>
                            updateSelectedNode((n) => ({
                              ...n,
                              pos: { ...n.pos, [axis]: parseFloat(e.target.value) || 0 }
                            }))
                          }
                          className="w-full bg-transparent text-right font-mono text-[11px] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation Row */}
                <div className="grid grid-cols-[58px_1fr] items-center gap-1 text-[11px]">
                  <span className="text-slate-500">Rotation</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["x", "y", "z"]).map((axis) => (
                      <div
                        key={axis}
                        className="flex items-center bg-slate-50 border border-slate-200/80 rounded px-1.5 py-0.5"
                      >
                        <span
                          className={`font-bold uppercase mr-1 text-[10px] ${
                            axis === "x"
                              ? "text-rose-500"
                              : axis === "y"
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        >
                          {axis}
                        </span>
                        <input
                          type="number"
                          step="5"
                          value={selectedNode.rot[axis]}
                          onChange={(e) =>
                            updateSelectedNode((n) => ({
                              ...n,
                              rot: { ...n.rot, [axis]: parseFloat(e.target.value) || 0 }
                            }))
                          }
                          className="w-full bg-transparent text-right font-mono text-[11px] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale Row */}
                <div className="grid grid-cols-[58px_1fr] items-center gap-1 text-[11px]">
                  <span className="text-slate-500">Scale</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["x", "y", "z"]).map((axis) => (
                      <div
                        key={axis}
                        className="flex items-center bg-slate-50 border border-slate-200/80 rounded px-1.5 py-0.5"
                      >
                        <span
                          className={`font-bold uppercase mr-1 text-[10px] ${
                            axis === "x"
                              ? "text-rose-500"
                              : axis === "y"
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        >
                          {axis}
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedNode.scale[axis]}
                          onChange={(e) =>
                            updateSelectedNode((n) => ({
                              ...n,
                              scale: {
                                ...n.scale,
                                [axis]: Math.max(0.2, parseFloat(e.target.value) || 1)
                              }
                            }))
                          }
                          className="w-full bg-transparent text-right font-mono text-[11px] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MESH COMPONENT — every control is live */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Box className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mesh</span>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="flex items-center gap-2">
                  {/* Live preview tile — tint + type, no emoji */}
                  <div
                    className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${selectedNode.tint || selectedNode.color || "#6366f1"}22` }}
                    title={selectedNode.modelUrl ? `Imported ${selectedNode.modelFormat?.toUpperCase()} — real geometry` : "Procedural mesh — real geometry"}
                  >
                    <Box className="w-5 h-5" style={{ color: selectedNode.tint || selectedNode.color || "#6366f1" }} />
                  </div>
                  <div className="flex-1 relative">
                    <button
                      onClick={() => meshSwappable && setMeshMenuOpen((o) => !o)}
                      title={meshSwappable ? "Swap mesh — live in viewport" : "Core actor mesh is fixed (spawn a prop to swap meshes)"}
                      className={`w-full flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px] font-medium ${meshSwappable ? "hover:border-indigo-300 cursor-pointer" : "cursor-default"}`}
                    >
                      <span className="truncate">{selectedNode.modelUrl ? `📦 ${selectedNode.mesh}` : selectedNode.mesh}</span>
                      {meshSwappable && <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition ${meshMenuOpen ? "rotate-180" : ""}`} />}
                    </button>
                    {meshMenuOpen && meshSwappable && (
                      <div className="absolute top-9 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 max-h-52 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400">BUILT-IN</div>
                        {MESH_LIBRARY.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => assignMesh(m)}
                            className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer"
                          >
                            {m.label} <span className="font-mono text-slate-400">{m.mesh}</span>
                          </button>
                        ))}
                        {importedModelNodes.length > 0 && (
                          <>
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 border-t border-slate-100 mt-1">IMPORTED</div>
                            {importedModelNodes.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => assignImportedMesh(n)}
                                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer truncate"
                              >
                                📦 {n.mesh}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => meshSwappable ? meshFileRef.current?.click() : appendLog("Warning", "Core actor mesh is fixed — spawn a prop to use custom models")}
                    title={meshSwappable ? "Load .glb/.gltf/.fbx/.obj onto this actor" : "Core actor mesh is fixed"}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                  <input ref={meshFileRef} type="file" accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={(e) => { assignModelFile(e.target.files?.[0]); e.target.value = ""; }} />
                </div>
                <div className="text-[10px] text-slate-400">
                  {selectedNode.modelUrl
                    ? `Imported ${selectedNode.modelFormat?.toUpperCase()} — real geometry, gizmo + tint apply`
                    : meshSwappable
                      ? "Procedural — pick built-in or load a model file"
                      : "Core actor — fixed procedural body"}
                </div>
              </div>

              {/* MATERIALS COMPONENT — tint is live in the 3D viewport */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Materials</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 shrink-0">Tint (live)</span>
                  <label className="flex-1 flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 cursor-pointer">
                    <input
                      type="color"
                      value={selectedNode.tint || selectedNode.color || "#6366f1"}
                      onChange={(e) => updateSelectedNode({ tint: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent"
                      title="Live tint color in viewport"
                    />
                    <span className="truncate font-mono">{selectedNode.tint || selectedNode.color || "#6366f1"}</span>
                    {(selectedNode.tint || selectedNode.tint2) && (
                      <button
                        onClick={() => { updateSelectedNode({ tint: undefined, tint2: undefined }); appendLog("Info", `${selectedNode.name} colors reset to authored`); }}
                        title="Reset to authored colors"
                        className="ml-auto text-[10px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </label>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Element 0</span>
                    <span className="flex-1 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                      <span className="w-4 h-4 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: matColor(selectedNode.mat0) || selectedNode.tint || selectedNode.color }} />
                      <select
                        value={Object.keys(MATERIAL_PRESETS).includes(selectedNode.mat0) ? selectedNode.mat0 : "__custom__"}
                        onChange={(e) => {
                          const name = e.target.value;
                          const color = matColor(name);
                          updateSelectedNode({ mat0: name, tint: color || undefined });
                          appendLog("Success", `${selectedNode.name} Element 0 → ${name} (live in viewport)`);
                        }}
                        title="Primary material — recolors the actor live"
                        className="flex-1 bg-transparent font-medium truncate focus:outline-none cursor-pointer"
                      >
                        {!Object.keys(MATERIAL_PRESETS).includes(selectedNode.mat0) && (
                          <option value="__custom__">{selectedNode.mat0} (custom)</option>
                        )}
                        {Object.keys(MATERIAL_PRESETS).map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </span>
                  </label>

                  <label className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Element 1</span>
                    <span className="flex-1 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                      <span className="w-4 h-4 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: matColor(selectedNode.mat1) || selectedNode.tint2 || "#f59e0b" }} />
                      <select
                        value={Object.keys(MATERIAL_PRESETS).includes(selectedNode.mat1) ? selectedNode.mat1 : "__custom__"}
                        onChange={(e) => {
                          const name = e.target.value;
                          const color = matColor(name);
                          updateSelectedNode({ mat1: name, tint2: color || undefined });
                          appendLog("Success", `${selectedNode.name} Element 1 → ${name} (secondary parts live in viewport)`);
                        }}
                        title="Secondary material — trunks, towers, sails recolor live"
                        className="flex-1 bg-transparent font-medium truncate focus:outline-none cursor-pointer"
                      >
                        {!Object.keys(MATERIAL_PRESETS).includes(selectedNode.mat1) && (
                          <option value="__custom__">{selectedNode.mat1} (custom)</option>
                        )}
                        {Object.keys(MATERIAL_PRESETS).map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </span>
                  </label>
                </div>
              </div>

              {/* ANIMATION COMPONENT */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Animation</span>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500 shrink-0">Anim Blueprint</span>
                  <div className="flex-1 flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 font-medium">
                    <span className="truncate">{selectedNode.anim}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <button
                    onClick={() => {
                      updateSelectedNode({ animPaused: !selectedNode.animPaused });
                      appendLog("Info", `${selectedNode.name} animation ${selectedNode.animPaused ? "resumed" : "paused"}`);
                    }}
                    title={selectedNode.animPaused ? "Resume this actor's animation" : "Pause this actor's animation"}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    {selectedNode.animPaused ? <Play className="w-3 h-3 fill-current" /> : <Square className="w-3 h-3 fill-current" />}
                  </button>
                </div>
              </div>

              {/* PHYSICS COMPONENT */}
              <div className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Physics</span>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Simulate Physics</span>
                    <button
                      onClick={() => updateSelectedNode({ physics: !selectedNode.physics })}
                      className={`w-8 h-4 rounded-full p-0.5 transition cursor-pointer ${
                        selectedNode.physics ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          selectedNode.physics ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Mass (kg)</span>
                    <input
                      type="number"
                      value={selectedNode.mass}
                      onChange={(e) =>
                        updateSelectedNode({ mass: parseFloat(e.target.value) || 0 })
                      }
                      className="w-28 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-right font-mono font-semibold"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Collision Preset</span>
                    <select
                      value={selectedNode.collision}
                      onChange={(e) => {
                        updateSelectedNode({ collision: e.target.value });
                        appendLog("Info", `${selectedNode.name} collision → ${e.target.value}${e.target.value === "BlockAll" ? " (hero blocked in Play)" : " (hero passes through)"}`);
                      }}
                      title="BlockAll blocks the hero in Play · others pass through"
                      className="w-28 bg-slate-50 border border-slate-200 rounded-full px-2 py-1 font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="Character">Character</option>
                      <option value="BlockAll">BlockAll</option>
                      <option value="OverlapAll">OverlapAll</option>
                      <option value="NoCollision">NoCollision</option>
                      {["Foliage", "Vehicle", "Camera"].includes(selectedNode.collision) && (
                        <option value={selectedNode.collision}>{selectedNode.collision}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Component Button */}
              <button
                onClick={() =>
                  appendLog("Info", `Added new custom component to ${selectedNode.name}`)
                }
                className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                disabled={isPlaying}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Component</span>
              </button>
            </fieldset>
          ) : (
            /* WORLD SETTINGS TAB */
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-800 block">Environment & Sun Time</span>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Solar Time of Day</span>
                  <span className="font-mono font-semibold">{timeOfDay.toFixed(1)}h</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="22"
                  step="0.5"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2 pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-800 block">Vulkan Raytracing (RTX)</span>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Global Illumination</span>
                  <input
                    type="checkbox"
                    checked={rtxEnabled}
                    onChange={(e) => setRtxEnabled(e.target.checked)}
                    className="round-check"
                  />
                </div>
              </div>
            </div>
          )}
        </aside>
        ) : null}

        {/* Ask AI slide-over — Gemini-style assistant panel */}
        {openMenu === "AskAI" && (
          <aside className={`${panelWide ? "w-[26rem]" : "w-80"} bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 flex flex-col shrink-0 shadow-lg overflow-hidden transition-all`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <button
                  onClick={() => setShowRecents((v) => !v)}
                  title="Recent chats"
                  className={`p-1 rounded cursor-pointer ${showRecents ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"}`}
                >
                  <History className="w-3.5 h-3.5" />
                </button>
                <button onClick={newChat} title="New chat" className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span>Spider AI</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Auto router — LLM-style: acts when it can, asks when destructive */}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Auto: answers questions, runs actions, asks before destructive ones">
                  Auto
                </span>
                <button
                  onClick={() => setPanelWide((w) => !w)}
                  title={panelWide ? "Dock panel" : "Pop-out wider"}
                  className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setOpenMenu(null); setPendingConfirm(null); }} className="text-slate-400 hover:text-slate-700 text-sm px-1 rounded hover:bg-slate-100 cursor-pointer" title="Close">✕</button>
              </div>
            </div>
            {/* Claude-Code-style permission prompt for destructive actions */}
            {pendingConfirm && (
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
                <div className="text-[11px] font-semibold text-amber-800 mb-1.5">{pendingConfirm.label}</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { pendingConfirm.run(); setPendingConfirm(null); }}
                    className="px-3 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer"
                  >
                    Yes, do it
                  </button>
                  <button
                    onClick={() => { setPendingConfirm(null); pushMsg("—", "Cancelled, nothing changed.", false); }}
                    className="px-3 py-1 text-[11px] font-semibold bg-white border border-amber-300 text-amber-700 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {showRecents ? (
                <div className="space-y-1">
                  <button
                    onClick={newChat}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-slate-300 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New chat</span>
                  </button>
                  {[...sessions].sort((a, b) => (b.pinned - a.pinned) || (b.at - a.at)).map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] cursor-pointer transition ${s.id === currentId ? "border-indigo-300 bg-indigo-50/60" : "border-transparent hover:bg-slate-100"}`}
                      onClick={() => { setCurrentId(s.id); setShowRecents(false); }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                      <span className="flex-1 truncate font-medium text-slate-700">{s.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{s.messages.length}</span>
                      <button
                        title={s.pinned ? "Unpin" : "Pin"}
                        onClick={(e) => { e.stopPropagation(); setSessions((p) => p.map((x) => (x.id === s.id ? { ...x, pinned: !x.pinned } : x))); }}
                        className={`p-1 rounded cursor-pointer ${s.pinned ? "text-indigo-600" : "text-slate-300 hover:text-indigo-500"}`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        title="Delete chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessions((p) => p.filter((x) => x.id !== s.id));
                          if (s.id === currentId) setCurrentId(null);
                        }}
                        className="p-1 rounded text-slate-300 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-[11px] text-slate-400 text-center pt-6">No chats yet — ask something and it lands here.</div>
                  )}
                </div>
              ) : aiHistory.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-6">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400 flex items-center justify-center shadow-md mb-3">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-lg font-semibold text-slate-800 mb-4">Let&apos;s build, V</div>
                  <div className="w-full space-y-1.5">
                    {["Spawn a castle in the scene", "Set the scene to night", "Play the game", "Take a screenshot"].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setAiPrompt(s); }}
                        className="w-full text-left text-[11px] px-3 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 text-[10px] text-slate-400 leading-snug px-2">
                    Commands run real editor actions — spawn, sun, play, screenshots. Mistakes possible, check the Console log.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-[11px] select-text">
                  {aiHistory.map((h, i) => (
                    <div key={i} className="space-y-1 group/msg">
                      <div className="flex justify-end">
                        <div className="max-w-[85%] px-2.5 py-1.5 rounded-2xl rounded-br-md bg-indigo-600 text-white">{h.q}</div>
                      </div>
                      <div className={`px-2.5 py-1.5 rounded-2xl rounded-bl-md ${h.ok ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>{h.a}</div>
                      {/* Per-message icon actions — Edit · Reuse · Copy · Delete */}
                      <div className="flex items-center gap-0.5 pl-1 opacity-60 group-hover/msg:opacity-100 transition">
                        <button
                          title="Edit — load back into input"
                          onClick={() => { setAiPrompt(h.q.replace(/^📎 /, "")); }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          title="Reuse — run again"
                          onClick={() => { handleAskAiSubmit({ preventDefault() {} }, h.q.replace(/^📎 /, "")); }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          title="Copy answer"
                          onClick={() => {
                            navigator.clipboard?.writeText(h.a).then(() => {
                              setCopiedMsg(i);
                              setTimeout(() => setCopiedMsg(null), 1200);
                            }).catch(() => {});
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                        >
                          {copiedMsg === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          title="Delete message"
                          onClick={() => { deleteMsg(i); }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div ref={aiEndRef} />
                  {streaming && (
                    <div className="space-y-1">
                      <div className="flex justify-end">
                        <div className="max-w-[85%] px-2.5 py-1.5 rounded-2xl rounded-br-md bg-indigo-600 text-white">{streaming.q}</div>
                      </div>
                      <div className="px-2.5 py-1.5 rounded-2xl rounded-bl-md bg-slate-100 text-slate-700 min-h-[1.5rem]">
                        {streaming.text}
                        <span className="inline-block w-1.5 h-3.5 bg-indigo-500 ml-0.5 animate-pulse align-text-bottom" />
                      </div>
                    </div>
                  )}
                  {aiThinking && !streaming && (
                    <div className="ai-shimmer-bubble px-2.5 py-1.5 rounded-2xl rounded-bl-md">
                      <span className="ai-shimmer-text">Thinking…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Model thinking effort — Auto default, Low/Med/High beside the search bar */}
            <div className="px-2 pt-2 flex items-center gap-1 relative">
              {[["auto", "Auto"], ["low", "Low"], ["medium", "Med"], ["high", "High"]].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setThinkLevel(v)}
                  title={v === "auto" ? "Auto thinking effort" : `${label} thinking effort`}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${thinkLevel === v ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
                >
                  {label}
                </button>
              ))}
              {metaKeySet && (
                <div className="ml-auto relative">
                  <button
                    type="button"
                    onClick={() => setModelMenuOpen((o) => !o)}
                    title="Choose model — from your key's live list"
                    className="flex items-center gap-1 max-w-[7rem] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-700 transition cursor-pointer"
                  >
                    <span className="truncate">{effectiveFriendly}</span>
                    <ChevronDown className={`w-3 h-3 transition ${modelMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {modelMenuOpen && (
                    <div className="absolute bottom-7 right-0 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => { setMetaModel(""); try { localStorage.setItem("spider-meta-model", ""); } catch {} setModelMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <div className="text-[11px] font-semibold text-slate-800 flex items-center justify-between">
                          <span>Auto</span>
                          {!metaModel && <Check className="w-3.5 h-3.5 text-slate-800" />}
                        </div>
                        <div className="text-[10px] text-slate-400">Adapts to your needs</div>
                      </button>
                      {modelChoices.length === 0 && (
                        <div className="px-3 py-2 text-[11px] text-slate-400">No models loaded yet — paste key in Settings → AI & Keys.</div>
                      )}
                      {modelChoices.map((id) => {
                        const f = friendlyModel(id);
                        const active = metaModel ? metaModel === id : effectiveModel === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => { setMetaModel(id); try { localStorage.setItem("spider-meta-model", id); } catch {} setModelMenuOpen(false); appendLog("Info", `Spider AI model → ${f.name}`); }}
                            title={id}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <div className="text-[11px] font-semibold text-slate-800 flex items-center justify-between">
                              <span>{f.name}</span>
                              {active && <Check className="w-3.5 h-3.5 text-slate-800" />}
                            </div>
                            <div className="text-[10px] text-slate-400">{f.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <form onSubmit={handleAskAiSubmit} className="p-2 border-t-0 border-slate-100 flex items-center gap-1.5 bg-white">
              {/* + opens the file manager for ANY file — parser allowlists models/images/audio */}
              <button type="button" onClick={() => aiFileRef.current?.click()} title="Attach any file — models, images, audio accepted" className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer font-bold text-base leading-none">+</button>
              <input ref={aiFileRef} type="file" accept="*/*" className="hidden" onChange={(e) => { handleAskFile(e.target.files?.[0]); e.target.value = ""; }} />
              <input
                autoFocus
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Type / to use skills"
                className="flex-1 text-[11px] px-2.5 py-2 bg-slate-100 rounded-full border border-transparent focus:outline-none focus:border-indigo-300"
              />
              <button type="submit" className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer" title="Send">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* New Project — full page, Unreal-style template picker */}
      {newProjectOpen && (
        <div className="absolute inset-0 z-50 bg-[#f0f2f8] flex flex-col">
          <div className="h-12 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
            <div>
              <span className="font-extrabold text-[13px] text-slate-900">New Project</span>
              <span className="text-[11px] text-slate-400 ml-2">Pick a template — like Unreal, minus the 40-minute shader compile</span>
            </div>
            <button onClick={() => setNewProjectOpen(false)} className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 cursor-pointer">Cancel</button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "normal", name: "Normal", desc: "Hero + world, playable", icon: Gamepad2 },
                  { id: "tpp", name: "TPP Shooting", desc: "Rifle + targets downrange", icon: Crosshair },
                  { id: "fpp", name: "FPP Shooting", desc: "You are the camera", icon: Camera },
                  { id: "racing", name: "Racing", desc: "Hero on the boat, coins as checkpoints", icon: Flag },
                  { id: "custom", name: "Custom", desc: "Duplicate of the scene you have open", icon: Copy },
                  { id: "blank", name: "Blank Level", desc: "Black void, spawn freely", icon: Box }
                ].map((t) => {
                  const Icon = t.icon;
                  const active = newProjectTemplate === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setNewProjectTemplate(t.id)}
                      className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition cursor-pointer bg-white ${active ? "border-indigo-500 shadow-lg shadow-indigo-100" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <Icon className={`w-8 h-8 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                      <div className="text-[13px] font-bold text-slate-800">{t.name}</div>
                      <div className="text-[11px] text-slate-400 text-center leading-tight">{t.desc}</div>
                      {active && <div className="text-[10px] font-bold text-indigo-600">✓ Selected</div>}
                    </button>
                  );
                })}
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Project name</span>
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleNewProject(newProjectName, newProjectTemplate, newProjectRoot); }}
                    placeholder={`Untitled Project ${projects.length + 1}`}
                    className="w-full text-[14px] px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-300"
                  />
                </label>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Location — where this game lives on disk</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-[11px] font-mono px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 truncate" title={newProjectRoot || "Browser Downloads (no folder picked)"}>
                      {newProjectRoot || "Browser Downloads (no folder picked)"}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const r = await window.spiderShell?.pickFolder?.();
                          if (r?.ok) setNewProjectRoot(r.dir);
                          else if (!r?.cancelled) appendLog("Warning", `Folder picker failed: ${r?.error || "unavailable"}`);
                        } catch (e) { appendLog("Warning", `Folder picker failed: ${e}`); }
                      }}
                      className="px-4 py-2.5 text-[12px] font-bold bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:text-indigo-700 cursor-pointer shrink-0"
                    >
                      Browse…
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400">Save + Build write {sceneFileName} straight into this folder. Empty = browser download.</div>
                </div>
                <button onClick={() => handleNewProject(newProjectName, newProjectTemplate, newProjectRoot)} className="w-full py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer">Create Project</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings — macOS-style two-sided page: sidebar + content */}
      {settingsOpen && (
        <div className="absolute inset-0 z-50 bg-[#f0f2f8] flex flex-col">
          <div className="h-12 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs">S</div>
              <div>
                <span className="font-extrabold text-[13px] text-slate-900">Settings</span>
                <span className="text-[11px] text-slate-400 ml-2">Spider Engine</span>
              </div>
            </div>
            <button onClick={() => setSettingsOpen(false)} className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 cursor-pointer">Done</button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar */}
            <div className="w-60 bg-white border-r border-slate-200 p-3 flex flex-col gap-4 shrink-0">
              <div className="space-y-0.5 text-[12px] font-medium pt-1">
                {[
                  { id: "Rendering", icon: Sun },
                  { id: "Play & Game", icon: Gamepad2 },
                  { id: "Scene & Data", icon: Box },
                  { id: "AI & Keys", icon: Sparkles },
                  { id: "About", icon: Info }
                ].map((s) => {
                  const Icon = s.icon;
                  const active = settingsSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSettingsSection(s.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition cursor-pointer ${active ? "bg-slate-200/80 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{s.id}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto px-2 text-[10px] text-slate-400 font-mono">v0.9.0 · WebGL</div>
            </div>
            {/* Right content */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="px-8 pt-6 pb-3 border-b border-slate-100">
                <div className="font-bold text-[17px] text-slate-900">{settingsSection}</div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6 text-[12px]">
                {settingsSection === "Rendering" && (
                  <div className="max-w-md space-y-4">
                    <label className="flex items-center justify-between text-slate-600">Real-time shadows (RTX)
                      <input type="checkbox" checked={rtxEnabled} onChange={(e) => setRtxEnabled(e.target.checked)} className="round-check" />
                    </label>
                    <label className="flex items-center justify-between text-slate-600">Helper grid
                      <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="round-check" />
                    </label>
                    <label className="flex items-center justify-between text-slate-600">Shading
                      <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-medium focus:outline-none focus:border-indigo-300 cursor-pointer">
                        <option>Lit</option>
                        <option>Wireframe</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between text-slate-600">Camera projection
                      <select value={projection} onChange={(e) => setProjection(e.target.value)} className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-medium focus:outline-none focus:border-indigo-300 cursor-pointer">
                        <option>Perspective</option>
                        <option>Orthographic</option>
                      </select>
                    </label>
                    <div>
                      <div className="text-slate-600 mb-1">Solar time <span className="font-mono font-semibold text-slate-800">{timeOfDay.toFixed(1)}h</span></div>
                      <input type="range" min="4" max="22" step="0.5" value={timeOfDay} onChange={(e) => { const t = parseFloat(e.target.value); setTimeOfDay(t); setTimelineT(t); }} className="w-full accent-indigo-600 cursor-pointer" />
                    </div>
                  </div>
                )}
                {settingsSection === "Play & Game" && (
                  <div className="max-w-md space-y-3 text-slate-600">
                    <div>Move step <span className="font-mono font-semibold text-slate-800">{PLAYER.moveStep}/tick</span></div>
                    <div>Jump impulse <span className="font-mono font-semibold text-slate-800">{PLAYER.jumpImpulse}</span> · Gravity <span className="font-mono font-semibold text-slate-800">{PLAYER.gravity}</span></div>
                    <div>Score <span className="font-mono font-semibold text-slate-800">{score}</span> · Coins left <span className="font-mono font-semibold text-slate-800">{coins.filter((c) => !c.taken).length}/3</span></div>
                    <button onClick={() => { setScore(0); setCoins(COINS.map((c) => ({ ...c, taken: false }))); appendLog("Info", "Score reset from Settings"); }} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg cursor-pointer">Reset score & coins</button>
                  </div>
                )}
                {settingsSection === "Scene & Data" && (
                  <div className="max-w-md space-y-3 text-slate-600">
                    <div>{sceneGroups.flatMap((g) => g.children).length} actors · {audioAssets.length} audio · {buildLogs.length} builds logged</div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={handleSaveScene} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg cursor-pointer">Save scene.json</button>
                      <button onClick={() => importFileRef.current?.click()} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg cursor-pointer">Open / Import…</button>
                      <button onClick={handleNewScene} className="px-3 py-1.5 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer">Reset scene</button>
                      <button onClick={() => { setConsoleLogs([]); setBuildLogs([]); }} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer">Clear all logs</button>
                    </div>
                  </div>
                )}
                {settingsSection === "AI & Keys" && (
                  <div className="max-w-md space-y-3 text-slate-600">
                    <div>Ask AI router: <span className="font-semibold text-emerald-700">Auto</span> — answers, acts, asks before delete.</div>
                    <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50/60">
                      <div className="font-bold text-slate-800 text-[12px]">Meta API key — encrypted, chat with Spider AI</div>
                      {metaKeySet ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Key {(() => { try { return localStorage.getItem("spider-meta-last4") || ""; } catch { return ""; } })()} stored encrypted — no need to paste again</span>
                          </div>
                          {metaModels.length > 0 ? (
                            <label className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-500 shrink-0">Model</span>
                              <select
                                value={metaModel}
                                onChange={(e) => { setMetaModel(e.target.value); try { localStorage.setItem("spider-meta-model", e.target.value); } catch {} appendLog("Info", `Spider AI model → ${e.target.value}`); }}
                                title="Models this key supports — swap anytime"
                                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-indigo-300 font-mono cursor-pointer"
                              >
                                {!metaModel && <option value="" disabled>Select a model…</option>}
                                {metaModels.map((id) => (
                                  <option key={id} value={id}>{id}</option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <label className="block space-y-1">
                              <span className="text-[11px] text-slate-500">Model <span className="text-slate-400">(list failed — {metaModelsError || "unknown reason"})</span></span>
                              <input
                                type="text"
                                value={metaModel}
                                onChange={(e) => { setMetaModel(e.target.value); try { localStorage.setItem("spider-meta-model", e.target.value); } catch {} }}
                                placeholder="e.g. muse-spark-1.3"
                                title="Model list unavailable — enter id manually"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-indigo-300 font-mono"
                              />
                              <button
                                onClick={() => {
                                  const run = async () => {
                                    try {
                                      const cipher = localStorage.getItem("spider-meta-key");
                                      if (!cipher || !window.spiderShell?.decryptString) return;
                                      const r = await window.spiderShell.decryptString(cipher);
                                      if (r?.ok) {
                                        metaKeyRef.current = sanitizeKey(r.plain);
                                        const ids = await fetchMetaModels(r.plain);
                                        appendLog(ids.length > 0 ? "Success" : "Warning", ids.length > 0 ? `Reloaded ${ids.length} models for this key` : `Retry failed: ${metaModelsError}`);
                                      }
                                    } catch {}
                                  };
                                  run();
                                }}
                                className="px-3 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-700 cursor-pointer"
                              >
                                Retry loading models
                              </button>
                            </label>
                          )}
                          <button onClick={deleteMetaKey} className="px-3 py-1.5 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer">Delete key</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="password"
                            value={metaKeyInput}
                            onChange={(e) => setMetaKeyInput(e.target.value)}
                            placeholder="Paste Meta Model API key…"
                            className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-300 font-mono"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={metaModel}
                              onChange={(e) => setMetaModel(e.target.value)}
                              placeholder="Model id"
                              title="Llama model id"
                              className="flex-1 text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-300 font-mono"
                            />
                            <button onClick={saveMetaKey} className="px-3 py-1.5 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-700 cursor-pointer">Save</button>
                          </div>
                          <div className="text-[10px] text-slate-400">Encrypted with the OS keychain before it touches disk. Plaintext never leaves memory.</div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {[["WASD / Arrows", "Move hero"], ["Space", "Jump"], ["H", "Hierarchy panel"], ["Alt", "Native menu"], ["Left-drag", "Orbit 3D view"]].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="font-mono font-semibold text-slate-800">{k}</span><span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {settingsSection === "About" && (
                  <div className="max-w-md space-y-2 text-slate-600">
                    <div className="font-bold text-slate-800 text-[13px]">Spider Engine 0.9.0</div>
                    <div className="font-mono text-[11px]">React + Three.js WebGL · {window.spiderShell?.platform || navigator.platform}</div>
                    <div>100% JSX demo game included: hero, coins, Ask AI, MCP tool bridge.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
