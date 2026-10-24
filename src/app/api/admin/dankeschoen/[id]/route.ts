import { admin, json, body, idParam } from '@/lib/admin';
import { run } from '@/lib/db';

export const PUT = admin(async (req, _b, ctx) => {
  const d = await body(req);
  if (d.status === 'erledigt') run("UPDATE dankeschoens SET status = 'erledigt', erledigt = datetime('now') WHERE id = ?", idParam(ctx));
  if (d.status === 'offen') run("UPDATE dankeschoens SET status = 'offen', erledigt = NULL WHERE id = ?", idParam(ctx));
  return json({ ok: true });
});
