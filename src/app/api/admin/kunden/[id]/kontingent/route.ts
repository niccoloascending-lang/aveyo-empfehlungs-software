import { admin, json, body, idParam } from '@/lib/admin';
import { run, protokolliere } from '@/lib/db';

// Weitere Geschenke freischalten (oder zurücksetzen): kontingent_extra += n
export const POST = admin(async (req, b, ctx) => {
  const d = await body(req);
  const n = Math.max(-50, Math.min(50, Math.round(Number(d.mehr) || 0)));
  run('UPDATE kunden SET kontingent_extra = MAX(0, kontingent_extra + ?) WHERE id = ?', n, idParam(ctx));
  protokolliere(b.id, 'kontingent', `${idParam(ctx)}:${n}`);
  return json({ ok: true });
});
