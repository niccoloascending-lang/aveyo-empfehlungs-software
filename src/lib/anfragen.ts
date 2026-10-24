// Freund-Anfragen: Termin, Download per Mail, Rechner-Auswertung. Immer nur mit Daten, die der Freund selbst eingibt,
// immer mit Double-Opt-in, bevor wir die Adresse für irgendetwas anderes nutzen.
import { all, one, run, insertRow, transaktion } from './db.ts';
import { neuesToken, hashToken, istTokenFormat } from './token.ts';
import { doiAbgelaufen, DOI_STUNDEN } from './einwilligung.ts';
import { einstellungen, texte, basisUrl } from './einstellungen.ts';
import { fuelle } from './texte.ts';
import { sendeMail } from './mail.ts';
import { ereignis, type FreundSeite } from './teilungen.ts';
import { terminText, freieSlots } from './slots.ts';
import { webhookEinreihen } from './webhook.ts';

export const STATUS = [
  { v: 'neu', t: 'Neu' },
  { v: 'termin', t: 'Termin' },
  { v: 'beratung', t: 'Beratung' },
  { v: 'kunde', t: 'Kunde' },
  { v: 'kein_interesse', t: 'Kein Interesse' },
] as const;
export type Status = (typeof STATUS)[number]['v'];
export const istStatus = (s: unknown): s is Status => STATUS.some((x) => x.v === s);

export type AnfrageTyp = 'termin' | 'download_mail' | 'auswertung';

export type AnfrageNeu = {
  typ: AnfrageTyp;
  vorname: string;
  nachname?: string;
  email: string;
  telefon?: string;
  termin_start?: string;
  termin_ort?: string;
  daten?: string;
  empfehlerInfo: boolean;
};

/** Alle belegten Termine (für den Slot-Picker). Unbestätigte halten den Slot bis zum Ablauf des DOI. */
export function belegteTermine(): string[] {
  return all<{ termin_start: string }>(
    "SELECT termin_start FROM anfragen WHERE typ = 'termin' AND termin_start IS NOT NULL AND status != 'kein_interesse'",
  ).map((r) => r.termin_start);
}

export function freieTermine(): string[] {
  return freieSlots(einstellungen().verfuegbarkeit, belegteTermine());
}

function jetztSql() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/** Anfrage anlegen + Einwilligungen protokollieren + Bestätigungs-Mail. */
export async function anfrageAnlegen(seite: FreundSeite, a: AnfrageNeu): Promise<{ id: number } | { fehler: string }> {
  const tx = texte();
  const t = (k: string) => tx[k] ?? k;
  const empfehler = seite.teilung.von_name || '';
  const token = neuesToken();

  const id = transaktion(() => {
    if (a.typ === 'termin') {
      // Doppelbuchung verhindern (innerhalb der Transaktion erneut prüfen)
      if (!a.termin_start || !freieSlots(einstellungen().verfuegbarkeit, belegteTermine()).includes(a.termin_start)) return null;
    }
    const id = insertRow('anfragen', {
      teilung_id: seite.teilung.id,
      geschenk_id: seite.geschenk.id,
      typ: a.typ,
      vorname: a.vorname,
      nachname: a.nachname || null,
      email: a.email.toLowerCase(),
      telefon: a.telefon || null,
      termin_start: a.termin_start ?? null,
      termin_ort: a.termin_ort ?? null,
      daten: a.daten ?? null,
      doi_hash: hashToken(token),
    });
    // Einwilligungen mit Wortlaut zum Zeitpunkt der Erteilung
    insertRow('einwilligungen', { anfrage_id: id, art: 'datenschutz', wortlaut: t('freund.einwilligung.datenschutz') });
    insertRow('einwilligungen', { anfrage_id: id, art: 'email_kontakt', wortlaut: `E-Mail-Kontakt zu dieser Anfrage (${a.typ}), bestätigt per Double-Opt-in` });
    if (a.empfehlerInfo && empfehler)
      insertRow('einwilligungen', { anfrage_id: id, art: 'empfehler_info', wortlaut: fuelle(t('freund.einwilligung.empfehler'), { empfehler }) });
    return id;
  });
  if (id == null) return { fehler: 'Dieser Termin ist leider gerade vergeben. Bitte wähle einen anderen.' };

  const berater = seite.berater?.name ?? 'Dein AVEYO-Team';
  const link = `${basisUrl()}/bestaetigen/${token}`;
  const vars = {
    vorname: a.vorname,
    vorname_komma: a.vorname ? ` ${a.vorname},` : ',',
    geschenk: seite.geschenk.titel,
    termin: a.termin_start ? terminText(a.termin_start) : '',
    ort: a.termin_ort === 'hamburg' ? t('freund.termin.ort.hamburg') : t('freund.termin.ort.online'),
    link,
    berater,
  };
  const art = a.typ === 'termin' ? 'termin' : a.typ === 'download_mail' ? 'download' : 'auswertung';
  await sendeMail({ an: a.email, betreff: fuelle(t(`mail.doi.${art}.betreff`), vars), text: fuelle(t(`mail.doi.${art}.text`), vars) });
  return { id };
}

type AnfrageZeile = {
  id: number;
  typ: AnfrageTyp;
  vorname: string;
  email: string;
  termin_start: string | null;
  termin_ort: string | null;
  bestaetigt: string | null;
  erstellt: string;
  teilung_id: number | null;
  geschenk_id: number | null;
};

/** Bestätigungsseite: Token gültig? (ohne zu bestätigen – Mail-Scanner rufen Links automatisch auf) */
export function doiPruefen(token: unknown): AnfrageZeile | null {
  if (!istTokenFormat(token)) return null;
  const a = one<AnfrageZeile>('SELECT * FROM anfragen WHERE doi_hash = ?', hashToken(token));
  if (!a) return null;
  if (!a.bestaetigt && doiAbgelaufen(a.erstellt, new Date(), DOI_STUNDEN)) return null;
  return a;
}

/** Double-Opt-in abschließen (POST, per Klick des Freundes). Idempotent. */
export async function doiBestaetigen(token: unknown): Promise<{ typ: AnfrageTyp; termin: string } | null> {
  const a = doiPruefen(token);
  if (!a) return null;
  if (a.bestaetigt) return { typ: a.typ, termin: a.termin_start ? terminText(a.termin_start) : '' };
  const jetzt = jetztSql();
  run("UPDATE anfragen SET bestaetigt = ?, status = CASE WHEN typ = 'termin' THEN 'termin' ELSE status END, geaendert = ? WHERE id = ?", jetzt, jetzt, a.id);
  run('UPDATE einwilligungen SET bestaetigt = ? WHERE anfrage_id = ? AND bestaetigt IS NULL', jetzt, a.id);
  const typEreignis = a.typ === 'termin' ? 'termin_bestaetigt' : a.typ === 'download_mail' ? 'download_mail_bestaetigt' : 'auswertung_bestaetigt';
  const kunde = a.teilung_id ? one<{ kunde_id: number | null }>('SELECT kunde_id FROM teilungen WHERE id = ?', a.teilung_id) : undefined;
  ereignis(typEreignis, a.teilung_id, kunde?.kunde_id ?? null);

  // Folge-Mail (jetzt erlaubt, weil bestätigt)
  const tx = texte();
  const t = (k: string) => tx[k] ?? k;
  const g = a.geschenk_id ? one<{ titel: string }>('SELECT titel FROM geschenke WHERE id = ?', a.geschenk_id) : undefined;
  const code = a.teilung_id ? one<{ code: string }>('SELECT code FROM teilungen WHERE id = ?', a.teilung_id)?.code : undefined;
  const berater = one<{ name: string }>(
    'SELECT name FROM berater WHERE id = COALESCE((SELECT k.berater_id FROM teilungen t JOIN kunden k ON k.id = t.kunde_id WHERE t.id = ?), (SELECT MIN(id) FROM berater))',
    a.teilung_id,
  )?.name;
  const vars = {
    vorname: a.vorname,
    vorname_komma: a.vorname ? ` ${a.vorname},` : ',',
    geschenk: g?.titel ?? '',
    termin: a.termin_start ? terminText(a.termin_start) : '',
    ort: a.termin_ort === 'hamburg' ? t('freund.termin.ort.hamburg') : t('freund.termin.ort.online'),
    ort_details: a.termin_ort === 'hamburg' ? t('mail.termin.ort.hamburg') : t('mail.termin.ort.online'),
    link: code ? `${basisUrl()}/g/${code}/download` : '',
    berater: berater ?? 'Dein AVEYO-Team',
  };
  if (a.typ === 'termin') await sendeMail({ an: a.email, betreff: fuelle(t('mail.termin.betreff'), vars), text: fuelle(t('mail.termin.text'), vars) });
  if (a.typ === 'download_mail' && code) await sendeMail({ an: a.email, betreff: fuelle(t('mail.download.betreff'), vars), text: fuelle(t('mail.download.text'), vars) });

  // Berater informieren (ohne Namen) und ans CRM übergeben
  const e = einstellungen();
  if (e.adminMail)
    await sendeMail({
      an: e.adminMail,
      betreff: t('mail.admin.neu.betreff'),
      text: fuelle(t('mail.admin.neu.text'), { geschenk: g?.titel ?? '', link: `${basisUrl()}/admin/anfragen` }),
    });
  webhookEinreihen(a.id, 'anfrage.bestaetigt');
  return { typ: a.typ, termin: vars.termin };
}

export function anfragenListe(status?: string) {
  return all(
    `SELECT a.id, a.typ, a.vorname, a.nachname, a.email, a.telefon, a.termin_start, a.termin_ort, a.status, a.bestaetigt, a.notiz,
            a.crm_status, a.erstellt, a.daten, g.titel geschenk,
            COALESCE(k.vorname || ' ' || k.nachname, t.von_name) empfehler, k.id empfehler_id,
            EXISTS (SELECT 1 FROM einwilligungen e WHERE e.anfrage_id = a.id AND e.art = 'empfehler_info' AND e.widerrufen IS NULL) empfehler_info
       FROM anfragen a
       LEFT JOIN geschenke g ON g.id = a.geschenk_id
       LEFT JOIN teilungen t ON t.id = a.teilung_id
       LEFT JOIN kunden k ON k.id = t.kunde_id
      WHERE (? IS NULL OR a.status = ?)
      ORDER BY a.erstellt DESC, a.id DESC`,
    status ?? null,
    status ?? null,
  );
}

export function einwilligungenVon(anfrageId: number) {
  return all('SELECT art, wortlaut, erteilt, bestaetigt, widerrufen FROM einwilligungen WHERE anfrage_id = ? ORDER BY id', anfrageId);
}
