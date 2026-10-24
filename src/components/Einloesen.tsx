'use client';
import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, MapPin, Video, Calculator, Gift } from 'lucide-react';
import { fuelle } from '@/lib/texte';
import { nachTag } from '@/lib/slots';
import { pruefeEingabe, rentenluecke, euro, RECHNER_STANDARD, type RechnerEingabe, type RechnerErgebnis } from '@/lib/rechner';
import { baueNachricht } from '@/lib/teilen';
import TeilenKnoepfe from './TeilenKnoepfe';

type T = Record<string, string>;
type Props = {
  code: string;
  typ: 'termin' | 'download' | 'rechner';
  titel: string;
  satz: string;
  empfehler: string;
  t: T;
  vorschau: boolean;
  orte: ('online' | 'hamburg')[];
  terminExtern: string | null;
};

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, ...j } as { ok: boolean; fehler?: string; [k: string]: any };
}

export default function Einloesen(p: Props) {
  const [eingeloest, setEingeloest] = useState(false);
  return (
    <div className="mt-4">
      {p.vorschau && <p className="mb-4 rounded-2xl bg-marke-hell px-4 py-3 text-sm font-medium text-marke-dunkel">{p.t['freund.vorschau.inaktiv']}</p>}
      <fieldset disabled={p.vorschau} className="min-w-0">
        {p.typ === 'termin' && <TerminFlow {...p} onFertig={() => setEingeloest(true)} />}
        {p.typ === 'download' && <DownloadFlow {...p} onFertig={() => setEingeloest(true)} />}
        {p.typ === 'rechner' && <RechnerFlow {...p} onFertig={() => setEingeloest(true)} />}
      </fieldset>
      {eingeloest && !p.vorschau && <Weitergeben code={p.code} titel={p.titel} satz={p.satz} t={p.t} />}
    </div>
  );
}

// ---------- gemeinsames Formular (nur eigene Angaben des Freundes) ----------

type Formular = { vorname: string; nachname: string; email: string; telefon: string; datenschutz: boolean; empfehlerInfo: boolean };
const LEER: Formular = { vorname: '', nachname: '', email: '', telefon: '', datenschutz: false, empfehlerInfo: false };

function Felder({ f, setF, t, empfehler, mitNachname = false, mitTelefon = false, vornamePflicht = true }: {
  f: Formular;
  setF: (f: Formular) => void;
  t: T;
  empfehler: string;
  mitNachname?: boolean;
  mitTelefon?: boolean;
  vornamePflicht?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className={mitNachname ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : ''}>
        <label className="block">
          <span className="beschriftung">{t['freund.form.vorname']}</span>
          <input className="eingabe" autoComplete="given-name" required={vornamePflicht} value={f.vorname} onChange={(e) => setF({ ...f, vorname: e.target.value })} />
        </label>
        {mitNachname && (
          <label className="block">
            <span className="beschriftung">{t['freund.form.nachname']}</span>
            <input className="eingabe" autoComplete="family-name" value={f.nachname} onChange={(e) => setF({ ...f, nachname: e.target.value })} />
          </label>
        )}
      </div>
      <label className="block">
        <span className="beschriftung">{t['freund.form.email']}</span>
        <input className="eingabe" type="email" inputMode="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </label>
      {mitTelefon && (
        <label className="block">
          <span className="beschriftung">{t['freund.form.telefon']}</span>
          <input className="eingabe" type="tel" autoComplete="tel" value={f.telefon} onChange={(e) => setF({ ...f, telefon: e.target.value })} />
        </label>
      )}
      <label className="flex cursor-pointer items-start gap-3 py-1 text-sm leading-snug">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--marke))]" required checked={f.datenschutz} onChange={(e) => setF({ ...f, datenschutz: e.target.checked })} />
        <span>
          {t['freund.einwilligung.datenschutz']}{' '}
          <a href="/info/datenschutz" target="_blank" className="underline underline-offset-2">
            {t['footer.datenschutz']}
          </a>
        </span>
      </label>
      {empfehler && (
        // Freiwillig und NICHT vorausgewählt
        <label className="flex cursor-pointer items-start gap-3 py-1 text-sm leading-snug">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--marke))]" checked={f.empfehlerInfo} onChange={(e) => setF({ ...f, empfehlerInfo: e.target.checked })} />
          <span>{fuelle(t['freund.einwilligung.empfehler'], { empfehler })}</span>
        </label>
      )}
    </div>
  );
}

const Fehler = ({ text }: { text: string }) =>
  text ? (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
      {text}
    </p>
  ) : null;

const Erfolg = ({ text }: { text: string }) => (
  <div role="status" className="anim-pop rounded-2xl bg-marke-hell p-5 text-center">
    <p className="text-3xl" aria-hidden>
      🎁
    </p>
    <p className="mt-2 text-lg font-semibold text-marke-dunkel">{text}</p>
  </div>
);

// ---------- Termin ----------

function TerminFlow({ code, t, empfehler, orte, terminExtern, vorschau, onFertig }: Props & { onFertig: () => void }) {
  const [ort, setOrt] = useState<'online' | 'hamburg'>(orte[0] ?? 'online');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState('');
  const [tag, setTag] = useState(0);
  const [f, setF] = useState<Formular>(LEER);
  const [fehler, setFehler] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [fertig, setFertig] = useState(false);

  useEffect(() => {
    if (terminExtern) return;
    fetch(`/api/g/${code}/termine`)
      .then((r) => r.json())
      .then((j) => setSlots(j.slots ?? []))
      .catch(() => setSlots([]));
  }, [code, terminExtern]);

  const tage = useMemo(() => nachTag(slots ?? []), [slots]);

  if (terminExtern)
    return (
      <a
        href={vorschau ? undefined : terminExtern}
        target="_blank"
        rel="noopener noreferrer"
        className={`knopf-haupt w-full ${vorschau ? 'pointer-events-none opacity-60' : ''}`}
        onClick={() => onFertig()}
      >
        {t['freund.termin.extern']}
      </a>
    );

  if (fertig) return <Erfolg text={t['freund.termin.danke']} />;

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler('');
    if (!f.vorname.trim() || !f.email.trim() || !f.datenschutz) return setFehler(t['freund.form.pflicht']);
    setLaeuft(true);
    const r = await post(`/api/g/${code}/anfrage`, { typ: 'termin', termin_start: slot, termin_ort: ort, ...f });
    setLaeuft(false);
    if (!r.ok) {
      setFehler(r.fehler ?? 'Das hat nicht geklappt. Bitte versuch es noch einmal.');
      if (r.belegt) {
        setSlot('');
        setSlots((s) => (s ?? []).filter((x) => x !== slot));
      }
      return;
    }
    setFertig(true);
    onFertig();
  };

  return (
    <form onSubmit={absenden} className="space-y-5">
      {orte.length > 1 && (
        <div>
          <p className="beschriftung">{t['freund.termin.ort']}</p>
          <div className="grid grid-cols-2 gap-2">
            {orte.map((o) => (
              <button key={o} type="button" aria-pressed={ort === o} onClick={() => setOrt(o)} className={`chip justify-center gap-2 ${ort === o ? 'chip-an' : ''}`}>
                {o === 'online' ? <Video size={16} aria-hidden /> : <MapPin size={16} aria-hidden />}
                {o === 'online' ? t['freund.termin.ort.online'] : t['freund.termin.ort.hamburg']}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="beschriftung">{t['freund.termin.slot']}</p>
        {slots === null ? (
          <p className="flex items-center gap-2 text-tinte/70">
            <Loader2 className="animate-spin" size={16} aria-hidden /> …
          </p>
        ) : tage.length === 0 ? (
          <p className="text-tinte/80">{t['freund.termin.keine.slots']}</p>
        ) : (
          <>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Tag">
              {tage.slice(0, 14).map((d, i) => (
                <button
                  key={d.tag}
                  type="button"
                  role="tab"
                  aria-selected={tag === i}
                  onClick={() => setTag(i)}
                  className={`chip shrink-0 whitespace-nowrap ${tag === i ? 'chip-an' : ''}`}
                >
                  {d.tag}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(tage[tag]?.slots ?? []).map((s) => (
                <button
                  key={s.iso}
                  type="button"
                  aria-pressed={slot === s.iso}
                  onClick={() => setSlot(s.iso)}
                  className={`chip justify-center font-semibold ${slot === s.iso ? 'chip-an' : ''}`}
                >
                  {s.zeit}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {slot && (
        <div className="anim-hoch space-y-4">
          <p className="text-sm text-tinte/80">{t['freund.termin.formular']}</p>
          <Felder f={f} setF={setF} t={t} empfehler={empfehler} mitNachname mitTelefon />
          <Fehler text={fehler} />
          <button className="knopf-haupt w-full" disabled={laeuft}>
            {laeuft && <Loader2 className="animate-spin" size={18} aria-hidden />} {t['freund.termin.button']}
          </button>
        </div>
      )}
    </form>
  );
}

// ---------- Download ----------

function DownloadFlow({ code, t, empfehler, vorschau, onFertig }: Props & { onFertig: () => void }) {
  const [geladen, setGeladen] = useState(false);
  const [mailOffen, setMailOffen] = useState(false);
  const [f, setF] = useState<Formular>(LEER);
  const [fehler, setFehler] = useState('');
  const [fertig, setFertig] = useState(false);
  const [laeuft, setLaeuft] = useState(false);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler('');
    if (!f.email.trim() || !f.datenschutz) return setFehler(t['freund.form.pflicht']);
    setLaeuft(true);
    const r = await post(`/api/g/${code}/anfrage`, { typ: 'download_mail', ...f });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.fehler ?? 'Das hat nicht geklappt.');
    setFertig(true);
    onFertig();
  };

  return (
    <div className="space-y-5">
      <a
        href={vorschau ? undefined : `/g/${code}/download`}
        target="_blank"
        rel="noopener"
        aria-disabled={vorschau || undefined}
        className={`knopf-haupt w-full text-lg ${vorschau ? 'pointer-events-none opacity-60' : ''}`}
        onClick={() => {
          setGeladen(true);
          onFertig();
        }}
      >
        <Download size={20} aria-hidden /> {t['freund.download.button']}
      </a>
      {geladen && <p className="anim-pop text-center font-semibold text-marke-dunkel">{t['freund.eingeloest']}</p>}
      <div className="border-t border-tinte/10 pt-4">
        {fertig ? (
          <Erfolg text={t['freund.download.mail.danke']} />
        ) : !mailOffen ? (
          <button type="button" className="knopf-zweit w-full" onClick={() => setMailOffen(true)}>
            {t['freund.download.mail.frage']}
          </button>
        ) : (
          <form onSubmit={absenden} className="anim-hoch space-y-4">
            <p className="text-sm text-tinte/80">{t['freund.download.mail.hinweis']}</p>
            <Felder f={f} setF={setF} t={t} empfehler={empfehler} vornamePflicht={false} />
            <Fehler text={fehler} />
            <button className="knopf-haupt w-full" disabled={laeuft}>
              {t['freund.download.mail.button']}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- Rechner ----------

const FELDER: [keyof RechnerEingabe, string, string][] = [
  ['alter', 'freund.rechner.alter', '1'],
  ['rentenalter', 'freund.rechner.rentenalter', '1'],
  ['netto', 'freund.rechner.netto', '50'],
  ['rente', 'freund.rechner.rente', '50'],
  ['zielProzent', 'freund.rechner.ziel', '5'],
  ['inflation', 'freund.rechner.inflation', '0.5'],
];

function RechnerFlow({ code, t, empfehler, onFertig }: Props & { onFertig: () => void }) {
  const [e, setE] = useState<Record<string, string>>(Object.fromEntries(Object.entries(RECHNER_STANDARD).map(([k, v]) => [k, String(v)])));
  const [erg, setErg] = useState<{ eingabe: RechnerEingabe; ergebnis: RechnerErgebnis } | null>(null);
  const [fehler, setFehler] = useState('');
  const [gezaehlt, setGezaehlt] = useState(false);
  const [wunsch, setWunsch] = useState(false);
  const [mitDaten, setMitDaten] = useState(false);
  const [f, setF] = useState<Formular>(LEER);
  const [fertig, setFertig] = useState(false);

  const rechnen = (ev: React.FormEvent) => {
    ev.preventDefault();
    const r = pruefeEingabe(e);
    if ('fehler' in r) {
      setErg(null);
      return setFehler(r.fehler);
    }
    setFehler('');
    setErg({ eingabe: r.eingabe, ergebnis: rentenluecke(r.eingabe) });
    if (!gezaehlt) {
      // Nur anonym zählen, dass gerechnet wurde. Eingaben bleiben im Browser.
      post(`/api/g/${code}/eingeloest`, { art: 'rechner' });
      setGezaehlt(true);
      onFertig();
    }
  };

  const auswertung = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFehler('');
    if (!f.vorname.trim() || !f.email.trim() || !f.datenschutz) return setFehler(t['freund.form.pflicht']);
    const r = await post(`/api/g/${code}/anfrage`, { typ: 'auswertung', ...f, daten: mitDaten && erg ? erg.eingabe : null });
    if (!r.ok) return setFehler(r.fehler ?? 'Das hat nicht geklappt.');
    setFertig(true);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={rechnen} className="grid grid-cols-2 gap-3">
        {FELDER.map(([k, label, step]) => (
          <label key={k} className={`block ${k === 'rente' || k === 'netto' ? 'col-span-2' : ''}`}>
            <span className="beschriftung">{t[label]}</span>
            <input className="eingabe" inputMode="decimal" type="number" step={step} value={e[k]} onChange={(x) => setE({ ...e, [k]: x.target.value })} />
          </label>
        ))}
        <div className="col-span-2">
          <Fehler text={!erg ? fehler : ''} />
          <button className="knopf-haupt mt-1 w-full">
            <Calculator size={18} aria-hidden /> {t['freund.rechner.button']}
          </button>
        </div>
      </form>
      {erg && (
        <div className="anim-pop space-y-3 rounded-2xl bg-marke-hell p-5" aria-live="polite">
          <h3 className="font-bold">{t['freund.rechner.ergebnis']}</h3>
          <p>
            <span className="block text-sm text-tinte/80">{t['freund.rechner.luecke']}</span>
            <span className="text-3xl font-extrabold text-marke-dunkel">{euro(erg.ergebnis.lueckeHeute)}</span>
          </p>
          {erg.ergebnis.lueckeHeute > 0 && (
            <p>
              <span className="block text-sm text-tinte/80">{t['freund.rechner.luecke.spaeter']}</span>
              <span className="text-xl font-bold">{euro(erg.ergebnis.lueckeBeiRentenbeginn)}</span>
            </p>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">{t['freund.rechner.annahmen']}</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {erg.ergebnis.annahmen.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </details>
          <p className="text-xs text-tinte/70">{t['freund.rechner.hinweis']}</p>
        </div>
      )}
      {erg && (
        <div className="border-t border-tinte/10 pt-4">
          {fertig ? (
            <Erfolg text={t['freund.rechner.auswertung.danke']} />
          ) : !wunsch ? (
            <button type="button" className="knopf-zweit w-full" onClick={() => setWunsch(true)}>
              {t['freund.rechner.auswertung.frage']}
            </button>
          ) : (
            <form onSubmit={auswertung} className="anim-hoch space-y-4">
              <Felder f={f} setF={setF} t={t} empfehler={empfehler} />
              <label className="flex cursor-pointer items-start gap-3 py-1 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[rgb(var(--marke))]" checked={mitDaten} onChange={(x) => setMitDaten(x.target.checked)} />
                <span>{t['freund.rechner.mitsenden']}</span>
              </label>
              <Fehler text={fehler} />
              <button className="knopf-haupt w-full">{t['freund.form.senden']}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Weitergeben (erst nach dem Einlösen, unaufdringlich) ----------

function Weitergeben({ code, titel, satz, t }: { code: string; titel: string; satz: string; t: T }) {
  const [offen, setOffen] = useState(false);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [fehler, setFehler] = useState('');

  const erzeugen = async () => {
    const r = await post(`/api/g/${code}/weitergeben`, { vonName: name });
    if (!r.ok) return setFehler(r.fehler ?? 'Das hat nicht geklappt.');
    setLink(r.link);
  };

  return (
    <div className="mt-6 border-t border-tinte/10 pt-5">
      {!offen ? (
        <button type="button" onClick={() => setOffen(true)} className="flex w-full items-center justify-center gap-2 text-base font-medium text-marke-dunkel underline underline-offset-4">
          <Gift size={18} aria-hidden /> {t['freund.weitergeben.titel']}
        </button>
      ) : !link ? (
        <div className="anim-hoch space-y-3">
          <p className="font-semibold">{t['freund.weitergeben.titel']}</p>
          <label className="block">
            <span className="beschriftung">{t['freund.weitergeben.name']}</span>
            <input className="eingabe" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <Fehler text={fehler} />
          <button type="button" className="knopf-haupt w-full" onClick={erzeugen}>
            {t['freund.weitergeben.button']}
          </button>
        </div>
      ) : (
        <div className="anim-hoch">
          <TeilenKnoepfe t={t} link={link} betreff={titel} nachricht={baueNachricht(t['freund.weitergeben.nachricht'], { geschenk: titel, geschenkSatz: satz, link })} />
        </div>
      )}
    </div>
  );
}
