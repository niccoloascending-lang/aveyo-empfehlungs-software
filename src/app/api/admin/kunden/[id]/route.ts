import { admin, json, fehler, body, idParam } from '@/lib/admin';
import { one, all, run, protokolliere } from '@/lib/db';
import { linkFuer, kundeLoeschen, type Kunde } from '@/lib/kunden';
import { wirkungVon } from '@/lib/empfehler';
import { istEmail, sauber, telefon, themenLesen } from '@/lib/validierung';
import { t, einstellungen, ansprache } from '@/lib/einstellungen';
import { anredeName, istAnredeform, istAnsprache } from '@/lib/texte';

export const dynamic = 'force-dynamic';

export const GET = admin((_req, b, ctx) => {
  const id = idParam(ctx);
  const k = one<Kunde & { berater_id: number | null }>('SELECT * FROM kunden WHERE id = ?', id);
  if (!k) return fehler('Nicht gefunden', 404);
  delete (k as any).token_hash;
  delete (k as any).token_enc;
  const link = linkFuer(id);
  const berater = one<{ name: string }>('SELECT name FROM berater WHERE id = ?', k.berater_id ?? b.id)?.name ?? b.name;
  const teilungen = all(
    `SELECT t.code, t.zitat, t.kanal, t.geteilt_am, t.erstellt, g.titel geschenk, v.ton || ' ' || v.variante vorlage,
            (SELECT COUNT(*) FROM ereignisse e WHERE e.teilung_id = t.id AND e.typ = 'geoeffnet') geoeffnet
       FROM teilungen t JOIN geschenke g ON g.id = t.geschenk_id LEFT JOIN vorlagen v ON v.id = t.vorlage_id
      WHERE t.kunde_id = ? AND t.geteilt_am IS NOT NULL ORDER BY t.id DESC`,
    id,
  );
  const dankeschoens = all('SELECT * FROM dankeschoens WHERE kunde_id = ? ORDER BY id DESC', id);
  const e = einstellungen();
  return json({
    kunde: k,
    link,
    einladung: link ? t('einladung.text', { vorname: k.vorname, anrede_name: anredeName(k, ansprache(k)), link }, ansprache(k)) : '',
    einladungBetreff: t('einladung.betreff', {}, ansprache(k)),
    dankeVorlage: t('danke.nachricht', { vorname: k.vorname, anrede_name: anredeName(k, ansprache(k)), berater }, ansprache(k)),
    wirkung: wirkungVon(k, null),
    teilungen,
    dankeschoens,
    belohnungen: e.belohnungen,
  });
});

export const PUT = admin(async (req, b, ctx) => {
  const id = idParam(ctx);
  const d = await body(req);
  const vorname = sauber(d.vorname, 80);
  const email = sauber(d.email, 200).toLowerCase();
  const handy = telefon(d.handy);
  if (!vorname) return fehler('Vorname fehlt.');
  if (email && !istEmail(email)) return fehler('E-Mail ungültig.');
  if (handy === null) return fehler('Handynummer ungültig.');
  if (!istAnredeform(d.anrede ?? '') || !istAnsprache(d.ansprache ?? '')) return fehler('Anrede/Ansprache ungültig.');
  run(
    "UPDATE kunden SET anrede = ?, ansprache = ?, vorname = ?, nachname = ?, email = ?, handy = ?, themen = ?, notiz = ?, geaendert = datetime('now') WHERE id = ?",
    d.anrede ?? '',
    d.ansprache ?? '',
    vorname,
    sauber(d.nachname, 80),
    email || null,
    handy || null,
    themenLesen(d.themen).join(','),
    sauber(d.notiz, 2000) || null,
    id,
  );
  protokolliere(b.id, 'kunde_geaendert', String(id));
  return json({ ok: true });
});

export const DELETE = admin((_req, b, ctx) => {
  const id = idParam(ctx);
  kundeLoeschen(id);
  protokolliere(b.id, 'kunde_geloescht', String(id));
  return json({ ok: true });
});
