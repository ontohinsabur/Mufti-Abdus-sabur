'use client';
import { useActionState, useMemo, useState } from 'react';
import { payOrders, payWithWallet, requestWithdraw } from '@/app/payments/actions';
import PayMethod from '@/components/PayMethod';
import { bnNum } from '@/lib/format';

const Msg = ({ s }) => (s?.err ? <div className="alert err">{s.err}</div> : s?.ok ? <div className="alert ok">{s.ok}</div> : null);

// due orders with checkboxes -> one payment ("একসাথে পেমেন্ট"); also used for a single order
export function PayTogether({ orders, pay, admin, single }) {
  const [s, act, busy] = useActionState(payOrders, null);
  const [sel, setSel] = useState(() => new Set(orders.map((o) => o.id)));
  const total = useMemo(() => orders.filter((o) => sel.has(o.id)).reduce((a, o) => a + o.remaining, 0), [sel, orders]);
  if (!orders.length) return <p className="muted">পরিশোধের মতো কোনো বকেয়া নেই। 🎉</p>;
  const toggle = (id) => { const x = new Set(sel); x.has(id) ? x.delete(id) : x.add(id); setSel(x); };
  return (
    <form action={act}>
      <Msg s={s} />
      {!single && (
        <div className="list" style={{ marginBottom: 12 }}>
          {orders.map((o) => (
            <label key={o.id} className="row" style={{ cursor: 'pointer', fontWeight: 400 }}>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="checkbox" checked={sel.has(o.id)} onChange={() => toggle(o.id)} style={{ width: 'auto' }} />
                <span><b>#{o.order_no}</b> · {o.service_name}{o.page_name ? ` · ${o.page_name}` : ''}{o.pay_later && o.due_date ? <span className="muted"> · শেষ তারিখ {new Date(o.due_date).toLocaleDateString('bn-BD')}</span> : null}</span>
              </span>
              <b>৳{bnNum(o.remaining)}</b>
            </label>
          ))}
        </div>
      )}
      {[...sel].map((id) => <input key={id} type="hidden" name="order_id" value={id} />)}
      <div className="price-box" style={{ marginTop: 0 }}>{single ? 'পরিশোধ বাকি' : 'নির্বাচিত মোট'}: <b>৳{bnNum(total)}</b></div>
      {admin && <><label>কত টাকা পেয়েছেন? <span className="muted">(ফাঁকা রাখলে পুরো টাকা)</span></label><input name="amount" inputMode="decimal" /></>}
      <PayMethod pay={pay} admin={admin} />
      <label>নোট <span className="muted">(ঐচ্ছিক)</span></label><input name="note" />
      <button className="btn block" disabled={busy || sel.size === 0}>{busy ? 'জমা হচ্ছে…' : admin ? 'পেমেন্ট রেকর্ড করুন' : 'পেমেন্ট জমা দিন'}</button>
    </form>
  );
}

export function WalletPay({ orderId, balance }) {
  const [s, act, busy] = useActionState(payWithWallet, null);
  return (
    <form action={act} style={{ marginTop: 8 }}>
      <Msg s={s} /><input type="hidden" name="order_id" value={orderId} />
      <button className="btn ghost block" disabled={busy}>ওয়ালেট (৳{bnNum(balance)}) দিয়ে পরিশোধ করুন</button>
    </form>
  );
}

export function WithdrawForm({ max }) {
  const [s, act, busy] = useActionState(requestWithdraw, null);
  return (
    <form action={act}>
      <Msg s={s} />
      <label>কত টাকা তুলবেন? <span className="muted">(সর্বোচ্চ ৳{bnNum(max)})</span></label><input name="amount" inputMode="decimal" />
      <label>কোথায় নেবেন</label>
      <select name="method"><option value="bkash">বিকাশ</option><option value="nagad">নগদ</option><option value="rocket">রকেট</option><option value="bank">ব্যাংক</option></select>
      <label>নম্বর / অ্যাকাউন্ট</label><input name="account" placeholder="01XXXXXXXXX" />
      <label>নোট <span className="muted">(ঐচ্ছিক)</span></label><input name="note" />
      <button className="btn block" disabled={busy || max <= 0}>অনুরোধ পাঠান</button>
    </form>
  );
}
