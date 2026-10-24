import { NextResponse } from 'next/server';
import { one } from '@/lib/db';
import { pruefePasswort } from '@/lib/token';
import { COOKIE, COOKIE_2FA, cookieOptionen, sitzungsCookie, zweiFaktorCookie, zweiFaktorPflicht, gesperrt, fehlversuch, erfolgreich } from '@/lib/auth';
import { clientKey } from '@/lib/bremse';

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? '').trim().toLowerCase();
  const key = `login:${email}:${clientKey(req)}`;
  if (gesperrt(key)) return NextResponse.json({ error: 'Zu viele Versuche. Bitte 10 Minuten warten.' }, { status: 429 });
  const u = one<{ id: number; pw_hash: string; totp_aktiv: number }>('SELECT id, pw_hash, totp_aktiv FROM berater WHERE email = ?', email);
  if (!u || !pruefePasswort(String(b.passwort ?? ''), u.pw_hash)) {
    fehlversuch(key);
    return NextResponse.json({ error: 'E-Mail oder Passwort falsch.' }, { status: 401 });
  }
  erfolgreich(key);
  if (zweiFaktorPflicht() || u.totp_aktiv) {
    const res = NextResponse.json({ ok: true, weiter: '2fa' });
    res.cookies.set(COOKIE_2FA, zweiFaktorCookie(u.id), cookieOptionen(300));
    return res;
  }
  const res = NextResponse.json({ ok: true, weiter: 'fertig' });
  res.cookies.set(COOKIE, sitzungsCookie(u.id), cookieOptionen());
  return res;
}
