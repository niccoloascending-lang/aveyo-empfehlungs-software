'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, hochladen, hochladenMitFortschritt, useDaten } from '@/components/admin/api';
import { Feld, Meldung, Themen, THEMEN_LABEL } from '@/components/admin/ui';

type T = { id?: number; name: string; zitat: string | null; video_id: number | null; poster_id: number | null; themen: string; einwilligung: string; aktiv: number; reihenfolge: number };
const LEER: T = { name: '', zitat: '', video_id: null, poster_id: null, themen: '', einwilligung: '', aktiv: 1, reihenfolge: 0 };

export default function Testimonials() {
  const { daten, laden } = useDaten<T[]>('/api/admin/testimonials');
  const [x, setX] = useState<T | null>(null);
  const [fehler, setFehler] = useState('');
  const [prozent, setProzent] = useState<number | null>(null);

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!x) return;
    const r = x.id ? await anfrage(`/api/admin/testimonials/${x.id}`, 'PUT', x) : await anfrage('/api/admin/testimonials', 'POST', x);
    if (r.error) return setFehler(r.error);
    setX(null);
    setFehler('');
    laden();
  };

  const video = async (f?: File) => {
    if (!f || !x) return;
    setFehler('');
    setProzent(0);
    const r = await hochladenMitFortschritt(f, setProzent);
    setProzent(null);
    if (!r.id) return setFehler(r.error ?? 'Upload fehlgeschlagen');
    setX({ ...x, video_id: r.id });
  };

  return (
    <Shell
      titel="Kundenvideos"
      aktion={
        <button className="a-btn" onClick={() => setX({ ...LEER, reihenfolge: (daten?.length ?? 0) + 1 })}>
          <Plus size={16} /> Video
        </button>
      }
    >
      <Meldung
        art="info"
        text="Echte Kunden erzählen in 30–60 Sekunden, was ihnen die Beratung gebracht hat. Nur mit schriftlicher Einwilligung (Recht am eigenen Bild, DSGVO) und ohne Ersparnis- oder Renditeversprechen. Am besten MP4, 720p, 5–15 MB. Auf der Freund-Seite erscheinen bis zu 2 Videos, passend zum Thema des Geschenks."
      />
      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          {(daten ?? []).map((t) => (
            <button key={t.id} onClick={() => setX({ ...t, zitat: t.zitat ?? '' })} className={`a-karte flex w-full gap-3 text-left hover:border-marke ${x?.id === t.id ? 'border-marke' : ''}`}>
              <video src={`/api/datei/${t.video_id}#t=0.5`} preload="metadata" muted className="h-24 w-20 shrink-0 rounded-lg bg-black object-cover" />
              <span>
                <span className="block font-semibold">
                  {t.name} {!t.aktiv && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs font-normal">inaktiv</span>}
                </span>
                {t.zitat && <span className="block text-sm italic text-slate-600">„{t.zitat}“</span>}
                <span className="mt-1 block text-xs text-slate-500">
                  {t.themen.split(',').filter(Boolean).map((k) => THEMEN_LABEL[k]).join(', ') || 'allgemein'} · Einwilligung vom {t.einwilligung}
                </span>
              </span>
            </button>
          ))}
          {daten && !daten.length && <p className="text-sm text-slate-500">Noch keine Videos.</p>}
        </div>
        {x && (
          <form onSubmit={speichern} className="a-karte h-fit space-y-3">
            <h2 className="font-semibold">{x.id ? 'Video bearbeiten' : 'Neues Kundenvideo'}</h2>
            <Feld label="Video (MP4, WebM oder MOV, max. 300 MB)">
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => video(e.target.files?.[0])} />
              {prozent != null && (
                <span className="mt-2 block h-2 w-full rounded-full bg-slate-100">
                  <span className="block h-2 rounded-full bg-marke transition-all" style={{ width: `${prozent}%` }} />
                </span>
              )}
            </Feld>
            {x.video_id && (
              <video src={`/api/datei/${x.video_id}#t=0.5`} poster={x.poster_id ? `/api/datei/${x.poster_id}` : undefined} controls playsInline preload="metadata" className="max-h-80 w-full rounded-xl bg-black" />
            )}
            <Feld label="Vorschaubild (optional)" hinweis="Ohne eigenes Bild zeigt die App ein Standbild aus dem Video.">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = await hochladen(f);
                  if (r.id) setX({ ...x, poster_id: r.id });
                  else setFehler(r.error ?? 'Upload fehlgeschlagen');
                }}
              />
            </Feld>
            <Feld label="Name, wie er angezeigt wird">
              <input className="a-input" required value={x.name} onChange={(e) => setX({ ...x, name: e.target.value })} placeholder="Sarah, selbstständige Designerin" />
            </Feld>
            <Feld label="Ein Satz unter dem Video (optional)">
              <input className="a-input" maxLength={200} value={x.zitat ?? ''} onChange={(e) => setX({ ...x, zitat: e.target.value })} />
            </Feld>
            <div>
              <span className="a-label">Passt zu Geschenken mit diesen Themen (leer = allgemein)</span>
              <Themen wert={x.themen} onChange={(themen) => setX({ ...x, themen })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Feld label="Schriftliche Einwilligung vom *">
                <input className="a-input" type="date" required value={x.einwilligung} onChange={(e) => setX({ ...x, einwilligung: e.target.value })} />
              </Feld>
              <Feld label="Reihenfolge">
                <input className="a-input" type="number" value={x.reihenfolge} onChange={(e) => setX({ ...x, reihenfolge: Number(e.target.value) })} />
              </Feld>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!x.aktiv} onChange={(e) => setX({ ...x, aktiv: e.target.checked ? 1 : 0 })} /> Aktiv (auf Freund-Seiten sichtbar)
            </label>
            <Meldung text={fehler} />
            <div className="flex flex-wrap gap-2">
              <button className="a-btn" disabled={prozent != null}>
                Speichern
              </button>
              <button type="button" className="a-btn2" onClick={() => setX(null)}>
                Abbrechen
              </button>
              {x.id && (
                <button
                  type="button"
                  className="a-btn2 ml-auto text-red-700"
                  onClick={async () => {
                    if (!confirm('Video endgültig entfernen (z. B. bei Widerruf der Einwilligung)?')) return;
                    await anfrage(`/api/admin/testimonials/${x.id}`, 'DELETE');
                    setX(null);
                    laden();
                  }}
                >
                  <Trash2 size={15} /> Entfernen
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </Shell>
  );
}
