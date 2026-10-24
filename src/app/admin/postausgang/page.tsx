'use client';
import Shell from '@/components/admin/Shell';
import { useDaten, datum } from '@/components/admin/api';
import { Meldung } from '@/components/admin/ui';

const linkify = (t: string) =>
  t.split(/(https?:\/\/\S+)/g).map((teil, i) =>
    /^https?:\/\//.test(teil) ? (
      <a key={i} href={teil} className="text-marke-dunkel underline" target="_blank" rel="noreferrer">
        {teil}
      </a>
    ) : (
      teil
    ),
  );

export default function Postausgang() {
  const { daten } = useDaten<{ aktiv: boolean; mails: any[] }>('/api/admin/postausgang');
  return (
    <Shell titel="Postausgang (Entwicklung)">
      {daten && !daten.aktiv ? (
        <Meldung art="info" text="SMTP ist eingerichtet – Mails werden echt verschickt und hier nicht angezeigt." />
      ) : (
        <Meldung art="info" text="Ohne SMTP-Zugang landen Mails hier statt beim Empfänger. So lassen sich Bestätigungslinks lokal durchklicken." />
      )}
      <div className="mt-4 space-y-3">
        {(daten?.mails ?? []).map((m) => (
          <div key={m.datei} className="a-karte text-sm">
            <p className="text-xs text-slate-500">{datum(`${m.datei.slice(0, 10)}T${m.datei.slice(11, 13)}:${m.datei.slice(14, 16)}:${m.datei.slice(17, 19)}Z`)}</p>
            <p>
              <strong>An:</strong> {m.an}
            </p>
            <p>
              <strong>Betreff:</strong> {m.betreff}
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-sans">{linkify(m.text)}</pre>
          </div>
        ))}
      </div>
    </Shell>
  );
}
