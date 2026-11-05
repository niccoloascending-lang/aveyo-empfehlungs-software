// Fotos vor dem Hochladen im Browser verkleinern: scharf in der Anzeige, klein für Handys mit wenig Datenvolumen.
// Schlägt etwas fehl (alter Browser, ungewöhnliches Format), wird die Originaldatei hochgeladen.
import { verkleinerungsStufen, zielGroesse } from '@/lib/bildgroesse';

export async function verkleinereFoto(f: File, maxKante: number): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return f;
  let bild: ImageBitmap;
  try {
    bild = await createImageBitmap(f, { imageOrientation: 'from-image' });
  } catch {
    return f;
  }
  const ziel = zielGroesse(bild.width, bild.height, maxKante);
  if (!ziel.breite || (ziel.breite === bild.width && f.size < 600 * 1024)) {
    bild.close();
    return f;
  }
  let quelle: CanvasImageSource = bild;
  let canvas: HTMLCanvasElement | null = null;
  for (const s of verkleinerungsStufen(bild.width, bild.height, ziel)) {
    const c = document.createElement('canvas');
    c.width = s.breite;
    c.height = s.hoehe;
    const ctx = c.getContext('2d');
    if (!ctx) return f;
    ctx.fillStyle = '#ffffff'; // falls PNG mit Transparenz → JPEG
    ctx.fillRect(0, 0, s.breite, s.hoehe);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(quelle, 0, 0, s.breite, s.hoehe);
    quelle = c;
    canvas = c;
  }
  bild.close();
  const blob = await new Promise<Blob | null>((ok) => canvas!.toBlob(ok, 'image/jpeg', 0.86));
  if (!blob || blob.size >= f.size) return f;
  return new File([blob], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
}
