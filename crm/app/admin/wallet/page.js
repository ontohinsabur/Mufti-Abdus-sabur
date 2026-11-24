import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import { WithdrawButtons, AdjustForm } from '@/components/AdminMoney';
import { bnNum, bnDate } from '@/lib/format';

export default async function AdminWallet() {
  const { supabase, profile } = await requireAdmin();
  const [{ data: reqs }, { data: customers }, { data: tx }] = await Promise.all([
    supabase.from('wallet_requests').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'customer').order('full_name'),
    supabase.from('wallet_tx').select('customer_id, amount'),
  ]);
  const cname = Object.fromEntries((customers || []).map((c) => [c.id, c.full_name || c.email]));
  const bal = {}; (tx || []).forEach((t) => { bal[t.customer_id] = (bal[t.customer_id] || 0) + Number(t.amount); });
  const pending = (reqs || []).filter((r) => r.status === 'pending');
  return (
    <>
      <TopBar profile={profile} active="/admin/wallet" />
      <main className="wrap narrow">
        <h1>ওয়ালেট</h1>
        <div className="card"><h2>টাকা তোলার অনুরোধ ({bnNum(pending.length)})</h2>
          {!pending.length ? <p className="muted">নতুন কোনো অনুরোধ নেই।</p> : <div className="list">{pending.map((r) => (
            <div className="row" key={r.id}><div><b>৳{bnNum(r.amount)}</b> · {cname[r.customer_id]} · {r.method} <b>{r.account}</b><div className="muted">{bnDate(r.created_at)}{r.note ? ` · ${r.note}` : ''} · ওয়ালেটে আছে ৳{bnNum(bal[r.customer_id] || 0)}</div></div>
              <WithdrawButtons id={r.id} /></div>
          ))}</div>}
        </div>
        <div className="card"><h2>যাদের ওয়ালেটে টাকা আছে</h2>
          {Object.entries(bal).filter(([, v]) => Math.abs(v) > 0.009).length === 0 ? <p className="muted">কারো ওয়ালেটে টাকা নেই।</p> :
            <table className="t"><tbody>{Object.entries(bal).filter(([, v]) => Math.abs(v) > 0.009).map(([id, v]) => <tr key={id}><td><Link href={`/admin/customers/${id}`}>{cname[id]}</Link></td><td>৳{bnNum(v)}</td></tr>)}</tbody></table>}
        </div>
        <div className="card"><h2>ওয়ালেট সমন্বয়</h2><AdjustForm customers={customers || []} /></div>
      </main>
    </>
  );
}
