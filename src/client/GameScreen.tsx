"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { LevelPreset } from "@/game/level";
import { useGameStore } from "@/game/game-store";
import { loadProgress, saveProgress } from "@/game/progress";
import GameHud from "./GameHud";
import { GameTicker } from "./GameTicker";
import { ProgressRecorder } from "./ProgressRecorder";

const DEFAULT_SEED = "night-01";
const CityScene = dynamic(() => import("./CityScene"), { ssr: false, loading: () => <div className="scene-loading">BUILDING THE NIGHT DISTRICT…</div> });

export default function GameScreen() {
  const [level, setLevel] = useState<LevelPreset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [completed, setCompleted] = useState(false);

  const loadSeed = useCallback(async (seed: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/levels/generate?seed=${encodeURIComponent(seed)}`, { cache: "no-store" });
      const result = await response.json() as LevelPreset | { error?: string };
      if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "Could not generate this district.");
      const preset = result as LevelPreset;
      useGameStore.getState().loadLevel(preset);
      const progress = loadProgress();
      saveProgress({ ...progress, lastSeed: preset.seed });
      setCompleted(progress.completedLevelIds.includes(preset.id));
      setLevel(preset);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not generate this district.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSeed(loadProgress().lastSeed ?? DEFAULT_SEED); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSeed]);

  if (error && !level) return <main className="load-state"><div className="eyebrow">NIGHTWATCHER / CONNECTION ERROR</div><h1>Couldn’t load the district.</h1><p>{error}</p><button onClick={() => void loadSeed(DEFAULT_SEED)}>TRY AGAIN</button></main>;
  if (!level) return <main className="load-state"><div className="loader-orbit"><i /></div><div className="eyebrow">PREPARING YOUR SHIFT</div><h1>Generating the city…</h1><p>The server is building a district from its seed.</p></main>;

  return (
    <main className="game-shell">
      <div className="city-stage"><CityScene level={level} /></div>
      <div className="vignette" />
      <GameHud level={level} isGenerating={isGenerating} generationError={error} onGenerateSeed={(seed) => void loadSeed(seed)} />
      <GameTicker />
      <ProgressRecorder levelId={level.id} />
      {completed && <div className="record-chip">PREVIOUS SHIFT COMPLETED</div>}
    </main>
  );
}
