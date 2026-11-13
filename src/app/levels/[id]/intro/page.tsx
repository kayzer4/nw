import { notFound } from "next/navigation";
import LevelIntroScreen from "@/client/LevelIntroScreen";
import { getLevel, getLevelIndex } from "@/server/levels";

export default async function IntroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [level, levels] = await Promise.all([getLevel(id), getLevelIndex()]);
  if (!level) notFound();
  return <LevelIntroScreen level={level} levels={levels} />;
}
