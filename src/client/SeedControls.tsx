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
  const values = new Uint32Array(2);
  window.crypto.getRandomValues(values);
  return [...values].map((value) => value.toString(36)).join("").slice(0, 10);
}

export default function SeedControls({ seed, disabled, loading, error, onGenerate }: SeedControlsProps) {
  const [draft, setDraft] = useState(seed);
  const [inputError, setInputError] = useState<string | null>(null);
  function generate() {
    const value = draft.trim();
    if (!value || value.length > 64) {
      setInputError("Use 1–64 characters.");
      return;
    }
    setInputError(null);
    onGenerate(value);
  }
  return (
    <div className="seed-controls">
      <label htmlFor="level-seed">WORLD SEED</label>
      <div className="seed-input-row">
        <input id="level-seed" maxLength={64} value={draft} disabled={disabled || loading} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") generate(); }} />
        <button className="seed-random" type="button" disabled={disabled || loading} onClick={() => { setDraft(makeRandomSeed()); setInputError(null); }} aria-label="Create random seed">↻</button>
        <button className="seed-generate" type="button" disabled={disabled || loading} onClick={generate}>{loading ? "BUILDING…" : "GENERATE"}</button>
      </div>
      {(inputError || error) && <div className="seed-error">{inputError ?? error}</div>}
      {disabled && <div className="seed-note">Finish or restart the current shift to change the seed.</div>}
    </div>
  );
}
