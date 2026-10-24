import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { jwtAssertion, istDienstkonto, belegtAusAntwort, eventDaten, freeBusyAnfrage } from '../src/lib/kalender-pure.ts';
import { freieSlots, STANDARD_VERFUEGBARKEIT } from '../src/lib/slots.ts';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const sa = { client_email: 'geschenk@projekt.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };

test('Dienstkonto-JWT ist korrekt signiert und enthält Kalender-Scope', () => {
  const jwt = jwtAssertion(sa, 1_800_000_000);
  const [k, d, s] = jwt.split('.');
  assert.ok(crypto.createVerify('RSA-SHA256').update(`${k}.${d}`).verify(publicKey, Buffer.from(s, 'base64url')));
  const daten = JSON.parse(Buffer.from(d, 'base64url').toString());
  assert.equal(daten.iss, sa.client_email);
  assert.equal(daten.scope, 'https://www.googleapis.com/auth/calendar');
  assert.equal(daten.exp - daten.iat, 3600);
  assert.ok(istDienstkonto(sa));
  assert.equal(istDienstkonto({ client_email: 'x' }), false);
});

test('Frei/belegt-Antwort lesen, Fehler erkennen', () => {
  const ok = { calendars: { 'a@aveyo.de': { busy: [{ start: '2026-11-02T08:00:00Z', end: '2026-11-02T09:00:00Z' }] } } };
  assert.deepEqual(belegtAusAntwort(ok, 'a@aveyo.de'), [{ start: '2026-11-02T08:00:00Z', end: '2026-11-02T09:00:00Z' }]);
  assert.equal(belegtAusAntwort({ calendars: { 'a@aveyo.de': { errors: [{ reason: 'notFound' }] } } }, 'a@aveyo.de'), null);
  assert.equal(belegtAusAntwort({}, 'a@aveyo.de'), null);
  assert.deepEqual(freeBusyAnfrage('a@aveyo.de', new Date(0), new Date(1000)).items, [{ id: 'a@aveyo.de' }]);
});

test('Belegte Kalenderzeiten blenden Slots aus (mit Puffer)', () => {
  const v = { ...STANDARD_VERFUEGBARKEIT, wochentage: [1], von: '09:00', bis: '12:00', dauerMin: 30, pufferMin: 15, vorlaufStunden: 0, tageVoraus: 7 };
  const jetzt = new Date('2026-11-01T12:00:00Z');
  const alle = freieSlots(v, [], jetzt);
  // Kalender belegt 10:00–10:30 Berlin (09:00–09:30 UTC)
  const frei = freieSlots(v, [], jetzt, [{ start: '2026-11-02T09:00:00Z', end: '2026-11-02T09:30:00Z' }]);
  assert.ok(alle.includes('2026-11-02T08:45:00.000Z'));
  assert.ok(!frei.includes('2026-11-02T08:45:00.000Z')); // 09:45 Berlin würde überlappen
  assert.ok(frei.includes('2026-11-02T08:00:00.000Z'));
});

test('Kalendereintrag: Dauer, Ort, kein Anruf ohne Telefon', () => {
  const e = eventDaten({ start: '2026-11-02T08:00:00.000Z', dauerMin: 30, vorname: 'Erika', email: 'erika@example.org', ort: 'online', geschenk: 'PKV-Check', adminLink: 'https://x/admin' });
  assert.equal(e.end.dateTime, '2026-11-02T08:30:00.000Z');
  assert.match(e.summary, /PKV-Check: Erika/);
  assert.match(e.description, /bitte nicht anrufen/);
  assert.equal(e.location, 'Online (Video)');
});
