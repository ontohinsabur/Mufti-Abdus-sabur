import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import VerifiedBadge from '@/components/VerifiedBadge';
import { bnNum } from '@/lib/format';

export const metadata = { title: 'ইনভয়েস | MAS CRM' };

export default async function Invoices({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  const tab = sp?.tab === 'paid' ? 'paid' : sp?.tab === 'due' ? 'due' : 'all';
  const { data } = await supabase.from('orders')
    .select('id, order_no, invoice_no, service_name, page_name, total_bdt, paid_amount, status, created_at, profiles!orders_customer_id_fkey(full_name, email, status, role)')
    .neq('status', 'cancelled').not('total_bdt', 'is', null).order('created_at', { ascending: false }).limit(300);
  const rows = (data || []).filter((o) => {
    const due = Number(o.total_bdt || 0) - Number(o.paid_amount || 0) > 0.009;
    return tab === 'all' || (tab === 'due' ? due : !due);
  });
  const T = [['all', 'সব'], ['due', 'বাকি আছে'], ['paid', 'পরিশোধিত']];
  return (
    <>
      <TopBar profile={profile} active="/admin/invoices" />
      <main className="wrap">
        <h1 className="page-title">ইনভয়েস</h1>
        <div className="tabs">{T.map(([k, l]) => <Link key={k} href={`/admin/invoices?tab=${k}`} className={tab === k ? 'active' : ''}>{l}</Link>)}</div>
        <div className="list">
          {rows.length === 0 && <p className="muted">এই তালিকায় কোনো ইনভয়েস নেই।</p>}
          {rows.map((o) => {
            const due = Math.max(0, Number(o.total_bdt || 0) - Number(o.paid_amount || 0));
            return (
              <div className="row" key={o.id}>
                <div>
                  <b>{o.invoice_no || `#${o.order_no}`}</b> <span className={`badge ${due > 0.009 ? 'pending' : 'approved'}`}>{due > 0.009 ? `বাকি ৳${bnNum(due)}` : 'পরিশোধিত'}</span>
                  <div className="muted">{o.profiles?.full_name || o.profiles?.email}<VerifiedBadge profile={o.profiles} size={14} /> · {o.service_name}{o.page_name ? ` · ${o.page_name}` : ''}</div>
                  <div className="muted">মোট ৳{bnNum(o.total_bdt)} · {new Date(o.created_at).toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka' })}</div>
                </div>
                <div className="actions">
                  <Link className="btn sm ghost" href={`/admin/orders/${o.id}`}>অর্ডার</Link>
                  <Link className="btn sm" href={`/invoice/${o.id}`}>ইনভয়েস দেখুন</Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
