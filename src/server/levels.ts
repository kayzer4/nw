import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { LevelPreset, LevelSummary } from "@/game/level";
import { buildLevel } from "@/server/level-builder";

const levelDir = path.join(process.cwd(), "data/levels");

export async function getLevelIndex(): Promise<LevelSummary[]> {
  const data = await fs.readFile(path.join(levelDir, "index.json"), "utf8");
  return JSON.parse(data) as LevelSummary[];
}

export async function getLevel(id: string): Promise<LevelPreset | null> {
  const summary = (await getLevelIndex()).find((level) => level.id === id);
  if (!summary) return null;
  const generated = buildLevel(summary.seed);
  return { ...generated, id: summary.id, title: summary.title, subtitle: summary.subtitle };
}
