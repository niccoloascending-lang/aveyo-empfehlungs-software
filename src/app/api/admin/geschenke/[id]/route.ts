import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { updateRow, protokolliere } from '@/lib/db';
import { geschenkDaten } from '@/lib/geschenke-admin';

export const PUT = admin(async (req, b, ctx) => {
  const d = geschenkDaten(await body(req));
  if ('fehler' in d) return fehler(d.fehler);
  updateRow('geschenke', idParam(ctx), d);
  protokolliere(b.id, 'geschenk_geaendert', String(idParam(ctx)));
  return json({ ok: true });
});
