// Kunden (Empfehler) und ihre Magic-Links.
import { all, one, run, insertRow, transaktion } from './db.ts';
import { neuesToken, hashToken, istTokenFormat, linkGueltig } from './token.ts';
import { verschluesseln, entschluesseln } from './geheim.ts';
import { einstellungen, basisUrl } from './einstellungen.ts';
import { kundenLink } from './teilen.ts';
import { themenLesen } from './validierung.ts';

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('SESSION_SECRET fehlt oder ist zu kurz (.env.local)');
  return s;
};

export type Kunde = {
  id: number;
  vorname: string;
  nachname: string;
  anrede: string;
  ansprache: string;
  email: string | null;
  handy: string | null;
  themen: string;
  berater_id: number | null;
  extern_id: string | null;
  token_erstellt: string | null;
  token_widerrufen: string | null;
  zuletzt_gesehen: string | null;
  zitat_vorschlag: string | null;
  belohnung_variante: string;
  spendenzweck: string | null;
  kontingent_extra: number;
  erinnert_am: string | null;
  notiz: string | null;
  erstellt: string;
};

export type KundeNeu = { vorname: string; nachname?: string; anrede?: string; ansprache?: string; email?: string | null; handy?: string | null; themen?: string; berater_id?: number | null; extern_id?: string | null; notiz?: string | null };

export function kundeAnlegen(k: KundeNeu): number {
  const id = insertRow('kunden', {
    vorname: k.vorname,
    nachname: k.nachname ?? '',
    anrede: k.anrede ?? '',
    ansprache: k.ansprache ?? '',
    email: k.email || null,
    handy: k.handy || null,
    themen: themenLesen(k.themen ?? '').join(','),
    berater_id: k.berater_id ?? null,
    extern_id: k.extern_id || null,
    notiz: k.notiz ?? null,
  });
  neuerLink(id);
  return id;
}

/** Neuen Magic-Link erzeugen. Ein alter Link wird dadurch sofort ungültig. */
export function neuerLink(kundeId: number): string {
  const token = neuesToken();
  run(
    "UPDATE kunden SET token_hash = ?, token_enc = ?, token_erstellt = datetime('now'), token_widerrufen = NULL, geaendert = datetime('now') WHERE id = ?",
    hashToken(token),
    verschluesseln(token, secret()),
    kundeId,
  );
  return kundenLink(basisUrl(), token);
}

export function linkWiderrufen(kundeId: number) {
  run("UPDATE kunden SET token_widerrufen = datetime('now'), geaendert = datetime('now') WHERE id = ?", kundeId);
}

/** Link zum erneuten Kopieren im Admin (nur solange er gültig ist). */
export function linkFuer(kundeId: number): string | null {
  const r = one<{ token_enc: string | null; token_erstellt: string | null; token_widerrufen: string | null }>(
    'SELECT token_enc, token_erstellt, token_widerrufen FROM kunden WHERE id = ?',
    kundeId,
  );
  if (!r?.token_enc || !r.token_erstellt) return null;
  if (!linkGueltig({ erstellt: r.token_erstellt, widerrufen: r.token_widerrufen }, einstellungen().linkGueltigTage)) return null;
  const token = entschluesseln(r.token_enc, secret());
  return token ? kundenLink(basisUrl(), token) : null;
}

/** Kunde zum Magic-Link. null bei falschem, widerrufenem oder abgelaufenem Link. */
export function kundeAusToken(token: unknown): Kunde | null {
  if (!istTokenFormat(token)) return null;
  const k = one<Kunde & { token_widerrufen: string | null }>('SELECT * FROM kunden WHERE token_hash = ?', hashToken(token));
  if (!k || !k.token_erstellt) return null;
  if (!linkGueltig({ erstellt: k.token_erstellt, widerrufen: k.token_widerrufen }, einstellungen().linkGueltigTage)) return null;
  return k;
}

export function kundenListe(suche = ''): (Kunde & { geteilt: number; eingeloest: number; link_aktiv: number; berater: string | null })[] {
  const q = `%${suche.trim()}%`;
  return all(
    `SELECT k.id, k.vorname, k.nachname, k.anrede, k.ansprache, k.email, k.handy, k.themen, k.berater_id, k.extern_id, k.token_erstellt, k.token_widerrufen,
            k.zuletzt_gesehen, k.erstellt,
            (SELECT COUNT(*) FROM teilungen t WHERE t.kunde_id = k.id AND t.geteilt_am IS NOT NULL) geteilt,
            (SELECT COUNT(*) FROM ereignisse e JOIN teilungen t ON t.id = e.teilung_id
               WHERE t.kunde_id = k.id AND e.typ IN ('download','rechner','termin_bestaetigt','auswertung_bestaetigt','download_mail_bestaetigt')) eingeloest,
            CASE WHEN k.token_hash IS NOT NULL AND k.token_widerrufen IS NULL THEN 1 ELSE 0 END link_aktiv,
            (SELECT name || ' (' || email || ')' FROM berater WHERE id = k.berater_id) berater
       FROM kunden k
      WHERE (? = '%%' OR k.vorname LIKE ? OR k.nachname LIKE ? OR k.email LIKE ?)
      ORDER BY k.erstellt DESC, k.id DESC`,
    q,
    q,
    q,
    q,
  );
}

/**
 * Kunde löschen (DSGVO). Seine geteilten Links funktionieren für Freunde weiter, aber ohne Zitat und Namen –
 * Anfragen von Freunden bleiben (sie gehören den Freunden), verlieren nur den Bezug zum Empfehler.
 */
export function kundeLoeschen(id: number) {
  transaktion(() => {
    run("UPDATE teilungen SET zitat = NULL, von_name = NULL WHERE kunde_id = ?", id);
    run('DELETE FROM kunden WHERE id = ?', id);
  });
}

/** Upsert für CSV-/CRM-Import: über extern_id, sonst E-Mail. Gibt 'neu' | 'aktualisiert' zurück. */
export function kundeImportieren(k: KundeNeu & { email: string }, beraterId: number | null): 'neu' | 'aktualisiert' {
  const vorhanden =
    (k.extern_id ? one<{ id: number }>('SELECT id FROM kunden WHERE extern_id = ?', k.extern_id) : undefined) ??
    one<{ id: number }>('SELECT id FROM kunden WHERE lower(email) = lower(?)', k.email);
  if (vorhanden) {
    run(
      "UPDATE kunden SET vorname = ?, nachname = ?, anrede = COALESCE(NULLIF(?, ''), anrede), ansprache = COALESCE(NULLIF(?, ''), ansprache), email = ?, handy = COALESCE(NULLIF(?, ''), handy), themen = CASE WHEN ? = '' THEN themen ELSE ? END, extern_id = COALESCE(NULLIF(?, ''), extern_id), geaendert = datetime('now') WHERE id = ?",
      k.vorname,
      k.nachname ?? '',
      k.anrede ?? '',
      k.ansprache ?? '',
      k.email,
      k.handy ?? '',
      themenLesen(k.themen ?? '').join(','),
      themenLesen(k.themen ?? '').join(','),
      k.extern_id ?? '',
      vorhanden.id,
    );
    return 'aktualisiert';
  }
  kundeAnlegen({ ...k, berater_id: k.berater_id ?? beraterId });
  return 'neu';
}
