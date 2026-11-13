import { notFound } from "next/navigation";
import GameScreen from "@/client/GameScreen";
import { getLevel } from "@/server/levels";

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const level = await getLevel(id);
  if (!level) notFound();
  return <GameScreen level={level} />;
}
