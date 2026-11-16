import { create } from "zustand";

interface LampHoverState {
  hoveredLampId: string | null;
  setHoveredLamp: (id: string) => void;
  clearHoveredLamp: (id?: string) => void;
}

export const useLampHoverStore = create<LampHoverState>((set) => ({
  hoveredLampId: null,
  setHoveredLamp: (id) => set({ hoveredLampId: id }),
  clearHoveredLamp: (id) => set((state) => id && state.hoveredLampId !== id ? state : { hoveredLampId: null }),
}));
