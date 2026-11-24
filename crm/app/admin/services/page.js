import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import { ServiceForm, AccessForm } from './forms';

export default async function Services() {
  const { supabase, profile } = await requireAdmin();
  const [{ data: services }, { data: acc }] = await Promise.all([
    supabase.from('services').select('*').order('sort'),
    supabase.from('settings').select('value').eq('key', 'access_id').maybeSingle(),
  ]);
  return (
    <>
      <TopBar profile={profile} active="/admin/services" />
      <main className="wrap narrow">
        <h1>সেবা ও রেট</h1>
        <p className="muted">এখানের রেট সবার জন্য। কোনো গ্রাহকের জন্য আলাদা রেট দিতে গ্রাহকের পেজে যান।</p>
        <AccessForm v={acc?.value} />
        {(services || []).map((s) => <ServiceForm key={s.id} s={s} />)}
      </main>
    </>
  );
}
