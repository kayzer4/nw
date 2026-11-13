"use client";

import { ArrowLeftOutlined, ArrowRightOutlined, ThunderboltFilled } from "@ant-design/icons";
import { Button, Progress, Tag } from "antd";
import { useMemo, useState } from "react";
import { getComicChapter, type ComicChapter, type ComicMood } from "@/game/comics";
import type { LevelSummary } from "@/game/level";

const moodStyles: Record<ComicMood, { sky: string; glow: string; accent: string; weather: string }> = {
  clear: { sky: "from-[#101b2a] via-[#172b43] to-[#0c121c]", glow: "bg-[#f4c978]", accent: "#d6b16e", weather: "moon" },
  market: { sky: "from-[#241b25] via-[#49303b] to-[#10141d]", glow: "bg-[#f0b864]", accent: "#e09b59", weather: "market" },
  gate: { sky: "from-[#111d2b] via-[#25415a] to-[#0a101a]", glow: "bg-[#a6d6df]", accent: "#9ecad4", weather: "gate" },
  rain: { sky: "from-[#101b29] via-[#274050] to-[#0a1118]", glow: "bg-[#9fc9cc]", accent: "#9fc9cc", weather: "rain" },
  critical: { sky: "from-[#261822] via-[#4b2630] to-[#0d1119]", glow: "bg-[#efaf70]", accent: "#e69a68", weather: "critical" },
};

function SceneArt({ chapter, panel }: { chapter: ComicChapter; panel: number }) {
  const style = moodStyles[chapter.mood];
  const lampCount = panel + 2;
  return <div className={`relative min-h-[280px] overflow-hidden bg-gradient-to-br ${style.sky} md:min-h-[420px]`} aria-label={`${chapter.title}: иллюстрация панели ${panel + 1}`}>
    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] [background-size:34px_34px]" />
    <div className={`absolute right-[16%] top-[13%] h-20 w-20 rounded-full ${style.glow} opacity-80 blur-[1px] shadow-[0_0_60px_20px_rgba(244,201,120,.18)]`} />
    {style.weather === "rain" && <div className="absolute inset-0 opacity-50 [background-image:repeating-linear-gradient(110deg,transparent_0_18px,rgba(188,220,230,.2)_19px,transparent_20px_35px)]" />}
    {style.weather === "market" && <div className="absolute left-8 top-16 h-20 w-28 border border-[#e09b59]/50 bg-[#df9b59]/10 shadow-[0_0_35px_rgba(224,155,89,.2)]"><span className="absolute inset-x-3 top-5 border-t border-[#f4c978]/70" /><span className="absolute inset-x-3 top-11 border-t border-[#f4c978]/30" /></div>}
    {style.weather === "gate" && <div className="absolute left-[17%] top-16 h-32 w-20 border-x-4 border-t-4 border-[#9ecad4]/60"><span className="absolute -left-5 top-12 h-2 w-32 rotate-[-12deg] bg-[#d8a35f]/70" /></div>}
    {style.weather === "critical" && <div className="absolute left-10 top-12 rounded-sm border border-[#e69a68]/50 px-3 py-2 text-[10px] tracking-[.22em] text-[#f1bc91]">SOUTH / OPEN</div>}
    <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[#081019]/80 [clip-path:polygon(0_43%,17%_21%,34%_46%,49%_13%,65%_38%,82%_18%,100%_40%,100%_100%,0_100%)]" />
    <div className="absolute inset-x-[8%] bottom-[21%] h-1 bg-[#b9c2bd]/20 shadow-[0_0_18px_rgba(159,201,204,.18)]" />
    {Array.from({ length: lampCount }).map((_, index) => <div key={index} className="absolute bottom-[20%]" style={{ left: `${15 + index * (68 / Math.max(1, lampCount - 1))}%` }}>
      <div className="absolute -left-5 -top-8 h-10 w-10 rounded-full bg-[#f4c978]/10 blur-md" />
      <div className="relative h-20 w-[2px] bg-[#77828a]/80"><span className="absolute -left-[5px] -top-1 h-2 w-3 rounded-full bg-[#f5cf82] shadow-[0_0_13px_4px_rgba(245,207,130,.7)]" /></div>
    </div>)}
    <div className="absolute bottom-5 left-6 flex items-center gap-2 text-[9px] font-medium tracking-[.22em] text-[#bac8c5]/70 md:left-9"><ThunderboltFilled style={{ color: style.accent }} /> NIGHT LINE / FIELD NOTE {String(panel + 1).padStart(2, "0")}</div>
  </div>;
}

export default function ComicIntro({ level, levels, onStart, onBack }: { level: LevelSummary; levels: readonly LevelSummary[]; onStart: () => void; onBack: () => void }) {
  const chapter = getComicChapter(level.id);
  const [panel, setPanel] = useState(0);
  const currentIndex = Math.max(0, levels.findIndex((item) => item.id === level.id));
  const fallback = useMemo<ComicChapter>(() => ({
    levelId: level.id,
    chapter: `Глава ${String(currentIndex + 1).padStart(2, "0")}`,
    title: level.title,
    subtitle: level.subtitle,
    mood: "clear" as const,
    principle: "Сохрани безопасный свет до рассвета.",
    panels: [{ kicker: "НОЧНАЯ ЛИНИЯ", title: level.title, text: level.subtitle }],
  }), [currentIndex, level.id, level.subtitle, level.title]);
  const story = chapter ?? fallback;
  const isLastPanel = panel === story.panels.length - 1;
  const currentPanel = story.panels[panel];
  const style = moodStyles[story.mood];

  return <main className="min-h-screen overflow-y-auto bg-[#070b11] text-[#ece9df] selection:bg-[#d6b16e] selection:text-[#11161b]">
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-8 lg:px-12">
      <header className="flex items-center justify-between border-b border-white/[.09] pb-5">
        <button type="button" onClick={onBack} className="group flex items-center gap-3 text-left text-[#d6b16e] transition hover:text-[#f1d29a]">
          <span className="grid h-8 w-8 place-items-center border border-[#d6b16e]/50 text-sm">N</span>
          <span><strong className="block text-[10px] tracking-[.2em]">NIGHTWATCHER</strong><small className="mt-1 block text-[8px] tracking-[.16em] text-[#74818b]">RETURN TO DISTRICTS</small></span>
        </button>
        <div className="hidden items-center gap-3 sm:flex"><span className="text-[9px] tracking-[.18em] text-[#74818b]">FIELD COMIC</span><Progress percent={Math.round(((currentIndex + 1) / Math.max(1, levels.length)) * 100)} showInfo={false} strokeColor="#d6b16e" trailColor="rgba(255,255,255,.12)" size="small" className="w-28" /></div>
      </header>

      <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] lg:gap-14 lg:py-12">
        <div className="overflow-hidden border border-white/[.12] bg-[#101821] shadow-[0_28px_100px_rgba(0,0,0,.35)]">
          <SceneArt chapter={story} panel={panel} />
          <div className="border-t border-white/[.1] bg-[#ede8dc] p-5 text-[#20242a] sm:p-7">
            <div className="mb-3 flex items-center justify-between gap-4"><span className="text-[9px] font-bold tracking-[.22em] text-[#8e7143]">{currentPanel.kicker}</span><span className="text-[10px] text-[#8c8a83]">{panel + 1} / {story.panels.length}</span></div>
            <h1 className="max-w-xl font-serif text-3xl leading-[1.05] tracking-[-.03em] sm:text-5xl">{currentPanel.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d6061] sm:text-base">{currentPanel.text}</p>
            {currentPanel.speech && <div className="relative mt-5 max-w-xl border border-[#bdab89] bg-[#f8f4e9] p-4 text-sm leading-6 text-[#353333] shadow-[3px_3px_0_#d6cbb5] before:absolute before:-bottom-2 before:left-8 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-r before:border-[#bdab89] before:bg-[#f8f4e9]">«{currentPanel.speech}»</div>}
          </div>
        </div>

        <div className="max-w-lg lg:pb-5">
          <div className="mb-5 flex flex-wrap items-center gap-2"><Tag color={style.accent}>{story.chapter}</Tag><span className="text-[9px] tracking-[.2em] text-[#75818a]">{level.id.replaceAll("-", " ")}</span></div>
          <h2 className="max-w-md font-serif text-5xl leading-[.98] tracking-[-.04em] text-[#f1eee6] sm:text-7xl">{story.title}</h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#93a0a7]">{story.subtitle}</p>
          <div className="mt-8 border-l-2 border-[#d6b16e] pl-5"><div className="text-[9px] tracking-[.2em] text-[#7d8a90]">СЕГОДНЯШНИЙ ПРИНЦИП</div><div className="mt-2 font-serif text-2xl leading-tight text-[#e1c386]">{story.principle}</div></div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {panel > 0 && <Button ghost icon={<ArrowLeftOutlined />} onClick={() => setPanel((value) => value - 1)} className="!border-white/20 !text-[#b8c0c1]">Назад</Button>}
            {isLastPanel ? <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end" onClick={onStart} className="!h-11 !border-0 !bg-[#d6b16e] !px-5 !text-[#11161b]">Принять смену</Button> : <Button type="primary" icon={<ArrowRightOutlined />} iconPosition="end" onClick={() => setPanel((value) => value + 1)} className="!h-11 !border-0 !bg-[#d6b16e] !px-5 !text-[#11161b]">Дальше</Button>}
          </div>
          <div className="mt-5 text-[9px] leading-5 tracking-[.12em] text-[#65727b]">ЧИТАЙ ПАНЕЛИ, ЗАТЕМ ВЫХОДИ НА МАРШРУТ</div>
        </div>
      </section>
    </div>
  </main>;
}
