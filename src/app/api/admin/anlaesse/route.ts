import { admin, json, fehler, body } from '@/lib/admin';
import { all, insertRow, protokolliere } from '@/lib/db';
import { anlassDaten } from '@/lib/anlaesse-admin';

export const dynamic = 'force-dynamic';

export const GET = admin(() =>
  json(
    all(
      `SELECT a.*, (SELECT COUNT(*) FROM teilungen t WHERE t.anlass_id = a.id AND t.geteilt_am IS NOT NULL) geteilt
         FROM anlaesse a ORDER BY a.reihenfolge, a.id`,
    ),
  ),
);

export const POST = admin(async (req, b) => {
  const d = anlassDaten(await body(req));
  if ('fehler' in d) return fehler(d.fehler);
  const id = insertRow('anlaesse', d);
  protokolliere(b.id, 'anlass_angelegt', String(id));
  return json({ ok: true, id });
});
