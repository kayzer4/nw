"use client";

import { useState } from "react";

interface SeedControlsProps {
  seed: string;
  disabled: boolean;
  loading: boolean;
  error: string | null;
  onGenerate: (seed: string) => void;
}

function makeRandomSeed() {
  const value = new Uint32Array(1);
  window.crypto.getRandomValues(value);
  return String(value[0]);
}

export default function SeedControls({ seed, disabled, loading, error, onGenerate }: SeedControlsProps) {
  const [draft, setDraft] = useState(seed);
  const [inputError, setInputError] = useState<string | null>(null);
  function generate() {
    const value = draft.trim();
    if (!/^\d{1,10}$/.test(value) || Number(value) > 4_294_967_295) {
      setInputError("Use a number from 0 to 4294967295.");
      return;
    }
    setInputError(null);
    onGenerate(value);
  }
  return (
    <div className="seed-controls">
      <label htmlFor="level-seed">WORLD SEED</label>
      <div className="seed-input-row">
        <input id="level-seed" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={draft} disabled={disabled || loading} onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") generate(); }} />
        <button className="seed-random" type="button" disabled={disabled || loading} onClick={() => { setDraft(makeRandomSeed()); setInputError(null); }} aria-label="Create random seed">↻</button>
        <button className="seed-generate" type="button" disabled={disabled || loading} onClick={generate}>{loading ? "BUILDING…" : "GENERATE"}</button>
      </div>
      {(inputError || error) && <div className="seed-error">{inputError ?? error}</div>}
      {disabled && <div className="seed-note">Finish or restart the current shift to change the seed.</div>}
    </div>
  );
}
