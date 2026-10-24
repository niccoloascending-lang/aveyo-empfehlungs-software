import { notFound, redirect } from 'next/navigation';
import Kopf from '@/components/Kopf';
import Fusszeile from '@/components/Fusszeile';
import Textsatz from '@/components/Textsatz';
import { t, einstellungen } from '@/lib/einstellungen';

export const dynamic = 'force-dynamic';

const SEITEN: Record<string, string> = { impressum: 'seite.impressum', datenschutz: 'seite.datenschutz', erstinformation: 'seite.erstinformation' };

/** Rechtsseiten – Inhalt im Admin unter „Texte → Rechtliches“ bearbeitbar. */
export default function Info({ params }: { params: { seite: string } }) {
  const key = SEITEN[params.seite];
  if (!key) notFound();
  const e = einstellungen();
  if (params.seite === 'impressum' && e.impressumUrl) redirect(e.impressumUrl);
  if (params.seite === 'erstinformation' && e.erstinformationUrl) redirect(e.erstinformationUrl);
  return (
    <div className="min-h-screen">
      <Kopf />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <Textsatz quelle={t(key, { loeschen_monate: e.loeschenMonate, doi_tage: e.doiTage, datenschutz_url: e.datenschutzUrl || '' })} />
      </main>
      <Fusszeile />
    </div>
  );
}
