import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kontingent, erinnerungen, sozialeZahl, baumReihe, anlaesseLesen, type ErinnerKunde } from '../src/lib/anreize.ts';

const jetzt = new Date('2026-10-24T12:00:00Z');

test('Kontingent: 12 Monate rollierend, erhöhbar, 0 = unbegrenzt', () => {
  assert.deepEqual(kontingent(3, 0, [], jetzt), { gesamt: 3, verbraucht: 0, rest: 3 });
  assert.deepEqual(kontingent(3, 0, ['2026-10-01 10:00:00', null, '2025-01-01 10:00:00'], jetzt), { gesamt: 3, verbraucht: 1, rest: 2 });
  assert.deepEqual(kontingent(3, 0, ['2026-10-01 10:00:00', '2026-10-02 10:00:00', '2026-10-03 10:00:00', '2026-10-04 10:00:00'], jetzt).rest, 0);
  assert.deepEqual(kontingent(3, 3, ['2026-10-01 10:00:00', '2026-10-02 10:00:00', '2026-10-03 10:00:00'], jetzt), { gesamt: 6, verbraucht: 3, rest: 3 });
  assert.deepEqual(kontingent(0, 0, ['2026-10-01 10:00:00'], jetzt), { gesamt: null, verbraucht: 1, rest: null });
});

test('Erinnerungen: nur aktive Links ohne Teilung, ab 7 Tagen, höchstens alle 60 Tage', () => {
  const k = (x: Partial<ErinnerKunde>): ErinnerKunde => ({ id: 0, token_erstellt: '2026-09-01 10:00:00', token_widerrufen: null, zuletzt_gesehen: null, geteilt: 0, erinnert_am: null, ...x });
  const r = erinnerungen(
    [
      k({ id: 1 }), // nie geöffnet, seit 53 Tagen
      k({ id: 2, zuletzt_gesehen: '2026-10-10 10:00:00' }), // geöffnet, 14 Tage nichts geteilt
      k({ id: 3, zuletzt_gesehen: '2026-10-22 10:00:00' }), // zu frisch
      k({ id: 4, geteilt: 1 }), // hat geteilt
      k({ id: 5, token_widerrufen: '2026-09-02 10:00:00' }), // Link widerrufen
      k({ id: 6, erinnert_am: '2026-10-01 10:00:00' }), // gerade erst erinnert
      k({ id: 7, erinnert_am: '2026-07-01 10:00:00' }), // Erinnerung lange her
    ],
    jetzt,
  );
  assert.deepEqual(r.map((x) => [x.id, x.grund]), [[2, 'nicht_geteilt'], [1, 'nie_geoeffnet'], [7, 'nie_geoeffnet']]);
  assert.equal(r[0].seitTagen, 14);
});

test('Soziale Zahl, Baumreihe, Anlässe', () => {
  assert.equal(sozialeZahl(36, 0), 36);
  assert.equal(sozialeZahl(36, 5), 41);
  assert.equal(sozialeZahl(-3, 2), 2);
  assert.deepEqual(baumReihe(3), { symbole: 3, mehr: 0 });
  assert.deepEqual(baumReihe(20, 12), { symbole: 12, mehr: 8 });
  assert.deepEqual(anlaesseLesen('a\n\n b \n'), ['a', 'b']);
  assert.deepEqual(anlaesseLesen(null), []);
});
