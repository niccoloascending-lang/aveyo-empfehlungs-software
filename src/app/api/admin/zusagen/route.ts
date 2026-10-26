import { admin, json, body } from '@/lib/admin';
import { all, run, protokolliere } from '@/lib/db';
import { offeneZusagen } from '@/lib/zusagen';

export const dynamic = 'force-dynamic';

/** Offene Spenden (A) und Gutscheine (B), dazu Summen je Zweck. */
export const GET = admin(() =>
  json({
    offen: offeneZusagen(),
    summen: all(
      `SELECT art, COALESCE(zweck, 'Gutschein') zweck, status, COUNT(*) anzahl, SUM(betrag) summe FROM zusagen GROUP BY art, zweck, status ORDER BY art, zweck, status`,
    ),
  }),
);

// Als erledigt markieren (gespendet / Gutschein verschickt) – einzeln oder alle offenen eines Zwecks
export const PUT = admin(async (req, b) => {
  const d = await body(req);
  if (d.id) run("UPDATE zusagen SET status = 'erledigt', erledigt = datetime('now') WHERE id = ? AND status = 'offen'", Number(d.id));
  else if (d.art === 'spende' && typeof d.zweck === 'string')
    run("UPDATE zusagen SET status = 'erledigt', erledigt = datetime('now') WHERE art = 'spende' AND zweck = ? AND status = 'offen'", d.zweck);
  protokolliere(b.id, 'zusage_erledigt', JSON.stringify(d));
  return json({ ok: true });
});
