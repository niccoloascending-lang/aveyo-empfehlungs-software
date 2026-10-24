// Google-Kalender-Abgleich: belegte Zeiten des Beraters ausblenden, bestätigte Termine eintragen.
// Zugang über ein Google-Dienstkonto (JSON-Schlüssel). Der Kalender des Beraters wird für das Dienstkonto
// freigegeben („Änderungen an Terminen vornehmen“). Kalender-ID je Berater im Admin-Profil (meist die E-Mail).
import fs from 'node:fs';
import { one, run } from './db.ts';
import { einstellungen, basisUrl } from './einstellungen.ts';
import { jwtAssertion, istDienstkonto, freeBusyAnfrage, belegtAusAntwort, eventDaten, TOKEN_URL, type Dienstkonto } from './kalender-pure.ts';
import type { Zeitraum } from './slots.ts';

let konto: Dienstkonto | null | undefined;
function dienstkonto(): Dienstkonto | null {
  if (konto !== undefined) return konto;
  try {
    const roh = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || (process.env.GOOGLE_SERVICE_ACCOUNT_FILE ? fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_FILE, 'utf8') : '');
    const j = roh ? JSON.parse(roh) : null;
    konto = istDienstkonto(j) ? j : null;
  } catch {
    console.error('Google-Dienstkonto konnte nicht gelesen werden.');
    konto = null;
  }
  return konto;
}

export const kalenderAktiv = () => !!dienstkonto();

let token: { wert: string; bis: number } | null = null;
async function zugang(): Promise<string | null> {
  const sa = dienstkonto();
  if (!sa) return null;
  if (token && token.bis > Date.now() + 60_000) return token.wert;
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwtAssertion(sa) }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) {
    console.error('Google-Anmeldung fehlgeschlagen:', r.status);
    return null;
  }
  const j = await r.json();
  token = { wert: j.access_token, bis: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  return token.wert;
}

const cache = new Map<string, { bis: number; belegt: Zeitraum[] }>();

/** Frei/belegt direkt bei Google abfragen. Gibt die Zeiträume oder einen Fehlertext zurück. */
async function ladeBelegt(kalenderId: string): Promise<Zeitraum[] | string> {
  try {
    const tk = await zugang();
    if (!tk) return 'Anmeldung des Dienstkontos bei Google fehlgeschlagen (Schlüssel prüfen).';
    const von = new Date();
    const bis = new Date(Date.now() + (einstellungen().verfuegbarkeit.tageVoraus + 2) * 86400_000);
    const r = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(freeBusyAnfrage(kalenderId, von, bis)),
      signal: AbortSignal.timeout(8000),
    });
    const belegt = r.ok ? belegtAusAntwort(await r.json(), kalenderId) : null;
    return belegt ?? `Kalender „${kalenderId}“ nicht lesbar. Ist er für das Dienstkonto freigegeben?`;
  } catch {
    return 'Google-Kalender nicht erreichbar.';
  }
}

/**
 * Belegte Zeiten im Kalender (nur frei/belegt, keine Inhalte). 2 Minuten Zwischenspeicher.
 * Bei Fehlern: leere Liste (der Freund sieht weiter Termine; eine Doppelbuchung ist dann per Mail zu klären).
 */
export async function belegtImKalender(kalenderId: string | null | undefined): Promise<Zeitraum[]> {
  if (!kalenderId || !kalenderAktiv()) return [];
  const c = cache.get(kalenderId);
  if (c && c.bis > Date.now()) return c.belegt;
  const r = await ladeBelegt(kalenderId);
  if (typeof r === 'string') {
    console.error('Google-Kalender:', r);
    return [];
  }
  cache.set(kalenderId, { bis: Date.now() + 120_000, belegt: r });
  return r;
}

/** Für den Admin: Verbindung prüfen. */
export async function kalenderTesten(kalenderId: string | null): Promise<{ ok: boolean; text: string }> {
  if (!kalenderAktiv()) return { ok: false, text: 'Kein Google-Dienstkonto eingerichtet (GOOGLE_SERVICE_ACCOUNT_FILE in .env.local, siehe README).' };
  if (!kalenderId) return { ok: false, text: 'Bitte zuerst die Kalender-ID eintragen und speichern.' };
  const r = await ladeBelegt(kalenderId);
  if (typeof r === 'string') return { ok: false, text: r };
  cache.delete(kalenderId);
  return { ok: true, text: `Verbunden. ${r.length} belegte Zeiträume in den nächsten Wochen werden für Freunde ausgeblendet.` };
}

export const dienstkontoEmail = () => dienstkonto()?.client_email ?? null;

export function kalenderVonBerater(beraterId: number | null | undefined): string | null {
  if (!beraterId) return null;
  return one<{ kalender_id: string | null }>('SELECT kalender_id FROM berater WHERE id = ?', beraterId)?.kalender_id ?? null;
}

/** Bestätigten Termin in den Kalender des Beraters eintragen. Gibt true zurück, wenn eingetragen. */
export async function terminEintragen(anfrageId: number, beraterId: number | null): Promise<boolean> {
  const kalenderId = kalenderVonBerater(beraterId);
  if (!kalenderId || !kalenderAktiv()) return false;
  const a = one<any>(
    `SELECT a.*, g.titel geschenk, k.vorname kv, k.nachname kn FROM anfragen a
       LEFT JOIN geschenke g ON g.id = a.geschenk_id LEFT JOIN teilungen t ON t.id = a.teilung_id LEFT JOIN kunden k ON k.id = t.kunde_id
      WHERE a.id = ?`,
    anfrageId,
  );
  if (!a?.termin_start || a.google_event_id) return !!a?.google_event_id;
  try {
    const tk = await zugang();
    if (!tk) return false;
    const body = eventDaten({
      start: a.termin_start,
      dauerMin: einstellungen().verfuegbarkeit.dauerMin,
      vorname: a.vorname,
      nachname: a.nachname,
      email: a.email,
      telefon: a.telefon,
      ort: a.termin_ort,
      geschenk: a.geschenk ?? 'Geschenk',
      empfehler: a.kv ? `${a.kv} ${a.kn ?? ''}`.trim() : null,
      adminLink: `${basisUrl()}/admin/anfragen`,
    });
    const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(kalenderId)}/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error('Google-Kalender: Termin nicht eingetragen,', r.status);
      return false;
    }
    const j = await r.json();
    run('UPDATE anfragen SET google_event_id = ? WHERE id = ?', String(j.id), anfrageId);
    cache.delete(kalenderId);
    return true;
  } catch {
    console.error('Google-Kalender nicht erreichbar (Termin eintragen).');
    return false;
  }
}

/** Termin wieder austragen (z. B. Status „kein Interesse“ oder Anfrage gelöscht). */
export async function terminAustragen(anfrageId: number, beraterId: number | null) {
  const kalenderId = kalenderVonBerater(beraterId);
  const ev = one<{ google_event_id: string | null }>('SELECT google_event_id FROM anfragen WHERE id = ?', anfrageId)?.google_event_id;
  if (!kalenderId || !ev || !kalenderAktiv()) return;
  try {
    const tk = await zugang();
    if (!tk) return;
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(kalenderId)}/events/${encodeURIComponent(ev)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tk}` },
      signal: AbortSignal.timeout(8000),
    });
    run('UPDATE anfragen SET google_event_id = NULL WHERE id = ?', anfrageId);
    cache.delete(kalenderId);
  } catch {
    console.error('Google-Kalender nicht erreichbar (Termin austragen).');
  }
}
