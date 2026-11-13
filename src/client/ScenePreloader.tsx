"use client";

import { useCallback, useEffect, useMemo, useRef, Suspense, Component, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import type { LevelPreset } from "@/game/level";

function LoadedAsset({ asset, onReady }: { asset: string; onReady: (asset: string) => void }) {
  useGLTF(asset);
  useEffect(() => onReady(asset), [asset, onReady]);
  return null;
}

class AssetErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function ScenePreloader({ level, onReady, onError }: {
  level: LevelPreset;
  onReady: () => void;
  onError: () => void;
}) {
  const assets = useMemo(() => [...new Set([
    ...level.roads.map((item) => item.asset),
    ...level.buildings.map((item) => item.asset),
    ...level.lamps.map((item) => item.asset),
    ...level.citizens.map((item) => item.asset),
  ])], [level]);
  const loaded = useRef(new Set<string>());
  const markLoaded = useCallback((asset: string) => {
    loaded.current.add(asset);
    if (loaded.current.size === assets.length) onReady();
  }, [assets.length, onReady]);
  return <AssetErrorBoundary key={level.id} onError={onError}>
    {assets.map((asset) => <Suspense key={asset} fallback={null}><LoadedAsset asset={asset} onReady={markLoaded} /></Suspense>)}
  </AssetErrorBoundary>;
}
