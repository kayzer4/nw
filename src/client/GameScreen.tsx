"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { LevelPreset, LevelSummary } from "@/game/level";
import { useGameStore } from "@/game/game-store";
import { loadProgress } from "@/game/progress";
import GameHud from "./GameHud";
import { GameTicker } from "./GameTicker";
import { ProgressRecorder } from "./ProgressRecorder";

const CityScene = dynamic(() => import("./CityScene"), { ssr: false, loading: () => <div className="scene-loading">BUILDING THE NIGHT DISTRICT…</div> });

export default function GameScreen() {
  const [level, setLevel] = useState<LevelPreset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const listResponse = await fetch("/api/levels");
        if (!listResponse.ok) throw new Error("Could not load level list.");
        const levels = await listResponse.json() as LevelSummary[];
        const chosen = levels[0];
        if (!chosen) throw new Error("No playable level is available.");
        const levelResponse = await fetch(`/api/levels/${chosen.id}`);
        if (!levelResponse.ok) throw new Error("Could not load the selected level.");
        const preset = await levelResponse.json() as LevelPreset;
        if (!cancelled) {
          useGameStore.getState().loadLevel(preset);
          setCompleted(loadProgress().completedLevelIds.includes(preset.id));
          setLevel(preset);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Something went wrong while loading the level.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <main className="load-state"><div className="eyebrow">NIGHTWATCHER / CONNECTION ERROR</div><h1>Couldn’t load the district.</h1><p>{error}</p><button onClick={() => window.location.reload()}>TRY AGAIN</button></main>;
  if (!level) return <main className="load-state"><div className="loader-orbit"><i /></div><div className="eyebrow">PREPARING YOUR SHIFT</div><h1>Waking the city…</h1><p>Loading the level preset and its models.</p></main>;

  return (
    <main className="game-shell">
      <div className="city-stage"><CityScene level={level} /></div>
      <div className="vignette" />
      <GameHud level={level} />
      <GameTicker />
      <ProgressRecorder levelId={level.id} />
      {completed && <div className="record-chip">PREVIOUS SHIFT COMPLETED</div>}
    </main>
  );
}
