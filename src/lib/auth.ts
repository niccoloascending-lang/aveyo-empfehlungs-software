// Berater-Login: Passwort + TOTP (2FA). Sitzung als signiertes Cookie (12 h). Middleware prüft nur die Signatur.
import { cookies } from 'next/headers';
import { one } from './db.ts';
import { pruefeSignatur, signiere, type Sitzung } from './token.ts';

export const COOKIE = 'gs_session';
export const COOKIE_2FA = 'gs_2fa';
const MAX_AGE = 60 * 60 * 12;

export function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('SESSION_SECRET fehlt oder ist zu kurz (.env.local)');
  return s;
}

export const zweiFaktorPflicht = () => process.env.GESCHENK_2FA !== 'aus';

export function sitzungsCookie(uid: number) {
  return signiere({ uid, exp: Date.now() + MAX_AGE * 1000, voll: true } satisfies Sitzung, secret());
}

/** Zwischenschritt nach korrektem Passwort, bis der 2FA-Code stimmt (5 Minuten). */
export function zweiFaktorCookie(uid: number) {
  return signiere({ uid, exp: Date.now() + 5 * 60 * 1000, schritt: '2fa' }, secret());
}

export const cookieOptionen = (maxAge = MAX_AGE) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
  secure: process.env.GESCHENK_HTTPS === '1',
});

export type Berater = { id: number; name: string; email: string; totp_aktiv: number };

export function aktuellerBerater(): Berater | null {
  const s = pruefeSignatur<Sitzung>(cookies().get(COOKIE)?.value, secret());
  if (!s?.voll) return null;
  return one<Berater>('SELECT id, name, email, totp_aktiv FROM berater WHERE id = ?', s.uid) ?? null;
}

export function zweiFaktorUid(): number | null {
  const s = pruefeSignatur<{ uid: number; schritt: string }>(cookies().get(COOKIE_2FA)?.value, secret());
  return s?.schritt === '2fa' ? s.uid : null;
}

/** Einfache Bremse gegen Raten (pro Prozess, im Speicher). */
const versuche = new Map<string, { n: number; bis: number }>();
export function gesperrt(key: string, max = 5): boolean {
  const f = versuche.get(key);
  return !!f && f.n >= max && f.bis > Date.now();
}
export function fehlversuch(key: string) {
  const f = versuche.get(key) ?? { n: 0, bis: 0 };
  if (f.bis < Date.now()) f.n = 0;
  f.n += 1;
  f.bis = Date.now() + 10 * 60 * 1000;
  versuche.set(key, f);
}
export const erfolgreich = (key: string) => versuche.delete(key);
