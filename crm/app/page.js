import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';

export default async function Home() {
  const { user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile?.role === 'admin') redirect('/admin');
  if (profile?.status !== 'approved') redirect('/pending');
  redirect('/dashboard');
}
