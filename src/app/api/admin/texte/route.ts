import { admin, json, fehler, body } from '@/lib/admin';
import { run, protokolliere } from '@/lib/db';
import { TEXTE, type TextDef } from '@/lib/texte';
import { textOverrides } from '@/lib/einstellungen';
import { mehrzeilig } from '@/lib/validierung';

export const dynamic = 'force-dynamic';

export const GET = admin(() => {
  const o = textOverrides();
  return json(
    Object.entries(TEXTE as Record<string, TextDef>).map(([key, d]) => ({
      key,
      bereich: d.bereich,
      beschreibung: d.beschreibung,
      rechtlich: !!d.rechtlich,
      lang: !!d.lang,
      standardDu: d.du,
      standardSie: d.sie ?? null,
      du: o[key]?.du ?? null,
      sie: o[key]?.sie ?? null,
    })),
  );
});

// Überschreibung setzen; leer = zurück zum Standard
export const PUT = admin(async (req, b) => {
  const d = await body(req);
  if (!(d.key in TEXTE)) return fehler('Unbekannter Text');
  const du = mehrzeilig(d.du, 20000).trim() || null;
  const sie = mehrzeilig(d.sie, 20000).trim() || null;
  if (!du && !sie) run('DELETE FROM texte WHERE schluessel = ?', d.key);
  else
    run(
      "INSERT INTO texte (schluessel, du, sie) VALUES (?, ?, ?) ON CONFLICT(schluessel) DO UPDATE SET du = excluded.du, sie = excluded.sie, geaendert = datetime('now')",
      d.key,
      du,
      sie,
    );
  protokolliere(b.id, 'text_geaendert', d.key);
  return json({ ok: true });
});
