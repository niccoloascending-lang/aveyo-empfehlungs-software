'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, hochladen, useDaten } from '@/components/admin/api';
import { Feld, Meldung, Themen, THEMEN_LABEL } from '@/components/admin/ui';

type G = {
  id?: number;
  titel: string;
  akkusativ: string | null;
  kurz: string;
  nutzen: string;
  ablauf: string;
  dauer: string;
  typ: 'termin' | 'download' | 'rechner';
  themen: string;
  icon: string;
  bild_id: number | null;
  datei_id: number | null;
  inhalt: string | null;
  aktiv: number;
  reihenfolge: number;
  geteilt?: number;
};

const LEER: G = { titel: '', akkusativ: '', kurz: '', nutzen: '', ablauf: '', dauer: '', typ: 'termin', themen: '', icon: '🎁', bild_id: null, datei_id: null, inhalt: '', aktiv: 1, reihenfolge: 0 };
const TYP: Record<string, string> = { termin: 'Termin buchen', download: 'Download', rechner: 'Rechner' };

export default function Geschenke() {
  const { daten, laden } = useDaten<G[]>('/api/admin/geschenke');
  const [g, setG] = useState<G | null>(null);
  const [fehler, setFehler] = useState('');

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!g) return;
    const r = g.id ? await anfrage(`/api/admin/geschenke/${g.id}`, 'PUT', g) : await anfrage('/api/admin/geschenke', 'POST', g);
    if (r.error) return setFehler(r.error);
    setG(null);
    setFehler('');
    laden();
  };

  const upload = async (feld: 'bild_id' | 'datei_id', f?: File) => {
    if (!f || !g) return;
    const r = await hochladen(f);
    if (r.error) return setFehler(r.error);
    setG({ ...g, [feld]: r.id! });
  };

  return (
    <Shell
      titel="Geschenke"
      aktion={
        <button className="a-btn" onClick={() => setG({ ...LEER, reihenfolge: (daten?.length ?? 0) + 1 })}>
          <Plus size={16} /> Geschenk
        </button>
      }
    >
      <Meldung
        art="info"
        text="Nur Information, keine Beratung: keine Renditeversprechen, keine Superlative („der beste/einzige“). Nutzen ehrlich und konkret beschreiben. Kunden sehen höchstens 4 Geschenke, passende Themen zuerst."
      />
      <div className="mt-4 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {(daten ?? []).map((x) => (
            <button key={x.id} onClick={() => setG({ ...x, inhalt: x.inhalt ?? '', akkusativ: x.akkusativ ?? '' })} className={`a-karte flex w-full items-start gap-3 text-left hover:border-marke ${g?.id === x.id ? 'border-marke' : ''}`}>
              <span className="text-2xl">{x.icon}</span>
              <span className="flex-1">
                <span className="block font-semibold">
                  {x.titel} {!x.aktiv && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs font-normal">inaktiv</span>}
                </span>
                <span className="block text-sm text-slate-600">{x.kurz}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {TYP[x.typ]} · {x.themen.split(',').filter(Boolean).map((t) => THEMEN_LABEL[t]).join(', ') || 'alle Themen'} · {x.geteilt} × geteilt
                </span>
              </span>
            </button>
          ))}
        </div>
        {g && (
          <form onSubmit={speichern} className="a-karte h-fit space-y-3">
            <h2 className="font-semibold">{g.id ? 'Geschenk bearbeiten' : 'Neues Geschenk'}</h2>
            <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
              <Feld label="Symbol">
                <input className="a-input text-center text-xl" value={g.icon} onChange={(e) => setG({ ...g, icon: e.target.value })} />
              </Feld>
              <Feld label="Titel *">
                <input className="a-input" required value={g.titel} onChange={(e) => setG({ ...g, titel: e.target.value })} placeholder="Kostenloser PKV-Beitragscheck" />
              </Feld>
            </div>
            <Feld label="Im Satz" hinweis="So steht es auf der Freund-Seite und in den Nachrichten: „Lisa schenkt dir …“. Leer = Titel.">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-slate-500">Lisa schenkt dir</span>
                <input className="a-input" value={g.akkusativ ?? ''} onChange={(e) => setG({ ...g, akkusativ: e.target.value })} placeholder="einen kostenlosen PKV-Beitragscheck" />
              </div>
            </Feld>
            <Feld label="Kurzbeschreibung / Nutzenversprechen">
              <input className="a-input" value={g.kurz} onChange={(e) => setG({ ...g, kurz: e.target.value })} placeholder="Zahlst du zu viel? Wir schauen gemeinsam drauf." />
            </Feld>
            <Feld label="Was du bekommst (3 Stichpunkte, je Zeile einer)">
              <textarea className="a-input" rows={3} value={g.nutzen} onChange={(e) => setG({ ...g, nutzen: e.target.value })} />
            </Feld>
            <Feld label="Ablauf (3 Schritte, je Zeile einer)">
              <textarea className="a-input" rows={3} value={g.ablauf} onChange={(e) => setG({ ...g, ablauf: e.target.value })} />
            </Feld>
            <div className="grid gap-3 sm:grid-cols-3">
              <Feld label="Typ">
                <select className="a-input" value={g.typ} onChange={(e) => setG({ ...g, typ: e.target.value as G['typ'] })}>
                  {Object.entries(TYP).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </Feld>
              <Feld label="Dauer">
                <input className="a-input" value={g.dauer} onChange={(e) => setG({ ...g, dauer: e.target.value })} placeholder="30 Minuten" />
              </Feld>
              <Feld label="Reihenfolge">
                <input className="a-input" type="number" value={g.reihenfolge} onChange={(e) => setG({ ...g, reihenfolge: Number(e.target.value) })} />
              </Feld>
            </div>
            <div>
              <span className="a-label">Passt zu Kundenthemen</span>
              <Themen wert={g.themen} onChange={(themen) => setG({ ...g, themen })} />
            </div>
            <Feld label="Bild (optional, PNG/JPG/WebP)">
              <div className="flex items-center gap-3">
                {g.bild_id && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/datei/${g.bild_id}`} alt="" className="h-12 w-20 rounded object-cover" />
                )}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload('bild_id', e.target.files?.[0])} />
                {g.bild_id && (
                  <button type="button" className="text-xs underline" onClick={() => setG({ ...g, bild_id: null })}>
                    entfernen
                  </button>
                )}
              </div>
            </Feld>
            {g.typ === 'download' && (
              <>
                <Feld label="Datei (PDF) …">
                  <div className="flex items-center gap-3">
                    {g.datei_id && (
                      <a className="text-sm underline" href={`/api/datei/${g.datei_id}`} target="_blank" rel="noreferrer">
                        aktuelle Datei
                      </a>
                    )}
                    <input type="file" accept="application/pdf" onChange={(e) => upload('datei_id', e.target.files?.[0])} />
                  </div>
                </Feld>
                <Feld label="… oder Inhalt als druckbare Seite" hinweis="# Überschrift, ## Zwischenüberschrift, - Aufzählung. Wird genutzt, wenn keine Datei hochgeladen ist.">
                  <textarea className="a-input font-mono text-xs" rows={10} value={g.inhalt ?? ''} onChange={(e) => setG({ ...g, inhalt: e.target.value })} />
                </Feld>
              </>
            )}
            {g.typ === 'rechner' && <p className="text-sm text-slate-600">Eingebaut: Rentenlücken-Rechner (vereinfachte Modellrechnung, Annahmen werden angezeigt).</p>}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!g.aktiv} onChange={(e) => setG({ ...g, aktiv: e.target.checked ? 1 : 0 })} /> Aktiv (für Kunden sichtbar)
            </label>
            <Meldung text={fehler} />
            <div className="flex gap-2">
              <button className="a-btn">Speichern</button>
              <button type="button" className="a-btn2" onClick={() => setG(null)}>
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </Shell>
  );
}
