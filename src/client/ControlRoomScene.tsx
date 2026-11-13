"use client";

import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { Mesh, type MeshStandardMaterial } from "three";
import LevelMonitor from "./LevelMonitor";

function Box({ position, size, color, emissive, emissiveIntensity = 0 }: { position: [number, number, number]; size: [number, number, number]; color: string; emissive?: string; emissiveIntensity?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.72} /></mesh>;
}

function MonitorFrame({ position, size, children, main = false }: { position: [number, number, number]; size: [number, number, number]; children?: React.ReactNode; main?: boolean }) {
  const screen = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!screen.current) return;
    const material = screen.current.material as MeshStandardMaterial;
    material.emissiveIntensity = (main ? 0.34 : 0.24) + Math.sin(clock.elapsedTime * 2.1) * 0.025;
  });
  const [width, height] = size;
  return <group position={position}>
    <Box position={[0, 0, 0]} size={size} color="#141b20" />
    <mesh ref={screen} position={[0, 0, size[2] / 2 + 0.012]}><planeGeometry args={[width * 0.88, height * 0.78]} /><meshStandardMaterial color="#10241f" emissive="#2f8c6c" emissiveIntensity={0.3} roughness={0.38} /></mesh>
    <mesh position={[0, -height / 2 - 0.18, 0]}><boxGeometry args={[0.12, 0.34, 0.22]} /><meshStandardMaterial color="#1a2226" /></mesh>
    {children}
  </group>;
}

function MonitorDetails({ variant }: { variant: "city" | "grid" }) {
  return <group position={[0, 0, 0.08]}>
    {variant === "city" ? <>
      <mesh position={[0, 0.06, 0.01]}><planeGeometry args={[1.62, 0.9]} /><meshBasicMaterial color="#17382e" /></mesh>
      <mesh position={[-0.2, -0.02, 0.02]}><boxGeometry args={[0.42, 0.42, 0.02]} /><meshBasicMaterial color="#6caa84" /></mesh>
      <mesh position={[0.32, 0.1, 0.02]}><boxGeometry args={[0.25, 0.65, 0.02]} /><meshBasicMaterial color="#5b9678" /></mesh>
      <mesh position={[0.55, -0.18, 0.02]}><boxGeometry args={[0.3, 0.22, 0.02]} /><meshBasicMaterial color="#89c48f" /></mesh>
    </> : <>
      {[0, 1, 2, 3, 4].map((index) => <mesh key={index} position={[-0.55 + index * 0.27, -0.02, 0.02]}><boxGeometry args={[0.12, 0.25 + (index % 3) * 0.2, 0.02]} /><meshBasicMaterial color="#d0a65f" /></mesh>)}
      <mesh position={[0.2, 0.2, 0.02]} rotation={[0, 0, Math.PI / 4]}><ringGeometry args={[0.17, 0.19, 32]} /><meshBasicMaterial color="#d0a65f" /></mesh>
    </>}
  </group>;
}

function Watcher() {
  const { scene } = useGLTF("/models/characters/cube_guy.glb");
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => { if (object instanceof Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    return copy;
  }, [scene]);
  return <group position={[-2.15, 0.85, 1.2]} rotation={[0, -0.25, 0]}><primitive object={clone} scale={1.55} /></group>;
}

function CityWindow() {
  return <group position={[0, 3.9, -1.5]}>
    <mesh><planeGeometry args={[13, 4.8]} /><meshBasicMaterial color="#172b41" /></mesh>
    <mesh position={[2.6, 0.1, 0.04]}><circleGeometry args={[0.55, 32]} /><meshBasicMaterial color="#e1c481" /></mesh>
    {Array.from({ length: 12 }).map((_, index) => <mesh key={index} position={[-5.6 + index * 1.02, -1.3 + (index % 3) * 0.25, 0.08]}><boxGeometry args={[0.72, 1.6 + (index % 4) * 0.5, 0.25]} /><meshStandardMaterial color="#0b141b" emissive="#d29e50" emissiveIntensity={0.08} /></mesh>)}
  </group>;
}

function ControlRoom({ levels, completedIds, loadingId, error, onSelect, onRetry }: Parameters<typeof LevelMonitor>[0]) {
  return <>
    <color attach="background" args={["#080c11"]} />
    <fog attach="fog" args={["#080c11", 11, 24]} />
    <ambientLight intensity={0.25} color="#8296a8" />
    <pointLight position={[-3, 4, 2]} intensity={4} distance={8} color="#d6b16e" />
    <pointLight position={[0, 3, 0]} intensity={2.5} distance={8} color="#5cc395" />
    <directionalLight position={[-4, 7, 5]} intensity={0.7} color="#bdcce0" castShadow />
    <CityWindow />
    <Box position={[0, -0.3, 0]} size={[14, 0.35, 6]} color="#251d19" />
    <Box position={[0, 0, -2.2]} size={[14, 5, 0.3]} color="#10171c" />
    <Box position={[-5.6, 2.1, -0.3]} size={[0.2, 4.2, 5.4]} color="#1b2226" />
    <Box position={[5.6, 2.1, -0.3]} size={[0.2, 4.2, 5.4]} color="#1b2226" />
    <Box position={[0, 0.9, 1.45]} size={[7.8, 0.28, 2.2]} color="#171b1d" />
    <Box position={[0, 0.52, 2.15]} size={[7.8, 0.5, 0.2]} color="#0d1215" />
    <MonitorFrame position={[0, 3.05, -0.4]} size={[6.2, 3.7, 0.38]} main><Html transform position={[0, 0, 0.22]} distanceFactor={5.5} center><LevelMonitor levels={levels} completedIds={completedIds} loadingId={loadingId} error={error} onSelect={onSelect} onRetry={onRetry} /></Html></MonitorFrame>
    <MonitorFrame position={[-4.2, 2.55, 0.2]} size={[2.35, 1.9, 0.28]}><MonitorDetails variant="city" /></MonitorFrame>
    <MonitorFrame position={[4.25, 2.65, 0.1]} size={[2.3, 1.85, 0.28]}><MonitorDetails variant="grid" /></MonitorFrame>
    <Watcher />
    <mesh position={[2.6, 1.35, 1.9]} rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.27, 0.2, 0.35, 16]} /><meshStandardMaterial color="#b18b5b" roughness={0.7} /></mesh>
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.35} maxPolarAngle={1.6} target={[0, 2.05, 0]} />
  </>;
}

export default function ControlRoomScene(props: Parameters<typeof LevelMonitor>[0]) {
  return <Canvas shadows camera={{ position: [0, 3.7, 10], fov: 42 }} dpr={[1, 1.4]} gl={{ antialias: true, powerPreference: "low-power" }}>
    <Suspense fallback={null}><ControlRoom {...props} /></Suspense>
  </Canvas>;
}
