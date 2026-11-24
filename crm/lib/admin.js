import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';

export async function requireAdmin() {
  const s = await getSession();
  if (!s.user) redirect('/login');
  if (s.profile?.role !== 'admin') redirect('/');
  return s;
}
