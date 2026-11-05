import { ImageResponse } from 'next/og';
import { einstellungen, texte } from '@/lib/einstellungen';
import { OG_GROESSE, ogKarte } from '@/components/OgKarte';

export const alt = 'Persönlicher Geschenke-Bereich';
export const size = OG_GROESSE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

/**
 * Vorschaubild für den Kunden-Link (Nachricht vom Berater an den Kunden). Bewusst ohne Namen oder Kundendaten:
 * Das Bild wird von WhatsApp & Co. abgerufen und dort zwischengespeichert. Der Token wird nicht ausgewertet.
 */
export default function Bild() {
  const t = texte(['og.kunde.']);
  return new ImageResponse(ogKarte(einstellungen().theme, t['og.kunde.oben'], t['og.kunde.titel'], t['og.kunde.zeile']), size);
}
