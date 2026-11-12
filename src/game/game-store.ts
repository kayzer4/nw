import { create } from "zustand";
import type { LevelPreset } from "./level";
import { advanceSession, buildCoverageIndex, createSession, type CoverageIndex, type SessionSnapshot } from "./simulation";

interface GameStore {
  level: LevelPreset | null;
  session: SessionSnapshot | null;
  lampStates: Record<string, boolean>;
  coverage: CoverageIndex;
  loadLevel: (level: LevelPreset) => void;
  start: () => void;
  toggleLamp: (lampId: string) => void;
  tick: () => void;
  restart: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  level: null, session: null, lampStates: {}, coverage: {},
  loadLevel: (level) => {
    const lampStates = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, lamp.initiallyOn]));
    set({ level, session: createSession(level), lampStates, coverage: buildCoverageIndex(level) });
  },
  start: () => set((state) => state.session?.phase === "ready" ? { session: { ...state.session, phase: "playing" } } : {}),
  toggleLamp: (lampId) => set((state) => {
    if (state.session?.phase !== "playing" || !(lampId in state.lampStates)) return {};
    return { lampStates: { ...state.lampStates, [lampId]: !state.lampStates[lampId] } };
  }),
  tick: () => set((state) => state.level && state.session
    ? { session: advanceSession(state.level, state.session, state.lampStates, state.coverage) }
    : {}),
  restart: () => {
    const { level, loadLevel } = get();
    if (level) loadLevel(level);
  },
}));
