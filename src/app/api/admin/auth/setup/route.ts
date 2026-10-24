import { NextResponse } from 'next/server';
import { one, insertRow } from '@/lib/db';
import { hashPasswort, passwortProblem } from '@/lib/token';
import { istEmail, sauber } from '@/lib/validierung';
import { COOKIE, COOKIE_2FA, cookieOptionen, sitzungsCookie, zweiFaktorCookie, zweiFaktorPflicht } from '@/lib/auth';

// Erster Zugang – nur solange es noch keinen Berater gibt.
export async function POST(req: Request) {
  if (one('SELECT 1 FROM berater LIMIT 1')) return NextResponse.json({ error: 'Bereits eingerichtet' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const name = sauber(b.name, 80);
  const email = sauber(b.email, 200).toLowerCase();
  const pp = passwortProblem(b.passwort);
  if (!name || !istEmail(email)) return NextResponse.json({ error: 'Name und gültige E-Mail angeben.' }, { status: 400 });
  if (pp) return NextResponse.json({ error: pp }, { status: 400 });
  const id = insertRow('berater', { name, email, pw_hash: hashPasswort(b.passwort) });
  const res = NextResponse.json({ ok: true, weiter: zweiFaktorPflicht() ? '2fa' : 'fertig' });
  if (zweiFaktorPflicht()) res.cookies.set(COOKIE_2FA, zweiFaktorCookie(id), cookieOptionen(300));
  else res.cookies.set(COOKIE, sitzungsCookie(id), cookieOptionen());
  return res;
}

export async function GET() {
  return NextResponse.json({ offen: !one('SELECT 1 FROM berater LIMIT 1') });
}
