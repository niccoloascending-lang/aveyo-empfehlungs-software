import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { run, protokolliere } from '@/lib/db';
import { istStatus, einwilligungenVon } from '@/lib/anfragen';
import { sauber } from '@/lib/validierung';
import { webhookEinreihen } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

export const GET = admin((_req, _b, ctx) => json({ einwilligungen: einwilligungenVon(idParam(ctx)) }));

export const PUT = admin(async (req, b, ctx) => {
  const id = idParam(ctx);
  const d = await body(req);
  if (d.status !== undefined) {
    if (!istStatus(d.status)) return fehler('Ungültiger Status');
    run("UPDATE anfragen SET status = ?, geaendert = datetime('now') WHERE id = ?", d.status, id);
    webhookEinreihen(id, 'anfrage.status');
  }
  if (d.notiz !== undefined) run("UPDATE anfragen SET notiz = ?, geaendert = datetime('now') WHERE id = ?", sauber(d.notiz, 2000) || null, id);
  if (d.empfehlerInfoWiderrufen) run("UPDATE einwilligungen SET widerrufen = datetime('now') WHERE anfrage_id = ? AND art = 'empfehler_info' AND widerrufen IS NULL", id);
  protokolliere(b.id, 'anfrage_geaendert', String(id));
  return json({ ok: true });
});

// Manuelles Löschen (z. B. auf Wunsch des Freundes)
export const DELETE = admin((_req, b, ctx) => {
  run('DELETE FROM anfragen WHERE id = ?', idParam(ctx));
  protokolliere(b.id, 'anfrage_geloescht', String(idParam(ctx)));
  return json({ ok: true });
});
