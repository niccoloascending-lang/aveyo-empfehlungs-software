import { einstellungen } from '@/lib/einstellungen';

export default function Kopf() {
  const e = einstellungen();
  return (
    <header className="mx-auto flex max-w-xl items-center justify-center px-4 pt-6">
      {e.theme.logoDateiId ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/datei/${e.theme.logoDateiId}`} alt={e.theme.firmenname} className="h-8 w-auto" />
      ) : (
        <span className="text-lg font-extrabold tracking-[0.25em] text-marke-dunkel">{e.theme.firmenname}</span>
      )}
    </header>
  );
}
