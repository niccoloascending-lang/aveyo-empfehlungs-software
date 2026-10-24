import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  neuesToken, hashToken, istTokenFormat, neuerCode, istCodeFormat, linkGueltig, signiere, pruefeSignatur,
  hashPasswort, pruefePasswort, passwortProblem,
} from '../src/lib/token.ts';
import { verschluesseln, entschluesseln } from '../src/lib/geheim.ts';

test('Magic-Link-Token: lang, URL-sicher, eindeutig', () => {
  const a = neuesToken();
  const b = neuesToken();
  assert.equal(a.length, 43);
  assert.ok(istTokenFormat(a));
  assert.notEqual(a, b);
  assert.equal(istTokenFormat('kurz'), false);
  assert.equal(istTokenFormat(a + '!'), false);
  assert.equal(istTokenFormat(undefined), false);
});

test('Token wird nur gehasht gespeichert', () => {
  const t = neuesToken();
  assert.equal(hashToken(t), hashToken(t));
  assert.notEqual(hashToken(t), t);
  assert.equal(hashToken(t).length, 64);
});

test('Freund-Codes: 10 Zeichen Base62, Format geprüft', () => {
  const codes = new Set(Array.from({ length: 2000 }, () => neuerCode()));
  assert.equal(codes.size, 2000);
  for (const c of codes) assert.ok(istCodeFormat(c), c);
  assert.equal(istCodeFormat('../etc'), false);
  assert.equal(istCodeFormat('abc'), false);
});

test('Link-Gültigkeit: Widerruf und Ablauf', () => {
  const jetzt = new Date('2026-06-01T12:00:00Z');
  assert.equal(linkGueltig({ erstellt: '2026-05-01 12:00:00' }, 0, jetzt), true);
  assert.equal(linkGueltig({ erstellt: '2026-05-01 12:00:00' }, 60, jetzt), true);
  assert.equal(linkGueltig({ erstellt: '2026-01-01 12:00:00' }, 60, jetzt), false);
  assert.equal(linkGueltig({ erstellt: '2026-05-31 12:00:00', widerrufen: '2026-05-31 13:00:00' }, 0, jetzt), false);
  assert.equal(linkGueltig({ erstellt: 'kaputt' }, 30, jetzt), false);
});

test('Signierte Werte: gültig, manipuliert, abgelaufen', () => {
  const s = 'x'.repeat(32);
  const w = signiere({ uid: 3, exp: Date.now() + 1000, voll: true }, s);
  assert.equal(pruefeSignatur<{ uid: number }>(w, s)?.uid, 3);
  assert.equal(pruefeSignatur(w, 'y'.repeat(32)), null);
  const [p, sig] = w.split('.');
  const anders = Buffer.from(JSON.stringify({ uid: 1, exp: Date.now() + 1000, voll: true })).toString('base64url');
  assert.equal(pruefeSignatur(`${anders}.${sig}`, s), null);
  assert.equal(pruefeSignatur(signiere({ uid: 3, exp: Date.now() - 1 }, s), s), null);
  assert.equal(pruefeSignatur(p, s), null);
  assert.equal(pruefeSignatur(undefined, s), null);
});

test('Passwörter', () => {
  const h = hashPasswort('sehr-geheim-123');
  assert.ok(pruefePasswort('sehr-geheim-123', h));
  assert.equal(pruefePasswort('falsch-falsch-1', h), false);
  assert.equal(pruefePasswort('x', 'kaputt'), false);
  assert.ok(passwortProblem('kurz'));
  assert.ok(passwortProblem('aaaaaaaaaaaaaaa'));
  assert.equal(passwortProblem('ein-gutes-passwort'), null);
});

test('Verschlüsselung gespeicherter Links', () => {
  const s = 'z'.repeat(32);
  const p = verschluesseln('geheimer-link', s);
  assert.equal(entschluesseln(p, s), 'geheimer-link');
  assert.equal(entschluesseln(p, 'a'.repeat(32)), null);
  assert.equal(entschluesseln(null, s), null);
});
