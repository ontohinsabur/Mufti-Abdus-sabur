'use client';
import { useActionState } from 'react';
import { saveService, saveAccess } from './actions';

const Msg = ({ s }) => (s?.err ? <div className="alert err">{s.err}</div> : s?.ok ? <div className="alert ok">{s.ok}</div> : null);
const TYPE = { per_usd: 'ডলার প্রতি রেট', fixed_bdt: 'নির্দিষ্ট দাম', quote: 'আলোচনা সাপেক্ষে' };

export function ServiceForm({ s }) {
  const [st, act, busy] = useActionState(saveService, null);
  return (
    <form action={act} className="card">
      <Msg s={st} />
      <input type="hidden" name="id" value={s.id} />
      <div className="row" style={{ border: 0, padding: 0 }}><b>{s.name}</b><span className="badge off">{TYPE[s.pricing_type]}</span></div>
      <label>নাম</label><input name="name" defaultValue={s.name} />
      <label>বিবরণ</label><input name="description" defaultValue={s.description || ''} />
      {s.pricing_type === 'per_usd' && <><label>রেট (প্রতি ডলারে কত টাকা)</label><input name="rate_bdt_per_usd" inputMode="decimal" defaultValue={s.rate_bdt_per_usd ?? ''} /></>}
      {s.pricing_type === 'fixed_bdt' && <><label>দাম (৳) <span className="muted">— ০ রাখলে কোটেশন দিতে হবে</span></label><input name="fixed_price_bdt" inputMode="decimal" defaultValue={s.fixed_price_bdt ?? ''} /></>}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="active" defaultChecked={s.active} style={{ width: 'auto' }} /> গ্রাহকদের জন্য চালু</label>
      <button className="btn block" disabled={busy}>সংরক্ষণ</button>
    </form>
  );
}

export function AccessForm({ v }) {
  const [st, act, busy] = useActionState(saveAccess, null);
  return (
    <form action={act} className="card">
      <h2>এক্সেস আইডি</h2>
      <p className="muted">অর্ডারের আগে গ্রাহক "না" বললে এই লিংক আর আইডি দেখানো হবে।</p>
      <Msg s={st} />
      <label>এক্সেস লিংক</label><input name="link" defaultValue={v?.link || ''} placeholder="https://business.facebook.com/..." />
      <label>Business Portfolio ID</label><input name="bpid" defaultValue={v?.business_portfolio_id || ''} />
      <button className="btn block" disabled={busy}>সংরক্ষণ</button>
    </form>
  );
}
