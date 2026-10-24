// CRM-Übergabe: bestätigte Freund-Anfragen per Webhook an das bestehende CRM (signiert, mit Wiederholungen).
import { all, one, run } from './db.ts';
import { einstellungen } from './einstellungen.ts';
import { webhookHeader, naechsterVersuch } from './webhook-pure.ts';

export function webhookEinreihen(anfrageId: number, ereignis: string) {
  if (!einstellungen().webhookUrl) {
    run("UPDATE anfragen SET crm_status = 'aus' WHERE id = ?", anfrageId);
    return;
  }
  run('INSERT INTO webhook_queue (anfrage_id, ereignis) VALUES (?, ?)', anfrageId, ereignis);
}

/** Datensatz, wie ihn das CRM bekommt (auch für GET /api/v1/anfragen). */
export function anfrageExport(id: number) {
  const a = one<any>(
    `SELECT a.id, a.typ, a.vorname, a.nachname, a.email, a.telefon, a.termin_start, a.termin_ort, a.status, a.bestaetigt, a.erstellt,
            g.id geschenk_id, g.titel geschenk, k.id kunde_id, k.extern_id kunde_extern_id, k.vorname kunde_vorname, k.nachname kunde_nachname
       FROM anfragen a
       LEFT JOIN geschenke g ON g.id = a.geschenk_id
       LEFT JOIN teilungen t ON t.id = a.teilung_id
       LEFT JOIN kunden k ON k.id = t.kunde_id
      WHERE a.id = ?`,
    id,
  );
  if (!a) return null;
  const ein = all<{ art: string; erteilt: string; bestaetigt: string | null }>(
    'SELECT art, erteilt, bestaetigt FROM einwilligungen WHERE anfrage_id = ? AND widerrufen IS NULL',
    id,
  );
  return {
    id: a.id,
    typ: a.typ,
    status: a.status,
    erstellt: a.erstellt,
    bestaetigt: a.bestaetigt,
    freund: { vorname: a.vorname, nachname: a.nachname, email: a.email, telefon: a.telefon },
    termin: a.termin_start ? { start: a.termin_start, ort: a.termin_ort } : null,
    geschenk: a.geschenk_id ? { id: a.geschenk_id, titel: a.geschenk } : null,
    empfehler: a.kunde_id ? { id: a.kunde_id, extern_id: a.kunde_extern_id, vorname: a.kunde_vorname, nachname: a.kunde_nachname } : null,
    einwilligungen: ein,
  };
}

let laeuft = false;
export async function webhooksZustellen() {
  if (laeuft) return;
  laeuft = true;
  try {
    const e = einstellungen();
    const offen = all<{ id: number; anfrage_id: number; ereignis: string; versuche: number }>(
      "SELECT id, anfrage_id, ereignis, versuche FROM webhook_queue WHERE status = 'offen' AND naechster <= datetime('now') ORDER BY id LIMIT 20",
    );
    for (const w of offen) {
      if (!e.webhookUrl) break;
      const daten = anfrageExport(w.anfrage_id);
      if (!daten) {
        run("UPDATE webhook_queue SET status = 'aufgegeben', letzter_fehler = 'Anfrage gelöscht' WHERE id = ?", w.id);
        continue;
      }
      const body = JSON.stringify({ ereignis: w.ereignis, zeit: new Date().toISOString(), anfrage: daten });
      let fehler: string | null = null;
      try {
        const r = await fetch(e.webhookUrl, { method: 'POST', headers: webhookHeader(body, e.webhookSecret || ''), body, signal: AbortSignal.timeout(10000) });
        if (!r.ok) fehler = `HTTP ${r.status}`;
      } catch (err) {
        fehler = (err as Error).name === 'TimeoutError' ? 'Zeitüberschreitung' : 'Nicht erreichbar';
      }
      if (!fehler) {
        run("UPDATE webhook_queue SET status = 'ok', versuche = versuche + 1, letzter_fehler = NULL WHERE id = ?", w.id);
        run("UPDATE anfragen SET crm_status = 'ok' WHERE id = ?", w.anfrage_id);
      } else {
        const warte = naechsterVersuch(w.versuche);
        if (warte == null) run("UPDATE webhook_queue SET status = 'aufgegeben', versuche = versuche + 1, letzter_fehler = ? WHERE id = ?", fehler, w.id);
        else
          run(
            `UPDATE webhook_queue SET versuche = versuche + 1, letzter_fehler = ?, naechster = datetime('now', '+${Math.round(warte / 1000)} seconds') WHERE id = ?`,
            fehler,
            w.id,
          );
        run("UPDATE anfragen SET crm_status = 'fehler' WHERE id = ?", w.anfrage_id);
      }
    }
  } finally {
    laeuft = false;
  }
}
