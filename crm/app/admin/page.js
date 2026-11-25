import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import Tile from '@/components/Tile';
import OrderCard, { left } from '@/components/OrderCard';
import { bnNum } from '@/lib/format';

const n = (x) => (x || 0).toLocaleString('bn-BD');
const tk = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Start of today / this month in Dhaka (UTC+6), as ISO strings
function dhakaStarts() {
  const now = new Date(Date.now() + 6 * 3600e3);
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 6 * 3600e3);
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 6 * 3600e3);
  return { day: day.toISOString(), month: month.toISOString() };
}

const TILES = [
  ['/admin/orders/new', 'অর্ডার করুন', 'plus', 'blue', true],
  ['/admin/orders', 'অর্ডার', 'orders', 'navy'],
  ['/admin/payments', 'পেমেন্ট যাচাই', 'check', 'green'],
  ['/admin/customers', 'কাস্টমার', 'users', 'violet'],
  ['/admin/invoices', 'ইনভয়েস', 'invoice', 'amber'],
  ['/admin/payments?tab=due', 'বাকি (Pay Later)', 'clock', 'rose'],
  ['/admin/reports', 'রিপোর্ট', 'chart', 'teal'],
  ['/admin/more', 'আরও', 'grid', 'slate'],
];

export default async function AdminHome() {
  const { supabase, profile } = await requireAdmin();
  const { day, month } = dhakaStarts();
  const head = { count: 'exact', head: true };
  const P = 'profiles!orders_customer_id_fkey(full_name, email, phone, whatsapp, status, role)';
  const [today, waiting, verify, pendingCust, wreq, open, monthOrders, monthPays, recent, ending, tickets, running, todayPays, custs, openTk] = await Promise.all([
    supabase.from('orders').select('*', head).gte('created_at', day),
    supabase.from('orders').select('*', head).eq('status', 'pending'),
    supabase.from('payments').select('*', head).eq('status', 'submitted'),
    supabase.from('profiles').select('*', head).eq('role', 'customer').eq('status', 'pending'),
    supabase.from('wallet_requests').select('*', head).eq('status', 'pending'),
    supabase.from('orders').select('total_bdt, paid_amount, customer_id').not('status', 'in', '(off,cancelled)'),
    supabase.from('orders').select('total_bdt').gte('created_at', month).neq('status', 'cancelled'),
    supabase.from('payments').select('amount').eq('status', 'verified').gte('created_at', month),
    supabase.from('orders').select(`*, ${P}`).order('created_at', { ascending: false }).limit(6),
    supabase.from('orders').select(`id, order_no, service_name, page_name, run_end, paused_at, ${P}`).eq('status', 'running').not('run_end', 'is', null).order('run_end').limit(5),
    supabase.from('support_tickets').select('id, subject, status, last_message_at, profiles(full_name, email, status, role), support_messages(body, sender, created_at)').order('last_message_at', { ascending: false }).limit(5),
    supabase.from('orders').select('run_end').eq('status', 'running'),
    supabase.from('payments').select('amount').eq('status', 'verified').gte('created_at', day),
    supabase.from('profiles').select('*', head).eq('role', 'customer').eq('status', 'approved'),
    supabase.from('support_tickets').select('*', head).eq('status', 'open'),
  ]);
  const dueCust = new Set((open.data || []).filter((o) => Number(o.total_bdt || 0) - Number(o.paid_amount || 0) > 0.009).map((o) => o.customer_id)).size;
  const soon = (running.data || []).filter((o) => o.run_end && new Date(o.run_end) - Date.now() < 864e5).length;
  const gotToday = (todayPays.data || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const due = (open.data || []).reduce((s, o) => s + Math.max(0, Number(o.total_bdt || 0) - Number(o.paid_amount || 0)), 0);
  const sales = (monthOrders.data || []).reduce((s, o) => s + Number(o.total_bdt || 0), 0);
  const got = (monthPays.data || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const date = new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' });
  const counts = { '/admin/payments': verify.count, '/admin/customers': pendingCust.count, '/admin/orders': waiting.count };

  return (
    <>
      <TopBar profile={profile} active="/admin" />
      <main className="wrap">
        <section className="hero">
          <div className="hero-txt">
            <h1>আসসালামু আলাইকুম, {profile.full_name || 'অ্যাডমিন'}</h1>
            <p>{date}</p>
          </div>
          <div className="hero-chips">
            <Link href="/admin/orders?status=running"><span>🟢 এড চলছে</span><b>{n((running.data || []).length)}</b></Link>
            <Link href="/admin/orders?status=running" className={soon ? 'warn' : ''}><span>⏳ ২৪ ঘণ্টায় শেষ</span><b>{n(soon)}</b></Link>
            <Link href="/admin/payments?tab=verified"><span>💰 আজ আদায়</span><b>{tk(gotToday)}</b></Link>
            <Link href="/admin/customers"><span>👥 কাস্টমার</span><b>{n(custs.count)}</b></Link>
            <Link href="/admin/payments" className={`pc-only ${dueCust ? 'warn' : ''}`}><span>🧾 বকেয়া কাস্টমার</span><b>{n(dueCust)}</b></Link>
            <Link href="/admin/support" className="pc-only"><span>💬 খোলা সাপোর্ট</span><b>{n(openTk.count)}</b></Link>
          </div>
        </section>

        {pendingCust.count > 0 && <div className="alert warn">{n(pendingCust.count)} জন নতুন গ্রাহক অনুমোদনের অপেক্ষায়। <Link href="/admin/customers?status=pending">এখনই দেখুন →</Link></div>}
        {wreq.count > 0 && <div className="alert warn">{n(wreq.count)}টি টাকা তোলার অনুরোধ আছে। <Link href="/admin/wallet">দেখুন →</Link></div>}

        <div className="stats">
          <Link href="/admin/orders" className="stat"><span>আজকের অর্ডার</span><b>{n(today.count)}</b></Link>
          <Link href="/admin/orders?status=pending" className="stat"><span>অপেক্ষমাণ অর্ডার</span><b className={waiting.count ? 'warn' : ''}>{n(waiting.count)}</b></Link>
          <Link href="/admin/payments" className="stat"><span>যাচাই বাকি</span><b className={verify.count ? 'warn' : ''}>{n(verify.count)}</b></Link>
          <Link href="/admin/payments?tab=due" className="stat"><span>মোট বকেয়া</span><b>{tk(due)}</b></Link>
          <Link href="/admin/reports" className="stat"><span>এ মাসের বিক্রি</span><b>{tk(sales)}</b><small>{n((monthOrders.data || []).length)}টি অর্ডার</small></Link>
          <Link href="/admin/reports" className="stat"><span>এ মাসে আদায়</span><b className="ok">{tk(got)}</b></Link>
        </div>

        <div className="tiles">
          {TILES.map(([href, label, icon, tone, solid]) => <Tile key={href} href={href} label={label} icon={icon} tone={tone} solid={solid} count={counts[href]} />)}
        </div>

        <section className="panel">
          <div className="panel-h"><h2>সাম্প্রতিক অর্ডার</h2><Link href="/admin/orders">সব দেখুন</Link></div>
          {(recent.data || []).length === 0 ? <p className="panel-empty">এখনো কোনো অর্ডার নেই।</p>
            : <div className="oc-grid">{recent.data.map((o) => <OrderCard key={o.id} o={o} />)}</div>}
        </section>

        <section className="panel">
          <div className="panel-h"><h2>এড রানিং · শিগগির শেষ</h2><Link href="/admin/orders?status=running">সব দেখুন</Link></div>
          {(ending.data || []).length === 0 ? <p className="panel-empty">এখন কোনো এড চলছে না।</p> : (
            <div className="plist">
              {ending.data.map((o) => {
                const t = left(o, true);
                return (
                  <Link key={o.id} href={`/admin/orders/${o.id}`} className="pl-row">
                    <span><b>{o.profiles?.full_name || o.profiles?.email} · #{bnNum(o.order_no)}</b><small>{o.page_name || o.service_name}</small></span>
                    {t && <em className={t.soon ? 'soon' : ''}>{t.text}{o.paused_at ? ' (থেমে আছে)' : ''}</em>}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-h"><h2>মেসেজ</h2><Link href="/admin/support">সব দেখুন</Link></div>
          {(tickets.data || []).length === 0 ? <p className="panel-empty">এখনো কোনো মেসেজ আসেনি। কাস্টমার সাপোর্টে মেসেজ করলে এখানে দেখাবে।</p> : (
            <div className="plist">
              {tickets.data.map((t) => {
                const last = [...(t.support_messages || [])].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
                return (
                  <Link key={t.id} href={`/admin/support/${t.id}`} className="pl-row">
                    <span><b>{t.profiles?.full_name || t.profiles?.email} · {t.subject}</b><small>{last ? `${last.sender === 'admin' ? 'আপনি: ' : ''}${last.body.slice(0, 90)}` : ''}</small></span>
                    <em className={t.status === 'open' ? '' : 'mute'}>{t.status === 'open' ? 'চলমান' : 'বন্ধ'}</em>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
