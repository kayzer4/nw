"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LevelPreset, LevelSummary } from "@/game/level";
import { loadProgress, saveProgress } from "@/game/progress";
import ComicIntro from "./ComicIntro";

const ScenePreloader = dynamic(() => import("./ScenePreloader"), { ssr: false });

export default function LevelIntroScreen({ level, levels }: { level: LevelPreset; levels: LevelSummary[] }) {
  const router = useRouter();
  const [assetsReady, setAssetsReady] = useState(false);
  const [sceneCodeReady, setSceneCodeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveProgress({ ...loadProgress(), lastLevelId: level.id });
    let cancelled = false;
    void import("./CityScene").then(() => {
      if (!cancelled) setSceneCodeReady(true);
    }).catch(() => {
      if (!cancelled) setError("Не удалось загрузить сцену. Вернись к районам и попробуй снова.");
    });
    return () => { cancelled = true; };
  }, [level.id]);

  const assetsLoaded = useCallback(() => setAssetsReady(true), []);
  const assetLoadFailed = useCallback(() => setError("Не удалось загрузить модели. Вернись к районам и попробуй снова."), []);

  return <>
    <ScenePreloader key={level.id} level={level} onReady={assetsLoaded} onError={assetLoadFailed} />
    <ComicIntro level={level} levels={levels} ready={assetsReady && sceneCodeReady} error={error}
      onStart={() => router.push(`/levels/${encodeURIComponent(level.id)}/play`)}
      onBack={() => router.push("/levels")} />
  </>;
}
