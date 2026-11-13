"use client";

import Link from "next/link";
import type { LevelSummary } from "@/game/level";

export default function LevelPicker({ levels, completedIds }: {
  levels: LevelSummary[];
  completedIds: readonly string[];
}) {
  return <main className="level-picker">
    <header className="picker-header"><div className="brand"><span className="brand-mark">N</span><div><strong>NIGHTWATCHER</strong><small>AFTER HOURS DIVISION</small></div></div><span>THE CITY NEEDS A WATCHER</span></header>
    <div className="picker-content">
      <div className="eyebrow">NIGHT SHIFT / DISTRICT SELECT</div>
      <h1>Choose your district.</h1>
      <p>Each street has its own power budget. Keep the residents in the light until sunrise.</p>
      <div className="level-grid">
        {levels.map((level, index) => <Link key={level.id} href={`/levels/${encodeURIComponent(level.id)}/intro`} className="level-card">
          <span className="level-card-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="level-card-name">{level.title}</span>
          <span className="level-card-description">{level.subtitle}</span>
          <span className="level-card-bottom"><span>{completedIds.includes(level.id) ? "SHIFT COMPLETE" : "READY TO PLAY"}</span><strong>PLAY →</strong></span>
        </Link>)}
      </div>
      {!levels.length && <div className="picker-error">NO PLAYABLE DISTRICTS</div>}
    </div>
  </main>;
}
