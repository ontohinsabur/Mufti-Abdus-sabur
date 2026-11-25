import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';
import { bnNum } from '@/lib/format';

export const metadata = { title: 'ইনভয়েস | MAS CRM' };
const money = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

export default async function Invoices({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  const tab = ['due', 'paid'].includes(sp?.tab) ? sp.tab : 'all';
  const q = (sp?.q || '').trim().toLowerCase().replace(/^#/, '');
  const { data } = await supabase.from('orders')
    .select('id, order_no, invoice_no, service_name, total_bdt, paid_amount, status, created_at, profiles!orders_customer_id_fkey(full_name, email)')
    .not('total_bdt', 'is', null).order('created_at', { ascending: false }).limit(500);
  const all = (data || []).map((o) => ({ ...o, due: o.status === 'cancelled' || o.status === 'off' ? 0 : Math.max(0, Number(o.total_bdt) - Number(o.paid_amount)) }));
  const found = all.filter((o) => !q || String(o.order_no) === q || [o.invoice_no, o.profiles?.full_name, o.profiles?.email].some((x) => (x || '').toLowerCase().includes(q)));
  const rows = found.filter((o) => tab === 'all' || (tab === 'due' ? o.due > 0.009 : o.due <= 0.009));
  const total = found.reduce((a, o) => a + Number(o.total_bdt || 0), 0);
  const due = found.reduce((a, o) => a + o.due, 0);
  const qs = sp?.q ? `&q=${encodeURIComponent(sp.q)}` : '';
  return (
    <>
      <TopBar profile={profile} active="/admin/invoices" />
      <main className="wrap">
        <div className="ph col"><h1>ইনভয়েস</h1><span>সব ইনভয়েস ও বকেয়া</span></div>
        <form className="searchbar">
          <Icon name="search" />
          <input type="hidden" name="tab" value={tab} />
          <input name="q" defaultValue={sp?.q || ''} placeholder="ইনভয়েস নম্বর, অর্ডার # বা নাম" />
        </form>
        <div className="chips">{[['all', 'সব'], ['due', 'বকেয়া'], ['paid', 'পরিশোধিত']].map(([k, l]) => <Link key={k} href={`/admin/invoices?tab=${k}${qs}`} className={`chip ${tab === k ? 'on' : ''}`}>{l}</Link>)}</div>
        <div className="inv-stats">
          <div className="stat"><span>ইনভয়েস</span><b>{bnNum(found.length)}</b></div>
          <div className="stat"><span>মোট</span><b>{money(total)}</b></div>
          <div className="stat bad"><span>বকেয়া</span><b>{money(due)}</b></div>
        </div>
        <section className="panel">
          {rows.length === 0 ? <p className="panel-empty">এই তালিকায় কোনো ইনভয়েস নেই।</p> : (
            <div className="plist">
              {rows.map((o) => (
                <Link key={o.id} href={`/invoice/${o.id}`} className="pl-row inv-row">
                  <span><b className="mono">{o.invoice_no || `#${o.order_no}`}</b>
                    <small>{o.profiles?.full_name || o.profiles?.email} · #{bnNum(o.order_no)} · {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' })}{o.status === 'cancelled' ? ' · বাতিল' : ''}</small></span>
                  <span className="inv-amt"><b>{money(o.total_bdt)}</b>{o.due > 0.009 ? <small className="t-bad">বকেয়া {money(o.due)}</small> : <small className="t-ok">{o.status === 'cancelled' ? 'বাতিল' : 'পরিশোধিত'}</small>}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
