import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kontingent, erinnerungen, sozialeZahl, baumReihe, anlaesseLesen, anlaesseFuer, type ErinnerKunde, type Anlass } from '../src/lib/anreize.ts';

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

test('Anlässe: passende Themen zuerst, fremde Themen weg, nur mit aktiven Geschenken, max. 6', () => {
  const a = (id: number, themen: string, geschenke: string, reihenfolge = id, aktiv = 1): Anlass => ({ id, text: `A${id}`, icon: '', geschenke, themen, reihenfolge, aktiv });
  const alle = [a(1, '', '1,2'), a(2, '', '3'), a(3, 'pkv', '4,5'), a(4, 'immobilien', '6'), a(5, '', '99'), a(6, '', '1', 6, 0)];
  const aktiv = [1, 2, 3, 4, 5, 6];
  assert.deepEqual(anlaesseFuer(alle, 'pkv,vorsorge', aktiv).map((x) => x.id), [3, 1, 2]);
  assert.deepEqual(anlaesseFuer(alle, 'immobilien', aktiv).map((x) => x.id), [4, 1, 2]);
  assert.deepEqual(anlaesseFuer(alle, '', aktiv).map((x) => x.id), [1, 2]);
  assert.deepEqual(anlaesseFuer(alle, 'pkv', [2, 5]).map((x) => [x.id, x.geschenkIds]), [[3, [5]], [1, [2]]]);
  assert.equal(anlaesseFuer(Array.from({ length: 9 }, (_, i) => a(i + 1, '', '1')), '', [1]).length, 6);
});
