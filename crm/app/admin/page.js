import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';

const n = (x) => (x || 0).toLocaleString('bn-BD');

export default async function AdminHome() {
  const { supabase, profile } = await requireAdmin();
  const count = async (status) => (await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').eq('status', status)).count;
  const [approved, pending, rejected] = await Promise.all([count('approved'), count('pending'), count('rejected')]);
  return (
    <>
      <TopBar profile={profile} active="/admin" />
      <main className="wrap">
        <div className="card"><h1>অ্যাডমিন ড্যাশবোর্ড</h1><p className="muted">আসসালামু আলাইকুম, {profile.full_name || 'অ্যাডমিন'}।</p></div>
        {pending > 0 && <div className="alert warn">{n(pending)} জন নতুন গ্রাহক অনুমোদনের অপেক্ষায় আছেন। <Link href="/admin/customers?status=pending">এখনই দেখুন →</Link></div>}
        <div className="grid">
          <Link href="/admin/customers?status=approved" className="stat"><span className="muted">অনুমোদিত গ্রাহক</span><b>{n(approved)}</b></Link>
          <Link href="/admin/customers?status=pending" className="stat"><span className="muted">অপেক্ষমাণ</span><b>{n(pending)}</b></Link>
          <Link href="/admin/customers?status=rejected" className="stat"><span className="muted">বাতিল</span><b>{n(rejected)}</b></Link>
          <div className="stat"><span className="muted">চলমান অর্ডার</span><b>—</b><span className="muted">পরের ধাপে</span></div>
        </div>
      </main>
    </>
  );
}
