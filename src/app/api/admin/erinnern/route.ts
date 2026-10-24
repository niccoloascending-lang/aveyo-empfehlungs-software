import { admin, json, body } from '@/lib/admin';
import { all, run, protokolliere } from '@/lib/db';
import { erinnerungen, type ErinnerKunde } from '@/lib/anreize';
import { einstellungen, t, ansprache } from '@/lib/einstellungen';
import { linkFuer } from '@/lib/kunden';
import { anredeName } from '@/lib/texte';

export const dynamic = 'force-dynamic';

/** Kunden, die der Berater freundlich erinnern könnte. Die App verschickt nichts selbst. */
export const GET = admin(() => {
  const kunden = all<ErinnerKunde & { vorname: string; nachname: string; anrede: string; ansprache: string; handy: string | null; email: string | null; berater: string | null }>(
    `SELECT k.id, k.vorname, k.nachname, k.anrede, k.ansprache, k.handy, k.email, k.token_erstellt, k.token_widerrufen, k.zuletzt_gesehen, k.erinnert_am,
            (SELECT COUNT(*) FROM teilungen t WHERE t.kunde_id = k.id AND t.geteilt_am IS NOT NULL) geteilt,
            (SELECT name FROM berater WHERE id = k.berater_id) berater
       FROM kunden k WHERE k.token_hash IS NOT NULL`,
  );
  const byId = new Map(kunden.map((k) => [k.id, k]));
  return json(
    erinnerungen(kunden, new Date(), einstellungen().erinnerungNachTagen).map((e) => {
      const k = byId.get(e.id)!;
      const link = linkFuer(k.id);
      return {
        ...e,
        name: `${k.vorname} ${k.nachname}`.trim(),
        handy: k.handy,
        email: k.email,
        berater: k.berater,
        text: link ? t('erinnerung.text', { vorname: k.vorname, anrede_name: anredeName(k, ansprache(k)), link }, ansprache(k)) : '',
      };
    }),
  );
});

// Als erinnert markieren (dann 60 Tage nicht mehr in der Liste)
export const POST = admin(async (req, b) => {
  const d = await body(req);
  const id = Number(d.id);
  if (d.zuruecksetzen) run('UPDATE kunden SET erinnert_am = NULL WHERE id = ?', id);
  else run("UPDATE kunden SET erinnert_am = datetime('now') WHERE id = ?", id);
  protokolliere(b.id, 'erinnert', String(id));
  return json({ ok: true });
});
