import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRange } from '../src/lib/range.ts';

test('Range-Header für Videos', () => {
  assert.equal(parseRange(null, 1000), null);
  assert.deepEqual(parseRange('bytes=0-1', 1000), { start: 0, ende: 1 }); // Safari fragt zuerst so
  assert.deepEqual(parseRange('bytes=100-', 1000), { start: 100, ende: 999 });
  assert.deepEqual(parseRange('bytes=0-', 10_000_000, 1000), { start: 0, ende: 999 }); // begrenzt
  assert.deepEqual(parseRange('bytes=-200', 1000), { start: 800, ende: 999 });
  assert.deepEqual(parseRange('bytes=900-5000', 1000), { start: 900, ende: 999 });
  assert.equal(parseRange('bytes=1000-', 1000), 'ungueltig');
  assert.equal(parseRange('bytes=5-2', 1000), 'ungueltig');
  assert.equal(parseRange('items=0-1', 1000), 'ungueltig');
  assert.equal(parseRange('bytes=-', 1000), 'ungueltig');
});
