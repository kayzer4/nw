import fs from "node:fs";
import path from "node:path";
import { buildLevel } from "../src/server/level-builder";

const root = process.cwd();
const seed = process.argv[2] ?? "night-01";
const level = buildLevel(seed);
const levelsDir = path.join(root, "data/levels");
fs.mkdirSync(levelsDir, { recursive: true });
fs.writeFileSync(path.join(levelsDir, `${level.id}.json`), `${JSON.stringify(level, null, 2)}\n`);
fs.writeFileSync(path.join(levelsDir, "index.json"), `${JSON.stringify([{ id: level.id, seed: level.seed, title: level.title, subtitle: level.subtitle }], null, 2)}\n`);
console.log(`Built ${level.id} (seed ${level.seed}): ${level.roads.length} roads, ${level.buildings.length} buildings, ${level.lamps.length} lamps, ${level.citizens.length} citizens`);
