"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls, useGLTF } from "@react-three/drei";
import { AdditiveBlending, AnimationMixer, Box3, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, LoopRepeat, Mesh, Object3D, type Group } from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { CitizenRoute, LevelPreset, PlacedAsset, PlacedLamp } from "@/game/level";
import { useGameStore } from "@/game/game-store";
import { gameClock } from "@/game/clock";
import { LAMP_HEAD, LAMP_HEAD_HEIGHT, lampCone } from "@/game/light";
import { routePosition } from "@/game/simulation";
import { useLampHoverStore } from "./lamp-hover-store";
import { hoverRingState, infiniteGridOptions } from "./scene-effects";

const glowVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const glowFragmentShader = `
uniform vec3 glowColor;
varying vec2 vUv;
void main() {
  float radius = length(vUv - vec2(0.5)) * 2.0;
  float edge = 1.0 - smoothstep(0.94, 1.0, radius);
  float strength = (0.12 + 0.14 * (1.0 - radius)) * edge;
  gl_FragColor = vec4(glowColor, strength);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function Model({ asset, scale = 1, castShadow = true }: { asset: string; scale?: number; castShadow?: boolean }) {
  const { scene } = useGLTF(asset);
  const clone = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = castShadow;
        object.receiveShadow = true;
      }
    });
    return model;
  }, [scene, castShadow]);
  return <primitive object={clone} scale={scale} />;
}

function StaticAsset({ item, castShadow = true }: { item: PlacedAsset; castShadow?: boolean }) {
  return (
    <group position={[item.position[0], item.position[1], item.position[2]]} rotation={[0, item.rotationY, 0]}>
      <Model asset={item.asset} scale={item.scale} castShadow={castShadow} />
    </group>
  );
}

function SidewalkGround({ buildings, cellSize }: { buildings: readonly PlacedAsset[]; cellSize: number }) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const indices: number[] = [];
    const half = cellSize / 2;
    for (const building of buildings) {
      const [x, , z] = building.position;
      const start = vertices.length / 3;
      vertices.push(x - half, 0, z - half, x - half, 0, z + half, x + half, 0, z + half, x + half, 0, z - half);
      indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    result.setIndex(indices);
    result.computeVertexNormals();
    return result;
  }, [buildings, cellSize]);
  return <mesh geometry={geometry} receiveShadow>
    <meshStandardMaterial color="#87929b" roughness={1} />
  </mesh>;
}

function InfiniteGrid() {
  const { size, fadeDistance, fadeStrength } = infiniteGridOptions();
  return <Grid
    args={[size, size]}
    position={[0, 0.015, 0]}
    renderOrder={1}
    infiniteGrid
    followCamera
    fadeDistance={fadeDistance}
    fadeStrength={fadeStrength}
    cellSize={1.5}
    sectionSize={6}
    cellThickness={0.85}
    sectionThickness={1.15}
    cellColor="#657277"
    sectionColor="#748085"
    onUpdate={(grid) => {
      const material = grid.material as { depthTest: boolean; depthWrite: boolean };
      material.depthTest = true;
      material.depthWrite = false;
    }}
  />;
}

function Lamp({ lamp, dragRef }: { lamp: PlacedLamp; dragRef: RefObject<boolean> }) {
  const on = useGameStore((state) => state.lampStates[lamp.id] ?? lamp.initiallyOn);
  const toggle = useGameStore((state) => state.toggleLamp);
  const hovered = useLampHoverStore((state) => state.hoveredLampId === lamp.id);
  const setHoveredLamp = useLampHoverStore((state) => state.setHoveredLamp);
  const clearHoveredLamp = useLampHoverStore((state) => state.clearHoveredLamp);
  const spotlightOriginHeight = LAMP_HEAD_HEIGHT * lamp.scale;
  const cone = lampCone(lamp);
  const glowUniforms = useMemo(() => ({ glowColor: { value: new Color(lamp.color) } }), [lamp.color]);
  const spotlightTarget = useMemo(() => {
    const target = new Object3D();
    target.position.set(0, 0, LAMP_HEAD[1] * lamp.scale);
    return target;
  }, [lamp.scale]);
  const hoverRing = useRef<Group>(null);
  const hoverMaterial = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const state = hoverRingState(hovered, clock.elapsedTime);
    if (hoverRing.current) hoverRing.current.scale.setScalar(state.scale);
    if (hoverMaterial.current) (hoverMaterial.current.material as { opacity: number }).opacity = state.opacity;
  });
  return (
    <group position={[lamp.position[0], lamp.position[1], lamp.position[2]]} rotation={[0, lamp.rotationY, 0]}>
      <group
        onClick={(event) => { event.stopPropagation(); if (!dragRef.current) toggle(lamp.id); }}
        onPointerOver={(event) => { event.stopPropagation(); setHoveredLamp(lamp.id); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { clearHoveredLamp(lamp.id); document.body.style.cursor = ""; }}
      >
        <Model asset={lamp.asset} scale={lamp.scale} />
        <mesh position={[0, spotlightOriginHeight / 2, LAMP_HEAD[1] * lamp.scale / 2]}>
          <boxGeometry args={[0.85 * lamp.scale, spotlightOriginHeight + 0.35 * lamp.scale, 0.9 * lamp.scale]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {hovered && <group ref={hoverRing} position={[0, 0.028, 0]} raycast={() => null}>
        <mesh ref={hoverMaterial as RefObject<Mesh>} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.42, 48]} />
          <meshBasicMaterial color="#f6d67a" transparent opacity={0.82} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.56, 0.575, 48]} />
          <meshBasicMaterial color="#f0c876" transparent opacity={0.34} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>}
      <primitive object={spotlightTarget} />
      <spotLight position={[0, spotlightOriginHeight, LAMP_HEAD[1] * lamp.scale]} target={spotlightTarget} color={lamp.color} intensity={on ? lamp.intensity : 0} distance={0} angle={cone.angle} penumbra={0.02} decay={0} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-bias={-0.00015} shadow-normalBias={0.015} />
      {on && <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, LAMP_HEAD[1] * lamp.scale]}>
          <circleGeometry args={[lamp.radius, 64]} />
          <shaderMaterial vertexShader={glowVertexShader} fragmentShader={glowFragmentShader} uniforms={glowUniforms} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </>}
    </group>
  );
}

const statusTextures: Partial<Record<"lit" | "dark", CanvasTexture>> = {};
function statusTexture(lit: boolean) {
  const key = lit ? "lit" : "dark";
  if (statusTextures[key]) return statusTextures[key];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  context.fillStyle = lit ? "#559d70" : "#c55755";
  context.beginPath(); context.arc(32, 32, 28, 0, Math.PI * 2); context.fill();
  context.fillStyle = "white"; context.textAlign = "center"; context.textBaseline = "middle";
  context.font = "bold 37px Arial"; context.fillText(lit ? "✓" : "!", 32, 33);
  const texture = new CanvasTexture(canvas);
  statusTextures[key] = texture;
  return texture;
}

function Citizen({ citizen }: { citizen: CitizenRoute }) {
  const group = useRef<Group>(null);
  const isPlaying = useGameStore((state) => state.session?.phase === "playing");
  const lit = useGameStore((state) => state.session?.citizenLit[citizen.id] ?? false);
  const { scene, animations } = useGLTF(citizen.asset);
  const clone = useMemo(() => {
    scene.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(scene);
    const sourceHeight = bounds.max.y - bounds.min.y;
    const targetHeight = 1.75 * citizen.scale;
    const scale = sourceHeight > 1e-5 ? targetHeight / sourceHeight : 1;
    const character = skeletonClone(scene);
    character.scale.setScalar(scale);
    character.position.y = -bounds.min.y * scale;
    character.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return character;
  }, [scene, citizen.scale]);
  const walkClip = useMemo(() => animations.find((clip) => /walk/i.test(clip.name)), [animations]);
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  useEffect(() => {
    if (!isPlaying || !walkClip) {
      mixer.stopAllAction();
      return;
    }
    const action = mixer.clipAction(walkClip);
    action.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.15).play();
    return () => {
      action.fadeOut(0.15);
      mixer.stopAllAction();
    };
  }, [isPlaying, mixer, walkClip]);
  useFrame((_, delta) => {
    if (isPlaying) mixer.update(delta);
    if (!group.current || citizen.route.length === 0) return;
    const time = isPlaying ? gameClock.elapsed() : useGameStore.getState().session?.elapsedSeconds ?? 0;
    const point = routePosition(citizen, time);
    const next = routePosition(citizen, time + 0.04);
    group.current.position.set(point[0], 0, point[1]);
    group.current.rotation.y = Math.atan2(next[0] - point[0], next[1] - point[1]);
  });
  const initial = citizen.route[0] ?? [0, 0];
  return <group ref={group} position={[initial[0], 0, initial[1]]}><primitive object={clone} /><sprite position={[0, citizen.scale * 1.75 + 0.22, 0]} scale={[0.34, 0.34, 1]}><spriteMaterial map={statusTexture(lit)} transparent depthTest={false} toneMapped={false} /></sprite></group>;
}

function StartWhenRendered({ onReady }: { onReady: () => void }) {
  const started = useRef(false);
  useFrame(() => {
    if (started.current) return;
    started.current = true;
    onReady();
  });
  return null;
}

function District({ level, dragRef, onReady }: { level: LevelPreset; dragRef: RefObject<boolean>; onReady: () => void }) {
  return (
    <>
      <color attach="background" args={["#080d15"]} />
      <fog attach="fog" args={["#080d15", 18, 38]} />
      <ambientLight intensity={0.22} color="#9baec8" />
      <directionalLight position={[-5, 12, 6]} intensity={0.3} color="#a9c5f0" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={0.02} />
      <InfiniteGrid />
      {level.roads.map((road) => <StaticAsset key={road.id} item={road} castShadow={false} />)}
      <SidewalkGround buildings={level.buildings} cellSize={level.grid.cellSize} />
      {level.buildings.map((building) => <StaticAsset key={building.id} item={building} />)}
      {level.lamps.map((lamp) => <Lamp key={lamp.id} lamp={lamp} dragRef={dragRef} />)}
      {level.citizens.map((citizen) => <Citizen key={citizen.id} citizen={citizen} />)}
      <StartWhenRendered onReady={onReady} />
      <OrbitControls target={[0, 0, 0]} minDistance={9} maxDistance={26} maxPolarAngle={1.35} enableDamping dampingFactor={0.08} />
    </>
  );
}

// Keep motion at display refresh rate while expensive shadow maps update at
// 20 Hz. Stable DPR is important here because the grid shader relies on
// screen-space derivatives (fwidth); changing it causes line shimmer.
/* eslint-disable react-hooks/immutability -- Three.js renderer is an imperative external object. */
function RenderBudget() {
  const { gl } = useThree();
  const budget = useRef({ shadowTime: 0 });
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);
  useFrame((_, delta) => {
    const state = budget.current;
    state.shadowTime += delta;
    if (state.shadowTime >= 1 / 20) {
      gl.shadowMap.needsUpdate = true;
      state.shadowTime %= 1 / 20;
    }
  });
  return null;
}
/* eslint-enable react-hooks/immutability */

export default function CityScene({ level, dragRef, onReady }: { level: LevelPreset; dragRef: RefObject<boolean>; onReady: () => void }) {
  return (
    <Canvas shadows camera={{ position: [12, 13, 14], fov: 42 }} dpr={1} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <RenderBudget />
      <District level={level} dragRef={dragRef} onReady={onReady} />
    </Canvas>
  );
}
