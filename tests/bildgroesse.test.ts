import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zielGroesse, verkleinerungsStufen } from '../src/lib/bildgroesse.ts';

test('Zielgröße: längste Kante begrenzt, Seitenverhältnis bleibt, nie vergrößern', () => {
  assert.deepEqual(zielGroesse(2400, 3600, 900), { breite: 600, hoehe: 900 });
  assert.deepEqual(zielGroesse(4000, 3000, 1600), { breite: 1600, hoehe: 1200 });
  assert.deepEqual(zielGroesse(500, 400, 900), { breite: 500, hoehe: 400 });
  assert.deepEqual(zielGroesse(0, 400, 900), { breite: 0, hoehe: 0 });
});

test('Verkleinern in Halbierungsschritten (scharf statt pixelig)', () => {
  assert.deepEqual(verkleinerungsStufen(2400, 3600, { breite: 600, hoehe: 900 }), [
    { breite: 1200, hoehe: 1800 },
    { breite: 600, hoehe: 900 },
  ]);
  assert.deepEqual(verkleinerungsStufen(800, 600, { breite: 700, hoehe: 525 }), [{ breite: 700, hoehe: 525 }]);
});
