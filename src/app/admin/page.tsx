'use client';
import Link from 'next/link';
import { useState } from 'react';
import Shell from '@/components/admin/Shell';
import { useDaten } from '@/components/admin/api';
import { Meldung } from '@/components/admin/ui';

type Zeile = { id: number | string; name: string; geteilt: number; geoeffnet: number; eingeloest: number; termine: number; quote: number };
type Dash = {
  tage: number;
  neueAnfragen: number;
  kundenEingeladen: number;
  kundenGeteilt: number;
  geteilt: number;
  geoeffnet: number;
  eingeloest: number;
  termine: number;
  kunden: number;
  proGeschenk: Zeile[];
  proVorlage: Zeile[];
  proKanal: Zeile[];
};

const KANAL: Record<string, string> = { whatsapp: 'WhatsApp', signal: 'Signal', telegram: 'Telegram', email: 'E-Mail', kopieren: 'Kopiert', nativ: 'Andere App', qr: 'QR-Code', weitergabe: 'Weitergabe durch Freund' };

function Tabelle({ titel, zeilen, name = (z: Zeile) => z.name }: { titel: string; zeilen: Zeile[]; name?: (z: Zeile) => string }) {
  const max = Math.max(1, ...zeilen.map((z) => z.quote));
  return (
    <section className="a-karte overflow-x-auto">
      <h2 className="mb-3 font-semibold">{titel}</h2>
      {!zeilen.length ? (
        <p className="text-sm text-slate-500">Noch keine Daten.</p>
      ) : (
        <table className="a-tab min-w-[520px]">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-right">Geteilt</th>
              <th className="text-right">Geöffnet</th>
              <th className="text-right">Eingelöst</th>
              <th className="text-right">Termine</th>
              <th className="w-40">Einlösequote</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={String(z.id)}>
                <td className="max-w-[260px] truncate" title={name(z)}>
                  {name(z)}
                </td>
                <td className="text-right tabular-nums">{z.geteilt}</td>
                <td className="text-right tabular-nums">{z.geoeffnet}</td>
                <td className="text-right tabular-nums">{z.eingeloest}</td>
                <td className="text-right tabular-nums">{z.termine}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-marke" style={{ width: `${Math.min(100, (z.quote / max) * 100)}%` }} />
                    </div>
                    <span className="w-12 text-right text-xs tabular-nums">{z.quote} %</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [tage, setTage] = useState(90);
  const { daten: d, fehler } = useDaten<Dash>(`/api/admin/dashboard?tage=${tage}`);
  const kacheln: [string, number | undefined, string?][] = d
    ? [
        ['Kunden eingeladen', d.kundenEingeladen],
        ['Kunden haben geteilt', d.kundenGeteilt],
        ['Links geteilt', d.geteilt],
        ['Links geöffnet', d.geoeffnet],
        ['Geschenke eingelöst', d.eingeloest],
        ['Termine bestätigt', d.termine],
        ['Daraus Kunden', d.kunden],
      ]
    : [];
  return (
    <Shell
      titel="Übersicht"
      aktion={
        <select className="a-input w-auto" value={tage} onChange={(e) => setTage(Number(e.target.value))} aria-label="Zeitraum">
          <option value={30}>Letzte 30 Tage</option>
          <option value={90}>Letzte 90 Tage</option>
          <option value={365}>Letztes Jahr</option>
          <option value={3650}>Gesamt</option>
        </select>
      }
    >
      <Meldung text={fehler} />
      {d && d.neueAnfragen > 0 && (
        <Link href="/admin/anfragen?status=neu" className="mb-4 block rounded-xl bg-marke px-4 py-3 font-semibold text-white">
          {d.neueAnfragen} neue, bestätigte Anfrage{d.neueAnfragen === 1 ? '' : 'n'} ansehen →
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {kacheln.map(([l, n]) => (
          <div key={l} className="a-karte">
            <p className="text-2xl font-bold tabular-nums">{n ?? '–'}</p>
            <p className="text-xs text-slate-600">{l}</p>
          </div>
        ))}
      </div>
      {d && (
        <div className="mt-6 space-y-6">
          <Tabelle titel="Welches Geschenk funktioniert am besten?" zeilen={d.proGeschenk} />
          <Tabelle titel="Nachrichtenvorlagen (A/B-Test)" zeilen={d.proVorlage} />
          <Tabelle titel="Kanäle" zeilen={d.proKanal} name={(z) => KANAL[String(z.id)] ?? String(z.id)} />
          <p className="text-xs text-slate-500">
            Gezählt wird ohne Cookies und ohne IP-Adressen. Link-Vorschauen von WhatsApp &amp; Co. zählen nicht als „geöffnet“. Einlösequote = Einlösungen je geteiltem Link
            (kann über 100 % liegen, wenn ein Link in einer Gruppe geteilt wurde).
          </p>
        </div>
      )}
    </Shell>
  );
}
