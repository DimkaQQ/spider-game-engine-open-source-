import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Stars, Grid, TransformControls, GizmoHelper, GizmoViewport, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

// 1 engine unit = 1m. App mock numbers are large, so static scenery uses WORLD scale.
const WORLD = 0.12;
const DEG = Math.PI / 180;

// Shared API for honest screenshot capture (set from inside Canvas).
export const viewportApi = { capture: null };
// Set while a TransformControls drag is active so smoothing doesn't fight the user.
let transforming = false;

function findNode(groups, id) {
  for (const g of groups) for (const c of g.children) if (c.id === id) return c;
  return null;
}

// Reports real FPS to the editor telemetry.
function FpsMeter({ onFps }) {
  const frames = useRef(0);
  const last = useRef(performance.now());
  useFrame(() => {
    frames.current += 1;
    const now = performance.now();
    if (now - last.current >= 500) {
      onFps(Math.round((frames.current * 1000) / (now - last.current)));
      frames.current = 0;
      last.current = now;
    }
  });
  return null;
}

// Syncs editor zoom pill to the real camera fov.
function FovSync({ zoom }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (camera.isPerspectiveCamera) {
      camera.fov = 55 / zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);
  return null;
}

// Follows the hero in Play/Game modes; slow auto-orbit in Cinematic;
// Unreal-style WASD/QE camera fly in the free Viewport when not playing.
function CameraRig({ isPlaying, followRef, mode, keysPressed }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const target = useMemo(() => new THREE.Vector3(), []);
  const chase = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(({ clock }) => {
    if (mode === "Cinematic") {
      const t = clock.elapsedTime * 0.12;
      const r = 34;
      camera.position.set(Math.cos(t) * r, 14, Math.sin(t) * r);
      camera.lookAt(0, 4, 0);
      if (controls) controls.target.set(0, 4, 0);
      return;
    }
    const follow = mode === "Game View" || (mode === "Viewport" && isPlaying);
    if (follow && controls && followRef.current) {
      followRef.current.getWorldPosition(target);
      if (mode === "Game View") {
        // Chase cam: behind + above hero, looking at hero
        chase.set(target.x - 7, target.y + 5, target.z - 9);
        camera.position.lerp(chase, 0.06);
        controls.target.lerp(target, 0.12);
      } else {
        controls.target.lerp(target, 0.08);
      }
      controls.update();
      return;
    }
    // Free Viewport + not playing: WASD/arrows fly, Q/E (or Space) rise/sink — camera-relative
    if (!isPlaying && mode === "Viewport" && controls) {
      const k = keysPressed || {};
      const f = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
      const s = (k["d"] || k["arrowright"] ? 1 : 0) - (k["a"] || k["arrowleft"] ? 1 : 0);
      const u = (k["e"] || k[" "] ? 1 : 0) - (k["q"] ? 1 : 0);
      if (!f && !s && !u) return;
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
      fwd.normalize();
      right.crossVectors(fwd, up).normalize();
      const step = 0.35;
      camera.position.addScaledVector(fwd, f * step).addScaledVector(right, s * step);
      camera.position.y = Math.max(1, camera.position.y + u * step);
      controls.target.addScaledVector(fwd, f * step).addScaledVector(right, s * step);
      controls.target.y = Math.max(0.5, controls.target.y + u * step);
      controls.update();
    }
  });
  return null;
}

// Exposes renderer capture for the Screenshot button (needs preserveDrawingBuffer).
function CaptureApi() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    viewportApi.capture = () => {
      const url = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `SpiderViewport_${Date.now()}.png`;
      a.click();
      return url;
    };
    return () => {
      viewportApi.capture = null;
    };
  }, [gl]);
  return null;
}

// Smooth group: lerps toward editor transform so inspector edits glide live.
function LiveGroup({ node, selected, onSelect, register, children }) {
  const ref = useRef(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (ref.current) register(node.id, ref.current);
    return () => register(node.id, null);
  }, [node.id, register]);
  useFrame(() => {
    if (!ref.current || transforming) return;
    target.position.set(node.pos.x * WORLD, node.pos.y * WORLD, node.pos.z * WORLD);
    target.rotation.set(node.rot.x * DEG, node.rot.y * DEG, node.rot.z * DEG);
    target.scale.set(node.scale.x, node.scale.y, node.scale.z);
    ref.current.position.lerp(target.position, 0.25);
    ref.current.rotation.x += (target.rotation.x - ref.current.rotation.x) * 0.25;
    ref.current.rotation.y += (target.rotation.y - ref.current.rotation.y) * 0.25;
    ref.current.rotation.z += (target.rotation.z - ref.current.rotation.z) * 0.25;
    ref.current.scale.lerp(target.scale, 0.25);
  });
  if (node.visible === false) return null;
  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {children}
    </group>
  );
}

function Std({ color, wire, emissive, ...props }) {  return (
    <meshStandardMaterial
      color={color}
      wireframe={wire}
      emissive={emissive || "#000000"}
      emissiveIntensity={emissive ? 0.55 : 0}
      roughness={0.8}
      metalness={0.1}
      {...props}
    />
  );
}

// Real imported GLB/GLTF model — geometry parsed by three, rendered natively.
function ImportedModel({ url, wire, selected }) {
  const { scene } = useGLTF(url);  const clone = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => {
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (wire) {
          o.material = o.material.clone();
          o.material.wireframe = true;
        }
        if (selected) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color("#6366f1");
          o.material.emissiveIntensity = 0.35;
        }
      }
    });
  }, [clone, wire, selected]);
  return <primitive object={clone} />;
}

// Real imported FBX model (Autodesk format — animations play if present).
function FbxModel({ url, wire, selected }) {
  const obj = useLoader(FBXLoader, url);
  const clone = useMemo(() => obj.clone(true), [obj]);
  useEffect(() => {
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (wire) {
          o.material = o.material.clone();
          o.material.wireframe = true;
        }
        if (selected) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color("#6366f1");
          o.material.emissiveIntensity = 0.35;
        }
      }
    });
  }, [clone, wire, selected]);
  return <primitive object={clone} />;
}

// Real imported OBJ model (Wavefront — pairs with .mtl when present, plain material otherwise).
function ObjModel({ url, wire, selected }) {
  const obj = useLoader(OBJLoader, url);
  const clone = useMemo(() => obj.clone(true), [obj]);
  useEffect(() => {
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        if (wire) {
          o.material = o.material.clone();
          o.material.wireframe = true;
        }
        if (selected) {
          o.material = o.material.clone();
          if ("emissive" in o.material) {
            o.material.emissive = new THREE.Color("#6366f1");
            o.material.emissiveIntensity = 0.35;
          }
        }
      }
    });
  }, [clone, wire, selected]);
  return <primitive object={clone} />;
}

// Real imported texture mapped onto a prop box.
function TexturedProp({ url, wire, selected }) {
  const map = useTexture(url);
  return (
    <mesh castShadow>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      <meshStandardMaterial map={wire ? undefined : map} color={selected ? "#a5b4fc" : "#ffffff"} wireframe={wire} roughness={0.85} />
    </mesh>
  );
}

// Procedural mesh for spawned / generic prop nodes.
function PropMesh({ node, wire, selected }) {
  if (node.modelUrl) {
    return (
      <Suspense fallback={null}>
        {node.modelFormat === "fbx" ? (
          <FbxModel url={node.modelUrl} wire={wire} selected={selected} />
        ) : node.modelFormat === "obj" ? (
          <ObjModel url={node.modelUrl} wire={wire} selected={selected} />
        ) : (
          <ImportedModel url={node.modelUrl} wire={wire} selected={selected} />
        )}
      </Suspense>
    );
  }
  if (node.textureUrl) {
    return (
      <Suspense fallback={null}>
        <TexturedProp url={node.textureUrl} wire={wire} selected={selected} />
      </Suspense>
    );
  }
  const name = `${node.mesh} ${node.name}`.toLowerCase();
  const accent = node.tint || node.color || "#6366f1";
  const e = selected ? "#6366f1" : undefined;
  if (name.includes("pine") || name.includes("oak") || name.includes("tree")) {
    return (
      <group>
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[1.1, 2.6, 8]} />
          <Std color={accent} wire={wire} emissive={e} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.24, 1.2, 8]} />
          <Std color="#451a03" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  if (name.includes("boulder") || name.includes("rock")) {
    return (
      <mesh castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <Std color={accent} wire={wire} emissive={e} flatShading />
      </mesh>
    );
  }
  if (name.includes("keep") || name.includes("citadel") || name.includes("castle")) {
    return (
      <group>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[3, 2, 3]} />
          <Std color="#d6d3d1" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[-1, 2.6, -1]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 2.4, 8]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
        <mesh position={[1, 2.6, 1]} castShadow>
          <cylinderGeometry args={[0.5, 0.6, 2.4, 8]} />
          <Std color="#78716c" wire={wire} emissive={e} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh castShadow>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <Std color={accent} wire={wire} emissive={e} />
    </mesh>
  );
}

function Hero({ node, wire, selected, moving }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    // Walk bob + lean while moving in Play mode, idle breathing otherwise
    const amp = moving ? 0.09 : 0.03;
    ref.current.position.y = Math.abs(Math.sin(t * (moving ? 10 : 2))) * amp;
    ref.current.rotation.x = moving ? 0.12 : 0;
  });
  const e = selected ? "#3b82f6" : undefined;
  return (
    <group ref={ref}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.9, 6, 14]} />
        <Std color={node.tint || "#1e3a8a"} wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.32, 20, 20]} />
        <Std color="#d6b49c" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.95, 0.28]}>
        <boxGeometry args={[0.34, 0.1, 0.05]} />
        <Std color="#271c19" wire={wire} />
      </mesh>
    </group>
  );
}

function WeaponFollow({ player, weapon, wire, selected, onSelect }) {
  const ref = useRef(null);
  useFrame(() => {
    if (!ref.current || transforming || !player) return;
    const t = ref.current.position;
    t.x += (player.pos.x * WORLD + 0.55 - t.x) * 0.3;
    t.y += (1.2 + player.pos.y * WORLD - t.y) * 0.3;
    t.z += (player.pos.z * WORLD + 0.2 - t.z) * 0.3;
    ref.current.rotation.y += (player.rot.y * DEG - ref.current.rotation.y) * 0.3;
  });
  return (
    <group ref={ref} position={[0.55, 1.2, 0.2]}>
      <mesh castShadow onClick={(e) => { e.stopPropagation(); onSelect("weapon"); }}>
        <boxGeometry args={[0.18, 0.18, 1.1]} />
        <Std color="#27272a" wire={wire} emissive={selected ? "#6366f1" : undefined} />
      </mesh>
    </group>
  );
}

function Boat({ node, wire, selected }) {
  const ref = useRef(null);
  // Inner local lift: outer LiveGroup already places us at node pos,
  // so hover just above the water plane (world y ~ -0.1) with a bob.
  const lift = -0.1 - node.pos.y * WORLD;
  useFrame(({ clock }) => {
    if (!ref.current || transforming || node.animPaused) return;
    ref.current.position.y += (lift + Math.sin(clock.elapsedTime * 1.4) * 0.12 - ref.current.position.y) * 0.1;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.04;
  });
  const e = selected ? "#f59e0b" : undefined;
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.5, 3]} />
        <Std color="#92400e" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.6, 8]} />
        <Std color="#451a03" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.5, 0.7]}>
        <planeGeometry args={[1.2, 1.4]} />
        <Std color={node.tint2 || "#fef3c7"} wire={wire} emissive={e} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Guards({ node, wire, selected }) {
  const g1 = useRef(null);
  const g2 = useRef(null);
  useFrame(({ clock }) => {
    if (transforming || node.animPaused) return;
    const t = clock.elapsedTime * 0.5;
    if (g1.current) {
      g1.current.position.x += (Math.sin(t) * 2 - g1.current.position.x) * 0.1;
      g1.current.position.z += (0 - g1.current.position.z) * 0.1;
      g1.current.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    if (g2.current) {
      g2.current.position.x += (Math.cos(t) * 2 - g2.current.position.x) * 0.1;
      g2.current.position.z += (1.5 - g2.current.position.z) * 0.1;
    }
  });
  const e = selected ? "#f59e0b" : undefined;
  const guard = (
    <>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.8, 6, 12]} />
        <Std color="#9ca3af" wire={wire} emissive={e} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <Std color="#d6b49c" wire={wire} emissive={e} />
      </mesh>
    </>
  );
  return (
    <>
      <group ref={g1} position={[0, 0, 0]}>
        {guard}
      </group>
      <group ref={g2} position={[0, 0, 1.5]}>
        {guard}
      </group>
    </>
  );
}

// Spinning collectible coins — the playable game objective.
function Coins({ coins, wire }) {
  const refs = useRef(new Map());
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 2.2;
    refs.current.forEach((o) => {
      if (!o) return;
      o.rotation.y = t;
      o.position.y += (Math.sin(t * 1.5 + o.position.x) * 0.15 + 1 - o.position.y) * 0.1;
    });
  });
  return (
    <>
      {coins.filter((c) => !c.taken).map((c) => (
        <mesh
          key={c.id}
          ref={(o) => { if (o) refs.current.set(c.id, o); else refs.current.delete(c.id); }}
          position={[c.x * WORLD, 1, c.z * WORLD]}
        >
          <cylinderGeometry args={[0.45, 0.45, 0.12, 24]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} emissive="#b45309" emissiveIntensity={0.5} wireframe={wire} />
        </mesh>
      ))}
    </>
  );
}

// Trees — real wind sway (ABP_WindSway) + live tint; pauses when animPaused
function SwayingTrees({ node, wire, selected }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current || transforming || node.animPaused) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.04;
    ref.current.rotation.x = Math.cos(clock.elapsedTime * 0.9) * 0.025;
  });
  const leaf = node.tint || "#15803d";
  const e = selected ? "#6366f1" : undefined;
  return (
    <group ref={ref}>
      {[
        [0, 0],
        [2.2, 1.2],
        [-2, 1.6]
      ].map(([dx, dz], i) => (
        <group key={i} position={[dx, 0, dz]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[1.3, 3, 8]} />
            <Std color={leaf} wire={wire} emissive={e} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.28, 1.4, 8]} />
            <Std color={node.tint2 || "#451a03"} wire={wire} emissive={e} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Castle({ node, wire, selected }) {
  const e = selected ? "#f59e0b" : undefined;
  const baseY = 3 + node.pos.y * 0.02;
  const wall = node.tint || "#d6d3d1";  return (
    <group>
      {/* Cliff island */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[11, 6, 11]} />
        <Std color="#78716c" wire={wire} emissive={e} flatShading />
      </mesh>
      {/* Waterfalls */}
      <mesh position={[-2.5, 0.4, 5.55]}>
        <boxGeometry args={[0.9, 6.5, 0.25]} />
        <meshStandardMaterial color="#bae6fd" transparent opacity={0.85} wireframe={wire} />
      </mesh>
      <mesh position={[2.5, 0.4, 5.55]}>
        <boxGeometry args={[1.3, 6.5, 0.25]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.85} wireframe={wire} />
      </mesh>
      {/* Keep + towers */}
      <mesh position={[0, baseY + 1.2, 0]} castShadow>
        <boxGeometry args={[4, 2.4, 4]} />
        <Std color={wall} wire={wire} emissive={e} />
      </mesh>
      {[
        [-1.7, -1.7],
        [1.7, -1.7],
        [-1.7, 1.7],
        [1.7, 1.7]
      ].map(([dx, dz]) => (
        <group key={`${dx}${dz}`}>
          <mesh position={[dx, baseY + 2.6, dz]} castShadow>
            <cylinderGeometry args={[0.55, 0.65, 3, 10]} />
            <Std color={node.tint2 || "#a8a29e"} wire={wire} emissive={e} />
          </mesh>
          <mesh position={[dx, baseY + 4.4, dz]} castShadow>
            <coneGeometry args={[0.8, 1.1, 10]} />
            <Std color={node.tint2 || "#475569"} wire={wire} emissive={e} />
          </mesh>
        </group>
      ))}
      {/* Bridge */}
      <mesh position={[-8, 2.2, 0]} castShadow>
        <boxGeometry args={[6, 0.4, 1.6]} />
        <Std color="#a8a29e" wire={wire} emissive={e} />
      </mesh>
    </group>
  );
}

export default function GameViewport({
  sceneGroups,
  selectedNodeId,
  onSelectNode,
  onTransformNode,
  isPlaying,
  keysPressed,
  timeOfDay,
  rtxEnabled,
  showGrid,
  viewMode,
  activeGizmo,
  cameraZoom,
  projection,
  space,
  cameraMode,
  coins,
  tint,
  onFps
}) {
  const registry = useRef(new Map());
  const register = (id, obj) => {
    if (obj) registry.current.set(id, obj);
    else registry.current.delete(id);
  };
  const [selectedObj, setSelectedObj] = useStateSelected(selectedNodeId, registry, sceneGroups);

  const terrain = findNode(sceneGroups, "terrain");
  const water = findNode(sceneGroups, "water");
  const trees = findNode(sceneGroups, "trees");
  const rocks = findNode(sceneGroups, "rocks");
  const sky = findNode(sceneGroups, "sky");
  const lighting = findNode(sceneGroups, "lighting");
  const fog = findNode(sceneGroups, "fog");
  const buildings = findNode(sceneGroups, "buildings");
  const vehicles = findNode(sceneGroups, "vehicles");
  const npcs = findNode(sceneGroups, "npcs");
  const player = findNode(sceneGroups, "player");
  const cameraNode = findNode(sceneGroups, "camera");
  const weapon = findNode(sceneGroups, "weapon");

  const spawned = [];
  for (const g of sceneGroups)
    for (const c of g.children) if (String(c.id).startsWith("spawn-")) spawned.push(c);

  // Sun path: 6h rise -> 12h noon -> 18h set.
  const sunT = ((timeOfDay - 6) / 12) * Math.PI;
  const sunPos = [Math.cos(sunT) * 60, Math.max(4, Math.sin(sunT) * 60), -30];
  const night = timeOfDay < 6.5 || timeOfDay > 19;
  const wire = viewMode === "Wireframe";

  const gizmoMode =
    activeGizmo === "rotate" ? "rotate" : activeGizmo === "scale" ? "scale" : "translate";
  const showTransform = activeGizmo !== "select" && selectedObj;
  const heroMoving = isPlaying && keysPressed && Object.values(keysPressed).some(Boolean);

  return (
    <div className="absolute inset-0">
      <Canvas
        key={projection}
        shadows={rtxEnabled}
        orthographic={projection === "Orthographic"}
        camera={
          projection === "Orthographic"
            ? { position: [50, 50, 50], zoom: 22 }
            : { position: [14, 10, 18], fov: 55 / cameraZoom }
        }
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onPointerMissed={() => onSelectNode("player")}
      >
        {!night && sky?.visible !== false ? (
          <Sky distance={450000} sunPosition={sunPos} inclination={0.52} />
        ) : (
          <color attach="background" args={["#0f172a"]} />
        )}
        {night && <Stars radius={200} depth={40} count={2500} factor={4} fade />}
        {fog?.visible !== false && <fog attach="fog" args={["#cbd5e1", 70, 240]} />}
        <ambientLight intensity={night ? 0.25 : 0.55} />
        {lighting?.visible !== false && (
          <directionalLight
            position={sunPos}
            intensity={night ? 0.4 : 1.6}
            castShadow={rtxEnabled}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
          />
        )}

        {/* Terrain + distant peaks */}
        {terrain?.visible !== false && (
          <group>
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[260, 260]} />
              <Std color="#4d7c0f" wire={wire} />
            </mesh>
            {[
              [-70, -60, 26, "#64748b"],
              [60, -70, 32, "#475569"],
              [-85, 20, 22, "#94a3b8"],
              [75, 55, 24, "#64748b"]
            ].map(([x, z, h, c], i) => (
              <group key={i} position={[x, 0, z]}>
                <mesh position={[0, h / 2, 0]} castShadow>
                  <coneGeometry args={[h * 0.55, h, 7]} />
                  <Std color={c} wire={wire} flatShading />
                </mesh>
                <mesh position={[0, h - h * 0.12, 0]}>
                  <coneGeometry args={[h * 0.55 * 0.24, h * 0.24, 7]} />
                  <Std color="#f8fafc" wire={wire} flatShading />
                </mesh>
              </group>
            ))}
          </group>
        )}

        {/* Water */}
        {water?.visible !== false && (
          <mesh
            rotation-x={-Math.PI / 2}
            position={[water.pos.x * WORLD, -0.5, water.pos.z * WORLD]}
          >
            <planeGeometry args={[water.scale.x * WORLD, water.scale.z * WORLD]} />
            <meshStandardMaterial
              color="#0284c7"
              transparent
              opacity={0.8}
              roughness={0.2}
              metalness={0.4}
              wireframe={wire}
            />
          </mesh>
        )}

        {/* Trees */}
        {trees?.visible !== false && (
          <LiveGroup node={trees} selected={selectedNodeId === "trees"} onSelect={onSelectNode} register={register}>
            <SwayingTrees node={trees} wire={wire} selected={selectedNodeId === "trees"} />
          </LiveGroup>
        )}

        {/* Rocks */}
        {rocks?.visible !== false && (
          <LiveGroup node={rocks} selected={selectedNodeId === "rocks"} onSelect={onSelectNode} register={register}>
            {[
              [0, 0, 1],
              [1.8, 0.8, 0.7],
              [-1.5, 1, 1.3]
            ].map(([dx, dz, s], i) => (
              <mesh key={i} position={[dx, 0.4 * s, dz]} scale={s} castShadow>
                <dodecahedronGeometry args={[1, 0]} />
                <Std color={rocks.tint || "#78716c"} wire={wire} flatShading emissive={selectedNodeId === "rocks" ? "#6366f1" : undefined} />
              </mesh>
            ))}
          </LiveGroup>
        )}

        {/* Castle */}
        {buildings?.visible !== false && (
          <LiveGroup node={buildings} selected={selectedNodeId === "buildings"} onSelect={onSelectNode} register={register}>
            <Castle node={buildings} wire={wire} selected={selectedNodeId === "buildings"} />
          </LiveGroup>
        )}

        {/* Boat */}
        {vehicles?.visible !== false && (
          <LiveGroup node={vehicles} selected={selectedNodeId === "vehicles"} onSelect={onSelectNode} register={register}>
            <Boat node={vehicles} wire={wire} selected={selectedNodeId === "vehicles"} />
          </LiveGroup>
        )}

        {/* Guards on patrol */}
        {npcs?.visible !== false && (
          <LiveGroup node={npcs} selected={selectedNodeId === "npcs"} onSelect={onSelectNode} register={register}>
            <Guards node={npcs} wire={wire} selected={selectedNodeId === "npcs"} />
          </LiveGroup>
        )}

        {/* Hero */}
        {player?.visible !== false && (
          <LiveGroup node={player} selected={selectedNodeId === "player"} onSelect={onSelectNode} register={register}>
            <Hero node={player} wire={wire} selected={selectedNodeId === "player"} moving={heroMoving} />
          </LiveGroup>
        )}

        {/* Collectible coins — real gameplay objective */}
        <Coins coins={coins || []} wire={wire} />

        {/* Weapon follows hero */}
        {weapon?.visible !== false && player && (
          <WeaponFollow player={player} weapon={weapon} wire={wire} selected={selectedNodeId === "weapon"} onSelect={onSelectNode} />
        )}

        {/* Camera helper */}
        {cameraNode?.visible !== false && (
          <LiveGroup node={cameraNode} selected={selectedNodeId === "camera"} onSelect={onSelectNode} register={register}>
            <mesh position={[0, 1.2, 0]} onClick={(e) => { e.stopPropagation(); onSelectNode("camera"); }}>
              <boxGeometry args={[0.5, 0.35, 0.7]} />
              <Std color="#3b82f6" wire={wire} emissive={selectedNodeId === "camera" ? "#6366f1" : undefined} />
            </mesh>
          </LiveGroup>
        )}

        {/* Spawned props */}
        {spawned.map(
          (n) =>
            n.visible !== false && (
              <LiveGroup key={n.id} node={n} selected={selectedNodeId === n.id} onSelect={onSelectNode} register={register}>
                <PropMesh node={n} wire={wire} selected={selectedNodeId === n.id} />
              </LiveGroup>
            )
        )}

        {/* Real gizmo on the selected actor */}
        {showTransform && (
          <TransformControls
            object={selectedObj}
            mode={gizmoMode}
            space={space === "Local" ? "local" : "world"}
            size={0.8}
            onMouseDown={() => {
              transforming = true;
            }}
            onMouseUp={(e) => {
              transforming = false;
              const o = e?.target?.object;
              if (o && onTransformNode) onTransformNode(o);
            }}
          />
        )}

        {showGrid && <Grid position={[0, 0.01, 0]} args={[120, 120]} cellColor="#94a3b8" sectionColor="#475569" fadeDistance={140} />}
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} minDistance={4} maxDistance={160} enabled={cameraMode !== "Game View"} />
        {/* Live axis orientation gizmo — tracks the real camera */}
        <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
          <GizmoViewport axisColors={["#ef4444", "#22c55e", "#2563eb"]} labelColor="white" />
        </GizmoHelper>
        <CameraRig mode={cameraMode || "Viewport"} isPlaying={isPlaying} keysPressed={keysPressed} followRef={{ current: registry.current.get("player") || null }} />
        <FpsMeter onFps={onFps} />
        <FovSync zoom={cameraZoom} />
        <CaptureApi />
      </Canvas>
    </div>
  );
}

function useStateSelected(selectedNodeId, registry, sceneGroups) {
  const [obj, setObj] = React.useState(null);
  useEffect(() => {
    const t = setTimeout(() => setObj(registry.current.get(selectedNodeId) || null), 0);
    return () => clearTimeout(t);
  }, [selectedNodeId, registry, sceneGroups]);
  return [obj, setObj];
}
