import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anmeldeUrl } from '../src/lib/weiterleitung.ts';

test('Anmeldung: öffentliche Adresse statt interner (hinter dem Webserver)', () => {
  assert.equal(anmeldeUrl('https://geschenk.aveyo.de', 'https://localhost:3200/admin').href, 'https://geschenk.aveyo.de/admin/login');
  assert.equal(anmeldeUrl('https://geschenk.aveyo.de/', 'http://127.0.0.1:3200/admin/kunden').href, 'https://geschenk.aveyo.de/admin/login');
});

test('Anmeldung: ohne oder mit ungültiger Einstellung die Adresse der Anfrage', () => {
  assert.equal(anmeldeUrl(undefined, 'http://localhost:3200/admin').href, 'http://localhost:3200/admin/login');
  assert.equal(anmeldeUrl('', 'http://localhost:3200/admin').href, 'http://localhost:3200/admin/login');
  assert.equal(anmeldeUrl('geschenk.aveyo.de', 'http://localhost:3200/admin').href, 'http://localhost:3200/admin/login');
});
