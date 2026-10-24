import Kopf from '@/components/Kopf';
import Fusszeile from '@/components/Fusszeile';
import BestaetigenKnopf from '@/components/BestaetigenKnopf';
import { doiPruefen } from '@/lib/anfragen';
import { texte } from '@/lib/einstellungen';
import { terminText } from '@/lib/slots';

export const dynamic = 'force-dynamic';

export default function Bestaetigen({ params }: { params: { token: string } }) {
  const a = doiPruefen(params.token);
  const t = texte(['doi.', 'freund.', 'footer.']);
  return (
    <div className="min-h-screen">
      <Kopf />
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="karte p-6 text-center">
          {!a ? (
            <h1 className="text-xl font-bold">{t['doi.fehler']}</h1>
          ) : (
            <BestaetigenKnopf token={params.token} schonBestaetigt={!!a.bestaetigt} typ={a.typ} termin={a.termin_start ? terminText(a.termin_start) : ''} t={t} />
          )}
        </div>
      </main>
      <Fusszeile />
    </div>
  );
}
