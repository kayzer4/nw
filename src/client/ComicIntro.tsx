"use client";

import { ArrowLeftOutlined, ArrowRightOutlined, ThunderboltFilled } from "@ant-design/icons";
import { Button, Progress, Tag } from "antd";
import { useMemo, useState } from "react";
import { getComicChapter, type ComicChapter, type ComicMood, type ComicPanel } from "@/game/comics";
import type { LevelSummary } from "@/game/level";

const moodStyles: Record<ComicMood, { sky: string; glow: string; accent: string; weather: string }> = {
  clear: { sky: "from-[#101b2a] via-[#172b43] to-[#0c121c]", glow: "bg-[#f4c978]", accent: "#d6b16e", weather: "moon" },
  market: { sky: "from-[#241b25] via-[#49303b] to-[#10141d]", glow: "bg-[#f0b864]", accent: "#e09b59", weather: "market" },
  gate: { sky: "from-[#111d2b] via-[#25415a] to-[#0a101a]", glow: "bg-[#a6d6df]", accent: "#9ecad4", weather: "gate" },
  rain: { sky: "from-[#101b29] via-[#274050] to-[#0a1118]", glow: "bg-[#9fc9cc]", accent: "#9fc9cc", weather: "rain" },
  critical: { sky: "from-[#261822] via-[#4b2630] to-[#0d1119]", glow: "bg-[#efaf70]", accent: "#e69a68", weather: "critical" },
};

function SceneArt({ chapter, panel, active }: { chapter: ComicChapter; panel: number; active: boolean }) {
  const style = moodStyles[chapter.mood];
  const lampCount = panel + 2;
  return <div className={`relative min-h-[190px] overflow-hidden border-b-[5px] border-[#202126] bg-gradient-to-br ${style.sky} ${active ? "" : "opacity-90"}`} aria-label={`${chapter.title}: иллюстрация панели ${panel + 1}`}>
    <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:7px_7px]" />
    <div className="comic-speed-lines" />
    <div className={`absolute right-[15%] top-[14%] h-14 w-14 rounded-full ${style.glow} opacity-80 shadow-[0_0_45px_14px_rgba(244,201,120,.18)]`} />
    {style.weather === "rain" && <div className="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(110deg,transparent_0_14px,rgba(188,220,230,.25)_15px,transparent_16px_28px)]" />}
    {style.weather === "market" && <div className="absolute left-6 top-11 h-16 w-24 border-2 border-[#e09b59]/60 bg-[#df9b59]/10"><span className="absolute inset-x-2 top-4 border-t border-[#f4c978]/70" /><span className="absolute inset-x-2 top-9 border-t border-[#f4c978]/30" /></div>}
    {style.weather === "gate" && <div className="absolute left-[15%] top-10 h-24 w-16 border-x-4 border-t-4 border-[#9ecad4]/70"><span className="absolute -left-4 top-10 h-2 w-28 rotate-[-12deg] bg-[#d8a35f]/70" /></div>}
    {style.weather === "critical" && <div className="absolute left-6 top-8 border-2 border-[#e69a68]/60 px-2 py-1 text-[8px] font-bold tracking-[.2em] text-[#f1bc91]">SOUTH / OPEN</div>}
    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[#081019]/90 [clip-path:polygon(0_43%,17%_21%,34%_46%,49%_13%,65%_38%,82%_18%,100%_40%,100%_100%,0_100%)]" />
    <div className="absolute inset-x-[8%] bottom-[21%] h-1 bg-[#b9c2bd]/30 shadow-[0_0_18px_rgba(159,201,204,.18)]" />
    <div className={`comic-watcher comic-watcher-${panel}`}><span className="comic-watcher-head" /><span className="comic-watcher-body" /><span className="comic-watcher-arm" /><span className="comic-watcher-beam" /></div>
    {Array.from({ length: lampCount }).map((_, index) => <div key={index} className="absolute bottom-[20%]" style={{ left: `${15 + index * (68 / Math.max(1, lampCount - 1))}%` }}>
      <div className="absolute -left-4 -top-6 h-8 w-8 rounded-full bg-[#f4c978]/10 blur-md" />
      <div className="relative h-16 w-[2px] bg-[#77828a]/80"><span className="absolute -left-[4px] -top-1 h-2 w-3 rounded-full bg-[#f5cf82] shadow-[0_0_12px_4px_rgba(245,207,130,.7)]" /></div>
    </div>)}
    <div className="comic-sfx absolute bottom-3 left-4 flex items-center gap-2 text-[8px] font-bold tracking-[.18em] text-[#bac8c5]/70"><ThunderboltFilled style={{ color: style.accent }} /> {panel === 0 ? "HUM" : panel === 1 ? "CLICK" : "KEEP WATCH"}</div>
    {panel === 1 && <div className="comic-sfx absolute right-4 top-4 rotate-[-8deg] border-2 border-[#f0c67d] px-2 py-1 text-[9px] font-black tracking-[.18em] text-[#f0c67d]">WATCH!</div>}
  </div>;
}

function ComicPanelCard({ chapter, panel, active, onSelect }: { chapter: ComicChapter; panel: ComicPanel; active: boolean; onSelect: () => void }) {
  const index = chapter.panels.indexOf(panel);
  const sceneLabel = ["ПРИБЫТИЕ", "НАБЛЮДЕНИЕ", "РЕШЕНИЕ"][index] ?? "СЦЕНА";
  return <button type="button" onClick={onSelect} aria-label={`Открыть панель ${index + 1}: ${panel.title}`} style={{ animationDelay: `${index * 120}ms` }} className={`comic-panel-pop group relative block w-full text-left transition duration-200 ${active ? "z-10 -translate-y-1 rotate-[-.4deg]" : "rotate-[.35deg] opacity-85 hover:-translate-y-0.5 hover:opacity-100"}`}>
    <div className="absolute -inset-1 bg-[#202126] shadow-[7px_8px_0_rgba(0,0,0,.24)]" />
    <div className="relative overflow-hidden bg-[#eee9dc] p-1 text-[#202126]">
      <SceneArt chapter={chapter} panel={index} active={active} />
      <div className="min-h-[190px] p-4 sm:min-h-[210px] sm:p-5">
        <div className="flex items-start justify-between gap-3"><span className="text-[8px] font-black tracking-[.16em] text-[#997949]">{panel.kicker}</span><span className="font-serif text-xl text-[#9d9481]">{String(index + 1).padStart(2, "0")}</span></div>
        <div className="mt-2 inline-block bg-[#202126] px-2 py-1 text-[8px] font-black tracking-[.18em] text-[#f0e8d5]">{sceneLabel}</div>
        <h2 className="mt-3 font-serif text-[27px] leading-[.98] tracking-[-.035em]">{panel.title}</h2>
        <p className="mt-3 text-[12px] leading-5 text-[#5d6061]">{panel.text}</p>
        {panel.speech && <div className="comic-bubble relative mt-4 border-2 border-[#24262a] bg-[#faf6e9] p-3 text-[11px] font-medium leading-4 shadow-[3px_3px_0_#c9bfa9] before:absolute before:-bottom-2 before:left-5 before:h-3 before:w-3 before:rotate-45 before:border-b-2 before:border-r-2 before:border-[#24262a] before:bg-[#faf6e9]">«{panel.speech}»</div>}
      </div>
    </div>
  </button>;
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
    mood: "clear",
    principle: "Сохрани безопасный свет до рассвета.",
    panels: [{ kicker: "НОЧНАЯ ЛИНИЯ", title: level.title, text: level.subtitle }],
  }), [currentIndex, level.id, level.subtitle, level.title]);
  const story = chapter ?? fallback;
  const isLastPanel = panel === story.panels.length - 1;
  const style = moodStyles[story.mood];

  return <main className="min-h-screen overflow-y-auto bg-[#d2c4a8] text-[#202126] selection:bg-[#d6b16e] selection:text-[#11161b]">
    <div className="min-h-screen bg-[radial-gradient(rgba(43,39,34,.13)_1px,transparent_1px)] [background-size:5px_5px]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b-4 border-[#202126] pb-4">
          <button type="button" onClick={onBack} className="group flex items-center gap-3 text-left text-[#202126] transition hover:-translate-y-0.5">
            <span className="grid h-9 w-9 place-items-center border-2 border-[#202126] bg-[#e9dfca] font-serif text-lg shadow-[3px_3px_0_#202126]">N</span>
            <span><strong className="block text-[10px] tracking-[.2em]">NIGHTWATCHER</strong><small className="mt-1 block text-[8px] font-bold tracking-[.16em] text-[#665d50]">RETURN TO DISTRICTS</small></span>
          </button>
          <div className="hidden items-center gap-3 sm:flex"><span className="text-[9px] font-bold tracking-[.18em] text-[#665d50]">FIELD COMIC</span><Progress percent={Math.round(((currentIndex + 1) / Math.max(1, levels.length)) * 100)} showInfo={false} strokeColor="#202126" railColor="rgba(32,33,38,.18)" size="small" className="w-28" /></div>
        </header>

        <section className="flex flex-1 flex-col py-8 lg:py-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div><div className="mb-3 flex items-center gap-2"><Tag color={style.accent}>{story.chapter}</Tag><span className="text-[9px] font-bold tracking-[.2em] text-[#665d50]">{level.id.replaceAll("-", " ")}</span></div><h1 className="comic-title-slam max-w-4xl font-serif text-5xl leading-[.88] tracking-[-.05em] sm:text-7xl lg:text-8xl">{story.title}</h1><p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-[#665d50] sm:text-base">{story.subtitle}</p></div>
            <div className="max-w-[230px] border-2 border-[#202126] bg-[#eee9dc] p-4 shadow-[5px_5px_0_#202126]"><div className="text-[8px] font-black tracking-[.2em] text-[#997949]">NIGHT LINE / RULE</div><div className="mt-2 font-serif text-lg leading-tight">{story.principle}</div></div>
          </div>

          <div className="grid flex-1 items-start gap-5 md:grid-cols-3 md:gap-6">
            {story.panels.map((item, index) => <div key={`${story.levelId}-${index}`} className="relative md:after:absolute md:after:-right-5 md:after:top-1/2 md:after:h-1 md:after:w-5 md:after:bg-[#202126] md:after:content-[''] last:after:hidden"><ComicPanelCard chapter={story} panel={item} active={panel === index} onSelect={() => setPanel(index)} /></div>)}
          </div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t-4 border-[#202126] pt-5">
            <div><div className="text-[9px] font-black tracking-[.2em]">ПАНЕЛЬ {panel + 1} / {story.panels.length}</div><div className="mt-1 text-[10px] font-medium tracking-[.08em] text-[#665d50]">НАЖМИ НА ПАНЕЛЬ, ЧТОБЫ ПЕРЕКЛЮЧИТЬ ФОКУС</div></div>
            <div className="flex items-center gap-3">
              {panel > 0 && <Button ghost icon={<ArrowLeftOutlined />} onClick={() => setPanel((value) => value - 1)} className="!border-[#202126] !text-[#202126]">Назад</Button>}
              {isLastPanel ? <Button type="primary" icon={<ArrowRightOutlined />} iconPlacement="end" onClick={onStart} className="!h-11 !border-0 !bg-[#202126] !px-5 !font-bold !text-[#f0e8d5]">Принять смену</Button> : <Button type="primary" icon={<ArrowRightOutlined />} iconPlacement="end" onClick={() => setPanel((value) => value + 1)} className="!h-11 !border-0 !bg-[#202126] !px-5 !font-bold !text-[#f0e8d5]">Следующая панель</Button>}
            </div>
          </footer>
        </section>
      </div>
    </div>
  </main>;
}
