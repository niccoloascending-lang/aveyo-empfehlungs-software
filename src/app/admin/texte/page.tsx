'use client';
import { useMemo, useState } from 'react';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten } from '@/components/admin/api';
import { Meldung } from '@/components/admin/ui';

type T = { key: string; bereich: string; beschreibung: string; rechtlich: boolean; lang: boolean; standardDu: string; standardSie: string | null; du: string | null; sie: string | null };

export default function Texte() {
  const { daten, laden } = useDaten<T[]>('/api/admin/texte');
  const [bereich, setBereich] = useState('Freund');
  const [suche, setSuche] = useState('');
  const bereiche = useMemo(() => [...new Set((daten ?? []).map((t) => t.bereich))], [daten]);
  const liste = (daten ?? []).filter(
    (t) => (suche ? `${t.key} ${t.beschreibung} ${t.du ?? t.standardDu}`.toLowerCase().includes(suche.toLowerCase()) : t.bereich === bereich),
  );
  return (
    <Shell titel="Texte">
      <Meldung
        art="info"
        text="Alle Texte, die Kunden und Freunde sehen. Leer lassen = Standardtext. Platzhalter in {geschweiften Klammern} bitte beibehalten. Mit ⚖️ markierte Texte vor dem Livegang juristisch prüfen lassen."
      />
      <div className="my-4 flex flex-wrap items-center gap-2">
        {bereiche.map((b) => (
          <button key={b} onClick={() => { setBereich(b); setSuche(''); }} className={`rounded-full border px-3 py-1.5 text-sm ${!suche && bereich === b ? 'border-marke bg-marke-hell' : 'border-slate-300 bg-white'}`}>
            {b}
          </button>
        ))}
        <input className="a-input ml-auto w-56" placeholder="Suchen …" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Texte durchsuchen" />
      </div>
      <div className="space-y-3">
        {liste.map((t) => (
          <TextZeile key={t.key} t={t} gespeichert={laden} />
        ))}
      </div>
    </Shell>
  );
}

function TextZeile({ t, gespeichert }: { t: T; gespeichert: () => void }) {
  const [du, setDu] = useState(t.du ?? '');
  const [sie, setSie] = useState(t.sie ?? '');
  const [ok, setOk] = useState('');
  const geaendert = du !== (t.du ?? '') || sie !== (t.sie ?? '');
  const rows = t.lang ? 8 : 2;
  return (
    <div className="a-karte space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">
          {t.rechtlich && <span title="Juristisch prüfen">⚖️ </span>}
          {t.beschreibung}
        </p>
        <code className="text-xs text-slate-400">{t.key}</code>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <label className="block">
          <span className="a-label">Du-Form</span>
          <textarea className="a-input" rows={rows} placeholder={t.standardDu} value={du} onChange={(e) => setDu(e.target.value)} />
        </label>
        <label className="block">
          <span className="a-label">Sie-Form {t.standardSie ? '' : '(leer = wie Du-Form)'}</span>
          <textarea className="a-input" rows={rows} placeholder={t.standardSie ?? t.standardDu} value={sie} onChange={(e) => setSie(e.target.value)} />
        </label>
      </div>
      {geaendert && (
        <button
          className="a-btn"
          onClick={async () => {
            const r = await anfrage('/api/admin/texte', 'PUT', { key: t.key, du, sie });
            setOk(r.error ?? 'Gespeichert');
            gespeichert();
          }}
        >
          Speichern
        </button>
      )}
      {(t.du || t.sie) && !geaendert && (
        <button
          className="text-xs text-slate-500 underline"
          onClick={async () => {
            await anfrage('/api/admin/texte', 'PUT', { key: t.key, du: '', sie: '' });
            setDu('');
            setSie('');
            gespeichert();
          }}
        >
          Auf Standard zurücksetzen
        </button>
      )}
      <Meldung text={ok} art="ok" />
    </div>
  );
}
