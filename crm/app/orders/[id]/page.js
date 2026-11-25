import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';
import RunBar from '@/components/RunBar';
import { CopyText, ShareLink, PostPreview } from '@/components/OrderBits';
import { METHOD } from '@/components/PayMethod';
import { WHATSAPP } from '@/lib/config';
import { PayTogether, WalletPay } from '@/components/PayForms';
import { dueOrders } from '@/lib/money';
import { STATUS, bnNum } from '@/lib/format';

const money = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const when = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });
const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
const STEPS = ['গ্রহণ', 'গৃহীত', 'এড রানিং', 'সম্পন্ন'];
const STEP = { pending: 0, accepted: 1, running: 2, off: 2, completed: 3 };

export default async function OrderPage({ params, searchParams }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params; const sp = await searchParams;
  if (profile.role === 'admin') redirect(`/admin/orders/${id}`);
  const { data: o } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: events }, due, { data: pay }, { data: sum }, { data: allocs }] = await Promise.all([
    supabase.from('order_events').select('*').eq('order_id', id).order('created_at'),
    dueOrders(supabase, user.id),
    supabase.from('settings').select('value').eq('key', 'payment').maybeSingle(),
    supabase.rpc('customer_summary').single(),
    supabase.from('payment_allocations').select('amount, payments!inner(method, status, created_at)').eq('order_id', id),
  ]);
  const mine = due.filter((d) => d.id === o.id);
  const total = Number(o.total_bdt || 0), paid = Number(o.paid_amount || 0);
  const left = o.status === 'cancelled' ? 0 : Math.max(0, total - paid);
  const waiting = (allocs || []).some((a) => a.payments.status === 'submitted');
  const lastPay = (allocs || []).filter((a) => a.payments.status === 'verified').sort((a, b) => (a.payments.created_at < b.payments.created_at ? 1 : -1))[0]?.payments;
  const step = STEP[o.status] ?? -1;
  const live = (o.status === 'running' || o.status === 'off') && o.run_start && o.run_end;

  return (
    <>
      <TopBar profile={profile} active="/orders" />
      <main className="wrap od">
        <div className="od-head">
          <div className="ph col" style={{ margin: 0 }}><h1>অর্ডার #{bnNum(o.order_no)}</h1><span>{o.page_name || o.service_name}</span></div>
          <Link href={`/orders/new?from=${o.id}`} className="od-btn"><Icon name="refresh" size={18} />আবার অর্ডার</Link>
        </div>
        <Link href="/orders" className="od-back">‹ আমার অর্ডার</Link>

        {sp?.new && <div className="alert ok">অর্ডার সফল হয়েছে! অর্ডার নম্বর #{o.order_no}।{o.quote_status === 'pending' ? ' দাম ঠিক করে আমরা জানাব।' : o.pay_later ? ' বাকিতে নেওয়া হয়েছে।' : ' পেমেন্ট যাচাইয়ের পর কাজ শুরু হবে।'}</div>}
        {waiting && <div className="alert warn">এই অর্ডারের পেমেন্ট যাচাইয়ের অপেক্ষায় আছে।</div>}

        <section className="od-card od-sum">
          <div>
            <small>{when(o.created_at)}</small>
            <h2>{o.service_name}</h2>
            <div className="od-pills">
              <em className={`s-${o.status}`}>● {STATUS[o.status]?.label}</em>
              {o.total_bdt != null && (left > 0.009 ? <em className="due">● বাকি · {money(left)}</em> : <em className="paid">● পরিশোধিত</em>)}
            </div>
          </div>
          <div className="od-amt"><b>{o.total_bdt == null ? 'কোটেশন বাকি' : money(total)}</b>{left > 0.009 && <small>বকেয়া {money(left)}</small>}</div>
        </section>

        <section className="od-card">
          <h2>অর্ডারের অগ্রগতি</h2>
          {o.status === 'cancelled' ? <p className="oc-cancel">এই অর্ডার বাতিল করা হয়েছে।</p> : (
            <div className="oc-steps big">
              {STEPS.map((s, i) => {
                const isLive = i === 2 && live;
                return <span key={s} className={`${i < step || (i === step && !isLive) ? 'done' : ''} ${i === step ? 'cur' : ''}`}>{isLive ? <RunBar start={o.run_start} end={o.run_end} paused={o.status === 'off' ? o.paused_at : null} /> : <i />}{s}</span>;
              })}
            </div>
          )}
          {(o.status === 'running' || o.status === 'off') && o.run_end && (
            <div className="od-run">
              <b>{o.status === 'off' ? 'এড এখন থেমে আছে' : 'এড চলছে'} · শেষ হবে <span>{when(o.run_end)}</span></b>
              {o.run_start && <small>শুরু: {when(o.run_start)} · সময় শেষে অর্ডার নিজে থেকে সম্পন্ন হবে।</small>}
            </div>
          )}
        </section>

        <section className="od-card">
          <h2>পেমেন্ট</h2>
          <dl className="od-kv">
            <dt>মোট</dt><dd>{o.total_bdt == null ? 'কোটেশন বাকি' : money(total)}</dd>
            <dt>পরিশোধিত</dt><dd>{money(paid)}</dd>
            <dt>বকেয়া</dt><dd className={left > 0.009 ? 't-bad' : ''}>{money(left)}</dd>
            <dt>মাধ্যম</dt><dd>{lastPay ? METHOD[lastPay.method] || lastPay.method : o.pay_later ? 'বাকি (Pay Later)' : '—'}</dd>
            {o.pay_later && o.due_date && <><dt>পরিশোধের শেষ তারিখ</dt><dd>{day(o.due_date)}</dd></>}
          </dl>
          {mine.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <PayTogether orders={mine} pay={pay?.value} single />
              {Number(sum?.wallet) > 0 && <WalletPay orderId={o.id} balance={Number(sum.wallet)} />}
            </div>
          )}
        </section>

        <section className="od-card">
          <h2>অর্ডারের তথ্য</h2>
          <dl className="od-kv">
            <dt>সার্ভিস</dt><dd>{o.service_name}</dd>
            {o.budget_usd != null && <><dt>ডলার বাজেট</dt><dd>${Number(o.budget_usd).toFixed(2)}{o.spent_usd != null ? ` (খরচ $${Number(o.spent_usd).toFixed(2)})` : ''}</dd></>}
            {o.rate_bdt_per_usd != null && <><dt>রেট</dt><dd>{money(o.rate_bdt_per_usd)} / ডলার</dd></>}
            {o.duration_days != null && <><dt>সময়কাল</dt><dd>{o.duration_days} দিন</dd></>}
            {o.page_name && <><dt>ফেসবুক পেজ</dt><dd>{o.page_name}</dd></>}
            {o.post_url && <><dt>পোস্ট লিংক</dt><dd className="od-links"><a href={o.post_url} target="_blank" rel="noopener noreferrer">খুলুন</a><CopyText text={o.post_url} /></dd></>}
            {o.customer_note && <><dt>আপনার নোট</dt><dd>{o.customer_note}</dd></>}
            {o.admin_note && <><dt>অ্যাডমিনের নোট</dt><dd>{o.admin_note}</dd></>}
          </dl>
        </section>

        {o.post_url && <section className="od-card"><h2>ফেসবুক পোস্টের প্রিভিউ</h2><PostPreview url={o.post_url} /></section>}

        {o.total_bdt != null && (
          <section className="od-card">
            <div className="panel-h" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>ইনভয়েস</h2><span className="mono muted">{o.invoice_no}</span></div>
            <div className="od-btnrow">
              <a className="od-btn" href={`/invoice/${o.id}`}><Icon name="print" size={18} />দেখুন / প্রিন্ট</a>
              <ShareLink url={`/invoice/${o.id}`} title={`ইনভয়েস ${o.invoice_no || ''}`} />
            </div>
          </section>
        )}

        <section className="od-card">
          <h2>অর্ডারের ইতিহাস</h2>
          <ul className="timeline">
            {(events || []).map((e) => <li key={e.id}><b>{e.to_status ? STATUS[e.to_status]?.label : 'আপডেট'}</b> <span className="muted">{when(e.created_at)}</span>{e.note && <div className="muted">{e.note}</div>}</li>)}
          </ul>
        </section>

        <div className="od-btnrow" style={{ marginBottom: 20 }}>
          <a className="od-btn wa" href={WHATSAPP} target="_blank" rel="noopener noreferrer"><Icon name="bubble" size={18} />হোয়াটসঅ্যাপে জিজ্ঞেস করুন</a>
          <Link className="od-btn" href="/support"><Icon name="chat" size={18} />সাপোর্টে লিখুন</Link>
        </div>
      </main>
    </>
  );
}
