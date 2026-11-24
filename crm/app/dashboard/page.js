import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import { WHATSAPP } from '@/lib/config';

export default async function Dashboard() {
  const { user, profile, supabase } = await getSession();
  if (!user) redirect('/login');
  if (profile?.role === 'admin') redirect('/admin');
  if (profile?.status !== 'approved') redirect('/pending');
  const [{ count: pages }, { count: running }, { data: open }] = await Promise.all([
    supabase.from('facebook_pages').select('*', { count: 'exact', head: true }).eq('archived', false),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['running']),
    supabase.from('orders').select('total_bdt, paid_amount').not('status', 'in', '(off,cancelled)').neq('payment_status', 'paid'),
  ]);
  const due = (open || []).reduce((a, o) => a + Math.max(0, Number(o.total_bdt || 0) - Number(o.paid_amount || 0)), 0);
  return (
    <>
      <TopBar profile={profile} active="/dashboard" />
      <main className="wrap">
        <div className="card">
          <h1>আসসালামু আলাইকুম, {profile.full_name || 'গ্রাহক'} <StatusBadge status={profile.status} /></h1>
          <p className="muted">আপনার অর্ডার, পেমেন্ট আর হিসাব এখান থেকে দেখতে পারবেন।</p>
        </div>
        <div className="grid">
          <div className="stat"><span className="muted">চলমান অর্ডার</span><b>{(running || 0).toLocaleString('bn-BD')}</b></div>
          <div className="stat"><span className="muted">মোট বকেয়া</span><b>৳{due.toLocaleString('bn-BD')}</b></div>
          <div className="stat"><span className="muted">ওয়ালেট ব্যালেন্স</span><b>৳০</b></div>
          <div className="stat"><span className="muted">ফেসবুক পেজ</span><b>{(pages || 0).toLocaleString('bn-BD')}</b></div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h2>নতুন অর্ডার দিন</h2>
          <p className="muted">পোস্টের লিংক দিলেই পেজের নাম নিজে বসে যাবে। পেমেন্ট, ইনভয়েস আর লেজার পরের আপডেটে আসছে।</p>
          <Link className="btn" href="/orders/new">+ নতুন অর্ডার</Link>{' '}
          <Link className="btn ghost" href="/orders">আমার অর্ডার</Link>{' '}
          <a className="btn ghost" href={WHATSAPP} target="_blank" rel="noopener noreferrer">হোয়াটসঅ্যাপ</a>{' '}
          <Link className="btn ghost" href="/profile">প্রোফাইল ও পেজ</Link>
        </div>
      </main>
    </>
  );
}
