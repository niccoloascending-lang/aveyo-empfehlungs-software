/**
 * Geschenk zum Auspacken (reines CSS, keine Bibliothek): Schleife geht auf, Band fällt, Deckel rutscht herunter,
 * dann kommt das Symbol heraus. Grundzustand = Endbild, die Animation läuft „rückwärts gefüllt“ hinein –
 * bei „Bewegung reduzieren“ sieht man so direkt das ausgepackte Geschenk.
 */
export default function GeschenkBox({ icon }: { icon: string }) {
  return (
    <div aria-hidden className="gb">
      <div className="gb-wackeln">
        <span className="gb-symbol">{icon || '🎁'}</span>
        <div className="gb-kiste">
          <div className="gb-oeffnung" />
          <div className="gb-band-senkrecht" />
        </div>
        <div className="gb-deckel">
          <div className="gb-deckel-band" />
          <span className="gb-schlaufe gb-schlaufe-l" />
          <span className="gb-schlaufe gb-schlaufe-r" />
          <span className="gb-ende gb-ende-l" />
          <span className="gb-ende gb-ende-r" />
          <span className="gb-knoten" />
        </div>
      </div>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <span key={i} className={`gb-funke gb-funke-${i}`} />
      ))}
    </div>
  );
}
