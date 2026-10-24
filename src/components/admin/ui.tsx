'use client';
import { useState } from 'react';

export function Feld({ label, children, hinweis, className = '' }: { label: string; children: React.ReactNode; hinweis?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="a-label">{label}</span>
      {children}
      {hinweis && <span className="mt-1 block text-xs text-slate-500">{hinweis}</span>}
    </label>
  );
}

export function Meldung({ text, art = 'fehler' }: { text: string; art?: 'fehler' | 'ok' | 'info' }) {
  if (!text) return null;
  const c = art === 'fehler' ? 'bg-red-50 text-red-800' : art === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900';
  return (
    <p role={art === 'fehler' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${c}`}>
      {text}
    </p>
  );
}

export function KopierKnopf({ text, label = 'Kopieren' }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="a-btn2"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          /* Browser ohne Zwischenablage */
        }
      }}
    >
      {ok ? '✓ Kopiert' : label}
    </button>
  );
}

export const STATUS_FARBE: Record<string, string> = {
  neu: 'bg-sky-100 text-sky-800',
  termin: 'bg-amber-100 text-amber-900',
  beratung: 'bg-violet-100 text-violet-800',
  kunde: 'bg-emerald-100 text-emerald-800',
  kein_interesse: 'bg-slate-200 text-slate-700',
};

export const THEMEN_LABEL: Record<string, string> = { pkv: 'PKV', vorsorge: 'Vorsorge', vermoegen: 'Vermögen', immobilien: 'Immobilien' };

export function Themen({ wert, onChange }: { wert: string; onChange: (v: string) => void }) {
  const an = new Set(wert.split(',').filter(Boolean));
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(THEMEN_LABEL).map(([k, l]) => (
        <button
          key={k}
          type="button"
          aria-pressed={an.has(k)}
          onClick={() => {
            an.has(k) ? an.delete(k) : an.add(k);
            onChange([...an].join(','));
          }}
          className={`rounded-full border px-3 py-1.5 text-sm ${an.has(k) ? 'border-marke bg-marke-hell text-marke-dunkel' : 'border-slate-300 bg-white'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
