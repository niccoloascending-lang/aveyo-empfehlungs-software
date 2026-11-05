// Zielgröße beim Verkleinern von Fotos vor dem Hochladen. Rein → testbar.

/** Längste Kante auf `maxKante` begrenzen, Seitenverhältnis halten, nie vergrößern. */
export function zielGroesse(breite: number, hoehe: number, maxKante: number): { breite: number; hoehe: number } {
  if (!(breite > 0 && hoehe > 0 && maxKante > 0)) return { breite: 0, hoehe: 0 };
  const f = Math.min(1, maxKante / Math.max(breite, hoehe));
  return { breite: Math.max(1, Math.round(breite * f)), hoehe: Math.max(1, Math.round(hoehe * f)) };
}

/**
 * Zwischenschritte beim Verkleinern: jeweils höchstens auf die Hälfte. Ein einziger großer Schritt (z. B. 2400 → 300)
 * sieht im Browser pixelig aus; halbierend bleibt es scharf.
 */
export function verkleinerungsStufen(breite: number, hoehe: number, ziel: { breite: number; hoehe: number }): { breite: number; hoehe: number }[] {
  const stufen: { breite: number; hoehe: number }[] = [];
  let b = breite;
  let h = hoehe;
  while (b / 2 > ziel.breite && h / 2 > ziel.hoehe) {
    b = Math.round(b / 2);
    h = Math.round(h / 2);
    stufen.push({ breite: b, hoehe: h });
  }
  stufen.push(ziel);
  return stufen;
}
