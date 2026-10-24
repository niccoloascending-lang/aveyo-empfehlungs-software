import { bloecke } from '@/lib/texte';

/** Einfacher Textsatz für Rechtsseiten und Download-Inhalte. */
export default function Textsatz({ quelle }: { quelle: string }) {
  return (
    <div className="space-y-4 leading-relaxed">
      {bloecke(quelle).map((b, i) =>
        b.typ === 'h1' ? (
          <h1 key={i} className="text-3xl font-bold tracking-tight">
            {b.text}
          </h1>
        ) : b.typ === 'h2' ? (
          <h2 key={i} className="pt-2 text-xl font-semibold">
            {b.text}
          </h2>
        ) : b.typ === 'ul' ? (
          <ul key={i} className="list-disc space-y-1 pl-6">
            {b.punkte!.map((p, j) => (
              <li key={j}>{p}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}
