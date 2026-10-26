import { admin, json } from '@/lib/admin';
import { all, one } from '@/lib/db';
import { einstellungen } from '@/lib/einstellungen';
import { kennzahlen, type StatAnfrage, type StatEreignis, type StatTeilung } from '@/lib/statistik';

export const dynamic = 'force-dynamic';

const TON: Record<string, string> = { locker: 'Locker', kurz: 'Kurz', ausfuehrlich: 'Ausführlich' };

export const GET = admin((req) => {
  const tage = Math.min(3650, Math.max(1, Number(new URL(req.url).searchParams.get('tage')) || 90));
  const seit = `-${tage} days`;
  const teilungen = all<StatTeilung>("SELECT id, kunde_id, geschenk_id, vorlage_id, geteilt_am, kanal, anlass_id FROM teilungen WHERE erstellt >= datetime('now', ?)", seit);
  const ereignisse = all<StatEreignis>("SELECT teilung_id, typ FROM ereignisse WHERE zeit >= datetime('now', ?)", seit);
  const anfragen = all<StatAnfrage>("SELECT teilung_id, typ, status, bestaetigt FROM anfragen WHERE erstellt >= datetime('now', ?)", seit);
  const geschenke = new Map(all<{ id: number; titel: string }>('SELECT id, titel FROM geschenke').map((g) => [g.id, g.titel]));
  const vorlagen = new Map(
    all<{ id: number; ton: string; variante: string; text: string }>('SELECT id, ton, variante, text FROM vorlagen').map((v) => [
      v.id,
      `${TON[v.ton] ?? v.ton} ${v.variante}: ${v.text.slice(0, 48)}${v.text.length > 48 ? '…' : ''}`,
    ]),
  );
  const anlaesse = new Map(all<{ id: number; icon: string; text: string }>('SELECT id, icon, text FROM anlaesse').map((a) => [a.id, `${a.icon} … ${a.text}`]));
  const eingeladen = one<{ n: number }>('SELECT COUNT(*) n FROM kunden WHERE token_hash IS NOT NULL AND token_widerrufen IS NULL')!.n;
  const neueAnfragen = one<{ n: number }>("SELECT COUNT(*) n FROM anfragen WHERE status = 'neu' AND bestaetigt IS NOT NULL")!.n;
  // Offene Dankeschöns (Spenden A, Gutscheine B)
  const offen = one<{ spenden: number; praemien: number }>(
    "SELECT COALESCE(SUM(CASE WHEN art = 'spende' THEN betrag END), 0) spenden, COALESCE(SUM(CASE WHEN art = 'praemie' THEN betrag END), 0) praemien FROM zusagen WHERE status = 'offen'",
  )!;
  // A/B-Test Dankeschön: Gruppen im Vergleich (alle Kunden mit Gruppe, Teilungen im Zeitraum)
  const abVergleich = (['A', 'B'] as const).map((v) => {
    const r = one<{ kunden: number; teilten: number }>(
      `SELECT COUNT(*) kunden, SUM(EXISTS (SELECT 1 FROM teilungen t WHERE t.kunde_id = k.id AND t.geteilt_am IS NOT NULL AND t.erstellt >= datetime('now', ?))) teilten
         FROM kunden k WHERE k.belohnung_variante = ?`,
      seit,
      v,
    )!;
    const z = one<{ geteilt: number; eingeloest: number; gespraeche: number }>(
      `SELECT
         (SELECT COUNT(*) FROM teilungen t JOIN kunden k ON k.id = t.kunde_id WHERE k.belohnung_variante = ?1 AND t.geteilt_am IS NOT NULL AND t.erstellt >= datetime('now', ?2)) geteilt,
         (SELECT COUNT(*) FROM ereignisse e JOIN teilungen t ON t.id = e.teilung_id JOIN kunden k ON k.id = t.kunde_id
            WHERE k.belohnung_variante = ?1 AND e.zeit >= datetime('now', ?2)
              AND e.typ IN ('download','rechner','termin_bestaetigt','auswertung_bestaetigt','download_mail_bestaetigt')) eingeloest,
         (SELECT COUNT(*) FROM anfragen a JOIN teilungen t ON t.id = a.teilung_id JOIN kunden k ON k.id = t.kunde_id
            WHERE k.belohnung_variante = ?1 AND a.status IN ('beratung','kunde') AND a.erstellt >= datetime('now', ?2)) gespraeche`,
      v,
      seit,
    )!;
    return { variante: v, kunden: r.kunden, teilten: r.teilten ?? 0, ...z };
  });
  return json({ tage, neueAnfragen, offen, abVergleich, abAktiv: einstellungen().abTest.aktiv, ...kennzahlen(eingeladen, teilungen, ereignisse, anfragen, geschenke, vorlagen, anlaesse) });
});
