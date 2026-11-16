"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { LevelPreset } from "@/game/level";
import { useGameStore } from "@/game/game-store";
import GameHud from "./GameHud";
import { GameTicker } from "./GameTicker";
import { ProgressRecorder } from "./ProgressRecorder";
import { useLampHoverStore } from "./lamp-hover-store";

const CityScene = dynamic(() => import("./CityScene"), { ssr: false, loading: () => <div className="scene-loading">LOADING THE DISTRICT…</div> });

export default function GameScreen({ level }: { level: LevelPreset }) {
  const router = useRouter();
  const dragRef = useRef(false);
  const pointerStart = useRef<[number, number] | null>(null);
  const loadedLevelId = useGameStore((state) => state.level?.id);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    useLampHoverStore.getState().clearHoveredLamp();
    useGameStore.getState().loadLevel(level);
    return () => { useLampHoverStore.getState().clearHoveredLamp(); document.body.style.cursor = ""; useGameStore.getState().quit(); };
  }, [level]);

  const exitLevel = useCallback(() => {
    useGameStore.getState().quit();
    router.push("/levels");
  }, [router]);
  const startRenderedLevel = useCallback(() => {
    const store = useGameStore.getState();
    if (store.level?.id === level.id && store.session?.phase === "ready") store.start();
  }, [level.id]);

  if (loadedLevelId !== level.id) return <div className="load-state">LOADING THE DISTRICT…</div>;

  return <main className="game-shell">
    <div className="city-stage"
      onPointerDownCapture={(event) => { pointerStart.current = [event.clientX, event.clientY]; dragRef.current = false; }}
      onPointerMoveCapture={(event) => { if (pointerStart.current && Math.hypot(event.clientX - pointerStart.current[0], event.clientY - pointerStart.current[1]) > 6) dragRef.current = true; }}
      onPointerUpCapture={() => { pointerStart.current = null; }}
    ><CityScene level={level} dragRef={dragRef} onReady={startRenderedLevel} /></div>
    <div className="vignette" />
    <GameHud level={level} onExit={exitLevel} />
    <GameTicker />
    <ProgressRecorder levelId={level.id} />
  </main>;
}
