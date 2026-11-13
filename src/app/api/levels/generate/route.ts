import { buildLevel } from "@/server/level-builder";

export async function GET(request: Request) {
  const seed = new URL(request.url).searchParams.get("seed")?.trim();
  if (!seed || !/^\d{1,10}$/.test(seed) || Number(seed) > 4_294_967_295) {
    return Response.json({ error: "Provide a seed number between 0 and 4294967295." }, { status: 400 });
  }
  try {
    const preset = buildLevel(seed);
    return Response.json({ ...preset, id: "custom", title: "Custom District", subtitle: `Generated from seed ${seed}.` });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not build level." }, { status: 500 });
  }
}
