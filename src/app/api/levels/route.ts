import { getLevelIndex } from "@/server/levels";

export async function GET() {
  return Response.json(await getLevelIndex());
}
