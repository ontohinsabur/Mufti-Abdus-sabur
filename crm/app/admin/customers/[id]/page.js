import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import TopBar from '@/components/TopBar';
import StatusBadge from '@/components/StatusBadge';
import OrderList from '@/components/OrderList';
import Rates from './rates';

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
        <Rates customerId={c.id} services={services || []} rates={rates} />
        <h2>অর্ডার</h2>
        <OrderList orders={orders} base="/admin/orders" reorderBase="/admin/orders/new" />
      </main>
    </>
  );
}
