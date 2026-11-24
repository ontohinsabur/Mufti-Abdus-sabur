import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';

const n = (x) => (x || 0).toLocaleString('bn-BD');

export default async function AdminHome() {
  const { supabase, profile } = await requireAdmin();
  const count = async (status) => (await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').eq('status', status)).count;
  const oc = async (st) => (await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', st)).count;
  const [approved, pending, rejected, newOrders, running, { count: toVerify }, { count: wreq }] = await Promise.all([count('approved'), count('pending'), count('rejected'), oc(['pending']), oc(['running']),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('wallet_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')]);
  return (
    <>
      <TopBar profile={profile} active="/admin" />
      <main className="wrap">
        <div className="card"><h1>অ্যাডমিন ড্যাশবোর্ড</h1><p className="muted">আসসালামু আলাইকুম, {profile.full_name || 'অ্যাডমিন'}।</p></div>
        {toVerify > 0 && <div className="alert warn">{n(toVerify)}টি পেমেন্ট যাচাইয়ের অপেক্ষায়। <Link href="/admin/payments">যাচাই করুন →</Link></div>}
        {wreq > 0 && <div className="alert warn">{n(wreq)}টি টাকা তোলার অনুরোধ আছে। <Link href="/admin/wallet">দেখুন →</Link></div>}
        {newOrders > 0 && <div className="alert warn">{n(newOrders)}টি নতুন অর্ডার অপেক্ষায় আছে। <Link href="/admin/orders?status=pending">দেখুন →</Link></div>}
        {pending > 0 && <div className="alert warn">{n(pending)} জন নতুন গ্রাহক অনুমোদনের অপেক্ষায় আছেন। <Link href="/admin/customers?status=pending">এখনই দেখুন →</Link></div>}
        <div className="grid">
          <Link href="/admin/customers?status=approved" className="stat"><span className="muted">অনুমোদিত গ্রাহক</span><b>{n(approved)}</b></Link>
          <Link href="/admin/customers?status=pending" className="stat"><span className="muted">অপেক্ষমাণ</span><b>{n(pending)}</b></Link>
          <Link href="/admin/customers?status=rejected" className="stat"><span className="muted">বাতিল</span><b>{n(rejected)}</b></Link>
          <Link href="/admin/orders?status=pending" className="stat"><span className="muted">নতুন অর্ডার</span><b>{n(newOrders)}</b></Link>
          <Link href="/admin/payments?tab=due" className="stat"><span className="muted">বকেয়া দেখুন</span><b>৳</b></Link>
          <Link href="/admin/orders?status=running" className="stat"><span className="muted">এড রানিং</span><b>{n(running)}</b></Link>
        </div>
      </main>
    </>
  );
}
