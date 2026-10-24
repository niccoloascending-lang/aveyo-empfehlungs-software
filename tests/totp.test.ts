import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base32Encode, base32Decode, hotp, totp, pruefeTotp, neuesTotpGeheimnis, otpauthUrl } from '../src/lib/totp.ts';

// RFC 6238 Anhang B: Schlüssel "12345678901234567890" (ASCII), SHA-1, 8 Stellen
const RFC = base32Encode(Buffer.from('12345678901234567890'));

test('Base32 hin und zurück', () => {
  const b = Buffer.from('Hallo AVEYO!');
  assert.deepEqual(base32Decode(base32Encode(b)), b);
  assert.equal(base32Encode(Buffer.from('foobar')), 'MZXW6YTBOI');
  assert.throws(() => base32Decode('1!'));
});

test('HOTP nach RFC 4226', () => {
  const key = Buffer.from('12345678901234567890');
  assert.equal(hotp(key, 0), '755224');
  assert.equal(hotp(key, 1), '287082');
  assert.equal(hotp(key, 9), '520489');
});

test('TOTP nach RFC 6238 (8 Stellen)', () => {
  assert.equal(totp(RFC, 59_000, 8), '94287082');
  assert.equal(totp(RFC, 1111111109_000, 8), '07081804');
  assert.equal(totp(RFC, 1234567890_000, 8), '89005924');
  assert.equal(totp(RFC, 20000000000_000, 8), '65353130');
});

test('Prüfung mit Zeitfenster und Schutz gegen Wiederverwendung', () => {
  const g = neuesTotpGeheimnis();
  const t = 1_800_000_000_000;
  const code = totp(g, t);
  const schritt = pruefeTotp(g, code, t);
  assert.equal(schritt, Math.floor(t / 30000));
  assert.equal(pruefeTotp(g, code, t + 30_000), schritt); // 30 s später noch gültig
  assert.equal(pruefeTotp(g, code, t + 120_000), null); // zu alt
  assert.equal(pruefeTotp(g, code, t, schritt!), null); // schon benutzt
  assert.equal(pruefeTotp(g, '12345', t), null);
  assert.equal(pruefeTotp(g, 'abcdef', t), null);
});

test('otpauth-URL', () => {
  const u = otpauthUrl('ABC', 'adrian@example.org');
  assert.match(u, /^otpauth:\/\/totp\/AVEYO%20Geschenk%3Aadrian%40example\.org\?secret=ABC/);
});
