// HTTP-Range für Videos („bytes=0-1023“) – nötig, damit Safari/iPhone Videos abspielt und man vorspulen kann. Rein → testbar.

export type Bereich = { start: number; ende: number } | 'ungueltig' | null;

/** null = kein Range-Header (ganze Datei), 'ungueltig' = 416. Große offene Bereiche werden auf `maxStueck` begrenzt. */
export function parseRange(header: string | null | undefined, groesse: number, maxStueck = 2 * 1024 * 1024): Bereich {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '') || groesse <= 0) return 'ungueltig';
  let start: number;
  let ende: number;
  if (m[1] === '') {
    // Suffix: die letzten N Bytes
    const n = Number(m[2]);
    if (n <= 0) return 'ungueltig';
    start = Math.max(0, groesse - n);
    ende = groesse - 1;
  } else {
    start = Number(m[1]);
    ende = m[2] === '' ? Math.min(groesse - 1, start + maxStueck - 1) : Math.min(Number(m[2]), groesse - 1);
  }
  if (start > ende || start >= groesse) return 'ungueltig';
  return { start, ende };
}
