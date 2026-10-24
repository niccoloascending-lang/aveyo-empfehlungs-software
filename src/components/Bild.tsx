/* eslint-disable @next/next/no-img-element */
/** Beraterfoto oder Initialen. */
/** `breit`: Querformat mit abgerundeten Ecken – besser für Fotos mit mehreren Personen. */
export function Avatar({ name, fotoId, groesse = 64, breit = false }: { name: string; fotoId: number | null | undefined; groesse?: number; breit?: boolean }) {
  const init = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const s = { width: breit && fotoId ? Math.round(groesse * 1.33) : groesse, height: groesse };
  const form = breit && fotoId ? 'rounded-3xl' : 'rounded-full';
  return fotoId ? (
    <img src={`/api/datei/${fotoId}`} alt={name} style={s} className={`shrink-0 ${form} object-cover shadow-karte ring-4 ring-white`} />
  ) : (
    <span style={s} aria-hidden className="grid shrink-0 place-items-center rounded-full bg-marke-hell text-lg font-bold text-marke-dunkel ring-4 ring-white">
      {init}
    </span>
  );
}
