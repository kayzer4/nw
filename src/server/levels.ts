import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { LevelPreset, LevelSummary } from "@/game/level";

const levelDir = path.join(process.cwd(), "data/levels");

export async function getLevelIndex(): Promise<LevelSummary[]> {
  const data = await fs.readFile(path.join(levelDir, "index.json"), "utf8");
  return JSON.parse(data) as LevelSummary[];
}

export async function getLevel(id: string): Promise<LevelPreset | null> {
  const summary = (await getLevelIndex()).find((level) => level.id === id);
  if (!summary) return null;
  const data = await fs.readFile(path.join(levelDir, `${summary.id}.json`), "utf8");
  return JSON.parse(data) as LevelPreset;
}
