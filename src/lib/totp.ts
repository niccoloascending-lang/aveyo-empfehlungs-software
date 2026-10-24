// Zwei-Faktor-Anmeldung nach RFC 6238 (TOTP, SHA-1, 6 Stellen, 30 s) – kompatibel mit Google Authenticator,
// Microsoft Authenticator, 1Password usw. Rein → testbar.
import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let wert = 0;
  let out = '';
  for (const b of buf) {
    wert = (wert << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(wert >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(wert << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let wert = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) throw new Error('Ungültiges Base32');
    wert = (wert << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((wert >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function neuesTotpGeheimnis(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function hotp(geheimnis: Buffer, zaehler: number, stellen = 6): string {
  const c = Buffer.alloc(8);
  c.writeBigUInt64BE(BigInt(zaehler));
  const h = crypto.createHmac('sha1', geheimnis).update(c).digest();
  const o = h[h.length - 1] & 15;
  const bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(bin % 10 ** stellen).padStart(stellen, '0');
}

export function totp(geheimnisBase32: string, zeitMs = Date.now(), stellen = 6): string {
  return hotp(base32Decode(geheimnisBase32), Math.floor(zeitMs / 30000), stellen);
}

/**
 * Prüft einen Code mit ±1 Zeitfenster (Uhrabweichung). Gibt den Zeitschritt zurück (für Schutz gegen Wiederverwendung)
 * oder null. Bereits benutzte Schritte (<= letzterSchritt) werden abgelehnt.
 */
export function pruefeTotp(geheimnisBase32: string, code: string, zeitMs = Date.now(), letzterSchritt = -1): number | null {
  const c = String(code ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return null;
  const key = base32Decode(geheimnisBase32);
  const jetzt = Math.floor(zeitMs / 30000);
  for (const d of [0, -1, 1]) {
    const schritt = jetzt + d;
    if (schritt <= letzterSchritt) continue;
    const erwartet = hotp(key, schritt);
    if (crypto.timingSafeEqual(Buffer.from(erwartet), Buffer.from(c))) return schritt;
  }
  return null;
}

export function otpauthUrl(geheimnis: string, konto: string, aussteller = 'AVEYO Geschenk'): string {
  const label = encodeURIComponent(`${aussteller}:${konto}`);
  return `otpauth://totp/${label}?secret=${geheimnis}&issuer=${encodeURIComponent(aussteller)}&algorithm=SHA1&digits=6&period=30`;
}
