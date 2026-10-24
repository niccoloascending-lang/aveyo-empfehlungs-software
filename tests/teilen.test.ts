import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waehleVariante, baueNachricht, imSatz, teilenUrl, saeubereZitat, freundLink, istKanal, type Vorlage } from '../src/lib/teilen.ts';

const V: Vorlage[] = [
  { id: 1, ton: 'locker', variante: 'A', text: 'Hey! {geschenk} {link}', aktiv: 1 },
  { id: 2, ton: 'locker', variante: 'B', text: 'Tipp: {geschenk} {link}', aktiv: 1 },
  { id: 3, ton: 'locker', variante: 'C', text: 'aus', aktiv: 0 },
  { id: 4, ton: 'kurz', variante: 'A', text: '{geschenk}', aktiv: 1 },
];

test('A/B: gleichverteilt über aktive Varianten, inaktive nie', () => {
  assert.equal(waehleVariante(V, 'locker', 0)?.id, 1);
  assert.equal(waehleVariante(V, 'locker', 0.49)?.id, 1);
  assert.equal(waehleVariante(V, 'locker', 0.5)?.id, 2);
  assert.equal(waehleVariante(V, 'locker', 0.9999)?.id, 2);
  assert.equal(waehleVariante(V, 'ausfuehrlich', 0.3), null);
  const zaehler = new Map<number, number>();
  for (let i = 0; i < 1000; i++) {
    const v = waehleVariante(V, 'locker', Math.random())!;
    zaehler.set(v.id, (zaehler.get(v.id) ?? 0) + 1);
  }
  assert.equal(zaehler.has(3), false);
  assert.ok(zaehler.get(1)! > 350 && zaehler.get(2)! > 350);
});

test('Nachricht: Link wird ergänzt, falls er in der Vorlage fehlt', () => {
  assert.equal(baueNachricht('Hey! {geschenk} {link}', { geschenk: 'PKV-Check', link: 'https://x/g/1' }), 'Hey! PKV-Check https://x/g/1');
  assert.equal(baueNachricht('{geschenk}', { geschenk: 'PKV-Check', link: 'https://x/g/1' }), 'PKV-Check https://x/g/1');
  assert.equal(
    baueNachricht('Ich schenk dir {geschenk_satz}: {link}', { geschenk: 'PKV-Check', geschenkSatz: 'einen kostenlosen PKV-Check', link: 'https://x/g/1' }),
    'Ich schenk dir einen kostenlosen PKV-Check: https://x/g/1',
  );
  assert.equal(baueNachricht('Ich schenk dir {geschenk_satz} {link}', { geschenk: 'PKV-Check', link: 'L' }), 'Ich schenk dir PKV-Check L');
  assert.equal(imSatz({ titel: 'PKV-Check', akkusativ: ' ' }), 'PKV-Check');
  assert.equal(imSatz({ titel: 'PKV-Check', akkusativ: 'einen PKV-Check' }), 'einen PKV-Check');
});

test('Teilen-URLs öffnen nur die Apps des Kunden', () => {
  const n = 'Schau mal: https://x/g/ABC & mehr';
  assert.equal(teilenUrl('whatsapp', n, 'https://x/g/ABC'), 'https://wa.me/?text=' + encodeURIComponent(n));
  assert.match(teilenUrl('telegram', n, 'https://x/g/ABC')!, /^https:\/\/t\.me\/share\/url\?url=https%3A%2F%2Fx%2Fg%2FABC&text=/);
  assert.match(teilenUrl('email', n, 'https://x/g/ABC', 'Betreff')!, /^mailto:\?subject=Betreff&body=/);
  assert.equal(teilenUrl('signal', n, 'https://x/g/ABC'), null);
  assert.equal(freundLink('https://geschenk.aveyo.de/', 'ABC'), 'https://geschenk.aveyo.de/g/ABC');
  assert.ok(istKanal('whatsapp'));
  assert.equal(istKanal('sms-versand'), false);
});

test('Zitat: eine Zeile, kurz, ohne Links und Kontaktdaten', () => {
  assert.equal(saeubereZitat('Ehrlich\nund ohne Druck'), 'Ehrlich und ohne Druck');
  assert.equal(saeubereZitat('Ruf an: 0171 1234567 oder mail@x.de www.spam.de'), 'Ruf an: oder');
  assert.equal(saeubereZitat('x'.repeat(500)).length, 160);
  assert.equal(saeubereZitat(42), '');
});
