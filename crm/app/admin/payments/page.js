import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import { ReviewButtons } from '@/components/AdminMoney';
import { PayTogether } from '@/components/PayForms';
import { METHOD } from '@/components/PayMethod';
import { dueOrders } from '@/lib/money';
import { bnNum, bnDate } from '@/lib/format';

const TABS = [['submitted', 'যাচাই বাকি'], ['verified', 'যাচাই হয়েছে'], ['rejected', 'বাতিল'], ['record', '+ পেমেন্ট রেকর্ড'], ['due', 'বকেয়া']];

export default async function AdminPayments({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams; const tab = sp?.tab || 'submitted';
  const { data: customers } = await supabase.from('profiles').select('id, full_name, email, phone').eq('role', 'customer').order('full_name');
  const cname = Object.fromEntries((customers || []).map((c) => [c.id, c.full_name || c.email]));
  let body;
  if (tab === 'record') {
    const cust = sp?.customer || '';
    const [due, { data: pay }] = cust ? await Promise.all([dueOrders(supabase, cust), supabase.from('settings').select('value').eq('key', 'payment').maybeSingle()]) : [[], { data: null }];
    body = (
      <div className="card">
        <form><input type="hidden" name="tab" value="record" /><label>গ্রাহক</label>
          <div className="copy"><select name="customer" defaultValue={cust}><option value="">— নির্বাচন করুন —</option>{(customers || []).map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</select><button className="btn sm">দেখুন</button></div></form>
        {cust && <div style={{ marginTop: 12 }}><PayTogether orders={due} pay={pay?.value} admin /></div>}
      </div>
    );
  } else if (tab === 'due') {
    const due = await dueOrders(supabase, null);
    const by = {};
    due.forEach((o) => { (by[o.customer_id] ||= { total: 0, n: 0, late: 0 }); by[o.customer_id].total += o.remaining; by[o.customer_id].n++; if (o.pay_later && o.due_date && new Date(o.due_date) < new Date()) by[o.customer_id].late++; });
    const rows = Object.entries(by).sort((a, b) => b[1].total - a[1].total);
    body = (
      <div className="list">
        <div className="price-box">সব গ্রাহকের মোট বকেয়া: <b>৳{bnNum(rows.reduce((a, [, v]) => a + v.total, 0))}</b></div>
        {rows.length === 0 && <p className="muted">কোনো বকেয়া নেই।</p>}
        {rows.map(([id, v]) => (
          <div className="row" key={id}><div><Link href={`/admin/customers/${id}`}><b>{cname[id]}</b></Link><div className="muted">{bnNum(v.n)}টি অর্ডার{v.late ? ` · ⚠ ${bnNum(v.late)}টির সময় পার হয়েছে` : ''}</div></div>
            <div className="actions"><b>৳{bnNum(v.total)}</b><Link className="btn sm" href={`/admin/payments?tab=record&customer=${id}`}>পেমেন্ট নিন</Link></div></div>
        ))}
      </div>
    );
  } else {
    const { data: pays } = await supabase.from('payments').select('*, payment_allocations(amount, orders(order_no))').eq('status', tab).order('created_at', { ascending: false }).limit(150);
    body = (
      <div className="list">
        {!pays?.length && <p className="muted">এই তালিকায় কিছু নেই।</p>}
        {(pays || []).map((p) => (
          <div className="row" key={p.id}>
            <div style={{ flex: 1 }}>
              <b>#{p.payment_no} · ৳{bnNum(p.amount)}</b> · {METHOD[p.method]} · <Link href={`/admin/customers/${p.customer_id}`}>{cname[p.customer_id]}</Link>
              <div className="muted">{p.sender ? `প্রেরক ${p.sender} · ` : ''}{p.trx_id ? `TrxID ${p.trx_id} · ` : ''}{bnDate(p.created_at)}</div>
              <div className="muted">অর্ডার: {(p.payment_allocations || []).map((a) => `#${a.orders?.order_no} (৳${bnNum(a.amount)})`).join(', ')}</div>
              {p.customer_note && <div className="muted">গ্রাহকের নোট: {p.customer_note}</div>}
              {p.admin_note && <div className="muted">নোট: {p.admin_note}</div>}
            </div>
            {p.status === 'submitted' && <ReviewButtons id={p.id} />}
          </div>
        ))}
      </div>
    );
  }
  return (
    <>
      <TopBar profile={profile} active="/admin/payments" />
      <main className="wrap">
        <h1>পেমেন্ট</h1>
        <div className="tabs">{TABS.map(([k, l]) => <Link key={k} href={`/admin/payments?tab=${k}`} className={tab === k ? 'active' : ''}>{l}</Link>)}</div>
        {body}
      </main>
    </>
  );
}
