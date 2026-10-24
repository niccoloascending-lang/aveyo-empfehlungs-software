import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruefeEingabe, rentenluecke } from '../src/lib/rechner.ts';
import { kennzahlen, quote } from '../src/lib/statistik.ts';
import { zuLoeschen } from '../src/lib/loeschung.ts';
import { webhookHeader, pruefeWebhook, naechsterVersuch } from '../src/lib/webhook-pure.ts';
import { hexZuRgb, themeCss, kontrast } from '../src/lib/theme.ts';

test('Rentenlücken-Rechner', () => {
  const r = pruefeEingabe({ alter: '35', rentenalter: 67, netto: '3500', rente: 1400, zielProzent: 80, inflation: '2' });
  assert.ok('eingabe' in r);
  const e = rentenluecke((r as any).eingabe);
  assert.equal(e.jahreBisRente, 32);
  assert.equal(e.bedarfHeute, 2800);
  assert.equal(e.lueckeHeute, 1400);
  assert.equal(e.lueckeBeiRentenbeginn, Math.round(1400 * Math.pow(1.02, 32)));
  assert.equal(rentenluecke({ alter: 30, rentenalter: 67, netto: 2000, rente: 3000, zielProzent: 80, inflation: 2 }).lueckeHeute, 0);
  assert.ok('fehler' in pruefeEingabe({ alter: 70, rentenalter: 67, netto: 1, rente: 1, zielProzent: 80, inflation: 2 }));
  assert.ok('fehler' in pruefeEingabe({ alter: 'x' }));
});

test('Kennzahlen und Conversion je Geschenk/Vorlage/Kanal', () => {
  const t = [
    { id: 1, kunde_id: 1, geschenk_id: 1, vorlage_id: 1, geteilt_am: 'x', kanal: 'whatsapp' },
    { id: 2, kunde_id: 1, geschenk_id: 1, vorlage_id: 2, geteilt_am: 'x', kanal: 'whatsapp' },
    { id: 3, kunde_id: 2, geschenk_id: 2, vorlage_id: 1, geteilt_am: 'x', kanal: 'kopieren' },
    { id: 4, kunde_id: 3, geschenk_id: 2, vorlage_id: 1, geteilt_am: null, kanal: null },
  ];
  const e = [
    { teilung_id: 1, typ: 'geoeffnet' },
    { teilung_id: 1, typ: 'termin_bestaetigt' },
    { teilung_id: 3, typ: 'geoeffnet' },
    { teilung_id: 3, typ: 'download' },
    { teilung_id: 3, typ: 'download' },
  ];
  const a = [{ teilung_id: 1, typ: 'termin', status: 'kunde', bestaetigt: 'x' }];
  const k = kennzahlen(5, t, e, a, new Map([[1, 'PKV-Check'], [2, 'Checkliste']]), new Map([[1, 'locker A'], [2, 'locker B']]));
  assert.equal(k.kundenGeteilt, 2);
  assert.equal(k.geteilt, 3);
  assert.equal(k.geoeffnet, 2);
  assert.equal(k.eingeloest, 3);
  assert.equal(k.termine, 1);
  assert.equal(k.kunden, 1);
  const pkv = k.proGeschenk.find((z) => z.name === 'PKV-Check')!;
  assert.deepEqual([pkv.geteilt, pkv.eingeloest, pkv.termine, pkv.quote], [2, 1, 1, 50]);
  assert.equal(k.proGeschenk[0].name, 'Checkliste'); // 2/1 = 200 %
  assert.equal(k.proVorlage.find((z) => z.name === 'locker B')!.quote, 0);
  assert.equal(k.proKanal.find((z) => z.id === 'whatsapp')!.geteilt, 2);
  assert.equal(quote(1, 3), 33.3);
  assert.equal(quote(1, 0), 0);
});

test('Löschkonzept', () => {
  const jetzt = new Date('2026-10-01T00:00:00Z');
  const a = [
    { id: 1, typ: 'termin', status: 'neu', bestaetigt: null, erstellt: '2026-09-20 10:00:00', geaendert: '2026-09-20 10:00:00' }, // DOI abgelaufen
    { id: 2, typ: 'termin', status: 'neu', bestaetigt: null, erstellt: '2026-09-29 10:00:00', geaendert: '2026-09-29 10:00:00' }, // DOI läuft noch
    { id: 3, typ: 'download_mail', status: 'neu', bestaetigt: 'x', erstellt: '2026-01-01 10:00:00', geaendert: '2026-01-01 10:00:00' }, // alt, ohne Termin
    { id: 4, typ: 'termin', status: 'termin', bestaetigt: 'x', erstellt: '2025-01-01 10:00:00', geaendert: '2025-01-01 10:00:00' }, // Termin bleibt
    { id: 5, typ: 'termin', status: 'kein_interesse', bestaetigt: 'x', erstellt: '2025-01-01 10:00:00', geaendert: '2026-01-01 10:00:00' },
    { id: 6, typ: 'auswertung', status: 'neu', bestaetigt: 'x', erstellt: '2026-08-01 10:00:00', geaendert: '2026-08-01 10:00:00' }, // jung
  ];
  assert.deepEqual(zuLoeschen(a, jetzt, 6, 7), [1, 3, 5]);
});

test('Webhook-Signatur', () => {
  const body = JSON.stringify({ a: 1 });
  const h = webhookHeader(body, 'geheim', 1000);
  assert.ok(pruefeWebhook(body, 'geheim', h['X-Geschenk-Zeit'], h['X-Geschenk-Signatur'], 1100));
  assert.equal(pruefeWebhook(body + ' ', 'geheim', h['X-Geschenk-Zeit'], h['X-Geschenk-Signatur'], 1100), false);
  assert.equal(pruefeWebhook(body, 'geheim', h['X-Geschenk-Zeit'], h['X-Geschenk-Signatur'], 5000), false);
  assert.equal(naechsterVersuch(0), 60000);
  assert.equal(naechsterVersuch(5), null);
});

test('Theme', () => {
  assert.equal(hexZuRgb('#B4532A'), '180 83 42');
  assert.equal(hexZuRgb('#fff'), '255 255 255');
  assert.equal(hexZuRgb('rot'), null);
  assert.match(themeCss({ marke: 'kaputt', schrift: 'x;}body{display:none' }), /--marke: 23 37 69;.*--schrift: 'Proxima Nova';/);
  assert.equal(kontrast('#000000', '#ffffff'), 21);
});
