import { Gift, Check, Clock, ShieldCheck, Star } from 'lucide-react';
import { fuelle } from '@/lib/texte';
import type { FreundSeite } from '@/lib/teilungen';
import { Avatar } from './Bild';
import Einloesen from './Einloesen';
import Kopf from './Kopf';
import Fusszeile from './Fusszeile';

type Props = {
  seite: FreundSeite;
  t: Record<string, string>;
  vorschau?: boolean;
  bewertungenUrl: string;
  orte: ('online' | 'hamburg')[];
  terminExtern: string | null;
};

const zeilen = (s: string) =>
  s
    .split('\n')
    .map((z) => z.trim())
    .filter(Boolean);

/**
 * Landingpage für den Freund. Innerhalb der ersten Bildschirmhöhe muss klar sein:
 * Was bekomme ich, von wem, was kostet es (nichts), werde ich angerufen (nein).
 */
export default function FreundAnsicht({ seite, t, vorschau = false, bewertungenUrl, orte, terminExtern }: Props) {
  const { teilung, geschenk: g, berater } = seite;
  const empfehler = teilung.von_name?.trim() || '';
  const ueberschrift = empfehler ? fuelle(t['freund.ueberschrift'], { empfehler }) : t['freund.ueberschrift.anonym'];
  const nutzen = zeilen(g.nutzen);
  const ablauf = zeilen(g.ablauf);

  return (
    <div className="min-h-screen">
      {vorschau && (
        <div role="status" className="sticky top-0 z-20 bg-tinte px-4 py-3 text-center text-sm font-medium text-white">
          {t['kunde.vorschau.banner']}
        </div>
      )}
      <Kopf />
      <main className="mx-auto max-w-xl px-4">
        {/* Geschenk-Karte: auf einen Blick */}
        <section aria-labelledby="titel" className="karte anim-hoch relative mt-6 overflow-hidden px-6 pb-7 pt-8 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-marke-hell to-transparent" />
          <div aria-hidden className="relative mx-auto mb-5 h-20 w-24">
            <div className="anim-deckel absolute inset-x-0 top-0 h-6 rounded-lg bg-marke-dunkel" />
            <div className="absolute inset-x-1.5 bottom-0 top-5 rounded-lg bg-marke" />
            <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-akzent/90" />
            <span className="absolute inset-x-0 bottom-1.5 mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-2xl shadow-sm">{g.icon || '🎁'}</span>
          </div>
          <p className="relative text-lg font-medium text-marke-dunkel">{ueberschrift}</p>
          <h1 id="titel" className="relative mt-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {g.titel}
          </h1>
          {g.kurz && <p className="relative mx-auto mt-3 max-w-md text-lg leading-snug text-tinte/80">{g.kurz}</p>}
          <ul className="relative mt-5 flex flex-wrap justify-center gap-2 text-sm font-semibold">
            <li className="rounded-full bg-marke-hell px-3 py-1.5 text-marke-dunkel">{t['freund.kosten']}</li>
            {g.dauer && (
              <li className="inline-flex items-center gap-1 rounded-full bg-marke-hell px-3 py-1.5 text-marke-dunkel">
                <Clock size={14} aria-hidden /> {g.dauer}
              </li>
            )}
          </ul>
          <p className="relative mx-auto mt-5 flex max-w-md items-start justify-center gap-2 text-left text-base font-medium">
            <ShieldCheck className="mt-0.5 shrink-0 text-marke" size={20} aria-hidden />
            <span>{t['freund.versprechen']}</span>
          </p>
        </section>

        {g.bild_id && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/datei/${g.bild_id}`} alt="" className="mt-4 aspect-[16/9] w-full rounded-3xl object-cover" />
        )}

        {teilung.zitat && empfehler && (
          <figure className="anim-hoch mt-6 px-2" style={{ animationDelay: '.15s' }}>
            <blockquote className="text-2xl font-semibold leading-snug text-tinte">„{teilung.zitat}“</blockquote>
            <figcaption className="mt-2 text-base text-tinte/70">– {empfehler}</figcaption>
          </figure>
        )}

        {nutzen.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold">{t['freund.nutzen.titel']}</h2>
            <ul className="mt-3 space-y-3">
              {nutzen.map((n, i) => (
                <li key={i} className="flex gap-3 text-lg leading-snug">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marke text-white">
                    <Check size={16} aria-hidden />
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          </section>
        )}

        {ablauf.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold">{t['freund.ablauf.titel']}</h2>
            <ol className="mt-3 space-y-3">
              {ablauf.map((n, i) => (
                <li key={i} className="flex gap-3 text-lg leading-snug">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-marke text-sm font-bold text-marke">{i + 1}</span>
                  {n}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section id="einloesen" className="karte mt-8 p-5 sm:p-6" aria-labelledby="einloesen-titel">
          <h2 id="einloesen-titel" className="flex items-center gap-2 text-xl font-bold">
            <Gift size={22} className="text-marke" aria-hidden /> {t['freund.einloesen.titel']}
          </h2>
          <Einloesen
            code={teilung.code}
            typ={g.typ}
            titel={g.titel}
            empfehler={empfehler}
            t={t}
            vorschau={vorschau}
            orte={orte}
            terminExtern={terminExtern}
          />
        </section>

        {berater && (
          <section className="mt-8" aria-labelledby="berater-titel">
            <h2 id="berater-titel" className="text-xl font-bold">
              {t['freund.berater.titel']}
            </h2>
            <div className="mt-3 flex items-start gap-4">
              <Avatar name={berater.name} fotoId={berater.foto_id} groesse={72} />
              <div>
                <p className="text-lg font-semibold">{berater.name}</p>
                {berater.vorstellung && <p className="mt-1 whitespace-pre-line leading-relaxed text-tinte/80">{berater.vorstellung}</p>}
              </div>
            </div>
          </section>
        )}

        {bewertungenUrl && (
          <p className="mt-6">
            <a href={bewertungenUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-marke-dunkel underline underline-offset-4">
              <Star size={18} aria-hidden /> {t['freund.bewertungen']}
            </a>
          </p>
        )}

        <p className="mt-8 text-sm text-tinte/70">{t['freund.hinweis.information']}</p>
      </main>
      <Fusszeile />
    </div>
  );
}
