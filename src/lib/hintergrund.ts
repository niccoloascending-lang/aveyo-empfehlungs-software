// Hintergrundaufgaben (gestartet über instrumentation.ts): Löschkonzept täglich, Webhook-Zustellung jede Minute.
import { all, run } from './db.ts';
import { einstellungen } from './einstellungen.ts';
import { zuLoeschen, type LoeschAnfrage } from './loeschung.ts';
import { webhooksZustellen } from './webhook.ts';

export function loeschkonzeptAnwenden(jetzt = new Date()): number {
  const e = einstellungen();
  const kandidaten = all<LoeschAnfrage>('SELECT id, typ, status, bestaetigt, erstellt, geaendert FROM anfragen');
  const ids = zuLoeschen(kandidaten, jetzt, e.loeschenMonate, e.doiTage);
  for (const id of ids) run('DELETE FROM anfragen WHERE id = ?', id); // Einwilligungen kaskadieren
  if (ids.length) run("INSERT INTO protokoll (aktion, ziel) VALUES ('loeschkonzept', ?)", `${ids.length} Anfragen gelöscht`);
  return ids.length;
}

const g = globalThis as unknown as { __geschenkHintergrund?: boolean };

export function starteHintergrund() {
  if (g.__geschenkHintergrund) return;
  g.__geschenkHintergrund = true;
  const sicher = (fn: () => unknown) => {
    try {
      const r = fn();
      if (r instanceof Promise) r.catch((e) => console.error('Hintergrund:', e.message));
    } catch (e) {
      console.error('Hintergrund:', (e as Error).message);
    }
  };
  setTimeout(() => sicher(loeschkonzeptAnwenden), 30_000);
  setInterval(() => sicher(loeschkonzeptAnwenden), 6 * 3600_000).unref?.();
  setInterval(() => sicher(webhooksZustellen), 60_000).unref?.();
}
