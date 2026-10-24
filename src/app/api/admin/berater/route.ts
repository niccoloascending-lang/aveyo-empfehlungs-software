import { admin, json, fehler, body } from '@/lib/admin';
import { all, one, run, insertRow, protokolliere, transaktion } from '@/lib/db';
import { hashPasswort, passwortProblem } from '@/lib/token';
import { istEmail, sauber } from '@/lib/validierung';

export const dynamic = 'force-dynamic';

export const GET = admin((_req, b) =>
  json(all('SELECT id, name, email, totp_aktiv, erstellt, (SELECT COUNT(*) FROM kunden k WHERE k.berater_id = berater.id) kunden, id = ? ich FROM berater ORDER BY id', b.id)),
);

// Weiteren Berater anlegen (z. B. Timo). 2FA richtet er beim ersten Login selbst ein.
export const POST = admin(async (req, b) => {
  const d = await body(req);
  const name = sauber(d.name, 80);
  const email = sauber(d.email, 200).toLowerCase();
  if (!name || !istEmail(email)) return fehler('Name und gültige E-Mail angeben.');
  const p = passwortProblem(d.passwort);
  if (p) return fehler(p);
  if (one('SELECT 1 FROM berater WHERE email = ?', email)) return fehler('Diese E-Mail ist schon vergeben.');
  const id = insertRow('berater', { name, email, pw_hash: hashPasswort(d.passwort) });
  protokolliere(b.id, 'berater_angelegt', String(id));
  return json({ ok: true, id });
});

/** Zugang entfernen (z. B. Demo-Zugänge). Kunden und Anfragen gehen an den angemeldeten Berater über. */
export const DELETE = admin(async (req, b) => {
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return fehler('Unbekannter Zugang.');
  if (id === b.id) return fehler('Den eigenen Zugang kannst du hier nicht entfernen.');
  if (!one('SELECT 1 FROM berater WHERE id = ?', id)) return fehler('Unbekannter Zugang.', 404);
  const n = transaktion(() => {
    const k = run('UPDATE kunden SET berater_id = ? WHERE berater_id = ?', b.id, id).changes;
    run('UPDATE anfragen SET berater_id = ? WHERE berater_id = ?', b.id, id);
    run('DELETE FROM berater WHERE id = ?', id);
    return k;
  });
  protokolliere(b.id, 'berater_entfernt', `${id} (${n} Kunden übernommen)`);
  return json({ ok: true, kunden: n });
});
