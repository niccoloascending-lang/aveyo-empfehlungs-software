import { admin, json, fehler, body } from '@/lib/admin';
import { all, one, insertRow, protokolliere } from '@/lib/db';
import { hashPasswort, passwortProblem } from '@/lib/token';
import { istEmail, sauber } from '@/lib/validierung';

export const dynamic = 'force-dynamic';

export const GET = admin(() => json(all('SELECT id, name, email, totp_aktiv, erstellt FROM berater ORDER BY id')));

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
