'use client';
import Link from 'next/link';
import { MessageCircle, Mail, Check } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten } from '@/components/admin/api';
import { KopierKnopf, Meldung } from '@/components/admin/ui';

type E = { id: number; grund: 'nie_geoeffnet' | 'nicht_geteilt'; seitTagen: number; name: string; handy: string | null; email: string | null; berater: string | null; text: string };

const waNummer = (h: string | null) => {
  if (!h) return '';
  let n = h.replace(/[^\d+]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  if (n.startsWith('0')) n = '+49' + n.slice(1);
  return n.replace('+', '');
};

export default function Erinnern() {
  const { daten, laden } = useDaten<E[]>('/api/admin/erinnern');
  const erledigt = async (id: number) => {
    await anfrage('/api/admin/erinnern', 'POST', { id });
    laden();
  };
  const gruppen: [E['grund'], string][] = [
    ['nicht_geteilt', 'Bereich geöffnet, aber noch nichts verschenkt'],
    ['nie_geoeffnet', 'Link noch nie geöffnet'],
  ];
  return (
    <Shell titel="Erinnern">
      <Meldung
        art="info"
        text="Die meisten Links werden nicht abgelehnt, sondern vergessen. Eine kurze, persönliche Nachricht von dir hilft – höchstens einmal alle 60 Tage. Die App verschickt nichts selbst."
      />
      {daten && !daten.length && <p className="mt-4 text-sm text-slate-500">Gerade niemand zu erinnern.</p>}
      {gruppen.map(([g, titel]) => {
        const liste = (daten ?? []).filter((e) => e.grund === g);
        if (!liste.length) return null;
        return (
          <section key={g} className="mt-6">
            <h2 className="mb-2 font-semibold">
              {titel} ({liste.length})
            </h2>
            <div className="space-y-3">
              {liste.map((e) => (
                <div key={e.id} className="a-karte space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/admin/kunden/${e.id}`} className="font-semibold hover:underline">
                      {e.name}
                    </Link>
                    <span className="text-xs text-slate-500">
                      seit {e.seitTagen} Tagen{e.berater ? ` · ${e.berater}` : ''}
                    </span>
                  </div>
                  <textarea className="a-input" rows={3} readOnly value={e.text} aria-label="Erinnerungstext" />
                  <div className="flex flex-wrap gap-2">
                    <KopierKnopf text={e.text} label="Text kopieren" />
                    <a className="a-btn2" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNummer(e.handy)}?text=${encodeURIComponent(e.text)}`}>
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                    {e.email && (
                      <a className="a-btn2" href={`mailto:${e.email}?body=${encodeURIComponent(e.text)}`}>
                        <Mail size={15} /> E-Mail
                      </a>
                    )}
                    <button className="a-btn" onClick={() => erledigt(e.id)}>
                      <Check size={15} /> Erinnert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </Shell>
  );
}
