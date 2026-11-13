export interface CampaignProgress {
  version: 2;
  lastLevelId?: string;
  unlockedLevelIds: string[];
  completedLevelIds: string[];
}

const STORAGE_KEY = "nightwatcher-clean.progress";
export const EMPTY_PROGRESS: CampaignProgress = { version: 2, lastLevelId: "first-shift", unlockedLevelIds: ["first-shift"], completedLevelIds: [] };

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
    if (!Array.isArray(value.unlockedLevelIds) || !Array.isArray(value.completedLevelIds)) {
      return { ...EMPTY_PROGRESS, unlockedLevelIds: [...EMPTY_PROGRESS.unlockedLevelIds], completedLevelIds: [] };
    }
    return {
      version: 2,
      lastLevelId: value.version === 2 && typeof value.lastLevelId === "string" ? value.lastLevelId : "first-shift",
      unlockedLevelIds: value.unlockedLevelIds.filter((id): id is string => typeof id === "string"),
      completedLevelIds: value.completedLevelIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return { ...EMPTY_PROGRESS, unlockedLevelIds: [...EMPTY_PROGRESS.unlockedLevelIds], completedLevelIds: [] };
  }
}

export function saveProgress(progress: CampaignProgress, storage: StorageLike | null = browserStorage()) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch { /* Storage can be disabled or full. */ }
}

export function completeLevel(progress: CampaignProgress, levelId: string): CampaignProgress {
  return {
    version: 2,
    lastLevelId: progress.lastLevelId,
    completedLevelIds: progress.completedLevelIds.includes(levelId) ? progress.completedLevelIds : [...progress.completedLevelIds, levelId],
    unlockedLevelIds: progress.unlockedLevelIds,
  };
}
