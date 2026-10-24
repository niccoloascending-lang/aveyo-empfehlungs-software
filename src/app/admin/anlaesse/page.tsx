'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten } from '@/components/admin/api';
import { Feld, Meldung, Themen, THEMEN_LABEL } from '@/components/admin/ui';

type A = { id?: number; text: string; icon: string; geschenke: string; themen: string; reihenfolge: number; aktiv: number; geteilt?: number };
type G = { id: number; titel: string; icon: string; aktiv: number };

const LEER: A = { text: '', icon: '✨', geschenke: '', themen: '', reihenfolge: 0, aktiv: 1 };

export default function Anlaesse() {
  const { daten, laden } = useDaten<A[]>('/api/admin/anlaesse');
  const gs = useDaten<G[]>('/api/admin/geschenke');
  const [a, setA] = useState<A | null>(null);
  const [fehler, setFehler] = useState('');
  const titel = (id: string) => gs.daten?.find((g) => g.id === Number(id));

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a) return;
    const r = a.id ? await anfrage(`/api/admin/anlaesse/${a.id}`, 'PUT', a) : await anfrage('/api/admin/anlaesse', 'POST', a);
    if (r.error) return setFehler(r.error);
    setA(null);
    setFehler('');
    laden();
  };

  const ids = (a?.geschenke ?? '').split(',').filter(Boolean);
  const setzeGeschenk = (i: number, id: string) => {
    const neu = [...ids];
    neu[i] = id;
    setA({ ...a!, geschenke: neu.filter(Boolean).join(',') });
  };

  return (
    <Shell
      titel="Anlässe"
      aktion={
        <button className="a-btn" onClick={() => setA({ ...LEER, reihenfolge: (daten?.length ?? 0) + 1 })}>
          <Plus size={16} /> Anlass
        </button>
      }
    >
      <Meldung
        art="info"
        text="Der Kunde sieht zuerst „Wem möchtest du etwas schenken? Jemandem, der …“ und tippt einen Anlass an. Dann ist das passende Geschenk ausgewählt. Höchstens 6 Anlässe je Kunde: zuerst die zu seinen Themen, dann die allgemeinen."
      />
      <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {(daten ?? []).map((x) => (
            <button key={x.id} onClick={() => setA(x)} className={`a-karte flex w-full items-start gap-3 text-left hover:border-marke ${a?.id === x.id ? 'border-marke' : ''}`}>
              <span className="text-2xl">{x.icon}</span>
              <span className="flex-1">
                <span className="block font-semibold">
                  … {x.text} {!x.aktiv && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs font-normal">inaktiv</span>}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  → {x.geschenke.split(',').filter(Boolean).map((id) => titel(id)?.titel ?? `#${id}`).join(' · ')}
                </span>
                <span className="block text-xs text-slate-500">
                  {x.themen.split(',').filter(Boolean).map((t) => THEMEN_LABEL[t]).join(', ') || 'alle Kunden'} · {x.geteilt} × darüber verschenkt
                </span>
              </span>
            </button>
          ))}
        </div>
        {a && (
          <form onSubmit={speichern} className="a-karte h-fit space-y-3">
            <h2 className="font-semibold">{a.id ? 'Anlass bearbeiten' : 'Neuer Anlass'}</h2>
            <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
              <Feld label="Symbol">
                <input className="a-input text-center text-xl" value={a.icon} onChange={(e) => setA({ ...a, icon: e.target.value })} />
              </Feld>
              <Feld label="Jemandem, der …">
                <input className="a-input" required value={a.text} onChange={(e) => setA({ ...a, text: e.target.value })} placeholder="gerade umgezogen ist" />
              </Feld>
            </div>
            {[0, 1, 2].map((i) => (
              <Feld key={i} label={i === 0 ? 'Passendes Geschenk (Vorschlag)' : `Alternative ${i} (optional)`}>
                <select className="a-input" value={ids[i] ?? ''} onChange={(e) => setzeGeschenk(i, e.target.value)}>
                  <option value="">{i === 0 ? '– bitte wählen –' : '– keine –'}</option>
                  {(gs.daten ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.titel}
                      {g.aktiv ? '' : ' (inaktiv)'}
                    </option>
                  ))}
                </select>
              </Feld>
            ))}
            <div>
              <span className="a-label">Nur für Kunden mit diesen Themen (leer = alle)</span>
              <Themen wert={a.themen} onChange={(themen) => setA({ ...a, themen })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Feld label="Reihenfolge">
                <input className="a-input" type="number" value={a.reihenfolge} onChange={(e) => setA({ ...a, reihenfolge: Number(e.target.value) })} />
              </Feld>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" checked={!!a.aktiv} onChange={(e) => setA({ ...a, aktiv: e.target.checked ? 1 : 0 })} /> Aktiv
              </label>
            </div>
            <Meldung text={fehler} />
            <div className="flex gap-2">
              <button className="a-btn">Speichern</button>
              <button type="button" className="a-btn2" onClick={() => setA(null)}>
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </Shell>
  );
}
