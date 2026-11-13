"use client";

import { useEffect, useState } from "react";
import type { LevelSummary } from "@/game/level";
import { loadProgress } from "@/game/progress";
import LevelPicker from "./LevelPicker";

export default function LevelSelectionScreen({ levels }: { levels: LevelSummary[] }) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => setCompletedIds(loadProgress().completedLevelIds), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <LevelPicker levels={levels} completedIds={completedIds} />;
}
