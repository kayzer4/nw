"use client";

import { AlertOutlined, AudioOutlined, RadarChartOutlined } from "@ant-design/icons";
import type { LevelSummary } from "@/game/level";

export default function LevelMonitor({ levels, completedIds, loadingId, error, onSelect, onRetry }: {
  levels: LevelSummary[];
  completedIds: readonly string[];
  loadingId: string | null;
  error: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}) {
  return <div className="level-monitor-ui">
    <div className="level-monitor-topline"><span><RadarChartOutlined /> CITY NETWORK / 05 DISTRICTS</span><span>ENERGY RESERVE 71%</span></div>
    <div className="level-monitor-headline"><h1>Choose your watch.</h1><p>Every lamp is a decision. Keep the residents in light until sunrise.</p></div>
    {error && <div className="level-monitor-error" role="alert"><AlertOutlined /> {error} <button type="button" onClick={onRetry}>RETRY</button></div>}
    <div className="level-monitor-list">
      {levels.map((level, index) => <button key={level.id} type="button" className="level-monitor-row" disabled={loadingId !== null} onClick={() => onSelect(level.id)}>
        <span className="level-monitor-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="level-monitor-route"><strong>{level.title}</strong><small>{level.subtitle}</small></span>
        <span className={`level-monitor-status ${completedIds.includes(level.id) ? "complete" : ""}`}><i />{completedIds.includes(level.id) ? "ARCHIVED" : "OPEN"}</span>
        <span className="level-monitor-action">{loadingId === level.id ? "LOADING…" : "OPEN FILE ↗"}</span>
      </button>)}
    </div>
    {!levels.length && !error && <div className="level-monitor-loading">SYNCING DISTRICT FILES…</div>}
    <div className="level-monitor-footer"><span><AudioOutlined /> DISPATCH CHANNEL 03</span><span>WATCHER REQUIRED</span></div>
  </div>;
}
