'use client';
import { Printer } from 'lucide-react';

export default function DruckKnopf({ text }: { text: string }) {
  return (
    <button type="button" className="knopf-haupt w-full" onClick={() => window.print()}>
      <Printer size={18} aria-hidden /> {text}
    </button>
  );
}
