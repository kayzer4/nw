"use client";

import Link from "next/link";
import type { LevelSummary } from "@/game/level";

export default function LevelPicker({ levels, completedIds }: {
  levels: LevelSummary[];
  completedIds: readonly string[];
}) {
  return <main className="level-picker">
    <header className="picker-header"><div className="brand"><span className="brand-mark">Л</span><div><strong>LIGHTKEEPER</strong><small>НОЧНАЯ СЛУЖБА</small></div></div><span>ГОРОДУ НУЖЕН ХРАНИТЕЛЬ СВЕТА</span></header>
    <div className="picker-content">
      <div className="eyebrow">НОЧНАЯ СМЕНА / ВЫБОР РАЙОНА</div>
      <h1>Выбери район.</h1>
      <p>У каждой улицы свой запас энергии. Проведи жителей через ночь до рассвета.</p>
      <div className="level-grid">
        {levels.map((level, index) => <Link key={level.id} href={`/levels/${encodeURIComponent(level.id)}/intro`} className="level-card">
          <span className="level-card-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="level-card-name">{level.title}</span>
          <span className="level-card-description">{level.subtitle}</span>
          <span className="level-card-bottom"><span>{completedIds.includes(level.id) ? "СМЕНА ЗАВЕРШЕНА" : "ГОТОВО К ИГРЕ"}</span><strong>ИГРАТЬ →</strong></span>
        </Link>)}
      </div>
      {!levels.length && <div className="picker-error">НЕТ ДОСТУПНЫХ РАЙОНОВ</div>}
    </div>
  </main>;
}
