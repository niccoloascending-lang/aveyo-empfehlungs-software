import { NextResponse } from 'next/server';
import { COOKIE, cookieOptionen } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', cookieOptionen(0));
  return res;
}
