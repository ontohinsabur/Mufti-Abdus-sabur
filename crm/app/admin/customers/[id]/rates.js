'use client';
import { useActionState } from 'react';
import { saveRates } from './actions';

export default function Rates({ customerId, services, rates }) {
  const [s, act, busy] = useActionState(saveRates, null);
  const by = Object.fromEntries((rates || []).map((r) => [r.service_id, r]));
  return (
    <form action={act} className="card">
      <h2>এই গ্রাহকের আলাদা রেট</h2>
      <p className="muted">ফাঁকা রাখলে সাধারণ রেট প্রযোজ্য হবে।</p>
      {s?.err && <div className="alert err">{s.err}</div>}{s?.ok && <div className="alert ok">{s.ok}</div>}
      <input type="hidden" name="customer_id" value={customerId} />
      <table className="t"><tbody>
        {services.filter((x) => x.pricing_type !== 'quote').map((x) => (
          <tr key={x.id}>
            <td>{x.name}<div className="muted">সাধারণ: {x.pricing_type === 'per_usd' ? `৳${x.rate_bdt_per_usd ?? '—'}/ডলার` : `৳${x.fixed_price_bdt ?? '—'}`}</div></td>
            <td style={{ width: 130 }}>
              <input type="hidden" name="service_id" value={x.id} />
              {x.pricing_type === 'per_usd'
                ? <input name={`rate_${x.id}`} inputMode="decimal" defaultValue={by[x.id]?.rate_bdt_per_usd ?? ''} placeholder="৳/ডলার" />
                : <input name={`fixed_${x.id}`} inputMode="decimal" defaultValue={by[x.id]?.fixed_price_bdt ?? ''} placeholder="৳" />}
            </td>
          </tr>
        ))}
      </tbody></table>
      <button className="btn block" disabled={busy}>রেট সংরক্ষণ</button>
    </form>
  );
}
