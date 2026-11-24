import OrderStatus from '@/components/OrderStatus';
import { taka, usd, bnDate, timeLeft, PAY, bnNum } from '@/lib/format';

const SRC = { customer: 'গ্রাহকের নিজস্ব রেট', service: 'সাধারণ রেট', manual: 'অ্যাডমিন ঠিক করেছেন' };

export default function OrderDetail({ o, events, admin }) {
  return (
    <>
      <div className="card">
        <h1>অর্ডার #{o.order_no} <OrderStatus status={o.status} /></h1>
        <dl className="kv">
          <dt>সেবা</dt><dd>{o.service_name}</dd>
          {admin && o.profiles && <><dt>গ্রাহক</dt><dd>{o.profiles.full_name} · {o.profiles.email}{o.profiles.phone ? ` · ${o.profiles.phone}` : ''}</dd></>}
          {o.page_name && <><dt>পেজ</dt><dd>{o.page_name}</dd></>}
          {o.post_url && <><dt>পোস্ট</dt><dd><a href={o.post_url} target="_blank" rel="noopener noreferrer">{o.post_url}</a></dd></>}
          {o.budget_usd && <><dt>বাজেট</dt><dd>{usd(o.budget_usd)} · {bnNum(o.duration_days)} দিন{o.spent_usd != null ? ` · খরচ হয়েছে ${usd(o.spent_usd)}` : ''}</dd></>}
          {o.rate_bdt_per_usd && <><dt>রেট</dt><dd>৳{bnNum(o.rate_bdt_per_usd)} / ডলার{admin && o.rate_source ? ` (${SRC[o.rate_source] || o.rate_source})` : ''}</dd></>}
          <dt>মোট</dt><dd><b>{taka(o.total_bdt)}</b></dd>
          <dt>পেমেন্ট</dt><dd>{PAY[o.payment_status]} · পরিশোধ ৳{bnNum(o.paid_amount)}</dd>
          {o.run_start && <><dt>এড শুরু</dt><dd>{bnDate(o.run_start)}</dd></>}
          {o.run_end && <><dt>এড শেষ</dt><dd>{bnDate(o.run_end)}{(o.status === 'running' || o.status === 'off') ? ` · ${timeLeft(o)}` : ''}</dd></>}
          {o.customer_note && <><dt>গ্রাহকের নোট</dt><dd>{o.customer_note}</dd></>}
          {o.admin_note && <><dt>নোট</dt><dd>{o.admin_note}</dd></>}
          <dt>অর্ডারের সময়</dt><dd>{bnDate(o.created_at)}</dd>
        </dl>
      </div>
      <div className="card">
        <h2>অর্ডারের ইতিহাস</h2>
        <ul className="timeline">
          {(events || []).map((e) => (
            <li key={e.id}><b>{e.to_status ? <OrderStatus status={e.to_status} /> : 'আপডেট'}</b> <span className="muted">{bnDate(e.created_at)}</span>{e.note && <div>{e.note}</div>}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
