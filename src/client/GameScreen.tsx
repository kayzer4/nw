"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { LevelPreset, LevelSummary } from "@/game/level";
import { useGameStore } from "@/game/game-store";
import { loadProgress, saveProgress } from "@/game/progress";
import GameHud from "./GameHud";
import { GameTicker } from "./GameTicker";
import { ProgressRecorder } from "./ProgressRecorder";

const DEFAULT_LEVEL = "first-shift";
const CityScene = dynamic(() => import("./CityScene"), { ssr: false, loading: () => <div className="scene-loading">BUILDING THE NIGHT DISTRICT…</div> });

export default function GameScreen() {
  const [level, setLevel] = useState<LevelPreset | null>(null);
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  const loadPreset = useCallback(async (levelId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/levels/${encodeURIComponent(levelId)}`, { cache: "no-store" });
      const result = await response.json() as LevelPreset | { error?: string };
      if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not load this district.");
      const preset = result as LevelPreset;
      useGameStore.getState().loadLevel(preset);
      const progress = loadProgress();
      saveProgress({ ...progress, lastLevelId: preset.id });
      setCompleted(progress.completedLevelIds.includes(preset.id));
      setLevel(preset);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this district.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectLevel = useCallback((levelId: string) => {
    void loadPreset(levelId);
  }, [loadPreset]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/levels", { cache: "no-store" });
          if (!response.ok) throw new Error("Could not load the district list.");
          const catalog = await response.json() as LevelSummary[];
          if (catalog.length === 0) throw new Error("No playable districts are available.");
          setLevels(catalog);
          const savedId = loadProgress().lastLevelId ?? DEFAULT_LEVEL;
          await loadPreset(catalog.some((entry) => entry.id === savedId) ? savedId : catalog[0].id);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not load the district list.");
          setIsLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPreset]);

  if (error && !level) return <main className="load-state"><div className="eyebrow">NIGHTWATCHER / CONNECTION ERROR</div><h1>Couldn’t load the district.</h1><p>{error}</p><button onClick={() => void loadPreset(DEFAULT_LEVEL)}>TRY AGAIN</button></main>;
  if (!level) return <main className="load-state"><div className="loader-orbit"><i /></div><div className="eyebrow">PREPARING YOUR SHIFT</div><h1>Loading the city…</h1><p>Reading a ready district.</p></main>;

  return (
    <main className="game-shell">
      <div className="city-stage"><CityScene level={level} /></div>
      <div className="vignette" />
      <GameHud level={level} levels={levels} isLoading={isLoading} loadError={error} onSelectLevel={selectLevel} />
      <GameTicker />
      <ProgressRecorder levelId={level.id} />
      {completed && <div className="record-chip">PREVIOUS SHIFT COMPLETED</div>}
    </main>
  );
}
