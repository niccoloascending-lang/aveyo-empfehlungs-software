import { test } from 'node:test';
import assert from 'node:assert/strict';
import { istEmail, sauber, telefon, themenLesen, geschenkeFuer, istVorschauBot } from '../src/lib/validierung.ts';
import { kundenAusCsv, parseCsv } from '../src/lib/csv.ts';

test('E-Mail und Telefon', () => {
  assert.ok(istEmail('lisa@example.org'));
  assert.equal(istEmail('lisa@'), false);
  assert.equal(istEmail('a b@c.de'), false);
  assert.equal(telefon(''), '');
  assert.equal(telefon('+49 171 1234567'), '+49 171 1234567');
  assert.equal(telefon('ruf mich an'), null);
  assert.equal(sauber('  a\u0000  b  '), 'a b');
});

test('Themen erkennen', () => {
  assert.deepEqual(themenLesen('PKV, Altersvorsorge'), ['pkv', 'vorsorge']);
  assert.deepEqual(themenLesen(['Immobilien', 'Vermögen', 'quatsch']), ['vermoegen', 'immobilien']);
  assert.deepEqual(themenLesen(''), []);
});

test('Geschenke passend zu Themen, max. 4', () => {
  const g = [
    { id: 1, themen: 'vorsorge', reihenfolge: 1 },
    { id: 2, themen: 'pkv', reihenfolge: 2 },
    { id: 3, themen: 'immobilien', reihenfolge: 3 },
    { id: 4, themen: 'pkv,vorsorge', reihenfolge: 4 },
    { id: 5, themen: '', reihenfolge: 5 },
  ];
  assert.deepEqual(geschenkeFuer(g, 'pkv').map((x) => x.id), [2, 4, 5, 1]); // 5 ohne Themen passt zu allen
  assert.deepEqual(geschenkeFuer(g, '').map((x) => x.id), [1, 2, 3, 4]);
});

test('Link-Vorschau-Bots zählen nicht als geöffnet', () => {
  assert.ok(istVorschauBot('WhatsApp/2.23.20.0'));
  assert.ok(istVorschauBot('facebookexternalhit/1.1'));
  assert.ok(istVorschauBot('TelegramBot (like TwitterBot)'));
  assert.ok(istVorschauBot(''));
  assert.equal(istVorschauBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'), false);
});

test('CSV: Semikolon, Anführungszeichen, BOM', () => {
  assert.deepEqual(parseCsv('﻿a;b\n"x;y";"sagt ""hi"""\n'), [['a', 'b'], ['x;y', 'sagt "hi"']]);
  assert.deepEqual(parseCsv('a,b\r\n1,2'), [['a', 'b'], ['1', '2']]);
});

test('CSV-Kundenimport mit Fehlern je Zeile', () => {
  const csv = 'Anrede;Vorname;Nachname;E-Mail;Handy;Themen;Kundennummer;Ansprache\nFrau;Lisa;Muster;LISA@example.org;+49 171 111;PKV, Vorsorge;K-1;Sie\n;;Ohne;x@example.org;;;;\n;Max;M;kaputt;;;;\n;Eva;E;lisa@example.org;;;;\n;Tom;T;tom@example.org;abc;;;';
  const r = kundenAusCsv(csv);
  assert.equal(r.kunden.length, 1);
  assert.deepEqual(r.kunden[0], { vorname: 'Lisa', nachname: 'Muster', anrede: 'frau', ansprache: 'sie', email: 'lisa@example.org', handy: '+49 171 111', themen: 'pkv,vorsorge', extern_id: 'K-1' });
  assert.deepEqual(r.fehler.map((f) => f.zeile), [3, 4, 5, 6]);
  assert.equal(kundenAusCsv('Name;Telefon\nA;1').fehler[0].zeile, 1);
});
