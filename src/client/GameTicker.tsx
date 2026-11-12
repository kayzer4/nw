"use client";

import { useEffect } from "react";
import { useGameStore } from "@/game/game-store";

export function GameTicker() {
  const phase = useGameStore((state) => state.session?.phase);
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = window.setInterval(() => useGameStore.getState().tick(), 1000);
    return () => window.clearInterval(interval);
  }, [phase]);
  return null;
}
