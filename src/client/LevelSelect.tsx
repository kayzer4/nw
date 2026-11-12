"use client";

import type { LevelPreset, LevelSummary } from "@/game/level";

export default function LevelSelect({ level, levels, disabled, onSelect }: {
  level: LevelPreset;
  levels: LevelSummary[];
  disabled: boolean;
  onSelect: (levelId: string) => void;
}) {
  const isCustom = !levels.some((entry) => entry.id === level.id);
  return (
    <div className="level-select">
      <label htmlFor="district-select">CHOOSE DISTRICT</label>
      <select id="district-select" value={level.id} disabled={disabled} onChange={(event) => onSelect(event.target.value)}>
        {isCustom && <option value="custom">Custom seed · {level.seed}</option>}
        {levels.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
      </select>
    </div>
  );
}
