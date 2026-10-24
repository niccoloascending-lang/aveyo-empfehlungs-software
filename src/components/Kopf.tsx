import { einstellungen } from '@/lib/einstellungen';

/** Logo mit Schutzraum (Brand Guidelines: nichts ragt ins Logo, nie drehen). */
export default function Kopf() {
  const e = einstellungen();
  const src = e.theme.logoDateiId ? `/api/datei/${e.theme.logoDateiId}` : '/logo-aveyo.png';
  return (
    <header className="mx-auto flex max-w-xl items-center justify-center px-4 pb-2 pt-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={e.theme.firmenname} width={720} height={289} className="h-12 w-auto" />
    </header>
  );
}
