import type { Metadata } from 'next';
import Kopf from '@/components/Kopf';
import Fusszeile from '@/components/Fusszeile';
import EmpfehlerApp from '@/components/EmpfehlerApp';
import { kundeAusToken } from '@/lib/kunden';
import { empfehlerDaten } from '@/lib/empfehler';
import { texte } from '@/lib/einstellungen';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mein Geschenke-Bereich', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default function Empfehler({ params }: { params: { token: string } }) {
  const kunde = kundeAusToken(params.token);
  if (!kunde) {
    const t = texte(['kunde.link']);
    return (
      <div className="min-h-screen">
        <Kopf />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-5xl" aria-hidden>
            🔒
          </p>
          <h1 className="mt-4 text-xl font-semibold">{t['kunde.link.ungueltig']}</h1>
        </main>
        <Fusszeile />
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Kopf />
      <EmpfehlerApp token={params.token} daten={empfehlerDaten(kunde)} />
      <Fusszeile />
    </div>
  );
}
