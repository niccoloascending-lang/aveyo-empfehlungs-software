import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { run, protokolliere } from '@/lib/db';
import { istStatus, einwilligungenVon } from '@/lib/anfragen';
import { sauber } from '@/lib/validierung';
import { webhookEinreihen } from '@/lib/webhook';
import { terminAustragen, terminEintragen } from '@/lib/kalender';
import { one } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = admin((_req, _b, ctx) => json({ einwilligungen: einwilligungenVon(idParam(ctx)) }));

export const PUT = admin(async (req, b, ctx) => {
  const id = idParam(ctx);
  const d = await body(req);
  if (d.status !== undefined) {
    if (!istStatus(d.status)) return fehler('Ungültiger Status');
    run("UPDATE anfragen SET status = ?, geaendert = datetime('now') WHERE id = ?", d.status, id);
    webhookEinreihen(id, 'anfrage.status');
    const a = one<{ berater_id: number | null; bestaetigt: string | null }>('SELECT berater_id, bestaetigt FROM anfragen WHERE id = ?', id);
    if (d.status === 'kein_interesse') await terminAustragen(id, a?.berater_id ?? null);
    else if (a?.bestaetigt) await terminEintragen(id, a.berater_id);
  }
  if (d.notiz !== undefined) run("UPDATE anfragen SET notiz = ?, geaendert = datetime('now') WHERE id = ?", sauber(d.notiz, 2000) || null, id);
  if (d.empfehlerInfoWiderrufen) run("UPDATE einwilligungen SET widerrufen = datetime('now') WHERE anfrage_id = ? AND art = 'empfehler_info' AND widerrufen IS NULL", id);
  protokolliere(b.id, 'anfrage_geaendert', String(id));
  return json({ ok: true });
});

// Manuelles Löschen (z. B. auf Wunsch des Freundes)
export const DELETE = admin(async (_req, b, ctx) => {
  await terminAustragen(idParam(ctx), one<{ berater_id: number | null }>('SELECT berater_id FROM anfragen WHERE id = ?', idParam(ctx))?.berater_id ?? null);
  run('DELETE FROM anfragen WHERE id = ?', idParam(ctx));
  protokolliere(b.id, 'anfrage_geloescht', String(idParam(ctx)));
  return json({ ok: true });
});
