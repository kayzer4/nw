import fs from "node:fs";
import path from "node:path";

type Accessor = { min?: number[]; max?: number[] };
type Primitive = { attributes: { POSITION: number } };
type Gltf = { accessors: Accessor[]; meshes: { primitives: Primitive[] }[] };
const cache = new Map<string, number>();

/** Furthest horizontal vertex from the model origin, before placement scale. */
export function modelFootprintRadius(asset: string): number {
  const cached = cache.get(asset);
  if (cached !== undefined) return cached;
  const file = fs.readFileSync(path.join(process.cwd(), "public", asset.replace(/^\//, "")));
  if (file.toString("utf8", 0, 4) !== "glTF") throw new Error(`Invalid GLB: ${asset}`);
  const jsonLength = file.readUInt32LE(12);
  const gltf = JSON.parse(file.toString("utf8", 20, 20 + jsonLength)) as Gltf;
  let radius = 0;
  for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
    const accessor = gltf.accessors[primitive.attributes.POSITION];
    if (!accessor.min || !accessor.max) throw new Error(`Missing GLB bounds: ${asset}`);
    radius = Math.max(radius, Math.abs(accessor.min[0]), Math.abs(accessor.max[0]), Math.abs(accessor.min[2]), Math.abs(accessor.max[2]));
  }
  if (!radius) throw new Error(`Empty GLB footprint: ${asset}`);
  cache.set(asset, radius);
  return radius;
}
