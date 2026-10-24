import { admin, json } from '@/lib/admin';
import { all, one } from '@/lib/db';
import { einstellungen } from '@/lib/einstellungen';
import { kennzahlen, type StatAnfrage, type StatEreignis, type StatTeilung } from '@/lib/statistik';

export const dynamic = 'force-dynamic';

const TON: Record<string, string> = { locker: 'Locker', kurz: 'Kurz', ausfuehrlich: 'Ausführlich' };

export const GET = admin((req) => {
  const tage = Math.min(3650, Math.max(1, Number(new URL(req.url).searchParams.get('tage')) || 90));
  const seit = `-${tage} days`;
  const teilungen = all<StatTeilung>("SELECT id, kunde_id, geschenk_id, vorlage_id, geteilt_am, kanal FROM teilungen WHERE erstellt >= datetime('now', ?)", seit);
  const ereignisse = all<StatEreignis>("SELECT teilung_id, typ FROM ereignisse WHERE zeit >= datetime('now', ?)", seit);
  const anfragen = all<StatAnfrage>("SELECT teilung_id, typ, status, bestaetigt FROM anfragen WHERE erstellt >= datetime('now', ?)", seit);
  const geschenke = new Map(all<{ id: number; titel: string }>('SELECT id, titel FROM geschenke').map((g) => [g.id, g.titel]));
  const vorlagen = new Map(
    all<{ id: number; ton: string; variante: string; text: string }>('SELECT id, ton, variante, text FROM vorlagen').map((v) => [
      v.id,
      `${TON[v.ton] ?? v.ton} ${v.variante}: ${v.text.slice(0, 48)}${v.text.length > 48 ? '…' : ''}`,
    ]),
  );
  const eingeladen = one<{ n: number }>('SELECT COUNT(*) n FROM kunden WHERE token_hash IS NOT NULL AND token_widerrufen IS NULL')!.n;
  const neueAnfragen = one<{ n: number }>("SELECT COUNT(*) n FROM anfragen WHERE status = 'neu' AND bestaetigt IS NOT NULL")!.n;
  const baeume = einstellungen().baeume
    ? one<{ n: number }>("SELECT COUNT(*) n FROM ereignisse WHERE typ IN ('download','rechner','termin_bestaetigt','auswertung_bestaetigt','download_mail_bestaetigt')")!.n
    : null;
  return json({ tage, neueAnfragen, baeume, ...kennzahlen(eingeladen, teilungen, ereignisse, anfragen, geschenke, vorlagen) });
});
