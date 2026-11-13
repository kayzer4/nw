"use client";

import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { Mesh, type Group } from "three";
import LevelMonitor from "./LevelMonitor";

function ReadyRoom() {
  const { scene } = useGLTF("/models/control-room/control-room.glb");
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    return copy;
  }, [scene]);
  return <primitive object={clone} />;
}

function Watcher() {
  const { scene } = useGLTF("/models/characters/cube_guy.glb");
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    return copy;
  }, [scene]);
  return <group position={[-1.3, 0.55, 0.9]} rotation={[0, -0.18, 0]}><primitive object={clone} scale={1.15} /></group>;
}

function Telephone() {
  return <group position={[-1.1, 1.22, 0.25]} rotation={[0, -0.12, 0]}>
    <mesh><boxGeometry args={[0.62, 0.12, 0.42]} /><meshStandardMaterial color="#704937" roughness={0.9} /></mesh>
    <mesh position={[0, 0.16, 0]} rotation={[0, 0, 0.08]}><boxGeometry args={[0.7, 0.12, 0.14]} /><meshStandardMaterial color="#8b5b43" roughness={0.9} /></mesh>
    <mesh position={[0, 0.24, 0]}><sphereGeometry args={[0.07, 12, 8]} /><meshStandardMaterial color="#d6b16e" emissive="#d6b16e" emissiveIntensity={0.35} /></mesh>
  </group>;
}

function DeskFan() {
  const blades = useRef<Group>(null);
  useFrame((_, delta) => { if (blades.current) blades.current.rotation.z += delta * 3; });
  return <group position={[1.25, 1.2, 0.22]} rotation={[0, 0.2, 0]}>
    <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.24, 0.3, 0.08, 20]} /><meshStandardMaterial color="#5a6263" metalness={0.5} /></mesh>
    <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.05, 0.05, 0.55, 12]} /><meshStandardMaterial color="#5a6263" metalness={0.5} /></mesh>
    <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.43, 0.04, 12, 32]} /><meshStandardMaterial color="#8b9693" metalness={0.5} /></mesh>
    <group ref={blades} position={[0, 0.2, 0.03]}>
      {[0, 1, 2].map((index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 1.5]}><boxGeometry args={[0.1, 0.36, 0.03]} /><meshStandardMaterial color="#a6b3a7" transparent opacity={0.75} /></mesh>)}
      <mesh><sphereGeometry args={[0.07, 12, 8]} /><meshStandardMaterial color="#d6b16e" /></mesh>
    </group>
  </group>;
}

function ControlRoom({ levels, completedIds, loadingId, error, onSelect, onRetry }: Parameters<typeof LevelMonitor>[0]) {
  return <>
    <color attach="background" args={["#101820"]} />
    <ambientLight intensity={0.65} color="#b9c5bd" />
    <directionalLight position={[-4, 7, 6]} intensity={1.4} color="#f3dfb0" castShadow />
    <pointLight position={[0, 2.6, -1.4]} intensity={2.2} distance={7} color="#79d6aa" />
    <pointLight position={[-1.4, 2.2, 1]} intensity={3.5} distance={6} color="#e5bd77" />
    <ReadyRoom />
    <Watcher />
    <Telephone />
    <DeskFan />
    <group position={[0, 1.995, -1.49]}>
      <Html transform center distanceFactor={4.3} wrapperClass="level-monitor-html">
        <div className="level-monitor-scale"><LevelMonitor levels={levels} completedIds={completedIds} loadingId={loadingId} error={error} onSelect={onSelect} onRetry={onRetry} /></div>
      </Html>
    </group>
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.35} maxPolarAngle={1.58} target={[0, 1.7, -0.35]} />
  </>;
}

export default function ControlRoomScene(props: Parameters<typeof LevelMonitor>[0]) {
  return <Canvas shadows camera={{ position: [0, 2.45, 7.7], fov: 42 }} dpr={[1, 1.4]} gl={{ antialias: true, powerPreference: "low-power" }}>
    <Suspense fallback={null}><ControlRoom {...props} /></Suspense>
  </Canvas>;
}
