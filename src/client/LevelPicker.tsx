"use client";

import type { LevelSummary } from "@/game/level";

export default function LevelPicker({ levels, completedIds, loadingId, error, onSelect, onRetry }: {
  levels: LevelSummary[];
  completedIds: readonly string[];
  loadingId: string | null;
  error: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}) {
  return <main className="level-picker">
    <header className="picker-header"><div className="brand"><span className="brand-mark">N</span><div><strong>NIGHTWATCHER</strong><small>AFTER HOURS DIVISION</small></div></div><span>THE CITY NEEDS A WATCHER</span></header>
    <div className="picker-content">
      <div className="eyebrow">NIGHT SHIFT / DISTRICT SELECT</div>
      <h1>Choose your district.</h1>
      <p>Each street has its own power budget. Keep the residents in the light until sunrise.</p>
      {error && <div className="picker-error" role="alert">{error} <button type="button" onClick={onRetry}>RETRY</button></div>}
      <div className="level-grid">
        {levels.map((level, index) => <button key={level.id} type="button" className="level-card" disabled={loadingId !== null} onClick={() => onSelect(level.id)}>
          <span className="level-card-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="level-card-name">{level.title}</span>
          <span className="level-card-description">{level.subtitle}</span>
          <span className="level-card-bottom"><span>{completedIds.includes(level.id) ? "SHIFT COMPLETE" : "READY TO PLAY"}</span><strong>{loadingId === level.id ? "LOADING…" : "PLAY →"}</strong></span>
        </button>)}
      </div>
      {!levels.length && !error && <div className="picker-loading">LOADING DISTRICTS…</div>}
    </div>
  </main>;
}
