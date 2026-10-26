'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Mail, RefreshCw, Ban, Trash2, ExternalLink, QrCode, X, Gift } from 'lucide-react';
import Shell from '@/components/admin/Shell';
import { anfrage, useDaten, datum } from '@/components/admin/api';
import { AnredeFelder, Feld, KopierKnopf, Meldung, Themen } from '@/components/admin/ui';

const ART: Record<string, string> = { nachricht: 'Persönliche Danke-Nachricht', spende: 'Spende im Namen des Empfehlers', erlebnis: 'Gemeinsames Erlebnis', doppelt: 'Doppeltes Geschenk' };
const KANAL: Record<string, string> = { whatsapp: 'WhatsApp', signal: 'Signal', telegram: 'Telegram', email: 'E-Mail', kopieren: 'Kopiert', nativ: 'Andere App', qr: 'QR-Code' };

const waNummer = (h: string | null) => {
  if (!h) return '';
  let n = h.replace(/[^\d+]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  if (n.startsWith('0')) n = '+49' + n.slice(1);
  return n.replace('+', '');
};

export default function KundeDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { daten: d, laden, fehler } = useDaten<any>(`/api/admin/kunden/${params.id}`);
  const beraterListe = useDaten<{ id: number; name: string; email: string }[]>('/api/admin/berater');
  const [f, setF] = useState<any>(null);
  const [meldung, setMeldung] = useState({ text: '', art: 'ok' as 'ok' | 'fehler' });
  const [danke, setDanke] = useState({ art: 'nachricht', text: '' });
  const [termin, setTermin] = useState(false);

  useEffect(() => {
    if (d) {
      setF({ ...d.kunde });
      setDanke((x) => ({ ...x, text: x.text || d.dankeVorlage }));
    }
  }, [d]);

  if (!d || !f)
    return (
      <Shell titel="Kunde">
        <Meldung text={fehler} />
      </Shell>
    );

  const speichern = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await anfrage(`/api/admin/kunden/${params.id}`, 'PUT', f);
    setMeldung(r.error ? { text: r.error, art: 'fehler' } : { text: 'Gespeichert.', art: 'ok' });
    laden();
  };
  const link = async (aktion: 'neu' | 'widerrufen') => {
    if (!confirm(aktion === 'neu' ? 'Neuen Link erzeugen? Der bisherige Link funktioniert dann nicht mehr.' : 'Link widerrufen? Der Kunde kommt dann nicht mehr in seinen Bereich.')) return;
    await anfrage(`/api/admin/kunden/${params.id}/link`, 'POST', { aktion });
    laden();
  };
  const loeschen = async () => {
    if (!confirm('Kunde endgültig löschen (DSGVO)? Seine Zitate werden entfernt, Anfragen von Freunden bleiben ohne Bezug zu ihm erhalten.')) return;
    await anfrage(`/api/admin/kunden/${params.id}`, 'DELETE');
    router.push('/admin/kunden');
  };
  const dankeAusloesen = async () => {
    const r = await anfrage('/api/admin/dankeschoen', 'POST', { kundeId: Number(params.id), art: danke.art, text: danke.text });
    setMeldung(r.error ? { text: r.error, art: 'fehler' } : { text: 'Dankeschön angelegt. Bitte die Nachricht selbst verschicken.', art: 'ok' });
    laden();
  };
  const erledigt = async (id: number) => {
    await anfrage(`/api/admin/dankeschoen/${id}`, 'PUT', { status: 'erledigt' });
    laden();
  };

  const k = d.kunde;
  const wa = waNummer(k.handy);
  const aktiveArten = Object.entries(d.belohnungen).filter(([, an]) => an).map(([a]) => a);

  return (
    <Shell titel={`${k.vorname} ${k.nachname}`.trim()}>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <section className="a-karte space-y-3">
            <h2 className="font-semibold">Persönlicher Einladungslink</h2>
            {d.link ? (
              <>
                <button className="a-btn w-full justify-center py-3 text-base" onClick={() => setTermin(true)}>
                  <QrCode size={18} /> Jetzt im Termin teilen (QR-Code zeigen)
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-slate-100 px-2 py-1.5 text-xs">{d.link}</code>
                  <KopierKnopf text={d.link} label="Link kopieren" />
                  <a className="a-btn2" href={d.link} target="_blank" rel="noopener noreferrer" title="Als Kunde ansehen">
                    <ExternalLink size={15} />
                  </a>
                </div>
                <Feld label="Nachricht an den Kunden (Kopieren & selbst schicken)">
                  <textarea className="a-input" rows={4} readOnly value={d.einladung} />
                </Feld>
                <div className="flex flex-wrap gap-2">
                  <KopierKnopf text={d.einladung} label="Text kopieren" />
                  <a className="a-btn2" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent(d.einladung)}`}>
                    <MessageCircle size={15} /> WhatsApp{wa ? '' : ' (Kontakt wählen)'}
                  </a>
                  {k.email && (
                    <a className="a-btn2" href={`mailto:${k.email}?subject=${encodeURIComponent(d.einladungBetreff)}&body=${encodeURIComponent(d.einladung)}`}>
                      <Mail size={15} /> E-Mail-Programm
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-500">Die App verschickt nichts selbst. WhatsApp und E-Mail öffnen sich auf deinem Gerät.</p>
              </>
            ) : (
              <Meldung art="info" text="Kein gültiger Link (widerrufen oder abgelaufen)." />
            )}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button className="a-btn2" onClick={() => link('neu')}>
                <RefreshCw size={15} /> Neuen Link erzeugen
              </button>
              {d.link && (
                <button className="a-btn2" onClick={() => link('widerrufen')}>
                  <Ban size={15} /> Widerrufen
                </button>
              )}
            </div>
          </section>

          {d.kontingent.gesamt != null && (
            <section className="a-karte flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm">
                <Gift size={16} /> Geschenke: <strong>{d.kontingent.rest}</strong> von {d.kontingent.gesamt} übrig (letzte 12 Monate)
              </p>
              <button
                className="a-btn2"
                onClick={async () => {
                  await anfrage(`/api/admin/kunden/${params.id}/kontingent`, 'POST', { mehr: 3 });
                  laden();
                }}
              >
                +3 freischalten
              </button>
            </section>
          )}

          {d.erinnerung && (
            <details className="a-karte">
              <summary className="cursor-pointer font-semibold">Freundliche Erinnerung schicken</summary>
              <textarea className="a-input mt-3" rows={4} readOnly value={d.erinnerung} aria-label="Erinnerungstext" />
              <div className="mt-2 flex flex-wrap gap-2">
                <KopierKnopf text={d.erinnerung} label="Text kopieren" />
                <a className="a-btn2" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent(d.erinnerung)}`}>
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            </details>
          )}

          <section className="a-karte">
            <h2 className="mb-3 font-semibold">Wirkung</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Geteilt', d.wirkung.verschenkt],
                ['Geöffnet', d.wirkung.geoeffnet],
                ['Eingelöst', d.wirkung.eingeloest],
              ].map(([l, n]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-2">
                  <p className="text-xl font-bold">{n}</p>
                  <p className="text-xs text-slate-600">{l}</p>
                </div>
              ))}
            </div>
            {d.teilungen.length > 0 && (
              <table className="a-tab mt-4">
                <thead>
                  <tr>
                    <th>Geteilt am</th>
                    <th>Geschenk</th>
                    <th>Kanal</th>
                    <th className="text-right">Geöffnet</th>
                  </tr>
                </thead>
                <tbody>
                  {d.teilungen.map((t: any) => (
                    <tr key={t.code}>
                      <td className="whitespace-nowrap text-xs">{datum(t.geteilt_am)}</td>
                      <td>
                        {t.geschenk}
                        {t.zitat && <div className="text-xs italic text-slate-500">„{t.zitat}“</div>}
                      </td>
                      <td className="text-xs">{KANAL[t.kanal] ?? t.kanal}</td>
                      <td className="text-right">{t.geoeffnet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="a-karte space-y-3">
            <h2 className="font-semibold">Dankeschön</h2>
            <p className="text-xs text-slate-500">Eine Überraschung danach, nie ein Versprechen vorher. Versand der Nachricht manuell.</p>
            <div className="flex flex-wrap gap-2">
              {aktiveArten.map((a) => (
                <button key={a} type="button" onClick={() => setDanke({ ...danke, art: a })} className={`rounded-full border px-3 py-1.5 text-sm ${danke.art === a ? 'border-marke bg-marke-hell' : 'border-slate-300'}`}>
                  {ART[a]}
                </button>
              ))}
            </div>
            <textarea className="a-input" rows={5} value={danke.text} onChange={(e) => setDanke({ ...danke, text: e.target.value })} aria-label="Danke-Nachricht" />
            <div className="flex flex-wrap gap-2">
              <button className="a-btn" onClick={dankeAusloesen} disabled={!aktiveArten.includes(danke.art)}>
                Dankeschön auslösen
              </button>
              <KopierKnopf text={danke.text} label="Text kopieren" />
              <a className="a-btn2" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${encodeURIComponent(danke.text)}`}>
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
            {d.dankeschoens.length > 0 && (
              <ul className="divide-y divide-slate-100 text-sm">
                {d.dankeschoens.map((x: any) => (
                  <li key={x.id} className="flex items-center justify-between gap-2 py-2">
                    <span>
                      {ART[x.art]} · {datum(x.erstellt)}
                      {x.spende_zweck && <span className="text-slate-500"> · Zweck: {x.spende_zweck}</span>}
                    </span>
                    {x.status === 'offen' ? (
                      <button className="a-btn2" onClick={() => erledigt(x.id)}>
                        Erledigt
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700">✓ erledigt</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <form onSubmit={speichern} className="a-karte h-fit space-y-3">
          <h2 className="font-semibold">Stammdaten</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Feld label="Zuständiger Berater" hinweis="Sein Foto und seine Vorstellung erscheinen auf den Seiten der Freunde dieses Kunden." className="sm:col-span-2">
              <select className="a-input" value={f.berater_id ?? ''} onChange={(e) => setF({ ...f, berater_id: Number(e.target.value) })}>
                {!f.berater_id && <option value="">– bitte wählen –</option>}
                {(beraterListe.daten ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.email})
                  </option>
                ))}
              </select>
            </Feld>
            <AnredeFelder anrede={f.anrede ?? ''} ansprache={f.ansprache ?? ''} onChange={(v) => setF({ ...f, ...v })} />
            <Feld label="Dankeschön-Gruppe (A/B-Test)" hinweis="Wird zufällig vergeben. Nur ändern, wenn nötig – sonst verfälscht es den Test." className="sm:col-span-2">
              <select className="a-input" value={f.belohnung_variante || d.variante} onChange={(e) => setF({ ...f, belohnung_variante: e.target.value })}>
                <option value="A">A · Spende für einen guten Zweck{d.zusagen.spenden ? ` (bisher ${d.zusagen.spendeSumme} €${f.spendenzweck ? `, ${f.spendenzweck}` : ''})` : ''}</option>
                <option value="B">B · Gutschein für den Kunden{d.zusagen.praemien ? ` (bisher ${d.zusagen.praemieSumme} €)` : ''}</option>
              </select>
            </Feld>
            <Feld label="Vorname">
              <input className="a-input" value={f.vorname ?? ''} onChange={(e) => setF({ ...f, vorname: e.target.value })} />
            </Feld>
            <Feld label="Nachname">
              <input className="a-input" value={f.nachname ?? ''} onChange={(e) => setF({ ...f, nachname: e.target.value })} />
            </Feld>
            <Feld label="E-Mail">
              <input className="a-input" type="email" value={f.email ?? ''} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </Feld>
            <Feld label="Handy">
              <input className="a-input" type="tel" value={f.handy ?? ''} onChange={(e) => setF({ ...f, handy: e.target.value })} />
            </Feld>
          </div>
          <div>
            <span className="a-label">Themen</span>
            <Themen wert={f.themen ?? ''} onChange={(themen) => setF({ ...f, themen })} />
          </div>
          <Feld
            label="Erfolg als Satz-Vorschlag (optional)"
            hinweis="Nur echte Zahlen aus eurer Beratung, aus Sicht des Kunden, z. B. „Ich spare jetzt 840 € im Jahr“. Der Kunde sieht ihn als ersten Vorschlag für seinen Satz."
          >
            <input className="a-input" maxLength={160} value={f.zitat_vorschlag ?? ''} onChange={(e) => setF({ ...f, zitat_vorschlag: e.target.value })} />
          </Feld>
          <Feld label="Interne Notiz">
            <textarea className="a-input" rows={3} value={f.notiz ?? ''} onChange={(e) => setF({ ...f, notiz: e.target.value })} />
          </Feld>
          {k.extern_id && <p className="text-xs text-slate-500">CRM-ID: {k.extern_id}</p>}
          <Meldung text={meldung.text} art={meldung.art} />
          <div className="flex flex-wrap justify-between gap-2">
            <button className="a-btn">Speichern</button>
            <button type="button" className="a-btn2 text-red-700" onClick={loeschen}>
              <Trash2 size={15} /> Kunde löschen
            </button>
          </div>
        </form>
      </div>
      {termin && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6 text-center">
          <button className="a-btn2 absolute right-4 top-4" onClick={() => setTermin(false)} autoFocus>
            <X size={16} /> Schließen
          </button>
          <p className="text-2xl font-bold text-marke-dunkel">{d.terminQr.titel}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/admin/kunden/${params.id}/qr`} alt="QR-Code zum Geschenke-Bereich" className="h-[min(60vh,420px)] w-[min(60vh,420px)]" />
          <p className="max-w-md text-slate-600">{d.terminQr.text}</p>
        </div>
      )}
    </Shell>
  );
}
