import crypto from 'node:crypto';
import { admin, json, fehler, body } from '@/lib/admin';
import { protokolliere } from '@/lib/db';
import { einstellungen, setzeEinstellung, STANDARD, type Einstellungen } from '@/lib/einstellungen';
import { hashToken } from '@/lib/token';
import { hexZuRgb, kontrast } from '@/lib/theme';
import { istEmail, sauber } from '@/lib/validierung';

export const dynamic = 'force-dynamic';

export const GET = admin(() => {
  const e = einstellungen();
  return json({ ...e, apiKeyHash: e.apiKeyHash ? 'gesetzt' : '', webhookSecret: e.webhookSecret ? 'gesetzt' : '', kontrast: kontrast(e.theme.marke, '#ffffff') });
});

const zahl = (x: unknown, min: number, max: number, f: number) => {
  const n = Number(x);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : f;
};
const url = (x: unknown) => {
  const s = sauber(x, 500);
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
};

export const PUT = admin(async (req, b) => {
  const d = (await body(req)) as Partial<Einstellungen> & { apiKeyNeu?: boolean; webhookSecretNeu?: boolean };
  const e = einstellungen();
  if (d.anrede) setzeEinstellung('anrede', d.anrede === 'sie' ? 'sie' : 'du');
  if (d.theme) {
    const th = { ...e.theme };
    for (const k of ['marke', 'markeDunkel', 'markeHell', 'akzent', 'papier', 'tinte'] as const) if (d.theme[k] && hexZuRgb(d.theme[k]!)) th[k] = d.theme[k]!;
    if (typeof d.theme.schrift === 'string' && /^[A-Za-z0-9 ,'"-]{1,80}$/.test(d.theme.schrift)) th.schrift = d.theme.schrift;
    if (d.theme.logoDateiId !== undefined) th.logoDateiId = Number(d.theme.logoDateiId) > 0 ? Number(d.theme.logoDateiId) : null;
    if (typeof d.theme.firmenname === 'string') th.firmenname = sauber(d.theme.firmenname, 60) || STANDARD.theme.firmenname;
    setzeEinstellung('theme', th);
  }
  if (d.verfuegbarkeit) {
    const v = d.verfuegbarkeit;
    const zeit = (s: unknown, f: string) => (typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : f);
    setzeEinstellung('verfuegbarkeit', {
      wochentage: Array.isArray(v.wochentage) ? v.wochentage.map(Number).filter((n) => n >= 1 && n <= 7) : e.verfuegbarkeit.wochentage,
      von: zeit(v.von, e.verfuegbarkeit.von),
      bis: zeit(v.bis, e.verfuegbarkeit.bis),
      dauerMin: zahl(v.dauerMin, 10, 240, 30),
      pufferMin: zahl(v.pufferMin, 0, 120, 15),
      vorlaufStunden: zahl(v.vorlaufStunden, 0, 24 * 14, 24),
      tageVoraus: zahl(v.tageVoraus, 1, 90, 21),
      orte: Array.isArray(v.orte) ? (v.orte.filter((o) => o === 'online' || o === 'hamburg') as ('online' | 'hamburg')[]) : e.verfuegbarkeit.orte,
    });
  }
  if (d.terminModus) setzeEinstellung('terminModus', d.terminModus === 'extern' ? 'extern' : 'eigen');
  if (d.linkGueltigTage !== undefined) setzeEinstellung('linkGueltigTage', zahl(d.linkGueltigTage, 0, 3650, 0));
  if (d.loeschenMonate !== undefined) setzeEinstellung('loeschenMonate', zahl(d.loeschenMonate, 1, 60, 6));
  if (d.doiTage !== undefined) setzeEinstellung('doiTage', zahl(d.doiTage, 1, 60, 7));
  if (d.belohnungen) {
    const x = d.belohnungen;
    setzeEinstellung('belohnungen', { nachricht: !!x.nachricht, spende: !!x.spende, erlebnis: !!x.erlebnis, doppelt: !!x.doppelt });
    protokolliere(b.id, 'belohnungen_geaendert', JSON.stringify(x));
  }
  if (d.kontingent !== undefined) setzeEinstellung('kontingent', zahl(d.kontingent, 0, 50, 3));
  if (d.abTest) {
    setzeEinstellung('abTest', { aktiv: !!d.abTest.aktiv, anteilB: zahl(d.abTest.anteilB, 0, 100, 50) });
    protokolliere(b.id, 'ab_test', JSON.stringify(d.abTest));
  }
  if (d.spendeBetrag !== undefined) setzeEinstellung('spendeBetrag', zahl(d.spendeBetrag, 0, 1000, 10));
  if (d.praemieBetrag !== undefined) setzeEinstellung('praemieBetrag', zahl(d.praemieBetrag, 0, 1000, 50));
  if (d.praemieBildId !== undefined) setzeEinstellung('praemieBildId', Number(d.praemieBildId) > 0 ? Number(d.praemieBildId) : null);
  if (d.sozialAnzeigen !== undefined) setzeEinstellung('sozialAnzeigen', !!d.sozialAnzeigen);
  if (d.sozialStartwert !== undefined) setzeEinstellung('sozialStartwert', zahl(d.sozialStartwert, 0, 100000, 0));
  if (d.erinnerungNachTagen !== undefined) setzeEinstellung('erinnerungNachTagen', zahl(d.erinnerungNachTagen, 1, 90, 7));
  if (d.registerNr !== undefined) setzeEinstellung('registerNr', sauber(d.registerNr, 80));
  if (d.bewertungenUrl !== undefined) {
    const u = url(d.bewertungenUrl);
    if (u === null) return fehler('Bewertungs-Link ist keine gültige Adresse.');
    setzeEinstellung('bewertungenUrl', u);
  }
  for (const k of ['impressumUrl', 'datenschutzUrl', 'erstinformationUrl'] as const) {
    if (d[k] === undefined) continue;
    const u = url(d[k]);
    if (u === null) return fehler('Link zu Impressum/Datenschutz ist keine gültige Adresse.');
    setzeEinstellung(k, u);
  }
  if (d.adminMail !== undefined) {
    const m = sauber(d.adminMail, 200);
    if (m && !istEmail(m)) return fehler('Benachrichtigungs-Adresse ungültig.');
    setzeEinstellung('adminMail', m);
  }
  if (d.webhookUrl !== undefined) {
    const u = url(d.webhookUrl);
    if (u === null) return fehler('Webhook-Adresse ungültig.');
    setzeEinstellung('webhookUrl', u);
  }
  const antwort: Record<string, string> = {};
  // Geheimnisse werden genau einmal im Klartext angezeigt
  if (d.webhookSecretNeu) {
    const s = crypto.randomBytes(24).toString('base64url');
    setzeEinstellung('webhookSecret', s);
    antwort.webhookSecret = s;
  }
  if (d.apiKeyNeu) {
    const k = `gk_${crypto.randomBytes(24).toString('base64url')}`;
    setzeEinstellung('apiKeyHash', hashToken(k));
    antwort.apiKey = k;
    protokolliere(b.id, 'api_key_neu');
  }
  return json({ ok: true, ...antwort });
});
