import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import OrderList from '@/components/OrderList';
import Rates from './rates';
import LedgerView from '@/components/LedgerView';
import WalletView from '@/components/WalletView';
import { PayLaterForm, AdjustForm } from '@/components/AdminMoney';
import { buildLedger } from '@/lib/money';
import { bnNum } from '@/lib/format';

export default async function Customer({ params }) {
  const { supabase, profile } = await requireAdmin();
  const { id } = await params;
  const { data: c } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  const [{ data: services }, { data: rates }, { data: pages }, { data: orders }] = await Promise.all([
    supabase.from('services').select('*').order('sort'),
    supabase.from('customer_rates').select('*').eq('customer_id', id),
    supabase.from('facebook_pages').select('*').eq('customer_id', id).eq('archived', false).order('name'),
    supabase.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(50),
  ]);
  const [{ data: sum }, ledger, { data: tx }, { data: wreq }] = await Promise.all([
    supabase.rpc('customer_summary', { p_customer: id }).single(),
    buildLedger(supabase, id),
    supabase.from('wallet_tx').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('wallet_requests').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(20),
  ]);
  return (
    <>
      <TopBar profile={profile} active="/admin/customers" />
      <main className="wrap narrow">
        <div className="card">
          <h1>{c.full_name || '(নাম নেই)'} <StatusBadge status={c.status} /></h1>
          <p className="muted">{c.email}{c.phone ? ` · ${c.phone}` : ''}{c.whatsapp ? ` · WhatsApp ${c.whatsapp}` : ''}</p>
          <p className="muted">পেজ: {(pages || []).map((p) => p.name).join(', ') || 'নেই'}</p>
          <Link className="btn sm" href={`/admin/orders/new?customer=${c.id}`}>+ এই গ্রাহকের জন্য অর্ডার</Link>
        </div>
        <div className="grid">
          <div className="stat"><span className="muted">বকেয়া</span><b>৳{bnNum(sum?.due)}</b></div>
          <div className="stat"><span className="muted">ওয়ালেট</span><b>৳{bnNum(sum?.wallet)}</b></div>
          <div className="stat"><span className="muted">যাচাই বাকি</span><b>৳{bnNum(sum?.pending_payments)}</b></div>
        </div>
        <p style={{ marginTop: 12 }}><Link className="btn sm" href={`/admin/payments?tab=record&customer=${c.id}`}>+ পেমেন্ট রেকর্ড</Link></p>
        <div className="card"><h2>Pay Later (বাকি)</h2><PayLaterForm c={c} /></div>
        <Rates customerId={c.id} services={services || []} rates={rates} />
        <h2>লেজার</h2>
        <LedgerView ledger={ledger} orderBase="/admin/orders" />
        <h2>ওয়ালেট</h2>
        <div className="card"><h2>ওয়ালেট সমন্বয়</h2><AdjustForm customerId={c.id} /></div>
        <WalletView tx={tx} requests={wreq} />
        <h2>অর্ডার</h2>
        <OrderList orders={orders} base="/admin/orders" reorderBase="/admin/orders/new" />
      </main>
    </>
  );
}
