import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import PrintButton from '@/components/PrintButton';
import { METHOD } from '@/components/PayMethod';
import { dueOrders } from '@/lib/money';
import { bnNum, STATUS } from '@/lib/format';

const day = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

export default async function Reports({ searchParams }) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  const now = new Date();
  const from = sp?.from || day(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = sp?.to || day(now);
  const start = `${from}T00:00:00+06:00`, end = `${to}T23:59:59+06:00`;
  const [{ data: orders }, { data: pays }, { data: customers }, due] = await Promise.all([
    supabase.from('orders').select('service_name, status, total_bdt, budget_usd, spent_usd, customer_id').gte('created_at', start).lte('created_at', end),
    supabase.from('payments').select('amount, method, status, customer_id').eq('status', 'verified').gte('created_at', start).lte('created_at', end),
    supabase.from('profiles').select('id, full_name, email, created_at').eq('role', 'customer'),
    dueOrders(supabase, null),
  ]);
  const live = (orders || []).filter((o) => o.status !== 'cancelled');
  const billed = live.reduce((a, o) => a + Number(o.total_bdt || 0), 0);
  const usdSum = live.reduce((a, o) => a + Number(o.spent_usd ?? o.budget_usd ?? 0), 0);
  const collected = (pays || []).filter((p) => p.method !== 'wallet').reduce((a, p) => a + Number(p.amount), 0);
  const byStatus = {}; (orders || []).forEach((o) => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  const bySvc = {}; live.forEach((o) => { const s = (bySvc[o.service_name] ||= { n: 0, usd: 0, bdt: 0 }); s.n++; s.usd += Number(o.spent_usd ?? o.budget_usd ?? 0); s.bdt += Number(o.total_bdt || 0); });
  const byMethod = {}; (pays || []).forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount); });
  const byCust = {}; live.forEach((o) => { byCust[o.customer_id] = (byCust[o.customer_id] || 0) + Number(o.total_bdt || 0); });
  const cname = Object.fromEntries((customers || []).map((c) => [c.id, c.full_name || c.email]));
  const newCust = (customers || []).filter((c) => c.created_at >= start && c.created_at <= end).length;
  const totalDue = due.reduce((a, o) => a + o.remaining, 0);
  return (
    <>
      <TopBar profile={profile} active="/admin/reports" />
      <main className="wrap">
        <h1>রিপোর্ট</h1>
        <form className="card noprint" style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
          <div><label>শুরু</label><input type="date" name="from" defaultValue={from} /></div>
          <div><label>শেষ</label><input type="date" name="to" defaultValue={to} /></div>
          <button className="btn">দেখুন</button><PrintButton />
        </form>
        <p className="muted">সময়: {new Date(start).toLocaleDateString('bn-BD')} — {new Date(end).toLocaleDateString('bn-BD')}</p>
        <div className="grid">
          <div className="stat"><span className="muted">অর্ডার</span><b>{bnNum(live.length)}</b></div>
          <div className="stat"><span className="muted">মোট বিল</span><b>৳{bnNum(billed)}</b></div>
          <div className="stat"><span className="muted">বুস্ট (ডলার)</span><b>${usdSum.toFixed(2)}</b></div>
          <div className="stat"><span className="muted">টাকা পাওয়া গেছে</span><b>৳{bnNum(collected)}</b></div>
          <div className="stat"><span className="muted">এখন মোট বকেয়া</span><b>৳{bnNum(totalDue)}</b></div>
          <div className="stat"><span className="muted">নতুন গ্রাহক</span><b>{bnNum(newCust)}</b></div>
        </div>
        <div className="card" style={{ marginTop: 16 }}><h2>সেবা অনুযায়ী</h2>
          <table className="t"><thead><tr><th>সেবা</th><th>অর্ডার</th><th>ডলার</th><th>বিল</th></tr></thead><tbody>
            {Object.entries(bySvc).sort((a, b) => b[1].bdt - a[1].bdt).map(([k, v]) => <tr key={k}><td>{k}</td><td>{bnNum(v.n)}</td><td>${v.usd.toFixed(2)}</td><td>৳{bnNum(v.bdt)}</td></tr>)}
          </tbody></table></div>
        <div className="grid">
          <div className="card"><h2>পেমেন্ট পদ্ধতি</h2><table className="t"><tbody>{Object.entries(byMethod).map(([k, v]) => <tr key={k}><td>{METHOD[k]}</td><td>৳{bnNum(v)}</td></tr>)}</tbody></table></div>
          <div className="card"><h2>অর্ডারের অবস্থা</h2><table className="t"><tbody>{Object.entries(byStatus).map(([k, v]) => <tr key={k}><td>{STATUS[k]?.label}</td><td>{bnNum(v)}</td></tr>)}</tbody></table></div>
        </div>
        <div className="card"><h2>শীর্ষ গ্রাহক</h2><table className="t"><tbody>
          {Object.entries(byCust).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => <tr key={k}><td>{cname[k]}</td><td>৳{bnNum(v)}</td></tr>)}
        </tbody></table></div>
      </main>
    </>
  );
}
