'use client';
import { useActionState, useState } from 'react';
import { changeStatus, setPrice, saveNote, splitOrder } from '../actions';
import { STATUS, usd } from '@/lib/format';
import { SettleForm } from '@/components/AdminMoney';
import Icon from '@/components/Icon';

const Msg = ({ s }) => (s?.err ? <div className="alert err">{s.err}</div> : s?.ok ? <div className="alert ok">{s.ok}</div> : null);
const ORDER = ['pending', 'accepted', 'running', 'off', 'completed', 'cancelled'];

// all six statuses as big buttons, the current one highlighted
export function StatusPanel({ o, children }) {
  const [s, act, busy] = useActionState(changeStatus, null);
  return (
    <section className="od-card">
      <h2>অর্ডারের অবস্থা বদলান</h2><Msg s={s} />
      <div className="od-status">
        {ORDER.map((st) => (
          <form key={st} action={act}>
            <input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value={st} />
            <button className={`${o.status === st ? 'on' : ''} ${st}`} disabled={busy || o.status === st}>{STATUS[st].label}</button>
          </form>
        ))}
      </div>
      <p className="od-help">অবস্থা বদলালে কাস্টমার সাথে সাথে নোটিফিকেশন পাবেন। "এড রানিং" করলে সময় গোনা শুরু হবে, সময়কাল শেষে অর্ডার নিজে থেকে সম্পন্ন হবে। "অফ" করলে সময় গোনা থেমে থাকবে, আবার "এড রানিং" করলে বাকি সময় থেকে চলবে।</p>
      {children}
    </section>
  );
}

// unused budget: settle (bill only what was spent) or split the rest into a new order
export function UnusedPanel({ o }) {
  const [s4, a4, b4] = useActionState(splitOrder, null);
  const [open, setOpen] = useState('');
  const canSettle = o.pricing_type === 'per_usd' && ['running', 'off', 'completed'].includes(o.status) && o.spent_usd == null && !o.split_child;
  const canSplit = o.status === 'off' && o.pricing_type === 'per_usd' && !o.split_child;
  return (
    <section className="od-card">
      <h2>অব্যবহৃত বাজেট / ফেরত</h2>
      <p className="od-help" style={{ marginTop: -6 }}>পুরো বাজেট খরচ না হলে বা অর্ডার বন্ধ হলে এখানে হিসাব মেলান</p>
      {o.spent_usd != null && <div className="alert ok">হিসাব মেলানো হয়েছে: খরচ {usd(o.spent_usd)}।</div>}
      {o.split_child && <div className="alert ok">বাকি বাজেট দিয়ে নতুন অর্ডার তৈরি হয়েছে।</div>}
      {(canSettle || canSplit) && (
        <div className="od-btnrow">
          {canSettle && <button type="button" className={`od-btn ${open === 'settle' ? 'on' : ''}`} onClick={() => setOpen(open === 'settle' ? '' : 'settle')}>খরচ অনুযায়ী বিল / ফেরত</button>}
          {canSplit && <button type="button" className={`od-btn ${open === 'split' ? 'on' : ''}`} onClick={() => setOpen(open === 'split' ? '' : 'split')}>বাকি অংশ দিয়ে নতুন অর্ডার</button>}
        </div>
      )}
      {open === 'settle' && <div style={{ marginTop: 12 }}><SettleForm o={o} bare /></div>}
      {open === 'split' && (
        <form action={a4} style={{ marginTop: 12 }}>
          <Msg s={s4} />
          <p className="muted">যতটুকু খরচ হয়েছে সেটুকু এই অর্ডারে বিল হবে, বাকি বাজেট দিয়ে নতুন অর্ডার তৈরি হবে। দুইটা মিলিয়ে গ্রাহকের মোট টাকা আগের মতোই থাকবে।</p>
          <input type="hidden" name="id" value={o.id} />
          <label>কত ডলার খরচ হয়েছে? (মোট বাজেট {usd(o.budget_usd)})</label>
          <input name="spent" inputMode="decimal" placeholder="যেমন 4.50" />
          <button className="btn block" disabled={b4}>নতুন অর্ডার তৈরি করুন</button>
        </form>
      )}
    </section>
  );
}

// "অর্ডারের পূর্ণ এডিট": price + note
export function FullEdit({ o, children }) {
  const [s2, a2, b2] = useActionState(setPrice, null);
  const [s3, a3, b3] = useActionState(saveNote, null);
  const [open, setOpen] = useState(o.quote_status === 'pending');
  return (
    <>
      <button type="button" className="od-edit" onClick={() => setOpen(!open)}><Icon name="gear" size={18} />অর্ডারের পূর্ণ এডিট</button>
      {open && (
        <div className="od-grid1">
          <form action={a2} className="od-card">
            <h2>{o.quote_status === 'pending' ? 'দাম (কোটেশন) ঠিক করুন' : 'মোট দাম বদলান'}</h2><Msg s={s2} />
            <input type="hidden" name="id" value={o.id} />
            <label>মোট টাকা (৳)</label><input name="total" inputMode="decimal" defaultValue={o.total_bdt ?? ''} />
            <button className="btn block" disabled={b2}>সংরক্ষণ</button>
          </form>
          <form action={a3} className="od-card">
            <h2>অ্যাডমিন নোট</h2><Msg s={s3} />
            <input type="hidden" name="id" value={o.id} />
            <textarea name="admin_note" rows={3} defaultValue={o.admin_note || ''} placeholder="গ্রাহকও এই নোট দেখতে পাবেন" />
            <button className="btn block" disabled={b3}>নোট সংরক্ষণ</button>
          </form>
          {children}
        </div>
      )}
    </>
  );
}
