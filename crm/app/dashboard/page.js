import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import Tile from '@/components/Tile';
import OrderCard from '@/components/OrderCard';
import { WHATSAPP } from '@/lib/config';
import VerifiedBadge from '@/components/VerifiedBadge';

const n = (x) => (x || 0).toLocaleString('bn-BD');
const tk = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default async function Dashboard() {
  const { user, profile, supabase } = await getSession();
  if (!user) redirect('/login');
  if (profile?.role === 'admin') redirect('/admin');
  if (profile?.status !== 'approved') redirect('/pending');
  const [{ count: pages }, { count: running }, { data: sum }, { data: notices }, { data: recent }] = await Promise.all([
    supabase.from('facebook_pages').select('*', { count: 'exact', head: true }).eq('archived', false),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'running'),
    supabase.rpc('customer_summary').single(),
    supabase.from('notices').select('*').eq('active', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(4),
  ]);
  const due = Number(sum?.due || 0); const wallet = Number(sum?.wallet || 0);
  const date = new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });
  const TILES = [
    ['/orders/new', 'নতুন অর্ডার', 'plus', 'blue', true],
    ['/orders', 'আমার অর্ডার', 'orders', 'navy'],
    ['/payments', due > 0 ? 'বকেয়া পরিশোধ' : 'পেমেন্ট', 'pay', 'green'],
    ['/ledger', 'হিসাবের খাতা', 'book', 'teal'],
    ['/wallet', 'ব্যালেন্স', 'wallet', 'violet'],
    ['/support', 'সাপোর্ট', 'chat', 'rose'],
    ['/notifications', 'নোটিফিকেশন', 'bell', 'amber'],
    ['/profile', 'প্রোফাইল ও পেজ', 'user', 'slate'],
  ];
  return (
    <>
      <TopBar profile={profile} active="/dashboard" />
      <main className="wrap">
        <section className="hero">
          <div className="hero-txt">
            <h1>আসসালামু আলাইকুম, {profile.full_name || 'গ্রাহক'}<VerifiedBadge profile={profile} size={22} /></h1>
            <p>{date}</p>
          </div>
          <div className="hero-chips">
            <Link href="/orders?status=running"><span>🟢 এড চলছে</span><b>{n(running)}</b></Link>
            <Link href="/payments" className={due > 0 ? 'warn' : ''}><span>🧾 মোট বকেয়া</span><b>{tk(due)}</b></Link>
            <Link href="/wallet"><span>💰 ব্যালেন্স</span><b>{tk(wallet)}</b></Link>
            <Link href="/profile" className="pc-only"><span>📄 ফেসবুক পেজ</span><b>{n(pages)}</b></Link>
            {sum?.pay_later_enabled && <Link href="/payments" className="pc-only"><span>⏱ বাকির সীমা বাকি</span><b>{tk(sum.available_credit)}</b></Link>}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="pc-only"><span>💬 হোয়াটসঅ্যাপ</span><b>যোগাযোগ</b></a>
          </div>
        </section>

        {(notices || []).map((x) => <div key={x.id} className="card notice"><b>📢 {x.title}</b><p style={{ whiteSpace: 'pre-line', margin: '6px 0 0' }}>{x.body}</p></div>)}
        {due > 0 && <div className="alert warn">আপনার {tk(due)} বকেয়া আছে। <Link href="/payments">এখনই পরিশোধ করুন →</Link></div>}

        <h3 className="sec-h">দ্রুত কাজ</h3>
        <div className="tiles">{TILES.map(([h, l, i, t, s]) => <Tile key={h} href={h} label={l} icon={i} tone={t} solid={s} />)}</div>

        <section className="panel">
          <div className="panel-h"><h2>সাম্প্রতিক অর্ডার</h2><Link href="/orders">সব দেখুন</Link></div>
          {(recent || []).length === 0 ? <p className="panel-empty">এখনো কোনো অর্ডার নেই। <Link href="/orders/new">প্রথম অর্ডার দিন →</Link></p>
            : <div className="oc-grid">{recent.map((o) => <OrderCard key={o.id} o={o} admin={false} />)}</div>}
        </section>
      </main>
    </>
  );
}
