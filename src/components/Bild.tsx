/* eslint-disable @next/next/no-img-element */
/** Beraterfoto oder Initialen. */
export function Avatar({ name, fotoId, groesse = 64 }: { name: string; fotoId: number | null | undefined; groesse?: number }) {
  const init = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const s = { width: groesse, height: groesse };
  return fotoId ? (
    <img src={`/api/datei/${fotoId}`} alt={name} style={s} className="shrink-0 rounded-full object-cover ring-4 ring-white" />
  ) : (
    <span style={s} aria-hidden className="grid shrink-0 place-items-center rounded-full bg-marke-hell text-lg font-bold text-marke-dunkel ring-4 ring-white">
      {init}
    </span>
  );
}
