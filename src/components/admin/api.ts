'use client';
import { useCallback, useEffect, useState } from 'react';

export async function anfrage<T = any>(url: string, method = 'GET', body?: unknown): Promise<T & { error?: string }> {
  const r = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && typeof window !== 'undefined') window.location.href = '/admin/login';
  const j = await r.json().catch(() => ({}));
  if (!r.ok && !j.error) j.error = `Fehler ${r.status}`;
  return j;
}

export function useDaten<T = any>(url: string | null) {
  const [daten, setDaten] = useState<T | null>(null);
  const [fehler, setFehler] = useState('');
  const laden = useCallback(async () => {
    if (!url) return;
    const j = await anfrage<T>(url);
    if ((j as any).error) setFehler((j as any).error);
    else setDaten(j);
  }, [url]);
  useEffect(() => {
    laden();
  }, [laden]);
  return { daten, fehler, laden, setDaten };
}

export async function hochladen(f: File): Promise<{ id?: number; error?: string }> {
  const fd = new FormData();
  fd.append('datei', f);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  return r.json().catch(() => ({ error: 'Upload fehlgeschlagen' }));
}

export const datum = (s: string | null | undefined) => {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
};

export async function kopiere(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Upload mit Fortschritt (für große Videos). */
export function hochladenMitFortschritt(f: File, fortschritt: (prozent: number) => void): Promise<{ id?: number; error?: string }> {
  return new Promise((ok) => {
    const fd = new FormData();
    fd.append('datei', f);
    const x = new XMLHttpRequest();
    x.open('POST', '/api/admin/upload');
    x.upload.onprogress = (e) => e.lengthComputable && fortschritt(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      try {
        ok(JSON.parse(x.responseText));
      } catch {
        ok({ error: `Upload fehlgeschlagen (${x.status})` });
      }
    };
    x.onerror = () => ok({ error: 'Upload fehlgeschlagen (Verbindung).' });
    x.send(fd);
  });
}
