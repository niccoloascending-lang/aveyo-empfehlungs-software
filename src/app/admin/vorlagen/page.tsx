'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten } from '@/components/admin/api';
import { Meldung } from '@/components/admin/ui';

type V = { id?: number; ton: 'locker' | 'kurz' | 'ausfuehrlich'; variante: string; text: string; aktiv: number };
const TON: Record<string, string> = { locker: 'Locker', kurz: 'Kurz', ausfuehrlich: 'Ausführlich' };

export default function Vorlagen() {
  const { daten, laden } = useDaten<V[]>('/api/admin/vorlagen');
  const [neu, setNeu] = useState<V | null>(null);
  const [fehler, setFehler] = useState('');

  const speichern = async (v: V) => {
    const r = v.id ? await anfrage(`/api/admin/vorlagen/${v.id}`, 'PUT', v) : await anfrage('/api/admin/vorlagen', 'POST', v);
    if (r.error) return setFehler(r.error);
    setFehler('');
    setNeu(null);
    laden();
  };

  return (
    <Shell
      titel="Nachrichtenvorlagen"
      aktion={
        <button className="a-btn" onClick={() => setNeu({ ton: 'locker', variante: 'B', text: '', aktiv: 1 })}>
          <Plus size={16} /> Variante
        </button>
      }
    >
      <Meldung
        art="info"
        text="Texte, die der Kunde an Freunde schickt (er kann sie vorher ändern). Platzhalter: {geschenk_satz} (z. B. „einen persönlichen PKV-Beitragscheck“), {geschenk} (Titel), {link}, {absender}, {zitat}. Mehrere aktive Varianten je Ton = A/B-Test: Jeder Link bekommt zufällig eine Variante; die Einlösequote steht in der Übersicht."
      />
      <Meldung text={fehler} />
      <div className="mt-4 space-y-6">
        {neu && <VorlageForm v={neu} speichern={speichern} abbrechen={() => setNeu(null)} />}
        {(['locker', 'kurz', 'ausfuehrlich'] as const).map((ton) => (
          <section key={ton}>
            <h2 className="mb-2 font-semibold">{TON[ton]}</h2>
            <div className="space-y-3">
              {(daten ?? [])
                .filter((v) => v.ton === ton)
                .map((v) => (
                  <VorlageForm key={v.id} v={v} speichern={speichern} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}

function VorlageForm({ v, speichern, abbrechen }: { v: V; speichern: (v: V) => void; abbrechen?: () => void }) {
  const [x, setX] = useState(v);
  const geaendert = JSON.stringify(x) !== JSON.stringify(v);
  return (
    <div className={`a-karte space-y-2 ${x.aktiv ? '' : 'opacity-60'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <select className="a-input w-auto" value={x.ton} onChange={(e) => setX({ ...x, ton: e.target.value as V['ton'] })} aria-label="Ton">
          {Object.entries(TON).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <input className="a-input w-20" value={x.variante} onChange={(e) => setX({ ...x, variante: e.target.value })} aria-label="Variante" />
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={!!x.aktiv} onChange={(e) => setX({ ...x, aktiv: e.target.checked ? 1 : 0 })} /> aktiv
        </label>
      </div>
      <textarea className="a-input" rows={3} value={x.text} onChange={(e) => setX({ ...x, text: e.target.value })} aria-label="Text" />
      {(geaendert || abbrechen) && (
        <div className="flex gap-2">
          <button className="a-btn" onClick={() => speichern(x)}>
            Speichern
          </button>
          {abbrechen && (
            <button className="a-btn2" onClick={abbrechen}>
              Abbrechen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
