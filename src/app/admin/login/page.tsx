'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Feld, Meldung } from '@/components/admin/ui';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState('');
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/setup')
      .then((r) => r.json())
      .then((j) => j.offen && router.replace('/admin/setup'));
  }, [router]);

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaeuft(true);
    setFehler('');
    const r = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, passwort }) });
    const j = await r.json().catch(() => ({}));
    setLaeuft(false);
    if (!r.ok) return setFehler(j.error ?? 'Anmeldung fehlgeschlagen');
    window.location.assign(j.weiter === '2fa' ? '/admin/2fa' : '/admin'); // volle Seite: Cookie sicher übernommen
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form onSubmit={senden} className="a-karte w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-bold">Berater-Anmeldung</h1>
        <Feld label="E-Mail">
          <input className="a-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Feld>
        <Feld label="Passwort">
          <input className="a-input" type="password" autoComplete="current-password" required value={passwort} onChange={(e) => setPasswort(e.target.value)} />
        </Feld>
        <Meldung text={fehler} />
        <button className="a-btn w-full justify-center" disabled={laeuft}>
          Weiter
        </button>
      </form>
    </main>
  );
}
