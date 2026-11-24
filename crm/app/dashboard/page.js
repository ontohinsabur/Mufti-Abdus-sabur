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
  const { count: pages } = await supabase.from('facebook_pages').select('*', { count: 'exact', head: true }).eq('archived', false);
  return (
    <>
      <TopBar profile={profile} active="/dashboard" />
      <main className="wrap">
        <div className="card">
          <h1>আসসালামু আলাইকুম, {profile.full_name || 'গ্রাহক'} <StatusBadge status={profile.status} /></h1>
          <p className="muted">আপনার অর্ডার, পেমেন্ট আর হিসাব এখান থেকে দেখতে পারবেন।</p>
        </div>
        <div className="grid">
          <div className="stat"><span className="muted">চলমান অর্ডার</span><b>০</b></div>
          <div className="stat"><span className="muted">মোট বকেয়া</span><b>৳০</b></div>
          <div className="stat"><span className="muted">ওয়ালেট ব্যালেন্স</span><b>৳০</b></div>
          <div className="stat"><span className="muted">ফেসবুক পেজ</span><b>{(pages || 0).toLocaleString('bn-BD')}</b></div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <h2>শীঘ্রই আসছে</h2>
          <p className="muted">অর্ডার দেওয়া, পেমেন্ট, ইনভয়েস আর লেজার পরের ধাপে যোগ হবে। এখন অর্ডার দিতে হোয়াটসঅ্যাপে মেসেজ দিন।</p>
          <a className="btn" href={WHATSAPP} target="_blank" rel="noopener noreferrer">হোয়াটসঅ্যাপে অর্ডার দিন</a>{' '}
          <Link className="btn ghost" href="/profile">প্রোফাইল ও পেজ</Link>
        </div>
      </main>
    </>
  );
}
