import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { one, run } from '@/lib/db';
import { neuesTotpGeheimnis, otpauthUrl, pruefeTotp } from '@/lib/totp';
import { verschluesseln, entschluesseln } from '@/lib/geheim';
import { COOKIE, COOKIE_2FA, cookieOptionen, secret, sitzungsCookie, zweiFaktorUid, gesperrt, fehlversuch, erfolgreich } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type U = { id: number; email: string; totp_enc: string | null; totp_aktiv: number; totp_schritt: number };

// Zustand des 2FA-Schritts. Noch nicht eingerichtet → neues Geheimnis + QR-Code zum Scannen.
export async function GET() {
  const uid = zweiFaktorUid();
  if (!uid) return NextResponse.json({ error: 'Bitte zuerst anmelden.' }, { status: 401 });
  const u = one<U>('SELECT id, email, totp_enc, totp_aktiv, totp_schritt FROM berater WHERE id = ?', uid);
  if (!u) return NextResponse.json({ error: 'Unbekannt' }, { status: 401 });
  if (u.totp_aktiv) return NextResponse.json({ einrichten: false });
  let g = entschluesseln(u.totp_enc, secret());
  if (!g) {
    g = neuesTotpGeheimnis();
    run('UPDATE berater SET totp_enc = ? WHERE id = ?', verschluesseln(g, secret()), u.id);
  }
  const url = otpauthUrl(g, u.email);
  const qr = await QRCode.toString(url, { type: 'svg', margin: 1 });
  return NextResponse.json({ einrichten: true, qr, geheimnis: g });
}

export async function POST(req: Request) {
  const uid = zweiFaktorUid();
  if (!uid) return NextResponse.json({ error: 'Sitzung abgelaufen. Bitte neu anmelden.' }, { status: 401 });
  const key = `2fa:${uid}`;
  if (gesperrt(key)) return NextResponse.json({ error: 'Zu viele Versuche. Bitte 10 Minuten warten.' }, { status: 429 });
  const u = one<U>('SELECT id, email, totp_enc, totp_aktiv, totp_schritt FROM berater WHERE id = ?', uid);
  const g = u ? entschluesseln(u.totp_enc, secret()) : null;
  const b = await req.json().catch(() => ({}));
  const schritt = g ? pruefeTotp(g, String(b.code ?? ''), Date.now(), u!.totp_schritt) : null;
  if (!u || schritt == null) {
    fehlversuch(key);
    return NextResponse.json({ error: 'Code stimmt nicht. Bitte den aktuellen Code aus der App eingeben.' }, { status: 401 });
  }
  erfolgreich(key);
  run('UPDATE berater SET totp_aktiv = 1, totp_schritt = ? WHERE id = ?', schritt, u.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sitzungsCookie(u.id), cookieOptionen());
  res.cookies.set(COOKIE_2FA, '', cookieOptionen(0));
  return res;
}
