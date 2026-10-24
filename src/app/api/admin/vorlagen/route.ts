import { admin, json, fehler, body } from '@/lib/admin';
import { all, insertRow } from '@/lib/db';
import { istTon } from '@/lib/teilen';
import { mehrzeilig, sauber } from '@/lib/validierung';

export const dynamic = 'force-dynamic';

export const GET = admin(() => json(all('SELECT * FROM vorlagen ORDER BY ton, variante, id')));

export const POST = admin(async (req) => {
  const d = await body(req);
  const text = mehrzeilig(d.text, 1000).trim();
  if (!istTon(d.ton) || !text) return fehler('Ton und Text angeben.');
  const id = insertRow('vorlagen', { ton: d.ton, variante: sauber(d.variante, 10) || 'A', text, aktiv: d.aktiv === false ? 0 : 1 });
  return json({ ok: true, id });
});
