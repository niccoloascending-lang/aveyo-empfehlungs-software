import { ImageResponse } from 'next/og';
import { freundSeite } from '@/lib/teilungen';
import { einstellungen, texte } from '@/lib/einstellungen';
import { fuelle } from '@/lib/texte';
import { OG_GROESSE, ogKarte } from '@/components/OgKarte';

export const alt = 'Ein Geschenk für dich';
export const size = OG_GROESSE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

/** Persönliches Vorschaubild für WhatsApp & Co.: „Ein Geschenk von Lisa“ + Geschenktitel. */
export default function Bild({ params }: { params: { code: string } }) {
  const s = freundSeite(params.code);
  const t = texte(['og.']);
  const von = s?.teilung.von_name ? fuelle(t['og.von'], { empfehler: s.teilung.von_name }) : t['og.anonym'];
  return new ImageResponse(ogKarte(einstellungen().theme, von, s?.geschenk.titel ?? '', t['og.zeile']), size);
}
