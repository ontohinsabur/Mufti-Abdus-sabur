import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import { PaymentSettingsForm } from '@/components/AdminMoney';

export default async function Settings() {
  const { supabase, profile } = await requireAdmin();
  const [{ data: pay }, { data: rate }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'payment').maybeSingle(),
    supabase.from('settings').select('value').eq('key', 'usd_bdt_rate').maybeSingle(),
  ]);
  return (
    <>
      <TopBar profile={profile} active="/admin/settings" />
      <main className="wrap narrow"><h1>পেমেন্ট সেটিং</h1><p className="muted">যেগুলো চালু করবেন, গ্রাহক অর্ডার ও পেমেন্টের সময় শুধু সেগুলোই দেখবে।</p>
        <PaymentSettingsForm v={pay?.value} rate={rate?.value} /></main>
    </>
  );
}
