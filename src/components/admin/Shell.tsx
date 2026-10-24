'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Users, Gift, Inbox, MessageSquareText, Type, Settings, Heart, Mail, LogOut, Menu, X, BellRing, Sparkles } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Übersicht', icon: LayoutDashboard },
  { href: '/admin/anfragen', label: 'Anfragen', icon: Inbox },
  { href: '/admin/kunden', label: 'Kunden', icon: Users },
  { href: '/admin/erinnern', label: 'Erinnern', icon: BellRing },
  { href: '/admin/geschenke', label: 'Geschenke', icon: Gift },
  { href: '/admin/anlaesse', label: 'Anlässe', icon: Sparkles },
  { href: '/admin/vorlagen', label: 'Nachrichten', icon: MessageSquareText },
  { href: '/admin/dankeschoen', label: 'Dankeschön', icon: Heart },
  { href: '/admin/texte', label: 'Texte', icon: Type },
  { href: '/admin/einstellungen', label: 'Einstellungen', icon: Settings },
  { href: '/admin/postausgang', label: 'Postausgang', icon: Mail },
];

export default function Shell({ titel, children, aktion }: { titel: string; children: React.ReactNode; aktion?: React.ReactNode }) {
  const pfad = usePathname();
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const abmelden = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };
  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon: I }) => {
        const an = href === '/admin' ? pfad === href : pfad.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOffen(false)}
            className={`flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 text-sm font-medium ${an ? 'bg-marke-hell text-marke-dunkel' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <I size={17} aria-hidden /> {label}
          </Link>
        );
      })}
      <button onClick={abmelden} className="flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
        <LogOut size={17} aria-hidden /> Abmelden
      </button>
    </nav>
  );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold tracking-wide text-marke-dunkel">Geschenk-Empfehlung</span>
        <button aria-label="Menü" onClick={() => setOffen(!offen)} className="rounded-lg p-2 hover:bg-slate-100">
          {offen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {offen && <div className="border-b border-slate-200 bg-white p-3 lg:hidden">{nav}</div>}
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <p className="mb-6 px-3 text-sm font-bold tracking-wide text-marke-dunkel">Geschenk-Empfehlung</p>
          {nav}
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">{titel}</h1>
            {aktion}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
