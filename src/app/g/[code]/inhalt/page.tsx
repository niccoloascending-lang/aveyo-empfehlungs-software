import { notFound } from 'next/navigation';
import { freundSeite } from '@/lib/teilungen';
import { texte } from '@/lib/einstellungen';
import Textsatz from '@/components/Textsatz';
import Kopf from '@/components/Kopf';
import Fusszeile from '@/components/Fusszeile';
import DruckKnopf from '@/components/DruckKnopf';

export const dynamic = 'force-dynamic';

/** Eingebauter Download-Inhalt als druckbare Seite („Als PDF speichern“ über den Browser). */
export default function Inhalt({ params }: { params: { code: string } }) {
  const s = freundSeite(params.code);
  if (!s || s.geschenk.typ !== 'download' || !s.geschenk.inhalt) notFound();
  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden">
        <Kopf />
      </div>
      <main className="mx-auto max-w-2xl px-5 py-8">
        <Textsatz quelle={s.geschenk.inhalt} />
        <div className="mt-10 print:hidden">
          <DruckKnopf text={texte(['freund.drucken'])['freund.drucken']} />
        </div>
      </main>
      <div className="print:hidden">
        <Fusszeile />
      </div>
    </div>
  );
}
