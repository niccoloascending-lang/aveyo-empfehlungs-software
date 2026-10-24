import { redirect } from 'next/navigation';

// Die Startseite ist nicht öffentlich: Kunden und Freunde kommen über ihre persönlichen Links.
export default function Start() {
  redirect('/admin');
}
