// Verschlüsselung gespeicherter Geheimnisse (Magic-Link zum erneuten Anzeigen, TOTP-Schlüssel). Rein → testbar.
// Schlüssel aus SESSION_SECRET abgeleitet: Wer nur die Datenbank-Datei hat, kann nichts entschlüsseln.
import crypto from 'node:crypto';

const cache = new Map<string, Buffer>();
const key = (secret: string) => {
  let k = cache.get(secret);
  if (!k) cache.set(secret, (k = crypto.scryptSync(secret, 'aveyo-geschenk-v1', 32)));
  return k;
};

export function verschluesseln(klartext: string, secret: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(secret), iv);
  const ct = Buffer.concat([c.update(klartext, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString('base64')).join('.');
}

export function entschluesseln(paket: string | null | undefined, secret: string): string | null {
  if (!paket) return null;
  try {
    const [iv, tag, ct] = paket.split('.').map((s) => Buffer.from(s, 'base64'));
    const d = crypto.createDecipheriv('aes-256-gcm', key(secret), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}
