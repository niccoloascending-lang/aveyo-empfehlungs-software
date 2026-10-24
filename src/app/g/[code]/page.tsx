import type { Metadata } from 'next';
import { headers } from 'next/headers';
import FreundAnsicht from '@/components/FreundAnsicht';
import { freundSeite, ereignis } from '@/lib/teilungen';
import { freundProps } from '@/lib/oeffentlich';
import { istVorschauBot } from '@/lib/validierung';
import { texte } from '@/lib/einstellungen';
import { fuelle } from '@/lib/texte';
import Kopf from '@/components/Kopf';
import Fusszeile from '@/components/Fusszeile';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { code: string } }): Metadata {
  const s = freundSeite(params.code);
  if (!s) return { title: 'Geschenk' };
  const t = texte(['freund.']);
  const von = s.teilung.von_name ? fuelle(t['freund.ueberschrift'], { empfehler: s.teilung.von_name }) : t['freund.ueberschrift.anonym'];
  const titel = `${von}: ${s.geschenk.titel}`;
  return {
    title: titel,
    description: `${s.geschenk.kurz} ${t['freund.kosten']}. ${t['freund.versprechen']}`.trim(),
    openGraph: { title: titel, description: s.geschenk.kurz || t['freund.versprechen'], type: 'website', locale: 'de_DE' },
    robots: { index: false, follow: false },
  };
}

export default function FreundSeitePage({ params }: { params: { code: string } }) {
  const s = freundSeite(params.code);
  if (!s) {
    const t = texte(['freund.']);
    return (
      <div className="min-h-screen">
        <Kopf />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="text-5xl" aria-hidden>
            🎁
          </p>
          <h1 className="mt-4 text-2xl font-bold">{t['freund.ungueltig']}</h1>
        </main>
        <Fusszeile />
      </div>
    );
  }
  // Anonym zählen: keine IP, kein Cookie. Link-Vorschauen von WhatsApp & Co. zählen nicht.
  if (!istVorschauBot(headers().get('user-agent'))) ereignis('geoeffnet', s.teilung.id, s.teilung.kunde_id);
  return <FreundAnsicht {...freundProps(s)} />;
}

