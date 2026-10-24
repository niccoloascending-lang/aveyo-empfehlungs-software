import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { einstellungen, basisUrl } from '@/lib/einstellungen';
import { themeCss } from '@/lib/theme';

export const dynamic = 'force-dynamic';

// Proxima Nova (Hausschrift) ist lizenzpflichtig. Ist sie auf dem Gerät/als Webfont vorhanden, wird sie genutzt,
// sonst Montserrat als nahe Ersatzschrift. next/font lädt sie beim Build und liefert sie selbst aus (keine Anfrage an Google).
const ersatz = Montserrat({ subsets: ['latin'], variable: '--schrift-ersatz', display: 'swap' });

export function generateMetadata(): Metadata {
  const e = einstellungen();
  return {
    metadataBase: new URL(basisUrl()),
    title: `${e.theme.firmenname} – Ein Geschenk für dich`,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#FAF9F6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const e = einstellungen();
  return (
    <html lang="de" className={ersatz.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(e.theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
