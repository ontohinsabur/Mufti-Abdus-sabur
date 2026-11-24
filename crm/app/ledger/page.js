import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import LedgerView from '@/components/LedgerView';
import { buildLedger } from '@/lib/money';

export default async function Ledger() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/customers');
  const ledger = await buildLedger(supabase, user.id);
  return (
    <>
      <TopBar profile={profile} active="/ledger" />
      <main className="wrap"><h1>আমার হিসাব (লেজার)</h1><LedgerView ledger={ledger} orderBase="/orders" /></main>
    </>
  );
}
