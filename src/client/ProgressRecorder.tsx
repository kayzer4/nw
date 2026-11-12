"use client";

import { useEffect } from "react";
import { completeLevel, loadProgress, saveProgress } from "@/game/progress";
import { useGameStore } from "@/game/game-store";

export function ProgressRecorder({ levelId }: { levelId: string }) {
  const phase = useGameStore((state) => state.session?.phase);
  useEffect(() => {
    if (phase === "won") saveProgress(completeLevel(loadProgress(), levelId));
  }, [levelId, phase]);
  return null;
}
