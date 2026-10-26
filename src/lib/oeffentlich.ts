// Gemeinsame Daten für die öffentliche Freund-Seite (echte Seite und Vorschau des Empfehlers).
import { einstellungen, texte } from './einstellungen.ts';
import type { FreundSeite } from './teilungen.ts';
import { all } from './db.ts';
import { testimonialsFuer } from './anreize.ts';

export function freundProps(seite: FreundSeite) {
  const e = einstellungen();
  return {
    seite,
    t: texte(['freund.', 'footer.', 'kunde.vorschau', 'kunde.teilen']),
    bewertungenUrl: e.bewertungenUrl,
    orte: e.verfuegbarkeit.orte.length ? e.verfuegbarkeit.orte : (['online'] as ('online' | 'hamburg')[]),
    testimonials: testimonialsFuer(
      all<{ id: number; name: string; zitat: string | null; video_id: number; poster_id: number | null; themen: string; aktiv: number; reihenfolge: number }>(
        'SELECT id, name, zitat, video_id, poster_id, themen, aktiv, reihenfolge FROM testimonials',
      ),
      seite.geschenk.themen,
    ).map((x) => ({ id: x.id, name: x.name, zitat: x.zitat, video: x.video_id, poster: x.poster_id })),
    terminExtern: e.terminModus === 'extern' ? seite.berater?.termin_url || null : null,
  };
}
