// Tokens, Codes und signierte Sitzungen. Rein (nur Node-crypto) → testbar.
import crypto from 'node:crypto';

/** Magic-Link-Token für Kunden: 32 Zufallsbytes (256 Bit), URL-sicher → 43 Zeichen. Nicht erratbar. */
export function neuesToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** In der Datenbank liegt nur der Hash. Wer die DB hat, kann keinen Link nachbauen. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Grobe Formprüfung, bevor überhaupt die DB gefragt wird. */
export function istTokenFormat(t: unknown): t is string {
  return typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t);
}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Kurzer, öffentlicher Code für Freund-Links (/g/<code>). 10 Zeichen ≈ 59 Bit, gleichverteilt (Rejection Sampling). */
export function neuerCode(laenge = 10): string {
  let out = '';
  while (out.length < laenge) {
    for (const b of crypto.randomBytes(laenge * 2)) {
      if (b < 248 && out.length < laenge) out += BASE62[b % 62]; // 248 = 4·62 → keine Verzerrung
    }
  }
  return out;
}

export function istCodeFormat(c: unknown): c is string {
  return typeof c === 'string' && /^[0-9A-Za-z]{8,16}$/.test(c);
}

/** Gilt ein Kunden-Link noch? Widerrufen schlägt alles; Ablauf in Tagen (0 = nie). */
export function linkGueltig(
  link: { erstellt: string; widerrufen?: string | null },
  gueltigTage: number,
  jetzt: Date = new Date(),
): boolean {
  if (link.widerrufen) return false;
  if (!gueltigTage || gueltigTage <= 0) return true;
  const start = Date.parse(link.erstellt.includes('T') ? link.erstellt : link.erstellt.replace(' ', 'T') + 'Z');
  if (Number.isNaN(start)) return false;
  return jetzt.getTime() < start + gueltigTage * 86400_000;
}

/** Zeitkonstanter Vergleich zweier Strings. */
export function gleich(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ---- Signierte Werte (Sitzungs-Cookie, DOI-Links) ----

export type Sitzung = { uid: number; exp: number; voll: boolean };

export function signiere(daten: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(daten)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function pruefeSignatur<T = any>(wert: string | undefined | null, secret: string, jetzt = Date.now()): T | null {
  if (!wert) return null;
  const [payload, sig] = wert.split('.');
  if (!payload || !sig) return null;
  const erwartet = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!gleich(sig, erwartet)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof d.exp === 'number' && d.exp <= jetzt) return null;
    return d as T;
  } catch {
    return null;
  }
}

// ---- Passwörter ----

export function hashPasswort(pw: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}

export function pruefePasswort(pw: string, gespeichert: string): boolean {
  const [salt, hash] = (gespeichert || '').split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const ref = Buffer.from(hash, 'hex');
  return ref.length === test.length && crypto.timingSafeEqual(ref, test);
}

export function passwortProblem(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < 12) return 'Das Passwort muss mindestens 12 Zeichen lang sein.';
  if (pw.length > 200) return 'Das Passwort ist zu lang.';
  if (/^(.)\1+$/.test(pw)) return 'Bitte ein Passwort mit unterschiedlichen Zeichen wählen.';
  return null;
}
