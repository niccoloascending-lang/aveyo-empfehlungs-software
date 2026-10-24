import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { run } from '@/lib/db';
import { istTon } from '@/lib/teilen';
import { mehrzeilig, sauber } from '@/lib/validierung';

export const PUT = admin(async (req, _b, ctx) => {
  const d = await body(req);
  const text = mehrzeilig(d.text, 1000).trim();
  if (!istTon(d.ton) || !text) return fehler('Ton und Text angeben.');
  run('UPDATE vorlagen SET ton = ?, variante = ?, text = ?, aktiv = ? WHERE id = ?', d.ton, sauber(d.variante, 10) || 'A', text, d.aktiv ? 1 : 0, idParam(ctx));
  return json({ ok: true });
});

// Vorlagen mit Teilungen werden nur deaktiviert (Statistik bleibt erhalten)
export const DELETE = admin((_req, _b, ctx) => {
  run('UPDATE vorlagen SET aktiv = 0 WHERE id = ?', idParam(ctx));
  return json({ ok: true });
});
