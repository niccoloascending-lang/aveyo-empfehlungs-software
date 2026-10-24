import { admin, json, fehler, body } from '@/lib/admin';
import { kundenListe, kundeAnlegen } from '@/lib/kunden';
import { istEmail, sauber, telefon, themenLesen } from '@/lib/validierung';
import { protokolliere } from '@/lib/db';
import { istAnredeform, istAnsprache } from '@/lib/texte';

export const dynamic = 'force-dynamic';

export const GET = admin((req) => json(kundenListe(new URL(req.url).searchParams.get('q') ?? '')));

export const POST = admin(async (req, b) => {
  const d = await body(req);
  const vorname = sauber(d.vorname, 80);
  const email = sauber(d.email, 200).toLowerCase();
  const handy = telefon(d.handy);
  if (!vorname) return fehler('Vorname fehlt.');
  if (email && !istEmail(email)) return fehler('E-Mail ungültig.');
  if (handy === null) return fehler('Handynummer ungültig.');
  if (!istAnredeform(d.anrede ?? '') || !istAnsprache(d.ansprache ?? '')) return fehler('Anrede/Ansprache ungültig.');
  const id = kundeAnlegen({ anrede: d.anrede ?? '', ansprache: d.ansprache ?? '', vorname, nachname: sauber(d.nachname, 80), email: email || null, handy: handy || null, themen: themenLesen(d.themen).join(','), berater_id: b.id });
  protokolliere(b.id, 'kunde_angelegt', String(id));
  return json({ ok: true, id });
});
