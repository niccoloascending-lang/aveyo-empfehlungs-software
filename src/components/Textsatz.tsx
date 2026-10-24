import { bloecke } from '@/lib/texte';

const mitLinks = (text: string) =>
  text.split(/(https:\/\/[^\s)]+)/g).map((teil, i) =>
    teil.startsWith('https://') ? (
      <a key={i} href={teil} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
        {teil}
      </a>
    ) : (
      teil
    ),
  );

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
              <li key={j}>{mitLinks(p)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {mitLinks(b.text!)}
          </p>
        ),
      )}
    </div>
  );
}
