import fs from "node:fs";
import path from "node:path";
import { buildLevel } from "../src/server/level-builder";

const root = process.cwd();
const level = { ...buildLevel("1001"), id: "first-shift", title: "First Shift", subtitle: "Keep the district lit until sunrise." };
const levelsDir = path.join(root, "data/levels");
fs.mkdirSync(levelsDir, { recursive: true });
fs.writeFileSync(path.join(levelsDir, "first-shift.json"), `${JSON.stringify(level, null, 2)}\n`);
console.log(`Built example ${level.id} (seed ${level.seed}): ${level.roads.length} roads, ${level.buildings.length} buildings, ${level.lamps.length} lamps, ${level.citizens.length} citizens`);
