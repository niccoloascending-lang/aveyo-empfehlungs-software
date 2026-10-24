// Gemeinsame Daten für die öffentliche Freund-Seite (echte Seite und Vorschau des Empfehlers).
import { einstellungen, texte } from './einstellungen.ts';
import type { FreundSeite } from './teilungen.ts';

export function freundProps(seite: FreundSeite) {
  const e = einstellungen();
  return {
    seite,
    t: texte(['freund.', 'footer.', 'kunde.vorschau', 'kunde.teilen']),
    bewertungenUrl: e.bewertungenUrl,
    orte: e.verfuegbarkeit.orte.length ? e.verfuegbarkeit.orte : (['online'] as ('online' | 'hamburg')[]),
    terminExtern: e.terminModus === 'extern' ? seite.berater?.termin_url || null : null,
  };
}
