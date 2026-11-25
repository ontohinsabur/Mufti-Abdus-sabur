import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import { ReviewButtons } from '@/components/AdminMoney';
import { PayTogether } from '@/components/PayForms';
import { METHOD } from '@/components/PayMethod';
import { dueOrders } from '@/lib/money';
import { bnNum, bnDate } from '@/lib/format';
import Pager, { paginate } from '@/components/Pager';

const TABS = [['overview', 'সারসংক্ষেপ'], ['verified', 'পেমেন্ট ইতিহাস'], ['submitted', 'যাচাই বাকি'], ['rejected', 'বাতিল পেমেন্ট'], ['record', '+ পেমেন্ট রেকর্ড']];
const money = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const PS = { unpaid: ['অপরিশোধিত', 'bad'], partial: ['আংশিক', 'warn'], paid: ['পরিশোধিত', 'ok'] };

export default async function AdminPayments({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams; const tab = sp?.tab === 'due' ? 'overview' : sp?.tab || 'overview';
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
  } else if (tab === 'overview') {
    const pf = ['unpaid', 'partial', 'paid'].includes(sp?.pf) ? sp.pf : 'all';
    const q = (sp?.q || '').trim().toLowerCase().replace(/^#/, '');
    const [{ data: subs }, due, { data: ords }] = await Promise.all([
      supabase.from('payments').select('*, payment_allocations(amount, orders(order_no))').eq('status', 'submitted').order('created_at', { ascending: false }),
      dueOrders(supabase, null),
      supabase.from('orders').select('id, order_no, service_name, page_name, total_bdt, paid_amount, payment_status, pay_later, due_date, invoice_no, customer_id, created_at, payment_allocations(payments(trx_id, status))')
        .neq('status', 'cancelled').not('total_bdt', 'is', null).order('created_at', { ascending: false }).limit(400),
    ]);
    const by = {};
    due.forEach((o) => { (by[o.customer_id] ||= { total: 0, n: 0, late: 0 }); by[o.customer_id].total += o.remaining; by[o.customer_id].n++; if (o.pay_later && o.due_date && new Date(o.due_date) < new Date()) by[o.customer_id].late++; });
    const rows = Object.entries(by).sort((a, b) => b[1].total - a[1].total);
    const all = ords || [];
    const cnt = { all: all.length, unpaid: 0, partial: 0, paid: 0 };
    all.forEach((o) => { cnt[o.payment_status] = (cnt[o.payment_status] || 0) + 1; });
    const list = all.filter((o) => (pf === 'all' || o.payment_status === pf) && (!q || String(o.order_no) === q
      || [cname[o.customer_id], o.service_name, o.page_name, o.invoice_no, ...(o.payment_allocations || []).map((a) => a.payments?.trx_id)].some((x) => (x || '').toLowerCase().includes(q))));
    const pg = paginate(list, sp, 10);
    body = (<>
      <section className="panel">
        <div className="panel-h"><h2>যাচাইয়ের অপেক্ষায় ({bnNum(subs?.length || 0)})</h2></div>
        {!subs?.length ? <p className="panel-empty">এখন যাচাই করার মতো কোনো পেমেন্ট নেই।</p> : (
          <div className="plist">
            {subs.map((p) => (
              <div className="pl-row" key={p.id} style={{ flexWrap: 'wrap' }}>
                <span><b>{cname[p.customer_id]} · {money(p.amount)} · {METHOD[p.method]}</b>
                  <small>{p.sender ? `প্রেরক ${p.sender} · ` : ''}{p.trx_id ? `TrxID ${p.trx_id} · ` : ''}অর্ডার {(p.payment_allocations || []).map((a) => `#${a.orders?.order_no}`).join(', ')} · {bnDate(p.created_at)}</small></span>
                <ReviewButtons id={p.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-h"><h2>কাস্টমার অনুযায়ী বকেয়া</h2><b className="t-bad">{money(rows.reduce((a, [, v]) => a + v.total, 0))}</b></div>
        {rows.length === 0 ? <p className="panel-empty">কোনো বকেয়া নেই।</p> : (
          <div className="plist">
            {rows.map(([id, v]) => (
              <Link key={id} href={`/admin/payments?tab=record&customer=${id}`} className="pl-row">
                <span><b>{cname[id]}</b><small>{bnNum(v.n)}টি অর্ডারে বকেয়া{v.late ? ` · ⚠ ${bnNum(v.late)}টির সময় পার হয়েছে` : ''}</small></span>
                <b className="t-bad">{money(v.total)}</b>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-h"><h2>সব পেমেন্ট</h2><span className="t-link">{bnNum(cnt.all)}টি</span></div>
        <form className="pay-filter">
          <input type="hidden" name="pf" value={pf} />
          <input name="q" defaultValue={sp?.q || ''} placeholder="কাস্টমার, অর্ডার বা TrxID খুঁজুন" />
          {[['all', 'সব'], ['unpaid', 'অপরিশোধিত'], ['partial', 'আংশিক'], ['paid', 'পরিশোধিত']].map(([k, l]) => (
            <Link key={k} href={`/admin/payments?pf=${k}${sp?.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`} className={`chip ${pf === k ? 'on' : ''}`}>{l} {bnNum(cnt[k] || 0)}</Link>
          ))}
        </form>
        {list.length === 0 ? <p className="panel-empty">কিছু পাওয়া যায়নি।</p> : (
          <div className="pc-grid">
            {pg.rows.map((o) => {
              const d = Math.max(0, Number(o.total_bdt) - Number(o.paid_amount));
              const [lbl, tone] = PS[o.payment_status] || PS.unpaid;
              return (
                <div key={o.id} className={`pc ${tone}`}>
                  <div className="pc-h">
                    <span><b>{cname[o.customer_id]}</b><small>PAY-{o.order_no} · অর্ডার #{o.order_no} · {o.service_name}</small></span>
                    <em className={tone}>● {lbl}</em>
                  </div>
                  <div className="pc-nums">
                    <div><small>পরিমাণ</small><b>{money(o.total_bdt)}</b></div>
                    <div><small>পরিশোধ</small><b className="t-ok">{money(o.paid_amount)}</b></div>
                    <div><small>বকেয়া</small><b className={d > 0.009 ? 't-bad' : ''}>{money(d)}</b></div>
                  </div>
                  <div className="pc-f">
                    <small>{o.pay_later && o.due_date && d > 0.009 ? `শেষ তারিখ ${new Date(o.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' })}` : new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' })}</small>
                    <span>
                      <Link href={`/admin/orders/${o.id}`} className="btn sm ghost">অর্ডার</Link>
                      {d > 0.009 && <Link href={`/admin/payments?tab=record&customer=${o.customer_id}`} className="btn sm">পেমেন্ট নিন</Link>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pager page={pg.page} pages={pg.pages} base="/admin/payments" sp={sp} />
      </section>
    </>);
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
        <div className="ph col"><h1>পেমেন্ট</h1><span>যাচাই, বকেয়া ও আদায়</span></div>
        <div className="tabs">{TABS.map(([k, l]) => <Link key={k} href={`/admin/payments?tab=${k}`} className={tab === k ? 'active' : ''}>{l}</Link>)}</div>
        {body}
      </main>
    </>
  );
}
