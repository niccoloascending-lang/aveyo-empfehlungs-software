'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten } from '@/components/admin/api';
import { AnredeFelder, Feld, Meldung, Themen, THEMEN_LABEL } from '@/components/admin/ui';

type K = { id: number; vorname: string; nachname: string; email: string | null; themen: string; geteilt: number; eingeloest: number; link_aktiv: number; zuletzt_gesehen: string | null };

export default function Kunden() {
  const router = useRouter();
  const [suche, setSuche] = useState('');
  const { daten, laden } = useDaten<K[]>(`/api/admin/kunden?q=${encodeURIComponent(suche)}`);
  const [neu, setNeu] = useState(false);
  const [csv, setCsv] = useState(false);
  const [f, setF] = useState({ anrede: '', ansprache: '', vorname: '', nachname: '', email: '', handy: '', themen: '' });
  const [fehler, setFehler] = useState('');

  const anlegen = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await anfrage('/api/admin/kunden', 'POST', f);
    if (r.error) return setFehler(r.error);
    router.push(`/admin/kunden/${r.id}`);
  };

  return (
    <Shell
      titel="Kunden"
      aktion={
        <div className="flex gap-2">
          <button className="a-btn2" onClick={() => setCsv(!csv)}>
            <Upload size={16} /> CSV-Import
          </button>
          <button className="a-btn" onClick={() => setNeu(!neu)}>
            <Plus size={16} /> Kunde
          </button>
        </div>
      }
    >
      {neu && (
        <form onSubmit={anlegen} className="a-karte mb-6 grid gap-3 sm:grid-cols-2">
          <AnredeFelder anrede={f.anrede} ansprache={f.ansprache} onChange={(v) => setF({ ...f, ...v })} />
          <Feld label="Vorname *">
            <input className="a-input" required value={f.vorname} onChange={(e) => setF({ ...f, vorname: e.target.value })} />
          </Feld>
          <Feld label="Nachname">
            <input className="a-input" value={f.nachname} onChange={(e) => setF({ ...f, nachname: e.target.value })} />
          </Feld>
          <Feld label="E-Mail">
            <input className="a-input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Feld>
          <Feld label="Handy (optional)">
            <input className="a-input" type="tel" value={f.handy} onChange={(e) => setF({ ...f, handy: e.target.value })} />
          </Feld>
          <div className="sm:col-span-2">
            <span className="a-label">Themen</span>
            <Themen wert={f.themen} onChange={(themen) => setF({ ...f, themen })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Meldung text={fehler} />
            <button className="a-btn">Anlegen &amp; Link erzeugen</button>
          </div>
        </form>
      )}
      {csv && <CsvImport fertig={() => laden()} />}
      <input className="a-input mb-4 max-w-sm" placeholder="Suchen …" value={suche} onChange={(e) => setSuche(e.target.value)} aria-label="Kunden suchen" />
      <div className="a-karte overflow-x-auto p-0">
        <table className="a-tab min-w-[640px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Themen</th>
              <th className="text-right">Geteilt</th>
              <th className="text-right">Eingelöst</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {(daten ?? []).map((k) => (
              <tr key={k.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/admin/kunden/${k.id}`)}>
                <td>
                  <Link href={`/admin/kunden/${k.id}`} className="font-medium hover:underline">
                    {k.vorname} {k.nachname}
                  </Link>
                  <div className="text-xs text-slate-500">{k.email}</div>
                </td>
                <td className="text-xs">{k.themen.split(',').filter(Boolean).map((t) => THEMEN_LABEL[t] ?? t).join(', ')}</td>
                <td className="text-right tabular-nums">{k.geteilt}</td>
                <td className="text-right tabular-nums">{k.eingeloest}</td>
                <td className="text-xs">{k.link_aktiv ? (k.zuletzt_gesehen ? 'geöffnet' : 'aktiv') : 'widerrufen'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {daten && !daten.length && <p className="p-4 text-sm text-slate-500">Noch keine Kunden.</p>}
      </div>
    </Shell>
  );
}

function CsvImport({ fertig }: { fertig: () => void }) {
  const [text, setText] = useState('');
  const [vorschau, setVorschau] = useState<any>(null);
  const [meldung, setMeldung] = useState('');
  const datei = async (f: File | undefined) => {
    if (!f) return;
    const t = await f.text();
    setText(t);
    setVorschau(await anfrage('/api/admin/kunden/import', 'POST', { csv: t, vorschau: true }));
  };
  const importieren = async () => {
    const r = await anfrage('/api/admin/kunden/import', 'POST', { csv: text });
    if (r.error) return setMeldung(r.error);
    setMeldung(`${r.neu} neu angelegt, ${r.aktualisiert} aktualisiert${r.fehler?.length ? `, ${r.fehler.length} Zeilen übersprungen` : ''}.`);
    setVorschau(null);
    fertig();
  };
  return (
    <div className="a-karte mb-6 space-y-3">
      <p className="text-sm text-slate-600">
        CSV mit Kopfzeile, Trennzeichen „;“ oder „,“. Spalten: <code>Vorname</code>, <code>Nachname</code>, <code>E-Mail</code>, optional <code>Anrede</code> (Herr/Frau), <code>Ansprache</code> (Du/Sie), <code>Handy</code>, <code>Themen</code>,{' '}
        <code>Kundennummer</code> (ID aus dem CRM). Vorhandene Kunden (gleiche Kundennummer oder E-Mail) werden aktualisiert. Es wird nichts verschickt.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={(e) => datei(e.target.files?.[0])} />
      {vorschau && (
        <div className="space-y-2 text-sm">
          <p>
            <strong>{vorschau.anzahl}</strong> Kunden erkannt.
            {vorschau.fehler?.length > 0 && <> {vorschau.fehler.length} Zeilen mit Fehlern:</>}
          </p>
          {vorschau.fehler?.length > 0 && (
            <ul className="max-h-40 list-disc overflow-auto pl-5 text-red-700">
              {vorschau.fehler.map((f: any) => (
                <li key={f.zeile}>
                  Zeile {f.zeile}: {f.grund}
                </li>
              ))}
            </ul>
          )}
          {vorschau.anzahl > 0 && (
            <button className="a-btn" onClick={importieren}>
              {vorschau.anzahl} Kunden importieren
            </button>
          )}
        </div>
      )}
      <Meldung text={meldung} art="ok" />
    </div>
  );
}
