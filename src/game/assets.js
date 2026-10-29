/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
// Full Modular Open World Assets for Knowledge Park & Spider Engine
export const ENVIRONMENT_ASSETS = [
  // ARCHITECTURE & SKYSCRAPERS
  { id: "asset-knowledge-spire", name: "Knowledge Spire", shape: "keep", mesh: "skyscraper", category: "Architecture", color: "#081426", gradient: "from-blue-900 to-slate-900" },
  { id: "asset-amber-tower", name: "Amber Cylindrical Tower", shape: "cylinder", mesh: "cylinder", category: "Architecture", color: "#f59e0b", gradient: "from-amber-600 to-orange-900" },
  { id: "asset-skybridge", name: "Pedestrian Skybridge", shape: "bridge", mesh: "bridge", category: "Architecture", color: "#0a1a30", gradient: "from-sky-900 to-slate-900" },
  { id: "asset-podium-building", name: "Knowledge Park Pavilion", shape: "platform", mesh: "platform", category: "Architecture", color: "#0f172a", gradient: "from-slate-800 to-slate-950" },

  // VEHICLES
  { id: "asset-sports-car", name: "Sports Coupe (Red LEDs)", shape: "box", mesh: "car", category: "Vehicles", color: "#030712", gradient: "from-red-600 to-slate-950" },

  // STREET FURNITURE & LIGHTING
  { id: "asset-street-bollard", name: "Warm Amber Bollard", shape: "cylinder", mesh: "bollard", category: "Lighting", color: "#fbbf24", gradient: "from-amber-400 to-amber-700" },
  { id: "asset-streetlight", name: "Modern Streetlamp", shape: "cylinder", mesh: "lamp", category: "Lighting", color: "#cbd5e1", gradient: "from-slate-300 to-slate-600" },

  // FOLIAGE & PARK
  { id: "asset-fairy-tree", name: "Fairy-Light Tree", shape: "tree", mesh: "tree", category: "Foliage", color: "#fbbf24", gradient: "from-amber-500 to-emerald-900" },

  // CHARACTERS & WAYFARER
  { id: "asset-wayfarer", name: "Wayfarer (Trenchcoat & Backpack)", shape: "box", mesh: "character", category: "Characters", color: "#111827", gradient: "from-indigo-900 to-slate-950" },

  // PRIMITIVES (Core Engine Tools)
  { id: "shape-box", name: "Box", shape: "box", mesh: "box", category: "Primitive", color: "#6366f1", gradient: "from-indigo-600 to-indigo-900" },
  { id: "shape-sphere", name: "Sphere", shape: "sphere", mesh: "sphere", category: "Primitive", color: "#3b82f6", gradient: "from-blue-600 to-sky-900" },
  { id: "shape-cylinder", name: "Cylinder", shape: "cylinder", mesh: "cylinder", category: "Primitive", color: "#10b981", gradient: "from-emerald-600 to-teal-900" },
  { id: "shape-cone", name: "Cone", shape: "cone", mesh: "cone", category: "Primitive", color: "#f59e0b", gradient: "from-amber-600 to-orange-900" },
  { id: "shape-torus", name: "Torus", shape: "torus", mesh: "torus", category: "Primitive", color: "#ec4899", gradient: "from-pink-600 to-rose-900" },
  { id: "shape-ramp", name: "Ramp", shape: "ramp", mesh: "ramp", category: "Primitive", color: "#8b5cf6", gradient: "from-violet-600 to-purple-900" },
  { id: "shape-platform", name: "Platform", shape: "platform", mesh: "platform", category: "Primitive", color: "#64748b", gradient: "from-slate-600 to-slate-900" }
];

export const PRIMITIVE_SHAPES = ENVIRONMENT_ASSETS;

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
