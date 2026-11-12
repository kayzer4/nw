export interface CampaignProgress {
  version: 1;
  unlockedLevelIds: string[];
  completedLevelIds: string[];
}

const STORAGE_KEY = "nightwatcher-clean.progress";
export const EMPTY_PROGRESS: CampaignProgress = { version: 1, unlockedLevelIds: ["first-shift"], completedLevelIds: [] };

type StorageLike = Pick<Storage, "getItem" | "setItem">;
function browserStorage(): StorageLike | null {
  try { return typeof window === "undefined" ? null : window.localStorage; }
  catch { return null; }
}

export function loadProgress(storage: StorageLike | null = browserStorage()): CampaignProgress {
  if (!storage) return { ...EMPTY_PROGRESS, unlockedLevelIds: [...EMPTY_PROGRESS.unlockedLevelIds], completedLevelIds: [] };
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return { ...EMPTY_PROGRESS, unlockedLevelIds: [...EMPTY_PROGRESS.unlockedLevelIds], completedLevelIds: [] };
    const value = parsed as Partial<CampaignProgress>;
    if (value.version !== 1 || !Array.isArray(value.unlockedLevelIds) || !Array.isArray(value.completedLevelIds)) {
      return { ...EMPTY_PROGRESS, unlockedLevelIds: [...EMPTY_PROGRESS.unlockedLevelIds], completedLevelIds: [] };
    }
    return { version: 1, unlockedLevelIds: value.unlockedLevelIds.filter((id): id is string => typeof id === "string"), completedLevelIds: value.completedLevelIds.filter((id): id is string => typeof id === "string") };
  } catch {
    return { ...EMPTY_PROGRESS, unlockedLevelIds: [...EMPTY_PROGRESS.unlockedLevelIds], completedLevelIds: [] };
  }
}

export function saveProgress(progress: CampaignProgress, storage: StorageLike | null = browserStorage()) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Storage can be disabled or full. */ }
}

export function completeLevel(progress: CampaignProgress, levelId: string): CampaignProgress {
  return {
    version: 1,
    completedLevelIds: progress.completedLevelIds.includes(levelId) ? progress.completedLevelIds : [...progress.completedLevelIds, levelId],
    unlockedLevelIds: progress.unlockedLevelIds,
  };
}
