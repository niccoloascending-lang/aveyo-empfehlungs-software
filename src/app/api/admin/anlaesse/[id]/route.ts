import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { updateRow, protokolliere } from '@/lib/db';
import { anlassDaten } from '@/lib/anlaesse-admin';

export const PUT = admin(async (req, b, ctx) => {
  const d = anlassDaten(await body(req));
  if ('fehler' in d) return fehler(d.fehler);
  updateRow('anlaesse', idParam(ctx), d);
  protokolliere(b.id, 'anlass_geaendert', String(idParam(ctx)));
  return json({ ok: true });
});
