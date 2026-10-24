'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Feld, Meldung } from '@/components/admin/ui';

export default function ZweiFaktor() {
  const router = useRouter();
  const [info, setInfo] = useState<{ einrichten: boolean; qr?: string; geheimnis?: string } | null>(null);
  const [code, setCode] = useState('');
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    fetch('/api/admin/auth/2fa')
      .then(async (r) => {
        if (r.status === 401) return router.replace('/admin/login');
        setInfo(await r.json());
      })
      .catch(() => setFehler('Fehler beim Laden'));
  }, [router]);

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/admin/auth/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setFehler(j.error ?? 'Fehler');
    window.location.assign('/admin');
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form onSubmit={senden} className="a-karte w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-bold">Zwei-Faktor-Anmeldung</h1>
        {info?.einrichten && (
          <div className="space-y-3 text-sm">
            <p>Scanne den QR-Code mit einer Authenticator-App (z. B. Microsoft Authenticator, Google Authenticator, 1Password) und gib dann den 6-stelligen Code ein.</p>
            <div className="mx-auto w-48" dangerouslySetInnerHTML={{ __html: info.qr ?? '' }} />
            <details>
              <summary className="cursor-pointer text-slate-600">Code lässt sich nicht scannen?</summary>
              <code className="mt-2 block break-all rounded bg-slate-100 p-2 text-xs">{info.geheimnis}</code>
            </details>
          </div>
        )}
        <Feld label="Code aus der App">
          <input
            className="a-input text-center text-2xl tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </Feld>
        <Meldung text={fehler} />
        <button className="a-btn w-full justify-center">Bestätigen</button>
      </form>
    </main>
  );
}
