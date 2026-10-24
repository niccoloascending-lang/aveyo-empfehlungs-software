import { admin, json, fehler, body } from '@/lib/admin';
import { all, insertRow, protokolliere } from '@/lib/db';
import { geschenkDaten } from '@/lib/geschenke-admin';

export const dynamic = 'force-dynamic';

export const GET = admin(() =>
  json(
    all(`SELECT g.*, (SELECT COUNT(*) FROM teilungen t WHERE t.geschenk_id = g.id AND t.geteilt_am IS NOT NULL) geteilt FROM geschenke g ORDER BY g.reihenfolge, g.id`),
  ),
);

export const POST = admin(async (req, b) => {
  const d = geschenkDaten(await body(req));
  if ('fehler' in d) return fehler(d.fehler);
  const id = insertRow('geschenke', d);
  protokolliere(b.id, 'geschenk_angelegt', String(id));
  return json({ ok: true, id });
});
