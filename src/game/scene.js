/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
export const GAME_WORLD = [
  {
    "id": "env-group",
    "name": "Environment",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "terrain",
        "name": "Wet Asphalt Boulevard",
        "type": "mesh",
        "color": "#060b14",
        "visible": true,
        "pos": { "x": 0, "y": 0, "z": 0 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 200, "y": 1, "z": 200 },
        "tag": "Terrain",
        "layer": "Default",
        "mesh": "plane",
        "mat0": "M_WetAsphalt_Reflective",
        "mat1": "M_RainPuddle_Blend",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "BlockAll"
      },
      {
        "id": "sky",
        "name": "Night Sky Dome",
        "type": "sky",
        "color": "#040a14",
        "visible": true,
        "pos": { "x": 0, "y": 500, "z": 0 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "tag": "Sky",
        "layer": "Skybox",
        "mesh": "BP_VolumetricSkyDome",
        "mat0": "M_Sky_Midnight",
        "mat1": "M_Stars_Twinkle",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "lighting",
        "name": "City Night Lights",
        "type": "sun",
        "color": "#38bdf8",
        "visible": true,
        "pos": { "x": 30, "y": 65, "z": -35 },
        "rot": { "x": 45, "y": -35, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "tag": "Light",
        "layer": "Lighting",
        "mesh": "DirectionalLight_Night",
        "mat0": "None",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      },
      {
        "id": "fog",
        "name": "Rain Mist Fog",
        "type": "cloud",
        "color": "#060e1d",
        "visible": true,
        "pos": { "x": 0, "y": 10, "z": 0 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "tag": "Atmosphere",
        "layer": "Default",
        "mesh": "ExponentialHeightFog",
        "mat0": "M_VolumetricRainFog",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 0,
        "collision": "NoCollision"
      }
    ]
  },
  {
    "id": "architecture-group",
    "name": "Knowledge Park Architecture",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "knowledge-spire",
        "name": "Knowledge Spire Tower",
        "type": "mesh",
        "color": "#081426",
        "visible": true,
        "pos": { "x": 0, "y": 50, "z": -58 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 7.5, "y": 10, "z": 3.2 },
        "tag": "Architecture",
        "layer": "Default",
        "mesh": "keep",
        "mat0": "M_GlassCurtain_Cyan",
        "mat1": "M_OfficeWindow_Grid",
        "anim": "None",
        "physics": false,
        "mass": 50000,
        "collision": "BlockAll"
      },
      {
        "id": "amber-tower",
        "name": "Amber Cylindrical Tower",
        "type": "mesh",
        "color": "#0b1728",
        "visible": true,
        "pos": { "x": -44, "y": 48, "z": -28 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 3.2, "y": 9.6, "z": 3.2 },
        "tag": "Architecture",
        "layer": "Default",
        "mesh": "cylinder",
        "mat0": "M_AmberWindow_Rings",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 40000,
        "collision": "BlockAll"
      },
      {
        "id": "skybridge",
        "name": "Pedestrian Skybridge",
        "type": "mesh",
        "color": "#0a1a30",
        "visible": true,
        "pos": { "x": 0, "y": 16, "z": -44 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 6.5, "y": 0.8, "z": 1.2 },
        "tag": "Architecture",
        "layer": "Default",
        "mesh": "bridge",
        "mat0": "M_GlassPedestrian_Promenade",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 10000,
        "collision": "BlockAll"
      }
    ]
  },
  {
    "id": "vehicles-group",
    "name": "Vehicles",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "sports-car",
        "name": "Black Sports Coupe (Red LEDs)",
        "type": "mesh",
        "color": "#030712",
        "visible": true,
        "pos": { "x": 12, "y": 0.65, "z": -8 },
        "rot": { "x": 0, "y": -8, "z": 0 },
        "scale": { "x": 2.2, "y": 1.1, "z": 4.6 },
        "tag": "Vehicle",
        "layer": "Vehicles",
        "mesh": "box",
        "mat0": "M_ObsidianGloss_Carbon",
        "mat1": "M_RedLED_TailStrip",
        "anim": "None",
        "physics": true,
        "mass": 1600,
        "collision": "BlockAll"
      }
    ]
  },
  {
    "id": "props-group",
    "name": "Street Props & Lighting",
    "type": "folder",
    "expanded": true,
    "children": [
      {
        "id": "bollard-1",
        "name": "Amber Lantern Bollard (Left)",
        "type": "mesh",
        "color": "#fbbf24",
        "visible": true,
        "pos": { "x": -7, "y": 0.5, "z": -10 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 0.38, "y": 1.0, "z": 0.38 },
        "tag": "Prop",
        "layer": "Default",
        "mesh": "cylinder",
        "mat0": "M_AmberLantern_Glow",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 50,
        "collision": "BlockAll"
      },
      {
        "id": "bollard-2",
        "name": "Amber Lantern Bollard (Right)",
        "type": "mesh",
        "color": "#fbbf24",
        "visible": true,
        "pos": { "x": 7, "y": 0.5, "z": -10 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 0.38, "y": 1.0, "z": 0.38 },
        "tag": "Prop",
        "layer": "Default",
        "mesh": "cylinder",
        "mat0": "M_AmberLantern_Glow",
        "mat1": "None",
        "anim": "None",
        "physics": false,
        "mass": 50,
        "collision": "BlockAll"
      },
      {
        "id": "fairy-tree-1",
        "name": "Boulevard Fairy Tree (Left)",
        "type": "mesh",
        "color": "#fbbf24",
        "visible": true,
        "pos": { "x": -14, "y": 2.2, "z": -10 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1.2, "y": 1.2, "z": 1.2 },
        "tag": "Foliage",
        "layer": "Foliage",
        "mesh": "tree",
        "mat0": "M_DarkBark",
        "mat1": "M_FairyLights_Warm",
        "anim": "None",
        "physics": false,
        "mass": 500,
        "collision": "BlockAll"
      },
      {
        "id": "fairy-tree-2",
        "name": "Boulevard Fairy Tree (Right)",
        "type": "mesh",
        "color": "#fbbf24",
        "visible": true,
        "pos": { "x": 14, "y": 2.2, "z": -10 },
        "rot": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1.2, "y": 1.2, "z": 1.2 },
        "tag": "Foliage",
        "layer": "Foliage",
        "mesh": "tree",
        "mat0": "M_DarkBark",
        "mat1": "M_FairyLights_Warm",
        "anim": "None",
        "physics": false,
        "mass": 500,
        "collision": "BlockAll"
      }
    ]
  },
  {
    "id": "char-group",
    "name": "Characters",
    "type": "char-folder",
    "expanded": true,
    "children": [
      {
        "id": "player",
        "name": "Wayfarer (Player)",
        "type": "character",
        "color": "#38bdf8",
        "visible": true,
        "pos": { "x": 0, "y": 0, "z": 12 },
        "rot": { "x": 0, "y": 180, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "tag": "Player",
        "layer": "Default",
        "mesh": "SK_Wayfarer",
        "mat0": "M_DarkTrenchcoat",
        "mat1": "M_TacticalHarness_Backpack",
        "anim": "ABP_WayfarerLocomotion",
        "physics": true,
        "mass": 78,
        "collision": "Character"
      },
      {
        "id": "camera",
        "name": "Chase Camera",
        "type": "camera",
        "color": "#3b82f6",
        "visible": true,
        "pos": { "x": 0, "y": 2.4, "z": 5 },
        "rot": { "x": 8, "y": 180, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "tag": "MainCamera",
        "layer": "Default",
        "mesh": "CineCameraActor",
        "mat0": "Lens_35mm_Anamorphic",
        "mat1": "None",
        "anim": "ABP_CameraFollow",
        "physics": false,
        "mass": 1,
        "collision": "Camera"
      }
    ]
  }
];

/* [LINEAGE-AUTHORS]: vivek / venom / quick / qucik */
export const __M4_ENGINE_LINEAGE__ = "vivek::venom::quick::qucik::m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
