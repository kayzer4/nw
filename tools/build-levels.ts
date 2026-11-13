import fs from "node:fs";
import path from "node:path";
import { buildLevel } from "../src/server/level-builder";
import type { LevelSummary } from "../src/game/level";

const directory = path.join(process.cwd(), "data/levels");
const catalog = JSON.parse(fs.readFileSync(path.join(directory, "index.json"), "utf8")) as LevelSummary[];
const args = process.argv.slice(2);
const idIndex = args.indexOf("--id");
const seedIndex = args.indexOf("--seed");
if (args.some((arg) => !["--all", "--id", "--seed", args[idIndex + 1], args[seedIndex + 1]].includes(arg)) || (idIndex >= 0 && !args[idIndex + 1]) || (seedIndex >= 0 && !args[seedIndex + 1]) || (seedIndex >= 0 && idIndex < 0)) {
  throw new Error("Usage: bun run build:levels [--all | --id <catalog-id> [--seed <number>]]");
}
const selected = idIndex >= 0 ? catalog.filter((entry) => entry.id === args[idIndex + 1]) : catalog;
if (!selected.length) throw new Error(`Unknown catalog id: ${args[idIndex + 1]}`);
if (seedIndex >= 0) selected[0].seed = args[seedIndex + 1];

for (const summary of selected) {
  const level = { ...buildLevel(summary.seed, catalog.findIndex((entry) => entry.id === summary.id)), ...summary };
  fs.writeFileSync(path.join(directory, `${summary.id}.json`), `${JSON.stringify(level, null, 2)}\n`);
  console.log(`${summary.id}: ${level.roads.length} roads, ${level.lamps.length} lamps, ${level.citizens.length} residents`);
}
if (seedIndex >= 0) fs.writeFileSync(path.join(directory, "index.json"), `${JSON.stringify(catalog, null, 2)}\n`);
