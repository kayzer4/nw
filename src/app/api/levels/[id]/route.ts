import { getLevel } from "@/server/levels";

export async function GET(_request: Request, { params }: RouteContext<"/api/levels/[id]">) {
  const { id } = await params;
  const level = await getLevel(id);
  if (!level) return Response.json({ error: "Level not found" }, { status: 404 });
  return Response.json(level);
}
