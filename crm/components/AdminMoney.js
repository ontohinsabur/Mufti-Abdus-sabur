'use client';
import { useActionState } from 'react';
import { reviewPayment, processWithdraw, walletAdjust, savePayLater, settleUnused, savePaymentSettings } from '@/app/admin/money-actions';
import { usd } from '@/lib/format';

const Msg = ({ s }) => (s?.err ? <div className="alert err">{s.err}</div> : s?.ok ? <div className="alert ok">{s.ok}</div> : null);

export function ReviewButtons({ id }) {
  const [s, act, busy] = useActionState(reviewPayment, null);
  return (
    <form action={act} style={{ width: '100%' }}>
      <Msg s={s} /><input type="hidden" name="id" value={id} />
      <div className="copy"><input name="note" placeholder="নোট (ঐচ্ছিক)" />
        <button className="btn sm ok" name="ok" value="1" disabled={busy}>✔ যাচাই</button>
        <button className="btn sm bad" name="ok" value="0" disabled={busy}>বাতিল</button></div>
    </form>
  );
}

export function WithdrawButtons({ id }) {
  const [s, act, busy] = useActionState(processWithdraw, null);
  return (
    <form action={act} style={{ width: '100%' }}>
      <Msg s={s} /><input type="hidden" name="id" value={id} />
      <div className="copy"><input name="trx" placeholder="TrxID" /><input name="note" placeholder="নোট" />
        <button className="btn sm ok" name="ok" value="1" disabled={busy}>পাঠিয়েছি</button>
        <button className="btn sm bad" name="ok" value="0" disabled={busy}>বাতিল</button></div>
    </form>
  );
}

export function AdjustForm({ customers, customerId }) {
  const [s, act, busy] = useActionState(walletAdjust, null);
  return (
    <form action={act}>
      <Msg s={s} />
      {customerId ? <input type="hidden" name="customer_id" value={customerId} /> : (<>
        <label>গ্রাহক</label><select name="customer_id">{customers.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</select></>)}
      <label>পরিমাণ (৳) <span className="muted">— যোগ করতে ধনাত্মক, কমাতে ঋণাত্মক (যেমন -২০০)</span></label><input name="amount" inputMode="decimal" />
      <label>কারণ</label><input name="note" />
      <button className="btn block" disabled={busy}>সমন্বয় করুন</button>
    </form>
  );
}

export function PayLaterForm({ c }) {
  const [s, act, busy] = useActionState(savePayLater, null);
  return (
    <form action={act}>
      <Msg s={s} /><input type="hidden" name="customer_id" value={c.id} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="enabled" defaultChecked={c.pay_later_enabled} style={{ width: 'auto' }} /> Pay Later চালু</label>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><label>বাকির লিমিট (৳)</label><input name="limit" inputMode="decimal" defaultValue={c.pay_later_limit} /></div>
        <div><label>কতদিনে শোধ</label><input name="days" inputMode="numeric" defaultValue={c.pay_later_due_days} /></div>
      </div>
      <button className="btn block" disabled={busy}>সংরক্ষণ</button>
    </form>
  );
}

export function SettleForm({ o }) {
  const [s, act, busy] = useActionState(settleUnused, null);
  return (
    <form action={act} className="card">
      <h2>অব্যবহৃত বাজেটের হিসাব</h2><Msg s={s} />
      <p className="muted">এড আগে বন্ধ হলে যতটুকু খরচ হয়েছে শুধু ততটুকু বিল হবে। গ্রাহক বেশি দিয়ে থাকলে বাকি টাকা ওয়ালেটে জমা হবে অথবা ফেরত দেওয়া হিসেবে লেখা হবে। অর্ডারটি সম্পন্ন হয়ে যাবে।</p>
      <input type="hidden" name="id" value={o.id} />
      <label>কত ডলার খরচ হয়েছে? (মোট বাজেট {usd(o.budget_usd)})</label><input name="spent" inputMode="decimal" />
      <label>বাকি টাকা</label>
      <select name="mode"><option value="wallet">গ্রাহকের ওয়ালেটে জমা রাখুন</option><option value="refund">গ্রাহককে ফেরত দিয়েছি</option></select>
      <label>নোট <span className="muted">(ঐচ্ছিক)</span></label><input name="note" placeholder="যেমন: গ্রাহকের অনুরোধে বন্ধ" />
      <button className="btn block" disabled={busy}>হিসাব মেলান</button>
    </form>
  );
}

const M = [['bkash', 'বিকাশ'], ['nagad', 'নগদ'], ['rocket', 'রকেট']];
export function PaymentSettingsForm({ v, rate }) {
  const [s, act, busy] = useActionState(savePaymentSettings, null);
  return (
    <form action={act}>
      <Msg s={s} />
      {M.map(([k, l]) => (
        <div className="card" key={k}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name={`${k}_enabled`} defaultChecked={v?.[k]?.enabled} style={{ width: 'auto' }} /> {l} চালু</label>
          <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div><label>নম্বর</label><input name={`${k}_number`} defaultValue={v?.[k]?.number || ''} inputMode="tel" /></div>
            <div><label>ধরন</label><select name={`${k}_type`} defaultValue={v?.[k]?.account_type || 'Personal'}><option>Personal</option><option>Agent</option><option>Merchant</option></select></div>
          </div>
          <label>নির্দেশনা (ঐচ্ছিক)</label><input name={`${k}_ins`} defaultValue={v?.[k]?.instructions || ''} />
        </div>
      ))}
      <div className="card">
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="bank_enabled" defaultChecked={v?.bank?.enabled} style={{ width: 'auto' }} /> ব্যাংক চালু</label>
        <label>ব্যাংকের নাম</label><input name="bank_name" defaultValue={v?.bank?.bank_name || ''} />
        <label>অ্যাকাউন্টের নাম</label><input name="bank_acname" defaultValue={v?.bank?.account_name || ''} />
        <label>অ্যাকাউন্ট নম্বর</label><input name="bank_number" defaultValue={v?.bank?.account_number || ''} />
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div><label>শাখা</label><input name="bank_branch" defaultValue={v?.bank?.branch || ''} /></div>
          <div><label>রাউটিং নম্বর</label><input name="bank_routing" defaultValue={v?.bank?.routing_number || ''} /></div>
        </div>
        <label>নির্দেশনা (ঐচ্ছিক)</label><input name="bank_ins" defaultValue={v?.bank?.instructions || ''} />
      </div>
      <div className="card">
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="cash_enabled" defaultChecked={v?.cash_enabled} style={{ width: 'auto' }} /> ক্যাশ পেমেন্ট চালু</label>
        <label>ডলার রেট (রেফারেন্স, ৳)</label><input name="usd_rate" inputMode="decimal" defaultValue={rate ?? ''} />
      </div>
      <button className="btn block" disabled={busy}>সংরক্ষণ করুন</button>
    </form>
  );
}
