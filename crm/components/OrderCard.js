import Link from 'next/link';
import Icon from './Icon';
import PostThumb from './PostThumb';
import CopyButton from './CopyButton';
import WaButton from './WaButton';
import RunBar from './RunBar';
import VerifiedBadge from './VerifiedBadge';
import { bnNum } from '@/lib/format';

const STEPS = ['গ্রহণ', 'গৃহীত', 'এড রানিং', 'সম্পন্ন'];
const STEP = { pending: 0, accepted: 1, running: 2, off: 2, completed: 3 };
export const money = (x) => '৳' + Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const short = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' });
const stamp = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' }).replace(/ (am|pm)$/i, (m) => m.toUpperCase());

export function left(o, withMin = false) {
  if (!o.run_end) return null;
  const ms = new Date(o.run_end).getTime() - (o.paused_at ? new Date(o.paused_at).getTime() : Date.now());
  if (ms <= 0) return { text: 'সময় শেষ', soon: true };
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  const text = d ? `আর ${bnNum(d)} দিন ${bnNum(h)} ঘণ্টা` : `আর ${bnNum(h)} ঘণ্টা${withMin ? ` ${bnNum(m)} মি.` : ''}`;
  return { text, soon: ms < 864e5 };
}

export default function OrderCard({ o, admin = true }) {
  const base = admin ? '/admin/orders' : '/orders';
  const step = STEP[o.status] ?? -1;
  const due = Math.max(0, Number(o.total_bdt || 0) - Number(o.paid_amount || 0));
  const t = (o.status === 'running' || o.status === 'off') ? left(o) : null;
  const c = o.profiles || {};
  return (
    <article className={`oc st-${o.status}`}>
      <div className="oc-head">
        <PostThumb url={o.post_url} />
        <div className="oc-who">
          <b>{admin ? (c.full_name || c.email) : o.service_name}{admin && <VerifiedBadge profile={c} size={18} />}</b>
          <small>{o.service_name} · #{bnNum(o.order_no)} · {stamp(o.created_at)}</small>
          {o.page_name && <span className="oc-page"><i>f</i>{o.page_name}</span>}
        </div>
        <Link href={`${base}/new?from=${o.id}`} className="oc-ic round" title="আবার অর্ডার" aria-label="আবার অর্ডার"><Icon name="refresh" size={20} /></Link>
      </div>

      {o.status === 'cancelled' ? <p className="oc-cancel">এই অর্ডার বাতিল করা হয়েছে।</p> : (
        <div className="oc-steps">
          {STEPS.map((s, i) => {
            const live = i === 2 && (o.status === 'running' || o.status === 'off') && o.run_start && o.run_end;
            return (
              <span key={s} className={`${i < step || (i === step && !live) ? 'done' : ''} ${i === step ? 'cur' : ''}`}>
                {live ? <RunBar start={o.run_start} end={o.run_end} paused={o.status === 'off' ? o.paused_at : null} /> : <i />}{s}
              </span>
            );
          })}
        </div>
      )}
      {t && <p className="oc-time">⏱ {t.text} বাকি{o.paused_at ? ' (থেমে আছে)' : ''} · শেষ {short(o.run_end)}</p>}

      <div className="oc-money">
        <span>মোট <b>{o.total_bdt == null ? 'কোটেশন বাকি' : money(o.total_bdt)}</b></span>
        {o.total_bdt != null && (due > 0.009
          ? <em className="due">বাকি {money(due)}{o.due_date ? ` · ${short(o.due_date)}` : ''}</em>
          : <em className="paid">পরিশোধিত</em>)}
      </div>

      <div className="oc-actions">
        <Link href={`${base}/${o.id}`} className="oc-btn pri"><Icon name="eye" size={20} />বিস্তারিত</Link>
        <Link href={`/invoice/${o.id}`} className="oc-btn"><Icon name="invoice" size={20} />ইনভয়েস</Link>
        {o.post_url && <CopyButton text={o.post_url} />}
        {admin && (c.whatsapp || c.phone) && (
          <WaButton number={c.whatsapp || c.phone} className="oc-ic" title="হোয়াটসঅ্যাপ"
            text={`আসসালামু আলাইকুম ${c.full_name || ''}\nঅর্ডার #${o.order_no} (${o.service_name}${o.page_name ? ' · ' + o.page_name : ''})`}>
            <Icon name="bubble" size={20} />
          </WaButton>
        )}
      </div>
    </article>
  );
}
