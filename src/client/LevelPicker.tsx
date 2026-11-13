"use client";

import { AlertOutlined, AudioOutlined, PoweroffOutlined, RadarChartOutlined } from "@ant-design/icons";
import type { LevelSummary } from "@/game/level";

export default function LevelPicker({ levels, completedIds, loadingId, error, onSelect, onRetry }: {
  levels: LevelSummary[];
  completedIds: readonly string[];
  loadingId: string | null;
  error: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}) {
  return <main className="control-room">
    <div className="control-room-grain" />
    <div className="control-room-window"><div className="window-moon" /><div className="window-skyline skyline-back" /><div className="window-skyline skyline-front" /></div>
    <header className="control-room-header"><div className="control-brand"><span className="control-brand-mark">N</span><span><strong>NIGHTWATCHER</strong><small>AFTER HOURS DIVISION</small></span></div><div className="control-clock"><span>LOCAL TIME</span><strong>02:13:08</strong><i><PoweroffOutlined /> GRID ONLINE</i></div></header>

    <section className="control-room-scene" aria-label="Night watch control room">
      <div className="desk-lamp"><i /><span /></div>
      <div className="watcher-silhouette" aria-hidden="true"><span className="watcher-head" /><span className="watcher-neck" /><span className="watcher-coat" /><span className="watcher-shoulder" /><span className="watcher-hand" /></div>
      <div className="monitor-small monitor-small-left"><div className="monitor-glow"><span className="scanline" /><div className="mini-map"><i /><i /><i /><i /><b /></div><strong>LIVE FEED</strong><small>CAM 04 / WEST END</small></div><span className="monitor-base" /></div>
      <div className="monitor-small monitor-small-right"><div className="monitor-glow monitor-amber"><span className="scanline" /><div className="signal-bars"><i /><i /><i /><i /><i /></div><strong>POWER GRID</strong><small>LOAD 68% / STABLE</small></div><span className="monitor-base" /></div>

      <div className="district-monitor">
        <div className="monitor-shell-top"><span className="monitor-screw" /><span className="monitor-screw" /><div><b>DISTRICT CONTROL</b><small>SELECT A NIGHT SHIFT</small></div><span className="monitor-live"><i /> LIVE</span></div>
        <div className="district-screen">
          <div className="screen-topline"><span><RadarChartOutlined /> CITY NETWORK / 05 DISTRICTS</span><span>ENERGY RESERVE 71%</span></div>
          <div className="screen-headline"><h1>Choose your watch.</h1><p>Every lamp is a decision. Keep the residents in light until sunrise.</p></div>
          {error && <div className="monitor-error" role="alert"><AlertOutlined /> {error} <button type="button" onClick={onRetry}>RETRY</button></div>}
          <div className="district-list">
            {levels.map((level, index) => <button key={level.id} type="button" className="district-row" disabled={loadingId !== null} onClick={() => onSelect(level.id)}>
              <span className="district-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="district-route"><strong>{level.title}</strong><small>{level.subtitle}</small></span>
              <span className={`district-status ${completedIds.includes(level.id) ? "complete" : ""}`}><i />{completedIds.includes(level.id) ? "ARCHIVED" : "OPEN"}</span>
              <span className="district-action">{loadingId === level.id ? "LOADING…" : "OPEN FILE ↗"}</span>
            </button>)}
          </div>
          {!levels.length && !error && <div className="monitor-loading">SYNCING DISTRICT FILES…</div>}
          <div className="screen-footer"><span><AudioOutlined /> DISPATCH CHANNEL 03</span><span>WATCHER REQUIRED</span></div>
        </div>
        <div className="monitor-shell-bottom"><span>INSERT SHIFT LOG</span><i /><i /><i /><b>▰ ▰ ▰</b></div>
      </div>
    </section>

    <footer className="control-room-footer"><span><i className="status-light" /> NIGHT LINE IS LISTENING</span><span>SELECT A FILE ON THE CENTRAL MONITOR TO BEGIN</span><span>v0.4 / MUNICIPAL GRID</span></footer>
  </main>;
}
