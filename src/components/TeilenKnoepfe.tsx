'use client';
import { useEffect, useState } from 'react';
import { Copy, Mail, Send, Share2, MessageCircle, Check } from 'lucide-react';
import { teilenUrl, type Kanal } from '@/lib/teilen';

type Props = {
  nachricht: string;
  link: string;
  betreff?: string;
  t: Record<string, string>;
  deaktiviert?: boolean;
  onGeteilt?: (kanal: Kanal) => void;
};

/**
 * Teilen ausschließlich über die Apps auf dem Gerät des Nutzers (WhatsApp, Signal, Telegram, Mail-Programm).
 * Echte Links (<a href>) statt window.open, damit mobile Browser nichts blockieren.
 */
export default function TeilenKnoepfe({ nachricht, link, betreff = '', t, deaktiviert, onGeteilt }: Props) {
  const [kopiert, setKopiert] = useState(false);
  const [hatNativ, setHatNativ] = useState(false);
  useEffect(() => setHatNativ(typeof navigator.share === 'function'), []);

  const kopieren = async (kanal: Kanal = 'kopieren') => {
    try {
      await navigator.clipboard.writeText(nachricht);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = nachricht;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2500);
    onGeteilt?.(kanal);
  };

  const nativ = async (kanal: Kanal) => {
    if (!hatNativ) return kopieren(kanal);
    try {
      await navigator.share({ text: nachricht });
      onGeteilt?.(kanal);
    } catch {
      /* abgebrochen */
    }
  };

  const wa = teilenUrl('whatsapp', nachricht, link)!;
  const tg = teilenUrl('telegram', nachricht, link)!;
  const mail = teilenUrl('email', nachricht, link, betreff)!;
  const aus = deaktiviert ? { 'aria-disabled': true, tabIndex: -1, onClick: (e: React.MouseEvent) => e.preventDefault() } : {};

  return (
    <div className="space-y-3">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className={`knopf w-full bg-[#1f8f4e] text-lg text-white hover:bg-[#18733e] ${deaktiviert ? 'pointer-events-none opacity-50' : ''}`}
        onClick={() => onGeteilt?.('whatsapp')}
        {...aus}
      >
        <MessageCircle size={22} aria-hidden /> WhatsApp
      </a>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="knopf-zweit" disabled={deaktiviert} onClick={() => nativ('signal')}>
          <Send size={18} aria-hidden /> Signal
        </button>
        <a
          href={tg}
          target="_blank"
          rel="noopener noreferrer"
          className={`knopf-zweit ${deaktiviert ? 'pointer-events-none opacity-50' : ''}`}
          onClick={() => onGeteilt?.('telegram')}
          {...aus}
        >
          <Send size={18} aria-hidden /> Telegram
        </a>
        <a href={mail} className={`knopf-zweit ${deaktiviert ? 'pointer-events-none opacity-50' : ''}`} onClick={() => onGeteilt?.('email')} {...aus}>
          <Mail size={18} aria-hidden /> E-Mail
        </a>
        <button type="button" className="knopf-zweit" disabled={deaktiviert} onClick={() => kopieren()}>
          {kopiert ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />} {kopiert ? '✓' : t['kunde.teilen.kopieren'] ?? 'Kopieren'}
        </button>
      </div>
      {hatNativ && (
        <button type="button" className="knopf-zweit w-full" disabled={deaktiviert} onClick={() => nativ('nativ')}>
          <Share2 size={18} aria-hidden /> {t['kunde.teilen.mehr'] ?? 'Andere App …'}
        </button>
      )}
      <p aria-live="polite" className="min-h-[1.25rem] text-center text-sm font-medium text-marke-dunkel">
        {kopiert ? t['kunde.teilen.kopiert'] ?? 'Kopiert!' : ''}
      </p>
    </div>
  );
}
