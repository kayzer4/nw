"use client";

import dynamic from "next/dynamic";
import type { LevelSummary } from "@/game/level";

const ControlRoomScene = dynamic(() => import("./ControlRoomScene"), {
  ssr: false,
  loading: () => <div className="control-room-loading">BOOTING CONTROL ROOM…</div>,
});

export default function LevelPicker(props: {
  levels: LevelSummary[];
  completedIds: readonly string[];
  loadingId: string | null;
  error: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
}) {
  return <main className="control-room-3d">
    <ControlRoomScene {...props} />
    <div className="control-room-3d-brand"><span>N</span><strong>NIGHTWATCHER</strong><small>AFTER HOURS DIVISION</small></div>
    <div className="control-room-3d-hint">CLICK A FILE ON THE CENTRAL MONITOR <i /> SELECT A DISTRICT</div>
    <div className="control-room-3d-footer"><span><b /> NIGHT LINE IS LISTENING</span><span>02:13:08 / GRID ONLINE</span></div>
  </main>;
}
