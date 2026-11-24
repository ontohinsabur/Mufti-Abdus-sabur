'use client';
import { useActionState } from 'react';
import { changeStatus, setPrice, saveNote, splitOrder } from '../actions';
import { STATUS, usd } from '@/lib/format';
import { SettleForm } from '@/components/AdminMoney';

const Msg = ({ s }) => (s?.err ? <div className="alert err">{s.err}</div> : s?.ok ? <div className="alert ok">{s.ok}</div> : null);
const NEXT = {
  pending: ['accepted', 'running', 'cancelled'], accepted: ['running', 'cancelled', 'pending'],
  running: ['off', 'completed', 'cancelled'], off: ['running', 'completed', 'cancelled'],
  completed: ['accepted'], cancelled: ['pending', 'accepted'],
};
const CLS = { running: 'ok', cancelled: 'bad', off: 'ghost', completed: 'ok' };

export default function Controls({ o }) {
  const [s1, a1, b1] = useActionState(changeStatus, null);
  const [s2, a2, b2] = useActionState(setPrice, null);
  const [s3, a3, b3] = useActionState(saveNote, null);
  const [s4, a4, b4] = useActionState(splitOrder, null);
  return (
    <>
      <div className="card">
        <h2>স্ট্যাটাস বদলান</h2><Msg s={s1} />
        <div className="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(NEXT[o.status] || []).map((st) => (
            <form key={st} action={a1}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value={st} />
              <button className={`btn sm ${CLS[st] || ''}`} disabled={b1}>{STATUS[st].label}</button></form>
          ))}
        </div>
        {o.status === 'off' && <p className="muted">অফ থাকা অবস্থায় এডের সময় গোনা বন্ধ থাকে। আবার "এড রানিং" করলে বাকি সময় থেকে চলবে।</p>}
      </div>

      {o.status === 'off' && o.pricing_type === 'per_usd' && !o.split_child && (
        <form action={a4} className="card">
          <h2>বাকি অংশ দিয়ে নতুন অর্ডার</h2><Msg s={s4} />
          <p className="muted">যতটুকু খরচ হয়েছে সেটুকু এই অর্ডারে বিল হবে, বাকি বাজেট দিয়ে নতুন অর্ডার তৈরি হবে। দুইটা মিলিয়ে গ্রাহকের মোট টাকা আগের মতোই থাকবে।</p>
          <input type="hidden" name="id" value={o.id} />
          <label>কত ডলার খরচ হয়েছে? (মোট বাজেট {usd(o.budget_usd)})</label>
          <input name="spent" inputMode="decimal" placeholder="যেমন 4.50" />
          <button className="btn block" disabled={b4}>নতুন অর্ডার তৈরি করুন</button>
        </form>
      )}

      {o.pricing_type === 'per_usd' && ['running', 'off', 'completed'].includes(o.status) && o.spent_usd == null && !o.split_child && <SettleForm o={o} />}

      <form action={a2} className="card">
        <h2>{o.quote_status === 'pending' ? 'দাম (কোটেশন) ঠিক করুন' : 'মোট দাম বদলান'}</h2><Msg s={s2} />
        <input type="hidden" name="id" value={o.id} />
        <label>মোট টাকা (৳)</label><input name="total" inputMode="decimal" defaultValue={o.total_bdt ?? ''} />
        <button className="btn block" disabled={b2}>সংরক্ষণ</button>
      </form>

      <form action={a3} className="card">
        <h2>নোট</h2><Msg s={s3} />
        <input type="hidden" name="id" value={o.id} />
        <textarea name="admin_note" rows={3} defaultValue={o.admin_note || ''} placeholder="গ্রাহকও এই নোট দেখতে পাবেন" />
        <button className="btn block" disabled={b3}>নোট সংরক্ষণ</button>
      </form>
    </>
  );
}
