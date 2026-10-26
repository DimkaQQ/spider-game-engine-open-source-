import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  Box,
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

// --- INITIAL SCENE HIERARCHY DATA ---
const INITIAL_SCENE_NODES = [
  {
    id: "env-group",
    name: "Environment",
    type: "folder",
    expanded: true,
    children: [
      {
        id: "terrain",
        name: "Terrain",
        type: "mesh",
        color: "#4ade80",
        visible: true,
        pos: { x: 0.0, y: 0.0, z: 0.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 100.0, y: 1.0, z: 100.0 },
        tag: "Terrain",
        layer: "Default",
        mesh: "SM_AlpineValley_01",
        mat0: "M_Alpine_RockGrass",
        mat1: "M_SnowPeak_Blend",
        anim: "None",
        physics: false,
        mass: 0,
        collision: "BlockAll"
      },
      {
        id: "water",
        name: "Water",
        type: "mesh",
        color: "#38bdf8",
        visible: true,
        pos: { x: 12.5, y: -4.0, z: 45.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 50.0, y: 1.0, z: 80.0 },
        tag: "Water",
        layer: "Water",
        mesh: "SM_RiverPlane_HQ",
        mat0: "M_Water_Ocean_SSR",
        mat1: "M_Water_Foam",
        anim: "ABP_WaveSim",
        physics: false,
        mass: 0,
        collision: "OverlapAll"
      },
      {
        id: "trees",
        name: "Trees",
        type: "mesh",
        color: "#4f46e5",
        visible: true,
        pos: { x: -18.0, y: 2.0, z: 22.0 },
        rot: { x: 0.0, y: 45.0, z: 0.0 },
        scale: { x: 1.2, y: 1.2, z: 1.2 },
        tag: "Foliage",
        layer: "Foliage",
        mesh: "SM_PineCluster_Inst",
        mat0: "M_PineNeedles_Subsurface",
        mat1: "M_Bark_Pine",
        anim: "ABP_WindSway",
        physics: false,
        mass: 500,
        collision: "Foliage"
      },
      {
        id: "rocks",
        name: "Rocks",
        type: "mesh",
        color: "#a855f7",
        visible: true,
        pos: { x: -5.4, y: 0.0, z: 8.2 },
        rot: { x: 4.0, y: 112.0, z: 0.0 },
        scale: { x: 1.5, y: 1.5, z: 1.5 },
        tag: "Prop",
        layer: "Default",
        mesh: "SM_CliffOutcrop_04",
        mat0: "M_Granite_Mossy",
        mat1: "M_Detail_Rock",
        anim: "None",
        physics: false,
        mass: 1200,
        collision: "BlockAll"
      },
      {
        id: "sky",
        name: "Sky",
        type: "sky",
        color: "#ec4899",
        visible: true,
        pos: { x: 0.0, y: 500.0, z: 0.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Sky",
        layer: "Skybox",
        mesh: "BP_VolumetricSkyDome",
        mat0: "M_Sky_Rayleigh",
        mat1: "M_Clouds_Volumetric",
        anim: "ABP_DayNightCycle",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      },
      {
        id: "lighting",
        name: "Lighting",
        type: "sun",
        color: "#f59e0b",
        visible: true,
        pos: { x: 0.0, y: 300.0, z: -200.0 },
        rot: { x: 35.0, y: -42.0, z: 12.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Light",
        layer: "Lighting",
        mesh: "DirectionalLight_Sun",
        mat0: "LightFunction_Clouds",
        mat1: "None",
        anim: "None",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      },
      {
        id: "fog",
        name: "Fog",
        type: "cloud",
        color: "#94a3b8",
        visible: true,
        pos: { x: 0.0, y: 15.0, z: 50.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Atmosphere",
        layer: "Default",
        mesh: "ExponentialHeightFog",
        mat0: "M_VolumetricFog_GodRays",
        mat1: "None",
        anim: "None",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      },
      {
        id: "postprocess",
        name: "Post Process",
        type: "fx",
        color: "#64748b",
        visible: true,
        pos: { x: 0.0, y: 0.0, z: 0.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "PostProcess",
        layer: "Default",
        mesh: "PostProcessVolume_Global",
        mat0: "LUT_FantasyCinematic",
        mat1: "M_Bloom_ACES",
        anim: "None",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      }
    ]
  },
  {
    id: "char-group",
    name: "Characters",
    type: "char-folder",
    expanded: true,
    children: [
      {
        id: "player",
        name: "PlayerCharacter",
        type: "character",
        color: "#3b82f6",
        visible: true,
        pos: { x: 0.0, y: 0.0, z: 0.0 },
        rot: { x: 0.0, y: 180.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Player",
        layer: "Default",
        mesh: "SK_Player",
        mat0: "M_Player_Body",
        mat1: "M_Player_Cloth",
        anim: "ABP_Player",
        physics: true,
        mass: 70.0,
        collision: "Character"
      },
      {
        id: "camera",
        name: "Camera",
        type: "camera",
        color: "#3b82f6",
        visible: true,
        pos: { x: 0.0, y: 2.2, z: -4.5 },
        rot: { x: 10.0, y: 180.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "MainCamera",
        layer: "Default",
        mesh: "CineCameraActor",
        mat0: "Lens_35mm_Prime",
        mat1: "None",
        anim: "ABP_CameraFollow",
        physics: false,
        mass: 1.0,
        collision: "Camera"
      },
      {
        id: "weapon",
        name: "Weapon",
        type: "weapon",
        color: "#6366f1",
        visible: true,
        pos: { x: 0.35, y: 1.1, z: 0.15 },
        rot: { x: 0.0, y: 90.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Weapon",
        layer: "Equipment",
        mesh: "SK_TacticalRifle_MK2",
        mat0: "M_Weapon_Carbon",
        mat1: "M_Weapon_Optics",
        anim: "ABP_WeaponRecoil",
        physics: false,
        mass: 4.5,
        collision: "NoCollision"
      }
    ]
  },
  {
    id: "props-group",
    name: "Props",
    type: "folder",
    expanded: true,
    children: [
      {
        id: "buildings",
        name: "Buildings",
        type: "sub-folder",
        color: "#f59e0b",
        visible: true,
        pos: { x: 140.0, y: 42.0, z: 280.0 },
        rot: { x: 0.0, y: -25.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Architecture",
        layer: "Default",
        mesh: "SM_HighlandCitadel_Full",
        mat0: "M_CastleWall_Limestone",
        mat1: "M_SlateRoof_Blue",
        anim: "None",
        physics: false,
        mass: 50000,
        collision: "BlockAll"
      },
      {
        id: "vehicles",
        name: "Vehicles",
        type: "sub-folder",
        color: "#f59e0b",
        visible: true,
        pos: { x: 24.0, y: -3.8, z: 60.0 },
        rot: { x: 0.0, y: 15.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Vehicle",
        layer: "Vehicles",
        mesh: "SK_WoodenSkiff_01",
        mat0: "M_AgedOak_Planks",
        mat1: "M_Canvas_Sail",
        anim: "ABP_BoatBuoyancy",
        physics: true,
        mass: 350.0,
        collision: "Vehicle"
      },
      {
        id: "npcs",
        name: "NPCs",
        type: "sub-folder",
        color: "#f59e0b",
        visible: true,
        pos: { x: 115.0, y: 38.0, z: 240.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "AI",
        layer: "Characters",
        mesh: "SK_CitadelGuard_Patrol",
        mat0: "M_PlateArmor_Silver",
        mat1: "M_RoyalCape",
        anim: "ABP_GuardPatrol",
        physics: true,
        mass: 80.0,
        collision: "Character"
      }
    ]
  },
  {
    id: "lights-group",
    name: "Lights",
    type: "folder",
    expanded: true,
    children: [
      {
        id: "dir-light",
        name: "Directional Light",
        type: "sub-folder",
        color: "#eab308",
        visible: true,
        pos: { x: 0.0, y: 500.0, z: 0.0 },
        rot: { x: 40.0, y: -30.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Light",
        layer: "Lighting",
        mesh: "Light_Sun_Primary",
        mat0: "None",
        mat1: "None",
        anim: "None",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      },
      {
        id: "sky-light",
        name: "Sky Light",
        type: "sub-folder",
        color: "#eab308",
        visible: true,
        pos: { x: 0.0, y: 200.0, z: 0.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Light",
        layer: "Lighting",
        mesh: "SkyLight_HDRI_Capture",
        mat0: "HDRI_AlpineMorning_8K",
        mat1: "None",
        anim: "None",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      },
      {
        id: "point-lights",
        name: "Point Lights",
        type: "sub-folder",
        color: "#eab308",
        visible: true,
        pos: { x: 135.0, y: 44.0, z: 275.0 },
        rot: { x: 0.0, y: 0.0, z: 0.0 },
        scale: { x: 1.0, y: 1.0, z: 1.0 },
        tag: "Light",
        layer: "Lighting",
        mesh: "PointLight_CastleTorches",
        mat0: "None",
        mat1: "None",
        anim: "ABP_TorchFlicker",
        physics: false,
        mass: 0,
        collision: "NoCollision"
      }
    ]
  }
];

// --- CONTENT BROWSER ENVIRONMENT ASSETS ---
const ENVIRONMENT_ASSETS = [
  {
    id: "asset-mountains",
    name: "Mountains",
    category: "Environment",
    mesh: "SM_AlpinePeak_Hero",
    gradient: "from-slate-600 via-indigo-200 to-sky-100",
    svgType: "mountains"
  },
  {
    id: "asset-rocks",
    name: "Rocks",
    category: "Environment",
    mesh: "SM_Boulder_Mossy_02",
    gradient: "from-stone-600 via-stone-400 to-emerald-800",
    svgType: "rocks"
  },
  {
    id: "asset-trees",
    name: "Trees",
    category: "Environment",
    mesh: "SM_AncientOak_Full",
    gradient: "from-emerald-800 via-green-600 to-sky-200",
    svgType: "trees"
  },
  {
    id: "asset-grass",
    name: "Grass",
    category: "Environment",
    mesh: "SM_MeadowGrass_Clump",
    gradient: "from-lime-700 via-emerald-500 to-green-900",
    svgType: "grass"
  },
  {
    id: "asset-water",
    name: "Water",
    category: "Environment",
    mesh: "M_RiverShader_Spline",
    gradient: "from-cyan-700 via-sky-500 to-blue-900",
    svgType: "water"
  },
  {
    id: "asset-cliffs",
    name: "Cliffs",
    category: "Environment",
    mesh: "SM_SheerCliff_Modular",
    gradient: "from-amber-800 via-stone-500 to-sky-200",
    svgType: "cliffs"
  },
  {
    id: "asset-buildings",
    name: "Buildings",
    category: "Environment",
    mesh: "BP_MedievalKeep_01",
    gradient: "from-amber-200 via-stone-400 to-slate-700",
    svgType: "castle"
  },
  {
    id: "asset-castle",
    name: "Castle",
    category: "Environment",
    mesh: "BP_RoyalCitadel_Master",
    gradient: "from-sky-300 via-amber-100 to-stone-700",
    svgType: "citadel"
  },
  {
    id: "asset-sky",
    name: "Sky",
    category: "Environment",
    mesh: "BP_DynamicSky_Atmos",
    gradient: "from-blue-600 via-sky-400 to-cyan-100",
    svgType: "sky"
  },
  {
    id: "asset-clouds",
    name: "Clouds",
    category: "Environment",
    mesh: "VDB_Cumulus_Pack",
    gradient: "from-slate-300 via-white to-sky-200",
    svgType: "clouds"
  },
  {
    id: "asset-hdri",
    name: "HDRI_Sky",
    category: "Environment",
    mesh: "T_HDRI_Sunburst_16K",
    gradient: "from-indigo-950 via-blue-700 to-amber-200",
    svgType: "hdri"
  },
  {
    id: "asset-waterfall",
    name: "Waterfall",
    category: "Environment",
    mesh: "NS_Waterfall_Cascade",
    gradient: "from-emerald-900 via-cyan-300 to-blue-800",
    svgType: "waterfall"
  },
  {
    id: "asset-bridge",
    name: "Bridge",
    category: "Environment",
    mesh: "SM_StoneViaduct_Arch",
    gradient: "from-sky-200 via-amber-200 to-stone-700",
    svgType: "bridge"
  },
  {
    id: "asset-village",
    name: "Village",
    category: "Environment",
    mesh: "BP_TudorHouse_Cluster",
    gradient: "from-amber-700 via-orange-200 to-emerald-800",
    svgType: "village"
  },
  {
    id: "asset-ruins",
    name: "Ruins",
    category: "Environment",
    mesh: "SM_AncientTemple_Ruins",
    gradient: "from-stone-700 via-amber-100 to-lime-800",
    svgType: "ruins"
  },
  {
    id: "asset-cave",
    name: "Cave",
    category: "Environment",
    mesh: "SM_CavernEntrance_Lit",
    gradient: "from-stone-950 via-amber-900 to-yellow-200",
    svgType: "cave"
  }
];

// --- INITIAL CONSOLE LOGS ---
const INITIAL_LOGS = [
  { id: 1, type: "Info", text: "Spider Engine 0.9.0" },
  { id: 2, type: "Info", text: "Project Loaded: TryUrBest" },
  { id: 3, type: "Info", text: "Rendering: Vulkan (RTX 3080)" },
  { id: 4, type: "Info", text: "Scene: GameWorld" },
  { id: 5, type: "Info", text: "Compiling Shaders..." },
  { id: 6, type: "Success", text: "320 shaders compiled" },
  { id: 7, type: "Info", text: "Play mode started" },
  { id: 8, type: "Info", text: "FPS: 120 | Frame: 8.3 ms" },
  { id: 9, type: "Info", text: "AI System Initialized" },
  { id: 10, type: "Info", text: "Physics World Created" },
  { id: 11, type: "Warning", text: "NavMesh needs to be rebuilt" },
  { id: 12, type: "Info", text: "Play mode stopped" }
];

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

export default function App() {
  // Navigation & Tabs State
  const [activeLeftRail, setActiveLeftRail] = useState("Scene");
  const [viewportTab, setViewportTab] = useState("Viewport"); // Viewport, Cinematic, Game View
  const [bottomTab, setBottomTab] = useState("Content Browser"); // Content Browser, Console, Build Log
  const [rightTab, setRightTab] = useState("Inspector"); // Inspector, World Settings
  const [activeFolder, setActiveFolder] = useState("Environment");

  // Scene & Selection State
  const [sceneGroups, setSceneGroups] = useState(INITIAL_SCENE_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState("player");
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  // Viewport Interactive State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeGizmo, setActiveGizmo] = useState("move"); // select, move, rotate, scale
  const [viewMode, setViewMode] = useState("Lit"); // Lit, Wireframe, Unlit
  const [rtxEnabled, setRtxEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [coordSpace, setCoordSpace] = useState("Global");
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [timeOfDay, setTimeOfDay] = useState(14.5); // 24h slider for World Settings
  const [fps, setFps] = useState(120);

  // Playable Character / Viewport Dragging State
  const [keysPressed, setKeysPressed] = useState({});
  const [consoleLogs, setConsoleLogs] = useState(INITIAL_LOGS);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleFilter, setConsoleFilter] = useState("All");
  const [isBuilding, setIsBuilding] = useState(false);

  const consoleEndRef = useRef(null);

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

  // Add a console log entry
  const appendLog = (type, text) => {
    setConsoleLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, text }
    ]);
  };

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  // Fluctuate FPS slightly in real-time for authenticity
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(isPlaying ? Math.floor(116 + Math.random() * 8) : 120);
    }, 1200);
    return () => clearInterval(timer);
  }, [isPlaying]);

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

  // Toggle visibility of a node in Hierarchy
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
    if (!isPlaying) {
      setIsPlaying(true);
      setSelectedNodeId("player");
      appendLog("Info", "Play mode started (Vulkan PIE)");
      appendLog("Info", "Possessing Actor: PlayerCharacter (WASD / Arrows to move)");
    } else {
      setIsPlaying(false);
      appendLog("Info", "Play mode stopped");
    }
  };

  // Build Project Simulation
  const handleBuildProject = () => {
    if (isBuilding) return;
    setIsBuilding(true);
    appendLog("Info", "Starting Build: GameWorld (Windows / macOS Vulkan)...");
    setTimeout(() => {
      appendLog("Info", "Baking NavMesh & Volumetric Lightmaps...");
    }, 600);
    setTimeout(() => {
      appendLog("Success", "Build succeeded: 0 errors, 0 warnings (1.42s)");
      setIsBuilding(false);
    }, 1500);
  };

  // Spawn an asset from Content Browser into the Scene Hierarchy
  const handleSpawnAsset = (asset) => {
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
      collision: "BlockAll"
    };

    setSceneGroups((prev) =>
      prev.map((g, idx) =>
        idx === 0 ? { ...g, expanded: true, children: [...g.children, newNode] } : g
      )
    );
    setSelectedNodeId(newId);
    appendLog("Info", `Spawned Actor '${newNode.name}' at (${randomX}, 0.0, ${randomZ})`);
  };

  // Keyboard Controls during Play Mode (moves PlayerCharacter in 3D space)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isPlaying) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        setKeysPressed((prev) => ({ ...prev, [k]: true }));
      }
    };
    const onKeyUp = (e) => {
      if (!isPlaying) return;
      const k = e.key.toLowerCase();
      setKeysPressed((prev) => ({ ...prev, [k]: false }));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSceneGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          children: group.children.map((node) => {
            if (node.id !== "player") return node;
            let dx = 0;
            let dz = 0;
            if (keysPressed["w"] || keysPressed["arrowup"]) dz += 0.6;
            if (keysPressed["s"] || keysPressed["arrowdown"]) dz -= 0.6;
            if (keysPressed["a"] || keysPressed["arrowleft"]) dx -= 0.6;
            if (keysPressed["d"] || keysPressed["arrowright"]) dx += 0.6;

            if (dx === 0 && dz === 0) return node;
            return {
              ...node,
              pos: {
                ...node.pos,
                x: Number(Math.max(-25, Math.min(25, node.pos.x + dx)).toFixed(1)),
                z: Number(Math.max(-15, Math.min(35, node.pos.z + dz)).toFixed(1))
              }
            };
          })
        }))
      );
    }, 30);
    return () => clearInterval(interval);
  }, [isPlaying, keysPressed]);

  // Console Command Submit
  const handleConsoleSubmit = (e) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;
    const cmd = consoleInput.trim();
    appendLog("Info", `> ${cmd}`);

    if (cmd.toLowerCase() === "rebuild navmesh") {
      appendLog("Success", "NavMesh rebuilt successfully (842ms)");
    } else if (cmd.toLowerCase() === "stat fps") {
      appendLog("Info", `Current Frame Rate: ${fps} FPS (8.3ms)`);
    } else if (cmd.toLowerCase() === "r.raytracing 1") {
      setRtxEnabled(true);
      appendLog("Success", "Hardware Raytracing Enabled (RTX ON)");
    } else if (cmd.toLowerCase() === "r.raytracing 0") {
      setRtxEnabled(false);
      appendLog("Warning", "Hardware Raytracing Disabled");
    } else if (cmd.toLowerCase() === "clear") {
      setConsoleLogs([]);
    } else {
      appendLog("Info", `Executed command '${cmd}'`);
    }
    setConsoleInput("");
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

  // Get Player Node for live position on Viewport
  const playerNode = findNodeById("player");
  const lightingNode = findNodeById("lighting");
  const fogNode = findNodeById("fog");
  const buildingsNode = findNodeById("buildings");
  const waterNode = findNodeById("water");
  const treesNode = findNodeById("trees");

  return (
    <div className="flex flex-col h-screen w-full bg-[#f0f2f8] text-slate-800 select-none font-sans overflow-hidden antialiased">
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

          {/* Menu Links */}
          <nav className="hidden md:flex items-center gap-1 ml-3 text-xs text-slate-600 font-medium">
            {["File", "Edit", "Scene", "Object", "Game", "Build", "Tools", "Window", "Help"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => appendLog("Info", `Opened ${item} menu`)}
                  className="px-2 py-1 rounded hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  {item}
                </button>
              )
            )}
          </nav>
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
            onClick={() => setRightTab(rightTab === "Inspector" ? "World Settings" : "Inspector")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Settings</span>
          </button>

          {/* Avatar Profile */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 ml-1 shadow-xs cursor-pointer">
            <div className="w-full h-full rounded-full bg-sky-100 flex items-center justify-center text-[11px] font-bold text-indigo-900">
              👨‍💻
            </div>
          </div>

          {/* Window Controls */}
          <div className="hidden sm:flex items-center gap-2.5 ml-2 pl-2 border-l border-slate-200 text-slate-400 text-xs">
            <span className="hover:text-slate-700 cursor-pointer">─</span>
            <span className="hover:text-slate-700 cursor-pointer">□</span>
            <span className="hover:text-rose-600 cursor-pointer">✕</span>
          </div>
        </div>
      </header>

      {/* ==================== MAIN ENGINE BODY ==================== */}
      <div className="flex-1 flex overflow-hidden p-1.5 gap-1.5">
        {/* 1. LEFT VERTICAL NAVIGATION RAIL */}
        <aside className="w-[74px] bg-white/95 rounded-xl border border-slate-200/80 flex flex-col justify-between py-2 px-1.5 shrink-0 shadow-2xs">
          <div className="space-y-0.5 overflow-y-auto no-scrollbar">
            {LEFT_RAIL_ITEMS.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeLeftRail === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveLeftRail(item.id);
                    appendLog("Info", `Switched tool mode: ${item.id}`);
                  }}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-xs shadow-indigo-500/30"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span className="truncate">{item.id}</span>
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
            <section className="w-56 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shrink-0 shadow-2xs overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Scene Hierarchy</span>
                <span className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">×</span>
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
                  <span>GameWorld</span>
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
                                  }`}
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
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    {node.visible ? (
                                      <Eye className="w-3 h-3" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-rose-400" />
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

            {/* CENTER 3D VIEWPORT PANEL */}
            <section className="flex-1 bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shadow-2xs overflow-hidden relative">
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
                        onClick={() => setViewportTab(tab.id)}
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

                {isPlaying && (
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>PIE Active — Use WASD / Arrows to move Hero</span>
                  </div>
                )}
              </div>

              {/* 3D Interactive World Canvas */}
              <div className="flex-1 relative overflow-hidden bg-slate-900">
                {/* --- LAYERED FANTASY OPEN-WORLD SCENE --- */}
                <div
                  style={{
                    transform: `scale(${cameraZoom})`,
                    filter:
                      viewMode === "Wireframe"
                        ? "contrast(1.5) grayscale(0.85)"
                        : lightingNode?.visible === false
                        ? "brightness(0.35) contrast(1.2)"
                        : rtxEnabled
                        ? "saturate(1.18) contrast(1.05)"
                        : "saturate(0.95)"
                  }}
                  className="w-full h-full relative transition-all duration-300 overflow-hidden"
                >
                  {/* 1. Dynamic Sky Gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        timeOfDay < 7 || timeOfDay > 19
                          ? "linear-gradient(180deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)"
                          : "linear-gradient(180deg, #60a5fa 0%, #93c5fd 32%, #e0f2fe 65%, #fef3c7 100%)"
                    }}
                  />

                  {/* Sun / Volumetric God Rays */}
                  {lightingNode?.visible !== false && (
                    <div
                      className="absolute w-72 h-72 rounded-full pointer-events-none mix-blend-screen"
                      style={{
                        top: `${Math.max(5, 65 - timeOfDay * 3)}%`,
                        left: "18%",
                        background:
                          "radial-gradient(circle, rgba(255,251,235,0.95) 0%, rgba(253,224,71,0.35) 35%, rgba(255,255,255,0) 70%)"
                      }}
                    />
                  )}

                  {/* 2. Distant Snow-Capped Alpine Mountains & Waterfalls (SVG Scenery) */}
                  <svg
                    viewBox="0 0 1200 650"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 w-full h-full"
                  >
                    <defs>
                      <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="60%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                      <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                      <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="45%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                      <linearGradient id="cliffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4d7c0f" />
                        <stop offset="25%" stopColor="#78716c" />
                        <stop offset="100%" stopColor="#44403c" />
                      </linearGradient>
                    </defs>

                    {/* Soft Fluffy Clouds */}
                    <g opacity="0.75" fill="#ffffff">
                      <circle cx="240" cy="95" r="45" />
                      <circle cx="290" cy="85" r="55" />
                      <circle cx="345" cy="100" r="40" />
                      <circle cx="950" cy="110" r="50" />
                      <circle cx="1010" cy="95" r="60" />
                    </g>

                    {/* Far Jagged Alpine Peaks */}
                    {findNodeById("terrain")?.visible !== false && (
                      <g>
                        <polygon points="-50,420 140,120 310,420" fill="url(#mountainFar)" />
                        <polygon points="140,120 185,195 110,210" fill="#f8fafc" />
                        <polygon points="210,420 430,85 650,420" fill="url(#mountainMid)" />
                        <polygon points="430,85 495,190 385,180" fill="#f1f5f9" />
                        <polygon points="520,420 720,150 920,420" fill="url(#mountainFar)" />
                        <polygon points="720,150 765,220 680,225" fill="#f8fafc" />
                        <polygon points="840,420 1060,110 1260,420" fill="url(#mountainMid)" />
                      </g>
                    )}

                    {/* Valley Mist / Volumetric Fog */}
                    {fogNode?.visible !== false && (
                      <rect
                        x="0"
                        y="290"
                        width="1200"
                        height="120"
                        fill="white"
                        opacity="0.35"
                      />
                    )}

                    {/* Winding Alpine River & Lake */}
                    {waterNode?.visible !== false && (
                      <path
                        d="M 420,360 Q 520,385 480,435 Q 430,490 650,535 L 1200,560 L 1200,650 L 280,650 Q 340,490 420,360 Z"
                        fill="url(#riverGrad)"
                      />
                    )}

                    {/* Highland Castle Citadel on Right Cliff */}
                    {buildingsNode?.visible !== false && (
                      <g
                        onClick={() => setSelectedNodeId("buildings")}
                        className="cursor-pointer hover:brightness-110 transition"
                      >
                        {/* Castle Cliff Base & Stone Viaduct Bridge */}
                        <path
                          d="M 600,325 L 720,325 L 720,370 L 600,370 Z"
                          fill="#a8a29e"
                        />
                        <circle cx="630" cy="365" r="14" fill="#475569" />
                        <circle cx="670" cy="365" r="14" fill="#475569" />
                        <circle cx="710" cy="365" r="14" fill="#475569" />

                        {/* Cliff Island */}
                        <polygon
                          points="680,315 1120,315 1180,490 630,460"
                          fill="url(#cliffGrad)"
                        />

                        {/* Cascading Waterfalls from Castle Cliff */}
                        <rect x="750" y="340" width="18" height="125" fill="#e0f2fe" opacity="0.85" />
                        <rect x="780" y="345" width="12" height="120" fill="#bae6fd" opacity="0.75" />
                        <rect x="1040" y="330" width="28" height="150" fill="#e0f2fe" opacity="0.85" />
                        <ellipse cx="765" cy="465" rx="35" ry="8" fill="#ffffff" opacity="0.8" />
                        <ellipse cx="1055" cy="480" rx="45" ry="10" fill="#ffffff" opacity="0.8" />

                        {/* Citadel Spires & Keep */}
                        <rect x="760" y="230" width="190" height="90" fill="#e7e5e4" />
                        <rect x="785" y="180" width="38" height="140" fill="#d6d3d1" />
                        <polygon points="780,180 804,115 828,180" fill="#334155" />
                        <rect x="845" y="135" width="48" height="185" fill="#f5f5f4" />
                        <polygon points="840,135 869,60 898,135" fill="#1e293b" />
                        <rect x="910" y="190" width="34" height="130" fill="#d6d3d1" />
                        <polygon points="906,190 927,130 948,190" fill="#334155" />
                      </g>
                    )}

                    {/* Pine Forests & Trees */}
                    {treesNode?.visible !== false && (
                      <g
                        onClick={() => setSelectedNodeId("trees")}
                        className="cursor-pointer"
                      >
                        {/* Left Valley Pines */}
                        <polygon points="80,380 55,460 105,460" fill="#14532d" />
                        <polygon points="120,360 90,465 150,465" fill="#166534" />
                        <polygon points="165,390 140,470 190,470" fill="#15803d" />
                        {/* Foreground Right Pine Trees */}
                        <polygon points="830,450 790,590 870,590" fill="#064e3b" />
                        <polygon points="830,410 798,530 862,530" fill="#047857" />
                        <polygon points="920,470 885,610 955,610" fill="#065f46" />
                      </g>
                    )}

                    {/* Foreground Rocky Cliff Overlook (Left Bottom) */}
                    {findNodeById("rocks")?.visible !== false && (
                      <g
                        onClick={() => setSelectedNodeId("rocks")}
                        className="cursor-pointer"
                      >
                        <polygon
                          points="-20,450 380,470 590,595 620,660 -20,660"
                          fill="#57534e"
                        />
                        <polygon
                          points="40,455 375,470 490,565 120,560"
                          fill="#78716c"
                        />
                        <polygon
                          points="180,465 440,490 540,610 240,610"
                          fill="#a8a29e"
                        />
                        {/* Moss Patches */}
                        <ellipse cx="140" cy="495" rx="65" ry="14" fill="#3f6212" />
                        <ellipse cx="290" cy="590" rx="80" ry="18" fill="#365314" />
                      </g>
                    )}
                  </svg>

                  {/* Wireframe Grid Overlay when toggled */}
                  {(showGrid || viewMode === "Wireframe") && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)",
                        backgroundSize: "48px 48px"
                      }}
                    />
                  )}

                  {/* --- THIRD-PERSON HERO CHARACTER ON THE CLIFF --- */}
                  {playerNode?.visible !== false && (
                    <div
                      onClick={() => setSelectedNodeId("player")}
                      style={{
                        left: `calc(34% + ${playerNode.pos.x * 5}px)`,
                        bottom: `calc(14% + ${playerNode.pos.z * 3}px)`,
                        transform: `scale(${playerNode.scale.x})`
                      }}
                      className={`absolute w-28 h-48 -translate-x-1/2 cursor-pointer transition-transform duration-75 group ${
                        selectedNodeId === "player"
                          ? "drop-shadow-[0_0_12px_rgba(99,102,241,0.85)]"
                          : ""
                      }`}
                    >
                      {/* Selection Transform Gizmo over Hero when Selected */}
                      {selectedNodeId === "player" && !isPlaying && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-indigo-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                          <span>PlayerCharacter</span>
                          <span className="opacity-75">
                            ({playerNode.pos.x}, {playerNode.pos.z})
                          </span>
                        </div>
                      )}

                      {/* Detailed Vector Tactical Adventurer (Back View with Backpack) */}
                      <svg viewBox="0 0 120 200" className="w-full h-full drop-shadow-2xl">
                        {/* Ground Shadow */}
                        <ellipse cx="60" cy="190" rx="34" ry="8" fill="rgba(0,0,0,0.55)" />
                        {/* Tactical Boots & Cargo Pants */}
                        <rect x="38" y="115" width="18" height="65" rx="6" fill="#292524" />
                        <rect x="64" y="115" width="18" height="65" rx="6" fill="#1c1917" />
                        <rect x="36" y="142" width="21" height="12" rx="3" fill="#44403c" />
                        <rect x="63" y="142" width="21" height="12" rx="3" fill="#44403c" />
                        <rect x="35" y="172" width="22" height="16" rx="5" fill="#0c0a09" />
                        <rect x="63" y="172" width="22" height="16" rx="5" fill="#0c0a09" />

                        {/* Jacket & Shoulders */}
                        <path
                          d="M 28,52 Q 60,42 92,52 L 86,118 L 34,118 Z"
                          fill="#3f3f46"
                        />
                        {/* Left & Right Arms + Gloves */}
                        <rect x="18" y="56" width="15" height="54" rx="7" fill="#27272a" />
                        <rect x="87" y="56" width="15" height="54" rx="7" fill="#27272a" />
                        <rect x="17" y="104" width="16" height="14" rx="5" fill="#09090b" />
                        <rect x="87" y="104" width="16" height="14" rx="5" fill="#09090b" />

                        {/* Heavy Expedition Backpack */}
                        <rect x="35" y="50" width="50" height="62" rx="10" fill="#1c1917" />
                        <rect x="40" y="56" width="40" height="22" rx="5" fill="#292524" />
                        <rect x="42" y="82" width="36" height="24" rx="4" fill="#292524" />
                        <rect x="38" y="44" width="44" height="9" rx="4" fill="#57534e" />

                        {/* Head & Hair (Looking out at Castle) */}
                        <circle cx="60" cy="28" r="15" fill="#d6b49c" />
                        <path
                          d="M 45,26 Q 45,10 60,10 Q 75,10 75,26 Q 68,34 52,34 Z"
                          fill="#271c19"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* --- VIEWPORT FLOATING OVERLAYS --- */}
                {/* Top-Left Camera / Shading Pills */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                  <button
                    onClick={() =>
                      setCoordSpace(coordSpace === "Perspective" ? "Orthographic" : "Perspective")
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm border border-white/50 cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-slate-600" />
                    <span>Perspective</span>
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
                    onClick={() => setShowGrid(!showGrid)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm border border-white/50 cursor-pointer"
                  >
                    <span>Show</span>
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

                {/* 3D Z-Y-X Axis Orientation Gizmo (Top Right below toolbar) */}
                <div className="absolute top-14 right-5 w-16 h-16 pointer-events-none z-20 flex items-center justify-center">
                  <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow">
                    {/* Z Axis (Up - Blue) */}
                    <line x1="40" y1="45" x2="40" y2="12" stroke="#2563eb" strokeWidth="3" />
                    <polygon points="40,6 35,15 45,15" fill="#2563eb" />
                    <text x="36" y="5" fill="#2563eb" fontSize="10" fontWeight="bold">
                      Z
                    </text>
                    {/* X Axis (Right - Red) */}
                    <line x1="40" y1="45" x2="72" y2="45" stroke="#ef4444" strokeWidth="3" />
                    <polygon points="78,45 69,40 69,50" fill="#ef4444" />
                    <text x="72" y="38" fill="#ef4444" fontSize="10" fontWeight="bold">
                      X
                    </text>
                    {/* Y Axis (Diagonal - Green) */}
                    <line x1="40" y1="45" x2="18" y2="64" stroke="#22c55e" strokeWidth="3" />
                    <polygon points="13,68 17,58 24,65" fill="#22c55e" />
                    <text x="4" y="72" fill="#22c55e" fontSize="10" fontWeight="bold">
                      Y
                    </text>
                    <circle cx="40" cy="45" r="4" fill="#ffffff" stroke="#475569" strokeWidth="2" />
                  </svg>
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
                    onClick={() => appendLog("Success", "High-Res Screenshot saved to /Saved/Screenshots/")}
                    className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-slate-700 shadow-sm cursor-pointer"
                    title="Capture Screenshot"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bottom-Right Real-time / RTX / 120 FPS Telemetry Pills */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-bold text-slate-800 shadow-sm">
                    Real-time
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
                    onClick={() => setCameraZoom(1.0)}
                    className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-lg text-slate-700 shadow-sm cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* LOWER SPLIT: CONTENT BROWSER + CONSOLE */}
          <div className="flex-1 flex gap-1.5 min-h-[210px]">
            {/* CONTENT BROWSER PANEL */}
            <section className="flex-[1.65] bg-white/95 rounded-xl border border-slate-200/80 flex flex-col shadow-2xs overflow-hidden">
              {/* Top Tabs + Action Buttons */}
              <div className="h-9 px-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1">
                  {[
                    { id: "Content Browser", icon: Folder },
                    { id: "Console", icon: Terminal },
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
                </div>
              </div>

              {/* Action Sub-bar */}
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] bg-slate-50/40 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSpawnAsset(ENVIRONMENT_ASSETS[0])}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-indigo-600" />
                    <span>Add</span>
                  </button>
                  <button
                    onClick={() => appendLog("Info", "Opened Asset Import Dialog...")}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>Import</span>
                  </button>
                  <button
                    onClick={() => appendLog("Success", "All dirty packages saved cleanly.")}
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
                  Click any asset to spawn into GameWorld
                </span>
              </div>

              {/* Content Browser Split Body: Folder Tree + Thumbnail Grid */}
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
                      "Characters",
                      "Animations",
                      "Environment",
                      "Props",
                      "Vehicles",
                      "Weapons",
                      "Materials",
                      "Textures",
                      "VFX",
                      "Audio",
                      "UI"
                    ].map((folderName) => (
                      <div
                        key={folderName}
                        onClick={() => setActiveFolder(folderName)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition ${
                          activeFolder === folderName
                            ? "bg-indigo-100/80 text-indigo-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Folder className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        <span className="truncate">{folderName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8x2 Thumbnail Grid */}
                <div className="flex-1 p-2.5 overflow-y-auto">
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {ENVIRONMENT_ASSETS.filter((a) =>
                      a.name.toLowerCase().includes(assetSearch.toLowerCase())
                    ).map((asset) => (
                      <div
                        key={asset.id}
                        onClick={() => handleSpawnAsset(asset)}
                        className="group flex flex-col items-center p-1 rounded-lg hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200 cursor-pointer transition"
                      >
                        {renderAssetThumbnail(asset)}
                        <span className="text-[10px] font-semibold text-slate-700 mt-1 truncate w-full text-center group-hover:text-indigo-700">
                          {asset.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* CONSOLE LOGGER PANEL */}
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
                    className="text-[11px] bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-slate-700 font-medium focus:outline-none"
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
                </div>
              </div>

              {/* Console Output Lines */}
              <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11px] space-y-1 bg-slate-50/50">
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
                  type="text"
                  placeholder="Enter command... (e.g. rebuild navmesh, stat fps)"
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
          </div>
        </div>

        {/* 3. RIGHT INSPECTOR / WORLD SETTINGS SIDEBAR */}
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
          </div>

          {rightTab === "Inspector" && selectedNode ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
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
                      className="rounded accent-indigo-600"
                    />
                    <span>Static</span>
                  </label>
                </div>

                {/* Tag & Layer Row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70 text-[11px]">
                    <span className="text-slate-400">Tag</span>
                    <span className="font-semibold text-slate-700">{selectedNode.tag}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-md border border-slate-200/70 text-[11px]">
                    <span className="text-slate-400">Layer</span>
                    <span className="font-semibold text-slate-700">{selectedNode.layer}</span>
                  </div>
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

              {/* MESH COMPONENT */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Box className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mesh</span>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-lg shrink-0">
                    🧍
                  </div>
                  <div className="flex-1 flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px] font-medium">
                    <span className="truncate">{selectedNode.mesh}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <button className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* MATERIALS COMPONENT */}
              <div className="space-y-2 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Materials</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Element 0</span>
                    <div className="flex-1 flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-stone-700 to-stone-400 shrink-0" />
                        <span className="truncate font-medium">{selectedNode.mat0}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0">Element 1</span>
                    <div className="flex-1 flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-700 to-orange-300 shrink-0" />
                        <span className="truncate font-medium">{selectedNode.mat1}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                    </div>
                  </div>
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
                    onClick={handleTogglePlay}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
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
                      onChange={(e) => updateSelectedNode({ collision: e.target.value })}
                      className="w-28 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 font-medium text-slate-700"
                    >
                      <option value="Character">Character</option>
                      <option value="BlockAll">BlockAll</option>
                      <option value="OverlapAll">OverlapAll</option>
                      <option value="NoCollision">NoCollision</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Component Button */}
              <button
                onClick={() =>
                  appendLog("Info", `Added new custom component to ${selectedNode.name}`)
                }
                className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Component</span>
              </button>
            </div>
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
                    className="accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}