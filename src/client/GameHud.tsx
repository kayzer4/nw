"use client";

import { useGameStore } from "@/game/game-store";
import type { LevelPreset, LevelSummary } from "@/game/level";
import LevelSelect from "./LevelSelect";

function meter(value: number, max: number) { return `${Math.max(0, Math.min(100, (value / max) * 100))}%`; }
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function GameHud({ level, levels, isLoading, loadError, onSelectLevel }: {
  level: LevelPreset;
  levels: LevelSummary[];
  isLoading: boolean;
  loadError: string | null;
  onSelectLevel: (levelId: string) => void;
}) {
  const session = useGameStore((state) => state.session);
  const lamps = useGameStore((state) => state.lampStates);
  const start = useGameStore((state) => state.start);
  const restart = useGameStore((state) => state.restart);
  const toggleLamp = useGameStore((state) => state.toggleLamp);
  if (!session) return null;
  const remaining = Math.max(0, level.rules.shiftSeconds - session.elapsedSeconds);
  const phaseLabel = session.phase === "ready" ? "READY TO BEGIN" : session.phase === "playing" ? "SHIFT IN PROGRESS" : session.phase === "won" ? "SHIFT COMPLETE" : "SHIFT FAILED";
  const headline = session.phase === "won" ? "Sunrise is yours." : session.phase === "lost" ? "The district went dark." : level.title;

  return (
    <div className="hud-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">N</span><div><strong>NIGHTWATCHER</strong><small>AFTER HOURS DIVISION</small></div></div>
        <div className="top-status"><span className={`status-dot ${session.phase === "playing" ? "live" : ""}`} />{phaseLabel}</div>
        <div className="shift-clock"><span>SHIFT ENDS IN</span><strong>{formatTime(remaining)}</strong></div>
      </header>

      <section className="mission-card glass-panel">
        <div className="eyebrow">DISTRICT 01 <span>·</span> NIGHT SHIFT</div>
        <h1>{headline}</h1>
        <p>{session.phase === "ready" ? level.subtitle : session.phase === "won" ? "The neighborhood made it safely to morning." : session.phase === "lost" ? "Restore the lights and try a different strategy." : "Keep enough of the neighborhood illuminated."}</p>
        <LevelSelect level={level} levels={levels} disabled={session.phase === "playing" || isLoading} onSelect={onSelectLevel} />
        {loadError && <p role="alert">{loadError}</p>}
        <div className="meters">
          <div className="meter-block"><div className="meter-label"><span>GRID POWER</span><b>{Math.ceil(session.energy)} <small>kWh</small></b></div><div className="meter-track"><i className="energy-fill" style={{ width: meter(session.energy, level.rules.startingEnergy) }} /></div></div>
          <div className="meter-block"><div className="meter-label"><span>RESIDENT COMFORT</span><b>{Math.round(session.satisfaction)}<small>%</small></b></div><div className="meter-track"><i className="comfort-fill" style={{ width: meter(session.satisfaction, 100) }} /></div></div>
        </div>
      </section>

      <section className="control-panel glass-panel">
        <div className="panel-heading"><div><div className="eyebrow">FIELD CONTROLS</div><h2>Street lamps <span>{Object.values(lamps).filter(Boolean).length}/{level.lamps.length} online</span></h2></div><div className="tap-hint">SELECT A LAMP IN THE CITY OR HERE</div></div>
        <div className="lamp-list">
          {level.lamps.map((lamp, index) => {
            const on = lamps[lamp.id] ?? lamp.initiallyOn;
            const disabled = session.phase !== "playing";
            return <button key={lamp.id} type="button" className={`lamp-switch ${on ? "is-on" : ""}`} disabled={disabled} onClick={() => toggleLamp(lamp.id)} aria-pressed={on} aria-label={`${on ? "Turn off" : "Turn on"} street lamp ${index + 1}`}><span className="lamp-glyph">✳</span><span>{String(index + 1).padStart(2, "0")}</span><i /></button>;
          })}
        </div>
        <div className="panel-footer"><span className="footnote">POWER DRAIN <b>{(Object.values(lamps).filter(Boolean).length * level.rules.energyPerLampSecond).toFixed(1)} kWh / sec</b></span>
          {session.phase === "ready" ? <button type="button" className="primary-button" onClick={start}>START NIGHT SHIFT <span>→</span></button> : session.phase === "playing" ? <div className="running-note"><span className="status-dot live" /> PATROL ACTIVE</div> : <button type="button" className="primary-button" onClick={restart}>RESTART SHIFT <span>↻</span></button>}
        </div>
      </section>

      <div className="scene-hint"><span>DRAG</span> ROTATE <i /> <span>SCROLL</span> ZOOM</div>
    </div>
  );
}
