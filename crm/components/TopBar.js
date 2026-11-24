import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function TopBar({ profile, active }) {
  const admin = profile?.role === 'admin';
  const links = admin
    ? [['/admin', 'ড্যাশবোর্ড'], ['/admin/orders', 'অর্ডার'], ['/admin/payments', 'পেমেন্ট'], ['/admin/customers', 'গ্রাহক'], ['/admin/support', 'সাপোর্ট'], ['/admin/wallet', 'ওয়ালেট'], ['/admin/reports', 'রিপোর্ট'], ['/admin/services', 'সেবা ও রেট'], ['/admin/notices', 'নোটিশ'], ['/admin/settings', 'সেটিং']]
    : [['/dashboard', 'ড্যাশবোর্ড'], ['/orders', 'অর্ডার'], ['/payments', 'পেমেন্ট'], ['/ledger', 'হিসাব'], ['/wallet', 'ওয়ালেট'], ['/support', 'সাপোর্ট'], ['/profile', 'প্রোফাইল']];
  let unread = 0;
  if (profile?.id) {
    const supabase = await createClient();
    unread = (await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).is('read_at', null)).count || 0;
  }
  return (
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark">M</span><span>Mufti Abdus Sabur</span></Link>
      <nav className="nav">
        {links.map(([href, label]) => <Link key={href} href={href} className={active === href ? 'active' : ''}>{label}</Link>)}
        <Link href="/notifications" className={active === '/notifications' ? 'active' : ''} aria-label="নোটিফিকেশন">🔔{unread > 0 && <span className="dot">{unread > 99 ? '99+' : unread.toLocaleString('bn-BD')}</span>}</Link>
        <form action="/auth/signout" method="post" style={{ display: 'inline' }}>
          <button className="btn sm ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>লগআউট</button>
        </form>
      </nav>
    </header>
  );
}
