"use client";

import type { LevelPreset, LevelSummary } from "@/game/level";

export default function LevelSelect({ level, levels, disabled, onSelect }: {
  level: LevelPreset;
  levels: LevelSummary[];
  disabled: boolean;
  onSelect: (levelId: string) => void;
}) {
  return (
    <div className="level-select">
      <label htmlFor="district-select">CHOOSE DISTRICT</label>
      <select id="district-select" value={level.id} disabled={disabled} onChange={(event) => onSelect(event.target.value)}>
        {levels.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
      </select>
    </div>
  );
}
