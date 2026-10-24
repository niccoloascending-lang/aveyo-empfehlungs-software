import { admin, json, fehler, body } from '@/lib/admin';
import { all, one, insertRow, protokolliere } from '@/lib/db';
import { einstellungen, t, ansprache } from '@/lib/einstellungen';
import { anredeName } from '@/lib/texte';
import { mehrzeilig } from '@/lib/validierung';

export const dynamic = 'force-dynamic';

/** Offene Dankeschöns + Empfehler, die schon etwas bewirkt haben, aber noch kein Danke bekommen haben. */
export const GET = admin(() =>
  json({
    offen: all(
      `SELECT d.*, k.vorname, k.nachname FROM dankeschoens d JOIN kunden k ON k.id = d.kunde_id WHERE d.status = 'offen' ORDER BY d.id DESC`,
    ),
    vorschlaege: all(
      `SELECT k.id, k.vorname, k.nachname,
              (SELECT COUNT(*) FROM ereignisse e JOIN teilungen t ON t.id = e.teilung_id
                 WHERE t.kunde_id = k.id AND e.typ IN ('download','rechner','termin_bestaetigt','auswertung_bestaetigt','download_mail_bestaetigt')) eingeloest
         FROM kunden k
        WHERE NOT EXISTS (SELECT 1 FROM dankeschoens d WHERE d.kunde_id = k.id)
          AND eingeloest > 0
        ORDER BY eingeloest DESC LIMIT 50`,
    ),
  }),
);

// Dankeschön auslösen. Versand der Nachricht erfolgt manuell durch den Berater.
export const POST = admin(async (req, b) => {
  const d = await body(req);
  const e = einstellungen();
  const art = ['nachricht', 'spende', 'erlebnis', 'doppelt'].includes(d.art) ? (d.art as keyof typeof e.belohnungen) : null;
  if (!art) return fehler('Unbekannte Art.');
  if (!e.belohnungen[art]) return fehler('Diese Belohnungsart ist in den Einstellungen ausgeschaltet.');
  const k = one<{ id: number; vorname: string; nachname: string; anrede: string; ansprache: string }>('SELECT id, vorname, nachname, anrede, ansprache FROM kunden WHERE id = ?', Number(d.kundeId));
  if (!k) return fehler('Kunde nicht gefunden.', 404);
  const text = mehrzeilig(d.text, 5000) || t('danke.nachricht', { vorname: k.vorname, anrede_name: anredeName(k, ansprache(k)), berater: b.name }, ansprache(k));
  const id = insertRow('dankeschoens', { kunde_id: k.id, art, text });
  protokolliere(b.id, 'dankeschoen', `${art}:${k.id}`);
  return json({ ok: true, id });
});
