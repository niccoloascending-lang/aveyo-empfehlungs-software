'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Feld, Meldung } from '@/components/admin/ui';

export default function Setup() {
  const router = useRouter();
  const [d, setD] = useState({ name: '', email: '', passwort: '' });
  const [fehler, setFehler] = useState('');
  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/admin/auth/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setFehler(j.error ?? 'Fehler');
    router.push(j.weiter === '2fa' ? '/admin/2fa' : '/admin');
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form onSubmit={senden} className="a-karte w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-bold">Ersten Zugang anlegen</h1>
        <p className="text-sm text-slate-600">Danach richtest du die Zwei-Faktor-Anmeldung mit einer Authenticator-App ein.</p>
        <Feld label="Name">
          <input className="a-input" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </Feld>
        <Feld label="E-Mail">
          <input className="a-input" type="email" required value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
        </Feld>
        <Feld label="Passwort" hinweis="Mindestens 12 Zeichen">
          <input className="a-input" type="password" autoComplete="new-password" required value={d.passwort} onChange={(e) => setD({ ...d, passwort: e.target.value })} />
        </Feld>
        <Meldung text={fehler} />
        <button className="a-btn w-full justify-center">Anlegen</button>
      </form>
    </main>
  );
}
