'use client';
import { useState } from 'react';
import { fuelle } from '@/lib/texte';

type Props = { token: string; schonBestaetigt: boolean; typ: string; termin: string; t: Record<string, string> };

export default function BestaetigenKnopf({ token, schonBestaetigt, typ, termin, t }: Props) {
  const [status, setStatus] = useState<'offen' | 'laeuft' | 'ok' | 'fehler'>(schonBestaetigt ? 'ok' : 'offen');
  const folgetext = typ === 'termin' ? fuelle(t['doi.ok.termin'], { termin }) : typ === 'download_mail' ? t['doi.ok.download'] : t['doi.ok.auswertung'];

  const klick = async () => {
    setStatus('laeuft');
    const r = await fetch('/api/bestaetigen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    setStatus(r.ok ? 'ok' : 'fehler');
  };

  if (status === 'ok')
    return (
      <div role="status" className="anim-pop">
        <p className="text-5xl" aria-hidden>
          🎁
        </p>
        <h1 className="mt-3 text-2xl font-bold">{t['doi.ok.titel']}</h1>
        <p className="mt-2 text-lg text-tinte/80">{folgetext}</p>
      </div>
    );
  if (status === 'fehler') return <h1 className="text-xl font-bold">{t['doi.fehler']}</h1>;
  return (
    <div>
      {termin && <p className="mb-4 text-lg font-semibold">{termin}</p>}
      <button type="button" className="knopf-haupt w-full text-lg" onClick={klick} disabled={status === 'laeuft'}>
        {t['doi.knopf']}
      </button>
    </div>
  );
}
