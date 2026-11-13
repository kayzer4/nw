import { create } from "zustand";
import type { LevelPreset } from "./level";
import { advanceSession, citizenLighting, createSession, type SessionSnapshot } from "./simulation";
import { gameClock } from "./clock";

interface GameStore {
  level: LevelPreset | null;
  session: SessionSnapshot | null;
  lampStates: Record<string, boolean>;
  loadLevel: (level: LevelPreset) => void;
  start: () => void;
  toggleLamp: (lampId: string) => void;
  tick: () => void;
  restart: () => void;
  quit: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  level: null, session: null, lampStates: {},
  loadLevel: (level) => {
    gameClock.reset();
    const lampStates = Object.fromEntries(level.lamps.map((lamp) => [lamp.id, lamp.initiallyOn]));
    set({ level, session: createSession(level), lampStates });
  },
  start: () => set((state) => {
    if (state.session?.phase !== "ready") return {};
    gameClock.start();
    return { session: { ...state.session, phase: "playing" } };
  }),
  toggleLamp: (lampId) => set((state) => {
    if (state.session?.phase !== "playing" || !(lampId in state.lampStates)) return {};
    const current = advanceSession(state.level!, state.session, state.lampStates, gameClock.elapsed());
    if (current.phase !== "playing") { gameClock.stop(); return { session: current }; }
    const lampStates = { ...state.lampStates, [lampId]: !state.lampStates[lampId] };
    return { lampStates, session: { ...current, citizenLit: citizenLighting(state.level!, lampStates, current.elapsedSeconds) } };
  }),
  tick: () => set((state) => {
    if (!state.level || state.session?.phase !== "playing") return {};
    const session = advanceSession(state.level, state.session, state.lampStates, gameClock.elapsed());
    if (session.phase !== "playing") gameClock.stop();
    return { session };
  }),
  restart: () => {
    const { level, loadLevel } = get();
    if (level) loadLevel(level);
  },
  quit: () => { gameClock.reset(); set({ level: null, session: null, lampStates: {} }); },
}));
