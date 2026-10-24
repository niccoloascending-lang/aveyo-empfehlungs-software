import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berlinZuUtc, berlinOffsetMin, freieSlots, slotGueltig, terminText, nachTag, STANDARD_VERFUEGBARKEIT } from '../src/lib/slots.ts';

test('Berliner Zeit inkl. Sommer-/Winterzeit', () => {
  assert.equal(new Date(berlinZuUtc(2026, 1, 15, '10:00')).toISOString(), '2026-01-15T09:00:00.000Z');
  assert.equal(new Date(berlinZuUtc(2026, 7, 15, '10:00')).toISOString(), '2026-07-15T08:00:00.000Z');
  // Tag der Umstellung (29.03.2026)
  assert.equal(new Date(berlinZuUtc(2026, 3, 29, '10:00')).toISOString(), '2026-03-29T08:00:00.000Z');
  assert.equal(berlinOffsetMin(Date.UTC(2026, 0, 1)), 60);
  assert.equal(berlinOffsetMin(Date.UTC(2026, 6, 1)), 120);
});

test('Freie Slots: Wochentage, Vorlauf, belegte Termine mit Puffer', () => {
  const v = { ...STANDARD_VERFUEGBARKEIT, wochentage: [1], von: '09:00', bis: '11:00', dauerMin: 30, pufferMin: 15, vorlaufStunden: 0, tageVoraus: 7 };
  const jetzt = new Date('2026-11-01T12:00:00Z'); // Sonntag
  const slots = freieSlots(v, [], jetzt);
  // Montag 02.11.: 09:00, 09:45, 10:30 (Winterzeit → UTC-1h)
  assert.deepEqual(slots, ['2026-11-02T08:00:00.000Z', '2026-11-02T08:45:00.000Z', '2026-11-02T09:30:00.000Z']);
  const mitBelegt = freieSlots(v, ['2026-11-02T08:45:00.000Z'], jetzt);
  assert.deepEqual(mitBelegt, ['2026-11-02T08:00:00.000Z', '2026-11-02T09:30:00.000Z']);
  assert.equal(slotGueltig(v, [], '2026-11-02T08:00:00.000Z', jetzt), true);
  assert.equal(slotGueltig(v, [], '2026-11-02T08:01:00.000Z', jetzt), false);
  // Vorlauf 24 h schließt Montag aus, wenn jetzt Sonntagabend ist
  assert.deepEqual(freieSlots({ ...v, vorlaufStunden: 24, tageVoraus: 1 }, [], new Date('2026-11-01T20:00:00Z')), []);
});

test('Anzeige', () => {
  assert.equal(terminText('2026-11-02T08:00:00.000Z'), 'Mo., 02.11.2026, 09:00 Uhr');
  const g = nachTag(['2026-11-02T08:00:00.000Z', '2026-11-02T09:00:00.000Z', '2026-11-03T08:00:00.000Z']);
  assert.equal(g.length, 2);
  assert.equal(g[0].slots[1].zeit, '10:00');
});
