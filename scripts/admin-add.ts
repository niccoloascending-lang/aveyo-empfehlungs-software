// Berater-Zugang anlegen oder Passwort zurücksetzen (setzt auch 2FA zurück).
// Aufruf: npm run admin:add -- "Name" email@aveyo.de "neues-passwort-12+"
import { ladeEnv } from './env.ts';
ladeEnv();
const { getDb, one, run, insertRow } = await import('../src/lib/db.ts');
const { hashPasswort, passwortProblem } = await import('../src/lib/token.ts');

const [name, email, passwort] = process.argv.slice(2);
if (!name || !email || !passwort) {
  console.error('Aufruf: npm run admin:add -- "Name" email passwort');
  process.exit(1);
}
const p = passwortProblem(passwort);
if (p) {
  console.error(p);
  process.exit(1);
}
getDb();
const vorhanden = one<{ id: number }>('SELECT id FROM berater WHERE email = ?', email.toLowerCase());
if (vorhanden) {
  run('UPDATE berater SET name = ?, pw_hash = ?, totp_aktiv = 0, totp_enc = NULL, totp_schritt = -1 WHERE id = ?', name, hashPasswort(passwort), vorhanden.id);
  console.log('Passwort zurückgesetzt, 2FA wird beim nächsten Login neu eingerichtet.');
} else {
  insertRow('berater', { name, email: email.toLowerCase(), pw_hash: hashPasswort(passwort) });
  console.log('Berater angelegt. 2FA wird beim ersten Login eingerichtet.');
}
