import LevelSelectionScreen from "@/client/LevelSelectionScreen";
import { getLevelIndex } from "@/server/levels";

export default async function LevelsPage() {
  return <LevelSelectionScreen levels={await getLevelIndex()} />;
}
