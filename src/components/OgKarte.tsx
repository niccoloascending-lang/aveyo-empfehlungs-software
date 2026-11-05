/* eslint-disable @next/next/no-img-element */
// Vorschaubild für WhatsApp & Co. (1200×630): Geschenk-Symbol, Logo, drei Textzeilen. Für next/og (ImageResponse).
import fs from 'node:fs';
import path from 'node:path';
import type { Einstellungen } from '@/lib/einstellungen';

export const OG_GROESSE = { width: 1200, height: 630 };

export function ogKarte(theme: Einstellungen['theme'], oben: string, titel: string, zeile: string) {
  const hex = (x: string, f: string) => (/^#[0-9a-f]{6}$/i.test(x) ? x : f);
  const marke = hex(theme.marke, '#172545');
  const dunkel = hex(theme.markeDunkel, '#0E1830');
  const hell = hex(theme.markeHell, '#ECEAE3');
  const akzent = hex(theme.akzent, '#8B806F');
  const tinte = hex(theme.tinte, '#172545');
  let logo = '';
  try {
    logo = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public', 'logo-aveyo.png')).toString('base64')}`;
  } catch {
    /* ohne Logo */
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: hell, padding: 56 }}>
      <div style={{ flex: 1, display: 'flex', background: '#ffffff', borderRadius: 48, padding: 64, alignItems: 'center', gap: 56 }}>
        <div style={{ width: 260, height: 240, display: 'flex', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64, background: dunkel, borderRadius: 20, transform: 'rotate(-7deg) translateY(-14px)' }} />
          <div style={{ position: 'absolute', left: 16, right: 16, top: 56, bottom: 0, background: marke, borderRadius: 20 }} />
          <div style={{ position: 'absolute', left: 116, width: 28, top: 0, bottom: 0, background: `linear-gradient(to bottom, ${hell}, ${akzent})` }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {logo && <img src={logo} width={200} height={80} style={{ marginBottom: 24 }} alt="" />}
          <div style={{ fontSize: 40, color: akzent, fontWeight: 600 }}>{oben}</div>
          <div style={{ fontSize: titel.length > 40 ? 58 : 72, color: tinte, fontWeight: 800, lineHeight: 1.1, marginTop: 16 }}>{titel}</div>
          <div style={{ fontSize: 28, color: akzent, marginTop: 28 }}>{zeile}</div>
        </div>
      </div>
    </div>
  );
}
