import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aktivAngehakt, hatEinwilligung, doiAbgelaufen, berechneWirkung, type Einwilligung } from '../src/lib/einwilligung.ts';

test('Nur echtes Häkchen zählt (nichts vorausgewählt, keine Strings)', () => {
  assert.equal(aktivAngehakt(true), true);
  for (const v of ['on', 'true', 1, undefined, null, false, {}]) assert.equal(aktivAngehakt(v), false, String(v));
});

test('Einwilligung: erteilt / widerrufen', () => {
  const e: Einwilligung[] = [
    { anfrage_id: 1, art: 'empfehler_info', erteilt: '2026-01-01 10:00:00' },
    { anfrage_id: 2, art: 'empfehler_info', erteilt: '2026-01-01 10:00:00', widerrufen: '2026-01-02 10:00:00' },
    { anfrage_id: 3, art: 'datenschutz', erteilt: '2026-01-01 10:00:00' },
  ];
  assert.equal(hatEinwilligung(e, 1, 'empfehler_info'), true);
  assert.equal(hatEinwilligung(e, 2, 'empfehler_info'), false);
  assert.equal(hatEinwilligung(e, 3, 'empfehler_info'), false);
});

test('Double-Opt-in läuft ab', () => {
  const jetzt = new Date('2026-03-10T12:00:00Z');
  assert.equal(doiAbgelaufen('2026-03-09 12:00:00', jetzt), false);
  assert.equal(doiAbgelaufen('2026-03-01 12:00:00', jetzt), true);
  assert.equal(doiAbgelaufen('quatsch', jetzt), true);
});

test('Wirkung: Zahlen immer, Namen nur mit Einwilligung und Bestätigung', () => {
  const teil = [
    { id: 10, geschenk: 'PKV-Check', geteilt_am: '2026-03-01 10:00:00' },
    { id: 11, geschenk: 'Checkliste', geteilt_am: null },
  ];
  const ev = [
    { teilung_id: 10, typ: 'geoeffnet', zeit: '2026-03-01 11:00:00' },
    { teilung_id: 10, typ: 'geoeffnet', zeit: '2026-03-01 12:00:00' },
    { teilung_id: 10, typ: 'termin_bestaetigt', zeit: '2026-03-02 09:00:00' },
    { teilung_id: 11, typ: 'download', zeit: '2026-03-05 09:00:00' },
    { teilung_id: 99, typ: 'download', zeit: '2026-03-05 09:00:00' }, // fremde Teilung
  ];
  const anf = [
    { id: 1, teilung_id: 10, vorname: 'Max Peter', geschenk: 'PKV-Check', erstellt: '2026-03-02 08:00:00', bestaetigt: '2026-03-02 09:00:00' },
    { id: 2, teilung_id: 10, vorname: 'Erika', geschenk: 'PKV-Check', erstellt: '2026-03-02 08:00:00', bestaetigt: '2026-03-02 09:00:00' },
    { id: 3, teilung_id: 10, vorname: 'Unbestätigt', geschenk: 'PKV-Check', erstellt: '2026-03-02 08:00:00', bestaetigt: null },
  ];
  const ein: Einwilligung[] = [
    { anfrage_id: 1, art: 'empfehler_info', erteilt: '2026-03-02 08:00:00' },
    { anfrage_id: 3, art: 'empfehler_info', erteilt: '2026-03-02 08:00:00' },
  ];
  const w = berechneWirkung(teil, ev, anf, ein, '2026-03-03 00:00:00');
  assert.equal(w.verschenkt, 1);
  assert.equal(w.geoeffnet, 2);
  assert.equal(w.eingeloest, 2);
  assert.deepEqual(w.personen, [{ name: 'Max', geschenk: 'PKV-Check' }]);
  assert.equal(w.neuSeit, 1);
  assert.equal(berechneWirkung(teil, ev, anf, ein, null).neuSeit, 2);
});
