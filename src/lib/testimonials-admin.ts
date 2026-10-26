// Validierung der Testimonials aus dem Admin.
import { one } from './db.ts';
import { sauber, themenLesen } from './validierung.ts';

export function testimonialDaten(d: any): Record<string, any> | { fehler: string } {
  const name = sauber(d.name, 80);
  if (!name) return { fehler: 'Bitte einen Namen eintragen, z. B. „Sarah, selbstständig“.' };
  const video = Number(d.video_id);
  const v = Number.isInteger(video) && video > 0 ? one<{ mime: string }>('SELECT mime FROM dateien WHERE id = ?', video) : undefined;
  if (!v?.mime.startsWith('video/')) return { fehler: 'Bitte ein Video hochladen.' };
  const einwilligung = sauber(d.einwilligung, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(einwilligung)) return { fehler: 'Bitte das Datum der schriftlichen Einwilligung eintragen.' };
  const poster = Number(d.poster_id);
  return {
    name,
    zitat: sauber(d.zitat, 200) || null,
    video_id: video,
    poster_id: Number.isInteger(poster) && poster > 0 ? poster : null,
    themen: themenLesen(d.themen).join(','),
    einwilligung,
    aktiv: d.aktiv ? 1 : 0,
    reihenfolge: Number.isFinite(Number(d.reihenfolge)) ? Math.round(Number(d.reihenfolge)) : 0,
  };
}
