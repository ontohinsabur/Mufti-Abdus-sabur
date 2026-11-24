import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import WalletView from '@/components/WalletView';
import { WithdrawForm } from '@/components/PayForms';
import { bnNum } from '@/lib/format';

export default async function Wallet() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/wallet');
  const [{ data: sum }, { data: tx }, { data: requests }] = await Promise.all([
    supabase.rpc('customer_summary').single(),
    supabase.from('wallet_tx').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('wallet_requests').select('*').order('created_at', { ascending: false }).limit(50),
  ]);
  const pendingReq = (requests || []).filter((r) => r.status === 'pending').reduce((a, r) => a + Number(r.amount), 0);
  const bal = Number(sum?.wallet || 0);
  return (
    <>
      <TopBar profile={profile} active="/wallet" />
      <main className="wrap narrow">
        <h1>ওয়ালেট</h1>
        <div className="card center"><span className="muted">বর্তমান ব্যালেন্স</span><div style={{ fontSize: '2rem', fontWeight: 800 }}>৳{bnNum(bal)}</div>
          <p className="muted">এড আগে বন্ধ হলে অব্যবহৃত টাকা এখানে জমা হয়। পরের অর্ডারে এই টাকা দিয়ে পরিশোধ করতে পারবেন, অথবা তুলে নিতে পারবেন।</p></div>
        <div className="card"><h2>টাকা তুলুন</h2><WithdrawForm max={Math.max(0, bal - pendingReq)} /></div>
        <WalletView tx={tx} requests={requests} />
      </main>
    </>
  );
}
