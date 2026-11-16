"use client";

import { useGameStore } from "@/game/game-store";
import type { LevelPreset } from "@/game/level";
import { lightingEconomy } from "@/game/simulation";
import { useLampHoverStore } from "./lamp-hover-store";

function meter(value: number, max: number) { return `${Math.max(0, Math.min(100, (value / max) * 100))}%`; }
function formatTime(seconds: number) {
  const wholeSeconds = Math.ceil(Math.max(0, seconds));
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, "0");
  const remainder = (wholeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function GameHud({ level, onExit }: {
  level: LevelPreset;
  onExit: () => void;
}) {
  const session = useGameStore((state) => state.session);
  const lamps = useGameStore((state) => state.lampStates);
  const restart = useGameStore((state) => state.restart);
  const toggleLamp = useGameStore((state) => state.toggleLamp);
  const hoveredLampId = useLampHoverStore((state) => state.hoveredLampId);
  const setHoveredLamp = useLampHoverStore((state) => state.setHoveredLamp);
  const clearHoveredLamp = useLampHoverStore((state) => state.clearHoveredLamp);
  if (!session) return null;
  const remaining = Math.max(0, level.rules.shiftSeconds - session.elapsedSeconds);
  const phaseLabel = session.phase === "ready" ? "СМЕНА ГОТОВА" : session.phase === "playing" ? "СМЕНА ИДЁТ" : session.phase === "won" ? "СМЕНА ЗАВЕРШЕНА" : "СМЕНА ПРОВАЛЕНА";
  const headline = session.phase === "won" ? "Ты дождался рассвета." : session.phase === "lost" ? (session.energy <= 0 ? "Энергия закончилась." : "Район погрузился во тьму.") : level.title;
  const activeLampCount = lightingEconomy(level, lamps, session.elapsedSeconds).activeLampCount;

  return (
    <div className="hud-shell">
      <header className="topbar">
        <div className="brand"><button type="button" className="back-button" onClick={onExit}>← РАЙОНЫ</button><div><strong>LIGHTKEEPER</strong><small>НОЧНАЯ СЛУЖБА</small></div></div>
        <div className="top-status"><span className={`status-dot ${session.phase === "playing" ? "live" : ""}`} />{phaseLabel}</div>
        <div className="shift-clock"><span>ДО КОНЦА СМЕНЫ</span><strong>{formatTime(remaining)}</strong></div>
      </header>

      <section className="mission-card glass-panel">
        <div className="eyebrow">РАЙОН <span>·</span> НОЧНАЯ СМЕНА</div>
        <h1>{headline}</h1>
        <p>{session.phase === "won" ? "Жители благополучно дождались утра." : session.phase === "lost" ? (session.energy <= 0 ? "Энергия закончилась до рассвета." : "Слишком много жителей остались без света.") : `Освещай всех ${level.citizens.length} жителей. Выключай фонари, когда свет больше не нужен.`}</p>
        <div className="level-facts"><span>СЛОЖНОСТЬ <b>{level.difficulty}/5</b></span><span>РАДИУС СВЕТА <b>{level.lamps[0]?.radius.toFixed(1)} м</b></span><span>МИНИМУМ КОМФОРТА <b>{level.rules.minimumSatisfaction}%</b></span></div>
        <div className="meters">
          <div className="meter-block"><div className="meter-label"><span>ЭНЕРГИЯ СЕТИ</span><b>{Math.ceil(session.energy)} <small>кВт·ч</small></b></div><div className="meter-track"><i className="energy-fill" style={{ width: meter(session.energy, level.rules.startingEnergy) }} /></div></div>
          <div className="meter-block"><div className="meter-label"><span>КОМФОРТ ЖИТЕЛЕЙ</span><b>{Math.round(session.satisfaction)}<small>%</small></b></div><div className="meter-track"><i className="comfort-fill" style={{ width: meter(session.satisfaction, 100) }} /></div></div>
          <div className="resident-count">{Object.values(session.citizenLit).filter(Boolean).length}/{level.citizens.length} ЖИТЕЛЕЙ В СВЕТЕ <span>ЦЕЛЬ {level.rules.requiredLitResidents}/{level.citizens.length}</span></div>
        </div>
      </section>

      <aside className="lamp-panel glass-panel" aria-label="Управление уличными фонарями">
        <div className="panel-heading"><div><div className="eyebrow">ПУЛЬТ УПРАВЛЕНИЯ</div><h2>Уличные фонари <span>{Object.values(lamps).filter(Boolean).length}/{level.lamps.length} включено</span></h2></div><div className="tap-hint">ВЫБЕРИ ФОНАРЬ В ГОРОДЕ ИЛИ ЗДЕСЬ</div></div>
        <div className="lamp-list">
          {level.lamps.map((lamp, index) => {
            const on = lamps[lamp.id] ?? lamp.initiallyOn;
            const disabled = session.phase !== "playing";
            return <button key={lamp.id} type="button" className={`lamp-switch ${on ? "is-on" : ""} ${hoveredLampId === lamp.id ? "is-hovered" : ""}`} disabled={disabled} onPointerEnter={() => setHoveredLamp(lamp.id)} onPointerLeave={() => clearHoveredLamp(lamp.id)} onFocus={() => setHoveredLamp(lamp.id)} onBlur={() => clearHoveredLamp(lamp.id)} onClick={() => toggleLamp(lamp.id)} aria-pressed={on} aria-label={`${on ? "Выключить" : "Включить"} фонарь ${index + 1}`}><span className="lamp-glyph">✳</span><span>ФОНАРЬ {String(index + 1).padStart(2, "0")}</span><i /></button>;
          })}
        </div>
      </aside>

      <section className="control-panel glass-panel" aria-label="Управление сменой">
        <div className="panel-footer"><span className="footnote">РАСХОД <b>{(activeLampCount * level.rules.energyPerLampSecond).toFixed(1)} кВт·ч / сек</b></span>
          {session.phase === "ready" ? <div className="running-note"><span className="status-dot live" /> СМЕНА НАЧИНАЕТСЯ</div> : session.phase === "playing" ? <div className="running-note"><span className="status-dot live" /> ПАТРУЛЬ НА СВЯЗИ</div> : <button type="button" className="primary-button" onClick={restart}>НАЧАТЬ ЗАНОВО <span>↻</span></button>}
        </div>
      </section>

      <div className="scene-hint"><span>ПЕРЕТАСКИВАЙ</span> ПОВЕРНУТЬ <i /> <span>КОЛЕСО</span> МАСШТАБ</div>
    </div>
  );
}
