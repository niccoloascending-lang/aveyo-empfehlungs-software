// A/B-Test Dankeschön: Gruppe je Kunde, Spenden (A) je Einlösung, Prämien (B) je stattgefundenem Gespräch.
// Die App zahlt nichts aus: Sie führt eine Liste, die im Admin unter „Dankeschön“ abgearbeitet wird.
import { all, one, run } from './db.ts';
import { einstellungen, texte } from './einstellungen.ts';
import { belohnungsVariante, praemieFaellig, zweckeLesen, zweckOderStandard, type Variante } from './anreize.ts';

export const EINLOESUNGEN = ['download', 'rechner', 'termin_bestaetigt', 'auswertung_bestaetigt', 'download_mail_bestaetigt'];

/** Gruppe eines Kunden; wird beim ersten Bedarf zufällig vergeben und bleibt dann fest. */
export function varianteVon(kundeId: number): Variante {
  const k = one<{ belohnung_variante: string }>('SELECT belohnung_variante FROM kunden WHERE id = ?', kundeId);
  const e = einstellungen();
  const v = belohnungsVariante(k?.belohnung_variante, e.abTest.aktiv, e.abTest.anteilB, Math.random());
  if (k && k.belohnung_variante !== v) run('UPDATE kunden SET belohnung_variante = ? WHERE id = ?', v, kundeId);
  return v;
}

/** Ursprünglicher Empfehler einer Teilung (auch bei Weitergabe durch Freunde). */
export function urKunde(teilungId: number | null): number | null {
  let id = teilungId;
  for (let i = 0; id && i < 20; i++) {
    const t = one<{ kunde_id: number | null; eltern_teilung_id: number | null }>('SELECT kunde_id, eltern_teilung_id FROM teilungen WHERE id = ?', id);
    if (!t) return null;
    if (t.kunde_id) return t.kunde_id;
    id = t.eltern_teilung_id;
  }
  return null;
}

export const spendenZwecke = () => zweckeLesen(texte(['belohnung.spende.zwecke'])['belohnung.spende.zwecke']);

/** Bei jeder Einlösung: Gruppe A → Spende in Höhe von spendeBetrag an den gewählten Zweck zusagen. */
export function beiEinloesung(typ: string, teilungId: number | null) {
  if (!EINLOESUNGEN.includes(typ)) return;
  const kundeId = urKunde(teilungId);
  if (!kundeId) return;
  const e = einstellungen();
  if (varianteVon(kundeId) !== 'A' || e.spendeBetrag <= 0) return;
  const k = one<{ spendenzweck: string | null }>('SELECT spendenzweck FROM kunden WHERE id = ?', kundeId);
  run(
    "INSERT INTO zusagen (kunde_id, variante, art, zweck, betrag, teilung_id) VALUES (?, 'A', 'spende', ?, ?, ?)",
    kundeId,
    zweckOderStandard(k?.spendenzweck, spendenZwecke()),
    e.spendeBetrag,
    teilungId,
  );
}

/** Statuswechsel einer Anfrage: Gespräch hat stattgefunden → Gruppe B bekommt eine Prämie (einmal je Anfrage). */
export function beiStatuswechsel(anfrageId: number, alt: string, neu: string) {
  if (!praemieFaellig(alt, neu)) return;
  const a = one<{ teilung_id: number | null }>('SELECT teilung_id FROM anfragen WHERE id = ?', anfrageId);
  const kundeId = urKunde(a?.teilung_id ?? null);
  if (!kundeId) return;
  const e = einstellungen();
  if (varianteVon(kundeId) !== 'B' || e.praemieBetrag <= 0) return;
  run(
    "INSERT OR IGNORE INTO zusagen (kunde_id, variante, art, betrag, teilung_id, anfrage_id) VALUES (?, 'B', 'praemie', ?, ?, ?)",
    kundeId,
    e.praemieBetrag,
    a?.teilung_id ?? null,
    anfrageId,
  );
}

export function zusagenVon(kundeId: number) {
  const r = one<{ spenden: number; spendeSumme: number; praemien: number; praemieSumme: number }>(
    `SELECT COALESCE(SUM(art = 'spende'), 0) spenden, COALESCE(SUM(CASE WHEN art = 'spende' THEN betrag END), 0) spendeSumme,
            COALESCE(SUM(art = 'praemie'), 0) praemien, COALESCE(SUM(CASE WHEN art = 'praemie' THEN betrag END), 0) praemieSumme
       FROM zusagen WHERE kunde_id = ?`,
    kundeId,
  )!;
  return r;
}

export const spendenGesamt = () => one<{ s: number }>("SELECT COALESCE(SUM(betrag), 0) s FROM zusagen WHERE art = 'spende'")!.s;

export function offeneZusagen() {
  return all(
    `SELECT z.*, k.vorname, k.nachname FROM zusagen z LEFT JOIN kunden k ON k.id = z.kunde_id
      WHERE z.status = 'offen' ORDER BY z.art, z.zweck, z.id`,
  );
}
