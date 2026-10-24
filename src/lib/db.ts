// Datenbank: node:sqlite (in Node ≥ 22 eingebaut), rohes SQL, kein ORM – wie Immo-Match und FinanzCRM.
// Schema-Änderungen nur abwärtskompatibel: neue Tabellen mit IF NOT EXISTS, neue Spalten über addColumnIfMissing.
// Nur relative Importe mit .ts-Endung, damit auch scripts/seed.ts diese Datei direkt laden kann.
// @ts-ignore – node:sqlite ist in Node.js v22+ eingebaut
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export const DATA_DIR = process.env.GESCHENK_DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'geschenk.db');

const g = globalThis as unknown as { __geschenkDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (g.__geschenkDb) return g.__geschenkDb;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  initSchema(db);
  g.__geschenkDb = db;
  return db;
}

export function addColumnIfMissing(d: DatabaseSync, table: string, column: string, definition: string) {
  const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function initSchema(d: DatabaseSync) {
  d.exec(`
    -- Berater (Admin-Login mit Passwort + TOTP)
    CREATE TABLE IF NOT EXISTS berater (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      pw_hash       TEXT NOT NULL,
      totp_enc      TEXT,               -- TOTP-Geheimnis, verschlüsselt (geheim.ts)
      totp_aktiv    INTEGER NOT NULL DEFAULT 0,
      totp_schritt  INTEGER NOT NULL DEFAULT -1, -- zuletzt benutzter Zeitschritt (keine Wiederverwendung)
      foto_id       INTEGER,
      vorstellung   TEXT,               -- Kurzvorstellung auf der Freund-Seite
      video_url     TEXT,               -- optionales Begrüßungsvideo (Empfehler-Bereich)
      termin_url    TEXT,               -- optional: Cal.com/Calendly-Link statt eigenem Slot-Picker
      erstellt      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bestandskunden (Empfehler). Kein Login: persönlicher Magic-Link.
    CREATE TABLE IF NOT EXISTS kunden (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      vorname          TEXT NOT NULL,
      nachname         TEXT NOT NULL DEFAULT '',
      email            TEXT,
      handy            TEXT,
      themen           TEXT NOT NULL DEFAULT '',   -- pkv,vorsorge,vermoegen,immobilien
      berater_id       INTEGER REFERENCES berater(id) ON DELETE SET NULL,
      extern_id        TEXT,                       -- ID im bestehenden CRM
      token_hash       TEXT UNIQUE,                -- SHA-256 des Magic-Links
      token_enc        TEXT,                       -- Link verschlüsselt, damit der Berater ihn erneut kopieren kann
      token_erstellt   TEXT,
      token_widerrufen TEXT,
      zuletzt_gesehen  TEXT,                       -- für den Freudenmoment „gerade eingelöst“
      notiz            TEXT,
      erstellt         TEXT NOT NULL DEFAULT (datetime('now')),
      geaendert        TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS kunden_extern ON kunden(extern_id);

    -- Geschenke (Termin / Download / Rechner)
    CREATE TABLE IF NOT EXISTS geschenke (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      titel            TEXT NOT NULL,
      kurz             TEXT NOT NULL DEFAULT '',   -- Kurzbeschreibung (Karte)
      nutzen           TEXT NOT NULL DEFAULT '',   -- 3 Stichpunkte, je Zeile einer
      ablauf           TEXT NOT NULL DEFAULT '',   -- 3 Schritte, je Zeile einer
      dauer            TEXT NOT NULL DEFAULT '',
      typ              TEXT NOT NULL CHECK (typ IN ('termin','download','rechner')),
      themen           TEXT NOT NULL DEFAULT '',
      icon             TEXT NOT NULL DEFAULT '🎁',
      bild_id          INTEGER,
      datei_id         INTEGER,                    -- Download: hochgeladene Datei …
      inhalt           TEXT,                       -- … oder eingebauter Inhalt (druckbare Seite)
      rechner          TEXT,                       -- Rechner: Schlüssel, z. B. 'rentenluecke'
      aktiv            INTEGER NOT NULL DEFAULT 1,
      reihenfolge      INTEGER NOT NULL DEFAULT 0,
      erstellt         TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Nachrichtenvorlagen (Empfehler → Freund), je Ton mehrere Varianten für A/B-Tests
    CREATE TABLE IF NOT EXISTS vorlagen (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      ton       TEXT NOT NULL CHECK (ton IN ('locker','kurz','ausfuehrlich')),
      variante  TEXT NOT NULL DEFAULT 'A',
      text      TEXT NOT NULL,
      aktiv     INTEGER NOT NULL DEFAULT 1,
      erstellt  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Eine Teilung = ein persönlicher Freund-Link (/g/<code>) mit Geschenk, Zitat, Vorlage, Kanal
    CREATE TABLE IF NOT EXISTS teilungen (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      code              TEXT NOT NULL UNIQUE,
      kunde_id          INTEGER REFERENCES kunden(id) ON DELETE SET NULL,
      geschenk_id       INTEGER NOT NULL REFERENCES geschenke(id),
      zitat             TEXT,
      von_name          TEXT,                      -- Vorname, der auf der Freund-Seite steht
      vorlage_id        INTEGER REFERENCES vorlagen(id) ON DELETE SET NULL,
      text_bearbeitet   INTEGER NOT NULL DEFAULT 0,
      kanal             TEXT,
      geteilt_am        TEXT,
      eltern_teilung_id INTEGER REFERENCES teilungen(id) ON DELETE SET NULL, -- Weitergabe durch einen Freund
      erstellt          TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS teilungen_kunde ON teilungen(kunde_id);

    -- Anonyme Ereignisse (keine IP, keine Cookies): geoeffnet, download, rechner, termin_bestaetigt, …
    CREATE TABLE IF NOT EXISTS ereignisse (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      typ         TEXT NOT NULL,
      teilung_id  INTEGER REFERENCES teilungen(id) ON DELETE SET NULL,
      kunde_id    INTEGER REFERENCES kunden(id) ON DELETE SET NULL,
      zeit        TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS ereignisse_teilung ON ereignisse(teilung_id);

    -- Freund-Anfragen: nur mit Daten, die der Freund selbst eingibt
    CREATE TABLE IF NOT EXISTS anfragen (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      teilung_id     INTEGER REFERENCES teilungen(id) ON DELETE SET NULL,
      geschenk_id    INTEGER REFERENCES geschenke(id) ON DELETE SET NULL,
      typ            TEXT NOT NULL CHECK (typ IN ('termin','download_mail','auswertung')),
      vorname        TEXT,
      nachname       TEXT,
      email          TEXT,
      telefon        TEXT,
      termin_start   TEXT,               -- UTC-ISO
      termin_ort     TEXT,               -- online | hamburg
      daten          TEXT,               -- z. B. Rechner-Eingaben (JSON), nur wenn der Freund eine Auswertung will
      status         TEXT NOT NULL DEFAULT 'neu' CHECK (status IN ('neu','termin','beratung','kunde','kein_interesse')),
      doi_hash       TEXT,               -- Hash des Bestätigungs-Tokens
      bestaetigt     TEXT,               -- Zeitpunkt Double-Opt-in
      notiz          TEXT,
      crm_status     TEXT,               -- Webhook: ok | fehler | aus
      erstellt       TEXT NOT NULL DEFAULT (datetime('now')),
      geaendert      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS anfragen_teilung ON anfragen(teilung_id);

    -- Einwilligungen mit Zeitstempel und Wortlaut zum Zeitpunkt der Erteilung
    CREATE TABLE IF NOT EXISTS einwilligungen (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      anfrage_id  INTEGER NOT NULL REFERENCES anfragen(id) ON DELETE CASCADE,
      art         TEXT NOT NULL,
      wortlaut    TEXT NOT NULL,
      erteilt     TEXT NOT NULL DEFAULT (datetime('now')),
      bestaetigt  TEXT,
      widerrufen  TEXT
    );

    -- Dankeschöns (manuell ausgelöst)
    CREATE TABLE IF NOT EXISTS dankeschoens (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      kunde_id     INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
      art          TEXT NOT NULL CHECK (art IN ('nachricht','spende','erlebnis','doppelt')),
      text         TEXT,
      spende_zweck TEXT,
      status       TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','erledigt')),
      erstellt     TEXT NOT NULL DEFAULT (datetime('now')),
      erledigt     TEXT
    );

    -- Textverwaltung: Überschreibungen der Standardtexte (src/lib/texte.ts)
    CREATE TABLE IF NOT EXISTS texte (
      schluessel TEXT PRIMARY KEY,
      du         TEXT,
      sie        TEXT,
      geaendert  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS einstellungen (
      schluessel TEXT PRIMARY KEY,
      wert       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dateien (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT NOT NULL,
      mime     TEXT NOT NULL,
      pfad     TEXT NOT NULL,
      groesse  INTEGER NOT NULL,
      oeffentlich INTEGER NOT NULL DEFAULT 1,
      erstellt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- CRM-Webhook: Zustellversuche
    CREATE TABLE IF NOT EXISTS webhook_queue (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      anfrage_id  INTEGER REFERENCES anfragen(id) ON DELETE CASCADE,
      ereignis    TEXT NOT NULL,
      versuche    INTEGER NOT NULL DEFAULT 0,
      naechster   TEXT NOT NULL DEFAULT (datetime('now')),
      status      TEXT NOT NULL DEFAULT 'offen', -- offen | ok | aufgegeben
      letzter_fehler TEXT,
      erstellt    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Protokoll wichtiger Admin-Aktionen (ohne Inhalte)
    CREATE TABLE IF NOT EXISTS protokoll (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      berater_id INTEGER,
      aktion    TEXT NOT NULL,
      ziel      TEXT,
      zeit      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Ergänzungen (abwärtskompatibel)
  addColumnIfMissing(d, 'berater', 'kalender_id', 'TEXT'); // Google-Kalender-ID (meist die E-Mail-Adresse)
  addColumnIfMissing(d, 'anfragen', 'berater_id', 'INTEGER'); // zuständiger Berater (Kalender)
  addColumnIfMissing(d, 'anfragen', 'google_event_id', 'TEXT');
}

export type Row = Record<string, any>;

export function all<T = Row>(sql: string, ...p: any[]): T[] {
  return getDb().prepare(sql).all(...p) as T[];
}
export function one<T = Row>(sql: string, ...p: any[]): T | undefined {
  return getDb().prepare(sql).get(...p) as T | undefined;
}
export function run(sql: string, ...p: any[]): { lastInsertRowid: number; changes: number } {
  const r = getDb().prepare(sql).run(...p);
  return { lastInsertRowid: Number(r.lastInsertRowid), changes: Number(r.changes) };
}

export function insertRow(table: string, data: Row): number {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
  return run(sql, ...keys.map((k) => data[k])).lastInsertRowid;
}

export function updateRow(table: string, id: number, data: Row) {
  const keys = Object.keys(data);
  if (!keys.length) return;
  run(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, ...keys.map((k) => data[k]), id);
}

export function transaktion<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function protokolliere(beraterId: number | null, aktion: string, ziel?: string) {
  run('INSERT INTO protokoll (berater_id, aktion, ziel) VALUES (?, ?, ?)', beraterId, aktion, ziel ?? null);
}
