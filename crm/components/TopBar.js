import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';

// App shell in the old MAS CRM style: left sidebar, top actions, mobile bottom bar.
const ADMIN = [
  ['/admin', 'হোম', 'home'], ['/admin/orders/new', 'নতুন অর্ডার', 'plus'], ['/admin/orders', 'অর্ডার', 'orders'],
  ['/admin/payments', 'পেমেন্ট', 'pay'], ['/admin/customers', 'কাস্টমার', 'users'], ['/admin/services#access', 'এক্সেস আইডি', 'key'],
  ['/admin/invoices', 'ইনভয়েস', 'invoice'], ['/admin/payments?tab=due', 'বাকি (Pay Later)', 'clock'], ['/admin/reports', 'রিপোর্ট', 'chart'],
  ['/admin/wallet', 'ব্যালেন্স ও ফেরত', 'wallet'], ['/admin/support', 'সাপোর্ট', 'chat'], ['/notifications', 'নোটিফিকেশন', 'bell'],
  ['/admin/services', 'সার্ভিস ও দাম', 'tag'], ['/admin/notices', 'বিজ্ঞপ্তি', 'mega'], ['/admin/settings', 'সেটিংস', 'gear'],
];
const CUSTOMER = [
  ['/dashboard', 'হোম', 'home'], ['/orders/new', 'নতুন অর্ডার', 'plus'], ['/orders', 'অর্ডার', 'orders'],
  ['/payments', 'পেমেন্ট', 'pay'], ['/ledger', 'হিসাবের খাতা', 'book'], ['/wallet', 'ব্যালেন্স', 'wallet'],
  ['/support', 'সাপোর্ট', 'chat'], ['/notifications', 'নোটিফিকেশন', 'bell'], ['/profile', 'প্রোফাইল', 'user'],
];

export default async function TopBar({ profile, active }) {
  const admin = profile?.role === 'admin';
  const links = admin ? ADMIN : CUSTOMER;
  const base = (h) => h.split(/[?#]/)[0];
  const isOn = (h) => active === h || (active && active === base(h) && h === base(h));
  let unread = 0;
  if (profile?.id) {
    const supabase = await createClient();
    unread = (await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).is('read_at', null)).count || 0;
  }
  const name = profile?.full_name || profile?.email || '';
  const ini = (name.trim().slice(0, 2) || 'M').toUpperCase();
  const home = admin ? '/admin' : '/dashboard';
  const newOrder = admin ? '/admin/orders/new' : '/orders/new';
  const bottom = admin
    ? [['/admin', 'হোম', 'home'], ['/admin/orders', 'অর্ডার', 'orders'], [newOrder, 'অর্ডার করুন', 'plus'], ['/admin/payments', 'পেমেন্ট', 'pay'], ['/admin/more', 'আরও', 'grid']]
    : [['/dashboard', 'হোম', 'home'], ['/orders', 'অর্ডার', 'orders'], [newOrder, 'অর্ডার করুন', 'plus'], ['/payments', 'পেমেন্ট', 'pay'], ['/profile', 'প্রোফাইল', 'user']];

  return (
    <>
      <input type="checkbox" id="navtoggle" className="navtoggle" aria-hidden="true" />
      <label htmlFor="navtoggle" className="nav-scrim" aria-hidden="true" />
      <aside className="sidebar noprint">
        <Link href={home} className="sb-brand">
          <span className="sb-logo">m</span>
          <span><b>MAS CRM</b><small>{admin ? 'অ্যাডমিন প্যানেল' : 'কাস্টমার প্যানেল'}</small></span>
        </Link>
        <nav className="sb-nav">
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href} className={isOn(href) ? 'on' : ''}>
              <Icon name={icon} />{label}
              {href === '/notifications' && unread > 0 && <em>{unread > 99 ? '৯৯+' : unread.toLocaleString('bn-BD')}</em>}
            </Link>
          ))}
        </nav>
        {admin && <Link href="/admin/more" className={`sb-more ${active === '/admin/more' ? 'on' : ''}`}><Icon name="grid" />সব অপশন (আরও)</Link>}
        <div className="sb-user">
          <span className="sb-av">{ini}</span>
          <span className="sb-who"><b>{name}</b><small>{admin ? 'অ্যাডমিন' : 'কাস্টমার'}</small></span>
          <form action="/auth/signout" method="post"><button className="icon-plain" aria-label="লগআউট" title="লগআউট"><Icon name="logout" /></button></form>
        </div>
      </aside>

      <header className="topactions noprint">
        <label htmlFor="navtoggle" className="icon-btn menu-btn" aria-label="মেনু"><Icon name="menu" /></label>
        <Link href={home} className="ta-brand"><span className="sb-logo sm">m</span><b>MAS CRM</b></Link>
        <span className="ta-space" />
        <ThemeToggle />
        <Link href="/notifications" className="icon-btn bell" aria-label="নোটিফিকেশন">
          <Icon name="bell" />{unread > 0 && <span className="count">{unread > 99 ? '৯৯+' : unread.toLocaleString('bn-BD')}</span>}
        </Link>
        <Link href={newOrder} className="btn-new"><Icon name="plus" size={20} /><span>নতুন অর্ডার</span></Link>
      </header>

      <nav className="bottombar noprint">
        {bottom.map(([href, label, icon], i) => (
          <Link key={href} href={href} className={`${i === 2 ? 'fab' : ''} ${active === base(href) && i !== 2 ? 'on' : ''}`}>
            <span><Icon name={icon} size={i === 2 ? 26 : 22} /></span><small>{label}</small>
          </Link>
        ))}
      </nav>
    </>
  );
}
