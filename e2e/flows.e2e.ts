// E2E-Tests der drei Hauptflows mit Playwright (Chromium). Voraussetzung: `npm run build`.
// Startet eine eigene App-Instanz mit leerer Test-Datenbank (Port 3299), befüllt sie mit Beispieldaten und klickt durch.
// Aufruf: npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { totp } from '../src/lib/totp.ts';

const require = createRequire(import.meta.url);
function playwright() {
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
    try {
      return require(p);
    } catch {
      /* nächster Versuch */
    }
  }
  throw new Error('Playwright nicht gefunden: npm i -D playwright && npx playwright install chromium');
}
const { chromium, devices } = playwright();

const PORT = 3299;
const B = `http://localhost:${PORT}`;
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'geschenk-e2e-'));
const ENV = {
  ...process.env,
  GESCHENK_DATA_DIR: DATA,
  GESCHENK_BASE_URL: B,
  GESCHENK_2FA: 'an',
  SESSION_SECRET: 'e2e-test-geheimnis-mindestens-24-zeichen',
  SMTP_HOST: '',
};
let server: ChildProcess;
let browser: any;
const links: Record<string, string> = {};

const postausgang = () =>
  fs.existsSync(path.join(DATA, 'postausgang'))
    ? fs.readdirSync(path.join(DATA, 'postausgang')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(DATA, 'postausgang', f), 'utf8')))
    : [];

before(async () => {
  const out = execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', 'scripts/seed.ts'], { env: ENV, encoding: 'utf8' });
  for (const m of out.matchAll(/^\s+(\w+) \w+\s+(http\S+)$/gm)) links[m[1]] = m[2];
  assert.ok(links.Lisa, 'Seed liefert Magic-Links');
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT)], { env: ENV, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${B}/admin/login`)).ok) break;
    } catch {
      /* startet noch */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.kill();
  fs.rmSync(DATA, { recursive: true, force: true });
});

const handy = () => browser.newContext({ ...devices['iPhone 13'] });

test('Flow 1+2: Empfehler teilt in unter 30 s, Freund bucht Termin mit Double-Opt-in', async () => {
  const ctx = await handy();
  const p = await ctx.newPage();
  const start = Date.now();
  await p.goto(links.Lisa);
  // Erst die Person: „Wem möchtest du etwas schenken? Jemandem, der …“ – ein Tipp wählt das passende Geschenk
  await p.getByText('Wem möchtest du etwas schenken?').waitFor();
  assert.equal(await p.locator('textarea').count(), 0, 'Nachricht erst nach der Wahl');
  await p.getByRole('radio', { name: /gerade umgezogen ist/ }).click();
  await p.getByText('Das passt:').waitFor();
  await p.waitForSelector('textarea:not([disabled])');
  await p.getByText('Du hast 3 Geschenke für Freunde zu vergeben.').waitFor();
  await p.getByText('Schon 36 Kunden haben ein Geschenk an Freunde weitergegeben.').waitFor();
  await p.getByRole('button', { name: /Checkliste: Die wichtigsten Versicherungen/ }).waitFor(); // Alternative
  await p.getByRole('button', { name: /Ich spare jetzt 840 € im Jahr/ }).waitFor(); // persönlicher Erfolgs-Satz
  await p.getByRole('button', { name: 'Ehrlich und ohne Druck' }).click();
  await p.waitForTimeout(600);
  const nachricht = await p.locator('textarea').inputValue();
  const wa = await p.getByRole('link', { name: 'WhatsApp' }).getAttribute('href');
  assert.match(wa!, /^https:\/\/wa\.me\/\?text=/);
  assert.match(nachricht, /einen persönlichen Versicherungs-Check-up/, 'Geschenk steht grammatisch korrekt im Satz');
  await p.getByRole('button', { name: /kopieren/i }).first().click();
  await p.getByText('Danke! Dein Geschenk ist unterwegs.').waitFor();
  await p.getByText('Noch 2 von 3 Geschenken übrig.').waitFor();
  assert.ok(Date.now() - start < 30_000, 'Teilen in unter 30 Sekunden');

  // Keine Eingabefelder für Kontaktdaten von Freunden im Empfehler-Bereich
  assert.equal(await p.locator('input[type=email], input[type=tel]').count(), 0);

  const link = nachricht.match(/http\S+\/g\/\w+/)![0];
  const f = await ctx.newPage();
  await f.goto(link);
  // 5-Sekunden-Test: Wer, was, Kosten, keine Anrufe – alles im ersten Bildschirm
  for (const text of ['Lisa schenkt dir', 'einen persönlichen Versicherungs-Check-up', 'Wert 299 € · für dich geschenkt', 'Niemand ruft dich an']) {
    const box = await f.getByText(text).first().boundingBox();
    assert.ok(box && box.y + box.height <= 844, `${text} sichtbar ohne Scrollen`);
  }
  await f.getByText('„Ehrlich und ohne Druck“').waitFor();
  // Einwilligung „Empfehler darf es erfahren“ ist nicht vorausgewählt
  await f.locator('button[aria-pressed]').filter({ hasText: /^\d\d:\d\d$/ }).first().click();
  assert.equal(await f.getByLabel('Lisa darf erfahren, dass ich das Geschenk genutzt habe.').isChecked(), false);
  await f.getByLabel('Vorname').fill('Erika');
  await f.getByLabel('E-Mail').fill('erika@example.org');
  await f.getByText('Ich habe die Datenschutzhinweise gelesen').click();
  await f.getByText('Lisa darf erfahren').click();
  await f.getByRole('button', { name: 'Termin anfragen' }).click();
  await f.getByText('Fast geschafft!').waitFor();

  // Nur die Bestätigungs-Mail an die selbst eingegebene Adresse
  const mails = postausgang();
  assert.equal(mails.length, 1);
  assert.equal(mails[0].an, 'erika@example.org');
  const doi = mails[0].text.match(/http\S+\/bestaetigen\/\S+/)[0];
  await f.goto(doi);
  await f.getByRole('button', { name: 'Ja, ich bestätige' }).click();
  await f.getByText('Danke, bestätigt!').waitFor();
  assert.equal(postausgang().length, 2, 'Terminbestätigung erst nach Double-Opt-in');

  // Wirkung beim Empfehler: Name nur dank Einwilligung
  await p.goto(links.Lisa);
  await p.getByText('Dein Geschenk wurde gerade eingelöst').waitFor();
  await p.getByText('Erika hat „Versicherungs-Check-up“ genutzt').waitFor();
  await p.getByText('Schon 37 Kunden', { exact: false }).waitFor(); // Lisa zählt jetzt mit
  await p.getByRole('img', { name: '1 Bäume' }).waitFor();
  await ctx.close();
});

test('Flow 2b: Download ohne Termin und ohne Daten, danach Weitergeben', async () => {
  const ctx = await handy();
  const p = await ctx.newPage();
  await p.goto(links.Jonas);
  await p.getByRole('radio', { name: /Ich weiß schon/ }).click();
  await p.getByRole('radio', { name: /Checkliste/ }).click();
  await p.waitForSelector('textarea:not([disabled])');
  await p.waitForTimeout(400);
  const link = (await p.locator('textarea').inputValue()).match(/http\S+\/g\/\w+/)![0];
  const f = await ctx.newPage();
  await f.goto(link);
  const [dl] = await Promise.all([ctx.waitForEvent('page'), f.getByRole('link', { name: /ansehen/ }).click()]);
  await dl.getByRole('heading', { name: 'Die wichtigsten Versicherungen – hast du sie?' }).waitFor();
  await f.getByRole('button', { name: /Kennst du noch jemanden/ }).click();
  await f.getByRole('button', { name: 'Geschenk weitergeben' }).click();
  const wa = await f.getByRole('link', { name: 'WhatsApp' }).getAttribute('href');
  assert.match(decodeURIComponent(wa!), /\/g\/\w+/);
  await ctx.close();
});

test('Flow 3: Berater-Login mit 2FA, Anfrage sehen, Status setzen', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const a = await ctx.newPage();
  await a.goto(`${B}/admin`);
  await a.getByLabel('E-Mail').fill('adrian@example.org');
  await a.getByLabel('Passwort').fill('geschenk-demo-2026');
  await a.getByRole('button', { name: 'Weiter' }).click();
  await a.waitForURL(`${B}/admin/2fa`);
  await a.getByText('Code lässt sich nicht scannen?').click();
  const geheimnis = (await a.locator('code').innerText()).trim();
  await a.getByLabel('Code aus der App').fill(totp(geheimnis));
  await a.getByRole('button', { name: 'Bestätigen' }).click();
  await a.waitForURL(`${B}/admin`);
  await a.getByText('neue, bestätigte Anfrage').waitFor().catch(() => {});
  await a.goto(`${B}/admin/anfragen`);
  await a.getByText('Erika').first().waitFor();
  await a.getByText('Empfohlen von').first().waitFor();
  await a.getByLabel('Status').first().selectOption('beratung');
  await a.waitForTimeout(300);
  // Erinnern-Liste und QR im Termin
  const er = await a.request.get(`${B}/api/admin/erinnern`);
  assert.equal(er.status(), 200);
  await a.goto(`${B}/admin/kunden/3`);
  await a.getByRole('button', { name: /Jetzt im Termin teilen/ }).click();
  await a.getByText('scann mal kurz', { exact: false }).waitFor();
  assert.equal((await a.request.get(`${B}/api/admin/kunden/3/qr`)).headers()['content-type'], 'image/svg+xml');
  await a.goto(`${B}/admin/anfragen`);
  await a.waitForTimeout(300);
  await a.reload();
  assert.equal(await a.getByLabel('Status').first().inputValue(), 'beratung');
  // Ohne Sitzung kein Admin
  const fremd = await browser.newContext();
  const r = await fremd.request.get(`${B}/api/admin/anfragen`);
  assert.equal(r.status(), 401);
  await fremd.close();
  await ctx.close();
});
