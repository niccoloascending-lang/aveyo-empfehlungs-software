import { admin, json, fehler, body } from '@/lib/admin';
import { one, run, protokolliere } from '@/lib/db';
import { mehrzeilig, sauber } from '@/lib/validierung';
import { hashPasswort, passwortProblem, pruefePasswort } from '@/lib/token';

export const dynamic = 'force-dynamic';

export const GET = admin((_req, b) => json(one('SELECT id, name, email, foto_id, vorstellung, video_url, termin_url, kalender_id, totp_aktiv FROM berater WHERE id = ?', b.id)));

const url = (x: unknown) => {
  const s = sauber(x, 500);
  if (!s) return '';
  return /^https:\/\//.test(s) ? s : null;
};

export const PUT = admin(async (req, b) => {
  const d = await body(req);
  if (d.passwortNeu) {
    const u = one<{ pw_hash: string }>('SELECT pw_hash FROM berater WHERE id = ?', b.id)!;
    if (!pruefePasswort(String(d.passwortAlt ?? ''), u.pw_hash)) return fehler('Aktuelles Passwort stimmt nicht.');
    const p = passwortProblem(d.passwortNeu);
    if (p) return fehler(p);
    run('UPDATE berater SET pw_hash = ? WHERE id = ?', hashPasswort(d.passwortNeu), b.id);
    protokolliere(b.id, 'passwort_geaendert');
    return json({ ok: true });
  }
  const video = url(d.video_url);
  const termin = url(d.termin_url);
  if (video === null || termin === null) return fehler('Links müssen mit https:// beginnen.');
  const name = sauber(d.name, 80);
  if (!name) return fehler('Name fehlt.');
  run(
    'UPDATE berater SET name = ?, vorstellung = ?, video_url = ?, termin_url = ?, kalender_id = ?, foto_id = ? WHERE id = ?',
    name,
    mehrzeilig(d.vorstellung, 1000) || null,
    video || null,
    termin || null,
    sauber(d.kalender_id, 200) || null,
    Number(d.foto_id) > 0 ? Number(d.foto_id) : null,
    b.id,
  );
  return json({ ok: true });
});
