'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, QrCode, X, ShieldCheck, PlayCircle, Heart } from 'lucide-react';
import { baueNachricht, TOENE, type Kanal, type Ton } from '@/lib/teilen';
import { fuelle } from '@/lib/texte';
import type { EmpfehlerDaten } from '@/lib/empfehler';
import TeilenKnoepfe from './TeilenKnoepfe';
import { Avatar } from './Bild';

type Teilung = { code: string; link: string; vorlage: string };

async function api(url: string, method: string, body: unknown) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({}));
}

const FUNKEN = Array.from({ length: 14 }, (_, i) => {
  const w = (i / 14) * Math.PI * 2;
  return { dx: `${Math.cos(w) * (60 + (i % 3) * 25)}px`, dy: `${Math.sin(w) * (60 + (i % 3) * 25)}px`, d: `${(i % 4) * 0.04}s` };
});

export default function EmpfehlerApp({ token, daten }: { token: string; daten: EmpfehlerDaten }) {
  const { t, geschenke, wirkung } = daten;
  const [geschenkId, setGeschenkId] = useState<number | null>(geschenke[0]?.id ?? null);
  const [zitat, setZitat] = useState('');
  const [ton, setTon] = useState<Ton>('locker');
  const [teilung, setTeilung] = useState<Teilung | null>(null);
  const [nachricht, setNachricht] = useState('');
  const [bearbeitet, setBearbeitet] = useState(false);
  const [vorschau, setVorschau] = useState(false);
  const [qr, setQr] = useState(false);
  const [geteilt, setGeteilt] = useState(false);
  const [moment, setMoment] = useState(wirkung.neuSeit > 0);
  const cache = useRef(new Map<number, Teilung>());
  const zitatTimer = useRef<ReturnType<typeof setTimeout>>();

  const geschenk = geschenke.find((g) => g.id === geschenkId);
  const vorschlaege = t['kunde.zitat.vorschlaege'].split('|').map((s) => s.trim()).filter(Boolean);

  const neuBauen = useCallback(
    (vorlage: string, link: string, z = zitat) =>
      setNachricht(baueNachricht(vorlage, { geschenk: geschenk?.titel ?? '', geschenkSatz: geschenk?.satz, link, absender: daten.vorname, zitat: z })),
    [geschenk?.titel, geschenk?.satz, daten.vorname, zitat],
  );

  // Persönlichen Link für das gewählte Geschenk holen (einmal je Geschenk)
  useEffect(() => {
    if (!geschenkId) return;
    const vorhanden = cache.current.get(geschenkId);
    if (vorhanden) {
      setTeilung(vorhanden);
      return;
    }
    let ab = false;
    setTeilung(null);
    api(`/api/k/${token}/teilung`, 'POST', { geschenkId, ton, zitat }).then((r) => {
      if (ab || !r.ok) return;
      const neu = { code: r.code, link: r.link, vorlage: r.vorlage };
      cache.current.set(geschenkId, neu);
      setTeilung(neu);
    });
    return () => {
      ab = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geschenkId, token]);

  // Text neu aufbauen, wenn Link/Geschenk wechselt (eigene Änderungen gehen dabei bewusst verloren)
  useEffect(() => {
    if (!teilung) return;
    neuBauen(teilung.vorlage, teilung.link);
    setBearbeitet(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teilung]);

  const zitatAendern = (z: string) => {
    setZitat(z);
    if (!teilung) return;
    if (!bearbeitet) neuBauen(teilung.vorlage, teilung.link, z);
    clearTimeout(zitatTimer.current);
    const code = teilung.code;
    zitatTimer.current = setTimeout(() => api(`/api/k/${token}/teilung`, 'PATCH', { code, zitat: z }), 500);
  };

  const tonAendern = async (neu: Ton) => {
    setTon(neu);
    if (!teilung) return;
    const r = await api(`/api/k/${token}/teilung`, 'PATCH', { code: teilung.code, ton: neu });
    if (r.ok && r.vorlage) {
      const aktual = { ...teilung, vorlage: r.vorlage };
      cache.current.set(geschenkId!, aktual);
      setTeilung(aktual);
    }
  };

  const zitatSichern = async () => {
    clearTimeout(zitatTimer.current);
    if (teilung) await api(`/api/k/${token}/teilung`, 'PATCH', { code: teilung.code, zitat });
  };

  const melden = (kanal: Kanal) => {
    if (!teilung) return;
    clearTimeout(zitatTimer.current);
    api(`/api/k/${token}/teilung`, 'PATCH', { code: teilung.code, zitat });
    const body = JSON.stringify({ code: teilung.code, kanal, bearbeitet });
    if (!navigator.sendBeacon?.(`/api/k/${token}/geteilt`, body)) fetch(`/api/k/${token}/geteilt`, { method: 'POST', body, keepalive: true });
    setGeteilt(true);
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-6">
      {moment && (
        <div role="status" className="anim-pop relative mt-4 flex items-center justify-between gap-3 rounded-2xl bg-marke px-4 py-3 font-semibold text-white">
          <span>{t['kunde.wirkung.moment']}</span>
          <button type="button" aria-label="Schließen" onClick={() => setMoment(false)} className="rounded-lg p-1 hover:bg-white/15">
            <X size={18} aria-hidden />
          </button>
        </div>
      )}

      {/* Begrüßung */}
      <section className="anim-hoch mt-6 flex items-start gap-4">
        {daten.berater && <Avatar name={daten.berater.name} fotoId={daten.berater.foto_id} groesse={60} />}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{fuelle(t['kunde.titel'], { vorname: daten.vorname })}</h1>
          <p className="mt-1 leading-relaxed text-tinte/80">{t['kunde.begruessung']}</p>
          {daten.berater && <p className="mt-1 text-sm font-medium text-marke-dunkel">– {daten.berater.name}</p>}
          {daten.berater?.video_url && (
            <a href={daten.berater.video_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
              <PlayCircle size={16} aria-hidden /> {t['kunde.video']}
            </a>
          )}
        </div>
      </section>

      {!geschenke.length ? (
        <p className="karte mt-8 p-6 text-center">{t['kunde.keine.geschenke']}</p>
      ) : (
        <>
          {/* 1. Geschenk wählen */}
          <section className="mt-8" aria-labelledby="s1">
            <h2 id="s1" className="text-lg font-bold">
              <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-marke text-sm text-white">1</span>
              {t['kunde.schritt1']}
            </h2>
            <p className="mt-1 text-sm text-tinte/70">{t['kunde.schritt1.hinweis']}</p>
            <div role="radiogroup" aria-labelledby="s1" className="mt-3 grid gap-3 sm:grid-cols-2">
              {geschenke.map((g) => {
                const an = g.id === geschenkId;
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={an}
                    onClick={() => {
                      setGeschenkId(g.id);
                      setGeteilt(false);
                    }}
                    className={`karte flex items-start gap-3 p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-marke/30 ${
                      an ? 'ring-2 ring-marke' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <span aria-hidden className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${an ? 'bg-marke-hell' : 'bg-papier'}`}>
                      {g.icon || '🎁'}
                    </span>
                    <span>
                      <span className="block font-bold leading-snug">{g.titel}</span>
                      {g.kurz && <span className="mt-0.5 block text-sm leading-snug text-tinte/70">{g.kurz}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Eigener Satz */}
          <section className="mt-8" aria-labelledby="s2">
            <h2 id="s2" className="text-lg font-bold">
              <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-marke text-sm text-white">2</span>
              {t['kunde.schritt2']}
            </h2>
            <p className="mt-1 text-sm text-tinte/70">{t['kunde.schritt2.hinweis']}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {vorschlaege.map((v) => (
                <button key={v} type="button" aria-pressed={zitat === v} onClick={() => zitatAendern(zitat === v ? '' : v)} className={`chip ${zitat === v ? 'chip-an' : ''}`}>
                  {v}
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">{t['kunde.schritt2']}</span>
              <input className="eingabe" maxLength={160} placeholder={t['kunde.zitat.platzhalter']} value={zitat} onChange={(e) => zitatAendern(e.target.value)} />
            </label>
          </section>

          {/* 3. Verschenken */}
          <section className="mt-8" aria-labelledby="s3">
            <h2 id="s3" className="text-lg font-bold">
              <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-marke text-sm text-white">3</span>
              {t['kunde.schritt3']}
            </h2>
            <p className="mt-3 text-sm font-medium text-tinte/80">{t['kunde.ton']}</p>
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-karte" role="radiogroup" aria-label={t['kunde.ton']}>
              {TOENE.map((x) => (
                <button
                  key={x}
                  type="button"
                  role="radio"
                  aria-checked={ton === x}
                  onClick={() => tonAendern(x)}
                  className={`min-h-[44px] rounded-xl text-sm font-semibold transition ${ton === x ? 'bg-marke text-white' : 'text-tinte/80 hover:bg-marke-hell/60'}`}
                >
                  {t[`kunde.ton.${x}`]}
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Nachricht</span>
              <textarea
                className="eingabe min-h-[120px] leading-relaxed"
                value={nachricht}
                disabled={!teilung}
                onChange={(e) => {
                  setNachricht(e.target.value);
                  setBearbeitet(true);
                }}
              />
            </label>
            <p className="mt-1.5 text-xs text-tinte/70">{t['kunde.nachricht.hinweis']}</p>

            <button
              type="button"
              disabled={!teilung}
              onClick={async () => {
                await zitatSichern();
                setVorschau(true);
              }}
              className="knopf-zweit mt-4 w-full"
            >
              <Eye size={18} aria-hidden /> {t['kunde.vorschau.button']}
            </button>

            <div className="relative mt-4">
              {geteilt && (
                <div aria-hidden className="pointer-events-none absolute left-1/2 top-6 z-10">
                  {FUNKEN.map((f, i) => (
                    <span
                      key={i}
                      className="funke"
                      style={{ ['--dx' as string]: f.dx, ['--dy' as string]: f.dy, animationDelay: f.d, background: i % 2 ? 'rgb(var(--akzent))' : 'rgb(var(--marke))' }}
                    />
                  ))}
                </div>
              )}
              <TeilenKnoepfe t={t} nachricht={nachricht} link={teilung?.link ?? ''} betreff={geschenk?.titel} deaktiviert={!teilung} onGeteilt={melden} />
            </div>
            {geteilt && (
              <p role="status" className="anim-pop mt-1 rounded-2xl bg-marke-hell px-4 py-3 text-center font-semibold text-marke-dunkel">
                {t['kunde.teilen.erfolg']}
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 text-sm text-tinte/80">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-marke" aria-hidden /> {t['kunde.versprechen']}
            </p>

            <div className="mt-5">
              <button
                type="button"
                disabled={!teilung}
                aria-expanded={qr}
                onClick={() => {
                  setQr(!qr);
                  if (!qr && teilung) navigator.sendBeacon?.(`/api/k/${token}/geteilt`, JSON.stringify({ code: teilung.code, kanal: 'qr', bearbeitet: false }));
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-marke-dunkel underline underline-offset-4"
              >
                <QrCode size={18} aria-hidden /> {t['kunde.qr.titel']}
              </button>
              {qr && teilung && (
                <div className="anim-pop karte mt-3 p-5 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/k/${token}/qr?code=${teilung.code}`} alt="QR-Code zum Geschenk" className="mx-auto h-56 w-56" />
                  <p className="mt-2 font-medium">{t['kunde.qr.hinweis']}</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Meine Wirkung */}
      <section className="karte mt-10 p-5" aria-labelledby="wirkung">
        <h2 id="wirkung" className="text-lg font-bold">
          {t['kunde.wirkung.titel']}
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            [wirkung.verschenkt, t['kunde.wirkung.geteilt']],
            [wirkung.geoeffnet, t['kunde.wirkung.geoeffnet']],
            [wirkung.eingeloest, t['kunde.wirkung.eingeloest']],
          ].map(([n, label]) => (
            <div key={String(label)} className="rounded-2xl bg-papier px-2 py-3">
              <dd className="text-3xl font-extrabold text-marke-dunkel">{n}</dd>
              <dt className="text-xs font-medium text-tinte/70">{label}</dt>
            </div>
          ))}
        </dl>
        {wirkung.personen.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {wirkung.personen.map((p, i) => (
              <li key={i} className="flex items-center gap-2">
                <Heart size={16} className="text-marke" aria-hidden /> {fuelle(t['kunde.wirkung.person'], { name: p.name, geschenk: p.geschenk })}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-tinte/70">{wirkung.verschenkt + wirkung.geoeffnet === 0 ? t['kunde.wirkung.leer'] : t['kunde.wirkung.namen']}</p>
      </section>

      {daten.dankeSichtbar && <DankeBereich token={token} daten={daten} />}

      {vorschau && teilung && (
        <div role="dialog" aria-modal="true" aria-label={t['kunde.vorschau.button']} className="fixed inset-0 z-50 flex flex-col bg-tinte/70 backdrop-blur-sm">
          <div className="flex items-center justify-end p-2">
            <button type="button" onClick={() => setVorschau(false)} className="knopf bg-white text-tinte" autoFocus>
              <X size={18} aria-hidden /> {t['kunde.vorschau.schliessen']}
            </button>
          </div>
          <iframe title={t['kunde.vorschau.button']} src={`/k/${token}/vorschau?code=${teilung.code}`} className="mx-auto w-full max-w-xl flex-1 rounded-t-3xl bg-papier" />
        </div>
      )}
    </main>
  );
}

function DankeBereich({ token, daten }: { token: string; daten: EmpfehlerDaten }) {
  const { t } = daten;
  const [gewaehlt, setGewaehlt] = useState<Record<number, string>>(Object.fromEntries(daten.dankeschoens.map((d) => [d.id, d.spende_zweck ?? ''])));
  const waehlen = async (id: number, zweck: string) => {
    const r = await api(`/api/k/${token}/spende`, 'POST', { id, zweck });
    if (r.ok) setGewaehlt({ ...gewaehlt, [id]: zweck });
  };
  return (
    <section className="karte anim-hoch mt-6 p-5" aria-labelledby="danke">
      <h2 id="danke" className="text-lg font-bold">
        {t['kunde.danke.titel']} 💛
      </h2>
      <p className="mt-2 leading-relaxed text-tinte/80">{t['kunde.danke.text']}</p>
      {daten.dankeschoens.map((d) => (
        <div key={d.id} className="mt-4 rounded-2xl bg-marke-hell/60 p-4">
          <p className="font-semibold">{fuelle(t[`belohnung.${d.art}.titel`] ?? '', { berater: daten.berater?.name ?? '' })}</p>
          <p className="mt-1 text-sm">{fuelle(t[`belohnung.${d.art}.text`] ?? '', { berater: daten.berater?.name ?? '' })}</p>
          {d.art === 'spende' &&
            (gewaehlt[d.id] ? (
              <p className="mt-3 text-sm font-semibold text-marke-dunkel">
                ✓ {gewaehlt[d.id]} · {t['kunde.danke.spende.danke']}
              </p>
            ) : (
              <div className="mt-3">
                <p className="text-sm font-medium">{t['kunde.danke.spende.frage']}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {daten.spendenZwecke.map((z) => (
                    <button key={z} type="button" className="chip" onClick={() => waehlen(d.id, z)}>
                      {z}
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ))}
    </section>
  );
}
