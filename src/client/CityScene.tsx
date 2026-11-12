"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { Group } from "three";
import type { CitizenRoute, LevelPreset, PlacedAsset, PlacedLamp } from "@/game/level";
import { useGameStore } from "@/game/game-store";

function Model({ asset, scale = 1 }: { asset: string; scale?: number }) {
  const { scene } = useGLTF(asset);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} scale={scale} />;
}

function StaticAsset({ item }: { item: PlacedAsset }) {
  return (
    <group position={[item.position[0], item.position[1], item.position[2]]} rotation={[0, item.rotationY, 0]}>
      <Model asset={item.asset} scale={item.scale} />
    </group>
  );
}

function Lamp({ lamp }: { lamp: PlacedLamp }) {
  const on = useGameStore((state) => state.lampStates[lamp.id] ?? lamp.initiallyOn);
  const toggle = useGameStore((state) => state.toggleLamp);
  return (
    <group
      position={[lamp.position[0], lamp.position[1], lamp.position[2]]}
      rotation={[0, lamp.rotationY, 0]}
      onClick={(event) => { event.stopPropagation(); toggle(lamp.id); }}
      onPointerOver={() => { document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = ""; }}
    >
      <Model asset={lamp.asset} scale={lamp.scale} />
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshBasicMaterial color={on ? "#ffe6a0" : "#59616a"} />
      </mesh>
      {on && <pointLight position={[0, 1.75, 0]} color="#ffd58c" intensity={2.2} distance={lamp.radius} decay={2} />}
    </group>
  );
}

function Citizen({ citizen }: { citizen: CitizenRoute }) {
  const group = useRef<Group>(null);
  const progress = useRef(0);
  const isPlaying = useGameStore((state) => state.session?.phase === "playing");
  const { scene } = useGLTF(citizen.asset);
  const clone = useMemo(() => scene.clone(true), [scene]);
  useEffect(() => { if (!isPlaying) progress.current = 0; }, [isPlaying]);
  useFrame((_, delta) => {
    if (!group.current || !isPlaying || citizen.route.length === 0) return;
    progress.current = (progress.current + delta / citizen.secondsPerPoint) % citizen.route.length;
    const segment = Math.floor(progress.current);
    const fraction = progress.current - segment;
    const from = citizen.route[segment];
    const to = citizen.route[(segment + 1) % citizen.route.length];
    group.current.position.set(from[0] + (to[0] - from[0]) * fraction, 0, from[1] + (to[1] - from[1]) * fraction);
    group.current.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]);
  });
  const initial = citizen.route[0] ?? [0, 0];
  return <group ref={group} position={[initial[0], 0, initial[1]]}><primitive object={clone} scale={citizen.scale} /></group>;
}

function District({ level }: { level: LevelPreset }) {
  return (
    <>
      <color attach="background" args={["#080d15"]} />
      <fog attach="fog" args={["#080d15", 18, 38]} />
      <ambientLight intensity={0.78} color="#9baec8" />
      <directionalLight position={[-5, 12, 6]} intensity={1.5} color="#a9c5f0" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#141c25" roughness={1} />
      </mesh>
      <gridHelper args={[18, 36, "#34404b", "#202a34"]} position={[0, -0.06, 0]} />
      {level.roads.map((road) => <StaticAsset key={road.id} item={road} />)}
      {level.buildings.map((building) => <StaticAsset key={building.id} item={building} />)}
      {level.lamps.map((lamp) => <Lamp key={lamp.id} lamp={lamp} />)}
      {level.citizens.map((citizen) => <Citizen key={citizen.id} citizen={citizen} />)}
      <OrbitControls target={[0, 0, 0]} minDistance={9} maxDistance={26} maxPolarAngle={1.35} enableDamping dampingFactor={0.08} />
    </>
  );
}

export default function CityScene({ level }: { level: LevelPreset }) {
  return (
    <Canvas camera={{ position: [12, 13, 14], fov: 42 }} dpr={[1, 1.35]} gl={{ antialias: false, powerPreference: "low-power" }}>
      <District level={level} />
    </Canvas>
  );
}
