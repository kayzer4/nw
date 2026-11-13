"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LevelPreset, LevelSummary } from "@/game/level";
import { useGameStore } from "@/game/game-store";
import { loadProgress, saveProgress } from "@/game/progress";
import GameHud from "./GameHud";
import LevelPicker from "./LevelPicker";
import { GameTicker } from "./GameTicker";
import { ProgressRecorder } from "./ProgressRecorder";

const CityScene = dynamic(() => import("./CityScene"), { ssr: false, loading: () => <div className="scene-loading">LOADING THE DISTRICT…</div> });

export default function GameScreen() {
  const dragRef = useRef(false);
  const pointerStart = useRef<[number, number] | null>(null);
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [level, setLevel] = useState<LevelPreset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const loadCatalog = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/levels", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the district list.");
      const catalog = await response.json() as LevelSummary[];
      if (!catalog.length) throw new Error("No playable districts are available.");
      setLevels(catalog);
      setCompletedIds(loadProgress().completedLevelIds);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load districts.");
    }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void loadCatalog(), 0); return () => window.clearTimeout(timer); }, [loadCatalog]);

  const selectLevel = useCallback(async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/levels/${encodeURIComponent(id)}`, { cache: "no-store" });
      const result = await response.json() as LevelPreset | { error?: string };
      if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not load this district.");
      const preset = result as LevelPreset;
      useGameStore.getState().loadLevel(preset);
      saveProgress({ ...loadProgress(), lastLevelId: id });
      setLevel(preset);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this district.");
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);

  const exitLevel = useCallback(() => {
    useGameStore.getState().quit();
    setCompletedIds(loadProgress().completedLevelIds);
    setLevel(null);
  }, []);

  if (!level) return <LevelPicker levels={levels} completedIds={completedIds} loadingId={loadingId} error={error} onSelect={(id) => void selectLevel(id)} onRetry={() => void loadCatalog()} />;

  return <main className="game-shell">
    <div className="city-stage"
      onPointerDownCapture={(event) => { pointerStart.current = [event.clientX, event.clientY]; dragRef.current = false; }}
      onPointerMoveCapture={(event) => { if (pointerStart.current && Math.hypot(event.clientX - pointerStart.current[0], event.clientY - pointerStart.current[1]) > 6) dragRef.current = true; }}
      onPointerUpCapture={() => { pointerStart.current = null; }}
    ><CityScene level={level} dragRef={dragRef} /></div>
    <div className="vignette" />
    <GameHud level={level} onExit={exitLevel} />
    <GameTicker />
    <ProgressRecorder levelId={level.id} />
  </main>;
}
