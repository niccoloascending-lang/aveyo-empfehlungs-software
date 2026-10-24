import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTE, fuelle, rohtext, text, textPaket, rechtlichePruefliste, bloecke } from '../src/lib/texte.ts';

test('Platzhalter: bekannte ersetzt, unbekannte leer (nichts erfinden)', () => {
  assert.equal(fuelle('Hallo {vorname}, {unbekannt}!', { vorname: 'Lisa' }), 'Hallo Lisa, !');
  assert.equal(fuelle('{n} × geöffnet', { n: 3 }), '3 × geöffnet');
});

test('Du/Sie und Überschreibungen aus dem Admin', () => {
  assert.equal(text('freund.ueberschrift', 'du', {}, { empfehler: 'Lisa' }), 'Lisa schenkt dir');
  assert.equal(text('freund.ueberschrift', 'sie', {}, { empfehler: 'Lisa' }), 'Lisa schenkt Ihnen');
  // Text ohne Sie-Form: Du-Form gilt auch für Sie
  assert.equal(rohtext('freund.kosten', 'sie'), 'Kosten: 0 €');
  const o = { 'freund.kosten': { du: 'Kostet nichts' } };
  assert.equal(rohtext('freund.kosten', 'du', o), 'Kostet nichts');
  assert.equal(rohtext('freund.kosten', 'sie', o), 'Kostet nichts');
  // Eigene Sie-Überschreibung gewinnt
  assert.equal(rohtext('freund.ueberschrift', 'sie', { 'freund.ueberschrift': { sie: 'Für Sie von {empfehler}' } }), 'Für Sie von {empfehler}');
  // Du-Überschreibung ändert nicht die Standard-Sie-Form
  assert.equal(rohtext('freund.ueberschrift', 'sie', { 'freund.ueberschrift': { du: 'X' } }), '{empfehler} schenkt Ihnen');
  assert.equal(rohtext('gibt.es.nicht', 'du'), 'gibt.es.nicht');
});

test('Textpaket nach Präfix', () => {
  const p = textPaket('du', {}, ['freund.']);
  assert.ok(p['freund.versprechen']);
  assert.equal(p['kunde.titel'], undefined);
});

test('Kernversprechen und Pflichttexte vorhanden und rechtlich markiert', () => {
  assert.match(TEXTE['freund.versprechen'].du, /Niemand ruft dich an/);
  const keys = rechtlichePruefliste().map((r) => r.key);
  for (const k of ['freund.versprechen', 'seite.datenschutz', 'seite.impressum', 'seite.erstinformation', 'freund.einwilligung.empfehler'])
    assert.ok(keys.includes(k), k);
});

test('Keine Superlative oder Renditeversprechen in Standardtexten', () => {
  const alle = Object.values(TEXTE).flatMap((d: any) => [d.du, d.sie ?? '']).join('\n').toLowerCase();
  for (const verboten of ['der beste', 'die beste', 'einzige unabhängige', 'garantiert', 'rendite von', 'sicherer gewinn'])
    assert.ok(!alle.includes(verboten), verboten);
});

test('Einfacher Textsatz', () => {
  const b = bloecke('# Titel\n\nAbsatz eins\nZeile zwei\n\n## Unter\n- a\n- b\nNach Liste');
  assert.deepEqual(b.map((x) => x.typ), ['h1', 'p', 'h2', 'ul', 'p']);
  assert.deepEqual(b[3].punkte, ['a', 'b']);
  assert.equal(b[1].text, 'Absatz eins\nZeile zwei');
});
