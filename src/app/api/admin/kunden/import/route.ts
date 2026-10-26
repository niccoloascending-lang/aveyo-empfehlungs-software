import { admin, json, fehler, body } from '@/lib/admin';
import { kundenAusCsv } from '@/lib/csv';
import { kundeImportieren } from '@/lib/kunden';
import { transaktion, protokolliere } from '@/lib/db';

// CSV-Import: erst Probelauf (vorschau: true), dann Import.
export const POST = admin(async (req, b) => {
  const d = await body(req);
  if (typeof d.csv !== 'string' || d.csv.length > 5_000_000) return fehler('Bitte eine CSV-Datei wählen (max. 5 MB).');
  const r = kundenAusCsv(d.csv);
  if (d.vorschau) return json({ ...r, kunden: r.kunden.slice(0, 20), anzahl: r.kunden.length });
  let neu = 0;
  let aktualisiert = 0;
  transaktion(() => {
    for (const k of r.kunden) kundeImportieren(k, b.id) === 'neu' ? neu++ : aktualisiert++;
  });
  protokolliere(b.id, 'csv_import', `${neu} neu, ${aktualisiert} aktualisiert`);
  return json({ ok: true, neu, aktualisiert, fehler: r.fehler });
});
