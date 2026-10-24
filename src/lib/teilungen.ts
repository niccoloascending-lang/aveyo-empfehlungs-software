// Teilungen (persönliche Freund-Links) und anonyme Ereignisse.
import { all, one, run, insertRow } from './db.ts';
import { neuerCode, istCodeFormat } from './token.ts';
import { saeubereZitat, waehleVariante, type Ton, type Vorlage } from './teilen.ts';

export type Geschenk = {
  id: number;
  titel: string;
  kurz: string;
  nutzen: string;
  ablauf: string;
  dauer: string;
  typ: 'termin' | 'download' | 'rechner';
  themen: string;
  icon: string;
  bild_id: number | null;
  datei_id: number | null;
  inhalt: string | null;
  rechner: string | null;
  aktiv: number;
  reihenfolge: number;
};

export type BeraterOeffentlich = { id: number; name: string; foto_id: number | null; vorstellung: string | null; video_url: string | null; termin_url: string | null };

export type Teilung = {
  id: number;
  code: string;
  kunde_id: number | null;
  geschenk_id: number;
  zitat: string | null;
  von_name: string | null;
  vorlage_id: number | null;
  kanal: string | null;
  geteilt_am: string | null;
  eltern_teilung_id: number | null;
};

export const aktiveGeschenke = () => all<Geschenk>('SELECT * FROM geschenke WHERE aktiv = 1 ORDER BY reihenfolge, id');
export const geschenk = (id: number) => one<Geschenk>('SELECT * FROM geschenke WHERE id = ?', id);
export const aktiveVorlagen = () => all<Vorlage>('SELECT id, ton, variante, text, aktiv FROM vorlagen WHERE aktiv = 1 ORDER BY ton, variante');

export function beraterFuerKunde(kundeId: number | null): BeraterOeffentlich | undefined {
  const sql = 'SELECT id, name, foto_id, vorstellung, video_url, termin_url FROM berater';
  if (kundeId) {
    const b = one<BeraterOeffentlich>(`${sql} WHERE id = (SELECT berater_id FROM kunden WHERE id = ?)`, kundeId);
    if (b) return b;
  }
  return one<BeraterOeffentlich>(`${sql} ORDER BY id LIMIT 1`);
}

function eindeutigerCode(): string {
  for (let i = 0; i < 5; i++) {
    const c = neuerCode();
    if (!one('SELECT 1 FROM teilungen WHERE code = ?', c)) return c;
  }
  throw new Error('Kein freier Code gefunden');
}

/** Neue Teilung für einen Kunden: Variante der Nachrichtenvorlage wird hier (A/B) gewählt. */
export function teilungAnlegen(kunde: { id: number; vorname: string }, geschenkId: number, ton: Ton, zitat: unknown) {
  const vorlage = waehleVariante(aktiveVorlagen(), ton, Math.random());
  const code = eindeutigerCode();
  const id = insertRow('teilungen', {
    code,
    kunde_id: kunde.id,
    geschenk_id: geschenkId,
    zitat: saeubereZitat(zitat) || null,
    von_name: kunde.vorname,
    vorlage_id: vorlage?.id ?? null,
  });
  return { id, code, vorlage };
}

/** Zitat oder Ton nachträglich ändern (vor dem Teilen). Nur eigene, noch nicht geteilte Teilungen. */
export function teilungAendern(kundeId: number, code: string, d: { zitat?: unknown; ton?: Ton }) {
  const t = one<Teilung>('SELECT * FROM teilungen WHERE code = ? AND kunde_id = ?', code, kundeId);
  if (!t) return null;
  let vorlage: Vorlage | null | undefined;
  if (d.zitat !== undefined) run('UPDATE teilungen SET zitat = ? WHERE id = ?', saeubereZitat(d.zitat) || null, t.id);
  if (d.ton) {
    vorlage = waehleVariante(aktiveVorlagen(), d.ton, Math.random());
    run('UPDATE teilungen SET vorlage_id = ? WHERE id = ?', vorlage?.id ?? null, t.id);
  }
  return { teilung: t, vorlage };
}

export function alsGeteiltMarkieren(kundeId: number | null, code: string, kanal: string, bearbeitet: boolean) {
  const t = one<Teilung>('SELECT * FROM teilungen WHERE code = ?', code);
  if (!t || (kundeId != null && t.kunde_id !== kundeId)) return false;
  run(
    "UPDATE teilungen SET kanal = COALESCE(kanal, ?), geteilt_am = COALESCE(geteilt_am, datetime('now')), text_bearbeitet = MAX(text_bearbeitet, ?) WHERE id = ?",
    kanal,
    bearbeitet ? 1 : 0,
    t.id,
  );
  ereignis('geteilt', t.id, t.kunde_id);
  return true;
}

/** Weitergabe durch einen Freund: neue Teilung ohne Kundenbezug, optional mit Vornamen des Freundes. */
export function weitergabeAnlegen(eltern: Teilung, vonName: string) {
  const code = eindeutigerCode();
  const id = insertRow('teilungen', {
    code,
    kunde_id: null,
    geschenk_id: eltern.geschenk_id,
    von_name: vonName || null,
    eltern_teilung_id: eltern.id,
    kanal: 'weitergabe',
    geteilt_am: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  return { id, code };
}

export type FreundSeite = { teilung: Teilung; geschenk: Geschenk; berater: BeraterOeffentlich | undefined };

export function freundSeite(code: unknown): FreundSeite | null {
  if (!istCodeFormat(code)) return null;
  const teilung = one<Teilung>('SELECT * FROM teilungen WHERE code = ?', code);
  if (!teilung) return null;
  const g = one<Geschenk>('SELECT * FROM geschenke WHERE id = ? AND aktiv = 1', teilung.geschenk_id);
  if (!g) return null;
  // Bei Weitergabe: Berater des ursprünglichen Empfehlers
  let kundeId = teilung.kunde_id;
  let e = teilung;
  for (let i = 0; !kundeId && e.eltern_teilung_id && i < 20; i++) {
    const p = one<Teilung>('SELECT * FROM teilungen WHERE id = ?', e.eltern_teilung_id);
    if (!p) break;
    kundeId = p.kunde_id;
    e = p;
  }
  return { teilung, geschenk: g, berater: beraterFuerKunde(kundeId) };
}

/** Anonymes Ereignis. Keine IP, kein Cookie, keine Inhalte. */
export function ereignis(typ: string, teilungId: number | null, kundeId: number | null = null) {
  run('INSERT INTO ereignisse (typ, teilung_id, kunde_id) VALUES (?, ?, ?)', typ, teilungId, kundeId);
}

/** Ursprünglicher Empfehler (für Wirkung): Ereignisse von Weitergaben zählen beim ursprünglichen Kunden mit. */
export function teilungenVonKunde(kundeId: number) {
  return all<{ id: number; geschenk: string; geteilt_am: string | null }>(
    `WITH RECURSIVE baum(id) AS (
       SELECT id FROM teilungen WHERE kunde_id = ?
       UNION SELECT t.id FROM teilungen t JOIN baum b ON t.eltern_teilung_id = b.id
     )
     SELECT t.id, g.titel geschenk, CASE WHEN t.kunde_id = ? THEN t.geteilt_am END geteilt_am
       FROM teilungen t JOIN baum b ON b.id = t.id JOIN geschenke g ON g.id = t.geschenk_id`,
    kundeId,
    kundeId,
  );
}
