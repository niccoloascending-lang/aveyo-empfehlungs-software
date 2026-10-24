import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { freundSeite } from '@/lib/teilungen';
import { einstellungen, texte } from '@/lib/einstellungen';
import { fuelle } from '@/lib/texte';

export const alt = 'Ein Geschenk für dich';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

/** Persönliches Vorschaubild für WhatsApp & Co.: „Ein Geschenk von Lisa“ + Geschenktitel. */
export default function Bild({ params }: { params: { code: string } }) {
  const s = freundSeite(params.code);
  const th = einstellungen().theme;
  const t = texte(['og.']);
  const von = s?.teilung.von_name ? fuelle(t['og.von'], { empfehler: s.teilung.von_name }) : t['og.anonym'];
  const titel = s?.geschenk.titel ?? '';
  const hex = (x: string, f: string) => (/^#[0-9a-f]{6}$/i.test(x) ? x : f);
  const marke = hex(th.marke, '#172545');
  const dunkel = hex(th.markeDunkel, '#0E1830');
  const hell = hex(th.markeHell, '#ECEAE3');
  const akzent = hex(th.akzent, '#8B806F');
  const tinte = hex(th.tinte, '#172545');
  let logo = '';
  try {
    logo = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'logo-aveyo.png')).toString('base64')}`;
  } catch {
    /* ohne Logo */
  }
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: hell, padding: 56 }}>
        <div style={{ flex: 1, display: 'flex', background: '#ffffff', borderRadius: 48, padding: 64, alignItems: 'center', gap: 56 }}>
          <div style={{ width: 260, height: 240, display: 'flex', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64, background: dunkel, borderRadius: 20, transform: 'rotate(-7deg) translateY(-14px)' }} />
            <div style={{ position: 'absolute', left: 16, right: 16, top: 56, bottom: 0, background: marke, borderRadius: 20 }} />
            <div style={{ position: 'absolute', left: 116, width: 28, top: 0, bottom: 0, background: `linear-gradient(to bottom, ${hell}, ${akzent})` }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {logo && <img src={logo} width={200} height={80} style={{ marginBottom: 24 }} alt="" />}
            <div style={{ fontSize: 40, color: akzent, fontWeight: 600 }}>{von}</div>
            <div style={{ fontSize: titel.length > 40 ? 58 : 72, color: tinte, fontWeight: 800, lineHeight: 1.1, marginTop: 16 }}>{titel}</div>
            <div style={{ fontSize: 28, color: akzent, marginTop: 28 }}>{t['og.zeile']}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
