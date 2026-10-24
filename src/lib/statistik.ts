// Dashboard-Kennzahlen und Conversion je Geschenk / Nachrichtenvorlage. Rein → testbar.

export type StatTeilung = { id: number; kunde_id: number | null; geschenk_id: number; vorlage_id: number | null; geteilt_am: string | null; kanal: string | null; anlass_id?: number | null };
export type StatEreignis = { teilung_id: number | null; typ: string };
export type StatAnfrage = { teilung_id: number | null; typ: string; status: string; bestaetigt: string | null };

export type Zeile = { id: number | string; name: string; geteilt: number; geoeffnet: number; eingeloest: number; termine: number; quote: number };

export type Kennzahlen = {
  kundenEingeladen: number;
  kundenGeteilt: number;
  geteilt: number;
  geoeffnet: number;
  eingeloest: number;
  termine: number;
  kunden: number; // Status „Kunde“
  proGeschenk: Zeile[];
  proVorlage: Zeile[];
  proKanal: Zeile[];
  proAnlass: Zeile[];
};

const EINLOESUNG = new Set(['download', 'rechner', 'termin_bestaetigt', 'auswertung_bestaetigt', 'download_mail_bestaetigt']);

/** Quote = Einlösungen je geteiltem Link (in %, eine Nachkommastelle). */
export const quote = (eingeloest: number, geteilt: number) => (geteilt > 0 ? Math.round((eingeloest / geteilt) * 1000) / 10 : 0);

export function kennzahlen(
  kundenEingeladen: number,
  teilungen: StatTeilung[],
  ereignisse: StatEreignis[],
  anfragen: StatAnfrage[],
  geschenkNamen: Map<number, string>,
  vorlagenNamen: Map<number, string>,
  anlassNamen: Map<number, string> = new Map(),
): Kennzahlen {
  const geteilte = teilungen.filter((t) => t.geteilt_am);
  const byT = new Map(teilungen.map((t) => [t.id, t]));
  const termineBestaetigt = anfragen.filter((a) => a.typ === 'termin' && a.bestaetigt);

  const gruppe = (schluessel: (t: StatTeilung) => number | string | null, name: (k: number | string) => string): Zeile[] => {
    const m = new Map<number | string, Zeile>();
    const z = (k: number | string) => {
      if (!m.has(k)) m.set(k, { id: k, name: name(k), geteilt: 0, geoeffnet: 0, eingeloest: 0, termine: 0, quote: 0 });
      return m.get(k)!;
    };
    for (const t of geteilte) {
      const k = schluessel(t);
      if (k != null) z(k).geteilt++;
    }
    for (const e of ereignisse) {
      const t = e.teilung_id != null ? byT.get(e.teilung_id) : undefined;
      const k = t ? schluessel(t) : null;
      if (k == null) continue;
      if (e.typ === 'geoeffnet') z(k).geoeffnet++;
      if (EINLOESUNG.has(e.typ)) z(k).eingeloest++;
    }
    for (const a of termineBestaetigt) {
      const t = a.teilung_id != null ? byT.get(a.teilung_id) : undefined;
      const k = t ? schluessel(t) : null;
      if (k != null) z(k).termine++;
    }
    return [...m.values()].map((r) => ({ ...r, quote: quote(r.eingeloest, r.geteilt) })).sort((a, b) => b.quote - a.quote || b.geteilt - a.geteilt);
  };

  return {
    kundenEingeladen,
    kundenGeteilt: new Set(geteilte.map((t) => t.kunde_id).filter((k) => k != null)).size,
    geteilt: geteilte.length,
    geoeffnet: ereignisse.filter((e) => e.typ === 'geoeffnet').length,
    eingeloest: ereignisse.filter((e) => EINLOESUNG.has(e.typ)).length,
    termine: termineBestaetigt.length,
    kunden: anfragen.filter((a) => a.status === 'kunde').length,
    proGeschenk: gruppe((t) => t.geschenk_id, (k) => geschenkNamen.get(Number(k)) ?? `Geschenk ${k}`),
    proVorlage: gruppe((t) => t.vorlage_id, (k) => vorlagenNamen.get(Number(k)) ?? `Vorlage ${k}`),
    proKanal: gruppe((t) => t.kanal, (k) => String(k)),
    proAnlass: gruppe((t) => t.anlass_id ?? null, (k) => anlassNamen.get(Number(k)) ?? `Anlass ${k}`),
  };
}
