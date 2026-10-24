// Hintergrundaufgaben innerhalb der laufenden App: Löschkonzept und CRM-Webhook-Zustellung.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { starteHintergrund } = await import('./lib/hintergrund.ts');
    starteHintergrund();
  }
}
