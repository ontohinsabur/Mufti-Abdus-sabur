import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import PrintButton from '@/components/PrintButton';
import { METHOD } from '@/components/PayMethod';
import { bnNum, usd, PAY } from '@/lib/format';
import VerifiedBadge from '@/components/VerifiedBadge';

export const metadata = { title: 'ইনভয়েস | Mufti Abdus Sabur' };
const d = (x) => (x ? new Date(x).toLocaleDateString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', year: 'numeric' }) : '');

export default async function Invoice({ params }) {
  const { supabase, user } = await getSession();
  if (!user) redirect('/login');
  const { id } = await params;
  const { data: o } = await supabase.from('orders').select('*, profiles!orders_customer_id_fkey(full_name, email, phone, status, role)').eq('id', id).maybeSingle();
  if (!o) notFound();
  const [{ data: biz }, { data: allocs }] = await Promise.all([
    supabase.from('settings').select('value').eq('key', 'business').maybeSingle(),
    supabase.from('payment_allocations').select('amount, payments!inner(payment_no, method, trx_id, status, verified_at, created_at)').eq('order_id', id).eq('payments.status', 'verified'),
  ]);
  const b = biz?.value || {};
  const due = Math.max(0, Number(o.total_bdt || 0) - Number(o.paid_amount || 0));
  return (
    <main className="invoice">
      <style>{`
        .invoice{max-width:800px;margin:0 auto;padding:28px 20px;background:#fff;color:#0b1220;min-height:100vh}
        .inv-head{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #1877f2;padding-bottom:14px}
        .inv-head h1{font-size:1.6rem;margin:0}.inv-meta{text-align:right}
        .inv table{width:100%;border-collapse:collapse;margin-top:18px}.inv th,.inv td{border-bottom:1px solid #e3e8f0;padding:9px;text-align:left}
        .inv th{background:#f4f6fb}.inv .tot td{font-weight:700}.stamp{display:inline-block;padding:4px 14px;border:2px solid;border-radius:8px;font-weight:800}
        .paid{color:#15803d}.unpaid{color:#b91c1c}.partial{color:#b45309}
        @media print{.noprint{display:none!important}.invoice{padding:0}body{background:#fff}}
      `}</style>
      <div className="noprint" style={{ marginBottom: 14, display: 'flex', gap: 8 }}><PrintButton /><a className="btn ghost" href={`/orders/${o.id}`}>অর্ডারে ফিরে যান</a></div>
      <div className="inv">
        <div className="inv-head">
          <div><h1>{b.name || 'Mufti Abdus Sabur'}</h1><div>ফেসবুক বুস্টিং, অ্যাড ও ব্যবসায়িক প্রমোশন</div><div style={{ fontSize: '.9rem' }}>{b.phone} · {b.email}</div></div>
          <div className="inv-meta"><h1>ইনভয়েস</h1><div><b>{o.invoice_no}</b></div><div>তারিখ: {d(o.created_at)}</div>
            <div style={{ marginTop: 6 }}><span className={`stamp ${o.payment_status}`}>{PAY[o.payment_status]}</span></div></div>
        </div>
        <div style={{ marginTop: 14 }}><b>গ্রাহক:</b> {o.profiles?.full_name}<VerifiedBadge profile={o.profiles} /><br />{o.profiles?.phone} {o.profiles?.email && `· ${o.profiles.email}`}</div>
        <table>
          <thead><tr><th>বিবরণ</th><th>পরিমাণ</th><th>রেট</th><th>মোট</th></tr></thead>
          <tbody>
            <tr>
              <td><b>{o.service_name}</b> (অর্ডার #{o.order_no}){o.page_name && <><br />পেজ: {o.page_name}</>}{o.duration_days && <><br />মেয়াদ: {bnNum(o.duration_days)} দিন</>}{o.spent_usd != null && <><br />খরচ অনুযায়ী বিল</>}</td>
              <td>{o.budget_usd ? usd(o.spent_usd ?? o.budget_usd) : '১'}</td>
              <td>{o.rate_bdt_per_usd ? `৳${bnNum(o.rate_bdt_per_usd)}` : '—'}</td>
              <td>৳{bnNum(o.total_bdt)}</td>
            </tr>
            <tr className="tot"><td colSpan={3} style={{ textAlign: 'right' }}>সর্বমোট</td><td>৳{bnNum(o.total_bdt)}</td></tr>
            <tr><td colSpan={3} style={{ textAlign: 'right' }}>পরিশোধ</td><td>৳{bnNum(o.paid_amount)}</td></tr>
            <tr className="tot"><td colSpan={3} style={{ textAlign: 'right' }}>বাকি</td><td>৳{bnNum(due)}</td></tr>
          </tbody>
        </table>
        {allocs?.length > 0 && (
          <table><thead><tr><th>পেমেন্ট</th><th>পদ্ধতি</th><th>তারিখ</th><th>পরিমাণ</th></tr></thead><tbody>
            {allocs.map((a, i) => <tr key={i}><td>#{a.payments.payment_no}{a.payments.trx_id ? ` · ${a.payments.trx_id}` : ''}</td><td>{METHOD[a.payments.method]}</td><td>{d(a.payments.verified_at || a.payments.created_at)}</td><td>৳{bnNum(a.amount)}</td></tr>)}
          </tbody></table>
        )}
        <p style={{ marginTop: 24, fontSize: '.85rem', color: '#5b6678' }}>সেবার চার্জ ও বিজ্ঞাপনের বাজেট লিখিত কোটেশনে ভিন্ন না বলা থাকলে আলাদা। এটি কম্পিউটারে তৈরি ইনভয়েস, স্বাক্ষরের প্রয়োজন নেই।</p>
      </div>
    </main>
  );
}
