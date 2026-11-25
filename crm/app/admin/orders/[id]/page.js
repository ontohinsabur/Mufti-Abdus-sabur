import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';
import WaButton from '@/components/WaButton';
import VerifiedBadge from '@/components/VerifiedBadge';
import RunBar from '@/components/RunBar';
import { CopyText, ShareLink, PostPreview } from '@/components/OrderBits';
import { METHOD } from '@/components/PayMethod';
import { StatusPanel, UnusedPanel, FullEdit } from './controls';
import { STATUS, bnNum } from '@/lib/format';

const money = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const when = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' });
const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' });
function left(o) {
  const ms = new Date(o.run_end).getTime() - (o.paused_at ? new Date(o.paused_at).getTime() : Date.now());
  if (ms <= 0) return 'সময় শেষ';
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return `বাকি ${d ? bnNum(d) + ' দিন ' : ''}${bnNum(h)} ঘণ্টা ${bnNum(m)} মিনিট`;
}

export default async function AdminOrder({ params, searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const { id } = await params; const sp = await searchParams;
  const { data: o } = await supabase.from('orders').select('*, profiles!orders_customer_id_fkey(id, full_name, email, phone, whatsapp, status, role)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: events }, { data: allocs }] = await Promise.all([
    supabase.from('order_events').select('*').eq('order_id', id).order('created_at'),
    supabase.from('payment_allocations').select('amount, payments!inner(method, status, created_at)').eq('order_id', id).eq('payments.status', 'verified'),
  ]);
  const c = o.profiles || {};
  const phone = c.whatsapp || c.phone;
  const total = Number(o.total_bdt || 0), paid = Number(o.paid_amount || 0);
  const due = o.status === 'cancelled' ? 0 : Math.max(0, total - paid);
  const lastPay = [...(allocs || [])].sort((a, b) => (a.payments.created_at < b.payments.created_at ? 1 : -1))[0]?.payments;
  const method = lastPay ? METHOD[lastPay.method] || lastPay.method : o.pay_later ? 'বাকি (Pay Later)' : due > 0 ? 'এখনো পেমেন্ট হয়নি' : '—';
  const running = (o.status === 'running' || o.status === 'off') && o.run_end;
  const sendText = `আসসালামু আলাইকুম ${c.full_name || ''}\nঅর্ডার #${o.order_no} · ${o.service_name}${o.page_name ? `\nপেজ: ${o.page_name}` : ''}${o.budget_usd ? `\nবাজেট: $${o.budget_usd} · ${o.duration_days || ''} দিন` : ''}\nঅবস্থা: ${STATUS[o.status]?.label}${o.total_bdt != null ? `\nমোট: ${money(total)} · পরিশোধ: ${money(paid)}${due > 0 ? ` · বাকি: ${money(due)}` : ''}` : ''}`;
  const invUrl = `/invoice/${o.id}`;

  return (
    <>
      <TopBar profile={profile} active="/admin/orders" />
      <main className="wrap od">
        <div className="od-head">
          <div className="ph col" style={{ margin: 0 }}><h1>অর্ডার #{bnNum(o.order_no)}</h1><span>{c.full_name || c.email}</span></div>
          <Link href={`/admin/orders/new?from=${o.id}`} className="od-btn"><Icon name="refresh" size={18} />আবার অর্ডার</Link>
        </div>
        <Link href="/admin/orders" className="od-back">‹ সব অর্ডার</Link>

        {sp?.new && <div className="alert ok">অর্ডার তৈরি হয়েছে।</div>}
        {sp?.split && <div className="alert ok">বাকি বাজেট দিয়ে এই নতুন অর্ডার তৈরি হয়েছে।</div>}
        {o.split_parent && <div className="alert warn">এটা একটা আগের অর্ডারের বাকি অংশ। <Link href={`/admin/orders/${o.split_parent}`}>আগের অর্ডার দেখুন →</Link></div>}
        {o.split_child && <div className="alert warn">এই অর্ডারের বাকি অংশ নতুন অর্ডারে গেছে। <Link href={`/admin/orders/${o.split_child}`}>নতুন অর্ডার দেখুন →</Link></div>}

        <section className="od-card od-sum">
          <div>
            <small>{when(o.created_at)}</small>
            <h2>{o.service_name}</h2>
            <div className="od-pills">
              <em className={`s-${o.status}`}>● {STATUS[o.status]?.label}</em>
              {o.total_bdt != null && (due > 0.009 ? <em className="due">● বাকি · {money(due)}</em> : <em className="paid">● পরিশোধিত</em>)}
            </div>
          </div>
          <div className="od-amt"><b>{o.total_bdt == null ? 'কোটেশন বাকি' : money(total)}</b>{o.total_bdt != null && due > 0.009 && <small>বকেয়া {money(due)}</small>}</div>
        </section>

        <section className="od-card od-send">
          <div><h2>অর্ডারটি পাঠান</h2><p>টেক্সট কপি করে যেকোনো মেসেজে দিন, বা সরাসরি WhatsApp-এ পাঠান।</p></div>
          <div className="od-btnrow">
            <CopyText text={sendText} label="টেক্সট কপি" />
            {phone && <WaButton number={phone} text={sendText} className="od-btn wa" title="WhatsApp"><Icon name="bubble" size={18} />WhatsApp</WaButton>}
          </div>
        </section>

        <StatusPanel o={o}>
          {running && (
            <div className="od-run">
              <b>{o.status === 'off' ? 'এড থেমে আছে' : 'এড চলছে'} · শেষ হবে <span>{when(o.run_end)}</span> ({left(o)})</b>
              <small>{o.run_start ? `শুরু: ${when(o.run_start)} · ` : ''}সময় শেষে অর্ডার নিজে থেকে সম্পন্ন হবে, কাস্টমার নোটিফিকেশন পাবেন।</small>
              {o.run_start && <div className="od-runbar"><RunBar start={o.run_start} end={o.run_end} paused={o.status === 'off' ? o.paused_at : null} /></div>}
            </div>
          )}
        </StatusPanel>

        <section className="od-card">
          <h2>পেমেন্ট</h2>
          <dl className="od-kv">
            <dt>মোট</dt><dd>{o.total_bdt == null ? 'কোটেশন বাকি' : money(total)}</dd>
            <dt>পরিশোধিত</dt><dd>{money(paid)}</dd>
            <dt>বকেয়া</dt><dd className={due > 0.009 ? 't-bad' : ''}>{money(due)}</dd>
            <dt>মাধ্যম</dt><dd>{method}</dd>
            {o.pay_later && o.due_date && <><dt>Pay Later শেষ তারিখ</dt><dd>{day(o.due_date)}</dd></>}
          </dl>
          <div className="od-paystate">
            <span>পেমেন্টের অবস্থা:</span>
            {due > 0.009
              ? <><Link href={`/admin/payments?tab=record&customer=${o.customer_id}`} className="chip">পরিশোধিত</Link><span className="chip on">বকেয়া</span></>
              : <><span className="chip on">পরিশোধিত</span><span className="chip dim">বকেয়া</span></>}
          </div>
          {due > 0.009 && <p className="od-help">পেমেন্ট পেয়ে থাকলে "পরিশোধিত" চাপুন, পেমেন্ট রেকর্ড করার পেজ খুলবে।</p>}
        </section>

        {o.pricing_type === 'per_usd' && <UnusedPanel o={o} />}

        <section className="od-card">
          <div className="panel-h" style={{ marginBottom: 6 }}><h2 style={{ margin: 0 }}>কাস্টমার</h2><Link href={`/admin/customers/${o.customer_id}`}>প্রোফাইল</Link></div>
          <dl className="od-kv">
            <dt>নাম</dt><dd>{c.full_name || '—'}<VerifiedBadge profile={c} /></dd>
            <dt>মোবাইল</dt><dd>{phone || '—'}</dd>
            <dt>ইমেইল</dt><dd>{c.email}</dd>
          </dl>
          <div className="od-btnrow" style={{ marginTop: 12 }}>
            {phone && <a className="od-btn" href={`tel:${phone}`}><Icon name="phone" size={18} />কল</a>}
            {phone && <WaButton number={phone} text={`আসসালামু আলাইকুম ${c.full_name || ''}`} className="od-btn" title="WhatsApp"><Icon name="bubble" size={18} />WhatsApp</WaButton>}
          </div>
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
            {o.customer_note && <><dt>নোট</dt><dd>{o.customer_note}</dd></>}
            {o.admin_note && <><dt>অ্যাডমিন নোট</dt><dd>{o.admin_note}</dd></>}
          </dl>
        </section>

        {o.post_url && (
          <section className="od-card">
            <h2>ফেসবুক পোস্টের প্রিভিউ</h2>
            <PostPreview url={o.post_url} />
          </section>
        )}

        {o.total_bdt != null && (
          <section className="od-card">
            <div className="panel-h" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>ইনভয়েস</h2><span className="mono muted">{o.invoice_no}</span></div>
            <div className="od-btnrow">
              <a className="od-btn" href={invUrl}><Icon name="print" size={18} />দেখুন / প্রিন্ট</a>
              {phone && <WaButton number={phone} className="od-btn" title="WhatsApp"
                text={`আসসালামু আলাইকুম ${c.full_name || ''}\nআপনার অর্ডার #${o.order_no}-এর ইনভয়েস (${o.invoice_no || ''}): মোট ${money(total)}${due > 0 ? `, বাকি ${money(due)}` : ', পরিশোধিত'}।`}><Icon name="bubble" size={18} />WhatsApp-এ পাঠান</WaButton>}
              <ShareLink url={invUrl} title={`ইনভয়েস ${o.invoice_no || ''}`} />
            </div>
          </section>
        )}

        <FullEdit o={o}>
          <section className="od-card">
            <h2>অর্ডারের ইতিহাস</h2>
            <ul className="timeline">
              {(events || []).map((e) => (
                <li key={e.id}><b>{e.to_status ? STATUS[e.to_status]?.label : 'আপডেট'}</b> <span className="muted">{when(e.created_at)}</span>{e.note && <div className="muted">{e.note}</div>}</li>
              ))}
            </ul>
          </section>
        </FullEdit>
      </main>
    </>
  );
}
